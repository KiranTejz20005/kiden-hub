import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Search, Image, Video, FileText } from "lucide-react";

const VisualSearchSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-32 relative">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-xs text-primary mb-6 uppercase tracking-wider">
              Search
            </div>
            
            <h2 className="font-serif text-4xl sm:text-5xl font-medium mb-6">
              The World's Most Powerful
              <br />
              <span className="text-gradient-primary">Visual Search</span>
            </h2>
            
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              Find any video frame, image, or file — <span className="text-foreground italic">instantly</span>.
            </p>
            
            <p className="text-muted-foreground leading-relaxed">
              Describe the b-roll shot instead of sifting through hours of footage. 
              Search "pink sweater" and Kaiden surfaces all frames containing 
              exactly that. Never lose that perfect shot again.
            </p>
          </motion.div>

          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="glass rounded-2xl p-6 glow-card">
              {/* Search bar */}
              <div className="flex items-center gap-3 bg-secondary/50 rounded-xl px-4 py-3 border border-border/50 mb-6">
                <Search className="w-5 h-5 text-primary" />
                <span className="text-foreground">pink sweater outdoor</span>
              </div>
              
              {/* Results grid */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Image, label: "Frame 1:23:45", color: "from-rose-500/20 to-pink-600/20" },
                  { icon: Video, label: "interview.mp4", color: "from-amber-500/20 to-orange-600/20" },
                  { icon: Image, label: "Frame 2:01:12", color: "from-rose-500/20 to-pink-600/20" },
                  { icon: FileText, label: "notes.md", color: "from-emerald-500/20 to-teal-600/20" },
                  { icon: Image, label: "Frame 0:45:33", color: "from-rose-500/20 to-pink-600/20" },
                  { icon: Video, label: "broll-02.mov", color: "from-violet-500/20 to-purple-600/20" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                    className={`aspect-square rounded-xl bg-gradient-to-br ${item.color} border border-border/30 flex flex-col items-center justify-center gap-2 p-3`}
                  >
                    <item.icon className="w-6 h-6 text-foreground/70" />
                    <span className="text-xs text-muted-foreground text-center truncate w-full">{item.label}</span>
                  </motion.div>
                ))}
              </div>
              
              {/* Match indicator */}
              <div className="mt-4 flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-muted-foreground">6 matches found</span>
              </div>
            </div>
            
            {/* Decorative glow */}
            <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-2xl -z-10" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default VisualSearchSection;
