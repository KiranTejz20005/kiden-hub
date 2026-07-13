import { useEffect, useRef } from "react";
import { Code, Search, Sparkles } from "lucide-react";

const Commands = () => {
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
    <section ref={sectionRef} className="py-24 md:py-32 relative overflow-hidden">
      {/* Background textures */}
      <div className="absolute inset-0 bg-dots opacity-[0.2] pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)]" />
      <div className="absolute inset-0 bg-noise opacity-[0.015] pointer-events-none" />

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="animate-on-scroll opacity-0 mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/20 border border-emerald-500/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">Commands</span>
          </div>
          <h2 className="animate-on-scroll opacity-0 text-3xl md:text-4xl lg:text-5xl font-light leading-tight mb-4">
            Slice It Your Way{" "}
            <span className="font-serif italic text-white drop-shadow-[0_0_15px_rgba(16,185,129,0.1)]">With Commands.</span>
          </h2>
          <p className="animate-on-scroll opacity-0 text-emerald-100/60 text-base md:text-lg max-w-xl mx-auto font-light">
            Build your own AI workflows with Commands. Define what you want
            once, then run it instantly whenever you need it.
          </p>
        </div>

        {/* Command Preview Box */}
        <div className="animate-on-scroll opacity-0 mb-10 max-w-3xl mx-auto">
          <div className="rounded-2xl glass-glow-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-200">AI Commands</span>
              </div>
              <div className="h-[1px] flex-1 bg-white/5" />
            </div>
            
            {/* Commands List */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.01] border border-white/5 hover:border-emerald-500/20 hover:bg-white/[0.02] transition-all">
                <Code className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-100">Generate Code</span>
                <span className="text-[10px] px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/10 text-emerald-300 font-mono ml-auto">
                  Cursor
                </span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.01] border border-white/5 hover:border-emerald-500/20 hover:bg-white/[0.02] transition-all">
                <Search className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-100">Research Topic</span>
                <span className="text-[10px] px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/10 text-emerald-300 font-mono ml-auto">
                  Perplexity
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <div className="animate-on-scroll opacity-0 rounded-2xl glass-glow-card p-8 transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center mb-6">
              <Code className="w-5 h-5 text-emerald-400" />
            </div>
            <h4 className="text-lg font-medium mb-3 text-white">Code Faster With Cursor</h4>
            <p className="text-emerald-100/50 text-sm leading-relaxed font-light">
              Trigger Cursor agents directly from your tasks to automatically
              draft code changes based on your requirements.
            </p>
          </div>
          <div className="animate-on-scroll opacity-0 rounded-2xl glass-glow-card p-8 transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center mb-6">
              <Search className="w-5 h-5 text-emerald-400" />
            </div>
            <h4 className="text-lg font-medium mb-3 text-white">Make Better Research</h4>
            <p className="text-emerald-100/50 text-sm leading-relaxed font-light">
              Let Kiden run your research and collect all of it directly into
              your tasks so that you can focus more on what you love doing.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Commands;
