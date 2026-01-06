import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import kidenLogo from "@/assets/kiden-logo-green.jpg";

const Testimonial = () => {
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
    <section ref={sectionRef} className="py-24 md:pt-32 pb-0 relative overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12 relative z-10 flex flex-col items-center">

        {/* Section Label */}
        <div className="animate-on-scroll opacity-0 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-xs font-medium text-primary uppercase tracking-wide">What People Say</span>
        </div>

        {/* Quote */}
        <blockquote className="animate-on-scroll opacity-0 mb-16 max-w-4xl mx-auto text-center">
          <p className="text-3xl md:text-5xl font-light leading-tight tracking-tight text-white/90">
            “Beautifully executed! <br />
            A creative project tracker that <br />
            feels light but structured is rare. <br />
            <span className="text-white">Great work team!”</span>
          </p>
        </blockquote>

        {/* Author */}
        <div className="animate-on-scroll opacity-0 text-center mb-32">
          <div className="text-base text-muted-foreground font-medium">Vladimir Lugovsky, CEO of UI Bakery</div>
        </div>

        {/* Giant Green Horizon Glow & Button */}
        <div className="w-full relative h-[400px] flex justify-center items-end">
          {/* The Planet/Arc Glow */}
          <div className="absolute bottom-[-200px] left-1/2 -translate-x-1/2 w-[140%] h-[600px] rounded-[100%] border-t border-primary/50 bg-gradient-to-b from-primary/20 to-transparent blur-md"></div>
          <div className="absolute bottom-[-200px] left-1/2 -translate-x-1/2 w-[140%] h-[600px] rounded-[100%] bg-primary/10 blur-[100px]"></div>

          {/* Small Floating Elements */}
          <div className="absolute bottom-[200px] flex items-center justify-center">
            <div className="relative z-20">
              <div className="absolute inset-0 bg-white/20 blur-xl rounded-full" />
              <img src={kidenLogo} alt="Logo" className="w-16 h-16 rounded-full object-cover relative z-20 opacity-0" />
            </div>
          </div>

          {/* Enter Flow Button */}
          <div className="absolute bottom-32 z-30">
            <Link to="/auth">
              <Button className="bg-white text-black hover:bg-gray-100 rounded-full px-8 py-6 text-lg font-medium shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)] transition-all hover:scale-105">
                Enter Flow
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonial;
