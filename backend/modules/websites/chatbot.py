"""
Customer-facing AI Chat Bot
───────────────────────────
A smart, multi-turn AI assistant embedded in each generated storefront.
Knows the store's products/menu/hours/services and answers in Arabic.

Endpoints:
  POST /api/websites/public/{slug}/chatbot           — send a message
  GET  /api/websites/public/{slug}/chatbot/config    — public config (welcome, enabled)
  PUT  /api/websites/projects/{pid}/chatbot/config   — owner updates config

Features:
  • Uses Claude Sonnet via Emergent Universal Key
  • Per-session memory (kept in-process by emergentintegrations)
  • Owner can: toggle on/off, set welcome message, set business hours, set fallback message
  • Rate-limited per session-id (basic — 60 turns/hour)
"""
import os
import json
import time
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from emergentintegrations.llm.chat import LlmChat, UserMessage


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


_RATE: Dict[str, list] = {}  # session_id → [timestamps]


def _check_rate(session_id: str, limit: int = 60, window: int = 3600) -> bool:
    now = time.time()
    arr = _RATE.setdefault(session_id, [])
    arr[:] = [t for t in arr if now - t < window]
    if len(arr) >= limit:
        return False
    arr.append(now)
    return True


def _extract_contact_info(project: Dict[str, Any]) -> Dict[str, str]:
    """Pull phone/whatsapp/address/email/socials from sections (contact, footer, hero)."""
    info: Dict[str, str] = {}
    for s in (project.get("sections") or []):
        d = s.get("data") or {}
        for k_src, k_dst in (("phone", "phone"), ("whatsapp", "whatsapp"),
                              ("email", "email"), ("address", "address"),
                              ("map_url", "map_url"), ("instagram", "instagram"),
                              ("twitter", "twitter"), ("facebook", "facebook"),
                              ("tiktok", "tiktok"), ("city", "city")):
            if d.get(k_src) and not info.get(k_dst):
                info[k_dst] = str(d[k_src])[:200]
    return info


def _extract_faq(project: Dict[str, Any]) -> list:
    out = []
    for s in (project.get("sections") or []):
        if s.get("type") == "faq":
            for q in (s.get("data") or {}).get("items") or []:
                out.append({"q": str(q.get("q", ""))[:200], "a": str(q.get("a", ""))[:400]})
    return out


def _extract_about(project: Dict[str, Any]) -> str:
    for s in (project.get("sections") or []):
        if s.get("type") == "about":
            d = s.get("data") or {}
            txt = (d.get("text") or "") + " " + (d.get("subtitle") or "")
            return txt.strip()[:600]
    return ""


def _build_system_prompt(project: Dict[str, Any], customer: Optional[Dict[str, Any]] = None) -> str:
    """Build a comprehensive knowledge-base prompt for the storefront AI."""
    name = project.get("name") or "المتجر"
    vertical = project.get("vertical") or "store"
    cfg = project.get("chatbot_config") or {}
    welcome = cfg.get("welcome_message") or ""
    hours = cfg.get("business_hours") or ""
    extra = cfg.get("extra_context") or ""

    # ───────── PRODUCTS (full list, no truncation in count) ─────────
    products = []
    for p in (project.get("products") or []):
        line = f"• {p.get('name','')}"
        if p.get("price") is not None:
            line += f" — {p['price']} ر.س"
        if p.get("category"):
            line += f" [{p['category']}]"
        if p.get("stock") is not None:
            line += f" (المخزون: {p['stock']})"
        if p.get("description"):
            line += f" — {str(p['description'])[:140]}"
        products.append(line)
    product_block = "\n".join(products) if products else "(لا توجد منتجات بعد)"

    # ───────── SERVICES ─────────
    services = []
    for s in (project.get("services") or []):
        sline = f"• {s.get('name','')}"
        if s.get("price") is not None:
            sline += f" — {s['price']} ر.س"
        if s.get("duration_min"):
            sline += f" — {s['duration_min']} دقيقة"
        if s.get("description"):
            sline += f" — {str(s['description'])[:140]}"
        services.append(sline)
    services_block = "\n".join(services) if services else ""

    # ───────── LISTINGS (real estate) ─────────
    listings = []
    for ll in (project.get("listings") or [])[:60]:
        ln = f"• {ll.get('title','')}"
        if ll.get("price") is not None:
            ln += f" — {ll['price']} ر.س"
        if ll.get("city"):
            ln += f" — {ll['city']}"
        if ll.get("rooms"):
            ln += f" — {ll['rooms']} غرف"
        if ll.get("area_m2"):
            ln += f" — {ll['area_m2']} م²"
        listings.append(ln)
    listings_block = "\n".join(listings) if listings else ""

    # ───────── SHIPPING ─────────
    shipping = project.get("shipping_settings") or {}
    ship_lines = []
    if shipping.get("local_delivery_enabled"):
        fee = shipping.get("local_delivery_fee", 0)
        eta = shipping.get("local_delivery_eta_hours", "")
        city = shipping.get("store_city", "")
        ship_lines.append(f"• توصيل داخلي{f' (مدينة {city})' if city else ''}: {fee} ر.س{f' — التوصيل خلال {eta} ساعة' if eta else ''}")
    if shipping.get("free_shipping_above_sar"):
        ship_lines.append(f"• شحن مجاني للطلبات فوق {shipping['free_shipping_above_sar']} ر.س")
    enabled_providers = shipping.get("enabled_providers") or []
    if enabled_providers:
        prov_names = {"smsa": "SMSA", "aramex": "Aramex", "saudi_post": "البريد السعودي (SPL)",
                      "naqel": "ناقل", "dhl": "DHL", "fedex": "FedEx"}
        pretty = " · ".join(prov_names.get(p, p) for p in enabled_providers)
        ship_lines.append(f"• شركات الشحن المتاحة: {pretty}")
    if shipping.get("cod_markup_enabled"):
        ship_lines.append(f"• الدفع عند الاستلام متاح (+{shipping.get('cod_markup_sar', 0)} ر.س رسوم)")
    if shipping.get("insurance_enabled"):
        ship_lines.append(f"• تأمين الشحن متاح ({shipping.get('insurance_percent', 0)}% — حد أدنى {shipping.get('insurance_min_sar', 0)} ر.س)")
    if shipping.get("pickup_enabled"):
        addr = shipping.get("pickup_address", "")
        ship_lines.append(f"• استلام من المتجر متاح (مجاناً){f' — العنوان: {addr}' if addr else ''}")
    shipping_block = "\n".join(ship_lines) if ship_lines else ""

    # ───────── COUPONS ─────────
    coupons = []
    for c in (project.get("coupons") or []):
        if not c.get("active", True):
            continue
        code = c.get("code", "")
        kind = c.get("type", "percent")
        val = c.get("value", 0)
        if kind == "percent":
            coupons.append(f"• {code}: خصم {val}%")
        else:
            coupons.append(f"• {code}: خصم {val} ر.س")
    coupons_block = "\n".join(coupons) if coupons else ""

    # ───────── LOYALTY ─────────
    loyalty = project.get("loyalty_settings") or {}
    loyalty_block = ""
    if loyalty.get("enabled"):
        lines = []
        if loyalty.get("welcome_bonus"):
            lines.append(f"• {loyalty['welcome_bonus']} نقطة ترحيبية للأعضاء الجدد")
        if loyalty.get("points_per_sar"):
            lines.append(f"• {loyalty['points_per_sar']} نقطة لكل 1 ر.س مشتريات")
        if loyalty.get("redeem_rate"):
            lines.append(f"• قيمة النقطة: {loyalty['redeem_rate']} ر.س عند الاستبدال")
        if loyalty.get("referral_bonus"):
            lines.append(f"• {loyalty['referral_bonus']} نقطة عند دعوة صديق")
        loyalty_block = "\n".join(lines)

    # ───────── PAYMENT GATEWAYS ─────────
    pgs = project.get("payment_gateways") or {}
    enabled_pgs = [k for k, v in pgs.items() if isinstance(v, dict) and v.get("enabled")]
    pretty_pg = {"stripe": "بطاقات Visa/Master/مدى (Stripe)", "tap": "Tap (مدى/STC Pay)",
                 "moyasar": "Moyasar", "paypal": "PayPal", "tabby": "تابي (تقسيط)",
                 "tamara": "تمارا (تقسيط)", "cod": "الدفع عند الاستلام"}
    payments_block = "\n".join(f"• {pretty_pg.get(k, k)}" for k in enabled_pgs) if enabled_pgs else ""

    # ───────── SECTIONS / CONTACT / ABOUT / FAQ ─────────
    contact = _extract_contact_info(project)
    contact_lines = []
    for label, key in (("📞 الهاتف", "phone"), ("💬 واتساب", "whatsapp"),
                        ("📧 البريد", "email"), ("📍 العنوان", "address"),
                        ("🗺️ الموقع على الخريطة", "map_url"),
                        ("📷 إنستغرام", "instagram"), ("🐦 تويتر", "twitter"),
                        ("📘 فيسبوك", "facebook"), ("🎵 تيك توك", "tiktok")):
        if contact.get(key):
            contact_lines.append(f"{label}: {contact[key]}")
    contact_block = "\n".join(contact_lines)

    about = _extract_about(project)
    faq = _extract_faq(project)
    faq_block = "\n".join(f"س: {f['q']}\nج: {f['a']}" for f in faq) if faq else ""

    # ───────── CUSTOMER CONTEXT (if logged in) ─────────
    customer_block = ""
    if customer:
        cust_lines = [f"اسم الزبون: {customer.get('name', '')}".strip()]
        recent_orders = customer.get("recent_orders") or []
        if recent_orders:
            cust_lines.append("طلبات الزبون الأخيرة:")
            for o in recent_orders[:5]:
                cust_lines.append(
                    f"• #{o.get('id','')[:8]} — {o.get('status','')} — {o.get('total',0)} ر.س"
                    + (f" — تتبع: {o.get('tracking_url','')}" if o.get('tracking_url') else "")
                )
        customer_block = "\n".join(cust_lines)

    return f"""أنت "مساعد {name}" — مساعد ذكي خبير لمتجر/مكان أعمال {name} (نوع: {vertical}). تتحدث العربية الفصحى المبسطة بأسلوب ودود، دقيق، ومحترف.

🎯 مهمتك:
- جاوب الزبون بدقة باستخدام المعلومات أدناه فقط
- اقترح منتجات/خدمات ذات صلة بناءً على احتياج الزبون
- ساعد في تتبع الطلبات إذا كانت بيانات الزبون متاحة
- اشرح طرق الدفع/الشحن/الاسترجاع/الكوبونات بوضوح
- إذا كان السؤال خارج معلوماتك أو يحتاج موظف بشري (شكوى، طلب خاص، تخصيص، استرجاع، مشكلة في الفاتورة، طلب تواصل مباشر) → ابدأ ردك بالكلمة السرية الخاصة [HANDOFF] ثم اشرح للزبون أنك ستحول طلبه لموظف.
- لا تختلق أسعاراً أو منتجات أو خصومات غير موجودة هنا
- لا تطلب معلومات حساسة (بطاقات بنكية، كلمات سر، رموز OTP)
- اجعل الردود قصيرة (٢-٤ أسطر عادةً) لكن مفيدة

═════════ معلومات المتجر ═════════
🏪 الاسم: {name}
🏷️ النوع: {vertical}
{f"⏰ ساعات العمل: {hours}" if hours else ""}
{f"💡 رسالة الترحيب: {welcome}" if welcome else ""}

{f"═════════ عن المتجر ═════════{chr(10)}{about}" if about else ""}

{f"═════════ التواصل ═════════{chr(10)}{contact_block}" if contact_block else ""}

═════════ المنتجات ({len(project.get('products') or [])}) ═════════
{product_block}

{f"═════════ الخدمات ═════════{chr(10)}{services_block}" if services_block else ""}

{f"═════════ العقارات/القوائم ═════════{chr(10)}{listings_block}" if listings_block else ""}

{f"═════════ 🚚 الشحن والتوصيل ═════════{chr(10)}{shipping_block}" if shipping_block else ""}

{f"═════════ 💳 طرق الدفع ═════════{chr(10)}{payments_block}" if payments_block else ""}

{f"═════════ 🎟️ كوبونات الخصم ═════════{chr(10)}{coupons_block}" if coupons_block else ""}

{f"═════════ 🎁 برنامج الولاء ═════════{chr(10)}{loyalty_block}" if loyalty_block else ""}

{f"═════════ ❓ أسئلة شائعة ═════════{chr(10)}{faq_block}" if faq_block else ""}

{f"═════════ معلومات إضافية من المالك ═════════{chr(10)}{extra}" if extra else ""}

{f"═════════ 👤 الزبون الحالي ═════════{chr(10)}{customer_block}" if customer_block else ""}

⚠️ تذكير أخير:
- إذا الزبون احتاج لمحادثة موظف بشري، أو سأل سؤالاً ما تقدر تجاوب عليه بثقة عالية → ابدأ الرد بـ [HANDOFF] ثم اعتذر بلطف.
- لا تكتب [HANDOFF] إلا إذا فعلاً تحتاج تحويل للموظف."""


def init_routes(database) -> APIRouter:
    r = APIRouter(prefix="/websites", tags=["chatbot"])

    # ── Public: get chatbot config (welcome message, enabled flag) ──
    @r.get("/public/{slug}/chatbot/config")
    async def _public_config(slug: str):
        p = await database.website_projects.find_one(
            {"slug": slug, "status": "approved"},
            {"_id": 0, "name": 1, "chatbot_config": 1},
        )
        if not p:
            raise HTTPException(404, "غير موجود")
        cfg = p.get("chatbot_config") or {}
        return {
            "enabled": bool(cfg.get("enabled")),
            "welcome_message": cfg.get("welcome_message") or f"مرحباً! أنا المساعد الذكي لـ {p.get('name','المتجر')}. كيف أساعدك؟",
            "store_name": p.get("name") or "",
        }

    class ChatIn(BaseModel):
        message: str
        session_id: Optional[str] = None
        history: Optional[list] = None  # client-side transcript [{role, text}]

    @r.post("/public/{slug}/chatbot")
    async def _public_chat(slug: str, body: ChatIn):
        text = (body.message or "").strip()
        if not text:
            raise HTTPException(400, "message required")
        if len(text) > 1000:
            raise HTTPException(400, "message too long")

        p = await database.website_projects.find_one(
            {"slug": slug, "status": "approved"}, {"_id": 0}
        )
        if not p:
            raise HTTPException(404, "غير موجود")

        cfg = p.get("chatbot_config") or {}
        if not cfg.get("enabled"):
            raise HTTPException(403, "المساعد الذكي غير مفعّل")

        api_key = os.environ.get("EMERGENT_LLM_KEY", "")
        if not api_key:
            raise HTTPException(500, "AI service unavailable")

        session_id = (body.session_id or "anon") + "@" + slug
        if not _check_rate(session_id):
            raise HTTPException(429, "لقد تجاوزت الحد المسموح. حاول لاحقاً.")

        try:
            chat = LlmChat(
                api_key=api_key,
                session_id=f"chatbot-{p['id']}-{session_id}",
                system_message=_build_system_prompt(p),
            ).with_model("anthropic", "claude-sonnet-4-5-20250929")

            reply = await chat.send_message(UserMessage(text=text))

            # Detect handoff request from the model
            handoff = False
            if isinstance(reply, str) and reply.lstrip().startswith("[HANDOFF]"):
                handoff = True
                reply = reply.replace("[HANDOFF]", "", 1).strip()
                if not reply:
                    reply = "سأحوّلك مباشرة لأحد موظفينا — اضغط الزر أدناه لإرسال طلبك."

            ym = datetime.now(timezone.utc).strftime("%Y-%m")
            await database.website_projects.update_one(
                {"id": p["id"]},
                {"$inc": {f"chatbot_usage.{ym}.messages": 1, **({f"chatbot_usage.{ym}.handoffs": 1} if handoff else {})}},
            )
            return {"reply": reply, "session_id": session_id, "handoff": handoff}
        except Exception as e:
            raise HTTPException(500, f"AI error: {str(e)[:200]}")

    # ── Public: handoff to a human (creates a support ticket on the project) ──
    class HandoffIn(BaseModel):
        session_id: Optional[str] = None
        name: Optional[str] = None
        contact: Optional[str] = None  # phone/whatsapp/email
        message: Optional[str] = None
        transcript: Optional[list] = None  # [{role, text}]

    @r.post("/public/{slug}/chatbot/handoff")
    async def _public_handoff(slug: str, body: HandoffIn):
        p = await database.website_projects.find_one(
            {"slug": slug, "status": "approved"},
            {"_id": 0, "id": 1, "support_tickets": 1},
        )
        if not p:
            raise HTTPException(404, "غير موجود")

        # Compose a readable transcript
        lines = []
        for m in (body.transcript or [])[-30:]:
            role = "زبون" if (m.get("role") == "user") else "مساعد"
            txt = str(m.get("text", ""))[:600]
            lines.append(f"{role}: {txt}")
        transcript_txt = "\n".join(lines) or "(لا يوجد سجل محادثة)"

        subject = (body.message or "طلب تواصل من المساعد الذكي")[:200]
        description = (
            f"📞 الاسم: {body.name or '(مجهول)'}\n"
            f"📲 وسيلة التواصل: {body.contact or '(لم يُذكر)'}\n"
            f"🗒️ ملاحظات الزبون: {body.message or '(لا توجد)'}\n\n"
            f"=== سجل المحادثة ===\n{transcript_txt}"
        )[:4000]

        import uuid as _uuid
        ticket = {
            "id": str(_uuid.uuid4()),
            "at": _iso_now(),
            "subject": subject,
            "description": description,
            "category": "chatbot_handoff",
            "status": "open",
            "source": "chatbot",
            "customer": {
                "name": (body.name or "")[:80],
                "contact": (body.contact or "")[:80],
                "session_id": body.session_id or "",
            },
        }
        await database.website_projects.update_one(
            {"id": p["id"]},
            {"$push": {"support_tickets": ticket}, "$set": {"updated_at": _iso_now()}},
        )
        return {"ok": True, "ticket_id": ticket["id"]}

    return r


# ── Owner / Client config endpoints — both routes mounted on main websites router ──
class ChatbotCfg(BaseModel):
    enabled: Optional[bool] = None
    welcome_message: Optional[str] = None
    business_hours: Optional[str] = None
    extra_context: Optional[str] = None


_ALLOWED_CFG_KEYS = ("enabled", "welcome_message", "business_hours", "extra_context")


def register_owner_endpoints(r: APIRouter, database, auth_dep, resolve_client=None):
    """Mount owner + client config endpoints on the main websites router."""
    from fastapi import Header as _Header

    @r.get("/projects/{project_id}/chatbot/config")
    async def _cfg_get(project_id: str, current_user: dict = Depends(auth_dep)):
        p = await database.website_projects.find_one(
            {"id": project_id, "user_id": current_user["user_id"]},
            {"_id": 0, "chatbot_config": 1, "chatbot_usage": 1, "name": 1},
        )
        if not p:
            raise HTTPException(404, "Not found")
        cfg = dict(p.get("chatbot_config") or {})
        cfg["usage"] = p.get("chatbot_usage") or {}
        return cfg

    @r.put("/projects/{project_id}/chatbot/config")
    async def _cfg_put(project_id: str, body: ChatbotCfg, current_user: dict = Depends(auth_dep)):
        p = await database.website_projects.find_one(
            {"id": project_id, "user_id": current_user["user_id"]}, {"_id": 0, "id": 1}
        )
        if not p:
            raise HTTPException(404, "Not found")
        patch: Dict[str, Any] = {}
        for k in _ALLOWED_CFG_KEYS:
            v = getattr(body, k)
            if v is not None:
                patch[f"chatbot_config.{k}"] = v
        if patch:
            patch["updated_at"] = _iso_now()
            await database.website_projects.update_one({"id": project_id}, {"$set": patch})
        fresh = await database.website_projects.find_one({"id": project_id}, {"_id": 0, "chatbot_config": 1})
        return (fresh or {}).get("chatbot_config") or {}

    # ── Client-side endpoints (use client session token) ──
    if resolve_client is None:
        return

    @r.get("/client/chatbot/config")
    async def _client_cfg_get(authorization: str = _Header(None)):
        p = await resolve_client(authorization or "")
        cfg = dict(p.get("chatbot_config") or {})
        cfg["usage"] = p.get("chatbot_usage") or {}
        return cfg

    @r.put("/client/chatbot/config")
    async def _client_cfg_put(body: ChatbotCfg, authorization: str = _Header(None)):
        p = await resolve_client(authorization or "")
        patch: Dict[str, Any] = {}
        for k in _ALLOWED_CFG_KEYS:
            v = getattr(body, k)
            if v is not None:
                patch[f"chatbot_config.{k}"] = v
        if patch:
            patch["updated_at"] = _iso_now()
            await database.website_projects.update_one({"id": p["id"]}, {"$set": patch})
        fresh = await database.website_projects.find_one({"id": p["id"]}, {"_id": 0, "chatbot_config": 1})
        return (fresh or {}).get("chatbot_config") or {}
