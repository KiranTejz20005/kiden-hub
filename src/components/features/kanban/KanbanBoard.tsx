"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  GripVertical,
  Check,
  Circle,
  Search,
  Filter,
  Trash2,
  Pencil,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CARD_PRIORITIES,
  COLUMN_ACCENTS,
  COLUMN_ICONS,
  DEFAULT_KANBAN_COLUMNS,
  newId,
  slugifyColumnId,
  type CardPriority,
  type KanbanBoardData,
  type KanbanCard,
  type KanbanColumnDef,
} from "@/lib/kanban";

export type { KanbanBoardData, KanbanCard, KanbanColumnDef };
/** Kept for backwards compatibility — a card's column id is now free-form. */
export type KanbanStatus = string;

const PRIORITY_COLORS: Record<CardPriority, string> = {
  low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  urgent: "bg-red-500/10 text-red-400 border-red-500/20",
};

const EMPTY_BOARD: KanbanBoardData = {
  columns: DEFAULT_KANBAN_COLUMNS,
  cards: [],
};

/* ─── Card ─────────────────────────────────────────────────────────────── */
interface CardProps {
  card: KanbanCard;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, cardId: string, status: string) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, status: string) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  onEdit: (card: KanbanCard) => void;
  onDelete: (card: KanbanCard) => void;
}

const KanbanCardComponent = React.memo(
  React.forwardRef<HTMLDivElement, CardProps>(
    ({ card, onDragStart, onDragOver, onDrop, onDragEnd, isDragging, onEdit, onDelete }, ref) => {
      const priorityClass = PRIORITY_COLORS[card.priority] ?? PRIORITY_COLORS.medium;

      return (
        <motion.div
          ref={ref}
          draggable
          onDragStart={(e) => onDragStart(e as unknown as React.DragEvent<HTMLDivElement>, card.id, card.status)}
          onDragOver={(e) => onDragOver(e as unknown as React.DragEvent<HTMLDivElement>)}
          onDrop={(e) => onDrop(e as unknown as React.DragEvent<HTMLDivElement>, card.status)}
          onDragEnd={onDragEnd}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "group relative cursor-grab active:cursor-grabbing p-3 rounded-xl bg-[#202020] border border-[#2a2a2a] hover:border-[#333333] hover:bg-[#242424] transition-all select-none",
            isDragging && "opacity-50 scale-95",
          )}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="text-[13px] font-semibold text-white leading-tight flex-1">{card.title}</h4>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                aria-label={`Edit ${card.title}`}
                onClick={(e) => { e.stopPropagation(); onEdit(card); }}
                onDragStart={(e) => e.preventDefault()}
                className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 p-1 rounded-md text-white/30 hover:text-white hover:bg-white/10 transition-all"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                type="button"
                aria-label={`Delete ${card.title}`}
                onClick={(e) => { e.stopPropagation(); onDelete(card); }}
                onDragStart={(e) => e.preventDefault()}
                className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 p-1 rounded-md text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
              <GripVertical className="w-3 h-3 text-white/20 group-hover:text-white/40 transition-colors" />
            </div>
          </div>

          {card.description && (
            <p className="text-[12px] text-white/80 leading-relaxed mb-2 line-clamp-2">{card.description}</p>
          )}

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={cn("text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border", priorityClass)}>
              {card.priority}
            </span>
            {card.tags.map((tag) => (
              <span
                key={tag}
                className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-white/80 border border-white/10"
              >
                {tag}
              </span>
            ))}
          </div>

          {(card.assignee || card.dueDate) && (
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
              {card.assignee && (
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary border border-primary/20">
                  {card.assignee.charAt(0)}
                </div>
              )}
              {card.dueDate && <span className="text-[10px] font-medium text-white/70">{card.dueDate}</span>}
            </div>
          )}
        </motion.div>
      );
    },
  ),
);
KanbanCardComponent.displayName = "KanbanCardComponent";

/* ─── Column ───────────────────────────────────────────────────────────── */
interface ColumnProps {
  column: KanbanColumnDef;
  totalColumns: number;
  cards: KanbanCard[];
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, status: string) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, cardId: string, status: string) => void;
  onDragEnd: () => void;
  draggedCardId: string | null;
  /** Opens the inline "add card" input for this column. */
  onOpenAddCard: (status: string) => void;
  /** Commits a new card in this column. */
  onSubmitCard: (status: string, title: string) => void;
  /** Closes the inline composer. */
  onCancelAddCard: () => void;
  isAddingCard: boolean;
  newCardTitle: string;
  setNewCardTitle: (v: string) => void;
  onRenameColumn: (column: KanbanColumnDef, label: string) => void;
  onDeleteColumn: (column: KanbanColumnDef) => void;
  onEditCard: (card: KanbanCard) => void;
  onDeleteCard: (card: KanbanCard) => void;
}

const KanbanColumn = React.memo((props: ColumnProps) => {
  const {
    column, totalColumns, cards, isDragOver, onDragOver, onDrop, onDragStart, onDragEnd,
    draggedCardId, onOpenAddCard, onSubmitCard, onCancelAddCard, isAddingCard, newCardTitle, setNewCardTitle,
    onRenameColumn, onDeleteColumn, onEditCard, onDeleteCard,
  } = props;

  const [isRenaming, setIsRenaming] = useState(false);
  const [draftLabel, setDraftLabel] = useState(column.label);

  const isAtLimit = column.wipLimit ? cards.length >= column.wipLimit : false;

  const commitRename = () => {
    const label = draftLabel.trim();
    setIsRenaming(false);
    if (label && label !== column.label) onRenameColumn(column, label);
    else setDraftLabel(column.label);
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full min-h-0",
        isDragOver && "ring-2 ring-primary/30 rounded-xl transition-all",
      )}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, column.id)}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-3 py-2.5 mb-2 gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-sm shrink-0">{column.icon}</span>

          {isRenaming ? (
            <input
              autoFocus
              value={draftLabel}
              onChange={(e) => setDraftLabel(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") { setDraftLabel(column.label); setIsRenaming(false); }
              }}
              className="min-w-0 flex-1 bg-white/5 border border-white/15 rounded-md px-1.5 py-0.5 text-[12px] font-bold uppercase tracking-wider text-white outline-none focus:border-primary/50"
            />
          ) : (
            <h3
              title="Double-click to rename"
              onDoubleClick={() => { setDraftLabel(column.label); setIsRenaming(true); }}
              className={cn(
                "text-[12px] font-bold uppercase tracking-wider truncate cursor-text",
                column.color,
              )}
            >
              {column.label}
            </h3>
          )}

          <span className="text-[10px] font-black text-white bg-white/15 px-2 py-0.5 rounded-full shrink-0">
            {cards.length}
            {column.wipLimit ? `/${column.wipLimit}` : ""}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isAtLimit && (
            <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-red-400">
              <Circle className="w-2 h-2 fill-red-400" />
              WIP
            </span>
          )}
          <button
            type="button"
            aria-label={`Rename ${column.label}`}
            onClick={() => { setDraftLabel(column.label); setIsRenaming(true); }}
            className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 opacity-0 group-hover/column:opacity-100 focus-visible:opacity-100 transition-all"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            type="button"
            aria-label={`Delete ${column.label}`}
            onClick={() => onDeleteColumn(column)}
            disabled={totalColumns <= 1}
            className={cn(
              "p-1 rounded-md transition-all",
              totalColumns <= 1
                ? "text-white/20 cursor-not-allowed"
                : "text-white/60 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover/column:opacity-100 focus-visible:opacity-100",
            )}
            title={totalColumns <= 1 ? "A board needs at least one category" : `Delete ${column.label}`}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Cards */}
      <ScrollArea className="flex-1 min-h-[100px]">
        <div className="space-y-2 pb-2">
          <AnimatePresence mode="popLayout" initial={false}>
            {cards.map((card) => (
              <KanbanCardComponent
                key={card.id}
                card={card}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onDragEnd={onDragEnd}
                isDragging={draggedCardId === card.id}
                onEdit={onEditCard}
                onDelete={onDeleteCard}
              />
            ))}
          </AnimatePresence>

          {cards.length === 0 && (
            <p className="text-[11px] font-medium text-white/70 text-center py-4 border border-dashed border-white/15 rounded-xl">
              No cards yet
            </p>
          )}
        </div>
      </ScrollArea>

      {/* Add Card */}
      <AnimatePresence initial={false}>
        {isAddingCard ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 p-3 rounded-xl bg-[#202020] border border-primary/20"
          >
            <input
              autoFocus
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newCardTitle.trim()) onSubmitCard(column.id, newCardTitle);
                if (e.key === "Escape") onCancelAddCard();
              }}
              placeholder="Card title..."
              className="w-full bg-transparent text-[13px] text-white placeholder:text-white/50 outline-none mb-2 font-medium"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { if (newCardTitle.trim()) onSubmitCard(column.id, newCardTitle); }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors"
              >
                <Check className="w-3 h-3" /> Add
              </button>
              <button
                type="button"
                onClick={onCancelAddCard}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            type="button"
            whileHover={{ backgroundColor: "rgba(120,120,120,0.06)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onOpenAddCard(column.id)}
            className={cn(
              "mt-2 flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all border border-dashed",
              isAtLimit
                ? "border-red-500/30 text-red-400/70 hover:bg-red-500/5"
                : "border-white/20 text-white/80 hover:border-primary/50 hover:text-white hover:bg-white/10",
            )}
          >
            <Plus className="w-3 h-3" />
            Add Card
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
});
KanbanColumn.displayName = "KanbanColumn";

/* ─── Board ────────────────────────────────────────────────────────────── */
export interface KanbanBoardProps {
  /** Controlled columns (categories). */
  columns?: KanbanColumnDef[];
  /** Controlled cards. */
  cards?: KanbanCard[];
  /** Called with the full board each time it changes — persist this. */
  onBoardChange?: (next: KanbanBoardData) => void;
  /** Overrides the board heading. */
  title?: string;
  /** Shows a subtle "Saving…" hint in the header while a write is in flight. */
  saving?: boolean;
}

export function KanbanBoard({
  columns: controlledColumns,
  cards: controlledCards,
  onBoardChange,
  title = "Kanban Board",
  saving = false,
}: KanbanBoardProps = {}) {
  const isControlled = controlledColumns !== undefined && controlledCards !== undefined;
  const [internal, setInternal] = useState<KanbanBoardData>(EMPTY_BOARD);

  const data: KanbanBoardData = isControlled
    ? { columns: controlledColumns, cards: controlledCards }
    : internal;

  const dataRef = React.useRef<KanbanBoardData>(data);
  const onChangeRef = React.useRef(onBoardChange);
  dataRef.current = data;
  onChangeRef.current = onBoardChange;

  /** Single mutation point — every CRUD action funnels through here. */
  const commit = useCallback((next: KanbanBoardData) => {
    dataRef.current = next;
    if (!isControlled) setInternal(next);
    onChangeRef.current?.(next);
  }, [isControlled]);

  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);
  const [activeColumn, setActiveColumn] = useState<string>(data.columns[0]?.id ?? "backlog");
  const [addingToColumn, setAddingToColumn] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnLabel, setNewColumnLabel] = useState("");
  const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium" as CardPriority,
    tags: "",
    dueDate: "",
  });

  const { columns, cards } = data;

  /* ── Cards CRUD ── */

  const addCard = useCallback((status: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;

    const card: KanbanCard = {
      id: newId(),
      title: trimmed,
      description: "",
      status,
      priority: "medium",
      tags: filterTag ? [filterTag] : [],
      assignee: "You",
    };

    commit({ ...dataRef.current, cards: [...dataRef.current.cards, card] });
    setNewCardTitle("");
    setAddingToColumn(null);
    setActiveColumn(status);
    // A stale search would hide the card the user just created.
    setSearchQuery("");
  }, [commit, filterTag]);

  const deleteCard = useCallback((card: KanbanCard) => {
    const ok = window.confirm(`Delete "${card.title}"? This cannot be undone.`);
    if (!ok) return;
    commit({ ...dataRef.current, cards: dataRef.current.cards.filter(c => c.id !== card.id) });
  }, [commit]);

  const openEditCard = useCallback((card: KanbanCard) => {
    setEditingCard(card);
    setForm({
      title: card.title,
      description: card.description ?? "",
      priority: card.priority,
      tags: card.tags.join(", "),
      dueDate: card.dueDate ?? "",
    });
  }, []);

  const saveEditedCard = useCallback(() => {
    if (!editingCard) return;
    const title = form.title.trim();
    if (!title) return;

    const tags = form.tags
      .split(",")
      .map(t => t.trim().toLowerCase())
      .filter(Boolean);

    commit({
      ...dataRef.current,
      cards: dataRef.current.cards.map(c =>
        c.id === editingCard.id
          ? {
              ...c,
              title,
              description: form.description.trim(),
              priority: form.priority,
              tags,
              ...(form.dueDate ? { dueDate: form.dueDate } : { dueDate: undefined }),
            }
          : c,
      ),
    });
    setEditingCard(null);
  }, [editingCard, form, commit]);

  /* ── Columns CRUD ── */

  const addColumn = useCallback(() => {
    const label = newColumnLabel.trim();
    if (!label) return;

    const current = dataRef.current.columns;
    const id = slugifyColumnId(label, current.map(c => c.id));
    const column: KanbanColumnDef = {
      id,
      label,
      color: COLUMN_ACCENTS[current.length % COLUMN_ACCENTS.length],
      icon: COLUMN_ICONS[current.length % COLUMN_ICONS.length],
    };

    commit({ ...dataRef.current, columns: [...current, column] });
    setNewColumnLabel("");
    setAddingColumn(false);
    setActiveColumn(id);
  }, [newColumnLabel, commit]);

  const renameColumn = useCallback((column: KanbanColumnDef, label: string) => {
    commit({
      ...dataRef.current,
      columns: dataRef.current.columns.map(c => (c.id === column.id ? { ...c, label } : c)),
    });
  }, [commit]);

  const deleteColumn = useCallback((column: KanbanColumnDef) => {
    const current = dataRef.current;
    if (current.columns.length <= 1) {
      window.alert("A board needs at least one category.");
      return;
    }

    const affected = current.cards.filter(c => c.status === column.id);
    const idx = current.columns.findIndex(c => c.id === column.id);
    const fallback = current.columns[idx - 1] ?? current.columns[idx + 1];
    const message = affected.length
      ? `Delete "${column.label}"? Its ${affected.length} card${affected.length === 1 ? "" : "s"} will move to "${fallback.label}".`
      : `Delete "${column.label}"?`;

    if (!window.confirm(message)) return;

    const nextColumns = current.columns.filter(c => c.id !== column.id);
    const nextCards = affected.length
      ? current.cards.map(c => (c.status === column.id ? { ...c, status: fallback.id } : c))
      : current.cards;

    commit({ columns: nextColumns, cards: nextCards });
    if (activeColumn === column.id) setActiveColumn(nextColumns[0]?.id ?? "");
  }, [commit, activeColumn]);

  /* ── Drag & drop ── */

  const handleDragStart = useCallback((e: React.DragEvent, cardId: string, status: string) => {
    setDraggedCardId(cardId);
    setDragOverStatus(status);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const moveCard = useCallback((cardId: string, newStatus: string) => {
    commit({
      ...dataRef.current,
      cards: dataRef.current.cards.map(c => (c.id === cardId ? { ...c, status: newStatus } : c)),
    });
  }, [commit]);

  const handleDrop = useCallback((e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (draggedCardId) moveCard(draggedCardId, status);
    setDraggedCardId(null);
    setDragOverStatus(null);
  }, [draggedCardId, moveCard]);

  const handleDragEnd = useCallback(() => {
    setDraggedCardId(null);
    setDragOverStatus(null);
  }, []);

  /* ── Keyboard (scoped to the board so it never hijacks the page) ── */

  const moveActiveColumn = useCallback((direction: "prev" | "next") => {
    const list = dataRef.current.columns;
    const idx = list.findIndex(c => c.id === activeColumn);
    if (idx < 0) return;
    const nextIdx = direction === "next" ? idx + 1 : idx - 1;
    if (nextIdx < 0 || nextIdx >= list.length) return;
    setActiveColumn(list[nextIdx].id);
  }, [activeColumn]);

  const moveActiveCard = useCallback((direction: "prev" | "next") => {
    const list = dataRef.current.columns;
    const idx = list.findIndex(c => c.id === activeColumn);
    if (idx < 0) return;
    const target = direction === "next" ? list[idx + 1] : list[idx - 1];
    if (!target) return;

    const cardsHere = dataRef.current.cards.filter(c => c.status === activeColumn);
    if (cardsHere.length === 0) return;
    moveCard(cardsHere[0].id, target.id);
    setActiveColumn(target.id);
  }, [activeColumn, moveCard]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (editingCard) return; // dialog owns the keyboard while open
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) return;

    switch (e.key) {
      case "ArrowLeft": e.preventDefault(); moveActiveColumn("prev"); break;
      case "ArrowRight": e.preventDefault(); moveActiveColumn("next"); break;
      case "ArrowUp": e.preventDefault(); moveActiveCard("prev"); break;
      case "ArrowDown": e.preventDefault(); moveActiveCard("next"); break;
      case "n":
      case "N":
        if (!e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          setNewCardTitle("");
          setAddingToColumn(activeColumn);
        }
        break;
      case "Escape":
        setAddingToColumn(null);
        setNewCardTitle("");
        setAddingColumn(false);
        break;
    }
  }, [moveActiveColumn, moveActiveCard, activeColumn, editingCard]);

  /* ── Derived ── */

  const allTags = useMemo(() => [...new Set(cards.flatMap(c => c.tags))], [cards]);

  const visibleCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return cards.filter(c => {
      if (filterTag && !c.tags.includes(filterTag)) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q))
      );
    });
  }, [cards, filterTag, searchQuery]);

  // Categories can be added/removed at runtime — keep the focused column valid.
  useEffect(() => {
    if (!columns.some(c => c.id === activeColumn)) {
      setActiveColumn(columns[0]?.id ?? "");
    }
  }, [columns, activeColumn]);

  return (
    <div
      className="flex w-full h-full bg-[#030303] overflow-hidden rounded-3xl border border-white/5 relative shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <div className="h-14 border-b border-white/5 flex items-center justify-between px-5 bg-black/20 shrink-0 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-sm font-bold text-white tracking-tight truncate">{title}</h2>
            <span className="text-[10px] text-white/70 font-semibold uppercase tracking-wider hidden lg:flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-white/60" />
              <span>← → switch columns, ↑↓ move cards, N to add</span>
            </span>
            {saving && (
              <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-amber-400">
                <Loader2 className="w-3 h-3 animate-spin" /> Saving
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cards..."
                aria-label="Search cards"
                className="bg-white/5 border border-white/15 rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder:text-white/60 outline-none focus:border-white/40 w-40"
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {filterTag && (
              <button
                type="button"
                onClick={() => setFilterTag(null)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider hover:bg-primary/20 transition-colors"
              >
                <Filter className="w-2.5 h-2.5" /> {filterTag}
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>

        {/* Tag filter */}
        {allTags.length > 0 && (
          <div className="px-5 py-2 border-b border-white/5 flex items-center gap-2 shrink-0 flex-wrap">
            {allTags.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                className={cn(
                  "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all border",
                  filterTag === tag
                    ? "bg-white/15 text-white border-white/20"
                    : "bg-white/5 text-white/70 border-white/15 hover:bg-white/15 hover:text-white",
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Columns */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden px-5 py-4">
          <div className="flex gap-3 h-full items-stretch min-w-full">
            {columns.map(column => (
              <div
                key={column.id}
                data-column-id={column.id}
                className="group/column flex flex-col flex-1 min-w-[280px] shrink-0 h-full"
              >
                <KanbanColumn
                  column={column}
                  totalColumns={columns.length}
                  cards={visibleCards.filter(c => c.status === column.id)}
                  isDragOver={dragOverStatus === column.id}
                  onDragOver={(e) => { handleDragOver(e); setDragOverStatus(column.id); }}
                  onDrop={(e, status) => { handleDrop(e, status); setDragOverStatus(null); }}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  draggedCardId={draggedCardId}
                  onOpenAddCard={(status) => {
                    setActiveColumn(status);
                    setAddingToColumn(status);
                    setNewCardTitle("");
                  }}
                  onSubmitCard={addCard}
                  onCancelAddCard={() => { setAddingToColumn(null); setNewCardTitle(""); }}
                  isAddingCard={addingToColumn === column.id}
                  newCardTitle={newCardTitle}
                  setNewCardTitle={setNewCardTitle}
                  onRenameColumn={renameColumn}
                  onDeleteColumn={deleteColumn}
                  onEditCard={openEditCard}
                  onDeleteCard={deleteCard}
                />
              </div>
            ))}

            {/* Add category */}
            <div className="w-[260px] shrink-0 flex flex-col">
              {addingColumn ? (
                <div className="p-3 rounded-xl bg-[#202020] border border-primary/20">
                  <input
                    autoFocus
                    value={newColumnLabel}
                    onChange={(e) => setNewColumnLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addColumn();
                      if (e.key === "Escape") { setNewColumnLabel(""); setAddingColumn(false); }
                    }}
                    placeholder="Category name..."
                    className="w-full bg-transparent text-[13px] text-white placeholder:text-white/50 outline-none mb-2 font-medium"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={addColumn}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors"
                    >
                      <Check className="w-3 h-3" /> Create
                    </button>
                    <button
                      type="button"
                      onClick={() => { setNewColumnLabel(""); setAddingColumn(false); }}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setAddingColumn(true); setNewColumnLabel(""); }}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all border border-dashed border-white/20 text-white/80 hover:border-primary/50 hover:text-white hover:bg-primary/10 mt-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Category
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="px-5 py-2 border-t border-white/5 flex items-center justify-between bg-black/20 shrink-0 gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">
              {cards.length} cards total
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {columns.map(col => (
                <span key={col.id} className={cn("text-[9px] font-bold", col.color)}>
                  {cards.filter(c => c.status === col.id).length} {col.label}
                </span>
              ))}
            </div>
          </div>
          <span className="text-[10px] text-white/60 font-bold uppercase tracking-[0.2em]">Kanban v1.0</span>
        </div>
      </div>

      {/* Edit card dialog */}
      <Dialog open={editingCard !== null} onOpenChange={(open) => { if (!open) setEditingCard(null); }}>
        <DialogContent className="bg-[#202020] border-[#2a2a2a] text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Edit card</DialogTitle>
            <DialogDescription className="text-white/40">
              Changes are saved to your board automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <label className="block space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Title</span>
              <input
                autoFocus
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                onKeyDown={(e) => { if (e.key === "Enter") saveEditedCard(); }}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary/50"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Description</span>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary/50 resize-none"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Priority</span>
                <select
                  value={form.priority}
                  onChange={(e) => setForm(f => ({ ...f, priority: e.target.value as CardPriority }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary/50"
                >
                  {CARD_PRIORITIES.map(p => (
                    <option key={p} value={p} className="bg-[#202020]">{p}</option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Due date</span>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary/50"
                />
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Tags (comma separated)</span>
              <input
                value={form.tags}
                onChange={(e) => setForm(f => ({ ...f, tags: e.target.value }))}
                placeholder="design, backend"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-primary/50"
              />
            </label>
          </div>

          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setEditingCard(null)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveEditedCard}
              disabled={!form.title.trim()}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save changes
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
