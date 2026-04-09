"""
Zitex AI Chat Service
خدمة الشات الذكي لتوليد المحتوى
Modified for independent hosting - AI features disabled until OpenAI API key is configured
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

logger = logging.getLogger(__name__)

# Check if AI features are enabled
AI_FEATURES_ENABLED = True

# Optional imports
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    openai = None

try:
    from elevenlabs.client import ElevenLabs
    from elevenlabs.types import VoiceSettings
    ELEVENLABS_AVAILABLE = True
except ImportError:
    ELEVENLABS_AVAILABLE = False
    ElevenLabs = None
    VoiceSettings = None

# System prompts for different modes
SYSTEM_PROMPTS = {
    "general": """أنت "زيتكس" - مساعد ذكي يملك قدرات لتوليد المحتوى.

ملاحظة: بعض الميزات قد تكون معطلة مؤقتاً حتى يتم إعداد مفاتيح API.

أجب بالعربية دائماً.""",

    "image": """أنت خبير توليد صور في منصة زيتكس.
أجب بالعربية.""",

    "video": """أنت مخرج سينمائي محترف في منصة زيتكس.
أجب بالعربية.""",

    "website": """أنت مطور ويب في زيتكس.
أجب بالعربية."""
}


class AIAssistant:
    """مساعد الذكاء الاصطناعي - نسخة مبسطة للاستضافة المستقلة"""
    
    def __init__(self, db: AsyncIOMotorDatabase, api_key: str = None, elevenlabs_key: str = None, openai_key: str = None):
        self.db = db
        self.api_key = api_key or os.environ.get('OPENAI_API_KEY')
        self.elevenlabs_key = elevenlabs_key
        self.openai_key = openai_key or self.api_key
        
        # Initialize clients if available
        self.eleven_client = None
        if ELEVENLABS_AVAILABLE and elevenlabs_key:
            try:
                self.eleven_client = ElevenLabs(api_key=elevenlabs_key)
            except:
                pass
        
        self.openai_client = None
        if OPENAI_AVAILABLE and self.openai_key:
            try:
                self.openai_client = openai.OpenAI(api_key=self.openai_key)
            except:
                pass
    
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
        
        # إنشاء رد المساعد
        ai_response = ""
        attachments = []
        
        if not AI_FEATURES_ENABLED or not self.openai_client:
            ai_response = "عذراً، خدمات الذكاء الاصطناعي غير متاحة حالياً."
        else:
            # Check if user wants to generate an image
            image_keywords = ['صورة', 'صور', 'أنشئ صورة', 'اصنع صورة', 'ارسم', 'توليد صورة', 'image', 'generate image', 'create image', 'draw']
            is_image_request = any(kw in message.lower() for kw in image_keywords) or session.get("session_type") == "image"
            
            if is_image_request:
                # Generate image using DALL-E
                try:
                    # Create image prompt
                    image_response = self.openai_client.images.generate(
                        model="dall-e-3",
                        prompt=message,
                        size="1024x1024",
                        quality="standard",
                        n=1,
                    )
                    image_url = image_response.data[0].url
                    
                    # Save to database
                    asset = {
                        "id": str(uuid.uuid4()),
                        "user_id": user_id,
                        "session_id": session_id,
                        "asset_type": "image",
                        "url": image_url,
                        "prompt": message,
                        "created_at": datetime.now(timezone.utc).isoformat()
                    }
                    await self.db.generated_assets.insert_one(asset)
                    
                    ai_response = "تم إنشاء الصورة بنجاح! 🎨"
                    attachments = [{
                        "type": "image",
                        "url": image_url,
                        "prompt": message
                    }]
                except Exception as e:
                    logger.error(f"Image generation error: {e}")
                    ai_response = f"عذراً، حدث خطأ في توليد الصورة: {str(e)[:100]}"
            else:
                # Regular chat - use OpenAI for response
                try:
                    system_prompt = SYSTEM_PROMPTS.get(session.get("session_type", "general"), SYSTEM_PROMPTS["general"])
                
                    # بناء سياق المحادثة
                    messages = [{"role": "system", "content": system_prompt}]
                    
                    # إضافة آخر 10 رسائل من المحادثة
                    for msg in session.get("messages", [])[-10:]:
                        messages.append({
                            "role": msg["role"],
                            "content": msg["content"]
                        })
                    
                    messages.append({"role": "user", "content": message})
                    
                    completion = self.openai_client.chat.completions.create(
                        model="gpt-4o",
                        messages=messages
                    )
                    ai_response = completion.choices[0].message.content
                    
                except Exception as e:
                    logger.error(f"OpenAI error: {e}")
                    ai_response = f"عذراً، حدث خطأ في معالجة رسالتك: {str(e)[:100]}"
        
        # إنشاء رسالة المساعد
        assistant_msg = {
            "id": str(uuid.uuid4()),
            "role": "assistant",
            "content": ai_response.strip(),
            "message_type": "text",
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
        if len(session.get("messages", [])) == 0:
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
    
    async def delete_session(self, session_id: str, user_id: str) -> bool:
        """حذف جلسة"""
        result = await self.db.chat_sessions.update_one(
            {"id": session_id, "user_id": user_id},
            {"$set": {"status": "archived"}}
        )
        return result.modified_count > 0
    
    async def get_session_assets(self, session_id: str, user_id: str) -> List[Dict]:
        """استرجاع أصول الجلسة"""
        assets = await self.db.generated_assets.find(
            {"session_id": session_id, "user_id": user_id},
            {"_id": 0}
        ).sort("created_at", -1).to_list(100)
        return assets
    
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
    
    async def generate_tts(self, text: str, provider: str = "openai", voice: str = "alloy", speed: float = 1.0) -> Optional[str]:
        """توليد صوت من النص"""
        if not AI_FEATURES_ENABLED:
            return None
        
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
            
            elif provider == "elevenlabs" and self.eleven_client and ELEVENLABS_AVAILABLE:
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
