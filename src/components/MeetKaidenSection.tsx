import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Layers, Zap, Brain } from "lucide-react";

const MeetKaidenSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} id="about" className="py-32 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 text-sm text-primary mb-6">
            <span>2015 is over...</span>
          </div>
          
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-medium mb-6">
            You Don't Need 7+ Tools
            <br />
            <span className="text-muted-foreground">And Endless Tabs</span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            One file storage app. Three AI subscriptions. Endless tabs for research, 
            project outlines, and notes. <span className="text-foreground italic">It doesn't need to be like this.</span>
          </p>
        </motion.div>

        {/* Meet Kaiden */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <div className="glass rounded-3xl p-8 md:p-12 glow-card">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-sm text-muted-foreground uppercase tracking-wider">Meet</span>
                  <h3 className="font-serif text-5xl md:text-6xl font-medium text-gradient-primary">Kaiden</h3>
                </div>
                <p className="text-xl text-foreground font-medium mb-4">
                  One Place For All Your Creative Work
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Save ideas, files, media, and links in one unified workspace. 
                  Everything you add is automatically transcribed, tagged, and ready 
                  to reference with AI. Stop switching contexts. Start creating.
                </p>
              </div>
              
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 glass-strong rounded-xl px-4 py-3">
                  <Layers className="w-5 h-5 text-primary" />
                  <span className="text-sm text-foreground">Unified Storage</span>
                </div>
                <div className="flex items-center gap-3 glass-strong rounded-xl px-4 py-3">
                  <Brain className="w-5 h-5 text-primary" />
                  <span className="text-sm text-foreground">AI-Powered</span>
                </div>
                <div className="flex items-center gap-3 glass-strong rounded-xl px-4 py-3">
                  <Zap className="w-5 h-5 text-primary" />
                  <span className="text-sm text-foreground">Instant Search</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MeetKaidenSection;
