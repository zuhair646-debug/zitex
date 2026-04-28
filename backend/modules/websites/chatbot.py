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


def _build_system_prompt(project: Dict[str, Any]) -> str:
    name = project.get("name") or "المتجر"
    vertical = project.get("vertical") or "store"
    cfg = project.get("chatbot_config") or {}
    welcome = cfg.get("welcome_message") or ""
    hours = cfg.get("business_hours") or ""
    extra = cfg.get("extra_context") or ""

    # Compact product list (most-relevant fields only)
    products = []
    for p in (project.get("products") or [])[:80]:
        line = f"- {p.get('name','')}"
        if p.get("price"):
            line += f" — {p['price']} ر.س"
        if p.get("description"):
            line += f" ({str(p['description'])[:80]})"
        products.append(line)
    product_block = "\n".join(products) if products else "(لا توجد منتجات بعد)"

    services = []
    for s in (project.get("services") or [])[:40]:
        sline = f"- {s.get('name','')}"
        if s.get("price"):
            sline += f" — {s['price']} ر.س"
        if s.get("duration_min"):
            sline += f" — {s['duration_min']} دقيقة"
        services.append(sline)
    services_block = "\n".join(services) if services else ""

    return f"""أنت مساعد ذكي يخدم زبائن {name}. أجِب بالعربية، باختصار وودّ.

دورك:
1. ساعد الزبون في معرفة المنتجات والأسعار والتوفر
2. اقترح منتجات بناءً على ما يطلبه
3. اشرح ساعات العمل وطرق التواصل
4. إن سُئلت عن شيء غير موجود في معلوماتك، اعتذر بلطف واطلب من الزبون التواصل مباشرة
5. لا تعد بأي شيء غير مذكور هنا (مثل تخفيضات أو شحن مجاني) إلا إذا كان مكتوباً
6. لا تطلب معلومات حساسة (بطاقات، كلمات مرور)

=== معلومات المتجر ===
الاسم: {name}
النوع: {vertical}
{f"ساعات العمل: {hours}" if hours else ""}
{f"رسالة الترحيب الموصى بها: {welcome}" if welcome else ""}

=== المنتجات ===
{product_block}

{f"=== الخدمات ==={chr(10)}{services_block}" if services_block else ""}

{f"=== معلومات إضافية ==={chr(10)}{extra}" if extra else ""}

اجعل ردودك قصيرة (٢-٤ أسطر عادةً) ودقيقة."""


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

            # Increment usage counter (for billing/analytics)
            ym = datetime.now(timezone.utc).strftime("%Y-%m")
            await database.website_projects.update_one(
                {"id": p["id"]},
                {"$inc": {f"chatbot_usage.{ym}.messages": 1}},
            )
            return {"reply": reply, "session_id": session_id}
        except Exception as e:
            raise HTTPException(500, f"AI error: {str(e)[:200]}")

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
