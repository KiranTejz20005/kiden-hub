import { useEffect, useRef } from "react";
import { Zap, Keyboard, Link2, Palette } from "lucide-react";

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
    elements?.forEach((el) => { observer.observe(el); });

    return () => { observer.disconnect(); };
  }, []);

  return (
    <section ref={sectionRef} id="features" className="py-24 md:py-32 relative overflow-hidden">
      {/* Texture overlays */}
      <div className="absolute inset-0 bg-grid opacity-[0.25] pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)]" />
      <div className="absolute inset-0 bg-noise opacity-[0.015] pointer-events-none" />

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        {/* Section Header */}
        <div className="mb-20">
          <div className="animate-on-scroll opacity-0 mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/20 border border-emerald-500/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">Capabilities</span>
          </div>
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <h2 className="animate-on-scroll opacity-0 text-3xl md:text-4xl lg:text-5xl font-light leading-tight">
              Built For{" "}
              <span className="font-serif italic text-white drop-shadow-[0_0_15px_rgba(16,185,129,0.1)]">Design & Dev</span>{" "}
              Work.
            </h2>
            <p className="animate-on-scroll opacity-0 text-emerald-100/60 text-base md:text-lg lg:pt-2 font-light">
              Built for creative professionals: shifting scopes, multiple client deliverables,
              and tight deadlines. No enterprise bloat, just the focus you need to ship.
            </p>
          </div>
        </div>

        {/* Main Feature Card with App Preview */}
        <div className="animate-on-scroll opacity-0 mb-16">
          <div className="relative rounded-2xl overflow-hidden glass-glow-card">
            {/* Header */}
            <div className="p-8">
              <p className="text-emerald-400/60 text-xs uppercase tracking-wider mb-2 font-medium">Just Drag & Release</p>
              <h3 className="text-2xl md:text-3xl font-light">
                Project Tracking{" "}
                <span className="font-serif italic text-white">You'll Enjoy Using.</span>
              </h3>
            </div>

            {/* App Preview */}
            <div className="px-6 md:px-8 pb-8">
              <div className="rounded-xl bg-[#060808]/80 border border-white/5 overflow-hidden shadow-2xl relative">
                {/* Glow reflections */}
                <div className="absolute top-0 right-0 w-32 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
                
                {/* Window bar */}
                <div className="px-4 py-3.5 border-b border-white/5 flex items-center justify-between bg-black/40">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  </div>
                  <span className="text-[10px] text-emerald-100/20 font-mono">kiden.app/dashboard</span>
                  <div className="w-8" />
                </div>

                {/* Content */}
                <div className="p-5 md:p-8 bg-black/10">
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                    {["Research", "Concept", "Design", "Review", "Launch"].map(
                      (stage, i) => (
                        <div
                          key={stage}
                          className={`bg-white/[0.01] rounded-xl p-4 border border-white/5 hover:border-emerald-500/20 transition-all ${i >= 3 ? 'hidden md:block' : ''}`}
                        >
                          <div className="text-[10px] font-semibold tracking-wider text-emerald-100/40 uppercase mb-3">{stage}</div>
                          <div className="space-y-2.5">
                            {[1, 2].map((task) => (
                              <div
                                key={task}
                                className="h-8 bg-white/[0.02] border border-white/5 rounded-lg flex items-center px-2 relative group-hover:bg-white/[0.03] transition-colors"
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/30 mr-2" />
                                <div className="w-10 h-1 bg-white/10 rounded-full" />
                              </div>
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
          <div className="animate-on-scroll opacity-0 h-full rounded-2xl glass-glow-card overflow-hidden transition-all duration-300 group">
            <div className="p-8 pb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center mb-4">
                <Zap className="w-4 h-4 text-emerald-400" />
              </div>
              <h4 className="text-lg font-medium mb-2 text-white">More Deep Work</h4>
              <p className="text-emerald-100/50 text-sm leading-relaxed font-light">
                Block distractions with built-in focus tools. Set a timer, silence notifications, and actually get work done.
              </p>
            </div>
            <div className="p-8 pt-4 flex flex-col gap-3.5 relative">
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#090b0a] to-transparent pointer-events-none z-10" />

              {/* Timer Item - Active */}
              <div className="flex items-center gap-4 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.05)] relative overflow-hidden group-hover:scale-[1.02] transition-all duration-300">
                <div className="absolute inset-0 bg-emerald-500/[0.02] animate-pulse" />
                <div className="w-10 h-10 rounded-lg bg-black/50 text-emerald-400 flex items-center justify-center border border-emerald-500/20 z-10">
                  <div className="w-5 h-5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                </div>
                <span className="text-xl font-medium text-white z-10">20 min</span>
                <div className="ml-auto opacity-100 transform translate-x-0 transition-all text-emerald-400 z-10">
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Active</span>
                </div>
              </div>

              {/* Timer Item - Inactive */}
              <div className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.01] opacity-50">
                <div className="w-10 h-10 rounded-lg bg-black/30 text-muted-foreground flex items-center justify-center border border-white/5">
                  <div className="w-4 h-4 rounded-full border-2 border-white/10" />
                </div>
                <span className="text-xl font-medium text-emerald-100/40">40 min</span>
              </div>

              {/* Timer Item - Inactive */}
              <div className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.01] opacity-30">
                <div className="w-10 h-10 rounded-lg bg-black/30 text-muted-foreground flex items-center justify-center border border-white/5">
                  <div className="w-4 h-4 rounded-full border-2 border-white/10" />
                </div>
                <span className="text-xl font-medium text-emerald-100/40">60 min</span>
              </div>
            </div>
          </div>

          {/* 2. Work Faster */}
          <div className="animate-on-scroll opacity-0 h-full rounded-2xl glass-glow-card overflow-hidden transition-all duration-300 group" style={{ animationDelay: "0.1s" }}>
            <div className="p-8 pb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center mb-4">
                <Keyboard className="w-4 h-4 text-emerald-400" />
              </div>
              <h4 className="text-lg font-medium mb-2 text-white">Work Faster</h4>
              <p className="text-emerald-100/50 text-sm leading-relaxed font-light">
                Lightning-fast interface with full keyboard shortcuts. Navigate projects in milliseconds, not clicks.
              </p>
            </div>
            <div className="p-8 pt-4 relative min-h-[220px] flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-[#090b0a] z-10 pointer-events-none" />
              
              {/* Keyboard Grid Background */}
              <div className="absolute inset-0 grid grid-cols-4 gap-2.5 opacity-[0.06] transform scale-110 rotate-12 translate-y-6">
                {[...Array(16)].map((_, i) => (
                  <div key={i} className="aspect-square rounded-lg border border-white bg-white" />
                ))}
              </div>

              {/* Center Key */}
              <div className="relative z-20 w-24 h-24 rounded-2xl bg-black border border-emerald-500/30 flex flex-col items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.06)] group-hover:scale-105 group-hover:border-emerald-500/50 transition-all duration-300">
                <div className="absolute inset-0 rounded-2xl bg-emerald-500/[0.02] animate-pulse" />
                <Zap className="w-8 h-8 text-emerald-400 mb-1" />
                <div className="text-[9px] text-emerald-300 font-mono tracking-wider">⌘ K</div>
              </div>
            </div>
          </div>

          {/* 3. Integrations */}
          <div className="animate-on-scroll opacity-0 h-full rounded-2xl glass-glow-card overflow-hidden transition-all duration-300 group" style={{ animationDelay: "0.2s" }}>
            <div className="p-8 pb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center mb-4">
                <Link2 className="w-4 h-4 text-emerald-400" />
              </div>
              <h4 className="text-lg font-medium mb-2 text-white">Integrations</h4>
              <p className="text-emerald-100/50 text-sm leading-relaxed font-light">
                Sync with your existing workflow. Cursor, calendars, design tools, bring them all into Kiden.
              </p>
            </div>
            <div className="p-10 pt-4 flex items-center justify-center relative min-h-[220px]">
              {/* Connecting Lines */}
              <div className="absolute inset-0 z-0 opacity-[0.08] pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 200 200">
                  <line x1="60" y1="60" x2="140" y2="60" stroke="white" strokeWidth="1" />
                  <line x1="60" y1="140" x2="140" y2="140" stroke="white" strokeWidth="1" />
                  <line x1="60" y1="60" x2="60" y2="140" stroke="white" strokeWidth="1" />
                  <line x1="140" y1="60" x2="140" y2="140" stroke="white" strokeWidth="1" />
                </svg>
              </div>

              {/* Icons Grid */}
              <div className="grid grid-cols-2 gap-8 relative z-10">
                <div className="w-14 h-14 rounded-xl bg-black border border-white/5 flex items-center justify-center shadow-lg group-hover:-translate-x-1 group-hover:-translate-y-1 transition-transform duration-500">
                  <div className="w-6 h-6 text-white"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" /></svg></div>
                </div>
                <div className="w-14 h-14 rounded-xl bg-black border border-emerald-500/10 flex items-center justify-center shadow-lg group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-500">
                  <div className="w-7 h-7 flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold font-mono">31</div>
                </div>
                <div className="w-14 h-14 rounded-xl bg-black border border-emerald-500/10 flex items-center justify-center shadow-lg group-hover:-translate-x-1 group-hover:translate-y-1 transition-transform duration-500">
                  <div className="w-6 h-6 text-emerald-400 bg-emerald-950/20 border border-emerald-500/10 rounded-lg flex items-center justify-center"><svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 2l-5.5 9h11L12 2zm0 13l-5.5 9h11L12 15z" /></svg></div>
                </div>
                <div className="w-14 h-14 rounded-xl bg-black border border-white/5 flex items-center justify-center shadow-lg group-hover:translate-x-1 group-hover:translate-y-1 transition-transform duration-500">
                  <Palette className="w-5 h-5 text-emerald-400" />
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
