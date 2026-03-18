import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Users, Crown, Coins } from 'lucide-react';

const AdminClients = ({ user }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setClients(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const makeOwner = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/users/${userId}/make-owner`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('تم تعيين المستخدم كمالك');
        fetchClients();
      }
    } catch (error) {
      toast.error('فشل التعيين');
    }
  };

  const addCredits = async (userId, credits) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/users/${userId}/add-credits?credits=${credits}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success(`تم إضافة ${credits} نقطة`);
        fetchClients();
      }
    } catch (error) {
      toast.error('فشلت الإضافة');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900" data-testid="admin-clients-page">
      <Navbar user={user} transparent />
      
      <div className="container mx-auto px-4 md:px-8 max-w-7xl pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            <Users className="w-8 h-8 inline me-3 text-purple-400" />
            إدارة العملاء
          </h1>
          <p className="text-gray-400">قائمة جميع المستخدمين</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-white">جاري التحميل...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client) => (
              <Card key={client.id} className="bg-slate-800 border-slate-700" data-testid={`client-card-${client.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {client.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        {client.name}
                        {client.is_owner && <Crown className="w-4 h-4 text-yellow-400" />}
                      </h3>
                      <p className="text-sm text-gray-400">{client.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {client.role === 'admin' ? 'أدمن' : 'عميل'} • {client.country || 'SA'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg mb-4">
                    <span className="text-gray-400 text-sm flex items-center gap-2">
                      <Coins className="w-4 h-4" />
                      رصيد النقاط
                    </span>
                    <span className="text-yellow-400 font-bold">{client.credits || 0}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addCredits(client.id, 100)}
                      className="flex-1 border-slate-600 text-white hover:bg-slate-700"
                    >
                      +100 نقطة
                    </Button>
                    {!client.is_owner && (
                      <Button
                        size="sm"
                        onClick={() => makeOwner(client.id)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-black"
                      >
                        <Crown className="w-4 h-4" />
                      </Button>
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

export default AdminClients;
