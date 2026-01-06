import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  ArrowRight, Brain, Sparkles, Zap, BookOpen, Target, Mic,
  FileText, Search, Tag, Users, Cloud, Shield, Layers,
  MessageSquare, Calendar, BarChart3, Lightbulb, Hash,
  Play, Check, ChevronDown, Star, Globe, Lock, Workflow,
  Palette, Code, Image as ImageIcon, ListTodo, Quote, type LucideIcon
} from "lucide-react";
import kidenLogo from "@/assets/kiden-logo.png";
import { useState, useEffect, useRef } from "react";

// Animated Logo Component
const AnimatedLogo = ({ className = "" }: { className?: string }) => {
  return (
    <motion.div
      className={`relative ${className}`}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <motion.img
        src={kidenLogo}
        alt="Kiden"
        className="w-10 h-10 rounded-xl relative z-10"
        initial={{ rotate: 0 }}
        whileHover={{ rotate: [0, -5, 5, 0] }}
        transition={{ duration: 0.5 }}
      />
      <motion.div
        className="absolute inset-0 bg-primary/30 rounded-xl blur-xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </motion.div>
  );
};

// Floating particles background
const ParticlesBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-primary/20 rounded-full"
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
            scale: Math.random() * 0.5 + 0.5,
          }}
          animate={{
            y: [null, Math.random() * -200 - 100],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        />
      ))}
    </div>
  );
};

// Animated feature icons
const FeatureIcon = ({ icon: Icon, color = "primary", delay = 0 }: { icon: LucideIcon; color?: string; delay?: number }) => {
  const colorClasses: Record<string, string> = {
    primary: "bg-primary/20 text-primary border-primary/30",
    accent: "bg-accent/20 text-accent border-accent/30",
    violet: "bg-violet/20 text-violet border-violet/30",
    amber: "bg-amber/20 text-amber border-amber/30",
    rose: "bg-rose/20 text-rose border-rose/30",
    cyan: "bg-cyan/20 text-cyan border-cyan/30",
  };

  return (
    <motion.div
      className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${colorClasses[color] || colorClasses.primary}`}
      initial={{ scale: 0, rotate: -180 }}
      whileInView={{ scale: 1, rotate: 0 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 200, delay }}
      whileHover={{ scale: 1.1, rotate: 5 }}
    >
      <Icon className="w-6 h-6" />
    </motion.div>
  );
};

// Animated counter
const AnimatedCounter = ({ value, suffix = "" }: { value: string; suffix?: string }) => {
  const [displayValue, setDisplayValue] = useState("0");
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
          const numericValue = parseFloat(value.replace(/[^0-9.]/g, ''));
          const duration = 2000;
          const steps = 60;
          const stepValue = numericValue / steps;
          let current = 0;

          const timer = setInterval(() => {
            current += stepValue;
            if (current >= numericValue) {
              setDisplayValue(value);
              clearInterval(timer);
            } else {
              setDisplayValue(Math.floor(current).toString() + (value.includes('.') ? '.' + value.split('.')[1]?.slice(0, 1) : ''));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, isVisible]);

  return (
    <div ref={ref} className="text-4xl sm:text-5xl font-serif font-bold text-gradient-primary">
      {displayValue}{suffix}
    </div>
  );
};

const Index = () => {
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    { icon: Brain, title: "AI-Powered Notes", desc: "Gemini-powered AI that understands context", color: "primary" },
    { icon: FileText, title: "Rich Text Editor", desc: "Notion-style blocks with markdown support", color: "accent" },
    { icon: Tag, title: "Smart Tags", desc: "Hierarchical tagging with sub-categories", color: "violet" },
    { icon: Search, title: "Instant Search", desc: "Full-text search across all content", color: "amber" },
    { icon: Calendar, title: "Daily Reviews", desc: "Track patterns & build habits", color: "rose" },
    { icon: Mic, title: "Voice Capture", desc: "Transcribe ideas on the go", color: "cyan" },
    { icon: Layers, title: "Templates", desc: "Start fast with pre-built layouts", color: "primary" },
    { icon: Users, title: "Collaboration", desc: "Real-time editing with team", color: "accent" },
  ];

  const capabilities = [
    { icon: Heading1, label: "Headings" },
    { icon: ListTodo, label: "Tasks" },
    { icon: Quote, label: "Quotes" },
    { icon: Code, label: "Code" },
    { icon: ImageIcon, label: "Media" },
    { icon: Palette, label: "Callouts" },
  ];

  const stats = [
    { value: "1", label: "Active users", icon: Users },
    { value: "1", label: "Notes created", icon: FileText },
    { value: "99.9%", label: "Uptime SLA", icon: Shield },
    { value: "4.9", label: "User rating", suffix: "/5", icon: Star },
  ];

  const testimonials = [
    {
      quote: "Kiden transformed how I organize my thoughts. The AI features are incredible.",
      author: "Sarah Chen",
      role: "Product Designer",
      avatar: "SC"
    },
    {
      quote: "Finally, a note-taking app that understands my workflow. It's like having a second brain.",
      author: "Marcus Johnson",
      role: "Software Engineer",
      avatar: "MJ"
    },
    {
      quote: "The real-time collaboration feature has made our team 10x more productive.",
      author: "Emily Watson",
      role: "Team Lead",
      avatar: "EW"
    },
  ];

  // Auto-rotate features
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [features.length]);

  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <ParticlesBackground />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-4"
      >
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <AnimatedLogo />
            <motion.span
              className="font-serif text-2xl font-medium text-foreground italic tracking-tight"
              whileHover={{ scale: 1.02 }}
            >
              kiden
            </motion.span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1 nav-pill">
            {["Features", "Templates", "Pricing", "Docs"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="nav-link px-4 py-2 rounded-full hover:bg-secondary/50 transition-colors"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button
                variant="ghost"
                className="hidden sm:flex text-muted-foreground hover:text-foreground"
              >
                Sign in
              </Button>
            </Link>
            <Link to="/auth">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 font-medium btn-glow gap-2">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            </Link>
          </div>
        </nav>
      </motion.header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden hero-gradient">
        {/* Animated background blobs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)" }}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-3xl opacity-15"
          style={{ background: "radial-gradient(circle, hsl(var(--accent)) 0%, transparent 70%)" }}
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative z-10 text-center px-4 sm:px-6 max-w-5xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2 badge-glow mb-8"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4" />
            </motion.div>
            <span>Powered by Google Gemini AI</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-medium leading-[1.05] tracking-tight mb-6"
          >
            <span className="text-foreground">Your ideas</span>
            <br />
            <motion.span
              className="text-gradient-primary italic"
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 5, repeat: Infinity }}
              style={{ backgroundSize: "200% 200%" }}
            >
              organized
            </motion.span>
            <span className="text-foreground">, </span>
            <motion.span
              className="text-gradient-primary italic"
              animate={{ backgroundPosition: ["100% 50%", "0% 50%", "100% 50%"] }}
              transition={{ duration: 5, repeat: Infinity }}
              style={{ backgroundSize: "200% 200%" }}
            >
              amplified
            </motion.span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            The intelligent workspace that captures your thoughts, connects ideas,
            and helps you achieve more with AI-powered note-taking.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
          >
            <Link to="/auth">
              <motion.div
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  size="lg"
                  className="bg-foreground hover:bg-foreground/90 text-background rounded-full px-8 py-7 text-base font-semibold gap-2 group shadow-2xl"
                >
                  Start for free
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.div>
                </Button>
              </motion.div>
            </Link>
            <motion.button
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
            >
              <div className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center group-hover:border-primary/50 transition-colors">
                <Play className="w-5 h-5 ml-0.5" />
              </div>
              <span>Watch demo</span>
            </motion.button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
          >
            {[
              { icon: Check, text: "No credit card required" },
              { icon: Shield, text: "End-to-end encrypted" },
              { icon: Zap, text: "Set up in 30 seconds" },
            ].map((item, i) => (
              <motion.div
                key={item.text}
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + i * 0.1 }}
              >
                <item.icon className="w-4 h-4 text-primary" />
                {item.text}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Scroll to explore</span>
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          </motion.div>
        </motion.div>
      </section>

      {/* Product Preview Section */}
      <section className="py-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="preview-window p-1 sm:p-2"
          >
            {/* Window Chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30">
              <div className="flex gap-2">
                <motion.div
                  className="w-3 h-3 rounded-full bg-rose/80"
                  whileHover={{ scale: 1.2 }}
                />
                <motion.div
                  className="w-3 h-3 rounded-full bg-amber/80"
                  whileHover={{ scale: 1.2 }}
                />
                <motion.div
                  className="w-3 h-3 rounded-full bg-primary/80"
                  whileHover={{ scale: 1.2 }}
                />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-secondary/50 rounded-full px-4 py-1.5 text-xs text-muted-foreground flex items-center gap-2">
                  <Lock className="w-3 h-3" />
                  app.kiden.io
                </div>
              </div>
            </div>

            {/* Preview Content */}
            <div className="bg-background/50 rounded-2xl m-2 p-4 sm:p-6 min-h-[400px] sm:min-h-[500px] flex">
              {/* Sidebar */}
              <motion.div
                className="hidden sm:flex w-48 flex-col gap-4 pr-6 border-r border-border/20"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Workspace</span>
                </div>
                {["Notes", "Tasks", "Journal", "Templates"].map((item, i) => (
                  <motion.div
                    key={item}
                    className={`h-8 rounded-lg flex items-center px-3 text-sm ${i === 0 ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-secondary/50'} cursor-pointer transition-colors`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    whileHover={{ x: 4 }}
                  >
                    {item}
                  </motion.div>
                ))}
                <div className="mt-auto">
                  <motion.div
                    className="flex items-center gap-2 p-2 rounded-lg bg-card/50 border border-border/30"
                    animate={{ boxShadow: ["0 0 0 0 hsl(var(--primary) / 0)", "0 0 20px 2px hsl(var(--primary) / 0.2)", "0 0 0 0 hsl(var(--primary) / 0)"] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-xs">AI Assistant</span>
                  </motion.div>
                </div>
              </motion.div>

              {/* Main Editor */}
              <motion.div
                className="flex-1 pl-0 sm:pl-6 flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
              >
                {/* Toolbar */}
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border/20">
                  <div className="toolbar">
                    {capabilities.map((cap, i) => (
                      <motion.button
                        key={cap.label}
                        className="toolbar-btn"
                        whileHover={{ scale: 1.1 }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 + i * 0.05 }}
                      >
                        <cap.icon className="w-4 h-4" />
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-4">
                  <motion.div
                    className="text-2xl sm:text-3xl font-serif font-bold"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    Product Launch Strategy
                  </motion.div>
                  <motion.div
                    className="flex gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                  >
                    {["#planning", "#q1-2025", "#marketing"].map((tag) => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </motion.div>
                  <div className="space-y-3 text-muted-foreground">
                    {[
                      "Define target audience and market positioning",
                      "Create content calendar for social media",
                      "Set up analytics and tracking systems",
                    ].map((line, i) => (
                      <motion.div
                        key={i}
                        className="flex items-start gap-3"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1 + i * 0.1 }}
                      >
                        <div className="w-5 h-5 rounded border-2 border-primary/50 flex items-center justify-center mt-0.5">
                          {i === 0 && <Check className="w-3 h-3 text-primary" />}
                        </div>
                        <span className={i === 0 ? "line-through text-muted-foreground/50" : ""}>{line}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 sm:py-32 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <motion.div className="badge-pill mb-6 inline-flex">
              <Layers className="w-4 h-4" />
              Features
            </motion.div>
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-medium mb-6 text-foreground">
              Everything you need to <span className="text-gradient-primary italic">think better</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A complete toolkit inspired by the best features of Notion, Evernote, Flomo, and NotebookLM.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="feature-card group"
                onMouseEnter={() => setActiveFeature(index)}
              >
                <FeatureIcon icon={feature.icon} color={feature.color} delay={index * 0.05} />
                <h3 className="text-lg font-semibold text-foreground mt-4 mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>

                {/* Active indicator */}
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-b-2xl"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: activeFeature === index ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-50" />
        <div className="max-w-5xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 rounded-2xl glass-glow"
              >
                <motion.div
                  className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <stat.icon className="w-6 h-6 text-primary" />
                </motion.div>
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                <div className="text-sm text-muted-foreground mt-2">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div className="badge-pill mb-6 inline-flex">
              <MessageSquare className="w-4 h-4" />
              Testimonials
            </motion.div>
            <h2 className="font-serif text-4xl sm:text-5xl font-medium text-foreground">
              Loved by <span className="text-gradient-primary italic">thousands</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={testimonial.author}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="p-6 rounded-2xl glass border border-border/50 hover:border-primary/30 transition-all duration-300"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber fill-amber" />
                  ))}
                </div>
                <p className="text-foreground mb-6 leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-4 sm:px-6 relative overflow-hidden">
        <motion.div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at center, hsl(var(--primary) / 0.15) 0%, transparent 70%)" }}
        />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto text-center relative"
        >
          <motion.div
            className="inline-flex items-center gap-2 mb-6"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Zap className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground uppercase tracking-wider">Ready to start?</span>
          </motion.div>

          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-medium mb-6 text-foreground leading-tight">
            Transform your <br />
            <span className="text-gradient-primary italic">thinking today</span>
          </h2>

          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Join thousands of people who've already discovered a better way to capture, organize, and grow their ideas.
          </p>

          <Link to="/auth">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="inline-block"
            >
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-12 py-8 text-lg font-semibold gap-3 group btn-glow"
              >
                Get started free
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              </Button>
            </motion.div>
          </Link>

          <p className="text-sm text-muted-foreground mt-6">
            No credit card required • Free forever plan available
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 sm:px-6 border-t border-border/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center gap-3 mb-4">
                <img src={kidenLogo} alt="Kiden" className="w-8 h-8 rounded-xl" />
                <span className="font-serif text-xl font-medium text-foreground italic">kiden</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                The intelligent workspace for capturing and organizing your ideas.
              </p>
            </div>

            {[
              { title: "Product", links: ["Features", "Templates", "Pricing", "Changelog"] },
              { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
              { title: "Legal", links: ["Privacy", "Terms", "Security", "GDPR"] },
            ].map((column) => (
              <div key={column.title}>
                <h4 className="font-medium text-foreground mb-4">{column.title}</h4>
                <ul className="space-y-2">
                  {column.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border/30">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Kiden. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              {[Globe, MessageSquare].map((Icon, i) => (
                <motion.a
                  key={i}
                  href="#"
                  className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  whileHover={{ scale: 1.1 }}
                >
                  <Icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
};

// Heading1 icon component for the toolbar
const Heading1 = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12h8" />
    <path d="M4 18V6" />
    <path d="M12 18V6" />
    <path d="m17 12 3-2v8" />
  </svg>
);

export default Index;