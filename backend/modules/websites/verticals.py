"""Verticals — domain-specific configuration for generated sites.

Each vertical defines:
- wizard_questions: unique onboarding steps (overrides generic wizard)
- sections: list of section templates to pre-seed
- features: functional modules to enable (bookings | products | portfolio | orders)
- dashboard_tabs: tabs that should appear in ClientDashboard
- sample_data: seed content to demonstrate the template

Modules (reusable):
- orders   — restaurants/cafes (existing)
- bookings — salon, pets, medical, gym (appointment system)
- products — e-commerce, electronics (catalog + variants + inventory)
- portfolio — stocks (simulation only)
"""
from __future__ import annotations

VERTICALS = {
    # ────────────────────────────────────────────────────────────────
    "restaurant": {
        "id": "restaurant",
        "name_ar": "مطاعم ومقاهي",
        "icon": "🍽️",
        "color": "#D97706",
        "features": ["orders"],
        "checkout_type": "delivery",
        "dashboard_tabs": ["orders", "livemap", "customers", "drivers", "delivery", "payments", "coupons", "loyalty"],
        "wizard_questions": [
            {"id": "cuisine", "q": "ما نوع المطبخ الذي تقدّمه؟", "chips": ["شرقي", "إيطالي", "سوشي", "برجر", "قهوة مختصة", "حلويات"]},
            {"id": "avg_prep", "q": "متوسط وقت تجهيز الطلب؟", "chips": ["5-10 دقائق", "10-20 دقيقة", "20-30 دقيقة", "+30 دقيقة"]},
            {"id": "delivery_radius", "q": "نطاق التوصيل (كم)؟", "chips": ["3 كم", "5 كم", "10 كم", "15 كم"]},
        ],
        "sample_sections": ["hero", "menu_grid", "about", "gallery", "contact"],
    },

    # ────────────────────────────────────────────────────────────────
    "salon": {
        "id": "salon",
        "name_ar": "صالونات وحلاقة",
        "icon": "💈",
        "color": "#7C3AED",
        "features": ["bookings", "services"],
        "checkout_type": "appointment",
        "dashboard_tabs": ["appointments", "services", "staff", "customers", "payments", "coupons"],
        "wizard_questions": [
            {"id": "services", "q": "ما الخدمات التي تقدّمها؟", "chips": ["قص شعر", "حلاقة ذقن", "صبغة", "حمام مغربي", "مانيكير", "تسريحات"]},
            {"id": "staff_count", "q": "كم عدد الموظفين في الصالون؟", "chips": ["1", "2-3", "4-6", "+7"]},
            {"id": "working_hours", "q": "ساعات العمل؟", "chips": ["9 ص - 9 م", "10 ص - 10 م", "2 م - 12 ص", "24 ساعة"]},
            {"id": "slot_duration", "q": "مدة الموعد الواحد؟", "chips": ["30 دقيقة", "45 دقيقة", "60 دقيقة", "90 دقيقة"]},
            {"id": "gender", "q": "للجنس؟", "chips": ["رجال", "نساء", "عوائل"]},
        ],
        "sample_services": [
            {"id": "s1", "name": "قص شعر كلاسيكي", "price": 50, "duration_min": 30},
            {"id": "s2", "name": "حلاقة ذقن", "price": 30, "duration_min": 20},
            {"id": "s3", "name": "صبغة شعر", "price": 150, "duration_min": 60},
        ],
        "sample_sections": ["hero", "services_grid", "staff_showcase", "booking_widget", "gallery", "testimonials", "contact"],
    },

    # ────────────────────────────────────────────────────────────────
    "pets": {
        "id": "pets",
        "name_ar": "خدمات الحيوانات الأليفة",
        "icon": "🐱",
        "color": "#DB2777",
        "features": ["bookings", "services", "pet_registry"],
        "checkout_type": "appointment",
        "dashboard_tabs": ["appointments", "services", "pets", "customers", "payments"],
        "wizard_questions": [
            {"id": "pet_types", "q": "ما أنواع الحيوانات التي تتعامل معها؟", "chips": ["قطط", "كلاب", "طيور", "أسماك", "حيوانات نادرة"]},
            {"id": "services", "q": "ما الخدمات؟", "chips": ["قص شعر", "قص أظافر", "حمّام", "فندقة", "تطعيمات", "تدريب"]},
            {"id": "pickup", "q": "هل توصّل/تستلم من المنزل؟", "chips": ["نعم، مجاناً", "نعم، برسوم", "لا"]},
        ],
        "sample_services": [
            {"id": "p1", "name": "حلاقة قط", "price": 80, "duration_min": 45, "pet_types": ["قطط"]},
            {"id": "p2", "name": "قص أظافر", "price": 25, "duration_min": 15, "pet_types": ["قطط", "كلاب"]},
            {"id": "p3", "name": "حمّام كامل", "price": 60, "duration_min": 40, "pet_types": ["قطط", "كلاب"]},
            {"id": "p4", "name": "فندقة يومية", "price": 50, "duration_min": 1440, "pet_types": ["قطط", "كلاب"]},
        ],
        "sample_sections": ["hero", "services_grid", "pet_registry", "booking_widget", "gallery", "contact"],
    },

    # ────────────────────────────────────────────────────────────────
    "ecommerce": {
        "id": "ecommerce",
        "name_ar": "تجارة إلكترونية",
        "icon": "🛒",
        "color": "#059669",
        "features": ["products", "orders"],
        "checkout_type": "shipping",
        "dashboard_tabs": ["products", "orders", "inventory", "customers", "payments", "coupons", "shipping"],
        "wizard_questions": [
            {"id": "product_type", "q": "ما نوع المنتجات؟", "chips": ["إلكترونيات", "ملابس", "إكسسوارات", "منزل وديكور", "كتب", "رياضية", "مستحضرات تجميل"]},
            {"id": "variants", "q": "هل تحتاج خيارات (مقاس/لون)؟", "chips": ["نعم، مهم جداً", "نعم، أحياناً", "لا"]},
            {"id": "stock_tracking", "q": "إدارة المخزون؟", "chips": ["نعم، دقيق", "مراقبة عامة", "لا"]},
            {"id": "shipping", "q": "مناطق الشحن؟", "chips": ["الرياض فقط", "السعودية كلها", "الخليج", "دولي"]},
        ],
        "sample_products": [
            {"id": "e1", "name": "سماعة لاسلكية", "price": 299, "stock": 15, "category": "إلكترونيات",
             "variants": [{"name": "اللون", "options": ["أسود", "أبيض", "ذهبي"]}]},
            {"id": "e2", "name": "ساعة ذكية", "price": 799, "stock": 8, "category": "إلكترونيات",
             "variants": [{"name": "اللون", "options": ["فضي", "أسود"]}, {"name": "الحجم", "options": ["42mm", "46mm"]}]},
        ],
        "sample_sections": ["hero", "product_grid_filters", "featured_products", "categories_grid", "testimonials", "contact"],
    },

    # ────────────────────────────────────────────────────────────────
    "stocks": {
        "id": "stocks",
        "name_ar": "استثمار وأسهم ذكي",
        "icon": "📈",
        "color": "#2563EB",
        "features": ["portfolio", "ai_trading"],
        "checkout_type": "none",
        "simulation_only": True,
        "dashboard_tabs": ["portfolio", "watchlist", "ai_signals", "trades"],
        "wizard_questions": [
            {"id": "markets", "q": "أي أسواق تريد متابعتها؟", "chips": ["تداول السعودي", "أمريكا (NASDAQ/NYSE)", "عملات رقمية", "خليجية"]},
            {"id": "ai_mode", "q": "مستوى المساعد الذكي؟", "chips": ["مبتدئ - تعليم وشرح", "متوسط - توصيات", "متقدم - تنفيذ محاكاة"]},
            {"id": "initial_balance", "q": "رصيد المحاكاة الافتراضي؟", "chips": ["10,000 ر.س", "50,000 ر.س", "100,000 ر.س"]},
        ],
        "sample_sections": ["hero_ticker", "portfolio_widget", "watchlist_grid", "ai_chat", "market_news", "contact"],
        "disclaimer_ar": "⚠️ هذا تطبيق محاكاة للتعلم فقط. لا يتعامل بأموال حقيقية ولا يقدّم توصيات استثمارية.",
    },

    # ────────────────────────────────────────────────────────────────
    "medical": {
        "id": "medical",
        "name_ar": "عيادات طبية",
        "icon": "🏥",
        "color": "#DC2626",
        "features": ["bookings", "services", "branches"],
        "checkout_type": "appointment",
        "dashboard_tabs": ["appointments", "services", "doctors", "patients", "payments", "branches"],
        "wizard_questions": [
            {"id": "specialty", "q": "ما التخصص؟", "chips": ["عام", "أسنان", "جلدية", "نسائية", "أطفال", "عظام", "قلب", "عيون"]},
            {"id": "doctors_count", "q": "عدد الأطباء؟", "chips": ["1", "2-5", "6-10", "+10"]},
            {"id": "branches", "q": "عدد الفروع؟", "chips": ["1", "2", "3-5", "+5"]},
            {"id": "insurance", "q": "تقبلون تأمين؟", "chips": ["نعم، كل الشركات", "شركات محددة", "لا"]},
        ],
        "sample_services": [
            {"id": "m1", "name": "كشف عام", "price": 150, "duration_min": 30},
            {"id": "m2", "name": "تنظيف أسنان", "price": 300, "duration_min": 45},
            {"id": "m3", "name": "فحص شامل", "price": 800, "duration_min": 90},
        ],
        "sample_sections": ["hero", "services_grid", "doctors_showcase", "booking_widget", "branches_map", "testimonials", "contact"],
    },

    # ────────────────────────────────────────────────────────────────
    "gym": {
        "id": "gym",
        "name_ar": "صالات رياضية وتدريب",
        "icon": "🏋️",
        "color": "#0891B2",
        "features": ["bookings", "services", "memberships"],
        "checkout_type": "subscription",
        "dashboard_tabs": ["memberships", "classes", "trainers", "members", "payments"],
        "wizard_questions": [
            {"id": "facility", "q": "نوع المرفق؟", "chips": ["صالة حديد", "كروس فت", "يوجا/بيلاتس", "ملاكمة/دفاع", "سباحة"]},
            {"id": "classes", "q": "حصص جماعية؟", "chips": ["نعم، يومية", "نعم، أسبوعية", "لا، تدريب فردي فقط"]},
            {"id": "subscription_models", "q": "نماذج الاشتراك؟", "chips": ["شهري فقط", "شهري + ربع سنوي", "مرن (يومي/أسبوعي/شهري)"]},
        ],
        "sample_services": [
            {"id": "g1", "name": "اشتراك شهري", "price": 250, "duration_days": 30, "type": "membership"},
            {"id": "g2", "name": "اشتراك سنوي", "price": 2400, "duration_days": 365, "type": "membership"},
            {"id": "g3", "name": "مدرب شخصي", "price": 150, "duration_min": 60, "type": "session"},
        ],
        "sample_sections": ["hero", "memberships_pricing", "classes_schedule", "trainers_showcase", "gallery", "contact"],
    },

    # ────────────────────────────────────────────────────────────────
    "academy": {
        "id": "academy",
        "name_ar": "أكاديميات تعليمية",
        "icon": "🎓",
        "color": "#7C2D12",
        "features": ["courses", "enrollments"],
        "checkout_type": "enrollment",
        "dashboard_tabs": ["courses", "students", "enrollments", "payments"],
        "wizard_questions": [
            {"id": "subject", "q": "الموضوع التعليمي؟", "chips": ["برمجة", "لغات", "تصميم", "إدارة أعمال", "تطوير ذاتي", "دين وقرآن"]},
            {"id": "format", "q": "صيغة الكورسات؟", "chips": ["فيديو مسجل", "بث مباشر", "مختلط", "نص ومقالات"]},
            {"id": "certification", "q": "شهادات؟", "chips": ["نعم، معتمدة", "شهادة حضور", "لا"]},
        ],
        "sample_sections": ["hero", "courses_grid", "instructors", "testimonials", "faq", "contact"],
    },

    # ────────────────────────────────────────────────────────────────
    "realestate": {
        "id": "realestate",
        "name_ar": "عقارات",
        "icon": "🏠",
        "color": "#065F46",
        "features": ["listings", "mortgage_calculator"],
        "checkout_type": "inquiry",
        "dashboard_tabs": ["listings", "inquiries", "agents", "payments"],
        "wizard_questions": [
            {"id": "listing_type", "q": "نوع العقارات؟", "chips": ["شقق", "فلل", "أراضي", "تجاري", "مزارع", "الكل"]},
            {"id": "transaction", "q": "بيع/إيجار/الاثنين؟", "chips": ["بيع فقط", "إيجار فقط", "الاثنين"]},
            {"id": "areas", "q": "المناطق؟", "chips": ["الرياض", "جدة", "الدمام", "مكة", "كل السعودية"]},
        ],
        "sample_sections": ["hero_search", "listings_grid", "map_view", "mortgage_calculator", "agents", "contact"],
    },
}


def list_verticals():
    """Safe public list for the frontend picker."""
    out = []
    for v in VERTICALS.values():
        out.append({
            "id": v["id"],
            "name_ar": v["name_ar"],
            "icon": v["icon"],
            "color": v["color"],
            "features": v["features"],
            "checkout_type": v["checkout_type"],
            "simulation_only": v.get("simulation_only", False),
            "dashboard_tabs": v["dashboard_tabs"],
        })
    return out


def get_vertical(vid: str):
    return VERTICALS.get(vid)


def get_wizard_questions(vid: str):
    v = VERTICALS.get(vid)
    return v["wizard_questions"] if v else []


def has_feature(vid: str, feature: str) -> bool:
    v = VERTICALS.get(vid)
    return v is not None and feature in (v.get("features") or [])


def get_sample_services(vid: str):
    v = VERTICALS.get(vid)
    return (v or {}).get("sample_services", [])


def get_sample_products(vid: str):
    v = VERTICALS.get(vid)
    return (v or {}).get("sample_products", [])
