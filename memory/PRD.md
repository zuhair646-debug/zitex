# Zitex AI Platform - PRD

## Original Problem Statement
منصة ذكاء اصطناعي احترافية باسم "Zitex" لإنشاء المواقع، الألعاب، توليد الصور، إنتاج الفيديوهات، وتطبيقات الموبايل.
المستخدم ينشر يدوياً على Railway/Vercel عبر GitHub.

## Session Update - Feb 2026

---

## ✅ ما تم إنجازه:

### سابقاً:
- نظام البناء التدريجي (مرحلة بمرحلة)
- دعم أنواع ألعاب مختلفة (استراتيجية، أكشن، أطفال، مطاعم، سباق، ألغاز)
- إصلاح regex استخراج الكود
- رفع max_tokens إلى 16384
- دعم الصور: GPT-4o Vision + IMAGE_INSPIRE + IMAGE_EDIT
- STT عبر Emergent (Whisper)

### هذه الجلسة:
1. **إصلاح دالة `_generate_video`** - كانت بدون تعريف `async def` = الفيديوات ما تشتغل أبداً
2. **تطوير قسم الفيديو بالكامل** في MASTER_SYSTEM_PROMPT:
   - 6 خطوات استشارية (فهم → اقتراح النوع والمقاس → سيناريو → تعليق صوتي → تأكيد التكلفة → توليد)
   - دعم 4 أنماط فيديو (سينمائي، إعلاني، مضحك، تعليمي)
   - أصوات التعليق الصوتي (6 أصوات مختلفة)
   - تكلفة مفصّلة لكل نوع ومدة
3. **إضافة قواعد جودة التصميم** إلى البرومبت (Tailwind, Font Awesome, Responsive, etc.)
4. **إضافة فئة فيديوهات تعليمية** (educational) مع تكاليفها
5. **حذف WELCOME_MESSAGE المكرر**
6. **فحص syntax كامل** - 10 اختبارات نجحت

---

## Credentials
- Email: owner@zitex.com
- Password: owner123

## Key Files
- `/backend/services/ai_chat_service.py`: الملف الرئيسي (2290 سطر)
- `/backend/server.py`: السيرفر الرئيسي
- `/frontend/src/pages/AIChat.js`: واجهة الشات

## Next Steps
- P0: المستخدم يرفع الملف على Railway
- P2: لوحة تحكم المدير لإدارة أسعار النقاط ديناميكياً
- P2: Full Internationalization (i18n)
- P3: Mobile App Compilation pipeline (.apk / .ipa)
