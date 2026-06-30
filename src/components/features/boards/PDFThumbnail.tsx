import React, { useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Loader2, FileText } from 'lucide-react';

// Configure PDF.js worker using a reliable CDN link
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.7.284/build/pdf.worker.min.mjs`;

interface PDFThumbnailProps {
  url: string;
  className?: string;
}

const PDFThumbnail: React.FC<PDFThumbnailProps> = ({ url, className }) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const renderThumbnail = async () => {
      try {
        setLoading(true);
        setError(false);
        
        // Fetch with a timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.arrayBuffer();
        
        const loadingTask = pdfjsLib.getDocument({ 
          data,
          disableRange: true,
          disableAutoFetch: true
        });
        
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        // Higher scale for better quality
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { alpha: false });

        if (!context) throw new Error('Could not get canvas context');

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Set white background for the canvas
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        if (isMounted) {
          setThumbnail(canvas.toDataURL('image/jpeg', 0.8));
          setLoading(false);
        }
        
        // Cleanup
        pdf.destroy();
      } catch (err) {
        console.error('Final attempt PDF error:', err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    renderThumbnail();

    return () => {
      isMounted = false;
    };
  }, [url]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white/5">
        <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
      </div>
    );
  }

  if (error || !thumbnail) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 gap-2">
        <FileText className="w-8 h-8 text-white/10" />
        <span className="text-[8px] font-bold text-white/20">PREVIEW UNAVAILABLE</span>
      </div>
    );
  }

  return (
    <img 
      src={thumbnail} 
      alt="PDF Preview" 
      className={`w-full h-full object-cover ${className}`}
    />
  );
};

export default PDFThumbnail;
