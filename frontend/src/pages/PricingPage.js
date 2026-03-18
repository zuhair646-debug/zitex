import React, { useState, useEffect } from 'react';
import { Navbar, ZitexLogo } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { Check, Globe, Image, Video, Coins, CreditCard, Building2 } from 'lucide-react';

const PricingPage = ({ user }) => {
  const navigate = useNavigate();
  const [paymentSettings, setPaymentSettings] = useState(null);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/settings/payment`)
      .then(res => res.json())
      .then(data => setPaymentSettings(data))
      .catch(console.error);
  }, []);

  const creditsPackages = [
    { id: 'starter', name: 'باقة المبتدئ', credits: 100, price_sar: 50, price_usd: 13, popular: false },
    { id: 'pro', name: 'باقة المحترف', credits: 500, price_sar: 200, price_usd: 53, popular: true },
    { id: 'enterprise', name: 'باقة الأعمال', credits: 2000, price_sar: 700, price_usd: 187, popular: false },
  ];

  const subscriptions = [
    {
      title: 'توليد الصور',
      icon: <Image className="w-8 h-8" />,
      color: 'from-purple-500 to-pink-500',
      monthly: { price_sar: 100, price_usd: 27, features: ['صور لا محدودة', 'جودة عالية HD', 'تنزيل فوري', 'دعم فني'] },
      single: { price_sar: 10, price_usd: 3, label: 'للصورة الواحدة' }
    },
    {
      title: 'إنشاء الفيديو',
      icon: <Video className="w-8 h-8" />,
      color: 'from-orange-500 to-red-500',
      monthly: { price_sar: 150, price_usd: 40, features: ['فيديوهات متعددة', 'مدة حتى 30 ثانية', 'جودة 1080p', 'دعم فني'] },
      single: { price_sar: 20, price_usd: 5, label: 'للفيديو الواحد' }
    },
  ];

  const websiteCredits = [
    { type: 'موقع بسيط', credits: 50, desc: 'صفحة واحدة - landing page' },
    { type: 'موقع متقدم', credits: 150, desc: 'متعدد الصفحات مع لوحة تحكم' },
    { type: 'متجر إلكتروني', credits: 300, desc: 'نظام كامل للتجارة الإلكترونية' },
  ];

  return (
    <div className="min-h-screen bg-slate-900" data-testid="pricing-page">
      <Navbar user={user} transparent />
      
      <div className="container mx-auto px-4 md:px-8 max-w-7xl pt-24 pb-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" data-testid="pricing-title">
            الأسعار والباقات
          </h1>
          <p className="text-gray-400 text-lg">اختر الباقة المناسبة لاحتياجاتك</p>
        </div>

        <Tabs defaultValue="subscriptions" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8 bg-slate-800">
            <TabsTrigger value="subscriptions" className="data-[state=active]:bg-blue-600">الاشتراكات</TabsTrigger>
            <TabsTrigger value="credits" className="data-[state=active]:bg-blue-600">النقاط</TabsTrigger>
            <TabsTrigger value="payment" className="data-[state=active]:bg-blue-600">طرق الدفع</TabsTrigger>
          </TabsList>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {subscriptions.map((sub, idx) => (
                <Card key={idx} className="bg-slate-800 border-slate-700 overflow-hidden">
                  <div className={`h-2 bg-gradient-to-r ${sub.color}`}></div>
                  <CardHeader className="text-center pb-4">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${sub.color} flex items-center justify-center text-white`}>
                      {sub.icon}
                    </div>
                    <CardTitle className="text-2xl text-white">{sub.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Monthly Plan */}
                    <div className="p-6 bg-slate-700/50 rounded-xl">
                      <div className="text-center mb-4">
                        <span className="text-sm text-gray-400">اشتراك شهري</span>
                        <div className="mt-2">
                          <span className="text-4xl font-bold text-white">{sub.monthly.price_sar}</span>
                          <span className="text-gray-400 ms-2">ريال/شهر</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">أو ${sub.monthly.price_usd} دولار</p>
                      </div>
                      <ul className="space-y-2 mb-4">
                        {sub.monthly.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-gray-300">
                            <Check className="w-4 h-4 text-green-400" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button 
                        className={`w-full bg-gradient-to-r ${sub.color}`}
                        onClick={() => navigate(user ? '/dashboard' : '/register')}
                      >
                        اشترك الآن
                      </Button>
                    </div>
                    
                    {/* Single Use */}
                    <div className="p-4 bg-slate-700/30 rounded-xl text-center">
                      <span className="text-gray-400">أو استخدام واحد: </span>
                      <span className="text-white font-semibold">{sub.single.price_sar} ريال</span>
                      <span className="text-gray-500"> ({sub.single.label})</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Website Credits */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-white">إنشاء المواقع</CardTitle>
                    <p className="text-gray-400 text-sm">نظام النقاط - ادفع حسب استهلاكك</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {websiteCredits.map((item, idx) => (
                    <div key={idx} className="p-4 bg-slate-700/50 rounded-xl text-center">
                      <h4 className="text-white font-semibold mb-2">{item.type}</h4>
                      <div className="text-3xl font-bold text-blue-400 mb-2">{item.credits}</div>
                      <p className="text-sm text-gray-400">نقطة</p>
                      <p className="text-xs text-gray-500 mt-2">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Credits Tab */}
          <TabsContent value="credits">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {creditsPackages.map((pkg, idx) => (
                <Card key={idx} className={`bg-slate-800 border-slate-700 relative ${pkg.popular ? 'border-blue-500 ring-2 ring-blue-500/20' : ''}`}>
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-sm px-4 py-1 rounded-full">
                      الأكثر شعبية
                    </div>
                  )}
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-white">
                      <Coins className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{pkg.name}</h3>
                    <div className="text-5xl font-bold text-yellow-400 mb-2">{pkg.credits}</div>
                    <p className="text-gray-400 mb-6">نقطة</p>
                    <div className="space-y-2 mb-6">
                      <p className="text-2xl font-bold text-white">{pkg.price_sar} ريال</p>
                      <p className="text-gray-500">أو ${pkg.price_usd} دولار</p>
                    </div>
                    <Button 
                      className={`w-full ${pkg.popular ? 'bg-blue-500 hover:bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                      onClick={() => navigate(user ? '/dashboard' : '/register')}
                    >
                      شراء الباقة
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Payment Methods Tab */}
          <TabsContent value="payment">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Saudi Arabia */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white">للمقيمين في السعودية</CardTitle>
                      <p className="text-gray-400 text-sm">تحويل بنكي</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {paymentSettings?.bank_name ? (
                    <>
                      <div className="p-4 bg-slate-700/50 rounded-lg">
                        <p className="text-gray-400 text-sm">اسم البنك</p>
                        <p className="text-white font-semibold">{paymentSettings.bank_name}</p>
                      </div>
                      <div className="p-4 bg-slate-700/50 rounded-lg">
                        <p className="text-gray-400 text-sm">رقم الآيبان</p>
                        <p className="text-white font-mono">{paymentSettings.bank_iban}</p>
                      </div>
                      <div className="p-4 bg-slate-700/50 rounded-lg">
                        <p className="text-gray-400 text-sm">اسم صاحب الحساب</p>
                        <p className="text-white font-semibold">{paymentSettings.bank_account_name}</p>
                      </div>
                    </>
                  ) : (
                    <div className="p-6 bg-slate-700/50 rounded-lg text-center">
                      <p className="text-gray-400">سيتم إضافة معلومات الحساب البنكي قريباً</p>
                    </div>
                  )}
                  <p className="text-sm text-gray-500 text-center">
                    بعد التحويل، ارفع إثبات الدفع من لوحة التحكم
                  </p>
                </CardContent>
              </Card>

              {/* International */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white">للعملاء الدوليين</CardTitle>
                      <p className="text-gray-400 text-sm">PayPal</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {paymentSettings?.paypal_email ? (
                    <div className="p-4 bg-slate-700/50 rounded-lg">
                      <p className="text-gray-400 text-sm">PayPal Email</p>
                      <p className="text-white font-semibold">{paymentSettings.paypal_email}</p>
                    </div>
                  ) : (
                    <div className="p-6 bg-slate-700/50 rounded-lg text-center">
                      <p className="text-gray-400">سيتم إضافة معلومات PayPal قريباً</p>
                    </div>
                  )}
                  <p className="text-sm text-gray-500 text-center">
                    أرسل الدفع عبر PayPal ثم ارفع إثبات الدفع
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PricingPage;
