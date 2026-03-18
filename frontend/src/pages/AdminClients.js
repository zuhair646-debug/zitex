import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Users, Crown, Coins, Shield, ShieldCheck, ShieldAlert, 
  Activity, Eye, UserX, UserCheck, ChevronDown, ChevronUp,
  Image, Video, Globe, CreditCard, Clock
} from 'lucide-react';

const ROLE_LABELS = {
  owner: { label: 'مالك', color: 'bg-yellow-500', icon: Crown },
  super_admin: { label: 'مدير أعلى', color: 'bg-red-500', icon: ShieldAlert },
  admin: { label: 'مدير', color: 'bg-blue-500', icon: ShieldCheck },
  client: { label: 'عميل', color: 'bg-gray-500', icon: Shield }
};

const AdminClients = ({ user }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState(null);
  const [activityLog, setActivityLog] = useState({});
  const [activityLoading, setActivityLoading] = useState({});

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

  const fetchUserActivity = async (userId) => {
    if (activityLog[userId]) {
      // Toggle expansion
      setExpandedUser(expandedUser === userId ? null : userId);
      return;
    }

    setActivityLoading({ ...activityLoading, [userId]: true });
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/users/${userId}/activity`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setActivityLog({ ...activityLog, [userId]: data });
      setExpandedUser(userId);
    } catch (error) {
      toast.error('فشل جلب سجل النشاط');
    } finally {
      setActivityLoading({ ...activityLoading, [userId]: false });
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/users/${userId}/role?role=${newRole}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('تم تحديث صلاحية المستخدم');
        fetchClients();
      } else {
        const data = await res.json();
        toast.error(data.detail || 'فشل التحديث');
      }
    } catch (error) {
      toast.error('فشل التحديث');
    }
  };

  const toggleUserStatus = async (userId, isActive) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = isActive ? 'deactivate' : 'activate';
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/users/${userId}/${endpoint}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success(isActive ? 'تم تعطيل الحساب' : 'تم تفعيل الحساب');
        fetchClients();
      } else {
        const data = await res.json();
        toast.error(data.detail || 'فشلت العملية');
      }
    } catch (error) {
      toast.error('فشلت العملية');
    }
  };

  const makeOwner = async (userId) => {
    if (!window.confirm('هل أنت متأكد من نقل ملكية الموقع لهذا المستخدم؟')) return;
    
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

  const addFreeTrials = async (userId, images, videos) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/users/${userId}/add-free-trials?images=${images}&videos=${videos}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('تم إضافة التجارب المجانية');
        fetchClients();
      }
    } catch (error) {
      toast.error('فشلت الإضافة');
    }
  };

  const getActivityIcon = (action) => {
    if (action.includes('image')) return <Image className="w-4 h-4 text-purple-400" />;
    if (action.includes('video')) return <Video className="w-4 h-4 text-orange-400" />;
    if (action.includes('website')) return <Globe className="w-4 h-4 text-blue-400" />;
    if (action.includes('payment')) return <CreditCard className="w-4 h-4 text-green-400" />;
    if (action.includes('login') || action.includes('register')) return <Users className="w-4 h-4 text-cyan-400" />;
    return <Activity className="w-4 h-4 text-gray-400" />;
  };

  const currentUserRole = user?.role || 'client';
  const isOwner = user?.is_owner;

  return (
    <div className="min-h-screen bg-slate-900" data-testid="admin-clients-page">
      <Navbar user={user} transparent />
      
      <div className="container mx-auto px-4 md:px-8 max-w-7xl pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            <Users className="w-8 h-8 inline me-3 text-purple-400" />
            إدارة المستخدمين
          </h1>
          <p className="text-gray-400">قائمة جميع المستخدمين مع سجل النشاط والصلاحيات</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-white">جاري التحميل...</div>
        ) : (
          <div className="space-y-4">
            {clients.map((client) => {
              const roleInfo = ROLE_LABELS[client.role] || ROLE_LABELS.client;
              const RoleIcon = roleInfo.icon;
              const isExpanded = expandedUser === client.id;
              const userActivities = activityLog[client.id] || [];

              return (
                <Card key={client.id} className="bg-slate-800 border-slate-700" data-testid={`client-card-${client.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shrink-0">
                        {client.name?.charAt(0) || '?'}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-lg font-semibold text-white">
                            {client.name}
                          </h3>
                          <span className={`text-xs px-2 py-1 rounded-full text-white flex items-center gap-1 ${roleInfo.color}`}>
                            <RoleIcon className="w-3 h-3" />
                            {roleInfo.label}
                          </span>
                          {client.is_owner && (
                            <Crown className="w-5 h-5 text-yellow-400" />
                          )}
                          {!client.is_active && (
                            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full">
                              معطل
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{client.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {client.country || 'SA'} • انضم {new Date(client.created_at).toLocaleDateString('ar-SA')}
                        </p>
                        
                        {/* Stats */}
                        <div className="flex items-center gap-4 mt-3 flex-wrap">
                          <div className="flex items-center gap-1 text-sm">
                            <Coins className="w-4 h-4 text-yellow-400" />
                            <span className="text-yellow-400 font-semibold">{client.credits || 0}</span>
                            <span className="text-gray-500">نقطة</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Image className="w-4 h-4 text-purple-400" />
                            <span className="text-purple-400">{client.free_images || 0}</span>
                            <span className="text-gray-500">صور مجانية</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Video className="w-4 h-4 text-orange-400" />
                            <span className="text-orange-400">{client.free_videos || 0}</span>
                            <span className="text-gray-500">فيديو مجاني</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => fetchUserActivity(client.id)}
                          className="border-slate-600 text-white hover:bg-slate-700"
                          data-testid={`activity-btn-${client.id}`}
                        >
                          {activityLoading[client.id] ? (
                            <Clock className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Activity className="w-4 h-4 me-1" />
                              النشاط
                              {isExpanded ? <ChevronUp className="w-4 h-4 ms-1" /> : <ChevronDown className="w-4 h-4 ms-1" />}
                            </>
                          )}
                        </Button>
                        
                        {!client.is_owner && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleUserStatus(client.id, client.is_active !== false)}
                            className={client.is_active !== false ? 'border-red-500 text-red-400 hover:bg-red-500/20' : 'border-green-500 text-green-400 hover:bg-green-500/20'}
                            data-testid={`toggle-status-btn-${client.id}`}
                          >
                            {client.is_active !== false ? (
                              <>
                                <UserX className="w-4 h-4 me-1" />
                                تعطيل
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-4 h-4 me-1" />
                                تفعيل
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addCredits(client.id, 100)}
                        className="border-slate-600 text-white hover:bg-slate-700"
                      >
                        <Coins className="w-4 h-4 me-1 text-yellow-400" />
                        +100 نقطة
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addFreeTrials(client.id, 3, 3)}
                        className="border-slate-600 text-white hover:bg-slate-700"
                      >
                        <Image className="w-4 h-4 me-1 text-purple-400" />
                        +3 صور/فيديو
                      </Button>
                      
                      {/* Role Change - Only for admins and above */}
                      {(isOwner || currentUserRole === 'super_admin') && !client.is_owner && (
                        <select
                          value={client.role}
                          onChange={(e) => updateUserRole(client.id, e.target.value)}
                          className="px-3 py-1 rounded-md bg-slate-700 border border-slate-600 text-white text-sm"
                          data-testid={`role-select-${client.id}`}
                        >
                          <option value="client">عميل</option>
                          <option value="admin">مدير</option>
                          {isOwner && <option value="super_admin">مدير أعلى</option>}
                        </select>
                      )}
                      
                      {isOwner && !client.is_owner && (
                        <Button
                          size="sm"
                          onClick={() => makeOwner(client.id)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-black"
                        >
                          <Crown className="w-4 h-4 me-1" />
                          نقل الملكية
                        </Button>
                      )}
                    </div>

                    {/* Activity Log */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                          <Activity className="w-5 h-5 text-blue-400" />
                          سجل النشاط
                        </h4>
                        {userActivities.length === 0 ? (
                          <p className="text-gray-500 text-sm">لا يوجد نشاط مسجل</p>
                        ) : (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {userActivities.slice(0, 20).map((activity, idx) => (
                              <div key={activity.id || idx} className="flex items-start gap-3 p-3 bg-slate-700/50 rounded-lg" data-testid={`activity-item-${idx}`}>
                                {getActivityIcon(activity.action)}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-white">{activity.details || activity.action}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(activity.created_at).toLocaleString('ar-SA')}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
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

export default AdminClients;
