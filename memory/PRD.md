# Zitex AI Platform - PRD

## Original Problem Statement
منصة ذكاء اصطناعي باسم "Zitex" تعمل كمستشار عبر محادثة، تولّد مواقع/ألعاب/تطبيقات/صور/فيديو. يتم نشر الكود يدوياً إلى GitHub → Railway بواسطة المستخدم.

## User Language: Arabic (العربية)

## ✅ تم إنجازه (محدّث - 18 أبريل 2026)

### Session Feb 2026 - Bulletproof Game Engine
1. **Zitex Game Engine v2.0** (`/app/backend/static/game-engine.js`)
   - محرك متعدد الأنواع: **Strategy / Platformer / Racing / Snake / Shooter / Match-3 / Memory / Breakout / Flappy**
   - ألعاب فعلية قابلة للعب (ليست مجرد مشاهد ثابتة) مع HUD، مدخلات keyboard/touch، حلقات game loop، انتهاء/إعادة
   - كشف genre تلقائي من الـ config
2. **Backend Game Override** (في `ai_chat_service.py`)
   - `build_game_html(genre, title, hint, design_image_url)` - يبني HTML shell جاهز
   - `_build_image_backed_game()` - **وضع Image-Backed الجديد**: يستخدم صورة التصميم المُولَّدة كخلفية فعلية للعبة مع overlay تفاعلي شفاف (HUD + 12 hotspot + أزرار تحكم) — المعاينة = الصورة 100%
   - `detect_game_genre_prioritized()` - يكتشف النوع من الرسالة + السياق (عربي/إنجليزي)
   - `should_override_game_code()` - يقرر استبدال كود GPT الضعيف
   - **حفظ تلقائي**: عند توليد `[DESIGN_IMAGE]` نحفظ URL في `session.project_data.last_design_image`
   - **Override تلقائي**: إذا كان request_type لعبة والكود ضعيف، يُستبدل بقالب image-backed
   - **Fallback تلقائي**: إذا GPT لم يُخرج كوداً والمستخدم وافق، نبني اللعبة من صورة التصميم
3. **iframe Preview Fix** (`AIChat.js`)
   - استبدال الروابط النسبية `/api/*` بالـ BACKEND_URL الكامل قبل الكتابة في iframe

### Sessions السابقة
- نظام تدريب AI + جلب من GitHub + تعلم ذاتي
- Vision Auto-Attach - GPT يرى صورة التصميم قبل بناء الكود
- إصلاح توليد الصور/الفيديو + Dockerfile لـ Railway
- Storage proxy endpoint + video consultative flow

## Credentials
- Email: owner@zitex.com | Password: owner123

## Key Files
- `/backend/static/game-engine.js` - محرك الألعاب v2.0 (متعدد الأنواع)
- `/backend/services/ai_chat_service.py` - LLM logic + game override
- `/backend/server.py` - APIs + `/api/game-engine.js` + `/api/storage`
- `/frontend/src/pages/AIChat.js` - iframe preview مع URL patching
- `/frontend/src/pages/AdminTraining.js` - صفحة التدريب

## Tested Genres (via API + curl)
| Input | Detected |
|---|---|
| لعبة سباق سيارات | ✅ racing |
| لعبة ثعبان | ✅ snake |
| لعبة منصات ماريو | ✅ platformer |
| لعبة فضاء إطلاق نار | ✅ shooter |
| لعبة ألغاز جواهر | ✅ match3 |
| لعبة ذاكرة بطاقات | ✅ memory |
| لعبة كسر الطوب | ✅ breakout |
| لعبة استراتيجية قرية | ✅ strategy |

## Deployment Notes (for user → Railway)
ملفات يجب نسخها إلى GitHub:
1. `/app/backend/services/ai_chat_service.py`
2. `/app/backend/static/game-engine.js` (جديد - ضروري!)
3. `/app/backend/server.py` (endpoint `/api/game-engine.js` و `/api/game-test`)
4. `/app/frontend/src/pages/AIChat.js` (iframe URL patching)

## Next Steps (P1/P2)
- **P1**: لوحة تحكم المالك للتسعير الديناميكي (استبدال `SERVICE_COSTS` بـ DB)
- **P2**: i18n (الترجمة الكاملة)
- **P2**: Mobile App compilation (APK/IPA)
