import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { nvidiaService } from '@/services/nvidia-service';
import { toast } from 'sonner';
import { 
  Plus, 
  Send, 
  Paperclip, 
  Trash2, 
  MessageSquare,
  User as UserIcon,
  Sparkles,
  X,
  FileText,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Bot,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { extractPdfText } from '@/lib/pdf-extractor';

// --- Typing Animation Dots ---
// --- Thinking Animation with Timer ---
const ThinkingIndicator = ({ seconds }: { seconds: number }) => (
  <div className="flex items-center gap-4 py-1">
    <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-emerald-500"
          animate={{ 
            scale: [1, 1.5, 1], 
            opacity: [0.4, 1, 0.4],
            backgroundColor: ['#10b981', '#34d399', '#10b981']
          }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
    <div className="flex flex-col">
      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Thinking...</span>
      <span className="text-[9px] font-mono text-muted-foreground">{seconds.toFixed(1)}s elapsed</span>
    </div>
  </div>
);

// --- Copy Button for Messages ---
const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-white/10 text-muted-foreground hover:text-foreground"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
};

// --- Message Bubble ---
const MessageBubble = ({ msg, isLast }: { msg: any; isLast: boolean }) => {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn('flex gap-3 group', isUser ? 'flex-row-reverse' : '')}
    >
      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1',
        isUser
          ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
          : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
      )}>
        {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Content */}
      <div className={cn('flex flex-col gap-1 max-w-[80%]', isUser ? 'items-end' : 'items-start')}>
        <div className={cn(
          'relative px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm',
          isUser
            ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-tr-sm'
            : 'bg-card border border-border/60 text-foreground rounded-tl-sm'
        )}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{msg.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:mt-2 prose-headings:mb-1 prose-pre:bg-black/30 prose-pre:rounded-lg prose-code:text-emerald-400 prose-code:bg-black/20 prose-code:rounded prose-code:px-1">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          )}
        </div>
        {/* Actions */}
        <div className={cn('flex items-center gap-1.5', isUser ? 'flex-row-reverse' : '')}>
          <span className="text-[10px] text-muted-foreground/60">
            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {!isUser && <CopyButton text={msg.content} />}
        </div>
      </div>
    </motion.div>
  );
};

// --- Empty State ---
const SUGGESTIONS = [
  { emoji: '📄', text: 'Summarize a document', prompt: 'Please summarize the attached document and extract the key points.' },
  { emoji: '📋', text: 'Write a project brief', prompt: 'Help me write a comprehensive project brief. Ask me about the project goals first.' },
  { emoji: '💡', text: 'Explain a concept', prompt: 'Explain a concept to me in simple terms. What concept would you like me to explain?' },
  { emoji: '✉️', text: 'Draft an email', prompt: 'Help me draft a professional email. Tell me who it\'s for and what the purpose is.' },
  { emoji: '🔍', text: 'Analyze my files', prompt: 'Attach a file using the paperclip icon and I\'ll analyze it for you in detail.' },
  { emoji: '🧠', text: 'Brainstorm ideas', prompt: 'Let\'s brainstorm ideas together. What topic or problem are you working on?' },
];

const EmptyState = ({ onNewChat, onSuggestion }: { onNewChat: () => void; onSuggestion: (prompt: string) => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex-1 flex flex-col items-center justify-center p-8 gap-8"
  >
    {/* Hero */}
    <div className="text-center">
      <div className="relative inline-flex mb-5">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/20 flex items-center justify-center shadow-xl shadow-emerald-500/10">
          <Bot className="w-10 h-10 text-emerald-400" />
        </div>
        <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-emerald-400" />
        </div>
      </div>
      <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Kiden AI</h2>
      <p className="text-muted-foreground text-sm mt-1.5 max-w-xs">Your intelligent workspace assistant. Analyze documents, draft content, and get answers instantly.</p>
    </div>

    {/* Suggestions */}
    <div className="w-full max-w-lg">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 text-center">Try asking…</p>
      <div className="grid grid-cols-2 gap-2">
        {SUGGESTIONS.map(s => (
          <button
            key={s.text}
            onClick={() => onSuggestion(s.prompt)}
            className="flex items-start gap-2.5 p-3.5 rounded-xl bg-secondary/30 border border-border/40 hover:bg-secondary/60 hover:border-emerald-500/30 hover:shadow-md transition-all text-left group"
          >
            <span className="text-lg shrink-0 mt-0.5">{s.emoji}</span>
            <div>
              <p className="text-xs font-semibold text-foreground group-hover:text-emerald-300 transition-colors">{s.text}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{s.prompt.substring(0, 50)}…</p>
            </div>
          </button>
        ))}
      </div>
    </div>

    <button onClick={onNewChat} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
      <Plus className="w-4 h-4" /> Start New Chat
    </button>
  </motion.div>
);

const AIChat = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [thinkingTime, setThinkingTime] = useState(0);
  const [streamingContent, setStreamingContent] = useState('');
  const [availableFiles, setAvailableFiles] = useState<any[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('last_message_at', { ascending: false });
    if (data) setConversations(data);
  }, [user]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    if (!user) return;
    supabase.from('files').select('id, name, type, size, created_at').eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setAvailableFiles(data); });
  }, [user]);

  useEffect(() => {
    if (!activeConv) { setMessages([]); return; }
    supabase.from('messages').select('*')
      .eq('conversation_id', activeConv.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setMessages(data); });
  }, [activeConv]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior });
    }
  }, []);

  useEffect(() => {
    let interval: any;
    if (loading) {
      setThinkingTime(0);
      interval = setInterval(() => {
        setThinkingTime(prev => prev + 0.1);
      }, 100);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 120);
  };

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
  };

  const handleNewChat = async () => {
    if (!user) return;
    const { data } = await supabase.from('conversations')
      .insert([{ user_id: user.id, title: 'New Conversation', last_message_at: new Date().toISOString() }])
      .select().single();
    if (data) {
      setConversations(prev => [data, ...prev]);
      setActiveConv(data);
      setMessages([]);
    }
  };

  const handleSuggestion = async (prompt: string) => {
    if (!user) return;
    // Create a new conversation
    const { data } = await supabase.from('conversations')
      .insert([{ user_id: user.id, title: prompt.substring(0, 50), last_message_at: new Date().toISOString() }])
      .select().single();
    if (data) {
      setConversations(prev => [data, ...prev]);
      setActiveConv(data);
      setMessages([]);
      // Pre-fill the input
      setInputValue(prompt);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('messages').delete().eq('conversation_id', convId);
    await supabase.from('conversations').delete().eq('id', convId);
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (activeConv?.id === convId) { setActiveConv(null); setMessages([]); }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !activeConv || loading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    if (textareaRef.current) { textareaRef.current.style.height = 'auto'; }
    setLoading(true);
    setStreamingContent('');

    // Optimistic message
    const optimisticMsg = { id: `opt-${Date.now()}`, role: 'user', content: userMessage, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      // Persist user message
      await supabase.from('messages').insert([{
        conversation_id: activeConv.id, role: 'user', content: userMessage,
        file_refs: selectedFiles.length > 0 ? selectedFiles : null
      }]);

      // Build document context — real content extraction
      let documentContext: any[] = [];
      if (selectedFiles.length > 0) {
        const { data: fileData } = await supabase.from('files').select('*').in('id', selectedFiles);
        if (fileData) {
          documentContext = await Promise.all(fileData.map(async (file) => {
            const isPdf = file.mime_type === 'application/pdf' || file.type?.toLowerCase() === 'pdf';
            const isText = /^text\//i.test(file.mime_type) || /^application\/(json|javascript|xml)/i.test(file.mime_type) ||
              ['ts', 'tsx', 'js', 'jsx', 'py', 'md', 'txt', 'json', 'csv', 'html', 'css'].includes((file.type || '').toLowerCase());

            let extractedContent = `File: "${file.name}" (${file.type?.toUpperCase() || 'unknown'}, ${(file.size / 1024).toFixed(1)} KB)\n`;

            if (isPdf) {
              try {
                toast.info(`Extracting text from ${file.name}…`, { duration: 2000 });
                const text = await extractPdfText(file.public_url);
                if (text) {
                  extractedContent += `\nExtracted PDF Content:\n${text}`;
                } else {
                  extractedContent += `\n(PDF text extraction returned empty — the file may be image-only/scanned.)`;
                }
              } catch (err: any) {
                extractedContent += `\n(Could not extract PDF text: ${err.message})`;
              }
            } else if (isText && file.size < 200 * 1024) {
              try {
                const r = await fetch(file.public_url);
                if (r.ok) {
                  extractedContent += `\nFile Content:\n${(await r.text()).substring(0, 12000)}`;
                }
              } catch {
                extractedContent += `\n(Could not fetch text content.)`;
              }
            } else {
              extractedContent += `\n(Binary or large file — content not extractable. URL: ${file.public_url})`;
            }

            return { filename: file.name, content: extractedContent, mimeType: file.mime_type, size: file.size };
          }));
        }
      }

      // History
      const { data: history } = await supabase.from('messages').select('role, content')
        .eq('conversation_id', activeConv.id).order('created_at', { ascending: true }).limit(12);

      // Show a streaming placeholder immediately
      const placeholderId = `streaming-${Date.now()}`;
      setMessages(prev => [...prev, { id: placeholderId, role: 'assistant', content: '', created_at: new Date().toISOString(), isStreaming: true }]);

      const aiResponse = await nvidiaService.chat(
        userMessage,
        documentContext.length > 0 ? documentContext : undefined,
        history?.map(m => ({ role: m.role as any, content: m.content }))
      );

      // Replace placeholder with real content
      setMessages(prev => prev.map(m => m.id === placeholderId ? { ...m, content: aiResponse, isStreaming: false } : m));

      // Persist AI message
      await supabase.from('messages').insert([{
        conversation_id: activeConv.id, role: 'assistant', content: aiResponse
      }]);

      // Update conversation title on first message
      if (messages.filter(m => m.role === 'user').length === 0) {
        const title = userMessage.substring(0, 50) + (userMessage.length > 50 ? '…' : '');
        await supabase.from('conversations').update({ title, last_message_at: new Date().toISOString() }).eq('id', activeConv.id);
        setConversations(prev => prev.map(c => c.id === activeConv.id ? { ...c, title } : c));
      }

      setSelectedFiles([]);
      setShowFileSelector(false);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Failed to send message: ' + error.message);
      setMessages(prev => prev.filter(m => !m.isStreaming && m.id !== `opt-${Date.now()}`));
    } finally {
      setLoading(false);
      setStreamingContent('');
    }
  };

  return (
    <div className="flex h-full bg-[#030303] overflow-hidden rounded-3xl border border-white/5 relative shadow-2xl">
      {/* ── Sidebar ── */}
      <AnimatePresence initial={false}>
        {showSidebar && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="border-r border-white/5 flex flex-col bg-white/[0.01] backdrop-blur-3xl shrink-0 overflow-hidden"
          >
        <div className="p-4 border-b border-border/50">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] group"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
            <span>New Chat</span>
          </button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            <AnimatePresence>
              {conversations.map((conv) => (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="px-1"
                >
                  <button
                    onClick={() => setActiveConv(conv)}
                    className={cn(
                      'w-full text-left px-3 py-3 rounded-xl transition-all flex items-center gap-3 group relative overflow-hidden',
                      activeConv?.id === conv.id
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                        : 'hover:bg-white/[0.03] text-muted-foreground hover:text-foreground border border-transparent'
                    )}
                  >
                    <MessageSquare className="w-4 h-4 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold truncate leading-tight">{conv.title}</p>
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mt-1">
                        {new Date(conv.last_message_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => deleteConversation(conv.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-500/10 hover:text-rose-400 text-muted-foreground/40 transition-all shrink-0"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {conversations.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8 px-4">No conversations yet. Start a new chat!</p>
            )}
          </div>
        </ScrollArea>

        </motion.div>
      )}
      </AnimatePresence>

      {/* Sidebar Toggle Button (Floating) */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className={cn(
          "absolute top-6 z-20 w-8 h-8 rounded-full bg-emerald-500 text-white shadow-lg flex items-center justify-center transition-all duration-500 hover:scale-110",
          showSidebar ? "left-[284px]" : "left-4"
        )}
      >
        <ChevronRight className={cn("w-4 h-4 transition-transform duration-300", showSidebar && "rotate-180")} />
      </button>

      {/* ── Main Chat Area ── */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {!activeConv ? (
          <EmptyState onNewChat={handleNewChat} onSuggestion={handleSuggestion} />
        ) : (
          <>
            {/* Header */}
            <div className="h-14 border-b border-border/50 flex items-center justify-between px-5 bg-card/30 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm truncate max-w-[300px]">{activeConv.title}</h3>
                  <p className="text-[10px] text-emerald-400 font-medium">● Active</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => deleteConversation(activeConv.id, { stopPropagation: () => {} } as any)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-6 py-6 space-y-5 scroll-smooth"
              style={{ scrollBehavior: 'smooth' }}
            >
              <div className="max-w-3xl mx-auto space-y-5">
                <AnimatePresence initial={false}>
                  {messages.map((msg, i) => (
                    <div key={msg.id}>
                      {msg.isStreaming ? (
                        <motion.div
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex gap-3"
                        >
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 mt-1 shadow-lg shadow-emerald-500/20">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                          <div className="px-5 py-4 rounded-3xl rounded-tl-sm bg-[#050505] border border-emerald-500/20 shadow-xl shadow-emerald-500/5">
                            <ThinkingIndicator seconds={thinkingTime} />
                          </div>
                        </motion.div>
                      ) : (
                        <MessageBubble msg={msg} isLast={i === messages.length - 1} />
                      )}
                    </div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Scroll to bottom button */}
            <AnimatePresence>
              {showScrollBtn && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  onClick={() => scrollToBottom()}
                  className="absolute bottom-28 right-8 w-9 h-9 rounded-full bg-emerald-500 text-white shadow-lg flex items-center justify-center z-20 hover:scale-110 transition-transform"
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="border-t border-border/50 bg-card/30 backdrop-blur-md p-4 shrink-0">
              <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto">
                {/* Selected Files Pills */}
                <AnimatePresence>
                  {selectedFiles.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex flex-wrap gap-1.5 mb-2 overflow-hidden"
                    >
                      {selectedFiles.map((fileId) => {
                        const file = availableFiles.find(f => f.id === fileId);
                        return file ? (
                          <div key={fileId} className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-1">
                            <FileText className="w-3 h-3 text-emerald-400" />
                            <span className="text-xs font-medium text-emerald-300 truncate max-w-[120px]">{file.name}</span>
                            <button type="button" onClick={() => setSelectedFiles(prev => prev.filter(id => id !== fileId))}>
                              <X className="w-3 h-3 text-emerald-400 hover:text-white" />
                            </button>
                          </div>
                        ) : null;
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* File Selector Popup */}
                <AnimatePresence>
                  {showFileSelector && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.97 }}
                      className="mb-2 bg-card border border-border rounded-2xl p-3 space-y-1.5 max-h-52 overflow-y-auto shadow-xl"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1 mb-2">Attach Files</p>
                      {availableFiles.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-4 text-center">No files uploaded yet. Go to Files to upload some.</p>
                      ) : (
                        availableFiles.map((file) => (
                          <label key={file.id} className="flex items-center gap-2.5 p-2 hover:bg-secondary/40 rounded-xl cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={selectedFiles.includes(file.id)}
                              onChange={(e) => {
                                setSelectedFiles(prev => e.target.checked ? [...prev, file.id] : prev.filter(id => id !== file.id));
                              }}
                              className="w-4 h-4 rounded accent-emerald-500"
                            />
                            <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="text-xs flex-1 truncate">{file.name}</span>
                            <span className="text-[10px] text-muted-foreground shrink-0">{(file.size / 1024).toFixed(0)}KB</span>
                          </label>
                        ))
                      )}
                      <button
                        type="button"
                        onClick={() => setShowFileSelector(false)}
                        className="w-full mt-1 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-lg border border-border/40 hover:bg-secondary/30 transition-all"
                      >
                        Done
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Input Row */}
                <div className="flex items-end gap-2">
                  <div className="flex-1 relative bg-secondary/30 border border-border/50 rounded-2xl focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all">
                    <textarea
                      ref={textareaRef}
                      className="w-full bg-transparent px-4 py-3 pr-12 focus:outline-none text-sm resize-none min-h-[48px] max-h-40 leading-relaxed"
                      placeholder={selectedFiles.length > 0 ? `Ask about ${selectedFiles.length} attached file(s)...` : 'Ask Kiden AI anything...'}
                      rows={1}
                      value={inputValue}
                      onChange={handleInput}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e as any);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowFileSelector(!showFileSelector)}
                      className={cn(
                        'absolute right-3 bottom-3 p-1.5 rounded-lg transition-all',
                        selectedFiles.length > 0
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                      )}
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={!inputValue.trim() || loading}
                    className={cn(
                      'w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-95 shrink-0',
                      inputValue.trim() && !loading
                        ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/30'
                        : 'bg-secondary/50 text-muted-foreground cursor-not-allowed'
                    )}
                  >
                    <Send className="w-4.5 h-4.5" />
                  </button>
                </div>

                <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
                  Enter to send · Shift+Enter for new line · Attach files for context
                </p>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AIChat;
