export function validateEnv(): void {
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_PUBLISHABLE_KEY',
  ] as const;

  const missing: string[] = [];

  for (const key of required) {
    if (!import.meta.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}.\n` +
      'Please ensure your .env file contains these values.'
    );
  }
}

export function getEnvVar(key: string, fallback: string = ''): string {
  const value = import.meta.env[key];
  if (!value && !fallback) {
    console.warn(`Environment variable ${key} is not set`);
    return '';
  }
  return (value as string) || fallback;
}
