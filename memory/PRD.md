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


### 🆕 Feb 25, 2026 — VERTICAL SECTIONS + LISTINGS + COMMAND CENTER (P1 — COMPLETE)

**1) Vertical-specific renderer sections** (`renderer.py`):
- `booking_widget` — نموذج حجز تفاعلي (اختر خدمة → موظف → تاريخ → slot → بيانات → تأكيد). يجلب الخدمات من `/public/{slug}/services` ويستخدم `/availability` لعرض slots متاحة فقط. يعمل تلقائياً للصالون/الحيوانات/الطبي/الجيم.
- `product_grid_filters` — شبكة منتجات تجارية مع فلاتر التصنيف + بحث فوري + أزرار "أضف للسلة" + تنبيه "آخر X قطعة". auto-refresh كل 60 ثانية.
- `stock_ticker` — شريط أسعار لحظية scrolling أفقي مع أسهم ▲▼ بلون أخضر/أحمر. 10 رموز: Tadawul + NASDAQ + Crypto.
- `listings_grid` — شبكة عقارات دلّال مع صور، فلتر "بيع/إيجار"، modal تفاصيل كامل مع زر واتساب للدلّال.

**2) Real Estate Vertical (دلّال العقارات) كامل:**
- `ListingsEngine` في `engines.py`: CRUD كامل (create/update/mark-sold/delete) + public listing API
- كل عقار يحوي: `title, price, transaction (بيع/إيجار), type, city, district, area_sqm, bedrooms, bathrooms, images, agent_phone, commission_pct`
- **حاسبة العمولات التلقائية** في dashboard stats: إجمالي المحفظة + عمولة متوقعة = Σ(price × commission_pct/100)
- `ListingsTab` UI: نموذج إضافة شامل + بطاقة لكل عقار مع عرض العمولة المتوقعة + زر "✓ مُباع" لتأشير البيع
- **E2E verified**: فيلا 2.5 مليون ر.س → عمولة متوقعة 62,500 ر.س (2.5%) ✓

**3) Driver Command Center (مركز قيادة السائقين) — حصري ومطور:**
- عنوان "🚀 مركز قيادة السائقين" + badge WebSocket حي
- 4 بطاقات KPI ملوّنة: موقع المتجر + سائقون نشطون + طلبات فعّالة + **طلبات بانتظار تعيين**
- قسم **"⏳ طلبات بانتظار سائق"** يعرض كل الطلبات التي بلا driver_id مع زر **"👤 عيّن سائق"**
- Modal اختيار السائق يفتح قائمة السائقين المتصلين ويعيّن بنقرة واحدة (PATCH /client/orders/{id})
- قسم السائقين محسّن: شارة خضراء نابضة للتحديثات الحديثة (<3 دقائق) + "آخر تحديث قبل X د" لكل سائق

**4) Payment Gateway Comparison (شرح تفصيلي):**
- `GET /api/websites/payment-gateways/compare` — 4 مزودين مع رسوم/تسوية/مناسبة لـ/مميزات/عيوب/ترخيص/وقت إعداد
- `GatewayCompareModal` في `ClientDashboard`: 4 بطاقات جنباً إلى جنب تفتح بزر "📊 مقارنة تفصيلية" داخل تبويب الدفع
- محتوى ثري: Moyasar (2.5%, ساما), Tabby (4-6%, دفع فوري للتاجر), Tamara (5-7%, 30 يوم)، COD (0%, مجاني)
- كل بطاقة بها روابط signup_url + pros/cons + currencies + license + setup_time

**Files added**:
- في `engines.py`: `ListingsEngine` endpoints (`/client/listings`, `/public/{slug}/listings`, `mark-sold`)
- في `payment_gateways.py`: `compare_all()` + بيانات comparison لكل مزود
- في `renderer.py`: 4 sections جديدة (`_section_booking_widget`, `_section_product_grid_filters`, `_section_stock_ticker`, `_section_listings_grid`)
- في `ClientDashboard.js`: `ListingsTab`, `GatewayCompareModal`, تطوير كامل لـ`LiveMapTab` بمركز القيادة

**New vertical ideas** (للجلسات القادمة):
- 💇‍♀️ **صالون نساء** — مشابه للصالون العام لكن بـcategories (تجميل/سبا/حناء)
- 🍰 **مخبز/حلويات** — طلبات خاصة + مناسبات (كيك جاتوه)
- 🚗 **غسيل سيارات متنقل** — حجز مع موقع العميل + أنواع (عادي/تلميع/تنظيف داخلي)
- 🏊 **نوادي رياضية** — حجز ملاعب + اشتراكات زمنية
- 📚 **مكتبة/قرطاسية** — كتب + مستلزمات + تصفح بـISBN
- 🎨 **معارض فنية** — لوحات للبيع + جولة افتراضية + sold out status
- 🛠️ **فني صيانة** — حجز زيارة منزلية + أنواع خدمات (كهرباء/سباكة) + تقدير سعر
- 💍 **مجوهرات** — كتالوج ثمين + أسعار ذهب لحظية + حاسبة شراء

**Tool flexibility roadmap** (قيد التخطيط للجلسة القادمة):
- `style_variant` لكل widget: السلة بـ3 أشكال (مستطيلة/دائرية/باقة), الخريطة بـ3 ألوان (فاتح/غامق/satellite), زر الدفع بـ4 أنماط
- `position` قابل للتحريك: top-left/top-right/bottom-left/bottom-right/fixed-custom (x,y)
- Drag-and-drop بسيط في الـstudio للمعاينة المباشرة قبل الحفظ


### 🆕 Feb 24, 2026 — PORTFOLIO WIDGET + Tabby/Tamara FULL INTEGRATION (P1 — COMPLETE)

#### A) Portfolio Trading Widget (for stocks vertical)

**On any generated site** with `project.vertical = 'stocks'`, the renderer now injects a **floating 📈 button (top-left)** that opens a full trading modal:

- **Stats header**: الرصيد النقدي + قيمة الاستثمارات + الأرباح/الخسائر الكلية (ألوان أخضر/أحمر)
- **Inline SVG chart**: آخر 40 قيمة للمحفظة (خط صاعد/هابط حسب الاتجاه)
- **3 تبويبات**: محفظتي / السوق / السجل
- **شراء/بيع مباشر** داخل الـwidget: اختيار الرمز → حقل الكمية → زر تأكيد → تحديث فوري
- **auto-refresh** كل 15 ثانية عندما يكون الـmodal مفتوحاً
- **تحذير قانوني**: "⚠️ محاكاة تعليمية — لا أموال حقيقية" أسفل كل صفحة

**E2E verified**: شراء 5 أسهم معادن → الرسالة "تم الشراء، الرصيد الجديد: 47,806.05 ر.س" → ظهر المركز في محفظتي مباشرة.

#### B) Tabby + Tamara BNPL — كامل end-to-end

**TabbyProvider** (`modules/websites/payment_gateways.py`):
- `create_checkout()` → POST /api/v2/checkout بـBearer public_key، payload كامل (buyer/shipping/order.items/meta)، lang=ar
- `verify()` → GET /api/v2/checkout/{id} بـBearer secret_key
- `test()` → smoke test بمفتاح public_key يتأكد صحته

**TamaraProvider** (`modules/websites/payment_gateways.py`):
- Base URL: `api-sandbox.tamara.co` (sandbox) / `api.tamara.co` (prod)
- `create_checkout()` → POST /checkout مع `payment_type: PAY_BY_INSTALMENTS, instalments: 3, country_code: SA, locale: ar_SA`
- `verify()` → GET /orders/{id}
- `test()` → GET /merchants/me للتحقق من api_token

**Routes محدّثة** (`routes.py`):
- `/client/payment-gateways/tabby/test` و `/tamara/test` الآن تتصل بـAPI الحقيقية
- `/public/{slug}/payments/init` يعالج `provider=tabby` و `provider=tamara`:
  - ينشئ checkout session عبر provider-class
  - يحفظ `order.payment = {provider, checkout_id, tamara_order_id?, status: initiated, amount_sar}`
  - يُعيد `redirect_url` → الواجهة تحوّل العميل لصفحة BNPL
- `/public/{slug}/payments/callback` يتحقق من كلا provider ويحدّث الحالة:
  - Tabby: APPROVED/AUTHORIZED/CLOSED → paid
  - Tamara: APPROVED/AUTHORISED/FULLY_CAPTURED → paid
- `/public/{slug}/payment-gateways` الآن يُظهر 4 مزودين مفعّلين للعميل: moyasar + tabby + tamara + cod

**E2E verified (Apr 23, 2026)**:
- ✅ Tabby `test` بمفاتيح وهمية → "المفتاح غير صحيح (401)" (يتصل بـapi.tabby.ai الحقيقي)
- ✅ Tamara `test` بـtoken وهمي → "API Token غير صحيح (401)" (يتصل بـapi-sandbox.tamara.co الحقيقي)
- ✅ `/payments/init` مع provider=tabby → 502 "Tabby 401:" (إثبات حقن مفاتيح المستأجر في الاستدعاء)
- ✅ `/payments/init` مع provider=tamara → 502 "Tamara 401: Invalid credentials"
- ✅ عند إدخال المستأجر مفاتيحه الحقيقية من داشبورد Tabby/Tamara، التدفق يعمل end-to-end فوراً

**Files modified**:
- `/app/backend/modules/websites/payment_gateways.py` — TabbyProvider + TamaraProvider + load_tabby/load_tamara
- `/app/backend/modules/websites/routes.py` — handlers + callback verification
- `/app/backend/modules/websites/renderer.py` — portfolio widget injection

**Files added**: `_portfolio_overlay()` inside renderer.py (inline HTML+CSS+JS)


### 🆕 Feb 23, 2026 — VERTICALS SYSTEM (P0 — FOUNDATION COMPLETE)

**الهدف**: كل فئة موقع متخصصة فعلاً بـwizard مختلف + أقسام مميزة + نموذج بيانات خاص + تبويبات لوحة تحكم مختلفة. لا قوالب عامة.

**9 Verticals متاحة** (`/app/backend/modules/websites/verticals.py`):
| Icon | id | الاسم | الميزات |
|---|---|---|---|
| 🍽️ | restaurant | مطاعم ومقاهي | orders |
| 💈 | salon | صالونات وحلاقة | bookings, services |
| 🐱 | pets | خدمات الحيوانات | bookings, services, pet_registry |
| 🛒 | ecommerce | تجارة إلكترونية | products, orders |
| 📈 | stocks | استثمار ذكي (محاكاة) | portfolio, ai_trading |
| 🏥 | medical | عيادات طبية | bookings, services, branches |
| 🏋️ | gym | صالات رياضية | bookings, services, memberships |
| 🎓 | academy | أكاديميات | courses, enrollments |
| 🏠 | realestate | عقارات | listings, mortgage_calculator |

كل vertical لديه: `wizard_questions` فريدة، `sample_services`/`sample_products` للتهيئة التلقائية، `dashboard_tabs` مخصصة، `sample_sections` للعرض.

**3 محركات عامة قابلة لإعادة الاستخدام** (`modules/websites/engines.py`):

1. **Booking Engine** (للصالون/الحيوانات/الطبي/الجيم):
   - Services CRUD: `GET/POST/PUT/DELETE /api/websites/client/services`
   - Staff CRUD: `GET/POST/DELETE /api/websites/client/staff`
   - Client bookings: `GET /client/bookings?status=`, `PATCH /client/bookings/{id}` (confirm/in_progress/completed/cancelled)
   - Public availability: `GET /public/{slug}/availability?service_id=&date=&staff_id=` → returns 26 time slots 9 ص - 10 م
   - Public booking: `POST /public/{slug}/bookings` — يمنع double-booking بـ409 إذا كان الوقت محجوز
   - WebSocket broadcast: `booking_created` و `booking_status`

2. **Product Engine** (للتجارة الإلكترونية):
   - Products CRUD: `GET/POST/PUT/DELETE /api/websites/client/products` (مع stock + variants + category)
   - Public catalog: `GET /public/{slug}/products?category=&q=` — فلترة + بحث + قائمة categories تلقائية

3. **Portfolio Engine** (للأسهم — محاكاة فقط):
   - Market quotes: `GET /market/quotes?symbols=` — 10 رموز من Tadawul + NASDAQ + Crypto بأسعار تتحرك كل 5 دقائق (deterministic walk)
   - Customer portfolio: `GET /public/{slug}/portfolio/me` — رصيد ابتدائي 50,000 ر.س، positions مع PnL محسوب
   - Trading: `POST /public/{slug}/portfolio/trade` `{symbol, side:buy|sell, qty}` — يحدّث avg_price + balance + trades log؛ يرفض الشراء برصيد غير كاف والبيع أكثر من المملوك

**Auto-seeding**: عند إنشاء مشروع بـ `category=barber` مثلاً، النظام يربط تلقائياً `vertical=salon` ويُحمّل 3 خدمات نموذجية فوراً.

**Client Dashboard — تبويبات مشروطة**:
- صالون/حيوانات/طبي/جيم → **المواعيد** + **الخدمات** (بدل "الطلبات")
- تجارة إلكترونية → **المنتجات** + "الطلبات" (هجين)
- مطعم → "الطلبات" + "السائقون" + "التوصيل" (كما هو)
- الأسهم → (تبويبات محفظة قادمة في تحسين لاحق)

**Frontend components جديدة** في `ClientDashboard.js`:
- `BookingsTab`: عرض + فلترة حسب الحالة + أزرار التحكم (تأكيد/بدء/إنهاء/إلغاء)
- `ServicesTab`: إضافة خدمة (اسم + سعر + مدة) + حذف
- `ProductsTab`: إضافة منتج (اسم + سعر + مخزون + فئة) + تنبيه "⚠️" عند مخزون ≤ 5 + حذف

**E2E verified (Apr 23, 2026)**:
- ✅ 9 verticals في `/verticals`
- ✅ إنشاء خدمة + موظف + متاح 26 slot لليوم التالي
- ✅ حجز ناجح + رفض double-book بـ409
- ✅ إنشاء منتج + فلترة categories تلقائية
- ✅ Portfolio: شراء 10 Apple بـ$189.82، رصيد 48,101.80، رفض شراء أكبر من الرصيد
- ✅ تبديل `vertical=salon` في DB → التبويبات تتحول تلقائياً (المواعيد/الخدمات ظهرت، الطلبات/السائقون اختفت)
- ✅ كل endpoints المطعم القديمة لا تزال تعمل 200 OK (لا regression)

**Files added**:
- `/app/backend/modules/websites/verticals.py` — 9 verticals متعددة الإعدادات
- `/app/backend/modules/websites/engines.py` — booking + product + portfolio

**Files modified**:
- `/app/backend/modules/websites/routes.py` — هوك التسجيل + auto-seed عند إنشاء المشروع + vertical في client/login
- `/app/frontend/src/pages/client/ClientDashboard.js` — 3 tabs جديدة + شرطية التبويبات


### 🆕 Feb 22, 2026 — MULTI-TENANT PAYMENT GATEWAYS (P1 — COMPLETE for Moyasar + COD)

**Architecture**: Each tenant (website_project) stores its OWN payment provider keys encrypted at rest with Fernet. Every end-user checkout uses the tenant's keys → money settles directly to tenant's account. No intermediary/platform wallet.

**Supported providers** (in `modules/websites/payment_gateways.py`):
- **Moyasar** (Saudi, SAMA-licensed) — full integration: Mada, STC Pay, Apple Pay, Visa/Master. Hosted Invoice redirect flow.
- **COD** (Cash on Delivery) — no keys; just enable toggle.
- **Tabby** (BNPL) — key storage + UI only (activation flow pending).
- **Tamara** (BNPL) — key storage + UI only (activation flow pending).

**Security**:
- Secret keys encrypted with Fernet key from `PAYMENT_KEYS_FERNET` env var.
- Keys returned to frontend as masked previews (e.g., `••••••b12345`). Never plaintext after save.
- Amount/currency always server-side from order.total — end-user cannot manipulate.
- Server-side re-verification via `fetch_invoice()` in the callback before marking paid.
- Per-tenant webhook path: `POST /api/websites/webhook/payments/{slug}/moyasar` — idempotent.

**New backend endpoints** (all under `/api/websites`):
- `GET /payment-gateways/catalog` (public) — list provider metadata
- `GET /client/payment-gateways` (ClientToken) — list configured gateways with masked previews
- `PUT /client/payment-gateways/{provider_id}` (ClientToken) — enable/disable + save keys
- `DELETE /client/payment-gateways/{provider_id}` (ClientToken)
- `POST /client/payment-gateways/{provider_id}/test` (ClientToken) — live credential validation against provider API
- `GET /public/{slug}/payment-gateways` (public) — safe list of ENABLED gateways visible on checkout
- `POST /public/{slug}/payments/init` (SiteToken) — create hosted invoice, return `redirect_url`
- `GET /public/{slug}/payments/callback` — Moyasar success redirect; server-verifies via `fetch_invoice()`
- `POST /webhook/payments/{slug}/moyasar` — webhook receiver

**Frontend**:
- New `PaymentGatewaysTab` in `ClientDashboard` (`/app/frontend/src/pages/client/ClientDashboard.js`) — per-provider cards with masked keys, enable toggle, methods checkboxes, Save + 🧪 Test buttons. Link to Moyasar dashboard for key acquisition.
- Generated site (`renderer.py`):
  - On page load fetches `/payment-gateways` → stores in `window.__zxPayGateways`.
  - Checkout form now shows a payment-method `<select>` dynamically populated from the tenant's enabled gateways.
  - On order submit: if chosen provider is hosted (e.g., Moyasar), calls `/payments/init` and `window.location.href=redirect_url`.
  - For COD: remains client-side success card.

**E2E verified (Apr 22, 2026)**:
- Client dashboard "الدفع" tab renders all 4 providers ✅
- Saved fake Moyasar keys → masked preview OK, `/test` correctly returned 401 ("المفتاح السري غير صحيح") ✅
- Enabled COD; `GET /public/{slug}/payment-gateways` returned both ✅
- `POST /payments/init` with `provider=cod` → order.payment={provider:cod, status:pending} ✅
- `POST /payments/init` with `provider=moyasar` using fake keys → 401 from Moyasar (proves real tenant-key injection) ✅
- Rendered HTML contains `zx-ord-pay` dropdown + `__zxPayGateways` + `/payments/init` fetch ✅

**New env var**: `PAYMENT_KEYS_FERNET` (Fernet key) added to `/app/backend/.env`.

**Files added**:
- `/app/backend/modules/websites/payment_gateways.py` — provider classes + encryption

**Files modified**:
- `/app/backend/modules/websites/routes.py` — 9 new endpoints
- `/app/backend/modules/websites/renderer.py` — checkout dropdown + init flow
- `/app/frontend/src/pages/client/ClientDashboard.js` — PaymentGatewaysTab + nav tab "💳 الدفع"
- `/app/backend/.env` — `PAYMENT_KEYS_FERNET`


### 🆕 Feb 22, 2026 — REAL-TIME WEBSOCKETS (P1 — COMPLETE)

**What was added** (replaces 15–30 second HTTP polling with true realtime):

1. **New file** `/app/backend/modules/websites/realtime.py` — `RealtimeManager` singleton with two connection pools per slug: `client` (dashboard viewers) and `driver` (drivers). Broadcast methods: `broadcast_to_clients`, `broadcast_to_drivers`, `broadcast_all`. Auto-cleans dead sockets.

2. **Two WebSocket endpoints** in `modules/websites/routes.py`:
   - `WS /api/websites/ws/client/{slug}?token=<ClientToken>` — rejects invalid tokens with HTTP 4401, sends `hello` on connect, accepts `ping` for keepalive.
   - `WS /api/websites/ws/driver/{slug}?token=<DriverToken>` — drivers may push `{"type": "location", "lat": ..., "lng": ...}` through the same socket; server persists and rebroadcasts to client dashboard in <100ms.

3. **Broadcasts plugged into existing HTTP mutations** (backward-compatible):
   - `POST /public/{slug}/orders` → broadcasts `order_created` to clients+drivers
   - `PATCH /client/orders/{id}` → broadcasts `order_status` with driver assignment
   - `POST /driver/{slug}/location` → broadcasts `location` to clients

4. **Frontend**:
   - `ClientDashboard.js` `LiveMapTab`: uses `WebSocket(wss://.../api/websites/ws/client/...)` with auto-reconnect (3s backoff) + ping every 25s. Initial HTTP fetch only; all subsequent updates arrive via WS. Shows green "🟢 مباشر (WebSocket)" badge when online.
   - `DriverDashboard.js`: WebSocket connection for instant order assignment updates. Location push cadence tightened from 30s → 10s (WS is cheap). Graceful fallback to HTTP POST if WS is offline.

**E2E verified**:
- Python WebSocket client: `hello` handshake + `location` push from driver → received by client in real-time + `ping/pong` keepalive + bad token rejected with InvalidStatus 403 ✅
- Client dashboard UI: "مباشر (WebSocket)" badge visible, map loaded successfully ✅

**Files added**:
- `/app/backend/modules/websites/realtime.py`

**Files modified**:
- `/app/backend/modules/websites/routes.py` (WS endpoints + broadcast hooks)
- `/app/frontend/src/pages/client/ClientDashboard.js` (LiveMapTab WS)
- `/app/frontend/src/pages/driver/DriverDashboard.js` (driver WS + faster location pings)


### 🆕 Feb 22, 2026 — STRIPE SUBSCRIPTION GATE (P0 — COMPLETE)

**What was added** (monetization barrier before Website Studio):

1. **New backend module** `/app/backend/modules/billing/` — self-contained Stripe integration using `emergentintegrations.payments.stripe.checkout` SDK.

2. **Fixed server-side package** `studio_monthly` @ **$50.00 USD / 30 days** (frontend cannot manipulate amount — price is defined only in `PACKAGES` dict in `routes.py`).

3. **New endpoints** (all under `/api/billing`):
   - `GET /billing/packages` (public catalog)
   - `GET /billing/subscription` (JWT-auth) — returns `{active, bypass, expires_at, package_id}`. **Owner/admin bypass**: users with role ∈ {owner, super_admin, admin} or `is_owner=True` bypass the gate.
   - `POST /billing/checkout` (JWT-auth) — creates Stripe Checkout Session. Takes `{package_id, origin_url}`; backend constructs `success_url={origin}/billing/success?session_id={CHECKOUT_SESSION_ID}` + `cancel_url={origin}/billing/cancel`.
   - `GET /billing/status/{session_id}` (JWT-auth, ownership-checked) — polls Stripe; on first `paid` status, inserts into `studio_subscriptions` (idempotent — won't duplicate on repeated polls).
   - `POST /webhook/stripe` (no auth; Stripe-Signature verified) — webhook handler also idempotent. Path matches playbook requirement.

4. **New MongoDB collections**:
   - `payment_transactions` — every checkout session (initiated → paid/expired).
   - `studio_subscriptions` — active subscription records with `expires_at` for 30-day access window.

5. **Frontend SubscriptionGate** (`/app/frontend/src/pages/billing/SubscriptionGate.js`):
   - Wraps `/websites` route in `App.js`.
   - Queries `/billing/subscription` on mount; if `active:true` renders children, else renders a beautiful Arabic RTL paywall with feature bullets and a single "اشترك الآن" CTA that calls `/billing/checkout` and redirects to `data.url`.
   - Shows test card hint in test mode.

6. **Success/cancel pages**:
   - `/billing/success` polls `/billing/status/{sid}` up to 8 times @ 2.5s intervals. On `paid`, shows success card with "ابدأ البناء الآن" button.
   - `/billing/cancel` shows friendly retry option.

**E2E verified** (Apr 22, 2026):
- Owner → bypass, studio loads directly. ✅
- Non-owner client `gatetest@zitex.com` → gate shown, Stripe redirect OK at US$50.00, card 4242… accepted, success page polled & confirmed, studio unlocked. ✅
- `studio_subscriptions` collection: exactly 1 doc after 1 successful payment (idempotency). ✅

**Environment**:
- `STRIPE_API_KEY=sk_test_emergent` added to `/app/backend/.env`.
- No user-supplied key required — uses Emergent-provided Stripe test key.

**Files added**:
- `/app/backend/modules/billing/__init__.py`
- `/app/backend/modules/billing/routes.py`
- `/app/frontend/src/pages/billing/SubscriptionGate.js`
- `/app/frontend/src/pages/billing/BillingSuccess.js`
- `/app/frontend/src/pages/billing/BillingCancel.js`

**Files modified**:
- `/app/backend/server.py` (register billing module)
- `/app/backend/.env` (STRIPE_API_KEY)
- `/app/frontend/src/App.js` (wrap /websites with gate, add billing routes)
- `/app/memory/test_credentials.md` (added gatetest user + Stripe test card docs)



### 🆕 Feb 22, 2026 — ADVANCED COMMERCE (loyalty + coupons + live map + PWA + payment catalog + ticket replies)

**What was added**:
1. **🎁 Loyalty Points System**: welcome bonus (50 pts default), earn 1 pt/SAR spent, redeem at 0.1 SAR/pt default, referral bonus 100 pts. Customer's points balance auto-updates on each order (earn + redeem). Settings per-site in `LoyaltyTab`.

2. **🎟️ Coupons**: create `WELCOME10`-style codes (% discount OR fixed amount), min order, max uses, tracked usage. Full CRUD in `CouponsTab`. Applied in checkout modal on public site.

3. **🗺️ Live Map** (`LiveMapTab`): OSM embed showing store base + online drivers + active orders. Auto-refresh every 15s (polling, not WS — simpler & sufficient). Stats cards below.

4. **📱 PWA Manifest** (`GET /public/{slug}/manifest.json`): injected in every rendered site's `<head>` so customers can "Add to home screen" and get an app-like experience.

5. **💳 Payment Methods Catalog** (`GET /payment-methods`): 8 methods (Stripe, Mada via Stripe, Apple Pay, STC Pay, Tamara, Tabby, COD, Bank). 5 ready now, 3 infrastructure pending gateway keys. Integrated into checkout dropdown.

6. **💬 Owner Ticket Replies**: endpoint `POST /admin/sites/{id}/tickets/{tid}/reply` + `/admin/all-tickets` aggregator + `GET` for all tickets across sites. Client dashboard now displays replies (green callout below each ticket with `data-testid="ticket-reply-{id}"`).

7. **Payment methods in checkout**: dropdown with COD, Mada, Apple Pay, Stripe, Bank.

**13 new endpoints** added:
- `POST/GET /client/loyalty-settings`
- `POST/GET/DELETE /client/coupons`
- `POST /public/{slug}/coupons/apply`
- `GET /public/{slug}/my-points`
- `GET /client/live-map`
- `GET /public/{slug}/manifest.json`
- `GET /payment-methods`
- `GET /admin/all-tickets`

**Tested** via curl end-to-end: customer registration gives 50 welcome pts, coupon WELCOME10 applies 10% on 100ر=10ر discount, order earns 120 pts for 120 ر total → balance math verified (50+120-20=150 ✓).

**📌 Stripe not yet wired** — requires `integration_playbook_expert_v2` per platform rules. Will be a separate focused task.



### 🆕 Feb 21, 2026 (PM-2) — PROFESSIONAL POLISH (5 additions)

**1. Driver Dashboard (`/driver/:slug`)**:
- Phone+password login → DriverToken session
- Assigned orders list with auto-refresh every 30s
- "بدء مشاركة موقعي" toggle → pings GPS to backend every 30s
- One-tap actions: 📞 call customer, 🗺 navigate in Google Maps
- File: `/app/frontend/src/pages/driver/DriverDashboard.js`

**2. Haversine Delivery Fee Calculator**:
- New `_haversine_km()` + `delivery_settings` per project ({base_lat, base_lng, base_fee, fee_per_km, free_delivery_above})
- Auto-applies when customer places order (lat/lng → km × fee_per_km + base)
- Free delivery threshold supported
- New `DeliverySettingsTab` in client dashboard with "use my location" button

**3. WhatsApp Auto-Notifications**:
- `PATCH /client/orders/{id}` now returns `whatsapp_link` (wa.me)
- 6 status messages in Arabic (accepted/preparing/ready/on_the_way/delivered/cancelled)
- Auto country-code normalization (05x → 966 5x)
- Client dashboard auto-opens WhatsApp after status change

**4. Owner Ticket Replies**:
- `POST /admin/sites/{id}/tickets/{tid}/reply` for owner reply + status change

**5. Tech Stack Info (`GET /tech-stack`)**:
- Returns 8 tech layers with Arabic rationale + 4 competitor comparisons + 4 performance benefits
- New `TechStackModal` accessible from owner studio top bar (🧩 التقنيات)

**Tested**: ✅ All 6 new endpoints work via curl (haversine=5.73km → 32.19 ر.س, free above 200 ر.س, wa.me link generated, driver login + location update)



### 🆕 Feb 21, 2026 (PM) — COMPLETE COMMERCE STACK (site-customers + orders + drivers + geolocation)

**What was added**:
1. **Per-site customer auth**: Each approved site has its own user base (`project.site_customers[]`).
   - POST `/public/{slug}/auth/register` `/login`, GET `/auth/me`
   - Injected auth modal (🔼 top-left `#zx-auth-fab`) with tabs (login/register)
   - Uses bcrypt + `SiteToken <session_token>` header
2. **Full cart + checkout (in the site's HTML)**:
   - Auto-wires `+ أضف للسلة` on any `[data-menu-item]` or `[data-product-item]` element
   - Cart modal with qty controls
   - Checkout with `navigator.geolocation` → stores `lat`/`lng` + address + note
   - POST `/public/{slug}/orders` creates the order
   - "📦 طلباتي" tracking view for the customer
3. **Orders pipeline** (7 statuses): pending → accepted → preparing → ready → on_the_way → delivered (+ cancelled)
   - Owner actions: PATCH `/client/orders/{id}` { status, driver_id }
   - New `OrdersTab` in ClientDashboard with status filters
4. **Drivers system**:
   - POST/GET/DELETE `/client/drivers` — add/list/remove drivers (bcrypt-hashed)
   - Driver auth: POST `/driver/login`, GET `/driver/{slug}/orders`, POST `/driver/{slug}/location`
   - New `DriversTab` in ClientDashboard
5. **Customers directory**: new `CustomersTab` showing all registered customers
6. **Renderer**: `_auth_and_commerce_overlay(slug)` injects vanilla-JS overlay (zero frameworks, sandbox-safe) — only on approved slugged sites

**Tested end-to-end via curl + screenshots**:
- ✅ Customer registers → receives SiteToken
- ✅ Order placed with 87 ر.س total (2 items + delivery fee) with geolocation
- ✅ Client dashboard shows the order + customer + can assign driver
- ✅ Owner sees auth FAB, cart FAB, book FAB — all functional in iframe

New endpoints (13): /public/{slug}/auth/{register,login,me}, /public/{slug}/orders, /public/{slug}/orders/my, /client/orders, /client/orders/{id} (PATCH), /client/drivers (CRUD), /client/customers, /driver/login, /driver/{slug}/orders, /driver/{slug}/location

**Demo accounts**:
- Site customer: phone `0501122334` password `pass123` (أحمد الزهراني)
- Driver: phone `0559988776` password `drv123` (فهد السائق)
- Client dashboard: slug `cozy-cafe-demo` password `WKDWkG0d`



### 🆕 Feb 21, 2026 — FULL DELIVERY SYSTEM (4 major features)

**1. Client Dashboard** (`/client/:slug`):
- JWT-lite auth via `client_access.session_token` + bcrypt password
- 5 tabs: Overview / Edit Sections / Messages / Support Tickets / Password
- Welcome Tour (6-step interactive onboarding)
- Inline section content editing (PATCH `/client/sections/{id}`)
- Messages inbox (from public `/contact` form)
- Support ticket system with 5 categories

**2. Curated Templates in Chat**:
- New `POST /propose-designs` returns 4 diverse proposals (luxury/modern/warm/playful)
- "💡 اقترح تصاميم" quick-chip in chat opens proposals panel inline
- One-click apply via `POST /apply-proposal` (merges mood + layout)

**3. Support Tickets**:
- Client-side create/list/view tickets
- Backend stores in `project.support_tickets` array
- Category tags: general/bug/content/design/other

**4. Quality Checks + Delivery Kit**:
- `GET /quality-checks` runs 9 automated checks (hero, footer, contact, brand, sections depth, payment, features, approved, client access)
- Returns score 0-100
- Shown inside `DeliveryKitModal` + all delivery links (public, share, client dashboard, credentials, stats)

**New backend endpoints** (14 total):
- POST `/projects/{id}/share` + GET `/share/{token}` + POST `/share/{token}/feedback`
- POST `/public/{slug}/contact`
- POST `/projects/{id}/client-access` + POST `/client/login`
- GET `/client/session` + PATCH `/client/sections/{id}` + POST `/client/change-password`
- GET `/client/messages` + POST `/client/messages/{id}/read`
- GET `/client/analytics` + POST `/client/logout`
- POST `/client/support-tickets` + GET `/client/support-tickets`
- POST `/projects/{id}/propose-designs` + POST `/projects/{id}/apply-proposal`
- GET `/projects/{id}/quality-checks` + GET `/projects/{id}/delivery-kit`

**Tested live demo**: https://ai-cinematic-hub-2.preview.emergentagent.com/sites/cozy-cafe-demo (public) · /client/cozy-cafe-demo (pwd: VvvK64BT) · QC score 100/100 · 2 contact messages received



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
