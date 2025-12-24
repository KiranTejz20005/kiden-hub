import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const FinalCTA = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-32 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 hero-gradient" />
      
      {/* Glow orbs */}
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{ duration: 6, repeat: Infinity }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/20 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ 
          scale: [1.1, 0.9, 1.1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 8, repeat: Infinity, delay: 1 }}
        className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-accent/15 rounded-full blur-3xl pointer-events-none"
      />
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="font-serif text-5xl sm:text-6xl md:text-7xl font-medium mb-6">
            Join The Waitlist
          </h2>
          
          <p className="text-xl text-muted-foreground mb-10">
            Your entire creative process, in one place.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col items-center gap-4"
          >
            <Button variant="glow" size="xl" className="group">
              Join the Kaiden Waitlist
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <p className="text-sm text-muted-foreground/70">
              You will be part of the next early access cohort
            </p>
          </motion.div>
        </motion.div>

        {/* Preview mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20 max-w-4xl mx-auto"
        >
          <div className="glass rounded-2xl p-1 glow-card">
            <div className="bg-secondary/30 rounded-xl p-6 md:p-8">
              {/* Window controls */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-md bg-secondary/50 text-xs text-muted-foreground">
                    app.kaiden.io
                  </div>
                </div>
              </div>
              
              {/* Mock content */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 space-y-3">
                  <div className="h-8 bg-secondary/50 rounded-lg" />
                  <div className="h-6 bg-secondary/40 rounded-lg w-3/4" />
                  <div className="h-6 bg-secondary/40 rounded-lg w-1/2" />
                  <div className="h-6 bg-primary/20 rounded-lg w-2/3" />
                  <div className="h-6 bg-secondary/40 rounded-lg w-3/4" />
                </div>
                <div className="col-span-2 bg-secondary/20 rounded-xl p-4">
                  <div className="h-4 bg-secondary/40 rounded w-1/3 mb-4" />
                  <div className="grid grid-cols-3 gap-3">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="aspect-video bg-secondary/30 rounded-lg" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTA;
