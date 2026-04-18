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
    if layout == "split":
        return f"""<section class="hero hero-split"><div class="container"><div class="hero-copy"><h1>{title}</h1><p>{sub}</p>{f'<a href="{link}" class="btn btn-primary">{cta}</a>' if cta else ''}</div><div class="hero-media"><img src="{img}" alt=""/></div></div></section>"""
    if layout == "portrait":
        return f"""<section class="hero hero-portrait" style="background-image:linear-gradient(180deg,rgba(0,0,0,.4),rgba(0,0,0,.8)),url('{img}')"><div class="container" style="text-align:center"><h1>{title}</h1><p>{sub}</p>{f'<a href="{link}" class="btn btn-primary">{cta}</a>' if cta else ''}</div></section>"""
    return f"""<section class="hero hero-full" style="background-image:linear-gradient(rgba(0,0,0,.35),rgba(0,0,0,.7)),url('{img}')"><div class="container"><h1>{title}</h1><p>{sub}</p>{f'<a href="{link}" class="btn btn-primary">{cta}</a>' if cta else ''}</div></section>"""


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
    return f"""<footer class="site-footer"><div class="container"><div class="footer-brand">{_esc(d.get('brand',''))}</div><div class="footer-meta"><span>© 2026 — جميع الحقوق محفوظة</span><span>مدعوم من Zitex</span></div></div></footer>"""


RENDERERS = {
    "hero": _section_hero, "features": _section_features, "about": _section_about,
    "products": _section_products, "menu": _section_menu, "gallery": _section_gallery,
    "testimonials": _section_testimonials, "team": _section_team, "pricing": _section_pricing,
    "faq": _section_faq, "contact": _section_contact, "cta": _section_cta, "footer": _section_footer,
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
</head>
<body>
{''.join(body_parts)}
</body>
</html>"""
