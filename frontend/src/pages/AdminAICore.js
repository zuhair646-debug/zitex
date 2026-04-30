/**
 * AdminAICore — the owner's control center for AI costs, caching, and user tiers.
 * Route: /admin/ai-core
 *
 * Sections:
 *   - Platform KPIs (total cost, cache savings, requests)
 *   - By-tier breakdown (cheap/standard/premium/cache)
 *   - Top consumers table (with "is_losing" red badges)
 *   - Cache stats (top cached questions)
 *   - Set user tier modal
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Zap, AlertTriangle, Database, TrendingDown, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

const TIER_COLORS = {
  cheap: 'bg-green-500/20 text-green-300 border-green-400/40',
  standard: 'bg-blue-500/20 text-blue-300 border-blue-400/40',
  premium: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
  cache: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
};

const TIER_LABEL = {
  cheap: 'رخيص',
  standard: 'متوسط',
  premium: 'فاخر',
  cache: 'كاش',
};

export default function AdminAICore({ user }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [cacheStats, setCacheStats] = useState(null);
  const [tiers, setTiers] = useState({});
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [tierModal, setTierModal] = useState(null); // {user_id, email, current_tier}

  const tokenH = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return; }
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, navigate]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [statsR, cacheR, tiersR] = await Promise.all([
        fetch(`${API}/api/ai-core/admin/stats?days=${days}`, { headers: tokenH() }),
        fetch(`${API}/api/ai-core/admin/cache/stats`, { headers: tokenH() }),
        fetch(`${API}/api/ai-core/tiers`),
      ]);
      if (statsR.ok) setStats(await statsR.json());
      if (cacheR.ok) setCacheStats(await cacheR.json());
      if (tiersR.ok) {
        const d = await tiersR.json();
        setTiers(d.tiers);
      }
    } catch (e) { toast.error('فشل التحميل'); }
    setLoading(false);
  };

  const saveTier = async (newTier) => {
    try {
      const r = await fetch(`${API}/api/ai-core/admin/set-tier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...tokenH() },
        body: JSON.stringify({ user_id: tierModal.user_id, tier: newTier }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || 'فشل');
      toast.success(`✓ تم تغيير الـtier إلى ${tiers[newTier]?.label}`);
      setTierModal(null);
      loadAll();
    } catch (e) { toast.error(e.message); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a12]"><Navbar user={user} transparent />
      <div className="pt-24 text-center text-white">جاري التحميل...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a12]" data-testid="admin-ai-core-page">
      <Navbar user={user} transparent />
      <div className="pt-20 max-w-7xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-white mb-1">⚡ AI Core — مركز التحكم بالتكاليف</h1>
            <p className="text-amber-200/70 text-sm">مراقبة تكاليف الذكاء الاصطناعي، الكاش، ومستوى كل مستخدم</p>
          </div>
          <div className="flex gap-2">
            <select value={days} onChange={(e) => setDays(Number(e.target.value))}
              className="px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-sm text-white outline-none"
              data-testid="ai-core-period-select">
              <option value={1}>24 ساعة</option>
              <option value={7}>7 أيام</option>
              <option value={30}>30 يوم</option>
              <option value={90}>90 يوم</option>
            </select>
            <Button onClick={loadAll} variant="outline" size="sm" data-testid="ai-core-refresh">
              <RefreshCw className="w-3.5 h-3.5 me-1" /> تحديث
            </Button>
          </div>
        </div>

        {stats && (
          <>
            {/* Top KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/15 to-cyan-500/5 border border-blue-400/30" data-testid="kpi-requests">
                <div className="text-[10px] uppercase text-blue-200/70 font-bold mb-1">إجمالي الطلبات</div>
                <div className="text-3xl font-black text-white">{stats.total_requests.toLocaleString()}</div>
                <div className="text-xs text-blue-200/60 mt-1">آخر {stats.period_days} يوم</div>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 to-yellow-500/5 border border-amber-400/30" data-testid="kpi-cache-savings">
                <div className="text-[10px] uppercase text-amber-200/70 font-bold mb-1">توفير الكاش</div>
                <div className="text-3xl font-black text-amber-300">{stats.cache_savings_pct}%</div>
                <div className="text-xs text-amber-200/60 mt-1">{stats.cached_requests.toLocaleString()} طلب مجاني</div>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-green-500/5 border border-emerald-400/30" data-testid="kpi-cost-sar">
                <div className="text-[10px] uppercase text-emerald-200/70 font-bold mb-1">التكلفة الفعلية</div>
                <div className="text-3xl font-black text-emerald-300">{stats.total_cost_sar}</div>
                <div className="text-xs text-emerald-200/60 mt-1">ر.س · ${stats.total_cost_usd}</div>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/15 to-violet-500/5 border border-purple-400/30" data-testid="kpi-paid-requests">
                <div className="text-[10px] uppercase text-purple-200/70 font-bold mb-1">طلبات مدفوعة</div>
                <div className="text-3xl font-black text-purple-300">{stats.paid_requests.toLocaleString()}</div>
                <div className="text-xs text-purple-200/60 mt-1">لم تُستفد من الكاش</div>
              </div>
            </div>

            {/* By tier breakdown */}
            <div className="mb-6 p-5 rounded-2xl bg-white/5 border border-white/10" data-testid="tier-breakdown">
              <h3 className="text-lg font-black text-white mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-300" />
                التوزيع حسب نوع النموذج
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['cache', 'cheap', 'standard', 'premium'].map(tier => {
                  const d = stats.by_tier[tier] || { count: 0, cost_sar: 0, cost_usd: 0 };
                  return (
                    <div key={tier} className={`p-3 rounded-xl border ${TIER_COLORS[tier]}`} data-testid={`tier-${tier}`}>
                      <div className="text-xs font-black uppercase tracking-wide mb-1">{TIER_LABEL[tier]}</div>
                      <div className="text-2xl font-black">{d.count.toLocaleString()}</div>
                      <div className="text-[10px] opacity-70">{d.cost_sar} ر.س · ${d.cost_usd}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top consumers */}
            <div className="mb-6 p-5 rounded-2xl bg-white/5 border border-white/10" data-testid="top-consumers-section">
              <h3 className="text-lg font-black text-white mb-3 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-300" />
                أعلى المستخدمين استهلاكاً
              </h3>
              {stats.top_consumers.length === 0 ? (
                <div className="text-white/60 text-sm">لا يوجد استهلاك مسجّل بعد</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-[10px] uppercase text-white/50 border-b border-white/10">
                      <tr>
                        <th className="text-right p-2">المستخدم</th>
                        <th className="p-2">Tier</th>
                        <th className="p-2">الطلبات</th>
                        <th className="p-2">التكلفة</th>
                        <th className="p-2">الإيراد</th>
                        <th className="p-2">الهامش</th>
                        <th className="p-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.top_consumers.map(c => (
                        <tr key={c.user_id} className={`border-b border-white/5 ${c.is_losing ? 'bg-red-500/5' : ''}`} data-testid={`consumer-${c.user_id.slice(0, 8)}`}>
                          <td className="p-2 text-right">
                            <div className="font-bold text-white">{c.name || c.email.split('@')[0]}</div>
                            <div className="text-[10px] text-white/50">{c.email}</div>
                          </td>
                          <td className="p-2 text-center">
                            <span className="inline-block px-2 py-0.5 rounded-full bg-black/40 text-amber-300 text-[10px] font-bold">
                              {tiers[c.tier]?.label || c.tier}
                            </span>
                          </td>
                          <td className="p-2 text-center font-bold">{c.requests}</td>
                          <td className="p-2 text-center text-red-300 font-bold">{c.cost_sar} ر.س</td>
                          <td className="p-2 text-center text-emerald-300">{c.tier_revenue_sar} ر.س</td>
                          <td className={`p-2 text-center font-black ${c.is_losing ? 'text-red-400' : 'text-emerald-400'}`}>
                            {c.is_losing && <AlertTriangle className="w-3 h-3 inline me-1" />}
                            {c.margin_sar} ر.س
                          </td>
                          <td className="p-2 text-center">
                            <Button size="sm" variant="outline" onClick={() => setTierModal({ user_id: c.user_id, email: c.email, current_tier: c.tier })}
                              className="text-[10px] h-7 px-2" data-testid={`set-tier-${c.user_id.slice(0, 8)}`}>
                              تغيير Tier
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Cache stats */}
        {cacheStats && (
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10" data-testid="cache-section">
            <h3 className="text-lg font-black text-white mb-3 flex items-center gap-2">
              <Database className="w-5 h-5 text-amber-300" />
              إحصائيات الكاش
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-black/30">
                <div className="text-[10px] uppercase text-white/50">إجمالي المداخل المحفوظة</div>
                <div className="text-2xl font-black text-white">{cacheStats.total_cached_entries}</div>
              </div>
              <div className="p-3 rounded-xl bg-black/30">
                <div className="text-[10px] uppercase text-white/50">إجمالي مرات الاستفادة</div>
                <div className="text-2xl font-black text-amber-300">{cacheStats.total_cache_hits}</div>
              </div>
            </div>
            {cacheStats.top_cached_questions?.length > 0 && (
              <div>
                <div className="text-xs font-bold text-white/70 mb-2">أكثر الأسئلة تكراراً:</div>
                <div className="space-y-1.5">
                  {cacheStats.top_cached_questions.map((q, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-black/20 text-xs">
                      <span className="text-amber-300 font-black w-6">#{i + 1}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${TIER_COLORS[q.model_tier] || TIER_COLORS.standard}`}>
                        {TIER_LABEL[q.model_tier] || q.model_tier}
                      </span>
                      <span className="flex-1 text-white/80 truncate" dir="rtl">{q.sample_question}</span>
                      <span className="text-emerald-300 font-bold">{q.hits} مرة</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tier change modal */}
        {tierModal && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setTierModal(null)} data-testid="tier-modal">
            <div className="bg-[#1a1a22] rounded-2xl border border-white/10 p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-black text-white mb-1">تغيير Tier المستخدم</h3>
              <p className="text-xs text-white/60 mb-4">{tierModal.email}</p>
              <div className="space-y-2">
                {Object.entries(tiers).map(([id, t]) => (
                  <button key={id} onClick={() => saveTier(id)}
                    className={`w-full p-3 rounded-xl border text-right transition ${tierModal.current_tier === id ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-black/30 border-white/10 text-white hover:border-white/30'}`}
                    data-testid={`tier-option-${id}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-black">{t.label}</span>
                      <span className="text-amber-300 font-bold">{t.price_sar} ر.س/شهر</span>
                    </div>
                    <div className="text-[10px] text-white/60 mt-1">
                      {t.chat_msgs} رسالة · {t.images} صورة · {t.videos} فيديو · {t.rate_per_min}/دقيقة
                    </div>
                  </button>
                ))}
              </div>
              <Button onClick={() => setTierModal(null)} variant="outline" className="w-full mt-4" data-testid="tier-modal-close">
                إلغاء
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
