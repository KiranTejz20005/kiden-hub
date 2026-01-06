import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sparkles,
  MessageSquare,
  FileText,
  Lightbulb,
  Zap,
  BookOpen,
  ArrowRight,
  Loader2,
  X,
  Send,
  Wand2,
  ListChecks,
  Languages,
  Mic
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface NotebookAIProps {
  noteContent: string;
  noteTitle: string;
  onInsert: (text: string) => void;
  onClose: () => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

type AIAction = 'summarize' | 'expand' | 'simplify' | 'translate' | 'bullets' | 'questions' | 'chat';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const NotebookAI = ({ noteContent, noteTitle, onInsert, onClose }: NotebookAIProps) => {
  const [activeAction, setActiveAction] = useState<AIAction | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [translateLang, setTranslateLang] = useState('Spanish');

  const aiActions = [
    { id: 'summarize', label: 'Summarize', icon: FileText, description: 'Create a concise summary' },
    { id: 'expand', label: 'Expand', icon: Sparkles, description: 'Add more detail and depth' },
    { id: 'simplify', label: 'Simplify', icon: Zap, description: 'Make it easier to understand' },
    { id: 'bullets', label: 'Key Points', icon: ListChecks, description: 'Extract main takeaways' },
    { id: 'questions', label: 'Study Questions', icon: Lightbulb, description: 'Generate quiz questions' },
    { id: 'translate', label: 'Translate', icon: Languages, description: 'Convert to another language' },
  ];

  const executeAction = async (action: AIAction) => {
    if (!noteContent.trim()) {
      toast.error('Add some content to your note first');
      return;
    }

    setActiveAction(action);
    setLoading(true);
    setResult('');

    const prompts: Record<AIAction, string> = {
      summarize: `Summarize the following note in a clear, concise way. Keep the main points and key insights:\n\nTitle: ${noteTitle}\n\nContent:\n${noteContent}`,
      expand: `Expand on the following note with more detail, examples, and depth. Maintain the original tone and structure:\n\nTitle: ${noteTitle}\n\nContent:\n${noteContent}`,
      simplify: `Rewrite the following note in simpler, more accessible language. Keep the meaning but make it easier to understand:\n\nTitle: ${noteTitle}\n\nContent:\n${noteContent}`,
      bullets: `Extract the key points from this note as a bulleted list. Focus on the main takeaways:\n\nTitle: ${noteTitle}\n\nContent:\n${noteContent}`,
      questions: `Generate 5 study/quiz questions based on this note. Include a mix of comprehension and application questions:\n\nTitle: ${noteTitle}\n\nContent:\n${noteContent}`,
      translate: `Translate the following note to ${translateLang}. Maintain the formatting and meaning:\n\nTitle: ${noteTitle}\n\nContent:\n${noteContent}`,
      chat: ''
    };

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompts[action] }]
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to get AI response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResult = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const parsed = JSON.parse(line.slice(6));
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullResult += content;
                setResult(fullResult);
              }
            } catch {}
          }
        }
      }
    } catch (error) {
      console.error('AI error:', error);
      toast.error('Failed to process with AI');
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;

    const userMessage: Message = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setLoading(true);

    const systemContext = `You are an AI assistant helping with a note titled "${noteTitle}". Here's the note content for context:\n\n${noteContent}\n\nAnswer questions about this note helpfully and concisely.`;

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemContext },
            ...chatMessages,
            userMessage
          ]
        }),
      });

      if (!response.ok || !response.body) throw new Error('Chat failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      setChatMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const parsed = JSON.parse(line.slice(6));
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                setChatMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = { role: 'assistant', content: assistantContent };
                  return newMessages;
                });
              }
            } catch {}
          }
        }
      }
    } catch (error) {
      toast.error('Failed to chat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="h-full flex flex-col bg-card border-l border-border"
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet to-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">NotebookLM AI</h3>
            <p className="text-xs text-muted-foreground">Powered by Kiden Intelligence</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Actions Grid */}
      {!activeAction && (
        <div className="p-4 space-y-4 overflow-auto">
          <div className="grid grid-cols-2 gap-2">
            {aiActions.map((action) => (
              <motion.button
                key={action.id}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => executeAction(action.id as AIAction)}
                className="p-4 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/50 text-left transition-colors group"
              >
                <action.icon className="w-5 h-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-medium text-foreground text-sm">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </motion.button>
            ))}
          </div>

          {/* Chat with note */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">Chat with your note</span>
            </div>
            
            <div className="space-y-3 max-h-60 overflow-auto mb-3">
              {chatMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-3 rounded-xl text-sm",
                    msg.role === 'user' 
                      ? "bg-primary text-primary-foreground ml-8" 
                      : "bg-secondary text-foreground mr-8"
                  )}
                >
                  {msg.content}
                </motion.div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about your note..."
                className="flex-1 bg-secondary border-none text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleChat()}
              />
              <Button
                size="icon"
                onClick={handleChat}
                disabled={loading || !chatInput.trim()}
                className="bg-primary hover:bg-primary/90"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Result View */}
      {activeAction && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
              <span className="font-medium text-sm capitalize">{activeAction}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setActiveAction(null)}>
              <ArrowRight className="w-4 h-4 mr-1" />
              Back
            </Button>
          </div>

          <div className="flex-1 overflow-auto p-4">
            <div className="prose prose-invert prose-sm max-w-none">
              <p className="whitespace-pre-wrap text-foreground">{result}</p>
            </div>
          </div>

          {result && !loading && (
            <div className="p-4 border-t border-border">
              <Button
                onClick={() => {
                  onInsert(result);
                  setActiveAction(null);
                  setResult('');
                }}
                className="w-full bg-primary hover:bg-primary/90"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Insert into Note
              </Button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default NotebookAI;
