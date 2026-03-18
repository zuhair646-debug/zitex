import React from 'react';
import { Navbar, ZitexLogo } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Zap, Shield, Globe, Image, Video, Code, ArrowLeft, CheckCircle } from 'lucide-react';

const LandingPage = ({ user }) => {
  const navigate = useNavigate();

  const services = [
    { icon: <Globe className="w-10 h-10" />, title: 'إنشاء المواقع', desc: 'مواقع احترافية مخصصة بالذكاء الاصطناعي', color: 'from-blue-500 to-cyan-500' },
    { icon: <Image className="w-10 h-10" />, title: 'توليد الصور', desc: 'صور إبداعية بتقنية AI متقدمة', color: 'from-purple-500 to-pink-500' },
    { icon: <Video className="w-10 h-10" />, title: 'إنشاء الفيديو', desc: 'فيديوهات احترافية من النص', color: 'from-orange-500 to-red-500' },
    { icon: <Code className="w-10 h-10" />, title: 'تطوير متكامل', desc: 'أحدث التقنيات البرمجية', color: 'from-green-500 to-emerald-500' },
  ];

  const features = [
    { icon: <Sparkles className="w-6 h-6 text-blue-400" />, title: 'ذكاء اصطناعي متطور', desc: 'نستخدم GPT-5.2 و Gemini لأفضل النتائج' },
    { icon: <Zap className="w-6 h-6 text-yellow-400" />, title: 'سرعة فائقة', desc: 'نتائج فورية وتسليم سريع' },
    { icon: <Shield className="w-6 h-6 text-green-400" />, title: 'أمان مطلق', desc: 'حماية كاملة لبياناتك ومشاريعك' },
  ];

  const pricing = [
    { title: 'توليد الصور', price: '100', unit: 'ريال/شهر', desc: 'صور لا محدودة', single: '10 ريال للصورة' },
    { title: 'إنشاء الفيديو', price: '150', unit: 'ريال/شهر', desc: 'فيديوهات متعددة', single: '20 ريال للفيديو' },
    { title: 'إنشاء المواقع', price: 'نقاط', unit: 'حسب الاستهلاك', desc: 'أسعار تنافسية', single: 'ابتداءً من 50 نقطة' },
  ];

  return (
    <div className="min-h-screen bg-slate-900" data-testid="landing-page">
      <Navbar user={user} transparent />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-transparent"></div>
        <div className="absolute top-20 right-10 w-72 h-72 bg-blue-500/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-4 md:px-8 max-w-7xl relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-8">
              <ZitexLogo size="lg" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6 text-white" data-testid="hero-title">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Zitex</span>
              <br />
              <span className="text-3xl md:text-4xl font-medium text-gray-300">منصة الإبداع بالذكاء الاصطناعي</span>
            </h1>
            <p className="text-lg md:text-xl leading-relaxed text-gray-400 mb-10 max-w-2xl mx-auto" data-testid="hero-description">
              أنشئ مواقع احترافية، ولّد صوراً إبداعية، واصنع فيديوهات مذهلة - كل ذلك بقوة الذكاء الاصطناعي
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate(user ? '/dashboard' : '/register')}
                data-testid="hero-cta-btn"
                className="h-14 px-10 text-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25"
              >
                <Sparkles className="w-5 h-5 me-2" />
                {user ? 'لوحة التحكم' : 'ابدأ مجاناً'}
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/pricing')}
                data-testid="hero-pricing-btn"
                className="h-14 px-10 text-lg border-white/20 text-white hover:bg-white/10"
              >
                عرض الأسعار
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-slate-800/50">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4" data-testid="services-title">
              خدماتنا
            </h2>
            <p className="text-gray-400 text-lg">كل ما تحتاجه لإطلاق مشروعك الرقمي</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, idx) => (
              <Card key={idx} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all group cursor-pointer" data-testid={`service-card-${idx}`}>
                <CardContent className="p-6 text-center">
                  <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{service.title}</h3>
                  <p className="text-gray-400">{service.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                لماذا <span className="text-blue-400">Zitex</span>؟
              </h2>
              <div className="space-y-6">
                {features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">{feature.title}</h3>
                      <p className="text-gray-400">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-8 flex items-center justify-center">
                <ZitexLogo size="lg" />
                <div className="absolute inset-0 rounded-3xl border border-white/10"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 bg-slate-800/50">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              أسعار تنافسية
            </h2>
            <p className="text-gray-400 text-lg">خطط مرنة تناسب احتياجاتك</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {pricing.map((plan, idx) => (
              <Card key={idx} className="bg-slate-800 border-slate-700 hover:border-blue-500/50 transition-all">
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-semibold text-white mb-4">{plan.title}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-blue-400">{plan.price}</span>
                    <span className="text-gray-400 ms-2">{plan.unit}</span>
                  </div>
                  <p className="text-gray-400 mb-2">{plan.desc}</p>
                  <p className="text-sm text-gray-500">أو {plan.single}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center">
            <Button 
              size="lg"
              onClick={() => navigate('/pricing')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              عرض جميع الأسعار
              <ArrowLeft className="w-5 h-5 ms-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            جاهز لبدء الإبداع؟
          </h2>
          <p className="text-xl text-gray-400 mb-10">
            انضم إلى آلاف المستخدمين وابدأ رحلتك مع Zitex
          </p>
          <Button 
            size="lg"
            onClick={() => navigate('/register')}
            className="h-14 px-12 text-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25"
          >
            إنشاء حساب مجاني
            <ArrowLeft className="w-5 h-5 ms-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-800">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ZitexLogo size="sm" />
              <span className="text-white font-semibold">Zitex</span>
            </div>
            <p className="text-sm text-gray-500">
              © 2024 Zitex. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
