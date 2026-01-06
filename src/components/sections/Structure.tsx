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
    <section ref={sectionRef} className="py-24 md:py-32 relative">
      <div className="container mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <div className="mb-16">
          <div className="animate-on-scroll opacity-0 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-wide">Structure</span>
          </div>

          <h2 className="animate-on-scroll opacity-0 text-3xl md:text-5xl lg:text-6xl font-light leading-tight mb-6">
            Break Chaos<br />
            <span className="font-serif italic text-white/90">Into Structure</span>
          </h2>

          <p className="animate-on-scroll opacity-0 text-muted-foreground text-lg max-w-xl">
            The right structure makes everything easier. Break client projects
            into clear stages and tasks, so nothing falls through the cracks.
          </p>
        </div>

        {/* Tree Hierarchy Visual */}
        <div className="animate-on-scroll opacity-0 mb-20 pl-4 md:pl-12">
          <div className="relative">
            {/* Connecting Lines */}
            <div className="absolute left-6 top-12 bottom-12 w-px bg-white/10 border-l border-dashed border-white/20" />
            <div className="absolute left-6 top-1/2 w-12 h-px bg-white/10 border-t border-dashed border-white/20" />

            <div className="space-y-4">
              {/* Level 1: Projects */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-card border border-white/10 flex items-center justify-center text-primary relative z-10">
                  <Box strokeWidth={1.5} />
                </div>
                <span className="text-lg font-medium text-white/80">Projects</span>
              </div>

              {/* Level 2: Stages */}
              <div className="flex items-center gap-4 pl-16 relative">
                <div className="absolute left-6 top-1/2 w-10 h-px bg-white/10" />
                <div className="absolute left-6 bottom-1/2 h-[calc(100%+16px)] w-px bg-white/10" />

                <div className="w-12 h-12 rounded-xl bg-card border border-white/10 flex items-center justify-center text-primary relative z-10">
                  <Layers strokeWidth={1.5} />
                </div>
                <span className="text-lg font-medium text-white/80">Stages</span>
              </div>

              {/* Level 3: Tasks */}
              <div className="flex items-center gap-4 pl-32 relative">
                <div className="absolute left-[calc(4rem+1px)] top-1/2 w-10 h-px bg-white/10" />
                <div className="absolute left-[calc(4rem+1px)] -top-6 h-full w-px bg-white/10" />

                <div className="w-12 h-12 rounded-xl bg-card border border-white/10 flex items-center justify-center text-primary relative z-10">
                  <CheckCircle2 strokeWidth={1.5} />
                </div>
                <span className="text-lg font-medium text-white/80">Tasks</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dual Feature Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Card 1: Built For Structure */}
          <div className="animate-on-scroll opacity-0 rounded-2xl bg-card border border-white/5 overflow-hidden group hover:border-white/10 transition-all duration-500">
            <div className="p-8 pb-0">
              <h3 className="text-xl font-medium text-white mb-2">Built For Structure</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                Organize projects into stages and tasks. Always know what's in progress, what's next, and what's blocked.
              </p>
            </div>

            {/* List Preview */}
            <div className="p-6 pt-0 relative">
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-white/40 font-mono text-xs">01</span>
                  <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary">
                    <Box className="w-3 h-3" />
                  </div>
                  <span className="text-white/90 text-sm font-medium">Research</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-white/5 opacity-60">
                  <span className="text-white/20 font-mono text-xs">02</span>
                  <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary">
                    <FileText className="w-3 h-3" />
                  </div>
                  <span className="text-white/60 text-sm">Concept</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-white/5 opacity-40">
                  <span className="text-white/20 font-mono text-xs">03</span>
                  <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary">
                    <Figma className="w-3 h-3" />
                  </div>
                  <span className="text-white/60 text-sm">Design</span>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Card 2: Built For Client Work */}
          <div className="animate-on-scroll opacity-0 rounded-2xl bg-card border border-white/5 overflow-hidden group hover:border-white/10 transition-all duration-500">
            <div className="p-8 pb-0">
              <h3 className="text-xl font-medium text-white mb-2">Built For Client Work</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                Organize projects by client and see all their work at a glance without losing track of individual tasks.
              </p>
            </div>

            {/* Client Preview */}
            <div className="p-6 pt-0 relative">
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-white/60" />
                    </div>
                    <span className="text-white/80 text-sm">Notion</span>
                  </div>
                  <div className="px-2 py-1 rounded bg-white/5 border border-white/5 text-[10px] text-muted-foreground">5 Projects</div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center">
                      <Github className="w-4 h-4 text-white/60" />
                    </div>
                    <span className="text-white/80 text-sm">GitHub</span>
                  </div>
                  <div className="px-2 py-1 rounded bg-white/5 border border-white/5 text-[10px] text-muted-foreground">1 Projects</div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center">
                      <Figma className="w-4 h-4 text-white/60" />
                    </div>
                    <span className="text-white/80 text-sm">Figma</span>
                  </div>
                  <div className="px-2 py-1 rounded bg-white/5 border border-white/5 text-[10px] text-muted-foreground">4 Projects</div>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Structure;
