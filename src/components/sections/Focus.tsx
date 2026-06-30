import { useEffect, useRef } from "react";
import { Timer, CheckCircle2, MoreHorizontal, X, Pause } from "lucide-react";

const Focus = () => {
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

  return (
    <section ref={sectionRef} className="py-24 md:py-32 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-noise opacity-[0.015] pointer-events-none" />

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">

          {/* Card 1: Flowcus */}
          <div className="animate-on-scroll opacity-0 rounded-[2rem] glass-glow-card overflow-hidden group transition-all duration-500">
            <div className="p-8 md:p-10 relative">
              <div className="absolute inset-0 bg-dots opacity-[0.1] pointer-events-none" />
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="p-2 bg-emerald-950/40 border border-emerald-500/20 rounded-lg">
                  <Timer className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">Immersive Experience</span>
              </div>
              <h3 className="text-3xl font-light text-white mb-4 relative z-10">
                Flowcus
              </h3>
              <p className="text-emerald-100/50 text-sm leading-relaxed max-w-sm mb-4 relative z-10 font-light">
                Enter a state of flow with a custom-designed focus interface. Immersive soundscapes, dynamic themes, and a minimal timer to keep you in the zone.
              </p>
            </div>

            {/* Timer Visual */}
            <div className="relative h-[350px] overflow-hidden bg-[#050606]/85 border-t border-white/5">
              {/* Grid texture */}
              <div className="absolute inset-0 bg-grid opacity-[0.15] pointer-events-none" />

              {/* The Glowing Timer Widget */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="relative flex flex-col items-center">
                  {/* Progress Ring Mockup */}
                  <div className="absolute inset-0 -m-8 rounded-full border border-emerald-500/20 animate-pulse" />
                  <div className="absolute inset-0 -m-12 rounded-full border border-emerald-500/10" />

                  <div className="relative w-48 h-48 rounded-full bg-black/60 border border-white/10 flex flex-col items-center justify-center shadow-2xl backdrop-blur-xl">
                    <span className="text-4xl font-mono text-white tracking-widest tabular-nums font-light">25:00</span>
                    <div className="flex items-center gap-1.5 mt-3 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      <span className="text-[9px] uppercase font-semibold text-emerald-300">Deep Work</span>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-8">
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
                      <X className="w-4 h-4" />
                    </div>
                    <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-xl hover:scale-105 transition-transform cursor-pointer">
                      <Pause className="w-5 h-5 fill-current" />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
                      <MoreHorizontal className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Focus On Lists */}
          <div className="animate-on-scroll opacity-0 rounded-[2rem] glass-glow-card overflow-hidden group transition-all duration-500">
            <div className="p-8 md:p-10 relative">
              <div className="absolute inset-0 bg-dots opacity-[0.1] pointer-events-none" />
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="p-2 bg-emerald-950/40 border border-emerald-500/20 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">Smart Selection</span>
              </div>
              <h3 className="text-3xl font-light text-white mb-4 relative z-10">
                Focus Mode
              </h3>
              <p className="text-emerald-100/50 text-sm leading-relaxed max-w-sm mb-4 relative z-10 font-light">
                Too much noise on your board? Zero in on one list or task at a time. Everything else fades into the background.
              </p>
            </div>

            {/* Kanban Visual */}
            <div className="relative h-[350px] bg-[#050606]/85 p-8 flex gap-4 overflow-hidden border-t border-white/5">
              {/* Grid texture */}
              <div className="absolute inset-0 bg-grid opacity-[0.15] pointer-events-none" />

              {/* Column 1: Todo */}
              <div className="w-64 flex-shrink-0 opacity-20 transition-opacity duration-500 group-hover:opacity-10 relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-white/20" />
                  <div className="h-3 w-16 bg-white/10 rounded-full" />
                </div>
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-white/[0.01] border border-white/5 h-24" />
                  <div className="p-3 rounded-xl bg-white/[0.01] border border-white/5 h-24" />
                </div>
              </div>

              {/* Column 2: In Progress (Active) */}
              <div className="w-64 flex-shrink-0 relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)] animate-pulse" />
                    <span className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">Active Focus</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="p-5 rounded-2xl bg-black/40 border border-emerald-500/20 shadow-2xl relative overflow-hidden group-hover:border-emerald-500/30 transition-colors">
                    <div className="absolute inset-0 bg-emerald-500/[0.02]" />
                    <div className="relative">
                      <div className="w-3/4 h-2.5 bg-white/40 rounded-full mb-3" />
                      <div className="w-1/2 h-2 bg-white/10 rounded-full mb-4" />
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <div className="w-20 h-2 bg-emerald-500/20 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating tooltips/elements to make it busy but focused */}
                <div className="absolute -right-4 top-24 w-40 p-4 bg-emerald-950/90 rounded-2xl shadow-2xl border border-emerald-500/30 backdrop-blur-md animate-float">
                  <p className="text-[9px] font-semibold text-emerald-300 uppercase tracking-wider mb-1">State of Flow</p>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 w-2/3" />
                    </div>
                    <span className="text-[9px] font-mono text-emerald-300">65%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Focus;
