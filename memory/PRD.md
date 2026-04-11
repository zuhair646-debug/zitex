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

#### 5. الصوت (TTS) - يعمل! ✅
- توليد صوت من النص باستخدام OpenAI TTS
- أصوات متعددة (alloy, echo, fable, onyx, nova, shimmer)
- سرعة قابلة للتعديل

#### 6. لوحة تحكم إدارة النقاط والعروض ✅
**المسار:** `/admin/credits`

#### 7. نظام الفيديوهات الاستشاري المتقدم (جديد!) ✅
**تم إنجازه في هذه الجلسة**

**أنواع الفيديوهات الثلاثة:**
| النوع | الوصف | التكاليف |
|-------|-------|----------|
| 🎬 سينمائي | أفلام أكشن، دراما، خيال علمي | 4ث: 50 | 8ث: 80 | 12ث: 120 |
| 😂 مضحك | ميمز، محاكاة ساخرة، كوميديا | 4ث: 30 | 8ث: 50 | 12ث: 70 |
| 📺 إعلاني | حملات تسويقية، ترويج منتجات | 4ث: 60 | 8ث: 100 | 12ث: 150 |

**التدفق الاستشاري:**
1. اختيار نوع الفيديو ← أسئلة مخصصة
2. تحديد المدة (يختارها العميل)
3. كتابة السيناريو المناسب للمدة
4. عرض صور تجريبية للمشاهد (+5 نقاط/صورة)
5. عرض التعليق الصوتي التجريبي (+5 نقاط)
6. عرض التكلفة النهائية
7. التأكيد والتوليد

**الإضافات:**
- معاينة صوتية: 5 نقاط
- تعليق صوتي: 10 نقاط
- صور تجريبية: 5 نقاط × عدد الصور

**الأوامر المدعومة:**
- `[VIDEO_GENERATE]` - توليد فيديو
- `[VOICE_PREVIEW]` - معاينة صوتية
- `[IMAGE_PREVIEW]` - صور تجريبية للمشاهد
- `[IMAGE_GENERATE]` - توليد صورة

---

## Service Costs (Points) - محدّث
| الخدمة | التكلفة |
|--------|---------|
| محادثة عادية | 1 |
| توليد صورة | 5 |
| صورة شعار (لوغو) | 10 |
| صور تجريبية | 5 |
| إنشاء موقع | 15 |
| إنشاء لعبة | 15 |
| فيديو سينمائي (4ث) | 50 |
| فيديو سينمائي (8ث) | 80 |
| فيديو سينمائي (12ث) | 120 |
| فيديو مضحك (4ث) | 30 |
| فيديو مضحك (8ث) | 50 |
| فيديو مضحك (12ث) | 70 |
| فيديو إعلاني (4ث) | 60 |
| فيديو إعلاني (8ث) | 100 |
| فيديو إعلاني (12ث) | 150 |
| معاينة صوتية | 5 |
| تعليق صوتي | 10 |
| تعديل | 5 |
| حفظ كقالب | 10 |
| تصدير الكود | 50 |
| نشر على الإنترنت | 100 |

---

## Technical Stack
- Frontend: React + Tailwind + Shadcn UI
- Backend: FastAPI + Motor
- Database: MongoDB
- AI: GPT-4o (Chat) + Sora 2 (Video) + GPT Image 1 (Images) + OpenAI TTS (Voice)
- Hosting: Object Storage via emergentintegrations
- Deployment: Vercel (Frontend) + Railway (Backend)

## Credentials
- Email: owner@zitex.com
- Password: owner123

## URLs
- Frontend: https://zitex.vercel.app
- Backend: https://zitex-production.up.railway.app
- GitHub: https://github.com/zuhair646-debug/zitex

## Key Files Changed (This Session)
1. `/backend/services/ai_chat_service.py`:
   - تحديث `MASTER_SYSTEM_PROMPT` لدعم 3 أنواع فيديوهات
   - إضافة `SERVICE_COSTS` للفيديوهات الجديدة
   - إضافة `_process_ai_commands()` لمعالجة أوامر AI
   - إضافة `_generate_video()` لتوليد فيديو باستخدام Sora 2
   - إضافة `_generate_single_image()` لتوليد صور
   
2. `/frontend/src/pages/AIChat.js`:
   - تحديث `renderAttachment()` لدعم أنواع جديدة (audio, audio_preview, image_preview)

## What's Working ✅
- 🔘 أزرار الاختيار التفاعلية
- 👁️ Live Preview التلقائي
- 🏷️ شارة Zitex
- 📦 نظام القوالب (6 قوالب)
- 🚀 نظام النشر الحقيقي
- 🎮 دعم كامل للألعاب 2D/3D
- 💰 إدارة النقاط والعروض
- 🔊 الصوت TTS - يعمل!
- 🌐 إنشاء المواقع
- 🖼️ توليد الصور
- 🎬 **نظام الفيديوهات الاستشاري الجديد - يعمل!**

## Test Results (iteration_7)
- Backend: 100% (14/14 tests passed)
- Frontend: 100% (all video chat flow features working)

---

## Upcoming Tasks (P1)
- تسليم الكود النهائي للنشر على GitHub/Vercel/Railway
- اختبار توليد الفيديو الفعلي باستخدام Sora 2

## Future Tasks (P2-P3)
- دعم اللغات المتعددة (i18n)
- توليد تطبيقات الموبايل
- تحسين أداء توليد الفيديو
