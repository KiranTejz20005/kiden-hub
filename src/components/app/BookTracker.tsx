import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Plus, Trash2, Edit2, Check, X, Search,
  BookMarked, BookCheck, Pause, Library, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface Book {
  id: string;
  user_id: string;
  title: string;
  author: string | null;
  total_pages: number;
  current_page: number;
  status: 'want_to_read' | 'reading' | 'completed' | 'on_hold';
  cover_url: string | null;
  notes: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

const statusConfig = {
  want_to_read: { label: 'Want to Read', icon: BookMarked, color: 'bg-blue-500/20 text-blue-500' },
  reading: { label: 'Reading', icon: BookOpen, color: 'bg-green-500/20 text-green-500' },
  completed: { label: 'Completed', icon: BookCheck, color: 'bg-purple-500/20 text-purple-500' },
  on_hold: { label: 'On Hold', icon: Pause, color: 'bg-yellow-500/20 text-yellow-500' },
};

export function BookTracker() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  
  // Form state
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [currentPage, setCurrentPage] = useState('');
  const [status, setStatus] = useState<Book['status']>('want_to_read');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) fetchBooks();
  }, [user]);

  const fetchBooks = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setBooks((data as Book[]) || []);
    } catch (error: any) {
      console.error('Error fetching books:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setAuthor('');
    setTotalPages('');
    setCurrentPage('');
    setStatus('want_to_read');
    setNotes('');
    setEditingBook(null);
  };

  const openEditDialog = (book: Book) => {
    setEditingBook(book);
    setTitle(book.title);
    setAuthor(book.author || '');
    setTotalPages(book.total_pages.toString());
    setCurrentPage(book.current_page.toString());
    setStatus(book.status);
    setNotes(book.notes || '');
    setIsDialogOpen(true);
  };

  const saveBook = async () => {
    if (!user || !title.trim()) return;
    
    setSaving(true);
    try {
      const bookData = {
        user_id: user.id,
        title: title.trim(),
        author: author.trim() || null,
        total_pages: parseInt(totalPages) || 0,
        current_page: parseInt(currentPage) || 0,
        status,
        notes: notes.trim() || null,
        started_at: status === 'reading' && !editingBook?.started_at ? new Date().toISOString() : editingBook?.started_at,
        completed_at: status === 'completed' && !editingBook?.completed_at ? new Date().toISOString() : (status !== 'completed' ? null : editingBook?.completed_at),
      };

      if (editingBook) {
        const { error } = await supabase
          .from('books')
          .update(bookData)
          .eq('id', editingBook.id);
        if (error) throw error;
        toast({ title: 'Book Updated' });
      } else {
        const { error } = await supabase
          .from('books')
          .insert(bookData);
        if (error) throw error;
        toast({ title: 'Book Added' });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchBooks();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const deleteBook = async (id: string) => {
    try {
      const { error } = await supabase.from('books').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Book Deleted' });
      fetchBooks();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const updateProgress = async (book: Book, newPage: number) => {
    try {
      const updates: Partial<Book> = { current_page: newPage };
      if (newPage >= book.total_pages && book.total_pages > 0) {
        updates.status = 'completed';
        updates.completed_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('books')
        .update(updates)
        .eq('id', book.id);
      if (error) throw error;
      fetchBooks();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (book.author?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTab = activeTab === 'all' || book.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const stats = {
    total: books.length,
    reading: books.filter(b => b.status === 'reading').length,
    completed: books.filter(b => b.status === 'completed').length,
    totalPages: books.reduce((sum, b) => sum + b.current_page, 0),
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="h-full min-h-[calc(100vh-4rem)] flex flex-col p-4 gap-4"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Library className="h-6 w-6 text-primary" />
            Book Tracker
          </h2>
          <p className="text-sm text-muted-foreground">
            {stats.reading} reading · {stats.completed} completed · {stats.totalPages.toLocaleString()} pages read
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Book
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingBook ? 'Edit Book' : 'Add New Book'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Input
                placeholder="Book title *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Input
                placeholder="Author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  placeholder="Total pages"
                  value={totalPages}
                  onChange={(e) => setTotalPages(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Current page"
                  value={currentPage}
                  onChange={(e) => setCurrentPage(e.target.value)}
                />
              </div>
              <Select value={status} onValueChange={(v) => setStatus(v as Book['status'])}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <config.icon className="h-4 w-4" />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-20"
              />
              <Button onClick={saveBook} disabled={saving || !title.trim()} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingBook ? 'Update Book' : 'Add Book'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Tabs */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search books..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="reading">Reading</TabsTrigger>
            <TabsTrigger value="completed">Done</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Books Grid */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <BookOpen className="h-12 w-12 mb-2 opacity-50" />
            <p>No books found</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBooks.map(book => {
              const progress = book.total_pages > 0 ? (book.current_page / book.total_pages) * 100 : 0;
              const StatusIcon = statusConfig[book.status].icon;
              
              return (
                <Card key={book.id} className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{book.title}</h3>
                        {book.author && (
                          <p className="text-sm text-muted-foreground truncate">{book.author}</p>
                        )}
                      </div>
                      <Badge className={cn("text-xs shrink-0", statusConfig[book.status].color)}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig[book.status].label}
                      </Badge>
                    </div>

                    {book.total_pages > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>{book.current_page} / {book.total_pages} pages</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    )}

                    {book.status === 'reading' && book.total_pages > 0 && (
                      <div className="flex items-center gap-2 mb-3">
                        <Input
                          type="number"
                          placeholder="Page"
                          className="h-8 w-20 text-xs"
                          min={0}
                          max={book.total_pages}
                          defaultValue={book.current_page}
                          onBlur={(e) => {
                            const newPage = parseInt(e.target.value) || 0;
                            if (newPage !== book.current_page) {
                              updateProgress(book, Math.min(newPage, book.total_pages));
                            }
                          }}
                        />
                        <span className="text-xs text-muted-foreground">Update progress</span>
                      </div>
                    )}

                    {book.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{book.notes}</p>
                    )}

                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(book)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteBook(book.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </motion.div>
  );
}
