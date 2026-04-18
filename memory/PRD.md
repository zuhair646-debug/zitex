# Zitex AI Platform - PRD

## Original Problem Statement
منصة "Zitex" - ذكاء اصطناعي يولّد مواقع/ألعاب/صور/فيديو. الكل معزول في Modules. النشر يدوي إلى Railway.

## User Language: Arabic (العربية)

## 🎯 Modular Architecture (Feb 2026)
**كل قسم في module مستقل تماماً** — يمكن تطويره/نشره/إصلاحه بدون لمس الأقسام الأخرى.

### Modules Status
- ✅ **Websites**: `/backend/modules/websites/` — **LIVE + Wizard**
- 🔒 **Games**: قريباً
- 🔒 **Videos**: قريباً
- 🔒 **Images**: قريباً

---

## ✅ Websites Module (مكتمل + محدّث Feb 2026)

### Backend (`/backend/modules/websites/` — 7 ملفات):
- `__init__.py`
- `models.py` — WebsiteProject (يضم الآن `wizard` field)
- `templates.py` — 6 قوالب
- `variants.py` — 10 أنماط بصرية لكل قالب
- `wizard.py` ⭐ **(جديد)** — محرك الـ wizard، 10 خطوات، تطبيق الإجابات
- `renderer.py` — JSON → HTML (يدعم radius="full" للأزرار الدائرية)
- `ai_service.py` — consultant أولوية + تفسير توجيهات [WIZARD_ACTION]
- `routes.py` — 16 endpoint

### Frontend (`/frontend/src/pages/websites/WebsiteStudio.js`):
تخطيط جديد:
1. **الأعلى**: شريط قوالب (6 بطاقات) + شريط أنماط بصرية (10 بطاقات بألوان)
2. **الوسط**: معاينة لايف
3. **الأسفل**: شات المستشار مع رقائق ديناميكية حسب خطوة الـ wizard + زر الاستقلالية

### Wizard Flow (10 خطوات):
1. **buttons** — شكل الأزرار (دائري/ناعم/متوسط/حاد)
2. **colors** — 8 أجواء لونية (كلاسيكي، عصري، دافئ، فاخر، داكن، طبيعي، باستيل، جريء)
3. **typography** — 5 خطوط عربية (Tajawal/Cairo/Amiri/Readex/Almarai)
4. **features** — متعدد: توصيل/حجز/سلة/واتساب/خريطة/تقييم/نشرة
5. **dashboard** — لا/مالك/عملاء/الاثنين
6. **dashboard_items** — (مشروط: يُتخطّى إن dashboard=none) عناصر الداشبورد
7. **sections** — متعدد: أقسام الصفحة الرئيسية
8. **branding** — نص حر: اسم العلامة
9. **payment** — متعدد: Stripe/مدى/Apple Pay/STC/PayPal/COD/بنك
10. **review** — مراجعة + اعتماد نهائي

### AI Priority Listening:
- يلتقط طلبات خاصة من النص الحرّ قبل/أثناء الـ wizard
- يُرجع توجيه JSON `[WIZARD_ACTION]` يُطبَّق تلقائياً (advance/apply_theme/apply_button/apply_font/add_section/custom_feature)

### Business Model:
- الموقع مستضاف على Zitex افتراضياً
- الكود محجوب حتى يطلب المستخدم "الاستقلالية"
- زر `الاستقلالية` يفتح Modal يشرح Vercel/Netlify/GitHub Pages (بدون كشف كود)
- التسليم سيكون مرحلياً بعد اعتماد التصميم ودفع رسوم الاستقلالية

### API Endpoints (all under `/api/websites/*`):
**قوالب وأنماط (public):**
- `GET /templates`
- `GET /templates/{id}/preview-html`
- `GET /variants` — 10 أنماط
- `GET /templates/{id}/variants` — 10 أنماط لقالب معيّن
- `GET /templates/{id}/variants/{variant_id}/preview-html`
- `GET /wizard/steps` — meta الخطوات

**مشاريع (auth):**
- `GET/POST /projects`, `GET/PATCH/DELETE /projects/{id}`
- `POST /projects/{id}/duplicate`
- `POST /projects/{id}/build` — render HTML
- `POST /projects/{id}/apply-variant` — تطبيق theme variant
- `POST /projects/{id}/wizard/answer` — إجابة مرحلة
- `POST /projects/{id}/wizard/chat` — شات حرّ واعٍ للـ wizard
- `POST /projects/{id}/chat` — شات legacy
- `POST /projects/{id}/independence/request` — بدء الاستقلالية
- `POST /ai/instant-build`

---

## Landing Page
- "إنشاء المواقع" — ✨ **مفتوح** → `/websites`
- "تصميم الألعاب" / "إنشاء الفيديو" / "توليد الصور" — 🔒 **قريباً**

## Credentials
- Email: owner@zitex.com | Password: owner123

---

## Changelog
### Feb 2026 — Website Studio v2 (Wizard + Top-Template Layout)
- رقائق أنماط بصرية (10 variants) للقالب الواحد
- Wizard تفاعلي بـ 10 خطوات مع تخطي مشروط
- ChatBar بالأسفل مع رقائق ديناميكية + multi-select + free-text
- Independence modal (Vercel/Netlify/GitHub) دون كشف كود
- endpoint `/apply-variant` لتبديل الأنماط دون فقد الأقسام
- AI directives `[WIZARD_ACTION]` لأولوية طلبات المستخدم

### Feb 2026 — Isolated Modules
- عزل websites في `/backend/modules/websites/`
- Visual Designer مع Konva.js (سينتقل لاحقاً لـ games module)

---

## Next Modules (مرحلة مرحلة)
- 🔒 **Games Module**: `backend/modules/games/` (استخدام البنية نفسها)
- 🔒 **Videos Module**: `backend/modules/videos/`
- 🔒 **Images Module**: `backend/modules/images/`

## P1 Backlog
- Phase B: Stripe subscription قبل الوصول لاستوديو
- Phase C: تسليم الكود تدريجياً ملف-ملف + أدلة نشر تفاعلية
- Dashboard compilation (حال اختار المستخدم dashboard=admin/customer) — بناء صفحة `/admin` داخل HTML المُصدَّر

## P2 Backlog
- Admin Control Panel (dynamic pricing)
- Full i18n (EN/AR)
- Mobile App Compilation (.apk/.ipa pipeline)

---

## Tech Stack
- Frontend: React + Tailwind + sonner + lucide-react + Konva (designer)
- Backend: FastAPI + Motor (MongoDB async) + litellm + Emergent LLM Key
- Hosting: Railway (production) — preview على Emergent K8s

## Key Files (للنشر على Railway)
1. `backend/modules/websites/` — كامل المجلد (7 ملفات)
2. `backend/server.py` — register_routes call
3. `frontend/src/pages/websites/WebsiteStudio.js`
4. `frontend/src/pages/LandingPage.js`
5. `frontend/src/App.js`
