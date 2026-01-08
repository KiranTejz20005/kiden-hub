export type ActiveView =
  | 'command'
  | 'analytics'
  | 'tasks'
  | 'projects'
  | 'notebook'
  | 'ideas'
  | 'journal'
  | 'chat'
  | 'habits'
  | 'books'
  | 'leetcode'
  | 'settings';

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  website?: string | null;
  bio?: string | null;
  status?: 'online' | 'away' | 'offline' | 'dnd';
  updated_at?: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color: string;
  status: 'active' | 'archived';
  target_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  project_id?: string | null;
  title: string;
  description?: string | null;
  status: 'todo' | 'in_progress' | 'done' | 'backlog';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string | null;
  estimated_minutes?: number | null;
  created_at: string;
  updated_at: string;
  tags?: string[];
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  icon: string;
  color: string;
  goal: number;
  unit: string;
  is_active: boolean;
  created_at?: string;
  current?: number; // UI only
  completed?: boolean; // UI only
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  value: number;
  date: string;
  completed_at?: string;
}

export interface Idea {
  id: string;
  user_id: string;
  content: string;
  category?: string;
  tags?: string[];
  is_voice?: boolean;
  created_at: string;
}

export interface Workspace {
  id: string;
  user_id: string;
  name: string;
  slug?: string;
  icon?: string;
  created_at?: string;
  updated_at?: string;
  role?: 'owner' | 'admin' | 'member';
}

export interface Collection {
  id: string;
  workspace_id: string;
  name: string;
  color?: string;
  icon?: string;
  item_count?: number;
  created_at?: string;
}

export interface FocusSession {
  id: string;
  user_id: string;
  project_id?: string | null;
  task_id?: string | null;
  duration_minutes: number;
  session_type: 'work' | 'short_break' | 'long_break' | 'flow';
  started_at: string;
  ended_at?: string;
  completed: boolean;
  interruptions_count?: number;
}

export interface FocusSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
}

export interface Note {
  id: string;
  user_id: string;
  workspace_id?: string | null;
  title: string;
  content: any;
  is_favorite: boolean;
  is_archived: boolean;
  is_template: boolean;
  icon?: string;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  user_id: string;
  name: string;
  description: string;
  category: string;
  content: any;
  icon: string;
  is_system: boolean;
  created_at: string;
}