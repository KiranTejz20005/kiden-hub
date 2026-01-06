import { useEffect, useRef } from "react";
import { Zap, Keyboard, Link2, Play, LayoutGrid, Palette } from "lucide-react";

const Features = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-up");
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = sectionRef.current?.querySelectorAll(".animate-on-scroll");
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: Zap,
      title: "More Deep Work",
      description:
        "Block distractions with built-in focus tools. Set a timer, silence notifications, and actually get work done.",
    },
    {
      icon: Keyboard,
      title: "Work Faster",
      description:
        "Lightning-fast interface with full keyboard shortcuts. Navigate projects in milliseconds, not clicks.",
    },
    {
      icon: Link2,
      title: "Integrations",
      description:
        "Sync with your existing workflow. Cursor, calendars, design tools, bring them all into Kiden.",
    },
  ];

  return (
    <section ref={sectionRef} id="features" className="py-24 md:py-32 relative">
      <div className="container mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <div className="mb-16">
          <div className="animate-on-scroll opacity-0 section-label mb-4">
            Work
          </div>
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <h2 className="animate-on-scroll opacity-0 text-3xl md:text-4xl lg:text-5xl font-light leading-tight">
              Built For{" "}
              <span className="font-serif italic text-gradient">Design & Dev</span>{" "}
              Work.
            </h2>
            <p className="animate-on-scroll opacity-0 text-muted-foreground text-base md:text-lg lg:pt-2">
              Built for creative work: shifting scopes, multiple deliverables,
              tight deadlines. No enterprise bloat, just what you need to ship.
            </p>
          </div>
        </div>

        {/* Main Feature Card with App Preview */}
        <div className="animate-on-scroll opacity-0 mb-12">
          <div className="relative rounded-xl overflow-hidden bg-card border border-border">
            {/* Header */}
            <div className="p-6 md:p-8">
              <p className="text-muted-foreground text-sm mb-2">Just Drag Along</p>
              <h3 className="text-xl md:text-2xl font-light">
                Project Tracking{" "}
                <span className="font-serif italic">You'll Enjoy Using.</span>
              </h3>
            </div>

            {/* App Preview */}
            <div className="px-4 md:px-8 pb-6 md:pb-8">
              <div className="rounded-lg bg-secondary/30 border border-border overflow-hidden">
                {/* Window bar */}
                <div className="px-4 py-2 border-b border-border flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 md:p-6">
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    {["Research", "Concept", "Design", "Review", "Launch"].map(
                      (stage, i) => (
                        <div
                          key={stage}
                          className={`bg-card rounded-lg p-3 border border-border hover:border-primary/30 transition-colors ${i >= 3 ? 'hidden md:block' : ''}`}
                        >
                          <div className="text-xs font-medium mb-2 text-muted-foreground">{stage}</div>
                          <div className="space-y-2">
                            {[1, 2].map((task) => (
                              <div
                                key={task}
                                className="h-6 bg-secondary/50 rounded"
                              />
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards Row */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* 1. More Deep Work */}
          <div className="animate-on-scroll opacity-0 h-full rounded-xl bg-card border border-border overflow-hidden hover:border-primary/30 transition-all duration-300 group">
            <div className="p-6 pb-2">
              <h4 className="text-base font-medium mb-2 text-foreground">More Deep Work</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Block distractions with built-in focus tools. Set a timer, silence notifications, and actually get work done.
              </p>
            </div>
            <div className="p-6 pt-4 flex flex-col gap-3 relative">
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card to-transparent pointer-events-none z-10" />

              {/* Timer Item - Active */}
              <div className="flex items-center gap-4 p-3 rounded-lg border border-primary/50 bg-primary/10 shadow-[0_0_15px_-3px_hsl(var(--primary))] relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-300">
                <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                <div className="w-10 h-10 rounded-lg bg-black text-primary flex items-center justify-center border border-primary/20 z-10">
                  <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
                <span className="text-xl font-medium text-foreground z-10">20 min</span>
                <div className="ml-auto opacity-100 transform translate-x-0 transition-all text-primary">
                  <span className="text-xs font-mono uppercase tracking-wider">Running</span>
                </div>
              </div>

              {/* Timer Item - Inactive */}
              <div className="flex items-center gap-4 p-3 rounded-lg border border-border bg-secondary/20 opacity-60">
                <div className="w-10 h-10 rounded-lg bg-black/50 text-muted-foreground flex items-center justify-center border border-white/5">
                  <div className="w-4 h-4 rounded-full border-2 border-muted" />
                </div>
                <span className="text-xl font-medium text-muted-foreground">40 min</span>
              </div>

              {/* Timer Item - Inactive */}
              <div className="flex items-center gap-4 p-3 rounded-lg border border-border bg-secondary/20 opacity-40">
                <div className="w-10 h-10 rounded-lg bg-black/50 text-muted-foreground flex items-center justify-center border border-white/5">
                  <div className="w-4 h-4 rounded-full border-2 border-muted" />
                </div>
                <span className="text-xl font-medium text-muted-foreground">60 min</span>
              </div>
            </div>
          </div>

          {/* 2. Work Faster */}
          <div className="animate-on-scroll opacity-0 h-full rounded-xl bg-card border border-border overflow-hidden hover:border-primary/30 transition-all duration-300 group" style={{ animationDelay: "0.1s" }}>
            <div className="p-6 pb-2">
              <h4 className="text-base font-medium mb-2 text-foreground">Work Faster</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Lightning-fast interface with full keyboard shortcuts. Navigate projects in milliseconds, not clicks.
              </p>
            </div>
            <div className="p-6 pt-4 relative min-h-[220px] flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/50 to-card z-10 pointer-events-none" />
              {/* Keyboard Grid Background */}
              <div className="absolute inset-0 grid grid-cols-4 gap-2 opacity-20 transform scale-110 rotate-12 translate-y-4">
                {[...Array(16)].map((_, i) => (
                  <div key={i} className="aspect-square rounded-lg border border-white/20 bg-white/5" />
                ))}
              </div>

              {/* Center Key */}
              <div className="relative z-20 w-24 h-24 rounded-2xl bg-black border border-primary/50 flex items-center justify-center shadow-[0_0_30px_-5px_hsl(var(--primary))] group-hover:scale-110 transition-transform duration-300">
                <div className="absolute inset-0 rounded-2xl bg-primary/10 animate-pulse-glow" />
                <Zap className="w-10 h-10 text-primary animate-pulse" />
                <div className="absolute bottom-2 right-3 text-[10px] text-primary/50 font-mono">CMD+K</div>
              </div>
            </div>
          </div>

          {/* 3. Integrations */}
          <div className="animate-on-scroll opacity-0 h-full rounded-xl bg-card border border-border overflow-hidden hover:border-primary/30 transition-all duration-300 group" style={{ animationDelay: "0.2s" }}>
            <div className="p-6 pb-2">
              <h4 className="text-base font-medium mb-2 text-foreground">Integrations</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Sync with your existing workflow. Cursor, calendars, design tools, bring them all into Kiden.
              </p>
            </div>
            <div className="p-10 pt-8 flex items-center justify-center relative">
              {/* Connecting Lines */}
              <div className="absolute inset-0 z-0 opacity-20">
                <svg className="w-full h-full" viewBox="0 0 200 200">
                  <line x1="60" y1="60" x2="140" y2="60" stroke="currentColor" strokeWidth="1" className="text-white" />
                  <line x1="60" y1="140" x2="140" y2="140" stroke="currentColor" strokeWidth="1" className="text-white" />
                  <line x1="60" y1="60" x2="60" y2="140" stroke="currentColor" strokeWidth="1" className="text-white" />
                  <line x1="140" y1="60" x2="140" y2="140" stroke="currentColor" strokeWidth="1" className="text-white" />
                </svg>
              </div>

              {/* Icons Grid */}
              <div className="grid grid-cols-2 gap-8 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-[#1e1e1e] border border-white/10 flex items-center justify-center shadow-lg group-hover:-translate-x-1 group-hover:-translate-y-1 transition-transform duration-500">
                  <div className="w-8 h-8 text-white"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" /></svg></div>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-[#1e1e1e] border border-white/10 flex items-center justify-center shadow-lg group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-500">
                  <div className="w-8 h-8 flex items-center justify-center bg-primary text-primary-foreground rounded text-xs font-bold">31</div>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-[#1e1e1e] border border-white/10 flex items-center justify-center shadow-lg group-hover:-translate-x-1 group-hover:translate-y-1 transition-transform duration-500">
                  <div className="w-8 h-8 text-primary bg-primary/20 rounded p-1.5"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l-5.5 9h11L12 2zm0 13l-5.5 9h11L12 15z" /></svg></div>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-[#1e1e1e] border border-white/10 flex items-center justify-center shadow-lg group-hover:translate-x-1 group-hover:translate-y-1 transition-transform duration-500">
                  <Palette className="w-8 h-8 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
