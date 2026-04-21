import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { LogIn, RefreshCw, MapPin, Package, Phone, LogOut } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;
const authH = (token) => ({ Authorization: `DriverToken ${token}` });

function DriverLogin({ slug, onLoggedIn }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const r = await fetch(`${API}/api/websites/driver/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, phone, password }),
      });
      const d = await r.json();
      if (!r.ok) { setErr(d.detail || 'فشل'); return; }
      localStorage.setItem(`zx_driver_tk_${slug}`, d.token);
      onLoggedIn(d);
    } catch (_) { setErr('تعذّر الاتصال'); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050815] to-[#0b0f1f] flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm bg-[#0e1128] border border-yellow-500/30 rounded-2xl p-6" data-testid="driver-login">
        <div className="text-center mb-5">
          <div className="text-5xl mb-2">🛵</div>
          <h1 className="text-xl font-black">لوحة السائق</h1>
          <p className="text-xs opacity-60 mt-1">{slug}</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="رقم الجوال" className="w-full px-3 py-2.5 bg-white/5 border border-white/15 rounded-lg text-sm" required data-testid="driver-phone-input" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة المرور" className="w-full px-3 py-2.5 bg-white/5 border border-white/15 rounded-lg text-sm" required data-testid="driver-password-input" />
          {err && <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/30 rounded px-2 py-1.5">{err}</div>}
          <button type="submit" disabled={busy} className="w-full py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-lg font-black flex items-center justify-center gap-2 disabled:opacity-50" data-testid="driver-login-btn">
            {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            دخول
          </button>
        </form>
      </div>
    </div>
  );
}

function DriverPanel({ slug, token, info, onLogout }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locTracking, setLocTracking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/websites/driver/${slug}/orders`, { headers: authH(token) });
      if (r.status === 401) { onLogout(); return; }
      const d = await r.json();
      setOrders(d.orders || []);
    } catch (_) {} finally { setLoading(false); }
  }, [slug, token, onLogout]);
  useEffect(() => { load(); const id = setInterval(load, 30000); return () => clearInterval(id); }, [load]);

  const sendLoc = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (p) => {
      try {
        await fetch(`${API}/api/websites/driver/${slug}/location`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authH(token) },
          body: JSON.stringify({ lat: p.coords.latitude, lng: p.coords.longitude }),
        });
      } catch (_) {}
    }, () => {}, { timeout: 8000 });
  }, [slug, token]);

  useEffect(() => {
    if (!locTracking) return;
    sendLoc();
    const id = setInterval(sendLoc, 30000);
    return () => clearInterval(id);
  }, [locTracking, sendLoc]);

  const STATUS_LABEL = { pending: '⏳', accepted: '✓', preparing: '👨‍🍳', ready: '📦', on_the_way: '🛵 في الطريق', delivered: '✅ تم التوصيل', cancelled: '❌' };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050815] to-[#0b0f1f] text-white" dir="rtl" data-testid="driver-panel">
      <header className="sticky top-0 z-20 bg-[#0e1128]/90 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 bg-yellow-500 text-black rounded-xl flex items-center justify-center text-lg">🛵</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold truncate">{info?.driver?.name || 'السائق'}</div>
          <div className="text-[11px] opacity-60">{info?.site || slug}</div>
        </div>
        <button onClick={() => setLocTracking((v) => !v)} className={`text-[11px] px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 ${locTracking ? 'bg-green-500 text-black' : 'bg-white/10 hover:bg-white/20'}`} data-testid="toggle-location">
          <MapPin className="w-3.5 h-3.5" />{locTracking ? 'موقعي نشط' : 'بدء مشاركة موقعي'}
        </button>
        <button onClick={onLogout} className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-300" data-testid="driver-logout"><LogOut className="w-4 h-4" /></button>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-black">طلباتي المعيّنة ({orders.length})</h2>
          <button onClick={load} className="p-1.5 hover:bg-white/10 rounded" data-testid="refresh-orders"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
        {orders.length === 0 ? (
          <div className="text-center py-12 bg-white/3 border border-dashed border-white/15 rounded-2xl">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <div className="text-sm opacity-60">لا توجد طلبات معيّنة لك حالياً</div>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="bg-white/5 border border-white/10 rounded-xl p-3" data-testid={`driver-order-${o.id}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold">#{o.id.slice(0, 8)}</span>
                  <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-bold">{STATUS_LABEL[o.status] || o.status}</span>
                </div>
                <div className="text-sm font-bold">{o.customer_name}</div>
                <div className="text-xs opacity-80 mb-1">📍 {o.address || '—'}</div>
                {o.lat && o.lng && (
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${o.lat},${o.lng}`} target="_blank" rel="noreferrer" className="inline-block text-[11px] bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 px-2 py-1 rounded mb-2" data-testid={`nav-${o.id}`}>🗺 فتح الخريطة</a>
                )}
                <div className="text-[11px] opacity-70 mb-2">{o.items.map((i) => `${i.name} ×${i.qty}`).join(' · ')}</div>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-black text-yellow-400">{o.total} ر.س</div>
                  <a href={`tel:${o.customer_phone}`} className="text-xs bg-green-500/20 hover:bg-green-500/40 text-green-300 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1"><Phone className="w-3 h-3" />اتصل بالعميل</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DriverDashboardPage() {
  const { slug } = useParams();
  const [token, setToken] = useState(() => localStorage.getItem(`zx_driver_tk_${slug}`) || '');
  const [info, setInfo] = useState(null);

  const logout = () => { localStorage.removeItem(`zx_driver_tk_${slug}`); setToken(''); setInfo(null); };

  if (!slug) return <div>Missing slug</div>;
  return token
    ? <DriverPanel slug={slug} token={token} info={info} onLogout={logout} />
    : <DriverLogin slug={slug} onLoggedIn={(d) => { setToken(d.token); setInfo(d); }} />;
}
