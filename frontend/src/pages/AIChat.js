import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Send, Plus, MessageSquare, Image, Video, Globe, 
  Loader2, Download, Trash2, Settings, Mic, Play, 
  Pause, ChevronLeft, ChevronRight, Sparkles
} from 'lucide-react';

const AIChat = ({ user }) => {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [generationSettings, setGenerationSettings] = useState({
    duration: 4,
    size: '1280x720',
    voice_id: '21m00Tcm4TlvDq8ikWAM'
  });
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/chat/sessions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSessions(data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setSessionsLoading(false);
    }
  };

  const createSession = async (type = 'general') => {
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
      toast.success('تم إنشاء محادثة جديدة');
    } catch (error) {
      toast.error('فشل إنشاء المحادثة');
    }
  };

  const loadSession = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/chat/sessions/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const session = await res.json();
      setCurrentSession(session);
      setMessages(session.messages || []);
    } catch (error) {
      toast.error('فشل تحميل المحادثة');
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentSession) return;
    if (loading) return;

    const userMessage = inputMessage;
    setInputMessage('');
    setLoading(true);

    // إضافة رسالة المستخدم مؤقتاً
    const tempUserMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      message_type: 'text',
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
            settings: generationSettings
          })
        }
      );

      const data = await res.json();

      if (res.ok) {
        // تحديث الرسائل
        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== tempUserMsg.id);
          return [...filtered, data.user_message, data.assistant_message];
        });

        // تحديث عنوان الجلسة في القائمة
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
      inputRef.current?.focus();
    }
  };

  const deleteSession = async (sessionId) => {
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
      }
      toast.success('تم حذف المحادثة');
    } catch (error) {
      toast.error('فشل حذف المحادثة');
    }
  };

  const downloadAsset = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('جاري التحميل...');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getSessionIcon = (type) => {
    switch (type) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'website': return <Globe className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const renderAttachment = (attachment) => {
    switch (attachment.type) {
      case 'image':
        return (
          <div className="mt-3 relative group">
            <img 
              src={attachment.url} 
              alt={attachment.prompt || 'Generated image'}
              className="max-w-md rounded-xl shadow-lg"
            />
            <Button
              size="sm"
              onClick={() => downloadAsset(attachment.url, `zitex-image-${attachment.id}.png`)}
              className="absolute bottom-2 left-2 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Download className="w-4 h-4 me-1" />
              تحميل
            </Button>
          </div>
        );
      
      case 'video':
        return (
          <div className="mt-3 relative group">
            <video 
              src={attachment.url}
              controls
              className="max-w-lg rounded-xl shadow-lg"
            />
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
              <span>المدة: {attachment.duration} ثانية</span>
              <span>•</span>
              <span>الدقة: {attachment.size}</span>
            </div>
            <Button
              size="sm"
              onClick={() => downloadAsset(attachment.url, `zitex-video-${attachment.id}.mp4`)}
              className="mt-2 bg-orange-500 hover:bg-orange-600"
            >
              <Download className="w-4 h-4 me-1" />
              تحميل الفيديو
            </Button>
          </div>
        );
      
      case 'audio':
        return (
          <div className="mt-3 p-4 bg-slate-700/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Mic className="w-8 h-8 text-blue-400" />
              <div className="flex-1">
                <audio 
                  ref={audioRef}
                  src={attachment.url}
                  controls
                  className="w-full"
                />
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => downloadAsset(attachment.url, `zitex-audio-${attachment.id}.mp3`)}
              className="mt-2 bg-blue-500 hover:bg-blue-600"
            >
              <Download className="w-4 h-4 me-1" />
              تحميل الصوت
            </Button>
          </div>
        );
      
      case 'website':
        return (
          <div className="mt-3 p-4 bg-slate-700/50 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-6 h-6 text-green-400" />
              <span className="text-white font-semibold">موقع جاهز للتحميل</span>
            </div>
            <div className="space-y-2 text-sm text-gray-400">
              {Object.keys(attachment.files || {}).map(filename => (
                <div key={filename} className="flex items-center gap-2">
                  <span className="text-green-400">📄</span>
                  <span>{filename}</span>
                </div>
              ))}
            </div>
            <Button
              size="sm"
              onClick={() => {
                const content = JSON.stringify(attachment.files, null, 2);
                const blob = new Blob([content], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                downloadAsset(url, `zitex-website-${attachment.id}.json`);
              }}
              className="mt-3 bg-green-500 hover:bg-green-600"
            >
              <Download className="w-4 h-4 me-1" />
              تحميل الكود
            </Button>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col" data-testid="ai-chat-page">
      <Navbar user={user} transparent />
      
      <div className="flex-1 flex pt-16">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-slate-800 border-l border-slate-700 flex flex-col`}>
          <div className="p-4 border-b border-slate-700">
            <Button
              onClick={() => createSession('general')}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              data-testid="new-chat-btn"
            >
              <Plus className="w-4 h-4 me-2" />
              محادثة جديدة
            </Button>
            
            {/* Quick create buttons */}
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => createSession('image')}
                className="flex-1 border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
              >
                <Image className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => createSession('video')}
                className="flex-1 border-orange-500/50 text-orange-400 hover:bg-orange-500/20"
              >
                <Video className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => createSession('website')}
                className="flex-1 border-green-500/50 text-green-400 hover:bg-green-500/20"
              >
                <Globe className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <ScrollArea className="flex-1 p-2">
            {sessionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>لا توجد محادثات</p>
                <p className="text-sm mt-1">ابدأ محادثة جديدة!</p>
              </div>
            ) : (
              <div className="space-y-1">
                {sessions.map(session => (
                  <div
                    key={session.id}
                    className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                      currentSession?.id === session.id 
                        ? 'bg-slate-700' 
                        : 'hover:bg-slate-700/50'
                    }`}
                    onClick={() => loadSession(session.id)}
                    data-testid={`session-${session.id}`}
                  >
                    <div className={`p-2 rounded-lg ${
                      session.session_type === 'image' ? 'bg-purple-500/20 text-purple-400' :
                      session.session_type === 'video' ? 'bg-orange-500/20 text-orange-400' :
                      session.session_type === 'website' ? 'bg-green-500/20 text-green-400' :
                      'bg-slate-600 text-gray-400'
                    }`}>
                      {getSessionIcon(session.session_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{session.title}</p>
                      <p className="text-xs text-gray-500">
                        {session.message_count || 0} رسالة
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 h-8 w-8 text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Toggle sidebar */}
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-slate-700 rounded-r-none"
        >
          {sidebarOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {!currentSession ? (
            // Welcome screen
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-2xl">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-white mb-4">مرحباً بك في زيتكس</h1>
                <p className="text-xl text-gray-400 mb-8">
                  مساعدك الإبداعي الذكي لتوليد الصور والفيديوهات وبناء المواقع
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <Card 
                    className="bg-slate-800 border-purple-500/30 cursor-pointer hover:bg-slate-700 transition-colors"
                    onClick={() => createSession('image')}
                  >
                    <CardContent className="p-6 text-center">
                      <Image className="w-10 h-10 text-purple-400 mx-auto mb-3" />
                      <h3 className="text-white font-semibold mb-1">توليد صور</h3>
                      <p className="text-sm text-gray-400">صور احترافية بالذكاء الاصطناعي</p>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    className="bg-slate-800 border-orange-500/30 cursor-pointer hover:bg-slate-700 transition-colors"
                    onClick={() => createSession('video')}
                  >
                    <CardContent className="p-6 text-center">
                      <Video className="w-10 h-10 text-orange-400 mx-auto mb-3" />
                      <h3 className="text-white font-semibold mb-1">فيديوهات سينمائية</h3>
                      <p className="text-sm text-gray-400">مع Sora 2 وتعليق صوتي</p>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    className="bg-slate-800 border-green-500/30 cursor-pointer hover:bg-slate-700 transition-colors"
                    onClick={() => createSession('website')}
                  >
                    <CardContent className="p-6 text-center">
                      <Globe className="w-10 h-10 text-green-400 mx-auto mb-3" />
                      <h3 className="text-white font-semibold mb-1">بناء مواقع</h3>
                      <p className="text-sm text-gray-400">مواقع احترافية قابلة للتحميل</p>
                    </CardContent>
                  </Card>
                </div>
                
                <Button
                  size="lg"
                  onClick={() => createSession('general')}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Plus className="w-5 h-5 me-2" />
                  ابدأ محادثة جديدة
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="max-w-4xl mx-auto space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">ابدأ المحادثة!</p>
                      <p className="text-sm mt-2">
                        {currentSession.session_type === 'image' && 'قل لي ما الصورة التي تريدها...'}
                        {currentSession.session_type === 'video' && 'أخبرني عن الفيديو الذي تريد إنشاءه...'}
                        {currentSession.session_type === 'website' && 'صف لي الموقع الذي تريد بناءه...'}
                        {currentSession.session_type === 'general' && 'كيف يمكنني مساعدتك اليوم؟'}
                      </p>
                    </div>
                  )}
                  
                  {messages.map((msg, idx) => (
                    <div
                      key={msg.id || idx}
                      className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                      data-testid={`message-${idx}`}
                    >
                      <div className={`max-w-[80%] ${
                        msg.role === 'user' 
                          ? 'bg-blue-600 rounded-2xl rounded-tr-md' 
                          : 'bg-slate-700 rounded-2xl rounded-tl-md'
                      } p-4`}>
                        <p className="text-white whitespace-pre-wrap">{msg.content}</p>
                        
                        {/* Attachments */}
                        {msg.attachments?.map((attachment, aIdx) => (
                          <div key={aIdx}>
                            {renderAttachment(attachment)}
                          </div>
                        ))}
                        
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(msg.created_at).toLocaleTimeString('ar-SA')}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {loading && (
                    <div className="flex justify-end">
                      <div className="bg-slate-700 rounded-2xl rounded-tl-md p-4">
                        <div className="flex items-center gap-2 text-gray-400">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>جاري التفكير...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="border-t border-slate-700 p-4">
                <div className="max-w-4xl mx-auto">
                  {/* Settings bar */}
                  {currentSession?.session_type === 'video' && (
                    <div className="flex items-center gap-4 mb-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">المدة:</span>
                        <select
                          value={generationSettings.duration}
                          onChange={(e) => setGenerationSettings({...generationSettings, duration: parseInt(e.target.value)})}
                          className="bg-slate-700 border-slate-600 text-white rounded px-2 py-1"
                        >
                          <option value={4}>4 ثواني</option>
                          <option value={8}>8 ثواني</option>
                          <option value={12}>12 ثانية</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">الدقة:</span>
                        <select
                          value={generationSettings.size}
                          onChange={(e) => setGenerationSettings({...generationSettings, size: e.target.value})}
                          className="bg-slate-700 border-slate-600 text-white rounded px-2 py-1"
                        >
                          <option value="1280x720">HD (16:9)</option>
                          <option value="1792x1024">عريض</option>
                          <option value="1024x1792">عمودي</option>
                          <option value="1024x1024">مربع</option>
                        </select>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <Input
                      ref={inputRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={
                        currentSession?.session_type === 'image' ? 'صف الصورة التي تريدها...' :
                        currentSession?.session_type === 'video' ? 'صف المشهد الذي تريد إنشاءه...' :
                        currentSession?.session_type === 'website' ? 'صف الموقع الذي تريد بناءه...' :
                        'اكتب رسالتك هنا...'
                      }
                      className="flex-1 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 text-lg py-6"
                      disabled={loading}
                      data-testid="chat-input"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={loading || !inputMessage.trim()}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-6"
                      data-testid="send-btn"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIChat;
