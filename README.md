# Zitex - منصة الإبداع بالذكاء الاصطناعي

## 🚀 النشر على Railway

### الخطوة 1: إنشاء حساب Railway
1. اذهب إلى https://railway.app
2. سجّل بحساب GitHub

### الخطوة 2: إنشاء مشروع جديد
1. اضغط "New Project"
2. اختر "Deploy from GitHub repo"
3. اربط حسابك وارفع الكود

### الخطوة 3: إضافة MongoDB
1. في المشروع، اضغط "New"
2. اختر "Database" → "MongoDB"
3. سيتم إنشاء قاعدة بيانات تلقائياً

### الخطوة 4: إعداد المتغيرات البيئية

#### للـ Backend:
```
MONGO_URL=mongodb://... (من Railway تلقائياً)
DB_NAME=zitex_db
JWT_SECRET=your-super-secret-jwt-key-change-this
OPENAI_API_KEY=sk-proj-...
PAYPAL_CLIENT_ID=ATLgrd23Yei2wrCUaJTsS2jY8CirmvDOtb3U9uRN7K7p9um7sBrpQ-uUP_b2uU6K05OMhzFa-U9fhupN
PAYPAL_SECRET=EPyLNC3qL7_L0QnBS0BkfA7h7DVDC3eaKoXVRLbf29LYx5zz801g8HSKwOVdUXGR9poGUm1NJg0bGug3
ELEVENLABS_API_KEY=sk_80d2365ea0f2e28a7cfbac8326400d82eaa9d9133c41ce91
CORS_ORIGINS=https://your-frontend-url.railway.app
```

#### للـ Frontend:
```
REACT_APP_BACKEND_URL=https://your-backend-url.railway.app
REACT_APP_PAYPAL_CLIENT_ID=ATLgrd23Yei2wrCUaJTsS2jY8CirmvDOtb3U9uRN7K7p9um7sBrpQ-uUP_b2uU6K05OMhzFa-U9fhupN
```

### الخطوة 5: النشر
Railway سينشر تلقائياً عند رفع الكود!

---

## 📁 هيكل المشروع

```
zitex/
├── backend/           # FastAPI Backend
│   ├── server.py
│   ├── requirements.txt
│   ├── Procfile
│   └── services/
├── frontend/          # React Frontend
│   ├── src/
│   ├── package.json
│   └── Procfile
└── README.md
```

---

## 💰 التكاليف الشهرية المتوقعة

| الخدمة | التكلفة |
|--------|---------|
| Railway (Backend + Frontend) | ~$5-10 |
| MongoDB (Railway) | مجاني حتى 500MB |
| OpenAI API | حسب الاستخدام (~$10-50) |
| PayPal | عمولة 2.9% + $0.30 لكل معاملة |

---

## 🔧 للتشغيل المحلي

### Backend:
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8001
```

### Frontend:
```bash
cd frontend
npm install
npm start
```

---

## 📞 الدعم
للمساعدة، تواصل عبر WhatsApp: +966507374438
