/**
 * Voice Stage — Voice-first immersive AI companion overlay.
 *
 * NEW (v2):
 *   - Lip-sync: rapidly swap idle ↔ talk image during audio playback
 *   - Dual banter: secondary character chimes in with a short reaction
 *   - Anonymous trial: 5 free voice convos for unauthenticated visitors
 *   - Companion mode: when prop `mode='companion'`, uses /api/companion/voice-chat instead
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, X, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

// Detect Speech Recognition availability
const SR = (typeof window !== 'undefined') && (window.SpeechRecognition || window.webkitSpeechRecognition);

// Get or create anon ID for unauthenticated trial tracking
function getAnonId() {
  if (typeof window === 'undefined') return null;
  let id = localStorage.getItem('zitex_anon_id');
  if (!id) {
    id = 'anon_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    localStorage.setItem('zitex_anon_id', id);
  }
  return id;
}

export default function VoiceStage({ open, onClose, initialCharacter = 'zara', mode = 'main', onSignupNeeded }) {
  const [primary, setPrimary] = useState(initialCharacter);
  const [zaraState, setZaraState] = useState('hidden');
  const [laylaState, setLaylaState] = useState('hidden');
  const [stage, setStage] = useState('intro');
  const [listening, setListening] = useState(false);
  const [muted, setMuted] = useState(false);
  const [transcriptVisible, setTranscriptVisible] = useState(false);
  const [lastUserSaid, setLastUserSaid] = useState('');
  const [lastAIReply, setLastAIReply] = useState('');
  const [lastBanter, setLastBanter] = useState(null);
  const [subtitle, setSubtitle] = useState('');
  const [lipSyncTick, setLipSyncTick] = useState(0); // toggles 0/1 during talk for lip-sync
  const [anonUsage, setAnonUsage] = useState(null);
  const recRef = useRef(null);
  const audioRef = useRef(null);
  const banterAudioRef = useRef(null);
  const sessionRef = useRef(null);
  const lipSyncIntervalRef = useRef(null);

  const isAuthed = !!(typeof window !== 'undefined' && localStorage.getItem('token'));
  const anonId = !isAuthed && mode === 'main' ? getAnonId() : null;

  // ===== Entrance animation =====
  useEffect(() => {
    if (!open) {
      setZaraState('hidden');
      setLaylaState('hidden');
      setStage('intro');
      return;
    }
    const t1 = setTimeout(() => setZaraState('entering'), 100);
    const t2 = setTimeout(() => setLaylaState('entering'), 500);
    const t3 = setTimeout(() => { setZaraState('idle'); setLaylaState('idle'); }, 2500);
    const t4 = setTimeout(() => { setStage('idle'); setSubtitle('اضغطي المايك وكلّمني 💫'); }, 2800);
    sessionRef.current = `stage-${Date.now()}`;
    // Fetch anon usage
    if (anonId) {
      fetch(`${API}/api/avatar/anon-usage?anon_id=${anonId}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => d && setAnonUsage(d))
        .catch(() => {});
    }
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ===== Cleanup =====
  useEffect(() => {
    return () => {
      if (recRef.current) { try { recRef.current.stop(); } catch (_) {} }
      if (audioRef.current) { try { audioRef.current.pause(); } catch (_) {} }
      if (banterAudioRef.current) { try { banterAudioRef.current.pause(); } catch (_) {} }
      if (lipSyncIntervalRef.current) { clearInterval(lipSyncIntervalRef.current); }
    };
  }, []);

  // ===== Character state mapping =====
  useEffect(() => {
    if (stage === 'idle') {
      setZaraState('idle'); setLaylaState('idle');
    } else if (stage === 'listening') {
      if (primary === 'zara') { setZaraState('listening'); setLaylaState('idle'); }
      else { setLaylaState('listening'); setZaraState('idle'); }
    } else if (stage === 'speaking') {
      if (primary === 'zara') { setZaraState('talking'); setLaylaState('listening'); }
      else { setLaylaState('talking'); setZaraState('listening'); }
    } else if (stage === 'banter') {
      // Secondary speaks, primary listens with attention
      if (primary === 'zara') { setLaylaState('talking'); setZaraState('listening'); }
      else { setZaraState('talking'); setLaylaState('listening'); }
    } else if (stage === 'thinking') {
      setZaraState('idle'); setLaylaState('idle');
    }
  }, [stage, primary]);

  // ===== Lip-sync ticker =====
  const startLipSync = useCallback(() => {
    if (lipSyncIntervalRef.current) clearInterval(lipSyncIntervalRef.current);
    lipSyncIntervalRef.current = setInterval(() => {
      setLipSyncTick(t => (t + 1) % 3); // 0,1,2 — visual frame index
    }, 140); // ~7Hz mouth swap
  }, []);

  const stopLipSync = useCallback(() => {
    if (lipSyncIntervalRef.current) {
      clearInterval(lipSyncIntervalRef.current);
      lipSyncIntervalRef.current = null;
    }
    setLipSyncTick(0);
  }, []);

  // ===== Listening =====
  const startListening = useCallback(() => {
    if (!SR) {
      toast.error('المتصفح ما يدعم التعرف الصوتي. جرّب Chrome/Edge/Safari.');
      return;
    }
    if (listening) return;
    if (anonUsage && anonUsage.blocked) {
      toast.error('انتهت محادثاتك المجانية — سجّل لتكمل ✨');
      if (onSignupNeeded) onSignupNeeded();
      return;
    }
    try {
      const rec = new SR();
      rec.lang = 'ar-SA';
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        setListening(true);
        setStage('listening');
        setSubtitle('🎤 أنا أسمعك...');
      };
      rec.onresult = (e) => {
        const txt = Array.from(e.results).map(r => r[0].transcript).join(' ');
        setLastUserSaid(txt);
        if (e.results[e.results.length - 1].isFinal) {
          handleUserSpeech(txt.trim());
        }
      };
      rec.onerror = (e) => {
        setListening(false);
        setStage('idle');
        if (e.error === 'no-speech') {
          setSubtitle('ما سمعت شي... جرّب مرة ثانية');
          setTimeout(() => setSubtitle('اضغطي المايك وكلّمني 💫'), 2000);
        } else if (e.error === 'not-allowed') {
          toast.error('محتاجة إذن الميكروفون');
        }
      };
      rec.onend = () => setListening(false);
      rec.start();
      recRef.current = rec;
    } catch (e) {
      toast.error('فشل تشغيل الميكروفون');
      setListening(false);
    }
  }, [listening, anonUsage, onSignupNeeded]);

  const stopListening = useCallback(() => {
    if (recRef.current) { try { recRef.current.stop(); } catch (_) {} }
    setListening(false);
    if (stage === 'listening') setStage('idle');
  }, [stage]);

  // ===== Send to backend + play audio + banter =====
  const handleUserSpeech = async (text) => {
    if (!text) return;
    setStage('thinking');
    setSubtitle('💭 جاري التفكير...');
    try {
      const endpoint = mode === 'companion' ? '/api/companion/voice-chat' : '/api/avatar/chat';
      const headers = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('token');
      if (token) headers.Authorization = `Bearer ${token}`;

      const body = mode === 'companion'
        ? { message: text, want_voice: true }
        : {
            message: text,
            session_id: sessionRef.current,
            want_voice: true,
            primary,
            anon_id: anonId,
            dual_banter: !muted,
          };

      const r = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || 'فشل');

      setLastAIReply(d.reply);
      setSubtitle(d.reply);
      setLastBanter(d.banter || null);

      if (d.anon_usage) setAnonUsage(d.anon_usage);

      setStage('speaking');

      // Play primary audio + lip-sync
      if (d.audio_url && !muted) {
        const audio = new Audio(d.audio_url);
        audio.onplay = () => startLipSync();
        audio.onended = async () => {
          stopLipSync();
          // Banter follow-up
          if (d.banter && d.banter.audio_url && !muted) {
            await new Promise(r => setTimeout(r, 300));
            setStage('banter');
            setSubtitle(`${d.banter.from_char === 'zara' ? '💛 زارا' : '🖤 ليلى'}: ${d.banter.text}`);
            const b = new Audio(d.banter.audio_url);
            b.onplay = () => startLipSync();
            b.onended = () => {
              stopLipSync();
              setStage('idle');
              setSubtitle(primary === 'zara' ? 'كملي... أنا معاك ✨' : 'كملي... أنا أسمعك 🖤');
            };
            b.onerror = () => { stopLipSync(); setStage('idle'); };
            banterAudioRef.current = b;
            b.play().catch(() => { stopLipSync(); setStage('idle'); });
          } else {
            setStage('idle');
            setSubtitle(primary === 'zara' ? 'كملي... أنا معاك ✨' : 'كملي... أنا أسمعك 🖤');
          }
        };
        audio.onerror = () => { stopLipSync(); setStage('idle'); };
        audioRef.current = audio;
        audio.play().catch(() => { stopLipSync(); setStage('idle'); });
      } else {
        setTimeout(() => setStage('idle'), 4000);
      }
    } catch (e) {
      toast.error(e.message);
      setStage('idle');
      setSubtitle('حصل خطأ 😔 جرّب تاني');
      if (e.message && e.message.includes('انتهت المحادثات')) {
        if (onSignupNeeded) onSignupNeeded();
      }
    }
  };

  const toggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    if (nextMuted) {
      if (audioRef.current) try { audioRef.current.pause(); } catch (_) {}
      if (banterAudioRef.current) try { banterAudioRef.current.pause(); } catch (_) {}
    }
  };

  const switchPrimary = () => {
    setPrimary(p => p === 'zara' ? 'layla' : 'zara');
    setSubtitle('تحوّلت لرفيقتك الثانية ✨');
    setTimeout(() => setSubtitle('اضغطي المايك وكلّمني 💫'), 2000);
  };

  if (!open) return null;

  // Helper: pick image based on state + lip-sync tick
  const pickImage = (char, state) => {
    const base = char === 'zara' ? 'zara' : 'layla';
    if (state === 'talking') {
      // Lip-sync: alternate idle/talk every tick
      return lipSyncTick % 2 === 0 ? `/avatars/${base}_idle.png` : `/avatars/${base}_talk.png`;
    }
    if (state === 'listening' || state === 'idle' || state === 'entering') {
      return `/avatars/${base}_idle.png`;
    }
    return `/avatars/${base}_idle.png`;
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden" data-testid="voice-stage">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a0a2e] via-[#0a0a12] to-[#2a0a1e]">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 bg-pink-500/10 rounded-full blur-[150px]" />
        </div>
        <div className="absolute inset-0 opacity-60" style={{
          backgroundImage: 'radial-gradient(1px 1px at 20% 30%, white 50%, transparent), radial-gradient(1px 1px at 50% 70%, white 50%, transparent), radial-gradient(1.5px 1.5px at 80% 20%, white 50%, transparent), radial-gradient(1px 1px at 30% 90%, white 50%, transparent), radial-gradient(1px 1px at 70% 50%, white 50%, transparent)',
          backgroundSize: '300px 300px',
        }} />
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

      <button onClick={onClose} className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white hover:bg-white/20 z-50 flex items-center justify-center" data-testid="vs-close">
        <X className="w-5 h-5" />
      </button>

      <div className="absolute top-4 left-4 flex gap-2 z-50">
        <button onClick={toggleMute} className="w-11 h-11 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white hover:bg-white/20 flex items-center justify-center" data-testid="vs-mute">
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
        {mode !== 'companion' && (
          <button onClick={switchPrimary} className="h-11 px-4 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white hover:bg-white/20 text-xs font-black flex items-center" data-testid="vs-swap">
            بدّلي ({primary === 'zara' ? 'إلى ليلى 🖤' : 'إلى زارا 💛'})
          </button>
        )}
      </div>

      {/* Anon trial badge */}
      {anonId && anonUsage && mode === 'main' && (
        <div className={`absolute top-20 left-1/2 -translate-x-1/2 z-50 px-3 py-1 rounded-full text-[11px] font-black backdrop-blur-md ${
          anonUsage.blocked
            ? 'bg-red-500/30 border border-red-400/50 text-red-200'
            : anonUsage.remaining <= 1
              ? 'bg-amber-500/30 border border-amber-400/50 text-amber-200'
              : 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-200'
        }`} data-testid="vs-anon-counter">
          <Sparkles className="w-3 h-3 inline me-1" />
          {anonUsage.blocked
            ? 'انتهت المحادثات المجانية — سجّل لتكمل'
            : `محادثات مجانية متبقية: ${anonUsage.remaining}/${anonUsage.limit}`
          }
        </div>
      )}

      {/* Characters */}
      <Character
        name="zara"
        image={pickImage('zara', zaraState)}
        fallback="/avatars/f1_zara.png"
        state={zaraState}
        side="left"
        isPrimary={primary === 'zara'}
        dataTestId="vs-zara"
      />
      <Character
        name="layla"
        image={pickImage('layla', laylaState)}
        fallback="/avatars/f2_layla.png"
        state={laylaState}
        side="right"
        isPrimary={primary === 'layla'}
        dataTestId="vs-layla"
      />

      {/* Subtitle */}
      <div className="absolute bottom-40 left-1/2 -translate-x-1/2 px-6 py-3 max-w-[90%] bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 text-white text-center min-h-[56px] flex items-center justify-center transition-all" data-testid="vs-subtitle">
        <div className="text-sm sm:text-base font-bold">{subtitle || '...'}</div>
      </div>

      {/* Mic button */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-40">
        <button
          onClick={listening ? stopListening : startListening}
          disabled={stage === 'thinking' || stage === 'speaking' || stage === 'banter'}
          className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all disabled:opacity-40 ${
            listening
              ? 'bg-red-500 shadow-[0_0_60px_rgba(239,68,68,0.8)] scale-110'
              : stage === 'thinking'
                ? 'bg-purple-500'
                : (stage === 'speaking' || stage === 'banter')
                  ? 'bg-emerald-500 shadow-[0_0_60px_rgba(16,185,129,0.8)]'
                  : 'bg-gradient-to-br from-amber-500 to-yellow-500 hover:scale-110 shadow-[0_0_40px_rgba(245,158,11,0.6)]'
          }`}
          data-testid="vs-mic-btn"
        >
          {listening && <span className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping" />}
          {stage === 'thinking'
            ? <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
            : listening
              ? <MicOff className="w-10 h-10 text-white" />
              : <Mic className="w-10 h-10 text-black" />
          }
        </button>
        <div className="text-[11px] text-white/60 font-bold">
          {listening ? 'تكلّم الآن...' : stage === 'thinking' ? 'جاري التفكير' : stage === 'speaking' ? 'تتكلم معاك...' : stage === 'banter' ? 'تتدخل برأيها...' : 'اضغطي للتحدّث'}
        </div>
      </div>

      <button onClick={() => setTranscriptVisible(!transcriptVisible)}
        className="absolute bottom-4 right-4 text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white/80 z-40"
        data-testid="vs-transcript-toggle">
        {transcriptVisible ? 'إخفاء النص' : 'عرض النص'}
      </button>

      {transcriptVisible && (lastUserSaid || lastAIReply) && (
        <div className="absolute top-20 left-4 right-4 max-w-2xl mx-auto bg-black/70 backdrop-blur-xl rounded-2xl border border-white/10 p-3 text-white text-sm z-40 space-y-2" data-testid="vs-transcript">
          {lastUserSaid && <div><span className="text-amber-300 font-black">أنت:</span> {lastUserSaid}</div>}
          {lastAIReply && <div><span className="text-purple-300 font-black">{primary === 'zara' ? 'زارا' : 'ليلى'}:</span> {lastAIReply}</div>}
          {lastBanter && <div><span className="text-pink-300 font-black">{lastBanter.from_char === 'zara' ? 'زارا' : 'ليلى'}:</span> {lastBanter.text}</div>}
        </div>
      )}
    </div>
  );
}

// ================== CHARACTER ==================
function Character({ image, fallback, state, side, isPrimary, dataTestId }) {
  const [imgSrc, setImgSrc] = useState(image);

  useEffect(() => { setImgSrc(image); }, [image]);

  const offScreenX = side === 'left' ? '-110%' : '110%';
  const onScreenX = side === 'left' ? '-15%' : '15%';

  const stateConfig = {
    hidden:    { x: offScreenX, y: '20%',  scale: 0.8, opacity: 0,   animClass: '' },
    entering:  { x: onScreenX,  y: '0%',   scale: 1,   opacity: 1,   animClass: 'char-entering' },
    idle:      { x: onScreenX,  y: '0%',   scale: isPrimary ? 1.05 : 0.95, opacity: isPrimary ? 1 : 0.75, animClass: 'char-bob' },
    listening: { x: onScreenX,  y: '-2%',  scale: isPrimary ? 1.1  : 0.95, opacity: 1,   animClass: 'char-lean' },
    talking:   { x: onScreenX,  y: '0%',   scale: 1.1, opacity: 1,   animClass: 'char-talk' },
  };
  const cfg = stateConfig[state] || stateConfig.idle;

  return (
    <div
      data-testid={dataTestId}
      className={`absolute bottom-0 ${side === 'left' ? 'left-0' : 'right-0'} w-1/2 sm:w-2/5 max-w-[500px] h-[85%] pointer-events-none ${cfg.animClass}`}
      style={{
        transform: `translate(${cfg.x}, ${cfg.y}) scale(${cfg.scale})`,
        opacity: cfg.opacity,
        transition: 'transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.8s ease',
        transformOrigin: side === 'left' ? 'bottom left' : 'bottom right',
      }}
    >
      <img
        src={imgSrc}
        onError={() => { if (fallback && imgSrc !== fallback) setImgSrc(fallback); }}
        alt=""
        className="w-full h-full object-contain object-bottom avatar-chroma"
        draggable={false}
        style={{
          filter: isPrimary
            ? 'drop-shadow(0 0 40px rgba(245,158,11,0.5)) drop-shadow(0 10px 30px rgba(0,0,0,0.5))'
            : 'drop-shadow(0 10px 30px rgba(0,0,0,0.4))',
        }}
      />
      {isPrimary && state !== 'hidden' && state !== 'entering' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-amber-500/90 text-black text-[10px] font-black px-2 py-0.5 rounded-full">
          {state === 'listening' && <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" />}
          {state === 'talking' && '🗣'}
          {state === 'listening' && 'تسمع'}
          {state === 'talking' && 'تتكلم'}
          {state === 'idle' && '💫'}
        </div>
      )}
    </div>
  );
}
