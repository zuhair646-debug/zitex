"""FastAPI routes for the Websites module — fully isolated."""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException

from .models import WebsiteProject, ChatMessageIn, AIGenerateIn
from .templates import list_templates, get_template
from .renderer import render_website_to_html
from .ai_service import chat_with_assistant, extract_build_payload, clean_display_text, build_sections_from_payload
from .variants import list_variants_for_template, get_variant_project


def register_routes(app, database, auth_dep):
    """Mount all /api/websites/* routes onto `app` with bound db + auth."""
    r = APIRouter(prefix="/api/websites", tags=["websites"])

    @r.get("/templates")
    async def _t_list():
        return {"templates": list_templates()}

    @r.get("/templates/{template_id}/preview-html")
    async def _t_preview(template_id: str):
        tpl = get_template(template_id)
        project = {"name": tpl["name"], "theme": tpl["theme"], "sections": tpl["sections"], "meta": {"title": tpl["name"]}}
        return {"html": render_website_to_html(project)}

    @r.get("/projects")
    async def _p_list(current_user: dict = Depends(auth_dep)):
        items = await database.website_projects.find({"user_id": current_user["user_id"]}, {"_id": 0}).sort("updated_at", -1).to_list(200)
        return {"projects": items}

    @r.get("/projects/{project_id}")
    async def _p_get(project_id: str, current_user: dict = Depends(auth_dep)):
        p = await database.website_projects.find_one({"id": project_id, "user_id": current_user["user_id"]}, {"_id": 0})
        if not p:
            raise HTTPException(404, "Project not found")
        return p

    @r.post("/projects")
    async def _p_create(project: WebsiteProject, current_user: dict = Depends(auth_dep)):
        now = datetime.now(timezone.utc).isoformat()
        d = project.model_dump()
        d["id"] = str(uuid.uuid4())
        d["user_id"] = current_user["user_id"]
        d["created_at"] = now
        d["updated_at"] = now
        if not d.get("sections"):
            tpl = get_template(d.get("template") or "blank")
            d["sections"] = [s.copy() for s in tpl["sections"]]
            d["theme"] = {**tpl["theme"], **(d.get("theme") or {})}
        for s in d["sections"]:
            if not s.get("id"):
                s["id"] = f"sec-{uuid.uuid4().hex[:8]}"
        await database.website_projects.insert_one(d)
        d.pop("_id", None)
        return d

    @r.patch("/projects/{project_id}")
    async def _p_update(project_id: str, project: WebsiteProject, current_user: dict = Depends(auth_dep)):
        existing = await database.website_projects.find_one({"id": project_id, "user_id": current_user["user_id"]})
        if not existing:
            raise HTTPException(404, "Project not found")
        update = project.model_dump(exclude={"id", "user_id", "created_at"})
        update["updated_at"] = datetime.now(timezone.utc).isoformat()
        await database.website_projects.update_one({"id": project_id}, {"$set": update})
        updated = await database.website_projects.find_one({"id": project_id}, {"_id": 0})
        return updated

    @r.delete("/projects/{project_id}")
    async def _p_delete(project_id: str, current_user: dict = Depends(auth_dep)):
        res = await database.website_projects.delete_one({"id": project_id, "user_id": current_user["user_id"]})
        if res.deleted_count == 0:
            raise HTTPException(404, "Project not found")
        return {"ok": True}

    @r.post("/projects/{project_id}/duplicate")
    async def _p_duplicate(project_id: str, current_user: dict = Depends(auth_dep)):
        p = await database.website_projects.find_one({"id": project_id, "user_id": current_user["user_id"]}, {"_id": 0})
        if not p:
            raise HTTPException(404, "Project not found")
        p["id"] = str(uuid.uuid4())
        p["name"] = f"{p.get('name','موقع')} (نسخة)"
        now = datetime.now(timezone.utc).isoformat()
        p["created_at"] = now
        p["updated_at"] = now
        await database.website_projects.insert_one(p)
        p.pop("_id", None)
        return p

    @r.post("/projects/{project_id}/build")
    async def _p_build(project_id: str, current_user: dict = Depends(auth_dep)):
        p = await database.website_projects.find_one({"id": project_id, "user_id": current_user["user_id"]}, {"_id": 0})
        if not p:
            raise HTTPException(404, "Project not found")
        return {"html": render_website_to_html(p), "project_id": project_id}

    @r.post("/projects/{project_id}/chat")
    async def _p_chat(project_id: str, body: ChatMessageIn, current_user: dict = Depends(auth_dep)):
        p = await database.website_projects.find_one({"id": project_id, "user_id": current_user["user_id"]}, {"_id": 0})
        if not p:
            raise HTTPException(404, "Project not found")
        history = p.get("chat", [])
        history.append({"role": "user", "content": body.message})
        ai_text = await chat_with_assistant(history)
        display = clean_display_text(ai_text)
        payload = extract_build_payload(ai_text)
        history.append({"role": "assistant", "content": display})
        update = {"chat": history, "updated_at": datetime.now(timezone.utc).isoformat()}
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
        await database.website_projects.update_one({"id": project_id}, {"$set": update})
        updated = await database.website_projects.find_one({"id": project_id}, {"_id": 0})
        return {"response": display, "built": built, "project": updated}

    @r.post("/ai/instant-build")
    async def _p_instant(body: AIGenerateIn, current_user: dict = Depends(auth_dep)):
        valid = ("store", "restaurant", "company", "portfolio", "saas")
        tpl_key = body.business_type if body.business_type in valid else "blank"
        tpl = get_template(tpl_key)
        now = datetime.now(timezone.utc).isoformat()
        d = {
            "id": str(uuid.uuid4()), "user_id": current_user["user_id"],
            "name": body.name or tpl["name"], "business_type": body.business_type, "template": tpl_key,
            "lang": "ar", "direction": "rtl", "theme": tpl["theme"],
            "sections": [{**s, "id": f"sec-{uuid.uuid4().hex[:8]}"} for s in tpl["sections"]],
            "meta": {"title": body.name or tpl["name"], "description": body.brief},
            "chat": [{"role": "user", "content": body.brief}, {"role": "assistant", "content": f"تم إنشاء موقعك بقالب {tpl['name']}. عدّل أي قسم من المحرر المرئي."}],
            "created_at": now, "updated_at": now,
        }
        await database.website_projects.insert_one(d)
        d.pop("_id", None)
        return d

    app.include_router(r)
    return r
