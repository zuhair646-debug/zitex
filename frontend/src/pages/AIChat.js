import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Send, Plus, MessageSquare, Image, Video, Globe, 
  Loader2, Download, Trash2, Mic, ChevronLeft, ChevronRight, Sparkles,
  Volume2, VolumeX, Settings, Copy, Check, Play, Pause, X,
  Code, Eye, EyeOff, Gamepad2, RefreshCw, Maximize2, Minimize2,
  Coins, Zap
} from 'lucide-react';

// ============== Code Block Component with Copy ==============
const CodeBlock = memo(({ code, language = 'html', filename }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('تم نسخ الكود!');
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="my-3 rounded-xl overflow-hidden bg-[#1a1a2e] border border-slate-700">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-purple-400" />
          <span className="text-xs text-gray-400 font-mono">{filename || language}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all hover:bg-slate-700"
          style={{ color: copied ? '#10b981' : '#94a3b8' }}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'تم!' : 'نسخ'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm">
        <code className="text-gray-300 font-mono leading-relaxed whitespace-pre-wrap">{code}</code>
      </pre>
    </div>
  );
});

// ============== Message Content Parser ==============
const parseMessageContent = (content) => {
  if (!content) return [];
  
  const parts = [];
  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
    }
    // Add code block
    parts.push({ type: 'code', language: match[1] || 'code', content: match[2].trim() });
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < content.length) {
    parts.push({ type: 'text', content: content.slice(lastIndex) });
  }
  
  return parts.length > 0 ? parts : [{ type: 'text', content }];
};

// ============== Loading Skeleton ==============
const SkeletonPulse = ({ className }) => (
  <div className={`animate-pulse bg-slate-700/50 rounded ${className}`} />
);

const SessionSkeleton = () => (
  <div className="space-y-2 p-2">
    {[1, 2, 3].map(i => (
      <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-slate-700/20">
        <SkeletonPulse className="w-10 h-10 rounded-lg" />
        <div className="flex-1">
          <SkeletonPulse className="h-4 w-3/4 mb-2" />
          <SkeletonPulse className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

// ============== Session Item ==============
const SessionItem = memo(({ session, isActive, onSelect, onDelete, getIcon }) => (
  <div
    className={`group flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
      isActive 
        ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 shadow-lg shadow-purple-500/10' 
        : 'hover:bg-slate-700/50 border border-transparent'
    }`}
    onClick={() => onSelect(session.id)}
    data-testid={`session-${session.id}`}
  >
    <div className={`p-2 rounded-lg transition-colors ${
      session.session_type === 'image' ? 'bg-purple-500/20 text-purple-400' :
      session.session_type === 'video' ? 'bg-orange-500/20 text-orange-400' :
      session.session_type === 'website' ? 'bg-green-500/20 text-green-400' :
      session.session_type === 'game' ? 'bg-cyan-500/20 text-cyan-400' :
      'bg-slate-600 text-gray-400'
    }`}>
      {getIcon(session.session_type)}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-white text-sm truncate font-medium">{session.title}</p>
      <p className="text-xs text-gray-500">{session.message_count || 0} رسالة</p>
    </div>
    <Button
      size="icon"
      variant="ghost"
      onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
      className="opacity-0 group-hover:opacity-100 h-7 w-7 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </Button>
  </div>
));

// ============== Chat Message ==============
const ChatMessage = memo(({ msg, idx, renderAttachment, onPlayAudio, onGenerateTTS, playingAudio, onPreview }) => {
  const parsedContent = parseMessageContent(msg.content);
  const hasCode = parsedContent.some(p => p.type === 'code');
  
  return (
    <div
      className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'} animate-fadeIn`}
      data-testid={`message-${idx}`}
    >
      <div className={`max-w-[90%] md:max-w-[75%] ${
        msg.role === 'user' 
          ? 'bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl rounded-tr-md shadow-lg shadow-blue-500/20' 
          : 'bg-slate-800/90 backdrop-blur border border-slate-700/50 rounded-2xl rounded-tl-md shadow-lg'
      } p-4`}>
        
        {/* Message Content */}
        <div className="text-white">
          {parsedContent.map((part, i) => (
            part.type === 'code' ? (
              <CodeBlock key={i} code={part.content} language={part.language} />
            ) : (
              <p key={i} className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                {part.content}
              </p>
            )
          ))}
        </div>
        
        {/* Attachments */}
        {msg.attachments?.map((attachment, aIdx) => (
          <div key={aIdx}>{renderAttachment(attachment, onPreview)}</div>
        ))}
        
        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-600/30">
          <p className="text-xs text-gray-400">
            {new Date(msg.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
          </p>
          
          <div className="flex items-center gap-2">
            {/* Preview Button for code */}
            {hasCode && msg.role === 'assistant' && (
              <button
                onClick={() => {
                  const codeContent = parsedContent.find(p => p.type === 'code')?.content;
                  if (codeContent) onPreview(codeContent);
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all"
              >
                <Eye className="w-3 h-3" />
                معاينة
              </button>
            )}
            
            {/* TTS Button */}
            {msg.role === 'assistant' && (
              <button
                onClick={() => msg.audio_url ? onPlayAudio(msg.audio_url, msg.id) : onGenerateTTS(msg.content, msg.id)}
                className={`p-1.5 rounded-full transition-all ${
                  playingAudio === msg.id 
                    ? 'bg-purple-500 text-white animate-pulse' 
                    : 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                }`}
              >
                {playingAudio === msg.id ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// ============== Live Preview Panel ==============
const LivePreviewPanel = memo(({ code, isOpen, onClose, onRefresh, isFullscreen, onToggleFullscreen }) => {
  const iframeRef = useRef(null);
  
  useEffect(() => {
    if (code && iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(code);
      doc.close();
    }
  }, [code]);
  
  if (!isOpen) return null;
  
  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'relative'} bg-slate-900 border-r border-slate-700 flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-slate-800/80 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
          </div>
          <span className="text-sm text-gray-400 font-medium mr-3">معاينة مباشرة</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onRefresh} className="p-1.5 rounded hover:bg-slate-700 text-gray-400 hover:text-white transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={onToggleFullscreen} className="p-1.5 rounded hover:bg-slate-700 text-gray-400 hover:text-white transition-colors">
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-slate-700 text-gray-400 hover:text-red-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Preview Content */}
      <div className="flex-1 bg-white">
        {code ? (
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            title="Live Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 bg-slate-900">
            <div className="text-center">
              <Eye className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">لا يوجد محتوى للمعاينة</p>
              <p className="text-sm mt-2 text-gray-600">اطلب من الذكاء الاصطناعي إنشاء موقع أو لعبة</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

// ============== Recording Visualizer ==============
const RecordingVisualizer = memo(({ isRecording, recordingTime }) => {
  if (!isRecording) return null;
  
  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 flex items-center justify-center">
      <div className="bg-slate-800/95 backdrop-blur border border-red-500/30 rounded-2xl px-6 py-3 flex items-center gap-4 shadow-xl animate-fadeIn">
        {/* Waveform Animation */}
        <div className="flex items-center gap-1 h-8">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-red-500 rounded-full animate-wave"
              style={{
                animationDelay: `${i * 0.1}s`,
                height: `${Math.random() * 24 + 8}px`
              }}
            />
          ))}
        </div>
        
        {/* Recording Time */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          <span className="text-white font-mono text-lg">
            {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:
            {(recordingTime % 60).toString().padStart(2, '0')}
          </span>
        </div>
        
        <span className="text-gray-400 text-sm">اضغط للإيقاف</span>
      </div>
    </div>
  );
});

// ============== Credits Display ==============
const CreditsDisplay = memo(({ credits, isOwner }) => (
  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl">
    <Coins className="w-5 h-5 text-amber-400" />
    <div className="flex flex-col">
      <span className="text-xs text-gray-400">رصيدك</span>
      <span className="text-lg font-bold text-amber-400">
        {isOwner ? '∞' : (credits || 0).toLocaleString()}
      </span>
    </div>
    {isOwner && (
      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full mr-2">مالك</span>
    )}
  </div>
));

// ============== Main Component ==============
const AIChat = ({ user }) => {
  // State
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [userCredits, setUserCredits] = useState(user?.credits || 0);
  
  // Preview State
  const [previewCode, setPreviewCode] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFullscreen, setPreviewFullscreen] = useState(false);
  
  // Settings
  const [ttsSettings, setTtsSettings] = useState({
    enabled: false,
    provider: 'openai',
    voice: 'alloy',
    speed: 1.0
  });
  
  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const audioRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const audioChunksRef = useRef([]);
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [inputMessage]);

  // Fetch sessions on mount
  useEffect(() => {
    fetchSessions();
    fetchUserCredits();
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
    };
  }, [mediaRecorder]);

  const fetchUserCredits = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserCredits(data.credits || 0);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  const fetchSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/chat/sessions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  const createSession = useCallback(async (type = 'general') => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/chat/sessions`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ session_type: type })
      });
      const session = await res.json();
      setSessions(prev => [session, ...prev]);
      setCurrentSession(session);
      setMessages([]);
      setPreviewCode('');
      toast.success('تم إنشاء محادثة جديدة');
      if (window.innerWidth < 768) setSidebarOpen(false);
    } catch (error) {
      toast.error('فشل إنشاء المحادثة');
    }
  }, []);

  const loadSession = useCallback(async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/chat/sessions/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const session = await res.json();
      setCurrentSession(session);
      setMessages(session.messages || []);
      setPreviewCode('');
      if (window.innerWidth < 768) setSidebarOpen(false);
    } catch (error) {
      toast.error('فشل تحميل المحادثة');
    }
  }, []);

  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim() || !currentSession || loading) return;

    const userMessage = inputMessage;
    setInputMessage('');
    setLoading(true);
    setIsTyping(true);

    const tempUserMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      attachments: [],
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/chat/sessions/${currentSession.id}/messages`,
        {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: userMessage,
            settings: { tts: ttsSettings }
          })
        }
      );

      const data = await res.json();

      if (res.ok) {
        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== tempUserMsg.id);
          return [...filtered, data.user_message, data.assistant_message];
        });
        
        // Update credits
        if (data.credits_used) {
          setUserCredits(prev => Math.max(0, prev - data.credits_used));
        }
        
        // Auto-play TTS
        if (ttsSettings.enabled && data.assistant_message?.audio_url) {
          playAudio(data.assistant_message.audio_url, data.assistant_message.id);
        }

        // Check for previewable code
        const assistantContent = data.assistant_message?.content || '';
        const codeMatch = assistantContent.match(/```(?:html|javascript|js)?\n?([\s\S]*?)```/);
        if (codeMatch) {
          setPreviewCode(codeMatch[1]);
          setPreviewOpen(true);
        }

        // Update session title
        if (sessions.find(s => s.id === currentSession.id)?.message_count === 0) {
          setSessions(prev => prev.map(s => 
            s.id === currentSession.id 
              ? { ...s, title: userMessage.slice(0, 50), message_count: 2 }
              : s
          ));
        }
      } else {
        toast.error(data.detail || 'فشل إرسال الرسالة');
        setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
      }
    } catch (error) {
      toast.error('حدث خطأ في الاتصال');
      setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
    } finally {
      setLoading(false);
      setIsTyping(false);
      inputRef.current?.focus();
    }
  }, [inputMessage, currentSession, loading, ttsSettings, sessions]);

  const deleteSession = useCallback(async (sessionId) => {
    if (!window.confirm('هل تريد حذف هذه المحادثة؟')) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/chat/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        setMessages([]);
        setPreviewCode('');
      }
      toast.success('تم حذف المحادثة');
    } catch (error) {
      toast.error('فشل حذف المحادثة');
    }
  }, [currentSession]);

  // Voice Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      audioChunksRef.current = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await transcribeAudio(audioBlob);
      };
      
      recorder.start(100);
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      toast.error('فشل الوصول للمايكروفون');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const transcribeAudio = async (audioBlob) => {
    if (!currentSession) {
      toast.error('اختر محادثة أولا');
      return;
    }
    
    setLoading(true);
    toast.info('جاري تحويل الصوت...');
    
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', 'ar');
      
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/stt/transcribe`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.text && data.text.trim()) {
          setInputMessage(data.text);
          toast.success('تم تحويل الصوت!');
          setTimeout(() => {
            setInputMessage(prev => {
              if (prev === data.text) sendMessageWithText(data.text);
              return prev;
            });
          }, 500);
        } else {
          toast.error('لم يتم التعرف على أي كلام');
        }
      } else {
        toast.error('فشل تحويل الصوت');
      }
    } catch (error) {
      toast.error('خطأ في تحويل الصوت');
    } finally {
      setLoading(false);
    }
  };

  const sendMessageWithText = async (text) => {
    if (!text.trim() || !currentSession) return;
    setInputMessage(text);
    setTimeout(() => sendMessage(), 100);
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  const playAudio = (audioUrl, messageId) => {
    if (playingAudio === messageId) {
      audioRef.current?.pause();
      setPlayingAudio(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setPlayingAudio(messageId);
        audioRef.current.onended = () => setPlayingAudio(null);
      }
    }
  };

  const generateTTS = async (text, messageId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/tts/generate`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text.replace(/```[\s\S]*?```/g, '').replace(/[*#_]/g, '').trim(),
          provider: ttsSettings.provider,
          voice: ttsSettings.voice,
          speed: ttsSettings.speed
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        playAudio(data.audio_url, messageId);
        setMessages(prev => prev.map(m => 
          m.id === messageId ? { ...m, audio_url: data.audio_url } : m
        ));
      }
    } catch (error) {
      toast.error('فشل توليد الصوت');
    }
  };

  const downloadAsset = useCallback((url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('جاري التحميل...');
  }, []);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const getSessionIcon = useCallback((type) => {
    switch (type) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'website': return <Globe className="w-4 h-4" />;
      case 'game': return <Gamepad2 className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  }, []);

  const handlePreview = useCallback((code) => {
    setPreviewCode(code);
    setPreviewOpen(true);
  }, []);

  const renderAttachment = useCallback((attachment, onPreview) => {
    switch (attachment.type) {
      case 'image':
        return (
          <div className="mt-3 relative group rounded-xl overflow-hidden">
            <img 
              src={attachment.url} 
              alt={attachment.prompt || 'Generated image'}
              className="max-w-full rounded-xl shadow-lg"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                size="sm"
                onClick={() => downloadAsset(attachment.url, `zitex-image.png`)}
                className="bg-white/20 hover:bg-white/30 backdrop-blur"
              >
                <Download className="w-4 h-4 me-1" />
                تحميل
              </Button>
            </div>
          </div>
        );
      
      case 'video':
        return (
          <div className="mt-3">
            <video 
              src={attachment.url}
              controls
              className="max-w-full rounded-xl shadow-lg"
              preload="metadata"
            />
            <Button
              size="sm"
              onClick={() => downloadAsset(attachment.url, `zitex-video.mp4`)}
              className="mt-2 bg-orange-500 hover:bg-orange-600"
            >
              <Download className="w-4 h-4 me-1" />
              تحميل الفيديو
            </Button>
          </div>
        );
      
      case 'website':
      case 'game':
        return (
          <div className="mt-3 p-4 bg-slate-700/50 rounded-xl border border-slate-600">
            <div className="flex items-center gap-2 mb-3">
              {attachment.type === 'game' ? (
                <Gamepad2 className="w-6 h-6 text-cyan-400" />
              ) : (
                <Globe className="w-6 h-6 text-green-400" />
              )}
              <span className="text-white font-semibold">
                {attachment.type === 'game' ? 'لعبة جاهزة!' : 'موقع جاهز!'}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => onPreview(attachment.code || Object.values(attachment.files || {})[0])}
                className="bg-green-500 hover:bg-green-600"
              >
                <Eye className="w-4 h-4 me-1" />
                معاينة
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const content = attachment.code || JSON.stringify(attachment.files, null, 2);
                  const blob = new Blob([content], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  downloadAsset(url, `zitex-${attachment.type}.html`);
                }}
                className="border-slate-500"
              >
                <Download className="w-4 h-4 me-1" />
                تحميل
              </Button>
            </div>
          </div>
        );
      
      case 'video_pending':
        return (
          <div className="mt-3 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
              <div>
                <span className="text-orange-300 font-semibold">جاري توليد الفيديو...</span>
                <p className="text-sm text-orange-200/70 mt-1">{attachment.message || 'يستغرق 2-5 دقائق'}</p>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  }, [downloadAsset]);

  return (
    <div className="h-screen bg-[#0a0a1a] flex flex-col overflow-hidden" data-testid="ai-chat-page">
      <Navbar user={user} transparent />
      
      {/* Hidden Audio Element */}
      <audio ref={audioRef} className="hidden" />
      
      <div className="flex-1 flex mt-16 overflow-hidden">
        {/* Mobile Menu Button */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden fixed top-20 right-4 z-30 p-2 bg-slate-800 rounded-lg shadow-lg border border-slate-700"
          >
            <MessageSquare className="w-5 h-5 text-white" />
          </button>
        )}
        
        {/* Sidebar Overlay */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 bg-black/60 z-10 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        )}
        
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-72' : 'w-0'} ${sidebarOpen ? 'fixed md:relative inset-y-0 right-0 z-20 mt-16 md:mt-0' : ''} flex-shrink-0 transition-all duration-300 overflow-hidden bg-[#0d0d20] border-l border-slate-800 flex flex-col`}>
          {/* Credits Display */}
          <div className="p-3 border-b border-slate-800">
            <CreditsDisplay credits={userCredits} isOwner={user?.role === 'owner'} />
          </div>
          
          {/* New Chat Buttons */}
          <div className="p-3 border-b border-slate-800">
            <Button
              onClick={() => createSession('general')}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/25 transition-all"
              data-testid="new-chat-btn"
            >
              <Plus className="w-4 h-4 me-2" />
              محادثة جديدة
            </Button>
            
            <div className="grid grid-cols-4 gap-2 mt-3">
              {[
                { type: 'image', icon: Image, color: 'purple', label: 'صورة' },
                { type: 'video', icon: Video, color: 'orange', label: 'فيديو' },
                { type: 'website', icon: Globe, color: 'green', label: 'موقع' },
                { type: 'game', icon: Gamepad2, color: 'cyan', label: 'لعبة' }
              ].map(({ type, icon: Icon, color, label }) => (
                <button
                  key={type}
                  onClick={() => createSession(type)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border border-${color}-500/30 bg-${color}-500/10 hover:bg-${color}-500/20 transition-all`}
                  title={label}
                >
                  <Icon className={`w-4 h-4 text-${color}-400`} />
                  <span className={`text-[10px] text-${color}-400`}>{label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Sessions List */}
          <ScrollArea className="flex-1 p-2">
            {sessionsLoading ? (
              <SessionSkeleton />
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">لا توجد محادثات</p>
                <p className="text-xs mt-1">ابدأ محادثة جديدة!</p>
              </div>
            ) : (
              <div className="space-y-1">
                {sessions.map(session => (
                  <SessionItem
                    key={session.id}
                    session={session}
                    isActive={currentSession?.id === session.id}
                    onSelect={loadSession}
                    onDelete={deleteSession}
                    getIcon={getSessionIcon}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Desktop Sidebar Toggle */}
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden md:flex absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-slate-800 hover:bg-slate-700 rounded-r-none border-l-0"
        >
          {sidebarOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>

        {/* Main Chat Area */}
        <div className={`flex-1 flex ${previewOpen ? 'flex-row' : 'flex-col'} overflow-hidden transition-all`}>
          
          {/* Chat Column */}
          <div className={`${previewOpen ? 'w-1/2 border-l border-slate-800' : 'w-full'} flex flex-col overflow-hidden transition-all`}>
            {!currentSession ? (
              // Welcome Screen
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center max-w-2xl animate-fadeIn">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-500/30">
                    <Sparkles className="w-12 h-12 text-white" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    مرحبا بك في <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">زيتكس</span>
                  </h1>
                  <p className="text-lg text-gray-400 mb-8">
                    مساعدك الإبداعي الذكي - صور، فيديوهات، مواقع، وألعاب
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                    {[
                      { type: 'image', icon: Image, color: 'purple', title: 'صور', desc: 'GPT Image 1' },
                      { type: 'video', icon: Video, color: 'orange', title: 'فيديو', desc: 'Sora 2' },
                      { type: 'website', icon: Globe, color: 'green', title: 'مواقع', desc: 'GPT-5.2' },
                      { type: 'game', icon: Gamepad2, color: 'cyan', title: 'ألعاب', desc: 'Babylon.js' }
                    ].map(({ type, icon: Icon, color, title, desc }) => (
                      <Card
                        key={type}
                        className={`bg-slate-800/50 border-${color}-500/30 cursor-pointer hover:bg-slate-700/50 hover:scale-105 hover:border-${color}-500/50 transition-all duration-300`}
                        onClick={() => createSession(type)}
                      >
                        <CardContent className="p-4 text-center">
                          <Icon className={`w-8 h-8 text-${color}-400 mx-auto mb-2`} />
                          <h3 className="text-white font-semibold text-sm">{title}</h3>
                          <p className="text-xs text-gray-500 mt-1">{desc}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  <Button
                    size="lg"
                    onClick={() => createSession('general')}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/30"
                  >
                    <Zap className="w-5 h-5 me-2" />
                    ابدأ الآن
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="max-w-3xl mx-auto space-y-4">
                    {messages.length === 0 && (
                      <div className="text-center py-16 text-gray-500">
                        <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p className="text-lg">ابدأ المحادثة!</p>
                        <p className="text-sm mt-2 text-gray-600">
                          {currentSession.session_type === 'image' && 'قل لي ما الصورة التي تريدها...'}
                          {currentSession.session_type === 'video' && 'أخبرني عن الفيديو الذي تريد إنشاءه...'}
                          {currentSession.session_type === 'website' && 'صف لي الموقع الذي تريد بناءه...'}
                          {currentSession.session_type === 'game' && 'ما اللعبة التي تريد إنشاءها؟'}
                          {currentSession.session_type === 'general' && 'كيف يمكنني مساعدتك اليوم؟'}
                        </p>
                      </div>
                    )}
                    
                    {messages.map((msg, idx) => (
                      <ChatMessage
                        key={msg.id || idx}
                        msg={msg}
                        idx={idx}
                        renderAttachment={renderAttachment}
                        onPlayAudio={playAudio}
                        onGenerateTTS={generateTTS}
                        playingAudio={playingAudio}
                        onPreview={handlePreview}
                      />
                    ))}
                    
                    {isTyping && (
                      <div className="flex justify-end">
                        <div className="bg-slate-800 rounded-2xl rounded-tl-md p-4 border border-slate-700">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              {[0, 1, 2].map(i => (
                                <span
                                  key={i}
                                  className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                                  style={{ animationDelay: `${i * 150}ms` }}
                                />
                              ))}
                            </div>
                            <span className="text-gray-400 text-sm">جاري التفكير...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="border-t border-slate-800 p-3 bg-[#0d0d20]/80 backdrop-blur relative">
                  <RecordingVisualizer isRecording={isRecording} recordingTime={recordingTime} />
                  
                  <div className="max-w-3xl mx-auto">
                    <div className="flex items-end gap-2 bg-slate-800/50 rounded-2xl border border-slate-700 p-2 focus-within:border-purple-500/50 transition-colors">
                      {/* Text Input */}
                      <textarea
                        ref={textareaRef}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={
                          currentSession?.session_type === 'image' ? 'صف الصورة التي تريدها...' :
                          currentSession?.session_type === 'video' ? 'صف المشهد الذي تريد إنشاءه...' :
                          currentSession?.session_type === 'website' ? 'صف الموقع الذي تريد بناءه...' :
                          currentSession?.session_type === 'game' ? 'صف اللعبة التي تريدها...' :
                          'اكتب رسالتك هنا...'
                        }
                        className="flex-1 bg-transparent text-white placeholder:text-gray-500 text-base resize-none focus:outline-none min-h-[44px] max-h-[150px] py-2 px-3"
                        disabled={loading}
                        rows={1}
                        data-testid="chat-input"
                      />
                      
                      {/* Mic Button */}
                      <button
                        onClick={toggleRecording}
                        disabled={loading}
                        className={`flex-shrink-0 p-3 rounded-xl transition-all ${
                          isRecording 
                            ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50' 
                            : 'bg-slate-700 text-gray-400 hover:text-white hover:bg-slate-600'
                        }`}
                        title={isRecording ? 'إيقاف التسجيل' : 'التسجيل الصوتي'}
                      >
                        <Mic className="w-5 h-5" />
                      </button>
                      
                      {/* Send Button */}
                      <button
                        onClick={sendMessage}
                        disabled={loading || !inputMessage.trim() || isRecording}
                        className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/30"
                        data-testid="send-btn"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      </button>
                    </div>
                    
                    {/* Bottom Tools */}
                    <div className="flex items-center justify-between mt-2 px-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setTtsSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-all ${
                            ttsSettings.enabled 
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                              : 'text-gray-500 hover:text-gray-300'
                          }`}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          صوت
                        </button>
                        
                        {previewCode && (
                          <button
                            onClick={() => setPreviewOpen(!previewOpen)}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-all ${
                              previewOpen 
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                : 'text-gray-500 hover:text-gray-300'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            معاينة
                          </button>
                        )}
                      </div>
                      
                      <span className="text-xs text-gray-600">
                        Shift+Enter للسطر الجديد
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Preview Panel */}
          {previewOpen && (
            <div className={`${previewFullscreen ? 'fixed inset-0 z-50' : 'w-1/2'} transition-all`}>
              <LivePreviewPanel
                code={previewCode}
                isOpen={previewOpen}
                onClose={() => setPreviewOpen(false)}
                onRefresh={() => {
                  const iframe = document.querySelector('iframe');
                  if (iframe) iframe.src = iframe.src;
                }}
                isFullscreen={previewFullscreen}
                onToggleFullscreen={() => setPreviewFullscreen(!previewFullscreen)}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        
        @keyframes wave {
          0%, 100% { height: 8px; }
          50% { height: 24px; }
        }
        .animate-wave { animation: wave 0.6s ease-in-out infinite; }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </div>
  );
};

export default AIChat;
