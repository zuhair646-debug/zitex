# Zitex AI Platform - PRD

## Original Problem Statement
منصة ذكاء اصطناعي باسم "Zitex" تعمل كمستشار عبر محادثة، تولّد مواقع/ألعاب/تطبيقات/صور/فيديو. نشر يدوي إلى Railway عبر GitHub.

## User Language: Arabic (العربية)

## ✅ تم إنجازه

### Session Feb 2026 - Visual Designer Studio (احترافي)
**طلب المستخدم**: محرر مرئي احترافي يسمح للعميل بالبناء بنفسه (سحب، حذف، تبديل، إضافة)، مع حفظ تصاميم متعددة و AI يبني على نفس ترتيب العميل.

**المُنَفَّذ** (مكتمل وَمختبر):
1. **محرر مرئي Konva-based** في `/app/frontend/src/pages/VisualDesigner.js` (route: `/designer`)
   - Canvas 1280×720 مع zoom/pan/grid
   - Drag & drop، resize، rotate، delete، duplicate
   - Undo/Redo (50 خطوة، Ctrl+Z / Ctrl+Y)
   - Keyboard shortcuts (Delete, Ctrl+D)
   - Auto-save كل 6 ثوان
   - مكتبة التصاميم المتعددة (open/duplicate/delete)
   - Preview modal بـ iframe (live play)
   - Export HTML كملف
2. **17 نوع عنصر** في `elementLibrary.js` + `_element_svg()` backend متزامن:
   - مباني: قلعة، بيت (4 أنماط)، مزرعة، منجم
   - حقول: حقل قمح، حقل طين، بحيرة
   - طبيعة: شجرة (4 ألوان)، شجيرة، زهرة (5 ألوان)، صخرة، غيمة
   - وحدات: جندي
   - أشكال: دائرة، مربع، نجمة، نص (قابل للتحرير)
3. **Backend APIs** في `server.py`:
   - `GET/POST/PATCH/DELETE /api/designs`
   - `POST /api/designs/{id}/duplicate`
   - `POST /api/designs/{id}/build` → HTML قابل للعب
   - حماية per-user
4. **`render_design_to_html()`** في `ai_chat_service.py`:
   - يقرأ JSON التصميم ويُنتج HTML كامل بنفس إحداثيات العميل (zero AI drift)
   - HUD + أزرار تفاعل + سلوك لكل نوع (قمح يعطي طعام، طين يعطي حجر، إلخ)
5. **زر "المحرر المرئي"** بارز في AIChat page للوصول السريع

### Flow التكامل
- المستخدم يطلب لعبة في الشات → يفتح المحرر بضغطة زر
- يسحب العناصر، يرتب قريته، يسميها، يحفظها
- يضغط "عرض اللايف" → backend يُنتج HTML من JSON → iframe يعرض اللعبة قابلة للعب
- يقدر يبني 5+ قرى مختلفة ويفتحها من المكتبة

### Previous Sessions
- Bulletproof game engine fallback (v2.0)
- Image-backed preview mode
- DESIGN_IMAGE auto-save to session
- iframe URL patcher (HTML + CSS)
- `BACKEND_URL` في .env لإصلاح روابط الصور
- نظام تدريب AI + Vision Auto-Attach

## Credentials
- Email: owner@zitex.com | Password: owner123

## Key Files (للنشر على Railway)
1. `backend/services/ai_chat_service.py` - AI + `render_design_to_html` + `_element_svg`
2. `backend/server.py` - APIs + Designer endpoints
3. `backend/static/game-engine.js` - fallback engine
4. `backend/.env` - **يجب إضافة `BACKEND_URL=...` في Railway ENV**
5. `frontend/src/pages/VisualDesigner.js` - المحرر الاحترافي
6. `frontend/src/pages/designer/elementLibrary.js` - مكتبة العناصر
7. `frontend/src/pages/AIChat.js` - زر "المحرر المرئي"
8. `frontend/src/App.js` - route `/designer`
9. `frontend/package.json` - `konva`, `react-konva`, `use-image`

## Next Steps (P1/P2)
- **P1**: AI يفهم رغبات العميل من التصميم (reads JSON → يقترح تحسينات)
- **P1**: معرض تصاميم عام (shareable) لزيادة الفيروسية
- **P2**: دعم Websites + Mobile في المحرر بعناصر خاصة
- **P2**: Multi-scene (قرى متعددة مرتبطة)
- **P2**: Version history per design

## Data Model
```
designs: {
  id, user_id, name, category, genre,
  canvas: {width, height, background_color, background_image_url},
  elements: [{id, type, x, y, width, height, rotation, scale_x, scale_y, z_index, props: {variant, color, label, text}}],
  meta: {},
  created_at, updated_at
}
```

## Backend API Endpoints
- `GET /api/designs` - list
- `GET /api/designs/:id` - fetch
- `POST /api/designs` - create
- `PATCH /api/designs/:id` - update (used by auto-save)
- `DELETE /api/designs/:id` - delete
- `POST /api/designs/:id/duplicate` - clone
- `POST /api/designs/:id/build` - generate HTML
