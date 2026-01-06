import { useEffect, useRef } from "react";
import { Timer, CheckCircle2, MoreHorizontal, X, Pause, Play, Eye } from "lucide-react";

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
    <section ref={sectionRef} className="py-24 md:py-32 relative">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid md:grid-cols-2 gap-8">

          {/* Card 1: Focus Timer */}
          <div className="animate-on-scroll opacity-0 rounded-3xl bg-card border border-white/5 overflow-hidden group hover:border-white/10 transition-all duration-500">
            <div className="p-8 pb-4">
              <h3 className="text-2xl font-medium text-white mb-3">Focus Timer</h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
                Start a focus session to temporarily silence notifications and comments. Just you and your work. No distractions.
              </p>
            </div>

            {/* Timer Visual */}
            <div className="relative h-[300px] mt-8 overflow-hidden bg-[#0A0A0A]">
              {/* Faint Background UI */}
              <div className="absolute inset-0 p-6 opacity-20 pointer-events-none">
                <div className="space-y-3">
                  <div className="h-2 w-1/3 bg-white/20 rounded" />
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full border border-white/20" />
                      <div className="h-2 flex-1 bg-white/10 rounded" />
                    </div>
                  ))}
                </div>
              </div>

              {/* The Glowing Timer Widget */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                  {/* Red Glow */}
                  <div className="absolute inset-0 bg-primary/30 blur-[60px] rounded-full" />

                  <div className="relative flex items-center bg-[#111] border border-white/10 rounded-2xl p-2 shadow-2xl backdrop-blur-xl">
                    <div className="px-5 py-3 border-r border-white/5">
                      <span className="text-3xl font-mono font-medium text-white tracking-widest">24:59</span>
                    </div>
                    <div className="flex items-center gap-1 px-3">
                      <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 text-white/80 transition-colors">
                        <Pause className="w-5 h-5 fill-current" />
                      </button>
                      <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 text-white/50 transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Focus On Lists */}
          <div className="animate-on-scroll opacity-0 rounded-3xl bg-card border border-white/5 overflow-hidden group hover:border-white/10 transition-all duration-500">
            <div className="p-8 pb-4">
              <h3 className="text-2xl font-medium text-white mb-3">Focus On Lists</h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
                Too much noise on your board? Focus mode lets you zero in on one list at a time. Everything else disappears.
              </p>
            </div>

            {/* Kanban Visual */}
            <div className="relative h-[300px] mt-8 bg-[#0A0A0A] p-6 flex gap-4 overflow-hidden">
              {/* Column 1: Todo */}
              <div className="w-64 flex-shrink-0 opacity-40">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm font-medium text-white/60">Todo</span>
                </div>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/5 h-20" />
                  <div className="p-3 rounded-lg bg-white/5 border border-white/5 h-20" />
                </div>
              </div>

              {/* Column 2: In Progress (Active) */}
              <div className="w-64 flex-shrink-0 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span className="text-sm font-medium text-white">In Progress</span>
                  </div>
                  <MoreHorizontal className="w-4 h-4 text-white/40" />
                </div>
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-card border border-white/10">
                    <div className="w-3/4 h-2 bg-white/20 rounded mb-2" />
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/20" />
                      <div className="w-16 h-1.5 bg-white/10 rounded" />
                    </div>
                  </div>
                </div>

                {/* Context Menu Mockup */}
                <div className="absolute right-0 top-8 w-48 bg-[#151515] border border-white/10 rounded-lg shadow-2xl p-1.5 z-10 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-3 py-1.5 text-xs text-white/50 hover:bg-white/5 rounded cursor-pointer">Show Archived Tasks</div>
                  <div className="px-3 py-1.5 text-xs text-white flex items-center gap-2 bg-white/5 rounded cursor-pointer">
                    <Eye className="w-3 h-3 text-white/60" />
                    <span>Add To Focus</span>
                  </div>
                  <div className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded cursor-pointer">Remove Status</div>
                </div>
                {/* Cursor */}
                <div className="absolute right-12 top-16 z-20">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white drop-shadow-md">
                    <path d="M5.636 18.364L12 12l6.364 6.364" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" fill="white" stroke="black" strokeWidth="1" />
                  </svg>
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
