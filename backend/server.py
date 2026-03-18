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
    type: str  # "images" or "videos"
    plan: str  # "monthly" or "single"
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
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VideoGeneration(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    prompt: str
    video_url: Optional[str] = None
    status: str = "pending"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WebsiteRequestCreate(BaseModel):
    title: str
    description: str
    requirements: str
    business_type: Optional[str] = None
    target_audience: Optional[str] = None
    preferred_colors: Optional[str] = None

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
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PaymentCreate(BaseModel):
    payment_type: str  # "credits", "subscription_images", "subscription_videos", "single_image", "single_video"
    amount: float
    proof_base64: Optional[str] = None

class Payment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
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
        credits=0
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
    
    user = User(**{k: v for k, v in user_doc.items() if k != 'password'})
    token = create_token(user.id, user.role)
    return {"token": token, "user": user}

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"id": current_user['user_id']}, {"_id": 0, "password": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
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
        }
    }

@api_router.get("/settings/payment")
async def get_payment_settings():
    settings = await db.settings.find_one({"type": "payment"}, {"_id": 0})
    if not settings:
        return {"bank_name": "", "bank_iban": "", "bank_account_name": "", "paypal_email": ""}
    return settings

# ============== IMAGE GENERATION ==============

@api_router.post("/generate/image")
async def generate_image(prompt: str, current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"id": current_user['user_id']}, {"_id": 0})
    
    has_subscription = await check_user_subscription(current_user['user_id'], "images")
    is_owner = user_doc.get('is_owner', False)
    
    if not has_subscription and not is_owner:
        raise HTTPException(status_code=403, detail="يرجى الاشتراك في باقة الصور أولاً")
    
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
            status="completed" if image_data else "failed"
        )
        
        doc = gen_record.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.image_generations.insert_one(doc)
        
        return {"id": gen_record.id, "image_url": image_data, "text": text}
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
    
    has_subscription = await check_user_subscription(current_user['user_id'], "videos")
    is_owner = user_doc.get('is_owner', False)
    
    if not has_subscription and not is_owner:
        raise HTTPException(status_code=403, detail="يرجى الاشتراك في باقة الفيديو أولاً")
    
    gen_record = VideoGeneration(
        user_id=current_user['user_id'],
        prompt=prompt,
        status="processing"
    )
    
    doc = gen_record.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.video_generations.insert_one(doc)
    
    return {"id": gen_record.id, "status": "processing", "message": "جاري توليد الفيديو، قد يستغرق بضع دقائق"}

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
    
    required_credits = 50
    if not is_owner and credits < required_credits:
        raise HTTPException(status_code=403, detail=f"رصيدك غير كافٍ. تحتاج {required_credits} نقطة")
    
    request_obj = WebsiteRequest(
        user_id=current_user['user_id'],
        credits_used=0 if is_owner else required_credits,
        **request_data.model_dump()
    )
    
    if not is_owner:
        await db.users.update_one(
            {"id": current_user['user_id']},
            {"$inc": {"credits": -required_credits}}
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
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"website-gen-{request_id}",
            system_message="أنت مصمم مواقع محترف. قم بتقديم اقتراحات تفصيلية لتصميم الموقع بناءً على متطلبات العميل. اقترح: 1) الألوان المناسبة 2) البنية والصفحات 3) الميزات الأساسية 4) استراتيجية المحتوى. أجب بالعربية."
        ).with_model("openai", "gpt-5.2")
        
        prompt = f"""العميل يريد موقع بالمواصفات التالية:
العنوان: {request_doc['title']}
الوصف: {request_doc['description']}
المتطلبات: {request_doc['requirements']}
نوع العمل: {request_doc.get('business_type', 'غير محدد')}
الجمهور المستهدف: {request_doc.get('target_audience', 'غير محدد')}
الألوان المفضلة: {request_doc.get('preferred_colors', 'غير محدد')}

قدم اقتراحات احترافية لتصميم هذا الموقع."""
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        await db.website_requests.update_one(
            {"id": request_id},
            {"$set": {"ai_suggestions": response}}
        )
        
        return {"suggestions": response}
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
        payment_type=payment_data.payment_type,
        amount=payment_data.amount,
        currency=currency,
        proof_image_url=payment_data.proof_base64
    )
    
    doc = payment.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.payments.insert_one(doc)
    
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
