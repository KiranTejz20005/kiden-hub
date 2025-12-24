import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import MeetKaidenSection from "@/components/MeetKaidenSection";
import VisualSearchSection from "@/components/VisualSearchSection";
import CanvasSection from "@/components/CanvasSection";
import NeverForgetSection from "@/components/NeverForgetSection";
import FeaturesGrid from "@/components/FeaturesGrid";
import PersonasSection from "@/components/PersonasSection";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      <HeroSection />
      <MeetKaidenSection />
      <VisualSearchSection />
      <CanvasSection />
      <NeverForgetSection />
      <FeaturesGrid />
      <PersonasSection />
      <FinalCTA />
      <Footer />
    </main>
  );
};

export default Index;
