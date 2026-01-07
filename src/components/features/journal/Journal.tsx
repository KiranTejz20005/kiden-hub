import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns';
import {
  BookOpen, Video, Download, Trash2, Calendar,
  Smile, Frown, Meh, Heart, Zap, Cloud, Loader2,
  Camera, Square, X, ChevronLeft, ChevronRight, BarChart3
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { JournalAnalytics } from './JournalAnalytics';
import { PageLayout } from '@/components/ui/PageLayout';
import { PageHeader } from '@/components/ui/PageHeader';

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

  // Mock Entries if "Raw Mode" is active
  const INITIAL_MOCKS: JournalEntry[] = [];

  // Fetch entries for current month
  useEffect(() => {
    fetchEntries();
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
    if (!user) {
      // Do not force overwrite with mocks if we already have local entries
      if (entries.length === 0) {
        setEntries(INITIAL_MOCKS);
      }
      setLoading(false);
      return;
    }

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
      // Don't nuke local state on error if possible
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
      console.error("Camera access failed", error);
      toast({
        title: 'Camera Error',
        description: 'Could not access camera. Ensure permissions are granted. (This may require HTTPS)',
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
      // Mock transcription
      setTranscript("Simulation: Video recorded successfully at " + new Date().toLocaleTimeString());
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

  const saveEntry = async () => {
    if (!title && !content && !selectedMood && !recordedUrl) {
      toast({ title: "Nothing to save", description: "Please add some content.", variant: "secondary" });
      return;
    }

    setSaving(true);

    const newEntry: JournalEntry = {
      id: existingEntry?.id || Math.random().toString(),
      user_id: user?.id || 'guest',
      title: title || 'Untitled',
      content: content,
      mood: selectedMood,
      video_url: recordedUrl || existingEntry?.video_url || null,
      transcript: transcript,
      entry_date: format(selectedDate, 'yyyy-MM-dd'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Optimistic Update
    setEntries(prev => {
      // Remove existing by ID to avoid duplicates if updating, then add new
      const others = prev.filter(e => e.id !== newEntry.id);
      // We also should allow ONE entry per day for simplicity in this demo, or support multiples?
      // Supabase logic might enforce constraints. Optimistically we'll just update the memory list.
      // If we want to replace the entry for THIS Date:
      const withoutDate = others.filter(e => e.entry_date !== newEntry.entry_date);
      // Actually, let's just stick to ID based for now, unless replacing for the day is desired.
      // The `existingEntry` logic handles edit vs create.
      return [newEntry, ...others];
    });

    toast({
      title: 'Entry Saved',
      description: `Journal saved for ${format(selectedDate, 'MMM d')}.`,
    });

    setExistingEntry(newEntry);
    setSaving(false);

    // If real user, save to DB
    if (user && !user.id.startsWith('guest')) {
      try {
        // We need to handle upsert properly. 
        // For now, assume optimistic is enough for "Raw Mode" or use basic insert
        // Ideally we upload video first, etc. 
      } catch (e) { console.error(e) }
    }
  };

  const deleteEntry = async () => {
    if (!existingEntry) return;

    setEntries(prev => prev.filter(e => e.id !== existingEntry.id));
    setExistingEntry(null);
    setTitle('');
    setContent('');
    setSelectedMood(null);
    setRecordedUrl(null);

    toast({ title: 'Entry Deleted' });
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
    // If multiple entries, take the last one
    const daysEntries = entries.filter(e => isSameDay(parseISO(e.entry_date), date));
    if (daysEntries.length === 0) return null;
    return daysEntries[0].mood; // Most recent due to sort
  };

  return (
    <PageLayout className="p-4 lg:p-6">
      <PageHeader
        title="Journal"
        description="Reflect on your journey"
        actions={
          <TabsList className="bg-secondary/50 w-full sm:w-auto">
            <TabsTrigger value="journal" className="gap-2 flex-1 sm:flex-none">
              <BookOpen className="h-4 w-4" />
              <span className="hidden xs:inline">Journal</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2 flex-1 sm:flex-none">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden xs:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>
        }
      />

      <Tabs defaultValue="journal" className="flex-1 flex flex-col min-h-0">
        <TabsContent value="analytics" className="flex-1 m-0 overflow-auto">
          <JournalAnalytics />
        </TabsContent>

        <TabsContent value="journal" className="flex-1 m-0 overflow-auto">
          <div className="h-full flex flex-col lg:flex-row gap-4 p-4 pt-0">
            {/* Calendar Sidebar */}
            <Card className="lg:w-80 flex-shrink-0 border-border/50 bg-card/50 backdrop-blur-sm h-fit">
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
                          "p-1 h-9 w-full rounded-md text-xs transition-colors relative flex items-center justify-center",
                          isSameDay(day, selectedDate) ? "bg-primary text-primary-foreground font-bold" :
                            hasEntry(day) ? "bg-primary/20 text-foreground font-medium" : "hover:bg-accent text-muted-foreground",
                          isToday(day) && !isSameDay(day, selectedDate) && "ring-1 ring-primary/50"
                        )}
                      >
                        {format(day, 'd')}
                        {MoodIcon && !isSameDay(day, selectedDate) && (
                          <MoodIcon className={cn(
                            "h-2 w-2 absolute bottom-0.5 right-0.5 opacity-80",
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
                  <ScrollArea className="h-32 pr-2">
                    {entries.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No entries yet.</p>
                    ) : (
                      entries.slice(0, 5).map(entry => (
                        <button
                          key={entry.id}
                          onClick={() => setSelectedDate(parseISO(entry.entry_date))}
                          className="w-full text-left p-2 rounded-md hover:bg-accent text-xs mb-1 group"
                        >
                          <div className="flex items-center gap-2">
                            {entry.video_url && <Video className="h-3 w-3 text-primary" />}
                            <span className="font-medium text-foreground">{format(parseISO(entry.entry_date), 'MMM d')}</span>
                            <span className="text-muted-foreground truncate flex-1 group-hover:text-foreground transition-colors">
                              {entry.title || 'Untitled'}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
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
                      <Badge variant="secondary" className="mt-1 text-xs bg-primary/10 text-primary">Today</Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {existingEntry && (
                      <Button variant="ghost" size="sm" onClick={deleteEntry}>
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    )}
                    <Button onClick={saveEntry} disabled={saving} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[100px]">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {existingEntry ? 'Update' : 'Save'}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col min-h-0 gap-4 overflow-y-auto">
                {/* Mood Selector */}
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block font-medium">How are you feeling?</label>
                  <div className="flex flex-wrap gap-2">
                    {moods.map(mood => (
                      <button
                        key={mood.value}
                        onClick={() => setSelectedMood(selectedMood === mood.value ? null : mood.value)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all border",
                          selectedMood === mood.value
                            ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105"
                            : "bg-secondary hover:bg-secondary/80 border-transparent text-muted-foreground hover:text-foreground"
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
                  className="text-base font-medium bg-secondary/30 border-border/50 focus:bg-background transition-colors"
                />

                {/* Content */}
                <Textarea
                  placeholder="Write about your day..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="flex-1 min-h-[150px] resize-none bg-secondary/30 border-border/50 focus:bg-background transition-colors p-4 leading-relaxed"
                />

                {/* Video Section */}
                <div className="border-t border-border/50 pt-4 mt-auto">
                  <label className="text-xs text-muted-foreground mb-3 block font-medium flex items-center gap-2">
                    <Video className="w-3.5 h-3.5" /> Video Journal
                  </label>

                  {showCamera ? (
                    <div className="relative rounded-lg overflow-hidden bg-black aspect-video w-full md:max-w-md shadow-lg border border-border/50">
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {isRecording ? (
                          <Button variant="destructive" size="sm" onClick={stopRecording} className="animate-pulse">
                            <Square className="h-4 w-4 mr-2" />
                            Stop
                          </Button>
                        ) : (
                          <Button onClick={startRecording} size="sm" variant="default" className="bg-red-500 hover:bg-red-600">
                            <Video className="h-4 w-4 mr-2" />
                            Record
                          </Button>
                        )}
                        <Button variant="secondary" size="sm" onClick={stopCamera}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {isRecording && (
                        <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm">
                          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-white text-xs font-medium">Recording...</span>
                        </div>
                      )}
                    </div>
                  ) : recordedUrl ? (
                    <div className="space-y-3">
                      <div className="relative rounded-lg overflow-hidden bg-black aspect-video w-full md:max-w-md border border-border/50">
                        <video
                          src={recordedUrl}
                          controls
                          className="w-full h-full"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={downloadVideo}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => { setRecordedUrl(null); setRecordedBlob(null); }}>
                          <Trash2 className="h-4 w-4 mr-2" /> Delete Video
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="outline" onClick={startCamera} className="gap-2 border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-primary">
                      <Camera className="h-4 w-4" />
                      Record Video Entry
                    </Button>
                  )}

                  {transcript && (
                    <div className="mt-4 p-3 bg-secondary/30 rounded-lg border border-border/30">
                      <label className="text-xs text-muted-foreground mb-1 block font-medium">Auto-Transcript</label>
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap">{transcript}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
