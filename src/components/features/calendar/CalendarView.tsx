import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw,
  CheckCircle2,
  Trash2,
  Clock,
  MapPin,
  Menu,
  X,
  Video,
  Globe,
  Link2,
  Info
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  subDays,
  eachDayOfInterval,
  isToday,
  addWeeks,
  subWeeks,
  startOfDay,
  addHours,
  setHours,
  setMinutes,
  differenceInMinutes
} from 'date-fns';
import { 
  DndContext, 
  DragEndEvent, 
  useSensor, 
  useSensors,
  PointerSensor
} from '@dnd-kit/core';
import { restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { googleCalendarService } from '@/services/googleCalendarService';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCalendarStore } from '@/store/useCalendarStore';
import { CalendarCommandPalette } from '@/components/calendar/CommandPalette';
import { DraggableEvent } from '@/components/calendar/DraggableEvent';
import { AIProductivityWidget } from '@/components/calendar/AIWidget';

const CalendarView = () => {
  const { user } = useAuth();
  const { 
    view, setView, 
    currentDate, setCurrentDate, 
    selectedEventId, setSelectedEventId,
    isSidebarOpen, toggleSidebar,
    isCreateModalOpen, setCreateModalOpen
  } = useCalendarStore();

  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [googleEmail, setGoogleEmail] = useState<string>('');
  const [newEvent, setNewEventLocal] = useState({ title: '', start: new Date(), end: addHours(new Date(), 1) });
  
  // Drag-to-Create State
  const [isDraggingNew, setIsDraggingNew] = useState(false);
  const [dragStart, setDragStart] = useState<{ day: Date, hour: number, minutes: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ hour: number, minutes: number } | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const selectedEvent = useMemo(() => 
    events.find(e => e.id === selectedEventId), 
  [events, selectedEventId]);

  useEffect(() => {
    if (user) {
      checkConnection();
    }
  }, [user, currentDate]);

  const checkConnection = async () => {
    try {
      const status = await googleCalendarService.getConnectionStatus(user!.id);
      const connected = !!status;
      setIsConnected(connected);
      if (status?.email) {
        setGoogleEmail(status.email);
        // Automatically sync in background to fetch latest events
        triggerBackgroundSync();
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    } finally {
      fetchEvents();
    }
  };

  const triggerBackgroundSync = async () => {
    try {
      // Run background sync without blocking UI
      await supabase.functions.invoke('google-calendar-sync', { body: { action: 'sync' } });
      // Fetch fresh events
      const start = startOfWeek(subWeeks(currentDate, 2));
      const end = endOfWeek(addWeeks(currentDate, 4));
      const data = await googleCalendarService.getEvents(user!.id, start, end);
      setEvents(data);
    } catch (err) {
      console.error('Background sync failed:', err);
    }
  };

  const fetchEvents = async () => {
    if (!user) return;
    setIsLoading(true);
    // Fetch a broader window for day/week/month/agenda views
    const start = startOfWeek(subWeeks(currentDate, 2));
    const end = endOfWeek(addWeeks(currentDate, 4));
    try {
      const data = await googleCalendarService.getEvents(user.id, start, end);
      setEvents(data);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    if (!isConnected) {
      toast.info("Connect to Google Calendar to sync");
      return;
    }
    setIsSyncing(true);
    try {
      const { error } = await supabase.functions.invoke('google-calendar-sync', { body: { action: 'sync' } });
      if (error) throw error;
      await fetchEvents();
      toast.success('Calendar synced successfully');
    } catch (error: any) {
      toast.error('Sync failed or not supported in local testing');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;
    try {
      await googleCalendarService.disconnect(user.id);
      setIsConnected(false);
      setGoogleEmail('');
      toast.success("Disconnected Google Calendar");
      fetchEvents();
    } catch (error) {
      toast.error("Failed to disconnect");
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('calendar_events' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Event deleted");
      setEvents(events.filter(e => e.id !== id));
      setSelectedEventId(null);
    } catch (error) {
      toast.error("Failed to delete event");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, delta } = event;
    if (!active) return;

    const draggedEvent = events.find(e => e.id === active.id);
    if (!draggedEvent) return;

    // Calculate new time
    // Each 80px is 1 hour
    const minutesDelta = Math.round((delta.y / 80) * 60);
    const newStart = new Date(new Date(draggedEvent.start_time).getTime() + minutesDelta * 60000);
    const duration = differenceInMinutes(new Date(draggedEvent.end_time), new Date(draggedEvent.start_time));
    const newEnd = new Date(newStart.getTime() + duration * 60000);

    // Optimistic Update
    const originalEvents = [...events];
    setEvents(events.map(e => e.id === draggedEvent.id ? { ...e, start_time: newStart.toISOString(), end_time: newEnd.toISOString() } : e));

    try {
      const { error } = await supabase
        .from('calendar_events' as any)
        .update({ start_time: newStart.toISOString(), end_time: newEnd.toISOString() })
        .eq('id', draggedEvent.id);

      if (error) throw error;
      toast.success("Event rescheduled");
    } catch (error) {
      setEvents(originalEvents);
      toast.error("Failed to reschedule");
    }
  };

  const handleMouseDown = (day: Date, hour: number, e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDraggingNew(true);
    setDragStart({ day, hour, minutes: 0 });
    setDragEnd({ hour: hour + 1, minutes: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingNew || !dragStart) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const totalMinutes = Math.floor((y / 80) * 60);
    const hour = Math.floor(totalMinutes / 60);
    const minutes = Math.floor((totalMinutes % 60) / 15) * 15; // Snap to 15 min

    setDragEnd({ hour, minutes });
  };

  const handleMouseUp = () => {
    if (!isDraggingNew || !dragStart || !dragEnd) return;
    
    // Correct date-fns parameter ordering: setMinutes(date, minutes), setHours(date, hours)
    const start = setHours(setMinutes(startOfDay(dragStart.day), dragStart.minutes), dragStart.hour);
    let endHour = dragEnd.hour;
    let endMin = dragEnd.minutes;
    
    // Ensure end is after start
    if (endHour < dragStart.hour || (endHour === dragStart.hour && endMin <= dragStart.minutes)) {
       endHour = dragStart.hour;
       endMin = dragStart.minutes + 15;
    }

    const end = setHours(setMinutes(startOfDay(dragStart.day), endMin), endHour);
    
    setNewEventLocal({ title: '', start, end });
    setIsDraggingNew(false);
    setDragStart(null);
    setDragEnd(null);
    setCreateModalOpen(true);
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title) return toast.error("Enter a title");
    try {
      const { error } = await supabase.from('calendar_events' as any).insert({
        user_id: user?.id, title: newEvent.title,
        start_time: newEvent.start.toISOString(), end_time: newEvent.end.toISOString(),
        source: 'manual'
      });
      if (error) throw error;
      toast.success("Event created successfully");
      setCreateModalOpen(false);
      fetchEvents();
    } catch (error) {
      toast.error("Failed to create event");
    }
  };

  // --- Date Logic ---
  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const monthRows = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    const days = eachDayOfInterval({ start, end });
    const rows = [];
    for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7));
    return rows;
  }, [currentDate]);

  const navigateDate = (direction: 'prev' | 'next') => {
    if (view === 'month') setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    else setCurrentDate(direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1));
  };

  return (
    <div id="calendar-view-container" className="flex-1 flex flex-col bg-[#050505] overflow-hidden text-white font-sans h-full">
      <CalendarCommandPalette />
      
      {/* Header */}
      <header className="h-14 shrink-0 border-b border-white/[0.08] flex items-center justify-between px-4 bg-black/40 backdrop-blur-xl z-30">
        <div className="flex items-center gap-4">
          <button onClick={toggleSidebar} className="p-1.5 hover:bg-white/5 rounded-md text-white/40"><Menu className="w-4.5 h-4.5" /></button>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-tight">{format(currentDate, 'MMMM yyyy')}</h2>
            <div className="flex items-center gap-0.5 bg-white/5 rounded-md p-0.5 border border-white/10 ml-2">
              <button onClick={() => navigateDate('prev')} className="p-1 hover:bg-white/10 rounded"><ChevronLeft className="w-3.5 h-3.5" /></button>
              <button onClick={() => setCurrentDate(new Date())} className="px-2 text-[11px] font-bold text-white/80">Today</button>
              <button onClick={() => navigateDate('next')} className="p-1 hover:bg-white/10 rounded"><ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10">
            {['month', 'week', 'day', 'agenda'].map((t) => (
              <button key={t} onClick={() => setView(t as any)} className={cn("px-3 py-1 rounded-md text-[11px] font-bold transition-all uppercase tracking-wider", view === t ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white")}>
                {t}
              </button>
            ))}
          </div>
          <button onClick={handleSync} disabled={!isConnected} className={cn("w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-white/40", !isConnected && "opacity-20 cursor-not-allowed")} title="Sync Google Calendar"><RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} /></button>
          <Button onClick={() => setCreateModalOpen(true)} className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold px-3 shadow-lg shadow-emerald-600/10">New</Button>
        </div>
      </header>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd} modifiers={[restrictToFirstScrollableAncestor]}>
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <AnimatePresence mode="wait">
            {isSidebarOpen && (
              <motion.aside 
                initial={{ width: 0, opacity: 0 }} 
                animate={{ width: 260, opacity: 1 }} 
                exit={{ width: 0, opacity: 0 }} 
                className="border-r border-white/[0.08] bg-black/20 shrink-0 overflow-hidden"
              >
                <div className="w-[260px] p-4 space-y-6 h-full custom-scrollbar flex flex-col justify-between">
                  <div className="space-y-6">
                    {/* Google Calendar Connection Status Panel */}
                    <div className="space-y-3">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-2 flex items-center gap-1.5">
                        <Link2 className="w-3.5 h-3.5" /> Connections
                      </h3>
                      {isConnected ? (
                        <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 space-y-3 text-left relative overflow-hidden">
                          <div>
                            <p className="text-[11px] font-bold text-white flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Google Connected
                            </p>
                            <p className="text-[10px] text-white/40 truncate mt-1">{googleEmail}</p>
                          </div>
                          <button 
                            onClick={handleDisconnect}
                            className="w-full py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white/70 transition-all border border-white/10 text-center"
                          >
                            Disconnect account
                          </button>
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3 text-left">
                          <div>
                            <p className="text-[11px] font-bold text-white/80">Connect Google Calendar</p>
                            <p className="text-[10px] text-white/30 mt-1 leading-normal">Import meetings & sync schedules automatically in real-time.</p>
                          </div>
                          <button 
                            onClick={() => window.location.href = googleCalendarService.getConnectUrl()}
                            className="w-full py-2 rounded-lg bg-white text-black hover:bg-white/90 text-[10px] font-black uppercase tracking-wider text-center transition-all shadow-lg"
                          >
                            Link Account
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-2">Calendars</h3>
                      <div className="space-y-0.5">
                        {[{ name: 'Personal (Local)', color: 'emerald' }, { name: 'Work Events', color: 'blue' }].map((cal) => (
                          <div key={cal.name} className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-white/5 group text-left">
                            <div className={cn("w-2.5 h-2.5 rounded-full", cal.color === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500')} />
                            <span className="text-[13px] text-white/60 group-hover:text-white">{cal.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <AIProductivityWidget />
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center gap-3">
                    <Globe className="w-4 h-4 text-white/30 shrink-0" />
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Timezone</p>
                      <p className="text-[11px] text-white/50 font-bold mt-0.5">GMT+5:30 (India Standard Time)</p>
                    </div>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Main workspace with framer-motion view transitions */}
          <main className="flex-1 flex flex-col relative overflow-hidden bg-[#080808]" onClick={() => setSelectedEventId(null)}>
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center bg-transparent">
                <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Loading events...</p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {/* ── DAY VIEW ── */}
                {view === 'day' && (
                  <motion.div 
                    key="day-view"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.15 }}
                    className="flex-1 flex flex-col overflow-hidden"
                  >
                    <div className="grid grid-cols-[65px_1fr] border-b border-white/[0.1] bg-black/40">
                      <div className="border-r border-white/[0.1] flex items-center justify-center"><Clock className="w-3.5 h-3.5 text-white/20" /></div>
                      <div className="py-4 px-6 text-left">
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">{format(currentDate, 'EEEE')}</p>
                        <p className={cn("text-lg font-bold tabular-nums inline-flex items-center justify-center w-9 h-9 rounded-xl transition-all", isToday(currentDate) ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-white/70 hover:text-white")}>{format(currentDate, 'd')}</p>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                      <div className="grid grid-cols-[65px_1fr] min-h-full">
                        <div className="border-r border-white/[0.1] bg-black/40">
                          {hours.map(h => (
                            <div key={h} className="h-20 flex items-start justify-center pt-2">
                              <span className="text-[11px] font-bold text-white/30 tracking-tight uppercase">{h === 0 ? '' : format(setHours(new Date(), h), 'ha')}</span>
                            </div>
                          ))}
                        </div>
                        <div className="relative h-[1920px]" onMouseMove={handleMouseMove} onMouseLeave={handleMouseUp} onMouseUp={handleMouseUp}>
                          <div className="absolute inset-0 pointer-events-none">
                            {hours.map(h => <div key={h} className="h-20 border-b border-white/[0.1]" />)}
                          </div>
                          
                          {hours.map(h => (
                            <div 
                              key={h} 
                              onMouseDown={(e) => handleMouseDown(currentDate, h, e)}
                              className="absolute left-0 right-0 h-20 hover:bg-white/[0.04] cursor-pointer transition-colors z-0 border-b border-white/[0.02]" 
                              style={{ top: `${h * 80}px` }} 
                            />
                          ))}

                          {/* Ghost Event while dragging */}
                          {isDraggingNew && dragStart && isSameDay(dragStart.day, currentDate) && dragEnd && (
                            <div 
                              className="absolute w-[95%] left-[2.5%] bg-emerald-500/30 border-2 border-emerald-500 rounded-md z-20 pointer-events-none flex flex-col p-3"
                              style={{
                                top: `${(dragStart.hour * 60 + dragStart.minutes) * (80 / 60)}px`,
                                height: `${Math.max(15, (dragEnd.hour * 60 + dragEnd.minutes) - (dragStart.hour * 60 + dragStart.minutes)) * (80 / 60)}px`
                              }}
                            >
                              <span className="text-[11px] font-bold text-white">New Event</span>
                              <span className="text-[10px] text-white/60 mt-0.5">
                                {format(setHours(setMinutes(new Date(), dragStart.minutes), dragStart.hour), 'h:mm a')} - {format(setHours(setMinutes(new Date(), dragEnd.minutes), dragEnd.hour), 'h:mm a')}
                              </span>
                            </div>
                          )}

                          {isToday(currentDate) && (
                            <div className="absolute left-0 right-0 h-0.5 bg-emerald-500 z-10 flex items-center" style={{ top: `${(new Date().getHours() * 60 + new Date().getMinutes()) * (80 / 60)}px` }}>
                              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 -ml-1.25 shadow-lg shadow-emerald-500/50 border-2 border-[#080808]" />
                            </div>
                          )}

                          {events
                            .filter(event => isSameDay(new Date(event.start_time), currentDate))
                            .map((event) => (
                              <div 
                                key={event.id} 
                                className="absolute z-10 w-[95%] left-[2.5%]"
                                style={{ 
                                  top: `${(new Date(event.start_time).getHours() * 60 + new Date(event.start_time).getMinutes()) * (80 / 60)}px`,
                                  height: `${((new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / (1000 * 60)) * (80 / 60)}px`
                                }}
                              >
                                <DraggableEvent 
                                  event={event} 
                                  view={view} 
                                  onClick={() => setSelectedEventId(event.id)} 
                                />
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── WEEK VIEW ── */}
                {view === 'week' && (
                  <motion.div 
                    key="week-view"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.15 }}
                    className="flex-1 flex flex-col overflow-hidden"
                  >
                    <div className="grid grid-cols-[65px_1fr] border-b border-white/[0.1] bg-black/40">
                      <div className="border-r border-white/[0.1] flex items-center justify-center"><Clock className="w-3.5 h-3.5 text-white/20" /></div>
                      <div className="grid grid-cols-7">
                        {weekDays.map((day) => (
                          <div key={day.toString()} className="py-4 text-center border-r border-white/[0.05] last:border-0">
                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1.5">{format(day, 'EEE')}</p>
                            <p className={cn("text-lg font-bold tabular-nums inline-flex items-center justify-center w-9 h-9 rounded-xl transition-all", isToday(day) ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-white/70 hover:text-white")}>{format(day, 'd')}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                      <div className="grid grid-cols-[65px_1fr] min-h-full">
                        <div className="border-r border-white/[0.1] bg-black/40">
                          {hours.map(h => (
                            <div key={h} className="h-20 flex items-start justify-center pt-2">
                              <span className="text-[11px] font-bold text-white/30 tracking-tight uppercase">{h === 0 ? '' : format(setHours(new Date(), h), 'ha')}</span>
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 relative" onMouseLeave={handleMouseUp}>
                          <div className="absolute inset-0 pointer-events-none">
                            {hours.map(h => <div key={h} className="h-20 border-b border-white/[0.1]" />)}
                          </div>
                          {weekDays.map(day => (
                            <div 
                              key={day.toString()} 
                              className="relative border-r border-white/[0.05] last:border-0 h-[1920px]"
                              onMouseMove={handleMouseMove}
                              onMouseUp={handleMouseUp}
                            >
                              {hours.map(h => (
                                <div 
                                  key={h} 
                                  onMouseDown={(e) => handleMouseDown(day, h, e)}
                                  className="absolute left-0 right-0 h-20 hover:bg-white/[0.04] cursor-pointer transition-colors z-0 border-b border-white/[0.02]" 
                                  style={{ top: `${h * 80}px` }} 
                                />
                              ))}
                              
                              {/* Ghost Event while dragging */}
                              {isDraggingNew && dragStart && isSameDay(dragStart.day, day) && dragEnd && (
                                <div 
                                  className="absolute w-[95%] left-[2.5%] bg-emerald-500/30 border-2 border-emerald-500 rounded-md z-20 pointer-events-none flex flex-col p-2"
                                  style={{
                                    top: `${(dragStart.hour * 60 + dragStart.minutes) * (80 / 60)}px`,
                                    height: `${Math.max(15, (dragEnd.hour * 60 + dragEnd.minutes) - (dragStart.hour * 60 + dragStart.minutes)) * (80 / 60)}px`
                                  }}
                                >
                                  <span className="text-[10px] font-bold text-white">New Event</span>
                                  <span className="text-[9px] text-white/60">
                                    {format(setHours(setMinutes(new Date(), dragStart.minutes), dragStart.hour), 'h:mm a')} - {format(setHours(setMinutes(new Date(), dragEnd.minutes), dragEnd.hour), 'h:mm a')}
                                  </span>
                                </div>
                              )}

                              {isToday(day) && (
                                <div className="absolute left-0 right-0 h-0.5 bg-emerald-500 z-10 flex items-center" style={{ top: `${(new Date().getHours() * 60 + new Date().getMinutes()) * (80 / 60)}px` }}>
                                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 -ml-1.25 shadow-lg shadow-emerald-500/50 border-2 border-[#080808]" />
                                </div>
                              )}
                              {events
                                .filter(event => isSameDay(new Date(event.start_time), day))
                                .map((event, _index, dayEvents) => {
                                   const overlapping = dayEvents.filter(e => 
                                     (new Date(e.start_time) < new Date(event.end_time) && new Date(e.end_time) > new Date(event.start_time))
                                   );
                                   const width = 100 / (overlapping.length || 1);
                                   const left = overlapping.indexOf(event) * width;

                                   return (
                                     <div 
                                       key={event.id} 
                                       className="absolute z-10"
                                       style={{ 
                                         left: `${left}%`, 
                                         width: `${width}%`,
                                         top: `${(new Date(event.start_time).getHours() * 60 + new Date(event.start_time).getMinutes()) * (80 / 60)}px`,
                                         height: `${((new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / (1000 * 60)) * (80 / 60)}px`
                                       }}
                                     >
                                       <DraggableEvent 
                                         event={event} 
                                         view={view} 
                                         onClick={() => setSelectedEventId(event.id)} 
                                       />
                                     </div>
                                   );
                                 })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── MONTH VIEW ── */}
                {view === 'month' && (
                  <motion.div 
                    key="month-view"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.15 }}
                    className="flex-1 flex flex-col"
                  >
                    <div className="grid grid-cols-7 border-b border-white/[0.1] bg-black/40 py-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/20">{d}</div>)}
                    </div>
                    <div className="flex-1 grid grid-rows-5 overflow-hidden">
                      {monthRows.map((row, i) => (
                        <div key={i} className="grid grid-cols-7 border-b border-white/[0.05] last:border-0">
                          {row.map((day, j) => (
                            <div key={j} className={cn("min-h-0 border-r border-white/[0.05] last:border-0 p-2 transition-colors group", !isSameMonth(day, currentDate) ? "bg-black/40" : "hover:bg-white/[0.02]")}>
                              <div className="flex justify-between items-start mb-2">
                                <span className={cn("text-[11px] font-bold w-6.5 h-6.5 flex items-center justify-center rounded-lg", isToday(day) ? "bg-emerald-500 text-black" : isSameMonth(day, currentDate) ? "text-white/50" : "text-white/10")}>{format(day, 'd')}</span>
                              </div>
                              <div className="space-y-1">
                                {events.filter(e => isSameDay(new Date(e.start_time), day)).slice(0, 4).map(event => (
                                  <div key={event.id} className="h-6">
                                    <DraggableEvent event={event} view="month" onClick={() => setSelectedEventId(event.id)} />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* ── AGENDA VIEW ── */}
                {view === 'agenda' && (
                  <motion.div 
                    key="agenda-view"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.15 }}
                    className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-8"
                  >
                    <div className="max-w-2xl mx-auto space-y-6">
                      <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                        <h3 className="text-sm font-bold tracking-tight text-white/50">UPCOMING EVENTS</h3>
                        <span className="text-xs text-white/30">{events.length} total events in range</span>
                      </div>
                      
                      {events.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                          <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-white/20">
                            <Info className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white/60">No events scheduled</p>
                            <p className="text-xs text-white/30 mt-1">Get started by creating a new event manually or syncing Google Calendar.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {Array.from(new Set(events.map(e => format(new Date(e.start_time), 'yyyy-MM-dd'))))
                            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
                            .map(dayStr => {
                              const dayEvents = events.filter(e => format(new Date(e.start_time), 'yyyy-MM-dd') === dayStr);
                              const dayObj = new Date(dayStr);
                              return (
                                <div key={dayStr} className="space-y-2.5">
                                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                    <span>{format(dayObj, 'EEEE, MMMM d, yyyy')}</span>
                                    {isToday(dayObj) && <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-black uppercase">Today</span>}
                                  </h4>
                                  <div className="space-y-2">
                                    {dayEvents.map(event => (
                                      <DraggableEvent key={event.id} event={event} view="agenda" onClick={() => setSelectedEventId(event.id)} />
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </main>

          {/* Right Inspector Drawer */}
          <AnimatePresence>
            {selectedEvent && (
              <motion.aside 
                initial={{ x: 400, opacity: 0 }} 
                animate={{ x: 0, opacity: 1 }} 
                exit={{ x: 400, opacity: 0 }} 
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="w-[400px] border-l border-white/[0.08] bg-black/60 backdrop-blur-3xl overflow-y-auto p-8 z-40"
              >
                <div className="flex justify-between items-start mb-10">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20"><CalendarIcon className="w-6 h-6 text-emerald-500" /></div>
                  <button onClick={() => setSelectedEventId(null)} className="p-2 hover:bg-white/10 rounded-full text-white/40"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-8">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight mb-3 leading-tight text-white">{selectedEvent.title}</h1>
                    <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-500 border border-emerald-500/20 tracking-widest uppercase"><CheckCircle2 className="w-3 h-3" />Confirmed</div>
                  </div>
                  <div className="space-y-6 py-8 border-y border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40"><Clock className="w-5 h-5" /></div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">Schedule</p>
                        <p className="text-sm font-semibold text-white/80">{format(new Date(selectedEvent.start_time), 'EEEE, MMMM d · h:mm a')}</p>
                      </div>
                    </div>
                    {selectedEvent.location && (
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40"><MapPin className="w-5 h-5" /></div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">Location</p>
                          <p className="text-sm font-semibold text-white/80">{selectedEvent.location}</p>
                        </div>
                      </div>
                    )}
                    <div className="pt-2 flex flex-col gap-3">
                      <Button className="w-full h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold gap-2 border border-white/10"><Video className="w-4 h-4" />Join Video Call</Button>
                      <Button onClick={() => handleDeleteEvent(selectedEvent.id)} className="w-full h-10 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold gap-2 border border-rose-500/20 group">
                        <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        Delete Event
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Notes</p>
                    <p className="text-sm text-white/50 leading-relaxed italic">{selectedEvent.description || 'No additional details.'}</p>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Modal to Create Events */}
          <AnimatePresence>
            {isCreateModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }} 
                  exit={{ scale: 0.95, opacity: 0 }} 
                  transition={{ type: "spring", damping: 25, stiffness: 400 }}
                  className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-blue-500" />
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">New Event</h2>
                    <button onClick={() => setCreateModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-white/40"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Event Title</label>
                      <input autoFocus value={newEvent.title} onChange={e => setNewEventLocal({...newEvent, title: e.target.value})} placeholder="What's happening?" className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm outline-none transition-all placeholder:text-white/20 font-medium" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Start Time</label><div className="h-12 bg-white/5 border border-white/10 rounded-xl px-4 flex items-center text-sm font-medium text-white/60">{format(newEvent.start, 'h:mm a')}</div></div>
                      <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Date</label><div className="h-12 bg-white/5 border border-white/10 rounded-xl px-4 flex items-center text-sm font-medium text-white/60">{format(newEvent.start, 'MMM d, yyyy')}</div></div>
                    </div>
                    <Button onClick={handleCreateEvent} className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/20 mt-4">Create Event</Button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </DndContext>
    </div>
  );
};

export default CalendarView;
