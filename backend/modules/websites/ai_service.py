"""AI chat service — Website Consultant.

Consultative, step-by-step chat that helps the user design a website.
Uses Emergent LLM Key via litellm."""
import os
import json
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """أنت "مستشار Zitex" لإنشاء المواقع الإلكترونية — ودود، محترف، وتتحدث بالعربية السعودية الفصيحة.

مهمتك:
- تفهم نشاط العميل (متجر / مطعم / شركة / بورتفوليو / SaaS / عقارات / مدوّنة)
- تقترح عليه قالباً مناسباً من بين: store, restaurant, company, portfolio, saas, blank
- تسأله أسئلة بسيطة وعملية واحدة في كل مرة (٣-٥ أسئلة بحد أقصى)
- بعد جمع المعلومات، تقدم خطة محتوى جاهزة للتنفيذ

قواعد التفاعل:
- لا تكرر نفس السؤال مرتين
- تفاعل بحماس وإيجابية
- اقترح ألواناً ونبرة بناءً على القطاع
- عند اكتمال المعلومات، أنشئ JSON مخفياً في آخر ردّك بهذا الشكل فقط عندما تكون جاهزاً للبناء:
[BUILD_PROJECT]
{"business_type":"store|restaurant|company|portfolio|saas", "name":"اسم الموقع","tagline":"عنوان فرعي","description":"وصف النشاط","sections":["hero","features","about","products","testimonials","contact","footer"],"colors":{"primary":"#...", "accent":"#..."}, "content_hints":"..."}
[/BUILD_PROJECT]

لا تُظهر أبداً علامات [BUILD_PROJECT] قبل أن يوافق العميل على البدء.
ابدأ بسؤال واحد فقط: "ما نوع نشاطك؟" أو "أخبرني عن مشروعك"."""


async def chat_with_assistant(messages: List[Dict[str, Any]]) -> str:
    """Simple LLM wrapper using litellm + Emergent key."""
    try:
        import litellm
        from litellm import acompletion

        key = os.environ.get("EMERGENT_LLM_KEY")
        if not key:
            return "⚠️ مفتاح الذكاء الاصطناعي غير مُعدّ. راجع إعدادات الموقع."

        # Use emergent proxy endpoint
        litellm.api_base = "https://integrations.emergentagent.com/llm"
        resp = await acompletion(
            model="openai/gpt-4o",
            api_key=key,
            api_base="https://integrations.emergentagent.com/llm",
            messages=[{"role": "system", "content": SYSTEM_PROMPT}] + messages[-12:],
            temperature=0.7,
            max_tokens=600,
        )
        return resp.choices[0].message.content or ""
    except Exception as e:
        logger.error(f"Website AI error: {e}", exc_info=True)
        return f"عذراً، حدث خطأ: {str(e)[:150]}. حاول مرة أخرى."


def extract_build_payload(response_text: str) -> Optional[Dict[str, Any]]:
    """If the AI emitted a [BUILD_PROJECT] JSON block, parse it."""
    import re
    m = re.search(r"\[BUILD_PROJECT\](.+?)\[/BUILD_PROJECT\]", response_text, re.DOTALL)
    if not m:
        return None
    try:
        data = json.loads(m.group(1).strip())
        if isinstance(data, dict):
            return data
    except Exception as e:
        logger.warning(f"BUILD_PROJECT parse failed: {e}")
    return None


def clean_display_text(response_text: str) -> str:
    """Strip internal command blocks before showing to the user."""
    import re
    return re.sub(r"\[BUILD_PROJECT\].*?\[/BUILD_PROJECT\]", "", response_text, flags=re.DOTALL).strip()


def build_sections_from_payload(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Turn an AI build payload into actual website sections by cloning from templates."""
    from .templates import get_template
    btype = payload.get("business_type", "company")
    template_id = btype if btype in ("store", "restaurant", "company", "portfolio", "saas") else "blank"
    template = get_template(template_id)
    sections = [s.copy() for s in template["sections"]]

    # Apply AI-suggested hero title/subtitle
    if sections and sections[0]["type"] == "hero":
        hero_data = sections[0]["data"].copy()
        if payload.get("name"):
            hero_data["title"] = payload["name"]
        if payload.get("tagline"):
            hero_data["subtitle"] = payload["tagline"]
        sections[0] = {**sections[0], "data": hero_data}
    return sections, template["theme"], template_id
