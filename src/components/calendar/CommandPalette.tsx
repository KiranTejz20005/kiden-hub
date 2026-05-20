import React, { useEffect, useState } from "react";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Calendar, 
  Plus, 
  Clock, 
  ChevronRight, 
  Settings,
  LayoutGrid,
  CalendarDays,
  CalendarRange,
  Zap
} from "lucide-react";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useNavigate } from "react-router-dom";

export const CalendarCommandPalette = () => {
  const [open, setOpen] = useState(false);
  const { setView, setCurrentDate, setCreateModalOpen } = useCalendarStore();
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Only run if the calendar view container is visible (not hidden via class)
      const container = document.getElementById("calendar-view-container");
      if (!container || container.classList.contains("hidden") || container.closest(".hidden")) {
        return;
      }

      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      
      // Shortcuts for views
      if (!open) {
        if (e.key === "d") setView("day");
        if (e.key === "w") setView("week");
        if (e.key === "m") setView("month");
        if (e.key === "a") setView("agenda");
        if (e.key === "c") setCreateModalOpen(true);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, setView, setCreateModalOpen]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="relative w-full max-w-[640px] bg-[#0c0c0c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            <Command className="flex flex-col h-full">
              <div className="flex items-center px-4 border-b border-white/5">
                <Search className="w-5 h-5 text-white/20" />
                <Command.Input
                  autoFocus
                  placeholder="Type a command or 'Meet with...'"
                  onValueChange={(v) => {
                    if (v.toLowerCase().startsWith('meet') || v.toLowerCase().startsWith('schedule')) {
                       // Basic NLP simulation
                       console.log("Parsing NLP:", v);
                    }
                  }}
                  className="w-full h-14 bg-transparent outline-none px-4 text-sm text-white placeholder:text-white/20"
                />
              </div>

              <Command.List className="max-h-[400px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
                <Command.Empty className="px-4 py-8 text-center text-white/20 text-sm">
                  No results found.
                </Command.Empty>

                <Command.Group heading="Navigation" className="px-2 py-2 text-[10px] font-black uppercase tracking-widest text-white/20">
                  <Item onSelect={() => { setView("day"); setOpen(false); }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center"><CalendarDays className="w-4 h-4" /></div>
                      <span>Day View</span>
                    </div>
                    <kbd className="text-[10px] font-bold text-white/20">D</kbd>
                  </Item>
                  <Item onSelect={() => { setView("week"); setOpen(false); }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center"><CalendarRange className="w-4 h-4" /></div>
                      <span>Week View</span>
                    </div>
                    <kbd className="text-[10px] font-bold text-white/20">W</kbd>
                  </Item>
                  <Item onSelect={() => { setView("month"); setOpen(false); }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center"><LayoutGrid className="w-4 h-4" /></div>
                      <span>Month View</span>
                    </div>
                    <kbd className="text-[10px] font-bold text-white/20">M</kbd>
                  </Item>
                  <Item onSelect={() => { setView("agenda"); setOpen(false); }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center"><CalendarRange className="w-4 h-4 text-emerald-500" /></div>
                      <span>Agenda View</span>
                    </div>
                    <kbd className="text-[10px] font-bold text-white/20">A</kbd>
                  </Item>
                </Command.Group>

                <Command.Group heading="Actions" className="px-2 py-2 text-[10px] font-black uppercase tracking-widest text-white/20">
                  <Item onSelect={() => { setCreateModalOpen(true); setOpen(false); }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500"><Plus className="w-4 h-4" /></div>
                      <span>Create New Event</span>
                    </div>
                    <kbd className="text-[10px] font-bold text-white/20">C</kbd>
                  </Item>
                  <Item onSelect={() => { setCurrentDate(new Date()); setOpen(false); }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center"><Zap className="w-4 h-4" /></div>
                      <span>Go to Today</span>
                    </div>
                    <kbd className="text-[10px] font-bold text-white/20">T</kbd>
                  </Item>
                </Command.Group>
              </Command.List>

              <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-4 text-[11px] text-white/20 font-medium">
                  <div className="flex items-center gap-1.5"><kbd className="bg-white/5 px-1.5 py-0.5 rounded border border-white/10">↑↓</kbd> Navigate</div>
                  <div className="flex items-center gap-1.5"><kbd className="bg-white/5 px-1.5 py-0.5 rounded border border-white/10">Enter</kbd> Select</div>
                  <div className="flex items-center gap-1.5"><kbd className="bg-white/5 px-1.5 py-0.5 rounded border border-white/10">Esc</kbd> Close</div>
                </div>
                <div className="text-[11px] font-bold text-emerald-500/40 uppercase tracking-widest">Kiden Command</div>
              </div>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const Item = ({ children, onSelect }: { children: React.ReactNode; onSelect: () => void }) => (
  <Command.Item
    onSelect={onSelect}
    className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/5 aria-selected:bg-white/5 transition-all text-sm text-white/60 aria-selected:text-white"
  >
    {children}
  </Command.Item>
);
