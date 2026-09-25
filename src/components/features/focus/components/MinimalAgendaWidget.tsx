"use client";

import { forwardRef, useState, useEffect, useCallback, type ComponentPropsWithoutRef } from "react";
import { Check, Plus, Trash2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

function getTodayKey(): string {
  return `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
}

function loadTodaysTasks(): AgendaItem[] {
  try {
    const stored = localStorage.getItem(`agenda_${getTodayKey()}`);
    if (stored) return JSON.parse(stored) as AgendaItem[];
  } catch {}
  return [];
}

function saveTodaysTasks(items: AgendaItem[]): void {
  try {
    localStorage.setItem(`agenda_${getTodayKey()}`, JSON.stringify(items));
  } catch {}
}

type AgendaItem = {
  id: string;
  time: string;
  title: string;
  done: boolean;
};

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getDefaultTime(items: AgendaItem[]): string {
  if (items.length === 0) return "09:00";
  const lastTime = items[items.length - 1].time;
  const [h, m] = lastTime.split(":").map(Number);
  return `${String(h + Math.floor((m + 30) / 60)).padStart(2, '0')}:${String((m + 30) % 60).padStart(2, '0')}`;
}

function AgendaTitle({ done, children }: { done: boolean; children: string }) {
  return (
    <span className="min-w-0 flex-1">
      <span className="relative inline-block max-w-full">
        <span
          className={cn(
            "block max-w-full truncate text-xs leading-4 font-medium transition-colors duration-300 ease-out",
            done ? "text-neutral-400" : "text-neutral-900",
          )}
        >
          {children}
        </span>
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-2 left-0 h-px bg-neutral-400/80",
            "transition-[width] duration-500 ease-in-out",
            done ? "w-full" : "w-0",
          )}
        />
      </span>
    </span>
  );
}

export type MinimalAgendaWidgetProps = Readonly<ComponentPropsWithoutRef<"div">>;

export const MinimalAgendaWidget = forwardRef<
  HTMLDivElement,
  MinimalAgendaWidgetProps
>(({ className, ...props }, ref) => {
  const [items, setItems] = useState<AgendaItem[]>(loadTodaysTasks);
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => { saveTodaysTasks(items); }, [items]);

  const addItem = useCallback(() => {
    if (!newTitle.trim()) return;
    const time = newTime || getDefaultTime(items);
    setItems((prev) => [...prev, { id: genId(), time, title: newTitle.trim(), done: false }]);
    setNewTitle("");
    setNewTime("");
    setShowAddForm(false);
  }, [newTitle, newTime, items]);

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const toggleItem = useCallback((id: string) => {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, done: !item.done } : item));
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTitle.trim()) addItem();
    if (e.key === "Escape") { setShowAddForm(false); setNewTitle(""); setNewTime(""); }
  };

  const doneCount = items.filter((i) => i.done).length;
  const totalCount = items.length;

  return (
    <div
      ref={ref}
      data-slot="minimal-agenda-widget"
      className={cn(
        "w-64 rounded-3xl border border-neutral-100 bg-white p-4 font-sans shadow-lg shadow-black/5",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-semibold tracking-widest text-neutral-400 uppercase">
          Today
        </p>
        <span className="text-[10px] font-bold text-neutral-300">
          {doneCount}/{totalCount}
        </span>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="mb-3 h-1 rounded-full bg-neutral-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-neutral-900 transition-all duration-500 ease-out"
            style={{ width: `${(doneCount / totalCount) * 100}%` }}
          />
        </div>
      )}

      {/* Add Task */}
      {!showAddForm ? (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="flex w-full items-center gap-2 px-2 py-1.5 rounded-xl border border-dashed border-neutral-200 text-[11px] font-medium text-neutral-400 hover:border-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-all mb-3"
        >
          <Plus className="w-3 h-3" />
          Add Task
        </button>
      ) : (
        <div className="mb-3 p-3 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-2">
          <div className="flex gap-2">
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-20 bg-white border border-neutral-200 rounded-lg px-2 py-1.5 text-[11px] font-mono text-neutral-700 outline-none focus:border-neutral-400 transition-colors"
            />
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Task title..."
              className="flex-1 bg-white border border-neutral-200 rounded-lg px-2 py-1.5 text-[11px] font-medium text-neutral-700 outline-none focus:border-neutral-400 transition-colors placeholder:text-neutral-300"
              autoFocus
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addItem}
              disabled={!newTitle.trim()}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-neutral-900 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Check className="w-2.5 h-2.5" /> Add
            </button>
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setNewTitle(""); setNewTime(""); }}
              className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Task List */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Clock className="w-6 h-6 text-neutral-200 mb-2" />
          <p className="text-[11px] font-medium text-neutral-300">No tasks today</p>
          <p className="text-[9px] text-neutral-200 mt-0.5">Tap Add Task to get started</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                aria-pressed={item.done}
                aria-label={`${item.title} at ${item.time}`}
                onClick={() => toggleItem(item.id)}
                className="flex w-full cursor-pointer items-center gap-3 px-1 py-0.5 text-left rounded-lg hover:bg-neutral-50 transition-all group"
              >
                <span
                  className={cn(
                    "w-10 shrink-0 text-[11px] font-medium tabular-nums transition-colors duration-300",
                    item.done ? "text-neutral-300" : "text-neutral-400",
                  )}
                >
                  {item.time}
                </span>

                <AgendaTitle done={item.done}>{item.title}</AgendaTitle>

                <span className="flex h-3 w-3 shrink-0 items-center justify-center">
                  <Check
                    size={12}
                    aria-hidden
                    className={cn(
                      "text-emerald-500 transition-opacity duration-300 ease-out",
                      item.done ? "opacity-100" : "opacity-0",
                    )}
                  />
                </span>

                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded-md text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-all"
                  aria-label="Delete task"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </button>
            </li>
          ))}
        </ul>
      )}

      {totalCount > 0 && (
        <div className="mt-3 pt-2 border-t border-neutral-100 flex items-center justify-between">
          <span className="text-[9px] font-bold text-neutral-300 uppercase tracking-widest">
            {doneCount === totalCount ? "🎯 All done!" : `${totalCount - doneCount} remaining`}
          </span>
          <span className="text-[9px] text-neutral-200 font-medium">{getTodayKey()}</span>
        </div>
      )}
    </div>
  );
});

MinimalAgendaWidget.displayName = "MinimalAgendaWidget";