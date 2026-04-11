# Zitex AI Platform - PRD

## Original Problem Statement
منصة ذكاء اصطناعي احترافية باسم "Zitex" لإنشاء المواقع، الألعاب، توليد الصور، وإنتاج الفيديوهات بشكل تفاعلي مع Live Preview.

## Session Update - April 11, 2026

### ✅ الميزات المكتملة اليوم:

#### 1. نظام البناء التدريجي Progressive Builder
- الذكاء الاصطناعي يسأل أسئلة استشارية بأزرار قابلة للنقر
- يبدأ البناء بعد سؤال أو اثنين فقط
- الكود يُرسل في `[CODE_BLOCK]` مخفي عن المستخدم
- Live Preview يفتح تلقائياً ويعرض الموقع

#### 2. أزرار الاختيار التفاعلية
- صيغة `[BUTTONS]...[/BUTTONS]` للأزرار
- الضغط على الزر يُرسل الاختيار مباشرة
- أزرار جميلة بتصميم ذهبي

#### 3. نظام القوالب الجاهزة (جديد!)
- 4 قوالب افتراضية (صفحة هبوط، متجر، معرض، لوحة تحكم)
- فلترة حسب التصنيف
- قوالب مجانية وPremium
- حفظ المشروع كقالب (10 نقاط)
- استخدام القوالب (مجاني أو مدفوع)

#### 4. نظام النشر على نطاقات فرعية (جديد!)
- نشر المشروع على `subdomain.zitex.app`
- التحقق من توفر النطاق
- تكلفة النشر: 100 نقطة
- عرض رابط المشروع المنشور

#### 5. Live Preview محسّن
- يفتح تلقائياً عند توليد الكود
- زر نسخ الكود
- زر تصدير الكود (50 نقطة)
- زر حفظ كقالب (10 نقاط)
- زر نشر على الإنترنت (100 نقطة)
- زر تحديث وملء الشاشة

#### 6. إصلاح صفحة التسجيل
- حقل الاسم أصبح اختياري

---

## What's Working ✅
- 🔘 أزرار الاختيار التفاعلية
- 👁️ Live Preview التلقائي
- 🏷️ شارة Zitex في الأكواد
- 📦 نظام القوالب الجاهزة
- 🚀 نظام النشر على نطاقات فرعية
- 💰 خصم النقاط
- 🌐 إنشاء المواقع بشكل تدريجي
- 🎮 إنشاء الألعاب
- 🖼️ توليد الصور (GPT Image 1)
- 🎤 المايكروفون (STT)
- 📱 العرض المتجاوب

## Pending ❌
- 🎬 الفيديو (يحتاج خدمة بديلة)
- 🔊 الصوت TTS (معطل مؤقتاً)

---

## Service Costs (Points)
| الخدمة | التكلفة |
|--------|---------|
| محادثة عادية | 1 |
| توليد صورة | 5 |
| إنشاء موقع | 15 |
| إنشاء لعبة | 15 |
| تعديل | 5 |
| حفظ كقالب | 10 |
| استخدام قالب Premium | 5-25 |
| تصدير الكود | 50 |
| نشر على الإنترنت | 100 |

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
1. `/backend/services/ai_chat_service.py` - نظام البناء + القوالب + النشر
2. `/backend/routers/chat_router.py` - APIs للقوالب والنشر
3. `/frontend/src/pages/AIChat.js` - واجهة القوالب + أزرار النشر
4. `/frontend/src/pages/RegisterPage.js` - حقل الاسم اختياري

## Next Tasks (Backlog)
1. **P1** - ربط النشر بخدمة استضافة حقيقية (Vercel API)
2. **P1** - تفعيل الفيديوهات الطويلة (Runway/Luma)
3. **P2** - تفعيل الصوت TTS
4. **P2** - صور مصغرة للقوالب
