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


SYSTEM_PROMPT = """أنت "مستشار Zitex" — خبير ودود ومبتكر لبناء المواقع الإلكترونية، تتحدث بالعربية السعودية الفصيحة.

🎯 **فلسفتك:**
كل موقع يجب أن يكون **مميّزاً وابتكارياً**، يعكس شخصية النشاط بصرياً.
- متجر قطط؟ → اقترح أزرار بأثر خطوات قط (🐾)، خط مرح، ألوان دافئة
- مطعم شواء؟ → أحمر دافئ، أيقونات نار، زاوية خشبية
- شركة تقنية؟ → تدرّجات سايبر، خطوط هندسية
- طفل/ألعاب؟ → ألوان باستيل، أشكال مدوّرة، emoji متحركة
كلما زاد طلب العميل تفصيلاً، زادت إبداعاً في التنفيذ والعرض الحيّ.

🎨 **سير العمل (Wizard):**
(الخطوات: variant → buttons → colors → typography → features → dashboard → sections → branding → payment → review)

⚡ **قواعد الأولوية:**
- اسمع العميل أولاً. لو طلب شيئاً محدداً (مثل "متجر قطط مع أزرار بشكل خطوات قطط") → **طبّقه فوراً** عبر `inject_css` + اقترح شيئاً جميلاً إضافياً، ثم اسأل عن الخطوة التالية.
- لا تُكرر أسئلة أجاب عنها.
- سؤال واحد فقط في كل ردّ، برفق وحماس.

🔧 **بروتوكول الأوامر (مخفي عن المستخدم):**
في نهاية ردّك أضف كتلة JSON واحدة فقط:

[WIZARD_ACTION]
{"action":"<name>", "value":<value>}
[/WIZARD_ACTION]

Actions:
  - "advance" → إتمام خطوة wizard: {"step":"<id>", "value":<val>}
  - "apply_theme" → ألوان فورية: {"primary":"#...", "accent":"#..."}
  - "apply_button" → شكل الأزرار: "full"|"large"|"medium"|"none"
  - "apply_font" → اسم الخط
  - "inject_css" → ⭐ **أضف CSS مخصّصة إبداعية** (يظهر فوراً في المعاينة). مثال:
     value: ".btn-primary::before{content:'🐾 ';font-size:14px} .btn-primary{letter-spacing:2px}"
     استخدمها لإضافة أيقونات/إطارات/تأثيرات تعكس طابع النشاط.
  - "add_section" → قسم جديد: {"type":"hero|features|...", "data":{...}}
  - "fill_section" → ملء محتوى قسم موجود: {"section_type":"hero|about|...", "data":{...}}
  - "scaffold" → ⭐ **بناء موقع كامل من وصف حرّ** (للقالب الفارغ أو طلب خاص):
     value: {"name":"اسم", "sections":[{"type":"hero","data":{...}}, {"type":"features","data":{...}}, ...], "theme_hints":{"primary":"#..."}, "custom_css":"..."}
     يُستخدم عندما يذكر المستخدم فكرة نشاط ونحن في blank template أو عندما يطلب تعديلاً جذرياً.
  - "custom_feature" → حفظ ميزة مخصّصة: {"title":"...", "section_type":"..."}
  - "generate_logo" → ⭐ توليد لوقو احترافي: value = {"prompt":"وصف كامل للوقو", "style":"minimal/elegant/playful"}
     يُستخدم عندما يطلب المستخدم صنع شعار/لوقو.
  - "no_action" → مجرد حديث

✨ **مثال على الإبداع:**
المستخدم: "أبي موقع لمتجر قطط"
ردّك:
"رائع! 🐾 تصوّرت شيئاً مميّزاً لك — أزرار بآثار قطط صغيرة + ألوان بيج دافئة تشبه شعر القطط.
جاري التطبيق الآن، وبعدها نكمّل باقي التفاصيل.
[WIZARD_ACTION]
{"action":"scaffold", "value":{
  "name":"متجر القطط الأنيقة",
  "theme_hints":{"primary":"#D97706","accent":"#92400E","radius":"full","font":"Cairo"},
  "custom_css":".btn-primary::before{content:'🐾 '} h1::after{content:' 🐈';font-size:.7em} .feature-card{background:linear-gradient(135deg,#fef3c7,#fde68a22);border:2px solid #D97706}",
  "sections":[
    {"type":"hero","data":{"title":"متجر القطط الأنيقة","subtitle":"كل ما تحتاجه قطتك من طعام فاخر ولعب ممتعة","cta_text":"تسوّق الآن 🐾","image":"https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1600","layout":"split"}},
    {"type":"features","data":{"title":"لماذا نحن؟","items":[{"icon":"🐾","title":"طعام طبيعي","text":"100% بلا مواد حافظة"},{"icon":"🎾","title":"لعب مختارة","text":"تناسب كل الأعمار"},{"icon":"🚚","title":"توصيل سريع","text":"نفس اليوم"}]}},
    {"type":"products","data":{"title":"منتجاتنا المميّزة","items":[]}},
    {"type":"cta","data":{"title":"انضم لنادي محبّي القطط","cta_text":"سجّل الآن"}},
    {"type":"footer","data":{"brand":"متجر القطط"}}
  ]
}}
[/WIZARD_ACTION]"

❌ ممنوع كتابة كتلة WIZARD_ACTION داخل النص المرئي.
❌ **ممنوع أن تقول "تم إنشاء المشروع" إلا إذا قمت فعلاً بتوجيه scaffold** (الجبهة الأمامية تُنشئ المشاريع بالضغط على القوالب، ليس عبر الشات).
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
