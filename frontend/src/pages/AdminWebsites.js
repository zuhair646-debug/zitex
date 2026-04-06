import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Globe, Plus } from 'lucide-react';

const AdminWebsites = ({ user }) => {
  const [websites, setWebsites] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newWebsite, setNewWebsite] = useState({
    request_id: '',
    url: '',
    preview_image: '',
    content: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [websitesRes, requestsRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/websites`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/requests`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      const websitesData = await websitesRes.json();
      const requestsData = await requestsRes.json();
      setWebsites(websitesData);
      setRequests(requestsData.filter(r => r.status === 'completed'));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/websites/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newWebsite)
      });

      if (res.ok) {
        toast.success('تم إضافة الموقع بنجاح');
        setIsDialogOpen(false);
        fetchData();
        setNewWebsite({ request_id: '', url: '', preview_image: '', content: '' });
      }
    } catch (error) {
      toast.error('فشل إضافة الموقع');
    }
  };

  const updateStatus = async (websiteId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/websites/${websiteId}/status?status=${newStatus}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success('تم تحديث الحالة');
        fetchData();
      }
    } catch (error) {
      toast.error('فشل التحديث');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="admin-websites-page">
      <Navbar user={user} />
      
      <div className="container mx-auto px-4 md:px-8 max-w-7xl pt-24 pb-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة المواقع</h1>
            <p className="text-gray-600">إضافة وتحديث المواقع المنجزة</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-website-btn">
                <Plus className="w-4 h-4 me-2" />
                إضافة موقع
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة موقع جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>اختر الطلب</Label>
                  <Select
                    value={newWebsite.request_id}
                    onValueChange={(value) => setNewWebsite({ ...newWebsite, request_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر طلب" />
                    </SelectTrigger>
                    <SelectContent>
                      {requests.map((req) => (
                        <SelectItem key={req.id} value={req.id}>
                          {req.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>رابط الموقع</Label>
                  <Input
                    placeholder="https://example.com"
                    value={newWebsite.url}
                    onChange={(e) => setNewWebsite({ ...newWebsite, url: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>رابط صورة المعاينة</Label>
                  <Input
                    placeholder="https://example.com/preview.jpg"
                    value={newWebsite.preview_image}
                    onChange={(e) => setNewWebsite({ ...newWebsite, preview_image: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">إضافة</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12">جاري التحميل...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {websites.map((website) => (
              <Card key={website.id} data-testid={`website-card-${website.id}`}>
                <CardContent className="p-6">
                  <Globe className="w-8 h-8 text-purple-500 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{website.url}</h3>
                  <div className="mb-4">
                    <Select
                      value={website.status}
                      onValueChange={(value) => updateStatus(website.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">مسودة</SelectItem>
                        <SelectItem value="live">منشور</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(website.created_at).toLocaleDateString('ar-SA')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWebsites;
