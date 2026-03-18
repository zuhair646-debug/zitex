import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, Upload, Sparkles } from 'lucide-react';

const RequestDetails = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPayment, setUploadingPayment] = useState(false);
  const [paymentData, setPaymentData] = useState({ amount: '', proof_base64: '' });

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/requests/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setRequest(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('فشل تحميل الطلب');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentData({ ...paymentData, proof_base64: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setUploadingPayment(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/payments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...paymentData, request_id: id })
      });

      if (res.ok) {
        toast.success('تم رفع إثبات الدفع بنجاح! سيتم مراجعته قريباً');
        setPaymentData({ amount: '', proof_base64: '' });
      } else {
        toast.error('فشل رفع الدفع');
      }
    } catch (error) {
      toast.error('حدث خطأ');
    } finally {
      setUploadingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="container mx-auto px-4 pt-24 text-center">جاري التحميل...</div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="container mx-auto px-4 pt-24 text-center">الطلب غير موجود</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="request-details-page">
      <Navbar user={user} />
      
      <div className="container mx-auto px-4 md:px-8 max-w-4xl pt-24 pb-12">
        <Button variant="ghost" onClick={() => navigate('/dashboard/requests')} className="mb-6">
          ← العودة للطلبات
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{request.title}</span>
              <span className={`status-badge status-${request.status}`}>
                {request.status === 'pending' && 'قيد الانتظار'}
                {request.status === 'in_progress' && 'قيد التنفيذ'}
                {request.status === 'completed' && 'مكتمل'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">الوصف</h3>
              <p className="text-gray-600">{request.description}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">المتطلبات</h3>
              <p className="text-gray-600">{request.requirements}</p>
            </div>
            {request.business_type && (
              <div>
                <h3 className="font-semibold mb-2">نوع العمل</h3>
                <p className="text-gray-600">{request.business_type}</p>
              </div>
            )}
            {request.target_audience && (
              <div>
                <h3 className="font-semibold mb-2">الجمهور المستهدف</h3>
                <p className="text-gray-600">{request.target_audience}</p>
              </div>
            )}
            {request.preferred_colors && (
              <div>
                <h3 className="font-semibold mb-2">الألوان المفضلة</h3>
                <p className="text-gray-600">{request.preferred_colors}</p>
              </div>
            )}
            {request.ai_suggestions && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  اقتراحات الذكاء الاصطناعي
                </h3>
                <p className="text-sm text-blue-800 whitespace-pre-wrap">{request.ai_suggestions}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              رفع إثبات الدفع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">المبلغ المدفوع</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="مثال: 5000"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  required
                  data-testid="payment-amount-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proof">إثبات التحويل (صورة)</Label>
                <Input
                  id="proof"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required
                  data-testid="payment-proof-input"
                />
              </div>
              <Button type="submit" disabled={uploadingPayment} data-testid="submit-payment-btn">
                {uploadingPayment ? 'جاري الرفع...' : 'رفع إثبات الدفع'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RequestDetails;
