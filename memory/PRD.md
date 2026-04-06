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
  - OpenAI TTS (تحويل النص إلى صوت - جديد!)
  - ElevenLabs (تحويل النص إلى صوت - جودة عالية)

## الميزات المكتملة

### ✅ المرحلة 1+2: الشات الذكي
- [x] شات AI تفاعلي باللغة العربية
- [x] توليد صور فوري عبر المحادثة
- [x] توليد فيديوهات سينمائية (Sora 2)
- [x] بناء مواقع عبر الشات
- [x] حفظ جميع المحادثات والمشاريع
- [x] أزرار تحميل لجميع الأصول

### ✅ الرد الصوتي (جديد - April 6, 2026)
- [x] **OpenAI TTS** - تحويل الردود إلى صوت ($0.015/1000 حرف)
- [x] **ElevenLabs** - جودة صوت عالية ($0.30/1000 حرف)
- [x] **9 أصوات OpenAI**: alloy, ash, coral, echo, fable, nova, onyx, sage, shimmer
- [x] **9 أصوات ElevenLabs**: Rachel, Domi, Bella, Antoni, Elli, Josh, Arnold, Adam, Sam
- [x] **زر تشغيل الصوت** على كل رسالة
- [x] **لوحة إعدادات الصوت** (المزود، الصوت، السرعة)
- [x] **تفعيل/إيقاف** الرد الصوتي التلقائي

### ✅ الإدخال الصوتي (جديد - April 6, 2026)
- [x] **زر المايكروفون** 🎤 للتحدث مباشرة
- [x] **OpenAI Whisper** - تحويل الكلام لنص
- [x] **عداد وقت التسجيل** (يظهر عدد الثواني)
- [x] **إرسال تلقائي** بعد تحويل الصوت
- [x] **دعم اللغة العربية** في التعرف على الكلام

### ✅ إصلاحات سابقة
- [x] إصلاح توليد الفيديو (Polling + Background Task)
- [x] إضافة خيارات المدة (50 ثانية + دقيقة كاملة)
- [x] إصلاح الـ AI Prompt ليُولّد الفيديو مباشرة

## API Endpoints

### TTS API (جديد)
```
GET  /api/tts/voices    - قائمة الأصوات المتاحة
POST /api/tts/generate  - توليد صوت من نص
```

### Chat API
```
POST /api/chat/sessions          - إنشاء جلسة جديدة
GET  /api/chat/sessions          - قائمة الجلسات
GET  /api/chat/sessions/{id}     - جلسة محددة
POST /api/chat/sessions/{id}/messages - إرسال رسالة
GET  /api/chat/video-requests    - طلبات الفيديو المعلقة
```

## إعدادات الصوت (TTS)

### OpenAI TTS
- **Model**: tts-1 (سريع) أو tts-1-hd (جودة عالية)
- **الأصوات**: alloy, ash, coral, echo, fable, nova, onyx, sage, shimmer
- **السرعة**: 0.25 إلى 4.0
- **التكلفة**: $0.015/1000 حرف

### ElevenLabs
- **Model**: eleven_multilingual_v2
- **الأصوات**: Rachel, Domi, Bella, Antoni, Elli, Josh, Arnold, Adam, Sam
- **التكلفة**: ~$0.30/1000 حرف

## الصفحات
- `/` - الصفحة الرئيسية
- `/login` - تسجيل الدخول
- `/register` - التسجيل
- `/chat` - الشات الذكي ⭐
- `/projects` - مشاريعي والنشر

## بيانات الدخول
- **Email**: owner@zitex.com
- **Password**: owner123

## ملاحظات تقنية
- TTS يعمل مع Emergent LLM Key (لا حاجة لمفتاح OpenAI منفصل)
- ElevenLabs يحتاج مفتاح API منفصل
- الصوت يُرسل كـ base64 data URL

## المهام المتبقية
- [ ] تكامل PayPal للدفع الدولي
- [ ] نظام النقاط/الرصيد
- [ ] إشعارات WhatsApp حقيقية

## آخر تحديث
April 6, 2026 - إضافة الرد الصوتي (OpenAI TTS + ElevenLabs)
