# Zitex AI Platform - PRD

## Original Problem Statement
منصة ذكاء اصطناعي احترافية باسم "Zitex" لإنشاء المواقع، الألعاب، توليد الصور، إنتاج الفيديوهات، وتطبيقات الموبايل.
المستخدم ينشر يدوياً على Railway/Vercel عبر GitHub.

## Session Update - Apr 16, 2026

## ✅ ما تم إنجازه هذه الجلسة:
1. إصلاح دالة `_generate_video` (كانت بدون async def)
2. تطوير قسم الفيديو: 6 خطوات استشارية + 4 أنماط + تعليق صوتي
3. إصلاح مشكلة توليد الصور (روابط Storage خاطئة) - أضيف /api/storage/ proxy endpoint
4. إصلاح مشكلة token explosion (758K tokens) - حذف base64 من تاريخ المحادثة
5. تحسين جودة الكود المولّد - إلزام استخدام cdn.tailwindcss.com + Font Awesome CDN + RTL
6. إضافة Dockerfile لـ Railway لتثبيت emergentintegrations
7. إصلاح railway.json (DOCKERFILE builder بدل NIXPACKS)

## الملفات المعدّلة:
- `/backend/services/ai_chat_service.py` - البرومبت + روابط الصور + base64 cleanup
- `/backend/server.py` - إضافة /api/storage/ proxy endpoint
- `/backend/Dockerfile` - جديد - لتثبيت emergentintegrations
- `/backend/railway.json` - تغيير builder إلى DOCKERFILE
- `/backend/requirements.txt` - تنظيف المكررات

## Credentials
- Email: owner@zitex.com
- Password: owner123

## Next Steps
- P0: التأكد من railway.json محدّث على GitHub (builder: DOCKERFILE)
- P2: لوحة تحكم المدير لإدارة الأسعار ديناميكياً
- P2: i18n
- P3: Mobile App Compilation (.apk/.ipa)
