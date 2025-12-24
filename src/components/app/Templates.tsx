import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Template } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, LayoutTemplate, Check } from 'lucide-react';
import { toast } from 'sonner';

const categoryColors: Record<string, string> = {
  project: 'bg-blue-500/20 text-blue-400',
  task: 'bg-green-500/20 text-green-400',
  kanban: 'bg-purple-500/20 text-purple-400',
  goal: 'bg-yellow-500/20 text-yellow-400',
  sprint: 'bg-orange-500/20 text-orange-400',
  custom: 'bg-pink-500/20 text-pink-400',
};

const Templates = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', description: '', category: 'custom' });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('is_system', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching templates:', error);
    } else {
      setTemplates(data as Template[]);
    }
    setLoading(false);
  };

  const createTemplate = async () => {
    if (!user || !newTemplate.name.trim()) return;

    const { data, error } = await supabase
      .from('templates')
      .insert({
        user_id: user.id,
        name: newTemplate.name,
        description: newTemplate.description,
        category: newTemplate.category,
        content: [],
        is_system: false,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create template');
    } else {
      setTemplates((prev) => [data as Template, ...prev]);
      setNewTemplate({ name: '', description: '', category: 'custom' });
      setShowCreate(false);
      toast.success('Template created!');
    }
  };

  const useTemplate = async (template: Template) => {
    if (!user) return;

    const { error } = await supabase.from('notes').insert({
      user_id: user.id,
      title: template.name,
      content: template.content,
      icon: template.icon,
    });

    if (error) {
      toast.error('Failed to create note from template');
    } else {
      toast.success(`Created note from "${template.name}" template`);
    }
  };

  const filteredTemplates = filterCategory === 'all'
    ? templates
    : templates.filter((t) => t.category === filterCategory);

  const categories = ['all', 'project', 'task', 'kanban', 'goal', 'sprint', 'custom'];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 md:p-8 max-w-6xl mx-auto pt-16 lg:pt-8"
    >
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <LayoutTemplate className="w-7 h-7 text-primary" />
            Templates
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Start with pre-built structures or create your own</p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button onClick={() => setShowCreate(!showCreate)} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </motion.div>
      </motion.div>

      {/* Create Template Form */}
      {showCreate && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6 md:mb-8 p-4 md:p-6 bg-card border border-border rounded-2xl overflow-hidden"
        >
          <h3 className="font-bold text-foreground mb-4">Create New Template</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Name</label>
              <Input
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                placeholder="Template name"
                className="bg-secondary border-none"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Category</label>
              <select
                value={newTemplate.category}
                onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-secondary text-foreground border-none"
              >
                <option value="project">Project</option>
                <option value="task">Task</option>
                <option value="kanban">Kanban</option>
                <option value="goal">Goal</option>
                <option value="sprint">Sprint</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-muted-foreground mb-2 block">Description</label>
              <Input
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                placeholder="Brief description"
                className="bg-secondary border-none"
              />
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-4">
            <Button variant="ghost" onClick={() => setShowCreate(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={createTemplate} disabled={!newTemplate.name.trim()} className="w-full sm:w-auto">
              Create
            </Button>
          </div>
        </motion.div>
      )}

      {/* Category Filter */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-2 mb-6 md:mb-8 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0"
      >
        {categories.map((cat, i) => (
          <motion.button
            key={cat}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilterCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
              filterCategory === cat
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </motion.button>
        ))}
      </motion.div>

      {/* Templates Grid */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {filteredTemplates.map((template, i) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.02, y: -4 }}
            className="bg-card border border-border rounded-2xl p-5 md:p-6 hover:border-primary/50 transition-all group cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <motion.span 
                className="text-3xl"
                whileHover={{ scale: 1.2, rotate: 10 }}
              >
                {template.icon}
              </motion.span>
              {template.is_system && (
                <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full">
                  System
                </span>
              )}
            </div>
            <h3 className="font-bold text-foreground mb-2">{template.name}</h3>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {template.description || 'No description'}
            </p>
            <div className="flex items-center justify-between">
              <span className={`text-xs px-2 py-1 rounded-full ${categoryColors[template.category]}`}>
                {template.category}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => useTemplate(template)}
                className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              >
                <Check className="w-4 h-4 mr-1" />
                Use
              </Button>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {filteredTemplates.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <LayoutTemplate className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
          </motion.div>
          <h3 className="text-lg text-muted-foreground mb-2">No templates found</h3>
          <p className="text-sm text-muted-foreground/60">
            Create your first custom template to get started.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Templates;