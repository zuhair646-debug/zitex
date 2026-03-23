import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, Shield, Menu, X, MessageSquare, Rocket } from 'lucide-react';

export const ZitexLogo = ({ size = 'md', light = false }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14'
  };
  
  return (
    <div className={`${sizes[size]} relative flex items-center justify-center`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id="zGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <path
          d="M20 25 L80 25 L30 75 L80 75"
          stroke="url(#zGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
};

export const Navbar = ({ user, transparent = false, setUser }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    if (setUser) {
      setUser(null);
    }
    navigate('/');
    window.location.reload();
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'owner' || user?.is_owner;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 ${transparent ? 'bg-slate-900/80 backdrop-blur-xl border-b border-white/10' : 'bg-white/95 backdrop-blur-md border-b border-gray-200'}`}>
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3" data-testid="navbar-logo">
            <ZitexLogo size="md" />
            <span className={`text-2xl font-bold ${transparent ? 'text-white' : 'text-gray-900'}`}>Zitex</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/pricing" className={`text-sm font-medium ${transparent ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
              الأسعار
            </Link>
            {user ? (
              <>
                <Button
                  variant={transparent ? "outline" : "default"}
                  onClick={() => navigate('/chat')}
                  data-testid="navbar-chat-btn"
                  className={transparent ? 'bg-gradient-to-r from-purple-500 to-pink-500 border-0 text-white hover:from-purple-600 hover:to-pink-600' : 'bg-gradient-to-r from-purple-500 to-pink-500'}
                >
                  <MessageSquare className="w-4 h-4 me-2" />
                  الشات الذكي
                </Button>
                <Button
                  variant={transparent ? "outline" : "ghost"}
                  onClick={() => navigate('/projects')}
                  data-testid="navbar-projects-btn"
                  className={transparent ? 'border-green-500/50 text-green-400 hover:bg-green-500/20' : 'text-green-400'}
                >
                  <Rocket className="w-4 h-4 me-2" />
                  مشاريعي
                </Button>
                <Button
                  variant={transparent ? "outline" : "ghost"}
                  onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
                  data-testid="navbar-dashboard-btn"
                  className={transparent ? 'border-white/20 text-white hover:bg-white/10' : ''}
                >
                  {isAdmin ? <Shield className="w-4 h-4 me-2" /> : <LayoutDashboard className="w-4 h-4 me-2" />}
                  {isAdmin ? 'لوحة الأدمن' : 'لوحة التحكم'}
                </Button>
                <Button variant="outline" onClick={handleLogout} data-testid="navbar-logout-btn" className={transparent ? 'border-white/20 text-white hover:bg-white/10' : ''}>
                  <LogOut className="w-4 h-4 me-2" />
                  خروج
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/login')} data-testid="navbar-login-btn" className={transparent ? 'text-white hover:bg-white/10' : ''}>
                  دخول
                </Button>
                <Button onClick={() => navigate('/register')} data-testid="navbar-register-btn" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  ابدأ مجاناً
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className={transparent ? 'text-white' : 'text-gray-900'} /> : <Menu className={transparent ? 'text-white' : 'text-gray-900'} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className={`md:hidden py-4 border-t ${transparent ? 'border-white/10' : 'border-gray-200'}`}>
            <div className="flex flex-col gap-2">
              <Link to="/pricing" className={`py-2 ${transparent ? 'text-white' : 'text-gray-900'}`}>الأسعار</Link>
              {user ? (
                <>
                  <Button variant="default" onClick={() => navigate('/chat')} className="justify-start bg-gradient-to-r from-purple-500 to-pink-500">
                    <MessageSquare className="w-4 h-4 me-2" />
                    الشات الذكي
                  </Button>
                  <Button variant="ghost" onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')} className="justify-start">
                    لوحة التحكم
                  </Button>
                  <Button variant="ghost" onClick={handleLogout} className="justify-start">خروج</Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => navigate('/login')} className="justify-start">دخول</Button>
                  <Button onClick={() => navigate('/register')} className="bg-gradient-to-r from-blue-500 to-purple-600">ابدأ مجاناً</Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
