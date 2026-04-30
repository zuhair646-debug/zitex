"""
Smart conversational Image Wizard endpoints.

Powers /chat/image — a deep multi-turn flow that adapts questions
based on the chosen image category (social_ad, product_shot, banner, portrait, scene).

Flow:
    1. POST /api/wizard/image/start     → returns the category-picker question
    2. POST /api/wizard/image/answer    → user picks category/answers a question
                                           → returns next question OR ready state
    3. POST /api/wizard/image/generate  → final generation via Gemini Nano Banana

Pricing:
    Standard:  5 points/image
    Premium:   10 points/image (higher detail, text-heavy scenes)
"""
from __future__ import annotations
import os
import uuid
import base64
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

CATEGORIES: Dict[str, Dict[str, Any]] = {
    "social_ad": {
        "label": "📱 إعلان سوشيال",
        "desc": "منشور للسوشيال ميديا",
        "questions": [
            {"id": "product",   "label": "وش المنتج/الخدمة اللي تبي تعلن لها؟",      "type": "text"},
            {"id": "offer",     "label": "فيه عرض أو سعر خاص؟",                     "type": "text", "optional": True},
            {"id": "audience",  "label": "مين الجمهور المستهدف؟",                    "type": "text"},
            {"id": "mood",      "label": "المزاج العام؟",                            "type": "select",
             "options": ["energetic", "luxurious", "playful", "minimal", "dramatic"]},
        ],
    },
    "product_shot": {
        "label": "🛍️ صورة منتج",
        "desc": "لقطة احترافية لمنتج واحد",
        "questions": [
            {"id": "product",    "label": "وش المنتج بالضبط؟",                       "type": "text"},
            {"id": "background", "label": "الخلفية؟ (بيضاء، خشبية، طبيعية...)",       "type": "text"},
            {"id": "lighting",   "label": "نوع الإضاءة؟",                            "type": "select",
             "options": ["golden_hour", "studio_bright", "soft_diffused", "dramatic_side", "natural_daylight"]},
            {"id": "extras",     "label": "عناصر إضافية؟ (زهور، ورق، ديكور...)",      "type": "text", "optional": True},
        ],
    },
    "banner": {
        "label": "🖼️ بنر سينمائي",
        "desc": "بنر أفقي لموقعك",
        "questions": [
            {"id": "concept",    "label": "وش الفكرة العامة؟",                       "type": "text"},
            {"id": "headline",   "label": "عبارة البنر (إذا بتضيفها كـوصف بصري)",     "type": "text", "optional": True},
            {"id": "scene",      "label": "وين يصير المشهد؟",                         "type": "text"},
            {"id": "style",      "label": "الأسلوب البصري؟",                          "type": "select",
             "options": ["cinematic", "modern", "retro", "futuristic", "minimal"]},
        ],
    },
    "portrait": {
        "label": "👤 بورتريه",
        "desc": "صورة شخص أو شخصية",
        "questions": [
            {"id": "subject",    "label": "صف الشخص (العمر، الشكل، الملابس)",         "type": "text"},
            {"id": "expression", "label": "التعبير؟ (ابتسامة، جدية، ثقة...)",          "type": "text"},
            {"id": "background", "label": "الخلفية؟",                                 "type": "text"},
            {"id": "style",      "label": "الأسلوب؟",                                 "type": "select",
             "options": ["realistic", "editorial", "3d_render", "illustration", "anime"]},
        ],
    },
    "scene": {
        "label": "🌆 مشهد/منظر",
        "desc": "مشهد خيالي أو حقيقي",
        "questions": [
            {"id": "location",   "label": "وين المشهد؟ (صحراء، مدينة، غابة...)",       "type": "text"},
            {"id": "time",       "label": "الوقت؟",                                   "type": "select",
             "options": ["sunrise", "daytime", "golden_hour", "sunset", "night", "storm"]},
            {"id": "elements",   "label": "عناصر مميزة في المشهد؟",                    "type": "text"},
            {"id": "mood",       "label": "الإحساس العام؟",                            "type": "select",
             "options": ["peaceful", "epic", "mysterious", "vibrant", "melancholic"]},
        ],
    },
    "food": {
        "label": "🍽️ طعام",
        "desc": "لقطة طعام شهية",
        "questions": [
            {"id": "dish",       "label": "وش الطبق؟",                                "type": "text"},
            {"id": "style_plate","label": "طريقة التقديم؟",                            "type": "select",
             "options": ["rustic_wood", "modern_ceramic", "traditional_saj", "minimal_white"]},
            {"id": "top_down",   "label": "زاوية التصوير؟",                            "type": "select",
             "options": ["top_down", "45_degree", "eye_level", "close_macro"]},
            {"id": "extras",     "label": "عناصر حوله؟ (بهارات، خضار...)",             "type": "text", "optional": True},
        ],
    },
}

QUALITY_TIERS = [
    {"id": "standard", "label": "عادي",   "cost": 5,  "desc": "مناسب للسوشيال ميديا اليومي"},
    {"id": "premium",  "label": "فاخر",   "cost": 10, "desc": "تفاصيل أعلى، مناسب للإعلانات"},
]

ASPECT_OPTIONS = [
    {"id": "1:1",  "label": "مربع 1:1",     "desc": "منشورات سوشيال"},
    {"id": "9:16", "label": "عمودي 9:16",  "desc": "Story / Reels"},
    {"id": "16:9", "label": "أفقي 16:9",   "desc": "بنر / YouTube"},
    {"id": "4:5",  "label": "بورتريه 4:5", "desc": "Instagram"},
]


class WizardStartIn(BaseModel):
    pass


class WizardAnswerIn(BaseModel):
    session_id: str
    answer: Any


class WizardGenerateIn(BaseModel):
    session_id: str


def create_image_wizard_router(db, get_current_user) -> APIRouter:
    router = APIRouter(prefix="/api/wizard/image", tags=["image-wizard"])

    async def _get_credits(user_id: str) -> int:
        u = await db.users.find_one({"id": user_id}, {"_id": 0, "credits": 1})
        return (u or {}).get("credits", 0) or 0

    @router.get("/categories")
    async def get_categories():
        return {
            "categories": [
                {"id": k, "label": v["label"], "desc": v["desc"]} for k, v in CATEGORIES.items()
            ],
            "quality_tiers": QUALITY_TIERS,
            "aspect_options": ASPECT_OPTIONS,
        }

    @router.post("/start")
    async def wizard_start(_: WizardStartIn, user=Depends(get_current_user)):
        sid = str(uuid.uuid4())
        await db.image_wizard_sessions.insert_one({
            "id": sid,
            "user_id": user["user_id"],
            "category": None,
            "answers": {},
            "step": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        return {
            "session_id": sid,
            "next_question": {
                "kind": "category_picker",
                "label": "هلا! يلا نصمم صورة تجنن 💫 أول شي، وش نوع الصورة؟",
                "options": [{"id": k, "label": v["label"], "desc": v["desc"]} for k, v in CATEGORIES.items()],
            },
        }

    @router.post("/answer")
    async def wizard_answer(payload: WizardAnswerIn, user=Depends(get_current_user)):
        sess = await db.image_wizard_sessions.find_one(
            {"id": payload.session_id, "user_id": user["user_id"]}, {"_id": 0}
        )
        if not sess:
            raise HTTPException(404, "session not found")

        # Step 0: category
        if not sess.get("category"):
            cat = str(payload.answer)
            if cat not in CATEGORIES:
                raise HTTPException(400, "invalid category")
            await db.image_wizard_sessions.update_one(
                {"id": payload.session_id},
                {"$set": {"category": cat, "step": 1}}
            )
            first_q = CATEGORIES[cat]["questions"][0]
            total = len(CATEGORIES[cat]["questions"]) + 2
            return {
                "next_question": {**first_q, "kind": "category_question", "step_label": f"1 / {total}"},
                "category": cat,
                "category_label": CATEGORIES[cat]["label"],
            }

        cat = sess["category"]
        questions = CATEGORIES[cat]["questions"]
        step = sess.get("step", 1)
        total = len(questions) + 2

        # Category question answered
        if step <= len(questions):
            current_q = questions[step - 1]
            answers = dict(sess.get("answers") or {})
            answers[current_q["id"]] = payload.answer
            new_step = step + 1
            await db.image_wizard_sessions.update_one(
                {"id": payload.session_id},
                {"$set": {"answers": answers, "step": new_step}}
            )
            if new_step <= len(questions):
                next_q = questions[new_step - 1]
                return {
                    "next_question": {**next_q, "kind": "category_question",
                                      "step_label": f"{new_step} / {total}"},
                }
            # Done with category Qs → ask aspect
            return {
                "next_question": {
                    "kind": "aspect_picker",
                    "id": "aspect",
                    "label": "تمام! الحين اختر مقاس الصورة:",
                    "options": ASPECT_OPTIONS,
                    "step_label": f"{len(questions) + 1} / {total}",
                },
            }

        # Aspect
        if step == len(questions) + 1:
            aspect = str(payload.answer)
            if not any(a["id"] == aspect for a in ASPECT_OPTIONS):
                raise HTTPException(400, "invalid aspect")
            answers = dict(sess.get("answers") or {})
            answers["aspect_ratio"] = aspect
            await db.image_wizard_sessions.update_one(
                {"id": payload.session_id},
                {"$set": {"answers": answers, "step": step + 1}}
            )
            return {
                "next_question": {
                    "kind": "quality_picker",
                    "id": "quality",
                    "label": "آخر خطوة! اختر مستوى الجودة:",
                    "options": QUALITY_TIERS,
                    "step_label": f"{total} / {total}",
                },
            }

        # Quality → ready
        if step == len(questions) + 2:
            qid = str(payload.answer)
            tier = next((q for q in QUALITY_TIERS if q["id"] == qid), None)
            if not tier:
                raise HTTPException(400, "invalid quality")
            answers = dict(sess.get("answers") or {})
            answers["quality"] = qid
            answers["cost"] = tier["cost"]
            await db.image_wizard_sessions.update_one(
                {"id": payload.session_id},
                {"$set": {"answers": answers, "step": step + 1, "ready": True}}
            )
            credits = await _get_credits(user["user_id"])
            return {
                "ready": True,
                "summary": {
                    "category": cat,
                    "category_label": CATEGORIES[cat]["label"],
                    "answers": answers,
                    "estimated_cost": tier["cost"],
                    "credits_balance": credits,
                    "can_afford": credits >= tier["cost"],
                },
            }

        raise HTTPException(400, "wizard already complete")

    @router.get("/session/{session_id}")
    async def get_session(session_id: str, user=Depends(get_current_user)):
        sess = await db.image_wizard_sessions.find_one(
            {"id": session_id, "user_id": user["user_id"]}, {"_id": 0}
        )
        if not sess:
            raise HTTPException(404, "session not found")
        return sess

    @router.post("/generate")
    async def wizard_generate(payload: WizardGenerateIn, user=Depends(get_current_user)):
        sess = await db.image_wizard_sessions.find_one(
            {"id": payload.session_id, "user_id": user["user_id"]}, {"_id": 0}
        )
        if not sess or not sess.get("ready"):
            raise HTTPException(400, "session not ready")

        ans = sess.get("answers") or {}
        cat = sess["category"]
        cat_def = CATEGORIES[cat]

        # Compose prompt
        prompt_parts: List[str] = []
        prompt_parts.append(f"A professional {cat_def['desc']} image.")
        for q in cat_def["questions"]:
            v = ans.get(q["id"])
            if v:
                prompt_parts.append(f"{q['label']}: {v}")
        prompt_parts.append("High quality, professional composition, good lighting, detailed.")
        full_prompt = " ".join(str(p) for p in prompt_parts)

        cost = ans.get("cost", 5)
        # Deduct
        result = await db.users.update_one(
            {"id": user["user_id"], "credits": {"$gte": cost}},
            {"$inc": {"credits": -cost},
             "$push": {"credit_history": {
                 "amount": -cost,
                 "reason": f"image_wizard_{cat}_{ans.get('quality','standard')}",
                 "timestamp": datetime.now(timezone.utc).isoformat(),
             }}}
        )
        if result.modified_count == 0:
            raise HTTPException(402, f"رصيدك ما يكفي ({cost} نقطة مطلوبة)")

        try:
            from emergentintegrations.llm.gemini.image_generation import GeminiImageGeneration
            emergent_key = os.environ.get("EMERGENT_LLM_KEY")
            if not emergent_key:
                raise RuntimeError("EMERGENT_LLM_KEY not configured")

            gen = GeminiImageGeneration(api_key=emergent_key)
            logger.info(f"[IMAGE-WIZARD] Generating: cat={cat}, quality={ans.get('quality')}")
            images = await gen.generate_images(
                prompt=full_prompt,
                model="gemini-2.5-flash-image-preview",
                number_of_images=1,
            )
            if not images:
                raise RuntimeError("Empty image result")
            img_bytes = images[0]
            if not img_bytes:
                raise RuntimeError("Empty image bytes")

            image_id = str(uuid.uuid4())
            img_b64 = base64.b64encode(img_bytes).decode("utf-8")
            data_url = f"data:image/png;base64,{img_b64}"

            doc = {
                "id": image_id,
                "user_id": user["user_id"],
                "category": cat,
                "session_id": payload.session_id,
                "media_url": data_url,
                "prompt_used": full_prompt,
                "aspect_ratio": ans.get("aspect_ratio", "1:1"),
                "quality": ans.get("quality", "standard"),
                "credits_spent": cost,
                "answers": ans,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            await db.image_wizard_results.insert_one(doc.copy())
            await db.image_wizard_sessions.update_one(
                {"id": payload.session_id},
                {"$set": {"completed": True, "result_id": image_id}}
            )
            doc.pop("_id", None)
            return {
                "ok": True,
                "asset": {k: v for k, v in doc.items() if k != "_id"},
                "credits_spent": cost,
                "credits_remaining": await _get_credits(user["user_id"]),
            }
        except Exception as e:
            # Refund
            await db.users.update_one(
                {"id": user["user_id"]},
                {"$inc": {"credits": cost},
                 "$push": {"credit_history": {
                     "amount": cost,
                     "reason": f"refund_image_wizard_failed: {str(e)[:80]}",
                     "timestamp": datetime.now(timezone.utc).isoformat(),
                 }}}
            )
            logger.exception(f"[IMAGE-WIZARD] Generate failed: {e}")
            raise HTTPException(500, f"فشل توليد الصورة. تمت إعادة النقاط. ({str(e)[:120]})")

    return router
