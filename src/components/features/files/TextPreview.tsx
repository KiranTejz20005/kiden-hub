import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface TextPreviewProps {
  url: string;
  className?: string;
}

const TextPreview: React.FC<TextPreviewProps> = ({ url, className }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) {throw new Error('Failed to fetch text content');}
        const text = await res.text();
        setContent(text.slice(0, 400));
      } catch (err) {
        console.error('Error fetching text preview:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [url]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white/5">
        <Loader2 className="w-4 h-4 animate-spin text-primary/40" />
      </div>
    );
  }

  return (
    <div className={`w-full h-full p-4 overflow-hidden bg-white/[0.02] relative ${className}`}>
      <pre className="text-[7px] text-white/30 font-mono leading-relaxed break-all whitespace-pre-wrap select-none">
        {content || 'No content found.'}
      </pre>
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
    </div>
  );
};

export default TextPreview;
