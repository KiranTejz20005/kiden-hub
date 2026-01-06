import { useEffect, useRef, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Box, AudioWaveform, Figma, Github, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const Integrations = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
  const sectionRef = useRef<HTMLDivElement>(null);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

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
      <div className="container mx-auto px-6 lg:px-12">
        {/* Header content */}
        <div className="mb-12 max-w-2xl">
          <div className="animate-on-scroll opacity-0 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-wide">Integrations</span>
          </div>

          <h2 className="animate-on-scroll opacity-0 text-4xl md:text-5xl lg:text-6xl font-light leading-tight mb-6">
            First Class <br />
            <span className="font-serif italic text-white/90">Integrations.</span>
          </h2>

          <p className="animate-on-scroll opacity-0 text-muted-foreground text-lg leading-relaxed max-w-lg">
            Integrations are a core part of Kiden. We connect the tools you already use so you can work faster without switching contexts.
          </p>
        </div>

        {/* Carousel */}
        <div className="animate-on-scroll opacity-0 relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-6">
              {integrations.map((item, index) => (
                <div key={item.name} className="flex-[0_0_85%] md:flex-[0_0_45%] lg:flex-[0_0_30%] min-w-0">
                  <div className={`relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/5 bg-gradient-to-br ${item.gradient} p-8 flex flex-col justify-end group transition-all duration-300 hover:border-white/10`}>

                    {/* Ambient Glow */}
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full ${item.glow} blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500`} />

                    {/* Center Icon */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform transition-transform duration-500 group-hover:scale-110">
                      <item.icon className={`w-16 h-16 ${item.iconColor}`} strokeWidth={1.5} />
                    </div>

                    {/* Content */}
                    <div className="relative z-10">
                      <h3 className="text-xl font-medium text-white mb-2">{item.name}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="hidden lg:flex absolute top-1/2 -translate-y-1/2 -right-4 md:-right-12 gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={scrollNext}
              className="rounded-full bg-black/50 border-white/10 text-white hover:bg-white/10 hover:text-white"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Integrations;
