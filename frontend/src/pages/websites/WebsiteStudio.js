import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Layers, Sparkles, Eye, Save, Download, ArrowLeft, Plus, FolderOpen,
  MessageSquare, Paintbrush, Send, Trash2, Copy as CopyIcon, ChevronUp,
  ChevronDown, Palette, Settings, X
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

// ======================== TEMPLATES PICKER ========================
function TemplatePicker({ onPick, onClose }) {
  const [templates, setTemplates] = useState([]);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/websites/templates`).then((r) => r.json()).then((d) => setTemplates(d.templates || []));
  }, []);

  const showPreview = async (id) => {
    const res = await fetch(`${API}/api/websites/templates/${id}/preview-html`);
    const d = await res.json();
    setPreview({ id, html: d.html });
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose} dir="rtl" data-testid="template-picker">
      <div className="bg-[#0e1128] rounded-2xl w-full max-w-6xl h-[90vh] overflow-hidden border border-yellow-500/30 flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-bold">اختر قالباً لبدء موقعك</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 flex min-h-0">
          <aside className="w-72 border-l border-white/10 p-3 overflow-y-auto bg-[#0a0e1c]">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => showPreview(t.id)}
                onDoubleClick={() => onPick(t)}
                className={`w-full text-right mb-2 p-3 rounded-lg transition-all ${preview?.id === t.id ? 'bg-yellow-500/20 border border-yellow-500/50' : 'bg-white/5 hover:bg-white/10 border border-transparent'}`}
                data-testid={`template-${t.id}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{t.icon}</span>
                  <span className="font-bold">{t.name}</span>
                </div>
                <p className="text-xs opacity-70">{t.description}</p>
              </button>
            ))}
          </aside>
          <main className="flex-1 p-4 flex flex-col min-h-0 bg-[#050815]">
            {preview ? (
              <>
                <iframe srcDoc={preview.html} className="flex-1 w-full border-0 rounded-lg bg-white" sandbox="allow-scripts allow-same-origin" title="preview" />
                <div className="flex gap-2 mt-3 justify-end">
                  <button onClick={onClose} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm">إلغاء</button>
                  <button onClick={() => onPick(templates.find((x) => x.id === preview.id))} className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-lg font-bold" data-testid="use-template-btn">
                    استخدم هذا القالب ✨
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-white/50 text-center">
                <div>
                  <Layers className="w-16 h-16 mx-auto mb-3 opacity-40" />
                  <div>انقر على قالب لمعاينته</div>
                  <div className="text-xs mt-1 opacity-60">أو انقر مرتين لاستخدامه مباشرة</div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

// ======================== SECTION EDITOR ========================
const SECTION_TYPES = [
  { type: 'hero', name: 'قسم رئيسي (Hero)', icon: '🎯' },
  { type: 'features', name: 'مميزات', icon: '✨' },
  { type: 'about', name: 'من نحن', icon: '📖' },
  { type: 'products', name: 'منتجات', icon: '🛍️' },
  { type: 'menu', name: 'قائمة طعام', icon: '🍽️' },
  { type: 'gallery', name: 'معرض صور', icon: '🖼️' },
  { type: 'testimonials', name: 'آراء العملاء', icon: '💬' },
  { type: 'team', name: 'الفريق', icon: '👥' },
  { type: 'pricing', name: 'خطط الأسعار', icon: '💰' },
  { type: 'faq', name: 'أسئلة شائعة', icon: '❓' },
  { type: 'contact', name: 'اتصال', icon: '📞' },
  { type: 'cta', name: 'نداء للعمل (CTA)', icon: '📢' },
  { type: 'footer', name: 'تذييل', icon: '⬇️' },
];

function SectionList({ sections, onSelect, onReorder, onDelete, onDuplicate, onAdd, selectedId }) {
  return (
    <div className="space-y-1.5 p-3 overflow-y-auto flex-1">
      <div className="text-xs font-bold text-yellow-500 uppercase mb-2">أقسام الموقع</div>
      {sections.map((s, i) => {
        const def = SECTION_TYPES.find((x) => x.type === s.type) || { name: s.type, icon: '📄' };
        return (
          <div
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`group px-2.5 py-2 rounded-lg cursor-pointer flex items-center gap-2 transition-all ${selectedId === s.id ? 'bg-yellow-500/20 border border-yellow-500/50' : 'bg-white/5 hover:bg-white/10 border border-transparent'}`}
            data-testid={`section-${s.type}-${i}`}
          >
            <span className="text-lg">{def.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold truncate">{def.name}</div>
              <div className="text-[10px] opacity-50">{s.visible !== false ? 'مرئي' : 'مخفي'}</div>
            </div>
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
              <button onClick={(e) => { e.stopPropagation(); onReorder(i, -1); }} className="p-1 hover:bg-white/20 rounded"><ChevronUp className="w-3 h-3" /></button>
              <button onClick={(e) => { e.stopPropagation(); onReorder(i, 1); }} className="p-1 hover:bg-white/20 rounded"><ChevronDown className="w-3 h-3" /></button>
              <button onClick={(e) => { e.stopPropagation(); onDuplicate(i); }} className="p-1 hover:bg-white/20 rounded"><CopyIcon className="w-3 h-3" /></button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(i); }} className="p-1 hover:bg-red-500/30 rounded"><Trash2 className="w-3 h-3" /></button>
            </div>
          </div>
        );
      })}
      <div className="pt-2 border-t border-white/10">
        <details className="group">
          <summary className="cursor-pointer px-2.5 py-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            <span>إضافة قسم جديد</span>
          </summary>
          <div className="mt-1.5 space-y-1">
            {SECTION_TYPES.map((t) => (
              <button key={t.type} onClick={() => onAdd(t.type)} className="w-full text-right px-3 py-1.5 rounded-lg text-xs hover:bg-white/10 flex items-center gap-2" data-testid={`add-section-${t.type}`}>
                <span>{t.icon}</span><span>{t.name}</span>
              </button>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}

// Field editors — simple & generic
function SimpleField({ label, value, onChange, type = 'text', multiline = false }) {
  const Input = multiline ? 'textarea' : 'input';
  return (
    <label className="block mb-2">
      <div className="text-[11px] opacity-70 mb-1">{label}</div>
      <Input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        rows={multiline ? 3 : undefined}
        className="w-full px-2.5 py-1.5 bg-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
      />
    </label>
  );
}

function ArrayFieldEditor({ label, items, onChange, fields }) {
  return (
    <div className="mb-3 border border-white/10 rounded-lg p-2.5">
      <div className="text-[11px] opacity-70 mb-2 flex items-center justify-between">
        <span>{label} ({items.length})</span>
        <button onClick={() => onChange([...items, fields.reduce((a, f) => ({ ...a, [f.key]: '' }), {})])} className="px-2 py-0.5 bg-yellow-500/20 rounded text-xs">+ إضافة</button>
      </div>
      {items.map((it, i) => (
        <div key={i} className="bg-white/5 rounded-lg p-2 mb-1.5 relative">
          <button onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="absolute top-1 left-1 p-0.5 hover:bg-red-500/30 rounded"><Trash2 className="w-3 h-3" /></button>
          {fields.map((f) => (
            <SimpleField key={f.key} label={f.label} value={it[f.key]} onChange={(v) => onChange(items.map((x, idx) => idx === i ? { ...x, [f.key]: v } : x))} multiline={f.multiline} />
          ))}
        </div>
      ))}
    </div>
  );
}

function SectionDataEditor({ section, onChange }) {
  if (!section) return null;
  const d = section.data || {};
  const update = (patch) => onChange({ ...section, data: { ...d, ...patch } });

  const common = (
    <>
      <div className="flex items-center gap-2 mb-3">
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={section.visible !== false} onChange={(e) => onChange({ ...section, visible: e.target.checked })} />
          مرئي
        </label>
      </div>
    </>
  );

  const t = section.type;

  if (t === 'hero') return <>{common}
    <SimpleField label="العنوان الرئيسي" value={d.title} onChange={(v) => update({ title: v })} />
    <SimpleField label="العنوان الفرعي" value={d.subtitle} onChange={(v) => update({ subtitle: v })} multiline />
    <SimpleField label="نص الزر" value={d.cta_text} onChange={(v) => update({ cta_text: v })} />
    <SimpleField label="رابط الزر" value={d.cta_link} onChange={(v) => update({ cta_link: v })} />
    <SimpleField label="رابط الصورة" value={d.image} onChange={(v) => update({ image: v })} />
    <label className="block mb-2"><div className="text-[11px] opacity-70 mb-1">التخطيط</div>
      <select value={d.layout || 'split'} onChange={(e) => update({ layout: e.target.value })} className="w-full px-2.5 py-1.5 bg-white/10 rounded-lg text-sm">
        <option value="split">مقسّم (صورة + نص)</option>
        <option value="full">غطاء كامل</option>
        <option value="portrait">عمودي</option>
      </select>
    </label>
  </>;

  if (t === 'features' || t === 'testimonials' || t === 'faq' || t === 'team' || t === 'products' || t === 'pricing') {
    const fieldSet = {
      features: [{ key: 'icon', label: 'أيقونة (emoji)' }, { key: 'title', label: 'العنوان' }, { key: 'text', label: 'النص', multiline: true }],
      testimonials: [{ key: 'name', label: 'الاسم' }, { key: 'text', label: 'الرأي', multiline: true }, { key: 'rating', label: 'التقييم (1-5)' }],
      faq: [{ key: 'q', label: 'السؤال' }, { key: 'a', label: 'الإجابة', multiline: true }],
      team: [{ key: 'name', label: 'الاسم' }, { key: 'role', label: 'المنصب' }, { key: 'image', label: 'صورة' }],
      products: [{ key: 'name', label: 'اسم المنتج' }, { key: 'price', label: 'السعر' }, { key: 'old_price', label: 'السعر القديم' }, { key: 'image', label: 'صورة' }, { key: 'badge', label: 'شارة' }],
      pricing: [{ key: 'name', label: 'اسم الباقة' }, { key: 'price', label: 'السعر' }, { key: 'period', label: 'الفترة' }, { key: 'cta', label: 'نص الزر' }],
    };
    const items = d.items || d.members || d.plans || [];
    const setItems = (next) => {
      if (t === 'team') update({ members: next });
      else if (t === 'pricing') update({ plans: next });
      else update({ items: next });
    };
    return <>{common}
      <SimpleField label="العنوان" value={d.title} onChange={(v) => update({ title: v })} />
      <ArrayFieldEditor label="العناصر" items={items} onChange={setItems} fields={fieldSet[t]} />
    </>;
  }

  if (t === 'gallery') return <>{common}
    <SimpleField label="العنوان" value={d.title} onChange={(v) => update({ title: v })} />
    <div className="text-[11px] opacity-70 mb-2">الصور (رابط كل صورة على سطر)</div>
    <textarea
      value={(d.images || []).join('\n')}
      onChange={(e) => update({ images: e.target.value.split('\n').map((x) => x.trim()).filter(Boolean) })}
      rows={8}
      className="w-full px-2.5 py-1.5 bg-white/10 rounded-lg text-xs font-mono"
    />
  </>;

  if (t === 'contact') return <>{common}
    <SimpleField label="العنوان" value={d.title} onChange={(v) => update({ title: v })} />
    <SimpleField label="البريد" value={d.email} onChange={(v) => update({ email: v })} />
    <SimpleField label="الهاتف" value={d.phone} onChange={(v) => update({ phone: v })} />
    <SimpleField label="العنوان الفعلي" value={d.address} onChange={(v) => update({ address: v })} />
    <SimpleField label="ساعات العمل" value={d.hours} onChange={(v) => update({ hours: v })} />
  </>;

  if (t === 'cta') return <>{common}
    <SimpleField label="العنوان" value={d.title} onChange={(v) => update({ title: v })} />
    <SimpleField label="العنوان الفرعي" value={d.subtitle} onChange={(v) => update({ subtitle: v })} />
    <SimpleField label="نص الزر" value={d.cta_text} onChange={(v) => update({ cta_text: v })} />
  </>;

  if (t === 'about') return <>{common}
    <SimpleField label="العنوان" value={d.title} onChange={(v) => update({ title: v })} />
    <SimpleField label="النص" value={d.text} onChange={(v) => update({ text: v })} multiline />
    <SimpleField label="صورة (اختياري)" value={d.image} onChange={(v) => update({ image: v })} />
  </>;

  if (t === 'footer') return <>{common}
    <SimpleField label="اسم العلامة" value={d.brand} onChange={(v) => update({ brand: v })} />
    <SimpleField label="البريد" value={d.email} onChange={(v) => update({ email: v })} />
    <SimpleField label="الهاتف" value={d.phone} onChange={(v) => update({ phone: v })} />
  </>;

  if (t === 'menu') return <>{common}
    <SimpleField label="العنوان" value={d.title} onChange={(v) => update({ title: v })} />
    <div className="text-[11px] opacity-70 mb-1">الأصناف (عدّل JSON مباشرة)</div>
    <textarea
      value={JSON.stringify(d.categories || [], null, 2)}
      onChange={(e) => { try { update({ categories: JSON.parse(e.target.value) }); } catch {} }}
      rows={10}
      className="w-full px-2.5 py-1.5 bg-white/10 rounded-lg text-xs font-mono"
    />
  </>;

  return common;
}

// ======================== THEME EDITOR ========================
function ThemeEditor({ theme, onChange }) {
  const upd = (patch) => onChange({ ...theme, ...patch });
  return (
    <div className="p-3 overflow-y-auto flex-1">
      <div className="text-xs font-bold text-yellow-500 uppercase mb-3">مظهر الموقع</div>
      {['primary', 'secondary', 'accent', 'background', 'text'].map((k) => (
        <label key={k} className="block mb-2">
          <div className="text-[11px] opacity-70 mb-1">{k === 'primary' ? 'اللون الأساسي' : k === 'secondary' ? 'الثانوي' : k === 'accent' ? 'المميّز' : k === 'background' ? 'الخلفية' : 'النص'}</div>
          <div className="flex gap-2">
            <input type="color" value={theme[k] || '#000'} onChange={(e) => upd({ [k]: e.target.value })} className="w-12 h-9 bg-white/10 rounded cursor-pointer" />
            <input value={theme[k] || ''} onChange={(e) => upd({ [k]: e.target.value })} className="flex-1 px-2 py-1 bg-white/10 rounded text-sm font-mono" />
          </div>
        </label>
      ))}
      <label className="block mb-2">
        <div className="text-[11px] opacity-70 mb-1">الخط</div>
        <select value={theme.font || 'Tajawal'} onChange={(e) => upd({ font: e.target.value })} className="w-full px-2 py-1.5 bg-white/10 rounded">
          <option value="Tajawal">Tajawal</option>
          <option value="Cairo">Cairo</option>
          <option value="Almarai">Almarai</option>
          <option value="Amiri">Amiri (فخم)</option>
          <option value="Readex Pro">Readex Pro</option>
        </select>
      </label>
      <label className="block mb-2">
        <div className="text-[11px] opacity-70 mb-1">التدوير</div>
        <select value={theme.radius || 'medium'} onChange={(e) => upd({ radius: e.target.value })} className="w-full px-2 py-1.5 bg-white/10 rounded">
          <option value="none">حاد</option>
          <option value="small">طفيف</option>
          <option value="medium">متوسط</option>
          <option value="large">كبير</option>
        </select>
      </label>
    </div>
  );
}

// ======================== CHAT PANEL ========================
function ChatPanel({ project, onChat, loading }) {
  const [msg, setMsg] = useState('');
  const endRef = useRef();
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [project?.chat?.length]);

  const send = async () => {
    if (!msg.trim() || loading) return;
    const m = msg.trim();
    setMsg('');
    await onChat(m);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {(project?.chat || []).length === 0 ? (
          <div className="text-center text-white/50 py-10">
            <Sparkles className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
            <div className="text-lg font-bold mb-2">مستشار Zitex جاهز</div>
            <div className="text-sm">اسألني عن مشروعك وسأساعدك ببناء موقعك خطوة بخطوة</div>
            <div className="mt-4 text-xs opacity-70 space-y-1">
              <div>💡 مثال: "عندي مطعم في الرياض، أبغى موقع يعرض القائمة وأرقام التوصيل"</div>
              <div>💡 مثال: "أبغى موقع لمتجري في تيك توك يعرض منتجاتي"</div>
            </div>
          </div>
        ) : (
          (project?.chat || []).map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-white/10 rounded-tr-sm' : 'bg-gradient-to-br from-yellow-600/30 to-orange-600/30 border border-yellow-500/30 rounded-tl-sm'}`}>
                {m.content}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-end">
            <div className="bg-yellow-500/10 px-4 py-2.5 rounded-2xl text-sm flex gap-1">
              <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
              <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="p-3 border-t border-white/10 flex gap-2">
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="اكتب رسالتك..."
          className="flex-1 px-3.5 py-2.5 bg-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
          data-testid="chat-input"
          disabled={loading}
        />
        <button onClick={send} disabled={loading || !msg.trim()} className="px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl disabled:opacity-40 text-black font-bold" data-testid="chat-send-btn">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ======================== MAIN STUDIO ========================
export default function WebsiteStudio({ user }) {
  const nav = useNavigate();
  const [project, setProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [leftTab, setLeftTab] = useState('chat'); // chat | sections | theme
  const [chatLoading, setChatLoading] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => { loadProjects(); }, []);

  useEffect(() => {
    if (!project) return;
    generatePreview();
    // Debounced auto-save
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => savePatch(), 1500);
    return () => saveTimer.current && clearTimeout(saveTimer.current);
  }, [project?.sections, project?.theme, project?.name, project?.meta]);

  const token = () => localStorage.getItem('token');

  const loadProjects = async () => {
    try {
      const r = await fetch(`${API}/api/websites/projects`, { headers: { Authorization: `Bearer ${token()}` } });
      const d = await r.json();
      setProjects(d.projects || []);
      // If no project open, auto-open first OR show picker
      if (!project && (d.projects || []).length === 0) {
        setShowTemplates(true);
      }
    } catch (e) { /* ignore */ }
  };

  const createFromTemplate = async (tpl) => {
    try {
      const r = await fetch(`${API}/api/websites/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ name: `موقع ${tpl.name}`, business_type: tpl.business_type, template: tpl.id }),
      });
      const d = await r.json();
      setProject(d);
      setSelectedSectionId(d.sections?.[0]?.id || null);
      setShowTemplates(false);
      setLeftTab('sections');
      await loadProjects();
      toast.success(`تم إنشاء: ${d.name}`);
    } catch (e) { toast.error('فشل الإنشاء'); }
  };

  const openProject = async (id) => {
    try {
      const r = await fetch(`${API}/api/websites/projects/${id}`, { headers: { Authorization: `Bearer ${token()}` } });
      const d = await r.json();
      setProject(d);
      setSelectedSectionId(d.sections?.[0]?.id || null);
      setShowLibrary(false);
    } catch (e) { toast.error('فشل الفتح'); }
  };

  const savePatch = async () => {
    if (!project) return;
    try {
      const r = await fetch(`${API}/api/websites/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(project),
      });
      if (r.ok) { /* silent */ }
    } catch (e) { /* ignore */ }
  };

  const generatePreview = async () => {
    if (!project) return;
    try {
      const r = await fetch(`${API}/api/websites/projects/${project.id}/build`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
      });
      const d = await r.json();
      setPreviewHtml(d.html || '');
    } catch (e) { /* ignore */ }
  };

  const sendChat = async (msg) => {
    if (!project) return;
    setChatLoading(true);
    try {
      const r = await fetch(`${API}/api/websites/projects/${project.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ message: msg }),
      });
      const d = await r.json();
      if (d.project) setProject(d.project);
      if (d.built) { toast.success('✨ AI بنى موقعك! شاهد المعاينة', { duration: 4000 }); setLeftTab('sections'); }
    } catch (e) { toast.error('فشل الاتصال'); } finally { setChatLoading(false); }
  };

  const updateSection = (upd) => setProject((p) => ({ ...p, sections: p.sections.map((s) => s.id === upd.id ? upd : s) }));
  const deleteSection = (i) => setProject((p) => ({ ...p, sections: p.sections.filter((_, idx) => idx !== i) }));
  const duplicateSection = (i) => setProject((p) => {
    const copy = { ...JSON.parse(JSON.stringify(p.sections[i])), id: `sec-${Date.now()}`, order: (p.sections[i].order || 0) + 0.5 };
    const next = [...p.sections];
    next.splice(i + 1, 0, copy);
    return { ...p, sections: next.map((s, idx) => ({ ...s, order: idx })) };
  });
  const reorderSection = (i, dir) => setProject((p) => {
    const next = [...p.sections];
    const j = i + dir;
    if (j < 0 || j >= next.length) return p;
    [next[i], next[j]] = [next[j], next[i]];
    return { ...p, sections: next.map((s, idx) => ({ ...s, order: idx })) };
  });
  const addSection = (type) => setProject((p) => ({
    ...p,
    sections: [...p.sections, { id: `sec-${Date.now()}`, type, order: p.sections.length, visible: true, data: { title: 'عنوان', items: [] } }],
  }));

  const deleteProject = async (id) => {
    if (!window.confirm('حذف نهائي؟')) return;
    await fetch(`${API}/api/websites/projects/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
    if (project?.id === id) setProject(null);
    await loadProjects();
  };

  const exportHtml = () => {
    if (!previewHtml) return;
    const blob = new Blob([previewHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(project?.name || 'website').replace(/[^\w\u0600-\u06FF]+/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedSection = project?.sections?.find((s) => s.id === selectedSectionId);

  return (
    <div className="h-screen flex flex-col bg-[#0b0f1f] text-white overflow-hidden" dir="rtl" data-testid="website-studio">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-gradient-to-b from-[#151937] to-[#0e1128] border-b border-yellow-500/20 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/')} className="p-2 hover:bg-white/10 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
          {project ? (
            <input
              value={project.name || ''}
              onChange={(e) => setProject({ ...project, name: e.target.value })}
              className="bg-transparent border-b border-white/10 focus:border-yellow-500 px-2 py-1 text-lg font-bold focus:outline-none min-w-[220px]"
              data-testid="project-name-input"
            />
          ) : (
            <span className="text-lg font-bold">استوديو المواقع</span>
          )}
          {project && <span className="text-xs text-green-400">محفوظ تلقائياً</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowTemplates(true)} className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg" data-testid="new-site-btn">
            <Plus className="w-4 h-4" /><span className="text-sm">جديد</span>
          </button>
          <button onClick={() => setShowLibrary(true)} className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg" data-testid="library-btn">
            <FolderOpen className="w-4 h-4" /><span className="text-sm">مواقعي ({projects.length})</span>
          </button>
          <button onClick={exportHtml} disabled={!project} className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg disabled:opacity-40" data-testid="export-btn">
            <Download className="w-4 h-4" /><span className="text-sm">تصدير HTML</span>
          </button>
        </div>
      </header>

      {/* Main layout: Left (tools) | Center (preview) | Right (properties) */}
      {project ? (
        <div className="flex-1 flex min-h-0">
          {/* Left Sidebar */}
          <aside className="w-80 bg-[#0e1128] border-l border-white/5 flex flex-col">
            <div className="flex border-b border-white/10 text-xs font-bold">
              <button onClick={() => setLeftTab('chat')} className={`flex-1 py-3 flex items-center justify-center gap-1.5 ${leftTab === 'chat' ? 'bg-white/5 border-b-2 border-yellow-500' : 'opacity-60 hover:opacity-100'}`} data-testid="tab-chat">
                <MessageSquare className="w-4 h-4" />الشات
              </button>
              <button onClick={() => setLeftTab('sections')} className={`flex-1 py-3 flex items-center justify-center gap-1.5 ${leftTab === 'sections' ? 'bg-white/5 border-b-2 border-yellow-500' : 'opacity-60 hover:opacity-100'}`} data-testid="tab-sections">
                <Layers className="w-4 h-4" />الأقسام
              </button>
              <button onClick={() => setLeftTab('theme')} className={`flex-1 py-3 flex items-center justify-center gap-1.5 ${leftTab === 'theme' ? 'bg-white/5 border-b-2 border-yellow-500' : 'opacity-60 hover:opacity-100'}`} data-testid="tab-theme">
                <Palette className="w-4 h-4" />المظهر
              </button>
            </div>
            {leftTab === 'chat' && <ChatPanel project={project} onChat={sendChat} loading={chatLoading} />}
            {leftTab === 'sections' && (
              <SectionList
                sections={project.sections || []}
                selectedId={selectedSectionId}
                onSelect={setSelectedSectionId}
                onReorder={reorderSection}
                onDelete={deleteSection}
                onDuplicate={duplicateSection}
                onAdd={addSection}
              />
            )}
            {leftTab === 'theme' && <ThemeEditor theme={project.theme || {}} onChange={(t) => setProject({ ...project, theme: t })} />}
          </aside>

          {/* Center: Live Preview */}
          <main className="flex-1 flex flex-col min-h-0 bg-[#050815] p-3">
            <div className="flex items-center gap-2 mb-2 px-2 text-xs">
              <Eye className="w-4 h-4 text-yellow-500" />
              <span className="opacity-70">معاينة لايف (تتحدّث فوراً)</span>
              <div className="flex-1" />
              <span className="opacity-50">{project.sections?.length || 0} أقسام</span>
            </div>
            <iframe
              key={project.id}
              srcDoc={previewHtml}
              className="flex-1 w-full bg-white rounded-lg shadow-2xl"
              sandbox="allow-scripts allow-same-origin"
              title="preview"
              data-testid="live-preview"
            />
          </main>

          {/* Right: Section Properties */}
          <aside className="w-80 bg-[#0e1128] border-r border-white/5 flex flex-col">
            <div className="p-3 border-b border-white/10 flex items-center gap-2">
              <Settings className="w-4 h-4 text-yellow-500" />
              <span className="font-bold text-sm">{selectedSection ? (SECTION_TYPES.find((x) => x.type === selectedSection.type)?.name || selectedSection.type) : 'خصائص القسم'}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {selectedSection ? (
                <SectionDataEditor section={selectedSection} onChange={updateSection} />
              ) : (
                <div className="text-center text-white/50 py-8 text-sm">اختر قسماً من اليمين لتعديله</div>
              )}
            </div>
          </aside>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Sparkles className="w-20 h-20 mx-auto mb-4 text-yellow-500 opacity-50" />
            <h2 className="text-2xl font-bold mb-2">أهلاً بك في استوديو المواقع</h2>
            <p className="text-white/60 mb-6">ابدأ موقعك الأول في دقائق</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowTemplates(true)} className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl text-black font-bold" data-testid="start-new-btn">
                <Plus className="inline w-5 h-5 me-2" />ابدأ من قالب
              </button>
              <button onClick={() => setShowLibrary(true)} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold">
                <FolderOpen className="inline w-5 h-5 me-2" />مواقعي
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && <TemplatePicker onPick={createFromTemplate} onClose={() => setShowTemplates(false)} />}

      {/* Library Modal */}
      {showLibrary && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowLibrary(false)}>
          <div className="bg-[#0e1128] rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto border border-yellow-500/30 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">مواقعي ({projects.length})</h2>
              <button onClick={() => setShowLibrary(false)} className="p-1 hover:bg-white/10 rounded"><X className="w-5 h-5" /></button>
            </div>
            {projects.length === 0 ? (
              <div className="text-center py-12 text-white/50">لم تنشئ أي موقع بعد</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {projects.map((p) => (
                  <div key={p.id} className="bg-white/5 hover:bg-white/10 p-4 rounded-xl border border-white/10" data-testid={`project-${p.id}`}>
                    <div className="font-bold mb-1">{p.name}</div>
                    <div className="text-xs text-white/50 mb-3">{p.template} • {(p.sections || []).length} أقسام</div>
                    <div className="flex gap-2">
                      <button onClick={() => openProject(p.id)} className="flex-1 px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/40 rounded text-xs font-bold">فتح</button>
                      <button onClick={() => deleteProject(p.id)} className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 rounded text-xs">حذف</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
