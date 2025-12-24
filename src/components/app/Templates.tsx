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
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Templates</h1>
          <p className="text-muted-foreground">Start with pre-built structures or create your own</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Create Template Form */}
      {showCreate && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-8 p-6 bg-card border border-border rounded-2xl"
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
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={createTemplate} disabled={!newTemplate.name.trim()}>
              Create
            </Button>
          </div>
        </motion.div>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              filterCategory === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors group"
          >
            <div className="flex items-start justify-between mb-4">
              <span className="text-3xl">{template.icon}</span>
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
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Check className="w-4 h-4 mr-1" />
                Use
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-20">
          <LayoutTemplate className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-lg text-muted-foreground mb-2">No templates found</h3>
          <p className="text-sm text-muted-foreground/60">
            Create your first custom template to get started.
          </p>
        </div>
      )}
    </div>
  );
};

export default Templates;