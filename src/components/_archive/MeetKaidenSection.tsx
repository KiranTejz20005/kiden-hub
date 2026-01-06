import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Layers, Brain, Zap } from "lucide-react";

const MeetKaidenSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} id="about" className="py-32 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="glass rounded-3xl p-10 md:p-14">
            <div className="flex flex-col md:flex-row items-start gap-10">
              <div className="flex-1">
                <div className="flex items-baseline gap-3 mb-6">
                  <span className="text-sm text-muted-foreground uppercase tracking-widest">Meet</span>
                  <h3 className="font-serif text-5xl md:text-6xl font-medium text-primary italic">Kiden</h3>
                </div>
                <p className="text-2xl text-foreground font-medium mb-4">
                  One Place For All Your Creative Work
                </p>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  Save ideas, files, media, and links in one unified workspace.
                  Everything you add is automatically transcribed, tagged, and ready
                  to reference with AI. Stop switching contexts. Start creating.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 glass-strong rounded-xl px-5 py-4">
                  <Layers className="w-5 h-5 text-primary" />
                  <span className="text-sm text-foreground">Unified Storage</span>
                </div>
                <div className="flex items-center gap-3 glass-strong rounded-xl px-5 py-4">
                  <Brain className="w-5 h-5 text-primary" />
                  <span className="text-sm text-foreground">AI-Powered</span>
                </div>
                <div className="flex items-center gap-3 glass-strong rounded-xl px-5 py-4">
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