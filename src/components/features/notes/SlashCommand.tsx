import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { 
  Heading1, Heading2, Heading3, 
  List, ListOrdered, CheckSquare, 
  Code, Quote, Minus, Text 
} from 'lucide-react';

export const SlashCommandList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
        return true;
      }

      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }

      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }

      return false;
    },
  }));

  return (
    <div className="bg-background border border-border shadow-2xl rounded-xl p-1 w-64 max-h-80 overflow-y-auto z-50">
      <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 mb-1">
        Basic Blocks
      </div>
      {props.items.length ? (
        props.items.map((item: any, index: number) => (
          <button
            key={index}
            className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-left transition-colors ${
              index === selectedIndex ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/60 text-foreground'
            }`}
            onClick={() => selectItem(index)}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
              index === selectedIndex ? 'border-primary/20 bg-primary/5' : 'border-border/50 bg-secondary/30'
            }`}>
              {item.icon}
            </div>
            <div>
              <p className="text-xs font-semibold">{item.title}</p>
              <p className="text-[10px] text-muted-foreground line-clamp-1">{item.description}</p>
            </div>
          </button>
        ))
      ) : (
        <div className="p-2 text-xs text-muted-foreground italic">No results</div>
      )}
    </div>
  );
});

SlashCommandList.displayName = 'SlashCommandList';

export const getSuggestionItems = ({ query }: { query: string }) => {
  return [
    {
      title: 'Text',
      description: 'Just start writing with plain text.',
      icon: <Text className="w-4 h-4" />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setNode('paragraph').run();
      },
    },
    {
      title: 'Heading 1',
      description: 'Big section heading.',
      icon: <Heading1 className="w-4 h-4" />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
      },
    },
    {
      title: 'Heading 2',
      description: 'Medium section heading.',
      icon: <Heading2 className="w-4 h-4" />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
      },
    },
    {
      title: 'Heading 3',
      description: 'Small section heading.',
      icon: <Heading3 className="w-4 h-4" />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
      },
    },
    {
      title: 'Bullet List',
      description: 'Create a simple bulleted list.',
      icon: <List className="w-4 h-4" />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      title: 'Numbered List',
      description: 'Create a list with numbering.',
      icon: <ListOrdered className="w-4 h-4" />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
    {
      title: 'Task List',
      description: 'Track tasks with checkboxes.',
      icon: <CheckSquare className="w-4 h-4" />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleTaskList().run();
      },
    },
    {
      title: 'Quote',
      description: 'Capture a quotation.',
      icon: <Quote className="w-4 h-4" />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run();
      },
    },
    {
      title: 'Code Block',
      description: 'Code snippet with syntax highlighting.',
      icon: <Code className="w-4 h-4" />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
      },
    },
    {
      title: 'Divider',
      description: 'Visually separate sections.',
      icon: <Minus className="w-4 h-4" />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run();
      },
    },
  ].filter(item => item.title.toLowerCase().startsWith(query.toLowerCase()));
};
