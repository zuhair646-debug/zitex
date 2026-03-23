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
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.llm.openai.video_generation import OpenAIVideoGeneration
from elevenlabs import ElevenLabs
from elevenlabs.types import VoiceSettings
from PIL import Image, ImageDraw, ImageFont
import io

logger = logging.getLogger(__name__)

# System prompts for different modes
SYSTEM_PROMPTS = {
    "general": """أنت "زيتكس" - مساعد إبداعي يملك قدرات فعلية لتوليد المحتوى.

🎨 قدراتك:
1. توليد صور فوراً (Gemini AI)
2. إنشاء فيديوهات سينمائية (Sora 2)
3. تحويل النص إلى صوت (ElevenLabs)
4. بناء مواقع ويب

⚡ مهم: عندما يطلب المستخدم شيء، نفّذه مباشرة! لا تسأل أسئلة كثيرة.

📝 الأوامر:
- للصورة: [GENERATE_IMAGE: وصف بالإنجليزية]
- للفيديو: [GENERATE_VIDEO: وصف بالإنجليزية | duration:12]
- للصوت: [GENERATE_AUDIO: النص]
- للموقع: [GENERATE_WEBSITE: الوصف]

مثال: إذا قال "صورة قطة" → اكتب فوراً:
[GENERATE_IMAGE: A beautiful white cat sitting elegantly, photorealistic, soft lighting, high quality]

🎬 للفيديو الطويل (دقيقة = 5 مشاهد):
[GENERATE_VIDEO: Scene 1 description | duration:12]
[GENERATE_VIDEO: Scene 2 description | duration:12]
... وهكذا

أجب بالعربية. نفّذ فوراً.""",

    "image": """أنت خبير توليد صور في زيتكس.

⚡ عندما يطلب صورة، نفّذ فوراً:
[GENERATE_IMAGE: وصف تفصيلي بالإنجليزية، photorealistic، high quality]

مثال: "قطة" → [GENERATE_IMAGE: A cute white cat with blue eyes, sitting gracefully, soft natural lighting, photorealistic, 4K quality]

لا تسأل - نفّذ مباشرة!""",

    "video": """أنت مخرج سينمائي في زيتكس.

⚡ عندما يطلب فيديو، نفّذ فوراً:
[GENERATE_VIDEO: وصف المشهد بالإنجليزية، cinematic | duration:12 | size:1280x720]

🎬 لفيديو دقيقة (5 مشاهد × 12 ثانية):
[GENERATE_VIDEO: Scene 1 - Opening | duration:12]
[GENERATE_VIDEO: Scene 2 - Development | duration:12]
[GENERATE_VIDEO: Scene 3 - Middle | duration:12]
[GENERATE_VIDEO: Scene 4 - Climax | duration:12]
[GENERATE_VIDEO: Scene 5 - Closing | duration:12]

لا تسأل - نفّذ مباشرة!""",

    "website": """أنت مطور ويب في زيتكس.

⚡ عندما يطلب موقع، نفّذ فوراً:
[GENERATE_WEBSITE: وصف الموقع بالتفصيل]

لا تسأل - نفّذ مباشرة!"""
}


class AIAssistant:
    """مساعد الذكاء الاصطناعي"""
    
    def __init__(self, db: AsyncIOMotorDatabase, api_key: str, elevenlabs_key: str = None):
        self.db = db
        self.api_key = api_key
        self.elevenlabs_key = elevenlabs_key
        self.eleven_client = ElevenLabs(api_key=elevenlabs_key) if elevenlabs_key else None
        self.chat_instances: Dict[str, LlmChat] = {}
    
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
        
        # دعم توليد فيديوهات متعددة (لفيديو دقيقة كاملة)
        video_matches = re.findall(r'\[GENERATE_VIDEO:[^\]]+\]', ai_response)
        if video_matches:
            video_count = len(video_matches)
            ai_response = re.sub(r'\[GENERATE_VIDEO:[^\]]+\]', '', ai_response)
            
            if video_count > 1:
                ai_response += f"\n\n🎬 جاري توليد {video_count} مشاهد فيديو... (قد يستغرق عدة دقائق)"
            
            for i, video_cmd in enumerate(video_matches):
                generation_result = await self._handle_video_generation(video_cmd, user_id, session_id, settings)
                if generation_result:
                    generation_result["scene_number"] = i + 1
                    generation_result["total_scenes"] = video_count
                    attachments.append(generation_result)
            
            if attachments:
                ai_response += f"\n\n✅ تم توليد {len([a for a in attachments if a.get('type') == 'video'])} فيديو بنجاح!"
        
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
                ai_response = re.sub(r'\[GENERATE_WEBSITE:[^\]]+\]', '', ai_response)
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
    
    async def _handle_image_generation(self, response: str, user_id: str, session_id: str) -> Optional[Dict]:
        """معالجة توليد الصور"""
        try:
            match = re.search(r'\[GENERATE_IMAGE:\s*(.+?)\]', response)
            if not match:
                return None
            
            prompt = match.group(1).strip()
            
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
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await self.db.generated_assets.insert_one(record)
                
                return {
                    "type": "image",
                    "url": image_data,
                    "prompt": prompt,
                    "id": record["id"]
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
                            if dur in [4, 8, 12]:
                                duration = dur
                        except (ValueError, IndexError):
                            pass
                    elif "size:" in part:
                        s = part.split(":")[1].strip()
                        if s in ["1280x720", "1792x1024", "1024x1792", "1024x1024"]:
                            size = s
            
            logger.info(f"Generating video: prompt='{prompt[:50]}...', duration={duration}, size={size}")
            
            # توليد الفيديو باستخدام Sora 2
            video_gen = OpenAIVideoGeneration(api_key=self.api_key)
            
            video_bytes = video_gen.text_to_video(
                prompt=prompt,
                model="sora-2",
                size=size,
                duration=duration,
                max_wait_time=900  # 15 دقيقة للفيديوهات الطويلة
            )
            
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
        except Exception as e:
            logger.error(f"Video generation error: {e}")
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
            match = re.search(r'\[GENERATE_WEBSITE:\s*(.+?)\]', response)
            if not match:
                return None
            
            requirements = match.group(1).strip()
            
            # استخدام GPT لإنشاء كود الموقع
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"web-{uuid.uuid4()}",
                system_message="""أنت مطور ويب محترف. قم بإنشاء موقع ويب كامل باستخدام React وTailwind CSS.
                
أنشئ ملفات:
1. App.jsx - المكون الرئيسي
2. index.css - الأنماط
3. components/ - المكونات الفرعية

أرجع الكود بصيغة JSON:
{
    "files": {
        "App.jsx": "...",
        "index.css": "...",
        "components/Header.jsx": "...",
        ...
    },
    "instructions": "تعليمات التشغيل"
}"""
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
