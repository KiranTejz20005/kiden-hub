import { supabase } from '@/integrations/supabase/client';

export interface SearchResult {
  id: string;
  type: 'note' | 'file' | 'board' | 'conversation';
  title: string;
  snippet: string;
  icon: string;
  created_at: string;
  meta?: Record<string, any>;
}

export const searchAll = async (
  userId: string,
  query: string
): Promise<SearchResult[]> => {
  if (!query.trim() || query.length < 2) {return [];}
  const q = query.toLowerCase();
  const results: SearchResult[] = [];

  const [notesRes, filesRes, boardsRes, convsRes] = await Promise.allSettled([
    supabase
      .from('notes')
      .select('id, title, content_text, created_at')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .or(`title.ilike.%${q}%,content_text.ilike.%${q}%`)
      .limit(8),
    supabase
      .from('files')
      .select('id, name, type, size, created_at')
      .eq('user_id', userId)
      .ilike('name', `%${q}%`)
      .limit(6),
    supabase
      .from('research_boards' as any)
      .select('id, title, description, emoji, created_at')
      .eq('user_id', userId)
      .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
      .limit(4),
    supabase
      .from('conversations')
      .select('id, title, created_at')
      .eq('user_id', userId)
      .ilike('title', `%${q}%`)
      .limit(4),
  ]);

  if (notesRes.status === 'fulfilled' && notesRes.value.data) {
    notesRes.value.data.forEach((n: any) => {
      results.push({
        id: n.id,
        type: 'note',
        title: n.title || 'Untitled Note',
        snippet: (n.content_text || '').substring(0, 100),
        icon: '📝',
        created_at: n.created_at,
      });
    });
  }

  if (filesRes.status === 'fulfilled' && filesRes.value.data) {
    filesRes.value.data.forEach((f: any) => {
      const ext = f.name?.split('.').pop()?.toUpperCase() || 'FILE';
      results.push({
        id: f.id,
        type: 'file',
        title: f.name,
        snippet: `${ext} · ${f.size ? Math.round(f.size / 1024) + ' KB' : '—'}`,
        icon: getFileIcon(f.type),
        created_at: f.created_at,
        meta: { type: f.type, size: f.size },
      });
    });
  }

  if (boardsRes.status === 'fulfilled' && boardsRes.value.data) {
    (boardsRes.value.data as any[]).forEach((b: any) => {
      results.push({
        id: b.id,
        type: 'board',
        title: b.title,
        snippet: b.description || 'Research board',
        icon: b.emoji || '🔬',
        created_at: b.created_at,
      });
    });
  }

  if (convsRes.status === 'fulfilled' && convsRes.value.data) {
    convsRes.value.data.forEach((c: any) => {
      results.push({
        id: c.id,
        type: 'conversation',
        title: c.title || 'AI Conversation',
        snippet: 'AI Chat session',
        icon: '🤖',
        created_at: c.created_at,
      });
    });
  }

  return results.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

const getFileIcon = (mimeType: string): string => {
  if (!mimeType) {return '📄';}
  if (mimeType.startsWith('image/')) {return '🖼️';}
  if (mimeType.startsWith('video/')) {return '🎬';}
  if (mimeType.startsWith('audio/')) {return '🎵';}
  if (mimeType.includes('pdf')) {return '📕';}
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {return '📊';}
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {return '📽️';}
  if (mimeType.includes('word') || mimeType.includes('document')) {return '📃';}
  return '📄';
};
