# Zitex AI Platform - PRD

## Original Problem Statement
منصة "Zitex" - ذكاء اصطناعي يولّد مواقع/ألعاب/صور/فيديو. الكل معزول في Modules. النشر يدوي إلى Railway.

## User Language: Arabic (العربية)

## 🎯 Modular Architecture (Feb 2026)
**كل قسم في module مستقل تماماً** — يمكن تطويره/نشره/إصلاحه بدون لمس الأقسام الأخرى.

### Modules Status
- ✅ **Websites**: `/backend/modules/websites/` — **LIVE + Wizard**
- 🔒 **Games**: قريباً
- 🔒 **Videos**: قريباً
- 🔒 **Images**: قريباً


### 🆕 Feb 19, 2026 — MOBILE PREVIEW + SMART EDITS (Dedup/Move/Remove) + LIVE SECTIONS

**User requests addressed**:
1. **Mobile Preview Toggle** — new `device-toggle` in `PreviewPane` switches between desktop iframe (full width) and a 390×780 iPhone frame with notch. Client sees exactly how the site looks on phone.
2. **No duplicates, smart editing** — `add_section` now checks for existing type; if found, it UPDATES + repositions instead of creating a duplicate (so "ضيف حالات تاني" doesn't produce 2 stories sections).
3. **`move_section` action** — new backend action + `_compute_insert_position()` helper supporting keywords `top|bottom|after_hero|before:<type>|after:<type>|numeric`. AI prompt updated with examples ("انقل الحالات للأعلى" → move_section with position=top).
4. **Safety net enhanced** — `detect_section_intent()` now detects move verbs (انقل/ارفع/حرّك) + position keywords (في الأعلى/فوق/تحت/أسفل) and emits `move_section` instead of `add_section` when relocating.
5. **`sections` step live preview** — selecting "قائمة الطعام" (or any section type not yet in the project) now auto-creates a rich stub (menu with drinks/desserts, products, gallery, testimonials, team, pricing, faq, contact, cta all have smart defaults) so the preview updates INSTANTLY.
6. **`payment` step live** — selected payment methods now render as a chips strip in the footer (`data-hl="payment"`) in real-time.
7. **Auto-scroll** to newly-toggled section on `sections` step + to footer on `payment` step.

**Tested end-to-end via curl**:
- ✅ Add stories twice → only 1 stories section (dedup works)
- ✅ "انقل الحالات الى الاعلى" → stories moves to index 1 (right after hero)
- ✅ "احذف البنر" → banner section removed, action=remove_section
- ✅ Mobile preview renders inside iPhone frame with notch
- ✅ Quick-add chips work one-click



### 🆕 Feb 19, 2026 — LIVE FEATURES + LOGO STUDIO + QUICK ADD BAR (3 Fixes)

**Problem reported by user**: Selecting features (whatsapp/delivery/cart) showed NO change in live preview. Logo step used text-prompt instead of buttons. User wanted quick-add chips under chat.

**Fix 1 — Features → Live Preview (P0)**:
- New `_apply_features()` in `wizard.py` translates each feature into visible extras + sections:
  - `whatsapp` → floating WhatsApp button  - `cart` → floating cart icon with badge
  - `booking` → floating "احجز موعد" button
  - `reviews` → rating widget
  - `reservation` → full reservation section
  - `map` → interactive OpenStreetMap embed (no API key)
  - `delivery` → delivery banner section
  - `newsletter` → newsletter signup section
- Added `_section_map_embed` + `_section_delivery_banner` renderers + CSS.
- Added `cart_float` + `book_float` floating widgets.
- Frontend `buildOverrides` now has a `features` case for INSTANT live preview on each toggle (before confirming).
- Scroll map auto-jumps to the newly-toggled feature element.

**Fix 2 — Logo Studio (button-based) (P0)**:
- New `LogoStudioModal` with 3 stages:
  1. **Brand** — name + optional details
  2. **Style** — 8 one-click buttons (أنيق/مرح/بسيط/فاخر/حديث/كلاسيكي/جريء/تقني)
  3. **Pick + Color** — generates **3 logo variants in parallel** (new `generate_logo_variants` service using asyncio.gather), user clicks to apply, 10 color chips to re-generate with different palette.
- New endpoints: `POST /api/websites/projects/{id}/generate-logo-variants`, `POST /api/websites/projects/{id}/apply-logo`.
- Replaced `window.prompt` entirely.

**Fix 3 — Quick Add Bar (P1)**:
- New `QuickAddBar` component under chat input with 12 smart chips:
  🎬 حالات، 📢 بنر، 🎥 فيديو، 🖼️ معرض، 💬 آراء، 💰 أسعار، ❓ أسئلة، 👥 فريق، 📊 إحصائيات، 📧 نشرة، 🔔 إعلان، 📞 تواصل
- One click sends message → safety net detects intent → section appears instantly.

**Tested end-to-end**: ✅ features persist in DB (extras: whatsapp_float, cart_float, book_float, rating_widget), ✅ HTML contains zx-whatsapp/zx-cart-float/zx-map/zx-delivery, ✅ logo-variants endpoint returns 200 with 3 URLs, ✅ logo studio 3-stage modal flow works.



### 🆕 Feb 19, 2026 — LIVE CHAT ADDITIONS (Bug Fix)
**Problem reported**: User asked "اعمل لي حالات مثل الواتساب" on a cafe site. AI replied "تم الإضافة" but nothing appeared in Live Preview.

**Root cause**: `RENDERERS` dict in `renderer.py` had no `stories`/`banner` types — unknown types were silently dropped.

**Fix (3-layer)**:
1. Added renderers: `stories` (WhatsApp/Snapchat circular rings), `banner` (full-width promo), `announce_bar_section`, **`custom`** (generic fallback for ANY unknown type).
2. Unknown section types now fall back to `_section_custom` instead of being skipped — **guarantees visibility**.
3. Added **Safety Net** in `ai_service.detect_section_intent()` — parses Arabic keywords (حالات، ستوري، بنر، شريط إعلان، فيديو، معرض، آراء، أسعار، faq، فريق، إحصائيات، تواصل، من نحن) so even if AI forgets to emit `add_section` directive, the backend still adds the section.
4. AI system prompt updated with explicit examples for stories/banner/announce_bar.
5. Frontend `sendChat` now calls `refreshPreview` immediately (bypassing 400ms debounce) + shows toast on action.

**Tested**: ✅ "اعمل لي حالات مثل الواتساب" → stories section with 6 circular rings appears instantly in live preview.


---

## ✅ Websites Module (مكتمل + محدّث Feb 2026)

### Backend (`/backend/modules/websites/` — 8 ملفات):
- `__init__.py`
- `models.py` — WebsiteProject (يضم `wizard` field)
- `templates.py` — 6 قوالب أساسية
- `catalog.py` ⭐ **(جديد Feb 2026)** — 12 فئة × 1-3 layouts = 19+ تصميم متنوّع
- `variants.py` — 10 أنماط بصرية لكل قالب
- `wizard.py` — محرك الـ wizard، 11 خطوة
- `renderer.py` — JSON → HTML (يدعم `theme.custom_css` للأفكار الابتكارية)
- `ai_service.py` — consultant priority-aware + directives: advance/apply_theme/apply_button/apply_font/inject_css/add_section/fill_section/patch_section/remove_section/scaffold/custom_feature
- `routes.py` — 20+ endpoint

### Categories & Layouts (Feb 2026 — 20+ designs per category via procedural multiplication):
- كل فئة: base layouts × 10 style variants × 2 hero layouts = 21-63 تصميم فريد
- 🍽️ مطاعم (63)، ☕ كوفي (42)، 🛍️ متاجر (42)، 💈 حلاقة (42)، 🐱 قطط (42)، 🏥 عيادات (42)
- 🔧 سباكة (21)، ⚡ كهرباء (21)، 🏢 شركات (21)، 🎨 بورتفوليو (21)، 💻 SaaS (21)، ✨ مخصّص (21)
- **المجموع**: 399 تصميم

### Extras & Floating Widgets (Feb 2026 — خطوة جديدة):
- **12 ودجت مرئي** يُضاف بنقرة واحدة ويختفي بنقرة ثانية:
  - 📞 زر جوال لاصق، 💬 واتساب عائم، 📢 شريط إعلاني، ⏰ عدّاد تنازلي
  - 🎬 قسم فيديو، 📧 نموذج اشتراك، ⭐ شارة تقييم، 📱 أيقونات تواصل
  - 🛡️ شارات ثقة، ⬆️ زر للأعلى، 💬 محادثة فورية، 📊 شريط إحصائيات
- كل ودجت له `data-hl` للـ auto-scroll

### Public Sites & Admin Oversight (Feb 2026 ⭐):
- **Slug تلقائي** لكل مشروع معتمد (`site-xxxxx` إذا كان الاسم عربي)
- **رابط عام**: `/sites/{slug}` — كل من يفتحه يشاهد الموقع الحي فقط (iframe + sandbox)
- **عدّاد زيارات** تلقائي `visits++` في كل فتح
- **API عام**: `GET /api/websites/public/{slug}` يُرجع HTML + يزيد العدّاد
- **Admin Panel** (`/admin/sites` — owner/admin فقط):
  - جدول بكل المواقع المعتمدة لكل العملاء
  - KPIs: عدد المشاريع، إجمالي الزيارات، عدد العملاء، متوسط الزيارات
  - أزرار لكل صف: نسخ الرابط، معاينة (iframe ملء الشاشة بدون علم العميل)، فتح في تبويب جديد
  - ملكية العميل (اسم + بريد) ظاهرة لكل مشروع
- **بطاقات المكتبة** للمشاريع المعتمدة تعرض الرابط + زر نسخ + زر زيارة
- **Auto-fix**: المشاريع المعتمدة القديمة بدون slug تحصل على slug تلقائياً عند زيارة API

### Saved Correctly:
- كل حالة تُحفظ في MongoDB (slug, visits, approved_at, status, theme, sections, wizard, chat)
- `/projects` و `/admin/sites` يُعيدان أحدث البيانات
- URL `/sites/{slug}` يُحدّث `visits` تلقائياً عند كل زيارة
- حقل `status: "approved" | "draft"` + `approved_at`
- Endpoints: `POST /projects/{id}/approve` و `/unapprove`
- زر "اعتماد" أخضر في الاستوديو + "اعتماد نهائي" في خطوة `final_confirm`
- المكتبة تقسم المشاريع إلى: **المعتمدة** (شارة ✓ + 4 خيارات: تعديل/نسخ/تطبيق جوال قريباً/دعم وصيانة) + **المسوّدات** (اعتماد/حذف/تعديل/نسخ)

### 🎲 Layout DNA Mixer (Feb 2026):
- Endpoint `GET /categories/{id}/mix` يُرجع تصميم عشوائي مع HTML
- زر "اخلط تصميم" في LayoutBrowser يُولّد تركيبة جديدة فوراً (hero × arrangement × style)
- يخلي العميل يكتشف تركيبات ما كان يفكّر فيها
- **120 تصميم لكل فئة** (اختلافات جذرية، ليست ألوان فقط)
- **8 أشكال hero** جديدة: مقسّم، مركزي، مجلة تحريرية، بطاقة زجاجية boxed، قصّة روائية، بانر+نموذج حجز، بانر كامل، عمودي
- **8 ترتيبات أقسام**: افتراضي، جدول زمني أولاً، خطوات أولاً، نموذج حجز أولاً، مميزات متناوبة، اقتباس في الوسط، مميزات أفقية، ترتيب عكسي
- **4 أنواع أقسام جديدة**: `story_timeline` (جدول زمني أفقي)، `process_steps` (خطوات مرقمة)، `reservation` (نموذج حجز)، `quote` (اقتباس ضخم)
- المجموع: 8 × 8 × 10 themes = 640 تركيبة، محدودة بـ 120 لكل فئة لأداء أفضل

### Auto-Scroll + Pulse Highlight:
- كل خطوة wizard تركّز المعاينة على المنطقة المتغيّرة
- `variant/colors` → Hero | `buttons` → الزر | `typography` → العنوان | `features` → قسم المميزات | `payment` → الأسعار/CTA | `dashboard_items` → اللوحة المضافة حديثاً
- Pulse animation (حلقة ضوئية) للـ 1.5 ثانية لجذب الانتباه
- عند دخول خطوة `dashboard`: المعاينة تتحوّل **ملء الشاشة** لعرض لوحة تحكم فارغة (يختفي كل سايت)
- 3 أشكال: **sidebar** (موصى به)، **cards**، **tabs**
- عند خطوة `dashboard_items`: توجل أي عنصر → تُضاف **لوحة كاملة حقيقية** له فوراً:
  - 🏷️ **المنتجات**: نموذج إضافة + جدول بالمنتجات الحيّة
  - 📦 **الطلبات**: فلاتر + جدول بالطلبات
  - 👥 **العملاء**: إحصائيات + جدول
  - 📊 **الإحصائيات**: stat cards + bar chart
  - ⭐ **التقييمات**: قائمة تقييمات + أزرار ردّ
  - 💬 **الرسائل**: محادثات + صندوق ردّ
  - 📈 **التقارير**: جداول تصدير
  - 🔐 **المستخدمون**: أدوار + إضافة
  - ⚙️ **الإعدادات**: نماذج كاملة
  - 📅 **التقويم**: قائمة مواعيد
  - 📋 **المخزون**: مؤشرات + جدول
  - 💳 **المدفوعات**: stats + جدول معاملات
  - 📞 **الجوال** / 📧 **البريد** / 🔔 **الإشعارات**: نماذج وإعدادات
- **Auto-scroll** في iframe للّوحة المضافة حديثاً
- **علامة صح = ظهور فوري، شالها = إزالة فورية**

### AI Logo & Hero Image Generation (جديد Feb 2026):
- Endpoint: `POST /projects/{id}/generate-logo` — يستقبل وصف → يولّد لوقو احترافي عبر GPT-Image-1 → يحفظ كـ data URL في `theme.logo_url` → يظهر في Hero + Footer فوراً
- Endpoint: `POST /projects/{id}/generate-hero-image` — يولّد صورة Hero مخصّصة
- AI directive جديد `generate_logo` — عند طلب المستخدم لشعار، AI يطلقه تلقائياً
- زر "اعمل لوقو" في شريط الاستوديو (purple/pink gradient) — يفتح نافذة وصف ويولّد اللوقو
- زر X لإزالة اللوقو

### Frontend (`/frontend/src/pages/websites/WebsiteStudio.js`):
تخطيط جديد محسَّن (Feb 2026):
1. **قبل اختيار القالب**: شبكة قوالب بعرض كامل مع onboarding مركزي (3 خطوات)
2. **بعد اختيار القالب**: تختفي الشبكة + يظهر شارة صغيرة "قالب: مطعم 🔄" بالأعلى للتغيير
3. **اللوحة الرئيسية (Desktop)**: معاينة لايف (flex-1) على اليمين البصري + عمود شات ثابت 420px على اليسار
4. **المعاينة**: عرض ~70% من الشاشة + أزرار تحديث وملء الشاشة (Fullscreen يخفي كل الأطر)
5. **الشات**: رأس مصغّر (أيقونة المستشار + عداد الخطوات + زر الاستقلالية) + قائمة رسائل + مُنتقي مدمج غني (Rich Inline Step Renderer) + حقل إدخال حرّ
6. **Rich Inline Steps**: كل خطوة لها واجهة خاصة داخل الشات:
   - `variant` → 10 بطاقات أنماط بألوان بانوراما
   - `buttons` → 4 معاينات أزرار حيّة بأشكال مختلفة
   - `colors` → 8 بطاقات مزاج ألوان مع شرائح متدرجة
   - `typography` → 5 عيّنات خطوط بعرض مباشر
   - `features/sections/etc.` → رقائق (+ multi-select مع تأكيد)
7. **الجوال (Mobile)**: Tabs تبديل بين "معاينة" و"محادثة" — كل تاب ملء الشاشة

### Wizard Flow (11 خطوات):
1. **variant** ⭐ — اختيار النمط البصري (10 أنماط) — يُطبَّق theme القالب + alt palette
2. **buttons** — شكل الأزرار (دائري/ناعم/متوسط/حاد)
3. **colors** — 8 أجواء لونية (كلاسيكي، عصري، دافئ، فاخر، داكن، طبيعي، باستيل، جريء)
4. **typography** — 5 خطوط عربية (Tajawal/Cairo/Amiri/Readex/Almarai)
5. **features** — متعدد: توصيل/حجز/سلة/واتساب/خريطة/تقييم/نشرة
6. **dashboard** — لا/مالك/عملاء/الاثنين
7. **dashboard_items** — (مشروط: يُتخطّى إن dashboard=none) عناصر الداشبورد
8. **sections** — متعدد: أقسام الصفحة الرئيسية
9. **branding** — نص حر: اسم العلامة
10. **payment** — متعدد: Stripe/مدى/Apple Pay/STC/PayPal/COD/بنك
11. **review** — مراجعة + اعتماد نهائي

### AI Priority Listening:
- يلتقط طلبات خاصة من النص الحرّ قبل/أثناء الـ wizard
- يُرجع توجيه JSON `[WIZARD_ACTION]` يُطبَّق تلقائياً (advance/apply_theme/apply_button/apply_font/add_section/custom_feature)

### Business Model:
- الموقع مستضاف على Zitex افتراضياً
- الكود محجوب حتى يطلب المستخدم "الاستقلالية"
- زر `الاستقلالية` يفتح Modal يشرح Vercel/Netlify/GitHub Pages (بدون كشف كود)
- التسليم سيكون مرحلياً بعد اعتماد التصميم ودفع رسوم الاستقلالية

### API Endpoints (all under `/api/websites/*`):
**قوالب وأنماط (public):**
- `GET /templates`
- `GET /templates/{id}/preview-html`
- `GET /variants` — 10 أنماط
- `GET /templates/{id}/variants` — 10 أنماط لقالب معيّن
- `GET /templates/{id}/variants/{variant_id}/preview-html`
- `GET /wizard/steps` — meta الخطوات

**مشاريع (auth):**
- `GET/POST /projects`, `GET/PATCH/DELETE /projects/{id}`
- `POST /projects/{id}/duplicate`
- `POST /projects/{id}/build` — render HTML
- `POST /projects/{id}/apply-variant` — تطبيق theme variant
- `POST /projects/{id}/wizard/answer` — إجابة مرحلة
- `POST /projects/{id}/wizard/chat` — شات حرّ واعٍ للـ wizard
- `POST /projects/{id}/chat` — شات legacy
- `POST /projects/{id}/independence/request` — بدء الاستقلالية
- `POST /ai/instant-build`

---

## Landing Page
- "إنشاء المواقع" — ✨ **مفتوح** → `/websites`
- "تصميم الألعاب" / "إنشاء الفيديو" / "توليد الصور" — 🔒 **قريباً**

## Credentials
- Email: owner@zitex.com | Password: owner123

---

## Changelog
### Feb 2026 — Website Studio v2 (Wizard + Top-Template Layout)
- رقائق أنماط بصرية (10 variants) للقالب الواحد
- Wizard تفاعلي بـ 10 خطوات مع تخطي مشروط
- ChatBar بالأسفل مع رقائق ديناميكية + multi-select + free-text
- Independence modal (Vercel/Netlify/GitHub) دون كشف كود
- endpoint `/apply-variant` لتبديل الأنماط دون فقد الأقسام
- AI directives `[WIZARD_ACTION]` لأولوية طلبات المستخدم

### Feb 2026 — Isolated Modules
- عزل websites في `/backend/modules/websites/`
- Visual Designer مع Konva.js (سينتقل لاحقاً لـ games module)

---

## Next Modules (مرحلة مرحلة)
- 🔒 **Games Module**: `backend/modules/games/` (استخدام البنية نفسها)
- 🔒 **Videos Module**: `backend/modules/videos/`
- 🔒 **Images Module**: `backend/modules/images/`

## P1 Backlog
- Phase B: Stripe subscription قبل الوصول لاستوديو
- Phase C: تسليم الكود تدريجياً ملف-ملف + أدلة نشر تفاعلية
- Dashboard compilation (حال اختار المستخدم dashboard=admin/customer) — بناء صفحة `/admin` داخل HTML المُصدَّر

## P2 Backlog
- Admin Control Panel (dynamic pricing)
- Full i18n (EN/AR)
- Mobile App Compilation (.apk/.ipa pipeline)

---

## Tech Stack
- Frontend: React + Tailwind + sonner + lucide-react + Konva (designer)
- Backend: FastAPI + Motor (MongoDB async) + litellm + Emergent LLM Key
- Hosting: Railway (production) — preview على Emergent K8s

## Key Files (للنشر على Railway)
1. `backend/modules/websites/` — كامل المجلد (7 ملفات)
2. `backend/server.py` — register_routes call
3. `frontend/src/pages/websites/WebsiteStudio.js`
4. `frontend/src/pages/LandingPage.js`
5. `frontend/src/App.js`
