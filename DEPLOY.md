# 🚀 Zitex Deployment Guide

دليل نشر منصة Zitex على البنية التحتية الخاصة بك (Railway للـ Backend + Vercel للـ Frontend).

## 1. متطلبات أساسية

| # | الخدمة | الغرض | رابط |
|---|--------|-------|------|
| 1 | MongoDB Atlas | قاعدة البيانات (Free tier 512MB كافي للبداية) | https://cloud.mongodb.com |
| 2 | Railway | استضافة Backend (FastAPI) | https://railway.app |
| 3 | Vercel | استضافة Frontend (React) | https://vercel.com |
| 4 | GitHub Repo | تخزين الكود | https://github.com/zuhair646-debug/zitex |
| 5 | Stripe | بوابة الدفع للاشتراك ($50/شهر) | https://dashboard.stripe.com |

## 2. إعداد قاعدة البيانات (MongoDB Atlas)

1. أنشئ Cluster مجاني (M0).
2. **Database Access** → Add User → username + password قويّين.
3. **Network Access** → Add IP Address → `0.0.0.0/0` (للسماح لـ Railway).
4. **Connect** → Drivers → انسخ الـ connection string:
   ```
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net
   ```
5. هذا هو `MONGO_URL` في ملف `.env` للـ Backend.

## 3. نشر Backend على Railway

1. **New Project** → Deploy from GitHub repo → اختر `zitex`.
2. اضبط **Root Directory**: `backend/`.
3. **Variables** — أضف كل المتغيرات من `backend/.env.example`:
   - `MONGO_URL`
   - `DB_NAME=zitex_production`
   - `JWT_SECRET` (نص عشوائي طويل)
   - `CORS_ORIGINS=https://your-frontend.vercel.app`
   - `EMERGENT_LLM_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
4. **Settings** → Deploy → Start Command:
   ```
   uvicorn server:app --host 0.0.0.0 --port $PORT
   ```
5. Deploy. انسخ الرابط الناتج (مثل `https://zitex-api.up.railway.app`).

## 4. نشر Frontend على Vercel

1. **Add New Project** → استورد الـ repo.
2. **Root Directory**: `frontend/`.
3. **Framework Preset**: Create React App.
4. **Environment Variables**:
   - `REACT_APP_BACKEND_URL` = رابط Railway من الخطوة السابقة
5. **Build Command**: `yarn build` | **Output Directory**: `build`.
6. Deploy. ✅

## 5. ربط Stripe Webhook

1. في Stripe Dashboard → Developers → Webhooks → Add endpoint.
2. URL: `https://YOUR-RAILWAY-URL/api/billing/webhook`.
3. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
4. انسخ الـ Signing Secret (`whsec_...`) → ضعه في Railway كـ `STRIPE_WEBHOOK_SECRET`.

## 6. أول حساب owner

بعد النشر، اذهب إلى `/register` وأنشئ حساباً. ثم نفّذ هذا في mongo shell لرفعه إلى owner:

```js
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { is_owner: true, role: "owner" } }
)
```

## 7. اختبار

| ✅ | الاختبار |
|----|----------|
| 1 | افتح frontend URL → سجّل دخول كـ owner |
| 2 | اذهب إلى `/websites` → أنشئ موقعاً جديداً |
| 3 | افتح `/source` للتأكد من أن الـ Source Browser يعمل (للـ owner فقط) |
| 4 | جرّب تدفق الدفع (Stripe Test Card: 4242 4242 4242 4242) |

## 8. الترقيات والـ Backups

- **MongoDB Backups**: في Atlas → Backup → Cloud Backup (مجاني للـ M0 يدوي، تلقائي للخطط المدفوعة).
- **Frontend updates**: ادفع للـ repo → Vercel ينشر تلقائياً.
- **Backend updates**: ادفع للـ repo → Railway ينشر تلقائياً.

## 9. مشاكل شائعة

| المشكلة | الحل |
|---------|------|
| `CORS error` في الـ frontend | أضف رابط Vercel إلى `CORS_ORIGINS` في Railway |
| `MongoDB connection failed` | تأكد من Network Access = `0.0.0.0/0` |
| `Stripe webhook 400` | تأكد من تطابق `STRIPE_WEBHOOK_SECRET` |
| `Build failed on Vercel` | تأكد من `yarn install` و Node 18+ |

## 10. الدعم

- مستودع المشروع: https://github.com/zuhair646-debug/zitex
- توثيق Railway: https://docs.railway.app
- توثيق Vercel: https://vercel.com/docs

---

🎉 **بعد إكمال هذه الخطوات، Zitex جاهز للإنتاج!**
