# Zitex AI Platform - PRD

## Original Problem Statement
منصة ذكاء اصطناعي باسم "Zitex" لإنشاء المواقع، الألعاب، الصور، الفيديوهات.

## Session - Apr 18, 2026

## ✅ ما تم:
1. **Zitex Game Engine** - محرك ألعاب SVG كامل (40+ عنصر: قلاع، بيوت، أشجار، مزارع، جنود، غيوم، زهور)
2. نظام تدريب AI + جلب من GitHub + تعلم ذاتي
3. Vision Auto-Attach - GPT يشوف صورة التصميم قبل بناء الكود
4. إصلاح توليد الصور/الفيديو + Dockerfile لـ Railway

## Credentials
- Email: owner@zitex.com | Password: owner123

## Key Files
- `/backend/static/game-engine.js` - محرك الألعاب (جديد)
- `/backend/services/ai_chat_service.py` - البرومبت
- `/backend/server.py` - APIs + game-engine endpoint
- `/frontend/src/pages/AdminTraining.js` - صفحة التدريب

## Next Steps
- P0: نسخ الملفات لـ GitHub (game-engine.js + server.py + ai_chat_service.py + static/ folder)
- P2: لوحة تحكم الأسعار | P2: i18n
