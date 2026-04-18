# Zitex AI Platform - PRD

## Original Problem Statement
منصة "Zitex" - ذكاء اصطناعي يولّد مواقع/ألعاب/صور/فيديو. نشر يدوي إلى Railway.

## User Language: Arabic (العربية)

## 🎯 Modular Architecture (New Strategy - Feb 2026)
**كل قسم في module مستقل تماماً** — يمكن تطويره/نشره/إصلاحه بدون لمس الأقسام الأخرى.

### Modules Status
- ✅ **Websites**: `/backend/modules/websites/` + `/frontend/src/pages/websites/` — **LIVE**
- 🔒 **Games**: قريباً (محرر + game engine موجودان في VisualDesigner.js كنواة)
- 🔒 **Videos**: قريباً
- 🔒 **Images**: قريباً

## ✅ Websites Module (مكتمل)
**Backend** (`/backend/modules/websites/` — 5 ملفات مستقلة):
- `__init__.py` — exports `register_routes`
- `models.py` — Pydantic (WebsiteProject, WebsiteSection, ChatMessageIn, AIGenerateIn)
- `templates.py` — 6 قوالب جاهزة (متجر / مطعم / شركة / بورتفوليو / SaaS / فارغ)
- `renderer.py` — يحوّل JSON → HTML responsive بـ 13 نوع قسم
- `ai_service.py` — مستشار AI عبر litellm + Emergent LLM Key
- `routes.py` — 11 endpoint تحت `/api/websites/*`

**Frontend** (`/frontend/src/pages/websites/WebsiteStudio.js`):
- 3 tabs في sidebar: Chat / Sections / Theme
- Templates picker مع live preview iframe
- Section list: reorder / duplicate / delete / visibility / add من 13 نوع
- Properties panel: تعديل كل حقل في القسم المحدد
- Theme editor: 5 ألوان + خط + تدوير
- Live preview iframe: يتحدّث فوراً
- Auto-save كل 1.5 ث
- Library modal: فتح/حذف مواقع محفوظة
- Export HTML كملف
- Empty state احترافي

### Section Types (13)
hero, features, about, products, menu, gallery, testimonials, team, pricing, faq, contact, cta, footer

### Database Collections
- `website_projects` — مشاريع المستخدمين
- (العناصر القديمة لا تزال: `users`, `chat_sessions`, `designs`, `user_images`, `user_elements`)

### API Endpoints (all under `/api/websites/*`)
- `GET /templates` - list 6 templates (public)
- `GET /templates/{id}/preview-html` - HTML preview (public)
- `GET /projects` - user's projects
- `GET /projects/{id}` - single project
- `POST /projects` - create (auto-fill from template)
- `PATCH /projects/{id}` - update (auto-save)
- `DELETE /projects/{id}`
- `POST /projects/{id}/duplicate`
- `POST /projects/{id}/build` - render to HTML
- `POST /projects/{id}/chat` - AI consultative chat (auto-builds on approval)
- `POST /ai/instant-build` - one-shot build from brief

## Landing Page
- "إنشاء المواقع" — ✨ **مفتوح** → `/websites`
- "تصميم الألعاب" / "إنشاء الفيديو" / "توليد الصور" — 🔒 **قريباً** (grayscale + غير قابل للنقر)
- زر "ابدأ مجاناً" يوجّه للمسجلين إلى `/websites`

## Credentials
- Email: owner@zitex.com | Password: owner123

## Key Files (للنشر على Railway)
1. `backend/modules/websites/` - كامل المجلد (5 ملفات)
2. `backend/server.py` - 7 أسطر لتسجيل الـ module فقط
3. `frontend/src/pages/websites/WebsiteStudio.js` - استوديو المواقع
4. `frontend/src/pages/LandingPage.js` - البطاقات المحدّثة
5. `frontend/src/App.js` - route `/websites`

## Next Modules (مرحلة مرحلة)
- 🔒 **Games Module**: استخدام البنية نفسها في `backend/modules/games/`
- 🔒 **Videos Module**: `backend/modules/videos/`
- 🔒 **Images Module**: `backend/modules/images/`
- 🔒 **Chat Module**: مستشار عام (إن رُغب)
- 🔒 **Admin Module**: لوحة تحكم موسّعة

## Old Code (يبقى كما هو)
- `/chat` (AIChat.js) — الشات العام القديم
- `/designer` (VisualDesigner.js) — محرر الألعاب (سينتقل لـ games module لاحقاً)
- `backend/services/ai_chat_service.py` — المنطق القديم (غير مُستخدم في websites module)
