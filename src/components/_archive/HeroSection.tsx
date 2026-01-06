import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, Shield } from "lucide-react";
import FloatingIcons from "./FloatingIcons";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center hero-gradient overflow-hidden pt-20">
      {/* Floating Icons */}
      <FloatingIcons />

      <div className="container mx-auto px-6 relative z-10 text-center">
        {/* Eyebrow Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <span className="badge-pill bg-primary text-primary-foreground">
            <Sparkles className="w-4 h-4" />
            INTELLIGENT DEEP WORK SYSTEMS
          </span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-serif text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-medium leading-[0.95] tracking-tight mb-8"
        >
          <span className="text-foreground italic">Capture.</span>
          <br />
          <span className="text-primary italic">Connect.</span>
          <br />
          <span className="text-foreground italic">Conquer.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Kiden is the unified brain for high-performance teams. We
          synthesize your chaos into organized, spatial intelligence.
        </motion.p>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          {/* Primary CTA */}
          <Button
            size="lg"
            className="bg-foreground hover:bg-foreground/90 text-background rounded-full px-8 py-6 text-sm font-medium tracking-wider uppercase"
          >
            INITIALIZE WORKSPACE
          </Button>

          {/* Secondary Badges */}
          <div className="flex items-center gap-2 bg-card/50 backdrop-blur-sm border border-border/30 rounded-full px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4 text-primary" />
              GEMINI POWERED
            </div>
            <div className="w-px h-4 bg-border/50" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4" />
              SECURE FLOW
            </div>
          </div>
        </motion.div>
      </div>

      {/* Product Preview */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="mt-20 w-full max-w-4xl mx-auto px-6"
      >
        <div className="preview-window p-1">
          {/* Window Chrome */}
          <div className="flex items-center gap-2 px-4 py-3">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
            <div className="flex-1" />
            <div className="bg-card/50 rounded-full px-4 py-1 text-xs text-muted-foreground">
              workspace
            </div>
          </div>

          {/* Preview Content */}
          <div className="bg-card/30 rounded-2xl m-2 p-6 min-h-[300px] flex">
            {/* Sidebar */}
            <div className="w-32 flex flex-col gap-3 pr-4 border-r border-border/20">
              <div className="h-4 w-20 bg-primary/40 rounded" />
              <div className="h-3 w-16 bg-muted/40 rounded" />
              <div className="h-3 w-24 bg-muted/40 rounded" />
              <div className="h-3 w-14 bg-muted/40 rounded" />
              <div className="h-3 w-20 bg-muted/40 rounded" />
              <div className="h-3 w-18 bg-muted/40 rounded" />
            </div>

            {/* Main Content */}
            <div className="flex-1 pl-6 flex flex-col gap-4">
              <div className="bg-gradient-to-r from-primary/30 to-primary/10 rounded-xl p-4 w-48">
                <div className="h-3 w-24 bg-primary/60 rounded mb-2" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="h-3 w-full bg-muted/30 rounded" />
                <div className="h-3 w-4/5 bg-muted/30 rounded" />
                <div className="h-3 w-3/5 bg-primary/20 rounded" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;