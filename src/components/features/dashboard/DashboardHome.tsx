import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Pencil,
  FileText,
  MessageSquare,
  Table2,
  Clock,
  ArrowRight,
  BookOpen,
  Bookmark,
  Plus,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ActiveView, Profile } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { fetchRecentActivities, ActivityLog } from '@/services/activityService';

interface DashboardHomeProps {
  onViewChange?: (view: ActiveView) => void;
  profile?: Profile | null;
}

const ACTION_CARDS = [
  { icon: Pencil,       title: 'Capture an idea',  subtitle: 'Jot a quick thought or note',    view: 'notes'  as ActiveView },
  { icon: FileText,     title: 'Start a document',  subtitle: 'Write something longer',          view: 'notes'  as ActiveView },
  { icon: MessageSquare,title: 'Start a chat',      subtitle: 'Think it through with AI',        view: 'chat'   as ActiveView },
  { icon: Table2,       title: 'Start a table',     subtitle: 'Track anything in rows',          view: 'kanban' as ActiveView },
];

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

interface RecentRow { id: string; title: string; Icon: typeof MessageSquare; time: string; view: ActiveView; }

const PLACEHOLDER_ROWS: RecentRow[] = [
  { id: 'p1', title: 'Untitled',                         Icon: FileText,       time: 'just now', view: 'notes' },
  { id: 'p2', title: 'Summarize And Explain',             Icon: MessageSquare,  time: 'Aug 20',   view: 'chat'  },
  { id: 'p3', title: 'Book Summary Request',              Icon: MessageSquare,  time: 'Aug 18',   view: 'chat'  },
  { id: 'p4', title: 'tell me the brief about the doc',   Icon: MessageSquare,  time: 'May 14',   view: 'chat'  },
  { id: 'p5', title: 'Now chat',                          Icon: MessageSquare,  time: 'May 14',   view: 'chat'  },
];

export default function DashboardHome({ onViewChange, profile }: DashboardHomeProps) {
  const { user } = useAuth();
  const [recentRows, setRecentRows] = useState<RecentRow[]>([]);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [convRes, notesRes] = await Promise.all([
        supabase.from('conversations').select('id,title,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
        supabase.from('notes').select('id,title,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
      ]);

      const rows: RecentRow[] = [];
      (convRes.data ?? []).forEach((c: any) => rows.push({
        id: c.id, title: c.title || 'Untitled', Icon: MessageSquare,
        time: formatDistanceToNow(new Date(c.created_at), { addSuffix: true }), view: 'chat',
      }));
      (notesRes.data ?? []).forEach((n: any) => rows.push({
        id: n.id, title: n.title || 'Untitled', Icon: FileText,
        time: formatDistanceToNow(new Date(n.created_at), { addSuffix: true }), view: 'notes',
      }));
      setRecentRows(rows.slice(0, 5));
    } catch { /* silent */ }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const displayRows = recentRows.length > 0 ? recentRows : PLACEHOLDER_ROWS;

  const name =
    profile?.display_name?.split(' ')[0] ||
    profile?.full_name?.split(' ')[0] ||
    user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'there';

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#181818] scrollbar-hide">
      <div className="w-full max-w-[980px] mx-auto px-6 pt-7 pb-20">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex items-center gap-2.5 mb-6"
        >
          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <h1 className="text-xl font-semibold text-[#f2f2f2] tracking-tight">
            Let's create
          </h1>
        </motion.div>

        {/* ── 4 Action Cards with Icon Badges ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-8">
          {ACTION_CARDS.map((card, i) => (
            <motion.button
              key={card.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.03 * i, duration: 0.25 }}
              onClick={() => onViewChange?.(card.view)}
              className="flex flex-col justify-between items-start p-5 rounded-2xl bg-[#202020] border border-[#2e2e2e] hover:bg-[#242424] hover:border-[#383838] transition-all cursor-pointer text-left group min-h-[128px] shadow-sm"
            >
              {/* Icon badge container */}
              <div className="w-9 h-9 rounded-xl bg-[#242424] border border-[#333333] flex items-center justify-center group-hover:bg-[#2a2a2a] group-hover:border-[#3d3d3d] transition-colors shrink-0">
                <card.icon className="w-4 h-4 text-[#a6a6a6] group-hover:text-[#f2f2f2] transition-colors" />
              </div>
              <div className="mt-4">
                <p className="text-[13.5px] font-semibold text-[#f2f2f2] leading-snug">
                  {card.title}
                </p>
                <p className="text-[11.5px] text-[#a6a6a6] mt-1 leading-tight group-hover:text-[#c0c0c0] transition-colors">
                  {card.subtitle}
                </p>
              </div>
            </motion.button>
          ))}
        </div>

        {/* ── Recents ── */}
        <motion.section
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.25 }}
          className="mb-7"
        >
          <h2 className="text-[13px] font-semibold text-[#a6a6a6] mb-3">Recents</h2>
          <div className="rounded-2xl border border-[#2e2e2e] bg-[#202020] overflow-hidden shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 min-h-[175px]">

              {/* Left panel */}
              <div className="p-6 border-b md:border-b-0 md:border-r border-[#2a2a2a] flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#242424] border border-[#333333] flex items-center justify-center">
                    <Clock className="w-4 h-4 text-[#a6a6a6]" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-[#f2f2f2] leading-snug">Pick up where you left off</p>
                    <p className="text-[12px] text-[#a6a6a6] mt-1.5 leading-relaxed">
                      Jump back into a recent chat or item — everything you've touched lately, in one list.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onViewChange?.('chat')}
                  className="flex items-center gap-1.5 text-[12.5px] font-medium text-[#a6a6a6] hover:text-[#f2f2f2] transition-colors w-fit group cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  View recents
                </button>
              </div>

              {/* Right panel — list */}
              <div className="flex flex-col divide-y divide-[#2a2a2a] bg-[#202020]">
                {displayRows.map((row, i) => (
                  <motion.button
                    key={row.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.05 + 0.03 * i }}
                    onClick={() => onViewChange?.(row.view)}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-[#242424] transition-colors text-left group cursor-pointer"
                  >
                    <row.Icon className="w-4 h-4 text-[#777777] shrink-0 group-hover:text-[#a6a6a6] transition-colors" />
                    <span className="flex-1 text-[13px] font-medium text-[#f2f2f2] truncate transition-colors">
                      {row.title}
                    </span>
                    <span className="text-[11.5px] text-[#777777] shrink-0 font-normal">{row.time}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── Reading ── */}
        <motion.section
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.25 }}
          className="mb-7"
        >
          <h2 className="text-[13px] font-semibold text-[#a6a6a6] mb-3">Reading</h2>
          <div className="rounded-2xl border border-[#2e2e2e] bg-[#202020] p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="flex flex-col gap-4">
                <div className="w-9 h-9 rounded-xl bg-[#242424] border border-[#333333] flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-[#a6a6a6]" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-[#f2f2f2]">Your reading queue</p>
                  <p className="text-[12px] text-[#a6a6a6] mt-1.5 leading-relaxed">
                    Flag anything "Read later" and pick up right where you left off on any device.
                  </p>
                </div>
                <button
                  onClick={() => onViewChange?.('files')}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-[#333333] bg-[#242424] hover:bg-[#292929] transition-colors text-[12.5px] font-medium text-[#f2f2f2] w-fit cursor-pointer"
                >
                  <Bookmark className="w-3.5 h-3.5 text-[#a6a6a6]" />
                  Save something to read
                </button>
              </div>
              <p className="text-[12.5px] text-[#777777] pt-1 leading-relaxed md:text-right">
                Continue reading articles, videos, and PDFs here.
              </p>
            </div>
          </div>
        </motion.section>

        {/* ── My Lists ── */}
        <motion.section
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.25 }}
        >
          <h2 className="text-[13px] font-semibold text-[#a6a6a6] mb-3">My lists</h2>
          <div className="rounded-2xl border border-[#2e2e2e] bg-[#202020] py-10 px-6 flex flex-col items-center gap-4 shadow-sm">
            <p className="text-[13px] text-[#a6a6a6] text-center max-w-sm leading-relaxed">
              Group the creators worth watching into a list to see their latest posts here.
            </p>
            <button
              onClick={() => onViewChange?.('notes')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#242424] border border-[#333333] hover:bg-[#292929] transition-all text-[12.5px] font-medium text-[#f2f2f2] cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-[#a6a6a6]" />
              Create a list
            </button>
          </div>
        </motion.section>

      </div>
    </div>
  );
}
