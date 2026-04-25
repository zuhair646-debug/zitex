"""
Template Themes — UNIQUE visual identity per archetype.

Each archetype gets:
  • palette        — 4 colors (primary, secondary, accent, bg)
  • font           — Google Font (Arabic-supporting)
  • hero_pattern   — CSS background pattern/shape
  • hero_image_q   — Unsplash query keyword (varies hero photo per archetype)
  • spacing/radius — design tokens
  • custom_css     — per-archetype CSS injected to make it visually distinct

This guarantees that each of the 20 archetypes LOOKS unique — not just rearranged.
"""

# 20 unique themes — one per archetype id
ARCHETYPE_THEMES = {
    "classic_stack": {
        "name": "ذهبي كلاسيكي",
        "palette": {"primary": "#D4AF37", "secondary": "#1a1a2e", "accent": "#E8C547", "bg": "#0f0f1e", "text": "#fff"},
        "font": "Tajawal",
        "hero_image_q": "luxury+restaurant+golden",
        "hero_pattern": "linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)",
        "radius": "8px",
        "shadow": "0 10px 30px rgba(212,175,55,.2)",
        "custom_css": """
.hero{background:linear-gradient(rgba(15,15,30,.85),rgba(15,15,30,.7)),url(IMG) center/cover}
.hero h1{font-weight:900;letter-spacing:1px}
.btn{border-radius:4px;letter-spacing:2px;text-transform:uppercase}
""",
    },
    "magazine": {
        "name": "مجلة كريم",
        "palette": {"primary": "#C7956D", "secondary": "#F5EBDC", "accent": "#8B5E3C", "bg": "#FAF6F0", "text": "#2C1810"},
        "font": "Reem Kufi",
        "hero_image_q": "editorial+magazine+typography",
        "hero_pattern": "linear-gradient(180deg,#FAF6F0 0%,#F5EBDC 100%)",
        "radius": "0px",
        "shadow": "0 1px 0 rgba(0,0,0,.1)",
        "custom_css": """
body{background:#FAF6F0;color:#2C1810}
.hero{background:#FAF6F0;color:#2C1810;border-bottom:8px solid #C7956D}
.hero h1{font-size:96px;line-height:.9;font-weight:900;letter-spacing:-2px}
.hero h2,h2{font-family:'Playfair Display',serif;font-style:italic;font-weight:400}
section{border-bottom:1px solid rgba(44,24,16,.1)}
.gallery img{filter:grayscale(.3) contrast(1.05)}
""",
    },
    "split_screen": {
        "name": "مقسّم تيل",
        "palette": {"primary": "#0EA5E9", "secondary": "#0F172A", "accent": "#06B6D4", "bg": "#020617", "text": "#fff"},
        "font": "Cairo",
        "hero_image_q": "modern+architecture+city+night",
        "hero_pattern": "linear-gradient(90deg,#020617 50%,#0EA5E9 50%)",
        "radius": "16px",
        "shadow": "0 25px 50px -12px rgba(14,165,233,.4)",
        "custom_css": """
body{background:#020617}
.hero{display:grid;grid-template-columns:1fr 1fr;min-height:90vh;padding:0!important}
.hero .container{padding:8% 6%;display:flex;flex-direction:column;justify-content:center}
.hero h1{font-size:64px;font-weight:900}
.hero::after{content:'';background:url(IMG) center/cover;border-right:6px solid #0EA5E9}
section:nth-child(even){background:linear-gradient(135deg,rgba(14,165,233,.05),rgba(2,6,23,.95))}
@media(max-width:768px){.hero{grid-template-columns:1fr}.hero::after{display:none}}
""",
    },
    "longform_story": {
        "name": "قصة دافئة",
        "palette": {"primary": "#92400E", "secondary": "#FEF3C7", "accent": "#D97706", "bg": "#FFFBEB", "text": "#451A03"},
        "font": "Amiri",
        "hero_image_q": "vintage+warm+sunset+story",
        "hero_pattern": "linear-gradient(180deg,#FFFBEB 0%,#FEF3C7 100%)",
        "radius": "24px",
        "shadow": "0 8px 25px rgba(146,64,14,.15)",
        "custom_css": """
body{background:#FFFBEB;color:#451A03;font-size:18px;line-height:1.9}
.hero{background:linear-gradient(rgba(255,251,235,.6),rgba(254,243,199,.8)),url(IMG) center/cover;color:#451A03}
.hero h1{font-family:'Amiri',serif;font-size:88px;font-weight:700;line-height:1.1}
.hero h2{font-style:italic;opacity:.85}
section{padding:120px 0!important}
.timeline,.story_timeline{border-right:3px dashed #D97706;padding-right:30px}
""",
    },
    "gallery_first": {
        "name": "معرض سينمائي",
        "palette": {"primary": "#EAB308", "secondary": "#0c0a09", "accent": "#FBBF24", "bg": "#000000", "text": "#fafaf9"},
        "font": "Tajawal",
        "hero_image_q": "cinematic+film+grain+portrait",
        "hero_pattern": "linear-gradient(180deg,#000 0%,#0c0a09 100%)",
        "radius": "0px",
        "shadow": "0 0 40px rgba(234,179,8,.3)",
        "custom_css": """
body{background:#000;color:#fafaf9}
.hero{background:url(IMG) center/cover;min-height:100vh;position:relative}
.hero::before{content:'';position:absolute;inset:0;background:linear-gradient(180deg,transparent 0%,rgba(0,0,0,.95) 100%)}
.hero .container{position:relative;z-index:1;display:flex;align-items:flex-end;min-height:100vh}
.hero h1{font-size:120px;font-weight:900;mix-blend-mode:difference}
.gallery{padding:0!important}
.gallery img{filter:contrast(1.15) saturate(1.1)}
section{border-top:1px solid rgba(234,179,8,.1)}
""",
    },
    "minimal_portrait": {
        "name": "بسيط صحراوي",
        "palette": {"primary": "#A8A29E", "secondary": "#FFFFFF", "accent": "#78716C", "bg": "#FAFAF9", "text": "#1c1917"},
        "font": "Almarai",
        "hero_image_q": "minimal+desert+sand+still+life",
        "hero_pattern": "linear-gradient(180deg,#FAFAF9 0%,#FFFFFF 100%)",
        "radius": "2px",
        "shadow": "none",
        "custom_css": """
body{background:#FAFAF9;color:#1c1917;font-weight:300;letter-spacing:.3px}
.hero{background:#FAFAF9;color:#1c1917;text-align:center;padding:160px 0}
.hero h1{font-size:56px;font-weight:200;letter-spacing:-1px;line-height:1.2}
.hero img{max-width:340px;border-radius:50%;margin:40px auto;display:block;filter:grayscale(.4)}
section{padding:120px 0!important;border:0}
.btn{background:transparent;border:1px solid #1c1917;color:#1c1917;border-radius:0;padding:14px 40px;letter-spacing:3px;text-transform:uppercase;font-size:11px}
""",
    },
    "bold_banner": {
        "name": "بانر أحمر ناري",
        "palette": {"primary": "#DC2626", "secondary": "#000000", "accent": "#FCD34D", "bg": "#0a0a0a", "text": "#fff"},
        "font": "Cairo",
        "hero_image_q": "bold+poster+typography+impact",
        "hero_pattern": "linear-gradient(135deg,#DC2626 0%,#000 100%)",
        "radius": "0px",
        "shadow": "8px 8px 0 #FCD34D",
        "custom_css": """
body{background:#0a0a0a;color:#fff}
.hero{background:#DC2626;color:#fff;padding:60px 0;border-bottom:12px solid #FCD34D;position:relative;overflow:hidden}
.hero::before{content:'!';position:absolute;font-size:600px;font-weight:900;right:-50px;top:-100px;color:rgba(0,0,0,.15);line-height:1}
.hero h1{font-size:120px;font-weight:900;line-height:1;text-transform:uppercase;letter-spacing:-3px}
.hero h2{font-size:24px;font-weight:700;background:#000;display:inline-block;padding:10px 20px;color:#FCD34D}
.btn,.btn-primary{background:#FCD34D!important;color:#000!important;font-weight:900;border-radius:0;padding:20px 50px;font-size:18px;text-transform:uppercase;border:4px solid #fff;box-shadow:8px 8px 0 #000}
.stats{background:#000;border-top:8px solid #DC2626;border-bottom:8px solid #DC2626}
.stats .value{color:#FCD34D;font-size:80px;font-weight:900}
""",
    },
    "card_stack": {
        "name": "بطاقات نيون",
        "palette": {"primary": "#A855F7", "secondary": "#1e1b4b", "accent": "#22D3EE", "bg": "#0F0F23", "text": "#E0E7FF"},
        "font": "Cairo",
        "hero_image_q": "neon+abstract+glass+morphism",
        "hero_pattern": "radial-gradient(circle at 20% 50%,rgba(168,85,247,.3) 0%,transparent 50%),radial-gradient(circle at 80% 80%,rgba(34,211,238,.2) 0%,transparent 50%),#0F0F23",
        "radius": "24px",
        "shadow": "0 20px 60px rgba(168,85,247,.3)",
        "custom_css": """
body{background:#0F0F23;color:#E0E7FF}
.hero{background:radial-gradient(circle at 30% 50%,rgba(168,85,247,.4) 0%,transparent 50%),radial-gradient(circle at 80% 20%,rgba(34,211,238,.3) 0%,transparent 50%),#0F0F23;backdrop-filter:blur(40px)}
section{margin:24px;border-radius:24px;background:rgba(255,255,255,.03);backdrop-filter:blur(20px);border:1px solid rgba(168,85,247,.2);padding:60px 40px!important;box-shadow:0 20px 60px rgba(168,85,247,.15)}
.btn{background:linear-gradient(135deg,#A855F7,#22D3EE);border-radius:100px;padding:14px 36px;border:0;color:#fff;font-weight:700}
.feature-card,.product-card,.testimonial,.team-card{background:rgba(255,255,255,.05);border:1px solid rgba(168,85,247,.3);border-radius:20px;backdrop-filter:blur(15px)}
""",
    },
    "asymmetric": {
        "name": "غير متماثل وحشي",
        "palette": {"primary": "#84CC16", "secondary": "#FAFAF9", "accent": "#F97316", "bg": "#FAFAF9", "text": "#0c0a09"},
        "font": "Reem Kufi",
        "hero_image_q": "abstract+brutalist+art+chaos",
        "hero_pattern": "#FAFAF9",
        "radius": "0px",
        "shadow": "12px 12px 0 #0c0a09",
        "custom_css": """
body{background:#FAFAF9;color:#0c0a09}
.hero{background:#FAFAF9;color:#0c0a09;padding:80px 0;border:6px solid #0c0a09;margin:24px;position:relative}
.hero::before{content:'';position:absolute;top:-30px;right:60px;width:120px;height:120px;background:#84CC16;border-radius:50%;z-index:0}
.hero::after{content:'';position:absolute;bottom:30px;left:80px;width:200px;height:40px;background:#F97316;transform:rotate(-3deg);z-index:0}
.hero .container{position:relative;z-index:1}
.hero h1{font-size:96px;font-weight:900;line-height:.9;transform:rotate(-1deg);text-decoration:underline #84CC16 12px}
.btn{background:#0c0a09;color:#fff;border-radius:0;border:0;padding:18px 40px;font-weight:900;text-transform:uppercase;box-shadow:8px 8px 0 #84CC16;transform:rotate(.5deg)}
section:nth-child(odd){transform:rotate(.3deg);background:#fff;margin:8px 24px;padding:80px 40px!important}
section:nth-child(even){background:#0c0a09;color:#fff;transform:rotate(-.3deg);margin:8px 24px}
""",
    },
    "services_showcase": {
        "name": "خدمات أزرق محيطي",
        "palette": {"primary": "#0891B2", "secondary": "#164E63", "accent": "#67E8F9", "bg": "#F0F9FF", "text": "#083344"},
        "font": "Cairo",
        "hero_image_q": "ocean+water+fluid+services",
        "hero_pattern": "linear-gradient(135deg,#0891B2,#164E63)",
        "radius": "20px",
        "shadow": "0 20px 40px rgba(8,145,178,.25)",
        "custom_css": """
body{background:#F0F9FF;color:#083344}
.hero{background:linear-gradient(135deg,#0891B2 0%,#164E63 100%);color:#fff;clip-path:polygon(0 0,100% 0,100% 85%,0 100%);padding:120px 0 160px;position:relative}
.hero::before{content:'';position:absolute;inset:0;background:url('https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1600&q=70') center/cover;opacity:.15}
.hero .container{position:relative;z-index:1}
.hero h1{font-size:72px;font-weight:900}
section{padding:80px 0!important}
.services-grid,.product-grid{grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px}
.feature-card,.product-card{background:#fff;border-radius:24px;border-top:4px solid #0891B2;box-shadow:0 10px 30px rgba(8,145,178,.15)}
""",
    },
    "booking_first": {
        "name": "حجز أخضر صحي",
        "palette": {"primary": "#10B981", "secondary": "#064E3B", "accent": "#A7F3D0", "bg": "#ECFDF5", "text": "#022C22"},
        "font": "Tajawal",
        "hero_image_q": "wellness+spa+green+nature",
        "hero_pattern": "linear-gradient(135deg,#ECFDF5,#A7F3D0)",
        "radius": "16px",
        "shadow": "0 15px 40px rgba(16,185,129,.2)",
        "custom_css": """
body{background:#ECFDF5;color:#022C22}
.hero{background:linear-gradient(rgba(167,243,208,.5),rgba(236,253,245,.9)),url('https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1600&q=70') center/cover;color:#022C22;padding:60px 0}
.hero h1{font-size:60px;font-weight:900;color:#064E3B}
.reservation,.reservation-form{background:#fff;border-radius:24px;padding:40px;box-shadow:0 25px 60px rgba(16,185,129,.25);max-width:520px;margin:30px auto;border:2px solid #10B981}
.reservation input,.reservation select{border:2px solid #A7F3D0;border-radius:12px;padding:14px 18px;width:100%;margin-bottom:14px;font-family:inherit}
.btn-primary{background:#10B981;color:#fff;border-radius:12px;padding:16px 32px;font-weight:900;border:0}
""",
    },
    "process_steps": {
        "name": "خطوات تقنية ساخنة",
        "palette": {"primary": "#F97316", "secondary": "#0C0A09", "accent": "#FBBF24", "bg": "#FAFAF9", "text": "#1c1917"},
        "font": "Cairo",
        "hero_image_q": "tech+process+steps+modern+orange",
        "hero_pattern": "linear-gradient(135deg,#F97316,#FBBF24)",
        "radius": "12px",
        "shadow": "0 10px 30px rgba(249,115,22,.3)",
        "custom_css": """
body{background:#FAFAF9}
.hero{background:linear-gradient(135deg,#F97316 0%,#FBBF24 100%);color:#fff;padding:100px 0;border-bottom-left-radius:60% 80px;border-bottom-right-radius:60% 80px}
.hero h1{font-size:72px;font-weight:900}
.process_steps,.steps{background:#fff}
.process_steps .step,.steps .step{position:relative;padding-right:80px;border-right:4px solid #F97316;margin-bottom:40px}
.process_steps .n,.steps .n{position:absolute;right:-30px;top:0;width:60px;height:60px;background:#F97316;border-radius:50%;color:#fff;font-size:24px;font-weight:900;display:flex;align-items:center;justify-content:center;border:6px solid #fff;box-shadow:0 8px 20px rgba(249,115,22,.4)}
""",
    },
    "team_centric": {
        "name": "فريق وردي رومانسي",
        "palette": {"primary": "#EC4899", "secondary": "#831843", "accent": "#FBCFE8", "bg": "#FDF2F8", "text": "#500724"},
        "font": "Amiri",
        "hero_image_q": "friendly+team+pink+portrait",
        "hero_pattern": "linear-gradient(135deg,#FDF2F8,#FBCFE8)",
        "radius": "32px",
        "shadow": "0 15px 40px rgba(236,72,153,.25)",
        "custom_css": """
body{background:#FDF2F8;color:#500724}
.hero{background:linear-gradient(135deg,#FDF2F8,#FBCFE8);color:#500724;padding:80px 0}
.hero h1{font-family:'Amiri',serif;font-size:80px;font-weight:700;color:#831843}
.team-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:32px;padding:0 20px}
.team-card{text-align:center;background:#fff;border-radius:32px;padding:30px;border:3px solid #FBCFE8;transition:all .3s}
.team-card:hover{transform:translateY(-8px);box-shadow:0 25px 50px rgba(236,72,153,.3);border-color:#EC4899}
.team-photo{width:160px;height:160px;border-radius:50%;margin:0 auto 20px;border:6px solid #FBCFE8;background-size:cover}
""",
    },
    "reviews_driven": {
        "name": "آراء فاخرة كحلية",
        "palette": {"primary": "#FBBF24", "secondary": "#1E1B4B", "accent": "#F59E0B", "bg": "#0F0E1F", "text": "#FEF3C7"},
        "font": "Reem Kufi",
        "hero_image_q": "luxury+stars+gold+night",
        "hero_pattern": "radial-gradient(circle at 50% 0%,#312E81 0%,#0F0E1F 100%)",
        "radius": "8px",
        "shadow": "0 10px 30px rgba(251,191,36,.2)",
        "custom_css": """
body{background:#0F0E1F;color:#FEF3C7}
.hero{background:radial-gradient(circle at 50% 0%,#312E81 0%,#0F0E1F 100%);color:#FEF3C7;text-align:center;padding:80px 0}
.hero::before{content:'★ ★ ★ ★ ★';display:block;color:#FBBF24;font-size:32px;letter-spacing:8px;margin-bottom:20px}
.hero h1{font-size:64px;font-weight:900;color:#FBBF24;font-family:'Reem Kufi',serif}
.testimonials{background:#0F0E1F;padding:80px 0!important}
.testimonial{background:rgba(251,191,36,.05);border:1px solid rgba(251,191,36,.2);border-radius:8px;padding:40px;font-size:20px;line-height:1.8;font-style:italic;border-right:6px solid #FBBF24}
.testimonial .author{color:#FBBF24;font-weight:900;margin-top:20px}
""",
    },
    "pricing_table": {
        "name": "جدول أسعار SaaS",
        "palette": {"primary": "#3B82F6", "secondary": "#1E3A8A", "accent": "#60A5FA", "bg": "#F8FAFC", "text": "#0F172A"},
        "font": "Cairo",
        "hero_image_q": "dashboard+saas+modern+blue",
        "hero_pattern": "linear-gradient(135deg,#3B82F6,#1E3A8A)",
        "radius": "12px",
        "shadow": "0 4px 6px rgba(59,130,246,.1)",
        "custom_css": """
body{background:#F8FAFC;color:#0F172A}
.hero{background:linear-gradient(135deg,#3B82F6 0%,#1E3A8A 100%);color:#fff;padding:80px 0 120px;clip-path:polygon(0 0,100% 0,100% 100%,0 90%)}
.hero h1{font-size:60px;font-weight:900}
.pricing,.pricing-table{background:#fff;padding:80px 0!important}
.pricing-card{background:#fff;border:2px solid #E2E8F0;border-radius:16px;padding:32px;transition:all .3s}
.pricing-card.featured{border-color:#3B82F6;background:linear-gradient(135deg,rgba(59,130,246,.05),rgba(255,255,255,1));transform:scale(1.05);box-shadow:0 25px 50px rgba(59,130,246,.2)}
.pricing-card .price{font-size:48px;color:#3B82F6;font-weight:900}
""",
    },
    "faq_heavy": {
        "name": "FAQ هادئ نعنعي",
        "palette": {"primary": "#14B8A6", "secondary": "#134E4A", "accent": "#5EEAD4", "bg": "#F0FDFA", "text": "#042F2E"},
        "font": "Almarai",
        "hero_image_q": "calm+question+document+teal",
        "hero_pattern": "linear-gradient(180deg,#F0FDFA,#CCFBF1)",
        "radius": "10px",
        "shadow": "0 4px 12px rgba(20,184,166,.15)",
        "custom_css": """
body{background:#F0FDFA;color:#042F2E;font-size:17px;line-height:1.8}
.hero{background:linear-gradient(180deg,#F0FDFA 0%,#CCFBF1 100%);padding:100px 0;text-align:center}
.hero h1{color:#134E4A;font-size:56px;font-weight:900}
.faq{background:#fff;padding:80px 0!important}
.faq .item{background:#F0FDFA;border-radius:10px;padding:24px 30px;margin-bottom:14px;border-right:4px solid #14B8A6;transition:all .3s}
.faq .item:hover{background:#CCFBF1;transform:translateX(-6px)}
.faq .item .q{font-weight:900;color:#134E4A;font-size:18px;margin-bottom:8px}
""",
    },
    "stats_numbers": {
        "name": "أرقام بنفسجي شركاتي",
        "palette": {"primary": "#7C3AED", "secondary": "#4C1D95", "accent": "#C4B5FD", "bg": "#FAF5FF", "text": "#2E1065"},
        "font": "Cairo",
        "hero_image_q": "corporate+building+success+purple",
        "hero_pattern": "linear-gradient(135deg,#7C3AED,#4C1D95)",
        "radius": "8px",
        "shadow": "0 20px 50px rgba(124,58,237,.3)",
        "custom_css": """
body{background:#FAF5FF;color:#2E1065}
.hero{background:linear-gradient(135deg,#7C3AED 0%,#4C1D95 100%);color:#fff;padding:120px 0;display:grid;grid-template-columns:1fr 1fr;align-items:center}
.hero::after{content:'';background:url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&q=70') center/cover;opacity:.4;mix-blend-mode:overlay}
.hero h1{font-size:80px;font-weight:900;line-height:1}
.stats{background:#2E1065;color:#fff;padding:100px 0!important}
.stats .value{font-size:120px;font-weight:900;color:#C4B5FD;line-height:1;letter-spacing:-4px}
.stats .label{color:#A78BFA;font-size:14px;text-transform:uppercase;letter-spacing:3px;margin-top:10px}
""",
    },
    "location_map": {
        "name": "موقع ترابي محلي",
        "palette": {"primary": "#A16207", "secondary": "#FEF3C7", "accent": "#EAB308", "bg": "#FFFBEB", "text": "#451A03"},
        "font": "Tajawal",
        "hero_image_q": "local+shop+street+earthy+warm",
        "hero_pattern": "linear-gradient(135deg,#FFFBEB,#FEF3C7)",
        "radius": "16px",
        "shadow": "0 8px 20px rgba(161,98,7,.2)",
        "custom_css": """
body{background:#FFFBEB;color:#451A03}
.hero{background:linear-gradient(rgba(255,251,235,.7),rgba(254,243,199,.85)),url(IMG) center/cover;color:#451A03;padding:80px 0;text-align:center}
.hero h1{font-size:64px;font-weight:900;color:#451A03}
.hero h2{color:#A16207;font-size:24px}
.map_embed,.map{padding:0!important}
.map_embed iframe,.map iframe{height:500px;border:0;border-top:6px solid #A16207;border-bottom:6px solid #A16207}
.contact{background:#FEF3C7;padding:80px 0!important}
""",
    },
    "newsletter_first": {
        "name": "نشرة بريدية بنفسجية",
        "palette": {"primary": "#6366F1", "secondary": "#312E81", "accent": "#A5B4FC", "bg": "#FAFAFF", "text": "#1E1B4B"},
        "font": "Cairo",
        "hero_image_q": "newsletter+email+envelope+modern",
        "hero_pattern": "linear-gradient(135deg,#6366F1,#312E81)",
        "radius": "16px",
        "shadow": "0 15px 40px rgba(99,102,241,.25)",
        "custom_css": """
body{background:#FAFAFF;color:#1E1B4B}
.hero{background:linear-gradient(135deg,#6366F1 0%,#312E81 100%);color:#fff;padding:100px 0;text-align:center;position:relative}
.hero::before{content:'✉️';font-size:200px;position:absolute;left:5%;top:50%;transform:translateY(-50%);opacity:.1}
.hero h1{font-size:64px;font-weight:900}
.newsletter,.newsletter-card,.newsletter_section{background:linear-gradient(135deg,#6366F1,#312E81);color:#fff;padding:80px 40px!important;text-align:center;border-radius:32px;margin:40px 24px}
.newsletter input,.newsletter_section input{background:#fff;color:#1E1B4B;border-radius:100px;padding:18px 30px;width:400px;font-size:18px;border:0;max-width:80%}
""",
    },
    "product_dense": {
        "name": "منتجات Pinterest",
        "palette": {"primary": "#E11D48", "secondary": "#881337", "accent": "#FECDD3", "bg": "#FFFFFF", "text": "#0c0a09"},
        "font": "Tajawal",
        "hero_image_q": "products+grid+pinterest+colorful",
        "hero_pattern": "#FFFFFF",
        "radius": "16px",
        "shadow": "0 10px 30px rgba(225,29,72,.15)",
        "custom_css": """
body{background:#fff;color:#0c0a09}
.hero{background:url(IMG) center/cover;min-height:60vh;padding:80px 0;color:#fff;position:relative}
.hero::before{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(225,29,72,.7),rgba(136,19,55,.9))}
.hero .container{position:relative;z-index:1}
.hero h1{font-size:72px;font-weight:900}
.product-grid,.product_grid_filters{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;padding:20px}
.product-card{background:#fff;border-radius:16px;overflow:hidden;border:0;box-shadow:0 4px 12px rgba(0,0,0,.08);transition:all .3s}
.product-card:hover{transform:translateY(-4px);box-shadow:0 25px 50px rgba(225,29,72,.2)}
.product-card img{aspect-ratio:1;object-fit:cover}
.btn-primary{background:#E11D48;color:#fff;border-radius:100px}
""",
    },
}


# ─── Hero image library — 20 unique queries × multiple categories ────
def get_hero_image_for(category_id: str, archetype_id: str) -> str:
    """Return a unique Unsplash URL — different image for each (category, archetype) pair."""
    theme = ARCHETYPE_THEMES.get(archetype_id, {})
    q = theme.get("hero_image_q", "modern")
    # Map category to subject keyword for hero query
    cat_kw = {
        "restaurant": "restaurant+food", "coffee": "cafe+coffee", "store": "shop+products",
        "barber": "barber+hairstyle", "salon_women": "salon+beauty", "pets": "pet+animals",
        "clinic": "clinic+medical", "bakery": "bakery+bread", "car_wash": "car+wash",
        "sports_club": "sports+club", "library": "library+books", "art_gallery": "art+gallery",
        "maintenance": "tools+workshop", "jewelry": "jewelry+gold",
        "plumbing": "plumbing+tools", "electrical": "electric+work",
        "company": "office+business", "portfolio": "creative+portfolio",
        "saas": "tech+saas+screens", "blank": "abstract+modern",
        "gym": "gym+fitness", "academy": "education+classroom",
    }.get(category_id, "modern")
    return f"https://source.unsplash.com/1600x900/?{cat_kw},{q}"


def apply_archetype_theme(archetype_id: str, category_id: str, base_theme: dict) -> dict:
    """Merge per-archetype palette + font + hero image + custom CSS into the base theme."""
    spec = ARCHETYPE_THEMES.get(archetype_id)
    if not spec:
        return base_theme
    theme = dict(base_theme)
    pal = spec.get("palette", {})
    theme.update({
        "primary": pal.get("primary", theme.get("primary")),
        "secondary": pal.get("secondary", theme.get("secondary")),
        "accent": pal.get("accent", theme.get("accent")),
        "background": pal.get("bg", theme.get("background", theme.get("bg"))),
        "bg": pal.get("bg", theme.get("bg")),
        "text": pal.get("text", theme.get("text")),
        "font": spec.get("font", theme.get("font")),
        "radius": spec.get("radius", theme.get("radius")),
    })
    hero_img = get_hero_image_for(category_id, archetype_id)
    custom = (spec.get("custom_css") or "").replace("IMG", hero_img)
    # Append per-archetype CSS to theme.custom_css
    existing_css = theme.get("custom_css") or ""
    theme["custom_css"] = existing_css + "\n" + custom
    theme["_archetype_theme_name"] = spec.get("name", archetype_id)
    theme["_hero_image"] = hero_img
    return theme
