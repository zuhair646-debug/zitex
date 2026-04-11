"""
Zitex AI Chat Service - Interactive Edition
خدمة الشات الذكي - النسخة التفاعلية
Version 5.0 - Button-Based Consultative AI
"""
import os
import uuid
import base64
import logging
import re
from datetime import datetime, timezone
from typing import Optional, Dict, Any, Tuple, List
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

AI_FEATURES_ENABLED = True

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


MASTER_SYSTEM_PROMPT = """أنت "زيتكس" (Zitex) - مستشار ذكاء اصطناعي لبناء المشاريع الرقمية.

## قواعد مهمة جداً:

### 1. لا ترسل كود أبداً إلا بعد جمع كل المعلومات!
- اسأل سؤال واحد فقط في كل مرة
- انتظر إجابة العميل قبل السؤال التالي
- بعد جمع 3-4 معلومات أساسية، ابدأ البناء

### 2. استخدم صيغة الأزرار للخيارات:
عندما تريد إعطاء خيارات، استخدم هذا التنسيق بالضبط:
[BUTTONS]
خيار1|خيار2|خيار3|خيار4
[/BUTTONS]

مثال:
ما نوع المشروع؟
[BUTTONS]
🌐 موقع ويب|📱 تطبيق جوال|💻 تطبيق ويب|🎮 لعبة
[/BUTTONS]

### 3. تسلسل الأسئلة:

**للمواقع:**
1. ما مجال الموقع؟
[BUTTONS]
🍽️ مطعم|🏢 شركة|🛒 متجر|👤 شخصي|📝 مدونة
[/BUTTONS]

2. ما الألوان المفضلة؟
[BUTTONS]
🖤 أسود وذهبي|💙 أزرق|💚 أخضر|💜 بنفسجي|🎨 اختيار آخر
[/BUTTONS]

3. ابدأ البناء مباشرة!

**للتطبيقات:**
1. ما وظيفة التطبيق؟
[BUTTONS]
📋 إدارة مهام|💬 تواصل|🛒 تسوق|📊 تتبع|🎯 أخرى
[/BUTTONS]

2. ابدأ البناء!

**للألعاب:**
1. ما نوع اللعبة؟
[BUTTONS]
🏎️ سباق|🧩 ألغاز|👾 أركيد|⚽ رياضة|🎯 إطلاق
[/BUTTONS]

2. ابدأ البناء!

### 4. عند البناء:
- اكتب كود كامل 100%
- أضف شارة Zitex
- لا تكتب "..." أبداً

### 5. تنسيق الردود:
- استخدم إيموجي
- اجعل النص قصيراً ومباشراً
- سطر أو سطرين فقط قبل الأزرار

### 6. لا تسأل أكثر من سؤالين قبل البناء!
"""


WELCOME_MESSAGE = """## 👋 مرحباً بك في زيتكس!

ماذا تريد أن تبني اليوم؟

[BUTTONS]
🌐 موقع ويب|📱 تطبيق جوال|💻 تطبيق ويب|🎮 لعبة|🎨 صورة|🎬 فيديو
[/BUTTONS]"""


ZITEX_BADGE = '''<!-- Zitex Badge -->
<div id="zitex-badge" style="position:fixed;bottom:20px;right:20px;background:linear-gradient(135deg,#1a1a2e,#16213e);padding:10px 20px;border-radius:25px;box-shadow:0 4px 15px rgba(0,0,0,0.3);z-index:9999;display:flex;align-items:center;gap:10px;cursor:pointer;border:1px solid rgba(255,215,0,0.3);" onclick="window.open('https://zitex.vercel.app','_blank')">
    <div style="width:30px;height:30px;background:linear-gradient(135deg,#ffd700,#ffaa00);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;color:#000;font-size:16px;">Z</div>
    <span style="color:#ffd700;font-size:14px;font-weight:500;">Powered by Zitex</span>
</div>'''


SERVICE_COSTS = {
    "message": 1,
    "website": 15,
    "webapp": 20,
    "pwa": 20,
    "game": 15,
    "game_3d": 25,
    "image": 5,
    "video": 20,
    "modification": 5,
    "export": 50,
    "deploy": 100
}


def detect_request_type(message: str, session_type: str = "general") -> str:
    message_lower = message.lower()
    
    # Direct button selections
    if "موقع ويب" in message or "موقع" in message_lower:
        return "website"
    elif "تطبيق جوال" in message or "جوال" in message_lower or "موبايل" in message_lower:
        return "pwa"
    elif "تطبيق ويب" in message or "لوحة" in message_lower:
        return "webapp"
    elif "لعبة" in message_lower or "game" in message_lower:
        return "game"
    elif "صورة" in message_lower or "شعار" in message_lower:
        return "image"
    elif "فيديو" in message_lower:
        return "video"
    
    # 3D detection
    if "3d" in message_lower or "ثلاثي" in message_lower or "سباق" in message_lower:
        return "game_3d"
    
    if session_type and session_type != "general":
        return session_type
    
    return "general"


def inject_zitex_badge(html_code: str) -> str:
    if '</body>' in html_code:
        return html_code.replace('</body>', f'{ZITEX_BADGE}\n</body>')
    elif '</html>' in html_code:
        return html_code.replace('</html>', f'{ZITEX_BADGE}\n</html>')
    return html_code + '\n' + ZITEX_BADGE


class AIAssistant:
    def __init__(self, db: AsyncIOMotorDatabase, api_key: str = None, elevenlabs_key: str = None, openai_key: str = None):
        self.db = db
        self.api_key = api_key or os.environ.get('OPENAI_API_KEY')
        self.elevenlabs_key = elevenlabs_key
        self.openai_key = openai_key or self.api_key
        
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
        user = await self.db.users.find_one({"id": user_id}, {"_id": 0})
        credits = user.get("credits", 0) if user else 0
        
        welcome_msg = {
            "id": str(uuid.uuid4()),
            "role": "assistant",
            "content": WELCOME_MESSAGE,
            "message_type": "text",
            "attachments": [],
            "metadata": {"is_welcome": True, "has_buttons": True},
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        session = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "title": title or "محادثة جديدة",
            "session_type": session_type,
            "messages": [welcome_msg],
            "project_data": {},
            "generated_code": None,
            "conversation_stage": "type_selection",
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await self.db.chat_sessions.insert_one(session)
        return session
    
    async def get_session(self, session_id: str, user_id: str) -> Optional[Dict]:
        return await self.db.chat_sessions.find_one(
            {"id": session_id, "user_id": user_id},
            {"_id": 0}
        )
    
    async def get_user_sessions(self, user_id: str, limit: int = 50) -> List[Dict]:
        sessions = await self.db.chat_sessions.find(
            {"user_id": user_id, "status": "active"},
            {"_id": 0}
        ).sort("updated_at", -1).limit(limit).to_list(limit)
        return sessions
    
    async def get_user_credits(self, user_id: str) -> int:
        user = await self.db.users.find_one({"id": user_id}, {"_id": 0, "credits": 1})
        return user.get("credits", 0) if user else 0
    
    async def deduct_credits(self, user_id: str, amount: int, reason: str) -> bool:
        result = await self.db.users.update_one(
            {"id": user_id, "credits": {"$gte": amount}},
            {
                "$inc": {"credits": -amount},
                "$push": {
                    "credit_history": {
                        "amount": -amount,
                        "reason": reason,
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }
                }
            }
        )
        return result.modified_count > 0
    
    async def process_message(self, session_id: str, user_id: str, message: str, settings: Dict[str, Any] = None) -> Dict:
        settings = settings or {}
        
        session = await self.get_session(session_id, user_id)
        if not session:
            raise ValueError("Session not found")
        
        credits = await self.get_user_credits(user_id)
        
        user_msg = {
            "id": str(uuid.uuid4()),
            "role": "user",
            "content": message,
            "message_type": "text",
            "attachments": [],
            "metadata": {},
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        request_type = detect_request_type(message, session.get("session_type", "general"))
        
        ai_response = ""
        attachments = []
        credits_used = 0
        has_buttons = False
        
        if not AI_FEATURES_ENABLED or not self.openai_client:
            ai_response = "⚠️ خدمة غير متاحة حالياً"
        else:
            required_credits = SERVICE_COSTS.get(request_type, 1)
            
            if credits < required_credits:
                ai_response = f"""## ⚠️ رصيد غير كافٍ

رصيدك: **{credits} نقطة**
المطلوب: **{required_credits} نقطة**

[BUTTONS]
💰 شحن الرصيد
[/BUTTONS]"""
                has_buttons = True
            else:
                try:
                    if request_type == "image":
                        ai_response, attachments, credits_used = await self._generate_image(user_id, session_id, message, credits)
                    elif request_type == "video":
                        ai_response = """## 🎬 جاري إنشاء الفيديو...

⏳ سيتم إشعارك عند الاكتمال

> التكلفة: 20 نقطة"""
                        credits_used = 20
                    else:
                        ai_response, credits_used, has_buttons = await self._generate_with_gpt(session, message, request_type, credits, settings)
                    
                    if credits_used > 0:
                        await self.deduct_credits(user_id, credits_used, f"{request_type}")
                        
                except Exception as e:
                    logger.error(f"Error: {e}")
                    ai_response = "❌ حدث خطأ، حاول مرة أخرى"
        
        # Check if response has buttons
        if "[BUTTONS]" in ai_response:
            has_buttons = True
        
        assistant_msg = {
            "id": str(uuid.uuid4()),
            "role": "assistant",
            "content": ai_response.strip(),
            "message_type": "text",
            "attachments": attachments,
            "metadata": {
                "request_type": request_type,
                "credits_used": credits_used,
                "credits_remaining": credits - credits_used,
                "has_buttons": has_buttons
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        update_data = {
            "$push": {"messages": {"$each": [user_msg, assistant_msg]}},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
        
        # Update session type
        if request_type != "general":
            update_data["$set"]["session_type"] = request_type
        
        code_match = re.search(r'```(?:html|javascript|js)?\n?([\s\S]*?)```', ai_response)
        if code_match:
            code = code_match.group(1)
            code_with_badge = inject_zitex_badge(code)
            update_data["$set"]["generated_code"] = code_with_badge
        
        await self.db.chat_sessions.update_one({"id": session_id}, update_data)
        
        # Update title
        non_welcome = [m for m in session.get("messages", []) if not m.get("metadata", {}).get("is_welcome")]
        if len(non_welcome) == 0:
            title = self._generate_title(message, request_type)
            await self.db.chat_sessions.update_one({"id": session_id}, {"$set": {"title": title}})
        
        return {
            "session_id": session_id,
            "user_message": user_msg,
            "assistant_message": assistant_msg,
            "credits_used": credits_used
        }
    
    async def _generate_image(self, user_id: str, session_id: str, prompt: str, credits: int) -> Tuple[str, List[Dict], int]:
        try:
            image_response = self.openai_client.images.generate(
                model="dall-e-3",
                prompt=f"High quality: {prompt}",
                size="1024x1024",
                quality="standard",
                n=1,
            )
            image_url = image_response.data[0].url
            
            asset = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "session_id": session_id,
                "asset_type": "image",
                "url": image_url,
                "prompt": prompt,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await self.db.generated_assets.insert_one(asset)
            
            response = f"""## ✅ تم إنشاء الصورة!

> التكلفة: 5 نقاط | المتبقي: {credits - 5} نقطة

[BUTTONS]
🎨 صورة جديدة|✏️ تعديل|💾 حفظ
[/BUTTONS]"""
            
            return response, [{"type": "image", "url": image_url, "prompt": prompt}], 5
            
        except Exception as e:
            logger.error(f"Image error: {e}")
            return "❌ خطأ في توليد الصورة", [], 0
    
    async def _generate_with_gpt(self, session: Dict, message: str, request_type: str, credits: int, settings: Dict) -> Tuple[str, int, bool]:
        system_prompt = MASTER_SYSTEM_PROMPT + f"\n\nرصيد العميل: {credits} نقطة"
        
        messages = [{"role": "system", "content": system_prompt}]
        
        for msg in session.get("messages", [])[-8:]:
            messages.append({"role": msg["role"], "content": msg["content"]})
        
        messages.append({"role": "user", "content": message})
        
        try:
            completion = self.openai_client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                temperature=0.7,
                max_tokens=6000
            )
            response = completion.choices[0].message.content
            
            # Determine credits
            credits_used = 1
            if '```html' in response or '```javascript' in response:
                credits_used = SERVICE_COSTS.get(request_type, 15)
            
            has_buttons = "[BUTTONS]" in response
            
            return response, credits_used, has_buttons
            
        except Exception as e:
            logger.error(f"GPT error: {e}")
            return "❌ خطأ في المعالجة", 0, False
    
    def _generate_title(self, message: str, request_type: str) -> str:
        icons = {"image": "🎨", "video": "🎬", "website": "🌐", "game": "🎮", "webapp": "💻", "pwa": "📱"}
        prefix = icons.get(request_type, "💬")
        title = message[:25].strip()
        if len(message) > 25:
            title += "..."
        return f"{prefix} {title}"
    
    async def delete_session(self, session_id: str, user_id: str) -> bool:
        result = await self.db.chat_sessions.update_one(
            {"id": session_id, "user_id": user_id},
            {"$set": {"status": "archived"}}
        )
        return result.modified_count > 0
    
    async def get_session_assets(self, session_id: str, user_id: str) -> List[Dict]:
        assets = await self.db.generated_assets.find(
            {"session_id": session_id, "user_id": user_id},
            {"_id": 0}
        ).sort("created_at", -1).to_list(100)
        return assets
    
    async def get_video_requests(self, user_id: str, session_id: str = None) -> List[Dict]:
        query = {"user_id": user_id}
        if session_id:
            query["session_id"] = session_id
        return await self.db.video_requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    
    async def generate_tts(self, text: str, provider: str = "openai", voice: str = "alloy", speed: float = 1.0) -> Optional[str]:
        # TTS disabled for now
        return None
    
    async def update_session_code(self, session_id: str, user_id: str, code: str) -> bool:
        code_with_badge = inject_zitex_badge(code)
        result = await self.db.chat_sessions.update_one(
            {"id": session_id, "user_id": user_id},
            {"$set": {"generated_code": code_with_badge, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        return result.modified_count > 0
    
    async def get_session_code(self, session_id: str, user_id: str) -> Optional[str]:
        session = await self.get_session(session_id, user_id)
        return session.get("generated_code") if session else None
