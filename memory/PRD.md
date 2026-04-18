# Zitex AI Platform - PRD

## Original Problem Statement
منصة ذكاء اصطناعي باسم "Zitex" تعمل كمستشار عبر محادثة، تولّد مواقع/ألعاب/تطبيقات/صور/فيديو. يتم نشر الكود يدوياً إلى GitHub → Railway بواسطة المستخدم.

## User Language: Arabic (العربية)

## ✅ تم إنجازه (محدّث - 18 فبراير 2026)

### Session Feb 2026 - Image-Match Game Preview (الحل النهائي)
**المشكلة الجذرية** (التي كانت مخفية):
- `BACKEND_URL` غير موجود في `/app/backend/.env` → كل روابط الصور كانت `None/api/storage/...` (مكسورة)
- iframe patcher يُصلح `src=/href=` فقط، ليس CSS `url(...)`
- Heuristic override كان يحترم SVG الثابت لـ GPT حتى لو لدينا صورة تصميم
- بيانات اختبار قديمة (URL صورة ظباء) بقيت في DB

**الإصلاحات**:
1. ✅ أُضيف `BACKEND_URL` إلى `.env` (preview URL الكامل)
2. ✅ iframe patcher في `AIChat.js` الآن يُصلح `url(/api/...)` CSS + `src=/href=` HTML
3. ✅ `should_override_game_code(code, has_design_image)` — إذا لدينا صورة تصميم، نستخدم image-backed دائماً (تطابق 1:1)
4. ✅ تم تنظيف بيانات الاختبار السيئة من DB
5. ✅ `_process_ai_commands` يحفظ `last_design_image` في `project_data` عند توليد DESIGN_IMAGE

**كيف يعمل التدفق الآن**:
- المستخدم يطلب لعبة → GPT يولّد `[DESIGN_IMAGE]` → نحفظ URL كامل في session
- المستخدم يوافق → backend يُبني HTML image-backed: الصورة المُولَّدة = خلفية كاملة + HUD شفاف + 12 hotspot + أزرار تحكم
- iframe يُصلح أي مسارات `/api/*` قبل الكتابة → الصور تُحمَّل في about:blank بنجاح
- **النتيجة**: Live Preview = الصورة المعتمدة 100% + تفاعلية

### Zitex Game Engine v2.0 (Generic mode - بدون صورة)
`/app/backend/static/game-engine.js` — محرك متعدد الأنواع كـ fallback عند عدم وجود صورة:
Strategy / Platformer / Racing / Snake / Shooter / Match-3 / Memory / Breakout / Flappy

### Sessions السابقة
- نظام تدريب AI + جلب من GitHub + تعلم ذاتي
- Vision Auto-Attach + إصلاح توليد الصور/الفيديو
- Dockerfile لـ Railway

## Credentials
- Email: owner@zitex.com | Password: owner123

## Key Files (يجب نسخها إلى GitHub للنشر على Railway)
1. `backend/services/ai_chat_service.py` — LLM + game override + image-backed builder
2. `backend/static/game-engine.js` — محرك الألعاب (fallback)
3. `backend/server.py` — APIs + `/api/game-engine.js`
4. `backend/.env` — **يجب إضافة `BACKEND_URL=https://zitex-xxx.railway.app` في Railway ENV vars**
5. `frontend/src/pages/AIChat.js` — iframe URL patching (HTML + CSS)

## Next Steps
- **P1**: لوحة تحكم المالك للتسعير الديناميكي
- **P2**: GPT-4o Vision لتحليل الصورة واستخراج bounding boxes تلقائياً (hotspots فوق المباني الفعلية)
- **P2**: i18n + Mobile App compilation (APK/IPA)

## Backlog
- دعم Image-Backed لأنواع غير الاستراتيجية بطرق مخصصة
- السماح بسحب hotspots يدوياً
- AdminTraining لتحسين hotspots تلقائياً
