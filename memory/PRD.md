# Zitex AI Platform - PRD

## Original Problem Statement
منصة ذكاء اصطناعي احترافية باسم "Zitex" لإنشاء المواقع، الألعاب، توليد الصور، وإنتاج الفيديوهات بشكل تفاعلي مع Live Preview.

## Session Update - April 11, 2026

### ✅ الميزات المكتملة:

#### 1. نظام البناء التدريجي Progressive Builder
- الذكاء الاصطناعي يسأل أسئلة استشارية بأزرار قابلة للنقر
- يبدأ البناء بعد سؤال أو اثنين فقط
- الكود يُرسل في `[CODE_BLOCK]` مخفي عن المستخدم
- Live Preview يفتح تلقائياً ويعرض الموقع

#### 2. أزرار الاختيار التفاعلية
- صيغة `[BUTTONS]...[/BUTTONS]` للأزرار
- الضغط على الزر يُرسل الاختيار مباشرة
- أزرار جميلة بتصميم ذهبي

#### 3. نظام القوالب الجاهزة (6 قوالب)
| القالب | التصنيف | التكلفة | التقنية |
|--------|---------|---------|---------|
| صفحة هبوط داكنة | landing | مجاني | Tailwind |
| متجر ذهبي | ecommerce | 20 نقطة | Tailwind |
| معرض أعمال بسيط | portfolio | مجاني | Tailwind |
| لوحة تحكم احترافية | dashboard | 25 نقطة | Tailwind |
| لعبة منصات 2D | game | 30 نقطة | Phaser.js |
| لعبة سباق 3D | game | 35 نقطة | Three.js |

#### 4. نظام النشر مع استضافة حقيقية
- نشر المشروع على `subdomain.zitex.app`
- استخدام Object Storage للاستضافة
- التحقق من توفر النطاق
- تكلفة النشر: 100 نقطة

#### 5. دعم كامل للألعاب
**مكتبات الألعاب المتاحة:**
| المكتبة | الاستخدام | CDN |
|---------|-----------|-----|
| Phaser 3 | ألعاب 2D | cdn.jsdelivr.net/npm/phaser@3.70.0 |
| Three.js | ألعاب 3D | cdn.jsdelivr.net/npm/three@0.160.0 |
| Babylon.js | ألعاب 3D احترافية | cdn.babylonjs.com |
| PixiJS | رسوميات 2D سريعة | cdn.jsdelivr.net/npm/pixi.js@7.3.2 |
| Matter.js | فيزياء 2D | cdn.jsdelivr.net/npm/matter-js@0.19.0 |
| Howler.js | صوتيات | cdn.jsdelivr.net/npm/howler@2.2.4 |
| GSAP | تحريك احترافي | cdn.jsdelivr.net/npm/gsap@3.12.4 |

**أنواع الألعاب المدعومة:**
- ألعاب منصات (Platformer) - Phaser
- ألعاب ألغاز (Puzzle) - Matter.js
- ألعاب سباق (Racing) - Three.js
- ألعاب إطلاق نار (Shooter) - Phaser/Three.js
- ألعاب كروت (Cards) - PixiJS
- ألعاب RPG - Phaser/Babylon.js
- ألعاب محاكاة (Simulation) - Babylon.js

#### 6. Live Preview محسّن
- يفتح تلقائياً عند توليد الكود
- زر نسخ الكود
- زر تصدير الكود (50 نقطة)
- زر حفظ كقالب (10 نقاط)
- زر نشر على الإنترنت (100 نقطة)
- زر تحديث وملء الشاشة

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
| استخدام قالب مجاني | 0 |
| استخدام قالب Premium | 5-35 |
| تصدير الكود | 50 |
| نشر على الإنترنت | 100 |

---

## Technical Stack
- Frontend: React + Tailwind + Shadcn UI (Vercel)
- Backend: FastAPI + Motor (Railway)
- Database: MongoDB
- AI: GPT-4o via emergentintegrations
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
1. `/backend/services/ai_chat_service.py` - نظام البناء + القوالب + النشر + الألعاب
2. `/backend/routers/chat_router.py` - APIs للقوالب والنشر والألعاب
3. `/frontend/src/pages/AIChat.js` - واجهة القوالب + أزرار النشر
4. `/frontend/src/pages/RegisterPage.js` - حقل الاسم اختياري

## What's Working ✅
- 🔘 أزرار الاختيار التفاعلية
- 👁️ Live Preview التلقائي
- 🏷️ شارة Zitex في الأكواد
- 📦 نظام القوالب (6 قوالب)
- 🚀 نظام النشر الحقيقي
- 🎮 دعم كامل للألعاب 2D/3D
- 💰 خصم النقاط
- 🌐 إنشاء المواقع
- 🖼️ توليد الصور

## Pending ❌
- 🎬 الفيديوهات الطويلة (مؤجل)
- 🔊 الصوت TTS (معطل مؤقتاً)

## Next Tasks (Backlog)
1. **P2** - تفعيل الفيديوهات الطويلة (Runway/Luma)
2. **P2** - تفعيل الصوت TTS
3. **P3** - إضافة قوالب جديدة
