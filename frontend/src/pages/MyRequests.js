import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const MyRequests = ({ user }) => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    fetchRequests();
  }, []);

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'قيد الانتظار', class: 'status-badge status-pending', icon: <Clock className="w-4 h-4" /> },
      in_progress: { label: 'قيد التنفيذ', class: 'status-badge status-in_progress', icon: <AlertCircle className="w-4 h-4" /> },
      completed: { label: 'مكتمل', class: 'status-badge status-completed', icon: <CheckCircle className="w-4 h-4" /> },
    };
    return badges[status] || badges.pending;
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="my-requests-page">
      <Navbar user={user} />
      
      <div className="container mx-auto px-4 md:px-8 max-w-7xl pt-24 pb-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="page-title">طلباتي</h1>
            <p className="text-gray-600">جميع طلبات المواقع الخاصة بك</p>
          </div>
          <Button onClick={() => navigate('/dashboard/new-request')} data-testid="new-request-btn">
            <FileText className="w-4 h-4 me-2" />
            طلب جديد
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">جاري التحميل...</div>
        ) : requests.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد طلبات بعد</h3>
              <p className="text-gray-600 mb-4">ابدأ بإنشاء طلبك الأول</p>
              <Button onClick={() => navigate('/dashboard/new-request')}>
                إنشاء طلب جديد
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {requests.map((request) => {
              const statusInfo = getStatusBadge(request.status);
              return (
                <Card key={request.id} className="hover:shadow-md transition-shadow" data-testid={`request-card-${request.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{request.title}</h3>
                        <p className="text-gray-600 text-sm mb-4">{request.description}</p>
                        <div className="flex items-center gap-2">
                          <span className={statusInfo.class}>{statusInfo.label}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(request.created_at).toLocaleDateString('ar-SA')}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/dashboard/requests/${request.id}`)}
                        data-testid={`view-request-${request.id}`}
                      >
                        عرض التفاصيل
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRequests;
