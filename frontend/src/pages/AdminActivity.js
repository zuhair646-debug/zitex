import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Activity, Image, Video, Globe, CreditCard, Users, 
  Search, Filter, RefreshCw, Clock
} from 'lucide-react';

const AdminActivity = ({ user }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/activity?limit=200`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setActivities(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (action) => {
    if (action.includes('image')) return <Image className="w-5 h-5 text-purple-400" />;
    if (action.includes('video') || action.includes('tts')) return <Video className="w-5 h-5 text-orange-400" />;
    if (action.includes('website')) return <Globe className="w-5 h-5 text-blue-400" />;
    if (action.includes('payment') || action.includes('credit')) return <CreditCard className="w-5 h-5 text-green-400" />;
    if (action.includes('login') || action.includes('register') || action.includes('role') || action.includes('user')) return <Users className="w-5 h-5 text-cyan-400" />;
    return <Activity className="w-5 h-5 text-gray-400" />;
  };

  const getActivityColor = (actionType) => {
    switch (actionType) {
      case 'create': return 'bg-green-500/20 text-green-400';
      case 'edit': return 'bg-blue-500/20 text-blue-400';
      case 'delete': return 'bg-red-500/20 text-red-400';
      case 'download': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getActionTypeLabel = (type) => {
    switch (type) {
      case 'create': return 'إنشاء';
      case 'edit': return 'تعديل';
      case 'delete': return 'حذف';
      case 'download': return 'تحميل';
      default: return type;
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = searchTerm === '' || 
      activity.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.user_email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || activity.action.includes(filterType);
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-slate-900" data-testid="admin-activity-page">
      <Navbar user={user} transparent />
      
      <div className="container mx-auto px-4 md:px-8 max-w-7xl pt-24 pb-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              <Activity className="w-8 h-8 inline me-3 text-blue-400" />
              سجل النشاط
            </h1>
            <p className="text-gray-400">تتبع جميع الأنشطة على المنصة</p>
          </div>
          <Button
            onClick={fetchActivities}
            variant="outline"
            className="border-slate-600 text-white hover:bg-slate-700"
          >
            <RefreshCw className={`w-4 h-4 me-2 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="بحث بالاسم أو البريد أو التفاصيل..."
                  className="bg-slate-700 border-slate-600 text-white pe-10"
                  data-testid="search-input"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="p-2 rounded-md bg-slate-700 border border-slate-600 text-white"
                  data-testid="filter-select"
                >
                  <option value="all">كل الأنشطة</option>
                  <option value="image">الصور</option>
                  <option value="video">الفيديو</option>
                  <option value="tts">الصوت</option>
                  <option value="website">المواقع</option>
                  <option value="payment">المدفوعات</option>
                  <option value="login">تسجيل الدخول</option>
                  <option value="download">التحميلات</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity List */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span>آخر الأنشطة</span>
              <span className="text-sm text-gray-400 font-normal">
                {filteredActivities.length} نشاط
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-gray-400">
                <Clock className="w-8 h-8 mx-auto mb-3 animate-spin" />
                جاري التحميل...
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">لا توجد أنشطة مطابقة</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredActivities.map((activity, idx) => (
                  <div 
                    key={activity.id || idx} 
                    className="flex items-start gap-4 p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition-colors"
                    data-testid={`activity-row-${idx}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center shrink-0">
                      {getActivityIcon(activity.action)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-white font-medium">{activity.user_name}</span>
                        <span className="text-gray-500 text-sm">{activity.user_email}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getActivityColor(activity.action_type)}`}>
                          {getActionTypeLabel(activity.action_type)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">{activity.details || activity.action}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.created_at).toLocaleString('ar-SA')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminActivity;
