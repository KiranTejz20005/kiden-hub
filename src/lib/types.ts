export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  focus_settings: FocusSettings;
  created_at: string;
  updated_at: string;
}

export interface FocusSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
}

export interface Workspace {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface Collection {
  id: string;
  user_id: string;
  workspace_id: string | null;
  name: string;
  icon: string;
  color: string;
  item_count: number;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  workspace_id: string | null;
  collection_id: string | null;
  title: string;
  content: any[];
  icon: string;
  cover_image: string | null;
  is_template: boolean;
  template_category: string | null;
  is_archived: boolean;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface Idea {
  id: string;
  user_id: string;
  content: string;
  category: 'neural' | 'creative' | 'logic' | 'project';
  is_processed: boolean;
  note_id: string | null;
  created_at: string;
}

export interface FocusSession {
  id: string;
  user_id: string;
  note_id: string | null;
  duration_minutes: number;
  session_type: 'work' | 'short_break' | 'long_break' | 'flow';
  completed: boolean;
  started_at: string;
  ended_at: string | null;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface Template {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  category: 'project' | 'task' | 'kanban' | 'goal' | 'sprint' | 'custom';
  content: any[];
  icon: string;
  is_system: boolean;
  created_at: string;
}