import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ZitexLogo } from '@/components/Navbar';

const LoginPage = ({ setUser }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        toast.success('تم تسجيل الدخول بنجاح!');
        const isAdmin = data.user.role === 'admin' || data.user.role === 'super_admin' || data.user.role === 'owner' || data.user.is_owner;
        navigate(isAdmin ? '/admin' : '/dashboard');
      } else {
        toast.error(data.detail || 'فشل تسجيل الدخول');
      }
    } catch (error) {
      toast.error('حدث خطأ. يرجى المحاولة لاحقاً');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900" data-testid="login-page">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-transparent"></div>
      
      <Card className="w-full max-w-md bg-slate-800 border-slate-700 relative z-10">
        <CardHeader className="text-center">
          <Link to="/" className="flex justify-center mb-4">
            <ZitexLogo size="lg" />
          </Link>
          <CardTitle className="text-2xl text-white" data-testid="login-title">تسجيل الدخول</CardTitle>
          <CardDescription className="text-gray-400">أدخل بياناتك للوصول إلى حسابك</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@domain.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                data-testid="email-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                data-testid="password-input"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700" 
              disabled={loading} 
              data-testid="login-submit-btn"
            >
              {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <span className="text-gray-400">ليس لديك حساب؟ </span>
            <Link to="/register" className="text-blue-400 hover:underline" data-testid="register-link">
              إنشاء حساب جديد
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
