"""
Zitex AI Chat Service - Professional Edition
خدمة الشات الذكي المتقدمة لتوليد المحتوى
Version 2.0 - High-Performance AI Assistant
"""
import os
import uuid
import base64
import logging
import asyncio
import re
import json
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


# ============== PROFESSIONAL SYSTEM PROMPTS ==============

MASTER_SYSTEM_PROMPT = """أنت "زيتكس" - مساعد ذكاء اصطناعي متقدم ومحترف لتوليد المحتوى الرقمي.

## هويتك:
- اسمك: زيتكس (Zitex)
- تخصصك: بناء المواقع، توليد الصور، إنشاء الألعاب، توليد الفيديوهات
- لغتك: العربية (مع دعم الإنجليزية عند الحاجة)

## قواعد صارمة يجب اتباعها دائماً:

### 1. الرد المباشر والتنفيذ الفوري:
- لا تقل أبداً "سأقوم بـ..." أو "يمكنني أن..." - بل نفذ مباشرة
- لا تسأل أسئلة غير ضرورية - استخدم معلومات منطقية افتراضية
- لا تعتذر ولا تبرر - فقط نفذ المطلوب
- إذا طُلب منك موقع/لعبة/تطبيق → أنشئ الكود الكامل فوراً

### 2. توليد الكود:
- كل كود يجب أن يكون **كاملاً وقابلاً للتشغيل مباشرة**
- لا تضع "..." أو "// باقي الكود هنا" - اكتب كل شيء
- استخدم تنسيق ```html أو ```javascript لعرض الكود
- الكود يجب أن يعمل فوراً في المتصفح بدون تعديلات

### 3. جودة الكود:
- تصميم عصري وجذاب (استخدم gradients, shadows, animations)
- متجاوب مع جميع الشاشات (responsive)
- ألوان متناسقة واحترافية
- تجربة مستخدم ممتازة (UX)

### 4. بنية الرد:
- ابدأ بجملة قصيرة (سطر واحد) تصف ما أنشأته
- ثم الكود الكامل مباشرة
- لا تضع شروحات طويلة قبل أو بعد الكود

## أمثلة على الردود الصحيحة:

### مثال 1 - طلب موقع:
المستخدم: "أريد موقع لمطعم"
الرد الصحيح:
تم إنشاء موقع احترافي لمطعم:

```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>مطعم الذواقة</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); min-height: 100vh; color: white; }
        /* ... كود CSS كامل */
    </style>
</head>
<body>
    <!-- كود HTML كامل -->
    <script>
        // كود JavaScript كامل
    </script>
</body>
</html>
```

### مثال 2 - طلب لعبة:
المستخدم: "اصنع لعبة"
الرد الصحيح:
تم إنشاء لعبة تفاعلية:

```html
<!DOCTYPE html>
<html>
<head>
    <title>لعبة زيتكس</title>
    <style>/* CSS كامل */</style>
</head>
<body>
    <canvas id="game"></canvas>
    <script>
        // كود اللعبة الكامل والقابل للتشغيل
    </script>
</body>
</html>
```

## ما يجب تجنبه تماماً:
❌ "سأساعدك في إنشاء..."
❌ "هل تريد أن أضيف..."  
❌ "يمكنني تصميم..."
❌ "// أضف باقي الكود هنا"
❌ شروحات طويلة قبل الكود
❌ أسئلة عن التفاصيل (استخدم افتراضات منطقية)

## ما يجب فعله دائماً:
✅ إنشاء كود كامل فوراً
✅ تصميم جذاب وعصري
✅ كود يعمل مباشرة
✅ رد مختصر ومباشر
✅ استخدام ألوان وتأثيرات جميلة

تذكر: المستخدم يريد نتائج فورية، لا وعود أو أسئلة."""


WEBSITE_SYSTEM_PROMPT = """أنت زيتكس - خبير بناء المواقع المحترف.

## مهمتك:
إنشاء مواقع ويب كاملة وجاهزة للتشغيل فوراً.

## قواعد البناء:
1. كل موقع يجب أن يكون ملف HTML واحد يحتوي على CSS و JavaScript
2. التصميم يجب أن يكون:
   - عصري (modern) مع gradients وshadows
   - متجاوب (responsive) يعمل على الجوال والكمبيوتر
   - داعم للعربية (RTL)
   - ألوان احترافية ومتناسقة
3. استخدم:
   - CSS Grid و Flexbox للتخطيط
   - CSS animations للحركة
   - JavaScript للتفاعلية

## بنية الموقع المطلوبة:
```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>عنوان الموقع</title>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        /* CSS كامل هنا */
    </style>
</head>
<body>
    <!-- HTML كامل هنا -->
    <script>
        // JavaScript كامل هنا
    </script>
</body>
</html>
```

## أنواع المواقع:
- مطعم/مقهى: قائمة طعام، حجز، موقع، تواصل
- متجر: منتجات، سلة، دفع
- شخصي/بورتفوليو: نبذة، أعمال، تواصل
- شركة: خدمات، عن الشركة، فريق، تواصل
- مدونة: مقالات، تصنيفات، بحث

## تذكر:
- لا تسأل عن التفاصيل - استخدم بيانات وهمية منطقية
- الكود يجب أن يعمل فوراً في المعاينة المباشرة
- اجعل التصميم مبهراً ومحترفاً"""


GAME_SYSTEM_PROMPT = """أنت زيتكس - مطور ألعاب محترف.

## مهمتك:
إنشاء ألعاب تفاعلية كاملة تعمل في المتصفح.

## قواعد الألعاب:
1. استخدم HTML5 Canvas للرسم
2. JavaScript للمنطق والتحكم
3. اللعبة يجب أن تعمل فوراً بدون أي تعديلات

## أنواع الألعاب المتاحة:
- **ألعاب أركيد**: مثل Snake, Breakout, Pong, Space Invaders
- **ألعاب ألغاز**: مثل Puzzle, Memory Match, Trivia
- **ألعاب منصات**: مثل Jump & Run
- **ألعاب سباق**: سيارات أو دراجات بسيطة
- **ألعاب إطلاق نار**: Space shooter

## بنية اللعبة المطلوبة:
```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>اسم اللعبة</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            min-height: 100vh; 
            background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
            font-family: 'Segoe UI', sans-serif;
        }
        #gameContainer {
            text-align: center;
        }
        canvas { 
            border-radius: 10px; 
            box-shadow: 0 0 30px rgba(255,215,0,0.3);
        }
        .score {
            color: #ffd700;
            font-size: 24px;
            margin-bottom: 15px;
        }
        .controls {
            color: #888;
            margin-top: 15px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div id="gameContainer">
        <div class="score">النقاط: <span id="score">0</span></div>
        <canvas id="gameCanvas" width="600" height="400"></canvas>
        <div class="controls">استخدم الأسهم للتحكم</div>
    </div>
    <script>
        // كود اللعبة الكامل
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        // ... باقي كود اللعبة
    </script>
</body>
</html>
```

## مكونات اللعبة:
1. **Game Loop**: requestAnimationFrame
2. **Input Handling**: keyboard/mouse/touch
3. **Collision Detection**: تحقق التصادم
4. **Score System**: نظام النقاط
5. **Game Over**: نهاية اللعبة وإعادة البدء

## تذكر:
- اللعبة يجب أن تكون ممتعة وقابلة للعب فوراً
- أضف تأثيرات بصرية جذابة
- اجعل التحكم سلساً
- أضف نظام نقاط واضح"""


IMAGE_SYSTEM_PROMPT = """أنت زيتكس - خبير توليد الصور بالذكاء الاصطناعي.

## مهمتك:
عندما يطلب المستخدم صورة، سأقوم بتوليدها باستخدام DALL-E 3.

## قواعد الرد:
1. عند استلام طلب صورة، أجب برسالة قصيرة:
   "جاري إنشاء الصورة: [وصف مختصر]..."
2. سيتم إرفاق الصورة تلقائياً مع الرد

## أنواع الصور:
- صور فنية وإبداعية
- شعارات وهويات بصرية
- صور منتجات
- صور للسوشيال ميديا
- رسومات وأيقونات

تذكر: لا تصف كيف ستنشئ الصورة، فقط أخبر المستخدم أنك تعمل عليها."""


VIDEO_SYSTEM_PROMPT = """أنت زيتكس - خبير إنشاء الفيديوهات السينمائية.

## مهمتك:
إنشاء فيديوهات احترافية باستخدام Sora 2.

## قواعد الرد:
1. عند استلام طلب فيديو، أجب:
   "جاري إنشاء الفيديو السينمائي..."
2. الفيديو سيتم توليده في الخلفية

## معلومات تقنية:
- مدة الفيديو: حتى 12 ثانية
- جودة عالية: 1080p
- أسلوب سينمائي احترافي

تذكر: لا تعد بأشياء لا يمكن تحقيقها."""


# ============== REQUEST TYPE DETECTION ==============

def detect_request_type(message: str, session_type: str = "general") -> str:
    """تحديد نوع الطلب بذكاء"""
    message_lower = message.lower()
    
    # Image keywords
    image_keywords = [
        'صورة', 'صور', 'أنشئ صورة', 'اصنع صورة', 'ارسم', 'توليد صورة',
        'image', 'picture', 'generate image', 'create image', 'draw',
        'شعار', 'لوجو', 'logo', 'icon', 'أيقونة'
    ]
    
    # Video keywords
    video_keywords = [
        'فيديو', 'فديو', 'مقطع', 'فلم', 'video', 'clip', 'movie',
        'سينمائي', 'cinematic', 'أنيميشن', 'animation'
    ]
    
    # Game keywords
    game_keywords = [
        'لعبة', 'العاب', 'قيم', 'game', 'play', 'ألعاب',
        'snake', 'سنيك', 'بونج', 'pong', 'اركيد', 'arcade',
        'تريفيا', 'trivia', 'كويز', 'quiz', 'ذاكرة', 'memory'
    ]
    
    # Website keywords
    website_keywords = [
        'موقع', 'صفحة', 'ويب', 'website', 'page', 'site', 'web',
        'متجر', 'مطعم', 'شركة', 'بورتفوليو', 'مدونة', 'blog',
        'landing', 'هبوط', 'تطبيق ويب', 'webapp'
    ]
    
    # Check session type first
    if session_type == "image":
        return "image"
    elif session_type == "video":
        return "video"
    elif session_type == "game":
        return "game"
    elif session_type == "website":
        return "website"
    
    # Then check message content
    if any(kw in message_lower for kw in image_keywords):
        return "image"
    elif any(kw in message_lower for kw in video_keywords):
        return "video"
    elif any(kw in message_lower for kw in game_keywords):
        return "game"
    elif any(kw in message_lower for kw in website_keywords):
        return "website"
    
    return "general"


def get_system_prompt(request_type: str) -> str:
    """الحصول على System Prompt المناسب"""
    prompts = {
        "general": MASTER_SYSTEM_PROMPT,
        "website": WEBSITE_SYSTEM_PROMPT,
        "game": GAME_SYSTEM_PROMPT,
        "image": IMAGE_SYSTEM_PROMPT,
        "video": VIDEO_SYSTEM_PROMPT
    }
    return prompts.get(request_type, MASTER_SYSTEM_PROMPT)


# ============== CODE TEMPLATES ==============

WEBSITE_TEMPLATE = '''<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap" rel="stylesheet">
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ 
            font-family: 'Tajawal', sans-serif; 
            background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%);
            min-height: 100vh;
            color: #fff;
        }}
        {css}
    </style>
</head>
<body>
    {html}
    <script>
        {js}
    </script>
</body>
</html>'''


GAME_TEMPLATE = '''<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            min-height: 100vh; 
            background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
            font-family: 'Segoe UI', Tahoma, sans-serif;
            overflow: hidden;
        }}
        #gameContainer {{
            text-align: center;
            padding: 20px;
        }}
        canvas {{ 
            border-radius: 15px; 
            box-shadow: 0 0 40px rgba(255,215,0,0.2), 0 0 80px rgba(255,215,0,0.1);
            background: #0a0a15;
        }}
        .game-ui {{
            color: #ffd700;
            font-size: 20px;
            margin-bottom: 15px;
            display: flex;
            justify-content: center;
            gap: 30px;
        }}
        .game-ui span {{
            background: rgba(255,215,0,0.1);
            padding: 8px 20px;
            border-radius: 20px;
            border: 1px solid rgba(255,215,0,0.3);
        }}
        .controls {{
            color: #666;
            margin-top: 15px;
            font-size: 14px;
        }}
        .btn {{
            background: linear-gradient(135deg, #ffd700, #ffaa00);
            color: #000;
            border: none;
            padding: 12px 30px;
            border-radius: 25px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            margin-top: 15px;
            transition: transform 0.2s, box-shadow 0.2s;
        }}
        .btn:hover {{
            transform: scale(1.05);
            box-shadow: 0 5px 20px rgba(255,215,0,0.4);
        }}
        {extra_css}
    </style>
</head>
<body>
    <div id="gameContainer">
        <h1 style="color: #ffd700; margin-bottom: 20px; font-size: 28px;">{title}</h1>
        <div class="game-ui">
            <span>النقاط: <strong id="score">0</strong></span>
            <span>المستوى: <strong id="level">1</strong></span>
        </div>
        <canvas id="gameCanvas" width="600" height="450"></canvas>
        <div class="controls">{controls}</div>
        <button class="btn" onclick="restartGame()" id="restartBtn" style="display:none;">إعادة اللعب</button>
    </div>
    <script>
        {game_code}
    </script>
</body>
</html>'''


# ============== AI ASSISTANT CLASS ==============

class AIAssistant:
    """مساعد الذكاء الاصطناعي المتقدم"""
    
    def __init__(self, db: AsyncIOMotorDatabase, api_key: str = None, elevenlabs_key: str = None, openai_key: str = None):
        self.db = db
        self.api_key = api_key or os.environ.get('OPENAI_API_KEY')
        self.elevenlabs_key = elevenlabs_key
        self.openai_key = openai_key or self.api_key
        
        # Initialize ElevenLabs client
        self.eleven_client = None
        if ELEVENLABS_AVAILABLE and elevenlabs_key:
            try:
                self.eleven_client = ElevenLabs(api_key=elevenlabs_key)
            except:
                pass
        
        # Initialize OpenAI client
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
            "generated_code": None,
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
        """معالجة رسالة المستخدم - النسخة المتقدمة"""
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
        
        # تحديد نوع الطلب
        request_type = detect_request_type(message, session.get("session_type", "general"))
        
        # إنشاء رد المساعد
        ai_response = ""
        attachments = []
        credits_used = 0
        
        if not AI_FEATURES_ENABLED or not self.openai_client:
            ai_response = "عذراً، خدمات الذكاء الاصطناعي غير متاحة حالياً. يرجى التأكد من إعداد مفتاح OpenAI API."
        else:
            try:
                # Image Generation
                if request_type == "image":
                    ai_response, attachments, credits_used = await self._generate_image(user_id, session_id, message)
                
                # Video Generation (placeholder)
                elif request_type == "video":
                    ai_response = "جاري إنشاء الفيديو السينمائي...\n\nملاحظة: توليد الفيديو قيد التطوير وسيكون متاحاً قريباً."
                
                # Website/Game/General - Use GPT
                else:
                    ai_response, credits_used = await self._generate_with_gpt(
                        session, message, request_type, settings
                    )
                    
            except Exception as e:
                logger.error(f"Error processing message: {e}")
                ai_response = f"عذراً، حدث خطأ أثناء المعالجة. يرجى المحاولة مرة أخرى."
        
        # إنشاء رسالة المساعد
        assistant_msg = {
            "id": str(uuid.uuid4()),
            "role": "assistant",
            "content": ai_response.strip(),
            "message_type": "text",
            "attachments": attachments,
            "metadata": {"request_type": request_type, "credits_used": credits_used},
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # تحديث الجلسة
        update_data = {
            "$push": {"messages": {"$each": [user_msg, assistant_msg]}},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
        
        # حفظ الكود المولد إن وجد
        code_match = re.search(r'```(?:html|javascript|js)?\n?([\s\S]*?)```', ai_response)
        if code_match:
            update_data["$set"]["generated_code"] = code_match.group(1)
            update_data["$set"]["session_type"] = request_type
        
        await self.db.chat_sessions.update_one(
            {"id": session_id},
            update_data
        )
        
        # تحديث عنوان الجلسة إذا كانت جديدة
        if len(session.get("messages", [])) == 0:
            title = self._generate_title(message, request_type)
            await self.db.chat_sessions.update_one(
                {"id": session_id},
                {"$set": {"title": title}}
            )
        
        return {
            "session_id": session_id,
            "user_message": user_msg,
            "assistant_message": assistant_msg,
            "credits_used": credits_used
        }
    
    async def _generate_image(self, user_id: str, session_id: str, prompt: str) -> Tuple[str, List[Dict], int]:
        """توليد صورة باستخدام DALL-E"""
        try:
            # تحسين البرومبت
            enhanced_prompt = f"High quality, professional: {prompt}"
            
            image_response = self.openai_client.images.generate(
                model="dall-e-3",
                prompt=enhanced_prompt,
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
                "prompt": prompt,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await self.db.generated_assets.insert_one(asset)
            
            response = "تم إنشاء الصورة بنجاح! 🎨"
            attachments = [{
                "type": "image",
                "url": image_url,
                "prompt": prompt
            }]
            
            return response, attachments, 5  # 5 credits per image
            
        except Exception as e:
            logger.error(f"Image generation error: {e}")
            return f"عذراً، حدث خطأ في توليد الصورة: {str(e)[:100]}", [], 0
    
    async def _generate_with_gpt(
        self, 
        session: Dict, 
        message: str, 
        request_type: str,
        settings: Dict
    ) -> Tuple[str, int]:
        """توليد رد باستخدام GPT"""
        
        # اختيار System Prompt المناسب
        system_prompt = get_system_prompt(request_type)
        
        # بناء سياق المحادثة
        messages = [{"role": "system", "content": system_prompt}]
        
        # إضافة آخر 10 رسائل من المحادثة للسياق
        for msg in session.get("messages", [])[-10:]:
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })
        
        # إضافة رسالة المستخدم الحالية
        messages.append({"role": "user", "content": message})
        
        # اختيار الموديل
        model = "gpt-4o"
        if settings.get("ultra"):
            model = "gpt-4o"  # Use best model for ultra mode
        
        try:
            completion = self.openai_client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.7,
                max_tokens=4000
            )
            response = completion.choices[0].message.content
            
            # Calculate credits
            credits = 1  # Base credit for chat
            if request_type in ["website", "game"]:
                credits = 10  # More credits for code generation
            
            return response, credits
            
        except Exception as e:
            logger.error(f"GPT generation error: {e}")
            return f"عذراً، حدث خطأ في معالجة الطلب: {str(e)[:100]}", 0
    
    def _generate_title(self, message: str, request_type: str) -> str:
        """توليد عنوان ذكي للجلسة"""
        type_prefixes = {
            "image": "🎨 صورة:",
            "video": "🎬 فيديو:",
            "website": "🌐 موقع:",
            "game": "🎮 لعبة:",
            "general": "💬"
        }
        prefix = type_prefixes.get(request_type, "💬")
        title = message[:40].strip()
        if len(message) > 40:
            title += "..."
        return f"{prefix} {title}"
    
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
    
    async def update_session_code(self, session_id: str, user_id: str, code: str) -> bool:
        """تحديث الكود المحفوظ في الجلسة"""
        result = await self.db.chat_sessions.update_one(
            {"id": session_id, "user_id": user_id},
            {"$set": {"generated_code": code, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        return result.modified_count > 0
    
    async def get_session_code(self, session_id: str, user_id: str) -> Optional[str]:
        """استرجاع الكود المحفوظ في الجلسة"""
        session = await self.get_session(session_id, user_id)
        if session:
            return session.get("generated_code")
        return None
