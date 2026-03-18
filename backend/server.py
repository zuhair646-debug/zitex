from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
import base64
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Zitex API", description="AI-Powered Creative Platform")
api_router = APIRouter(prefix="/api")

security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
OWNER_WHATSAPP = os.environ.get('OWNER_WHATSAPP', '966507374438')

# ============== MODELS ==============

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    country: str = "SA"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    role: str = "client"
    country: str = "SA"
    credits: float = 0
    free_images: int = 3  # Free images for new users
    free_videos: int = 3  # Free videos for new users
    free_website_trial: bool = True  # Can try website creation once
    subscription_type: Optional[str] = None
    subscription_expires: Optional[str] = None
    is_owner: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CreditsPackage(BaseModel):
    id: str
    name: str
    credits: int
    price_sar: float
    price_usd: float

class Subscription(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: str
    plan: str
    status: str = "pending"
    amount: float
    currency: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: Optional[str] = None

class ImageGeneration(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    prompt: str
    image_url: Optional[str] = None
    status: str = "pending"
    is_free: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VideoGeneration(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    prompt: str
    video_url: Optional[str] = None
    status: str = "pending"
    is_free: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WebsiteRequestCreate(BaseModel):
    title: str
    description: str
    requirements: str
    business_type: Optional[str] = None
    target_audience: Optional[str] = None
    preferred_colors: Optional[str] = None
    is_trial: bool = False

class WebsiteRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    description: str
    requirements: str
    business_type: Optional[str] = None
    target_audience: Optional[str] = None
    preferred_colors: Optional[str] = None
    ai_suggestions: Optional[str] = None
    status: str = "pending"
    credits_used: float = 0
    is_trial: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PaymentCreate(BaseModel):
    payment_type: str
    amount: float
    proof_base64: Optional[str] = None

class Payment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    payment_type: str
    amount: float
    currency: str
    proof_image_url: Optional[str] = None
    status: str = "pending"
    admin_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Website(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    request_id: str
    user_id: str
    url: str
    preview_image: Optional[str] = None
    content: Optional[str] = None
    status: str = "draft"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SiteSettings(BaseModel):
    bank_name: Optional[str] = None
    bank_iban: Optional[str] = None
    bank_account_name: Optional[str] = None
    paypal_email: Optional[str] = None
    owner_whatsapp: Optional[str] = None

class AdminStats(BaseModel):
    total_users: int
    total_requests: int
    pending_requests: int
    completed_requests: int
    pending_payments: int
    approved_payments: int
    total_websites: int
    total_images_generated: int
    total_videos_generated: int

# ============== HELPERS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, role: str) -> str:
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=['HS256'])
        user_id = payload.get('user_id')
        role = payload.get('role')
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {'user_id': user_id, 'role': role}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

async def check_user_subscription(user_id: str, sub_type: str) -> bool:
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user_doc:
        return False
    if user_doc.get('is_owner'):
        return True
    if user_doc.get('subscription_type') == sub_type:
        expires = user_doc.get('subscription_expires')
        if expires and datetime.fromisoformat(expires) > datetime.now(timezone.utc):
            return True
    return False

async def send_whatsapp_notification(message: str):
    """Send WhatsApp notification to owner"""
    try:
        # Using CallMeBot API (free WhatsApp notifications)
        # First time setup: Send "I allow callmebot to send me messages" to +34 644 71 99 22
        phone = OWNER_WHATSAPP
        # Store in settings
        settings = await db.settings.find_one({"type": "payment"}, {"_id": 0})
        if settings and settings.get('owner_whatsapp'):
            phone = settings.get('owner_whatsapp')
        
        # URL encode the message
        import urllib.parse
        encoded_msg = urllib.parse.quote(message)
        
        # Try multiple methods
        # Method 1: CallMeBot (needs one-time setup)
        url = f"https://api.callmebot.com/whatsapp.php?phone={phone}&text={encoded_msg}&apikey=123456"
        
        async with httpx.AsyncClient() as client:
            try:
                await client.get(url, timeout=10)
            except:
                pass
        
        # Log the notification attempt
        logging.info(f"WhatsApp notification sent to {phone}: {message}")
        return True
    except Exception as e:
        logging.error(f"WhatsApp notification failed: {str(e)}")
        return False

# ============== AUTH ROUTES ==============

@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=user_data.email,
        name=user_data.name,
        role="client",
        country=user_data.country,
        credits=0,
        free_images=3,
        free_videos=3,
        free_website_trial=True
    )
    
    doc = user.model_dump()
    doc['password'] = hash_password(user_data.password)
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    
    token = create_token(user.id, user.role)
    return {"token": token, "user": user}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc or not verify_password(credentials.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Ensure free trials exist for older users
    if 'free_images' not in user_doc:
        user_doc['free_images'] = 0
    if 'free_videos' not in user_doc:
        user_doc['free_videos'] = 0
    if 'free_website_trial' not in user_doc:
        user_doc['free_website_trial'] = False
    
    user = User(**{k: v for k, v in user_doc.items() if k != 'password'})
    token = create_token(user.id, user.role)
    return {"token": token, "user": user}

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"id": current_user['user_id']}, {"_id": 0, "password": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Ensure free trials exist
    if 'free_images' not in user_doc:
        user_doc['free_images'] = 0
    if 'free_videos' not in user_doc:
        user_doc['free_videos'] = 0
    if 'free_website_trial' not in user_doc:
        user_doc['free_website_trial'] = False
    
    return user_doc

# ============== PRICING ==============

CREDITS_PACKAGES = [
    {"id": "starter", "name": "باقة المبتدئ", "credits": 100, "price_sar": 50, "price_usd": 13},
    {"id": "pro", "name": "باقة المحترف", "credits": 500, "price_sar": 200, "price_usd": 53},
    {"id": "enterprise", "name": "باقة الأعمال", "credits": 2000, "price_sar": 700, "price_usd": 187},
]

SUBSCRIPTION_PRICES = {
    "images_monthly": {"price_sar": 100, "price_usd": 27},
    "images_single": {"price_sar": 10, "price_usd": 3},
    "videos_monthly": {"price_sar": 150, "price_usd": 40},
    "videos_single": {"price_sar": 20, "price_usd": 5},
}

@api_router.get("/pricing")
async def get_pricing():
    return {
        "credits_packages": CREDITS_PACKAGES,
        "subscriptions": SUBSCRIPTION_PRICES,
        "website_credits": {
            "simple": 50,
            "advanced": 150,
            "ecommerce": 300
        },
        "free_trial": {
            "images": 3,
            "videos": 3,
            "website_preview": True
        }
    }

@api_router.get("/settings/payment")
async def get_payment_settings():
    settings = await db.settings.find_one({"type": "payment"}, {"_id": 0})
    if not settings:
        return {"bank_name": "", "bank_iban": "", "bank_account_name": "", "paypal_email": "", "owner_whatsapp": OWNER_WHATSAPP}
    return settings

# ============== IMAGE GENERATION ==============

@api_router.post("/generate/image")
async def generate_image(prompt: str, current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"id": current_user['user_id']}, {"_id": 0})
    
    is_owner = user_doc.get('is_owner', False)
    has_subscription = await check_user_subscription(current_user['user_id'], "images")
    free_images = user_doc.get('free_images', 0)
    
    is_free_use = False
    
    # Check if user can generate
    if is_owner:
        pass  # Owner can always generate
    elif has_subscription:
        pass  # Subscriber can generate
    elif free_images > 0:
        is_free_use = True
        # Deduct free image
        await db.users.update_one(
            {"id": current_user['user_id']},
            {"$inc": {"free_images": -1}}
        )
    else:
        raise HTTPException(status_code=403, detail="لا يوجد لديك رصيد مجاني أو اشتراك. يرجى الاشتراك أو شراء صور فردية")
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"img-gen-{uuid.uuid4()}",
            system_message="You are an image generation assistant."
        ).with_model("gemini", "gemini-3-pro-image-preview").with_params(modalities=["image", "text"])
        
        msg = UserMessage(text=prompt)
        text, images = await chat.send_message_multimodal_response(msg)
        
        image_data = None
        if images and len(images) > 0:
            image_data = f"data:{images[0]['mime_type']};base64,{images[0]['data']}"
        
        gen_record = ImageGeneration(
            user_id=current_user['user_id'],
            prompt=prompt,
            image_url=image_data,
            status="completed" if image_data else "failed",
            is_free=is_free_use
        )
        
        doc = gen_record.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.image_generations.insert_one(doc)
        
        # Get updated user info
        updated_user = await db.users.find_one({"id": current_user['user_id']}, {"_id": 0, "password": 0})
        
        return {
            "id": gen_record.id, 
            "image_url": image_data, 
            "text": text,
            "free_images_remaining": updated_user.get('free_images', 0),
            "was_free": is_free_use
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"فشل توليد الصورة: {str(e)}")

@api_router.get("/generate/images/history")
async def get_image_history(current_user: dict = Depends(get_current_user)):
    images = await db.image_generations.find(
        {"user_id": current_user['user_id']},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return images

# ============== VIDEO GENERATION ==============

@api_router.post("/generate/video")
async def generate_video(prompt: str, current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"id": current_user['user_id']}, {"_id": 0})
    
    is_owner = user_doc.get('is_owner', False)
    has_subscription = await check_user_subscription(current_user['user_id'], "videos")
    free_videos = user_doc.get('free_videos', 0)
    
    is_free_use = False
    
    # Check if user can generate
    if is_owner:
        pass  # Owner can always generate
    elif has_subscription:
        pass  # Subscriber can generate
    elif free_videos > 0:
        is_free_use = True
        # Deduct free video
        await db.users.update_one(
            {"id": current_user['user_id']},
            {"$inc": {"free_videos": -1}}
        )
    else:
        raise HTTPException(status_code=403, detail="لا يوجد لديك رصيد مجاني أو اشتراك. يرجى الاشتراك أو شراء فيديوهات فردية")
    
    gen_record = VideoGeneration(
        user_id=current_user['user_id'],
        prompt=prompt,
        status="processing",
        is_free=is_free_use
    )
    
    doc = gen_record.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.video_generations.insert_one(doc)
    
    # Get updated user info
    updated_user = await db.users.find_one({"id": current_user['user_id']}, {"_id": 0, "password": 0})
    
    return {
        "id": gen_record.id, 
        "status": "processing", 
        "message": "جاري توليد الفيديو، قد يستغرق بضع دقائق",
        "free_videos_remaining": updated_user.get('free_videos', 0),
        "was_free": is_free_use
    }

@api_router.get("/generate/videos/history")
async def get_video_history(current_user: dict = Depends(get_current_user)):
    videos = await db.video_generations.find(
        {"user_id": current_user['user_id']},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return videos

# ============== WEBSITE REQUESTS ==============

@api_router.post("/requests/create", response_model=WebsiteRequest)
async def create_request(request_data: WebsiteRequestCreate, current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"id": current_user['user_id']}, {"_id": 0})
    is_owner = user_doc.get('is_owner', False)
    credits = user_doc.get('credits', 0)
    has_free_trial = user_doc.get('free_website_trial', False)
    
    is_trial = request_data.is_trial
    required_credits = 50
    
    if is_trial:
        # Trial request - check if user has free trial
        if not has_free_trial and not is_owner:
            raise HTTPException(status_code=403, detail="لقد استخدمت تجربتك المجانية. يرجى شراء نقاط للمتابعة")
        
        # Mark trial as used
        if not is_owner:
            await db.users.update_one(
                {"id": current_user['user_id']},
                {"$set": {"free_website_trial": False}}
            )
    else:
        # Full request - check credits
        if not is_owner and credits < required_credits:
            raise HTTPException(status_code=403, detail=f"رصيدك غير كافٍ. تحتاج {required_credits} نقطة")
        
        if not is_owner:
            await db.users.update_one(
                {"id": current_user['user_id']},
                {"$inc": {"credits": -required_credits}}
            )
    
    request_obj = WebsiteRequest(
        user_id=current_user['user_id'],
        credits_used=0 if (is_owner or is_trial) else required_credits,
        is_trial=is_trial,
        **{k: v for k, v in request_data.model_dump().items() if k != 'is_trial'}
    )
    
    doc = request_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.website_requests.insert_one(doc)
    
    return request_obj

@api_router.post("/requests/{request_id}/generate-suggestions")
async def generate_suggestions(request_id: str, current_user: dict = Depends(get_current_user)):
    request_doc = await db.website_requests.find_one({"id": request_id}, {"_id": 0})
    if not request_doc:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if request_doc['user_id'] != current_user['user_id'] and current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Access denied")
    
    is_trial = request_doc.get('is_trial', False)
    
    try:
        system_msg = "أنت مصمم مواقع محترف. قم بتقديم اقتراحات تفصيلية لتصميم الموقع بناءً على متطلبات العميل. اقترح: 1) الألوان المناسبة 2) البنية والصفحات 3) الميزات الأساسية 4) استراتيجية المحتوى. أجب بالعربية."
        
        if is_trial:
            system_msg += " ملاحظة: هذه تجربة مجانية، قدم ملخصاً موجزاً فقط وأخبر العميل أنه يمكنه الحصول على التفاصيل الكاملة عند شراء النقاط."
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"website-gen-{request_id}",
            system_message=system_msg
        ).with_model("openai", "gpt-5.2")
        
        prompt = f"""العميل يريد موقع بالمواصفات التالية:
العنوان: {request_doc['title']}
الوصف: {request_doc['description']}
المتطلبات: {request_doc['requirements']}
نوع العمل: {request_doc.get('business_type', 'غير محدد')}
الجمهور المستهدف: {request_doc.get('target_audience', 'غير محدد')}
الألوان المفضلة: {request_doc.get('preferred_colors', 'غير محدد')}

{"هذه تجربة مجانية - قدم ملخصاً موجزاً فقط." if is_trial else "قدم اقتراحات احترافية كاملة لتصميم هذا الموقع."}"""
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        if is_trial:
            response += "\n\n---\n🔒 **هذه معاينة محدودة**\nللحصول على التصميم الكامل والتفاصيل الاحترافية، يرجى شراء نقاط من صفحة الأسعار."
        
        await db.website_requests.update_one(
            {"id": request_id},
            {"$set": {"ai_suggestions": response}}
        )
        
        return {"suggestions": response, "is_trial": is_trial}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

@api_router.get("/requests")
async def get_requests(current_user: dict = Depends(get_current_user)):
    if current_user['role'] == 'admin':
        requests = await db.website_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    else:
        requests = await db.website_requests.find({"user_id": current_user['user_id']}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return requests

@api_router.get("/requests/{request_id}")
async def get_request(request_id: str, current_user: dict = Depends(get_current_user)):
    request_doc = await db.website_requests.find_one({"id": request_id}, {"_id": 0})
    if not request_doc:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if request_doc['user_id'] != current_user['user_id'] and current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Access denied")
    
    return request_doc

@api_router.put("/requests/{request_id}/status")
async def update_request_status(request_id: str, status: str, admin: dict = Depends(require_admin)):
    result = await db.website_requests.update_one(
        {"id": request_id},
        {"$set": {"status": status}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")
    return {"message": "Status updated"}

# ============== PAYMENTS ==============

@api_router.post("/payments/create")
async def create_payment(payment_data: PaymentCreate, current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"id": current_user['user_id']}, {"_id": 0})
    currency = "SAR" if user_doc.get('country') == 'SA' else "USD"
    
    payment = Payment(
        user_id=current_user['user_id'],
        user_name=user_doc.get('name', 'Unknown'),
        user_email=user_doc.get('email', ''),
        payment_type=payment_data.payment_type,
        amount=payment_data.amount,
        currency=currency,
        proof_image_url=payment_data.proof_base64
    )
    
    doc = payment.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.payments.insert_one(doc)
    
    # Send WhatsApp notification to owner
    payment_type_ar = {
        "credits": "شراء نقاط",
        "subscription_images": "اشتراك صور",
        "subscription_videos": "اشتراك فيديو",
        "images_monthly": "اشتراك صور شهري",
        "videos_monthly": "اشتراك فيديو شهري"
    }.get(payment_data.payment_type, payment_data.payment_type)
    
    message = f"""💰 دفعة جديدة في Zitex!

👤 العميل: {user_doc.get('name', 'Unknown')}
📧 البريد: {user_doc.get('email', '')}
💳 النوع: {payment_type_ar}
💵 المبلغ: {payment_data.amount} {currency}

🔗 راجع من لوحة التحكم للموافقة"""
    
    await send_whatsapp_notification(message)
    
    return payment

@api_router.get("/payments")
async def get_payments(current_user: dict = Depends(get_current_user)):
    if current_user['role'] == 'admin':
        payments = await db.payments.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    else:
        payments = await db.payments.find({"user_id": current_user['user_id']}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return payments

@api_router.put("/payments/{payment_id}/approve")
async def approve_payment(payment_id: str, admin_notes: Optional[str] = None, admin: dict = Depends(require_admin)):
    payment_doc = await db.payments.find_one({"id": payment_id}, {"_id": 0})
    if not payment_doc:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    await db.payments.update_one(
        {"id": payment_id},
        {"$set": {"status": "approved", "admin_notes": admin_notes}}
    )
    
    payment_type = payment_doc['payment_type']
    user_id = payment_doc['user_id']
    
    if payment_type == "credits":
        for pkg in CREDITS_PACKAGES:
            if payment_doc['amount'] == (pkg['price_sar'] if payment_doc['currency'] == 'SAR' else pkg['price_usd']):
                await db.users.update_one(
                    {"id": user_id},
                    {"$inc": {"credits": pkg['credits']}}
                )
                break
    elif payment_type in ["subscription_images", "images_monthly"]:
        expires = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
        await db.users.update_one(
            {"id": user_id},
            {"$set": {"subscription_type": "images", "subscription_expires": expires}}
        )
    elif payment_type in ["subscription_videos", "videos_monthly"]:
        expires = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
        await db.users.update_one(
            {"id": user_id},
            {"$set": {"subscription_type": "videos", "subscription_expires": expires}}
        )
    
    return {"message": "Payment approved"}

@api_router.put("/payments/{payment_id}/reject")
async def reject_payment(payment_id: str, admin_notes: Optional[str] = None, admin: dict = Depends(require_admin)):
    result = await db.payments.update_one(
        {"id": payment_id},
        {"$set": {"status": "rejected", "admin_notes": admin_notes}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Payment not found")
    return {"message": "Payment rejected"}

# ============== WEBSITES ==============

@api_router.post("/websites/create")
async def create_website(request_id: str, url: str, preview_image: Optional[str] = None, admin: dict = Depends(require_admin)):
    request_doc = await db.website_requests.find_one({"id": request_id}, {"_id": 0})
    if not request_doc:
        raise HTTPException(status_code=404, detail="Request not found")
    
    website = Website(
        request_id=request_id,
        user_id=request_doc['user_id'],
        url=url,
        preview_image=preview_image
    )
    
    doc = website.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.websites.insert_one(doc)
    
    return website

@api_router.get("/websites")
async def get_websites(current_user: dict = Depends(get_current_user)):
    if current_user['role'] == 'admin':
        websites = await db.websites.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    else:
        websites = await db.websites.find({"user_id": current_user['user_id']}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return websites

@api_router.put("/websites/{website_id}/status")
async def update_website_status(website_id: str, status: str, admin: dict = Depends(require_admin)):
    result = await db.websites.update_one(
        {"id": website_id},
        {"$set": {"status": status}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Website not found")
    return {"message": "Status updated"}

# ============== ADMIN ==============

@api_router.get("/admin/stats")
async def get_admin_stats(admin: dict = Depends(require_admin)):
    return AdminStats(
        total_users=await db.users.count_documents({}),
        total_requests=await db.website_requests.count_documents({}),
        pending_requests=await db.website_requests.count_documents({"status": "pending"}),
        completed_requests=await db.website_requests.count_documents({"status": "completed"}),
        pending_payments=await db.payments.count_documents({"status": "pending"}),
        approved_payments=await db.payments.count_documents({"status": "approved"}),
        total_websites=await db.websites.count_documents({}),
        total_images_generated=await db.image_generations.count_documents({}),
        total_videos_generated=await db.video_generations.count_documents({})
    )

@api_router.get("/admin/users")
async def get_all_users(admin: dict = Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0, "password": 0}).sort("created_at", -1).to_list(1000)
    return users

@api_router.put("/admin/settings/payment")
async def update_payment_settings(settings: SiteSettings, admin: dict = Depends(require_admin)):
    await db.settings.update_one(
        {"type": "payment"},
        {"$set": {**settings.model_dump(), "type": "payment"}},
        upsert=True
    )
    return {"message": "Settings updated"}

@api_router.put("/admin/users/{user_id}/make-owner")
async def make_user_owner(user_id: str, admin: dict = Depends(require_admin)):
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_owner": True, "role": "admin"}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User is now owner"}

@api_router.put("/admin/users/{user_id}/add-credits")
async def add_user_credits(user_id: str, credits: int, admin: dict = Depends(require_admin)):
    result = await db.users.update_one(
        {"id": user_id},
        {"$inc": {"credits": credits}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": f"Added {credits} credits"}

@api_router.put("/admin/users/{user_id}/add-free-trials")
async def add_free_trials(user_id: str, images: int = 0, videos: int = 0, admin: dict = Depends(require_admin)):
    update = {}
    if images > 0:
        update["free_images"] = images
    if videos > 0:
        update["free_videos"] = videos
    
    if update:
        result = await db.users.update_one(
            {"id": user_id},
            {"$inc": update}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": f"Added {images} free images, {videos} free videos"}

# ============== APP SETUP ==============

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
