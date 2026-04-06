import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2, Gift, Lock, Coins } from 'lucide-react';

const NewRequest = ({ user }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    business_type: '',
    target_audience: '',
    preferred_colors: ''
  });
  const [aiSuggestions, setAiSuggestions] = useState('');
  const [isTrial, setIsTrial] = useState(false);

  const hasFreeTrial = user?.free_website_trial;
  const hasCredits = (user?.credits || 0) >= 50;
  const isOwner = user?.is_owner;

  const handleSubmit = async (e, asTrial = false) => {
    e.preventDefault();
    
    if (!isOwner && !asTrial && !hasCredits) {
      toast.error('رصيدك غير كافٍ. يرجى شراء نقاط أو جرّب التجربة المجانية');
      return;
    }
    
    if (asTrial && !hasFreeTrial && !isOwner) {
      toast.error('لقد استخدمت تجربتك المجانية. يرجى شراء نقاط');
      return;
    }

    setLoading(true);
    setIsTrial(asTrial);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/requests/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...formData, is_trial: asTrial })
      });

      const data = await res.json();

      if (res.ok) {
        // Auto-generate suggestions
        setGenerating(true);
        const suggestRes = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/requests/${data.id}/generate-suggestions`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const suggestions = await suggestRes.json();
        
        if (suggestRes.ok) {
          setAiSuggestions(suggestions.suggestions);
          if (asTrial) {
            toast.success('تم توليد المعاينة المجانية! للحصول على التفاصيل الكاملة، يرجى شراء نقاط');
          } else {
            toast.success('تم إنشاء الطلب وتوليد الاقتراحات بنجاح!');
          }
        }
        setGenerating(false);
      } else {
        toast.error(data.detail || 'فشل إنشاء الطلب');
      }
    } catch (error) {
      toast.error('حدث خطأ. يرجى المحاولة لاحقاً');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900" data-testid="new-request-page">
      <Navbar user={user} transparent />
      
      <div className="container mx-auto px-4 md:px-8 max-w-4xl pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2" data-testid="page-title">
            طلب موقع جديد
          </h1>
          <p className="text-gray-400">املأ التفاصيل ودع الذكاء الاصطناعي يقترح أفضل التصاميم</p>
        </div>

        {/* Free Trial Info */}
        {hasFreeTrial && !isOwner && (
          <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30 mb-6">
            <CardContent className="p-4 flex items-center gap-4">
              <Gift className="w-10 h-10 text-green-400" />
              <div>
                <p className="text-green-300 font-semibold">لديك تجربة مجانية!</p>
                <p className="text-green-400/70 text-sm">جرّب خدمة إنشاء المواقع واحصل على معاينة محدودة مجاناً</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Credits Info */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Coins className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-white font-semibold">رصيدك الحالي: {user?.credits || 0} نقطة</p>
                <p className="text-gray-400 text-sm">يتطلب إنشاء موقع 50 نقطة على الأقل</p>
              </div>
            </div>
            <Button onClick={() => navigate('/pricing')} variant="outline" className="border-slate-600 text-white">
              شراء نقاط
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">معلومات الموقع</CardTitle>
            <CardDescription className="text-gray-400">أدخل تفاصيل الموقع الذي تريد إنشاءه</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="space-y-2">
                <Label className="text-gray-300">عنوان المشروع *</Label>
                <Input
                  placeholder="مثال: موقع شركة تقنية"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                  data-testid="title-input"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">الوصف العام *</Label>
                <Textarea
                  placeholder="وصف مختصر عن الموقع وأهدافه"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                  data-testid="description-input"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">المتطلبات والمميزات *</Label>
                <Textarea
                  placeholder="مثال: صفحة رئيسية، صفحة عن الشركة، نموذج تواصل، معرض الأعمال"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  required
                  rows={4}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                  data-testid="requirements-input"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">نوع العمل</Label>
                  <Input
                    placeholder="مثال: تقنية، تجارة، خدمات"
                    value={formData.business_type}
                    onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">الجمهور المستهدف</Label>
                  <Input
                    placeholder="مثال: الشباب، الشركات، العائلات"
                    value={formData.target_audience}
                    onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">الألوان المفضلة</Label>
                <Input
                  placeholder="مثال: أزرق، أخضر، رمادي"
                  value={formData.preferred_colors}
                  onChange={(e) => setFormData({ ...formData, preferred_colors: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                />
              </div>

              {aiSuggestions && (
                <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
                  <h3 className="font-semibold text-blue-300 mb-2 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    اقتراحات الذكاء الاصطناعي
                    {isTrial && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">معاينة محدودة</span>}
                  </h3>
                  <p className="text-sm text-blue-200/80 whitespace-pre-wrap">{aiSuggestions}</p>
                  
                  {isTrial && (
                    <div className="mt-4 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Lock className="w-5 h-5 text-yellow-400" />
                        <span className="text-yellow-300 font-semibold">للحصول على التفاصيل الكاملة</span>
                      </div>
                      <p className="text-yellow-200/70 text-sm mb-3">اشترِ نقاط واحصل على التصميم الكامل مع كل التفاصيل الاحترافية</p>
                      <Button onClick={() => navigate('/pricing')} className="bg-yellow-500 hover:bg-yellow-600 text-black">
                        <Coins className="w-4 h-4 me-2" />
                        شراء نقاط الآن
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                {/* Free Trial Button */}
                {hasFreeTrial && !isOwner && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => handleSubmit(e, true)}
                    disabled={generating || loading || !formData.title || !formData.description || !formData.requirements}
                    className="flex-1 border-green-500/50 text-green-400 hover:bg-green-500/10"
                    data-testid="trial-btn"
                  >
                    {generating && isTrial ? (
                      <>
                        <Loader2 className="w-4 h-4 me-2 animate-spin" />
                        جاري التوليد...
                      </>
                    ) : (
                      <>
                        <Gift className="w-4 h-4 me-2" />
                        جرّب مجاناً (معاينة محدودة)
                      </>
                    )}
                  </Button>
                )}
                
                {/* Full Request Button */}
                <Button
                  type="button"
                  onClick={(e) => handleSubmit(e, false)}
                  disabled={loading || generating || (!isOwner && !hasCredits) || !formData.title || !formData.description || !formData.requirements}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  data-testid="submit-request-btn"
                >
                  {(loading || generating) && !isTrial ? (
                    <>
                      <Loader2 className="w-4 h-4 me-2 animate-spin" />
                      جاري التوليد...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 me-2" />
                      إنشاء الطلب الكامل (50 نقطة)
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewRequest;
