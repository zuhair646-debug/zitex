# Zitex - منصة الإبداع بالذكاء الاصطناعي

## Problem Statement
منصة متكاملة للمحادثة مع الذكاء الاصطناعي لتوليد الصور والفيديوهات السينمائية وبناء المواقع، مع حفظ جميع المشاريع والمحادثات للأبد.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI (Python) + Modular Services
- **Database**: MongoDB (sessions, assets, users)
- **AI Integration**: 
  - GPT-4o (المحادثة الذكية)
  - Gemini Nano Banana (توليد الصور)
  - Sora 2 (فيديوهات سينمائية 4K)
  - ElevenLabs (تحويل النص إلى صوت)

## User Personas
1. **المالك (Owner)**: صلاحيات كاملة مجانية
2. **مدير أعلى (Super Admin)**: إدارة المستخدمين والطلبات
3. **مدير (Admin)**: إدارة الطلبات والمدفوعات
4. **العميل (Client)**: استخدام الخدمات عبر الشات

## Core Features

### 🤖 نظام الشات الذكي (جديد - المرحلة 1 + 2)
- **محادثة تفاعلية**: تحدث مع AI باللغة العربية
- **توليد الصور**: "أريد صورة لقطة جميلة" → AI يولد الصورة
- **فيديوهات سينمائية**: Sora 2 بجودة 4K (4/8/12 ثانية)
- **تعليق صوتي**: ElevenLabs بأصوات واقعية متعددة اللغات
- **بناء المواقع**: AI يبني كود React/HTML كامل
- **حفظ المشاريع**: جميع المحادثات والأصول محفوظة للأبد
- **تحميل الأصول**: صور PNG، فيديو MP4، صوت MP3، كود JSON

### API Structure (New)
```
/api/chat/
  ├── sessions (POST) - إنشاء جلسة جديدة
  ├── sessions (GET) - استرجاع جلسات المستخدم
  ├── sessions/{id} (GET) - استرجاع جلسة مع الرسائل
  ├── sessions/{id} (DELETE) - أرشفة جلسة
  ├── sessions/{id}/messages (POST) - إرسال رسالة
  ├── sessions/{id}/assets (GET) - أصول الجلسة
  └── voices (GET) - الأصوات المتاحة
```

### Session Types
| النوع | الوصف | الأوامر |
|-------|-------|---------|
| general | محادثة عامة | جميع الأوامر |
| image | توليد الصور | [GENERATE_IMAGE: prompt] |
| video | فيديوهات سينمائية | [GENERATE_VIDEO: prompt] |
| website | بناء المواقع | [GENERATE_WEBSITE: requirements] |

### Video Settings (Sora 2)
- **المدة**: 4، 8، أو 12 ثانية
- **الدقة**: 
  - 1280x720 (HD أفقي)
  - 1792x1024 (عريض)
  - 1024x1792 (عمودي)
  - 1024x1024 (مربع)
- **وقت التوليد**: 2-5 دقائق

### Code Architecture (Updated)
```
/app/backend/
  ├── server.py          # Main FastAPI app
  ├── models/
  │   ├── __init__.py
  │   └── chat_models.py # ChatSession, ChatMessage, etc.
  ├── services/
  │   ├── __init__.py
  │   └── ai_chat_service.py # AIAssistant class
  └── routers/
      ├── __init__.py
      └── chat_router.py  # Chat API endpoints

/app/frontend/src/
  ├── App.js
  ├── components/
  │   └── Navbar.js      # مع زر "الشات الذكي"
  └── pages/
      ├── AIChat.js      # صفحة الشات الجديدة (جديد)
      ├── ImageGenerator.js
      ├── VideoGenerator.js
      └── ... (other pages)
```

## What's Been Implemented

### ✅ المرحلة 1 + 2 (مارس 2026)
- [x] نظام شات تفاعلي مع GPT-4o
- [x] توليد صور عبر المحادثة (Gemini)
- [x] دعم فيديوهات Sora 2 (جاهز للتشغيل)
- [x] تعليق صوتي ElevenLabs (جاهز)
- [x] بناء مواقع عبر الشات (جاهز)
- [x] حفظ المحادثات في MongoDB
- [x] أزرار تحميل لجميع الأصول
- [x] واجهة شات احترافية RTL
- [x] زر "الشات الذكي" في Navbar

### ✅ الميزات السابقة
- [x] نظام مصادقة JWT
- [x] لوحات التحكم (عميل + أدمن)
- [x] نظام التجارب المجانية
- [x] صفحة الأسعار
- [x] إدارة المستخدمين والأدوار
- [x] سجل النشاط
- [x] صفحات توليد الصور والفيديو (القديمة)

## Test Results (Latest)
- **Backend**: 100% (16/16 tests passed)
- **Frontend**: 100% (all features working)
- **Test File**: `/app/test_reports/iteration_4.json`

## Owner Account
- **Email**: owner@zitex.com
- **Password**: owner123
- **Role**: owner (unlimited access)

## Known Limitations
- **Sora 2**: توليد الفيديو يستغرق 2-5 دقائق
- **ElevenLabs**: Free tier محدود
- **WhatsApp**: إشعارات مُحاكاة (MOCKED)
- **Website Deployment**: لم يُنفذ بعد (المرحلة 3)

## Prioritized Backlog

### P0 (Done) ✅
- نظام الشات الذكي
- توليد الصور والفيديو عبر المحادثة
- حفظ المشاريع

### P1 (High Priority)
- **المرحلة 3**: نظام deployment للمواقع
- تكامل PayPal
- نظام النقاط/الرصيد

### P2 (Medium Priority)
- ترقية ElevenLabs
- تقارير متقدمة
- دعم لغات متعددة (i18n)

## URLs
- **Frontend**: https://creative-suite-test.preview.emergentagent.com
- **Chat Page**: /chat
- **API Docs**: /docs

## Last Updated
March 21, 2026
