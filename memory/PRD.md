# Zitex AI Platform - PRD

## Original Problem Statement
منصة ذكاء اصطناعي احترافية باسم "Zitex" لإنشاء المواقع، الألعاب، توليد الصور، وإنتاج الفيديوهات بشكل تفاعلي مع Live Preview.

## Current Session Goals (April 11, 2026)

### ✅ ما تم إنجازه اليوم:

#### 1. نظام البناء التدريجي Progressive Builder
- الذكاء الاصطناعي يسأل أسئلة استشارية بأزرار قابلة للنقر
- يبدأ البناء بعد سؤال أو اثنين فقط
- الكود يُرسل في `[CODE_BLOCK]` مخفي عن المستخدم
- Live Preview يفتح تلقائياً ويعرض الموقع

#### 2. أزرار الاختيار التفاعلية
- صيغة `[BUTTONS]...[/BUTTONS]` للأزرار
- الضغط على الزر يُرسل الاختيار مباشرة
- أزرار جميلة بتصميم ذهبي

#### 3. Live Preview محسّن
- يفتح تلقائياً عند توليد الكود
- زر نسخ الكود
- زر تصدير الكود (50 نقطة)
- زر تحديث وملء الشاشة

#### 4. إصلاح صفحة التسجيل
- حقل الاسم أصبح اختياري

#### 5. دمج Emergent LLM Key
- استخدام emergentintegrations للـ AI
- يعمل مع GPT-4o

---

## What's Working ✅
- 🎤 المايكروفون (STT)
- 🖼️ توليد الصور (GPT Image 1)
- 🌐 إنشاء المواقع بشكل تدريجي
- 🎮 إنشاء الألعاب
- 📱 العرض المتجاوب
- 💰 خصم النقاط
- 🔘 أزرار الاختيار التفاعلية
- 👁️ Live Preview التلقائي
- 🏷️ شارة Zitex في الأكواد

## Pending ❌
- 🎬 الفيديو (يحتاج خدمة بديلة)
- 🔊 الصوت TTS (معطل مؤقتاً)

---

## Technical Stack
- Frontend: React + Tailwind + Shadcn UI (Vercel)
- Backend: FastAPI + Motor (Railway)
- Database: MongoDB
- AI: GPT-4o via emergentintegrations
- Deployment: Vercel (Frontend) + Railway (Backend)

## Credentials
- Email: owner@zitex.com
- Password: owner123

## URLs
- Frontend: https://zitex.vercel.app
- Backend: https://zitex-production.up.railway.app
- GitHub: https://github.com/zuhair646-debug/zitex

## Key Files Changed
1. `/backend/services/ai_chat_service.py` - نظام البناء التدريجي
2. `/backend/routers/chat_router.py` - إرجاع الرسائل مع Session
3. `/frontend/src/pages/AIChat.js` - أزرار تفاعلية + Live Preview
4. `/frontend/src/pages/RegisterPage.js` - حقل الاسم اختياري

## Service Costs (Points)
| الخدمة | التكلفة |
|--------|---------|
| محادثة عادية | 1 |
| توليد صورة | 5 |
| إنشاء موقع | 15 |
| إنشاء لعبة | 15 |
| تعديل | 5 |
| تصدير الكود | 50 |
| نشر | 100 |

## Next Tasks (Backlog)
1. **P1** - استضافة على نطاقات فرعية (`client.zitex.app`)
2. **P1** - تفعيل الفيديوهات (Runway/Luma)
3. **P2** - تفعيل الصوت TTS
4. **P2** - تسجيل الدخول/الخروج تحسين
