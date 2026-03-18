import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Video, Loader2, Play, Sparkles, Clock, Gift } from 'lucide-react';

const VideoGenerator = ({ user }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [freeRemaining, setFreeRemaining] = useState(user?.free_videos || 0);

  useEffect(() => {
    fetchHistory();
    setFreeRemaining(user?.free_videos || 0);
  }, [user]);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/generate/videos/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setHistory(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const generateVideo = async () => {
    if (!prompt.trim()) {
      toast.error('يرجى كتابة وصف للفيديو');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/generate/video?prompt=${encodeURIComponent(prompt)}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();

      if (res.ok) {
        setFreeRemaining(data.free_videos_remaining || 0);
        if (data.was_free) {
          toast.success(`تم إرسال الطلب مجاناً! متبقي ${data.free_videos_remaining} فيديوهات مجانية`);
        } else {
          toast.success('تم إرسال طلب التوليد! سيتم إشعارك عند الانتهاء');
        }
        setPrompt('');
        fetchHistory();
      } else {
        toast.error(data.detail || 'فشل توليد الفيديو');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء التوليد');
    } finally {
      setLoading(false);
    }
  };

  const hasSubscription = user?.subscription_type === 'videos' || user?.is_owner;
  const canGenerate = hasSubscription || freeRemaining > 0;

  return (
    <div className="min-h-screen bg-slate-900" data-testid="video-generator-page">
      <Navbar user={user} transparent />
      
      <div className="container mx-auto px-4 md:px-8 max-w-7xl pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2" data-testid="page-title">
            <Video className="w-8 h-8 inline me-3 text-orange-400" />
            إنشاء الفيديو بالذكاء الاصطناعي
          </h1>
          <p className="text-gray-400">حوّل أفكارك إلى فيديوهات احترافية</p>
        </div>

        {/* Free Trial Banner */}
        {!hasSubscription && freeRemaining > 0 && (
          <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30 mb-6">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Gift className="w-8 h-8 text-green-400" />
                <div>
                  <p className="text-green-300 font-semibold">لديك {freeRemaining} فيديوهات مجانية!</p>
                  <p className="text-green-400/70 text-sm">جرّب الخدمة مجاناً قبل الاشتراك</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!canGenerate && (
          <Card className="bg-yellow-500/10 border-yellow-500/30 mb-6">
            <CardContent className="p-4 flex items-center justify-between">
              <p className="text-yellow-300">انتهت تجاربك المجانية. اشترك للاستمرار في إنشاء الفيديوهات</p>
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
                <Sparkles className="w-5 h-5 text-orange-400" />
                إنشاء فيديو جديد
                {!hasSubscription && freeRemaining > 0 && (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full ms-2">
                    مجاني
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="اكتب وصفاً تفصيلياً للفيديو الذي تريده... مثال: طائر يحلق فوق جبال ثلجية عند شروق الشمس بحركة بطيئة سينمائية"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                data-testid="prompt-input"
              />
              <Button 
                onClick={generateVideo} 
                disabled={loading || !canGenerate}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                data-testid="generate-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 me-2 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4 me-2" />
                    توليد الفيديو {!hasSubscription && freeRemaining > 0 && '(مجاني)'}
                  </>
                )}
              </Button>

              <div className="p-4 bg-slate-700/50 rounded-lg">
                <p className="text-sm text-gray-400 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  توليد الفيديو قد يستغرق من 2-5 دقائق
                </p>
              </div>
            </CardContent>
          </Card>

          {/* History */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">الفيديوهات السابقة</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-12">
                  <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">لا توجد فيديوهات بعد</p>
                  <p className="text-gray-500 text-sm mt-2">جرّب إنشاء فيديوك الأول مجاناً!</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {history.map((item) => (
                    <div key={item.id} className="p-4 bg-slate-700/50 rounded-lg">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-white text-sm mb-2 line-clamp-2">{item.prompt}</p>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              item.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                              item.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {item.status === 'completed' ? 'مكتمل' : item.status === 'processing' ? 'قيد التوليد' : 'فشل'}
                            </span>
                            {item.is_free && (
                              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                                مجاني
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              {new Date(item.created_at).toLocaleDateString('ar-SA')}
                            </span>
                          </div>
                        </div>
                        {item.video_url && (
                          <Button size="sm" variant="outline" className="border-slate-600">
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
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

export default VideoGenerator;
