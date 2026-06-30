import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { secureStorage } from './secure-storage';
import { validateEnv } from '@/lib/env';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

try {
  validateEnv();
} catch (e) {
  console.warn('[Supabase]', (e as Error).message);
}

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.warn('[Supabase] Missing configuration. App will run in limited mode.');
}

export const supabase = createClient<Database>(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_PUBLISHABLE_KEY || 'placeholder',
  {
    auth: {
      storage: secureStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);