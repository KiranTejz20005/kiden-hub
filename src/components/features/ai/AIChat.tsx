import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { nvidiaService } from '@/services/nvidia-service';
import { toast } from 'sonner';
import { 
  Plus, 
  Paperclip, 
  Trash2, 
  Sparkles, 
  X, 
  FileText, 
  Copy, 
  Check, 
  Loader2,
  ChevronDown,
  Clock,
  ArrowUp,
  PanelRight,
  Mic,
  Flame,
  ChevronRight,
  Scan,
  Box,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Custom logo badge matching reference (two-curved spark logo)
const CustomLogoBadge = () => (
  <div className="w-8 h-8 flex items-center justify-center shrink-0 mb-4">
    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3C10.5 6.5 7.5 9.5 4 11C7.5 12.5 10.5 15.5 12 19C13.5 15.5 16.5 12.5 20 11C16.5 9.5 13.5 6.5 12 3Z" />
    </svg>
  </div>
);

// 4 Prompt cards data matching Reference Screenshot 1
const CARDS = [
  {
    icon: FileText,
    text: 'Scrape transcripts from a creator',
    prompt: 'Scrape and summarize transcripts from top creators in my niche.',
  },
  {
    icon: Flame,
    text: 'Find a viral topic to post about today',
    prompt: 'Analyze trending viral topics and suggest 5 content ideas for today.',
  },
  {
    icon: Scan,
    text: 'Study top video titles or article headlines',
    prompt: 'Break down the highest-performing video titles and headline formulas.',
  },
  {
    icon: Box,
    text: 'Start with a prebuilt Custom AI',
    prompt: 'Help me set up a custom AI persona tailored for content creation.',
  },
];

// Active configured API models
const API_MODELS = [
  { label: 'Llama 3.1 8B', modelId: 'meta/llama-3.1-8b-instruct' },
  { label: 'Llama 3.3 70B', modelId: 'meta/llama-3.3-70b-instruct' },
  { label: 'Mistral NeMo', modelId: 'mistralai/mistral-nemo-12b-instruct' },
];

export default function AIChat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(API_MODELS[0]);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [availableFiles, setAvailableFiles] = useState<any[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* Load user conversations */
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false });
      if (data) setConversations(data);
    } catch { /* silent */ }
  }, [user]);

  /* Load files for attachment context */
  const fetchFiles = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('notes')
        .select('id, title')
        .eq('user_id', user.id)
        .limit(10);
      if (data) setAvailableFiles(data.map(d => ({ id: d.id, name: d.title || 'Untitled note' })));
    } catch { /* silent */ }
  }, [user]);

  useEffect(() => {
    fetchConversations();
    fetchFiles();
  }, [fetchConversations, fetchFiles]);

  /* Load messages for active conversation */
  useEffect(() => {
    if (!activeConv) {
      setMessages([]);
      return;
    }
    const loadMessages = async () => {
      try {
        const { data } = await supabase
          .from('messages' as any)
          .select('*')
          .eq('conversation_id', activeConv.id)
          .order('created_at', { ascending: true });
        if (data) setMessages(data);
      } catch { /* silent */ }
    };
    loadMessages();
  }, [activeConv]);

  /* Scroll to bottom */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  /* Create new chat session */
  const handleNewChat = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert([{ user_id: user.id, title: 'New chat', last_message_at: new Date().toISOString() }])
        .select()
        .single();
      if (error) throw error;
      if (data) {
        setConversations(prev => [data, ...prev]);
        setActiveConv(data);
        setMessages([]);
      }
    } catch (e: any) {
      toast.error('Failed to create new chat');
    }
  };

  /* Delete conversation */
  const handleDeleteConv = async (id: string) => {
    try {
      await supabase.from('messages' as any).delete().eq('conversation_id', id);
      await supabase.from('conversations').delete().eq('id', id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConv?.id === id) setActiveConv(null);
      toast.success('Chat deleted');
    } catch {
      toast.error('Failed to delete chat');
    }
  };

  /* Send message handler */
  const handleSend = async (textToSend?: string) => {
    const content = textToSend || inputValue.trim();
    if (!content || loading || !user) return;

    setInputValue('');

    let currentConv = activeConv;
    if (!currentConv) {
      try {
        const { data, error } = await supabase
          .from('conversations')
          .insert([{ user_id: user.id, title: content.substring(0, 30), last_message_at: new Date().toISOString() }])
          .select()
          .single();
        if (error) throw error;
        currentConv = data;
        setActiveConv(data);
        setConversations(prev => [data, ...prev]);
      } catch {
        toast.error('Failed to start conversation');
        return;
      }
    }

    const userMsg = {
      id: `u-${Date.now()}`,
      conversation_id: currentConv.id,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      await supabase.from('messages' as any).insert([{
        conversation_id: currentConv.id,
        role: 'user',
        content,
      } as any]);

      const history = messages.concat(userMsg).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      const aiResponse = await nvidiaService.chatCompletion(history, selectedModel.modelId);

      const assistantMsg = {
        id: `a-${Date.now()}`,
        conversation_id: currentConv.id,
        role: 'assistant',
        content: aiResponse,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMsg]);
      await supabase.from('messages' as any).insert([{
        conversation_id: currentConv.id,
        role: 'assistant',
        content: aiResponse,
      } as any]);

      /* Update title if first message */
      if (messages.length === 0) {
        const title = content.substring(0, 35) + (content.length > 35 ? '...' : '');
        await supabase.from('conversations').update({ title, last_message_at: new Date().toISOString() }).eq('id', currentConv.id);
        setConversations(prev => prev.map(c => c.id === currentConv.id ? { ...c, title } : c));
        setActiveConv((prev: any) => prev ? { ...prev, title } : prev);
      }
    } catch (err: any) {
      toast.error('Failed to get response: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#181818] text-white relative select-none overflow-hidden">

      {/* ── Top Bar ── */}
      <div className="h-[52px] border-b border-[#2a2a2a] flex items-center justify-between px-5 bg-[#181818] shrink-0 z-10">
        {/* Chat Selector Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] transition-colors text-[13px] font-medium text-white/90 outline-none cursor-pointer">
              <span className="truncate max-w-[200px]">
                {activeConv ? activeConv.title : 'New chat'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-white/40 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 bg-[#202020] border border-[#2a2a2a] rounded-xl p-1 shadow-2xl z-[100]">
            <DropdownMenuItem onClick={handleNewChat} className="flex items-center gap-2 px-3 py-2 text-[12.5px] font-medium text-white hover:bg-white/[0.06] rounded-lg cursor-pointer">
              <Plus className="w-3.5 h-3.5 text-emerald-400" /> New chat
            </DropdownMenuItem>
            {conversations.length > 0 && <div className="h-px bg-white/[0.06] my-1" />}
            <ScrollArea className="max-h-56">
              {conversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => setActiveConv(conv)}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 text-[12.5px] rounded-lg cursor-pointer group transition-colors',
                    activeConv?.id === conv.id ? 'bg-white/[0.08] text-white font-medium' : 'text-white/60 hover:bg-white/[0.05] hover:text-white'
                  )}
                >
                  <span className="truncate flex-1">{conv.title}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDeleteConv(conv.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Top Right Action Icons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowRightPanel(p => !p)}
            className={cn(
              'p-2 rounded-lg transition-colors cursor-pointer',
              showRightPanel ? 'bg-white/[0.1] text-white' : 'text-white/40 hover:text-white hover:bg-white/[0.05]'
            )}
            title="Toggle Context Panel"
          >
            <PanelRight className="w-4 h-4" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
                title="Chat History"
              >
                <Clock className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-[#202020] border border-[#2a2a2a] rounded-xl p-1 shadow-2xl z-[100]">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Recent chats</div>
              <ScrollArea className="max-h-56">
                {conversations.map(c => (
                  <DropdownMenuItem key={c.id} onClick={() => setActiveConv(c)} className="flex items-center justify-between px-3 py-2 text-[12.5px] text-white/70 hover:text-white hover:bg-white/[0.06] rounded-lg cursor-pointer">
                    <span className="truncate">{c.title}</span>
                    <span className="text-[10px] text-white/30">{formatDistanceToNow(new Date(c.last_message_at), { addSuffix: false })}</span>
                  </DropdownMenuItem>
                ))}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            onClick={handleNewChat}
            className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
            title="New session"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Main Chat Area ── */}
      <div className="flex-1 flex flex-col relative overflow-hidden">

        {/* Floating Context Panel (Screenshot 3 Right Card) */}
        <AnimatePresence>
          {showRightPanel && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute top-4 right-6 w-72 bg-[#202020] border border-[#2a2a2a] rounded-2xl p-4 shadow-2xl z-20 space-y-4"
            >
              <div>
                <p className="text-[11.5px] font-semibold text-white/60 mb-2">Instructions</p>
                <button
                  type="button"
                  onClick={() => toast.info('System instructions added')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition-colors text-[12.5px] font-medium text-white/80 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-white/40" /> Add instructions
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-white/30" />
                </button>
              </div>

              <div className="border-t border-white/[0.06] pt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[11.5px] font-semibold text-white/60">Context</p>
                  <button type="button" onClick={() => toast.info('Select context sources')} className="text-white/40 hover:text-white p-0.5">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-white/40 leading-relaxed">
                  Notes, files, boards, links, or creators Eden should use in every reply here.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Canvas (Empty State vs Active Messages) */}
        {!activeConv || messages.length === 0 ? (
          /* ── Empty State (Screenshot 1) ── */
          <div className="flex-1 flex flex-col items-center justify-center px-4 pb-16 overflow-y-auto">
            <CustomLogoBadge />
            <h1 className="text-[22px] font-semibold text-white tracking-tight mb-8 text-center">
              What are we building?
            </h1>

            {/* 4 Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-[780px] w-full px-2">
              {CARDS.map((card, i) => (
                <motion.button
                  key={card.text}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03 * i, duration: 0.25 }}
                  onClick={() => handleSend(card.prompt)}
                  className="flex flex-col justify-between items-start p-4 rounded-xl bg-[#202020] border border-[#2a2a2a] hover:bg-[#242424] hover:border-[#333333] transition-all cursor-pointer text-left h-[98px] group shadow-sm"
                >
                  <card.icon className="w-4 h-4 text-white/60 group-hover:text-white transition-colors shrink-0" />
                  <p className="text-[12px] font-medium text-white/80 group-hover:text-white transition-colors leading-snug">
                    {card.text}
                  </p>
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          /* ── Active Conversation Stream (Screenshot 3) ── */
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8 space-y-6 scrollbar-hide">
            <div className="max-w-2xl mx-auto space-y-6">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div key={msg.id} className={cn('flex flex-col', isUser ? 'items-end' : 'items-start')}>
                    {isUser ? (
                      /* User pill bubble */
                      <div className="px-4 py-2.5 rounded-2xl bg-[#292929] border border-[#333333]/50 text-white text-[13.5px] max-w-[70%] shadow-sm leading-relaxed">
                        {msg.content}
                      </div>
                    ) : (
                      /* AI Response */
                      <div className="group relative max-w-[85%] text-white/90 text-[14px] leading-relaxed">
                        <div className="prose prose-invert prose-sm max-w-none prose-p:my-1.5 prose-headings:mt-3 prose-headings:mb-1 prose-pre:bg-[#161616] prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                        <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(msg.content, msg.id)}
                            className="p-1 rounded text-white/30 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {loading && (
                <div className="flex items-center gap-2 text-white/40 text-[12px] font-medium py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking...
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Bottom Floating Pill Input Bar ── */}
        <div className="p-4 shrink-0">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="max-w-[720px] w-full mx-auto bg-[#202020] border border-[#2a2a2a] rounded-2xl p-3 shadow-2xl focus-within:border-[#333333] transition-all flex flex-col gap-2"
          >
            {/* Attached file chips */}
            {selectedFiles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-1 pt-1">
                {selectedFiles.map(id => {
                  const f = availableFiles.find(item => item.id === id);
                  return (
                    <span key={id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.08] text-[11px] text-white/80">
                      <FileText className="w-3 h-3 text-white/40" />
                      {f?.name || 'File'}
                      <button type="button" onClick={() => setSelectedFiles(p => p.filter(x => x !== id))}>
                        <X className="w-3 h-3 text-white/30 hover:text-white" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Input textarea */}
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask anything"
              rows={1}
              className="w-full bg-transparent text-[13.5px] text-white placeholder:text-white/35 resize-none outline-none min-h-[40px] max-h-32 px-1 leading-relaxed"
            />

            {/* Bottom Controls Bar */}
            <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
              {/* Left Attachment Buttons */}
              <div className="flex items-center gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer"
                      title="Attach file or note"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 bg-[#202020] border border-[#2a2a2a] rounded-xl p-1 z-[100]">
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Attach context</div>
                    {availableFiles.length > 0 ? (
                      availableFiles.map(f => (
                        <DropdownMenuItem
                          key={f.id}
                          onClick={() => {
                            if (!selectedFiles.includes(f.id)) setSelectedFiles(p => [...p, f.id]);
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-[12px] text-white/70 hover:text-white hover:bg-white/[0.06] rounded-lg cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-white/40" />
                          <span className="truncate">{f.name}</span>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-[12px] text-white/30">No files found</div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <button
                  type="button"
                  onClick={() => toast.info('Prompt enhance active')}
                  className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer"
                  title="Enhance prompt"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Right Model & Send Controls */}
              <div className="flex items-center gap-2">
                {/* Model Selector Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10 text-[11.5px] font-medium text-white/50 hover:text-white transition-colors cursor-pointer outline-none"
                    >
                      <span>{selectedModel.label}</span>
                      <ChevronDown className="w-3 h-3 text-white/30" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 bg-[#202020] border border-[#2a2a2a] rounded-xl p-1 z-[100]">
                    {API_MODELS.map(m => (
                      <DropdownMenuItem
                        key={m.modelId}
                        onClick={() => setSelectedModel(m)}
                        className={cn(
                          'px-3 py-1.5 text-[12px] rounded-lg cursor-pointer',
                          selectedModel.modelId === m.modelId ? 'bg-white/[0.08] text-white font-medium' : 'text-white/60 hover:bg-white/[0.05] hover:text-white'
                        )}
                      >
                        {m.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Mic Button */}
                <button
                  type="button"
                  onClick={() => toast.info('Voice input feature enabled')}
                  className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer"
                  title="Voice input"
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputValue.trim() || loading}
                  className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/90 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}