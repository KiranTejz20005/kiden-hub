import { useState, useEffect, useRef } from 'react';
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns';
import { 
  BookOpen, Video, VideoOff, Download, Trash2, Plus, Calendar, 
  Smile, Frown, Meh, Heart, Zap, Cloud, Sun, Moon, Loader2,
  Camera, Square, Play, X, ChevronLeft, ChevronRight, BarChart3
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { JournalAnalytics } from './JournalAnalytics';

interface JournalEntry {
  id: string;
  user_id: string;
  title: string | null;
  content: string | null;
  mood: string | null;
  video_url: string | null;
  transcript: string | null;
  entry_date: string;
  created_at: string;
  updated_at: string;
}

const moods = [
  { value: 'happy', icon: Smile, label: 'Happy', color: 'text-yellow-500' },
  { value: 'sad', icon: Frown, label: 'Sad', color: 'text-blue-500' },
  { value: 'neutral', icon: Meh, label: 'Neutral', color: 'text-gray-500' },
  { value: 'loved', icon: Heart, label: 'Loved', color: 'text-pink-500' },
  { value: 'energetic', icon: Zap, label: 'Energetic', color: 'text-orange-500' },
  { value: 'calm', icon: Cloud, label: 'Calm', color: 'text-cyan-500' },
];

export function Journal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [existingEntry, setExistingEntry] = useState<JournalEntry | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch entries for current month
  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user, currentMonth]);

  // Load entry for selected date
  useEffect(() => {
    const entry = entries.find(e => 
      isSameDay(parseISO(e.entry_date), selectedDate)
    );
    if (entry) {
      setExistingEntry(entry);
      setTitle(entry.title || '');
      setContent(entry.content || '');
      setSelectedMood(entry.mood);
      setRecordedUrl(entry.video_url);
      setTranscript(entry.transcript || '');
      setRecordedBlob(null);
    } else {
      setExistingEntry(null);
      setTitle('');
      setContent('');
      setSelectedMood(null);
      setRecordedUrl(null);
      setTranscript('');
      setRecordedBlob(null);
    }
  }, [selectedDate, entries]);

  const fetchEntries = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('entry_date', start)
        .lte('entry_date', end)
        .order('entry_date', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error: any) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: true 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (error: any) {
      toast({
        title: 'Camera Error',
        description: 'Could not access camera. Please check permissions.',
        variant: 'destructive',
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setIsRecording(false);
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    
    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp9'
    });
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };
    
    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedBlob(blob);
      const url = URL.createObjectURL(blob);
      setRecordedUrl(url);
      stopCamera();
      
      // Transcribe the video audio
      await transcribeVideo(blob);
    };
    
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const transcribeVideo = async (blob: Blob) => {
    setTranscribing(true);
    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(blob);
      const base64Audio = await base64Promise;

      const { data, error } = await supabase.functions.invoke('transcribe-video', {
        body: { audio: base64Audio }
      });

      if (error) throw error;
      
      if (data?.text) {
        setTranscript(data.text);
        toast({
          title: 'Transcription Complete',
          description: 'Your video has been transcribed.',
        });
      } else if (data?.message) {
        console.log('Transcription note:', data.message);
      }
    } catch (error: any) {
      console.error('Transcription error:', error);
      toast({
        title: 'Transcription Failed',
        description: 'Could not transcribe video. You can still save the entry.',
        variant: 'destructive',
      });
    } finally {
      setTranscribing(false);
    }
  };

  const uploadVideo = async (): Promise<string | null> => {
    if (!recordedBlob || !user) return null;
    
    setUploading(true);
    try {
      const fileName = `${user.id}/${Date.now()}.webm`;
      const { data, error } = await supabase.storage
        .from('journal-videos')
        .upload(fileName, recordedBlob, {
          contentType: 'video/webm',
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('journal-videos')
        .getPublicUrl(fileName);

      // Since bucket is private, we need to create a signed URL
      const { data: signedData } = await supabase.storage
        .from('journal-videos')
        .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year

      return signedData?.signedUrl || null;
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const saveEntry = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      let videoUrl = existingEntry?.video_url || null;
      
      // Upload new video if recorded
      if (recordedBlob) {
        videoUrl = await uploadVideo();
      }

      const entryData = {
        user_id: user.id,
        title: title || null,
        content: content || null,
        mood: selectedMood,
        video_url: videoUrl,
        transcript: transcript || null,
        entry_date: format(selectedDate, 'yyyy-MM-dd'),
      };

      if (existingEntry) {
        const { error } = await supabase
          .from('journal_entries')
          .update(entryData)
          .eq('id', existingEntry.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('journal_entries')
          .insert(entryData);
        if (error) throw error;
      }

      toast({
        title: 'Entry Saved',
        description: `Journal entry for ${format(selectedDate, 'MMMM d, yyyy')} saved.`,
      });
      
      fetchEntries();
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: 'Save Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async () => {
    if (!existingEntry) return;
    
    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', existingEntry.id);
      
      if (error) throw error;
      
      toast({ title: 'Entry Deleted' });
      fetchEntries();
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const downloadVideo = () => {
    if (recordedUrl) {
      const a = document.createElement('a');
      a.href = recordedUrl;
      a.download = `journal-${format(selectedDate, 'yyyy-MM-dd')}.webm`;
      a.click();
    }
  };

  // Calendar helpers
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const hasEntry = (date: Date) => 
    entries.some(e => isSameDay(parseISO(e.entry_date), date));

  const getMoodForDate = (date: Date) => {
    const entry = entries.find(e => isSameDay(parseISO(e.entry_date), date));
    return entry?.mood;
  };

  return (
    <Tabs defaultValue="journal" className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="journal" className="gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Journal</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
        </TabsList>
      </div>
      
      <TabsContent value="analytics" className="flex-1 m-0 overflow-auto">
        <JournalAnalytics />
      </TabsContent>
      
      <TabsContent value="journal" className="flex-1 m-0 overflow-hidden">
        <div className="h-full flex flex-col lg:flex-row gap-4 p-4 pt-0">
      {/* Calendar Sidebar */}
      <Card className="lg:w-80 flex-shrink-0 border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              {format(currentMonth, 'MMMM yyyy')}
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="p-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="p-1" />
            ))}
            {daysInMonth.map(day => {
              const mood = getMoodForDate(day);
              const MoodIcon = moods.find(m => m.value === mood)?.icon;
              
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "p-1 h-9 w-full rounded-md text-xs transition-colors relative",
                    isSameDay(day, selectedDate) && "bg-primary text-primary-foreground",
                    isToday(day) && !isSameDay(day, selectedDate) && "ring-1 ring-primary",
                    hasEntry(day) && !isSameDay(day, selectedDate) && "bg-primary/20",
                    "hover:bg-accent"
                  )}
                >
                  {format(day, 'd')}
                  {MoodIcon && (
                    <MoodIcon className={cn(
                      "h-2 w-2 absolute bottom-0.5 right-0.5",
                      moods.find(m => m.value === mood)?.color
                    )} />
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Recent entries */}
          <div className="mt-4 pt-4 border-t border-border/50">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Recent Entries</h4>
            <ScrollArea className="h-32">
              {entries.slice(0, 5).map(entry => (
                <button
                  key={entry.id}
                  onClick={() => setSelectedDate(parseISO(entry.entry_date))}
                  className="w-full text-left p-2 rounded-md hover:bg-accent text-xs mb-1"
                >
                  <div className="flex items-center gap-2">
                    {entry.video_url && <Video className="h-3 w-3 text-primary" />}
                    <span className="font-medium">{format(parseISO(entry.entry_date), 'MMM d')}</span>
                    <span className="text-muted-foreground truncate flex-1">
                      {entry.title || 'Untitled'}
                    </span>
                  </div>
                </button>
              ))}
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* Main Editor */}
      <Card className="flex-1 border-border/50 bg-card/50 backdrop-blur-sm flex flex-col min-h-0">
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5 text-primary" />
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </CardTitle>
              {isToday(selectedDate) && (
                <Badge variant="secondary" className="mt-1 text-xs">Today</Badge>
              )}
            </div>
            <div className="flex gap-2">
              {existingEntry && (
                <Button variant="ghost" size="sm" onClick={deleteEntry}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button onClick={saveEntry} disabled={saving} size="sm">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {existingEntry ? 'Update' : 'Save'} Entry
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col min-h-0 gap-4">
          {/* Mood Selector */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">How are you feeling?</label>
            <div className="flex flex-wrap gap-2">
              {moods.map(mood => (
                <button
                  key={mood.value}
                  onClick={() => setSelectedMood(selectedMood === mood.value ? null : mood.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors",
                    selectedMood === mood.value 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-secondary hover:bg-secondary/80"
                  )}
                >
                  <mood.icon className={cn("h-3.5 w-3.5", selectedMood !== mood.value && mood.color)} />
                  {mood.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <Input
            placeholder="Entry title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-base font-medium"
          />

          {/* Content */}
          <Textarea
            placeholder="Write about your day..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 min-h-32 resize-none"
          />

          {/* Video Section */}
          <div className="border-t border-border/50 pt-4">
            <label className="text-xs text-muted-foreground mb-2 block">Video Journal</label>
            
            {showCamera ? (
              <div className="relative rounded-lg overflow-hidden bg-black aspect-video max-w-md">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {isRecording ? (
                    <Button variant="destructive" onClick={stopRecording}>
                      <Square className="h-4 w-4 mr-2" />
                      Stop Recording
                    </Button>
                  ) : (
                    <Button onClick={startRecording}>
                      <Video className="h-4 w-4 mr-2" />
                      Start Recording
                    </Button>
                  )}
                  <Button variant="secondary" onClick={stopCamera}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {isRecording && (
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-white text-sm font-medium">Recording</span>
                  </div>
                )}
              </div>
            ) : recordedUrl ? (
              <div className="space-y-2">
                <video
                  src={recordedUrl}
                  controls
                  className="rounded-lg max-w-md w-full aspect-video bg-black"
                />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={downloadVideo}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm" onClick={startCamera}>
                    <Camera className="h-4 w-4 mr-2" />
                    Record New
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setRecordedBlob(null);
                      setRecordedUrl(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" onClick={startCamera} className="gap-2">
                <Camera className="h-4 w-4" />
                Record Video Journal
              </Button>
            )}
            
            {uploading && (
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading video...
              </div>
            )}
            
            {transcribing && (
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Transcribing video...
              </div>
            )}
            
            {transcript && (
              <div className="mt-4 p-3 bg-secondary/50 rounded-lg">
                <label className="text-xs text-muted-foreground mb-1 block font-medium">Transcript</label>
                <p className="text-sm whitespace-pre-wrap">{transcript}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
      </TabsContent>
    </Tabs>
  );
}
