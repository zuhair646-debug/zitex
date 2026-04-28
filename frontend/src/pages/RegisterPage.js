import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ZitexLogo } from '@/components/Navbar';
import { Gift, Sparkles, ShieldCheck, ArrowLeft } from 'lucide-react';
import SiteBannerStories from '@/components/SiteBannerStories';

const RegisterPage = ({ setUser }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    country: 'SA',
    referral_code: '',
    affiliate_code: ''   // 🆕 paid affiliate
  });
  const [marketerName, setMarketerName] = useState('');

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setFormData(prev => ({ ...prev, referral_code: refCode }));
    }
    // 🆕 Capture affiliate code (paid program)
    const affCode = searchParams.get('aff');
    if (affCode) {
      const code = affCode.toUpperCase();
      setFormData(prev => ({ ...prev, affiliate_code: code }));
      // Validate + show marketer name
      fetch(`${process.env.REACT_APP_BACKEND_URL}/api/affiliate/validate/${code}`)
        .then(r => r.json())
        .then(d => { if (d.valid) setMarketerName(d.marketer_name); })
        .catch(() => {});
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        
        if (data.welcome_message) {
          toast.success(data.welcome_message);
        } else {
          toast.success('تم إنشاء الحساب بنجاح!');
        }
        
        navigate('/chat');
      } else {
        toast.error(data.detail || 'فشل إنشاء الحساب');
      }
    } catch (error) {
      toast.error('حدث خطأ. يرجى المحاولة لاحقاً');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08080f] text-white" data-testid="register-page" dir="rtl">
      {/* Slim luxury header */}
      <header className="fixed top-0 inset-x-0 z-30 backdrop-blur-xl bg-[#08080f]/80 border-b border-amber-500/10">
        <div className="max-w-6xl mx-auto h-14 px-4 md:px-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <ZitexLogo size="md" />
            <span className="font-black text-base tracking-tight bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">Zitex</span>
          </Link>
          <Link to="/login" className="text-xs md:text-sm font-bold text-amber-300/90 hover:text-amber-200 flex items-center gap-1.5 transition-colors" data-testid="login-link-header">
            تسجيل الدخول
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <main className="pt-14 relative">
        <SiteBannerStories placement="outside" />

        <section className="relative max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-16">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute top-1/3 -left-32 w-[420px] h-[420px] rounded-full blur-3xl opacity-25 bg-amber-500/30"></div>
            <div className="absolute bottom-1/4 -right-32 w-[380px] h-[380px] rounded-full blur-3xl opacity-20 bg-yellow-600/30"></div>
          </div>

          <div className="relative grid lg:grid-cols-2 gap-10 items-center">
            {/* Left column — Welcome bonus highlight */}
            <div className="hidden lg:block">
              <div className="space-y-7 max-w-md">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold tracking-wide">
                  <Gift className="w-3.5 h-3.5" />
                  مكافأة ترحيب فاخرة
                </div>
                <h1 className="text-4xl xl:text-5xl font-black leading-[1.15] tracking-tight">
                  <span className="bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent">انضمّ</span> اليوم
                  <br />
                  <span className="text-white/90">واحصل على رصيد فوري</span>
                </h1>
                <div className="space-y-3">
                  <BonusItem emoji="💎" label="20 نقطة هدية ترحيبية" />
                  <BonusItem emoji="🖼️" label="3 توليدات صور (Nano Banana) مجاناً" />
                  <BonusItem emoji="🎬" label="2 توليدات فيديو (Sora 2) مجاناً" />
                  <BonusItem emoji="🌐" label="إنشاء موقع/متجر مجاني تجريبي" />
                </div>
                {marketerName && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-sm" data-testid="affiliate-banner">
                    🤝 تم دعوتك من <b className="text-emerald-300">{marketerName}</b> — ستحصل على نقاط إضافية!
                  </div>
                )}
              </div>
            </div>

            {/* Right column — Registration form */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md">
                <div className="absolute -inset-px rounded-[22px] bg-gradient-to-br from-amber-400/40 via-amber-500/15 to-yellow-600/40 opacity-70 blur-[1.5px]"></div>
                <div className="relative bg-[#0c0c18]/95 backdrop-blur-2xl border border-amber-500/15 rounded-[20px] p-7 md:p-8 shadow-2xl shadow-amber-900/10">
                  <div className="flex flex-col items-center text-center mb-6">
                    <Link to="/" className="mb-4 group">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-xl group-hover:bg-amber-500/30 transition-all"></div>
                        <ZitexLogo size="xl" />
                      </div>
                    </Link>
                    <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent" data-testid="register-title">
                      إنشاء حساب
                    </h2>
                    <p className="text-xs text-white/50 mt-1.5">ابدأ رحلتك مع Zitex مجاناً</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-3.5">
                    <Field label="الاسم (اختياري)">
                      <Input id="name" type="text" placeholder="أحمد محمد"
                        value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="h-11 bg-black/40 border-amber-500/15 text-white placeholder:text-white/30 focus:border-amber-400/60"
                        data-testid="name-input" />
                    </Field>
                    <Field label="البريد الإلكتروني">
                      <Input id="email" type="email" placeholder="example@domain.com" required
                        value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="h-11 bg-black/40 border-amber-500/15 text-white placeholder:text-white/30 focus:border-amber-400/60 font-mono text-sm"
                        data-testid="email-input" />
                    </Field>
                    <Field label="كلمة المرور">
                      <Input id="password" type="password" placeholder="••••••••" required minLength={6}
                        value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="h-11 bg-black/40 border-amber-500/15 text-white placeholder:text-white/30 focus:border-amber-400/60"
                        data-testid="password-input" />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="الدولة">
                        <Select value={formData.country} onValueChange={(value) => setFormData({ ...formData, country: value })}>
                          <SelectTrigger className="h-11 bg-black/40 border-amber-500/15 text-white focus:border-amber-400/60"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-[#0c0c18] border-amber-500/20">
                            <SelectItem value="SA">السعودية</SelectItem>
                            <SelectItem value="AE">الإمارات</SelectItem>
                            <SelectItem value="KW">الكويت</SelectItem>
                            <SelectItem value="QA">قطر</SelectItem>
                            <SelectItem value="BH">البحرين</SelectItem>
                            <SelectItem value="OM">عمان</SelectItem>
                            <SelectItem value="EG">مصر</SelectItem>
                            <SelectItem value="JO">الأردن</SelectItem>
                            <SelectItem value="OTHER">دولة أخرى</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label={<span className="flex items-center gap-1">كود دعوة {formData.referral_code && <Sparkles className="w-3 h-3 text-amber-400" />}</span>}>
                        <Input id="referral" type="text" placeholder="اختياري"
                          value={formData.referral_code}
                          onChange={(e) => setFormData({ ...formData, referral_code: e.target.value.toUpperCase() })}
                          className="h-11 bg-black/40 border-amber-500/15 text-white placeholder:text-white/30 focus:border-amber-400/60 font-mono text-sm"
                          data-testid="referral-input" />
                      </Field>
                    </div>

                    <Button type="submit" disabled={loading}
                      className="w-full h-12 mt-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:via-yellow-400 hover:to-amber-500 text-black font-black tracking-wide shadow-[0_8px_32px_-8px_rgba(245,158,11,.6)]"
                      data-testid="register-submit-btn">
                      {loading ? 'جارٍ الإنشاء...' : '✨ ابدأ مجاناً'}
                    </Button>
                  </form>

                  <div className="text-center text-sm mt-5">
                    <span className="text-white/50">لديك حساب؟ </span>
                    <Link to="/login" className="text-amber-300 hover:text-amber-200 font-bold" data-testid="login-link">تسجيل الدخول</Link>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/30 mt-4">
                  <ShieldCheck className="w-3 h-3" /> بياناتك مشفّرة وآمنة
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <Label className="text-[11px] font-bold tracking-wide text-amber-200/90 uppercase">{label}</Label>
    {children}
  </div>
);

const BonusItem = ({ emoji, label }) => (
  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[.03] border border-white/5">
    <span className="text-2xl">{emoji}</span>
    <span className="text-sm text-white/85 font-medium">{label}</span>
  </div>
);

export default RegisterPage;
