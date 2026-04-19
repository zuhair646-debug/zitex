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
  const [mixing, setMixing] = useState(false);

  useEffect(() => { if (layouts?.length && !selected) setSelected(layouts[0]); }, [layouts, selected]);

  useEffect(() => {
    if (!category?.id || !selected?.id) return;
    setHtmlLoading(true);
    fetch(`${API}/api/websites/categories/${category.id}/layouts/${selected.id}/preview-html`)
      .then((r) => r.json()).then((d) => setHtml(d.html || '')).finally(() => setHtmlLoading(false));
  }, [category?.id, selected?.id]);

  const mix = async () => {
    if (!category?.id) return;
    setMixing(true);
    try {
      const r = await fetch(`${API}/api/websites/categories/${category.id}/mix`);
      const d = await r.json();
      if (d.layout) {
        // Find the full layout object from `layouts` to include theme
        const found = layouts.find((L) => L.id === d.layout.id);
        setSelected(found || { ...d.layout, theme: {} });
        setHtml(d.html || '');
        toast.success(`🎲 تم اقتراح: ${d.layout.name}`);
      }
    } catch (_) { toast.error('فشل الخلط'); }
    finally { setMixing(false); }
  };

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
          onClick={mix}
          disabled={mixing || loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500/30 to-pink-500/30 hover:from-purple-500/50 hover:to-pink-500/50 border border-purple-400/40 rounded-lg text-xs font-bold disabled:opacity-50"
          title="اخلط تصميم عشوائي مبتكر"
          data-testid="mix-dna-btn"
        >{mixing ? <RefreshCw className="w-4 h-4 animate-spin" /> : '🎲'} اخلط تصميم</button>
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
  const toggleMulti = (id) => {
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    setSelected(next);
    // Auto-preview on every toggle
    onMulti(next);
  };
  return (
    <div>
      {multi && selected.length > 0 && (
        <div className="mb-1.5 text-[11px] opacity-70">المحدّد: {selected.length} — المعاينة تتحدّث فوراً</div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {chips.map((c) => {
          const id = c.id || c.value;
          const isSel = multi && selected.includes(id);
          return (
            <button
              key={id}
              onClick={() => multi
                ? toggleMulti(id)
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
   QUICK ADD BAR — smart one-click chips under the chat input
   ================================================================ */
const QUICK_ADD_CHIPS = [
  { id: 'stories',       icon: '🎬', label: 'حالات',        msg: 'أضف قسم حالات' },
  { id: 'banner',        icon: '📢', label: 'بنر',          msg: 'أضف بنر ترويجي' },
  { id: 'video',         icon: '🎥', label: 'فيديو',         msg: 'أضف قسم فيديو' },
  { id: 'gallery',       icon: '🖼️', label: 'معرض',          msg: 'أضف قسم معرض صور' },
  { id: 'testimonials',  icon: '💬', label: 'آراء',           msg: 'أضف قسم آراء العملاء' },
  { id: 'pricing',       icon: '💰', label: 'أسعار',          msg: 'أضف قسم خطط الأسعار' },
  { id: 'faq',           icon: '❓', label: 'أسئلة شائعة',    msg: 'أضف قسم الأسئلة الشائعة' },
  { id: 'team',          icon: '👥', label: 'الفريق',         msg: 'أضف قسم الفريق' },
  { id: 'stats_band',    icon: '📊', label: 'إحصائيات',      msg: 'أضف شريط إحصائيات' },
  { id: 'newsletter',    icon: '📧', label: 'نشرة بريدية',   msg: 'أضف نشرة بريدية' },
  { id: 'announce',      icon: '🔔', label: 'شريط إعلان',    msg: 'أضف شريط إعلان علوي' },
  { id: 'contact',       icon: '📞', label: 'تواصل',          msg: 'أضف قسم تواصل معنا' },
];

function QuickAddBar({ onPick, loading }) {
  return (
    <div className="px-3 py-2 border-t border-white/10 bg-gradient-to-b from-[#0a0e1c] to-[#0e1128]" data-testid="quick-add-bar">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-[10px] font-bold opacity-60 uppercase tracking-wide">⚡ اقتراحات ذكية — ضغطة لإضافة قسم</span>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
        {QUICK_ADD_CHIPS.map((c) => (
          <button
            key={c.id}
            onClick={() => onPick(c.msg)}
            disabled={loading}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-white/5 hover:bg-yellow-500/20 border border-white/10 hover:border-yellow-500/50 rounded-full text-[11px] font-bold transition-all disabled:opacity-40 whitespace-nowrap"
            data-testid={`quick-chip-${c.id}`}
            title={c.msg}
          >
            <span>{c.icon}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ================================================================
   CHAT COLUMN — messages + inline rich step + free input
   ================================================================ */
function ChatColumn({ project, stepMeta, variants, loading, onSendText, onAnswerStep, onRequestCode, pending, onConfirm, onCancel }) {
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

      {/* Pending preview confirm bar */}
      {pending && (
        <div className="px-3 py-2.5 bg-gradient-to-r from-green-500/20 to-emerald-500/10 border-t border-green-500/40" data-testid="pending-confirm-bar">
          <div className="flex items-center gap-2 mb-1.5">
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-xs font-bold text-green-300">معاينة فقط — هل أنت متأكد؟</span>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg text-black text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1"
              data-testid="confirm-pending-btn"
            ><Check className="w-3.5 h-3.5" />اعتمد</button>
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold disabled:opacity-50"
              data-testid="cancel-pending-btn"
            >جرّب غيره</button>
          </div>
        </div>
      )}

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

      {/* 🆕 Quick Add Bar — always visible, one-click section add */}
      <QuickAddBar onPick={onSendText} loading={loading} />

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
   PREVIEW PANE — desktop + mobile toggle + fullscreen
   ================================================================ */
function PreviewPane({ html, project, fullscreen, onToggleFullscreen, onRefresh, device, onToggleDevice }) {
  const isMobile = device === 'mobile';
  return (
    <div className={`flex flex-col min-h-0 bg-[#050815] ${fullscreen ? 'fixed inset-0 z-50' : 'flex-1'}`} data-testid="preview-pane">
      <div className="flex items-center gap-2 px-3 py-2 text-xs bg-[#0a0e1c] border-b border-white/10">
        <Eye className="w-4 h-4 text-yellow-500" />
        <span className="opacity-70 font-bold">معاينة لايف</span>
        <span className="opacity-50 truncate">• {project?.sections?.length || 0} أقسام</span>
        <div className="flex-1" />
        <div className="flex items-center bg-white/5 border border-white/10 rounded-lg overflow-hidden" data-testid="device-toggle">
          <button
            onClick={() => onToggleDevice('desktop')}
            className={`px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 transition-colors ${!isMobile ? 'bg-yellow-500 text-black' : 'hover:bg-white/10'}`}
            title="عرض حاسوب"
            data-testid="device-desktop-btn"
          ><Monitor className="w-3.5 h-3.5" />حاسوب</button>
          <button
            onClick={() => onToggleDevice('mobile')}
            className={`px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 transition-colors ${isMobile ? 'bg-yellow-500 text-black' : 'hover:bg-white/10'}`}
            title="عرض جوال"
            data-testid="device-mobile-btn"
          ><span className="text-base leading-none">📱</span>جوال</button>
        </div>
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
      <div className={`flex-1 w-full ${isMobile ? 'flex items-start justify-center overflow-y-auto py-4 bg-gradient-to-b from-[#050815] to-[#0b0f1f]' : ''}`}>
        {isMobile ? (
          <div className="relative bg-black rounded-[40px] shadow-2xl border-[10px] border-[#0a0e1c] overflow-hidden" style={{ width: 390, height: 780 }} data-testid="mobile-frame">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-b-2xl z-10" />
            <iframe
              key={`${project?.id}-mobile`}
              srcDoc={html}
              className="w-full h-full bg-white"
              sandbox="allow-scripts allow-same-origin"
              title="preview-mobile"
              data-testid="live-preview"
            />
          </div>
        ) : (
          <iframe
            key={project?.id}
            srcDoc={html}
            className="flex-1 w-full h-full bg-white"
            sandbox="allow-scripts allow-same-origin"
            title="preview"
            data-testid="live-preview"
          />
        )}
      </div>
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
function LibraryModal({ projects, onOpen, onDelete, onDuplicate, onApprove, onClose }) {
  const approved = projects.filter((p) => p.status === 'approved');
  const drafts = projects.filter((p) => p.status !== 'approved');

  const Card = ({ p, isApproved }) => {
    const copyPublic = () => {
      const url = `${window.location.origin}/sites/${p.slug}`;
      navigator.clipboard.writeText(url);
      toast.success('📋 تم نسخ الرابط');
    };
    return (
    <div className={`p-4 rounded-xl border relative ${isApproved ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/40' : 'bg-white/5 border-white/10'}`} data-testid={`library-project-${p.id}`}>
      {isApproved && (
        <span className="absolute top-2 left-2 text-[10px] bg-green-500 text-black font-bold px-2 py-0.5 rounded-full">✓ معتمد</span>
      )}
      <div className="font-bold mb-1 truncate pr-6">{p.name}</div>
      <div className="text-xs text-white/50 mb-2">{p.template} • {(p.sections || []).length} أقسام{p.approved_at ? ` • ${new Date(p.approved_at).toLocaleDateString('ar')}` : ''}{isApproved && p.visits ? ` • 👁️ ${p.visits} زيارة` : ''}</div>
      {isApproved && p.slug && (
        <div className="mb-2 flex items-center gap-1.5 bg-black/30 rounded-lg px-2 py-1.5">
          <code className="flex-1 text-[10px] text-yellow-400 truncate">/sites/{p.slug}</code>
          <button onClick={copyPublic} className="text-xs px-2 py-0.5 bg-yellow-500/20 hover:bg-yellow-500/40 rounded" data-testid={`copy-link-${p.id}`}>📋</button>
          <a href={`/sites/${p.slug}`} target="_blank" rel="noreferrer" className="text-xs px-2 py-0.5 bg-green-500/20 hover:bg-green-500/40 rounded text-green-400" data-testid={`visit-${p.id}`}>↗</a>
        </div>
      )}
      <div className="grid grid-cols-2 gap-1.5">
        <button onClick={() => onOpen(p.id)} className="px-2 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/40 rounded text-xs font-bold" data-testid={`open-${p.id}`}>✏️ تعديل</button>
        <button onClick={() => onDuplicate(p.id)} className="px-2 py-1.5 bg-white/10 hover:bg-white/20 rounded text-xs font-bold">📋 نسخ</button>
        {isApproved ? (
          <>
            <button disabled className="px-2 py-1.5 bg-blue-500/10 text-blue-300 rounded text-xs font-bold opacity-60 cursor-not-allowed">📱 تطبيق جوال (قريباً)</button>
            <button className="px-2 py-1.5 bg-purple-500/20 hover:bg-purple-500/40 rounded text-xs font-bold" onClick={() => toast.info('سيتم التواصل لتفعيل الدعم والصيانة')}>🛠️ دعم وصيانة</button>
          </>
        ) : (
          <>
            <button onClick={() => onApprove(p.id)} className="px-2 py-1.5 bg-green-500/20 hover:bg-green-500/40 rounded text-xs font-bold" data-testid={`approve-${p.id}`}>✅ اعتماد</button>
            <button onClick={() => onDelete(p.id)} className="px-2 py-1.5 bg-red-600/20 hover:bg-red-600/40 rounded text-xs"><Trash2 className="w-3 h-3 inline" /> حذف</button>
          </>
        )}
      </div>
    </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[55] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0e1128] rounded-2xl max-w-5xl w-full max-h-[85vh] overflow-y-auto border border-yellow-500/30 p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">مواقعي ({projects.length})</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded"><X className="w-5 h-5" /></button>
        </div>
        {projects.length === 0 ? (
          <div className="text-center py-12 text-white/50">لم تنشئ أي موقع بعد</div>
        ) : (
          <>
            {approved.length > 0 && (
              <div className="mb-5">
                <div className="text-sm font-bold text-green-400 mb-2 flex items-center gap-2">
                  ✓ المشاريع المعتمدة ({approved.length})
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {approved.map((p) => <Card key={p.id} p={p} isApproved />)}
                </div>
              </div>
            )}
            {drafts.length > 0 && (
              <div>
                <div className="text-sm font-bold text-white/70 mb-2">مسوّدات ({drafts.length})</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {drafts.map((p) => <Card key={p.id} p={p} isApproved={false} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   LOGO STUDIO — multi-step, button-based: style → generate 3 → pick → color → apply
   ================================================================ */
const LOGO_STYLES = [
  { id: 'elegant',     label: 'أنيق',       hint: 'elegant, refined, thin strokes, serif accents' },
  { id: 'playful',     label: 'مرح',        hint: 'playful, rounded, friendly, vibrant accents' },
  { id: 'minimal',     label: 'بسيط',       hint: 'minimal, negative space, geometric, essential' },
  { id: 'luxury',      label: 'فاخر',       hint: 'luxury, gold-accent, premium, sophisticated' },
  { id: 'modern',      label: 'حديث',       hint: 'modern, clean grotesque typography, sharp' },
  { id: 'classic',     label: 'كلاسيكي',    hint: 'classic, traditional emblem, timeless' },
  { id: 'bold',        label: 'جريء',       hint: 'bold, high-contrast, solid, confident' },
  { id: 'tech',        label: 'تقني',       hint: 'tech, futuristic, digital, subtle gradients' },
];

const LOGO_COLORS = [
  { id: 'default',  label: 'تلقائي',  hint: '' },
  { id: 'gold',     label: 'ذهبي',    hint: 'gold (#D4AF37) and cream accents' },
  { id: 'black',    label: 'أسود',    hint: 'pure black (#000000) monochrome' },
  { id: 'white',    label: 'أبيض',    hint: 'white on dark background' },
  { id: 'blue',     label: 'أزرق',    hint: 'royal blue (#1D4ED8) and navy' },
  { id: 'red',      label: 'أحمر',    hint: 'crimson red (#DC2626) with dark accents' },
  { id: 'green',    label: 'أخضر',    hint: 'emerald green (#10B981)' },
  { id: 'orange',   label: 'برتقالي', hint: 'warm orange (#F97316)' },
  { id: 'purple',   label: 'بنفسجي',  hint: 'deep purple (#7C3AED)' },
  { id: 'multi',    label: 'ملوّن',    hint: 'multi-color vibrant palette' },
];

function LogoStudioModal({ project, onClose, onApplied }) {
  const [stage, setStage] = useState('brand'); // brand | style | generating | pick | applied
  const [brand, setBrand] = useState(project?.name || '');
  const [hint, setHint]   = useState('');
  const [style, setStyle] = useState(null);
  const [color, setColor] = useState(null);
  const [logos, setLogos] = useState([]);
  const [busy, setBusy]   = useState(false);

  const generate = async (selectedStyle, selectedColor) => {
    if (!project?.id) return;
    setBusy(true);
    setStage('generating');
    toast.info('🎨 جاري توليد 3 لوقوهات — 20-40 ثانية');
    const fullPrompt = `لوقو لـ "${brand || project?.name || 'نشاطي'}". ${hint}`.trim();
    try {
      const r = await fetch(`${API}/api/websites/projects/${project.id}/generate-logo-variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authH() },
        body: JSON.stringify({
          prompt: fullPrompt,
          style_hint: selectedStyle?.hint || '',
          color_hint: selectedColor?.hint || '',
          count: 3,
        }),
      });
      if (!r.ok) throw new Error('failed');
      const d = await r.json();
      setLogos(d.logos || []);
      setStage('pick');
    } catch (_) {
      toast.error('فشل التوليد — حاول بوصف أوضح');
      setStage('style');
    } finally { setBusy(false); }
  };

  const applyLogo = async (logoUrl) => {
    if (!project?.id || !logoUrl) return;
    setBusy(true);
    try {
      await fetch(`${API}/api/websites/projects/${project.id}/apply-logo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authH() },
        body: JSON.stringify({ logo_url: logoUrl }),
      });
      onApplied(logoUrl);
      setStage('applied');
      toast.success('✨ تم تثبيت اللوقو في الموقع!');
      setTimeout(onClose, 900);
    } catch (_) { toast.error('فشل التطبيق'); }
    finally { setBusy(false); }
  };

  const regenerateWithColor = (c) => {
    setColor(c);
    generate(style, c);
  };

  return (
    <div className="fixed inset-0 bg-black/85 z-[60] flex items-center justify-center p-4" onClick={onClose} dir="rtl" data-testid="logo-studio-modal">
      <div className="bg-[#0e1128] rounded-2xl max-w-3xl w-full border border-yellow-500/30 p-5 md:p-6 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4 gap-3">
          <div>
            <h2 className="text-lg md:text-xl font-bold mb-1 flex items-center gap-2"><Sparkles className="w-5 h-5 text-yellow-400" /> استوديو اللوقو</h2>
            <p className="text-xs md:text-sm opacity-70">
              {stage === 'brand' && 'الخطوة 1 من 3 — اسم العلامة التجارية'}
              {stage === 'style' && 'الخطوة 2 من 3 — اختر الأسلوب (بضغطة واحدة)'}
              {stage === 'generating' && 'جاري توليد 3 تصاميم...'}
              {stage === 'pick' && 'الخطوة 3 من 3 — اختر اللوقو المفضّل + بدّل اللون'}
              {stage === 'applied' && '✨ تم تثبيت اللوقو!'}
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded shrink-0"><X className="w-5 h-5" /></button>
        </div>

        {stage === 'brand' && (
          <div className="space-y-3" data-testid="logo-stage-brand">
            <div>
              <label className="text-xs opacity-70 block mb-1">اسم العلامة التجارية</label>
              <input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="مثال: كوفي دافئ"
                className="w-full px-3 py-2.5 bg-white/10 border border-white/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                data-testid="logo-brand-input"
              />
            </div>
            <div>
              <label className="text-xs opacity-70 block mb-1">تفاصيل إضافية (اختياري)</label>
              <input
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                placeholder="مثال: فنجان قهوة بلمسة دفء وحبوب بن"
                className="w-full px-3 py-2.5 bg-white/10 border border-white/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                data-testid="logo-hint-input"
              />
            </div>
            <button
              onClick={() => brand.trim() && setStage('style')}
              disabled={!brand.trim()}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-xl font-bold disabled:opacity-50"
              data-testid="logo-next-style-btn"
            >التالي ← اختر الأسلوب</button>
          </div>
        )}

        {stage === 'style' && (
          <div className="space-y-3" data-testid="logo-stage-style">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {LOGO_STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setStyle(s); generate(s, color); }}
                  disabled={busy}
                  className="p-3 rounded-xl bg-white/5 hover:bg-yellow-500/15 border border-white/10 hover:border-yellow-500/50 transition-all disabled:opacity-50 font-bold text-sm"
                  data-testid={`logo-style-${s.id}`}
                >{s.label}</button>
              ))}
            </div>
            <button onClick={() => setStage('brand')} className="text-xs opacity-70 hover:opacity-100 w-full text-center mt-2">← رجوع</button>
          </div>
        )}

        {stage === 'generating' && (
          <div className="py-10 text-center" data-testid="logo-stage-generating">
            <RefreshCw className="w-12 h-12 mx-auto mb-3 text-yellow-400 animate-spin" />
            <div className="text-sm font-bold">جاري توليد 3 لوقوهات بأسلوب "{style?.label}"</div>
            <div className="text-xs opacity-60 mt-1">قد يستغرق 20-40 ثانية...</div>
          </div>
        )}

        {stage === 'pick' && (
          <div className="space-y-4" data-testid="logo-stage-pick">
            <div>
              <div className="text-xs opacity-70 mb-2">اختر لوقو (ضغطة لتثبيته)</div>
              <div className="grid grid-cols-3 gap-2">
                {logos.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => applyLogo(url)}
                    disabled={busy}
                    className="group relative aspect-square rounded-xl bg-white border-2 border-white/10 hover:border-yellow-500 transition-all overflow-hidden disabled:opacity-50"
                    data-testid={`logo-pick-${i}`}
                  >
                    <img src={url} alt={`logo ${i+1}`} className="w-full h-full object-contain p-2" />
                    <div className="absolute inset-0 bg-yellow-500/0 group-hover:bg-yellow-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <Check className="w-10 h-10 text-black bg-yellow-400 rounded-full p-2 shadow-xl" />
                    </div>
                  </button>
                ))}
                {logos.length === 0 && (
                  <div className="col-span-3 text-center py-8 text-white/50 text-sm">لم يتم توليد أي لوقو — جرّب وصفاً آخر</div>
                )}
              </div>
            </div>
            <div>
              <div className="text-xs opacity-70 mb-2">💡 غيّر اللون وأعد التوليد (اختياري)</div>
              <div className="flex flex-wrap gap-1.5">
                {LOGO_COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => regenerateWithColor(c)}
                    disabled={busy}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all disabled:opacity-50 ${color?.id === c.id ? 'bg-yellow-500 border-yellow-500 text-black' : 'bg-white/5 border-white/15 hover:bg-yellow-500/20 hover:border-yellow-500/50'}`}
                    data-testid={`logo-color-${c.id}`}
                  >{c.label}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStage('style')} className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold">← غيّر الأسلوب</button>
              <button onClick={() => generate(style, color)} disabled={busy} className="flex-1 px-3 py-2 bg-gradient-to-r from-purple-500/40 to-pink-500/40 hover:from-purple-500/60 hover:to-pink-500/60 border border-purple-400/40 rounded-lg text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1.5"><RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />جرّب 3 تصاميم أخرى</button>
            </div>
          </div>
        )}

        {stage === 'applied' && (
          <div className="py-10 text-center" data-testid="logo-stage-applied">
            <Check className="w-16 h-16 mx-auto mb-3 text-green-400 bg-green-500/20 rounded-full p-3" />
            <div className="text-base font-bold">✨ اللوقو معتمد في موقعك!</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   OVERRIDE BUILDER — compute theme/section override for live preview
   ================================================================ */
const VARIANT_MAP = {
  classic:  { primary: '#D4AF37', secondary: '#1a1f3a', accent: '#8B0000' },
  modern:   { primary: '#3B82F6', secondary: '#0f172a', accent: '#22D3EE' },
  warm:     { primary: '#F59E0B', secondary: '#18181b', accent: '#EF4444' },
  luxury:   { primary: '#D4AF37', secondary: '#0a0a0a', accent: '#B8860B', background: '#0a0a0a' },
  dark_pro: { primary: '#06B6D4', secondary: '#020617', accent: '#F59E0B', background: '#020617' },
  nature:   { primary: '#10B981', secondary: '#064e3b', accent: '#F59E0B' },
  pastel:   { primary: '#A78BFA', secondary: '#FDF2F8', accent: '#F472B6', background: '#FDF2F8', text: '#581c87' },
  bold:     { primary: '#DC2626', secondary: '#18181b', accent: '#FBBF24' },
};

const DASH_ICONS = { orders: '📦', customers: '👥', products: '🏷️', analytics: '📊', messages: '💬', reports: '📈', users: '🔐', settings: '⚙️', phone: '📞', email: '📧', calendar: '📅', inventory: '📋', payments: '💳', reviews: '⭐' };
const DASH_LABELS = { orders: 'الطلبات', customers: 'العملاء', products: 'المنتجات', analytics: 'الإحصائيات', messages: 'الرسائل', reports: 'التقارير', users: 'المستخدمون', settings: 'الإعدادات', phone: 'رقم الجوال', email: 'البريد', calendar: 'التقويم', inventory: 'المخزون', payments: 'المدفوعات', reviews: 'التقييمات' };

function buildOverrides(step, value, project) {
  const theme_override = {};
  let sections_override = null;
  const sections = project?.sections || [];

  if (step === 'variant') {
    const vmap = { classic: VARIANT_MAP.classic, modern: VARIANT_MAP.modern, warm: VARIANT_MAP.warm, luxury: VARIANT_MAP.luxury, dark_pro: VARIANT_MAP.dark_pro, nature: VARIANT_MAP.nature, pastel: VARIANT_MAP.pastel, bold: VARIANT_MAP.bold };
    Object.assign(theme_override, vmap[value] || {});
  } else if (step === 'buttons') {
    theme_override.radius = value;
  } else if (step === 'colors') {
    Object.assign(theme_override, VARIANT_MAP[value] || {});
  } else if (step === 'typography') {
    theme_override.font = value;
  } else if (step === 'dashboard') {
    // Dashboard-only mode: replace ALL sections with just the dashboard
    const existing = sections.find((s) => s.type === 'dashboard');
    if (value === 'none') {
      // User said no dashboard — show the regular site without dashboard
      sections_override = sections.filter((s) => s.type !== 'dashboard').map((s, i) => ({ ...s, order: i }));
    } else {
      const dashData = { layout: value, title: 'لوحة التحكم', items: existing?.data?.items || [] };
      sections_override = [{ id: 'preview-dash', type: 'dashboard', order: 0, visible: true, data: dashData }];
    }
  } else if (step === 'dashboard_items') {
    // Dashboard-only mode with chosen items — full screen admin UI
    const items = Array.isArray(value) ? value : (value ? [value] : []);
    const existing = sections.find((s) => s.type === 'dashboard');
    const layout = existing?.data?.layout || 'sidebar';
    sections_override = [{ id: 'preview-dash', type: 'dashboard', order: 0, visible: true, data: { layout, title: 'لوحة التحكم', items } }];
  } else if (step === 'sections') {
    // Live-update: show EXACTLY the sections the user has toggled (plus footer).
    // If a wanted type is missing from current sections, create a stub so it shows instantly.
    const wanted = Array.isArray(value) ? value : [value];
    const existingByType = {};
    (sections || []).forEach((s) => { existingByType[s.type] = s; });
    const DEFAULT_STUBS = {
      hero:        { title: project?.name || 'عنوان رئيسي', subtitle: 'عنوان فرعي ملهم', cta_text: 'ابدأ الآن', layout: 'split' },
      about:       { title: 'من نحن', text: 'اكتب نبذة مختصرة عن نشاطك.' },
      features:    { title: 'مميزاتنا', items: [{ icon:'✨', title:'ميزة أولى', text:'وصف' },{ icon:'🚀', title:'ميزة ثانية', text:'وصف' },{ icon:'💎', title:'ميزة ثالثة', text:'وصف' }] },
      menu:        { title: 'قائمة الطعام', categories: [{ name:'المشروبات الساخنة', items:[{name:'قهوة تركية',price:'15'},{name:'كابتشينو',price:'20'},{name:'لاتيه',price:'22'}] },{ name:'الحلويات', items:[{name:'تشيز كيك',price:'28'},{name:'براوني',price:'24'}] }] },
      products:    { title: 'منتجاتنا', items: [{name:'منتج 1',price:'99'},{name:'منتج 2',price:'149'},{name:'منتج 3',price:'199'}] },
      gallery:     { title: 'معرض الصور', images: ['https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800','https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800','https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800'] },
      testimonials:{ title: 'آراء عملائنا', items: [{name:'أحمد',text:'تجربة رائعة!',rating:5},{name:'سارة',text:'جودة ممتازة',rating:5}] },
      team:        { title: 'فريقنا', members: [{name:'محمد',role:'المؤسس'},{name:'أحمد',role:'المدير'},{name:'فاطمة',role:'التسويق'}] },
      pricing:     { title: 'خطط الأسعار', plans: [{name:'أساسي',price:'99',features:['ميزة 1','ميزة 2']},{name:'احترافي',price:'199',features:['كل ما سبق','ميزة 3'],highlighted:true}] },
      faq:         { title: 'أسئلة شائعة', items: [{q:'كيف أطلب؟',a:'بسهولة عبر الموقع'},{q:'مدة التوصيل؟',a:'من 1-3 أيام'}] },
      contact:     { title: 'تواصل معنا', email: 'info@example.com', phone: '+966 50 000 0000' },
      cta:         { title: 'جاهز للبدء؟', cta_text: 'انضم إلينا' },
    };
    const built = wanted.map((t) => existingByType[t] || ({ id: `preview-${t}`, type: t, order: 0, visible: true, data: DEFAULT_STUBS[t] || { title: t } }));
    // Always include footer at end if exists
    const footer = (sections || []).find((s) => s.type === 'footer');
    if (footer) built.push(footer);
    sections_override = built.map((s, i) => ({ ...s, order: i }));
  } else if (step === 'payment') {
    // Live: show selected payment methods in a small preview band (stored in theme)
    const wanted = Array.isArray(value) ? value : [value];
    theme_override.payment_methods = wanted.filter((p) => p !== 'none');
  } else if (step === 'features') {
    // 🆕 Each feature must materialize in the live preview immediately.
    const wanted = Array.isArray(value) ? value : [value];
    const FEATURE_EXTRAS = { whatsapp: 'whatsapp_float', cart: 'cart_float', booking: 'book_float', reviews: 'rating_widget' };
    const FEATURE_SECTION = {
      reservation:  { type: 'reservation', data: { title: 'احجز طاولتك', subtitle: 'اضمن مكانك قبل الزحام', cta_text: 'احجز الآن' } },
      map:          { type: 'map_embed', data: { title: 'موقعنا على الخريطة', address: 'الرياض، المملكة العربية السعودية', lat: 24.7136, lng: 46.6753 } },
      newsletter:   { type: 'newsletter', data: { title: 'اشترك في نشرتنا', subtitle: 'عروض حصرية وأخبار أولاً' } },
      delivery:     { type: 'delivery_banner', data: { title: '🛵 توصيل سريع', subtitle: 'توصيل مجاني للطلبات فوق 100 ريال', cta_text: 'اطلب الآن' } },
    };
    const featureExtrasIds = new Set(Object.values(FEATURE_EXTRAS));
    const featureSectionTypes = new Set(Object.values(FEATURE_SECTION).map((x) => x.type));
    // Merge into theme.extras (remove previously-added feature extras first)
    const existingExtras = (project?.theme?.extras || []).filter((e) => !featureExtrasIds.has(e));
    const newExtras = [...existingExtras];
    wanted.forEach((f) => { if (FEATURE_EXTRAS[f] && !newExtras.includes(FEATURE_EXTRAS[f])) newExtras.push(FEATURE_EXTRAS[f]); });
    theme_override.extras = newExtras;
    // Build sections override (remove previously-added feature sections, re-add wanted)
    const wantedSectionTypes = new Set();
    const wantedSectionsMap = {};
    wanted.forEach((f) => {
      if (FEATURE_SECTION[f]) {
        wantedSectionTypes.add(FEATURE_SECTION[f].type);
        wantedSectionsMap[FEATURE_SECTION[f].type] = FEATURE_SECTION[f];
      }
    });
    const kept = sections.filter((s) => !featureSectionTypes.has(s.type) || wantedSectionTypes.has(s.type));
    const existingTypes = new Set(kept.map((s) => s.type));
    const footerIdx = kept.findIndex((s) => s.type === 'footer');
    const insertAt = footerIdx >= 0 ? footerIdx : kept.length;
    const toInsert = [];
    wantedSectionTypes.forEach((stype) => {
      if (!existingTypes.has(stype)) {
        const m = wantedSectionsMap[stype];
        toInsert.push({ id: `preview-${stype}`, type: stype, order: 0, visible: true, data: m.data });
      }
    });
    kept.splice(insertAt, 0, ...toInsert);
    sections_override = kept.map((s, i) => ({ ...s, order: i }));
  } else if (step === 'extras') {
    // Apply extras to theme (floating widgets)
    const wanted = Array.isArray(value) ? value : [value];
    theme_override.extras = wanted;
    // Also add/remove section-extras (video, newsletter, stats_band)
    const sectionMap = {
      video_section:   { type: 'video', data: { title: 'شاهد قصتنا', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' } },
      newsletter:      { type: 'newsletter', data: { title: 'اشترك في نشرتنا', subtitle: 'خصومات حصرية' } },
      stats_band:      { type: 'stats_band', data: { title: 'أرقام نفتخر بها', items: [
        { label: 'عميل سعيد', value: '5,000+' }, { label: 'طلب', value: '12,400' },
        { label: 'سنوات خبرة', value: '10' }, { label: 'تقييم', value: '4.9★' },
      ] } },
    };
    const wantedTypes = new Set();
    wanted.forEach((e) => { if (sectionMap[e]) wantedTypes.add(sectionMap[e].type); });
    const kept = sections.filter((s) => !['video', 'newsletter', 'stats_band'].includes(s.type) || wantedTypes.has(s.type));
    const existingTypes = new Set(kept.map((s) => s.type));
    const footerIdx = kept.findIndex((s) => s.type === 'footer');
    const insertAt = footerIdx >= 0 ? footerIdx : kept.length;
    const toInsert = [];
    wanted.forEach((e) => {
      const m = sectionMap[e];
      if (m && !existingTypes.has(m.type)) {
        toInsert.push({ id: `preview-${m.type}`, type: m.type, order: 0, visible: true, data: m.data });
      }
    });
    kept.splice(insertAt, 0, ...toInsert);
    sections_override = kept.map((s, i) => ({ ...s, order: i }));
  }
  return { theme_override, sections_override };
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
  const [pending, setPending] = useState(null); // { step, value, html }
  const [previewDevice, setPreviewDevice] = useState('desktop'); // desktop | mobile
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
      setPending(null);
    } catch (_) { toast.error('فشل الرد'); }
    finally { setChatLoading(false); }
  };

  // Auto-scroll the iframe to the relevant section per wizard step + pulse highlight
  const scrollIframeTo = useCallback((step, value) => {
    setTimeout(() => {
      try {
        const iframe = document.querySelector('[data-testid="live-preview"]');
        const doc = iframe && iframe.contentDocument;
        if (!doc) return;
        const SCROLL_MAP = {
          variant:      '[data-hl="hero"]',
          colors:       '[data-hl="hero"]',
          buttons:      '[data-hl="btn"]',
          typography:   '[data-hl="h1"]',
          features:     '[data-hl="features"]',
          branding:     '[data-hl="hero"]',
          payment:      '[data-hl="pricing"],[data-hl="cta"]',
          sections:     '[data-hl="features"]',
        };
        let target = null;
        if (step === 'dashboard_items' && Array.isArray(value) && value.length > 0) {
          const last = value[value.length - 1];
          target = doc.getElementById(`panel-${last}`);
        } else if (step === 'sections' && Array.isArray(value) && value.length > 0) {
          // Scroll to the LAST toggled section so user sees it instantly
          const last = value[value.length - 1];
          target = doc.querySelector(`[data-hl="${last}"]`) || doc.getElementById(last);
        } else if (step === 'payment' && Array.isArray(value) && value.length > 0) {
          target = doc.querySelector('[data-hl="payment"]') || doc.querySelector('footer,[data-hl="footer"]');
        } else if (step === 'features' && Array.isArray(value) && value.length > 0) {
          const last = value[value.length - 1];
          const featureMap = {
            whatsapp:    '[data-hl="extra-whatsapp"]',
            cart:        '[data-hl="extra-cart"]',
            booking:     '[data-hl="extra-book"]',
            reviews:     '[data-hl="extra-rating"]',
            reservation: '[data-hl="reservation"]',
            map:         '[data-hl="map"]',
            newsletter:  '[data-hl="newsletter"]',
            delivery:    '[data-hl="delivery"]',
          };
          const sel = featureMap[last];
          if (sel) target = doc.querySelector(sel);
        } else if (step === 'extras' && Array.isArray(value) && value.length > 0) {
          const last = value[value.length - 1];
          const extraMap = {
            video_section: '[data-hl="video"]',
            newsletter: '[data-hl="newsletter"]',
            stats_band: '[data-hl="stats_band"]',
            sticky_phone: '[data-hl="extra-phone"]',
            whatsapp_float: '[data-hl="extra-whatsapp"]',
            scroll_top: '[data-hl="extra-scroll"]',
            countdown: '[data-hl="extra-countdown"]',
            rating_widget: '[data-hl="extra-rating"]',
            social_bar: '[data-hl="extra-social"]',
            trust_badges: '[data-hl="extra-trust"]',
            live_chat: '[data-hl="extra-chat"]',
          };
          const sel = extraMap[last];
          if (sel) target = doc.querySelector(sel);
        } else {
          const sel = SCROLL_MAP[step];
          if (sel) target = doc.querySelector(sel);
        }
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          target.classList.remove('zx-pulse');
          // Force reflow then add pulse
          void target.offsetWidth;
          target.classList.add('zx-pulse');
          setTimeout(() => target.classList.remove('zx-pulse'), 1600);
        }
      } catch (_) { /* ignore */ }
    }, 450);
  }, []);

  // Live-preview: applies theme/section overrides WITHOUT persisting
  const previewAnswer = async (step, value) => {
    if (!project?.id) return;
    const overrides = buildOverrides(step, value, project);
    try {
      const r = await fetch(`${API}/api/websites/projects/${project.id}/build-preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authH() },
        body: JSON.stringify(overrides),
      });
      const d = await r.json();
      setPreviewHtml(d.html || '');
      setPending({ step, value });
      scrollIframeTo(step, value);
    } catch (_) { /* ignore */ }
  };

  const confirmPending = async () => {
    if (!pending) return;
    await answerWizard(pending.value);
  };

  const cancelPending = async () => {
    setPending(null);
    // Refresh preview to the saved state
    if (project) refreshPreview(project);
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
      if (d.project) {
        setProject(d.project);
        // Immediate refresh (bypass the 400ms debounce so the user SEES the change now)
        refreshPreview(d.project);
      }
      if (d.action && d.action.action) {
        const a = d.action.action;
        const msgs = {
          add_section: '✨ تمت إضافة قسم جديد في المعاينة',
          fill_section: '📝 تم تحديث محتوى القسم',
          patch_section: '✏️ تم تعديل القسم',
          remove_section: '🗑️ تم حذف القسم',
          apply_theme: '🎨 تم تطبيق الألوان',
          apply_button: '🔘 تم تغيير الأزرار',
          apply_font: '🔤 تم تغيير الخط',
          inject_css: '💫 تم تطبيق التأثير',
          scaffold: '🏗️ تم إعادة بناء الموقع',
          generate_logo: '🖼️ جاري توليد اللوقو...',
        };
        if (msgs[a]) toast.success(msgs[a]);
      }
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

  const duplicateProject = async (id) => {
    try {
      const r = await fetch(`${API}/api/websites/projects/${id}/duplicate`, { method: 'POST', headers: authH() });
      const d = await r.json();
      toast.success('تم نسخ المشروع');
      await loadProjects();
      setProject(d);
      setShowLibrary(false);
    } catch (_) { toast.error('فشل النسخ'); }
  };

  const approveProject = async (id) => {
    try {
      await fetch(`${API}/api/websites/projects/${id}/approve`, { method: 'POST', headers: authH() });
      toast.success('✅ تم اعتماد المشروع رسمياً');
      await loadProjects();
      if (project?.id === id) setProject({ ...project, status: 'approved' });
    } catch (_) { toast.error('فشل الاعتماد'); }
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

  // Auto-preview an empty dashboard when entering the dashboard step (teaser)
  useEffect(() => {
    if (!project?.id || !currentStep) return;
    if (currentStep === 'dashboard' && !pending) {
      // Show empty sidebar dashboard full-screen
      previewAnswer('dashboard', 'sidebar');
    } else if (currentStep === 'dashboard_items' && !pending) {
      // Show current items as full dashboard
      const existing = (project.sections || []).find((s) => s.type === 'dashboard');
      const items = existing?.data?.items || [];
      previewAnswer('dashboard_items', items);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id, currentStep]);

  // Logo generation — now opens a proper multi-step studio (no more window.prompt)
  const [logoStudioOpen, setLogoStudioOpen] = useState(false);
  const openLogoStudio = () => {
    if (!project?.id) { toast.info('ابدأ بإنشاء مشروع أولاً'); return; }
    setLogoStudioOpen(true);
  };
  const onLogoApplied = (url) => {
    setProject((prev) => prev ? ({ ...prev, theme: { ...(prev.theme || {}), logo_url: url } }) : prev);
  };

  const removeLogo = async () => {
    if (!project?.id) return;
    const newTheme = { ...(project.theme || {}) };
    delete newTheme.logo_url;
    setProject({ ...project, theme: newTheme });
    await fetch(`${API}/api/websites/projects/${project.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authH() },
      body: JSON.stringify({ ...project, theme: newTheme }),
    });
    toast.success('تم إزالة اللوقو');
  };

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
            <button onClick={openLogoStudio} disabled={!project} className="p-2 md:px-3 md:py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-400/30 rounded-lg flex items-center gap-1.5 disabled:opacity-40" data-testid="gen-logo-btn" title="استوديو توليد اللوقو بالذكاء الاصطناعي">
              <Sparkles className="w-4 h-4 text-purple-300" />
              <span className="hidden md:inline text-xs">اعمل لوقو</span>
            </button>
            {project && project.status !== 'approved' && (
              <button onClick={() => approveProject(project.id)} className="p-2 md:px-3 md:py-2 bg-gradient-to-r from-green-500/30 to-emerald-500/30 hover:from-green-500/50 hover:to-emerald-500/50 border border-green-400/40 rounded-lg flex items-center gap-1.5" data-testid="approve-btn" title="اعتماد نهائي">
                <Check className="w-4 h-4 text-green-300" /><span className="hidden md:inline text-xs font-bold">اعتماد</span>
              </button>
            )}
            {project?.status === 'approved' && (
              <span className="px-2 md:px-3 py-2 bg-green-500 text-black rounded-lg text-xs font-bold flex items-center gap-1" data-testid="approved-badge">
                <Check className="w-4 h-4" /><span className="hidden md:inline">معتمد</span>
              </span>
            )}
            {project?.theme?.logo_url && (
              <button onClick={removeLogo} className="p-2 bg-white/10 hover:bg-red-500/20 rounded-lg" title="إزالة اللوقو" data-testid="remove-logo-btn"><X className="w-4 h-4" /></button>
            )}
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
                device={previewDevice}
                onToggleDevice={setPreviewDevice}
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
                  onAnswerStep={(v) => previewAnswer(project?.wizard?.step, v)}
                  onRequestCode={() => setShowIndependence(true)}
                  pending={pending}
                  onConfirm={confirmPending}
                  onCancel={cancelPending}
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

      {showLibrary && <LibraryModal projects={projects} onOpen={openProject} onDelete={deleteProject} onDuplicate={duplicateProject} onApprove={approveProject} onClose={() => setShowLibrary(false)} />}
      {showIndependence && <IndependenceModal onClose={() => setShowIndependence(false)} />}
      {logoStudioOpen && <LogoStudioModal project={project} onClose={() => setLogoStudioOpen(false)} onApplied={onLogoApplied} />}
    </div>
  );
}
