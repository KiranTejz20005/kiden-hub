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
    <section ref={sectionRef} id="pricing" className="py-24 md:py-32 relative">
      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="animate-on-scroll opacity-0 text-3xl md:text-4xl lg:text-5xl font-light leading-tight mb-6">
            Enter{" "}
            <span className="font-serif italic text-gradient">Flow</span>
          </h2>
          <p className="animate-on-scroll opacity-0 text-muted-foreground text-base md:text-lg mb-8">
            Join thousands of creative teams shipping client work with clarity
            and focus.
          </p>
          <div className="animate-on-scroll opacity-0">
            <Link to="/auth">
              <Button variant="glow" size="lg" className="group">
                Start for free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
