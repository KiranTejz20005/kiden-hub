import { useEffect, useRef } from "react";
import { Box, Layers, CheckCircle2, FileText, Github, Figma, Command } from "lucide-react";

const Structure = () => {
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
      {/* Background textures */}
      <div className="absolute inset-0 bg-dots opacity-[0.2] pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)]" />
      <div className="absolute inset-0 bg-noise opacity-[0.015] pointer-events-none" />

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        {/* Section Header */}
        <div className="mb-16">
          <div className="animate-on-scroll opacity-0 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/20 border border-emerald-500/10 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">Structure</span>
          </div>

          <h2 className="animate-on-scroll opacity-0 text-3xl md:text-5xl lg:text-6xl font-light leading-tight mb-6">
            Break Chaos<br />
            <span className="font-serif italic text-white select-none drop-shadow-[0_0_15px_rgba(16,185,129,0.1)]">Into Structure</span>
          </h2>

          <p className="animate-on-scroll opacity-0 text-emerald-100/60 text-base md:text-lg max-w-xl font-light">
            The right structure makes everything easier. Break client projects
            into clear stages and tasks, so nothing falls through the cracks.
          </p>
        </div>

        {/* Tree Hierarchy Visual */}
        <div className="animate-on-scroll opacity-0 mb-20 pl-4 md:pl-12">
          <div className="relative">
            {/* Connecting Lines */}
            <div className="absolute left-6 top-12 bottom-12 w-px border-l border-dashed border-emerald-500/20" />
            <div className="absolute left-6 top-1/2 w-12 h-px border-t border-dashed border-emerald-500/20" />

            <div className="space-y-6">
              {/* Level 1: Projects */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-black/40 border border-emerald-500/20 flex items-center justify-center text-emerald-400 relative z-10 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                  <Box strokeWidth={1.5} className="w-5 h-5" />
                </div>
                <span className="text-lg font-light text-white/80">Projects</span>
              </div>

              {/* Level 2: Stages */}
              <div className="flex items-center gap-4 pl-16 relative">
                <div className="absolute left-6 top-1/2 w-10 h-px border-t border-dashed border-emerald-500/25" />
                <div className="absolute left-6 bottom-1/2 h-[calc(100%+24px)] w-px border-l border-dashed border-emerald-500/25" />

                <div className="w-12 h-12 rounded-xl bg-black/40 border border-emerald-500/20 flex items-center justify-center text-emerald-400 relative z-10 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                  <Layers strokeWidth={1.5} className="w-5 h-5" />
                </div>
                <span className="text-lg font-light text-white/80">Stages</span>
              </div>

              {/* Level 3: Tasks */}
              <div className="flex items-center gap-4 pl-32 relative">
                <div className="absolute left-[calc(4rem+1px)] top-1/2 w-10 h-px border-t border-dashed border-emerald-500/25" />
                <div className="absolute left-[calc(4rem+1px)] -top-8 h-full w-px border-l border-dashed border-emerald-500/25" />

                <div className="w-12 h-12 rounded-xl bg-black/40 border border-emerald-500/20 flex items-center justify-center text-emerald-400 relative z-10 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                  <CheckCircle2 strokeWidth={1.5} className="w-5 h-5" />
                </div>
                <span className="text-lg font-light text-white/80">Tasks</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dual Feature Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Card 1: Built For Structure */}
          <div className="animate-on-scroll opacity-0 rounded-2xl glass-glow-card overflow-hidden group transition-all duration-500">
            <div className="p-8 pb-0">
              <h3 className="text-xl font-medium text-white mb-2">Built For Structure</h3>
              <p className="text-emerald-100/50 text-sm leading-relaxed mb-6 font-light">
                Organize projects into stages and tasks. Always know what's in progress, what's next, and what's blocked.
              </p>
            </div>

            {/* List Preview */}
            <div className="p-6 pt-0 relative bg-black/5">
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-white/20 font-mono text-xs">01</span>
                  <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Box className="w-3 h-3" />
                  </div>
                  <span className="text-emerald-200 text-sm font-medium">Research</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.01] border border-white/5 opacity-60">
                  <span className="text-white/10 font-mono text-xs">02</span>
                  <div className="w-6 h-6 rounded-md bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center text-emerald-400/70">
                    <FileText className="w-3 h-3" />
                  </div>
                  <span className="text-emerald-100/60 text-sm">Concept</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.01] border border-white/5 opacity-40">
                  <span className="text-white/10 font-mono text-xs">03</span>
                  <div className="w-6 h-6 rounded-md bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center text-emerald-400/50">
                    <Figma className="w-3 h-3" />
                  </div>
                  <span className="text-emerald-100/60 text-sm">Design</span>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#090b0a] to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Card 2: Built For Client Work */}
          <div className="animate-on-scroll opacity-0 rounded-2xl glass-glow-card overflow-hidden group transition-all duration-500">
            <div className="p-8 pb-0">
              <h3 className="text-xl font-medium text-white mb-2">Built For Client Work</h3>
              <p className="text-emerald-100/50 text-sm leading-relaxed mb-6 font-light">
                Organize projects by client and see all their work at a glance without losing track of individual tasks.
              </p>
            </div>

            {/* Client Preview */}
            <div className="p-6 pt-0 relative bg-black/5">
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.01] border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-white/80 text-sm font-medium">Notion</span>
                  </div>
                  <div className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/10 text-[9px] text-emerald-300 font-mono">5 Projects</div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.01] border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                      <Github className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-white/80 text-sm font-medium">GitHub</span>
                  </div>
                  <div className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/10 text-[9px] text-emerald-300 font-mono">1 Project</div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.01] border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                      <Figma className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-white/80 text-sm font-medium">Figma</span>
                  </div>
                  <div className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/10 text-[9px] text-emerald-300 font-mono">4 Projects</div>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#090b0a] to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Structure;
