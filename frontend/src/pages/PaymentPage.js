import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { 
  CreditCard, Gift, ArrowRight, Check, Shield, Clock, 
  Loader2, AlertCircle, Wallet
} from 'lucide-react';

const PaymentPage = ({ user }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [pricing, setPricing] = useState(null);

  const packageId = searchParams.get('package');
  const packageType = searchParams.get('type') || 'credits';

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchPricing();
  }, [user, navigate]);

  useEffect(() => {
    if (pricing && packageId) {
      let pkg = null;
      if (packageType === 'credits') {
        pkg = pricing.credits_packages?.find(p => p.id === packageId);
      } else if (packageType === 'subscription') {
        const sub = pricing.subscriptions?.[packageId];
        if (sub) {
          pkg = { id: packageId, ...sub };
        }
      }
      setSelectedPackage(pkg);
      setLoading(false);
    }
  }, [pricing, packageId, packageType]);

  const fetchPricing = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/pricing`);
      if (res.ok) {
        const data = await res.json();
        setPricing(data);
      }
    } catch (error) {
      console.error('Error fetching pricing:', error);
      toast.error('فشل تحميل الأسعار');
    }
  };

  const createPayPalOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          package_id: packageId,
          package_type: packageType,
          amount: selectedPackage?.price_usd || 0,
          currency: 'USD'
        })
      });
      const data = await res.json();
      if (data.order_id) {
        return data.order_id;
      }
      throw new Error(data.detail || 'فشل إنشاء الطلب');
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const onPayPalApprove = async (data) => {
    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/payments/capture-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          order_id: data.orderID,
          package_id: packageId,
          package_type: packageType
        })
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(`تم الدفع بنجاح! حصلت على ${result.credits_added || selectedPackage?.credits || 0} نقطة`);
        navigate('/chat');
      } else {
        toast.error(result.detail || 'فشل معالجة الدفع');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء معالجة الدفع');
    } finally {
      setProcessing(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (!selectedPackage) {
    return (
      <div className="min-h-screen bg-slate-900" data-testid="payment-page">
        <Navbar user={user} />
        <div className="pt-24 px-4 flex items-center justify-center">
          <Card className="bg-slate-800 border-slate-700 max-w-md">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">لم يتم تحديد باقة</h2>
              <p className="text-gray-400 mb-4">يرجى اختيار باقة من صفحة الأسعار</p>
              <Button onClick={() => navigate('/pricing')} className="bg-purple-500 hover:bg-purple-600">
                عرض الأسعار
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900" data-testid="payment-page">
      <Navbar user={user} />
      
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white text-center mb-8">إتمام الدفع</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-purple-400" />
                  ملخص الطلب
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-slate-700/50 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {selectedPackage.name}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {packageType === 'credits' 
                      ? `${selectedPackage.credits} نقطة${selectedPackage.bonus ? ` + ${selectedPackage.bonus} هدية` : ''}`
                      : selectedPackage.limit
                    }
                  </p>
                </div>
                
                <div className="border-t border-slate-600 pt-4 space-y-2">
                  <div className="flex justify-between text-gray-400">
                    <span>السعر</span>
                    <span>{selectedPackage.price_sar} ر.س</span>
                  </div>
                  {selectedPackage.bonus > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>هدية</span>
                      <span>+{selectedPackage.bonus} نقطة</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-slate-600">
                    <span>الإجمالي</span>
                    <div className="text-left">
                      <div>{selectedPackage.price_sar} ر.س</div>
                      <div className="text-sm text-gray-400">≈ ${selectedPackage.price_usd}</div>
                    </div>
                  </div>
                </div>
                
                {/* Features */}
                <div className="pt-4 space-y-2">
                  {selectedPackage.features?.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-gray-300 text-sm">
                      <Check className="w-4 h-4 text-green-400" />
                      {feature}
                    </div>
                  )) || (
                    <>
                      <div className="flex items-center gap-2 text-gray-300 text-sm">
                        <Check className="w-4 h-4 text-green-400" />
                        صلاحية دائمة
                      </div>
                      <div className="flex items-center gap-2 text-gray-300 text-sm">
                        <Check className="w-4 h-4 text-green-400" />
                        استخدام فوري
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Payment Methods */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-purple-400" />
                  طريقة الدفع
                </CardTitle>
                <CardDescription className="text-gray-400">
                  اختر طريقة الدفع المناسبة لك
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Payment Method Selection */}
                <div className="space-y-2">
                  <button
                    onClick={() => setPaymentMethod('paypal')}
                    className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                      paymentMethod === 'paypal'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <div className="w-12 h-8 bg-white rounded flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">PayPal</span>
                    </div>
                    <div className="flex-1 text-right">
                      <span className="text-white font-medium">PayPal</span>
                      <p className="text-gray-400 text-xs">دفع آمن بـ PayPal أو بطاقة ائتمان</p>
                    </div>
                    {paymentMethod === 'paypal' && (
                      <Check className="w-5 h-5 text-blue-500" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => setPaymentMethod('card')}
                    disabled
                    className="w-full p-4 rounded-lg border-2 border-slate-600 opacity-50 cursor-not-allowed flex items-center gap-3"
                  >
                    <CreditCard className="w-8 h-8 text-gray-400" />
                    <div className="flex-1 text-right">
                      <span className="text-white font-medium">بطاقة ائتمان مباشرة</span>
                      <p className="text-gray-400 text-xs">قريباً...</p>
                    </div>
                  </button>
                </div>
                
                {/* PayPal Button */}
                {paymentMethod === 'paypal' && (
                  <div className="pt-4">
                    <PayPalScriptProvider 
                      options={{ 
                        clientId: process.env.REACT_APP_PAYPAL_CLIENT_ID || 'sb',
                        currency: 'USD'
                      }}
                    >
                      {processing ? (
                        <div className="text-center py-8">
                          <Loader2 className="w-10 h-10 text-purple-500 animate-spin mx-auto mb-3" />
                          <p className="text-gray-400">جاري معالجة الدفع...</p>
                        </div>
                      ) : (
                        <PayPalButtons
                          style={{ layout: 'vertical', shape: 'rect' }}
                          createOrder={createPayPalOrder}
                          onApprove={onPayPalApprove}
                          onError={(err) => {
                            console.error('PayPal error:', err);
                            toast.error('حدث خطأ في PayPal');
                          }}
                          onCancel={() => toast.info('تم إلغاء الدفع')}
                        />
                      )}
                    </PayPalScriptProvider>
                  </div>
                )}
                
                {/* Security Badge */}
                <div className="pt-4 flex items-center justify-center gap-2 text-gray-400 text-sm">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span>دفع آمن ومشفر 100%</span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Back Button */}
          <div className="mt-8 text-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/pricing')}
              className="text-gray-400 hover:text-white"
            >
              العودة للأسعار
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
