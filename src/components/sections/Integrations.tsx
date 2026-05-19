import { useEffect, useRef, useCallback } from "react";
// import useEmblaCarousel from "embla-carousel-react"; // Removed for stability
import { Box, AudioWaveform, Figma, Github, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const Integrations = () => {
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

  const integrations = [
    {
      name: "Cursor",
      description: "Trigger Cursor agents directly from your tasks.",
      icon: Box,
      gradient: "from-white/10 to-white/5",
      glow: "bg-white/20",
      iconColor: "text-white",
    },
    {
      name: "Harvest",
      description: "Track time using Harvest that you then can use for invoicing and more.",
      icon: AudioWaveform,
      gradient: "from-primary/20 to-primary/10",
      glow: "bg-primary/20",
      iconColor: "text-primary",
    },
    {
      name: "Figma",
      description: "Attach Figma frames to show your team or to add as context for AI.",
      icon: Figma,
      gradient: "from-primary/20 to-primary/10",
      glow: "bg-primary/20",
      iconColor: "text-primary",
    },
    {
      name: "GitHub",
      description: "Two-way sync with GitHub issues ensure your dev team stays in the loop.",
      icon: Github,
      gradient: "from-primary/20 to-primary/10",
      glow: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      name: "Slack",
      description: "Get notified about project updates directly in your team's Slack channels.",
      icon: Box, // Placeholder
      gradient: "from-primary/20 to-primary/10",
      glow: "bg-primary/10",
      iconColor: "text-primary",
    },
  ];

  return (
    <section ref={sectionRef} id="integrations" className="py-24 md:py-32 relative overflow-hidden">
      {/* Background textures */}
      <div className="absolute inset-0 bg-grid opacity-[0.2] pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)]" />
      <div className="absolute inset-0 bg-noise opacity-[0.015] pointer-events-none" />

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        {/* Header content */}
        <div className="mb-16 max-w-2xl">
          <div className="animate-on-scroll opacity-0 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/20 border border-emerald-500/10 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">Integrations</span>
          </div>

          <h2 className="animate-on-scroll opacity-0 text-4xl md:text-5xl lg:text-6xl font-light leading-tight mb-6">
            First Class <br />
            <span className="font-serif italic text-white select-none drop-shadow-[0_0_15px_rgba(16,185,129,0.1)]">Integrations.</span>
          </h2>

          <p className="animate-on-scroll opacity-0 text-emerald-100/60 text-base md:text-lg leading-relaxed max-w-lg font-light">
            Integrations are a core part of Kiden. We connect the tools you already use so you can work faster without switching contexts.
          </p>
        </div>

        {/* Carousel (Replaced with Native Scroll) */}
        <div className="animate-on-scroll opacity-0 relative">
          <div className="overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-none">
            <div className="flex gap-6 w-max px-4">
              {integrations.map((item) => (
                <div key={item.name} className="snap-center w-[300px] md:w-[400px] lg:w-[450px] shrink-0">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden glass-glow-card p-8 flex flex-col justify-end group transition-all duration-300">
                    
                    {/* Dots grid texture inside card */}
                    <div className="absolute inset-0 bg-dots opacity-[0.15] pointer-events-none" />

                    {/* Ambient Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-emerald-500/5 blur-[80px] opacity-40 group-hover:opacity-85 transition-opacity duration-500" />

                    {/* Center Icon */}
                    <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 transform transition-all duration-500 group-hover:scale-105">
                      <div className="w-20 h-20 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center shadow-xl group-hover:border-emerald-500/20 transition-all duration-300">
                        <item.icon className="w-10 h-10 text-emerald-400" strokeWidth={1.2} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="relative z-10 border-t border-white/5 pt-6 bg-gradient-to-t from-black/20 to-transparent">
                      <h3 className="text-xl font-medium text-white mb-2">{item.name}</h3>
                      <p className="text-sm text-emerald-100/50 leading-relaxed font-light">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Integrations;
