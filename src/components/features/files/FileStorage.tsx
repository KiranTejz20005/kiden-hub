import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Search, Upload, Loader2, MoreHorizontal,
  Download, Trash2, ExternalLink, X,
  LayoutGrid, List, Columns, Filter,
  Clock, Plus, FileText, Image as ImageIcon,
  Video, File,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { logActivity } from '@/services/activityService';
import PDFThumbnail from '../boards/PDFThumbnail';
import TextPreview from './TextPreview';
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { YouTubeSearchLibrary } from './YouTubeSearchLibrary';
import { DiscoverFeed } from './DiscoverFeed';

const LIMIT = 50 * 1024 * 1024;

/* ─ helpers ─────────────────────────────────────────────────────────── */
const IS_IMAGE = (t: string) => ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(t?.toLowerCase());
const IS_VIDEO = (t: string) => ['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(t?.toLowerCase());
const IS_DOC = (t: string) => ['pdf', 'doc', 'docx', 'md', 'txt', 'csv', 'json', 'xls', 'xlsx', 'ppt', 'pptx'].includes(t?.toLowerCase());
const IS_TEXT = (t: string) => ['md', 'txt', 'json', 'csv', 'js', 'ts', 'html', 'css'].includes(t?.toLowerCase());

const fmtSize = (b: number) => {
  if (!b) return '0 B';
  const k = 1024, s = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${(b / k ** i).toFixed(1)} ${s[i]}`;
};

const getIcon = (type: string) => {
  if (IS_IMAGE(type)) return <ImageIcon className="w-5 h-5" />;
  if (IS_VIDEO(type)) return <Video className="w-5 h-5" />;
  if (['pdf', 'doc', 'docx', 'md', 'txt'].includes(type)) return <FileText className="w-5 h-5" />;
  return <File className="w-5 h-5" />;
};

/* ─ Preview modal ────────────────────────────────────────────────────── */
const Preview = ({ file, onClose }: { file: any; onClose: () => void }) => {
  const type = file.type?.toLowerCase();
  const [url, setUrl] = useState<string | null>(null);
  const [txt, setTxt] = useState<string | null>(null);

  useEffect(() => {
    supabase.storage.from('kiden-files').createSignedUrl(file.storage_path, 3600)
      .then(({ data, error }) => {
        if (error) return;
        if (IS_TEXT(type)) fetch(data!.signedUrl).then(r => r.text()).then(setTxt);
        setUrl(data!.signedUrl);
      });
  }, [file, type]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="bg-[#202020] border border-[#2a2a2a] rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-white/50">{getIcon(type)}</span>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-white truncate">{file.name}</p>
              <p className="text-[10px] text-white/40">{fmtSize(file.size)} · {type?.toUpperCase()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a href={file.public_url} download={file.name}
              className="px-3 py-1.5 rounded-lg bg-white/[0.07] hover:bg-white/[0.12] text-xs font-semibold text-white transition-all flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> Download
            </a>
            <button onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/[0.07] text-white/40 hover:text-white transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto min-h-0 flex items-center justify-center bg-black/20">
          {IS_IMAGE(type) && url && <img src={url} alt={file.name} className="max-w-full max-h-full object-contain" />}
          {IS_VIDEO(type) && url && <video src={url} controls className="max-w-full max-h-full" />}
          {type === 'pdf' && url && <iframe src={url} title={file.name} className="w-full h-full min-h-[70vh]" />}
          {IS_TEXT(type) && (
            <div className="w-full h-full p-6 overflow-auto">
              {txt === null
                ? <div className="flex items-center gap-2 text-white/40"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
                : <pre className="text-xs font-mono text-white/80 whitespace-pre-wrap leading-relaxed">{txt}</pre>}
            </div>
          )}
          {!IS_IMAGE(type) && !IS_VIDEO(type) && type !== 'pdf' && !IS_TEXT(type) && (
            <div className="flex flex-col items-center gap-4 p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-white/30">
                {getIcon(type)}
              </div>
              <p className="text-white/40 text-sm">No preview for this file type</p>
              <a href={file.public_url} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:opacity-90">
                <ExternalLink className="w-4 h-4" /> Open in browser
              </a>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ─ File Card ────────────────────────────────────────────────────────── */
const FileCard = ({ file, onPreview, onDelete }: { file: any; onPreview: () => void; onDelete: () => void }) => {
  const type = file.type?.toLowerCase();
  const isImg = IS_IMAGE(type);
  const date = formatDistanceToNow(new Date(file.created_at), { addSuffix: false });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative bg-[#202020] border border-[#2a2a2a] rounded-xl overflow-hidden hover:border-[#333333] hover:bg-[#242424] transition-all cursor-pointer flex flex-col"
      onClick={onPreview}
    >
      {/* Thumbnail */}
      <div className="h-[160px] bg-[#181818] flex items-center justify-center overflow-hidden relative">
        {isImg ? (
          <img src={file.public_url} alt={file.name} className="w-full h-full object-cover" loading="lazy" />
        ) : type === 'pdf' ? (
          <PDFThumbnail url={file.public_url} />
        ) : IS_TEXT(type) ? (
          <TextPreview url={file.public_url} />
        ) : IS_VIDEO(type) ? (
          <div className="flex flex-col items-center gap-2">
            <Video className="w-8 h-8 text-white/20" />
            <span className="text-[10px] text-white/20 uppercase tracking-wider">{type}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <span className="text-white/20">{getIcon(type)}</span>
            <span className="text-[10px] text-white/20 uppercase tracking-wider">{type}</span>
          </div>
        )}

        {/* Hover overlay */}
        <div
          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={e => { e.stopPropagation(); onPreview(); }}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          ><ExternalLink className="w-3.5 h-3.5" /></button>
          <a
            href={file.public_url} download={file.name}
            onClick={e => e.stopPropagation()}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          ><Download className="w-3.5 h-3.5" /></a>
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="w-8 h-8 rounded-lg bg-rose-500/30 hover:bg-rose-500/50 flex items-center justify-center text-rose-300 transition-colors"
          ><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col gap-1">
        <p className="text-[12.5px] font-semibold text-white/80 truncate leading-tight">{file.name}</p>
        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="text-[10.5px] text-white/25">Library · {date}</span>
          <span className="text-[9px] font-semibold uppercase tracking-wide text-white/25 bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 rounded">{type}</span>
        </div>
      </div>
    </motion.div>
  );
};

/* ─ List Row ─────────────────────────────────────────────────────────── */
const FileRow = ({ file, onPreview, onDelete }: { file: any; onPreview: () => void; onDelete: () => void }) => {
  const type = file.type?.toLowerCase();
  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition-colors cursor-pointer group"
      onClick={onPreview}
    >
      <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.05] flex items-center justify-center text-white/35 shrink-0">
        {getIcon(type)}
      </div>
      <p className="flex-1 text-[13px] font-medium text-white/75 truncate group-hover:text-white transition-colors">{file.name}</p>
      <span className="text-[11px] text-white/25 shrink-0">{fmtSize(file.size)}</span>
      <span className="text-[11px] text-white/25 shrink-0 w-24 text-right">
        {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            onClick={e => e.stopPropagation()}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white/[0.07] text-white/40 hover:text-white transition-all"
          ><MoreHorizontal className="w-4 h-4" /></button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/[0.08] text-white">
          <DropdownMenuItem onClick={() => { onPreview(); }} className="cursor-pointer focus:bg-white/[0.06]">
            <ExternalLink className="w-4 h-4 mr-2" /> Preview
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer focus:bg-white/[0.06]">
            <a href={file.public_url} download={file.name}><Download className="w-4 h-4 mr-2" /> Download</a>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-rose-400 cursor-pointer focus:bg-rose-500/10 focus:text-rose-300">
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
};

/* ─ Main ─────────────────────────────────────────────────────────────── */
type ViewMode = 'grid' | 'list';
type TabKey = 'all' | 'documents' | 'images' | 'videos' | 'youtube' | 'trending' | 'other';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'documents', label: 'Documents' },
  { key: 'images', label: 'Images' },
  { key: 'videos', label: 'Videos' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'trending', label: 'Trending' },
  { key: 'other', label: 'Other' },
];

export default function FileStorage() {
  const { user } = useAuth();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<TabKey>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [preview, setPreview] = useState<any>(null);

  const fetchRef = useRef(false);

  const fetchFiles = useCallback(async (force = false) => {
    if (fetchRef.current && !force) return;
    if (!user) return;
    fetchRef.current = true;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('files').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setFiles(data ?? []);
    } finally {
      setLoading(false);
      fetchRef.current = false;
    }
  }, [user]);

  useEffect(() => { if (user) fetchFiles(); }, [user, fetchFiles]);

  const onDrop = useCallback(async (accepted: File[]) => {
    if (!user) return;
    setUploading(true);
    for (const file of accepted) {
      if (file.size > LIMIT) { toast.error(`${file.name} exceeds 50 MB`); continue; }
      try {
        const ext = file.name.split('.').pop() ?? 'bin';
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('kiden-files').upload(path, file);
        if (upErr) throw upErr;
        const { data: { publicUrl } } = supabase.storage.from('kiden-files').getPublicUrl(path);
        const { error: dbErr } = await supabase.from('files').insert([{
          user_id: user.id, name: file.name, size: file.size,
          type: ext, mime_type: file.type, storage_path: path, public_url: publicUrl,
        }]);
        if (dbErr) throw dbErr;
        logActivity(user.id, 'upload', file.name, 'file');
        toast.success(`${file.name} uploaded`);
      } catch (e: any) { toast.error(`Upload failed: ${e.message}`); }
    }
    setUploading(false);
    fetchFiles(true);
  }, [user, fetchFiles]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop, noClick: true, noKeyboard: true,
  });

  const deleteFile = async (file: any) => {
    await supabase.storage.from('kiden-files').remove([file.storage_path]);
    await supabase.from('files').delete().eq('id', file.id).eq('user_id', user?.id);
    logActivity(user!.id, 'delete_file', file.name, 'file');
    setFiles(p => p.filter(f => f.id !== file.id));
    toast.success('File deleted');
  };

  /* filter */
  const filtered = files.filter(f => {
    const q = search.toLowerCase();
    if (q && !f.name.toLowerCase().includes(q)) return false;
    const type = f.type?.toLowerCase() || '';

    if (tab === 'documents') return IS_DOC(type);
    if (tab === 'images') return IS_IMAGE(type);
    if (tab === 'videos') return IS_VIDEO(type);
    if (tab === 'other') return !IS_DOC(type) && !IS_IMAGE(type) && !IS_VIDEO(type);
    return true;
  });

  return (
    <>
      <AnimatePresence>
        {preview && <Preview file={preview} onClose={() => setPreview(null)} />}
      </AnimatePresence>

      <div {...getRootProps()} className="flex flex-col h-full bg-[#181818] overflow-hidden relative select-none">
        <input {...getInputProps()} />

        {/* Drag overlay */}
        <AnimatePresence>
          {isDragActive && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 bg-white/[0.03] border-2 border-dashed border-white/20 rounded-none flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <Upload className="w-10 h-10 text-white/30 mx-auto mb-3" />
                <p className="text-lg font-semibold text-white/60">Drop files to upload</p>
                <p className="text-sm text-white/25 mt-1">Max 50 MB per file</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Tabs bar matching user reference ── */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-white/[0.05] shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  'px-4 py-1.5 rounded-xl text-[13px] font-semibold transition-all cursor-pointer whitespace-nowrap',
                  tab === key
                    ? 'bg-[#292929] text-white border border-[#333333]/50 shadow-sm'
                    : 'text-white/50 hover:text-white hover:bg-white/[0.04]',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* New / View toggles on right */}
          <div className="flex items-center gap-2.5 shrink-0 pl-3">
            <div className="flex items-center gap-0.5 bg-white/[0.04] border border-white/[0.06] rounded-lg p-0.5">
              {(['grid', 'list'] as const).map(m => (
                <button key={m} onClick={() => setViewMode(m)}
                  className={cn('w-7 h-6 flex items-center justify-center rounded-md transition-colors cursor-pointer',
                    viewMode === m ? 'bg-white/[0.10] text-white' : 'text-white/30 hover:text-white/60')}
                >
                  {m === 'grid' ? <LayoutGrid className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>

            <button
              onClick={open}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-black font-semibold hover:bg-white/90 transition-all text-[12.5px] disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        </div>

        {/* ── Content View per Tab ── */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {tab === 'youtube' ? (
            <YouTubeSearchLibrary />
          ) : tab === 'trending' ? (
            <DiscoverFeed />
          ) : (
            <div className="p-6">
              {/* Search input */}
              <div className="relative flex items-center mb-6">
                <Search className="absolute left-3.5 w-4 h-4 text-white/30 pointer-events-none" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search files, documents, and assets..."
                  className="w-full h-10 pl-10 pr-4 bg-[#202020] border border-[#2a2a2a] rounded-xl text-[13px] text-white placeholder:text-white/30 outline-none focus:border-[#333333] transition-all"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 text-white/30 hover:text-white transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-24 gap-3 text-white/30">
                  <Loader2 className="w-5 h-5 animate-spin" /> Loading items…
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white/20" />
                  </div>
                  <p className="text-[13px] text-white/40">
                    {search ? 'No items match your search' : 'No items found in this tab'}
                  </p>
                  <button
                    onClick={open}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.10] text-[13px] font-medium text-white/70 hover:text-white transition-all cursor-pointer"
                  >
                    <Upload className="w-4 h-4" /> Upload a file
                  </button>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 pb-16">
                  <AnimatePresence>
                    {filtered.map(file => (
                      <FileCard
                        key={file.id}
                        file={file}
                        onPreview={() => setPreview(file)}
                        onDelete={() => deleteFile(file)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="bg-[#202020] border border-[#2a2a2a] rounded-xl overflow-hidden mb-16">
                  <div className="grid grid-cols-12 px-4 py-2 border-b border-white/[0.06] text-[11px] font-semibold uppercase tracking-wider text-white/30">
                    <div className="col-span-6">Name</div>
                    <div className="col-span-2">Size</div>
                    <div className="col-span-3">Modified</div>
                    <div className="col-span-1" />
                  </div>
                  <AnimatePresence>
                    {filtered.map(file => (
                      <FileRow
                        key={file.id}
                        file={file}
                        onPreview={() => setPreview(file)}
                        onDelete={() => deleteFile(file)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
