# Zitex AI Platform - PRD

## Original Problem Statement
منصة ذكاء اصطناعي احترافية باسم "Zitex" لإنشاء المواقع، الألعاب، توليد الصور، إنتاج الفيديوهات، وتطبيقات الموبايل.

## Session Update - April 13, 2026

---

## ✅ ما تم إنجازه في هذه الجلسة:

### 1. تحديث MASTER_SYSTEM_PROMPT بالكامل
- نظام البناء التدريجي (مرحلة بمرحلة)
- القاعدة الذهبية الثالثة: جودة التصميم (Tailwind + CSS Grid + Emoji sprites)
- دعم أنواع ألعاب مختلفة (استراتيجية، أكشن، أطفال، مطاعم، سباق، ألغاز)
- إزالة backticks من البرومبت (كانت تكسر JSON)

### 2. إصلاح regex استخراج الكود
- دعم [CODE_BLOCK] بدون backticks (HTML مباشرة)
- دعم أنماط متعددة للكود

### 3. رفع max_tokens من 8000 إلى 16384

### 4. دعم الصور الذكي (جديد!)
- **رؤية الصور**: العميل يرفق صورة والذكاء يشوفها (GPT-4o Vision)
- **استيحاء [IMAGE_INSPIRE]**: يولّد صورة جديدة مستوحاة من مرجع (10 نقاط)
- **تعديل [IMAGE_EDIT]**: يعدّل صورة سابقة بناءً على تعليق العميل (8 نقاط)
- **روابط الصور في المحادثة**: الذكاء يقدر يرجع لصور سابقة ويعدّلها

---

## Credentials
- Email: owner@zitex.com
- Password: owner123

## Key Files Changed
- `/backend/services/ai_chat_service.py`: MASTER_SYSTEM_PROMPT + regex + Vision + IMAGE_INSPIRE + IMAGE_EDIT

## Next Steps
- P0: نشر التحديثات على Railway
- P1: لوحة تحكم المدير لإدارة أسعار النقاط

## Future Tasks
- P2: Full Internationalization (i18n)
- P3: Mobile App Compilation pipeline (.apk / .ipa)
