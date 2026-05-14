import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  FileText, Image as ImageIcon, Video, Download, Trash2, Search,
  Upload, Loader2, File, ExternalLink, FolderOpen, Grid3X3, List,
  HardDrive, X, MoreVertical, Youtube, Sparkles
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useDropzone } from 'react-dropzone';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { YouTubeSearchLibrary } from './YouTubeSearchLibrary';
import { DiscoverFeed } from './DiscoverFeed';
import { logActivity } from '@/services/activityService';

const FILE_SIZE_LIMIT = 50 * 1024 * 1024; // 50MB

const FILE_CFG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  pdf:  { icon: <FileText className="w-5 h-5" />, color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
  md:   { icon: <FileText className="w-5 h-5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  txt:  { icon: <FileText className="w-5 h-5" />, color: 'text-zinc-300',   bg: 'bg-zinc-500/10 border-zinc-500/20' },
  doc:  { icon: <FileText className="w-5 h-5" />, color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
  docx: { icon: <FileText className="w-5 h-5" />, color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
  jpg:  { icon: <ImageIcon className="w-5 h-5" />, color: 'text-pink-400',  bg: 'bg-pink-500/10 border-pink-500/20' },
  jpeg: { icon: <ImageIcon className="w-5 h-5" />, color: 'text-pink-400',  bg: 'bg-pink-500/10 border-pink-500/20' },
  png:  { icon: <ImageIcon className="w-5 h-5" />, color: 'text-pink-400',  bg: 'bg-pink-500/10 border-pink-500/20' },
  gif:  { icon: <ImageIcon className="w-5 h-5" />, color: 'text-pink-400',  bg: 'bg-pink-500/10 border-pink-500/20' },
  svg:  { icon: <ImageIcon className="w-5 h-5" />, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  mp4:  { icon: <Video className="w-5 h-5" />,     color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20' },
  mov:  { icon: <Video className="w-5 h-5" />,     color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20' },
  json: { icon: <FileText className="w-5 h-5" />, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  csv:  { icon: <FileText className="w-5 h-5" />, color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
};

const getCfg = (type: string) =>
  FILE_CFG[type?.toLowerCase()] ?? { icon: <File className="w-5 h-5" />, color: 'text-zinc-400', bg: 'bg-zinc-500/10 border-zinc-500/20' };

const fmtSize = (b: number) => {
  if (!b) return '0 B';
  const k = 1024, s = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${parseFloat((b / Math.pow(k, i)).toFixed(1))} ${s[i]}`;
};

const IS_IMAGE = (t: string) => ['jpg','jpeg','png','gif','webp','svg'].includes(t?.toLowerCase());
const IS_VIDEO = (t: string) => ['mp4','mov','avi','webm'].includes(t?.toLowerCase());
const IS_TEXT  = (t: string) => ['md','txt','json','csv','js','ts','html','css'].includes(t?.toLowerCase());

const TABS = ['All', 'Documents', 'Images', 'Videos', 'YouTube', 'Trending', 'Other'];
const TAB_TYPES: Record<string,string[]> = {
  Documents: ['pdf','doc','docx','md','txt','json','csv','js','ts','html','css'],
  Images:    ['jpg','jpeg','png','gif','svg','webp'],
  Videos:    ['mp4','mov','avi','webm','mkv'],
};

// ─── Preview Modal ───────────────────────────────────────────
const PreviewModal = ({ file, onClose }: { file: any; onClose: () => void }) => {
  const [textContent, setTextContent] = useState<string | null>(null);
  const type = file.type?.toLowerCase();

  useEffect(() => {
    if (IS_TEXT(type)) {
      fetch(file.public_url).then(r => r.text()).then(setTextContent).catch(() => setTextContent('Could not load file content.'));
    }
  }, [file]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-card border border-border/60 rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className={cn('shrink-0', getCfg(type).color)}>{getCfg(type).icon}</span>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{file.name}</p>
              <p className="text-[10px] text-muted-foreground">{fmtSize(file.size)} · {type?.toUpperCase()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a href={file.public_url} download={file.name} className="px-3 py-1.5 rounded-lg bg-secondary/50 hover:bg-secondary text-xs font-semibold transition-all flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> Download
            </a>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto min-h-0 flex items-center justify-center bg-black/20">
          {IS_IMAGE(type) && (
            <img src={file.public_url} alt={file.name} className="max-w-full max-h-full object-contain" />
          )}
          {IS_VIDEO(type) && (
            <video src={file.public_url} controls className="max-w-full max-h-full rounded-xl" />
          )}
          {type === 'pdf' && (
            <iframe src={file.public_url} title={file.name} className="w-full h-full min-h-[70vh]" />
          )}
          {IS_TEXT(type) && (
            <div className="w-full h-full p-6 overflow-auto">
              {textContent === null
                ? <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
                : <pre className="text-xs font-mono text-foreground/90 whitespace-pre-wrap leading-relaxed">{textContent}</pre>
              }
            </div>
          )}
          {!IS_IMAGE(type) && !IS_VIDEO(type) && type !== 'pdf' && !IS_TEXT(type) && (
            <div className="flex flex-col items-center gap-4 p-12 text-center">
              <div className={cn('w-20 h-20 rounded-2xl border flex items-center justify-center', getCfg(type).bg)}>
                <span className={cn('scale-150', getCfg(type).color)}>{getCfg(type).icon}</span>
              </div>
              <p className="text-muted-foreground text-sm">No preview available for this file type.</p>
              <a href={file.public_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:opacity-90">
                <ExternalLink className="w-4 h-4" /> Open in browser
              </a>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main Component ─────────────────────────────────────────
const FileStorage = () => {
  const { user } = useAuth();
  const [files, setFiles]         = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch]       = useState('');
  const [tab, setTab]             = useState('All');
  const [view, setView]           = useState<'grid'|'list'>('grid');
  const [preview, setPreview]     = useState<any>(null);
  
  // Prevent tab refresh refetch spam
  const fetchInProgressRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const FETCH_COOLDOWN = 5 * 60 * 1000; // 5 minutes

  const fetchFiles = useCallback(async () => {
    if (fetchInProgressRef.current) return;
    const now = Date.now();
    if (now - lastFetchTimeRef.current < FETCH_COOLDOWN) return;
    
    if (!user) return;
    fetchInProgressRef.current = true;
    try {
      setLoading(true);
      const { data } = await supabase.from('files').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setFiles(data ?? []);
      lastFetchTimeRef.current = now;
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  }, [user]);

  useEffect(() => {
    if (user && files.length === 0) fetchFiles();
  }, [user]);
  
  // Refetch only on tab visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchFiles();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  const onDrop = useCallback(async (accepted: File[]) => {
    if (!user) return;
    setUploading(true);
    for (const file of accepted) {
      if (file.size > FILE_SIZE_LIMIT) { toast.error(`${file.name} exceeds 50MB limit`); continue; }
      try {
        const ext  = file.name.split('.').pop() ?? 'bin';
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('kiden-files').upload(path, file);
        if (upErr) throw upErr;
        const { data: { publicUrl } } = supabase.storage.from('kiden-files').getPublicUrl(path);
        const { error: dbErr } = await supabase.from('files').insert([{
          user_id: user.id, name: file.name, size: file.size,
          type: ext, mime_type: file.type, storage_path: path, public_url: publicUrl
        }]);
        if (dbErr) throw dbErr;
        
        // Log Activity
        logActivity(user.id, 'upload', file.name, 'file');
        
        toast.success(`${file.name} uploaded`);
      } catch (e: any) { toast.error(`Upload failed: ${e.message}`); }
    }
    setUploading(false);
    fetchFiles();
  }, [user, fetchFiles]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({ onDrop, noClick: true, noKeyboard: true });

  const deleteFile = async (file: any) => {
    await supabase.storage.from('kiden-files').remove([file.storage_path]);
    await supabase.from('files').delete().eq('id', file.id);
    
    // Log Activity
    logActivity(user.id, 'delete_file', file.name, 'file');
    
    setFiles(prev => prev.filter(f => f.id !== file.id));
    toast.success('File deleted');
  };

  const filtered = files.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchTab =
      tab === 'All' ? true :
      tab === 'Other' ? !Object.values(TAB_TYPES).flat().includes(f.type?.toLowerCase()) :
      TAB_TYPES[tab]?.includes(f.type?.toLowerCase());
    return matchSearch && matchTab;
  });

  const totalSize = files.reduce((a, f) => a + (f.size ?? 0), 0);
  const usagePct  = Math.min((totalSize / (5 * 1024 ** 3)) * 100, 100);

  return (
    <>
      {/* Preview Modal */}
      <AnimatePresence>
        {preview && <PreviewModal file={preview} onClose={() => setPreview(null)} />}
      </AnimatePresence>

      {/* Page */}
      <div {...getRootProps()} className="flex flex-col h-full bg-background overflow-hidden relative">
        <input {...getInputProps()} />

        {/* Drag overlay */}
        <AnimatePresence>
          {isDragActive && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 bg-emerald-500/10 border-2 border-dashed border-emerald-500 rounded-2xl flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <Upload className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <p className="text-xl font-bold text-emerald-300">Drop files to upload</p>
                <p className="text-sm text-emerald-400/70">Max 50MB per file</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Top Bar ── */}
        <div className="flex items-center gap-4 px-6 py-3.5 border-b border-border/40 bg-card/20 shrink-0">
          <div className="min-w-0">
            <h1 className="text-lg font-bold leading-tight capitalize">{tab === 'All' ? 'Files' : tab}</h1>
            <p className="text-[11px] text-muted-foreground">
              {tab === 'YouTube' ? 'Search and manage study videos' : 
               tab === 'Trending' ? 'Discover educational content' : 
               `${files.length} files · ${fmtSize(totalSize)}`}
            </p>
          </div>

          {/* Storage bar - Hide if on discovery tabs to save space if needed, or keep for consistency */}
          {(tab !== 'YouTube' && tab !== 'Trending') && (
            <div className="flex items-center gap-2 w-40">
              <HardDrive className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <div className="flex-1 h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: `${usagePct}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground">{usagePct.toFixed(1)}%</span>
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {(tab !== 'YouTube' && tab !== 'Trending') && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input placeholder="Search files…" className="pl-9 h-9 w-48 bg-secondary/30 border-border/40 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            )}

            {(tab !== 'YouTube' && tab !== 'Trending') && (
              <div className="flex items-center bg-secondary/40 rounded-lg p-0.5 border border-border/40">
                {(['grid','list'] as const).map(m => (
                  <button key={m} onClick={() => setView(m)} className={cn('p-1.5 rounded-md transition-all', view === m ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                    {m === 'grid' ? <Grid3X3 className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}

            {(tab !== 'YouTube' && tab !== 'Trending') && (
              <button
                onClick={open}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-60"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
            )}
            
            {tab === 'YouTube' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-widest">
                <Youtube className="w-3.5 h-3.5" /> Study Library
              </div>
            )}
            
            {tab === 'Trending' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5" /> Discovery Mode
              </div>
            )}
          </div>
        </div>

        {/* ── Filter Tabs ── */}
        <div className="flex items-center gap-1 px-6 py-2 border-b border-border/30 shrink-0">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all', tab === t ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40')}>
              {t}
            </button>
          ))}
        </div>

        {/* ── Drop hint strip ── */}
        {(tab !== 'YouTube' && tab !== 'Trending') && (
          <div className="mx-6 mt-4 py-3 px-5 rounded-xl border border-dashed border-border/40 flex items-center gap-3 bg-secondary/10 shrink-0 cursor-pointer hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all" onClick={open}>
            <Upload className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Drag & drop files anywhere, or <span className="text-emerald-400 font-semibold">click to browse</span> · Max <span className="font-semibold text-foreground">50MB</span> per file</span>
          </div>
        )}

        {/* ── Files ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" /> Loading files…
            </div>
          ) : (
            <>
              <div className={cn("h-full", tab !== 'YouTube' && "hidden")}>
                <YouTubeSearchLibrary />
              </div>
              <div className={cn("h-full", tab !== 'Trending' && "hidden")}>
                <DiscoverFeed />
              </div>
              <div className={cn("h-full", (tab === 'YouTube' || tab === 'Trending') && "hidden")}>
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-secondary/30 border border-border/40 flex items-center justify-center">
                      <FolderOpen className="w-7 h-7 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm text-muted-foreground">{search ? 'No files match your search' : 'No files yet — upload something!'}</p>
                  </div>
                ) : view === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                    <AnimatePresence>
                      {filtered.map(file => {
                        const cfg = getCfg(file.type);
                        const isImg = IS_IMAGE(file.type);
                        return (
                          <motion.div key={file.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            className="group relative bg-card border border-border/50 rounded-2xl overflow-hidden hover:border-emerald-500/30 hover:shadow-lg hover:shadow-black/10 transition-all cursor-pointer"
                            onClick={() => setPreview(file)}
                          >
                            <div className={cn('h-32 flex items-center justify-center', isImg ? 'bg-black/20' : cfg.bg)}>
                              {isImg
                                ? <img src={file.public_url} alt={file.name} className="w-full h-full object-cover" loading="lazy" />
                                : <div className={cn('w-12 h-12 rounded-xl border flex items-center justify-center', cfg.bg)}><span className={cfg.color}>{cfg.icon}</span></div>
                              }
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5" onClick={e => e.stopPropagation()}>
                                <button onClick={e => { e.stopPropagation(); setPreview(file); }} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                                <a href={file.public_url} download={file.name} onClick={e => e.stopPropagation()} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                                <button onClick={e => { e.stopPropagation(); deleteFile(file); }} className="w-8 h-8 rounded-lg bg-red-500/30 hover:bg-red-500/50 flex items-center justify-center text-red-300">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="p-2.5">
                              <p className="text-xs font-semibold truncate">{file.name}</p>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-[10px] text-muted-foreground">{fmtSize(file.size)}</span>
                                <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-md border uppercase', cfg.bg, cfg.color)}>{file.type}</span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-12 px-4 py-2.5 border-b border-border/40 bg-muted/20 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      <div className="col-span-5">Name</div>
                      <div className="col-span-2">Size</div>
                      <div className="col-span-2">Type</div>
                      <div className="col-span-2">Modified</div>
                      <div className="col-span-1 text-right">···</div>
                    </div>
                    <AnimatePresence>
                      {filtered.map(file => {
                        const cfg = getCfg(file.type);
                        return (
                          <motion.div key={file.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="grid grid-cols-12 px-4 py-3 items-center border-b border-border/30 last:border-0 hover:bg-secondary/20 transition-colors group cursor-pointer"
                            onClick={() => setPreview(file)}
                          >
                            <div className="col-span-5 flex items-center gap-3 min-w-0">
                              <div className={cn('w-8 h-8 rounded-lg border flex items-center justify-center shrink-0', cfg.bg)}>
                                <span className={cfg.color}>{cfg.icon}</span>
                              </div>
                              <p className="text-sm font-semibold truncate">{file.name}</p>
                            </div>
                            <div className="col-span-2 text-xs text-muted-foreground">{fmtSize(file.size)}</div>
                            <div className="col-span-2">
                              <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-md border uppercase', cfg.bg, cfg.color)}>{file.type}</span>
                            </div>
                            <div className="col-span-2 text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}</div>
                            <div className="col-span-1 flex justify-end" onClick={e => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-secondary/60 text-muted-foreground transition-all">
                                    <MoreVertical className="w-3.5 h-3.5" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setPreview(file)}><ExternalLink className="w-4 h-4 mr-2" />Preview</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => window.open(file.public_url, '_blank')}><Download className="w-4 h-4 mr-2" />Download</DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive" onClick={() => deleteFile(file)}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default FileStorage;
