# Zitex AI Platform - PRD

## Original Problem Statement
منصة ذكاء اصطناعي احترافية باسم "Zitex" لإنشاء المواقع، توليد الصور، وإنتاج الفيديوهات للعملاء. تتضمن لوحة تحكم إدارية، إدارة العملاء، تخصيص المحتوى بالذكاء الاصطناعي، ونظام دفع.

## Current Architecture
- **Frontend:** React + Tailwind CSS + Shadcn UI (Vercel)
- **Backend:** FastAPI + Motor (Railway)
- **Database:** MongoDB (Railway)
- **AI Models:** GPT-5.2, GPT Image 1, Sora 2

## What's Been Implemented ✅

### Core Features (Working)
1. **🎤 المايكروفون (STT)** - تحويل الصوت لنص باستخدام OpenAI Whisper ✅
2. **🖼️ توليد الصور** - GPT Image 1 مع base64 encoding ✅
3. **🌐 إنشاء المواقع** - GPT-5.2 لتوليد HTML/CSS/JS ✅
4. **🎮 إنشاء الألعاب 3D** - Babylon.js ✅
5. **📱 تحسين العرض على الجوال** - Responsive design ✅
6. **💰 خصم النقاط** - 5 نقاط للصور، 20 للفيديو ✅
7. **🔊 TTS** - تحويل النص لصوت ✅

### Fixed Issues (This Session)
- ✅ إصلاح خطأ `openai_client is not defined` في STT
- ✅ إصلاح خطأ `security is not defined`
- ✅ تغيير `max_tokens` إلى `max_completion_tokens` لـ GPT-5.2
- ✅ إصلاح IndentationError في ai_chat_service.py
- ✅ إصلاح `elif is_game` المكرر
- ✅ إصلاح صور base64 (gpt-image-1 returns b64_json not url)
- ✅ تحسين عرض الجوال (max-width للصور والفيديو)

## Pending Issues ❌

### P0 - Critical
1. **🎬 الفيديو (Sora 2)** - `Video generation returned no data`
   - السبب: مشكلة في EMERGENT_LLM_KEY
   - الحل: إنشاء مفتاح جديد من https://www.emergentagent.com → Profile → Universal Key

## Technical Details

### Key Files
- `/backend/server.py` - Main FastAPI app
- `/backend/services/ai_chat_service.py` - AI generation logic
- `/frontend/src/pages/AIChat.js` - Chat interface

### Environment Variables (Railway)
- `OPENAI_API_KEY` - لـ GPT-5.2, GPT Image 1, Whisper, TTS
- `EMERGENT_LLM_KEY` - لـ Sora 2 video generation
- `MONGO_URL` - MongoDB connection
- `JWT_SECRET` - Authentication

### API Endpoints
- `POST /api/stt/transcribe` - Speech to text
- `POST /api/tts/generate` - Text to speech
- `POST /api/chat/sessions` - Create chat session
- `POST /api/chat/sessions/{id}/messages` - Send message

## Deployment
- **Frontend:** https://zitex.vercel.app
- **Backend:** https://zitex-production.up.railway.app
- **GitHub:** https://github.com/zuhair646-debug/zitex

## Credentials
- Email: `owner@zitex.com`
- Password: `owner123`

## Next Steps
1. إنشاء EMERGENT_LLM_KEY جديد لإصلاح الفيديو
2. اختبار جميع الميزات
3. تحسينات إضافية حسب الحاجة

## Session Date
April 10, 2026
