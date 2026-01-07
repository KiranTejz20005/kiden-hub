import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, Zap, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { PageLayout } from '@/components/ui/PageLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

// Mock Knowledge Base for "Simulated AI"
const KNOWLEDGE_BASE = {
  'productivity': "To improve productivity, try the Pomodoro technique (25m focus, 5m break). Kiden Hub has a built-in Focus Mode for this!",
  'habits': "Building habits takes consistency. Start small (atomic habits) and track them daily in the Habits tab.",
  'journal': "Journaling helps clear the mind. Try the 'Morning Pages' technique in the Journal tab.",
  'default': "I'm Kiden AI. I can help you navigate your productivity system. Try asking about habits, focus, or project management."
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  "How can I be more productive?",
  "Tips for building habits",
  "Explain the Focus Mode",
  "Draft a project plan"
];

const AIChat = () => {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: "Hello! I'm your specific Kiden Assistant. How can I suppress entropy today?", timestamp: new Date() }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI Response Delay
    setTimeout(() => {
      let response = KNOWLEDGE_BASE['default'];
      const lower = text.toLowerCase();

      if (lower.includes('productivity') || lower.includes('productive') || lower.includes('focus')) response = KNOWLEDGE_BASE['productivity'];
      else if (lower.includes('habit')) response = KNOWLEDGE_BASE['habits'];
      else if (lower.includes('journal') || lower.includes('write')) response = KNOWLEDGE_BASE['journal'];
      else if (lower.includes('plan') || lower.includes('project')) response = "I suggest breaking your project down into actionable tasks in the Project tab. Define a clear goal and deadline first.";

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <PageLayout className="p-0 lg:p-4 flex flex-col h-full overflow-hidden">
      <PageHeader className="px-6 pt-6" title="Kiden Assistant" description="Your neural productivity companion" />

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6" ref={scrollRef}>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex gap-4 max-w-3xl",
              msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm",
              msg.role === 'assistant'
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-foreground border-border"
            )}>
              {msg.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>

            <div className={cn(
              "p-4 rounded-2xl text-sm leading-relaxed shadow-sm max-w-[85%]",
              msg.role === 'assistant'
                ? "bg-card border border-border/50 rounded-tl-none"
                : "bg-primary text-primary-foreground rounded-tr-none"
            )}>
              <ReactMarkdown>{msg.content}</ReactMarkdown>
              <span className="text-[10px] opacity-50 mt-2 block text-right">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 border border-primary">
              <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
            </div>
            <div className="bg-card border border-border/50 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 lg:p-6 bg-card/30 backdrop-blur-md border-t border-border/50">
        {/* Suggestions */}
        {messages.length < 3 && (
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="whitespace-nowrap px-4 py-2 bg-secondary/50 hover:bg-secondary border border-border/50 rounded-full text-xs font-medium transition-colors flex items-center gap-2"
              >
                <Sparkles className="w-3 h-3 text-amber-500" /> {s}
              </button>
            ))}
          </div>
        )}

        <div className="relative max-w-4xl mx-auto flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything about your schedule..."
              className="pr-12 h-12 bg-background/50 border-border/50 rounded-xl focus-visible:ring-primary/20 text-base"
            />
            <div className="absolute right-3 top-3">
              <Zap className="w-6 h-6 text-primary/20" />
            </div>
          </div>
          <Button
            size="icon"
            className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
        <div className="text-center mt-2 text-[10px] text-muted-foreground">
          Kiden Assistant can make mistakes. Consider checking important info.
        </div>
      </div>
    </PageLayout>
  );
};

export default AIChat;
