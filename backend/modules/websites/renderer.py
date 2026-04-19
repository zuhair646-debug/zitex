"""Render a website project (JSON sections) into a complete, responsive HTML page.
Pure deterministic rendering — no AI drift. Each section type has its own renderer."""
from typing import Dict, Any, List
import html as _html


def _esc(s: Any) -> str:
    return _html.escape(str(s or ""), quote=True)


def _section_hero(d: Dict[str, Any], theme: Dict[str, Any]) -> str:
    img = _esc(d.get("image", ""))
    layout = d.get("layout", "split")
    title = _esc(d.get("title", ""))
    sub = _esc(d.get("subtitle", ""))
    cta = _esc(d.get("cta_text", ""))
    link = _esc(d.get("cta_link", "#"))
    logo = theme.get("logo_url") or ""
    logo_html = f'<img src="{_esc(logo)}" class="brand-logo" alt="logo"/>' if logo else ""
    if layout == "split":
        return f"""<section class="hero hero-split"><div class="container"><div class="hero-copy">{logo_html}<h1>{title}</h1><p>{sub}</p>{f'<a href="{link}" class="btn btn-primary">{cta}</a>' if cta else ''}</div><div class="hero-media"><img src="{img}" alt=""/></div></div></section>"""
    if layout == "portrait":
        return f"""<section class="hero hero-portrait" style="background-image:linear-gradient(180deg,rgba(0,0,0,.4),rgba(0,0,0,.8)),url('{img}')"><div class="container" style="text-align:center">{logo_html}<h1>{title}</h1><p>{sub}</p>{f'<a href="{link}" class="btn btn-primary">{cta}</a>' if cta else ''}</div></section>"""
    return f"""<section class="hero hero-full" style="background-image:linear-gradient(rgba(0,0,0,.35),rgba(0,0,0,.7)),url('{img}')"><div class="container">{logo_html}<h1>{title}</h1><p>{sub}</p>{f'<a href="{link}" class="btn btn-primary">{cta}</a>' if cta else ''}</div></section>"""


def _section_features(d: Dict[str, Any], theme) -> str:
    items = d.get("items", [])
    cards = "".join(f"""<div class="feature-card"><div class="feature-icon">{_esc(i.get('icon',''))}</div><h3>{_esc(i.get('title',''))}</h3><p>{_esc(i.get('text',''))}</p></div>""" for i in items)
    return f"""<section class="features"><div class="container"><h2>{_esc(d.get('title',''))}</h2><div class="feature-grid">{cards}</div></div></section>"""


def _section_about(d, theme) -> str:
    stats_html = ""
    if d.get("stats"):
        stats_html = '<div class="stats-row">' + "".join(f'<div class="stat-item"><div class="stat-value">{_esc(s.get("value"))}</div><div class="stat-label">{_esc(s.get("label"))}</div></div>' for s in d["stats"]) + '</div>'
    img_html = f'<div class="about-media"><img src="{_esc(d.get("image"))}" alt=""/></div>' if d.get("image") else ''
    return f"""<section class="about"><div class="container about-layout"><div class="about-copy"><h2>{_esc(d.get('title',''))}</h2><p>{_esc(d.get('text',''))}</p>{stats_html}</div>{img_html}</div></section>"""


def _section_products(d, theme) -> str:
    items = d.get("items", [])
    cards = "".join(
        f"""<div class="product-card">
          <div class="product-image" style="background-image:url('{_esc(i.get('image',''))}')">{f'<span class="badge">{_esc(i["badge"])}</span>' if i.get("badge") else ''}</div>
          <div class="product-body"><h3>{_esc(i.get('name',''))}</h3>
          <div class="price-row">{f'<span class="old-price">{_esc(i["old_price"])} ر.س</span>' if i.get("old_price") else ''}<span class="price">{_esc(i.get('price',''))}</span></div>
          <button class="btn btn-sm">أضف للسلة</button></div></div>"""
        for i in items
    )
    return f"""<section class="products" id="products"><div class="container"><h2>{_esc(d.get('title',''))}</h2><div class="product-grid">{cards}</div></div></section>"""


def _section_menu(d, theme) -> str:
    cats = d.get("categories", [])
    cats_html = ""
    for c in cats:
        items_html = "".join(
            f"""<div class="menu-item">{f'<img src="{_esc(i["image"])}" alt=""/>' if i.get("image") else ''}<div class="menu-body"><div class="menu-row"><h4>{_esc(i.get('name',''))}</h4><span class="menu-price">{_esc(i.get('price',''))} ر.س</span></div>{f'<p>{_esc(i["desc"])}</p>' if i.get("desc") else ''}</div></div>"""
            for i in c.get("items", [])
        )
        cats_html += f"""<div class="menu-cat"><h3>{_esc(c.get('name',''))}</h3><div class="menu-grid">{items_html}</div></div>"""
    return f"""<section class="menu"><div class="container"><h2>{_esc(d.get('title',''))}</h2>{cats_html}</div></section>"""


def _section_gallery(d, theme) -> str:
    imgs = d.get("images", [])
    cards = "".join(f"""<div class="gallery-item" style="background-image:url('{_esc(u)}')"></div>""" for u in imgs)
    return f"""<section class="gallery"><div class="container"><h2>{_esc(d.get('title',''))}</h2><div class="gallery-grid">{cards}</div></div></section>"""


def _section_testimonials(d, theme) -> str:
    items = d.get("items", [])
    cards = "".join(f"""<div class="testimonial-card"><div class="stars">{'★' * int(i.get('rating', 5))}</div><p>{_esc(i.get('text',''))}</p><div class="author">— {_esc(i.get('name',''))}</div></div>""" for i in items)
    return f"""<section class="testimonials"><div class="container"><h2>{_esc(d.get('title',''))}</h2><div class="testimonials-grid">{cards}</div></div></section>"""


def _section_team(d, theme) -> str:
    items = d.get("members", [])
    cards = "".join(f"""<div class="team-card"><div class="team-photo" style="background-image:url('{_esc(i.get("image",""))}')"></div><h3>{_esc(i.get('name',''))}</h3><p>{_esc(i.get('role',''))}</p></div>""" for i in items)
    return f"""<section class="team"><div class="container"><h2>{_esc(d.get('title',''))}</h2><div class="team-grid">{cards}</div></div></section>"""


def _section_pricing(d, theme) -> str:
    items = d.get("plans", [])
    cards = "".join(
        f"""<div class="pricing-card {'featured' if p.get('featured') else ''}">
          <h3>{_esc(p.get('name',''))}</h3>
          <div class="price"><span class="currency">ر.س</span> <span class="amount">{_esc(p.get('price',''))}</span> <span class="period">/ {_esc(p.get('period',''))}</span></div>
          <ul>{"".join(f'<li>{_esc(x)}</li>' for x in p.get('features',[]))}</ul>
          <button class="btn btn-primary">{_esc(p.get('cta','اشترك'))}</button>
        </div>"""
        for p in items
    )
    return f"""<section class="pricing" id="pricing"><div class="container"><h2>{_esc(d.get('title',''))}</h2><div class="pricing-grid">{cards}</div></div></section>"""


def _section_faq(d, theme) -> str:
    items = d.get("items", [])
    cards = "".join(f"""<details class="faq-item"><summary>{_esc(i.get('q',''))}</summary><p>{_esc(i.get('a',''))}</p></details>""" for i in items)
    return f"""<section class="faq"><div class="container"><h2>{_esc(d.get('title',''))}</h2>{cards}</div></section>"""


def _section_contact(d, theme) -> str:
    return f"""<section class="contact" id="contact"><div class="container"><h2>{_esc(d.get('title','تواصل معنا'))}</h2><div class="contact-grid">
      <div class="contact-card"><div class="icon">📧</div><div>{_esc(d.get('email',''))}</div></div>
      <div class="contact-card"><div class="icon">📞</div><div>{_esc(d.get('phone',''))}</div></div>
      <div class="contact-card"><div class="icon">📍</div><div>{_esc(d.get('address',''))}</div></div>
      <div class="contact-card"><div class="icon">🕒</div><div>{_esc(d.get('hours',''))}</div></div>
    </div></div></section>"""


def _section_cta(d, theme) -> str:
    return f"""<section class="cta-band"><div class="container"><h2>{_esc(d.get('title',''))}</h2><p>{_esc(d.get('subtitle',''))}</p><button class="btn btn-primary btn-lg">{_esc(d.get('cta_text','ابدأ'))}</button></div></section>"""


def _section_footer(d, theme) -> str:
    logo = theme.get("logo_url") or ""
    brand_html = f'<img src="{_esc(logo)}" class="footer-logo" alt="logo"/>' if logo else f'<div class="footer-brand">{_esc(d.get("brand",""))}</div>'
    return f"""<footer class="site-footer"><div class="container">{brand_html}<div class="footer-meta"><span>© 2026 — جميع الحقوق محفوظة</span><span>مدعوم من Zitex</span></div></div></footer>"""


# ---- Dashboard (admin / customer panel) ----
_DASH_ICONS = {
    "orders": "📦", "customers": "👥", "products": "🏷️", "analytics": "📊",
    "messages": "💬", "reports": "📈", "users": "🔐", "settings": "⚙️",
    "phone": "📞", "email": "📧", "notifications": "🔔", "calendar": "📅",
    "inventory": "📋", "payments": "💳", "reviews": "⭐",
}
_DASH_LABELS = {
    "orders": "الطلبات", "customers": "العملاء", "products": "المنتجات", "analytics": "الإحصائيات",
    "messages": "الرسائل", "reports": "التقارير", "users": "المستخدمون", "settings": "الإعدادات",
    "phone": "رقم الجوال", "email": "البريد الإلكتروني", "notifications": "الإشعارات", "calendar": "التقويم",
    "inventory": "المخزون", "payments": "المدفوعات", "reviews": "التقييمات",
}


def _dash_panel(item_id: str) -> str:
    """Rich panel HTML for each dashboard item — looks like a real admin interface."""
    panels = {
        "products": """<div class="dp-head"><h3>🏷️ إدارة المنتجات</h3><button class="dp-btn">+ إضافة منتج</button></div>
<div class="dp-form">
  <div class="dp-row"><label>اسم المنتج</label><input placeholder="مثال: بيتزا كلاسيك"/></div>
  <div class="dp-row-2">
    <div><label>السعر</label><input placeholder="45"/></div>
    <div><label>الفئة</label><select><option>وجبات</option><option>مشروبات</option></select></div>
  </div>
  <div class="dp-row"><label>الصورة</label><div class="dp-upload">📷 اسحب صورة هنا أو اضغط للرفع</div></div>
  <button class="dp-btn-primary">💾 حفظ المنتج</button>
</div>
<table class="dp-table"><thead><tr><th>المنتج</th><th>السعر</th><th>المخزون</th><th>الإجراء</th></tr></thead>
<tbody>
<tr><td>🍕 بيتزا كلاسيك</td><td>45 ر.س</td><td><span class="dp-badge-ok">متوفر</span></td><td>✏️ 🗑️</td></tr>
<tr><td>🍔 برجر دبل</td><td>38 ر.س</td><td><span class="dp-badge-ok">متوفر</span></td><td>✏️ 🗑️</td></tr>
<tr><td>🌮 تاكو خاص</td><td>28 ر.س</td><td><span class="dp-badge-warn">قليل</span></td><td>✏️ 🗑️</td></tr>
</tbody></table>""",

        "orders": """<div class="dp-head"><h3>📦 الطلبات الحديثة</h3><div class="dp-filters"><button class="dp-chip dp-chip-on">الكل</button><button class="dp-chip">جديد</button><button class="dp-chip">قيد التحضير</button><button class="dp-chip">مكتمل</button></div></div>
<table class="dp-table"><thead><tr><th>رقم الطلب</th><th>العميل</th><th>المبلغ</th><th>الحالة</th><th>الإجراء</th></tr></thead>
<tbody>
<tr><td>#1247</td><td>أحمد محمد</td><td>128 ر.س</td><td><span class="dp-badge-info">جديد</span></td><td>👁️ ✓</td></tr>
<tr><td>#1246</td><td>سارة عبدالله</td><td>85 ر.س</td><td><span class="dp-badge-warn">قيد التحضير</span></td><td>👁️ ✓</td></tr>
<tr><td>#1245</td><td>خالد الفهد</td><td>210 ر.س</td><td><span class="dp-badge-ok">مكتمل</span></td><td>👁️</td></tr>
<tr><td>#1244</td><td>نورة السالم</td><td>65 ر.س</td><td><span class="dp-badge-ok">مكتمل</span></td><td>👁️</td></tr>
</tbody></table>""",

        "customers": """<div class="dp-head"><h3>👥 العملاء</h3><div class="dp-search"><input placeholder="🔍 ابحث عن عميل..."/></div></div>
<div class="dp-stats-inline">
  <div class="dp-mini"><div class="dp-mini-val">248</div><div class="dp-mini-lbl">إجمالي</div></div>
  <div class="dp-mini"><div class="dp-mini-val">+12</div><div class="dp-mini-lbl">جدد اليوم</div></div>
  <div class="dp-mini"><div class="dp-mini-val">89%</div><div class="dp-mini-lbl">نشطون</div></div>
</div>
<table class="dp-table"><thead><tr><th>الاسم</th><th>الجوال</th><th>الطلبات</th><th>الإنفاق</th></tr></thead>
<tbody>
<tr><td>👤 أحمد محمد</td><td>0501234567</td><td>12</td><td>1,450 ر.س</td></tr>
<tr><td>👤 سارة عبدالله</td><td>0551234567</td><td>8</td><td>890 ر.س</td></tr>
<tr><td>👤 خالد الفهد</td><td>0541234567</td><td>23</td><td>3,200 ر.س</td></tr>
</tbody></table>""",

        "analytics": """<div class="dp-head"><h3>📊 الإحصائيات</h3><select class="dp-select"><option>آخر 7 أيام</option><option>آخر 30 يوم</option><option>آخر سنة</option></select></div>
<div class="dp-stats-grid">
  <div class="dp-stat"><div class="dp-stat-ico">💰</div><div class="dp-stat-val">24,850</div><div class="dp-stat-lbl">الإيرادات (ر.س)</div><div class="dp-stat-trend up">▲ 18%</div></div>
  <div class="dp-stat"><div class="dp-stat-ico">📦</div><div class="dp-stat-val">1,247</div><div class="dp-stat-lbl">طلبات</div><div class="dp-stat-trend up">▲ 12%</div></div>
  <div class="dp-stat"><div class="dp-stat-ico">👥</div><div class="dp-stat-val">+248</div><div class="dp-stat-lbl">عملاء جدد</div><div class="dp-stat-trend up">▲ 8%</div></div>
  <div class="dp-stat"><div class="dp-stat-ico">⭐</div><div class="dp-stat-val">4.8</div><div class="dp-stat-lbl">تقييم</div><div class="dp-stat-trend">●</div></div>
</div>
<div class="dp-chart">
  <div class="dp-chart-title">المبيعات الأسبوعية</div>
  <div class="dp-bars">""" + "".join(f'<div class="dp-bar" style="height:{h}%"></div>' for h in [45, 60, 35, 80, 55, 90, 75]) + """</div>
  <div class="dp-bars-lbl"><span>س</span><span>ح</span><span>ن</span><span>ث</span><span>ر</span><span>خ</span><span>ج</span></div>
</div>""",

        "reviews": """<div class="dp-head"><h3>⭐ التقييمات والآراء</h3><div class="dp-stats-inline">
  <div class="dp-mini"><div class="dp-mini-val">4.8</div><div class="dp-mini-lbl">متوسط</div></div>
  <div class="dp-mini"><div class="dp-mini-val">127</div><div class="dp-mini-lbl">مراجعة</div></div>
</div></div>
<div class="dp-review-list">
  <div class="dp-review"><div class="dp-rev-head"><b>أحمد محمد</b><span>★★★★★</span></div><p>"خدمة ممتازة وطعام لذيذ — سأعود قريباً"</p><div class="dp-rev-actions"><button class="dp-chip">رد</button><button class="dp-chip">عرض في الموقع</button></div></div>
  <div class="dp-review"><div class="dp-rev-head"><b>سارة عبدالله</b><span>★★★★☆</span></div><p>"جيد لكن التوصيل تأخر قليلاً"</p><div class="dp-rev-actions"><button class="dp-chip">رد</button><button class="dp-chip">عرض</button></div></div>
  <div class="dp-review"><div class="dp-rev-head"><b>خالد الفهد</b><span>★★★★★</span></div><p>"الأسعار مناسبة والطعام ممتاز"</p><div class="dp-rev-actions"><button class="dp-chip">رد</button></div></div>
</div>""",

        "messages": """<div class="dp-head"><h3>💬 الرسائل الواردة</h3><span class="dp-badge-info">3 جديدة</span></div>
<div class="dp-msg-list">
  <div class="dp-msg dp-msg-new"><div class="dp-msg-head"><b>أحمد محمد</b><span>منذ 5 د</span></div><p>هل تتوفر الدفعات الشهرية؟</p></div>
  <div class="dp-msg dp-msg-new"><div class="dp-msg-head"><b>سارة عبدالله</b><span>منذ 20 د</span></div><p>أبغى أعدّل طلبي رقم #1246</p></div>
  <div class="dp-msg"><div class="dp-msg-head"><b>خالد الفهد</b><span>أمس</span></div><p>شكراً على الخدمة الممتازة!</p></div>
</div>
<div class="dp-reply-box"><input placeholder="✍️ اكتب ردّك..."/><button class="dp-btn-primary">إرسال</button></div>""",

        "reports": """<div class="dp-head"><h3>📈 التقارير المالية</h3><button class="dp-btn">📥 تصدير PDF</button></div>
<table class="dp-table"><thead><tr><th>التقرير</th><th>التاريخ</th><th>القيمة</th><th>العملية</th></tr></thead>
<tbody>
<tr><td>📊 تقرير المبيعات الشهري</td><td>أكتوبر 2025</td><td>124,500 ر.س</td><td>📥 ⬇️</td></tr>
<tr><td>📊 تقرير المنتجات الأكثر مبيعاً</td><td>أكتوبر 2025</td><td>—</td><td>📥 ⬇️</td></tr>
<tr><td>📊 تقرير العملاء الجدد</td><td>أكتوبر 2025</td><td>+248</td><td>📥 ⬇️</td></tr>
</tbody></table>""",

        "users": """<div class="dp-head"><h3>🔐 المستخدمون والأدوار</h3><button class="dp-btn">+ إضافة مستخدم</button></div>
<table class="dp-table"><thead><tr><th>المستخدم</th><th>البريد</th><th>الدور</th><th>الإجراء</th></tr></thead>
<tbody>
<tr><td>محمد المالك</td><td>owner@site.com</td><td><span class="dp-badge-info">مدير</span></td><td>✏️</td></tr>
<tr><td>سارة الموظف</td><td>sara@site.com</td><td><span class="dp-badge-ok">موظف</span></td><td>✏️ 🗑️</td></tr>
<tr><td>أحمد الكاشير</td><td>cashier@site.com</td><td><span class="dp-badge-ok">كاشير</span></td><td>✏️ 🗑️</td></tr>
</tbody></table>""",

        "settings": """<div class="dp-head"><h3>⚙️ إعدادات الموقع</h3></div>
<div class="dp-form">
  <div class="dp-row"><label>اسم الموقع</label><input placeholder="موقعي"/></div>
  <div class="dp-row"><label>الوصف التعريفي</label><input placeholder="متجر إلكتروني احترافي"/></div>
  <div class="dp-row-2"><div><label>اللغة</label><select><option>العربية</option><option>English</option></select></div><div><label>العملة</label><select><option>ر.س</option><option>د.إ</option><option>USD</option></select></div></div>
  <div class="dp-row"><label>المنطقة الزمنية</label><select><option>Asia/Riyadh</option></select></div>
  <button class="dp-btn-primary">💾 حفظ الإعدادات</button>
</div>""",

        "calendar": """<div class="dp-head"><h3>📅 التقويم والحجوزات</h3><button class="dp-btn">+ إضافة موعد</button></div>
<div class="dp-cal">
  <div class="dp-cal-row"><span class="dp-cal-date">اليوم · 14:00</span><span class="dp-cal-title">حجز طاولة — سارة</span><span class="dp-badge-info">قادم</span></div>
  <div class="dp-cal-row"><span class="dp-cal-date">اليوم · 18:30</span><span class="dp-cal-title">حجز جلسة — أحمد</span><span class="dp-badge-info">قادم</span></div>
  <div class="dp-cal-row"><span class="dp-cal-date">الغد · 10:00</span><span class="dp-cal-title">اجتماع فريق</span><span class="dp-badge-warn">معلّق</span></div>
  <div class="dp-cal-row"><span class="dp-cal-date">الغد · 19:00</span><span class="dp-cal-title">حجز خالد</span><span class="dp-badge-ok">مؤكد</span></div>
</div>""",

        "inventory": """<div class="dp-head"><h3>📋 إدارة المخزون</h3><button class="dp-btn">🔄 تحديث</button></div>
<div class="dp-stats-inline">
  <div class="dp-mini"><div class="dp-mini-val">1,247</div><div class="dp-mini-lbl">كل المنتجات</div></div>
  <div class="dp-mini"><div class="dp-mini-val" style="color:#ef4444">23</div><div class="dp-mini-lbl">منخفض</div></div>
  <div class="dp-mini"><div class="dp-mini-val" style="color:#f59e0b">5</div><div class="dp-mini-lbl">نفد</div></div>
</div>
<table class="dp-table"><thead><tr><th>المنتج</th><th>المتوفر</th><th>الحد الأدنى</th><th>الحالة</th></tr></thead>
<tbody>
<tr><td>🍕 بيتزا</td><td>85</td><td>20</td><td><span class="dp-badge-ok">جيد</span></td></tr>
<tr><td>🍔 برجر</td><td>18</td><td>20</td><td><span class="dp-badge-warn">منخفض</span></td></tr>
<tr><td>🥤 كولا</td><td>0</td><td>50</td><td><span class="dp-badge-err">نفد</span></td></tr>
</tbody></table>""",

        "payments": """<div class="dp-head"><h3>💳 المدفوعات والفواتير</h3></div>
<div class="dp-stats-grid">
  <div class="dp-stat"><div class="dp-stat-ico">💰</div><div class="dp-stat-val">128,450</div><div class="dp-stat-lbl">إجمالي (ر.س)</div></div>
  <div class="dp-stat"><div class="dp-stat-ico">⏳</div><div class="dp-stat-val">4,200</div><div class="dp-stat-lbl">معلّق</div></div>
  <div class="dp-stat"><div class="dp-stat-ico">🔄</div><div class="dp-stat-val">890</div><div class="dp-stat-lbl">مسترجع</div></div>
</div>
<table class="dp-table"><thead><tr><th>رقم</th><th>العميل</th><th>الطريقة</th><th>المبلغ</th><th>الحالة</th></tr></thead>
<tbody>
<tr><td>TXN-8821</td><td>أحمد</td><td>💳 Visa</td><td>128 ر.س</td><td><span class="dp-badge-ok">مكتمل</span></td></tr>
<tr><td>TXN-8820</td><td>سارة</td><td>🏦 مدى</td><td>85 ر.س</td><td><span class="dp-badge-ok">مكتمل</span></td></tr>
<tr><td>TXN-8819</td><td>خالد</td><td>💵 كاش</td><td>210 ر.س</td><td><span class="dp-badge-warn">معلّق</span></td></tr>
</tbody></table>""",

        "phone": """<div class="dp-head"><h3>📞 إعدادات رقم الجوال</h3></div>
<div class="dp-form">
  <div class="dp-row"><label>رقم الجوال الرئيسي</label><input placeholder="+966 5x xxx xxxx" type="tel"/></div>
  <div class="dp-row"><label>واتساب</label><input placeholder="+966 5x xxx xxxx" type="tel"/></div>
  <div class="dp-row-2">
    <div><label>الرسائل القصيرة</label><select><option>مفعّل</option><option>معطّل</option></select></div>
    <div><label>استقبال مكالمات</label><select><option>دائماً</option><option>ساعات العمل</option></select></div>
  </div>
  <button class="dp-btn-primary">💾 حفظ</button>
</div>""",

        "email": """<div class="dp-head"><h3>📧 إعدادات البريد</h3></div>
<div class="dp-form">
  <div class="dp-row"><label>البريد الرسمي</label><input placeholder="info@yoursite.com" type="email"/></div>
  <div class="dp-row"><label>بريد الدعم</label><input placeholder="support@yoursite.com" type="email"/></div>
  <div class="dp-row"><label>إشعارات الطلبات</label><select><option>مفعّل</option><option>معطّل</option></select></div>
  <button class="dp-btn-primary">💾 حفظ</button>
</div>""",

        "notifications": """<div class="dp-head"><h3>🔔 الإشعارات</h3></div>
<div class="dp-notif-list">
  <div class="dp-notif">🆕 طلب جديد #1247 من أحمد — منذ دقيقتين</div>
  <div class="dp-notif">⭐ تقييم 5 نجوم جديد من سارة — منذ 5 دقائق</div>
  <div class="dp-notif">💰 دفعة مستلمة: 128 ر.س — منذ 10 دقائق</div>
  <div class="dp-notif">⚠️ المخزون منخفض: برجر دبل — منذ ساعة</div>
</div>""",
    }
    return f'<div class="dp-panel" id="panel-{item_id}">{panels.get(item_id, f"<h3>{_DASH_ICONS.get(item_id,chr(128123))} {_DASH_LABELS.get(item_id,item_id)}</h3><p class=dp-empty>لوحة فرعية قيد التطوير</p>")}</div>'


def _section_dashboard(d, theme) -> str:
    layout = d.get("layout", "cards")
    items = d.get("items", []) or []
    title = _esc(d.get("title", "لوحة التحكم"))

    empty_msg = '<div class="dp-hint">⬅ ارجع للشات وفعّل العناصر — كل عنصر سيظهر هنا لايف!</div>'

    panels = "\n".join(_dash_panel(i) for i in items) if items else empty_msg

    if layout == "sidebar":
        nav = "".join(
            f'<a href="#panel-{i}" class="dp-nav-item"><span class="dp-nav-ico">{_DASH_ICONS.get(i,"🔷")}</span><span>{_esc(_DASH_LABELS.get(i,i))}</span></a>'
            for i in items
        ) or '<div class="dp-empty">لا عناصر بعد</div>'
        return f"""<section class="dashboard dp-mode"><div class="dp-topbar"><div class="dp-topbar-brand">⚡ {title}</div><div class="dp-topbar-user">👤 المدير</div></div>
<div class="dp-layout">
  <aside class="dp-side"><div class="dp-side-title">القائمة</div>{nav}</aside>
  <main class="dp-main">{panels}</main>
</div></section>"""

    if layout == "tabs":
        tabs = "".join(
            f'<a href="#panel-{i}" class="dp-tab {"dp-tab-on" if idx==0 else ""}">{_DASH_ICONS.get(i,"🔷")} {_esc(_DASH_LABELS.get(i,i))}</a>'
            for idx, i in enumerate(items)
        ) or '<div class="dp-empty">لا تبويبات بعد</div>'
        return f"""<section class="dashboard dp-mode"><div class="dp-topbar"><div class="dp-topbar-brand">⚡ {title}</div><div class="dp-topbar-user">👤 المدير</div></div>
<div class="dp-tabsbar">{tabs}</div>
<div class="dp-main">{panels}</div></section>"""

    # cards (grid of panels)
    return f"""<section class="dashboard dp-mode"><div class="dp-topbar"><div class="dp-topbar-brand">⚡ {title}</div><div class="dp-topbar-user">👤 المدير</div></div>
<div class="dp-cards-grid">{panels}</div></section>"""


RENDERERS = {
    "hero": _section_hero, "features": _section_features, "about": _section_about,
    "products": _section_products, "menu": _section_menu, "gallery": _section_gallery,
    "testimonials": _section_testimonials, "team": _section_team, "pricing": _section_pricing,
    "faq": _section_faq, "contact": _section_contact, "cta": _section_cta, "footer": _section_footer,
    "dashboard": _section_dashboard,
}


def _base_css(theme: Dict[str, Any]) -> str:
    p = theme.get("primary", "#FFD700")
    s = theme.get("secondary", "#1a1f3a")
    a = theme.get("accent", "#FF6B35")
    bg = theme.get("background", "#0b0f1f")
    tx = theme.get("text", "#ffffff")
    font = theme.get("font", "Tajawal")
    radius_map = {"none": "0", "small": "6px", "medium": "12px", "large": "20px", "full": "999px"}
    r = radius_map.get(theme.get("radius", "medium"), "12px")
    return f"""
*{{margin:0;padding:0;box-sizing:border-box;font-family:{font},-apple-system,BlinkMacSystemFont,sans-serif}}
html{{scroll-behavior:smooth}}
body{{background:{bg};color:{tx};line-height:1.6;overflow-x:hidden}}
.container{{max-width:1200px;margin:0 auto;padding:0 24px}}
section{{padding:72px 0}}
h1{{font-size:clamp(32px,5vw,56px);font-weight:900;line-height:1.15;margin-bottom:18px}}
h2{{font-size:clamp(26px,3.5vw,40px);font-weight:800;margin-bottom:36px;text-align:center}}
h3{{font-size:22px;font-weight:700;margin-bottom:10px}}
p{{opacity:.88}}
img{{max-width:100%;display:block;border-radius:{r}}}
.btn{{display:inline-block;padding:12px 28px;border:0;border-radius:{r};font-weight:700;cursor:pointer;transition:all .25s;font-size:15px;font-family:inherit;text-decoration:none}}
.btn-primary{{background:{p};color:{s}}}
.btn-primary:hover{{transform:translateY(-2px);box-shadow:0 10px 30px {p}66}}
.btn-lg{{padding:16px 36px;font-size:17px}}
.btn-sm{{padding:8px 16px;font-size:13px}}

/* HERO */
.hero-split .container{{display:grid;grid-template-columns:1.1fr 1fr;gap:48px;align-items:center}}
.hero-split .hero-media img{{border-radius:{r};box-shadow:0 30px 80px rgba(0,0,0,.5)}}
.hero-full,.hero-portrait{{padding:120px 0;background-size:cover;background-position:center}}
.hero-full h1,.hero-portrait h1{{text-align:center}}
.hero p{{font-size:18px;opacity:.85;margin-bottom:24px;max-width:560px}}

/* FEATURES */
.feature-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:24px}}
.feature-card{{background:rgba(255,255,255,.04);padding:28px;border-radius:{r};border:1px solid rgba(255,255,255,.06);transition:all .3s}}
.feature-card:hover{{transform:translateY(-4px);border-color:{p}}}
.feature-icon{{font-size:36px;margin-bottom:14px}}

/* ABOUT */
.about-layout{{display:grid;grid-template-columns:1.2fr 1fr;gap:48px;align-items:center}}
.stats-row{{display:flex;gap:32px;margin-top:28px;flex-wrap:wrap}}
.stat-value{{font-size:36px;font-weight:900;color:{p}}}
.stat-label{{opacity:.7;font-size:14px}}

/* PRODUCTS */
.product-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:22px}}
.product-card{{background:rgba(255,255,255,.04);border-radius:{r};overflow:hidden;transition:transform .3s;border:1px solid rgba(255,255,255,.06)}}
.product-card:hover{{transform:translateY(-6px)}}
.product-image{{aspect-ratio:1;background-size:cover;background-position:center;position:relative}}
.badge{{position:absolute;top:12px;right:12px;background:{a};color:white;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:700}}
.product-body{{padding:16px}}
.price-row{{display:flex;align-items:center;gap:10px;margin:8px 0 14px}}
.price{{font-size:20px;font-weight:900;color:{p}}}
.old-price{{text-decoration:line-through;opacity:.5;font-size:14px}}

/* MENU */
.menu-cat{{margin-bottom:40px}}
.menu-cat h3{{color:{p};font-size:24px;margin-bottom:20px;border-bottom:2px solid {p}44;padding-bottom:8px}}
.menu-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:22px}}
.menu-item{{display:flex;gap:14px;background:rgba(255,255,255,.04);padding:14px;border-radius:{r}}}
.menu-item img{{width:96px;height:96px;object-fit:cover;flex:0 0 96px}}
.menu-row{{display:flex;justify-content:space-between;align-items:baseline;gap:8px}}
.menu-price{{color:{p};font-weight:900;font-size:18px}}

/* GALLERY */
.gallery-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}}
.gallery-item{{aspect-ratio:1;background-size:cover;background-position:center;border-radius:{r};transition:transform .3s;cursor:pointer}}
.gallery-item:hover{{transform:scale(1.04)}}

/* TESTIMONIALS */
.testimonials-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:22px}}
.testimonial-card{{background:rgba(255,255,255,.04);padding:26px;border-radius:{r};border:1px solid rgba(255,255,255,.06)}}
.stars{{color:{p};font-size:18px;margin-bottom:10px}}
.author{{opacity:.7;margin-top:14px;font-weight:700}}

/* TEAM */
.team-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:22px}}
.team-card{{text-align:center}}
.team-photo{{aspect-ratio:1;background-size:cover;background-position:center;border-radius:50%;margin-bottom:12px;border:3px solid {p}}}

/* PRICING */
.pricing-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:22px}}
.pricing-card{{background:rgba(255,255,255,.04);padding:32px 24px;border-radius:{r};text-align:center;border:1px solid rgba(255,255,255,.08);transition:all .3s}}
.pricing-card.featured{{border-color:{p};box-shadow:0 20px 60px {p}22;transform:scale(1.04)}}
.pricing-card .price{{font-size:48px;font-weight:900;color:{p};margin:16px 0}}
.pricing-card .currency{{font-size:20px;opacity:.7}}
.pricing-card .period{{font-size:14px;opacity:.6}}
.pricing-card ul{{list-style:none;margin:20px 0;text-align:right}}
.pricing-card li{{padding:8px 0;border-bottom:1px solid rgba(255,255,255,.06)}}
.pricing-card li::before{{content:'✓ ';color:{p};font-weight:900}}

/* FAQ */
.faq-item{{background:rgba(255,255,255,.04);padding:18px 22px;border-radius:{r};margin-bottom:12px;cursor:pointer}}
.faq-item summary{{font-weight:700;font-size:16px;list-style:none}}
.faq-item summary::after{{content:'+';float:left;font-size:22px;color:{p}}}
.faq-item[open] summary::after{{content:'−'}}
.faq-item p{{margin-top:10px;opacity:.85}}

/* CONTACT */
.contact-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px}}
.contact-card{{background:rgba(255,255,255,.04);padding:22px;border-radius:{r};display:flex;gap:12px;align-items:center}}
.contact-card .icon{{font-size:26px;color:{p}}}

/* CTA band */
.cta-band{{background:linear-gradient(135deg,{p},{a});color:{s};text-align:center;padding:72px 0}}
.cta-band h2{{color:{s}}}
.cta-band p{{font-size:18px;margin-bottom:24px}}
.cta-band .btn-primary{{background:{s};color:{p}}}

/* FOOTER */
.site-footer{{background:rgba(0,0,0,.4);padding:32px 0;border-top:1px solid rgba(255,255,255,.08)}}
.site-footer .container{{display:flex;justify-content:space-between;flex-wrap:wrap;gap:16px}}
.footer-brand{{font-weight:900;color:{p}}}
.footer-meta{{display:flex;gap:20px;opacity:.6;font-size:13px}}

/* DASHBOARD */
.brand-logo{{max-width:140px;max-height:90px;margin-bottom:18px;display:block;object-fit:contain}}
.footer-logo{{max-width:120px;max-height:60px;object-fit:contain}}

/* Dashboard Pro Mode */
.dp-mode{{min-height:100vh;background:#0a0e1c;color:#fff;padding:0;border:none}}
.dp-topbar{{display:flex;justify-content:space-between;align-items:center;padding:14px 24px;background:linear-gradient(90deg,{p}22,{a}11);border-bottom:1px solid rgba(255,255,255,.1)}}
.dp-topbar-brand{{font-weight:900;font-size:18px;color:{p}}}
.dp-topbar-user{{background:rgba(255,255,255,.08);padding:6px 14px;border-radius:{r};font-size:13px}}
.dp-layout{{display:grid;grid-template-columns:240px 1fr;min-height:calc(100vh - 60px)}}
.dp-side{{background:#0e1428;padding:16px 12px;border-left:1px solid rgba(255,255,255,.06)}}
.dp-side-title{{font-size:11px;opacity:.5;margin-bottom:10px;padding:0 10px;text-transform:uppercase;letter-spacing:1px}}
.dp-nav-item{{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:8px;cursor:pointer;margin-bottom:3px;transition:.2s;color:#fff;text-decoration:none}}
.dp-nav-item:hover{{background:{p}22;color:{p}}}
.dp-nav-ico{{font-size:18px;width:22px;display:inline-block;text-align:center}}
.dp-main{{padding:24px;overflow-y:auto}}
.dp-cards-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(520px,1fr));gap:18px;padding:24px}}
.dp-tabsbar{{display:flex;gap:4px;padding:8px 24px 0;overflow-x:auto;border-bottom:1px solid rgba(255,255,255,.08);background:#0e1428}}
.dp-tab{{padding:12px 18px;cursor:pointer;font-weight:700;white-space:nowrap;border-bottom:3px solid transparent;color:#fff;text-decoration:none;transition:.2s}}
.dp-tab:hover{{color:{p}}}
.dp-tab-on{{color:{p};border-bottom-color:{p};background:rgba(255,255,255,.03)}}
.dp-hint{{padding:60px 20px;text-align:center;font-size:15px;opacity:.6;background:repeating-linear-gradient(45deg,rgba(255,255,255,.02),rgba(255,255,255,.02) 10px,transparent 10px,transparent 20px);border-radius:{r};margin:24px}}
.dp-empty{{opacity:.5;text-align:center;padding:30px}}

/* Panels */
.dp-panel{{background:#11182c;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:20px;margin-bottom:18px;animation:dpFadeIn .35s ease-out}}
@keyframes dpFadeIn{{from{{opacity:0;transform:translateY(8px)}}to{{opacity:1;transform:translateY(0)}}}}
.dp-head{{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:12px;flex-wrap:wrap}}
.dp-head h3{{margin:0;font-size:17px;color:{p}}}
.dp-btn{{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);color:#fff;padding:8px 14px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700}}
.dp-btn:hover{{background:{p}33;border-color:{p}}}
.dp-btn-primary{{background:{p};color:{s};padding:10px 18px;border-radius:8px;border:none;font-weight:900;cursor:pointer;font-size:14px;margin-top:10px}}
.dp-btn-primary:hover{{opacity:.9}}

/* Forms */
.dp-form{{display:flex;flex-direction:column;gap:12px}}
.dp-row{{display:flex;flex-direction:column;gap:5px}}
.dp-row-2{{display:grid;grid-template-columns:1fr 1fr;gap:12px}}
.dp-row label, .dp-row-2 label{{font-size:12px;opacity:.7;font-weight:700}}
.dp-row input, .dp-row select, .dp-row-2 input, .dp-row-2 select, .dp-reply-box input, .dp-search input{{background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.1);color:#fff;padding:10px 12px;border-radius:8px;font-family:inherit;font-size:14px;width:100%;box-sizing:border-box}}
.dp-row input:focus, .dp-row select:focus{{outline:none;border-color:{p}}}
.dp-upload{{border:2px dashed rgba(255,255,255,.15);padding:24px;text-align:center;border-radius:8px;cursor:pointer;font-size:13px;opacity:.7}}
.dp-upload:hover{{border-color:{p};opacity:1}}

/* Tables */
.dp-table{{width:100%;border-collapse:collapse;margin-top:14px;font-size:13px}}
.dp-table th{{text-align:right;padding:10px 8px;font-size:11px;text-transform:uppercase;opacity:.6;border-bottom:1px solid rgba(255,255,255,.1);font-weight:700}}
.dp-table td{{padding:12px 8px;border-bottom:1px solid rgba(255,255,255,.05)}}
.dp-table tr:hover td{{background:rgba(255,255,255,.02)}}

/* Badges */
.dp-badge-ok{{background:#10b98122;color:#10b981;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700}}
.dp-badge-warn{{background:#f59e0b22;color:#f59e0b;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700}}
.dp-badge-err{{background:#ef444422;color:#ef4444;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700}}
.dp-badge-info{{background:{p}22;color:{p};padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700}}

/* Stats */
.dp-stats-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:16px}}
.dp-stat{{background:rgba(255,255,255,.03);padding:16px;border-radius:10px;border:1px solid rgba(255,255,255,.06);position:relative}}
.dp-stat-ico{{font-size:24px}}
.dp-stat-val{{font-size:22px;font-weight:900;color:{p};margin-top:6px}}
.dp-stat-lbl{{font-size:11px;opacity:.7;margin-top:2px}}
.dp-stat-trend{{position:absolute;top:12px;left:12px;font-size:11px;font-weight:700;opacity:.7}}
.dp-stat-trend.up{{color:#10b981;opacity:1}}
.dp-stats-inline{{display:flex;gap:10px;flex-wrap:wrap}}
.dp-mini{{background:rgba(255,255,255,.04);padding:8px 14px;border-radius:8px;text-align:center;min-width:80px}}
.dp-mini-val{{font-size:17px;font-weight:900;color:{p}}}
.dp-mini-lbl{{font-size:10px;opacity:.65}}

/* Chart */
.dp-chart{{margin-top:16px;background:rgba(255,255,255,.03);padding:16px;border-radius:10px}}
.dp-chart-title{{font-size:13px;opacity:.8;margin-bottom:12px;font-weight:700}}
.dp-bars{{display:flex;align-items:flex-end;justify-content:space-between;height:100px;gap:6px}}
.dp-bar{{flex:1;background:linear-gradient(180deg,{p},{a});border-radius:4px 4px 0 0;min-height:10px;transition:.3s}}
.dp-bar:hover{{filter:brightness(1.2)}}
.dp-bars-lbl{{display:flex;justify-content:space-between;margin-top:6px;font-size:11px;opacity:.6}}

/* Reviews & Messages & Calendar & Notifications */
.dp-review-list, .dp-msg-list, .dp-cal, .dp-notif-list{{display:flex;flex-direction:column;gap:10px}}
.dp-review, .dp-msg{{background:rgba(255,255,255,.03);padding:12px 14px;border-radius:10px;border-right:3px solid {p}}}
.dp-msg-new{{background:{p}11;border-right-color:{p}}}
.dp-rev-head, .dp-msg-head{{display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px}}
.dp-rev-head span{{color:#f59e0b}}
.dp-rev-actions{{display:flex;gap:6px;margin-top:8px}}
.dp-review p, .dp-msg p{{margin:4px 0;font-size:13px;opacity:.9}}
.dp-reply-box{{display:flex;gap:8px;margin-top:12px;align-items:center}}
.dp-reply-box input{{flex:1}}
.dp-cal-row{{display:grid;grid-template-columns:160px 1fr auto;gap:10px;align-items:center;padding:10px 12px;background:rgba(255,255,255,.03);border-radius:8px;font-size:13px}}
.dp-cal-date{{font-weight:700;color:{p};font-size:12px}}
.dp-notif{{padding:12px 14px;background:rgba(255,255,255,.03);border-radius:8px;font-size:13px;border-right:3px solid {p}}}

/* Filters / Chips */
.dp-filters{{display:flex;gap:6px;flex-wrap:wrap}}
.dp-chip{{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);color:#fff;padding:5px 11px;border-radius:99px;font-size:11px;cursor:pointer;font-weight:700}}
.dp-chip:hover{{background:{p}22}}
.dp-chip-on{{background:{p};color:{s};border-color:{p}}}
.dp-search{{flex:1;max-width:280px}}
.dp-select{{background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.1);color:#fff;padding:8px 12px;border-radius:8px;font-size:13px}}

@media (max-width:768px){{
  .dp-layout{{grid-template-columns:1fr}}
  .dp-side{{border-left:none;border-bottom:1px solid rgba(255,255,255,.06)}}
  .dp-cards-grid{{grid-template-columns:1fr;padding:12px}}
}}

@media (max-width:768px){{
  .hero-split .container,.about-layout{{grid-template-columns:1fr}}
  section{{padding:48px 0}}
}}
"""


def render_website_to_html(project: Dict[str, Any]) -> str:
    """Render a Website Project dict to full HTML."""
    lang = project.get("lang", "ar")
    direction = project.get("direction", "rtl")
    theme = project.get("theme", {})
    sections = sorted(project.get("sections", []), key=lambda s: s.get("order", 0))
    meta = project.get("meta", {})
    title = _esc(meta.get("title") or project.get("name") or "موقعي")

    body_parts: List[str] = []
    for sec in sections:
        if not sec.get("visible", True):
            continue
        stype = sec.get("type", "")
        renderer = RENDERERS.get(stype)
        if not renderer:
            continue
        try:
            body_parts.append(renderer(sec.get("data", {}) or {}, theme))
        except Exception:
            continue

    return f"""<!DOCTYPE html>
<html lang="{lang}" dir="{direction}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>{title}</title>
<link href="https://fonts.googleapis.com/css2?family={theme.get('font','Tajawal').replace(' ','+')}:wght@400;700;900&display=swap" rel="stylesheet">
<style>{_base_css(theme)}</style>
<style>{theme.get('custom_css','')}</style>
</head>
<body>
{''.join(body_parts)}
</body>
</html>"""
