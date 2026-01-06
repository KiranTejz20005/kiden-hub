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
      className="relative min-h-screen flex flex-col overflow-hidden pt-20"
    >
      {/* Background gradient effects - Red/Warm Theme */}
      <div className="absolute inset-0 hero-gradient" />

      {/* Hero silhouette glow effect */}
      <div className="absolute right-0 top-0 w-full h-[70vh]">
        <div className="absolute right-0 top-0 w-1/2 h-full">
          {/* Main vertical glow beam */}
          <div className="absolute right-[15%] top-0 w-1 h-[60%] bg-gradient-to-b from-primary via-primary/60 to-transparent blur-sm" />
          <div className="absolute right-[15%] top-0 w-4 h-[60%] bg-gradient-to-b from-primary/40 via-primary/20 to-transparent blur-lg" />
          <div className="absolute right-[15%] top-0 w-16 h-[60%] bg-gradient-to-b from-primary/20 via-primary/10 to-transparent blur-2xl" />

          {/* Silhouette figure glow */}
          <div className="absolute right-[10%] top-[20%] w-[200px] h-[400px] bg-gradient-to-b from-primary/30 via-primary/10 to-transparent blur-3xl opacity-70" />
          <div className="absolute right-[5%] top-[15%] w-[150px] h-[300px] bg-gradient-to-b from-primary/40 via-transparent to-transparent blur-2xl opacity-60" />
        </div>

        {/* Ambient glow spread */}
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* Content Container */}
      <div className="container mx-auto px-6 lg:px-12 relative z-10 flex-1 flex flex-col">
        <div className="max-w-3xl pt-16 md:pt-24 lg:pt-32">
          {/* Badge */}
          <div className="animate-on-scroll opacity-0 mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-muted-foreground">
              The <span className="font-serif italic text-foreground">Creative</span> Project Tracker
            </span>
          </div>

          {/* Headline */}
          <h1 className="animate-on-scroll opacity-0 text-5xl md:text-6xl lg:text-7xl font-light leading-[1] tracking-tight mb-6">
            <span className="text-muted-foreground">Stay Focused.</span>
            <br />
            <span className="text-foreground">Ship </span>
            <span className="font-serif italic text-foreground">Faster.</span>
          </h1>

          {/* Description */}
          <p className="animate-on-scroll opacity-0 text-base md:text-lg text-muted-foreground max-w-md mb-8 leading-relaxed">
            Distraction-free project tracker for
            <br />
            designers & developers shipping client work.
          </p>

          {/* CTAs */}
          <div className="animate-on-scroll opacity-0 flex flex-wrap items-center gap-4">
            <Link to="/auth">
              <Button variant="default" size="lg" className="bg-primary text-white hover:bg-primary/90 shadow-[0_0_30px_-5px_hsl(var(--primary))]">
                Start for free
              </Button>
            </Link>
            <a
              href="#features"
              className="group inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-sm font-medium">New: Deep Integration</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </a>
          </div>
        </div>

        {/* Floating App Preview - Mocks the uploaded Dashboard Image */}
        <div className="mt-auto pb-0 w-full max-w-5xl mx-auto transform translate-y-12">
          <div className="animate-on-scroll opacity-0 relative">
            <div className="bg-[#050505] rounded-t-xl border border-white/10 border-b-0 shadow-2xl overflow-hidden">

              {/* Fake App Window */}
              <div className="flex h-[450px] md:h-[550px] w-full text-[10px] md:text-xs">

                {/* 1. Sidebar */}
                <div className="w-48 border-r border-white/5 bg-black/40 flex flex-col p-3 gap-6 hidden md:flex">
                  <div>
                    <div className="flex items-center justify-between px-2 mb-4 text-gray-400">
                      <div className="flex items-center gap-2 text-white font-medium">
                        <div className="w-4 h-4 rounded bg-white/10" />
                        Kiden
                      </div>
                      <div className="flex gap-1">
                        <div className="w-3 h-3" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      {["Inbox", "Flow", "Plan", "Work"].map((item, i) => (
                        <div key={item} className={`flex items-center gap-3 px-2 py-1.5 rounded cursor-pointer ${item === 'Work' ? 'bg-white/5 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                          <div className={`w-3.5 h-3.5 rounded-sm border ${item === 'Work' ? 'border-primary bg-primary/20' : 'border-white/10'}`} />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between px-2 mb-2 text-gray-500 font-medium">
                      <span>Workspace</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3 px-2 py-1.5 rounded bg-white/5 text-white">
                        <div className="w-3.5 h-3.5 border border-white/20 rounded-sm" />
                        Projects
                      </div>
                      <div className="flex items-center gap-3 px-2 py-1.5 rounded text-gray-500">
                        <div className="w-3.5 h-3.5 border border-white/10 rounded-sm" />
                        Users
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto px-2 text-gray-500">
                    <div className="flex items-center gap-3 py-1.5">
                      <div className="w-3.5 h-3.5 border border-white/10 rounded-sm" />
                      Settings
                    </div>
                  </div>
                </div>

                {/* 2. Main Board Area */}
                <div className="flex-1 flex flex-col bg-black/20 border-r border-white/5">
                  <div className="h-12 border-b border-white/5 flex items-center justify-between px-6">
                    <div className="flex items-center gap-3 text-white font-medium text-sm">
                      <div className="w-4 h-4 rounded border border-primary text-primary flex items-center justify-center text-[8px]">W</div>
                      Website
                    </div>
                  </div>

                  <div className="px-6 py-4 border-b border-white/5 flex gap-6 text-gray-500">
                    <span className="text-white pb-1 border-b border-primary">Boards <span className="text-[9px] bg-white/10 px-1 rounded ml-1">4</span></span>
                    <span>Stages <span className="text-[9px] bg-white/5 px-1 rounded ml-1">4</span></span>
                    <span>Settings</span>
                  </div>

                  <div className="p-6 grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-gray-500 mb-2">
                        <span>Inbox</span>
                        <span className="text-[9px] bg-white/5 px-1 rounded">2</span>
                      </div>
                      <div className="h-24 rounded-lg bg-white/5 border border-white/5" />
                      <div className="h-24 rounded-lg bg-white/5 border border-white/5" />
                    </div>
                    <div className="space-y-3 hidden lg:block">
                      <div className="flex items-center justify-between text-gray-500 mb-2">
                        <span>In Progress</span>
                        <span className="text-[9px] bg-white/5 px-1 rounded">1</span>
                      </div>
                      <div className="h-24 rounded-lg bg-white/5 border border-white/5" />
                    </div>
                  </div>
                </div>

                {/* 3. Details Panel */}
                <div className="w-80 bg-[#080808] flex flex-col hidden lg:flex">
                  <div className="h-10 border-b border-white/5 flex items-center justify-start gap-3 px-4 text-gray-600">
                    <span>»</span>
                    <span>⤢</span>
                    <span>🔗</span>
                  </div>

                  <div className="p-6">
                    <h3 className="text-base font-semibold text-white mb-6">Page Header</h3>

                    <p className="text-gray-500 mb-4">Create a page header block that should contain:</p>

                    <div className="space-y-2 mb-8">
                      <div className="flex items-center gap-3 p-2 rounded border border-white/5 bg-white/[0.02]">
                        <div className="w-3 h-3 rounded-sm border border-white/20" />
                        <span className="text-gray-400">Title</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 rounded border border-white/5 bg-white/[0.02]">
                        <div className="w-3 h-3 rounded-sm border border-white/20" />
                        <span className="text-gray-400">Description</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 rounded border border-white/5 bg-white/[0.02]">
                        <div className="w-3 h-3 rounded-sm border border-white/20" />
                        <span className="text-gray-400">Button</span>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between text-gray-500">
                        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary/50" /> ID</div>
                        <span className="bg-white/5 px-1.5 py-0.5 rounded text-gray-400">DEV-5</span>
                      </div>

                      <div className="border-t border-white/5 pt-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-400 font-medium">Properties</span>
                          <span className="text-gray-600">▼</span>
                        </div>
                        <div className="space-y-3 mt-4">
                          <div className="flex justify-between text-gray-500">
                            <span>Priority</span>
                            <span className="bg-white/5 px-2 py-0.5 rounded flex items-center gap-1"><div className="w-2 h-2 border border-white/20" /> Select</span>
                          </div>
                          <div className="flex justify-between text-gray-500">
                            <span>Labels</span>
                            <div className="flex gap-1">
                              <span className="bg-primary/10 text-primary px-1.5 rounded flex items-center gap-1"><div className="w-1.5 h-1.5 bg-primary rounded-full" /> Block</span>
                              <span className="bg-white/5 px-1.5 rounded">Select</span>
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
