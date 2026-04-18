import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Sparkles, Eye, Download, ArrowLeft, Plus, FolderOpen,
  Send, Trash2, Settings, X, Code2, Check,
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

/* =======================================================================
   TEMPLATE STRIP — category cards at the top
   ======================================================================= */
function TemplateStrip({ templates, activeId, onPick }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 px-1 snap-x" data-testid="template-strip">
      {templates.map((t) => (
        <button
          key={t.id}
          onClick={() => onPick(t)}
          className={`snap-start shrink-0 min-w-[140px] px-3 py-2.5 rounded-xl border text-right transition-all ${
            activeId === t.id
              ? 'bg-gradient-to-br from-yellow-500/30 to-orange-500/20 border-yellow-500/70 shadow-lg shadow-yellow-500/20'
              : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-yellow-500/30'
          }`}
          data-testid={`template-card-${t.id}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{t.icon}</span>
            <span className="font-bold text-sm truncate">{t.name}</span>
          </div>
          <p className="text-[11px] opacity-60 truncate">{t.description}</p>
        </button>
      ))}
    </div>
  );
}

/* =======================================================================
   VARIANT STRIP — 10 visual styles for the chosen template
   ======================================================================= */
function VariantStrip({ variants, activeId, onPick, loading }) {
  if (!variants?.length) return null;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 px-1 snap-x" data-testid="variant-strip">
      {variants.map((v) => (
        <button
          key={v.id}
          onClick={() => onPick(v)}
          disabled={loading}
          className={`snap-start shrink-0 w-[150px] p-2 rounded-xl border transition-all disabled:opacity-50 ${
            activeId === v.id
              ? 'border-yellow-500 ring-2 ring-yellow-500/40'
              : 'border-white/10 hover:border-yellow-400/40'
          }`}
          data-testid={`variant-card-${v.id}`}
          style={{
            background: `linear-gradient(135deg, ${v.theme.primary}22, ${v.theme.secondary}bb)`,
          }}
        >
          <div className="flex gap-1 mb-2">
            {['primary', 'accent', 'secondary'].map((k) => (
              <span key={k} className="w-4 h-4 rounded-full border border-white/30" style={{ background: v.theme[k] || '#000' }} />
            ))}
          </div>
          <div className="text-xs font-bold truncate text-white">{v.name}</div>
        </button>
      ))}
    </div>
  );
}

/* =======================================================================
   CHAT BAR — always-visible bottom chat with dynamic quick chips
   ======================================================================= */
function ChatBar({ project, chips, multi, onSendText, onSendChip, onSendMulti, loading, onRequestCode }) {
  const [msg, setMsg] = useState('');
  const [selected, setSelected] = useState([]);
  const endRef = useRef(null);
  const messages = project?.chat || [];
  const wizardStep = project?.wizard?.step;

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);
  // Reset multi-selection whenever the wizard step changes
  useEffect(() => { setSelected([]); }, [wizardStep]);

  const send = async () => {
    if (!msg.trim() || loading) return;
    const m = msg.trim();
    setMsg('');
    await onSendText(m);
  };

  const toggleMulti = (chipId) => {
    setSelected((s) => s.includes(chipId) ? s.filter((x) => x !== chipId) : [...s, chipId]);
  };

  const submitMulti = async () => {
    if (!selected.length) return;
    await onSendMulti(selected);
    setSelected([]);
  };

  return (
    <div className="flex flex-col bg-[#0e1128] border-t border-yellow-500/20" data-testid="chat-bar">
      {/* Messages scroll area */}
      <div className="h-[200px] overflow-y-auto px-4 py-3 space-y-2">
        {messages.length === 0 ? (
          <div className="text-center text-white/50 py-6">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <div className="text-sm">مستشار Zitex جاهز لبناء موقعك</div>
          </div>
        ) : (
          messages.slice(-15).map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-white/10 rounded-tr-sm'
                  : 'bg-gradient-to-br from-yellow-600/25 to-orange-600/25 border border-yellow-500/30 rounded-tl-sm'
              }`}>
                {m.content}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-end">
            <div className="bg-yellow-500/10 px-3 py-2 rounded-2xl text-sm flex gap-1">
              <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '.15s' }} />
              <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '.3s' }} />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick chips */}
      {chips?.length > 0 && (
        <div className="px-4 py-2 border-t border-white/5 bg-black/30">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="text-[11px] opacity-60 font-bold">اقتراحات سريعة:</div>
            {multi && selected.length > 0 && (
              <button
                onClick={submitMulti}
                disabled={loading}
                className="ms-auto flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-black rounded-lg text-xs font-bold disabled:opacity-50"
                data-testid="submit-multi-btn"
              >
                <Check className="w-3 h-3" />تأكيد ({selected.length})
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {chips.map((c) => {
              const isSel = multi && selected.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => multi ? toggleMulti(c.id) : onSendChip(c)}
                  disabled={loading}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all disabled:opacity-50 ${
                    isSel
                      ? 'bg-yellow-500 border-yellow-500 text-black'
                      : 'bg-white/5 border-white/15 hover:bg-yellow-500/20 hover:border-yellow-500/50'
                  }`}
                  data-testid={`chip-${c.id}`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input row */}
      <div className="p-3 border-t border-white/10 flex gap-2 items-center">
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={chips?.length ? 'أو اكتب طلبك الخاص هنا...' : 'اكتب رسالتك...'}
          className="flex-1 px-3.5 py-2.5 bg-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
          data-testid="chat-input"
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={loading || !msg.trim()}
          className="px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl disabled:opacity-40 text-black font-bold"
          data-testid="chat-send-btn"
        >
          <Send className="w-4 h-4" />
        </button>
        <button
          onClick={onRequestCode}
          className="px-3 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold flex items-center gap-1.5"
          title="طلب الكود والاستقلالية"
          data-testid="independence-btn"
        >
          <Code2 className="w-4 h-4" />الاستقلالية
        </button>
      </div>
    </div>
  );
}

/* =======================================================================
   INDEPENDENCE MODAL — explains hosting options (no code yet)
   ======================================================================= */
function IndependenceModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4" onClick={onClose} dir="rtl" data-testid="independence-modal">
      <div className="bg-[#0e1128] rounded-2xl max-w-2xl w-full border border-yellow-500/30 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold mb-1">🚀 الاستقلالية — خذ موقعك أينما شئت</h2>
            <p className="text-sm opacity-70">الموقع مستضاف حالياً على Zitex. لاستلام الكود الكامل ونقله لاستضافتك الخاصة، لديك الخيارات التالية:</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded"><X className="w-5 h-5" /></button>
        </div>

        <div className="grid md:grid-cols-3 gap-3 mb-5">
          {[
            { name: 'Vercel', pro: 'الأفضل للمواقع الحديثة', free: 'مجاني', url: 'https://vercel.com' },
            { name: 'Netlify', pro: 'بديل ممتاز مشابه', free: 'مجاني', url: 'https://netlify.com' },
            { name: 'GitHub Pages', pro: 'للمواقع الثابتة فقط', free: 'مجاني 100%', url: 'https://pages.github.com' },
          ].map((o) => (
            <div key={o.name} className="bg-white/5 p-4 rounded-xl border border-white/10">
              <div className="font-bold mb-1">{o.name}</div>
              <div className="text-xs opacity-70 mb-2">{o.pro}</div>
              <div className="text-[10px] px-2 py-0.5 bg-green-500/20 text-green-400 rounded inline-block mb-2">{o.free}</div>
              <a href={o.url} target="_blank" rel="noreferrer" className="block text-xs text-yellow-500 hover:underline">زيارة الموقع ↗</a>
            </div>
          ))}
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-sm">
          <div className="font-bold mb-2">📋 آلية التسليم:</div>
          <ol className="list-decimal ps-5 space-y-1 opacity-90">
            <li>أولاً — اعتمد التصميم النهائي (اضغط "اعتماد نهائي" في الشات).</li>
            <li>ادفع رسوم الاستقلالية لمرّة واحدة.</li>
            <li>سيرشدك المستشار خطوة بخطوة لنقل الموقع لاستضافتك المختارة.</li>
            <li>يتم تسليم الكود ملف بعد ملف مع شرح كيفية النشر.</li>
          </ol>
        </div>

        <button onClick={onClose} className="w-full mt-4 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl font-bold" data-testid="independence-close-btn">
          فهمت، سأعود لاحقاً
        </button>
      </div>
    </div>
  );
}

/* =======================================================================
   LIBRARY MODAL
   ======================================================================= */
function LibraryModal({ projects, onOpen, onDelete, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0e1128] rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto border border-yellow-500/30 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">مواقعي ({projects.length})</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded"><X className="w-5 h-5" /></button>
        </div>
        {projects.length === 0 ? (
          <div className="text-center py-12 text-white/50">لم تنشئ أي موقع بعد</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {projects.map((p) => (
              <div key={p.id} className="bg-white/5 hover:bg-white/10 p-4 rounded-xl border border-white/10" data-testid={`library-project-${p.id}`}>
                <div className="font-bold mb-1 truncate">{p.name}</div>
                <div className="text-xs text-white/50 mb-3">{p.template} • {(p.sections || []).length} أقسام</div>
                <div className="flex gap-2">
                  <button onClick={() => onOpen(p.id)} className="flex-1 px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/40 rounded text-xs font-bold">فتح</button>
                  <button onClick={() => onDelete(p.id)} className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 rounded text-xs"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* =======================================================================
   MAIN STUDIO — Top (templates+variants) | Center (preview) | Bottom (chat)
   ======================================================================= */
export default function WebsiteStudio({ user }) {
  const nav = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [variants, setVariants] = useState([]);
  const [wizardSteps, setWizardSteps] = useState([]);
  const [project, setProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [previewHtml, setPreviewHtml] = useState('');
  const [showLibrary, setShowLibrary] = useState(false);
  const [showIndependence, setShowIndependence] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const buildTimer = useRef(null);

  // --- Load meta ---
  useEffect(() => {
    fetch(`${API}/api/websites/templates`).then((r) => r.json()).then((d) => setTemplates(d.templates || []));
    fetch(`${API}/api/websites/wizard/steps`).then((r) => r.json()).then((d) => setWizardSteps(d.steps || []));
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProjects = async () => {
    try {
      const r = await fetch(`${API}/api/websites/projects`, { headers: authH() });
      const d = await r.json();
      setProjects(d.projects || []);
    } catch (_) { /* ignore */ }
  };

  // --- Load variants whenever template changes ---
  useEffect(() => {
    if (!project?.template) { setVariants([]); return; }
    fetch(`${API}/api/websites/templates/${project.template}/variants`)
      .then((r) => r.json()).then((d) => setVariants(d.variants || []));
  }, [project?.template]);

  // --- Debounced preview build ---
  const refreshPreview = useCallback(async (p) => {
    if (!p?.id) return;
    try {
      const r = await fetch(`${API}/api/websites/projects/${p.id}/build`, { method: 'POST', headers: authH() });
      const d = await r.json();
      setPreviewHtml(d.html || '');
    } catch (_) { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!project) return;
    if (buildTimer.current) clearTimeout(buildTimer.current);
    buildTimer.current = setTimeout(() => refreshPreview(project), 400);
    return () => buildTimer.current && clearTimeout(buildTimer.current);
  }, [project, refreshPreview]);

  // --- Actions ---
  const pickTemplate = async (t) => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/websites/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authH() },
        body: JSON.stringify({ name: `موقع ${t.name}`, template: t.id, business_type: t.business_type }),
      });
      const d = await r.json();
      setProject(d);
      await loadProjects();
      toast.success(`✨ تم اختيار قالب ${t.name}`);
    } catch (_) {
      toast.error('فشل إنشاء المشروع');
    } finally {
      setLoading(false);
    }
  };

  const pickVariant = async (v) => {
    if (!project?.id) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/websites/projects/${project.id}/apply-variant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authH() },
        body: JSON.stringify({ template_id: project.template, variant_id: v.id, replace_sections: false }),
      });
      const d = await r.json();
      setProject(d);
      toast.success(`🎨 تم تطبيق تصميم "${v.name}"`);
    } catch (_) {
      toast.error('فشل التطبيق');
    } finally {
      setLoading(false);
    }
  };

  const openProject = async (id) => {
    try {
      const r = await fetch(`${API}/api/websites/projects/${id}`, { headers: authH() });
      const d = await r.json();
      setProject(d);
      setShowLibrary(false);
    } catch (_) { toast.error('فشل الفتح'); }
  };

  const deleteProject = async (id) => {
    if (!window.confirm('حذف نهائي؟')) return;
    await fetch(`${API}/api/websites/projects/${id}`, { method: 'DELETE', headers: authH() });
    if (project?.id === id) setProject(null);
    await loadProjects();
  };

  const answerWizard = async (step, value) => {
    if (!project?.id) return;
    setChatLoading(true);
    try {
      const r = await fetch(`${API}/api/websites/projects/${project.id}/wizard/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authH() },
        body: JSON.stringify({ step, value }),
      });
      const d = await r.json();
      setProject(d);
    } catch (_) { toast.error('فشل الرد'); }
    finally { setChatLoading(false); }
  };

  const sendChat = async (message) => {
    if (!project?.id) return;
    setChatLoading(true);
    try {
      const r = await fetch(`${API}/api/websites/projects/${project.id}/wizard/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authH() },
        body: JSON.stringify({ message }),
      });
      const d = await r.json();
      if (d.project) setProject(d.project);
    } catch (_) { toast.error('فشل الاتصال'); }
    finally { setChatLoading(false); }
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

  // --- Derive current wizard chips ---
  const currentStep = project?.wizard?.step;
  const stepMeta = wizardSteps.find((s) => s.id === currentStep);
  const chipList = (stepMeta?.chips || []).map((c) => ({ ...c, id: c.id || c.value }));
  const isMulti = !!stepMeta?.multi;
  const currentStepId = currentStep;

  const onSendChip = async (chip) => {
    const val = chip.value !== undefined ? chip.value : chip.id;
    await answerWizard(currentStepId, val);
  };
  const onSendMulti = async (ids) => answerWizard(currentStepId, ids);

  return (
    <div className="h-screen flex flex-col bg-[#0b0f1f] text-white overflow-hidden" dir="rtl" data-testid="website-studio">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-b from-[#151937] to-[#0e1128] border-b border-yellow-500/20">
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/')} className="p-2 hover:bg-white/10 rounded-lg" data-testid="back-btn"><ArrowLeft className="w-5 h-5" /></button>
          {project ? (
            <input
              value={project.name || ''}
              onChange={(e) => setProject({ ...project, name: e.target.value })}
              onBlur={() => fetch(`${API}/api/websites/projects/${project.id}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authH() }, body: JSON.stringify(project),
              })}
              className="bg-transparent border-b border-white/10 focus:border-yellow-500 px-2 py-1 text-lg font-bold focus:outline-none min-w-[220px]"
              data-testid="project-name-input"
            />
          ) : (
            <span className="text-lg font-bold">استوديو المواقع</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setProject(null)} className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg" data-testid="new-site-btn">
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

      {/* ============ TEMPLATE STRIP (always visible at top) ============ */}
      <div className="bg-[#0a0e1c] border-b border-white/5 px-4 py-2.5">
        <div className="text-[10px] font-bold text-yellow-500 uppercase mb-1.5">1. اختر القالب (الواجهة الأمامية)</div>
        <TemplateStrip
          templates={templates}
          activeId={project?.template}
          onPick={pickTemplate}
        />
      </div>

      {/* ============ VARIANT STRIP (only when project exists) ============ */}
      {project && variants.length > 0 && (
        <div className="bg-[#0a0e1c] border-b border-white/5 px-4 py-2.5">
          <div className="text-[10px] font-bold text-yellow-500 uppercase mb-1.5">2. اختر التصميم البصري (10 أنماط)</div>
          <VariantStrip variants={variants} onPick={pickVariant} loading={loading} />
        </div>
      )}

      {/* ============ MAIN BODY — preview + chat ============ */}
      {project ? (
        <div className="flex-1 flex min-h-0">
          {/* Center: Live preview */}
          <main className="flex-1 flex flex-col min-h-0 bg-[#050815] p-3">
            <div className="flex items-center gap-2 mb-2 px-2 text-xs">
              <Eye className="w-4 h-4 text-yellow-500" />
              <span className="opacity-70">معاينة لايف</span>
              <div className="flex-1" />
              <span className="opacity-50">{project.sections?.length || 0} أقسام • {project.wizard?.completed?.length || 0} خطوات مكتملة</span>
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
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <Sparkles className="w-20 h-20 mx-auto mb-4 text-yellow-500 opacity-60" />
            <h2 className="text-2xl font-bold mb-2">ابدأ موقعك في 3 خطوات</h2>
            <p className="text-white/60 mb-1">1. اختر قالباً من الأعلى (الواجهة الأمامية)</p>
            <p className="text-white/60 mb-1">2. اختر نمطاً بصرياً من بين 10 أنماط</p>
            <p className="text-white/60 mb-5">3. أجِب المستشار الذكي خطوة بخطوة</p>
            <button onClick={() => setShowLibrary(true)} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold" data-testid="open-library-btn">
              <FolderOpen className="inline w-5 h-5 me-2" />أو افتح موقعاً محفوظاً
            </button>
          </div>
        </div>
      )}

      {/* ============ CHAT BAR AT THE BOTTOM ============ */}
      {project && (
        <ChatBar
          project={project}
          chips={chipList}
          multi={isMulti}
          loading={chatLoading}
          onSendText={sendChat}
          onSendChip={onSendChip}
          onSendMulti={onSendMulti}
          onRequestCode={() => setShowIndependence(true)}
        />
      )}

      {/* Modals */}
      {showLibrary && <LibraryModal projects={projects} onOpen={openProject} onDelete={deleteProject} onClose={() => setShowLibrary(false)} />}
      {showIndependence && <IndependenceModal onClose={() => setShowIndependence(false)} />}
    </div>
  );
}
