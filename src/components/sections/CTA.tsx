import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CTA = () => {
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
    <section ref={sectionRef} id="pricing" className="py-24 md:py-32 relative overflow-hidden">
      {/* Background textures */}
      <div className="absolute inset-0 bg-dots opacity-[0.2] pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)]" />
      <div className="absolute inset-0 bg-noise opacity-[0.015] pointer-events-none" />

      {/* Center glowing gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="animate-on-scroll opacity-0 text-3xl md:text-4xl lg:text-5xl font-light leading-tight mb-6">
            Enter{" "}
            <span className="font-serif italic text-white drop-shadow-[0_0_15px_rgba(16,185,129,0.15)]">Flow</span>
          </h2>
          <p className="animate-on-scroll opacity-0 text-emerald-100/60 text-base md:text-lg mb-8 font-light">
            Join thousands of creative teams shipping client work with clarity
            and focus.
          </p>
          <div className="animate-on-scroll opacity-0">
            <Link to="/auth">
              <Button variant="glow" size="lg" className="group rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all">
                Start for free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
