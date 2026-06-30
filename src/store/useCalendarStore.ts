import { create } from 'zustand';

export type CalendarView = 'day' | 'week' | 'month' | 'agenda' | 'timeline';

interface CalendarState {
  // View State
  view: CalendarView;
  currentDate: Date;
  setView: (view: CalendarView) => void;
  setCurrentDate: (date: Date) => void;
  
  // Selection State
  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
  
  // UI State
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  isInspectorOpen: boolean;
  setInspectorOpen: (open: boolean) => void;
  
  // Create Modal State
  isCreateModalOpen: boolean;
  setCreateModalOpen: (open: boolean) => void;
  draftEvent: {
    title: string;
    start: Date;
    end: Date;
  } | null;
  setDraftEvent: (event: { title: string; start: Date; end: Date } | null) => void;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  // View State
  view: 'week',
  currentDate: new Date(),
  setView: (view) => set({ view }),
  setCurrentDate: (currentDate) => set({ currentDate }),
  
  // Selection State
  selectedEventId: null,
  setSelectedEventId: (selectedEventId) => set({ selectedEventId, isInspectorOpen: !!selectedEventId }),
  
  // UI State
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  isInspectorOpen: false,
  setInspectorOpen: (isInspectorOpen) => set({ isInspectorOpen }),
  
  // Create Modal State
  isCreateModalOpen: false,
  setCreateModalOpen: (isCreateModalOpen) => set({ isCreateModalOpen }),
  draftEvent: null,
  setDraftEvent: (draftEvent) => set({ draftEvent }),
}));
