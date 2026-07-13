import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus';
import { BubbleMenu as BubbleMenuExtension } from '@tiptap/extension-bubble-menu';
import { FloatingMenu as FloatingMenuExtension } from '@tiptap/extension-floating-menu';
import { StarterKit } from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extension-placeholder';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Image } from '@tiptap/extension-image';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { common, createLowlight } from 'lowlight';
import { Typography } from '@tiptap/extension-typography';
import { 
  Bold, Italic, Underline as UnderlineIcon, 
  List, ListOrdered, CheckSquare, Quote, 
  Code, Link as LinkIcon,
  Heading1, Heading2, Heading3, Type,
  Sparkles, AlignLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { toast } from 'sonner';

const lowlight = createLowlight(common);

interface BlockEditorProps {
  content: any;
  onChange: (content: any, wordCount: number) => void;
  isFullWidth?: boolean;
}

const BlockEditor = ({ content, onChange }: BlockEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false, // Use lowlight instead
      }),
      BubbleMenuExtension,
      FloatingMenuExtension,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {return `Heading ${node.attrs.level}`;}
          return "Type '/' for commands...";
        },
      }),
      Typography,
      TaskList,
      TaskItem.configure({ nested: true }),
      CodeBlockLowlight.configure({ lowlight }),
      Image.configure({ inline: true, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      onChange(editor.getJSON(), words);
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[500px] px-4 py-8 text-foreground leading-relaxed',
          'prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl',
          'prose-p:text-base prose-p:leading-7',
          'prose-li:text-base'
        ),
      },
    },
  });

  // Sync content if it changes externally (e.g. note switch)
  useEffect(() => {
    if (editor && content !== editor.getJSON()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {return null;}

  return (
    <div className="relative w-full group/editor">
      {/* ── Bubble Menu (Inline Formatting) ── */}
      {editor && (
        <BubbleMenu 
          editor={editor} 
          tippyOptions={{ duration: 100 }}
          className="flex items-center gap-1 p-1 bg-[#111111] border border-white/10 rounded-xl shadow-2xl backdrop-blur-md"
        >
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn("p-1.5 rounded-lg hover:bg-white/10 transition-colors", editor.isActive('bold') ? "text-primary bg-primary/10" : "text-muted-foreground")}
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn("p-1.5 rounded-lg hover:bg-white/10 transition-colors", editor.isActive('italic') ? "text-primary bg-primary/10" : "text-muted-foreground")}
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={cn("p-1.5 rounded-lg hover:bg-white/10 transition-colors", editor.isActive('underline') ? "text-primary bg-primary/10" : "text-muted-foreground")}
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-white/10 mx-1" />
          <button
            onClick={() => {
              const url = window.prompt('URL');
              if (url) {editor.chain().focus().setLink({ href: url }).run();}
            }}
            className={cn("p-1.5 rounded-lg hover:bg-white/10 transition-colors", editor.isActive('link') ? "text-primary bg-primary/10" : "text-muted-foreground")}
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={cn("p-1.5 rounded-lg hover:bg-white/10 transition-colors", editor.isActive('code') ? "text-primary bg-primary/10" : "text-muted-foreground")}
          >
            <Code className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-white/10 mx-1" />
          <button
            onClick={() => toast.info('AI writing feature coming soon!')}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider"
          >
            <Sparkles className="w-3.5 h-3.5" /> Ask AI
          </button>
        </BubbleMenu>
      )}

      {/* ── Floating Menu (Slash Commands) ── */}
      {editor && (
        <FloatingMenu 
          editor={editor} 
          tippyOptions={{ duration: 100 }}
          shouldShow={({ editor }) => {
            const { selection } = editor.state;
            const { $from } = selection;
            return $from.parent.type.name === 'paragraph' && $from.parent.content.size === 0;
          }}
          className="flex flex-col p-1.5 bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl w-64 max-h-[400px] overflow-y-auto"
        >
          <div className="px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Basic Blocks</p>
          </div>
          {[
            { label: 'Text', icon: Type, command: () => editor.chain().focus().setParagraph().run() },
            { label: 'Heading 1', icon: Heading1, command: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
            { label: 'Heading 2', icon: Heading2, command: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
            { label: 'Heading 3', icon: Heading3, command: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
            { label: 'Bulleted List', icon: List, command: () => editor.chain().focus().toggleBulletList().run() },
            { label: 'Numbered List', icon: ListOrdered, command: () => editor.chain().focus().toggleOrderedList().run() },
            { label: 'To-do List', icon: CheckSquare, command: () => editor.chain().focus().toggleTaskList().run() },
            { label: 'Quote', icon: Quote, command: () => editor.chain().focus().toggleBlockquote().run() },
            { label: 'Code Block', icon: Code, command: () => editor.chain().focus().toggleCodeBlock().run() },
            { label: 'Divider', icon: AlignLeft, command: () => editor.chain().focus().setHorizontalRule().run() },
            { label: 'Table', icon: AlignLeft, command: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
          ].map(item => (
            <button
              key={item.label}
              onClick={item.command}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-white/5 text-left transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all">
                <item.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-white group-hover:text-primary transition-colors">{item.label}</p>
                <p className="text-[9px] text-muted-foreground/60">Insert a {item.label.toLowerCase()}</p>
              </div>
            </button>
          ))}
          <div className="px-3 py-2 mt-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Notes AI</p>
          </div>
          <button
            onClick={() => toast.info('AI generation coming soon!')}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-primary/10 text-left transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-all">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-primary transition-colors">Continue with AI</p>
              <p className="text-[9px] text-primary/60">Generate more content...</p>
            </div>
          </button>
        </FloatingMenu>
      )}

      <EditorContent editor={editor} />
      
      {/* Editor Styles (Global Injection for Custom Blocks) */}
      <style dangerouslySetInnerHTML={{ __html: `
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: rgba(255,255,255,0.4);
          pointer-events: none;
          height: 0;
        }
        .tiptap ul[data-type="taskList"] {
          list-style: none;
          padding: 0;
        }
        .tiptap ul[data-type="taskList"] li {
          display: flex;
          align-items: start;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .tiptap ul[data-type="taskList"] label {
          user-select: none;
          margin-top: 0.25rem;
        }
        .tiptap ul[data-type="taskList"] input[type="checkbox"] {
          appearance: none;
          background-color: transparent;
          margin: 0;
          font: inherit;
          color: currentColor;
          width: 1.15em;
          height: 1.15em;
          border: 0.15em solid currentColor;
          border-radius: 0.35em;
          display: grid;
          place-content: center;
          cursor: pointer;
        }
        .tiptap ul[data-type="taskList"] input[type="checkbox"]::before {
          content: "";
          width: 0.65em;
          height: 0.65em;
          transform: scale(0);
          transition: 120ms transform ease-in-out;
          box-shadow: inset 1em 1em var(--primary);
          transform-origin: bottom left;
          clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
        }
        .tiptap ul[data-type="taskList"] input[type="checkbox"]:checked::before {
          transform: scale(1);
        }
        .tiptap ul[data-type="taskList"] li[data-checked="true"] > div > p {
          text-decoration: line-through;
          color: #888;
        }
        .tiptap blockquote {
          border-left: 3px solid var(--primary);
          padding-left: 1rem;
          font-style: italic;
          color: #888;
        }
        .tiptap h1 { font-size: 1.875rem; font-weight: 700; margin-top: 2rem; margin-bottom: 1rem; }
        .tiptap h2 { font-size: 1.5rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem; }
        .tiptap h3 { font-size: 1.25rem; font-weight: 500; margin-top: 1.25rem; margin-bottom: 0.5rem; }
        .tiptap table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 0;
          overflow: hidden;
        }
        .tiptap td, .tiptap th {
          min-width: 1em;
          border: 1px solid #333;
          padding: 3px 5px;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
        }
        .tiptap th {
          font-weight: bold;
          text-align: left;
          background-color: #1a1a1a;
        }
      `}} />
    </div>
  );
};

export default BlockEditor;
