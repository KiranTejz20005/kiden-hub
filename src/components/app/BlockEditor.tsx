import { useState, useRef, useEffect, KeyboardEvent, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  AlertCircle,
  Image,
  Link,
  CheckSquare,
  Minus,
  GripVertical,
  Plus,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type BlockType = 
  | 'paragraph' 
  | 'h1' 
  | 'h2' 
  | 'h3' 
  | 'bullet' 
  | 'numbered' 
  | 'quote' 
  | 'code' 
  | 'callout'
  | 'divider'
  | 'todo';

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
}

interface BlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  placeholder?: string;
}

const blockTypes: { type: BlockType; label: string; icon: React.ComponentType<any>; shortcut: string }[] = [
  { type: 'paragraph', label: 'Text', icon: Type, shortcut: 'p' },
  { type: 'h1', label: 'Heading 1', icon: Heading1, shortcut: '1' },
  { type: 'h2', label: 'Heading 2', icon: Heading2, shortcut: '2' },
  { type: 'h3', label: 'Heading 3', icon: Heading3, shortcut: '3' },
  { type: 'bullet', label: 'Bullet List', icon: List, shortcut: '-' },
  { type: 'numbered', label: 'Numbered List', icon: ListOrdered, shortcut: 'n' },
  { type: 'todo', label: 'To-do', icon: CheckSquare, shortcut: 't' },
  { type: 'quote', label: 'Quote', icon: Quote, shortcut: 'q' },
  { type: 'code', label: 'Code', icon: Code, shortcut: 'c' },
  { type: 'callout', label: 'Callout', icon: AlertCircle, shortcut: 'a' },
  { type: 'divider', label: 'Divider', icon: Minus, shortcut: 'd' },
];

// Individual editable block component to prevent re-renders from resetting cursor
const EditableBlock = ({ 
  block, 
  placeholder, 
  className, 
  onContentChange, 
  onKeyDown, 
  onFocus, 
  onBlur,
  blockRef 
}: {
  block: Block;
  placeholder: string;
  className: string;
  onContentChange: (content: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
  onFocus: () => void;
  onBlur: () => void;
  blockRef: (el: HTMLDivElement | null) => void;
}) => {
  const internalRef = useRef<HTMLDivElement>(null);
  const lastContentRef = useRef(block.content);

  // Only update DOM if content changed externally (not from user typing)
  useEffect(() => {
    if (internalRef.current && internalRef.current.textContent !== block.content) {
      // Only update if the change came from outside (e.g., block type change)
      if (lastContentRef.current !== block.content) {
        internalRef.current.textContent = block.content;
        lastContentRef.current = block.content;
      }
    }
  }, [block.content]);

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const content = e.currentTarget.textContent || '';
    lastContentRef.current = content;
    onContentChange(content);
  }, [onContentChange]);

  return (
    <div
      ref={(el) => {
        internalRef.current = el;
        blockRef(el);
      }}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      className={className}
      onInput={handleInput}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );
};

const BlockEditor = ({ blocks, onChange, placeholder = "Type '/' for commands..." }: BlockEditorProps) => {
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [slashFilter, setSlashFilter] = useState('');
  const [selectedMenuIndex, setSelectedMenuIndex] = useState(0);
  const blockRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredBlockTypes = blockTypes.filter(b => 
    b.label.toLowerCase().includes(slashFilter.toLowerCase()) ||
    b.shortcut.includes(slashFilter.toLowerCase())
  );

  useEffect(() => {
    setSelectedMenuIndex(0);
  }, [slashFilter]);

  const createBlock = (type: BlockType = 'paragraph'): Block => ({
    id: uuidv4(),
    type,
    content: '',
    checked: type === 'todo' ? false : undefined,
  });

  const addBlock = (afterId: string, type: BlockType = 'paragraph') => {
    const index = blocks.findIndex(b => b.id === afterId);
    const newBlock = createBlock(type);
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    onChange(newBlocks);
    
    setTimeout(() => {
      const el = blockRefs.current.get(newBlock.id);
      el?.focus();
    }, 50);
    
    return newBlock.id;
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    onChange(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBlock = (id: string) => {
    if (blocks.length <= 1) return;
    const index = blocks.findIndex(b => b.id === id);
    const prevBlock = blocks[index - 1];
    onChange(blocks.filter(b => b.id !== id));
    
    if (prevBlock) {
      setTimeout(() => {
        const el = blockRefs.current.get(prevBlock.id);
        el?.focus();
      }, 50);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>, block: Block) => {
    const content = block.content;

    // Slash command
    if (e.key === '/' && content === '') {
      e.preventDefault();
      const rect = blockRefs.current.get(block.id)?.getBoundingClientRect();
      if (rect) {
        setSlashMenuPosition({ top: rect.bottom + 8, left: rect.left });
        setShowSlashMenu(true);
        setActiveBlockId(block.id);
        setSlashFilter('');
      }
      return;
    }

    // Handle slash menu navigation
    if (showSlashMenu) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMenuIndex(i => Math.min(i + 1, filteredBlockTypes.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMenuIndex(i => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredBlockTypes[selectedMenuIndex]) {
          selectBlockType(filteredBlockTypes[selectedMenuIndex].type);
        }
        return;
      }
      if (e.key === 'Escape') {
        setShowSlashMenu(false);
        return;
      }
    }

    // Enter to create new block
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addBlock(block.id);
      return;
    }

    // Backspace on empty block
    if (e.key === 'Backspace' && content === '') {
      e.preventDefault();
      deleteBlock(block.id);
      return;
    }

    // Markdown shortcuts
    if (e.key === ' ' && !showSlashMenu) {
      if (content === '#') {
        e.preventDefault();
        updateBlock(block.id, { type: 'h1', content: '' });
        return;
      }
      if (content === '##') {
        e.preventDefault();
        updateBlock(block.id, { type: 'h2', content: '' });
        return;
      }
      if (content === '###') {
        e.preventDefault();
        updateBlock(block.id, { type: 'h3', content: '' });
        return;
      }
      if (content === '-' || content === '*') {
        e.preventDefault();
        updateBlock(block.id, { type: 'bullet', content: '' });
        return;
      }
      if (content === '1.') {
        e.preventDefault();
        updateBlock(block.id, { type: 'numbered', content: '' });
        return;
      }
      if (content === '>') {
        e.preventDefault();
        updateBlock(block.id, { type: 'quote', content: '' });
        return;
      }
      if (content === '[]' || content === '[ ]') {
        e.preventDefault();
        updateBlock(block.id, { type: 'todo', content: '', checked: false });
        return;
      }
      if (content === '---') {
        e.preventDefault();
        updateBlock(block.id, { type: 'divider', content: '' });
        addBlock(block.id);
        return;
      }
    }
  };

  const selectBlockType = (type: BlockType) => {
    if (activeBlockId) {
      updateBlock(activeBlockId, { type, content: '' });
    }
    setShowSlashMenu(false);
    setSlashFilter('');
    
    setTimeout(() => {
      const el = blockRefs.current.get(activeBlockId!);
      el?.focus();
    }, 50);
  };

  const getBlockClassName = (type: BlockType) => {
    switch (type) {
      case 'h1': return 'text-3xl md:text-4xl font-bold font-serif';
      case 'h2': return 'text-2xl md:text-3xl font-bold font-serif';
      case 'h3': return 'text-xl md:text-2xl font-semibold';
      case 'bullet': return 'pl-6 relative before:content-["•"] before:absolute before:left-2 before:text-primary';
      case 'numbered': return 'pl-6';
      case 'quote': return 'pl-4 border-l-2 border-primary/50 italic text-muted-foreground';
      case 'code': return 'font-mono text-sm bg-secondary/50 rounded px-3 py-2';
      case 'callout': return 'p-4 rounded-xl bg-primary/10 border border-primary/20';
      case 'todo': return 'pl-8 relative';
      default: return 'text-base leading-relaxed';
    }
  };

  return (
    <div className="block-editor relative min-h-[200px]">
      <Reorder.Group axis="y" values={blocks} onReorder={onChange} className="space-y-1">
        {blocks.map((block, index) => (
          <Reorder.Item
            key={block.id}
            value={block}
            className="group relative"
          >
            <div className="flex items-start gap-1">
              {/* Drag handle and add button */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                <button
                  onClick={() => addBlock(blocks[index - 1]?.id || block.id)}
                  className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <div className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-secondary text-muted-foreground">
                  <GripVertical className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Block content */}
              <div className="flex-1 min-w-0">
                {block.type === 'divider' ? (
                  <div className="py-4">
                    <hr className="border-border" />
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    {block.type === 'todo' && (
                      <button
                        onClick={() => updateBlock(block.id, { checked: !block.checked })}
                        className={cn(
                          "w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center transition-colors",
                          block.checked 
                            ? "bg-primary border-primary text-primary-foreground" 
                            : "border-muted-foreground hover:border-primary"
                        )}
                      >
                        {block.checked && (
                          <motion.svg
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-3 h-3"
                            viewBox="0 0 12 12"
                          >
                            <path
                              d="M2 6L5 9L10 3"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </motion.svg>
                        )}
                      </button>
                    )}
                    
                    <EditableBlock
                      block={block}
                      placeholder={index === 0 && blocks.length === 1 ? placeholder : "Type '/' for commands..."}
                      className={cn(
                        "flex-1 outline-none py-1 px-2 rounded-lg transition-all duration-150",
                        "hover:bg-secondary/30 focus:bg-secondary/30",
                        "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50 empty:before:pointer-events-none",
                        getBlockClassName(block.type),
                        block.type === 'todo' && block.checked && "line-through text-muted-foreground"
                      )}
                      onContentChange={(content) => {
                        updateBlock(block.id, { content });
                        
                        if (showSlashMenu && content.startsWith('/')) {
                          setSlashFilter(content.slice(1));
                        } else if (showSlashMenu) {
                          setShowSlashMenu(false);
                        }
                      }}
                      onKeyDown={(e) => handleKeyDown(e, block)}
                      onFocus={() => setActiveBlockId(block.id)}
                      onBlur={() => {
                        setTimeout(() => setShowSlashMenu(false), 150);
                      }}
                      blockRef={(el) => {
                        if (el) blockRefs.current.set(block.id, el);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Delete button */}
              <button
                onClick={() => deleteBlock(block.id)}
                className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {/* Slash command menu */}
      <AnimatePresence>
        {showSlashMenu && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed z-50 w-72 max-h-80 overflow-auto bg-card border border-border rounded-xl shadow-2xl p-2"
            style={{ top: slashMenuPosition.top, left: slashMenuPosition.left }}
          >
            <p className="text-xs text-muted-foreground px-2 py-1 mb-1 font-medium">BLOCKS</p>
            {filteredBlockTypes.map((item, index) => (
              <motion.button
                key={item.type}
                onClick={() => selectBlockType(item.type)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                  index === selectedMenuIndex 
                    ? "bg-primary/20 text-foreground" 
                    : "hover:bg-secondary text-foreground"
                )}
                whileHover={{ x: 4 }}
              >
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">/{item.shortcut}</p>
                </div>
              </motion.button>
            ))}
            {filteredBlockTypes.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No blocks found</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BlockEditor;
