import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect, Image as KonvaImage, Transformer, Group, Line } from 'react-konva';
import useImage from 'use-image';
import { ELEMENT_LIBRARY, CATEGORIES, elementSvg, svgToDataUrl } from './designer/elementLibrary';
import { toast } from 'sonner';
import {
  Trash2, Copy, RotateCcw, ZoomIn, ZoomOut, Save, FolderOpen,
  Play, Download, ArrowLeft, Eye, Plus, ChevronUp, ChevronDown, Undo2, Redo2
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

// =============== CANVAS ELEMENT RENDERER ===============
function CanvasElement({ el, isSelected, onSelect, onChange }) {
  const [img] = useImage(svgToDataUrl(elementSvg(el.type, el.props)), 'anonymous');
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  if (!img) return null;

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        image={img}
        x={el.x}
        y={el.y}
        width={el.width}
        height={el.height}
        rotation={el.rotation || 0}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => onChange({ ...el, x: e.target.x(), y: e.target.y() })}
        onTransformEnd={() => {
          const node = shapeRef.current;
          const sx = node.scaleX(); const sy = node.scaleY();
          node.scaleX(1); node.scaleY(1);
          onChange({
            ...el,
            x: node.x(), y: node.y(),
            width: Math.max(20, node.width() * sx),
            height: Math.max(20, node.height() * sy),
            rotation: node.rotation(),
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled
          keepRatio={false}
          anchorSize={10}
          anchorStroke="#FFD700"
          anchorFill="#1a1f3a"
          borderStroke="#FFD700"
          borderDash={[6, 3]}
          boundBoxFunc={(oldBox, newBox) => (newBox.width < 20 || newBox.height < 20 ? oldBox : newBox)}
        />
      )}
    </>
  );
}

// =============== MAIN DESIGNER ===============
export default function VisualDesigner({ user }) {
  const stageRef = useRef();
  const containerRef = useRef();

  const [designName, setDesignName] = useState('قرية جديدة');
  const [designId, setDesignId] = useState(null);
  const [canvas, setCanvas] = useState({ width: 1280, height: 720, background_color: '#87CEEB', background_image_url: null });
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [activeCat, setActiveCat] = useState('buildings');
  const [scale, setScale] = useState(0.6);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [snap, setSnap] = useState(false);
  const [savedDesigns, setSavedDesigns] = useState([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([[]]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [previewHtml, setPreviewHtml] = useState(null);

  const selected = elements.find((e) => e.id === selectedId);

  // Record a snapshot to history (for undo/redo)
  const pushHistory = useCallback((newElements) => {
    const base = history.slice(0, historyIdx + 1);
    base.push(JSON.parse(JSON.stringify(newElements)));
    setHistory(base.slice(-50));
    setHistoryIdx(Math.min(base.length, 50) - 1);
  }, [history, historyIdx]);

  const setElementsH = (updater) => {
    setElements((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setTimeout(() => pushHistory(next), 0);
      return next;
    });
  };

  // Fit stage to container
  useEffect(() => {
    const fit = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.offsetWidth - 20;
      const h = containerRef.current.offsetHeight - 20;
      const s = Math.min(w / canvas.width, h / canvas.height, 1);
      setScale(s);
      setStagePos({
        x: (containerRef.current.offsetWidth - canvas.width * s) / 2,
        y: (containerRef.current.offsetHeight - canvas.height * s) / 2,
      });
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [canvas.width, canvas.height]);

  // Load designs list
  useEffect(() => { loadDesigns(); }, []);

  // Auto-save every 6s if there's any change
  useEffect(() => {
    if (!designId || elements.length === 0) return;
    const t = setTimeout(() => autoSave(), 6000);
    return () => clearTimeout(t);
  }, [elements, designId]); // eslint-disable-line

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Delete' || e.key === 'Backspace') { if (selectedId) { deleteElement(); e.preventDefault(); } }
      if (e.ctrlKey && e.key === 'd') { if (selectedId) { duplicateElement(); e.preventDefault(); } }
      if (e.ctrlKey && e.key === 'z') { undo(); e.preventDefault(); }
      if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { redo(); e.preventDefault(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, history, historyIdx]); // eslint-disable-line

  const loadDesigns = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/designs`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setSavedDesigns(data.designs || []);
    } catch (e) { /* ignore */ }
  };

  const addElement = (type) => {
    const def = ELEMENT_LIBRARY.find((e) => e.type === type);
    if (!def) return;
    const el = {
      id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      x: canvas.width / 2 - def.w / 2,
      y: canvas.height / 2 - def.h / 2,
      width: def.w,
      height: def.h,
      rotation: 0,
      z_index: elements.length,
      props: { variant: 0, label: def.name },
    };
    setElementsH((prev) => [...prev, el]);
    setSelectedId(el.id);
  };

  const updateElement = (upd) => setElementsH((prev) => prev.map((e) => (e.id === upd.id ? upd : e)));
  const deleteElement = () => { if (!selectedId) return; setElementsH((p) => p.filter((e) => e.id !== selectedId)); setSelectedId(null); };
  const duplicateElement = () => {
    if (!selected) return;
    const copy = { ...JSON.parse(JSON.stringify(selected)), id: `el-${Date.now()}`, x: selected.x + 30, y: selected.y + 30, z_index: elements.length };
    setElementsH((p) => [...p, copy]);
    setSelectedId(copy.id);
  };
  const bringToFront = () => { if (!selected) return; updateElement({ ...selected, z_index: Math.max(...elements.map((e) => e.z_index)) + 1 }); };
  const sendToBack = () => { if (!selected) return; updateElement({ ...selected, z_index: Math.min(...elements.map((e) => e.z_index)) - 1 }); };

  const undo = () => { if (historyIdx <= 0) return; setHistoryIdx((i) => i - 1); setElements(JSON.parse(JSON.stringify(history[historyIdx - 1]))); setSelectedId(null); };
  const redo = () => { if (historyIdx >= history.length - 1) return; setHistoryIdx((i) => i + 1); setElements(JSON.parse(JSON.stringify(history[historyIdx + 1]))); setSelectedId(null); };

  const autoSave = async () => {
    if (!designId) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API}/api/designs/${designId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: designName, category: 'game', genre: 'strategy', canvas, elements, meta: {} }),
      });
    } catch (e) { /* silent */ }
  };

  const save = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const body = { name: designName, category: 'game', genre: 'strategy', canvas, elements, meta: {} };
      const url = designId ? `${API}/api/designs/${designId}` : `${API}/api/designs`;
      const method = designId ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      const data = await res.json();
      setDesignId(data.id);
      await loadDesigns();
      toast.success('تم الحفظ بنجاح');
    } catch (e) { toast.error('فشل الحفظ'); } finally { setSaving(false); }
  };

  const loadDesign = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/designs/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      setDesignId(d.id);
      setDesignName(d.name);
      setCanvas(d.canvas);
      setElements(d.elements || []);
      setHistory([d.elements || []]);
      setHistoryIdx(0);
      setShowLibrary(false);
      setSelectedId(null);
      toast.success(`تم فتح: ${d.name}`);
    } catch (e) { toast.error('فشل الفتح'); }
  };

  const newDesign = () => {
    setDesignId(null);
    setDesignName('قرية جديدة');
    setElements([]);
    setHistory([[]]);
    setHistoryIdx(0);
    setSelectedId(null);
    setShowLibrary(false);
  };

  const deleteDesign = async (id) => {
    if (!window.confirm('حذف هذا التصميم نهائياً؟')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API}/api/designs/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      await loadDesigns();
      if (designId === id) newDesign();
      toast.success('حُذف');
    } catch (e) { toast.error('فشل الحذف'); }
  };

  const duplicateDesign = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API}/api/designs/${id}/duplicate`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      await loadDesigns();
      toast.success('تم التكرار');
    } catch (e) { toast.error('فشل'); }
  };

  const buildAndPreview = async () => {
    if (!designId) { await save(); if (!designId) return; }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/designs/${designId}/build`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setPreviewHtml(data.html);
    } catch (e) { toast.error('فشل البناء'); }
  };

  const exportHtml = async () => {
    if (!designId) { await save(); if (!designId) return; }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/designs/${designId}/build`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      const blob = new Blob([data.html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${designName}.html`; document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e) { toast.error('فشل التصدير'); }
  };

  // Grid lines
  const gridLines = [];
  if (showGrid) {
    const step = 40;
    for (let i = 0; i <= canvas.width; i += step) gridLines.push(<Line key={`v${i}`} points={[i, 0, i, canvas.height]} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />);
    for (let i = 0; i <= canvas.height; i += step) gridLines.push(<Line key={`h${i}`} points={[0, i, canvas.width, i]} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />);
  }

  const categoryElements = ELEMENT_LIBRARY.filter((e) => e.category === activeCat);

  return (
    <div className="h-screen flex flex-col bg-[#0b0f1f] text-white overflow-hidden" dir="rtl" data-testid="visual-designer">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-gradient-to-b from-[#151937] to-[#0e1128] border-b border-yellow-500/20 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => (window.location.href = '/chat')} className="p-2 hover:bg-white/10 rounded-lg" data-testid="back-to-chat-btn">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <input
            value={designName}
            onChange={(e) => setDesignName(e.target.value)}
            className="bg-transparent border-b border-white/10 focus:border-yellow-500 px-2 py-1 text-lg font-bold focus:outline-none min-w-[200px]"
            data-testid="design-name-input"
          />
          {designId && <span className="text-xs text-green-400">محفوظ</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={undo} disabled={historyIdx <= 0} className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-40" title="تراجع (Ctrl+Z)" data-testid="undo-btn"><Undo2 className="w-4 h-4" /></button>
          <button onClick={redo} disabled={historyIdx >= history.length - 1} className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-40" title="تكرار (Ctrl+Y)" data-testid="redo-btn"><Redo2 className="w-4 h-4" /></button>
          <div className="w-px h-6 bg-white/20 mx-1" />
          <button onClick={() => setShowLibrary(true)} className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg" data-testid="open-library-btn">
            <FolderOpen className="w-4 h-4" /><span className="text-sm">مكتبتي ({savedDesigns.length})</span>
          </button>
          <button onClick={newDesign} className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg" data-testid="new-design-btn">
            <Plus className="w-4 h-4" /><span className="text-sm">جديد</span>
          </button>
          <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg disabled:opacity-60" data-testid="save-btn">
            <Save className="w-4 h-4" /><span className="text-sm font-bold">{saving ? 'جارٍ الحفظ...' : 'حفظ'}</span>
          </button>
          <button onClick={buildAndPreview} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:brightness-110 rounded-lg font-bold" data-testid="preview-btn">
            <Play className="w-4 h-4" /><span className="text-sm">عرض اللايف</span>
          </button>
          <button onClick={exportHtml} className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg" data-testid="export-btn">
            <Download className="w-4 h-4" /><span className="text-sm">تصدير</span>
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar - Tools */}
        <aside className="w-64 bg-[#0e1128] border-l border-white/5 p-3 overflow-y-auto" data-testid="tools-sidebar">
          <div className="text-xs font-bold text-yellow-500 mb-2 uppercase">فئات العناصر</div>
          <div className="grid grid-cols-3 gap-1 mb-4">
            {CATEGORIES.map((c) => (
              <button key={c.id} onClick={() => setActiveCat(c.id)}
                className={`p-2 rounded-lg text-xs ${activeCat === c.id ? 'bg-yellow-500/20 border border-yellow-500/50' : 'bg-white/5 hover:bg-white/10'}`}
                data-testid={`cat-${c.id}`}>
                <div className="text-lg">{c.icon}</div>
                <div>{c.name}</div>
              </button>
            ))}
          </div>
          <div className="text-xs font-bold text-yellow-500 mb-2 uppercase">اسحب للإضافة</div>
          <div className="grid grid-cols-2 gap-2">
            {categoryElements.map((el) => (
              <button key={el.type} onClick={() => addElement(el.type)}
                className="flex flex-col items-center gap-1 p-3 bg-white/5 hover:bg-yellow-500/20 hover:border-yellow-500/50 border border-transparent rounded-lg transition-all"
                data-testid={`add-${el.type}`}>
                <div className="w-10 h-10 flex items-center justify-center" dangerouslySetInnerHTML={{ __html: elementSvg(el.type) }} />
                <div className="text-[11px]">{el.name}</div>
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-2 pt-3 border-t border-white/10">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
              <span>إظهار الشبكة</span>
            </label>
          </div>
        </aside>

        {/* Canvas */}
        <main ref={containerRef} className="flex-1 relative overflow-hidden bg-[#0a0e1c]" onClick={(e) => { if (e.target.tagName === 'CANVAS') setSelectedId(null); }}>
          <Stage
            ref={stageRef}
            width={containerRef.current?.offsetWidth || 800}
            height={containerRef.current?.offsetHeight || 600}
            scaleX={scale}
            scaleY={scale}
            x={stagePos.x}
            y={stagePos.y}
          >
            <Layer>
              <Rect x={0} y={0} width={canvas.width} height={canvas.height} fill={canvas.background_color} stroke="#FFD700" strokeWidth={2 / scale} />
              {gridLines}
              {[...elements].sort((a, b) => (a.z_index || 0) - (b.z_index || 0)).map((el) => (
                <CanvasElement key={el.id} el={el} isSelected={el.id === selectedId} onSelect={() => setSelectedId(el.id)} onChange={updateElement} />
              ))}
            </Layer>
          </Stage>
          {/* Zoom bar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-xl">
            <button onClick={() => setScale((s) => Math.max(0.2, s - 0.1))} className="p-1 hover:bg-white/10 rounded"><ZoomOut className="w-4 h-4" /></button>
            <span className="text-xs w-12 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale((s) => Math.min(3, s + 0.1))} className="p-1 hover:bg-white/10 rounded"><ZoomIn className="w-4 h-4" /></button>
          </div>
          {/* Empty state */}
          {elements.length === 0 && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none opacity-60">
              <div className="text-6xl mb-4">🎨</div>
              <div className="text-lg">اسحب عنصراً من الجانب لبدء التصميم</div>
            </div>
          )}
        </main>

        {/* Right Sidebar - Properties */}
        <aside className="w-72 bg-[#0e1128] border-r border-white/5 p-3 overflow-y-auto" data-testid="properties-panel">
          {selected ? (
            <>
              <div className="text-xs font-bold text-yellow-500 mb-2 uppercase">خصائص العنصر</div>
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8" dangerouslySetInnerHTML={{ __html: elementSvg(selected.type, selected.props) }} />
                  <div className="font-bold">{ELEMENT_LIBRARY.find((e) => e.type === selected.type)?.name || selected.type}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label>الموقع X<input type="number" value={Math.round(selected.x)} onChange={(e) => updateElement({ ...selected, x: +e.target.value })} className="w-full mt-1 px-2 py-1 bg-white/10 rounded" /></label>
                  <label>الموقع Y<input type="number" value={Math.round(selected.y)} onChange={(e) => updateElement({ ...selected, y: +e.target.value })} className="w-full mt-1 px-2 py-1 bg-white/10 rounded" /></label>
                  <label>العرض<input type="number" value={Math.round(selected.width)} onChange={(e) => updateElement({ ...selected, width: +e.target.value })} className="w-full mt-1 px-2 py-1 bg-white/10 rounded" /></label>
                  <label>الارتفاع<input type="number" value={Math.round(selected.height)} onChange={(e) => updateElement({ ...selected, height: +e.target.value })} className="w-full mt-1 px-2 py-1 bg-white/10 rounded" /></label>
                </div>
                <label className="block">الدوران: {Math.round(selected.rotation || 0)}°
                  <input type="range" min="0" max="360" value={selected.rotation || 0} onChange={(e) => updateElement({ ...selected, rotation: +e.target.value })} className="w-full mt-1" />
                </label>
                {(() => {
                  const def = ELEMENT_LIBRARY.find((e) => e.type === selected.type);
                  if (!def) return null;
                  return (
                    <>
                      {def.variants > 1 && (
                        <label className="block">النمط
                          <select value={selected.props?.variant || 0} onChange={(e) => updateElement({ ...selected, props: { ...selected.props, variant: +e.target.value } })} className="w-full mt-1 px-2 py-1 bg-white/10 rounded">
                            {Array.from({ length: def.variants }).map((_, i) => (<option key={i} value={i}>النمط {i + 1}</option>))}
                          </select>
                        </label>
                      )}
                      {def.hasColor && (
                        <label className="block">اللون
                          <input type="color" value={selected.props?.color || '#FFD700'} onChange={(e) => updateElement({ ...selected, props: { ...selected.props, color: e.target.value } })} className="w-full h-9 mt-1 bg-white/10 rounded cursor-pointer" />
                        </label>
                      )}
                      {def.hasText && (
                        <label className="block">النص
                          <input type="text" value={selected.props?.text || ''} onChange={(e) => updateElement({ ...selected, props: { ...selected.props, text: e.target.value } })} className="w-full mt-1 px-2 py-1 bg-white/10 rounded" />
                        </label>
                      )}
                    </>
                  );
                })()}
                <label className="block">تسمية (tooltip)
                  <input type="text" value={selected.props?.label || ''} onChange={(e) => updateElement({ ...selected, props: { ...selected.props, label: e.target.value } })} className="w-full mt-1 px-2 py-1 bg-white/10 rounded" />
                </label>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                  <button onClick={bringToFront} className="px-2 py-2 bg-white/5 hover:bg-white/10 rounded flex items-center justify-center gap-1 text-xs"><ChevronUp className="w-3 h-3" />للأمام</button>
                  <button onClick={sendToBack} className="px-2 py-2 bg-white/5 hover:bg-white/10 rounded flex items-center justify-center gap-1 text-xs"><ChevronDown className="w-3 h-3" />للخلف</button>
                  <button onClick={duplicateElement} className="px-2 py-2 bg-white/5 hover:bg-white/10 rounded flex items-center justify-center gap-1 text-xs"><Copy className="w-3 h-3" />تكرار</button>
                  <button onClick={deleteElement} className="px-2 py-2 bg-red-600/30 hover:bg-red-600/50 rounded flex items-center justify-center gap-1 text-xs"><Trash2 className="w-3 h-3" />حذف</button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="text-xs font-bold text-yellow-500 mb-2 uppercase">الخلفية</div>
              <div className="space-y-3 text-xs">
                <label className="block">لون الخلفية
                  <input type="color" value={canvas.background_color} onChange={(e) => setCanvas({ ...canvas, background_color: e.target.value })} className="w-full h-9 mt-1 bg-white/10 rounded cursor-pointer" />
                </label>
                <label className="block">صورة خلفية (URL اختياري)
                  <input type="text" value={canvas.background_image_url || ''} onChange={(e) => setCanvas({ ...canvas, background_image_url: e.target.value })} className="w-full mt-1 px-2 py-1 bg-white/10 rounded" placeholder="/api/storage/..." />
                </label>
                <label className="block">عرض المسرح
                  <input type="number" value={canvas.width} onChange={(e) => setCanvas({ ...canvas, width: +e.target.value })} className="w-full mt-1 px-2 py-1 bg-white/10 rounded" />
                </label>
                <label className="block">ارتفاع المسرح
                  <input type="number" value={canvas.height} onChange={(e) => setCanvas({ ...canvas, height: +e.target.value })} className="w-full mt-1 px-2 py-1 bg-white/10 rounded" />
                </label>
                <div className="pt-3 border-t border-white/10 text-white/50 text-xs">
                  <div className="font-bold mb-1">الإحصائيات</div>
                  <div>العناصر: {elements.length}</div>
                  <div>تصاميم محفوظة: {savedDesigns.length}</div>
                </div>
                <div className="pt-3 border-t border-white/10 text-white/50 text-xs space-y-1">
                  <div className="font-bold mb-1">اختصارات</div>
                  <div>Delete — حذف العنصر</div>
                  <div>Ctrl+D — تكرار</div>
                  <div>Ctrl+Z / Ctrl+Y — تراجع / إعادة</div>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>

      {/* Library Modal */}
      {showLibrary && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setShowLibrary(false)}>
          <div className="bg-[#0e1128] rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto border border-yellow-500/30" onClick={(e) => e.stopPropagation()} data-testid="library-modal">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-yellow-500">مكتبة تصاميمي ({savedDesigns.length})</h2>
              <button onClick={() => setShowLibrary(false)} className="p-1 hover:bg-white/10 rounded"><Trash2 className="w-5 h-5" /></button>
            </div>
            {savedDesigns.length === 0 ? (
              <div className="text-center py-12 text-white/50">
                <div className="text-5xl mb-3">📂</div>
                <div>لم تحفظ أي تصميم بعد</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {savedDesigns.map((d) => (
                  <div key={d.id} className="bg-white/5 hover:bg-white/10 p-4 rounded-xl border border-white/10" data-testid={`saved-${d.id}`}>
                    <div className="font-bold mb-1">{d.name}</div>
                    <div className="text-xs text-white/50 mb-3">{(d.elements || []).length} عنصر • {new Date(d.updated_at).toLocaleDateString('ar')}</div>
                    <div className="flex gap-2">
                      <button onClick={() => loadDesign(d.id)} className="flex-1 px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/40 rounded text-xs font-bold">فتح</button>
                      <button onClick={() => duplicateDesign(d.id)} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-xs">تكرار</button>
                      <button onClick={() => deleteDesign(d.id)} className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 rounded text-xs">حذف</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewHtml && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6" data-testid="preview-modal">
          <div className="bg-[#0e1128] rounded-2xl w-full h-full max-w-6xl max-h-[90vh] overflow-hidden border border-yellow-500/40 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2"><Eye className="w-5 h-5 text-yellow-500" /><span className="font-bold">معاينة اللعبة — {designName}</span></div>
              <button onClick={() => setPreviewHtml(null)} className="px-3 py-1.5 bg-red-600/30 hover:bg-red-600/50 rounded">إغلاق</button>
            </div>
            <iframe srcDoc={previewHtml} className="flex-1 w-full border-0" sandbox="allow-scripts allow-same-origin" title="preview" />
          </div>
        </div>
      )}
    </div>
  );
}
