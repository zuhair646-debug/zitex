import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Image, Loader2, Download, Sparkles } from 'lucide-react';

const ImageGenerator = ({ user }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/generate/images/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setHistory(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast.error('يرجى كتابة وصف للصورة');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/generate/image?prompt=${encodeURIComponent(prompt)}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();

      if (res.ok && data.image_url) {
        setGeneratedImage(data.image_url);
        toast.success('تم توليد الصورة بنجاح!');
        fetchHistory();
      } else {
        toast.error(data.detail || 'فشل توليد الصورة');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء التوليد');
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = (imageUrl, filename = 'zitex-image.png') => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasSubscription = user?.subscription_type === 'images' || user?.is_owner;

  return (
    <div className="min-h-screen bg-slate-900" data-testid="image-generator-page">
      <Navbar user={user} transparent />
      
      <div className="container mx-auto px-4 md:px-8 max-w-7xl pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2" data-testid="page-title">
            <Image className="w-8 h-8 inline me-3 text-purple-400" />
            توليد الصور بالذكاء الاصطناعي
          </h1>
          <p className="text-gray-400">أنشئ صوراً إبداعية من وصفك النصي</p>
        </div>

        {!hasSubscription && (
          <Card className="bg-yellow-500/10 border-yellow-500/30 mb-6">
            <CardContent className="p-4 flex items-center justify-between">
              <p className="text-yellow-300">يرجى الاشتراك في باقة الصور للاستفادة من هذه الخدمة</p>
              <Button onClick={() => window.location.href = '/pricing'} variant="outline" className="border-yellow-500 text-yellow-300">
                عرض الأسعار
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Generator */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                إنشاء صورة جديدة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="اكتب وصفاً تفصيلياً للصورة التي تريدها... مثال: قطة لطيفة تجلس على سحابة ملونة في غروب الشمس"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                data-testid="prompt-input"
              />
              <Button 
                onClick={generateImage} 
                disabled={loading || !hasSubscription}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                data-testid="generate-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 me-2 animate-spin" />
                    جاري التوليد...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 me-2" />
                    توليد الصورة
                  </>
                )}
              </Button>

              {/* Generated Image */}
              {generatedImage && (
                <div className="mt-6">
                  <div className="relative rounded-xl overflow-hidden bg-slate-700">
                    <img 
                      src={generatedImage} 
                      alt="Generated" 
                      className="w-full"
                      data-testid="generated-image"
                    />
                    <Button
                      onClick={() => downloadImage(generatedImage)}
                      className="absolute bottom-4 left-4 bg-white/20 backdrop-blur-sm hover:bg-white/30"
                      size="sm"
                    >
                      <Download className="w-4 h-4 me-2" />
                      تحميل
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* History */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">الصور السابقة</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-12">
                  <Image className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">لا توجد صور بعد</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 max-h-[500px] overflow-y-auto">
                  {history.map((item) => (
                    <div key={item.id} className="relative group">
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt={item.prompt}
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full aspect-square bg-slate-700 rounded-lg flex items-center justify-center">
                          <p className="text-gray-500 text-sm">فشل التوليد</p>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-end p-2">
                        <p className="text-white text-xs line-clamp-2">{item.prompt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;
