import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Sparkles, ShieldCheck, Zap, ArrowLeft } from 'lucide-react';
import { ZitexLogo } from '@/components/Navbar';
import SiteBannerStories from '@/components/SiteBannerStories';

const LoginPage = ({ setUser }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'فشل تسجيل الدخول');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      toast.success(`أهلاً ${data.user.name}!`);
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (e2) {
      toast.error(e2.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08080f] text-white" data-testid="login-page" dir="rtl">
      {/* Slim luxury header */}
      <header className="fixed top-0 inset-x-0 z-30 backdrop-blur-xl bg-[#08080f]/80 border-b border-amber-500/10">
        <div className="max-w-6xl mx-auto h-14 px-4 md:px-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group" data-testid="header-home">
            <ZitexLogo size="md" />
            <span className="font-black text-base tracking-tight bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent group-hover:opacity-90">Zitex</span>
          </Link>
          <Link to="/register" className="text-xs md:text-sm font-bold text-amber-300/90 hover:text-amber-200 flex items-center gap-1.5 transition-colors" data-testid="register-link-header">
            إنشاء حساب
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <main className="pt-14 relative">
        {/* Banner + Stories — pure ad rotation, no CTAs */}
        <SiteBannerStories placement="outside" />

        {/* Two-column premium login section */}
        <section className="relative max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-16">
          {/* Subtle ambient glow */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute top-1/3 -right-32 w-[420px] h-[420px] rounded-full blur-3xl opacity-25 bg-amber-500/30"></div>
            <div className="absolute bottom-1/4 -left-32 w-[380px] h-[380px] rounded-full blur-3xl opacity-20 bg-yellow-600/30"></div>
          </div>

          <div className="relative grid lg:grid-cols-2 gap-10 items-center">
            {/* Left column — value proposition / brand */}
            <div className="hidden lg:block order-2">
              <div className="space-y-7 max-w-md">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold tracking-wide">
                  <Sparkles className="w-3.5 h-3.5" />
                  منصّة الذكاء الاصطناعي الفخمة
                </div>
                <h1 className="text-4xl xl:text-5xl font-black leading-[1.15] tracking-tight">
                  <span className="bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent">أنشئ</span> تجربتك الرقمية
                  <br />
                  <span className="text-white/90">بأناقة لا تُضاهى</span>
                </h1>
                <p className="text-base text-white/60 leading-relaxed">
                  مواقع، متاجر، ألعاب، صور، فيديوهات — كل شيء بنقرة. منصّة Zitex تحوّل أفكارك إلى منتجات احترافية جاهزة للنشر.
                </p>
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  <Pill icon={<Zap className="w-3.5 h-3.5" />} label="إنشاء فوري" />
                  <Pill icon={<ShieldCheck className="w-3.5 h-3.5" />} label="مدفوعات Stripe" />
                  <Pill icon={<Sparkles className="w-3.5 h-3.5" />} label="Sora 2 + Nano Banana" />
                  <Pill icon={<span className="text-amber-300">✦</span>} label="25+ نوع متجر" />
                </div>
              </div>
            </div>

            {/* Right column — login card */}
            <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md">
                {/* Gold thin frame */}
                <div className="absolute -inset-px rounded-[22px] bg-gradient-to-br from-amber-400/40 via-amber-500/15 to-yellow-600/40 opacity-70 blur-[1.5px]"></div>
                <div className="relative bg-[#0c0c18]/95 backdrop-blur-2xl border border-amber-500/15 rounded-[20px] p-7 md:p-9 shadow-2xl shadow-amber-900/10">
                  {/* Logo + title */}
                  <div className="flex flex-col items-center text-center mb-7">
                    <Link to="/" className="mb-4 group">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-xl group-hover:bg-amber-500/30 transition-all"></div>
                        <ZitexLogo size="xl" />
                      </div>
                    </Link>
                    <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent" data-testid="login-title">
                      تسجيل الدخول
                    </h2>
                    <p className="text-xs text-white/50 mt-1.5">أهلاً بعودتك — أدخل بياناتك للمتابعة</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-[11px] font-bold tracking-wide text-amber-200/90 uppercase">البريد الإلكتروني</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="example@domain.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="h-11 bg-black/40 border-amber-500/15 text-white placeholder:text-white/30 focus:border-amber-400/60 focus:ring-amber-400/10 font-mono text-sm"
                        data-testid="email-input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-[11px] font-bold tracking-wide text-amber-200/90 uppercase">كلمة المرور</Label>
                        <Link to="/forgot-password" className="text-[11px] text-white/50 hover:text-amber-300 transition-colors">نسيتها؟</Link>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        className="h-11 bg-black/40 border-amber-500/15 text-white placeholder:text-white/30 focus:border-amber-400/60 focus:ring-amber-400/10"
                        data-testid="password-input"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-12 mt-2 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:via-yellow-400 hover:to-amber-500 text-black font-black tracking-wide shadow-[0_8px_32px_-8px_rgba(245,158,11,.6)] hover:shadow-[0_12px_40px_-8px_rgba(245,158,11,.8)] transition-all"
                      disabled={loading}
                      data-testid="login-submit-btn"
                    >
                      {loading ? 'جارٍ تسجيل الدخول...' : 'دخول'}
                    </Button>
                  </form>

                  <div className="relative my-6 flex items-center">
                    <div className="flex-1 h-px bg-amber-500/15"></div>
                    <span className="px-3 text-[10px] tracking-widest font-bold text-amber-300/60">أو</span>
                    <div className="flex-1 h-px bg-amber-500/15"></div>
                  </div>

                  <div className="text-center text-sm">
                    <span className="text-white/50">ليس لديك حساب؟ </span>
                    <Link to="/register" className="text-amber-300 hover:text-amber-200 font-bold transition-colors" data-testid="register-link">
                      أنشئ حساب فاخر مجاناً
                    </Link>
                  </div>
                </div>

                {/* Tiny trust line under card */}
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/30 mt-4 tracking-wide">
                  <ShieldCheck className="w-3 h-3" />
                  محمي بتشفير من الطرف للطرف · بياناتك بأمان
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

const Pill = ({ icon, label }) => (
  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[.03] border border-white/5 text-[11px] text-white/70 font-medium">
    <span className="text-amber-300">{icon}</span>
    {label}
  </div>
);

export default LoginPage;
