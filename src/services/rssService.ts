import { supabase } from '@/integrations/supabase/client';

export interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

export const fetchRSS = async (url: string): Promise<RSSItem[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('rss-parser', {
      body: { url }
    });

    if (error) throw error;
    return data.items || [];
  } catch (error) {
    console.error('RSS Fetch Error:', error);
    throw error;
  }
};

export const saveRSSItem = async (userId: string, item: RSSItem) => {
  const { data, error } = await supabase
    .from('media_extractions')
    .insert([{
      user_id: userId,
      title: item.title,
      source_url: item.link,
      source_type: 'rss',
      content: item.description,
      metadata: { pubDate: item.pubDate }
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};
