import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Sparkles, Eye, Download, ArrowLeft, Plus, FolderOpen,
  Send, Trash2, X, Code2, Check, Maximize2, Minimize2,
  MessageSquare, Monitor, RefreshCw,
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

/* ================================================================
   CATEGORY PICKER — first stage of empty state
   ================================================================ */
function CategoryPicker({ categories, onPick }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6" data-testid="category-picker">
      <div className="text-center mb-6 max-w-xl">
        <Sparkles className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
        <h2 className="text-xl md:text-3xl font-bold mb-1.5">اختر نوع موقعك</h2>
        <p className="text-white/60 text-xs md:text-sm">12 فئة • أكثر من 20 تصميماً مختلفاً</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 w-full max-w-5xl">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => onPick(c)}
            className="group relative p-3 md:p-4 rounded-xl border border-white/10 hover:border-yellow-500/60 transition-all text-center hover:-translate-y-0.5 hover:shadow-xl hover:shadow-yellow-500/10"
            style={{ background: `linear-gradient(135deg, ${c.color}22, ${c.color}08)` }}
            data-testid={`category-card-${c.id}`}
          >
            <div className="text-3xl md:text-4xl mb-1.5">{c.icon}</div>
            <div className="font-bold text-sm md:text-base mb-0.5 group-hover:text-yellow-400">{c.name}</div>
            <div className="text-[10px] opacity-60">{c.layouts_count} تصميم</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ================================================================
   LAYOUT BROWSER — stage 2: gallery + live preview + confirm
   ================================================================ */
function LayoutBrowser({ category, layouts, onBack, onConfirm, loading }) {
  const [selected, setSelected] = useState(layouts[0] || null);
  const [html, setHtml] = useState('');
  const [htmlLoading, setHtmlLoading] = useState(false);

  useEffect(() => { if (layouts?.length && !selected) setSelected(layouts[0]); }, [layouts, selected]);

  useEffect(() => {
    if (!category?.id || !selected?.id) return;
    setHtmlLoading(true);
    fetch(`${API}/api/websites/categories/${category.id}/layouts/${selected.id}/preview-html`)
      .then((r) => r.json()).then((d) => setHtml(d.html || '')).finally(() => setHtmlLoading(false));
  }, [category?.id, selected?.id]);

  return (
    <div className="flex-1 flex flex-col min-h-0" data-testid="layout-browser">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 md:px-4 py-2.5 bg-[#0a0e1c] border-b border-white/10">
        <button onClick={onBack} className="p-1.5 hover:bg-white/10 rounded-lg" data-testid="back-to-categories-btn">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-xl">{category?.icon}</span>
        <span className="font-bold text-sm md:text-base">{category?.name}</span>
        <span className="text-xs opacity-60">• {layouts.length} تصميم</span>
        <div className="flex-1" />
        <button
          onClick={() => selected && onConfirm(selected)}
          disabled={!selected || loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-black rounded-lg text-xs font-bold disabled:opacity-40"
          data-testid="confirm-layout-btn"
        ><Check className="w-4 h-4" />هل أنت متأكد؟ اعتمد</button>
      </div>

      {/* Body */}
      <div className="flex-1 flex min-h-0 flex-col md:flex-row">
        {/* Layouts list */}
        <aside className="md:w-64 md:shrink-0 max-h-[200px] md:max-h-none overflow-auto bg-[#0e1128] border-b md:border-b-0 md:border-s border-white/10 p-2">
          <div className="grid grid-cols-2 md:grid-cols-1 gap-1.5">
            {layouts.map((L) => (
              <button
                key={L.id}
                onClick={() => setSelected(L)}
                className={`text-right p-2 rounded-lg border transition-all ${
                  selected?.id === L.id
                    ? 'bg-yellow-500/20 border-yellow-500/70 shadow-lg shadow-yellow-500/10'
                    : 'bg-white/5 border-white/10 hover:border-yellow-400/40'
                }`}
                data-testid={`layout-${L.id}`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-base">{L.icon}</span>
                  <span className="font-bold text-xs md:text-sm truncate">{L.name}</span>
                </div>
                <div className="text-[10px] opacity-60 line-clamp-1">{L.description}</div>
                <div className="flex gap-1 mt-1">
                  {['primary', 'accent', 'secondary'].map((k) => (
                    <span key={k} className="w-3 h-3 rounded-full border border-white/20" style={{ background: L.theme?.[k] || '#000' }} />
                  ))}
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Live preview */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#050815] p-2">
          <div className="text-xs opacity-70 mb-1.5 px-1 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-yellow-500" />
            معاينة حيّة • {selected?.name || '—'}
            {htmlLoading && <span className="opacity-60">• جاري التحميل...</span>}
          </div>
          <iframe
            key={selected?.id}
            srcDoc={html}
            className="flex-1 w-full bg-white rounded-lg shadow-2xl"
            sandbox="allow-scripts allow-same-origin"
            title="layout-preview"
            data-testid="layout-preview-iframe"
          />
          <div className="mt-2 text-[11px] opacity-60 text-center">تصفّح تصاميم أخرى بحرّية — اضغط "اعتمد" عندما تختار</div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   STEP RENDERERS — inline rich UI inside chat for the active step
   ================================================================ */
function VariantPicker({ variants, onPick, loading }) {
  if (!variants?.length) return null;
  return (
    <div className="grid grid-cols-2 gap-2" data-testid="inline-variants">
      {variants.map((v) => (
        <button
          key={v.id}
          onClick={() => onPick(v.id)}
          disabled={loading}
          className="p-2.5 rounded-xl border border-white/10 hover:border-yellow-400/60 transition-all text-right disabled:opacity-50 hover:scale-[1.02]"
          data-testid={`inline-variant-${v.id}`}
          style={{ background: `linear-gradient(135deg, ${v.theme.primary}22, ${v.theme.secondary}cc)` }}
        >
          <div className="flex gap-1 mb-1.5">
            {['primary', 'accent', 'secondary'].map((k) => (
              <span key={k} className="w-3.5 h-3.5 rounded-full border border-white/30 shadow-sm"
                style={{ background: v.theme[k] || '#000' }} />
            ))}
          </div>
          <div className="text-xs font-bold truncate text-white">{v.name}</div>
        </button>
      ))}
    </div>
  );
}

function ButtonShapePicker({ onPick, loading }) {
  const shapes = [
    { id: 'pill',    label: 'دائرية',    value: 'full',   radius: '999px' },
    { id: 'rounded', label: 'ناعمة',     value: 'large',  radius: '18px' },
    { id: 'medium',  label: 'متوسطة',    value: 'medium', radius: '10px' },
    { id: 'sharp',   label: 'حادة',      value: 'none',   radius: '2px' },
  ];
  return (
    <div className="grid grid-cols-2 gap-2" data-testid="inline-buttons">
      {shapes.map((s) => (
        <button
          key={s.id}
          onClick={() => onPick(s.value)}
          disabled={loading}
          className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-yellow-400/60 transition-all disabled:opacity-50"
          data-testid={`inline-btn-${s.id}`}
        >
          <span className="px-5 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs font-bold"
            style={{ borderRadius: s.radius }}>زر</span>
          <span className="text-xs font-bold opacity-80">{s.label}</span>
        </button>
      ))}
    </div>
  );
}

function ColorPicker({ onPick, loading }) {
  const moods = [
    { id: 'classic',  label: 'كلاسيكي',  colors: ['#D4AF37', '#1a1f3a', '#8B0000'] },
    { id: 'modern',   label: 'عصري',     colors: ['#3B82F6', '#0f172a', '#22D3EE'] },
    { id: 'warm',     label: 'دافئ',      colors: ['#F59E0B', '#18181b', '#EF4444'] },
    { id: 'luxury',   label: 'فاخر',      colors: ['#D4AF37', '#0a0a0a', '#B8860B'] },
    { id: 'dark_pro', label: 'داكن احترافي', colors: ['#06B6D4', '#020617', '#F59E0B'] },
    { id: 'nature',   label: 'طبيعي',     colors: ['#10B981', '#064e3b', '#F59E0B'] },
    { id: 'pastel',   label: 'باستيل',    colors: ['#A78BFA', '#FDF2F8', '#F472B6'] },
    { id: 'bold',     label: 'جريء',      colors: ['#DC2626', '#18181b', '#FBBF24'] },
  ];
  return (
    <div className="grid grid-cols-2 gap-2" data-testid="inline-colors">
      {moods.map((m) => (
        <button
          key={m.id}
          onClick={() => onPick(m.id)}
          disabled={loading}
          className="flex items-center gap-2 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-yellow-400/60 transition-all disabled:opacity-50"
          data-testid={`inline-color-${m.id}`}
        >
          <div className="flex gap-0.5">
            {m.colors.map((c, i) => (
              <span key={i} className="w-4 h-7 first:rounded-s-md last:rounded-e-md border border-white/10" style={{ background: c }} />
            ))}
          </div>
          <span className="text-xs font-bold flex-1 text-right truncate">{m.label}</span>
        </button>
      ))}
    </div>
  );
}

function FontPicker({ onPick, loading }) {
  const fonts = [
    { id: 'Tajawal', sample: 'Zitex — منصة عصرية', desc: 'متوازن' },
    { id: 'Cairo', sample: 'Zitex — واضح وعملي', desc: 'واضح' },
    { id: 'Amiri', sample: 'Zitex — فخم كلاسيكي', desc: 'فخم' },
    { id: 'Readex Pro', sample: 'Zitex — ناعم حديث', desc: 'حديث' },
    { id: 'Almarai', sample: 'Zitex — نظيف بسيط', desc: 'بسيط' },
  ];
  return (
    <div className="grid grid-cols-1 gap-1.5" data-testid="inline-fonts">
      {fonts.map((f) => (
        <button
          key={f.id}
          onClick={() => onPick(f.id)}
          disabled={loading}
          className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-yellow-400/60 transition-all disabled:opacity-50 text-right"
          data-testid={`inline-font-${f.id}`}
        >
          <span className="text-base truncate flex-1" style={{ fontFamily: f.id }}>{f.sample}</span>
          <span className="text-[10px] opacity-60 bg-white/10 px-2 py-0.5 rounded-full shrink-0">{f.desc}</span>
        </button>
      ))}
    </div>
  );
}

function ChipGroup({ chips, multi, onSingle, onMulti, loading, selected, setSelected }) {
  if (!chips?.length) return null;
  return (
    <div>
      {multi && selected.length > 0 && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] opacity-70">المحدّد: {selected.length}</span>
          <button
            onClick={() => onMulti(selected)}
            disabled={loading}
            className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-black rounded-lg text-xs font-bold disabled:opacity-50"
            data-testid="inline-submit-multi"
          ><Check className="w-3 h-3" />تأكيد</button>
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {chips.map((c) => {
          const id = c.id || c.value;
          const isSel = multi && selected.includes(id);
          return (
            <button
              key={id}
              onClick={() => multi
                ? setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id])
                : onSingle(c.value !== undefined ? c.value : id)}
              disabled={loading}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all disabled:opacity-50 ${
                isSel
                  ? 'bg-yellow-500 border-yellow-500 text-black'
                  : 'bg-white/5 border-white/15 hover:bg-yellow-500/20 hover:border-yellow-500/50'
              }`}
              data-testid={`chip-${id}`}
            >{c.label}</button>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================
   INLINE STEP — rich picker rendered at the bottom of the chat
   ================================================================ */
function InlineStepRenderer({ step, variants, loading, onAnswer, selected, setSelected }) {
  if (!step) return null;
  const render = step.render || 'chips';
  const handleSingle = (v) => onAnswer(v);
  const handleMulti = (ids) => onAnswer(ids);

  if (render === 'variants') {
    return <VariantPicker variants={variants} onPick={handleSingle} loading={loading} />;
  }

  // Custom rich renderers for specific steps
  if (step.id === 'buttons') return <ButtonShapePicker onPick={handleSingle} loading={loading} />;
  if (step.id === 'colors')  return <ColorPicker       onPick={handleSingle} loading={loading} />;
  if (step.id === 'typography') return <FontPicker     onPick={handleSingle} loading={loading} />;

  // Default chip renderer
  return (
    <ChipGroup
      chips={step.chips || []}
      multi={!!step.multi}
      loading={loading}
      onSingle={handleSingle}
      onMulti={handleMulti}
      selected={selected}
      setSelected={setSelected}
    />
  );
}

/* ================================================================
   CHAT COLUMN — messages + inline rich step + free input
   ================================================================ */
function ChatColumn({ project, stepMeta, variants, loading, onSendText, onAnswerStep, onRequestCode }) {
  const [msg, setMsg] = useState('');
  const [selected, setSelected] = useState([]);
  const endRef = useRef(null);
  const messages = project?.chat || [];
  const stepId = project?.wizard?.step;

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length, stepId]);
  useEffect(() => { setSelected([]); }, [stepId]);

  const send = async () => {
    if (!msg.trim() || loading) return;
    const m = msg.trim();
    setMsg('');
    await onSendText(m);
  };

  return (
    <div className="flex flex-col h-full bg-[#0e1128] border-s border-white/10" data-testid="chat-column">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-white/10 flex items-center gap-2 bg-[#0a0e1c]">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-black" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm">مستشار Zitex</div>
          <div className="text-[10px] opacity-60">{project?.wizard?.completed?.length || 0} من 11 خطوة</div>
        </div>
        <button
          onClick={onRequestCode}
          className="flex items-center gap-1 px-2 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[11px] font-bold border border-white/10"
          title="طلب الكود والاستقلالية"
          data-testid="independence-btn"
        ><Code2 className="w-3 h-3" />استقلالية</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 min-h-0">
        {messages.length === 0 ? (
          <div className="text-center text-white/50 py-6">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <div className="text-sm">المستشار جاهز</div>
          </div>
        ) : (
          messages.slice(-30).map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[88%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-white/10 rounded-tr-sm'
                  : 'bg-gradient-to-br from-yellow-600/25 to-orange-600/25 border border-yellow-500/30 rounded-tl-sm'
              }`}>{m.content}</div>
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

      {/* Inline Step Picker */}
      {stepMeta && stepId !== 'done' && (
        <div className="px-3 py-2.5 border-t border-white/10 bg-black/30 max-h-[280px] overflow-y-auto">
          <div className="text-[10px] font-bold opacity-60 mb-1.5 uppercase tracking-wide">
            {stepMeta.title}
          </div>
          <InlineStepRenderer
            step={stepMeta}
            variants={variants}
            loading={loading}
            onAnswer={onAnswerStep}
            selected={selected}
            setSelected={setSelected}
          />
        </div>
      )}

      {/* Free text input */}
      <div className="p-2.5 border-t border-white/10 flex gap-2 items-center bg-[#0a0e1c]">
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={stepId && stepId !== 'done' ? 'أو اكتب طلبك الخاص...' : 'اكتب رسالتك...'}
          className="flex-1 px-3 py-2 bg-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
          data-testid="chat-input"
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={loading || !msg.trim()}
          className="px-3 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl disabled:opacity-40 text-black font-bold"
          data-testid="chat-send-btn"
        ><Send className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

/* ================================================================
   PREVIEW PANE with fullscreen
   ================================================================ */
function PreviewPane({ html, project, fullscreen, onToggleFullscreen, onRefresh }) {
  return (
    <div className={`flex flex-col min-h-0 bg-[#050815] ${fullscreen ? 'fixed inset-0 z-50' : 'flex-1'}`} data-testid="preview-pane">
      <div className="flex items-center gap-2 px-3 py-2 text-xs bg-[#0a0e1c] border-b border-white/10">
        <Eye className="w-4 h-4 text-yellow-500" />
        <span className="opacity-70 font-bold">معاينة لايف</span>
        <span className="opacity-50 truncate">• {project?.sections?.length || 0} أقسام</span>
        <div className="flex-1" />
        <button
          onClick={onRefresh}
          className="p-1.5 hover:bg-white/10 rounded-lg"
          title="تحديث المعاينة"
          data-testid="preview-refresh-btn"
        ><RefreshCw className="w-4 h-4" /></button>
        <button
          onClick={onToggleFullscreen}
          className="p-1.5 hover:bg-white/10 rounded-lg"
          title={fullscreen ? 'إنهاء ملء الشاشة' : 'ملء الشاشة'}
          data-testid="preview-fullscreen-btn"
        >{fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}</button>
      </div>
      <iframe
        key={project?.id}
        srcDoc={html}
        className="flex-1 w-full bg-white"
        sandbox="allow-scripts allow-same-origin"
        title="preview"
        data-testid="live-preview"
      />
    </div>
  );
}

/* ================================================================
   INDEPENDENCE MODAL (unchanged logic — rearranged for mobile)
   ================================================================ */
function IndependenceModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/85 z-[60] flex items-center justify-center p-4" onClick={onClose} dir="rtl" data-testid="independence-modal">
      <div className="bg-[#0e1128] rounded-2xl max-w-2xl w-full border border-yellow-500/30 p-5 md:p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4 gap-3">
          <div>
            <h2 className="text-lg md:text-xl font-bold mb-1">🚀 الاستقلالية — انقل موقعك أينما شئت</h2>
            <p className="text-xs md:text-sm opacity-70">الموقع مستضاف على Zitex. لنقله لاستضافتك الخاصة:</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded shrink-0"><X className="w-5 h-5" /></button>
        </div>
        <div className="grid md:grid-cols-3 gap-2.5 mb-4">
          {[
            { name: 'Vercel', pro: 'الأفضل للمواقع الحديثة', free: 'مجاني', url: 'https://vercel.com' },
            { name: 'Netlify', pro: 'بديل ممتاز', free: 'مجاني', url: 'https://netlify.com' },
            { name: 'GitHub Pages', pro: 'للمواقع الثابتة', free: 'مجاني 100%', url: 'https://pages.github.com' },
          ].map((o) => (
            <div key={o.name} className="bg-white/5 p-3 rounded-xl border border-white/10">
              <div className="font-bold mb-0.5 text-sm">{o.name}</div>
              <div className="text-[11px] opacity-70 mb-2">{o.pro}</div>
              <div className="text-[10px] px-2 py-0.5 bg-green-500/20 text-green-400 rounded inline-block mb-2">{o.free}</div>
              <a href={o.url} target="_blank" rel="noreferrer" className="block text-xs text-yellow-500 hover:underline">زيارة ↗</a>
            </div>
          ))}
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 md:p-4 text-xs md:text-sm">
          <div className="font-bold mb-2">📋 آلية التسليم:</div>
          <ol className="list-decimal ps-5 space-y-1 opacity-90">
            <li>اعتمد التصميم النهائي أولاً</li>
            <li>ادفع رسوم الاستقلالية</li>
            <li>يرشدك المستشار خطوة بخطوة لنقل الموقع</li>
            <li>يُسلَّم الكود ملف بعد ملف مع شرح كل ملف</li>
          </ol>
        </div>
        <button onClick={onClose} className="w-full mt-3 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm" data-testid="independence-close-btn">فهمت، سأعود لاحقاً</button>
      </div>
    </div>
  );
}

/* ================================================================
   LIBRARY MODAL (compact)
   ================================================================ */
function LibraryModal({ projects, onOpen, onDelete, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/80 z-[55] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0e1128] rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto border border-yellow-500/30 p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">مواقعي ({projects.length})</h2>
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

/* ================================================================
   MAIN STUDIO
   ================================================================ */
export default function WebsiteStudio({ user }) {
  const nav = useNavigate();
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [layouts, setLayouts] = useState([]);
  const [variants, setVariants] = useState([]);
  const [wizardSteps, setWizardSteps] = useState([]);
  const [project, setProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [previewHtml, setPreviewHtml] = useState('');
  const [showLibrary, setShowLibrary] = useState(false);
  const [showIndependence, setShowIndependence] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [mobileView, setMobileView] = useState('preview');
  const buildTimer = useRef(null);

  useEffect(() => {
    fetch(`${API}/api/websites/categories`).then((r) => r.json()).then((d) => setCategories(d.categories || []));
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

  // Load layouts when category is chosen
  useEffect(() => {
    if (!activeCategory?.id) { setLayouts([]); return; }
    fetch(`${API}/api/websites/categories/${activeCategory.id}/layouts`)
      .then((r) => r.json()).then((d) => setLayouts(d.layouts || []));
  }, [activeCategory?.id]);

  // Load variants when project exists
  useEffect(() => {
    if (!project?.template) { setVariants([]); return; }
    fetch(`${API}/api/websites/templates/${project.template}/variants`)
      .then((r) => r.json()).then((d) => setVariants(d.variants || []));
  }, [project?.template]);

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

  // Esc exits fullscreen
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setFullscreen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Actions
  const confirmLayout = async (L) => {
    if (!activeCategory || !L) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/websites/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authH() },
        body: JSON.stringify({
          name: `${L.name}`,
          template: activeCategory.id,
          business_type: activeCategory.id,
          meta: { layout_id: L.id },
        }),
      });
      const d = await r.json();
      setProject(d);
      setActiveCategory(null);
      await loadProjects();
      toast.success(`✨ تم اعتماد تصميم ${L.name}`);
    } catch (_) { toast.error('فشل إنشاء المشروع'); }
    finally { setLoading(false); }
  };

  const answerWizard = async (value) => {
    if (!project?.id) return;
    const step = project?.wizard?.step;
    if (!step) return;
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

  const currentStep = project?.wizard?.step;
  const stepMeta = wizardSteps.find((s) => s.id === currentStep);
  const activeTemplate = categories.find((c) => c.id === project?.template);

  return (
    <div className="h-screen flex flex-col bg-[#0b0f1f] text-white overflow-hidden" dir="rtl" data-testid="website-studio">
      {/* Top bar (hidden in preview fullscreen) */}
      {!fullscreen && (
        <header className="flex items-center justify-between px-3 md:px-4 py-2.5 bg-gradient-to-b from-[#151937] to-[#0e1128] border-b border-yellow-500/20 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => nav('/')} className="p-2 hover:bg-white/10 rounded-lg shrink-0" data-testid="back-btn"><ArrowLeft className="w-5 h-5" /></button>
            {project ? (
              <>
                <input
                  value={project.name || ''}
                  onChange={(e) => setProject({ ...project, name: e.target.value })}
                  onBlur={() => fetch(`${API}/api/websites/projects/${project.id}`, {
                    method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authH() }, body: JSON.stringify(project),
                  })}
                  className="bg-transparent border-b border-white/10 focus:border-yellow-500 px-2 py-1 text-sm md:text-base font-bold focus:outline-none min-w-0 max-w-[160px] md:max-w-[260px]"
                  data-testid="project-name-input"
                />
                {activeTemplate && (
                  <button
                    onClick={() => { setProject(null); setActiveCategory(null); }}
                    className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-xs font-bold"
                    title="تغيير القالب"
                    data-testid="change-template-btn"
                  >
                    <span>{activeTemplate.icon}</span>
                    <span>{activeTemplate.name}</span>
                    <RefreshCw className="w-3 h-3" />
                  </button>
                )}
              </>
            ) : (
              <span className="text-base md:text-lg font-bold">استوديو المواقع</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => { setProject(null); setActiveCategory(null); }} className="p-2 md:px-3 md:py-2 bg-white/10 hover:bg-white/20 rounded-lg flex items-center gap-1.5" data-testid="new-site-btn">
              <Plus className="w-4 h-4" /><span className="hidden md:inline text-xs">جديد</span>
            </button>
            <button onClick={() => { loadProjects(); setShowLibrary(true); }} className="p-2 md:px-3 md:py-2 bg-white/10 hover:bg-white/20 rounded-lg flex items-center gap-1.5" data-testid="library-btn">
              <FolderOpen className="w-4 h-4" /><span className="hidden md:inline text-xs">مواقعي ({projects.length})</span>
            </button>
            <button onClick={exportHtml} disabled={!project} className="p-2 md:px-3 md:py-2 bg-white/10 hover:bg-white/20 rounded-lg flex items-center gap-1.5 disabled:opacity-40" data-testid="export-btn">
              <Download className="w-4 h-4" /><span className="hidden md:inline text-xs">تصدير</span>
            </button>
          </div>
        </header>
      )}

      {/* Body */}
      {project ? (
        <>
          {/* Mobile tab switcher */}
          {!fullscreen && (
            <div className="md:hidden flex border-b border-white/10 bg-[#0a0e1c]">
              <button
                onClick={() => setMobileView('preview')}
                className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 ${mobileView === 'preview' ? 'bg-yellow-500/20 border-b-2 border-yellow-500' : 'opacity-60'}`}
                data-testid="mobile-tab-preview"
              ><Monitor className="w-3.5 h-3.5" />معاينة</button>
              <button
                onClick={() => setMobileView('chat')}
                className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 ${mobileView === 'chat' ? 'bg-yellow-500/20 border-b-2 border-yellow-500' : 'opacity-60'}`}
                data-testid="mobile-tab-chat"
              ><MessageSquare className="w-3.5 h-3.5" />محادثة</button>
            </div>
          )}

          <div className="flex-1 flex min-h-0 flex-col md:flex-row">
            {/* Preview (always flex on desktop, hidden on mobile unless tab=preview) */}
            <div className={`flex-1 min-h-0 ${mobileView === 'preview' ? 'flex' : 'hidden md:flex'} flex-col`}>
              <PreviewPane
                html={previewHtml}
                project={project}
                fullscreen={fullscreen}
                onToggleFullscreen={() => setFullscreen((f) => !f)}
                onRefresh={() => refreshPreview(project)}
              />
            </div>

            {/* Chat column */}
            {!fullscreen && (
              <div className={`${mobileView === 'chat' ? 'flex' : 'hidden md:flex'} md:w-[420px] md:shrink-0 flex-col min-h-0`}>
                <ChatColumn
                  project={project}
                  stepMeta={stepMeta}
                  variants={variants}
                  loading={chatLoading}
                  onSendText={sendChat}
                  onAnswerStep={answerWizard}
                  onRequestCode={() => setShowIndependence(true)}
                />
              </div>
            )}
          </div>
        </>
      ) : (
        activeCategory ? (
          <LayoutBrowser
            category={activeCategory}
            layouts={layouts}
            onBack={() => setActiveCategory(null)}
            onConfirm={confirmLayout}
            loading={loading}
          />
        ) : (
          <CategoryPicker categories={categories} onPick={setActiveCategory} />
        )
      )}

      {showLibrary && <LibraryModal projects={projects} onOpen={openProject} onDelete={deleteProject} onClose={() => setShowLibrary(false)} />}
      {showIndependence && <IndependenceModal onClose={() => setShowIndependence(false)} />}
    </div>
  );
}
