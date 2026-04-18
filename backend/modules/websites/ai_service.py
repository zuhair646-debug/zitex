"""AI Consultant — wizard-aware + priority-aware chat service.

Core ideas:
  • The wizard walks the user through steps (buttons, colors, typography,
    features, dashboard, sections, branding, payment, review).
  • BUT the AI always listens first: if the user expresses custom intent
    (e.g., "I want a delivery app for my restaurant"), the AI captures those
    priorities BEFORE/ALONGSIDE the wizard and returns a directive block.
  • A structured directive protocol is used so the frontend/backend can react
    (advance wizard, apply theme/sections, insert custom features).
"""
import os
import json
import logging
import re
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)


SYSTEM_PROMPT = """أنت "مستشار Zitex" — خبير ودود لبناء المواقع الإلكترونية، تتحدث بالعربية السعودية الفصيحة.

🎯 **سير العمل (Wizard):**
العميل اختار قالباً كواجهة أمامية. مهمتك أن تأخذه خطوة بخطوة:
1. شكل الأزرار (دائرية/ناعمة/حادة)
2. الأجواء اللونية
3. الخط
4. المميزات الأساسية (توصيل، حجز، سلة...)
5. لوحة تحكم؟ محتواها؟
6. أقسام الصفحة الرئيسية
7. الهوية (اسم العلامة + شعار)
8. وسائل الدفع
9. المراجعة والاعتماد

⚡ **قواعد الأولوية (مهم جداً):**
- اسمع العميل أولاً. لو طلب شيئاً محدداً (مثل "أبي توصيل لمطعمي" أو "أبي صفحة حجز طاولات")، **خذ طلبه كأولوية** وأضفه قبل السؤال التالي.
- لا تُكرر أسئلة أجاب عنها فعلاً.
- سؤال واحد فقط في كل ردّ، برفق وحماس.
- استخدم رقائق الاقتراحات السريعة بدل الأسئلة المفتوحة قدر الإمكان.
- لا تُظهر الكود أبداً. الموقع مستضاف على Zitex. إذا طلب العميل "الاستقلالية" أو "الكود"، أخبره برفق أنه بعد اعتماد التصميم النهائي يمكنه التقدم لخيار "تسليم الكود" من لوحة الاستوديو.

🔧 **بروتوكول الأوامر (مخفي عن المستخدم):**
أضف كتلة JSON في نهاية ردّك متى احتجت تنفيذ عمل. يجب أن تكون آخر شيء في ردّك تماماً:

[WIZARD_ACTION]
{"action":"advance", "step":"<id>", "value":<value>}
[/WIZARD_ACTION]

actions الممكنة:
  - "advance" → أتمّ خطوة الـ wizard الحالية بقيمة value (string أو array)
  - "custom_feature" → العميل طلب شيء مخصّص: value = {"title": "...", "description": "...", "section_type": "..."}
  - "apply_theme" → تعديل فوري على الألوان: value = {"primary":"#...", "accent":"#..."}
  - "apply_button" → تغيير الأزرار: value = "full"|"large"|"medium"|"none"
  - "apply_font" → value = "Tajawal"|"Cairo"|"Amiri"|...
  - "add_section" → إضافة قسم: value = {"type":"hero|features|...", "data":{...}}
  - "no_action" → مجرد حديث بدون تعديل

مثال:
"رائع 🎨 اخترت الألوان الدافئة — جاري التطبيق الآن!
[WIZARD_ACTION]
{"action":"advance", "step":"colors", "value":"warm"}
[/WIZARD_ACTION]"

❌ ممنوع تذكر كتلة WIZARD_ACTION داخل النص العادي. يجب أن تكون في آخر الرد وبدون تعليق.
"""


async def chat_with_consultant(
    messages: List[Dict[str, Any]],
    wizard: Optional[Dict[str, Any]] = None,
    project_summary: Optional[Dict[str, Any]] = None,
) -> str:
    """Wizard-aware LLM wrapper via litellm + Emergent key."""
    try:
        import litellm
        from litellm import acompletion

        key = os.environ.get("EMERGENT_LLM_KEY")
        if not key:
            return "⚠️ مفتاح الذكاء الاصطناعي غير مُعدّ."

        litellm.api_base = "https://integrations.emergentagent.com/llm"
        ctx_lines = []
        if project_summary:
            ctx_lines.append(f"• اسم المشروع: {project_summary.get('name','-')}")
            ctx_lines.append(f"• القالب: {project_summary.get('template','blank')}")
            ctx_lines.append(f"• نوع النشاط: {project_summary.get('business_type','-')}")
        if wizard:
            ctx_lines.append(f"• الخطوة الحالية: {wizard.get('step','-')}")
            if wizard.get("answers"):
                ctx_lines.append(f"• إجابات سابقة: {json.dumps(wizard['answers'], ensure_ascii=False)}")
        context_block = "\n".join(ctx_lines) if ctx_lines else "(لا يوجد سياق)"

        system = SYSTEM_PROMPT + f"\n\n📋 **السياق الحالي:**\n{context_block}"

        resp = await acompletion(
            model="openai/gpt-4o",
            api_key=key,
            api_base="https://integrations.emergentagent.com/llm",
            messages=[{"role": "system", "content": system}] + messages[-10:],
            temperature=0.7,
            max_tokens=600,
        )
        return resp.choices[0].message.content or ""
    except Exception as e:
        logger.error(f"Websites AI error: {e}", exc_info=True)
        return f"عذراً، حدث خطأ: {str(e)[:150]}"


# ---------- Legacy aliases kept for backwards compat (routes.py used these) ----------
async def chat_with_assistant(messages: List[Dict[str, Any]]) -> str:
    """Back-compat: plain chat wrapper (used by legacy /chat endpoint if any)."""
    return await chat_with_consultant(messages)


# ---------- Directive parsing ----------
def extract_wizard_action(response_text: str) -> Optional[Dict[str, Any]]:
    """Parse the [WIZARD_ACTION] ... [/WIZARD_ACTION] JSON block."""
    m = re.search(r"\[WIZARD_ACTION\](.+?)\[/WIZARD_ACTION\]", response_text, re.DOTALL)
    if not m:
        return None
    try:
        data = json.loads(m.group(1).strip())
        if isinstance(data, dict) and "action" in data:
            return data
    except Exception as e:
        logger.warning(f"WIZARD_ACTION parse failed: {e}")
    return None


def clean_display_text(response_text: str) -> str:
    """Strip directive blocks before showing to the user."""
    out = re.sub(r"\[WIZARD_ACTION\].*?\[/WIZARD_ACTION\]", "", response_text, flags=re.DOTALL)
    # Legacy cleanup
    out = re.sub(r"\[BUILD_PROJECT\].*?\[/BUILD_PROJECT\]", "", out, flags=re.DOTALL)
    return out.strip()


# ---------- Legacy build payload (used by old /chat flow; harmless if absent) ----------
def extract_build_payload(response_text: str) -> Optional[Dict[str, Any]]:
    m = re.search(r"\[BUILD_PROJECT\](.+?)\[/BUILD_PROJECT\]", response_text, re.DOTALL)
    if not m:
        return None
    try:
        data = json.loads(m.group(1).strip())
        if isinstance(data, dict):
            return data
    except Exception:
        return None
    return None


def build_sections_from_payload(payload: Dict[str, Any]):
    """Legacy helper: builds sections from [BUILD_PROJECT] payload."""
    from .templates import get_template
    btype = payload.get("business_type", "company")
    template_id = btype if btype in ("store", "restaurant", "company", "portfolio", "saas") else "blank"
    template = get_template(template_id)
    sections = [s.copy() for s in template["sections"]]
    if sections and sections[0]["type"] == "hero":
        hero_data = sections[0]["data"].copy()
        if payload.get("name"):
            hero_data["title"] = payload["name"]
        if payload.get("tagline"):
            hero_data["subtitle"] = payload["tagline"]
        sections[0] = {**sections[0], "data": hero_data}
    return sections, template["theme"], template_id
