import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { CreditCard, Check, X } from 'lucide-react';

const AdminPayments = ({ user }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState({});

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/payments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setPayments(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const approvePayment = async (paymentId) => {
    try {
      const token = localStorage.getItem('token');
      const notes = adminNotes[paymentId] || '';
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/payments/${paymentId}/approve?admin_notes=${encodeURIComponent(notes)}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success('تم قبول الدفع');
        fetchPayments();
      }
    } catch (error) {
      toast.error('فشل القبول');
    }
  };

  const rejectPayment = async (paymentId) => {
    try {
      const token = localStorage.getItem('token');
      const notes = adminNotes[paymentId] || '';
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/payments/${paymentId}/reject?admin_notes=${encodeURIComponent(notes)}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success('تم رفض الدفع');
        fetchPayments();
      }
    } catch (error) {
      toast.error('فشل الرفض');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="admin-payments-page">
      <Navbar user={user} />
      
      <div className="container mx-auto px-4 md:px-8 max-w-7xl pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة المدفوعات</h1>
          <p className="text-gray-600">مراجعة والموافقة على المدفوعات</p>
        </div>

        {loading ? (
          <div className="text-center py-12">جاري التحميل...</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {payments.map((payment) => (
              <Card key={payment.id} data-testid={`payment-card-${payment.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <CreditCard className="w-8 h-8 text-green-500" />
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">المبلغ: {payment.amount} ريال</h3>
                          <p className="text-sm text-gray-600">الطلب: {payment.request_id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-4">
                        <span className={`status-badge status-${payment.status}`}>
                          {payment.status === 'pending' && 'معلق'}
                          {payment.status === 'approved' && 'مقبول'}
                          {payment.status === 'rejected' && 'مرفوض'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(payment.created_at).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">عرض إثبات الدفع</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>إثبات الدفع</DialogTitle>
                          </DialogHeader>
                          <img src={payment.proof_image_url} alt="إثبات الدفع" className="w-full rounded" />
                        </DialogContent>
                      </Dialog>
                    </div>
                    {payment.status === 'pending' && (
                      <div className="flex flex-col gap-2">
                        <Input
                          placeholder="ملاحظات (اختياري)"
                          value={adminNotes[payment.id] || ''}
                          onChange={(e) => setAdminNotes({ ...adminNotes, [payment.id]: e.target.value })}
                          className="mb-2"
                        />
                        <Button
                          size="sm"
                          onClick={() => approvePayment(payment.id)}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <Check className="w-4 h-4 me-2" />
                          قبول
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => rejectPayment(payment.id)}
                        >
                          <X className="w-4 h-4 me-2" />
                          رفض
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPayments;
