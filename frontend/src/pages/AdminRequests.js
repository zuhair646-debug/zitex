import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { FileText } from 'lucide-react';

const AdminRequests = ({ user }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setRequests(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (requestId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/requests/${requestId}/status?status=${newStatus}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success('تم تحديث الحالة');
        fetchRequests();
      }
    } catch (error) {
      toast.error('فشل التحديث');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="admin-requests-page">
      <Navbar user={user} />
      
      <div className="container mx-auto px-4 md:px-8 max-w-7xl pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة الطلبات</h1>
          <p className="text-gray-600">جميع طلبات المواقع</p>
        </div>

        {loading ? (
          <div className="text-center py-12">جاري التحميل...</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {requests.map((request) => (
              <Card key={request.id} data-testid={`request-card-${request.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{request.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">{request.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>المعرف: {request.id}</span>
                        <span>{new Date(request.created_at).toLocaleDateString('ar-SA')}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Select
                        value={request.status}
                        onValueChange={(value) => updateStatus(request.id, value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">قيد الانتظار</SelectItem>
                          <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                          <SelectItem value="completed">مكتمل</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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

export default AdminRequests;
