# Zitex AI Platform - PRD

## Original Problem Statement
منصة ذكاء اصطناعي باسم "Zitex" تعمل كمستشار عبر محادثة، تولّد مواقع/ألعاب/تطبيقات/صور/فيديو. نشر يدوي إلى Railway عبر GitHub.

## User Language: Arabic (العربية)

## ✅ تم إنجازه

### Session Feb 2026 - Image-Element Extraction Workflow (الحل الحقيقي!)
**المشكلة الجذرية**: العميل يحب صور AI لكن يريد قطعاً منها (حقل القمح فقط، سلاح معين، إلخ)، ويريد تلك القطعات تظهر حرفياً في اللعبة بدون إعادة رسم.

**Workflow المُنَفَّذ**:
1. AI يولّد صورة تصميم في الشات
2. العميل يضغط **"✂️ حفظ للمحرر"** على الصورة → تُحفَظ في مكتبته
3. في المحرر يضغط **"استخراج من صورة"** → نافذة cropping:
   - يختار صورة من مكتبته
   - يسحب الماوس لرسم مستطيل حول العنصر (حقل القمح، بيت، سلاح)
   - يسمّيه + يختار فئة (مباني/حقول/أسلحة/...) → "استخراج"
4. العنصر المستخرج يظهر في sidebar المحرر (thumbnail حقيقي بقَصّ CSS)
5. العميل يخلط عناصر من **صور مختلفة** في canvas واحد
6. "عرض اللايف" → Backend يُنتج HTML **يستخدم نفس الصور الأصلية** مع `background-position/size` لعرض القطعة الصحيحة بالضبط

### المكونات التقنية
**Backend** (`server.py` + `ai_chat_service.py`):
- `user_images` collection: صور الشات المحفوظة
- `user_elements` collection: القطعات المستخرجة `{name, source_image_url, crop:{x,y,w,h}, natural_width, natural_height, category}`
- 7 endpoints: POST/GET/DELETE for user-images + POST/GET/PATCH/DELETE for user-elements
- `render_design_to_html` يدعم `type="user_element"` برندر CSS `background-position` دقيق

**Frontend**:
- `VisualDesigner.js`: محرر Konva-based كامل
- `designer/CropModal.js`: نافذة cropping احترافية بسحب الماوس + overlay مرئي
- `designer/elementLibrary.js`: مكتبة العناصر المدمجة (17 نوع SVG)
- `UserElementThumb`: thumbnail يعرض القطعة المستخرجة بـ CSS cropping
- `CanvasElement`: يدعم user_element عبر Konva `crop` property (pixel-perfect)
- زر "✂️ حفظ للمحرر" على كل صورة في الشات

### الميزات الكاملة في المحرر
- 17 عنصر جاهز (قلعة/بيوت/حقول/أشجار/جنود/إلخ)
- **عناصر مستخرجة غير محدودة** من صور AI
- Drag/resize/rotate/delete/duplicate/layers
- Undo/Redo 50 خطوة (Ctrl+Z/Y)
- Auto-save كل 6 ثوان
- مكتبة تصاميم متعددة (open/duplicate/delete)
- Preview modal + Export HTML
- Zoom/Pan/Grid

### Previous Sessions
- Bulletproof game engine fallback (v2.0)
- Image-backed preview mode
- iframe URL patcher (HTML + CSS)
- BACKEND_URL في .env

## Credentials
- Email: owner@zitex.com | Password: owner123

## Key Files (للنشر على Railway)
1. `backend/services/ai_chat_service.py` - render_design_to_html مع user_element
2. `backend/server.py` - Designer + user-images + user-elements APIs
3. `frontend/src/pages/VisualDesigner.js` - محرر
4. `frontend/src/pages/designer/elementLibrary.js` - عناصر مدمجة
5. `frontend/src/pages/designer/CropModal.js` - نافذة استخراج
6. `frontend/src/pages/AIChat.js` - زر "حفظ للمحرر"
7. `frontend/package.json` - konva, react-konva, use-image
8. **Railway ENV: `BACKEND_URL=https://your-app.railway.app`**

## API Endpoints الجديدة
- `POST /api/user-images` - حفظ صورة من الشات
- `GET /api/user-images` - قائمة
- `DELETE /api/user-images/{id}`
- `POST /api/user-elements` - إنشاء عنصر بقَصّ
- `GET /api/user-elements` - قائمة
- `PATCH /api/user-elements/{id}`
- `DELETE /api/user-elements/{id}`

## Next Steps
- **P1**: AI يقرأ التصميم ويقترح عناصر من صور أخرى
- **P1**: AI auto-detect bounding boxes (ضغطة زر "كشف العناصر")
- **P2**: دعم cropping لـ websites/mobile apps
- **P2**: Magic wand / freeform selection (حالياً مستطيل فقط)
- **P2**: Shared library بين المستخدمين (marketplace)
