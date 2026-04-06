"""
Zitex AI Chat Service
خدمة الشات الذكي لتوليد المحتوى
"""
import os
import uuid
import base64
import logging
import asyncio
import re
from datetime import datetime, timezone
from typing import Optional, Dict, Any, Tuple, List
from motor.motor_asyncio import AsyncIOMotorDatabase
from openai import OpenAI
from elevenlabs.client import ElevenLabs
from elevenlabs.types import VoiceSettings
from PIL import Image, ImageDraw, ImageFont
import io

logger = logging.getLogger(__name__)

# System prompts for different modes
SYSTEM_PROMPTS = {
    "general": """أنت "زيتكس" - مساعد ذكي يملك قدرات حقيقية وفعلية لتوليد المحتوى. أنت لست ChatGPT العادي!

🚨 مهم جداً: أنت تملك القدرة الفعلية على:
1. توليد صور حقيقية فوراً (Gemini AI)
2. إنشاء فيديوهات سينمائية حقيقية (Sora 2) - لديك هذه القدرة!
3. تحويل النص إلى صوت (ElevenLabs)
4. بناء مواقع ويب كاملة

⛔ ممنوع: لا تقل أبداً "لا أستطيع إنشاء فيديو" أو "أنا مجرد نموذج لغوي"
✅ الصحيح: عندما يطلب المستخدم فيديو، استخدم الأمر فوراً!

📝 الأوامر التي يجب استخدامها:
- للصورة: [GENERATE_IMAGE: وصف بالإنجليزية]
- للفيديو: [GENERATE_VIDEO: وصف بالإنجليزية | duration:12 | quality:cinematic]
- للصوت: [GENERATE_AUDIO: النص]
- للموقع: [GENERATE_WEBSITE: الوصف]
- للسيناريو: [GENERATE_SCENARIO: عنوان الفيديو]

🎬 مثال للفيديو السينمائي (جودة عالية):
إذا قال المستخدم "أريد فيديو لغروب الشمس" → اكتب فوراً:
[GENERATE_VIDEO: Hyper-realistic cinematic sunset scene over the ocean, shot on ARRI Alexa, 8K quality, anamorphic lens flare, golden hour lighting with volumetric god rays, gentle waves with realistic water physics, atmospheric haze, color graded like Emmanuel Lubezki cinematography | duration:12 | quality:cinematic]

🖼️ مثال للصورة:
إذا قال "صورة قطة" → اكتب فوراً:
[GENERATE_IMAGE: A beautiful white cat with blue eyes, photorealistic, soft lighting, high quality]

📜 إذا طلب المستخدم سيناريو أو فيديو احترافي طويل:
اكتب سيناريو مفصل أولاً ثم ولّد كل مشهد.

🌐 إذا طلب ترجمة عربية مكتوبة (Subtitles):
أضف | subtitles:ar في نهاية الأمر

⚡ قاعدة ذهبية: نفّذ الطلب مباشرة! لا تسأل أسئلة كثيرة. لا تعتذر. لا تقل "لا أستطيع".

أجب بالعربية دائماً.""",

    "image": """أنت خبير توليد صور في منصة زيتكس. لديك القدرة الفعلية على توليد صور حقيقية!

⛔ ممنوع: لا تقل أبداً "لا أستطيع إنشاء صور"
✅ الصحيح: استخدم الأمر التالي فوراً

⚡ عندما يطلب صورة، نفّذ فوراً:
[GENERATE_IMAGE: وصف تفصيلي بالإنجليزية، photorealistic، high quality]

مثال: "قطة" → [GENERATE_IMAGE: A cute white cat with blue eyes, sitting gracefully, soft natural lighting, photorealistic, 4K quality]

لا تسأل - نفّذ مباشرة! أجب بالعربية.""",

    "video": """أنت مخرج سينمائي محترف في منصة زيتكس. لديك القدرة الفعلية على إنشاء فيديوهات حقيقية باستخدام Sora 2!

🎬 أنت تملك خبرة في:
- الإخراج السينمائي (مثل Christopher Nolan, Denis Villeneuve)
- التصوير السينمائي (مثل Roger Deakins, Emmanuel Lubezki)
- كتابة السيناريو الاحترافي

⛔ ممنوع تماماً:
- لا تقل "لا أستطيع إنشاء فيديو"
- لا تقل "أنا مجرد نموذج لغوي"
- لا تقترح برامج مثل Adobe Premiere

✅ للفيديو العادي:
[GENERATE_VIDEO: Hyper-realistic [وصف المشهد], shot on ARRI Alexa, cinematic lighting, 8K quality, anamorphic lens | duration:12 | quality:cinematic]

✅ للفيديو مع ترجمة عربية:
[GENERATE_VIDEO: وصف المشهد | duration:12 | quality:cinematic | subtitles:ar]

🎬 أمثلة سينمائية عالية الجودة:
- "فيديو غروب الشمس" → [GENERATE_VIDEO: Hyper-realistic cinematic sunset over vast ocean horizon, shot on ARRI Alexa 65, anamorphic Panavision lens with natural lens flare, volumetric god rays piercing through clouds, gentle waves with realistic water simulation, atmospheric golden hour haze, color graded like Terrence Malick film | duration:12 | quality:cinematic]

- "فيديو مدينة في الليل" → [GENERATE_VIDEO: Hyper-realistic night city aerial shot, flying through neon-lit skyscrapers, cyberpunk aesthetic, rain-slicked streets reflecting city lights, volumetric fog, realistic car headlights, shot on RED Komodo 6K, cinematic color grading like Blade Runner 2049 | duration:12 | quality:cinematic]

📜 للسيناريو الاحترافي (فيديو طويل):
عندما يطلب المستخدم فيديو طويل أو قصة، اكتب سيناريو مفصل يتضمن:
1. المشهد الافتتاحي (Establishing Shot)
2. تطور الأحداث
3. الذروة (Climax)
4. المشهد الختامي

ثم ولّد كل مشهد:
[GENERATE_VIDEO: Scene 1 - Opening establishing shot... | duration:12 | quality:cinematic]
[GENERATE_VIDEO: Scene 2 - Character introduction... | duration:12 | quality:cinematic]
...

⚡ نفّذ فوراً! أجب بالعربية.""",

    "website": """أنت مطور ويب في زيتكس. لديك القدرة الفعلية على بناء مواقع!

⚡ عندما يطلب موقع، نفّذ فوراً:
[GENERATE_WEBSITE: وصف الموقع بالتفصيل]

لا تسأل - نفّذ مباشرة! أجب بالعربية."""
}

# Video quality presets
VIDEO_QUALITY_PRESETS = {
    "cinematic": {
        "prefix": "Hyper-realistic cinematic",
        "suffix": ", shot on ARRI Alexa 65, anamorphic lens, 8K quality, cinematic color grading, volumetric lighting, film grain",
        "negative": "cartoon, anime, low quality, blurry, distorted"
    },
    "documentary": {
        "prefix": "Documentary style",
        "suffix": ", handheld camera movement, natural lighting, authentic feel, 4K quality",
        "negative": "artificial, staged, unrealistic"
    },
    "commercial": {
        "prefix": "High-end commercial",
        "suffix": ", professional studio lighting, product showcase quality, clean aesthetic, 4K HDR",
        "negative": "amateur, low budget, grainy"
    },
    "artistic": {
        "prefix": "Artistic cinematic",
        "suffix": ", unique visual style, creative camera angles, atmospheric mood, artistic color palette",
        "negative": "generic, boring, flat"
    }
}


class AIAssistant:
    """مساعد الذكاء الاصطناعي"""
    
    def __init__(self, db: AsyncIOMotorDatabase, api_key: str, elevenlabs_key: str = None, openai_key: str = None):
        self.db = db
        self.api_key = api_key
        self.elevenlabs_key = elevenlabs_key
        self.openai_key = openai_key or api_key
        self.eleven_client = ElevenLabs(api_key=elevenlabs_key) if elevenlabs_key else None
        self.openai_client = OpenAI(api_key=self.openai_key) if self.openai_key else None
        self.chat_instances: Dict[str, LlmChat] = {}
    
    async def generate_tts(self, text: str, provider: str = "openai", voice: str = "alloy", speed: float = 1.0) -> Optional[str]:
        """توليد صوت من النص"""
        try:
            if provider == "openai" and self.openai_client:
                response = self.openai_client.audio.speech.create(
                    model="tts-1",
                    voice=voice,
                    input=text,
                    speed=speed
                )
                audio_bytes = response.content
                audio_b64 = base64.b64encode(audio_bytes).decode()
                return f"data:audio/mpeg;base64,{audio_b64}"
            
            elif provider == "elevenlabs" and self.eleven_client:
                voice_settings = VoiceSettings(
                    stability=0.5,
                    similarity_boost=0.75
                )
                audio_generator = self.eleven_client.text_to_speech.convert(
                    text=text,
                    voice_id=voice,
                    model_id="eleven_multilingual_v2",
                    voice_settings=voice_settings
                )
                audio_bytes = b""
                for chunk in audio_generator:
                    audio_bytes += chunk
                audio_b64 = base64.b64encode(audio_bytes).decode()
                return f"data:audio/mpeg;base64,{audio_b64}"
        except Exception as e:
            logger.error(f"TTS generation error: {e}")
        return None
    
    def _get_chat_instance(self, session_id: str, session_type: str = "general") -> LlmChat:
        """إنشاء أو استرجاع مثيل الشات"""
        if session_id not in self.chat_instances:
            system_prompt = SYSTEM_PROMPTS.get(session_type, SYSTEM_PROMPTS["general"])
            self.chat_instances[session_id] = LlmChat(
                api_key=self.api_key,
                session_id=session_id,
                system_message=system_prompt
            ).with_model("openai", "gpt-4o")
        return self.chat_instances[session_id]
    
    async def create_session(self, user_id: str, session_type: str = "general", title: str = None) -> Dict:
        """إنشاء جلسة جديدة"""
        session = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "title": title or "محادثة جديدة",
            "session_type": session_type,
            "messages": [],
            "project_data": {},
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await self.db.chat_sessions.insert_one(session)
        return session
    
    async def get_session(self, session_id: str, user_id: str) -> Optional[Dict]:
        """استرجاع جلسة"""
        return await self.db.chat_sessions.find_one(
            {"id": session_id, "user_id": user_id},
            {"_id": 0}
        )
    
    async def get_user_sessions(self, user_id: str, limit: int = 50) -> List[Dict]:
        """استرجاع جلسات المستخدم"""
        sessions = await self.db.chat_sessions.find(
            {"user_id": user_id, "status": "active"},
            {"_id": 0}
        ).sort("updated_at", -1).limit(limit).to_list(limit)
        return sessions
    
    async def process_message(
        self, 
        session_id: str, 
        user_id: str, 
        message: str,
        settings: Dict[str, Any] = None
    ) -> Dict:
        """معالجة رسالة المستخدم"""
        settings = settings or {}
        
        # استرجاع الجلسة
        session = await self.get_session(session_id, user_id)
        if not session:
            raise ValueError("Session not found")
        
        # إضافة رسالة المستخدم
        user_msg = {
            "id": str(uuid.uuid4()),
            "role": "user",
            "content": message,
            "message_type": "text",
            "attachments": [],
            "metadata": {},
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # الحصول على رد AI
        chat = self._get_chat_instance(session_id, session["session_type"])
        
        # تحميل المحادثات السابقة إذا كانت موجودة
        if session["messages"] and session_id not in self.chat_instances:
            for msg in session["messages"][-10:]:  # آخر 10 رسائل
                if msg["role"] == "user":
                    chat.add_user_message(msg["content"])
                elif msg["role"] == "assistant":
                    chat.add_assistant_message(msg["content"])
        
        # إرسال الرسالة
        ai_response = await chat.send_message(UserMessage(text=message))
        
        # تحليل الرد للبحث عن أوامر التوليد
        attachments = []
        generation_result = None
        
        # البحث عن أوامر التوليد
        if "[GENERATE_IMAGE:" in ai_response:
            generation_result = await self._handle_image_generation(ai_response, user_id, session_id)
            if generation_result:
                attachments.append(generation_result)
                ai_response = re.sub(r'\[GENERATE_IMAGE:[^\]]+\]', '', ai_response)
                ai_response += "\n\n✅ تم توليد الصورة بنجاح!"
        
        # دعم توليد الفيديو - نظام الخلفية
        video_matches = re.findall(r'\[GENERATE_VIDEO:[^\]]+\]', ai_response)
        if video_matches:
            video_count = len(video_matches)
            ai_response = re.sub(r'\[GENERATE_VIDEO:[^\]]+\]', '', ai_response)
            
            # إنشاء طلب فيديو في الخلفية
            import asyncio
            
            # حفظ طلبات الفيديو في قاعدة البيانات
            video_requests = []
            total_cost = 0
            insufficient_credits = False
            
            for i, video_cmd in enumerate(video_matches):
                match = re.search(r'\[GENERATE_VIDEO:\s*(.+?)\]', video_cmd)
                if match:
                    prompt = match.group(1).strip()
                    duration = settings.get("duration", 4)
                    size = settings.get("size", "1280x720")
                    
                    # تحليل المعاملات من النص
                    if "|" in prompt:
                        parts = prompt.split("|")
                        prompt = parts[0].strip()
                        for part in parts[1:]:
                            part = part.strip().lower()
                            if "duration:" in part:
                                try:
                                    dur = int(part.split(":")[1].strip())
                                    if dur in [4, 8, 12, 50, 60]:
                                        duration = dur
                                except:
                                    pass
                            elif "size:" in part:
                                s = part.split(":")[1].strip()
                                if s in ["1280x720", "1792x1024", "1024x1792", "1024x1024"]:
                                    size = s
                    
                    # تحديد تكلفة الفيديو حسب المدة
                    service_key = f"video_{duration}_seconds"
                    if duration == 4:
                        service_key = "video_4_seconds"
                    elif duration == 8:
                        service_key = "video_8_seconds"
                    elif duration == 12:
                        service_key = "video_12_seconds"
                    elif duration == 50:
                        service_key = "video_50_seconds"
                    elif duration == 60:
                        service_key = "video_60_seconds"
                    
                    # التحقق من الرصيد وخصم النقاط
                    can_generate, payment_type, cost = await self._check_and_deduct_credits(user_id, service_key)
                    
                    if not can_generate:
                        insufficient_credits = True
                        ai_response += f"\n\n❌ {payment_type}"
                        attachments.append({
                            "type": "error",
                            "error": "رصيد غير كافٍ",
                            "message": payment_type
                        })
                        break
                    
                    total_cost += cost
                    
                    request_id = str(uuid.uuid4())
                    video_request = {
                        "id": request_id,
                        "user_id": user_id,
                        "session_id": session_id,
                        "prompt": prompt,
                        "duration": duration,
                        "size": size,
                        "status": "pending",
                        "payment_type": payment_type,
                        "cost": cost,
                        "created_at": datetime.now(timezone.utc).isoformat()
                    }
                    await self.db.video_requests.insert_one(video_request)
                    video_requests.append(video_request)
                    
                    # بدء التوليد في الخلفية
                    asyncio.create_task(self._generate_video_background(request_id, user_id, session_id, prompt, duration, size))
            
            if not insufficient_credits and video_requests:
                # إضافة رسالة للمستخدم
                cost_msg = ""
                if total_cost > 0:
                    cost_msg = f" (-{total_cost} نقطة)"
                elif video_requests[0].get("payment_type") == "free":
                    cost_msg = " (مجاني)"
                elif video_requests[0].get("payment_type") == "subscription":
                    cost_msg = " (اشتراك)"
                
                ai_response += f"\n\n🎬 تم إرسال طلب {'الفيديو' if video_count == 1 else f'{video_count} فيديوهات'} للتوليد!{cost_msg}"
                ai_response += "\n⏱️ التوليد يستغرق 2-5 دقائق."
                ai_response += "\n📩 سيظهر الفيديو هنا تلقائياً عند الانتهاء."
                ai_response += "\n\n💡 يمكنك متابعة المحادثة أثناء الانتظار!"
                
                # إضافة معلومات الطلب كـ attachment
                attachments.append({
                    "type": "video_pending",
                    "requests": [{"id": r["id"], "prompt": r["prompt"][:50], "duration": r["duration"], "cost": r.get("cost", 0)} for r in video_requests],
                    "message": f"جاري توليد {video_count} فيديو...",
                    "total_cost": total_cost
                })
        
        elif "[GENERATE_AUDIO:" in ai_response:
            generation_result = await self._handle_audio_generation(ai_response, user_id, session_id, settings)
            if generation_result:
                attachments.append(generation_result)
                ai_response = re.sub(r'\[GENERATE_AUDIO:[^\]]+\]', '', ai_response)
                ai_response += "\n\n✅ تم توليد الصوت بنجاح!"
        
        elif "[GENERATE_WEBSITE:" in ai_response:
            generation_result = await self._handle_website_generation(ai_response, user_id, session_id, settings)
            if generation_result:
                attachments.append(generation_result)
                ai_response = re.sub(r'\[GENERATE_WEBSITE:[\s\S]+?\]', '', ai_response)
                ai_response += "\n\n✅ تم إنشاء الموقع! يمكنك تحميل الكود."
        
        # إنشاء رسالة المساعد
        assistant_msg = {
            "id": str(uuid.uuid4()),
            "role": "assistant",
            "content": ai_response.strip(),
            "message_type": "text" if not attachments else attachments[0].get("type", "text"),
            "attachments": attachments,
            "metadata": {},
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # توليد صوت للرد إذا كان مطلوباً
        tts_settings = settings.get("tts", {})
        if tts_settings.get("enabled", False):
            tts_provider = tts_settings.get("provider", "openai")
            tts_voice = tts_settings.get("voice", "alloy")
            tts_speed = tts_settings.get("speed", 1.0)
            
            # تنظيف النص من الرموز للصوت
            clean_text = re.sub(r'[✅🎬⏱️📩💡🖼️🌐📁]', '', ai_response.strip())
            clean_text = re.sub(r'\[.*?\]', '', clean_text)
            clean_text = clean_text.strip()
            
            if clean_text and len(clean_text) > 5:
                audio_url = await self.generate_tts(clean_text, tts_provider, tts_voice, tts_speed)
                if audio_url:
                    assistant_msg["audio_url"] = audio_url
                    assistant_msg["metadata"]["tts"] = {
                        "provider": tts_provider,
                        "voice": tts_voice,
                        "chars": len(clean_text)
                    }
        
        # تحديث الجلسة
        await self.db.chat_sessions.update_one(
            {"id": session_id},
            {
                "$push": {"messages": {"$each": [user_msg, assistant_msg]}},
                "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
            }
        )
        
        # تحديث عنوان الجلسة إذا كانت جديدة
        if len(session["messages"]) == 0:
            title = message[:50] + "..." if len(message) > 50 else message
            await self.db.chat_sessions.update_one(
                {"id": session_id},
                {"$set": {"title": title}}
            )
        
        return {
            "session_id": session_id,
            "user_message": user_msg,
            "assistant_message": assistant_msg
        }
    
    # تكلفة الخدمات بالنقاط
    SERVICE_COSTS = {
        "image_generation": 5,
        "video_4_seconds": 10,
        "video_8_seconds": 18,
        "video_12_seconds": 25,
        "video_50_seconds": 80,
        "video_60_seconds": 100,
        "website_simple": 50,
        "tts_per_1000_chars": 2,
    }
    
    async def _check_and_deduct_credits(self, user_id: str, service: str, amount: int = 1) -> Tuple[bool, str, int]:
        """التحقق من الرصيد وخصم النقاط"""
        user_doc = await self.db.users.find_one({"id": user_id}, {"_id": 0})
        if not user_doc:
            return False, "المستخدم غير موجود", 0
        
        # المالك لا يدفع
        if user_doc.get('is_owner'):
            return True, "owner", 0
        
        # التحقق من الرصيد المجاني
        if service == "image_generation" and user_doc.get('free_images', 0) > 0:
            await self.db.users.update_one({"id": user_id}, {"$inc": {"free_images": -1}})
            return True, "free", 0
        
        if service.startswith("video_") and user_doc.get('free_videos', 0) > 0:
            await self.db.users.update_one({"id": user_id}, {"$inc": {"free_videos": -1}})
            return True, "free", 0
        
        # التحقق من الاشتراك
        subscription_type = user_doc.get('subscription_type')
        subscription_expires = user_doc.get('subscription_expires')
        if subscription_type:
            if subscription_expires and datetime.fromisoformat(subscription_expires) > datetime.now(timezone.utc):
                if service == "image_generation" and subscription_type in ["images", "all"]:
                    return True, "subscription", 0
                if service.startswith("video_") and subscription_type in ["videos", "all"]:
                    return True, "subscription", 0
        
        # حساب التكلفة
        cost = self.SERVICE_COSTS.get(service, 5) * amount
        credits = user_doc.get('credits', 0)
        
        if credits < cost:
            return False, f"رصيدك غير كافٍ. تحتاج {cost} نقطة ولديك {credits} فقط", cost
        
        # خصم النقاط
        await self.db.users.update_one(
            {"id": user_id},
            {"$inc": {"credits": -cost, "total_spent": cost}}
        )
        
        return True, "credits", cost
    
    async def _handle_image_generation(self, response: str, user_id: str, session_id: str) -> Optional[Dict]:
        """معالجة توليد الصور"""
        try:
            match = re.search(r'\[GENERATE_IMAGE:\s*(.+?)\]', response)
            if not match:
                return None
            
            prompt = match.group(1).strip()
            
            # التحقق من الرصيد وخصم النقاط
            can_generate, payment_type, cost = await self._check_and_deduct_credits(user_id, "image_generation")
            if not can_generate:
                return {
                    "type": "error",
                    "error": payment_type,
                    "message": f"❌ {payment_type}"
                }
            
            # توليد الصورة باستخدام Gemini
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"img-{uuid.uuid4()}",
                system_message="You are an image generation assistant."
            ).with_model("gemini", "gemini-3-pro-image-preview").with_params(modalities=["image", "text"])
            
            text, images = await chat.send_message_multimodal_response(UserMessage(text=prompt))
            
            if images and len(images) > 0:
                image_data = f"data:{images[0]['mime_type']};base64,{images[0]['data']}"
                
                # حفظ في قاعدة البيانات
                record = {
                    "id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "session_id": session_id,
                    "prompt": prompt,
                    "image_url": image_data,
                    "type": "generated",
                    "payment_type": payment_type,
                    "cost": cost,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await self.db.generated_assets.insert_one(record)
                
                cost_msg = ""
                if payment_type == "free":
                    cost_msg = " (مجاني)"
                elif payment_type == "subscription":
                    cost_msg = " (اشتراك)"
                elif payment_type == "credits":
                    cost_msg = f" (-{cost} نقطة)"
                
                return {
                    "type": "image",
                    "url": image_data,
                    "prompt": prompt,
                    "id": record["id"],
                    "payment_type": payment_type,
                    "cost": cost,
                    "cost_message": cost_msg
                }
        except Exception as e:
            logger.error(f"Image generation error: {e}")
        return None
    
    async def _handle_video_generation(
        self, 
        response: str, 
        user_id: str, 
        session_id: str,
        settings: Dict
    ) -> Optional[Dict]:
        """معالجة توليد الفيديو"""
        try:
            # استخراج الأمر من النص
            match = re.search(r'\[GENERATE_VIDEO:\s*(.+?)\]', response)
            if not match:
                # إذا كان response هو الأمر نفسه
                if response.startswith('[GENERATE_VIDEO:'):
                    match = re.search(r'\[GENERATE_VIDEO:\s*(.+?)\]', response)
                if not match:
                    return None
            
            full_prompt = match.group(1).strip()
            
            # تحليل الإعدادات من النص
            prompt = full_prompt
            duration = settings.get("duration", 12)  # 12 ثانية كافتراضي للجودة
            size = settings.get("size", "1280x720")
            
            if "|" in full_prompt:
                parts = full_prompt.split("|")
                prompt = parts[0].strip()
                for part in parts[1:]:
                    part = part.strip().lower()
                    if "duration:" in part:
                        try:
                            dur = int(part.split(":")[1].strip())
                            if dur in [4, 8, 12, 50, 60]:
                                duration = dur
                        except (ValueError, IndexError):
                            pass
                    elif "size:" in part:
                        s = part.split(":")[1].strip()
                        if s in ["1280x720", "1792x1024", "1024x1792", "1024x1024"]:
                            size = s
            
            logger.info(f"Generating video: prompt='{prompt[:50]}...', duration={duration}, size={size}")
            
            # توليد الفيديو باستخدام Sora 2
            # Note: text_to_video is synchronous, run in thread pool
            import asyncio
            import concurrent.futures
            
            def generate_video_sync():
                video_gen = OpenAIVideoGeneration(api_key=self.api_key)
                return video_gen.text_to_video(
                    prompt=prompt,
                    model="sora-2",
                    size=size,
                    duration=duration,
                    max_wait_time=600  # 10 دقائق
                )
            
            try:
                loop = asyncio.get_event_loop()
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    video_bytes = await loop.run_in_executor(pool, generate_video_sync)
            except Exception as gen_error:
                logger.error(f"Sora 2 generation failed: {gen_error}")
                return {
                    "type": "video_error",
                    "error": str(gen_error),
                    "prompt": prompt,
                    "message": "فشل توليد الفيديو. قد يكون هناك ضغط على الخدمة. حاول مرة أخرى."
                }
            
            if video_bytes:
                video_b64 = base64.b64encode(video_bytes).decode()
                video_url = f"data:video/mp4;base64,{video_b64}"
                
                # حفظ في قاعدة البيانات
                record = {
                    "id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "session_id": session_id,
                    "prompt": prompt,
                    "video_url": video_url,
                    "duration": duration,
                    "size": size,
                    "type": "generated",
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await self.db.generated_assets.insert_one(record)
                
                return {
                    "type": "video",
                    "url": video_url,
                    "prompt": prompt,
                    "duration": duration,
                    "size": size,
                    "id": record["id"]
                }
            else:
                return {
                    "type": "video_error",
                    "error": "No video returned",
                    "prompt": prompt,
                    "message": "لم يتم إرجاع فيديو. حاول مرة أخرى."
                }
        except Exception as e:
            logger.error(f"Video generation error: {e}")
            return {
                "type": "video_error",
                "error": str(e),
                "prompt": prompt if 'prompt' in dir() else "unknown",
                "message": f"خطأ في توليد الفيديو: {str(e)[:100]}"
            }
        return None
    
    async def _handle_audio_generation(
        self, 
        response: str, 
        user_id: str, 
        session_id: str,
        settings: Dict
    ) -> Optional[Dict]:
        """معالجة توليد الصوت"""
        try:
            if not self.eleven_client:
                return None
            
            match = re.search(r'\[GENERATE_AUDIO:\s*(.+?)\]', response)
            if not match:
                return None
            
            full_text = match.group(1).strip()
            
            # تحليل الإعدادات
            text = full_text
            voice_id = settings.get("voice_id", "21m00Tcm4TlvDq8ikWAM")  # Rachel default
            
            if "|" in full_text:
                parts = full_text.split("|")
                text = parts[0].strip()
                for part in parts[1:]:
                    if "voice_id:" in part:
                        voice_id = part.split(":")[1].strip()
            
            # توليد الصوت
            voice_settings = VoiceSettings(stability=0.5, similarity_boost=0.75)
            audio_generator = self.eleven_client.text_to_speech.convert(
                text=text,
                voice_id=voice_id,
                model_id="eleven_multilingual_v2",
                voice_settings=voice_settings
            )
            
            audio_data = b""
            for chunk in audio_generator:
                audio_data += chunk
            
            audio_b64 = base64.b64encode(audio_data).decode()
            audio_url = f"data:audio/mpeg;base64,{audio_b64}"
            
            # حفظ في قاعدة البيانات
            record = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "session_id": session_id,
                "text": text,
                "voice_id": voice_id,
                "audio_url": audio_url,
                "type": "audio",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await self.db.generated_assets.insert_one(record)
            
            return {
                "type": "audio",
                "url": audio_url,
                "text": text,
                "voice_id": voice_id,
                "id": record["id"]
            }
        except Exception as e:
            logger.error(f"Audio generation error: {e}")
        return None
    
    async def _handle_website_generation(
        self, 
        response: str, 
        user_id: str, 
        session_id: str,
        settings: Dict
    ) -> Optional[Dict]:
        """معالجة إنشاء الموقع"""
        try:
            # استخدام re.DOTALL للتعامل مع الأسطر المتعددة
            match = re.search(r'\[GENERATE_WEBSITE:\s*([\s\S]+?)\]', response)
            if not match:
                return None
            
            requirements = match.group(1).strip()
            logger.info(f"Generating website with requirements: {requirements[:100]}...")
            
            # استخدام GPT لإنشاء كود الموقع
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"web-{uuid.uuid4()}",
                system_message="""أنت مطور ويب محترف. أنشئ موقع ويب كامل بـ React + Tailwind CSS.

أرجع JSON فقط بهذا الشكل:
{
    "files": {
        "App.jsx": "// الكود هنا",
        "index.css": "/* الأنماط */"
    },
    "instructions": "npm install && npm start"
}

مهم: أرجع JSON صالح فقط، بدون أي نص إضافي!"""
            ).with_model("openai", "gpt-4o")
            
            code_response = await chat.send_message(UserMessage(text=f"أنشئ موقع ويب بالمتطلبات التالية:\n{requirements}"))
            
            # محاولة استخراج JSON
            import json
            try:
                # البحث عن JSON في الرد
                json_match = re.search(r'\{[\s\S]*\}', code_response)
                if json_match:
                    website_data = json.loads(json_match.group())
                else:
                    website_data = {"files": {"App.jsx": code_response}, "instructions": ""}
            except (json.JSONDecodeError, Exception):
                website_data = {"files": {"App.jsx": code_response}, "instructions": ""}
            
            # حفظ في قاعدة البيانات
            record = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "session_id": session_id,
                "requirements": requirements,
                "website_data": website_data,
                "type": "website",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await self.db.generated_assets.insert_one(record)
            
            return {
                "type": "website",
                "files": website_data.get("files", {}),
                "instructions": website_data.get("instructions", ""),
                "id": record["id"]
            }
        except Exception as e:
            logger.error(f"Website generation error: {e}")
        return None
    
    async def delete_session(self, session_id: str, user_id: str) -> bool:
        """حذف جلسة"""
        result = await self.db.chat_sessions.update_one(
            {"id": session_id, "user_id": user_id},
            {"$set": {"status": "archived"}}
        )
        if session_id in self.chat_instances:
            del self.chat_instances[session_id]
        return result.modified_count > 0
    
    async def get_session_assets(self, session_id: str, user_id: str) -> List[Dict]:
        """استرجاع أصول الجلسة"""
        assets = await self.db.generated_assets.find(
            {"session_id": session_id, "user_id": user_id},
            {"_id": 0}
        ).sort("created_at", -1).to_list(100)
        return assets


    async def _generate_video_background(
        self, 
        request_id: str, 
        user_id: str, 
        session_id: str,
        prompt: str,
        duration: int,
        size: str
    ):
        """توليد الفيديو في الخلفية"""
        try:
            logger.info(f"Background video generation started: {request_id}")
            
            # تحديث الحالة
            await self.db.video_requests.update_one(
                {"id": request_id},
                {"$set": {"status": "processing"}}
            )
            
            # توليد الفيديو
            import concurrent.futures
            import asyncio
            
            def generate_sync():
                video_gen = OpenAIVideoGeneration(api_key=self.api_key)
                return video_gen.text_to_video(
                    prompt=prompt,
                    model="sora-2",
                    size=size,
                    duration=duration,
                    max_wait_time=600
                )
            
            loop = asyncio.get_event_loop()
            with concurrent.futures.ThreadPoolExecutor() as pool:
                video_bytes = await loop.run_in_executor(pool, generate_sync)
            
            if video_bytes:
                video_b64 = base64.b64encode(video_bytes).decode()
                video_url = f"data:video/mp4;base64,{video_b64}"
                
                # حفظ الفيديو
                record = {
                    "id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "session_id": session_id,
                    "request_id": request_id,
                    "prompt": prompt,
                    "video_url": video_url,
                    "duration": duration,
                    "size": size,
                    "type": "video",
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await self.db.generated_assets.insert_one(record)
                
                # تحديث الطلب
                await self.db.video_requests.update_one(
                    {"id": request_id},
                    {"$set": {
                        "status": "completed",
                        "video_id": record["id"],
                        "completed_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                
                # إضافة رسالة للجلسة
                video_msg = {
                    "id": str(uuid.uuid4()),
                    "role": "assistant",
                    "content": f"✅ تم توليد الفيديو بنجاح! ({duration} ثانية)",
                    "message_type": "video",
                    "attachments": [{
                        "type": "video",
                        "url": video_url,
                        "prompt": prompt,
                        "duration": duration,
                        "size": size,
                        "id": record["id"]
                    }],
                    "metadata": {"request_id": request_id},
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                
                await self.db.chat_sessions.update_one(
                    {"id": session_id},
                    {"$push": {"messages": video_msg}}
                )
                
                logger.info(f"Video generation completed: {request_id}")
            else:
                await self.db.video_requests.update_one(
                    {"id": request_id},
                    {"$set": {"status": "failed", "error": "No video returned"}}
                )
                
        except Exception as e:
            logger.error(f"Background video generation failed: {e}")
            await self.db.video_requests.update_one(
                {"id": request_id},
                {"$set": {"status": "failed", "error": str(e)}}
            )
    
    async def get_video_requests(self, user_id: str, session_id: str = None) -> List[Dict]:
        """استرجاع طلبات الفيديو"""
        query = {"user_id": user_id}
        if session_id:
            query["session_id"] = session_id
        
        requests = await self.db.video_requests.find(
            query,
            {"_id": 0}
        ).sort("created_at", -1).to_list(50)
        return requests
