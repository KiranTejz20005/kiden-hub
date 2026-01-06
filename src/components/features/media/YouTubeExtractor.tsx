import { useState } from 'react';
import { Youtube, Loader2, ExternalLink, Clock, User, FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ExtractionResult {
  videoId: string;
  title: string;
  author: string;
  thumbnailUrl: string;
  hasTranscript: boolean;
  content: string;
  summary: string;
}

export function YouTubeExtractor() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleExtract = async () => {
    if (!url.trim()) {
      toast({
        title: 'URL Required',
        description: 'Please enter a YouTube video URL',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('youtube-extract', {
        body: { url, userId: user?.id },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
      toast({
        title: 'Extraction Complete',
        description: `Successfully extracted content from "${data.title}"`,
      });
    } catch (error: any) {
      console.error('Extraction error:', error);
      toast({
        title: 'Extraction Failed',
        description: error.message || 'Failed to extract video content',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleExtract();
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* URL Input */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Youtube className="h-5 w-5 text-red-500" />
            YouTube Video Extractor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Input
              placeholder="Paste YouTube URL (e.g., https://youtube.com/watch?v=...)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 text-sm sm:text-base"
              disabled={loading}
            />
            <Button 
              onClick={handleExtract} 
              disabled={loading || !url.trim()}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Extracting...</span>
                  <span className="sm:hidden">Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Extract & Summarize
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Supports youtube.com, youtu.be, and YouTube Shorts URLs
          </p>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="py-8 sm:py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 animate-ping bg-primary/20 rounded-full" />
                <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary" />
              </div>
              <div className="text-center">
                <p className="font-medium text-sm sm:text-base">Processing video...</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Extracting transcript and generating AI summary
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && !loading && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
          {/* Video Header */}
          <div className="relative">
            <img
              src={result.thumbnailUrl}
              alt={result.title}
              className="w-full h-32 sm:h-48 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
              <h3 className="font-semibold text-sm sm:text-lg text-foreground line-clamp-2">
                {result.title}
              </h3>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3 sm:h-4 sm:w-4" />
                  {result.author}
                </span>
                <Badge variant={result.hasTranscript ? 'default' : 'secondary'} className="text-xs">
                  {result.hasTranscript ? 'Transcript Available' : 'No Transcript'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
              <TabsTrigger 
                value="summary" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm"
              >
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                AI Summary
              </TabsTrigger>
              <TabsTrigger 
                value="transcript" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm"
              >
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Transcript
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary" className="m-0">
              <ScrollArea className="h-64 sm:h-80">
                <div className="p-3 sm:p-4 prose prose-sm dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">
                    {result.summary}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="transcript" className="m-0">
              <ScrollArea className="h-64 sm:h-80">
                <div className="p-3 sm:p-4">
                  {result.hasTranscript ? (
                    <div className="whitespace-pre-wrap text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {result.content}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50 mb-3" />
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        No transcript available for this video.
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        The video may not have captions enabled.
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="border-t border-border/50 p-3 sm:p-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm"
              onClick={() => window.open(`https://youtube.com/watch?v=${result.videoId}`, '_blank')}
            >
              <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Open Video
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm"
              onClick={() => {
                navigator.clipboard.writeText(result.summary);
                toast({ title: 'Copied!', description: 'Summary copied to clipboard' });
              }}
            >
              Copy Summary
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
