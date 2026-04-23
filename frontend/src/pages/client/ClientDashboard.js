import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  LogIn, Eye, EyeOff, LogOut, ExternalLink, Users, MessageSquare, BarChart3,
  Edit3, Save, X, RefreshCw, Check, Key, CheckCircle2, Copy, Lock, MapPin,
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const authH = (token) => ({ Authorization: `ClientToken ${token}` });

/* ================================================================
   LOGIN — terse & friendly
   ================================================================ */
function LoginCard({ slug, onLoggedIn }) {
  const [pwd, setPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState(null); // project info fetched by slug

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch(`${API}/api/websites/public/${slug}/info`);
        if (r.ok) {
          const d = await r.json();
          if (mounted) setInfo(d);
        }
      } catch (_) {}
    })();
    return () => { mounted = false; };
  }, [slug]);

  const submit = async (e) => {
    e?.preventDefault();
    if (!pwd) return;
    setBusy(true); setErr('');
    try {
      const r = await fetch(`${API}/api/websites/client/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, password: pwd }),
      });
      const d = await r.json();
      if (!r.ok) { setErr(d.detail || 'فشل تسجيل الدخول'); return; }
      localStorage.setItem(`zx_client_token_${slug}`, d.token);
      onLoggedIn(d.token);
      toast.success(`مرحباً بك في ${d.name}`);
    } catch (_) { setErr('تعذّر الاتصال'); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050815] via-[#0b0f1f] to-[#050815] flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md bg-[#0e1128]/90 backdrop-blur border border-yellow-500/20 rounded-3xl p-6 md:p-8 shadow-[0_30px_80px_rgba(234,179,8,0.1)]" data-testid="client-login-card">
        <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl mb-4 mx-auto shadow-xl">
          <Lock className="w-7 h-7 text-black" />
        </div>
        <h1 className="text-2xl font-bold text-center mb-1 text-white" data-testid="client-login-title">لوحة تحكم موقعك</h1>
        <p className="text-sm text-center opacity-60 text-white mb-6">
          {info?.name ? `${info.name} — إدارة خاصة بالعميل` : 'سجّل دخولك لإدارة موقعك'}
        </p>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs opacity-70 block mb-1 text-white">اسم الموقع</label>
            <div className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white/70 text-sm font-mono" data-testid="client-login-slug">{slug}</div>
          </div>
          <div>
            <label className="text-xs opacity-70 block mb-1 text-white">كلمة المرور</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="••••••••"
                autoFocus
                data-testid="client-login-password"
              />
              <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white" data-testid="client-login-toggle-pwd">
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {err && <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2" data-testid="client-login-error">{err}</div>}
          <button
            type="submit"
            disabled={busy || !pwd}
            className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-xl transition"
            data-testid="client-login-submit"
          >
            {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            {busy ? 'جاري الدخول...' : 'دخول'}
          </button>
        </form>
        <div className="mt-4 text-center text-xs text-white/40">كلمة المرور حصلت عليها من صانع الموقع. للاستفسار تواصل معه.</div>
      </div>
    </div>
  );
}

/* ================================================================
   STATS BAR
   ================================================================ */
function Stat({ icon: Icon, label, value, accent = 'text-yellow-400' }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3" data-testid={`stat-${label}`}>
      <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${accent}`}><Icon className="w-5 h-5" /></div>
      <div>
        <div className="text-[11px] opacity-60">{label}</div>
        <div className="text-xl font-black">{value}</div>
      </div>
    </div>
  );
}

/* ================================================================
   SECTIONS EDITOR — inline text patches
   ================================================================ */
function SectionsEditor({ project, token, onUpdated }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  const [busy, setBusy] = useState(false);

  const startEdit = (s) => {
    setEditingId(s.id);
    setDraft({ ...(s.data || {}) });
  };
  const cancel = () => { setEditingId(null); setDraft({}); };

  const save = async (s) => {
    setBusy(true);
    try {
      const r = await fetch(`${API}/api/websites/client/sections/${s.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authH(token) },
        body: JSON.stringify({ data: draft }),
      });
      if (!r.ok) throw new Error();
      toast.success('تم الحفظ');
      setEditingId(null);
      onUpdated();
    } catch (_) { toast.error('فشل الحفظ'); }
    finally { setBusy(false); }
  };

  const toggleVisible = async (s) => {
    setBusy(true);
    try {
      await fetch(`${API}/api/websites/client/sections/${s.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authH(token) },
        body: JSON.stringify({ visible: !(s.visible !== false) }),
      });
      onUpdated();
    } catch (_) {}
    finally { setBusy(false); }
  };

  const EDITABLE_FIELDS = ['title', 'subtitle', 'text', 'cta_text', 'brand', 'description', 'address'];

  return (
    <div className="space-y-2" data-testid="sections-editor">
      {(project?.sections || []).map((s) => {
        const data = s.data || {};
        const isEditing = editingId === s.id;
        const editableKeys = EDITABLE_FIELDS.filter((k) => k in data || ['hero', 'about', 'cta', 'footer', 'contact', 'banner'].includes(s.type));
        return (
          <div key={s.id} className={`rounded-xl border p-3 md:p-4 ${isEditing ? 'bg-yellow-500/5 border-yellow-500/40' : 'bg-white/3 border-white/10'}`} data-testid={`section-row-${s.type}`}>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-300 rounded-full font-bold">{s.type}</span>
                <span className="text-sm font-bold">{data.title || data.brand || '—'}</span>
                {s.visible === false && <span className="text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-300 rounded">مخفي</span>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => toggleVisible(s)} disabled={busy} className="p-1.5 hover:bg-white/10 rounded-lg text-xs" title={s.visible === false ? 'إظهار' : 'إخفاء'} data-testid={`toggle-visible-${s.type}`}>
                  {s.visible === false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                {!isEditing ? (
                  <button onClick={() => startEdit(s)} className="p-1.5 hover:bg-white/10 rounded-lg text-yellow-400" data-testid={`edit-btn-${s.type}`}>
                    <Edit3 className="w-4 h-4" />
                  </button>
                ) : (
                  <>
                    <button onClick={cancel} className="p-1.5 hover:bg-white/10 rounded-lg text-red-400" data-testid={`cancel-edit-${s.type}`}>
                      <X className="w-4 h-4" />
                    </button>
                    <button onClick={() => save(s)} disabled={busy} className="p-1.5 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-300" data-testid={`save-edit-${s.type}`}>
                      {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </button>
                  </>
                )}
              </div>
            </div>
            {isEditing && (
              <div className="mt-3 space-y-2" data-testid={`edit-form-${s.type}`}>
                {editableKeys.map((k) => (
                  <div key={k}>
                    <label className="text-[11px] opacity-60 block mb-1">{k}</label>
                    <input
                      value={draft[k] ?? ''}
                      onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500"
                      data-testid={`edit-input-${s.type}-${k}`}
                    />
                  </div>
                ))}
                {editableKeys.length === 0 && <div className="text-xs opacity-60">هذا القسم يحتاج تعديل متقدم — تواصل مع صانع الموقع.</div>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ================================================================
   MESSAGES INBOX
   ================================================================ */
function MessagesTab({ token }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/websites/client/messages`, { headers: authH(token) });
      const d = await r.json();
      setMessages(d.messages || []);
    } catch (_) {} finally { setLoading(false); }
  }, [token]);
  useEffect(() => { load(); }, [load]);

  const markRead = async (id) => {
    try {
      await fetch(`${API}/api/websites/client/messages/${id}/read`, { method: 'POST', headers: authH(token) });
      load();
    } catch (_) {}
  };

  return (
    <div data-testid="messages-tab">
      {loading ? (
        <div className="text-center py-10 opacity-60">جاري التحميل...</div>
      ) : messages.length === 0 ? (
        <div className="text-center py-12 bg-white/3 border border-dashed border-white/15 rounded-2xl">
          <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <div className="text-sm opacity-60">لا توجد رسائل من عملائك بعد</div>
          <div className="text-xs opacity-40 mt-1">الرسائل المرسلة عبر نموذج "تواصل معنا" ستظهر هنا</div>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((m) => (
            <div key={m.id} className={`rounded-xl border p-3 ${m.read ? 'bg-white/3 border-white/10' : 'bg-yellow-500/5 border-yellow-500/30'}`} data-testid={`message-${m.id}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold">{m.name}</span>
                    {m.phone && <span className="text-xs opacity-70">📞 {m.phone}</span>}
                    {m.email && <span className="text-xs opacity-70">✉️ {m.email}</span>}
                    {!m.read && <span className="text-[10px] px-1.5 py-0.5 bg-yellow-500 text-black rounded-full font-black">جديد</span>}
                  </div>
                  <div className="text-sm mt-1 opacity-90 whitespace-pre-wrap">{m.message}</div>
                  <div className="text-[10px] opacity-50 mt-1">{new Date(m.at).toLocaleString('ar-SA')}</div>
                </div>
                {!m.read && (
                  <button onClick={() => markRead(m.id)} className="p-1.5 hover:bg-white/10 rounded-lg" title="تمّت القراءة" data-testid={`mark-read-${m.id}`}>
                    <Check className="w-4 h-4 text-green-400" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   CHANGE PASSWORD
   ================================================================ */
function PasswordTab({ token }) {
  const [oldP, setOldP] = useState('');
  const [newP, setNewP] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch(`${API}/api/websites/client/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authH(token) },
        body: JSON.stringify({ old_password: oldP, new_password: newP }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || 'فشل');
      toast.success('تم تغيير كلمة المرور');
      setOldP(''); setNewP('');
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="max-w-sm space-y-3" data-testid="password-tab">
      <div>
        <label className="text-xs opacity-70 block mb-1">كلمة المرور الحالية</label>
        <input type="password" value={oldP} onChange={(e) => setOldP(e.target.value)} className="w-full px-3 py-2.5 bg-white/5 border border-white/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" required data-testid="password-old" />
      </div>
      <div>
        <label className="text-xs opacity-70 block mb-1">كلمة مرور جديدة (6 أحرف على الأقل)</label>
        <input type="password" value={newP} onChange={(e) => setNewP(e.target.value)} minLength={6} className="w-full px-3 py-2.5 bg-white/5 border border-white/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" required data-testid="password-new" />
      </div>
      <button type="submit" disabled={busy} className="w-full py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2" data-testid="password-submit">
        <Key className="w-4 h-4" />{busy ? 'جاري الحفظ...' : 'تغيير كلمة المرور'}
      </button>
    </form>
  );
}

/* ================================================================
   SUPPORT TICKETS TAB
   ================================================================ */
function SupportTab({ token }) {
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState({ subject: '', description: '', category: 'general' });
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/websites/client/support-tickets`, { headers: authH(token) });
      const d = await r.json();
      setTickets(d.tickets || []);
    } catch (_) {}
  }, [token]);
  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) return;
    setBusy(true);
    try {
      const r = await fetch(`${API}/api/websites/client/support-tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authH(token) },
        body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error();
      toast.success('✅ تم إرسال طلب الدعم — سيتم التواصل معك');
      setForm({ subject: '', description: '', category: 'general' });
      setShowForm(false);
      load();
    } catch (_) { toast.error('فشل الإرسال'); }
    finally { setBusy(false); }
  };

  const CATEGORIES = [
    { id: 'general',  label: '💬 استفسار عام' },
    { id: 'bug',      label: '🐛 خطأ / مشكلة' },
    { id: 'content',  label: '📝 تعديل محتوى' },
    { id: 'design',   label: '🎨 تعديل تصميم' },
    { id: 'other',    label: '❓ أخرى' },
  ];

  return (
    <div data-testid="support-tab">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs opacity-70">{tickets.length} طلب سابق</div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-lg text-xs font-black" data-testid="new-ticket-btn">
            + طلب دعم جديد
          </button>
        )}
      </div>
      {showForm && (
        <form onSubmit={submit} className="bg-white/5 border border-yellow-500/30 rounded-xl p-3 mb-3 space-y-2" data-testid="ticket-form">
          <div>
            <label className="text-[11px] opacity-70 block mb-1">نوع الطلب</label>
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.map((c) => (
                <button type="button" key={c.id} onClick={() => setForm({ ...form, category: c.id })}
                  className={`px-2 py-1 rounded-full text-[10px] font-bold border ${form.category === c.id ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-white/5 border-white/15'}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="عنوان مختصر" className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-lg text-sm" required data-testid="ticket-subject" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="اشرح المطلوب بالتفصيل..." rows={4} className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-lg text-sm" required data-testid="ticket-description" />
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 bg-white/10 rounded-lg text-xs font-bold">إلغاء</button>
            <button type="submit" disabled={busy} className="flex-[2] py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-lg text-xs font-black disabled:opacity-50" data-testid="submit-ticket">
              {busy ? 'جاري الإرسال...' : '📤 إرسال الطلب'}
            </button>
          </div>
        </form>
      )}
      {tickets.length === 0 && !showForm ? (
        <div className="text-center py-10 bg-white/3 border border-dashed border-white/15 rounded-2xl">
          <div className="text-sm opacity-60">لا توجد طلبات دعم بعد</div>
          <div className="text-xs opacity-40 mt-1">اضغط "طلب دعم جديد" لتسجيل ملاحظة أو طلب تعديل</div>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <div key={t.id} className="bg-white/5 border border-white/10 rounded-xl p-3" data-testid={`ticket-${t.id}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="font-bold text-sm">{t.subject}</div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${t.status === 'open' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'}`}>
                  {t.status === 'open' ? (t.reply ? '💬 تم الرد' : '⏳ قيد المراجعة') : '✓ منتهي'}
                </span>
              </div>
              <div className="text-xs opacity-80 mt-1 whitespace-pre-wrap">{t.description}</div>
              <div className="text-[10px] opacity-50 mt-1">{new Date(t.at).toLocaleString('ar-SA')} · {t.category}</div>
              {t.reply && (
                <div className="mt-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg" data-testid={`ticket-reply-${t.id}`}>
                  <div className="text-[10px] font-bold text-green-300 mb-1">💬 رد المالك:</div>
                  <div className="text-xs whitespace-pre-wrap">{t.reply}</div>
                  {t.replied_at && <div className="text-[9px] opacity-50 mt-1">{new Date(t.replied_at).toLocaleString('ar-SA')}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   ORDERS TAB — owner views & manages orders from their site
   ================================================================ */
function OrdersTab({ token }) {
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [oR, dR] = await Promise.all([
        fetch(`${API}/api/websites/client/orders${filter ? `?status=${filter}` : ''}`, { headers: authH(token) }),
        fetch(`${API}/api/websites/client/drivers`, { headers: authH(token) }),
      ]);
      const oD = await oR.json(); const dD = await dR.json();
      setOrders(oD.orders || []); setDrivers(dD.drivers || []);
    } catch (_) {} finally { setLoading(false); }
  }, [token, filter]);
  useEffect(() => { load(); }, [load]);

  const setStatus = async (id, status, driverId = null) => {
    try {
      const r = await fetch(`${API}/api/websites/client/orders/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authH(token) },
        body: JSON.stringify({ status, driver_id: driverId }),
      });
      const d = await r.json();
      toast.success('تم التحديث');
      // 🆕 auto-open WhatsApp link if present
      if (d.whatsapp_link) window.open(d.whatsapp_link, '_blank');
      load();
    } catch (_) { toast.error('فشل'); }
  };

  const STATUS_LABELS = { pending: '⏳ قيد المراجعة', accepted: '✓ مقبول', preparing: '👨‍🍳 قيد التحضير', ready: '📦 جاهز', on_the_way: '🛵 في الطريق', delivered: '✅ تم التوصيل', cancelled: '❌ ملغي' };
  const STATUS_COLORS = { pending: 'bg-yellow-500/20 text-yellow-300', accepted: 'bg-blue-500/20 text-blue-300', preparing: 'bg-orange-500/20 text-orange-300', ready: 'bg-purple-500/20 text-purple-300', on_the_way: 'bg-cyan-500/20 text-cyan-300', delivered: 'bg-green-500/20 text-green-300', cancelled: 'bg-red-500/20 text-red-300' };

  return (
    <div data-testid="orders-tab">
      <div className="flex gap-1 flex-wrap mb-3">
        {['', 'pending', 'accepted', 'preparing', 'on_the_way', 'delivered', 'cancelled'].map((s) => (
          <button key={s || 'all'} onClick={() => setFilter(s)} className={`text-[11px] px-2.5 py-1 rounded-full font-bold ${filter === s ? 'bg-yellow-500 text-black' : 'bg-white/5 hover:bg-white/10'}`} data-testid={`filter-${s || 'all'}`}>
            {s ? STATUS_LABELS[s] : 'الكل'}
          </button>
        ))}
      </div>
      {loading ? <div className="text-center py-10 opacity-60">جاري التحميل...</div> : orders.length === 0 ? (
        <div className="text-center py-12 bg-white/3 border border-dashed border-white/15 rounded-2xl">
          <div className="text-4xl mb-2">🛒</div>
          <div className="text-sm opacity-60">لا توجد طلبات بعد</div>
          <div className="text-xs opacity-40 mt-1">طلبات عملاء الموقع ستظهر هنا مباشرة</div>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((o) => {
            const drv = drivers.find((d) => d.id === o.driver_id);
            return (
              <div key={o.id} className="bg-white/5 border border-white/10 rounded-xl p-3" data-testid={`order-${o.id}`}>
                <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">#{o.id.slice(0, 8)}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${STATUS_COLORS[o.status] || 'bg-white/10'}`}>{STATUS_LABELS[o.status] || o.status}</span>
                  </div>
                  <div className="text-xs font-black text-yellow-400">{o.total} ر.س</div>
                </div>
                <div className="text-xs opacity-90 mb-1">{o.customer_name} · 📞 {o.customer_phone}</div>
                <div className="text-[11px] opacity-70 mb-1">📍 {o.address || (o.lat ? `(${o.lat.toFixed(4)}, ${o.lng.toFixed(4)})` : 'لا عنوان')}</div>
                <div className="text-[11px] opacity-70 mb-2">{o.items.map((i) => `${i.name} ×${i.qty}`).join(' · ')}</div>
                {o.note && <div className="text-[11px] bg-yellow-500/10 border border-yellow-500/20 rounded px-2 py-1 mb-2">📝 {o.note}</div>}
                <div className="flex gap-1 flex-wrap">
                  {o.status === 'pending' && <button onClick={() => setStatus(o.id, 'accepted')} className="text-[11px] px-2 py-1 bg-blue-500/20 hover:bg-blue-500/40 rounded font-bold" data-testid={`accept-${o.id}`}>✓ قبول</button>}
                  {o.status === 'accepted' && <button onClick={() => setStatus(o.id, 'preparing')} className="text-[11px] px-2 py-1 bg-orange-500/20 hover:bg-orange-500/40 rounded font-bold">👨‍🍳 تحضير</button>}
                  {o.status === 'preparing' && <button onClick={() => setStatus(o.id, 'ready')} className="text-[11px] px-2 py-1 bg-purple-500/20 hover:bg-purple-500/40 rounded font-bold">📦 جاهز</button>}
                  {['ready', 'accepted'].includes(o.status) && drivers.length > 0 && (
                    <select onChange={(e) => setStatus(o.id, 'on_the_way', e.target.value)} className="text-[11px] px-2 py-1 bg-cyan-500/20 rounded font-bold" data-testid={`assign-driver-${o.id}`}>
                      <option>🛵 عيّن سائق</option>
                      {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  )}
                  {o.status === 'on_the_way' && <button onClick={() => setStatus(o.id, 'delivered')} className="text-[11px] px-2 py-1 bg-green-500/20 hover:bg-green-500/40 rounded font-bold">✅ تم التوصيل</button>}
                  {!['delivered', 'cancelled'].includes(o.status) && <button onClick={() => setStatus(o.id, 'cancelled')} className="text-[11px] px-2 py-1 bg-red-500/20 hover:bg-red-500/40 rounded font-bold">❌ إلغاء</button>}
                  {drv && <span className="text-[11px] opacity-70 self-center">🛵 {drv.name}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   DRIVERS TAB — manage delivery drivers
   ================================================================ */
function DriversTab({ token }) {
  const [drivers, setDrivers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', password: '', vehicle: '', zone: '' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/websites/client/drivers`, { headers: authH(token) });
      const d = await r.json();
      setDrivers(d.drivers || []);
    } catch (_) {}
  }, [token]);
  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch(`${API}/api/websites/client/drivers`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authH(token) },
        body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error((await r.json()).detail || 'فشل');
      toast.success('✓ أُضيف السائق');
      setForm({ name: '', phone: '', password: '', vehicle: '', zone: '' });
      setShowForm(false); load();
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const remove = async (id) => {
    if (!window.confirm('حذف السائق؟')) return;
    try {
      await fetch(`${API}/api/websites/client/drivers/${id}`, { method: 'DELETE', headers: authH(token) });
      toast.success('حُذف'); load();
    } catch (_) {}
  };

  return (
    <div data-testid="drivers-tab">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs opacity-70">{drivers.length} سائق مسجّل</div>
        {!showForm && <button onClick={() => setShowForm(true)} className="px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-lg text-xs font-black" data-testid="add-driver-btn">+ إضافة سائق</button>}
      </div>
      {showForm && (
        <form onSubmit={submit} className="bg-white/5 border border-yellow-500/30 rounded-xl p-3 mb-3 space-y-2" data-testid="driver-form">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="اسم السائق" className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-lg text-sm" required data-testid="driver-name" />
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="رقم الجوال" className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-lg text-sm" required data-testid="driver-phone" />
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="كلمة مرور له" className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-lg text-sm" required data-testid="driver-password" />
          <input value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })} placeholder="المركبة (دراجة/سيارة)" className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-lg text-sm" />
          <input value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} placeholder="منطقة التوصيل" className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-lg text-sm" />
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 bg-white/10 rounded-lg text-xs font-bold">إلغاء</button>
            <button type="submit" disabled={busy} className="flex-[2] py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-lg text-xs font-black disabled:opacity-50">✓ إضافة</button>
          </div>
        </form>
      )}
      {drivers.length === 0 && !showForm ? (
        <div className="text-center py-10 bg-white/3 border border-dashed border-white/15 rounded-2xl">
          <div className="text-4xl mb-2">🛵</div>
          <div className="text-sm opacity-60">لا يوجد سائقون مسجّلون</div>
          <div className="text-xs opacity-40 mt-1">أضف سائقاً ليظهر في خيارات تعيين الطلبات</div>
        </div>
      ) : (
        <div className="space-y-2">
          {drivers.map((d) => (
            <div key={d.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3" data-testid={`driver-${d.id}`}>
              <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center text-xl">🛵</div>
              <div className="flex-1">
                <div className="font-bold text-sm">{d.name}</div>
                <div className="text-xs opacity-70">📞 {d.phone}{d.vehicle ? ` · ${d.vehicle}` : ''}{d.zone ? ` · ${d.zone}` : ''}</div>
              </div>
              <button onClick={() => remove(d.id)} className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-400"><X className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   CUSTOMERS TAB — site customer directory
   ================================================================ */
function CustomersTab({ token }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API}/api/websites/client/customers`, { headers: authH(token) });
        const d = await r.json();
        setCustomers(d.customers || []);
      } catch (_) {} finally { setLoading(false); }
    })();
  }, [token]);

  return (
    <div data-testid="customers-tab">
      <div className="text-xs opacity-70 mb-3">{customers.length} عميل مسجّل</div>
      {loading ? <div className="text-center py-10 opacity-60">...</div> : customers.length === 0 ? (
        <div className="text-center py-10 bg-white/3 border border-dashed border-white/15 rounded-2xl">
          <div className="text-4xl mb-2">👥</div>
          <div className="text-sm opacity-60">لا عملاء مسجّلون بعد</div>
          <div className="text-xs opacity-40 mt-1">عندما يُنشئ الزوار حسابات في موقعك ستظهر هنا</div>
        </div>
      ) : (
        <div className="space-y-2">
          {customers.map((c) => (
            <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3" data-testid={`customer-${c.id}`}>
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center font-black">{(c.name || '?').charAt(0)}</div>
              <div className="flex-1">
                <div className="font-bold text-sm">{c.name}</div>
                <div className="text-xs opacity-70">📞 {c.phone}{c.email ? ` · ✉️ ${c.email}` : ''}</div>
                <div className="text-[10px] opacity-50">مسجّل منذ {new Date(c.created_at).toLocaleDateString('ar-SA')}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   DELIVERY SETTINGS TAB
   ================================================================ */
function DeliverySettingsTab({ token, slug }) {
  const [s, setS] = useState({ base_lat: '', base_lng: '', base_fee: 10, fee_per_km: 2, free_delivery_above: 200 });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API}/api/websites/client/delivery-settings`, { headers: authH(token) });
        const d = await r.json();
        setS({ ...s, ...d });
      } catch (_) {}
    })();
    // eslint-disable-next-line
  }, [token]);

  const useMyLoc = () => {
    if (!navigator.geolocation) return toast.error('متصفحك لا يدعم تحديد الموقع');
    navigator.geolocation.getCurrentPosition((p) => {
      setS((prev) => ({ ...prev, base_lat: p.coords.latitude, base_lng: p.coords.longitude }));
      toast.success('✓ تم تحديد موقع المتجر');
    }, () => toast.error('فشل'));
  };

  const save = async () => {
    setBusy(true);
    try {
      await fetch(`${API}/api/websites/client/delivery-settings`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authH(token) },
        body: JSON.stringify({
          base_lat: s.base_lat ? parseFloat(s.base_lat) : null,
          base_lng: s.base_lng ? parseFloat(s.base_lng) : null,
          base_fee: parseFloat(s.base_fee) || 0,
          fee_per_km: parseFloat(s.fee_per_km) || 0,
          free_delivery_above: parseFloat(s.free_delivery_above) || 0,
        }),
      });
      toast.success('✓ تم الحفظ');
    } catch (_) { toast.error('فشل'); }
    finally { setBusy(false); }
  };

  const driverUrl = `${window.location.origin}/driver/${slug}`;

  return (
    <div className="space-y-4" data-testid="delivery-settings-tab">
      <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/30 rounded-xl p-4">
        <h3 className="font-black text-cyan-300 mb-3">🛵 إعدادات التوصيل (احتساب تلقائي حسب المسافة)</h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] opacity-70 block mb-1">📍 موقع المتجر (lat)</label>
            <input type="number" step="0.0001" value={s.base_lat || ''} onChange={(e) => setS({ ...s, base_lat: e.target.value })} className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded text-sm" data-testid="base-lat" />
          </div>
          <div>
            <label className="text-[11px] opacity-70 block mb-1">📍 موقع المتجر (lng)</label>
            <input type="number" step="0.0001" value={s.base_lng || ''} onChange={(e) => setS({ ...s, base_lng: e.target.value })} className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded text-sm" data-testid="base-lng" />
          </div>
        </div>
        <button onClick={useMyLoc} className="w-full mt-2 py-1.5 bg-blue-500/20 hover:bg-blue-500/40 rounded-lg text-xs font-bold" data-testid="use-my-location">📍 استخدم موقعي الحالي</button>
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div><label className="text-[11px] opacity-70 block mb-1">رسوم أساسية</label><input type="number" value={s.base_fee} onChange={(e) => setS({ ...s, base_fee: e.target.value })} className="w-full px-2 py-2 bg-white/5 border border-white/15 rounded text-sm" data-testid="base-fee" /></div>
          <div><label className="text-[11px] opacity-70 block mb-1">لكل كم</label><input type="number" value={s.fee_per_km} onChange={(e) => setS({ ...s, fee_per_km: e.target.value })} className="w-full px-2 py-2 bg-white/5 border border-white/15 rounded text-sm" data-testid="fee-per-km" /></div>
          <div><label className="text-[11px] opacity-70 block mb-1">مجاني فوق</label><input type="number" value={s.free_delivery_above} onChange={(e) => setS({ ...s, free_delivery_above: e.target.value })} className="w-full px-2 py-2 bg-white/5 border border-white/15 rounded text-sm" data-testid="free-above" /></div>
        </div>
        <div className="text-[10px] opacity-60 mt-2">مثال: رسوم أساسية 10 + 2 لكل كم، أو مجاني لو الطلب فوق 200 ر.س</div>
        <button onClick={save} disabled={busy} className="w-full mt-3 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-lg font-black text-sm" data-testid="save-delivery-settings">{busy ? '...' : '💾 حفظ الإعدادات'}</button>
      </div>

      <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/30 rounded-xl p-4">
        <h3 className="font-black text-purple-300 mb-2">🔗 رابط لوحة السائقين</h3>
        <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2 mb-2">
          <code className="flex-1 text-xs text-purple-300 truncate">{driverUrl}</code>
          <button onClick={() => { navigator.clipboard.writeText(driverUrl); toast.success('نُسخ'); }} className="text-xs px-2 py-1 bg-white/10 hover:bg-white/20 rounded">نسخ</button>
        </div>
        <div className="text-[11px] opacity-70">شارك هذا الرابط مع سائقيك — يدخلون بأرقام جوالاتهم وكلمات مرورهم التي أنشأتها في تبويب "السائقون"</div>
      </div>
    </div>
  );
}

/* ================================================================
   COUPONS TAB
   ================================================================ */
function CouponsTab({ token }) {
  const [coupons, setCoupons] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', discount_percent: 10, discount_amount: 0, min_order: 0, max_uses: 100 });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/websites/client/coupons`, { headers: authH(token) });
      const d = await r.json();
      setCoupons(d.coupons || []);
    } catch (_) {}
  }, [token]);
  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch(`${API}/api/websites/client/coupons`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authH(token) },
        body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error((await r.json()).detail || 'فشل');
      toast.success('✓ أُنشئ الكوبون');
      setForm({ code: '', discount_percent: 10, discount_amount: 0, min_order: 0, max_uses: 100 });
      setShowForm(false); load();
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const remove = async (id) => {
    if (!window.confirm('حذف الكوبون؟')) return;
    await fetch(`${API}/api/websites/client/coupons/${id}`, { method: 'DELETE', headers: authH(token) });
    load();
  };

  return (
    <div data-testid="coupons-tab">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs opacity-70">{coupons.length} كوبون نشط</div>
        {!showForm && <button onClick={() => setShowForm(true)} className="px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-lg text-xs font-black" data-testid="new-coupon-btn">+ كوبون جديد</button>}
      </div>
      {showForm && (
        <form onSubmit={submit} className="bg-white/5 border border-yellow-500/30 rounded-xl p-3 mb-3 space-y-2">
          <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="كود الكوبون (مثال: WELCOME10)" className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded text-sm uppercase" required data-testid="coupon-code" />
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-[10px] opacity-60">خصم %</label><input type="number" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: +e.target.value })} className="w-full px-2 py-1.5 bg-white/5 border border-white/15 rounded text-sm" /></div>
            <div><label className="text-[10px] opacity-60">أو مبلغ ثابت</label><input type="number" value={form.discount_amount} onChange={(e) => setForm({ ...form, discount_amount: +e.target.value })} className="w-full px-2 py-1.5 bg-white/5 border border-white/15 rounded text-sm" /></div>
            <div><label className="text-[10px] opacity-60">الحد الأدنى</label><input type="number" value={form.min_order} onChange={(e) => setForm({ ...form, min_order: +e.target.value })} className="w-full px-2 py-1.5 bg-white/5 border border-white/15 rounded text-sm" /></div>
            <div><label className="text-[10px] opacity-60">الحد الأقصى للاستخدام</label><input type="number" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: +e.target.value })} className="w-full px-2 py-1.5 bg-white/5 border border-white/15 rounded text-sm" /></div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 bg-white/10 rounded text-xs font-bold">إلغاء</button>
            <button type="submit" disabled={busy} className="flex-[2] py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded text-xs font-black">✓ إنشاء</button>
          </div>
        </form>
      )}
      {coupons.length === 0 && !showForm ? (
        <div className="text-center py-10 bg-white/3 border border-dashed border-white/15 rounded-2xl">
          <div className="text-4xl mb-2">🎟️</div>
          <div className="text-sm opacity-60">لا كوبونات بعد</div>
          <div className="text-xs opacity-40 mt-1">أنشئ كوبون لزيادة مبيعاتك</div>
        </div>
      ) : (
        <div className="space-y-2">
          {coupons.map((c) => (
            <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
              <div className="px-3 py-1.5 bg-yellow-500/20 text-yellow-300 rounded-lg font-black text-sm font-mono">{c.code}</div>
              <div className="flex-1 text-xs">
                <div className="font-bold">{c.discount_percent ? `خصم ${c.discount_percent}%` : `${c.discount_amount} ر.س خصم`}{c.min_order ? ` · حد أدنى ${c.min_order}` : ''}</div>
                <div className="opacity-60">{c.used}/{c.max_uses} استُخدم</div>
              </div>
              <button onClick={() => remove(c.id)} className="p-1.5 hover:bg-red-500/20 rounded text-red-400"><X className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   LOYALTY SETTINGS TAB
   ================================================================ */
/* ================================================================
   PAYMENT GATEWAYS TAB — each tenant inputs its own provider keys
   ================================================================ */
function PaymentGatewaysTab({ token }) {
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [draft, setDraft] = useState({});
  const [showCompare, setShowCompare] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/websites/client/payment-gateways`, { headers: authH(token) });
      const d = await r.json();
      setGateways(d.gateways || []);
    } catch (_) { toast.error('فشل تحميل بوابات الدفع'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const setField = (pid, k, v) => setDraft((p) => ({ ...p, [pid]: { ...(p[pid] || {}), [k]: v } }));

  const save = async (pid, extra = {}) => {
    setBusyId(pid);
    try {
      const body = { ...(draft[pid] || {}), ...extra };
      const r = await fetch(`${API}/api/websites/client/payment-gateways/${pid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authH(token) },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error('failed');
      toast.success('✓ تم الحفظ');
      setDraft((p) => { const n = { ...p }; delete n[pid]; return n; });
      await load();
    } catch (_) { toast.error('فشل الحفظ'); }
    finally { setBusyId(null); }
  };

  const testCreds = async (pid) => {
    setBusyId(pid + '-test');
    try {
      const r = await fetch(`${API}/api/websites/client/payment-gateways/${pid}/test`, {
        method: 'POST', headers: authH(token),
      });
      const d = await r.json();
      if (d.ok) toast.success(d.message); else toast.error(d.message);
    } catch (_) { toast.error('فشل الاختبار'); }
    finally { setBusyId(null); }
  };

  if (loading) return <div className="text-center py-10 opacity-60">...</div>;

  return (
    <div className="space-y-4" data-testid="payment-gateways-tab">
      <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/30 rounded-xl p-4">
        <h3 className="font-black text-blue-300 mb-1">💳 بوابات الدفع الخاصة بك</h3>
        <p className="text-xs opacity-70 mb-3">أدخل مفاتيح بوابات الدفع الخاصة بك هنا — ستُشفَّر قبل الحفظ. جميع المدفوعات تذهب مباشرة إلى حسابك.</p>
        <button onClick={() => setShowCompare(true)}
          className="w-full py-2 bg-gradient-to-r from-blue-500/40 to-cyan-500/40 hover:from-blue-500/60 hover:to-cyan-500/60 border border-blue-400/40 rounded-lg font-black text-xs text-white"
          data-testid="open-gw-compare">
          📊 مقارنة تفصيلية بين كل البوابات (رسوم، تسوية، مميزات، عيوب)
        </button>
      </div>
      {showCompare && <GatewayCompareModal onClose={() => setShowCompare(false)} />}

      {gateways.map((g) => (
        <div key={g.id} className={`rounded-xl border p-4 ${g.enabled ? 'bg-green-500/5 border-green-500/30' : 'bg-white/3 border-white/10'}`} data-testid={`gateway-${g.id}`}>
          <div className="flex items-start justify-between mb-3 gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-black text-base">{g.name_ar}</h4>
                {g.coming_soon && <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full">قريباً</span>}
                {g.configured && g.enabled && <span className="text-[10px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">مفعّل</span>}
              </div>
              <div className="text-[11px] opacity-60 mt-1">{(g.methods || []).join(' · ')}</div>
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs">
              <input type="checkbox" checked={!!g.enabled} disabled={busyId === g.id}
                onChange={(e) => save(g.id, { enabled: e.target.checked })}
                data-testid={`gateway-${g.id}-toggle`} />
              <span className="opacity-75">{g.enabled ? 'مفعّل' : 'إيقاف'}</span>
            </label>
          </div>

          {/* Provider-specific fields */}
          {g.id === 'moyasar' && (
            <div className="space-y-2">
              <div>
                <label className="text-[11px] opacity-70 block mb-1">Publishable Key (pk_test_...)</label>
                <input type="text"
                  placeholder={g.publishable_key_preview || 'pk_test_...'}
                  value={(draft[g.id] || {}).publishable_key || ''}
                  onChange={(e) => setField(g.id, 'publishable_key', e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded text-sm font-mono"
                  data-testid="moyasar-pk" />
              </div>
              <div>
                <label className="text-[11px] opacity-70 block mb-1">Secret Key (sk_test_...)</label>
                <input type="password"
                  placeholder={g.secret_key_preview || 'sk_test_...'}
                  value={(draft[g.id] || {}).secret_key || ''}
                  onChange={(e) => setField(g.id, 'secret_key', e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded text-sm font-mono"
                  data-testid="moyasar-sk" />
                <div className="text-[10px] opacity-50 mt-1">
                  <a href="https://dashboard.moyasar.com" target="_blank" rel="noreferrer" className="text-blue-400 underline">احصل على المفاتيح من Moyasar Dashboard</a>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px]">
                {['mada', 'creditcard', 'applepay', 'stcpay'].map((m) => (
                  <label key={m} className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded cursor-pointer">
                    <input type="checkbox"
                      checked={((draft[g.id] || {}).methods || g.methods || []).includes(m)}
                      onChange={(e) => {
                        const cur = (draft[g.id] || {}).methods || g.methods || [];
                        const next = e.target.checked ? [...new Set([...cur, m])] : cur.filter((x) => x !== m);
                        setField(g.id, 'methods', next);
                      }} />
                    {m === 'mada' ? 'مدى' : m === 'creditcard' ? 'فيزا/ماستر' : m === 'applepay' ? 'Apple Pay' : 'STC Pay'}
                  </label>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => save(g.id)} disabled={busyId === g.id}
                  className="flex-1 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-lg font-black text-xs disabled:opacity-50"
                  data-testid="moyasar-save">{busyId === g.id ? '...' : '💾 حفظ المفاتيح'}</button>
                {g.configured && (
                  <button onClick={() => testCreds(g.id)} disabled={busyId}
                    className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg font-bold text-xs"
                    data-testid="moyasar-test">{busyId === g.id + '-test' ? '...' : '🧪 اختبار'}</button>
                )}
              </div>
            </div>
          )}

          {g.id === 'tabby' && (
            <div className="space-y-2 opacity-80">
              <div>
                <label className="text-[11px] opacity-70 block mb-1">Public Key (pk_test_...)</label>
                <input type="text" placeholder={g.public_key_preview || 'pk_test_...'}
                  value={(draft[g.id] || {}).public_key || ''}
                  onChange={(e) => setField(g.id, 'public_key', e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded text-sm font-mono" />
              </div>
              <div>
                <label className="text-[11px] opacity-70 block mb-1">Secret Key</label>
                <input type="password" placeholder={g.secret_key_preview || 'sk_...'}
                  value={(draft[g.id] || {}).secret_key || ''}
                  onChange={(e) => setField(g.id, 'secret_key', e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded text-sm font-mono" />
              </div>
              <button onClick={() => save(g.id)} disabled={busyId === g.id}
                className="w-full py-2 bg-white/10 hover:bg-white/15 rounded-lg font-bold text-xs">
                💾 حفظ (الربط الكامل قيد الإضافة)
              </button>
            </div>
          )}

          {g.id === 'tamara' && (
            <div className="space-y-2 opacity-80">
              <div>
                <label className="text-[11px] opacity-70 block mb-1">API Token</label>
                <input type="password" placeholder={g.api_token_preview || 'tkn_...'}
                  value={(draft[g.id] || {}).api_token || ''}
                  onChange={(e) => setField(g.id, 'api_token', e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded text-sm font-mono" />
              </div>
              <div>
                <label className="text-[11px] opacity-70 block mb-1">Notification Token</label>
                <input type="password" placeholder={g.notification_token_preview || '...'}
                  value={(draft[g.id] || {}).notification_token || ''}
                  onChange={(e) => setField(g.id, 'notification_token', e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded text-sm font-mono" />
              </div>
              <button onClick={() => save(g.id)} disabled={busyId === g.id}
                className="w-full py-2 bg-white/10 hover:bg-white/15 rounded-lg font-bold text-xs">
                💾 حفظ (الربط الكامل قيد الإضافة)
              </button>
            </div>
          )}

          {g.id === 'cod' && (
            <div className="text-xs opacity-70">
              لا يحتاج مفاتيح. فعّل فقط الزر أعلاه ليُعرض كخيار "الدفع عند الاستلام" للعملاء.
            </div>
          )}
        </div>
      ))}

      <div className="text-[11px] opacity-50 text-center pt-2">
        المفاتيح السرية تُشفَّر قبل الحفظ ولا تُعرض أبداً كاملة.
      </div>
    </div>
  );
}

/* ================================================================
   BOOKINGS TAB — appointments (salon, pets, medical, gym)
   ================================================================ */
function BookingsTab({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = filter ? `?status=${filter}` : '';
      const r = await fetch(`${API}/api/websites/client/bookings${q}`, { headers: authH(token) });
      setData(await r.json());
    } catch (_) {} finally { setLoading(false); }
  }, [token, filter]);
  useEffect(() => { load(); const id = setInterval(load, 20000); return () => clearInterval(id); }, [load]);

  const setStatus = async (id, status) => {
    try {
      await fetch(`${API}/api/websites/client/bookings/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authH(token) },
        body: JSON.stringify({ status }),
      });
      toast.success('تم التحديث');
      load();
    } catch (_) { toast.error('فشل'); }
  };

  if (loading && !data) return <div className="text-center py-10 opacity-60">...</div>;
  const STATUS_LABEL = {
    pending: '⏳ قيد الانتظار', confirmed: '✅ مؤكد', in_progress: '🚀 قيد التنفيذ',
    completed: '✓ مكتمل', cancelled: '❌ ملغي', no_show: '👻 لم يحضر',
  };
  return (
    <div data-testid="bookings-tab" className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-black text-base">📅 المواعيد ({data?.total || 0})</h3>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-1.5 bg-white/5 border border-white/15 rounded-lg text-xs"
          data-testid="booking-filter">
          <option value="">كل الحالات</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      {(data?.bookings || []).length === 0 ? (
        <div className="text-center py-12 opacity-60">لا مواعيد بعد</div>
      ) : (
        <div className="space-y-2">
          {data.bookings.map((b) => (
            <div key={b.id} className="bg-white/3 border border-white/10 rounded-xl p-3 text-sm" data-testid={`booking-${b.id}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <div className="font-bold">{b.service_name}</div>
                  <div className="text-xs opacity-70">{b.customer_name} · {b.customer_phone}</div>
                  <div className="text-[11px] opacity-60 mt-1">
                    🕐 {new Date(b.slot_iso).toLocaleString('ar-SA')} · {b.duration_min} د · {b.price} ر.س
                  </div>
                  {b.notes && <div className="text-[11px] mt-1 bg-white/5 p-1.5 rounded">📝 {b.notes}</div>}
                </div>
                <div className="text-[11px]">{STATUS_LABEL[b.status] || b.status}</div>
              </div>
              <div className="flex flex-wrap gap-1 text-[10px]">
                {b.status === 'pending' && <button onClick={() => setStatus(b.id, 'confirmed')} className="px-2 py-1 bg-green-500/20 hover:bg-green-500/30 rounded font-bold">✅ تأكيد</button>}
                {['pending', 'confirmed'].includes(b.status) && <button onClick={() => setStatus(b.id, 'in_progress')} className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded font-bold">🚀 بدء</button>}
                {b.status === 'in_progress' && <button onClick={() => setStatus(b.id, 'completed')} className="px-2 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 rounded font-bold">✓ إنهاء</button>}
                {!['completed', 'cancelled'].includes(b.status) && <button onClick={() => setStatus(b.id, 'cancelled')} className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 rounded font-bold">❌ إلغاء</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   SERVICES TAB — manage price list (salon, pets, medical, gym)
   ================================================================ */
function ServicesTab({ token }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', price: '', duration_min: 30 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/websites/client/services`, { headers: authH(token) });
      setItems((await r.json()).services || []);
    } catch (_) {} finally { setLoading(false); }
  }, [token]);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!form.name || !form.price) { toast.error('الاسم والسعر مطلوبان'); return; }
    try {
      await fetch(`${API}/api/websites/client/services`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authH(token) },
        body: JSON.stringify({ name: form.name, price: parseFloat(form.price), duration_min: parseInt(form.duration_min) || 30 }),
      });
      toast.success('أُضيفت الخدمة');
      setForm({ name: '', price: '', duration_min: 30 });
      load();
    } catch (_) { toast.error('فشل'); }
  };

  const del = async (id) => {
    if (!window.confirm('حذف؟')) return;
    await fetch(`${API}/api/websites/client/services/${id}`, { method: 'DELETE', headers: authH(token) });
    toast.success('تم الحذف');
    load();
  };

  if (loading) return <div className="text-center py-10 opacity-60">...</div>;
  return (
    <div data-testid="services-tab" className="space-y-3">
      <div className="bg-white/3 border border-white/10 rounded-xl p-3 space-y-2">
        <h3 className="font-black text-sm mb-2">➕ إضافة خدمة</h3>
        <input placeholder="اسم الخدمة" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded text-sm" data-testid="svc-name" />
        <div className="grid grid-cols-2 gap-2">
          <input type="number" placeholder="السعر (ر.س)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="px-3 py-2 bg-white/5 border border-white/15 rounded text-sm" data-testid="svc-price" />
          <input type="number" placeholder="المدة (دقيقة)" value={form.duration_min} onChange={(e) => setForm({ ...form, duration_min: e.target.value })}
            className="px-3 py-2 bg-white/5 border border-white/15 rounded text-sm" data-testid="svc-duration" />
        </div>
        <button onClick={add} className="w-full py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded font-black text-sm" data-testid="svc-add">إضافة</button>
      </div>
      <div className="space-y-2">
        {items.length === 0 && <div className="text-center py-8 opacity-60 text-sm">لا خدمات بعد</div>}
        {items.map((s) => (
          <div key={s.id} className="flex items-center gap-2 bg-white/3 border border-white/10 rounded-xl p-3 text-sm" data-testid={`svc-${s.id}`}>
            <div className="flex-1">
              <div className="font-bold">{s.name}</div>
              <div className="text-[11px] opacity-60">{s.price} ر.س · {s.duration_min} دقيقة</div>
            </div>
            <button onClick={() => del(s.id)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded" data-testid={`svc-del-${s.id}`}>🗑️</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================
   PRODUCTS TAB — e-commerce catalog management
   ================================================================ */
function ProductsTab({ token }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', price: '', stock: '', category: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/websites/client/products`, { headers: authH(token) });
      setItems((await r.json()).products || []);
    } catch (_) {} finally { setLoading(false); }
  }, [token]);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!form.name || !form.price) { toast.error('الاسم والسعر مطلوبان'); return; }
    try {
      await fetch(`${API}/api/websites/client/products`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authH(token) },
        body: JSON.stringify({ name: form.name, price: parseFloat(form.price), stock: parseInt(form.stock) || 0, category: form.category || null }),
      });
      toast.success('أُضيف المنتج');
      setForm({ name: '', price: '', stock: '', category: '' });
      load();
    } catch (_) { toast.error('فشل'); }
  };

  const del = async (id) => {
    if (!window.confirm('حذف؟')) return;
    await fetch(`${API}/api/websites/client/products/${id}`, { method: 'DELETE', headers: authH(token) });
    load();
  };

  if (loading) return <div className="text-center py-10 opacity-60">...</div>;
  return (
    <div data-testid="products-tab" className="space-y-3">
      <div className="bg-white/3 border border-white/10 rounded-xl p-3 space-y-2">
        <h3 className="font-black text-sm mb-2">➕ إضافة منتج</h3>
        <input placeholder="اسم المنتج" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded text-sm" data-testid="prod-name" />
        <div className="grid grid-cols-3 gap-2">
          <input type="number" placeholder="السعر" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="px-3 py-2 bg-white/5 border border-white/15 rounded text-sm" data-testid="prod-price" />
          <input type="number" placeholder="المخزون" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
            className="px-3 py-2 bg-white/5 border border-white/15 rounded text-sm" data-testid="prod-stock" />
          <input placeholder="الفئة" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="px-3 py-2 bg-white/5 border border-white/15 rounded text-sm" data-testid="prod-cat" />
        </div>
        <button onClick={add} className="w-full py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-black rounded font-black text-sm" data-testid="prod-add">إضافة</button>
      </div>
      <div className="space-y-2">
        {items.length === 0 && <div className="text-center py-8 opacity-60 text-sm">لا منتجات بعد</div>}
        {items.map((p) => (
          <div key={p.id} className="flex items-center gap-2 bg-white/3 border border-white/10 rounded-xl p-3 text-sm" data-testid={`prod-${p.id}`}>
            <div className="flex-1">
              <div className="font-bold">{p.name}</div>
              <div className="text-[11px] opacity-60">
                {p.price} ر.س · مخزون: {p.stock} {p.stock <= 5 ? '⚠️' : ''}
                {p.category && <span> · {p.category}</span>}
              </div>
            </div>
            <button onClick={() => del(p.id)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded" data-testid={`prod-del-${p.id}`}>🗑️</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================
   LISTINGS TAB — real estate agent's property list
   ================================================================ */
function ListingsTab({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: '', price: '', transaction: 'بيع', type: 'شقة',
    city: '', district: '', area_sqm: '', bedrooms: '', bathrooms: '',
    agent_phone: '', commission_pct: '2.5', description: '', images: '',
  });
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/websites/client/listings`, { headers: authH(token) });
      setData(await r.json());
    } catch (_) {} finally { setLoading(false); }
  }, [token]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.title || !form.price || !form.agent_phone) {
      toast.error('العنوان والسعر وهاتف الدلّال مطلوبة');
      return;
    }
    try {
      const body = {
        ...form,
        price: parseFloat(form.price),
        area_sqm: form.area_sqm ? parseFloat(form.area_sqm) : null,
        bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
        commission_pct: parseFloat(form.commission_pct) || 2.5,
        images: form.images ? form.images.split(',').map((s) => s.trim()).filter(Boolean) : null,
      };
      await fetch(`${API}/api/websites/client/listings`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authH(token) },
        body: JSON.stringify(body),
      });
      toast.success('أُضيف العقار ✓');
      setShowForm(false);
      setForm({ ...form, title: '', price: '', city: '', district: '', area_sqm: '', bedrooms: '', bathrooms: '', description: '', images: '' });
      load();
    } catch (_) { toast.error('فشل'); }
  };

  const markSold = async (id) => {
    await fetch(`${API}/api/websites/client/listings/${id}/mark-sold`, { method: 'PATCH', headers: authH(token) });
    toast.success('تم تأشير العقار كمباع ✓');
    load();
  };
  const del = async (id) => {
    if (!window.confirm('حذف العقار؟')) return;
    await fetch(`${API}/api/websites/client/listings/${id}`, { method: 'DELETE', headers: authH(token) });
    load();
  };

  if (loading && !data) return <div className="text-center py-10 opacity-60">...</div>;
  const s = data?.stats || {};
  return (
    <div data-testid="listings-tab" className="space-y-3">
      {/* Commission / Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
          <div className="text-[10px] opacity-60">إجمالي العقارات</div>
          <div className="text-lg font-black">{s.total || 0}</div>
        </div>
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center">
          <div className="text-[10px] opacity-60">نشطة</div>
          <div className="text-lg font-black text-green-300">{s.active || 0}</div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 text-center">
          <div className="text-[10px] opacity-60">مُباعة</div>
          <div className="text-lg font-black text-blue-300">{s.sold || 0}</div>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-center">
          <div className="text-[10px] opacity-60">عمولة متوقعة</div>
          <div className="text-lg font-black text-yellow-300">{(s.potential_commission || 0).toLocaleString('ar-SA', { maximumFractionDigits: 0 })} ر.س</div>
        </div>
      </div>
      <div className="text-[11px] opacity-60 text-center mb-2">💰 قيمة المحفظة الإجمالية: <b className="text-yellow-300">{(s.total_value || 0).toLocaleString('ar-SA')} ر.س</b></div>

      <button onClick={() => setShowForm(!showForm)}
        className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-black rounded-lg font-black text-sm" data-testid="toggle-add-listing">
        {showForm ? '× إغلاق' : '🏠 إضافة عقار جديد'}
      </button>

      {showForm && (
        <div className="bg-white/3 border border-white/10 rounded-xl p-3 space-y-2">
          <input placeholder="عنوان العقار" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded text-sm" data-testid="lst-title" />
          <div className="grid grid-cols-2 gap-2">
            <select value={form.transaction} onChange={(e) => setForm({ ...form, transaction: e.target.value })}
              className="px-3 py-2 bg-white/5 border border-white/15 rounded text-sm">
              <option value="بيع">بيع</option><option value="إيجار">إيجار</option>
            </select>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="px-3 py-2 bg-white/5 border border-white/15 rounded text-sm">
              <option>شقة</option><option>فيلا</option><option>أرض</option><option>تجاري</option><option>مزرعة</option>
            </select>
            <input type="number" placeholder="السعر (ر.س)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="px-3 py-2 bg-white/5 border border-white/15 rounded text-sm" data-testid="lst-price" />
            <input type="number" placeholder="المساحة (م²)" value={form.area_sqm} onChange={(e) => setForm({ ...form, area_sqm: e.target.value })}
              className="px-3 py-2 bg-white/5 border border-white/15 rounded text-sm" />
            <input placeholder="المدينة" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="px-3 py-2 bg-white/5 border border-white/15 rounded text-sm" />
            <input placeholder="الحي" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}
              className="px-3 py-2 bg-white/5 border border-white/15 rounded text-sm" />
            <input type="number" placeholder="غرف النوم" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
              className="px-3 py-2 bg-white/5 border border-white/15 rounded text-sm" />
            <input type="number" placeholder="دورات المياه" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })}
              className="px-3 py-2 bg-white/5 border border-white/15 rounded text-sm" />
            <input placeholder="واتساب الدلّال (+966...)" value={form.agent_phone} onChange={(e) => setForm({ ...form, agent_phone: e.target.value })}
              className="px-3 py-2 bg-white/5 border border-white/15 rounded text-sm" />
            <input type="number" step="0.1" placeholder="عمولة %" value={form.commission_pct} onChange={(e) => setForm({ ...form, commission_pct: e.target.value })}
              className="px-3 py-2 bg-white/5 border border-white/15 rounded text-sm" />
          </div>
          <textarea rows={2} placeholder="الوصف" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded text-sm" />
          <input placeholder="روابط صور مفصولة بفاصلة" value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })}
            className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded text-sm" />
          <button onClick={save} className="w-full py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded font-black text-sm" data-testid="lst-save">💾 حفظ العقار</button>
        </div>
      )}

      <div className="space-y-2">
        {(data?.listings || []).length === 0 && <div className="text-center py-8 opacity-60 text-sm">لا عقارات بعد</div>}
        {(data?.listings || []).map((l) => {
          const comm = (l.price || 0) * (l.commission_pct || 2.5) / 100;
          return (
            <div key={l.id} className={`border rounded-xl p-3 ${l.sold ? 'bg-blue-500/5 border-blue-500/20 opacity-70' : 'bg-white/3 border-white/10'}`} data-testid={`lst-${l.id}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-sm">{l.title}</span>
                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full">{l.transaction}</span>
                    {l.sold && <span className="text-[10px] bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-full">✓ مُباع</span>}
                  </div>
                  <div className="text-yellow-300 font-black mb-1">{Number(l.price).toLocaleString('ar-SA')} ر.س</div>
                  <div className="text-[11px] opacity-70">
                    📍 {l.city} {l.district && `- ${l.district}`} · {l.area_sqm || '—'}م² · {l.bedrooms || '—'}🛏 · {l.bathrooms || '—'}🚿
                  </div>
                  <div className="text-[10px] text-emerald-300 mt-1">
                    💰 عمولة متوقعة: {comm.toLocaleString('ar-SA', { maximumFractionDigits: 0 })} ر.س ({l.commission_pct || 2.5}%)
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  {!l.sold && <button onClick={() => markSold(l.id)} className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded text-[10px] font-bold">✓ مُباع</button>}
                  <button onClick={() => del(l.id)} className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 rounded text-[10px] font-bold">🗑</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================
   GATEWAY COMPARE MODAL — detailed side-by-side comparison
   ================================================================ */
function GatewayCompareModal({ onClose }) {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    fetch(`${API}/api/websites/payment-gateways/compare`).then((r) => r.json()).then((d) => setRows(d.rows || []));
  }, []);
  return (
    <div className="fixed inset-0 bg-black/85 z-[1100] flex items-center justify-center p-4" onClick={onClose} data-testid="gw-compare-modal">
      <div onClick={(e) => e.stopPropagation()} className="bg-slate-900 text-white rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-auto p-5 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-black">📊 مقارنة بوابات الدفع المدعومة</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20" data-testid="gw-compare-close">✕</button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {rows.map((r) => (
            <div key={r.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col text-xs" data-testid={`gw-compare-${r.id}`}>
              <div className="font-black text-base mb-1">{r.name_ar}</div>
              <div className="opacity-70 text-[11px] mb-3 min-h-[32px]">{r.description_ar}</div>
              <div className="space-y-2 flex-1">
                <div className="bg-yellow-500/10 rounded p-2"><span className="opacity-60">الرسوم: </span><b>{r.fees}</b></div>
                <div className="bg-green-500/10 rounded p-2"><span className="opacity-60">التسوية: </span><b>{r.settlement}</b></div>
                <div className="bg-blue-500/10 rounded p-2"><span className="opacity-60">مناسبة لـ: </span>{r.best_for}</div>
                <div className="bg-purple-500/10 rounded p-2"><span className="opacity-60">الترخيص: </span>{r.license}</div>
                <div className="bg-cyan-500/10 rounded p-2"><span className="opacity-60">وقت الإعداد: </span>{r.setup_time}</div>
                <div>
                  <div className="font-bold text-green-300 mb-1">✅ مميزات</div>
                  <ul className="pr-3 space-y-0.5 opacity-80">{(r.pros || []).map((p, i) => <li key={i}>• {p}</li>)}</ul>
                </div>
                <div>
                  <div className="font-bold text-red-300 mb-1">⚠️ عيوب</div>
                  <ul className="pr-3 space-y-0.5 opacity-80">{(r.cons || []).map((p, i) => <li key={i}>• {p}</li>)}</ul>
                </div>
              </div>
              {r.signup_url && (
                <a href={r.signup_url} target="_blank" rel="noreferrer"
                  className="mt-3 block text-center py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-black rounded text-xs">
                  🔗 سجّل الآن
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   WIDGET CUSTOMIZER TAB — per-widget variant + position picker
   ================================================================ */
function WidgetCustomizerTab({ token, slug }) {
  const [catalog, setCatalog] = useState(null);
  const [styles, setStyles] = useState({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cat, mine] = await Promise.all([
        fetch(`${API}/api/websites/widget-styles/catalog`).then((r) => r.json()),
        fetch(`${API}/api/websites/client/widget-styles`, { headers: authH(token) }).then((r) => r.json()),
      ]);
      setCatalog(cat);
      setStyles(mine.widget_styles || {});
    } catch (_) {} finally { setLoading(false); }
  }, [token]);
  useEffect(() => { load(); }, [load]);

  const save = async (wid, patch) => {
    const next = { ...(styles[wid] || {}), ...patch };
    setStyles((s) => ({ ...s, [wid]: next }));
    try {
      await fetch(`${API}/api/websites/client/widget-styles/${wid}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', ...authH(token) },
        body: JSON.stringify(next),
      });
      toast.success('✓');
    } catch (_) { toast.error('فشل الحفظ'); }
  };

  const reset = async (wid) => {
    await fetch(`${API}/api/websites/client/widget-styles/${wid}`, { method: 'DELETE', headers: authH(token) });
    setStyles((s) => { const n = { ...s }; delete n[wid]; return n; });
    toast.success('استُعيد الافتراضي');
  };

  if (loading) return <div className="text-center py-10 opacity-60">...</div>;
  const posLabels = { 'top-left': '⬉ أعلى يسار', 'top-right': '⬈ أعلى يمين', 'bottom-left': '⬋ أسفل يسار', 'bottom-right': '⬌ أسفل يمين', 'middle-left': '◧ وسط يسار', 'middle-right': '◨ وسط يمين' };

  return (
    <div data-testid="widget-customizer-tab" className="space-y-4">
      <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/30 rounded-xl p-4">
        <h3 className="font-black text-purple-300 mb-1">🎨 تخصيص الأدوات</h3>
        <p className="text-xs opacity-70">اختر شكل كل أداة، مكان ظهورها على الموقع، أو أخفِها تماماً. التغييرات تظهر مباشرة في موقعك.</p>
        <a href={`/sites/${slug}`} target="_blank" rel="noreferrer"
          className="mt-2 inline-block text-xs text-purple-300 underline" data-testid="preview-link">
          👁️ اعرض موقعك في تبويب جديد للمعاينة
        </a>
      </div>

      {(catalog?.widgets || []).map((w) => {
        const cur = styles[w.id] || {};
        const curVariant = cur.variant || (w.variants[0] && w.variants[0].id);
        const curPos = cur.position || w.default_pos;
        const hidden = !!cur.hidden;
        return (
          <div key={w.id} className={`rounded-xl border p-4 ${hidden ? 'bg-red-500/5 border-red-500/20 opacity-75' : 'bg-white/3 border-white/10'}`} data-testid={`wid-${w.id}`}>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex-1">
                <h4 className="font-black text-sm">{w.name_ar}</h4>
                <p className="text-[11px] opacity-60">{w.description_ar}</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input type="checkbox" checked={hidden} onChange={(e) => save(w.id, { hidden: e.target.checked })}
                    data-testid={`wid-${w.id}-hide`} />
                  <span className="opacity-75">إخفاء</span>
                </label>
                <button onClick={() => reset(w.id)} className="text-[10px] text-yellow-300 hover:underline"
                  data-testid={`wid-${w.id}-reset`}>↺ افتراضي</button>
              </div>
            </div>

            {!hidden && (
              <>
                {/* VARIANTS */}
                <div className="mb-3">
                  <label className="text-[11px] opacity-70 block mb-1.5">🎨 الشكل</label>
                  <div className="flex flex-wrap gap-1.5">
                    {w.variants.map((v) => (
                      <button key={v.id}
                        onClick={() => save(w.id, { variant: v.id })}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${curVariant === v.id ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black' : 'bg-white/5 hover:bg-white/10'}`}
                        data-testid={`wid-${w.id}-variant-${v.id}`}>
                        {v.name_ar}
                      </button>
                    ))}
                  </div>
                </div>

                {/* POSITIONS */}
                {w.supports_position && (
                  <div className="mb-3">
                    <label className="text-[11px] opacity-70 block mb-1.5">📍 الموقع</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(catalog?.positions || []).map((p) => (
                        <button key={p}
                          onClick={() => save(w.id, { position: p })}
                          className={`px-2 py-1.5 rounded text-[11px] font-bold ${curPos === p ? 'bg-purple-500 text-white' : 'bg-white/5 hover:bg-white/10'}`}
                          data-testid={`wid-${w.id}-pos-${p}`}>
                          {posLabels[p] || p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* OFFSETS — fine nudge */}
                {w.supports_position && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <label className="text-[10px] opacity-60 block">تحريك أفقي (px)</label>
                      <input type="number" value={cur.offset_x || 0}
                        onChange={(e) => save(w.id, { offset_x: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 bg-white/5 border border-white/15 rounded text-sm"
                        data-testid={`wid-${w.id}-ox`} />
                    </div>
                    <div>
                      <label className="text-[10px] opacity-60 block">تحريك عمودي (px)</label>
                      <input type="number" value={cur.offset_y || 0}
                        onChange={(e) => save(w.id, { offset_y: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 bg-white/5 border border-white/15 rounded text-sm"
                        data-testid={`wid-${w.id}-oy`} />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function LoyaltyTab({ token }) {  const [s, setS] = useState({ enabled: true, welcome_bonus: 50, points_per_sar: 1, redeem_rate: 0.1, referral_bonus: 100 });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    fetch(`${API}/api/websites/client/loyalty-settings`, { headers: authH(token) }).then((r) => r.json()).then((d) => setS((p) => ({ ...p, ...d })));
  }, [token]);
  const save = async () => {
    setBusy(true);
    try {
      await fetch(`${API}/api/websites/client/loyalty-settings`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authH(token) }, body: JSON.stringify(s) });
      toast.success('✓ تم الحفظ');
    } catch (_) { toast.error('فشل'); } finally { setBusy(false); }
  };
  return (
    <div className="bg-gradient-to-br from-pink-500/10 to-purple-500/5 border border-pink-500/30 rounded-xl p-4" data-testid="loyalty-tab">
      <h3 className="font-black text-pink-300 mb-3">🎁 نظام نقاط الولاء</h3>
      <label className="flex items-center gap-2 mb-3 cursor-pointer">
        <input type="checkbox" checked={s.enabled} onChange={(e) => setS({ ...s, enabled: e.target.checked })} className="w-4 h-4" />
        <span className="text-sm">تفعيل نظام النقاط</span>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-[11px] opacity-70 block mb-1">🎁 نقاط ترحيبية</label><input type="number" value={s.welcome_bonus} onChange={(e) => setS({ ...s, welcome_bonus: +e.target.value })} className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded text-sm" data-testid="welcome-bonus" /></div>
        <div><label className="text-[11px] opacity-70 block mb-1">⭐ نقاط لكل 1 ر.س</label><input type="number" step="0.1" value={s.points_per_sar} onChange={(e) => setS({ ...s, points_per_sar: +e.target.value })} className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded text-sm" /></div>
        <div><label className="text-[11px] opacity-70 block mb-1">💱 قيمة النقطة (ر.س)</label><input type="number" step="0.01" value={s.redeem_rate} onChange={(e) => setS({ ...s, redeem_rate: +e.target.value })} className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded text-sm" /></div>
        <div><label className="text-[11px] opacity-70 block mb-1">👥 نقاط الإحالة</label><input type="number" value={s.referral_bonus} onChange={(e) => setS({ ...s, referral_bonus: +e.target.value })} className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded text-sm" /></div>
      </div>
      <div className="text-[11px] opacity-60 mt-2">مثال: 10 نقاط = 1 ر.س خصم عند الطلب التالي</div>
      <button onClick={save} disabled={busy} className="w-full mt-3 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-lg font-black text-sm" data-testid="save-loyalty">{busy ? '...' : '💾 حفظ'}</button>
    </div>
  );
}

/* ================================================================
   LIVE MAP TAB — drivers + active orders on OpenStreetMap (WebSocket)
   ================================================================ */
function LiveMapTab({ token, slug }) {
  const [data, setData] = useState(null);
  const [wsOnline, setWsOnline] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const wsRef = useRef(null);

  const loadInitial = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/websites/client/live-map`, { headers: authH(token) });
      setData(await r.json());
      // Also load pending orders (ones without driver)
      const or = await fetch(`${API}/api/websites/client/orders`, { headers: authH(token) });
      const od = await or.json();
      setPendingOrders((od.orders || []).filter((o) => !o.driver_id && ['pending', 'accepted', 'preparing', 'ready'].includes(o.status)));
    } catch (_) {}
  }, [token]);

  const applyEvent = useCallback((evt) => {
    if (!evt || !evt.type) return;
    setData((prev) => {
      if (!prev) return prev;
      const next = { ...prev, drivers: [...(prev.drivers || [])], orders: [...(prev.orders || [])] };
      if (evt.type === 'location') {
        const d = evt.data || {};
        const idx = next.drivers.findIndex((x) => x.id === d.driver_id);
        if (idx >= 0) next.drivers[idx] = { ...next.drivers[idx], lat: d.lat, lng: d.lng, last_ping: d.at };
        else next.drivers.push({ id: d.driver_id, name: d.driver_name, lat: d.lat, lng: d.lng, last_ping: d.at });
      } else if (evt.type === 'order_created') {
        const d = evt.data || {};
        if (!next.orders.find((o) => o.id === d.order_id))
          next.orders.unshift({ id: d.order_id, customer: d.customer, total: d.total, lat: d.lat, lng: d.lng, status: d.status });
        loadInitial();
      } else if (evt.type === 'order_status') {
        const d = evt.data || {};
        const idx = next.orders.findIndex((o) => o.id === d.order_id);
        if (idx >= 0) next.orders[idx] = { ...next.orders[idx], status: d.status, driver_id: d.driver_id };
      }
      return next;
    });
  }, [loadInitial]);

  useEffect(() => {
    loadInitial();
    if (!slug || !token) return undefined;
    const wsUrl = `${API.replace(/^http/, 'ws')}/api/websites/ws/client/${slug}?token=${encodeURIComponent(token)}`;
    let closedByUs = false, retryTimer = null, pingTimer = null;
    const connect = () => {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onopen = () => { setWsOnline(true); pingTimer = setInterval(() => { try { ws.send('ping'); } catch (_) {} }, 25000); };
      ws.onmessage = (e) => { try { applyEvent(JSON.parse(e.data)); } catch (_) {} };
      ws.onclose = () => { setWsOnline(false); if (pingTimer) { clearInterval(pingTimer); pingTimer = null; } if (!closedByUs) retryTimer = setTimeout(connect, 3000); };
      ws.onerror = () => { try { ws.close(); } catch (_) {} };
    };
    connect();
    return () => { closedByUs = true; if (retryTimer) clearTimeout(retryTimer); if (pingTimer) clearInterval(pingTimer); if (wsRef.current) try { wsRef.current.close(); } catch (_) {} };
  }, [slug, token, loadInitial, applyEvent]);

  const assignDriver = async (orderId, driverId) => {
    setAssigning(true);
    try {
      await fetch(`${API}/api/websites/client/orders/${orderId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authH(token) },
        body: JSON.stringify({ driver_id: driverId, status: 'on_the_way' }),
      });
      toast.success('✅ تم تعيين السائق');
      setSelectedOrder(null);
      loadInitial();
    } catch (_) { toast.error('فشل'); }
    finally { setAssigning(false); }
  };

  if (!data) return <div className="text-center py-10 opacity-60">...</div>;

  const center = data.base?.lat ? `${data.base.lat},${data.base.lng}` : (data.drivers[0] ? `${data.drivers[0].lat},${data.drivers[0].lng}` : '24.7136,46.6753');
  const [lat, lng] = center.split(',').map(parseFloat);
  const bbox = `${lng - 0.08}%2C${lat - 0.06}%2C${lng + 0.08}%2C${lat + 0.06}`;
  const osm = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
  const minsSince = (iso) => iso ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000)) : null;

  return (
    <div data-testid="livemap-tab" className="space-y-3">
      {/* HEADER: WS status + command center title */}
      <div className="flex items-center justify-between text-[11px] flex-wrap gap-2">
        <h3 className="font-black text-base flex items-center gap-2">🚀 مركز قيادة السائقين</h3>
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${wsOnline ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`} data-testid="ws-status">
          <span className={`w-1.5 h-1.5 rounded-full ${wsOnline ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></span>
          {wsOnline ? 'مباشر (WebSocket)' : 'إعادة الاتصال...'}
        </span>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border border-yellow-500/30 rounded-xl p-3 text-center">
          <div className="text-[10px] opacity-60">المتجر</div>
          <div className="text-lg font-black text-yellow-400">📍 {data.base?.city || 'الرياض'}</div>
        </div>
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/30 rounded-xl p-3 text-center">
          <div className="text-[10px] opacity-60">سائقون نشطون</div>
          <div className="text-lg font-black text-green-400">🟢 {data.drivers.length}</div>
        </div>
        <div className="bg-gradient-to-br from-pink-500/10 to-rose-500/5 border border-pink-500/30 rounded-xl p-3 text-center">
          <div className="text-[10px] opacity-60">طلبات فعّالة</div>
          <div className="text-lg font-black text-pink-400">📦 {data.orders.length}</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-500/30 rounded-xl p-3 text-center">
          <div className="text-[10px] opacity-60">بانتظار تعيين</div>
          <div className="text-lg font-black text-orange-400">⏳ {pendingOrders.length}</div>
        </div>
      </div>

      {/* LIVE MAP */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden relative" style={{ aspectRatio: '16/9' }}>
        <iframe src={osm} className="w-full h-full" title="live-map" style={{ border: 0 }} data-testid="live-map-iframe" />
        {data.drivers.length > 0 && (
          <div className="absolute bottom-2 left-2 right-2 bg-black/75 backdrop-blur-sm rounded-lg p-2 text-[11px]">
            🛵 {data.drivers.map((d) => `${d.name} (${d.lat?.toFixed(3)}, ${d.lng?.toFixed(3)})`).join(' · ')}
          </div>
        )}
      </div>

      {/* PENDING ORDERS — needs driver assignment */}
      {pendingOrders.length > 0 && (
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-3">
          <div className="font-black text-sm mb-2 text-orange-300">⏳ طلبات بانتظار سائق ({pendingOrders.length})</div>
          <div className="space-y-2">
            {pendingOrders.slice(0, 5).map((o) => (
              <div key={o.id} className="bg-white/3 rounded-lg p-2 text-xs flex items-center justify-between gap-2" data-testid={`pending-${o.id}`}>
                <div className="flex-1 min-w-0">
                  <div className="font-bold">#{o.id.slice(0, 6)} · {o.customer_name || o.customer || 'عميل'}</div>
                  <div className="opacity-60 text-[10px]">{o.total} ر.س · {o.status}</div>
                </div>
                <button onClick={() => setSelectedOrder(o)}
                  className="px-3 py-1 bg-orange-500/30 hover:bg-orange-500/50 rounded font-bold text-[10px]"
                  data-testid={`assign-${o.id}`}>
                  👤 عيّن سائق
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DRIVERS DETAIL */}
      <div className="bg-white/3 border border-white/10 rounded-xl p-3">
        <div className="font-black text-sm mb-2">🛵 السائقون ({data.drivers.length})</div>
        {data.drivers.length === 0 ? (
          <div className="opacity-60 text-xs py-3 text-center">لا سائق يشارك موقعه حالياً — اطلب من السائقين تفعيل مشاركة الموقع من تطبيق السائق</div>
        ) : (
          <div className="space-y-1.5">
            {data.drivers.map((d) => {
              const m = minsSince(d.last_ping);
              const fresh = m !== null && m < 3;
              return (
                <div key={d.id} className="flex items-center gap-2 bg-white/5 rounded-lg p-2 text-xs" data-testid={`driver-card-${d.id}`}>
                  <span className={`w-2 h-2 rounded-full ${fresh ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></span>
                  <div className="flex-1">
                    <div className="font-bold">{d.name}</div>
                    <div className="opacity-60 text-[10px]">{d.lat?.toFixed(4)}, {d.lng?.toFixed(4)} · {m !== null ? `آخر تحديث قبل ${m} د` : 'لم يحدّث'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="text-[10px] opacity-50 text-center">🛰️ تحديثات فورية عبر WebSocket — لا حاجة للتحديث اليدوي</div>

      {/* ASSIGN DRIVER MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/80 z-[1100] flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)} data-testid="assign-modal">
          <div onClick={(e) => e.stopPropagation()} className="bg-slate-900 text-white rounded-2xl max-w-md w-full p-5 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black">تعيين سائق للطلب #{selectedOrder.id.slice(0, 6)}</h3>
              <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 rounded-full bg-white/10">✕</button>
            </div>
            <div className="text-xs opacity-70 mb-3">اختر السائق الأنسب:</div>
            <div className="space-y-2 max-h-[50vh] overflow-auto">
              {data.drivers.length === 0 ? (
                <div className="text-center py-6 opacity-60 text-xs">لا سائقون متصلون حالياً</div>
              ) : data.drivers.map((d) => (
                <button key={d.id} onClick={() => assignDriver(selectedOrder.id, d.id)}
                  disabled={assigning}
                  className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-lg text-right flex items-center justify-between disabled:opacity-50"
                  data-testid={`pick-driver-${d.id}`}>
                  <div>
                    <div className="font-bold text-sm">{d.name}</div>
                    <div className="text-[10px] opacity-60">{d.lat?.toFixed(3)}, {d.lng?.toFixed(3)}</div>
                  </div>
                  <span className="text-green-400">←</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   DASHBOARD — authenticated
   ================================================================ */
function Dashboard({ slug, token, onLogout }) {
  const [project, setProject] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [tab, setTab] = useState('overview'); // overview | edit | messages | support | password
  const [loading, setLoading] = useState(true);
  const [showTour, setShowTour] = useState(() => !localStorage.getItem(`zx_tour_done_${slug}`));

  const loadAll = useCallback(async () => {
    try {
      const [sR, aR] = await Promise.all([
        fetch(`${API}/api/websites/client/session`, { headers: authH(token) }),
        fetch(`${API}/api/websites/client/analytics`, { headers: authH(token) }),
      ]);
      if (sR.status === 401 || aR.status === 401) { onLogout(); return; }
      const s = await sR.json();
      const a = await aR.json();
      setProject(s);
      setAnalytics(a);
    } catch (_) { toast.error('فشل التحميل'); }
    finally { setLoading(false); }
  }, [token, onLogout]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const logout = async () => {
    try { await fetch(`${API}/api/websites/client/logout`, { method: 'POST', headers: authH(token) }); } catch (_) {}
    localStorage.removeItem(`zx_client_token_${slug}`);
    onLogout();
  };

  if (loading) {
    return <div className="min-h-screen bg-[#050815] flex items-center justify-center text-white"><RefreshCw className="w-6 h-6 animate-spin" /></div>;
  }

  const publicUrl = `${window.location.origin}/sites/${slug}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050815] via-[#0b0f1f] to-[#050815] text-white" dir="rtl" data-testid="client-dashboard">
      <header className="sticky top-0 z-20 bg-[#0e1128]/90 backdrop-blur border-b border-white/10 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-3 flex-wrap">
          <div className="w-9 h-9 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center font-black text-black">Z</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold truncate" data-testid="dashboard-site-name">{project?.name || slug}</div>
            <div className="text-[11px] opacity-60 truncate">لوحة تحكم العميل</div>
          </div>
          <a href={publicUrl} target="_blank" rel="noreferrer" className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg font-bold flex items-center gap-1.5" data-testid="visit-site-btn">
            <ExternalLink className="w-3.5 h-3.5" />زيارة موقعي
          </a>
          <button onClick={logout} className="text-xs px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg font-bold flex items-center gap-1.5" data-testid="logout-btn">
            <LogOut className="w-3.5 h-3.5" />خروج
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Welcome hero */}
        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-4 md:p-5 mb-5" data-testid="welcome-hero">
          <div className="flex items-start gap-3 flex-wrap">
            <CheckCircle2 className="w-9 h-9 text-green-400 shrink-0" />
            <div className="flex-1">
              <h2 className="text-base md:text-lg font-bold mb-1">موقعك يعمل الآن! 🎉</h2>
              <p className="text-xs md:text-sm opacity-80">موقعك على الإنترنت متاح ليراه الجميع. من هنا تستطيع مراقبة الزوار والرسائل وتعديل المحتوى.</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-5">
          <Stat icon={Users} label="زيارات" value={analytics?.visits ?? 0} accent="text-blue-300" />
          <Stat icon={MessageSquare} label="رسائل" value={analytics?.messages_total ?? 0} accent="text-pink-300" />
          <Stat icon={BarChart3} label="أقسام" value={analytics?.sections_count ?? 0} accent="text-green-300" />
          <Stat icon={MessageSquare} label="جديدة" value={analytics?.messages_unread ?? 0} accent="text-yellow-300" />
        </div>

        {/* Tabs — conditional per vertical */}
        <div className="flex gap-1 mb-4 bg-white/3 rounded-xl p-1 overflow-x-auto" data-testid="dashboard-tabs">
          {(() => {
            const v = project?.vertical;
            const hasBookings = ['salon', 'pets', 'medical', 'gym'].includes(v);
            const hasProducts = v === 'ecommerce';
            const hasListings = v === 'realestate';
            const hasOrders = ['restaurant', 'ecommerce'].includes(v) || !v;
            const base = [
              { id: 'overview', label: 'نظرة عامة', icon: BarChart3 },
            ];
            if (hasBookings) {
              base.push({ id: 'bookings', label: '📅 المواعيد', icon: BarChart3 });
              base.push({ id: 'services', label: '✂️ الخدمات', icon: Key });
            }
            if (hasProducts) {
              base.push({ id: 'products', label: '📦 المنتجات', icon: Key });
            }
            if (hasListings) {
              base.push({ id: 'listings', label: '🏠 العقارات', icon: MapPin });
            }
            if (hasOrders) {
              base.push({ id: 'orders', label: 'الطلبات', icon: MessageSquare });
              base.push({ id: 'livemap', label: '🗺️ خريطة حية', icon: MapPin });
              base.push({ id: 'drivers', label: 'السائقون', icon: ExternalLink });
              base.push({ id: 'delivery', label: 'التوصيل', icon: MapPin });
            }
            base.push(
              { id: 'customers', label: 'العملاء', icon: Users },
              { id: 'payments', label: '💳 الدفع', icon: Key },
              { id: 'widgets', label: '🎨 الأدوات', icon: Key },
              { id: 'coupons', label: '🎟️ كوبونات', icon: Key },
              { id: 'loyalty', label: '🎁 النقاط', icon: CheckCircle2 },
              { id: 'edit', label: 'المحتوى', icon: Edit3 },
              { id: 'messages', label: 'الرسائل', icon: MessageSquare },
              { id: 'support', label: 'الدعم', icon: RefreshCw },
              { id: 'password', label: 'الأمان', icon: Key },
            );
            return base;
          })().map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 px-3 py-2 rounded-lg text-xs md:text-sm font-bold flex items-center gap-1.5 transition ${tab === t.id ? 'bg-yellow-500 text-black' : 'hover:bg-white/5'}`}
              data-testid={`tab-${t.id}`}
            >
              <t.icon className="w-3.5 h-3.5" />{t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-3" data-testid="overview-tab">
            <div className="bg-white/3 border border-white/10 rounded-2xl p-4">
              <h3 className="font-bold mb-3 flex items-center gap-2"><ExternalLink className="w-4 h-4" />روابط موقعك</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
                  <div className="flex-1 text-xs opacity-80 truncate font-mono">{publicUrl}</div>
                  <button onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success('تم النسخ'); }} className="p-1 hover:bg-white/10 rounded" data-testid="copy-public-url"><Copy className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
            <div className="bg-white/3 border border-white/10 rounded-2xl p-4">
              <h3 className="font-bold mb-3 flex items-center gap-2"><Users className="w-4 h-4" />آخر نشاط</h3>
              <div className="text-xs opacity-70">
                {analytics?.approved_at ? `الموقع معتمد منذ ${new Date(analytics.approved_at).toLocaleDateString('ar-SA')}` : 'الموقع قيد الإعداد'}
              </div>
              <div className="text-xs opacity-70 mt-1">{analytics?.visits || 0} زائر حتى الآن · {analytics?.messages_unread || 0} رسالة جديدة</div>
            </div>
          </div>
        )}

        {tab === 'edit' && (
          <div data-testid="edit-tab">
            <div className="text-xs opacity-60 mb-2">اضغط ✏️ لتعديل أي قسم. التعديلات تُحفظ فوراً.</div>
            <SectionsEditor project={project} token={token} onUpdated={loadAll} />
          </div>
        )}

        {tab === 'orders' && <OrdersTab token={token} />}
        {tab === 'bookings' && <BookingsTab token={token} />}
        {tab === 'services' && <ServicesTab token={token} />}
        {tab === 'products' && <ProductsTab token={token} />}
        {tab === 'listings' && <ListingsTab token={token} />}
        {tab === 'livemap' && <LiveMapTab token={token} slug={slug} />}
        {tab === 'customers' && <CustomersTab token={token} />}
        {tab === 'drivers' && <DriversTab token={token} />}
        {tab === 'delivery' && <DeliverySettingsTab token={token} slug={slug} />}
        {tab === 'payments' && <PaymentGatewaysTab token={token} />}
        {tab === 'widgets' && <WidgetCustomizerTab token={token} slug={slug} />}
        {tab === 'coupons' && <CouponsTab token={token} />}
        {tab === 'loyalty' && <LoyaltyTab token={token} />}

        {tab === 'messages' && <MessagesTab token={token} />}

        {tab === 'support' && <SupportTab token={token} />}

        {tab === 'password' && <PasswordTab token={token} />}
      </div>

      {/* 🆕 Welcome Tour — first-time onboarding */}
      {showTour && (
        <WelcomeTour
          siteName={project?.name || slug}
          publicUrl={publicUrl}
          onDone={() => { localStorage.setItem(`zx_tour_done_${slug}`, '1'); setShowTour(false); }}
        />
      )}
    </div>
  );
}

/* ================================================================
   WELCOME TOUR — interactive first-time onboarding
   ================================================================ */
function WelcomeTour({ siteName, publicUrl, onDone }) {
  const [step, setStep] = useState(0);
  const STEPS = [
    { icon: '🎉', title: 'مرحباً بك في لوحة تحكم موقعك', body: `موقعك "${siteName}" جاهز وعلى الإنترنت الآن. من هنا ستدير كل شيء بنفسك.` },
    { icon: '📊', title: 'تابع زوارك ورسائلك', body: 'الإحصائيات في الأعلى تعرض عدد الزوار، الرسائل الواردة، والأقسام.' },
    { icon: '✏️', title: 'عدّل محتوى موقعك بسهولة', body: 'من تبويب "تعديل المحتوى" يمكنك تغيير النصوص، إخفاء/إظهار الأقسام، دون أي برمجة.' },
    { icon: '💬', title: 'استقبل رسائل عملائك', body: 'كل من يراسلك عبر نموذج "تواصل معنا" سيظهر هنا مباشرةً.' },
    { icon: '🛠️', title: 'احصل على الدعم الفني', body: 'من تبويب "الدعم الفني" تقدم طلب تعديل أو إصلاح، وسيتم الرد سريعاً.' },
    { icon: '🔐', title: 'كلمة مرورك بيدك', body: 'غيّر كلمة المرور الآن — لأمان أكبر. موقعك ورابطه الخاص جاهز للمشاركة.' },
  ];
  const cur = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 bg-black/85 z-[70] flex items-center justify-center p-4" dir="rtl" data-testid="welcome-tour">
      <div className="bg-[#0e1128] rounded-2xl max-w-md w-full border border-yellow-500/40 p-6 shadow-[0_30px_80px_rgba(234,179,8,0.2)]">
        <div className="text-center mb-4">
          <div className="text-5xl mb-2">{cur.icon}</div>
          <div className="text-lg font-black text-white mb-1">{cur.title}</div>
          <div className="text-sm opacity-80">{cur.body}</div>
        </div>
        {/* Dots */}
        <div className="flex justify-center gap-1 mb-4">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-yellow-500' : 'w-1.5 bg-white/20'}`} />
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onDone} className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold" data-testid="tour-skip">تخطّي</button>
          {isLast ? (
            <button onClick={onDone} className="flex-[2] py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-lg font-black" data-testid="tour-done">✨ ابدأ الاستخدام</button>
          ) : (
            <button onClick={() => setStep(step + 1)} className="flex-[2] py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-lg font-black" data-testid="tour-next">التالي ←</button>
          )}
        </div>
        {isLast && (
          <div className="mt-3 text-center">
            <a href={publicUrl} target="_blank" rel="noreferrer" className="text-[11px] text-yellow-300 underline" data-testid="tour-visit">↗ افتح موقعي الآن</a>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   ROOT PAGE
   ================================================================ */
export default function ClientDashboardPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(() => localStorage.getItem(`zx_client_token_${slug}`) || '');

  useEffect(() => {
    if (!token) return;
    // Validate token on mount
    fetch(`${API}/api/websites/client/session`, { headers: authH(token) })
      .then((r) => { if (r.status === 401) { localStorage.removeItem(`zx_client_token_${slug}`); setToken(''); } })
      .catch(() => {});
  }, [token, slug]);

  if (!slug) { navigate('/'); return null; }

  return token
    ? <Dashboard slug={slug} token={token} onLogout={() => setToken('')} />
    : <LoginCard slug={slug} onLoggedIn={setToken} />;
}
