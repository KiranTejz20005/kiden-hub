import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Bookmark, BookOpen, Video, Lightbulb } from "lucide-react";

const NeverForgetSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const items = [
    { icon: Bookmark, label: "Saved bookmarks" },
    { icon: BookOpen, label: "Book chapters" },
    { icon: Video, label: "Educational videos" },
    { icon: Lightbulb, label: "Fleeting ideas" },
  ];

  return (
    <section ref={ref} className="py-32 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background pointer-events-none" />
      
      {/* Animated glow orbs */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl pointer-events-none"
      />
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-xs text-primary mb-8 uppercase tracking-wider">
            Home
          </div>
          
          <p className="text-lg text-muted-foreground mb-4">
            The Workspace That Remembers
          </p>
          
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-medium mb-8">
            What If You Never Forgot
            <br />
            <span className="text-gradient-primary">Where That Idea Was?</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            If you never forgot a single bookmark, chapter of a book, or educational 
            video... <span className="text-foreground italic">how much better would your work be?</span>
          </p>

          {/* Item icons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4 mb-12"
          >
            {items.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                className="glass rounded-xl px-4 py-3 flex items-center gap-2"
              >
                <item.icon className="w-5 h-5 text-primary" />
                <span className="text-sm text-foreground">{item.label}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Button variant="hero" size="xl">
              Join The Waitlist
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default NeverForgetSection;
