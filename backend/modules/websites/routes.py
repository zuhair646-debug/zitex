"""FastAPI routes for the Websites module — fully isolated."""
import uuid
import re
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional, List
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

from .models import WebsiteProject, ChatMessageIn, AIGenerateIn
from .templates import list_templates, get_template
from .renderer import render_website_to_html
from .ai_service import (
    chat_with_consultant, extract_wizard_action, clean_display_text,
    extract_build_payload, build_sections_from_payload,
)
from .variants import list_variants_for_template, list_style_variants, get_variant_project
from .catalog import list_categories, list_layouts, get_layout
from .logo_service import generate_logo, generate_hero_image
from .wizard import (
    STEPS, default_wizard_state, get_step, get_question_for_step,
    get_chips_for_step, next_step_id, apply_answer, steps_metadata,
    COLOR_VARIANT_MAP, RADIUS_MAP,
)

logger = logging.getLogger(__name__)


class WizardStepIn(BaseModel):
    step: str
    value: Any   # string | list | dict


class WizardChatIn(BaseModel):
    message: str


class LogoGenerateIn(BaseModel):
    prompt: str
    style_hint: Optional[str] = ""


class HeroImageIn(BaseModel):
    prompt: str
    section_type: str = "hero"


class BuildPreviewIn(BaseModel):
    theme_override: Optional[Dict[str, Any]] = None
    sections_override: Optional[List[Dict[str, Any]]] = None


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _slugify(text: str) -> str:
    """ASCII-safe slug generation from (possibly Arabic) text."""
    if not text:
        return "site"
    # Keep alphanumerics + dashes; replace spaces with dashes
    slug = re.sub(r"[^\w\u0600-\u06FF\s-]", "", str(text)).strip().lower()
    slug = re.sub(r"\s+", "-", slug)
    # If mostly non-ASCII, fall back to a short random id prefix
    if not re.search(r"[a-z0-9]", slug):
        slug = f"site-{uuid.uuid4().hex[:8]}"
    return slug[:60] or f"site-{uuid.uuid4().hex[:8]}"


async def _generate_unique_slug(database, base: str) -> str:
    """Ensure slug is unique in collection."""
    slug = _slugify(base)
    candidate = slug
    i = 1
    while await database.website_projects.find_one({"slug": candidate}, {"_id": 0, "id": 1}):
        i += 1
        candidate = f"{slug}-{i}"
        if i > 99:
            candidate = f"{slug}-{uuid.uuid4().hex[:6]}"
            break
    return candidate


def register_routes(app, database, auth_dep):
    """Mount all /api/websites/* routes onto `app` with bound db + auth."""
    r = APIRouter(prefix="/api/websites", tags=["websites"])

    # ---------------- Templates & Variants (public) ----------------
    @r.get("/templates")
    async def _t_list():
        return {"templates": list_templates()}

    @r.get("/templates/{template_id}/preview-html")
    async def _t_preview(template_id: str):
        tpl = get_template(template_id)
        project = {"name": tpl["name"], "theme": tpl["theme"], "sections": tpl["sections"], "meta": {"title": tpl["name"]}}
        return {"html": render_website_to_html(project)}

    @r.get("/variants")
    async def _v_list():
        return {"variants": list_style_variants()}

    # ---------------- Categories & Layouts (public) ----------------
    @r.get("/categories")
    async def _c_list():
        return {"categories": list_categories()}

    @r.get("/categories/{category_id}/layouts")
    async def _c_layouts(category_id: str):
        layouts = list_layouts(category_id)
        # Strip heavy sections from list response; include enough for card previews
        return {"layouts": [
            {"id": L["id"], "name": L["name"], "icon": L.get("icon", ""), "description": L.get("description", ""),
             "theme": L.get("theme", {})}
            for L in layouts
        ]}

    @r.get("/categories/{category_id}/layouts/{layout_id}/preview-html")
    async def _c_layout_preview(category_id: str, layout_id: str):
        L = get_layout(category_id, layout_id)
        theme = dict(L.get("theme") or {})
        if L.get("custom_css"):
            theme["custom_css"] = L["custom_css"]
        project = {"name": L["name"], "theme": theme, "sections": L["sections"], "meta": {"title": L["name"]}}
        return {"html": render_website_to_html(project)}

    # DNA Mixer — random layout for a category
    @r.get("/categories/{category_id}/mix")
    async def _c_mix(category_id: str):
        import random
        layouts = list_layouts(category_id)
        if not layouts:
            raise HTTPException(404, "No layouts")
        L = random.choice(layouts)
        theme = dict(L.get("theme") or {})
        if L.get("custom_css"):
            theme["custom_css"] = L["custom_css"]
        project = {"name": L["name"], "theme": theme, "sections": L["sections"], "meta": {"title": L["name"]}}
        return {"layout": {"id": L["id"], "name": L["name"], "icon": L.get("icon", "")},
                "html": render_website_to_html(project)}

    @r.get("/templates/{template_id}/variants")
    async def _t_variants(template_id: str):
        return {"variants": list_variants_for_template(template_id)}

    @r.get("/templates/{template_id}/variants/{variant_id}/preview-html")
    async def _v_preview(template_id: str, variant_id: str):
        project = get_variant_project(template_id, variant_id)
        return {"html": render_website_to_html(project)}

    # ---------------- Wizard meta (public) ----------------
    @r.get("/wizard/steps")
    async def _w_steps():
        return {"steps": steps_metadata()}

    # ---------------- Projects ----------------
    @r.get("/projects")
    async def _p_list(current_user: dict = Depends(auth_dep)):
        # Auto-fix: ensure approved projects of this user have a slug
        missing = await database.website_projects.find(
            {"user_id": current_user["user_id"], "status": "approved", "slug": {"$in": [None, ""]}},
            {"_id": 0, "id": 1, "name": 1}
        ).to_list(200)
        for m in missing:
            new_slug = await _generate_unique_slug(database, m.get("name") or "site")
            await database.website_projects.update_one({"id": m["id"]}, {"$set": {"slug": new_slug}})
        items = await database.website_projects.find(
            {"user_id": current_user["user_id"]}, {"_id": 0}
        ).sort("updated_at", -1).to_list(200)
        return {"projects": items}

    @r.get("/projects/{project_id}")
    async def _p_get(project_id: str, current_user: dict = Depends(auth_dep)):
        p = await database.website_projects.find_one(
            {"id": project_id, "user_id": current_user["user_id"]}, {"_id": 0}
        )
        if not p:
            raise HTTPException(404, "Project not found")
        return p

    @r.post("/projects")
    async def _p_create(project: WebsiteProject, current_user: dict = Depends(auth_dep)):
        now = _iso_now()
        d = project.model_dump()
        d["id"] = str(uuid.uuid4())
        d["user_id"] = current_user["user_id"]
        d["created_at"] = now
        d["updated_at"] = now
        # Resolve catalog layout if provided in meta
        layout_id = (d.get("meta") or {}).get("layout_id") if d.get("meta") else None
        category_id = d.get("template") or "blank"
        if layout_id:
            L = get_layout(category_id, layout_id)
            if not d.get("sections"):
                d["sections"] = [s.copy() for s in L["sections"]]
            theme = dict(L.get("theme") or {})
            if L.get("custom_css"):
                theme["custom_css"] = L["custom_css"]
            d["theme"] = {**theme, **(d.get("theme") or {})}
            # Store layout_id for reference
            d["meta"] = {**(d.get("meta") or {}), "layout_id": layout_id}
        else:
            tpl = get_template(category_id)
            if not d.get("sections"):
                d["sections"] = [s.copy() for s in tpl["sections"]]
                d["theme"] = {**tpl["theme"], **(d.get("theme") or {})}
        for s in d["sections"]:
            if not s.get("id"):
                s["id"] = f"sec-{uuid.uuid4().hex[:8]}"
        # Init wizard state + greet message
        is_blank = category_id == "blank"
        wiz = default_wizard_state()
        if is_blank:
            wiz["step"] = "brief"
        d["wizard"] = wiz
        if is_blank:
            greet = "✨ ممتاز! اخترت قالباً مخصّصاً. صف لي نشاطك بحرّية (مثل: 'متجر قطط' أو 'عيادة أسنان حديثة') وسأبني لك تصميماً ابتكارياً فوراً."
        else:
            greet = get_question_for_step(wiz["step"])
        if not d.get("chat"):
            d["chat"] = [{"role": "assistant", "content": greet}]
        await database.website_projects.insert_one(d)
        d.pop("_id", None)
        return d

    @r.patch("/projects/{project_id}")
    async def _p_update(project_id: str, project: WebsiteProject, current_user: dict = Depends(auth_dep)):
        existing = await database.website_projects.find_one(
            {"id": project_id, "user_id": current_user["user_id"]}
        )
        if not existing:
            raise HTTPException(404, "Project not found")
        update = project.model_dump(exclude={"id", "user_id", "created_at"})
        # Preserve wizard state unless sent explicitly
        if "wizard" not in update or update["wizard"] is None:
            update.pop("wizard", None)
        update["updated_at"] = _iso_now()
        await database.website_projects.update_one({"id": project_id}, {"$set": update})
        return await database.website_projects.find_one({"id": project_id}, {"_id": 0})

    @r.delete("/projects/{project_id}")
    async def _p_delete(project_id: str, current_user: dict = Depends(auth_dep)):
        res = await database.website_projects.delete_one(
            {"id": project_id, "user_id": current_user["user_id"]}
        )
        if res.deleted_count == 0:
            raise HTTPException(404, "Project not found")
        return {"ok": True}

    @r.post("/projects/{project_id}/duplicate")
    async def _p_duplicate(project_id: str, current_user: dict = Depends(auth_dep)):
        p = await database.website_projects.find_one(
            {"id": project_id, "user_id": current_user["user_id"]}, {"_id": 0}
        )
        if not p:
            raise HTTPException(404, "Project not found")
        p["id"] = str(uuid.uuid4())
        p["name"] = f"{p.get('name','موقع')} (نسخة)"
        p["created_at"] = _iso_now()
        p["updated_at"] = _iso_now()
        await database.website_projects.insert_one(p)
        p.pop("_id", None)
        return p

    @r.post("/projects/{project_id}/build")
    async def _p_build(project_id: str, current_user: dict = Depends(auth_dep)):
        p = await database.website_projects.find_one(
            {"id": project_id, "user_id": current_user["user_id"]}, {"_id": 0}
        )
        if not p:
            raise HTTPException(404, "Project not found")
        return {"html": render_website_to_html(p), "project_id": project_id}

    # ---------------- Logo / Hero image generation (AI) ----------------
    @r.post("/projects/{project_id}/generate-logo")
    async def _p_generate_logo(project_id: str, body: LogoGenerateIn, current_user: dict = Depends(auth_dep)):
        p = await database.website_projects.find_one(
            {"id": project_id, "user_id": current_user["user_id"]}, {"_id": 0}
        )
        if not p:
            raise HTTPException(404, "Project not found")
        result = await generate_logo(body.prompt, body.style_hint or "")
        if not result:
            raise HTTPException(500, "فشل توليد اللوقو — حاول بوصف مختلف")
        data_url, _sid = result
        theme = {**(p.get("theme") or {}), "logo_url": data_url}
        await database.website_projects.update_one(
            {"id": project_id},
            {"$set": {"theme": theme, "updated_at": _iso_now()}},
        )
        return {"ok": True, "logo_url": data_url}

    @r.post("/projects/{project_id}/generate-hero-image")
    async def _p_generate_hero(project_id: str, body: HeroImageIn, current_user: dict = Depends(auth_dep)):
        p = await database.website_projects.find_one(
            {"id": project_id, "user_id": current_user["user_id"]}, {"_id": 0}
        )
        if not p:
            raise HTTPException(404, "Project not found")
        url = await generate_hero_image(body.prompt)
        if not url:
            raise HTTPException(500, "فشل توليد الصورة")
        sections = list(p.get("sections") or [])
        for i, s in enumerate(sections):
            if s.get("type") == body.section_type:
                sections[i] = {**s, "data": {**(s.get("data") or {}), "image": url}}
                break
        await database.website_projects.update_one(
            {"id": project_id},
            {"$set": {"sections": sections, "updated_at": _iso_now()}},
        )
        return {"ok": True, "image_url": url}

    # Preview with un-persisted theme / section overrides (used for live-before-confirm)
    @r.post("/projects/{project_id}/build-preview")
    async def _p_build_preview(project_id: str, body: BuildPreviewIn, current_user: dict = Depends(auth_dep)):
        p = await database.website_projects.find_one(
            {"id": project_id, "user_id": current_user["user_id"]}, {"_id": 0}
        )
        if not p:
            raise HTTPException(404, "Project not found")
        theme = {**(p.get("theme") or {}), **(body.theme_override or {})}
        sections = body.sections_override if body.sections_override is not None else p.get("sections")
        return {"html": render_website_to_html({**p, "theme": theme, "sections": sections})}

    # ---------------- Variant apply ----------------
    class ApplyVariantIn(BaseModel):
        template_id: str
        variant_id: str
        replace_sections: bool = False   # if False → keep current sections, only apply theme

    @r.post("/projects/{project_id}/apply-variant")
    async def _p_apply_variant(project_id: str, body: ApplyVariantIn, current_user: dict = Depends(auth_dep)):
        p = await database.website_projects.find_one(
            {"id": project_id, "user_id": current_user["user_id"]}, {"_id": 0}
        )
        if not p:
            raise HTTPException(404, "Project not found")
        vp = get_variant_project(body.template_id, body.variant_id)
        update = {"theme": vp["theme"], "template": body.template_id, "updated_at": _iso_now()}
        if body.replace_sections:
            sections = [{**s, "id": f"sec-{uuid.uuid4().hex[:8]}"} for s in vp["sections"]]
            update["sections"] = sections
            update["business_type"] = vp["business_type"]
        await database.website_projects.update_one({"id": project_id}, {"$set": update})
        return await database.website_projects.find_one({"id": project_id}, {"_id": 0})

    # ---------------- Wizard: deterministic step answer (chip click) ----------------
    @r.post("/projects/{project_id}/wizard/answer")
    async def _w_answer(project_id: str, body: WizardStepIn, current_user: dict = Depends(auth_dep)):
        p = await database.website_projects.find_one(
            {"id": project_id, "user_id": current_user["user_id"]}, {"_id": 0}
        )
        if not p:
            raise HTTPException(404, "Project not found")
        if not p.get("wizard"):
            p["wizard"] = default_wizard_state()
        # Apply
        p = apply_answer(p, body.step, body.value)
        # Append a system-style acknowledgement + next question
        chat = p.get("chat", [])
        human_label = _chip_label(body.step, body.value)
        chat.append({"role": "user", "content": human_label})
        nxt_step = p["wizard"].get("step")
        if nxt_step and nxt_step != "done":
            chat.append({"role": "assistant", "content": get_question_for_step(nxt_step)})
        else:
            chat.append({"role": "assistant", "content": "🎉 تمّت كل الأسئلة! راجع المعاينة — لو كل شيء تمام، اضغط 'اعتماد' من القائمة."})
        p["chat"] = chat
        update = {
            "theme": p["theme"], "sections": p.get("sections", []),
            "wizard": p["wizard"], "chat": chat,
            "name": p.get("name"),
            "updated_at": _iso_now(),
        }
        await database.website_projects.update_one({"id": project_id}, {"$set": update})
        return await database.website_projects.find_one({"id": project_id}, {"_id": 0})

    # ---------------- Wizard: free-text chat (priority aware) ----------------
    @r.post("/projects/{project_id}/wizard/chat")
    async def _w_chat(project_id: str, body: WizardChatIn, current_user: dict = Depends(auth_dep)):
        p = await database.website_projects.find_one(
            {"id": project_id, "user_id": current_user["user_id"]}, {"_id": 0}
        )
        if not p:
            raise HTTPException(404, "Project not found")
        if not p.get("wizard"):
            p["wizard"] = default_wizard_state()
        history = list(p.get("chat", []))
        history.append({"role": "user", "content": body.message})
        summary = {"name": p.get("name"), "template": p.get("template"), "business_type": p.get("business_type")}
        ai_text = await chat_with_consultant(history, wizard=p.get("wizard"), project_summary=summary)
        display = clean_display_text(ai_text)
        action = extract_wizard_action(ai_text)
        history.append({"role": "assistant", "content": display})
        p["chat"] = history
        # Apply AI action (if any)
        p = _apply_ai_action(p, action)
        # Handle async generate_logo directive
        if action and action.get("action") == "generate_logo" and isinstance(action.get("value"), dict):
            try:
                v = action["value"]
                result = await generate_logo(v.get("prompt", ""), v.get("style", ""))
                if result:
                    data_url, _ = result
                    p["theme"] = {**(p.get("theme") or {}), "logo_url": data_url}
            except Exception as e:
                logger.warning(f"logo gen in chat failed: {e}")
        await database.website_projects.update_one(
            {"id": project_id},
            {"$set": {
                "chat": p["chat"], "theme": p.get("theme"), "sections": p.get("sections"),
                "wizard": p.get("wizard"), "name": p.get("name"),
                "updated_at": _iso_now(),
            }}
        )
        updated = await database.website_projects.find_one({"id": project_id}, {"_id": 0})
        return {"project": updated, "action": action, "response": display}

    # ---------------- Legacy /chat — keep for back-compat ----------------
    @r.post("/projects/{project_id}/chat")
    async def _p_chat(project_id: str, body: ChatMessageIn, current_user: dict = Depends(auth_dep)):
        p = await database.website_projects.find_one(
            {"id": project_id, "user_id": current_user["user_id"]}, {"_id": 0}
        )
        if not p:
            raise HTTPException(404, "Project not found")
        history = list(p.get("chat", []))
        history.append({"role": "user", "content": body.message})
        ai_text = await chat_with_consultant(history, wizard=p.get("wizard"),
                                             project_summary={"name": p.get("name"), "template": p.get("template"), "business_type": p.get("business_type")})
        display = clean_display_text(ai_text)
        action = extract_wizard_action(ai_text)
        payload = extract_build_payload(ai_text)
        history.append({"role": "assistant", "content": display})
        update: Dict[str, Any] = {"chat": history, "updated_at": _iso_now()}
        built = False
        if payload:
            try:
                sections, theme, tpl_id = build_sections_from_payload(payload)
                for s in sections:
                    if not s.get("id"):
                        s["id"] = f"sec-{uuid.uuid4().hex[:8]}"
                update["sections"] = sections
                update["theme"] = theme
                update["template"] = tpl_id
                update["business_type"] = payload.get("business_type", p.get("business_type", "company"))
                if payload.get("name"):
                    update["name"] = payload["name"]
                built = True
            except Exception:
                pass
        if action:
            p["chat"] = history
            p = _apply_ai_action(p, action)
            update["theme"] = p.get("theme")
            update["sections"] = p.get("sections")
            update["wizard"] = p.get("wizard")
            update["name"] = p.get("name")
        await database.website_projects.update_one({"id": project_id}, {"$set": update})
        updated = await database.website_projects.find_one({"id": project_id}, {"_id": 0})
        return {"response": display, "built": built, "project": updated, "action": action}

    @r.post("/ai/instant-build")
    async def _p_instant(body: AIGenerateIn, current_user: dict = Depends(auth_dep)):
        valid = ("store", "restaurant", "company", "portfolio", "saas")
        tpl_key = body.business_type if body.business_type in valid else "blank"
        tpl = get_template(tpl_key)
        now = _iso_now()
        d = {
            "id": str(uuid.uuid4()), "user_id": current_user["user_id"],
            "name": body.name or tpl["name"], "business_type": body.business_type, "template": tpl_key,
            "lang": "ar", "direction": "rtl", "theme": tpl["theme"],
            "sections": [{**s, "id": f"sec-{uuid.uuid4().hex[:8]}"} for s in tpl["sections"]],
            "meta": {"title": body.name or tpl["name"], "description": body.brief},
            "chat": [
                {"role": "user", "content": body.brief},
                {"role": "assistant", "content": f"تم إنشاء موقعك بقالب {tpl['name']}. عدّل أي قسم من المحرر المرئي."},
            ],
            "wizard": default_wizard_state(),
            "created_at": now, "updated_at": now,
        }
        await database.website_projects.insert_one(d)
        d.pop("_id", None)
        return d

    # ---------------- Independence placeholder (returns guide only, no code) ----------------
    @r.post("/projects/{project_id}/approve")
    async def _p_approve(project_id: str, current_user: dict = Depends(auth_dep)):
        from datetime import datetime, timezone
        p = await database.website_projects.find_one(
            {"id": project_id, "user_id": current_user["user_id"]}, {"_id": 0}
        )
        if not p:
            raise HTTPException(404, "Project not found")
        now = datetime.now(timezone.utc).isoformat()
        # Generate slug if not already set
        slug = p.get("slug")
        if not slug:
            slug = await _generate_unique_slug(database, p.get("name") or "site")
        await database.website_projects.update_one(
            {"id": project_id},
            {"$set": {"status": "approved", "approved_at": now, "updated_at": now, "slug": slug}}
        )
        return {"ok": True, "status": "approved", "approved_at": now, "slug": slug, "public_url": f"/sites/{slug}"}

    @r.post("/projects/{project_id}/unapprove")
    async def _p_unapprove(project_id: str, current_user: dict = Depends(auth_dep)):
        p = await database.website_projects.find_one(
            {"id": project_id, "user_id": current_user["user_id"]}, {"_id": 0}
        )
        if not p:
            raise HTTPException(404, "Project not found")
        await database.website_projects.update_one(
            {"id": project_id},
            {"$set": {"status": "draft", "updated_at": _iso_now()}}
        )
        return {"ok": True, "status": "draft"}

    @r.post("/projects/{project_id}/independence/request")
    async def _independence(project_id: str, current_user: dict = Depends(auth_dep)):
        p = await database.website_projects.find_one(
            {"id": project_id, "user_id": current_user["user_id"]}, {"_id": 0}
        )
        if not p:
            raise HTTPException(404, "Project not found")
        return {
            "ok": True,
            "message": "طلب الاستقلالية مسجّل. سيتم التواصل لاستكمال خطوات النشر.",
            "status": "pending_payment",
            "guides": [
                {"id": "vercel", "name": "Vercel", "summary": "الأفضل للمواقع الحديثة — مجاني، نطاق مخصّص، CI/CD تلقائي."},
                {"id": "netlify", "name": "Netlify", "summary": "بديل ممتاز لـ Vercel — نفس السهولة."},
                {"id": "github", "name": "GitHub Pages", "summary": "مجاني تماماً للمواقع الثابتة (بدون Backend)."},
            ],
        }

    # ---------------- Public site by slug ----------------
    @r.get("/public/{slug}", response_class=HTMLResponse)
    async def _public_site(slug: str):
        p = await database.website_projects.find_one({"slug": slug, "status": "approved"}, {"_id": 0})
        if not p:
            return HTMLResponse("<h1>الموقع غير موجود</h1>", status_code=404)
        # increment visits
        try:
            await database.website_projects.update_one({"id": p["id"]}, {"$inc": {"visits": 1}})
        except Exception:
            pass
        return HTMLResponse(render_website_to_html(p))

    @r.get("/public/{slug}/info")
    async def _public_site_info(slug: str):
        """Public metadata only (no PII)."""
        p = await database.website_projects.find_one({"slug": slug, "status": "approved"},
                                                    {"_id": 0, "name": 1, "template": 1, "slug": 1, "approved_at": 1, "visits": 1})
        if not p:
            raise HTTPException(404, "not found")
        return p

    # ---------------- Admin: all approved sites (owner view) ----------------
    @r.get("/admin/sites")
    async def _admin_sites(current_user: dict = Depends(auth_dep)):
        # Only owner/admin can see ALL users' approved sites
        user_doc = await database.users.find_one({"id": current_user["user_id"]}, {"_id": 0, "role": 1, "email": 1})
        role = (user_doc or {}).get("role", "client")
        if role not in ("owner", "super_admin", "admin"):
            raise HTTPException(403, "غير مسموح — لوحة المشرف فقط")
        # Auto-fix: ensure every approved project has a slug
        missing = await database.website_projects.find({"status": "approved", "slug": {"$in": [None, ""]}}, {"_id": 0}).to_list(500)
        for m in missing:
            new_slug = await _generate_unique_slug(database, m.get("name") or "site")
            await database.website_projects.update_one({"id": m["id"]}, {"$set": {"slug": new_slug}})
        items = await database.website_projects.find(
            {"status": "approved"},
            {"_id": 0, "id": 1, "name": 1, "template": 1, "slug": 1, "approved_at": 1, "visits": 1, "user_id": 1, "theme": 1}
        ).sort("approved_at", -1).to_list(500)
        # Attach user email
        user_ids = list({it["user_id"] for it in items})
        users = await database.users.find({"id": {"$in": user_ids}}, {"_id": 0, "id": 1, "email": 1, "name": 1}).to_list(500)
        umap = {u["id"]: u for u in users}
        for it in items:
            u = umap.get(it["user_id"], {})
            it["owner_email"] = u.get("email")
            it["owner_name"] = u.get("name")
            it["public_url"] = f"/sites/{it.get('slug','')}"
        return {"sites": items, "total": len(items)}

    @r.get("/admin/sites/{project_id}")
    async def _admin_site_detail(project_id: str, current_user: dict = Depends(auth_dep)):
        user_doc = await database.users.find_one({"id": current_user["user_id"]}, {"_id": 0, "role": 1})
        if (user_doc or {}).get("role") not in ("owner", "super_admin", "admin"):
            raise HTTPException(403, "غير مسموح")
        p = await database.website_projects.find_one({"id": project_id}, {"_id": 0})
        if not p:
            raise HTTPException(404, "Project not found")
        return p

    app.include_router(r)
    return r


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _chip_label(step_id: str, value: Any) -> str:
    step = get_step(step_id)
    chips = (step or {}).get("chips", [])
    if isinstance(value, list):
        labels = []
        for v in value:
            c = next((c for c in chips if c.get("id") == v or c.get("value") == v), None)
            labels.append((c or {}).get("label", str(v)))
        return "، ".join(labels)
    c = next((c for c in chips if c.get("id") == value or c.get("value") == value), None)
    return (c or {}).get("label", str(value))


def _apply_ai_action(project: Dict[str, Any], action: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """Mutate project based on a directive returned by the AI."""
    if not action or not isinstance(action, dict):
        return project
    a = action.get("action")
    v = action.get("value")
    try:
        if a == "advance":
            return apply_answer(project, action.get("step") or project.get("wizard", {}).get("step"), v)
        if a == "apply_theme" and isinstance(v, dict):
            project["theme"] = {**(project.get("theme") or {}), **v}
        if a == "apply_button":
            project["theme"] = {**(project.get("theme") or {}), "radius": RADIUS_MAP.get(str(v), "medium")}
        if a == "apply_font":
            project["theme"] = {**(project.get("theme") or {}), "font": str(v) or "Tajawal"}
        if a == "inject_css" and isinstance(v, str):
            # append to existing custom_css
            existing = (project.get("theme") or {}).get("custom_css", "")
            project["theme"] = {**(project.get("theme") or {}), "custom_css": (existing + "\n" + v).strip()}
        if a == "add_section" and isinstance(v, dict):
            sections = list(project.get("sections") or [])
            sections.append({
                "id": f"sec-{uuid.uuid4().hex[:8]}", "type": v.get("type", "hero"),
                "order": len(sections), "visible": True, "data": v.get("data") or {},
            })
            project["sections"] = sections
        if a == "fill_section" and isinstance(v, dict):
            # Merge AI-provided data into an existing section matching section_type
            stype = v.get("section_type")
            patch = v.get("data") or {}
            sections = list(project.get("sections") or [])
            for i, s in enumerate(sections):
                if s.get("type") == stype:
                    sections[i] = {**s, "data": {**(s.get("data") or {}), **patch}}
                    break
            project["sections"] = sections
        if a == "patch_section" and isinstance(v, dict):
            # Precise edit by section_id OR section_type, can also reorder/hide/show
            sid = v.get("section_id")
            stype = v.get("section_type")
            patch_data = v.get("data")  # dict or None
            set_fields = v.get("set") or {}   # visible / order etc.
            sections = list(project.get("sections") or [])
            for i, s in enumerate(sections):
                match = (sid and s.get("id") == sid) or (not sid and s.get("type") == stype)
                if match:
                    if patch_data:
                        s = {**s, "data": {**(s.get("data") or {}), **patch_data}}
                    for k, val in set_fields.items():
                        s[k] = val
                    sections[i] = s
                    break
            project["sections"] = sections
        if a == "remove_section" and isinstance(v, dict):
            sid = v.get("section_id")
            stype = v.get("section_type")
            sections = [s for s in (project.get("sections") or [])
                        if not ((sid and s.get("id") == sid) or (not sid and s.get("type") == stype))]
            project["sections"] = [{**s, "order": i} for i, s in enumerate(sections)]
        if a == "scaffold" and isinstance(v, dict):
            # Full scaffold: replace sections + merge theme + inject custom_css
            new_sections = v.get("sections") or []
            if new_sections:
                project["sections"] = [
                    {"id": f"sec-{uuid.uuid4().hex[:8]}", "type": s.get("type", "hero"),
                     "order": i, "visible": True, "data": s.get("data") or {}}
                    for i, s in enumerate(new_sections)
                ]
            hints = v.get("theme_hints") or {}
            theme = {**(project.get("theme") or {}), **hints}
            if v.get("custom_css"):
                theme["custom_css"] = (theme.get("custom_css", "") + "\n" + v["custom_css"]).strip()
            project["theme"] = theme
            if v.get("name"):
                project["name"] = v["name"]
            # Auto-advance past brief step if currently there
            wiz = project.get("wizard") or default_wizard_state()
            if wiz.get("step") == "brief":
                wiz["answers"] = {**(wiz.get("answers") or {}), "brief": v.get("name") or "custom"}
                wiz["completed"] = list(dict.fromkeys((wiz.get("completed") or []) + ["brief"]))
                wiz["step"] = "variant"
                project["wizard"] = wiz
        if a == "custom_feature" and isinstance(v, dict):
            wizard = project.get("wizard") or default_wizard_state()
            ans = dict(wizard.get("answers") or {})
            cf = list(ans.get("custom_features") or [])
            cf.append({"title": v.get("title"), "description": v.get("description"), "section_type": v.get("section_type")})
            ans["custom_features"] = cf
            wizard["answers"] = ans
            project["wizard"] = wizard
    except Exception as e:
        logger.warning(f"apply_ai_action error: {e}")
    return project
