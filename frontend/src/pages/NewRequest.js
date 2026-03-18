import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2 } from 'lucide-react';

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/requests/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('تم إنشاء الطلب بنجاح!');
        navigate(`/dashboard/requests/${data.id}`);
      } else {
        toast.error(data.detail || 'فشل إنشاء الطلب');
      }
    } catch (error) {
      toast.error('حدث خطأ. يرجى المحاولة لاحقاً');
    } finally {
      setLoading(false);
    }
  };

  const generateSuggestions = async () => {
    if (!formData.title || !formData.description) {
      toast.error('يرجى ملء العنوان والوصف أولاً');
      return;
    }

    setGenerating(true);
    try {
      const token = localStorage.getItem('token');
      
      const createRes = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/requests/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const request = await createRes.json();

      if (createRes.ok) {
        const suggestRes = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/requests/${request.id}/generate-suggestions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const suggestions = await suggestRes.json();
        
        if (suggestRes.ok) {
          setAiSuggestions(suggestions.suggestions);
          toast.success('تم توليد الاقتراحات بنجاح!');
          setTimeout(() => navigate(`/dashboard/requests/${request.id}`), 2000);
        } else {
          toast.error('فشل توليد الاقتراحات');
        }
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء التوليد');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="new-request-page">
      <Navbar user={user} />
      
      <div className="container mx-auto px-4 md:px-8 max-w-4xl pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="page-title">
            طلب موقع جديد
          </h1>
          <p className="text-gray-600">املأ التفاصيل ودع الذكاء الاصطناعي يقترح أفضل التصاميم</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>معلومات الموقع</CardTitle>
            <CardDescription>أدخل تفاصيل الموقع الذي تريد إنشاءه</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">عنوان المشروع *</Label>
                <Input
                  id="title"
                  placeholder="مثال: موقع شركة تقنية"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  data-testid="title-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">الوصف العام *</Label>
                <Textarea
                  id="description"
                  placeholder="وصف مختصر عن الموقع وأهدافه"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                  data-testid="description-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">المتطلبات والمميزات *</Label>
                <Textarea
                  id="requirements"
                  placeholder="مثال: صفحة رئيسية، صفحة عن الشركة، نموذج تواصل، معرض الأعمال"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  required
                  rows={4}
                  data-testid="requirements-input"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business_type">نوع العمل</Label>
                  <Input
                    id="business_type"
                    placeholder="مثال: تقنية، تجارة، خدمات"
                    value={formData.business_type}
                    onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                    data-testid="business-type-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_audience">الجمهور المستهدف</Label>
                  <Input
                    id="target_audience"
                    placeholder="مثال: الشباب، الشركات، العائلات"
                    value={formData.target_audience}
                    onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                    data-testid="target-audience-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferred_colors">الألوان المفضلة</Label>
                <Input
                  id="preferred_colors"
                  placeholder="مثال: أزرق، أخضر، رمادي"
                  value={formData.preferred_colors}
                  onChange={(e) => setFormData({ ...formData, preferred_colors: e.target.value })}
                  data-testid="colors-input"
                />
              </div>

              {aiSuggestions && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">اقتراحات الذكاء الاصطناعي:</h3>
                  <p className="text-sm text-blue-800 whitespace-pre-wrap">{aiSuggestions}</p>
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateSuggestions}
                  disabled={generating || loading}
                  data-testid="generate-suggestions-btn"
                  className="flex-1"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 me-2 animate-spin" />
                      جاري التوليد...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 me-2" />
                      توليد اقتراحات AI
                    </>
                  )}
                </Button>
                
                <Button
                  type="submit"
                  disabled={loading || generating}
                  data-testid="submit-request-btn"
                  className="flex-1"
                >
                  {loading ? 'جاري الإرسال...' : 'إرسال الطلب'}
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
