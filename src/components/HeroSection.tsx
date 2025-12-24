import { motion, type Easing } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play, Sparkles, FolderOpen, MessageSquare, Search } from "lucide-react";

const HeroSection = () => {
  const easeOut: Easing = [0.16, 1, 0.3, 1];
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } },
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center hero-gradient noise-overlay overflow-hidden pt-16">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center max-w-4xl mx-auto"
        >
          {/* Eyebrow */}
          <motion.div variants={itemVariants} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/60 bg-secondary/50 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4 text-primary" />
              Your creative chaos, finally organized
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            variants={itemVariants}
            className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-medium leading-[0.95] tracking-tight mb-8"
          >
            <span className="text-foreground">The Workspace That</span>
            <br />
            <span className="text-gradient-primary">Remembers Everything</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={itemVariants}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Upload files, save links, and connect anything to AI on a visual canvas. 
            A <span className="text-foreground font-medium">smarter drive</span> that 
            always finds what you need.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button variant="glow" size="xl">
              Join the Kaiden Waitlist
            </Button>
            <Button variant="hero-outline" size="lg" className="gap-2">
              <Play className="w-4 h-4" />
              Watch Demo
            </Button>
          </motion.div>

          {/* Subtext */}
          <motion.p variants={itemVariants} className="text-sm text-muted-foreground/70">
            Be a part of the next early access cohort
          </motion.p>
        </motion.div>

        {/* Hero Preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 max-w-5xl mx-auto px-4 lg:px-0"
        >
          {/* Main preview card */}
          <div className="glass rounded-2xl p-6 glow-card relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="text-muted-foreground text-sm">What are you looking for?</div>
            </div>
            <div className="flex items-center gap-3 bg-secondary/50 rounded-xl px-4 py-3 border border-border/50">
              <Search className="w-5 h-5 text-muted-foreground" />
              <span className="text-foreground">canvas inspiration</span>
            </div>
            <div className="mt-4 text-sm text-muted-foreground flex items-center justify-between">
              <span>Search results</span>
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded bg-secondary flex items-center justify-center">
                  <div className="w-3 h-3 grid grid-cols-2 gap-0.5">
                    <div className="bg-muted-foreground/40 rounded-sm"></div>
                    <div className="bg-muted-foreground/40 rounded-sm"></div>
                    <div className="bg-muted-foreground/40 rounded-sm"></div>
                    <div className="bg-muted-foreground/40 rounded-sm"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mock file grid inside */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { gradient: "from-emerald-800/30 to-teal-900/30", label: "Footage 01" },
                { gradient: "from-stone-700/30 to-stone-800/30", label: "Interview B" },
                { gradient: "from-sky-800/30 to-blue-900/30", label: "Canvas Draft" },
                { gradient: "from-amber-700/30 to-orange-800/30", label: "Mood Board" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + i * 0.1, duration: 0.4 }}
                  className={`rounded-lg bg-gradient-to-br ${item.gradient} border border-border/30 p-3 flex flex-col justify-end aspect-video`}
                >
                  <span className="text-xs text-foreground/70">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
