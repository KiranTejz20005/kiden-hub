import { useEffect } from "react";
import Lenis from "lenis";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/sections/Hero";
import Trusted from "@/components/sections/Trusted";
import Features from "@/components/sections/Features";
import Integrations from "@/components/sections/Integrations";
import Commands from "@/components/sections/Commands";
import Structure from "@/components/sections/Structure";
import Focus from "@/components/sections/Focus";
import Testimonial from "@/components/sections/Testimonial";
import CTA from "@/components/sections/CTA";
import Footer from "@/components/layout/Footer";

const Index = () => {
  useEffect(() => {
    // Initialize Lenis for smooth scrolling
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <Hero />
      <Trusted />
      <Features />
      <Integrations />
      <Commands />
      <Structure />
      <Focus />
      <Testimonial />
      <CTA />
      <Footer />
    </main>
  );
};

export default Index;
