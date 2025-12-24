import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { MessageSquare, FileText, Youtube, Link2, Sparkles } from "lucide-react";

const CanvasSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const nodes = [
    { id: 1, icon: FileText, label: "Research Notes", x: 10, y: 20, color: "bg-emerald-500/20 border-emerald-500/40" },
    { id: 2, icon: Youtube, label: "Tutorial Video", x: 60, y: 10, color: "bg-red-500/20 border-red-500/40" },
    { id: 3, icon: MessageSquare, label: "Claude 4.5", x: 35, y: 50, color: "bg-primary/20 border-primary/40" },
    { id: 4, icon: Link2, label: "Reference Link", x: 70, y: 55, color: "bg-violet-500/20 border-violet-500/40" },
    { id: 5, icon: Sparkles, label: "GPT-4o", x: 15, y: 70, color: "bg-amber-500/20 border-amber-500/40" },
  ];

  return (
    <section ref={ref} className="py-32 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />
      
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Visual - Canvas Preview */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="relative order-2 lg:order-1"
          >
            <div className="glass rounded-2xl p-8 glow-card relative h-80 overflow-hidden">
              {/* Connection lines (SVG) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(168, 60%, 45%)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="hsl(168, 70%, 50%)" stopOpacity="0.6" />
                  </linearGradient>
                </defs>
                {/* Lines connecting nodes to center AI */}
                <motion.path
                  d="M 60 64 Q 120 100 140 160"
                  stroke="url(#lineGradient)"
                  strokeWidth="2"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={isInView ? { pathLength: 1 } : {}}
                  transition={{ duration: 1, delay: 0.5 }}
                />
                <motion.path
                  d="M 240 48 Q 180 80 140 160"
                  stroke="url(#lineGradient)"
                  strokeWidth="2"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={isInView ? { pathLength: 1 } : {}}
                  transition={{ duration: 1, delay: 0.6 }}
                />
                <motion.path
                  d="M 280 176 Q 220 170 140 160"
                  stroke="url(#lineGradient)"
                  strokeWidth="2"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={isInView ? { pathLength: 1 } : {}}
                  transition={{ duration: 1, delay: 0.7 }}
                />
                <motion.path
                  d="M 60 224 Q 100 200 140 160"
                  stroke="url(#lineGradient)"
                  strokeWidth="2"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={isInView ? { pathLength: 1 } : {}}
                  transition={{ duration: 1, delay: 0.8 }}
                />
              </svg>
              
              {/* Nodes */}
              {nodes.map((node, i) => (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                  className={`absolute ${node.color} border rounded-xl px-3 py-2 flex items-center gap-2 backdrop-blur-sm`}
                  style={{ left: `${node.x}%`, top: `${node.y}%`, transform: 'translate(-50%, -50%)' }}
                >
                  <node.icon className="w-4 h-4" />
                  <span className="text-xs text-foreground whitespace-nowrap">{node.label}</span>
                </motion.div>
              ))}
            </div>
            
            {/* Decorative glow */}
            <div className="absolute -inset-4 bg-accent/5 rounded-3xl blur-2xl -z-10" />
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="order-1 lg:order-2"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-xs text-primary mb-6 uppercase tracking-wider">
              Canvas
            </div>
            
            <h2 className="font-serif text-4xl sm:text-5xl font-medium mb-6">
              Spatial AI For
              <br />
              <span className="text-gradient-primary">Content & Research</span>
            </h2>
            
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              Close all your AI tools, documents, and research tabs.
            </p>
            
            <p className="text-muted-foreground leading-relaxed">
              Add any workspace item — from notes to YouTube videos — and 
              connect them to multiple AI chats, visually. Think in spatial 
              relationships. Create with context. Let ideas flow naturally 
              across an infinite canvas.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CanvasSection;
