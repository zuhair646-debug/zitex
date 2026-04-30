/**
 * Avatar Settings — the owner configures the AI avatar for their client website.
 * Route: /dashboard/avatar/:projectId  (or /dashboard/avatar with selector)
 *
 * Flow:
 *   1. Choose project (dropdown of owner's projects)
 *   2. If no avatar yet:
 *      - Show "Start 14-day FREE trial" form (shop_name, desc, pricing, faq, voice, tone)
 *   3. If trial active:
 *      - Show trial days left + customize form (name/voice/tone)
 *      - Free customizations during trial
 *      - "Subscribe now" button (100 pts) to extend
 *   4. If expired/paid:
 *      - Customize (30 pts each identity change)
 *      - Hide/show toggle
 *      - Renew subscription button
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Coins, Sparkles, Loader2, EyeOff, Eye, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

export default function AvatarSettings({ user }) {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [pricing, setPricing] = useState(null);
  const [meData, setMeData] = useState(null);
  const [credits, setCredits] = useState(user?.credits || 0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Form fields
  const [shopName, setShopName] = useState('');
  const [avatarName, setAvatarName] = useState('المساعدة');
  const [productsDesc, setProductsDesc] = useState('');
  const [pricingInfo, setPricingInfo] = useState('');
  const [faq, setFaq] = useState('');
  const [voiceId, setVoiceId] = useState('nova');
  const [tone, setTone] = useState('saudi_friendly');

  const tokenH = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return; }
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    if (projectId) loadAvatar(projectId);
  }, [projectId]);

  const loadInitial = async () => {
    setLoading(true);
    try {
      const [pricingR, projR, meR] = await Promise.all([
        fetch(`${API}/api/merchant/avatar/pricing`),
        fetch(`${API}/api/bridge/projects`, { headers: tokenH() }),
        fetch(`${API}/api/auth/me`, { headers: tokenH() }),
      ]);
      if (pricingR.ok) setPricing(await pricingR.json());
      if (projR.ok) {
        const d = await projR.json();
        setProjects(d.projects || []);
        if (d.projects?.length) setProjectId(d.projects[0].id);
      }
      if (meR.ok) { const d = await meR.json(); setCredits(d.credits || 0); }
    } catch (e) { toast.error('فشل التحميل'); }
    setLoading(false);
  };

  const loadAvatar = async (pid) => {
    try {
      const r = await fetch(`${API}/api/merchant/avatar/me?project_id=${pid}`, { headers: tokenH() });
      if (r.ok) {
        const d = await r.json();
        setMeData(d);
        if (d.has_config && d.config) {
          setShopName(d.config.shop_name || '');
          setAvatarName(d.config.avatar_name || 'المساعدة');
          setProductsDesc(d.config.products_description || '');
          setPricingInfo(d.config.pricing_info || '');
          setFaq(d.config.faq || '');
          setVoiceId(d.config.voice_id || 'nova');
          setTone(d.config.tone || 'saudi_friendly');
        } else {
          // reset for new
          const proj = projects.find(p => p.id === pid);
          setShopName(proj?.name || '');
        }
      }
    } catch (e) { /* ignore */ }
  };

  const startTrial = async () => {
    if (!shopName.trim()) { toast.error('اسم المتجر مطلوب'); return; }
    setBusy(true);
    try {
      const r = await fetch(`${API}/api/merchant/avatar/start-trial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...tokenH() },
        body: JSON.stringify({
          project_id: projectId,
          shop_name: shopName.trim(),
          avatar_name: avatarName.trim(),
          products_description: productsDesc.trim(),
          pricing_info: pricingInfo.trim(),
          faq: faq.trim(),
          voice_id: voiceId,
          tone,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || 'فشل');
      toast.success(d.message);
      await loadAvatar(projectId);
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  const saveCustomization = async () => {
    setBusy(true);
    try {
      const r = await fetch(`${API}/api/merchant/avatar/customize`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...tokenH() },
        body: JSON.stringify({
          project_id: projectId,
          avatar_name: avatarName.trim(),
          voice_id: voiceId,
          tone,
          products_description: productsDesc.trim(),
          pricing_info: pricingInfo.trim(),
          faq: faq.trim(),
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || 'فشل');
      if (d.credits_deducted) {
        toast.success(`✓ تم الحفظ — خُصم ${d.credits_deducted} نقطة`);
        setCredits(c => c - d.credits_deducted);
      } else if (d.free_on_trial) {
        toast.success('✓ تم الحفظ (مجاناً خلال التجربة)');
      } else {
        toast.success('✓ تم الحفظ');
      }
      await loadAvatar(projectId);
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  const subscribe = async () => {
    setBusy(true);
    try {
      const r = await fetch(`${API}/api/merchant/avatar/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...tokenH() },
        body: JSON.stringify({ project_id: projectId }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || 'فشل');
      toast.success(d.message);
      setCredits(c => c - d.credits_deducted);
      await loadAvatar(projectId);
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  const toggleHide = async (hidden) => {
    setBusy(true);
    try {
      const r = await fetch(`${API}/api/merchant/avatar/hide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...tokenH() },
        body: JSON.stringify({ project_id: projectId, hidden }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || 'فشل');
      toast.success(hidden ? 'تم إخفاء المساعد' : 'تم إظهار المساعد');
      await loadAvatar(projectId);
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  const status = meData?.status;
  const hasConfig = meData?.has_config;
  const cfg = meData?.config || {};
  const onTrial = cfg.on_trial;

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a12]"><Navbar user={user} transparent />
      <div className="pt-24 text-center text-white">جاري التحميل...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a12]" data-testid="avatar-settings-page">
      <Navbar user={user} transparent />
      <div className="pt-20 max-w-4xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-white mb-1">🤖 إعدادات المساعدة الذكية</h1>
            <p className="text-amber-200/70 text-sm">فعّل مساعدة ذكية في متجرك تتكلم باللهجة السعودية وترد على الزوار</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-400/30 text-amber-300 text-sm font-bold">
            <Coins className="w-4 h-4" />
            <span>{credits}</span> نقطة
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center text-white/70">
            ما عندك متاجر بعد. <button onClick={() => navigate('/websites')} className="text-amber-300 font-bold">أنشئ متجرك الأول</button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label className="text-xs font-bold text-amber-200/80 mb-1.5 block">اختر المتجر</label>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)}
                className="w-full p-3 bg-black/40 border border-white/10 rounded-lg text-white outline-none focus:border-amber-400"
                data-testid="avatar-project-select">
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.slug})</option>
                ))}
              </select>
            </div>

            {/* Pricing info banner */}
            {pricing && !hasConfig && (
              <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-green-500/5 border border-emerald-400/30" data-testid="avatar-pricing-banner">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-6 h-6 text-emerald-300 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-black text-white mb-2">🎁 جرّب مجاناً {pricing.trial_days} يوم!</h3>
                    <ul className="space-y-1 text-sm text-white/80">
                      {pricing.features.map((f, i) => <li key={i}>• {f}</li>)}
                    </ul>
                    <div className="mt-3 text-xs text-emerald-200/80">
                      بعد التجربة: {pricing.monthly_cost} نقطة/شهر · كل تخصيص (اسم/صوت/نبرة): {pricing.customize_cost} نقطة
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Active status banner */}
            {hasConfig && status?.active && (
              <div className={`mb-6 p-4 rounded-2xl border flex items-center justify-between ${onTrial ? 'bg-blue-500/10 border-blue-400/30' : 'bg-emerald-500/10 border-emerald-400/30'}`} data-testid="avatar-status-banner">
                <div>
                  <div className="text-sm font-bold text-white">
                    {onTrial ? '🎁 تجربة مجانية نشطة' : '✓ الاشتراك نشط'}
                  </div>
                  <div className="text-xs text-white/70">{status.days_left} يوم متبقي · ينتهي {new Date(status.expires_at).toLocaleDateString('ar-SA')}</div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={subscribe} disabled={busy} size="sm" className="bg-amber-500 hover:bg-amber-600 text-black font-black" data-testid="avatar-subscribe-btn">
                    <RefreshCw className="w-3.5 h-3.5 me-1" />
                    {onTrial ? `ترقية (${pricing?.monthly_cost} نقطة)` : `تجديد (${pricing?.monthly_cost} نقطة)`}
                  </Button>
                  <Button onClick={() => toggleHide(!cfg.hidden)} disabled={busy} size="sm" variant="outline" data-testid="avatar-hide-toggle">
                    {cfg.hidden ? <><Eye className="w-3.5 h-3.5 me-1"/> إظهار</> : <><EyeOff className="w-3.5 h-3.5 me-1"/> إخفاء</>}
                  </Button>
                </div>
              </div>
            )}

            {hasConfig && !status?.active && (
              <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-400/30 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-red-300">⚠ الاشتراك منتهي</div>
                  <div className="text-xs text-white/70">المساعد مخفي حالياً — جدّد لتفعيله</div>
                </div>
                <Button onClick={subscribe} disabled={busy} className="bg-amber-500 hover:bg-amber-600 text-black font-black">
                  جدّد ({pricing?.monthly_cost} نقطة)
                </Button>
              </div>
            )}

            {/* Form */}
            <div className="space-y-4 p-5 rounded-2xl bg-white/5 border border-white/10">
              <div>
                <label className="text-xs font-bold text-amber-200/80 mb-1.5 block">اسم المتجر *</label>
                <input value={shopName} onChange={(e) => setShopName(e.target.value)} disabled={hasConfig}
                  placeholder="مثال: كافيه كوزي"
                  className="w-full p-2.5 bg-black/40 border border-white/10 focus:border-amber-400 rounded-lg text-sm text-white outline-none disabled:opacity-60"
                  data-testid="avatar-shop-name" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-amber-200/80 mb-1.5 block">
                    اسم المساعدة {hasConfig && !onTrial && <span className="text-amber-400">({pricing?.customize_cost} نقطة)</span>}
                  </label>
                  <input value={avatarName} onChange={(e) => setAvatarName(e.target.value)}
                    placeholder="نور / سارة / المساعدة"
                    className="w-full p-2.5 bg-black/40 border border-white/10 focus:border-amber-400 rounded-lg text-sm text-white outline-none"
                    data-testid="avatar-name-input" />
                </div>
                <div>
                  <label className="text-xs font-bold text-amber-200/80 mb-1.5 block">
                    الصوت {hasConfig && !onTrial && <span className="text-amber-400">({pricing?.customize_cost} نقطة)</span>}
                  </label>
                  <select value={voiceId} onChange={(e) => setVoiceId(e.target.value)}
                    className="w-full p-2.5 bg-black/40 border border-white/10 rounded-lg text-sm text-white outline-none"
                    data-testid="avatar-voice-select">
                    {(pricing?.available_voices || []).map(v => (
                      <option key={v.id} value={v.id}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-amber-200/80 mb-1.5 block">
                  نبرة الكلام {hasConfig && !onTrial && <span className="text-amber-400">({pricing?.customize_cost} نقطة)</span>}
                </label>
                <div className="flex gap-2">
                  {[
                    { id: 'saudi_friendly', label: '🇸🇦 سعودي ودود' },
                    { id: 'formal', label: '👔 فصيح راقٍ' },
                    { id: 'casual', label: '💬 ودود عام' },
                  ].map(t => (
                    <button key={t.id} onClick={() => setTone(t.id)}
                      className={`flex-1 p-2.5 rounded-lg border text-sm transition ${tone === t.id ? 'bg-amber-500/20 border-amber-400 text-white' : 'bg-black/30 border-white/10 text-white/70'}`}
                      data-testid={`avatar-tone-${t.id}`}>{t.label}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-amber-200/80 mb-1.5 block">وصف المنتجات/الخدمات (مجاني دائماً)</label>
                <textarea value={productsDesc} onChange={(e) => setProductsDesc(e.target.value)}
                  placeholder="نقدم قهوة مختصة، حلويات منزلية، إفطار، وعصائر طازجة. مفتوح من 7 ص إلى 12 م."
                  className="w-full min-h-[80px] p-2.5 bg-black/40 border border-white/10 focus:border-amber-400 rounded-lg text-sm text-white outline-none resize-y"
                  dir="rtl" data-testid="avatar-products" />
              </div>

              <div>
                <label className="text-xs font-bold text-amber-200/80 mb-1.5 block">معلومات الأسعار (مجاني)</label>
                <textarea value={pricingInfo} onChange={(e) => setPricingInfo(e.target.value)}
                  placeholder="قهوة من 12-25 ريال. حلويات من 8-35 ريال. عروض صباحية من 7-10 ص."
                  className="w-full min-h-[60px] p-2.5 bg-black/40 border border-white/10 focus:border-amber-400 rounded-lg text-sm text-white outline-none resize-y"
                  dir="rtl" data-testid="avatar-pricing" />
              </div>

              <div>
                <label className="text-xs font-bold text-amber-200/80 mb-1.5 block">الأسئلة المتكررة (مجاني)</label>
                <textarea value={faq} onChange={(e) => setFaq(e.target.value)}
                  placeholder="س: هل عندكم توصيل؟ ج: نعم، داخل الرياض فقط، رسوم 15 ر.س."
                  className="w-full min-h-[80px] p-2.5 bg-black/40 border border-white/10 focus:border-amber-400 rounded-lg text-sm text-white outline-none resize-y"
                  dir="rtl" data-testid="avatar-faq" />
              </div>

              {!hasConfig ? (
                <Button onClick={startTrial} disabled={busy} className="w-full h-12 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-black text-base" data-testid="avatar-start-trial-btn">
                  {busy ? <Loader2 className="w-5 h-5 me-2 animate-spin" /> : <Sparkles className="w-5 h-5 me-2" />}
                  🎁 ابدأ التجربة المجانية ({pricing?.trial_days} يوم)
                </Button>
              ) : (
                <Button onClick={saveCustomization} disabled={busy} className="w-full h-12 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black" data-testid="avatar-save-btn">
                  {busy ? <Loader2 className="w-5 h-5 me-2 animate-spin" /> : '💾 حفظ التغييرات'}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
