# Zitex - منصة الإبداع بالذكاء الاصطناعي

## Problem Statement
منصة متكاملة لإنشاء المواقع وتوليد الصور والفيديوهات باستخدام الذكاء الاصطناعي، مع نظام اشتراكات ونقاط ودعم الدفع البنكي السعودي و PayPal.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **AI Integration**: 
  - GPT-5.2 (النصوص والاقتراحات)
  - Gemini Nano Banana (توليد الصور)
  - ElevenLabs (تحويل النص إلى صوت - TTS)
  - Sora 2 (توليد الفيديو - مهيأ)
- **Notifications**: WhatsApp via CallMeBot API (MOCKED)

## User Personas
1. **المالك (Owner)**: صلاحيات كاملة مجانية، إدارة الموقع، إشعارات واتساب، إدارة الأدوار
2. **مدير أعلى (Super Admin)**: إدارة المستخدمين والطلبات والمدفوعات
3. **مدير (Admin)**: إدارة الطلبات والمدفوعات
4. **العميل (Client)**: إنشاء مواقع، توليد صور/فيديو بالاشتراك أو الدفع الفردي

## Role Hierarchy
| الدور | المستوى | الصلاحيات |
|-------|---------|-----------|
| owner | 100 | جميع الصلاحيات + نقل الملكية |
| super_admin | 80 | إدارة المستخدمين + تعيين المدراء |
| admin | 50 | إدارة الطلبات والمدفوعات |
| client | 10 | استخدام الخدمات |

## Core Requirements
- ✅ تصميم RTL عربي كامل
- ✅ شعار Zitex على شكل حرف Z
- ✅ نظام مصادقة JWT
- ✅ لوحات التحكم (عميل + أدمن)
- ✅ نظام الاشتراكات (صور/فيديو)
- ✅ نظام النقاط لإنشاء المواقع
- ✅ نظام الدفع اليدوي (بنكي + PayPal)
- ✅ صفحة الأسعار المفصلة
- ✅ حساب مالك مجاني
- ✅ 3 صور مجانية لكل عميل جديد
- ✅ 3 فيديوهات مجانية لكل عميل جديد
- ✅ تجربة إنشاء موقع محدودة مجانية
- ✅ إشعارات واتساب عند كل دفعة (MOCKED)

## What's Been Implemented (March 2026)

### Advanced Creative Suite (جديد)
- ✅ **تعديل الصور**: رفع صورة وإضافة نص عليها
  - اختيار موقع النص (أعلى/وسط/أسفل)
  - اختيار لون النص
  - تحديد حجم الخط
  - تحميل الصورة المعدلة

- ✅ **التعليق الصوتي للفيديو**: 
  - اختيار من 9+ أصوات (ElevenLabs)
  - معاينة الصوت قبل التوليد
  - دعم متعدد اللغات (عربي/إنجليزي)
  - ملاحظة: ElevenLabs free tier قد يكون محدوداً

- ✅ **أزرار التحميل**: 
  - تحميل الصور المُنشأة والمعدلة
  - تحميل الفيديوهات والصوت
  - تسجيل التحميلات في سجل النشاط

### Admin Controls (جديد)
- ✅ **سجل النشاط العام** `/admin/activity`:
  - عرض جميع الأنشطة على المنصة
  - فلتر حسب النوع (صور/فيديو/مدفوعات/إلخ)
  - بحث بالاسم أو البريد

- ✅ **إدارة المستخدمين المحسنة** `/admin/clients`:
  - عرض سجل نشاط كل مستخدم
  - تغيير أدوار المستخدمين (client/admin/super_admin)
  - تفعيل/تعطيل الحسابات
  - إضافة نقاط وتجارب مجانية
  - نقل الملكية (للمالك فقط)

### Free Trials System
- كل مستخدم جديد يحصل على:
  - 3 صور مجانية
  - 3 فيديوهات مجانية
  - تجربة موقع واحدة (معاينة محدودة)

### Backend APIs
- `/api/auth/*` - تسجيل، دخول، معلومات المستخدم
- `/api/voices` - قائمة الأصوات المتاحة للتعليق الصوتي
- `/api/tts/generate` - تحويل النص إلى صوت (ElevenLabs)
- `/api/generate/image` - توليد الصور
- `/api/images/edit` - تعديل الصور وإضافة نص
- `/api/images/upload-edit` - رفع صورة وتعديلها
- `/api/generate/video` - توليد الفيديو مع تعليق صوتي
- `/api/download/log` - تسجيل التحميلات
- `/api/requests/*` - إنشاء وإدارة طلبات المواقع
- `/api/payments/*` - إدارة المدفوعات
- `/api/websites/*` - إدارة المواقع المنجزة
- `/api/pricing` - عرض الأسعار
- `/api/admin/stats` - إحصائيات لوحة التحكم
- `/api/admin/users` - قائمة المستخدمين
- `/api/admin/users/{id}/activity` - سجل نشاط مستخدم
- `/api/admin/users/{id}/role` - تغيير دور المستخدم
- `/api/admin/users/{id}/deactivate` - تعطيل حساب
- `/api/admin/users/{id}/activate` - تفعيل حساب
- `/api/admin/users/{id}/add-credits` - إضافة نقاط
- `/api/admin/users/{id}/add-free-trials` - إضافة تجارب مجانية
- `/api/admin/activity` - سجل النشاط العام
- `/api/admin/settings/payment` - إعدادات الدفع

### Frontend Pages
- `/` - الصفحة الرئيسية
- `/login`, `/register` - المصادقة
- `/pricing` - الأسعار والباقات
- `/dashboard` - لوحة تحكم العميل
- `/dashboard/new-request` - طلب موقع جديد
- `/dashboard/requests` - طلباتي
- `/dashboard/websites` - مواقعي
- `/dashboard/images` - توليد وتعديل الصور
- `/dashboard/videos` - إنشاء الفيديو مع التعليق الصوتي
- `/admin` - لوحة تحكم الأدمن
- `/admin/requests` - إدارة الطلبات
- `/admin/payments` - إدارة المدفوعات
- `/admin/clients` - إدارة المستخدمين (محسنة)
- `/admin/websites` - إدارة المواقع
- `/admin/settings` - إعدادات الدفع + واتساب
- `/admin/activity` - سجل النشاط العام (جديد)

### Pricing Structure
| الخدمة | السعر الشهري | السعر الفردي | مجاني |
|--------|--------------|--------------|-------|
| توليد الصور | 100 ريال | 10 ريال/صورة | 3 صور |
| إنشاء الفيديو | 150 ريال | 20 ريال/فيديو | 3 فيديو |
| إنشاء المواقع | نظام نقاط | 50-300 نقطة | تجربة 1 |

### Credits Packages
- باقة المبتدئ: 100 نقطة = 50 ريال
- باقة المحترف: 500 نقطة = 200 ريال
- باقة الأعمال: 2000 نقطة = 700 ريال

## Owner Account
- **Email**: owner@zitex.com
- **Password**: owner123
- **Role**: owner + is_owner = true
- **WhatsApp**: 966507374438

## Known Limitations
- **ElevenLabs TTS**: Free tier قد يكون محدوداً ("Unusual activity detected")
- **WhatsApp**: إشعارات WhatsApp مُحاكاة (MOCKED) باستخدام CallMeBot placeholder

## Prioritized Backlog

### P0 (Critical) - ✅ DONE
- نظام المصادقة
- لوحات التحكم
- التجارب المجانية
- توليد الصور والفيديو
- تعديل الصور وإضافة النص
- التعليق الصوتي للفيديو
- سجل النشاط وإدارة الأدوار

### P1 (High Priority)
- تكامل PayPal للدفع الدولي
- نظام النقاط/الرصيد لإنشاء المواقع
- إشعارات البريد الإلكتروني

### P2 (Medium Priority)
- ترقية ElevenLabs إلى paid plan
- تقارير متقدمة
- دعم لغات متعددة (i18n)

## Test Reports
- `/app/test_reports/iteration_1.json`
- `/app/test_reports/iteration_2.json`
- `/app/test_reports/iteration_3.json` (أحدث)

## Last Updated
March 18, 2026
