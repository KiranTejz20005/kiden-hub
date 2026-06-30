import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { nvidiaService } from '@/services/nvidia-service';
import { toast } from 'sonner';
import { 
  Plus, 
  Send, 
  Paperclip, 
  Trash2, 
  User as UserIcon,
  Sparkles,
  X,
  FileText,
  Copy,
  Check,
  Bot,
  Loader2,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { extractPdfText } from '@/lib/pdf-extractor';
import { logActivity } from '@/services/activityService';

// --- Typing Animation Dots ---
// --- Thinking Animation with Timer ---
const ThinkingIndicator = React.memo(({ seconds }: { seconds: number }) => (
  <div className="flex items-center gap-4 py-1">
    <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-lg border border-white/20">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-white"
          animate={{ 
            scale: [1, 1.2, 1], 
            opacity: [0.4, 1, 0.4],
          }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
    <div className="flex flex-col">
      <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Thinking...</span>
      <span className="text-[9px] font-mono text-muted-foreground">{seconds.toFixed(1)}s elapsed</span>
    </div>
  </div>
));

ThinkingIndicator.displayName = 'ThinkingIndicator';

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
      {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
};

// --- Message Bubble ---
const MessageBubble = React.memo(({ msg }: { msg: any; isLast?: boolean }) => {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('flex gap-4 group', isUser ? 'flex-row-reverse' : '')}
    >
      <div className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1 border border-white/5',
        isUser ? 'bg-white text-black' : 'bg-white/5 text-white/40'
      )}>
        {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div className={cn('flex flex-col gap-1.5 max-w-[85%]', isUser ? 'items-end' : 'items-start')}>
        <div className={cn(
          'relative px-5 py-3 rounded-2xl text-[13px] leading-relaxed',
          isUser
            ? 'bg-white/5 border border-white/10 text-white'
            : 'bg-[#0d0d0d] border border-white/5 text-white/80'
        )}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{msg.content}</p>
          ) : (
            <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none prose-p:my-1 prose-headings:mt-2 prose-headings:mb-1 prose-pre:bg-white/5 prose-pre:rounded-xl prose-code:text-white prose-code:bg-white/10 prose-code:rounded prose-code:px-1 font-medium">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          )}
        </div>
        <div className={cn('flex items-center gap-2', isUser ? 'flex-row-reverse' : '')}>
          <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {!isUser && <CopyButton text={msg.content} />}
        </div>
      </div>
    </motion.div>
  );
});

MessageBubble.displayName = 'MessageBubble';

// --- Empty State ---
const SUGGESTIONS = [
  { emoji: '📄', text: 'Summarize a document', prompt: 'Please summarize the attached document and extract the key points.' },
  { emoji: '📋', text: 'Write a project brief', prompt: 'Help me write a comprehensive project brief. Ask me about the project goals first.' },
  { emoji: '💡', text: 'Explain a concept', prompt: 'Explain a concept to me in simple terms. What concept would you like me to explain?' },
  { emoji: '✉️', text: 'Draft an email', prompt: 'Help me draft a professional email. Tell me who it\'s for and what the purpose is.' },
  { emoji: '🔍', text: 'Analyze my files', prompt: 'Attach a file using the paperclip icon and I\'ll analyze it for you in detail.' },
  { emoji: '🧠', text: 'Brainstorm ideas', prompt: 'Let\'s brainstorm ideas together. What topic or problem are you working on?' },
];

const EmptyState = React.memo(({ onNewChat, onSuggestion }: { onNewChat: () => void; onSuggestion: (prompt: string) => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex-1 flex flex-col items-center justify-center p-12 gap-12"
  >
    <div className="text-center space-y-6">
      <div className="w-20 h-20 rounded-3xl bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto shadow-2xl">
        <Bot className="w-10 h-10 text-white/30" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white tracking-tighter">Kiden Intelligence</h2>
        <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] leading-loose max-w-[280px] mx-auto">
          Minimalist assistant. Built for clarity and speed.
        </p>
      </div>
    </div>

    <div className="w-full max-w-sm">
      <div className="grid grid-cols-2 gap-4">
        {SUGGESTIONS.slice(0, 4).map(s => (
          <button
            key={s.text}
            onClick={() => onSuggestion(s.prompt)}
            className="flex flex-col gap-3 p-5 rounded-3xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] hover:border-white/10 transition-all text-left group shadow-sm"
          >
            <span className="text-xl grayscale opacity-20 group-hover:opacity-100 transition-all duration-500">{s.emoji}</span>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest group-hover:text-white transition-colors">{s.text}</p>
          </button>
        ))}
      </div>
    </div>

    <button 
      onClick={onNewChat} 
      className="flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-white text-black font-black text-[10px] uppercase tracking-[0.25em] hover:bg-white/90 transition-all active:scale-95 shadow-2xl shadow-white/5 mt-4"
    >
      <Plus className="w-4 h-4" /> New Session
    </button>
  </motion.div>
));

EmptyState.displayName = 'EmptyState';

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
  const [, setShowScrollBtn] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Prevent tab refresh refetch spam
  const fetchInProgressRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const FETCH_COOLDOWN = 5 * 60 * 1000; // 5 minutes

  const fetchConversations = useCallback(async () => {
    if (fetchInProgressRef.current) return;
    const now = Date.now();
    if (now - lastFetchTimeRef.current < FETCH_COOLDOWN) return;
    
    if (!user) return;
    fetchInProgressRef.current = true;
    try {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false });
      if (data) {
        setConversations(data);
        lastFetchTimeRef.current = now;
      }
    } finally {
      fetchInProgressRef.current = false;
    }
  }, [user]);

  useEffect(() => {
    if (user && conversations.length === 0) fetchConversations();
  }, [user]);
  
  // Refetch only on tab visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchConversations();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchConversations]);

  useEffect(() => {
    if (!user) return;
    supabase.from('files').select('id, name, type, size, created_at').eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setAvailableFiles(data); });
  }, [user]);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConv) { 
      setMessages([]); 
      return; 
    }
    
    // Fetch existing messages
    supabase.from('messages').select('*')
      .eq('conversation_id', activeConv.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setMessages(data); });
    
    // Subscribe to real-time message updates
    const channel = supabase
      .channel(`chat-messages-${activeConv.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConv.id}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConv?.id]);

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
          
          // Log Activity for analysis
          fileData.forEach(file => {
            logActivity(user.id, 'summarize_file', file.name, 'file');
          });
        }
      }

      // OPTIMIZATION: Fetch history and RAG knowledge in parallel (not sequential)
      const historyPromise = supabase.from('messages').select('role, content')
        .eq('conversation_id', activeConv.id).order('created_at', { ascending: true }).limit(12);
      
      const embeddingPromise = nvidiaService.generateEmbedding(userMessage)
        .catch((err) => {
          console.warn('Embedding generation failed:', err);
          return null;
        });

      // Wait for both in parallel
      const [historyResult, queryEmbedding] = await Promise.all([historyPromise, embeddingPromise]);
      const history = historyResult.data;

      // RAG: Semantic Knowledge Retrieval (only if embedding succeeded)
      let knowledgeContext: any[] = [];
      if (queryEmbedding) {
        try {
          const { data: knowledge } = await supabase.rpc('match_knowledge', {
            query_embedding: queryEmbedding,
            match_threshold: 0.5,
            match_count: 5,
            p_user_id: user.id
          });
          
          if (knowledge && knowledge.length > 0) {
            knowledgeContext = knowledge.map((k: any) => ({
              filename: k.title,
              content: k.content,
              mimeType: k.source_type,
              size: 0
            }));
          }
        } catch (err) {
          console.warn('RAG Retrieval failed:', err);
        }
      }

      // Show a streaming placeholder immediately
      const placeholderId = `streaming-${Date.now()}`;
      setMessages(prev => [...prev, { id: placeholderId, role: 'assistant', content: '', created_at: new Date().toISOString(), isStreaming: true }]);

      const aiResponse = await nvidiaService.chat(
        userMessage,
        [...documentContext, ...knowledgeContext].length > 0 ? [...documentContext, ...knowledgeContext] : undefined,
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
      {/* ── Main Chat Area ── */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {!activeConv ? (
          <EmptyState onNewChat={handleNewChat} onSuggestion={handleSuggestion} />
        ) : (
          <>
            {/* Header */}
            <div className="h-14 border-b border-white/5 flex items-center justify-between px-5 bg-black/20 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white/60" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-white truncate max-w-[300px]">{activeConv.title}</h3>
                  <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-white/40" />
                    AI Ready
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => deleteConversation(activeConv.id, { stopPropagation: () => {} } as any)}
                  className="p-2 rounded-lg text-white/20 hover:text-white hover:bg-white/5 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-6 py-8 space-y-6 scrollbar-hide"
            >
              <div className="max-w-2xl mx-auto space-y-6">
                <AnimatePresence initial={false}>
                  {messages.map((msg, i) => (
                    <div key={msg.id}>
                      {msg.isStreaming ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex gap-4"
                        >
                          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-1">
                            <Bot className="w-4 h-4 text-white/40" />
                          </div>
                          <div className="px-5 py-3 rounded-2xl bg-white/[0.02] border border-white/5">
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

            {/* Input Area */}
            <div className="p-6 shrink-0 bg-gradient-to-t from-black to-transparent">
              <form onSubmit={handleSendMessage} className="max-w-2xl mx-auto space-y-3">
                {/* Selected Files Pills */}
                <AnimatePresence>
                  {selectedFiles.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex flex-wrap gap-2 mb-2"
                    >
                      {selectedFiles.map((fileId) => {
                        const file = availableFiles.find(f => f.id === fileId);
                        return file ? (
                          <div key={fileId} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 transition-all">
                            <FileText className="w-3 h-3 text-white/40" />
                            <span className="text-[11px] font-medium text-white/60 truncate max-w-[120px]">{file.name}</span>
                            <button type="button" onClick={() => setSelectedFiles(prev => prev.filter(id => id !== fileId))}>
                              <X className="w-3 h-3 text-white/20 hover:text-white" />
                            </button>
                          </div>
                        ) : null;
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Main Input Box */}
                <div className="relative group">
                  <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl focus-within:border-white/30 transition-all p-1.5">
                    <textarea
                      ref={textareaRef}
                      className="w-full bg-transparent px-4 py-3 pr-14 focus:outline-none text-[13px] text-white placeholder:text-white/20 resize-none min-h-[50px] max-h-32 leading-relaxed font-medium"
                      placeholder={selectedFiles.length > 0 ? `Analyze ${selectedFiles.length} file(s)...` : 'Type a message...'}
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
                      type="submit"
                      disabled={!inputValue.trim() || loading}
                      className={cn(
                        'absolute right-2 bottom-2 w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0',
                        inputValue.trim() && !loading
                          ? 'bg-white text-black hover:bg-white/90'
                          : 'bg-white/5 text-white/10 cursor-not-allowed'
                      )}
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowFileSelector(!showFileSelector)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border",
                        selectedFiles.length > 0 
                          ? "bg-white/10 border-white/20 text-white" 
                          : "bg-transparent border-transparent text-white/30 hover:text-white/60"
                      )}
                    >
                      <Paperclip className="w-3 h-3" />
                      Attach
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all text-white/30 hover:text-white/60"
                    >
                      <Sparkles className="w-3 h-3" />
                      Summarize
                    </button>
                  </div>
                  <p className="text-[9px] font-bold text-white/10 uppercase tracking-[0.2em]">
                    Markdown
                  </p>
                </div>
              </form>
            </div>
          </>
        )}
      </div>

      {/* ── Right Sidebar: Chat History ── */}
      <div className="w-72 border-l border-white/5 bg-[#050505] flex flex-col shrink-0">
        <div className="px-6 py-8 flex items-center justify-between">
          <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">History</p>
        </div>

        <ScrollArea className="flex-1 px-3">
          <div className="space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConv(conv)}
                className={cn(
                  "w-full group flex flex-col gap-1 p-3 rounded-xl transition-all border text-left",
                  activeConv?.id === conv.id 
                    ? "bg-white/[0.04] border-white/10" 
                    : "bg-transparent border-transparent hover:bg-white/[0.02]"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={cn(
                    "text-[12px] font-bold truncate flex-1",
                    activeConv?.id === conv.id ? "text-white" : "text-white/40"
                  )}>
                    {conv.title}
                  </span>
                  <div className={cn(
                    "w-1 h-1 rounded-full transition-all",
                    activeConv?.id === conv.id ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.3)]" : "bg-white/5"
                  )} />
                </div>
                <span className="text-[8px] font-black text-white/10 uppercase tracking-widest">
                  {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                </span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default AIChat;
