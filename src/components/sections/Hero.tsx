import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Hero = () => {
  const heroRef = useRef<HTMLDivElement>(null);

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

    const elements = heroRef.current?.querySelectorAll(".animate-on-scroll");
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex flex-col overflow-hidden pt-20 hero-mesh-gradient"
    >
      {/* Background textures */}
      <div className="absolute inset-0 bg-grid opacity-[0.35] pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_70%,transparent_100%)]" />
      <div className="absolute inset-0 bg-dots opacity-[0.45] pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_100%)]" />
      <div className="absolute inset-0 bg-noise opacity-30 pointer-events-none" />

      {/* Hero silhouette glow effect */}
      <div className="absolute right-0 top-0 w-full h-[80vh] pointer-events-none">
        <div className="absolute right-0 top-0 w-1/2 h-full">
          {/* Main vertical glow beam */}
          <div className="absolute right-[15%] top-0 w-[2px] h-[70%] bg-gradient-to-b from-emerald-500 via-emerald-500/40 to-transparent blur-[2px]" />
          <div className="absolute right-[15%] top-0 w-8 h-[70%] bg-gradient-to-b from-emerald-500/20 via-emerald-500/10 to-transparent blur-md" />
          <div className="absolute right-[15%] top-0 w-32 h-[70%] bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent blur-3xl" />

          {/* Silhouette figure glow */}
          <div className="absolute right-[10%] top-[15%] w-[300px] h-[500px] bg-gradient-to-b from-emerald-500/15 via-emerald-500/5 to-transparent blur-[120px] opacity-80" />
        </div>

        {/* Ambient glow spread */}
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] rounded-full bg-emerald-500/[0.03] blur-[150px]" />
      </div>

      {/* Content Container */}
      <div className="container mx-auto px-6 lg:px-12 relative z-10 flex-1 flex flex-col">
        <div className="max-w-3xl pt-16 md:pt-24 lg:pt-32">
          {/* Badge */}
          <div className="animate-on-scroll opacity-0 mb-6 inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-950/20 border border-emerald-500/10 backdrop-blur-md shadow-inner shadow-white/5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#10b981]" />
            <span className="text-xs font-medium tracking-wide text-emerald-300 uppercase">
              The <span className="font-serif italic text-white lowercase">creative</span> project tracker
            </span>
          </div>

          {/* Headline */}
          <h1 className="animate-on-scroll opacity-0 text-5xl md:text-6xl lg:text-7xl font-light leading-[1.05] tracking-tight mb-8">
            <span className="text-gradient">Stay Focused.</span>
            <br />
            <span className="text-gradient-emerald">Ship </span>
            <span className="font-serif italic text-white select-none drop-shadow-[0_0_20px_rgba(16,185,129,0.15)]">Faster.</span>
          </h1>

          {/* Description */}
          <p className="animate-on-scroll opacity-0 text-base md:text-lg text-emerald-100/60 max-w-md mb-10 leading-relaxed font-light">
            Distraction-free project tracker built specifically for
            <br />
            designers & developers shipping premium client work.
          </p>

          {/* CTAs */}
          <div className="animate-on-scroll opacity-0 flex flex-wrap items-center gap-5">
            <Link to="/auth">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold shadow-[0_0_40px_-5px_rgba(16,185,129,0.4)] transition-all duration-300 hover:scale-[1.02]">
                Start for free
              </Button>
            </Link>
            <a
              href="#features"
              className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-emerald-500/5 border border-transparent hover:border-emerald-500/10 transition-all duration-300"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-xs font-medium text-emerald-200/80 group-hover:text-emerald-100 transition-colors">New: Deep Integration</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-1 transition-transform duration-200" />
            </a>
          </div>
        </div>

        {/* Floating App Preview - High-Texture redesign */}
        <div className="mt-20 pb-0 w-full max-w-5xl mx-auto transform translate-y-6">
          <div className="animate-on-scroll opacity-0 relative group">
            {/* Ambient reflection behind the mockup */}
            <div className="absolute -inset-1 rounded-t-2xl bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 opacity-30 group-hover:opacity-60 blur-xl transition-all duration-500" />

            <div className="relative bg-[#050606]/90 rounded-t-2xl border border-white/10 border-b-0 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] backdrop-blur-xl overflow-hidden">
              {/* Glass reflection shine across bezel */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.01] to-white/[0.04] pointer-events-none" />

              {/* Fake App Window */}
              <div className="flex h-[450px] md:h-[550px] w-full text-[10px] md:text-xs">

                {/* 1. Sidebar */}
                <div className="w-48 border-r border-white/5 bg-black/40 flex flex-col p-4 gap-6 hidden md:flex">
                  <div>
                    <div className="flex items-center justify-between px-2 mb-5">
                      <div className="flex items-center gap-2 text-white font-medium">
                        <div className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        </div>
                        Kiden
                      </div>
                    </div>
                    <div className="space-y-1">
                      {["Inbox", "Flow", "Plan", "Work"].map((item) => (
                        <div key={item} className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all ${item === 'Work' ? 'bg-emerald-500/10 border border-emerald-500/15 text-emerald-200' : 'text-emerald-100/40 hover:text-emerald-100 hover:bg-white/[0.02]'}`}>
                          <div className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center ${item === 'Work' ? 'border-emerald-400 bg-emerald-400/20' : 'border-white/10'}`}>
                            {item === 'Work' && <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />}
                          </div>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between px-2 mb-2 text-emerald-100/30 font-semibold tracking-wider uppercase text-[9px]">
                      <span>Workspace</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5 text-white">
                        <div className="w-3.5 h-3.5 border border-white/15 rounded-md flex items-center justify-center">
                          <span className="w-1 h-1 bg-white rounded-full" />
                        </div>
                        Projects
                      </div>
                      <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-emerald-100/40 hover:text-emerald-100 hover:bg-white/[0.01]">
                        <div className="w-3.5 h-3.5 border border-white/10 rounded-md" />
                        Users
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto px-2 text-emerald-100/30">
                    <div className="flex items-center gap-3 py-2 hover:text-emerald-100 cursor-pointer">
                      <div className="w-3.5 h-3.5 border border-white/10 rounded-md" />
                      Settings
                    </div>
                  </div>
                </div>

                {/* 2. Main Board Area */}
                <div className="flex-1 flex flex-col bg-black/20 border-r border-white/5">
                  <div className="h-12 border-b border-white/5 flex items-center justify-between px-6">
                    <div className="flex items-center gap-3 text-white font-medium text-sm">
                      <div className="w-5 h-5 rounded-lg border border-emerald-500/20 bg-emerald-950/30 text-emerald-400 flex items-center justify-center text-[10px] font-bold">W</div>
                      Website Redesign
                    </div>
                  </div>

                  <div className="px-6 py-4 border-b border-white/5 flex gap-6 text-emerald-100/30">
                    <span className="text-white pb-1 border-b border-emerald-400 font-medium">Boards <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full ml-1">4</span></span>
                    <span>Stages <span className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded-full ml-1">4</span></span>
                    <span>Settings</span>
                  </div>

                  <div className="p-6 grid grid-cols-2 gap-5 overflow-hidden">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-emerald-100/30 mb-1">
                        <span>Inbox</span>
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-300 px-1.5 py-0.5 rounded-full">2</span>
                      </div>
                      <div className="h-28 rounded-xl glass-glow-card p-4 transition-all duration-300 flex flex-col justify-between" />
                      <div className="h-28 rounded-xl glass-glow-card p-4 transition-all duration-300 flex flex-col justify-between" />
                    </div>
                    <div className="space-y-4 hidden lg:block">
                      <div className="flex items-center justify-between text-emerald-100/30 mb-1">
                        <span>In Progress</span>
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-300 px-1.5 py-0.5 rounded-full">1</span>
                      </div>
                      <div className="h-28 rounded-xl glass-glow-card p-4 transition-all duration-300 flex flex-col justify-between" />
                    </div>
                  </div>
                </div>

                {/* 3. Details Panel */}
                <div className="w-80 bg-[#060808]/90 flex flex-col hidden lg:flex">
                  <div className="h-12 border-b border-white/5 flex items-center justify-start gap-4 px-5 text-emerald-100/20">
                    <span className="hover:text-emerald-300 cursor-pointer">»</span>
                    <span className="hover:text-emerald-300 cursor-pointer">⤢</span>
                    <span className="hover:text-emerald-300 cursor-pointer">🔗</span>
                  </div>

                  <div className="p-6">
                    <h3 className="text-sm font-semibold text-white mb-6 tracking-wide">Page Header component</h3>

                    <p className="text-emerald-100/40 mb-4 leading-relaxed font-light">Create a structured page header block that contains:</p>

                    <div className="space-y-2 mb-8">
                      <div className="flex items-center gap-3 p-2.5 rounded-xl border border-white/5 bg-white/[0.01]">
                        <div className="w-3.5 h-3.5 rounded-md border border-white/20" />
                        <span className="text-emerald-100/60 text-xs">Title string</span>
                      </div>
                      <div className="flex items-center gap-3 p-2.5 rounded-xl border border-white/5 bg-white/[0.01]">
                        <div className="w-3.5 h-3.5 rounded-md border border-white/20" />
                        <span className="text-emerald-100/60 text-xs">Description text</span>
                      </div>
                      <div className="flex items-center gap-3 p-2.5 rounded-xl border border-white/5 bg-white/[0.01]">
                        <div className="w-3.5 h-3.5 rounded-md border border-white/25" />
                        <span className="text-emerald-100/60 text-xs">Action CTA Button</span>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="flex items-center justify-between text-emerald-100/40 text-xs">
                        <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" /> ID</div>
                        <span className="bg-emerald-950/40 border border-emerald-500/10 px-2 py-0.5 rounded-lg text-emerald-300 font-mono text-[10px]">DEV-5</span>
                      </div>

                      <div className="border-t border-white/5 pt-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-emerald-100/60 font-medium">Properties</span>
                          <span className="text-emerald-100/20 text-[8px]">▼</span>
                        </div>
                        <div className="space-y-3 mt-4 text-xs">
                          <div className="flex justify-between text-emerald-100/40">
                            <span>Priority</span>
                            <span className="bg-white/5 px-2.5 py-0.5 rounded-md text-emerald-100/80 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded bg-emerald-400" /> High</span>
                          </div>
                          <div className="flex justify-between text-emerald-100/40">
                            <span>Labels</span>
                            <div className="flex gap-1.5">
                              <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Block</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
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

export default Hero;
