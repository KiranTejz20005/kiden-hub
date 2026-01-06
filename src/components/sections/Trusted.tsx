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
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 md:py-32 relative">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="max-w-3xl mx-auto text-center">
          {/* Section Label */}
          <div className="animate-on-scroll opacity-0 section-label mb-4">
            Kiden
          </div>

          {/* Headline */}
          <h2 className="animate-on-scroll opacity-0 text-3xl md:text-4xl lg:text-5xl font-light leading-tight mb-6">
            Trusted By Over{" "}
            <br className="md:hidden" />
            <span className="font-serif italic text-gradient">200</span> Creative
            Teams.
          </h2>

          {/* Description */}
          <p className="animate-on-scroll opacity-0 text-muted-foreground text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
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
