import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { 
  Users, 
  PenLine, 
  Film, 
  Palette, 
  Sparkles, 
  GraduationCap 
} from "lucide-react";

const personas = [
  {
    icon: Users,
    title: "Teams",
    description: "Build client workflows and store creative assets in one shared space.",
    gradient: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/30",
  },
  {
    icon: PenLine,
    title: "Writers",
    description: "Never lose an idea again. Move all of your writing to Kaiden.",
    gradient: "from-emerald-500/20 to-teal-500/20",
    borderColor: "border-emerald-500/30",
  },
  {
    icon: Film,
    title: "Filmmakers",
    description: "Find the perfect b-roll shot by describing the scene you need.",
    gradient: "from-orange-500/20 to-amber-500/20",
    borderColor: "border-orange-500/30",
  },
  {
    icon: Palette,
    title: "Designers",
    description: "Organize inspiration into folders and search visually.",
    gradient: "from-pink-500/20 to-rose-500/20",
    borderColor: "border-pink-500/30",
  },
  {
    icon: Sparkles,
    title: "Creators",
    description: "Save content inspiration and use AI with taste.",
    gradient: "from-violet-500/20 to-purple-500/20",
    borderColor: "border-violet-500/30",
  },
  {
    icon: GraduationCap,
    title: "Students",
    description: "Find answers, build AI study partners, and take notes.",
    gradient: "from-sky-500/20 to-indigo-500/20",
    borderColor: "border-sky-500/30",
  },
];

const PersonasSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} id="personas" className="py-32 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/30 to-background pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-xs text-primary mb-6 uppercase tracking-wider">
            Who's Kaiden for
          </div>
          
          <h2 className="font-serif text-4xl sm:text-5xl font-medium mb-4">
            For Those Who Value
            <br />
            <span className="text-gradient-primary">Artisan Level Work</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Not slop. Quality over quantity, always.
          </p>
        </motion.div>

        {/* Persona Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {personas.map((persona, i) => (
            <motion.div
              key={persona.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
              className={`group relative rounded-2xl p-6 bg-gradient-to-br ${persona.gradient} border ${persona.borderColor} backdrop-blur-sm card-hover`}
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-background/50 border border-border/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <persona.icon className="w-7 h-7 text-foreground" />
              </div>
              
              {/* Content */}
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {persona.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {persona.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PersonasSection;
