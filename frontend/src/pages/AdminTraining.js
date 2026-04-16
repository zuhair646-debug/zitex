import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowRight, Plus, Trash2, Edit, Eye, Upload, Brain, BarChart3, Code, Image, Gamepad2, Globe, ShoppingCart, Layout } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const CATEGORIES = [
  { id: 'game', label: 'ألعاب', icon: Gamepad2, color: 'from-purple-500 to-pink-500' },
  { id: 'website', label: 'مواقع', icon: Globe, color: 'from-blue-500 to-cyan-500' },
  { id: 'landing', label: 'صفحات هبوط', icon: Layout, color: 'from-green-500 to-emerald-500' },
  { id: 'ecommerce', label: 'متاجر', icon: ShoppingCart, color: 'from-amber-500 to-orange-500' },
  { id: 'portfolio', label: 'معارض أعمال', icon: Image, color: 'from-rose-500 to-red-500' },
  { id: 'dashboard', label: 'لوحات تحكم', icon: BarChart3, color: 'from-indigo-500 to-violet-500' },
];

const SUBCATEGORIES = {
  game: ['استراتيجية', 'أكشن', 'سباق', 'ألغاز', 'مطعم', 'أطفال', 'منصات', 'قتال'],
  website: ['شركة', 'تقنية', 'طبي', 'تعليمي', 'عقاري', 'مطاعم'],
  landing: ['منتج', 'خدمة', 'تطبيق', 'حدث', 'إطلاق'],
  ecommerce: ['ملابس', 'إلكترونيات', 'طعام', 'عام'],
  portfolio: ['مصمم', 'مطور', 'مصور', 'فنان'],
  dashboard: ['إدارة', 'تحليلات', 'CRM', 'مالي'],
};

export default function AdminTraining({ user }) {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [examples, setExamples] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [previewId, setPreviewId] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  
  const [form, setForm] = useState({
    category: 'game',
    subcategory: '',
    title: '',
    description: '',
    design_image_url: '',
    html_code: '',
    tags: [],
  });

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchData = useCallback(async () => {
    try {
      const url = filterCategory 
        ? `${API}/api/admin/training/examples?category=${filterCategory}`
        : `${API}/api/admin/training/examples`;
      const [exRes, stRes] = await Promise.all([
        fetch(url, { headers }),
        fetch(`${API}/api/admin/training/stats`, { headers })
      ]);
      const exData = await exRes.json();
      const stData = await stRes.json();
      setExamples(exData.examples || []);
      setStats(stData);
    } catch (e) {
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, [filterCategory, token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async () => {
    if (!form.title || !form.html_code) {
      toast.error('العنوان والكود مطلوبين');
      return;
    }
    try {
      const url = editingId 
        ? `${API}/api/admin/training/examples/${editingId}`
        : `${API}/api/admin/training/examples`;
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
      if (res.ok) {
        toast.success(editingId ? 'تم التحديث' : 'تم الإضافة');
        setShowForm(false);
        setEditingId(null);
        setForm({ category: 'game', subcategory: '', title: '', description: '', design_image_url: '', html_code: '', tags: [] });
        fetchData();
      } else {
        toast.error('فشل العملية');
      }
    } catch (e) {
      toast.error('خطأ في الاتصال');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('حذف هذا المثال؟')) return;
    try {
      await fetch(`${API}/api/admin/training/examples/${id}`, { method: 'DELETE', headers });
      toast.success('تم الحذف');
      fetchData();
    } catch (e) {
      toast.error('فشل الحذف');
    }
  };

  const handleEdit = (ex) => {
    setForm({
      category: ex.category,
      subcategory: ex.subcategory || '',
      title: ex.title,
      description: ex.description || '',
      design_image_url: ex.design_image_url || '',
      html_code: ex.html_code,
      tags: ex.tags || [],
    });
    setEditingId(ex.id);
    setShowForm(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API}/api/admin/training/upload-image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.image_url) {
        setForm(prev => ({ ...prev, design_image_url: data.image_url }));
        toast.success('تم رفع الصورة');
      }
    } catch (e) {
      toast.error('فشل رفع الصورة');
    }
  };

  const previewExample = examples.find(e => e.id === previewId);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white" data-testid="admin-training">
      {/* Header */}
      <div className="bg-[#0d0d18] border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/admin')} className="text-gray-400">
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Brain className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl font-bold text-amber-400">تدريب الذكاء الاصطناعي</h1>
          </div>
          <Button 
            onClick={() => { setShowForm(true); setEditingId(null); setForm({ category: 'game', subcategory: '', title: '', description: '', design_image_url: '', html_code: '', tags: [] }); }}
            className="bg-gradient-to-r from-amber-600 to-yellow-600 border-0"
            data-testid="add-example-btn"
          >
            <Plus className="w-4 h-4 me-2" /> إضافة مثال جديد
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3" data-testid="training-stats">
            <div className="bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-amber-400">{stats.total_examples}</p>
              <p className="text-xs text-gray-400">إجمالي الأمثلة</p>
            </div>
            {CATEGORIES.map(cat => (
              <div key={cat.id} className={`bg-gradient-to-br ${cat.color.replace('from-', 'from-').replace('to-', 'to-')}/10 border border-slate-700 rounded-xl p-4 text-center`}>
                <p className="text-2xl font-bold">{stats.by_category?.[cat.id] || 0}</p>
                <p className="text-xs text-gray-400">{cat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2" data-testid="category-filter">
          <Button size="sm" variant={!filterCategory ? 'default' : 'outline'} onClick={() => setFilterCategory('')}
            className={!filterCategory ? 'bg-amber-600' : 'border-slate-700 text-gray-400'}>الكل</Button>
          {CATEGORIES.map(cat => (
            <Button key={cat.id} size="sm" variant={filterCategory === cat.id ? 'default' : 'outline'}
              onClick={() => setFilterCategory(cat.id)}
              className={filterCategory === cat.id ? 'bg-amber-600' : 'border-slate-700 text-gray-400'}>
              <cat.icon className="w-3 h-3 me-1" /> {cat.label}
            </Button>
          ))}
        </div>

        {/* Examples Grid */}
        {examples.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Brain className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">لا توجد أمثلة تدريبية بعد</p>
            <p className="text-sm mt-2">أضف أمثلة عشان الذكاء الاصطناعي يتعلم منها ويبني كود أفضل</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="examples-grid">
            {examples.map(ex => (
              <div key={ex.id} className="bg-[#0d0d18] border border-slate-800 rounded-xl overflow-hidden hover:border-amber-500/30 transition-all group">
                {/* Preview Image */}
                {ex.design_image_url ? (
                  <div className="h-40 overflow-hidden">
                    <img src={ex.design_image_url.startsWith('/') ? API + ex.design_image_url : ex.design_image_url} 
                      alt={ex.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                ) : (
                  <div className="h-40 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                    <Code className="w-12 h-12 text-slate-600" />
                  </div>
                )}
                
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-white">{ex.title}</h3>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full">{ex.category}</span>
                        {ex.subcategory && <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">{ex.subcategory}</span>}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">استخدم {ex.usage_count || 0}x</span>
                  </div>
                  
                  {ex.description && <p className="text-xs text-gray-400 line-clamp-2">{ex.description}</p>}
                  
                  <div className="text-xs text-gray-500">
                    <Code className="w-3 h-3 inline me-1" />
                    {ex.html_code?.length || 0} حرف
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setPreviewId(ex.id)} className="flex-1 border-slate-700 text-gray-400 hover:text-white">
                      <Eye className="w-3 h-3 me-1" /> معاينة
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(ex)} className="border-slate-700 text-gray-400 hover:text-white">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(ex.id)} className="border-red-800 text-red-400 hover:bg-red-500/10">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center overflow-y-auto py-10">
          <div className="bg-[#0d0d18] border border-slate-800 rounded-2xl w-full max-w-4xl mx-4" data-testid="training-form">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-amber-400">
                {editingId ? 'تعديل المثال' : 'إضافة مثال تدريبي جديد'}
              </h2>
              <Button variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); }} className="text-gray-400">X</Button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Category */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">التصنيف</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={() => setForm(p => ({ ...p, category: cat.id, subcategory: '' }))}
                      className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${
                        form.category === cat.id 
                          ? `bg-gradient-to-r ${cat.color} text-white` 
                          : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                      }`}>
                      <cat.icon className="w-4 h-4" /> {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subcategory */}
              {SUBCATEGORIES[form.category] && (
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">التصنيف الفرعي</label>
                  <div className="flex flex-wrap gap-2">
                    {SUBCATEGORIES[form.category].map(sub => (
                      <button key={sub} onClick={() => setForm(p => ({ ...p, subcategory: sub }))}
                        className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                          form.subcategory === sub ? 'bg-amber-600 text-white' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                        }`}>{sub}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="text-sm text-gray-400 mb-1 block">العنوان *</label>
                <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none"
                  placeholder="مثلاً: لعبة استراتيجية بناء قرى احترافية"
                  data-testid="training-title-input" />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm text-gray-400 mb-1 block">الوصف</label>
                <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none"
                  placeholder="وصف مختصر للمثال" />
              </div>

              {/* Design Image Upload */}
              <div>
                <label className="text-sm text-gray-400 mb-1 block">صورة التصميم المرجعية</label>
                <div className="flex gap-3 items-center">
                  <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer hover:border-amber-500/50 transition">
                    <Upload className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">رفع صورة</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                  {form.design_image_url && (
                    <img src={form.design_image_url.startsWith('/') ? API + form.design_image_url : form.design_image_url} 
                      alt="preview" className="w-16 h-16 rounded-lg object-cover border border-slate-700" />
                  )}
                </div>
              </div>

              {/* HTML Code */}
              <div>
                <label className="text-sm text-gray-400 mb-1 block">كود HTML * (الكود الاحترافي اللي تبي الذكاء يتعلم منه)</label>
                <textarea value={form.html_code} onChange={e => setForm(p => ({ ...p, html_code: e.target.value }))}
                  className="w-full h-64 bg-[#1a1a2e] border border-slate-700 rounded-lg px-4 py-3 text-green-400 font-mono text-xs placeholder-gray-600 focus:border-amber-500 focus:outline-none resize-none"
                  placeholder="<!DOCTYPE html>&#10;<html lang='ar' dir='rtl'>&#10;..."
                  dir="ltr"
                  data-testid="training-code-input" />
                <p className="text-xs text-gray-500 mt-1">{form.html_code.length} حرف</p>
              </div>

              {/* Tags */}
              <div>
                <label className="text-sm text-gray-400 mb-1 block">الوسوم (مفصولة بفاصلة)</label>
                <input type="text" value={form.tags.join(', ')} 
                  onChange={e => setForm(p => ({ ...p, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none"
                  placeholder="كرتوني, ألوان زاهية, تفاعلي" />
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 flex gap-3 justify-end">
              <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}
                className="border-slate-700 text-gray-400">إلغاء</Button>
              <Button onClick={handleSubmit} className="bg-gradient-to-r from-amber-600 to-yellow-600 border-0"
                data-testid="training-submit-btn">
                {editingId ? 'تحديث المثال' : 'إضافة المثال'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewExample && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 bg-[#0d0d18] border-b border-slate-800">
            <h3 className="text-amber-400 font-bold">{previewExample.title}</h3>
            <Button variant="ghost" onClick={() => setPreviewId(null)} className="text-gray-400">X</Button>
          </div>
          <iframe 
            srcDoc={previewExample.html_code} 
            className="flex-1 w-full bg-white" 
            title="Preview"
            sandbox="allow-scripts allow-same-origin"
            data-testid="training-preview-iframe"
          />
        </div>
      )}
    </div>
  );
}
