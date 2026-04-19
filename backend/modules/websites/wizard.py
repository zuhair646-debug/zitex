"""Consultative Wizard Engine — guided step-by-step website building.

Flow:
  1. template_chosen   → user picked a template shell
  2. buttons           → button style (rounded/square/pill/sharp)
  3. colors            → color mood (classic/modern/warm/dark/pastel...)
  4. typography        → font style (modern/elegant/playful)
  5. features          → core extras (delivery, reservation, cart, booking...)
  6. dashboard         → admin dashboard yes/no
  7. dashboard_items   → (if yes) what's inside the dashboard
  8. sections          → which content sections to include
  9. content_detail    → fill real content for each section
 10. branding          → logo, brand name, tagline
 11. review            → show final preview
 12. finalize          → payment integration & contact form
 13. done              → site ready; chat becomes free-form

AI may SKIP or REORDER steps if user explicitly asks for something out-of-order
(e.g., "I want delivery for my restaurant" while on step 2).
"""
from typing import List, Dict, Any, Optional


# ---------------------------------------------------------------------------
# Step definitions
# ---------------------------------------------------------------------------
STEPS: List[Dict[str, Any]] = [
    {
        "id": "brief",
        "title": "وصف النشاط",
        "question": "✨ صف لي نشاطك بحرّية — كلما كان وصفك أغنى، كان تصميمي أكثر إبداعاً.",
        "chips": [],
        "render": "free_text",
        "free_text": True,
        "applies": "brief",
        # Only active when template is 'blank' or user explicitly requests a custom start
        "condition": lambda ans: ans.get("__show_brief__", False),
    },
    {
        "id": "variant",
        "title": "النمط البصري",
        "question": "ممتاز! ✨ اخترت هذا القالب. الآن اختر النمط البصري — كل نمط مختلف بألوانه وإحساسه:",
        "chips": [],   # rendered as rich variant-picker in UI
        "render": "variants",
        "applies": "variant",
    },
    {
        "id": "buttons",
        "title": "شكل الأزرار",
        "question": "جميل! الآن أخبرني — ما شكل الأزرار اللي يعجبك؟",
        "chips": [
            {"id": "pill",    "label": "دائرية كاملة",    "value": "full"},
            {"id": "rounded", "label": "زوايا ناعمة",     "value": "large"},
            {"id": "medium",  "label": "زوايا متوسطة",    "value": "medium"},
            {"id": "sharp",   "label": "حادة (مستطيلة)",   "value": "none"},
        ],
        "render": "chips",
        "applies": "button_radius",
    },
    {
        "id": "colors",
        "title": "الأجواء اللونية",
        "question": "رائع! الآن اختر الأجواء اللونية اللي تناسب نشاطك:",
        "chips": [
            {"id": "classic",  "label": "كلاسيكي ذهبي",   "value": "classic"},
            {"id": "modern",   "label": "عصري أزرق",      "value": "modern"},
            {"id": "warm",     "label": "دافئ برتقالي",   "value": "warm"},
            {"id": "luxury",   "label": "فاخر ذهبي-أسود", "value": "luxury"},
            {"id": "dark_pro", "label": "داكن احترافي",    "value": "dark_pro"},
            {"id": "nature",   "label": "طبيعي أخضر",     "value": "nature"},
            {"id": "pastel",   "label": "هادئ باستيل",    "value": "pastel"},
            {"id": "bold",     "label": "جريء أحمر",      "value": "bold"},
        ],
        "applies": "color_variant",
    },
    {
        "id": "typography",
        "title": "الخط",
        "question": "ممتاز 🎨 أي خط تفضّل لموقعك؟",
        "chips": [
            {"id": "Tajawal",    "label": "تجوال (عصري متوازن)", "value": "Tajawal"},
            {"id": "Cairo",      "label": "القاهرة (واضح)",       "value": "Cairo"},
            {"id": "Amiri",      "label": "أميري (فخم كلاسيكي)",  "value": "Amiri"},
            {"id": "Readex Pro", "label": "ريدكس (ناعم حديث)",     "value": "Readex Pro"},
            {"id": "Almarai",    "label": "المراعي (نظيف)",       "value": "Almarai"},
        ],
        "applies": "font",
    },
    {
        "id": "features",
        "title": "المميزات الأساسية",
        "question": "تمام 👌 أي من هذه الخدمات تحتاجها في موقعك؟ (اختر عدة)",
        "chips": [
            {"id": "delivery",    "label": "🛵 خدمة توصيل"},
            {"id": "reservation", "label": "📅 حجز مسبق"},
            {"id": "cart",        "label": "🛒 عربة تسوق"},
            {"id": "booking",     "label": "⏰ حجز مواعيد"},
            {"id": "whatsapp",    "label": "💬 تواصل واتساب"},
            {"id": "map",         "label": "📍 خريطة الموقع"},
            {"id": "reviews",     "label": "⭐ تقييمات العملاء"},
            {"id": "newsletter",  "label": "📧 نشرة بريدية"},
        ],
        "multi": True,
        "applies": "features_list",
    },
    {
        "id": "dashboard",
        "title": "لوحة تحكم",
        "question": "هل تحتاج لوحة تحكم (Dashboard) لإدارة موقعك؟",
        "chips": [
            {"id": "admin",    "label": "✅ نعم — لوحة للمالك/الإدارة", "value": "admin"},
            {"id": "customer", "label": "👤 نعم — لوحة للعملاء",        "value": "customer"},
            {"id": "both",     "label": "⚡ الاثنتين معاً",               "value": "both"},
            {"id": "none",     "label": "❌ لا، مو محتاجها حالياً",      "value": "none"},
        ],
        "applies": "dashboard_type",
    },
    {
        "id": "dashboard_items",
        "title": "محتويات لوحة التحكم",
        "question": "ممتاز! ما الذي تريده في لوحة التحكم؟",
        "chips": [
            {"id": "orders",    "label": "📦 الطلبات"},
            {"id": "customers", "label": "👥 العملاء"},
            {"id": "products",  "label": "🏷️ المنتجات"},
            {"id": "analytics", "label": "📊 الإحصائيات"},
            {"id": "messages",  "label": "💬 الرسائل"},
            {"id": "reports",   "label": "📈 التقارير"},
            {"id": "users",     "label": "🔐 المستخدمون والأدوار"},
            {"id": "settings",  "label": "⚙️ الإعدادات"},
        ],
        "multi": True,
        "condition": lambda ans: ans.get("dashboard") and ans.get("dashboard") != "none",
        "applies": "dashboard_items",
    },
    {
        "id": "sections",
        "title": "أقسام الموقع",
        "question": "الآن اختر الأقسام اللي تريدها في صفحتك الرئيسية:",
        "chips": [
            {"id": "hero",         "label": "🎯 قسم رئيسي (Hero)"},
            {"id": "about",        "label": "📖 من نحن"},
            {"id": "features",     "label": "✨ مميزاتنا"},
            {"id": "menu",         "label": "🍽️ قائمة الطعام"},
            {"id": "products",     "label": "🛍️ المنتجات"},
            {"id": "gallery",      "label": "🖼️ معرض صور"},
            {"id": "testimonials", "label": "💬 آراء العملاء"},
            {"id": "team",         "label": "👥 الفريق"},
            {"id": "pricing",      "label": "💰 خطط الأسعار"},
            {"id": "faq",          "label": "❓ أسئلة شائعة"},
            {"id": "contact",      "label": "📞 تواصل معنا"},
            {"id": "cta",          "label": "📢 دعوة للتسجيل"},
        ],
        "multi": True,
        "applies": "sections_list",
    },
    {
        "id": "branding",
        "title": "الهوية",
        "question": "أخبرني عن هوية نشاطك — ما اسم العلامة التجارية وشعارها؟",
        "chips": [],  # free text only
        "free_text": True,
        "applies": "branding",
    },
    {
        "id": "payment",
        "title": "وسائل الدفع",
        "question": "ممتاز 💳 ما وسائل الدفع التي تريد دعمها؟",
        "chips": [
            {"id": "stripe",   "label": "💳 Stripe (فيزا/ماستركارد)"},
            {"id": "mada",     "label": "🏦 مدى"},
            {"id": "applepay", "label": "📱 Apple Pay"},
            {"id": "stcpay",   "label": "💰 STC Pay"},
            {"id": "paypal",   "label": "🅿️ PayPal"},
            {"id": "cod",      "label": "💵 الدفع عند الاستلام"},
            {"id": "bank",     "label": "🏛️ تحويل بنكي"},
            {"id": "none",     "label": "لا أحتاج دفع حالياً"},
        ],
        "multi": True,
        "applies": "payment_methods",
    },
    {
        "id": "review",
        "title": "مراجعة",
        "question": "🎉 تمّت كل الأسئلة! راجع المعاينة على اليسار — أي تعديل اكتبه لي الآن ونطبقه مباشرة. لما تكون جاهز، اضغط 'اعتماد نهائي'.",
        "chips": [
            {"id": "approve", "label": "✅ اعتماد نهائي"},
            {"id": "change_colors", "label": "🎨 تغيير الألوان"},
            {"id": "change_buttons", "label": "🔘 تغيير الأزرار"},
            {"id": "add_section", "label": "➕ إضافة قسم"},
        ],
        "applies": "review_action",
    },
]


# ---------------------------------------------------------------------------
# Color variant map (re-uses variants.py themes)
# ---------------------------------------------------------------------------
COLOR_VARIANT_MAP = {
    "classic":  {"primary": "#D4AF37", "secondary": "#1a1f3a", "accent": "#8B0000"},
    "modern":   {"primary": "#3B82F6", "secondary": "#0f172a", "accent": "#22D3EE"},
    "warm":     {"primary": "#F59E0B", "secondary": "#18181b", "accent": "#EF4444"},
    "luxury":   {"primary": "#D4AF37", "secondary": "#0a0a0a", "accent": "#B8860B", "background": "#0a0a0a"},
    "dark_pro": {"primary": "#06B6D4", "secondary": "#020617", "accent": "#F59E0B", "background": "#020617"},
    "nature":   {"primary": "#10B981", "secondary": "#064e3b", "accent": "#F59E0B"},
    "pastel":   {"primary": "#A78BFA", "secondary": "#FDF2F8", "accent": "#F472B6", "background": "#FDF2F8", "text": "#581c87"},
    "bold":     {"primary": "#DC2626", "secondary": "#18181b", "accent": "#FBBF24"},
    "minimal":  {"primary": "#000000", "secondary": "#ffffff", "accent": "#6B7280", "background": "#ffffff", "text": "#18181b"},
}


RADIUS_MAP = {
    "full": "full", "large": "large", "medium": "medium", "none": "none",
}


# ---------------------------------------------------------------------------
# State helpers
# ---------------------------------------------------------------------------
def default_wizard_state() -> Dict[str, Any]:
    return {
        "active": True,
        "step": "variant",
        "answers": {},
        "completed": [],
    }


def get_step(step_id: str) -> Optional[Dict[str, Any]]:
    for s in STEPS:
        if s["id"] == step_id:
            return s
    return None


def next_step_id(current: str, answers: Dict[str, Any]) -> Optional[str]:
    """Return the next step id after `current`, applying conditional skips."""
    ids = [s["id"] for s in STEPS]
    try:
        idx = ids.index(current)
    except ValueError:
        return STEPS[0]["id"]
    for s in STEPS[idx + 1:]:
        cond = s.get("condition")
        if cond and not cond(answers):
            continue
        return s["id"]
    return None  # end


def get_chips_for_step(step_id: str) -> List[Dict[str, Any]]:
    s = get_step(step_id)
    return (s or {}).get("chips", []) or []


def get_question_for_step(step_id: str) -> str:
    s = get_step(step_id)
    return (s or {}).get("question", "")


def steps_metadata() -> List[Dict[str, Any]]:
    """Public list (without python callables)."""
    out = []
    for s in STEPS:
        out.append({k: v for k, v in s.items() if k != "condition"})
    return out


# ---------------------------------------------------------------------------
# Apply a wizard answer to the project
# ---------------------------------------------------------------------------
def apply_answer(project: Dict[str, Any], step_id: str, value: Any) -> Dict[str, Any]:
    """Mutate-and-return project after applying the answer for `step_id`.
    Always keeps theme/sections consistent with the chosen template shell."""
    theme = dict(project.get("theme") or {})
    wizard = project.get("wizard") or default_wizard_state()
    ans = dict(wizard.get("answers") or {})

    if step_id == "variant":
        # Apply the chosen visual variant theme (preserves template sections)
        from .variants import STYLE_VARIANTS
        v = next((x for x in STYLE_VARIANTS if x["id"] == str(value)), None)
        if v:
            theme.update(v["theme_override"])
        ans["variant"] = value
    elif step_id == "buttons":
        # value is radius token (full/large/medium/none)
        theme["radius"] = RADIUS_MAP.get(str(value), "medium")
        ans["buttons"] = value
    elif step_id == "colors":
        palette = COLOR_VARIANT_MAP.get(str(value))
        if palette:
            theme.update(palette)
        ans["colors"] = value
    elif step_id == "typography":
        theme["font"] = str(value) or "Tajawal"
        ans["typography"] = value
    elif step_id == "features":
        ans["features"] = value if isinstance(value, list) else [value]
    elif step_id == "dashboard":
        ans["dashboard"] = value
    elif step_id == "dashboard_items":
        ans["dashboard_items"] = value if isinstance(value, list) else [value]
    elif step_id == "sections":
        ans["sections_wanted"] = value if isinstance(value, list) else [value]
        project = _apply_sections_selection(project, ans["sections_wanted"])
    elif step_id == "branding":
        ans["branding"] = value  # free text
        project = _apply_branding(project, str(value))
    elif step_id == "payment":
        ans["payment"] = value if isinstance(value, list) else [value]
    elif step_id == "review":
        ans["review"] = value

    wizard["answers"] = ans
    wizard["completed"] = list(dict.fromkeys((wizard.get("completed") or []) + [step_id]))
    nxt = next_step_id(step_id, ans)
    wizard["step"] = nxt or "done"
    if not nxt:
        wizard["active"] = False

    project["theme"] = theme
    project["wizard"] = wizard
    return project


def _apply_sections_selection(project: Dict[str, Any], wanted: List[str]) -> Dict[str, Any]:
    """Keep only wanted sections (preserving order + data) + ensure footer at end."""
    if not wanted:
        return project
    current = project.get("sections") or []
    kept, seen = [], set()
    # preserve order of existing sections that are wanted
    for s in current:
        t = s.get("type")
        if t in wanted and t not in seen:
            kept.append(s)
            seen.add(t)
    # add any wanted that weren't in current (minimal stubs)
    for t in wanted:
        if t not in seen:
            kept.append({"type": t, "order": len(kept), "visible": True, "data": _default_data_for_type(t)})
            seen.add(t)
    # ensure footer last
    if "footer" not in seen:
        kept.append({"type": "footer", "order": len(kept), "visible": True, "data": {"brand": (project.get("name") or "موقعي")}})
    project["sections"] = [{**s, "order": i} for i, s in enumerate(kept)]
    return project


def _default_data_for_type(t: str) -> Dict[str, Any]:
    defaults = {
        "hero":         {"title": "عنوان رئيسي", "subtitle": "عنوان فرعي", "cta_text": "ابدأ الآن", "layout": "split"},
        "features":     {"title": "مميزاتنا", "items": [{"icon": "✨", "title": "ميزة", "text": "وصف"}]},
        "about":        {"title": "من نحن", "text": "اكتب نبذة عن نشاطك."},
        "products":     {"title": "منتجاتنا", "items": []},
        "menu":         {"title": "القائمة", "categories": []},
        "gallery":      {"title": "معرض الصور", "images": []},
        "testimonials": {"title": "آراء العملاء", "items": []},
        "team":         {"title": "فريقنا", "members": []},
        "pricing":      {"title": "الأسعار", "plans": []},
        "faq":          {"title": "أسئلة شائعة", "items": []},
        "contact":      {"title": "تواصل معنا", "email": "", "phone": ""},
        "cta":          {"title": "جاهز للبدء؟", "cta_text": "انضم إلينا"},
        "footer":       {"brand": "موقعي"},
    }
    return defaults.get(t, {"title": t})


def _apply_branding(project: Dict[str, Any], text: str) -> Dict[str, Any]:
    """Very small heuristic: use the user's text as brand/title."""
    if not text:
        return project
    text = text.strip()
    project["name"] = text[:80]
    sections = project.get("sections") or []
    for s in sections:
        if s.get("type") == "hero":
            s["data"] = {**(s.get("data") or {}), "title": text[:60]}
        if s.get("type") == "footer":
            s["data"] = {**(s.get("data") or {}), "brand": text[:40]}
    project["sections"] = sections
    return project
