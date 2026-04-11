# Zitex AI Platform - PRD

## Original Problem Statement
منصة ذكاء اصطناعي احترافية باسم "Zitex" لإنشاء المواقع، الألعاب، توليد الصور، وإنتاج الفيديوهات بشكل تفاعلي مع Live Preview.

## Session Update - April 11, 2026

### ✅ جميع الميزات المكتملة:

#### 1. نظام البناء التدريجي Progressive Builder
- الذكاء الاصطناعي يسأل أسئلة استشارية بأزرار قابلة للنقر
- يبدأ البناء بعد سؤال أو اثنين فقط
- الكود مخفي عن المستخدم
- Live Preview يفتح تلقائياً

#### 2. نظام القوالب الجاهزة (6 قوالب)
| القالب | التصنيف | التكلفة | التقنية |
|--------|---------|---------|---------|
| صفحة هبوط داكنة | landing | مجاني | Tailwind |
| متجر ذهبي | ecommerce | 20 نقطة | Tailwind |
| معرض أعمال بسيط | portfolio | مجاني | Tailwind |
| لوحة تحكم احترافية | dashboard | 25 نقطة | Tailwind |
| لعبة منصات 2D | game | 30 نقطة | Phaser.js |
| لعبة سباق 3D | game | 35 نقطة | Three.js |

#### 3. نظام النشر مع استضافة حقيقية
- نشر على `subdomain.zitex.app`
- استخدام Object Storage
- تكلفة: 100 نقطة

#### 4. دعم كامل للألعاب (7 مكتبات)
- Phaser 3, Three.js, Babylon.js, PixiJS, Matter.js, Howler.js, GSAP

#### 5. الصوت (TTS) - تم إصلاحه! ✅
- توليد صوت من النص باستخدام OpenAI TTS
- أصوات متعددة (alloy, echo, fable, onyx, nova, shimmer)
- سرعة قابلة للتعديل

#### 6. لوحة تحكم إدارة النقاط والعروض (جديد!) ✅
**المسار:** `/admin/credits`

**الميزات:**
- عرض إحصائيات النقاط (إجمالي، متوسط، عدد المستخدمين)
- تعديل نقاط المستخدمين مباشرة
- إدارة أسعار الخدمات (موقع، لعبة، صورة، تصدير، نشر)
- إنشاء عروض شراء نقاط (مع خصومات)
- تفعيل/تعطيل العروض
- حذف العروض

**API Endpoints:**
- `GET /api/admin/users` - قائمة المستخدمين
- `PUT /api/admin/users/{id}/credits` - تعديل النقاط
- `GET /api/admin/service-pricing` - أسعار الخدمات
- `PUT /api/admin/service-pricing` - تحديث الأسعار
- `GET /api/admin/offers` - قائمة العروض
- `POST /api/admin/offers` - إضافة عرض
- `PUT /api/admin/offers/{id}` - تعديل عرض
- `DELETE /api/admin/offers/{id}` - حذف عرض
- `GET /api/offers` - العروض النشطة (للعملاء)

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
| تصدير الكود | 50 |
| نشر على الإنترنت | 100 |

---

## Technical Stack
- Frontend: React + Tailwind + Shadcn UI
- Backend: FastAPI + Motor
- Database: MongoDB
- AI: GPT-4o + OpenAI TTS via emergentintegrations
- Hosting: Object Storage via emergentintegrations
- Deployment: Vercel (Frontend) + Railway (Backend)

## Credentials
- Email: owner@zitex.com
- Password: owner123

## URLs
- Frontend: https://zitex.vercel.app
- Backend: https://zitex-production.up.railway.app
- GitHub: https://github.com/zuhair646-debug/zitex

## Key Files Changed
1. `/backend/services/ai_chat_service.py` - TTS, القوالب, النشر, الألعاب
2. `/backend/routers/chat_router.py` - TTS endpoint
3. `/backend/server.py` - Admin APIs للنقاط والعروض
4. `/frontend/src/pages/AIChat.js` - واجهة القوالب + النشر
5. `/frontend/src/pages/AdminCredits.js` - **جديد!** صفحة إدارة النقاط
6. `/frontend/src/pages/AdminDashboard.js` - رابط النقاط والعروض
7. `/frontend/src/App.js` - Route للصفحة الجديدة

## What's Working ✅
- 🔘 أزرار الاختيار التفاعلية
- 👁️ Live Preview التلقائي
- 🏷️ شارة Zitex
- 📦 نظام القوالب (6 قوالب)
- 🚀 نظام النشر الحقيقي
- 🎮 دعم كامل للألعاب 2D/3D
- 💰 إدارة النقاط والعروض
- 🔊 **الصوت TTS - يعمل!**
- 🌐 إنشاء المواقع
- 🖼️ توليد الصور

## Pending ❌
- 🎬 الفيديوهات الطويلة (مؤجل)

## All Tasks Complete! ✅
المنصة جاهزة للاستخدام.
