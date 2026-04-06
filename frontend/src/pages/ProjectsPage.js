import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  Folder, Download, ExternalLink, Globe, Code, 
  Clock, FileCode, Loader2, ChevronRight, Rocket
} from 'lucide-react';

const ProjectsPage = ({ user }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/deploy/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadProject = async (projectId, projectName) => {
    setDownloading(projectId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/deploy/projects/${projectId}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectName}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('تم تحميل المشروع بنجاح!');
      } else {
        toast.error('فشل تحميل المشروع');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء التحميل');
    } finally {
      setDownloading(null);
    }
  };

  const deploymentPlatforms = [
    {
      name: 'Vercel',
      logo: '▲',
      color: 'bg-black',
      url: 'https://vercel.com/new',
      description: 'الأفضل لمشاريع React و Next.js',
      free: true
    },
    {
      name: 'Netlify',
      logo: '◆',
      color: 'bg-teal-500',
      url: 'https://app.netlify.com/drop',
      description: 'سحب وإفلات - الأسهل!',
      free: true
    },
    {
      name: 'GitHub Pages',
      logo: '⚡',
      color: 'bg-gray-700',
      url: 'https://github.com/new',
      description: 'مجاني مع GitHub',
      free: true
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900" data-testid="projects-page">
      <Navbar user={user} transparent />
      
      <div className="container mx-auto px-4 md:px-8 max-w-7xl pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            <Rocket className="w-8 h-8 inline me-3 text-green-400" />
            مشاريعي والنشر
          </h1>
          <p className="text-gray-400">قم بتحميل مشاريعك ونشرها على الإنترنت</p>
        </div>

        {/* Deployment Platforms */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">منصات النشر المجانية</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {deploymentPlatforms.map(platform => (
              <Card 
                key={platform.name}
                className="bg-slate-800 border-slate-700 hover:border-green-500/50 transition-all cursor-pointer"
                onClick={() => window.open(platform.url, '_blank')}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-12 h-12 ${platform.color} rounded-lg flex items-center justify-center text-white text-2xl`}>
                    {platform.logo}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold">{platform.name}</h3>
                      {platform.free && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                          مجاني
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{platform.description}</p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-gray-500" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Projects List */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Folder className="w-5 h-5 text-yellow-400" />
                مشاريعي ({projects.length})
              </span>
              <Button
                size="sm"
                onClick={() => window.location.href = '/chat'}
                className="bg-gradient-to-r from-purple-500 to-pink-500"
              >
                <Code className="w-4 h-4 me-2" />
                إنشاء مشروع جديد
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-3" />
                <p className="text-gray-400">جاري تحميل المشاريع...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12">
                <Globe className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400 text-lg mb-2">لا توجد مشاريع بعد</p>
                <p className="text-gray-500 text-sm mb-4">
                  اذهب للشات واطلب من AI إنشاء موقع لك!
                </p>
                <Button
                  onClick={() => window.location.href = '/chat'}
                  className="bg-gradient-to-r from-green-500 to-emerald-500"
                >
                  ابدأ الآن
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map(project => (
                  <div
                    key={project.id}
                    className={`p-4 rounded-lg border transition-all cursor-pointer ${
                      selectedProject?.id === project.id
                        ? 'bg-slate-700 border-green-500'
                        : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                    }`}
                    onClick={() => setSelectedProject(selectedProject?.id === project.id ? null : project)}
                    data-testid={`project-${project.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          project.type === 'react' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'
                        }`}>
                          <FileCode className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-white font-medium">{project.name}</h3>
                          <div className="flex items-center gap-3 text-sm text-gray-400">
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              project.type === 'react' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'
                            }`}>
                              {project.type.toUpperCase()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(project.created_at).toLocaleDateString('ar-SA')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadProject(project.id, project.name);
                          }}
                          disabled={downloading === project.id}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          {downloading === project.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Download className="w-4 h-4 me-1" />
                              تحميل
                            </>
                          )}
                        </Button>
                        <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${
                          selectedProject?.id === project.id ? 'rotate-90' : ''
                        }`} />
                      </div>
                    </div>

                    {/* Expanded details */}
                    {selectedProject?.id === project.id && (
                      <div className="mt-4 pt-4 border-t border-slate-600 animate-fadeIn">
                        <h4 className="text-white font-medium mb-3">خطوات النشر:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="p-3 bg-slate-600/50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xl">▲</span>
                              <span className="text-white font-medium">Vercel</span>
                            </div>
                            <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
                              <li>حمّل المشروع وفك الضغط</li>
                              <li>ارفع على GitHub</li>
                              <li>اربط مع Vercel</li>
                              <li>انشر!</li>
                            </ol>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-2 w-full border-white/20"
                              onClick={() => window.open('https://vercel.com/new', '_blank')}
                            >
                              افتح Vercel
                            </Button>
                          </div>
                          <div className="p-3 bg-slate-600/50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xl text-teal-400">◆</span>
                              <span className="text-white font-medium">Netlify</span>
                            </div>
                            <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
                              <li>حمّل وفك الضغط</li>
                              <li>اسحب المجلد للموقع</li>
                              <li>انتظر ثواني...</li>
                              <li>جاهز!</li>
                            </ol>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-2 w-full border-white/20"
                              onClick={() => window.open('https://app.netlify.com/drop', '_blank')}
                            >
                              افتح Netlify
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Guide */}
        <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 mt-8">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4">
              🚀 كيف تنشر موقعك في 3 خطوات؟
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4">
                <div className="w-12 h-12 mx-auto mb-3 bg-green-500/20 rounded-full flex items-center justify-center text-2xl">
                  1️⃣
                </div>
                <h4 className="text-white font-medium mb-1">أنشئ موقعك</h4>
                <p className="text-sm text-gray-400">اطلب من AI في الشات إنشاء موقع</p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 mx-auto mb-3 bg-green-500/20 rounded-full flex items-center justify-center text-2xl">
                  2️⃣
                </div>
                <h4 className="text-white font-medium mb-1">حمّل المشروع</h4>
                <p className="text-sm text-gray-400">اضغط زر التحميل للحصول على الكود</p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 mx-auto mb-3 bg-green-500/20 rounded-full flex items-center justify-center text-2xl">
                  3️⃣
                </div>
                <h4 className="text-white font-medium mb-1">انشر مجاناً</h4>
                <p className="text-sm text-gray-400">ارفع على Vercel أو Netlify</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ProjectsPage;
