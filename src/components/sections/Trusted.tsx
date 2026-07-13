import { useEffect, useRef } from "react";

const Trusted = () => {
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
      <div className="absolute inset-0 bg-grid opacity-[0.15] pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)]" />
      <div className="absolute inset-0 bg-noise opacity-[0.015] pointer-events-none" />

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Section Label */}
          <div className="animate-on-scroll opacity-0 mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/20 border border-emerald-500/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">Trust</span>
          </div>

          {/* Headline */}
          <h2 className="animate-on-scroll opacity-0 text-3xl md:text-4xl lg:text-5xl font-light leading-tight mb-6">
            Trusted By Over{" "}
            <br className="md:hidden" />
            <span className="font-serif italic text-white drop-shadow-[0_0_15px_rgba(16,185,129,0.15)]">200</span> Creative
            Teams.
          </h2>

          {/* Description */}
          <p className="animate-on-scroll opacity-0 text-emerald-100/60 text-base md:text-lg leading-relaxed max-w-2xl mx-auto font-light">
            Creative teams choose Kiden because it gives them structure without
            the chaos and focus without the noise. The result? They ship faster,
            stress less, and actually enjoy the process of managing client work.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Trusted;
