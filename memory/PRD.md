# Zitex AI Platform - PRD

## Original Problem Statement
منصة ذكاء اصطناعي احترافية باسم "Zitex" لإنشاء المواقع، الألعاب، توليد الصور، إنتاج الفيديوهات، وتطبيقات الموبايل بشكل تفاعلي مع Live Preview.

## Session Update - April 11, 2026

---

## ✅ جميع الميزات المكتملة:

### 1. 🏗️ نظام البناء التدريجي (جديد!) ✅
- الذكاء الاصطناعي يبني المشاريع مرحلة بمرحلة
- لا يتوقف بعد جمع المتطلبات - يبدأ فوراً بإرسال الكود
- كل مرحلة تنتج كود فعلي يظهر في المعاينة
- العميل يوافق على كل مرحلة قبل الانتقال للتالية
- أمثلة: لعبة (تصميم → مباني → قبائل → قتال) / موقع (واجهة → أقسام → تفاعل → نشر)

### 2. 📱 نظام تطبيقات الموبايل ✅
| التقنية | iOS | Android | التكلفة |
|---------|-----|---------|---------|
| Flutter | ✅ | ✅ | 30 نقطة |
| React Native | ✅ | ✅ | 30 نقطة |
| Swift | ✅ | ❌ | 35 نقطة |
| Kotlin | ❌ | ✅ | 35 نقطة |

### 3. 🎬 نظام الفيديوهات الاستشاري ✅
| النوع | 4ث | 8ث | 12ث |
|-------|-----|-----|------|
| سينمائي | 50 | 80 | 120 |
| مضحك | 30 | 50 | 70 |
| إعلاني | 60 | 100 | 150 |

### 4. الميزات السابقة ✅
- أزرار الاختيار التفاعلية
- Live Preview التلقائي
- نظام القوالب (10 قوالب)
- نظام النشر الحقيقي
- دعم كامل للألعاب 2D/3D
- إدارة النقاط والعروض
- الصوت TTS
- رفع الملفات (مجاني)
- النشر للمنصات الاجتماعية

---

## Technical Stack
- **Frontend:** React + Tailwind + Shadcn UI
- **Backend:** FastAPI + Motor
- **Database:** MongoDB
- **AI:** GPT-4o (Chat) + Sora 2 (Video) + GPT Image 1 (Images) + OpenAI TTS
- **Storage:** Object Storage via emergentintegrations
- **Deployment:** Vercel (Frontend) + Railway (Backend)

## Credentials
- Email: owner@zitex.com
- Password: owner123

## URLs
- Frontend: https://zitex.vercel.app
- Backend: https://zitex-production.up.railway.app

---

## ✅ Fixed Issues (This Session)
1. **server.py AIAssistant initialization** - Confirmed working on both local and Railway
2. **MASTER_SYSTEM_PROMPT updated** - AI now builds iteratively (Phase 1 → approval → Phase 2) without stopping

## Key Files Changed (This Session)
- `/backend/services/ai_chat_service.py`: Complete rewrite of MASTER_SYSTEM_PROMPT for iterative building

---

## Next Steps
1. **P1:** Admin Control Panel for dynamic pricing management
2. **P1:** Deploy updated ai_chat_service.py to Railway

## Future Tasks
- P2: Full Internationalization (i18n)
- P3: Mobile App Compilation pipeline (.apk / .ipa)
