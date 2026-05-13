import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Typography from '@tiptap/extension-typography';
import Suggestion from '@tiptap/suggestion';
import { common, createLowlight } from 'lowlight';
import { useEffect } from 'react';
import { 
  Bold, Italic, Underline as UnderlineIcon, 
  Link as LinkIcon, List, ListOrdered, 
  CheckSquare, Code, Quote, Heading1, Heading2, Heading3,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SlashCommandList, getSuggestionItems } from './SlashCommand';
import ReactRenderer from '@tiptap/react'; // For suggestion rendering
import tippy from 'tippy.js';

const lowlight = createLowlight(common);

interface BlockEditorProps {
  content: any;
  onChange: (content: any) => void;
  placeholder?: string;
}

const BlockEditor = ({ content, onChange, placeholder = "Type '/' for commands..." }: BlockEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [1, 2, 3] },
      }),
      Typography,
      HorizontalRule,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') return `Heading ${node.attrs.level}`;
          return placeholder;
        },
      }),
      Underline,
      Link.configure({ openOnClick: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      CodeBlockLowlight.configure({ lowlight }),
      // --- Slash Commands Extension ---
      {
        name: 'slash-command',
        addOptions() {
          return {
            suggestion: {
              char: '/',
              command: ({ editor, range, props }: any) => {
                props.command({ editor, range });
              },
            },
          };
        },
        configure() {
          return {
            suggestion: {
              ...this.options.suggestion,
              items: getSuggestionItems,
              render: () => {
                let component: any;
                let popup: any;

                return {
                  onStart: (props: any) => {
                    // TipTap v2+ ReactRenderer
                    component = new (require('@tiptap/react').ReactRenderer)(SlashCommandList, {
                      props,
                      editor: props.editor,
                    });

                    if (!props.clientRect) return;

                    popup = tippy('body', {
                      getReferenceClientRect: props.clientRect,
                      appendTo: () => document.body,
                      content: component.element,
                      showOnCreate: true,
                      interactive: true,
                      trigger: 'manual',
                      placement: 'bottom-start',
                    });
                  },
                  onUpdate(props: any) {
                    component.updateProps(props);
                    if (!props.clientRect) return;
                    popup[0].setProps({
                      getReferenceClientRect: props.clientRect,
                    });
                  },
                  onKeyDown(props: any) {
                    if (props.event.key === 'Escape') {
                      popup[0].hide();
                      return true;
                    }
                    return component.ref?.onKeyDown(props);
                  },
                  onExit() {
                    popup[0].destroy();
                    component.destroy();
                  },
                };
              },
            },
          };
        },
      },
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[500px] px-4 py-8 text-foreground leading-relaxed',
      },
    },
  });

  // Update editor content when external content changes (e.g. switching notes)
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentContent = JSON.stringify(editor.getJSON());
      const nextContent = JSON.stringify(content);
      if (currentContent !== nextContent) {
        editor.commands.setContent(content, false);
      }
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Bubble Menu for quick formatting */}
      <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }} className="flex items-center gap-0.5 bg-background border border-border shadow-xl rounded-lg p-1 overflow-hidden z-50">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn("p-1.5 rounded hover:bg-secondary transition-colors", editor.isActive('bold') && "text-primary bg-primary/10")}
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn("p-1.5 rounded hover:bg-secondary transition-colors", editor.isActive('italic') && "text-primary bg-primary/10")}
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn("p-1.5 rounded hover:bg-secondary transition-colors", editor.isActive('underline') && "text-primary bg-primary/10")}
        >
          <UnderlineIcon className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-border mx-1" />
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn("p-1.5 rounded hover:bg-secondary transition-colors", editor.isActive('heading', { level: 1 }) && "text-primary bg-primary/10")}
        >
          <Heading1 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn("p-1.5 rounded hover:bg-secondary transition-colors", editor.isActive('heading', { level: 2 }) && "text-primary bg-primary/10")}
        >
          <Heading2 className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-border mx-1" />
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn("p-1.5 rounded hover:bg-secondary transition-colors", editor.isActive('bulletList') && "text-primary bg-primary/10")}
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={cn("p-1.5 rounded hover:bg-secondary transition-colors", editor.isActive('taskList') && "text-primary bg-primary/10")}
        >
          <CheckSquare className="w-3.5 h-3.5" />
        </button>
      </BubbleMenu>

      {/* Floating Menu for empty lines */}
      <FloatingMenu editor={editor} tippyOptions={{ duration: 100 }} className="flex items-center gap-1">
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className="p-1.5 rounded-lg bg-background border border-border shadow-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className="p-1.5 rounded-lg bg-background border border-border shadow-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className="p-1.5 rounded-lg bg-background border border-border shadow-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
          title="Task List"
        >
          <CheckSquare className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className="p-1.5 rounded-lg bg-background border border-border shadow-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
          title="Code Block"
        >
          <Code className="w-4 h-4" />
        </button>
      </FloatingMenu>

      <EditorContent editor={editor} />
      
      {/* CSS for Notion-like styling */}
      <style dangerouslySetInnerHTML={{ __html: `
        .tiptap p.is-editor-empty:first-child::before {
          color: #666;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .tiptap ul[data-type="taskList"] {
          list-style: none;
          padding: 0;
        }
        .tiptap ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }
        .tiptap ul[data-type="taskList"] li > label {
          flex: 0 0 auto;
          user-select: none;
          margin-top: 0.125rem;
        }
        .tiptap ul[data-type="taskList"] li > label input {
          width: 1.1rem;
          height: 1.1rem;
          cursor: pointer;
          accent-color: var(--primary);
        }
        .tiptap ul[data-type="taskList"] li > div {
          flex: 1 1 auto;
        }
        .tiptap ul[data-type="taskList"] li[data-checked="true"] > div {
          text-decoration: line-through;
          color: #666;
        }
        .tiptap code {
          background-color: rgba(var(--primary-rgb), 0.1);
          color: var(--primary);
          padding: 0.2rem 0.4rem;
          border-radius: 0.4rem;
          font-size: 0.85rem;
        }
        .tiptap pre {
          background: #0d0d0d;
          color: #fff;
          font-family: 'JetBrainsMono', monospace;
          padding: 1rem;
          border-radius: 0.75rem;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .tiptap pre code {
          color: inherit;
          padding: 0;
          background: none;
          font-size: 0.85rem;
        }
        .tiptap blockquote {
          border-left: 3px solid var(--primary);
          padding-left: 1rem;
          font-style: italic;
          color: #888;
        }
        .tiptap h1 { font-size: 1.875rem; font-weight: 800; margin-top: 2rem; margin-bottom: 1rem; }
        .tiptap h2 { font-size: 1.5rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.75rem; }
        .tiptap h3 { font-size: 1.25rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.5rem; }
      `}} />
    </div>
  );
};

export default BlockEditor;
