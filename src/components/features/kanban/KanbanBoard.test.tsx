import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, waitForElementToBeRemoved, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KanbanBoard } from './KanbanBoard';
import { DEFAULT_KANBAN_COLUMNS, type KanbanBoardData, type KanbanColumnDef } from '@/lib/kanban';

/** jsdom has no ResizeObserver, which Radix ScrollArea relies on. */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverStub;

/**
 * The global setup installs `matchMedia` as a `vi.fn`, and this project runs
 * with `mockReset: true`, so the implementation is stripped before every test.
 * framer-motion reads it during mount — restore a plain (non-mock) function.
 */
function installMatchMedia() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

type ChangeSpy = ReturnType<typeof vi.fn>;

function Harness({
  initial,
  onChange,
}: {
  initial: KanbanBoardData;
  onChange?: (next: KanbanBoardData) => void;
}) {
  const [data, setData] = useState<KanbanBoardData>(initial);
  return (
    <KanbanBoard
      columns={data.columns}
      cards={data.cards}
      title="My Board"
      onBoardChange={(next) => {
        setData(next);
        onChange?.(next);
      }}
    />
  );
}

const columnEl = (id: string): HTMLElement => {
  const el = document.querySelector(`[data-column-id="${id}"]`);
  if (!el) throw new Error(`column ${id} not rendered`);
  return el as HTMLElement;
};

const stateOf = (spy: ChangeSpy): KanbanBoardData =>
  spy.mock.calls[spy.mock.calls.length - 1][0] as KanbanBoardData;

const noteCard = (id: string, status: string, title = `Card ${id}`) => ({
  id,
  title,
  description: '',
  status,
  priority: 'medium' as const,
  tags: [],
});

beforeEach(() => {
  installMatchMedia();
  let counter = 0;
  try {
    Object.defineProperty(window, 'crypto', {
      writable: true,
      configurable: true,
      value: { randomUUID: () => `generated-${++counter}` },
    });
  } catch {
    // crypto is locked down by the global setup — newId() still guarantees uniqueness.
  }
});

describe('KanbanBoard — rendering', () => {
  it('renders every default category', () => {
    render(<Harness initial={{ columns: DEFAULT_KANBAN_COLUMNS, cards: [] }} />);
    for (const col of DEFAULT_KANBAN_COLUMNS) {
      expect(screen.getByRole('heading', { name: col.label })).toBeInTheDocument();
      expect(columnEl(col.id)).toBeInTheDocument();
    }
  });

  it('renders stored categories instead of the defaults', () => {
    const columns: KanbanColumnDef[] = [
      { id: 'a', label: 'Alpha', color: 'text-blue-400', icon: '🅰️' },
      { id: 'b', label: 'Beta', color: 'text-blue-400', icon: '🅱️' },
    ];
    render(<Harness initial={{ columns, cards: [] }} />);
    expect(screen.getByRole('heading', { name: 'Alpha' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Beta' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Backlog' })).not.toBeInTheDocument();
  });

  it('shows an empty hint for a category with no cards', () => {
    render(<Harness initial={{ columns: DEFAULT_KANBAN_COLUMNS, cards: [] }} />);
    expect(screen.getAllByText('No cards yet')).toHaveLength(DEFAULT_KANBAN_COLUMNS.length);
  });
});

describe('KanbanBoard — card CRUD', () => {
  it('creates a card in the chosen category', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initial={{ columns: DEFAULT_KANBAN_COLUMNS, cards: [] }} onChange={onChange} />);

    await user.click(within(columnEl('todo')).getByRole('button', { name: /add card/i }));
    await user.type(within(columnEl('todo')).getByPlaceholderText('Card title...'), 'Ship it{Enter}');

    expect(await screen.findByRole('heading', { name: 'Ship it' })).toBeInTheDocument();

    const next = stateOf(onChange);
    expect(next.cards).toHaveLength(1);
    expect(next.cards[0]).toMatchObject({ title: 'Ship it', status: 'todo', priority: 'medium' });
    expect(next.columns).toHaveLength(DEFAULT_KANBAN_COLUMNS.length);
  });

  it('refuses to create a card from an empty title', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initial={{ columns: DEFAULT_KANBAN_COLUMNS, cards: [] }} onChange={onChange} />);

    await user.click(within(columnEl('todo')).getByRole('button', { name: /add card/i }));
    await user.click(within(columnEl('todo')).getByRole('button', { name: /^add$/i }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('deletes a card after confirmation', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <Harness
        initial={{ columns: DEFAULT_KANBAN_COLUMNS, cards: [noteCard('c1', 'todo', 'Delete me')] }}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Delete Delete me' }));

    await waitForElementToBeRemoved(() => screen.queryByRole('heading', { name: 'Delete me' }));
    expect(stateOf(onChange).cards).toHaveLength(0);
    expect(window.confirm).toHaveBeenCalledOnce();
  });

  it('keeps the card when deletion is cancelled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(
      <Harness
        initial={{ columns: DEFAULT_KANBAN_COLUMNS, cards: [noteCard('c1', 'todo', 'Keep me')] }}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Delete Keep me' }));

    expect(screen.getByRole('heading', { name: 'Keep me' })).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('edits a card through the dialog', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <Harness
        initial={{ columns: DEFAULT_KANBAN_COLUMNS, cards: [noteCard('c1', 'review', 'Old title')] }}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Edit Old title' }));

    const dialog = await screen.findByRole('dialog');
    const titleInput = within(dialog).getByDisplayValue('Old title');
    await user.clear(titleInput);
    await user.type(titleInput, 'New title');
    await user.type(within(dialog).getByPlaceholderText('design, backend'), 'design, ui');
    await user.click(within(dialog).getByRole('button', { name: /save changes/i }));

    expect(await screen.findByRole('heading', { name: 'New title' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const next = stateOf(onChange);
    expect(next.cards[0]).toMatchObject({ title: 'New title', tags: ['design', 'ui'] });
  });

  it('moves the active card down a category with the arrow keys', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const { container } = render(
      <Harness
        initial={{ columns: DEFAULT_KANBAN_COLUMNS, cards: [noteCard('c1', 'backlog', 'Mover')] }}
        onChange={onChange}
      />,
    );

    const root = container.firstElementChild as HTMLElement;
    root.focus();

    await user.keyboard('{ArrowDown}');
    expect(stateOf(onChange).cards[0].status).toBe('todo');

    await user.keyboard('{ArrowUp}');
    expect(stateOf(onChange).cards[0].status).toBe('backlog');
  });
});

describe('KanbanBoard — category CRUD', () => {
  it('creates a new category', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initial={{ columns: DEFAULT_KANBAN_COLUMNS, cards: [] }} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /add category/i }));
    await user.type(screen.getByPlaceholderText('Category name...'), 'In Review{Enter}');

    expect(await screen.findByRole('heading', { name: 'In Review' })).toBeInTheDocument();

    const next = stateOf(onChange);
    expect(next.columns).toHaveLength(DEFAULT_KANBAN_COLUMNS.length + 1);
    const created = next.columns[next.columns.length - 1];
    expect(created.id).toBe('in-review');
    expect(next.cards).toEqual([]);
  });

  it('never reuses an existing category id', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initial={{ columns: DEFAULT_KANBAN_COLUMNS, cards: [] }} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /add category/i }));
    await user.type(screen.getByPlaceholderText('Category name...'), 'Done{Enter}');

    const ids = stateOf(onChange).columns.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('done-2');
  });

  it('renames a category', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initial={{ columns: DEFAULT_KANBAN_COLUMNS, cards: [] }} onChange={onChange} />);

    await user.dblClick(screen.getByRole('heading', { name: 'To Do' }));
    const input = screen.getByDisplayValue('To Do');
    await user.clear(input);
    await user.type(input, 'Queued{Enter}');

    expect(await screen.findByRole('heading', { name: 'Queued' })).toBeInTheDocument();
    const renamed = stateOf(onChange).columns.find(c => c.label === 'Queued');
    expect(renamed?.id).toBe('todo');
  });

  it('deletes a category and re-homes its cards', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <Harness
        initial={{
          columns: DEFAULT_KANBAN_COLUMNS,
          cards: [noteCard('c1', 'todo', 'Homeless'), noteCard('c2', 'done', 'Stays')],
        }}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Delete To Do' }));

    expect(screen.queryByRole('heading', { name: 'To Do' })).not.toBeInTheDocument();
    const next = stateOf(onChange);
    expect(next.columns.map(c => c.id)).not.toContain('todo');
    expect(next.cards.find(c => c.id === 'c1')?.status).toBe('backlog');
    expect(next.cards.find(c => c.id === 'c2')?.status).toBe('done');
  });

  it('does not delete the last remaining category', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Harness
        initial={{
          columns: [{ id: 'only', label: 'Only', color: 'text-blue-400', icon: '🔹' }],
          cards: [],
        }}
        onChange={onChange}
      />,
    );

    const btn = screen.getByRole('button', { name: 'Delete Only' });
    expect(btn).toBeDisabled();
    await user.click(btn);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('KanbanBoard — filtering', () => {
  it('filters cards by search text', async () => {
    const user = userEvent.setup();
    render(
      <Harness
        initial={{
          columns: DEFAULT_KANBAN_COLUMNS,
          cards: [noteCard('c1', 'todo', 'Alpha task'), noteCard('c2', 'todo', 'Beta task')],
        }}
      />,
    );

    await user.type(screen.getByLabelText('Search cards'), 'Alpha');
    expect(screen.getByRole('heading', { name: 'Alpha task' })).toBeInTheDocument();
    await waitForElementToBeRemoved(() => screen.queryByRole('heading', { name: 'Beta task' }));
  });

  it('does not hide a card that is being created behind a stale search', async () => {
    const user = userEvent.setup();
    render(
      <Harness
        initial={{
          columns: DEFAULT_KANBAN_COLUMNS,
          cards: [noteCard('c1', 'todo', 'Something else')],
        }}
      />,
    );

    await user.type(screen.getByLabelText('Search cards'), 'nomatch');
    await waitForElementToBeRemoved(() => screen.queryByRole('heading', { name: 'Something else' }));

    await user.click(within(columnEl('todo')).getByRole('button', { name: /add card/i }));
    await user.type(within(columnEl('todo')).getByPlaceholderText('Card title...'), 'Fresh card{Enter}');

    expect(await screen.findByRole('heading', { name: 'Fresh card' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('Search cards')).toHaveValue(''));
  });
});
