/**
 * Safe parsing utilities to prevent runtime errors
 * All functions handle null/undefined/invalid inputs gracefully
 */

export function safeParseDate(dateValue: any, fallback: Date = new Date()): Date {
  try {
    if (!dateValue) return fallback;
    
    const date = new Date(dateValue);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date value:', dateValue);
      return fallback;
    }
    return date;
  } catch (error) {
    console.warn('Error parsing date:', error, 'value:', dateValue);
    return fallback;
  }
}

export function safeFormatDate(
  dateValue: any,
  formatter: (date: Date) => string,
  fallback: string = 'Unknown'
): string {
  try {
    const date = safeParseDate(dateValue);
    return formatter(date);
  } catch (error) {
    console.warn('Error formatting date:', error);
    return fallback;
  }
}

export function safeParseJSON<T>(
  jsonString: string | null | undefined,
  fallback: T
): T {
  if (!jsonString) return fallback;
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.warn('Error parsing JSON:', error);
    return fallback;
  }
}

export function safeAccess<T>(
  obj: any,
  path: string,
  fallback: T
): T {
  try {
    const value = path.split('.').reduce((current, key) => current?.[key], obj);
    return value !== undefined ? value : fallback;
  } catch (error) {
    return fallback;
  }
}

export function safeNumberFormat(value: any, fallback: number = 0): number {
  if (value === null || value === undefined) return fallback;
  const num = Number(value);
  return isNaN(num) ? fallback : num;
}

export function safeStringFormat(value: any, fallback: string = ''): string {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

export interface SafeContentPiece {
  id: string;
  title: string;
  description: string;
  published_at: Date;
  thumbnail_url: string;
  high_res_thumbnail: string;
  channel_name: string;
  channel_avatar: string;
  view_count: number;
  duration_seconds: number;
  virality_score: number;
  quality_score: number;
  engagement_rate: number;
}

/**
 * Validate and normalize content piece with fallbacks
 */
export function safeNormalizeContentPiece(item: any): SafeContentPiece {
  return {
    id: safeStringFormat(item?.id || item?.video_id, 'unknown'),
    title: safeStringFormat(item?.title, 'Untitled'),
    description: safeStringFormat(item?.description, ''),
    published_at: safeParseDate(item?.published_at, new Date()),
    thumbnail_url: safeStringFormat(item?.thumbnail_url, '/placeholder.png'),
    high_res_thumbnail: safeStringFormat(item?.high_res_thumbnail, ''),
    channel_name: safeStringFormat(item?.channel_name, 'Unknown Channel'),
    channel_avatar: safeStringFormat(item?.channel_avatar, '/default-avatar.png'),
    view_count: safeNumberFormat(item?.view_count, 0),
    duration_seconds: safeNumberFormat(item?.duration_seconds, 0),
    virality_score: safeNumberFormat(item?.virality_score, 0),
    quality_score: safeNumberFormat(item?.quality_score, 0),
    engagement_rate: safeNumberFormat(item?.engagement_rate, 0),
  };
}
