"""
Zitex AI Chat Service - Progressive Builder Edition
خدمة الشات الذكي - النسخة التدريجية
Version 6.0 - Progressive Live Builder with Hidden Code
"""
import os
import uuid
import base64
import logging
import re
import asyncio
from datetime import datetime, timezone
from typing import Optional, Dict, Any, Tuple, List
from motor.motor_asyncio import AsyncIOMotorDatabase
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

AI_FEATURES_ENABLED = True

# Try to import emergentintegrations for LLM chat
try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    EMERGENT_LLM_AVAILABLE = True
except ImportError:
    EMERGENT_LLM_AVAILABLE = False
    LlmChat = None
    UserMessage = None

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


MASTER_SYSTEM_PROMPT = """أنت "زيتكس" (Zitex) - مهندس ذكاء اصطناعي لبناء المشاريع الرقمية بشكل تدريجي.

## ⚠️ قاعدة ذهبية - مهمة جداً:
لا تضع الكود أبداً داخل الرسالة النصية!
ضع الكود فقط في قسم [CODE_BLOCK] في نهاية ردك.

## 🎯 طريقة العمل التدريجية:

### 1. مرحلة الفهم (سؤال أو اثنين فقط):
- اسأل سؤال واحد مع خيارات بأزرار
- انتظر الإجابة
- إذا احتجت توضيح آخر، اسأل سؤال ثاني فقط

### 2. صيغة الأزرار (إجبارية للخيارات):
[BUTTONS]
خيار1|خيار2|خيار3|✏️ غير ذلك
[/BUTTONS]

### 3. مرحلة البناء التدريجي:
بعد فهم الفكرة، ابدأ البناء مباشرة:

**الخطوة 1:** "🚀 رائع! سأبدأ الآن ببناء صفحة الدخول..."
ثم ضع الكود في [CODE_BLOCK]

**الخطوة 2:** بعد رد العميل: "✨ ممتاز! الآن سأضيف لوحة التحكم..."
ثم ضع الكود المحدث في [CODE_BLOCK]

**الخطوة 3:** "🎨 سأضيف الآن التصميم النهائي والتفاصيل..."

### 4. تنسيق الكود (مهم جداً):
ضع الكود دائماً في نهاية الرد بهذا الشكل:
[CODE_BLOCK]
```html
الكود هنا
```
[/CODE_BLOCK]

### 5. قواعد البناء:
- كل كود يجب أن يكون كامل 100% (لا تكتب ... أبداً)
- أضف شارة Zitex تلقائياً
- الكود يجب أن يعمل مباشرة في المتصفح
- استخدم CDN للمكتبات (Tailwind, Alpine.js, etc.)

### 6. تنسيق الردود:
- استخدم إيموجي
- نص قصير ومباشر
- لا تشرح الكود - العميل يراه في Live Preview
- أخبر العميل بما سيُضاف في كل خطوة

### 7. أمثلة للردود:

**بداية مشروع:**
```
ممتاز! 🎯 أنت تريد [وصف قصير]

ما النمط المفضل؟
[BUTTONS]
🖤 داكن وأنيق|💙 أزرق احترافي|💚 أخضر طبيعي|🎨 غير ذلك
[/BUTTONS]
```

**بدء البناء:**
```
🚀 رائع! سأبدأ الآن ببناء الصفحة الرئيسية...

شاهد النتيجة في المعاينة المباشرة ←

> 💰 التكلفة: 15 نقطة

ما رأيك؟ هل تريد تعديل شيء؟
[BUTTONS]
✅ ممتاز، أكمل|🎨 غيّر الألوان|📝 عدّل النص|➕ أضف قسم
[/BUTTONS]

[CODE_BLOCK]
```html
<!DOCTYPE html>
...الكود الكامل...
```
[/CODE_BLOCK]
```

### 8. الميزات التي يمكنك بناؤها:
- مواقع ويب كاملة (صفحات متعددة)
- لوحات تحكم Dashboard
- متاجر إلكترونية
- صفحات هبوط Landing Pages
- ألعاب 2D/3D
- تطبيقات ويب PWA
"""


WELCOME_MESSAGE = """## 👋 مرحباً بك في زيتكس!

أنا مهندسك الذكي لبناء المشاريع الرقمية. 
سأبني لك المشروع خطوة بخطوة وتشاهده مباشرة في المعاينة!

ماذا تريد أن نبني اليوم؟

[BUTTONS]
🌐 موقع ويب|📱 تطبيق ويب|🎮 لعبة|🖼️ صفحة هبوط|✏️ فكرة أخرى
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
    "deploy": 100,
    "save_template": 10,
    "use_template": 5
}


# ============== Templates System ==============
DEFAULT_TEMPLATES = [
    {
        "id": "landing-dark",
        "name": "صفحة هبوط داكنة",
        "category": "landing",
        "preview_image": "https://via.placeholder.com/400x300/1a1a2e/ffd700?text=Landing+Dark",
        "description": "صفحة هبوط احترافية بتصميم داكن وأنيق",
        "is_premium": False,
        "cost": 0
    },
    {
        "id": "ecommerce-gold",
        "name": "متجر ذهبي",
        "category": "ecommerce",
        "preview_image": "https://via.placeholder.com/400x300/0a0a12/ffd700?text=E-Commerce",
        "description": "متجر إلكتروني بتصميم ذهبي فاخر",
        "is_premium": True,
        "cost": 20
    },
    {
        "id": "portfolio-minimal",
        "name": "معرض أعمال بسيط",
        "category": "portfolio",
        "preview_image": "https://via.placeholder.com/400x300/16213e/ffd700?text=Portfolio",
        "description": "معرض أعمال بتصميم بسيط وأنيق",
        "is_premium": False,
        "cost": 0
    },
    {
        "id": "dashboard-pro",
        "name": "لوحة تحكم احترافية",
        "category": "dashboard",
        "preview_image": "https://via.placeholder.com/400x300/1a1a2e/00d4ff?text=Dashboard",
        "description": "لوحة تحكم متكاملة مع رسوم بيانية",
        "is_premium": True,
        "cost": 25
    }
]


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
        self.emergent_key = os.environ.get('EMERGENT_LLM_KEY')
        
        self.eleven_client = None
        if ELEVENLABS_AVAILABLE and elevenlabs_key:
            try:
                self.eleven_client = ElevenLabs(api_key=elevenlabs_key)
            except Exception:
                pass
        
        self.openai_client = None
        if OPENAI_AVAILABLE and self.openai_key:
            try:
                self.openai_client = openai.OpenAI(api_key=self.openai_key)
            except Exception:
                pass
        
        # Check if we have any LLM capability
        self.llm_available = bool(self.emergent_key) or bool(self.openai_client)
    
    async def create_session(self, user_id: str, session_type: str = "general", title: str = None) -> Dict:
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
        
        if not AI_FEATURES_ENABLED or not self.llm_available:
            ai_response = "⚠️ خدمة غير متاحة حالياً. يرجى إضافة مفتاح API."
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
        
        # Extract code from [CODE_BLOCK] or regular code blocks
        code = None
        
        # First try CODE_BLOCK format
        code_block_match = re.search(r'\[CODE_BLOCK\]\s*```(?:html|javascript|js)?\n?([\s\S]*?)```\s*\[/CODE_BLOCK\]', ai_response)
        if code_block_match:
            code = code_block_match.group(1).strip()
        else:
            # Fall back to regular code block
            code_match = re.search(r'```(?:html|javascript|js)?\n?([\s\S]*?)```', ai_response)
            if code_match:
                code = code_match.group(1).strip()
        
        if code:
            code_with_badge = inject_zitex_badge(code)
            update_data["$set"]["generated_code"] = code_with_badge
            # Store code in metadata for frontend to use
            assistant_msg["metadata"]["generated_code"] = code_with_badge
            assistant_msg["metadata"]["has_preview"] = True
        
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
        # Build context about the project
        project_data = session.get("project_data", {})
        stage = session.get("conversation_stage", "initial")
        
        context = f"""
رصيد العميل: {credits} نقطة
مرحلة المحادثة: {stage}
بيانات المشروع حتى الآن: {project_data}
"""
        
        system_prompt = MASTER_SYSTEM_PROMPT + context
        
        # Build conversation history
        conversation_history = ""
        for msg in session.get("messages", [])[-12:]:
            role_label = "المستخدم" if msg["role"] == "user" else "زيتكس"
            conversation_history += f"\n{role_label}: {msg['content']}\n"
        
        full_prompt = f"{conversation_history}\nالمستخدم: {message}"
        
        try:
            # Try Emergent LLM first (preferred)
            if EMERGENT_LLM_AVAILABLE and self.emergent_key:
                chat = LlmChat(
                    api_key=self.emergent_key,
                    session_id=session.get("id", "default"),
                    system_message=system_prompt
                )
                chat.with_model("openai", "gpt-4o")
                
                user_message = UserMessage(text=full_prompt)
                response = await chat.send_message(user_message)
            
            # Fall back to direct OpenAI client
            elif self.openai_client:
                messages = [{"role": "system", "content": system_prompt}]
                for msg in session.get("messages", [])[-12:]:
                    messages.append({"role": msg["role"], "content": msg["content"]})
                messages.append({"role": "user", "content": message})
                
                completion = self.openai_client.chat.completions.create(
                    model="gpt-4o",
                    messages=messages,
                    temperature=0.7,
                    max_tokens=8000
                )
                response = completion.choices[0].message.content
            else:
                return "⚠️ خدمة الذكاء الاصطناعي غير متاحة. يرجى إضافة مفتاح API.", 0, False
            
            # Determine credits based on content
            credits_used = 1  # Base cost for conversation
            
            # Check if response contains code (in CODE_BLOCK or regular code block)
            has_code = '[CODE_BLOCK]' in response or ('```html' in response and '[CODE_BLOCK]' not in response) or '```javascript' in response
            
            if has_code:
                credits_used = SERVICE_COSTS.get(request_type, 15)
            
            has_buttons = "[BUTTONS]" in response
            
            return response, credits_used, has_buttons
            
        except Exception as e:
            logger.error(f"GPT error: {e}")
            return f"❌ خطأ في المعالجة: {str(e)}", 0, False
    
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
    
    # ============== Templates System ==============
    async def save_as_template(self, user_id: str, session_id: str, name: str, description: str = "", category: str = "custom") -> Dict:
        """حفظ المشروع كقالب"""
        session = await self.get_session(session_id, user_id)
        if not session or not session.get("generated_code"):
            raise ValueError("لا يوجد كود للحفظ")
        
        # Check credits
        credits = await self.get_user_credits(user_id)
        cost = SERVICE_COSTS["save_template"]
        if credits < cost:
            raise ValueError(f"رصيد غير كافٍ. المطلوب: {cost} نقطة")
        
        template = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "name": name,
            "description": description,
            "category": category,
            "code": session["generated_code"],
            "session_type": session.get("session_type", "website"),
            "preview_image": None,
            "is_public": False,
            "is_premium": False,
            "cost": 0,
            "uses_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await self.db.templates.insert_one(template)
        await self.deduct_credits(user_id, cost, "save_template")
        
        return {
            "id": template["id"],
            "name": template["name"],
            "message": f"✅ تم حفظ القالب بنجاح! (-{cost} نقطة)"
        }
    
    async def get_templates(self, user_id: str = None, category: str = None, include_public: bool = True) -> List[Dict]:
        """استرجاع القوالب"""
        templates = []
        
        # Add default templates
        for t in DEFAULT_TEMPLATES:
            if category and t["category"] != category:
                continue
            templates.append({**t, "is_default": True, "user_id": None})
        
        # Add user templates
        query = {}
        if user_id:
            if include_public:
                query = {"$or": [{"user_id": user_id}, {"is_public": True}]}
            else:
                query = {"user_id": user_id}
        elif include_public:
            query = {"is_public": True}
        
        if category:
            query["category"] = category
        
        user_templates = await self.db.templates.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
        templates.extend([{**t, "is_default": False} for t in user_templates])
        
        return templates
    
    async def use_template(self, user_id: str, template_id: str, session_id: str = None) -> Dict:
        """استخدام قالب"""
        # Check if default template
        default_template = next((t for t in DEFAULT_TEMPLATES if t["id"] == template_id), None)
        
        if default_template:
            template = default_template
            code = self._get_default_template_code(template_id)
        else:
            template = await self.db.templates.find_one({"id": template_id}, {"_id": 0})
            if not template:
                raise ValueError("القالب غير موجود")
            code = template.get("code", "")
        
        # Check credits for premium templates
        cost = template.get("cost", SERVICE_COSTS["use_template"])
        if cost > 0:
            credits = await self.get_user_credits(user_id)
            if credits < cost:
                raise ValueError(f"رصيد غير كافٍ. المطلوب: {cost} نقطة")
            await self.deduct_credits(user_id, cost, "use_template")
        
        # Update uses count
        if not default_template:
            await self.db.templates.update_one(
                {"id": template_id},
                {"$inc": {"uses_count": 1}}
            )
        
        # Create or update session with template code
        if session_id:
            await self.update_session_code(session_id, user_id, code)
        else:
            session = await self.create_session(user_id, template.get("session_type", "website"), f"من قالب: {template['name']}")
            session_id = session["id"]
            await self.update_session_code(session_id, user_id, code)
        
        return {
            "session_id": session_id,
            "code": inject_zitex_badge(code),
            "template_name": template["name"],
            "cost": cost
        }
    
    def _get_default_template_code(self, template_id: str) -> str:
        """كود القوالب الافتراضية"""
        templates_code = {
            "landing-dark": '''<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>صفحة هبوط</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#0a0a12] text-white min-h-screen">
    <nav class="fixed top-0 w-full bg-black/50 backdrop-blur-xl border-b border-amber-500/20 z-50">
        <div class="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <h1 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500">Logo</h1>
            <div class="flex gap-6">
                <a href="#" class="text-gray-300 hover:text-amber-400 transition">الرئيسية</a>
                <a href="#" class="text-gray-300 hover:text-amber-400 transition">الخدمات</a>
                <a href="#" class="text-gray-300 hover:text-amber-400 transition">تواصل</a>
            </div>
        </div>
    </nav>
    <section class="pt-32 pb-20 px-6">
        <div class="max-w-4xl mx-auto text-center">
            <h1 class="text-5xl md:text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500">
                عنوان رئيسي جذاب
            </h1>
            <p class="text-xl text-gray-400 mb-8">وصف مختصر يشرح ما تقدمه من خدمات أو منتجات بشكل واضح ومباشر</p>
            <button class="px-8 py-4 bg-gradient-to-r from-amber-600 to-yellow-600 rounded-full text-lg font-bold hover:from-amber-700 hover:to-yellow-700 transition shadow-lg shadow-amber-500/30">
                ابدأ الآن
            </button>
        </div>
    </section>
</body>
</html>''',
            "ecommerce-gold": '''<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>متجر إلكتروني</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#0a0a12] text-white min-h-screen">
    <nav class="bg-black/80 backdrop-blur border-b border-amber-500/20 sticky top-0 z-50">
        <div class="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <h1 class="text-2xl font-bold text-amber-400">🛒 المتجر</h1>
            <div class="flex items-center gap-4">
                <input type="text" placeholder="ابحث..." class="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm">
                <button class="relative p-2">🛍️<span class="absolute -top-1 -right-1 bg-amber-500 text-black text-xs w-5 h-5 rounded-full flex items-center justify-center">3</span></button>
            </div>
        </div>
    </nav>
    <section class="py-12 px-6">
        <div class="max-w-6xl mx-auto">
            <h2 class="text-3xl font-bold text-amber-400 mb-8">المنتجات المميزة</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden hover:border-amber-500/50 transition">
                    <div class="h-48 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center text-6xl">📱</div>
                    <div class="p-4">
                        <h3 class="text-lg font-bold text-white">منتج 1</h3>
                        <p class="text-gray-400 text-sm mb-3">وصف المنتج</p>
                        <div class="flex justify-between items-center">
                            <span class="text-amber-400 font-bold">199 ر.س</span>
                            <button class="px-4 py-2 bg-amber-600 rounded-lg text-sm hover:bg-amber-700">أضف للسلة</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</body>
</html>''',
            "portfolio-minimal": '''<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>معرض الأعمال</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#0a0a12] text-white min-h-screen">
    <section class="min-h-screen flex items-center justify-center px-6">
        <div class="text-center">
            <div class="w-32 h-32 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl">👤</div>
            <h1 class="text-4xl font-bold mb-2">اسمك هنا</h1>
            <p class="text-amber-400 text-xl mb-6">مصمم | مطور | مبدع</p>
            <p class="text-gray-400 max-w-md mx-auto mb-8">نبذة مختصرة عنك وعن خبراتك ومهاراتك في مجال عملك</p>
            <div class="flex justify-center gap-4">
                <a href="#" class="px-6 py-3 bg-amber-600 rounded-lg hover:bg-amber-700 transition">أعمالي</a>
                <a href="#" class="px-6 py-3 border border-amber-500 rounded-lg hover:bg-amber-500/20 transition">تواصل معي</a>
            </div>
        </div>
    </section>
</body>
</html>''',
            "dashboard-pro": '''<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>لوحة التحكم</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#0a0a12] text-white min-h-screen flex">
    <aside class="w-64 bg-[#0d0d18] border-l border-slate-800 p-4 hidden md:block">
        <h1 class="text-xl font-bold text-amber-400 mb-8">📊 Dashboard</h1>
        <nav class="space-y-2">
            <a href="#" class="flex items-center gap-3 px-4 py-3 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400">🏠 الرئيسية</a>
            <a href="#" class="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-xl text-gray-400">📈 الإحصائيات</a>
            <a href="#" class="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-xl text-gray-400">👥 المستخدمين</a>
            <a href="#" class="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-xl text-gray-400">⚙️ الإعدادات</a>
        </nav>
    </aside>
    <main class="flex-1 p-6">
        <h2 class="text-2xl font-bold mb-6">مرحباً بك 👋</h2>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div class="bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-2xl p-6">
                <p class="text-gray-400 text-sm">إجمالي المبيعات</p>
                <p class="text-3xl font-bold text-amber-400">12,450</p>
            </div>
            <div class="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                <p class="text-gray-400 text-sm">المستخدمين</p>
                <p class="text-3xl font-bold">2,340</p>
            </div>
            <div class="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                <p class="text-gray-400 text-sm">الطلبات</p>
                <p class="text-3xl font-bold">456</p>
            </div>
            <div class="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                <p class="text-gray-400 text-sm">الإيرادات</p>
                <p class="text-3xl font-bold text-green-400">+15%</p>
            </div>
        </div>
    </main>
</body>
</html>'''
        }
        return templates_code.get(template_id, templates_code["landing-dark"])
    
    # ============== Deployment System ==============
    async def deploy_project(self, user_id: str, session_id: str, subdomain: str) -> Dict:
        """نشر المشروع على نطاق فرعي"""
        import re
        
        # Validate subdomain
        subdomain = subdomain.lower().strip()
        if not re.match(r'^[a-z0-9][a-z0-9-]{2,30}[a-z0-9]$', subdomain):
            raise ValueError("اسم النطاق غير صالح. استخدم حروف إنجليزية صغيرة وأرقام وشرطات فقط (4-32 حرف)")
        
        # Check if subdomain is taken
        existing = await self.db.deployments.find_one({"subdomain": subdomain, "status": "active"})
        if existing:
            raise ValueError(f"النطاق {subdomain}.zitex.app محجوز بالفعل")
        
        # Get session code
        session = await self.get_session(session_id, user_id)
        if not session or not session.get("generated_code"):
            raise ValueError("لا يوجد كود للنشر")
        
        # Check credits
        credits = await self.get_user_credits(user_id)
        cost = SERVICE_COSTS["deploy"]
        if credits < cost:
            raise ValueError(f"رصيد غير كافٍ. المطلوب: {cost} نقطة")
        
        # Create deployment record
        deployment = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "session_id": session_id,
            "subdomain": subdomain,
            "url": f"https://{subdomain}.zitex.app",
            "code": session["generated_code"],
            "status": "active",
            "visits": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": None  # No expiry for now
        }
        
        await self.db.deployments.insert_one(deployment)
        await self.deduct_credits(user_id, cost, f"deploy:{subdomain}")
        
        # Update session with deployment info
        await self.db.chat_sessions.update_one(
            {"id": session_id},
            {"$set": {
                "deployment": {
                    "id": deployment["id"],
                    "subdomain": subdomain,
                    "url": deployment["url"],
                    "status": "active"
                }
            }}
        )
        
        return {
            "id": deployment["id"],
            "url": deployment["url"],
            "subdomain": subdomain,
            "message": f"🚀 تم نشر المشروع بنجاح!\n\n🔗 الرابط: {deployment['url']}\n\n💰 التكلفة: {cost} نقطة"
        }
    
    async def get_user_deployments(self, user_id: str) -> List[Dict]:
        """استرجاع مشاريع المستخدم المنشورة"""
        deployments = await self.db.deployments.find(
            {"user_id": user_id, "status": "active"},
            {"_id": 0, "code": 0}
        ).sort("created_at", -1).to_list(50)
        return deployments
    
    async def get_deployment_by_subdomain(self, subdomain: str) -> Optional[Dict]:
        """استرجاع مشروع منشور بالنطاق"""
        return await self.db.deployments.find_one(
            {"subdomain": subdomain, "status": "active"},
            {"_id": 0}
        )
    
    async def delete_deployment(self, user_id: str, deployment_id: str) -> bool:
        """حذف مشروع منشور"""
        result = await self.db.deployments.update_one(
            {"id": deployment_id, "user_id": user_id},
            {"$set": {"status": "deleted"}}
        )
        return result.modified_count > 0
