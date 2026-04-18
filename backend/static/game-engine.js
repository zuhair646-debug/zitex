/**
 * Zitex Game Engine - Village Builder
 * يرسم قرية كاملة بـ SVG تلقائياً
 * الاستخدام: <script src="/api/game-engine.js"></script>
 * ثم: ZitexGame.init({theme:'medieval', buildings:8, trees:12, soldiers:4})
 */
const ZitexGame = {
  world: null,
  res: {gold:500,wood:300,food:400,stone:150,soldiers:3},
  svgs: {
    castle: (s=150)=>`<svg viewBox="0 0 120 110" width="${s}" height="${s*0.92}"><defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#A08060"/><stop offset="100%" stop-color="#7A6040"/></linearGradient></defs><rect x="25" y="45" width="70" height="55" fill="url(#cg)" rx="3"/><rect x="10" y="28" width="18" height="72" fill="#8B7355"/><rect x="92" y="28" width="18" height="72" fill="#8B7355"/><rect x="48" y="22" width="24" height="78" fill="#9B8465"/><polygon points="10,28 19,10 28,28" fill="#C41E3A"/><polygon points="92,28 101,10 110,28" fill="#C41E3A"/><polygon points="48,22 60,5 72,22" fill="#C41E3A"/><rect x="50" y="62" width="20" height="38" fill="#4A3322" rx="10 10 0 0"/><circle cx="65" cy="80" r="2.5" fill="#FFD700"/><rect x="30" y="52" width="12" height="12" fill="#87CEEB" rx="2"/><rect x="78" y="52" width="12" height="12" fill="#87CEEB" rx="2"/><rect x="14" y="35" width="10" height="10" fill="#87CEEB" rx="1"/><rect x="96" y="35" width="10" height="10" fill="#87CEEB" rx="1"/><rect x="57" y="8" width="6" height="16" fill="#6B5030"/><polygon points="54,8 63,0 72,8" fill="#FFD700"/></svg>`,
    house: (s=65)=>{const c=['#D4A574','#C49464','#B88454','#DDB584'];const r=['#8B4513','#7A3A12','#6B3010','#9B5523'];const i=Math.floor(Math.random()*4);return`<svg viewBox="0 0 80 70" width="${s}" height="${s*0.88}"><rect x="10" y="35" width="60" height="35" fill="${c[i]}" rx="2"/><polygon points="5,35 40,12 75,35" fill="${r[i]}"/><rect x="30" y="45" width="14" height="25" fill="#4A3322" rx="5 5 0 0"/><circle cx="39" cy="57" r="2" fill="#FFD700"/><rect x="13" y="40" width="11" height="10" fill="#87CEEB" rx="1"/><line x1="18.5" y1="40" x2="18.5" y2="50" stroke="#5C3317" stroke-width="0.8"/><line x1="13" y1="45" x2="24" y2="45" stroke="#5C3317" stroke-width="0.8"/><rect x="56" y="40" width="11" height="10" fill="#87CEEB" rx="1"/><rect x="62" y="16" width="6" height="19" fill="#8B7355"/><ellipse cx="65" cy="13" rx="7" ry="5" fill="#808080" opacity="0.5"/></svg>`},
    tree: (s=60)=>{const g=['#2D8B2D','#1E7A1E','#3AA63A','#228B22'];const i=Math.floor(Math.random()*4);return`<svg viewBox="0 0 60 80" width="${s}" height="${s*1.33}"><rect x="25" y="52" width="10" height="23" fill="#6B4226" rx="3"/><ellipse cx="30" cy="35" rx="${18+Math.random()*8}" ry="${20+Math.random()*8}" fill="${g[i]}"/><ellipse cx="22" cy="30" rx="14" ry="16" fill="${g[(i+1)%4]}" opacity="0.9"/><ellipse cx="38" cy="32" rx="13" ry="15" fill="${g[(i+2)%4]}" opacity="0.85"/>${Math.random()>0.5?`<circle cx="${22+Math.random()*16}" cy="${32+Math.random()*10}" r="3" fill="#FF6B6B" opacity="0.8"/>`:''}</svg>`},
    farm: (s=80)=>`<svg viewBox="0 0 90 60" width="${s}" height="${s*0.67}"><rect x="5" y="15" width="80" height="40" fill="#8B6914" rx="4"/><line x1="5" y1="25" x2="85" y2="25" stroke="#6B4F12" stroke-width="1"/><line x1="5" y1="35" x2="85" y2="35" stroke="#6B4F12" stroke-width="1"/><line x1="5" y1="45" x2="85" y2="45" stroke="#6B4F12" stroke-width="1"/>${Array.from({length:8},(_,i)=>`<rect x="${8+i*10}" y="${17+Math.random()*4}" width="3" height="${8+Math.random()*6}" fill="#228B22" rx="1"/>`).join('')}${Array.from({length:4},(_,i)=>`<circle cx="${12+i*20}" cy="${14+Math.random()*2}" r="4" fill="#FFD700" opacity="0.9"/>`).join('')}<rect x="35" y="2" width="3" height="13" fill="#6B4226"/><rect x="30" y="2" width="13" height="3" fill="#6B4226"/></svg>`,
    soldier: (s=35)=>`<svg viewBox="0 0 40 60" width="${s}" height="${s*1.5}"><circle cx="20" cy="12" r="8" fill="#FDBCB4"/><rect x="12" y="20" width="16" height="20" fill="#C41E3A" rx="3"/><rect x="7" y="22" width="7" height="14" fill="#A01030" rx="2"/><rect x="26" y="22" width="7" height="14" fill="#A01030" rx="2"/><rect x="14" y="40" width="5" height="14" fill="#4A3728" rx="2"/><rect x="21" y="40" width="5" height="14" fill="#4A3728" rx="2"/><polygon points="5,22 1,36 9,36" fill="#808080"/><ellipse cx="20" cy="5" rx="10" ry="4" fill="#808080"/><rect x="16" y="2" width="8" height="3" fill="#808080"/><circle cx="16" cy="10" r="1.5" fill="#333"/><circle cx="24" cy="10" r="1.5" fill="#333"/><path d="M16,15 Q20,18 24,15" stroke="#333" fill="none" stroke-width="0.8"/></svg>`,
    cloud: (s=100)=>`<svg viewBox="0 0 120 45" width="${s}" height="${s*0.38}"><ellipse cx="60" cy="28" rx="50" ry="16" fill="white" opacity="0.85"/><ellipse cx="35" cy="22" rx="30" ry="14" fill="white" opacity="0.9"/><ellipse cx="85" cy="24" rx="28" ry="12" fill="white" opacity="0.87"/></svg>`,
    bush: (s=30)=>`<svg viewBox="0 0 40 25" width="${s}" height="${s*0.63}"><ellipse cx="20" cy="15" rx="18" ry="10" fill="#2D8B2D"/><ellipse cx="12" cy="13" rx="10" ry="8" fill="#3AA63A"/><ellipse cx="28" cy="14" rx="9" ry="7" fill="#248F24"/></svg>`,
    flower: (s=15)=>{const c=['#FF6B6B','#FFD700','#FF69B4','#9370DB','#FF8C00'];const cl=c[Math.floor(Math.random()*5)];return`<svg viewBox="0 0 20 25" width="${s}" height="${s*1.25}"><rect x="9" y="12" width="2" height="13" fill="#228B22"/><circle cx="10" cy="9" r="5" fill="${cl}" opacity="0.9"/><circle cx="10" cy="9" r="2.5" fill="#FFD700"/></svg>`},
    rock: (s=25)=>`<svg viewBox="0 0 40 30" width="${s}" height="${s*0.75}"><polygon points="8,28 20,8 35,28" fill="#808080"/><polygon points="2,28 12,15 22,28" fill="#696969"/><circle cx="18" cy="22" r="2" fill="#FFD700" opacity="0.6"/></svg>`,
    mine: (s=70)=>`<svg viewBox="0 0 80 60" width="${s}" height="${s*0.75}"><polygon points="20,55 40,15 60,55" fill="#696969"/><polygon points="10,55 25,25 40,55" fill="#808080"/><polygon points="45,55 60,20 75,55" fill="#A9A9A9"/><rect x="35" y="30" width="5" height="20" fill="#6B4226"/><polygon points="32,30 40,18 48,30" fill="#555"/><circle cx="28" cy="42" r="4" fill="#FFD700"/><circle cx="55" cy="48" r="3" fill="#FFD700"/><circle cx="42" cy="50" r="2.5" fill="#FFD700"/></svg>`
  },
  init(cfg={}){
    const t=cfg.theme||'medieval';const w=document.getElementById('game-world')||document.body;
    this.world=w;w.style.cssText='position:relative;width:100vw;height:100vh;overflow:hidden;background:linear-gradient(180deg,#87CEEB 0%,#5BA3D9 22%,#90EE90 22%,#4A8B3F 55%,#3D7A35 100%)';
    this.addStyle();this.addResourceBar();this.addHills();this.addClouds(cfg.clouds||4);
    this.addPaths();this.addFlowers(cfg.flowers||20);this.addBushes(cfg.bushes||8);
    this.addTrees(cfg.trees||10);this.addFarms(cfg.farms||3);this.addMine();
    this.addCastle();this.addHouses(cfg.buildings||6);this.addSoldiers(cfg.soldiers||4);
    this.addRocks(cfg.rocks||5);this.addActionBar();this.startResourceLoop();
  },
  addStyle(){const s=document.createElement('style');s.textContent=`
    *{margin:0;padding:0;box-sizing:border-box;font-family:Tajawal,sans-serif}body{overflow:hidden}
    .b{position:absolute;cursor:pointer;transition:transform 0.3s,filter 0.3s;filter:drop-shadow(2px 4px 6px rgba(0,0,0,0.4))}.b:hover{transform:scale(1.15);z-index:50;filter:drop-shadow(2px 4px 12px rgba(255,215,0,0.5))}
    .tt{display:none;position:absolute;bottom:105%;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.9);color:#fff;padding:6px 12px;border-radius:8px;white-space:nowrap;font-size:11px;z-index:99;border:1px solid rgba(255,215,0,0.3)}.b:hover .tt{display:block}
    .rb{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;justify-content:center;gap:12px;padding:8px;background:rgba(0,0,0,0.75);backdrop-filter:blur(10px)}
    .ri{display:flex;align-items:center;gap:5px;background:rgba(255,255,255,0.1);padding:4px 12px;border-radius:18px;color:#fff;font-weight:bold;font-size:13px}
    .ab{position:fixed;bottom:0;left:0;right:0;z-index:100;display:flex;justify-content:center;gap:8px;padding:10px;background:rgba(0,0,0,0.75);backdrop-filter:blur(10px)}
    .abtn{padding:8px 18px;border:2px solid rgba(255,215,0,0.4);border-radius:12px;background:rgba(255,215,0,0.1);color:#FFD700;font-weight:bold;cursor:pointer;transition:all 0.3s;font-size:12px}.abtn:hover{background:rgba(255,215,0,0.3);transform:translateY(-2px)}
    @keyframes fc{0%{transform:translateX(-200px)}100%{transform:translateX(calc(100vw+200px))}}
    @keyframes sw{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}
    @keyframes bn{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
    .ts{animation:sw 3s ease-in-out infinite;transform-origin:bottom center}
    .sbn{animation:bn 2s ease-in-out infinite}
    .hill{position:absolute;border-radius:50%;opacity:0.4}
  `;document.head.appendChild(s)},
  place(html,x,y,cls='b',tip=''){const d=document.createElement('div');d.className=cls;d.style.cssText=`left:${x}%;top:${y}%`;d.innerHTML=(tip?`<div class="tt">${tip}</div>`:'')+html;this.world.appendChild(d);return d},
  rnd(a,b){return a+Math.random()*(b-a)},
  addResourceBar(){const r=document.createElement('div');r.className='rb';r.innerHTML=`
    <div class="ri"><svg viewBox="0 0 20 20" width="16" height="16"><circle cx="10" cy="10" r="9" fill="#FFD700" stroke="#B8860B" stroke-width="1.5"/><text x="10" y="14" text-anchor="middle" font-size="9" fill="#8B6914" font-weight="bold">$</text></svg><span id="g">${this.res.gold}</span></div>
    <div class="ri"><svg viewBox="0 0 20 14" width="18" height="12"><rect x="1" y="1" width="18" height="5" fill="#8B5E3C" rx="2"/><rect x="1" y="7" width="18" height="5" fill="#A0522D" rx="2"/></svg><span id="w">${this.res.wood}</span></div>
    <div class="ri"><svg viewBox="0 0 20 20" width="14" height="14"><circle cx="10" cy="12" r="7" fill="#FFD700"/><rect x="8" y="3" width="4" height="9" fill="#228B22" rx="1"/></svg><span id="f">${this.res.food}</span></div>
    <div class="ri"><svg viewBox="0 0 20 20" width="14" height="14"><polygon points="4,18 10,3 16,18" fill="#808080"/></svg><span id="s">${this.res.stone}</span></div>
    <div class="ri"><svg viewBox="0 0 20 20" width="14" height="14"><circle cx="10" cy="8" r="5" fill="#FDBCB4"/><rect x="6" y="13" width="8" height="6" fill="#C41E3A" rx="2"/></svg><span id="sl">${this.res.soldiers}</span></div>`;
    document.body.appendChild(r)},
  addHills(){const hills=[[5,38,280,70],[60,35,220,55],[30,40,180,50],[80,36,200,60]];hills.forEach(h=>{const d=document.createElement('div');d.className='hill';d.style.cssText=`left:${h[0]}%;top:${h[1]}%;width:${h[2]}px;height:${h[3]}px;background:linear-gradient(180deg,#5A9B4F,#4A8B3F)`;this.world.appendChild(d)})},
  addClouds(n){for(let i=0;i<n;i++){const d=document.createElement('div');d.style.cssText=`position:absolute;top:${2+i*5}%;opacity:0.7;animation:fc ${30+this.rnd(10,30)}s linear infinite;animation-delay:${-this.rnd(0,30)}s`;d.innerHTML=this.svgs.cloud(60+this.rnd(0,60));this.world.appendChild(d)}},
  addPaths(){const paths=[[30,52,220,8,-5],[45,60,180,8,10],[20,55,150,8,3],[55,48,160,8,-8]];paths.forEach(p=>{const d=document.createElement('div');d.style.cssText=`position:absolute;left:${p[0]}%;top:${p[1]}%;width:${p[2]}px;height:${p[3]}px;background:#8B7355;border-radius:4px;opacity:0.5;transform:rotate(${p[4]}deg)`;this.world.appendChild(d)})},
  addTrees(n){for(let i=0;i<n;i++){const x=this.rnd(3,90),y=this.rnd(28,85),s=this.rnd(35,70);const d=this.place(this.svgs.tree(s),x,y,'b ts',`شجرة`);d.style.zIndex=Math.floor(y)}},
  addBushes(n){for(let i=0;i<n;i++){const x=this.rnd(2,95),y=this.rnd(35,90),s=this.rnd(20,40);this.place(this.svgs.bush(s),x,y,'b','')}},
  addFlowers(n){for(let i=0;i<n;i++){const x=this.rnd(5,92),y=this.rnd(30,88);const d=document.createElement('div');d.style.cssText=`position:absolute;left:${x}%;top:${y}%`;d.innerHTML=this.svgs.flower(this.rnd(8,16));this.world.appendChild(d)}},
  addRocks(n){for(let i=0;i<n;i++){const x=this.rnd(5,90),y=this.rnd(35,85);this.place(this.svgs.rock(this.rnd(18,35)),x,y,'b','')}},
  addCastle(){this.place(this.svgs.castle(160),38,25,'b','القلعة الرئيسية - المستوى 5')},
  addHouses(n){const positions=[[18,45],[62,42],[25,62],[70,58],[15,75],[55,72],[78,48],[30,50]];for(let i=0;i<Math.min(n,positions.length);i++){const[x,y]=positions[i];this.place(this.svgs.house(this.rnd(50,70)),x+this.rnd(-3,3),y+this.rnd(-3,3),'b',`بيت ${i+1} - المستوى ${Math.floor(this.rnd(1,5))}`)}},
  addFarms(n){const positions=[[10,55],[72,65],[45,75]];for(let i=0;i<Math.min(n,positions.length);i++){const[x,y]=positions[i];this.place(this.svgs.farm(this.rnd(65,90)),x,y,'b',`مزرعة ${i+1} - إنتاج: +${Math.floor(this.rnd(3,8))}/ث`)}},
  addMine(){this.place(this.svgs.mine(75),82,72,'b','المنجم - إنتاج: +5 حجر/ث')},
  addSoldiers(n){const positions=[[35,55],[52,55],[43,65],[60,50]];for(let i=0;i<Math.min(n,positions.length);i++){const[x,y]=positions[i];this.place(this.svgs.soldier(this.rnd(28,38)),x+this.rnd(-2,2),y+this.rnd(-2,2),'b sbn',`جندي ${i+1} - القوة: ${Math.floor(this.rnd(10,50))}`)}},
  addActionBar(){const a=document.createElement('div');a.className='ab';a.innerHTML=`
    <button class="abtn" onclick="ZitexGame.build()">بناء</button>
    <button class="abtn" onclick="ZitexGame.train()">تدريب جندي</button>
    <button class="abtn" onclick="ZitexGame.upgrade()">ترقية</button>
    <button class="abtn" onclick="ZitexGame.attack()">هجوم</button>`;
    document.body.appendChild(a)},
  upd(){['g','w','f','s','sl'].forEach((id,i)=>{const el=document.getElementById(id);if(el)el.textContent=Object.values(this.res)[i]})},
  build(){if(this.res.wood>=50&&this.res.stone>=30){this.res.wood-=50;this.res.stone-=30;const x=this.rnd(10,80),y=this.rnd(40,80);this.place(this.svgs.house(this.rnd(50,65)),x,y,'b','مبنى جديد!');this.upd()}else alert('موارد غير كافية!')},
  train(){if(this.res.food>=30&&this.res.gold>=20){this.res.food-=30;this.res.gold-=20;this.res.soldiers++;const x=this.rnd(30,60),y=this.rnd(50,70);this.place(this.svgs.soldier(30),x,y,'b sbn',`جندي جديد`);this.upd()}else alert('موارد غير كافية!')},
  upgrade(){if(this.res.gold>=100){this.res.gold-=100;this.upd();alert('تمت الترقية!')}else alert('ذهب غير كافٍ!')},
  attack(){alert('جاري الهجوم على قرية العدو...')},
  startResourceLoop(){setInterval(()=>{this.res.gold+=5;this.res.wood+=3;this.res.food+=4;this.res.stone+=2;this.upd()},3000)}
};
