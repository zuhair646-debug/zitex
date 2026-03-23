# Zitex - منصة الإبداع بالذكاء الاصطناعي

## الوصف
منصة متكاملة للمحادثة مع الذكاء الاصطناعي لتوليد الصور والفيديوهات السينمائية وبناء المواقع، مع حفظ جميع المشاريع والمحادثات للأبد.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI (Python) + Modular Services
- **Database**: MongoDB
- **AI Integration**: 
  - GPT-4o (المحادثة الذكية)
  - Gemini Nano Banana (توليد الصور)
  - Sora 2 (فيديوهات سينمائية - 2-5 دقائق للتوليد)
  - ElevenLabs (تحويل النص إلى صوت)

## الميزات المكتملة

### ✅ المرحلة 1+2: الشات الذكي
- [x] شات AI تفاعلي باللغة العربية
- [x] توليد صور فوري عبر المحادثة
- [x] توليد فيديوهات سينمائية (Sora 2)
- [x] بناء مواقع عبر الشات
- [x] حفظ جميع المحادثات والمشاريع
- [x] أزرار تحميل لجميع الأصول

### ✅ المرحلة 3: النشر والتوزيع
- [x] صفحة المشاريع `/projects`
- [x] روابط منصات النشر (Vercel, Netlify, GitHub Pages)
- [x] تحميل المشاريع كـ ZIP
- [x] تعليمات النشر خطوة بخطوة
- [x] دليل "3 خطوات للنشر"

## API Endpoints

### Chat API
```
POST /api/chat/sessions          - إنشاء جلسة جديدة
GET  /api/chat/sessions          - قائمة الجلسات
GET  /api/chat/sessions/{id}     - جلسة محددة
POST /api/chat/sessions/{id}/messages - إرسال رسالة
DELETE /api/chat/sessions/{id}   - حذف جلسة
```

### Deployment API
```
POST /api/deploy/projects        - إنشاء مشروع
GET  /api/deploy/projects        - قائمة المشاريع
GET  /api/deploy/projects/{id}   - مشروع محدد
GET  /api/deploy/projects/{id}/download - تحميل ZIP
```

## إعدادات الفيديو (Sora 2)
- **المدة**: 4، 8، أو 12 ثانية
- **الدقة**: 
  - 1280x720 (HD)
  - 1792x1024 (عريض)
  - 1024x1792 (عمودي)
  - 1024x1024 (مربع)
- **الوقت**: 2-5 دقائق للتوليد

## الصفحات
- `/` - الصفحة الرئيسية
- `/login` - تسجيل الدخول
- `/register` - التسجيل
- `/chat` - الشات الذكي ⭐
- `/projects` - مشاريعي والنشر ⭐
- `/dashboard` - لوحة تحكم العميل
- `/admin` - لوحة تحكم الأدمن

## بيانات الدخول
- **Email**: owner@zitex.com
- **Password**: owner123

## ملاحظات تقنية
- توليد الفيديو يستغرق 2-5 دقائق (Sora 2)
- الصور تُنشأ فوراً (Gemini)
- المواقع تُنشأ في ثوانٍ (GPT-4o)

## المهام المتبقية
- [ ] تكامل PayPal للدفع الدولي
- [ ] نظام النقاط/الرصيد
- [ ] إشعارات WhatsApp حقيقية

## آخر تحديث
March 23, 2026
