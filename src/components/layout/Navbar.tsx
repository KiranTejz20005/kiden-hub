import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import kidenLogo from "@/assets/kiden-logo-green.jpg";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: "Features", href: "#features" },
    { label: "What's New", href: "#integrations" },
    { label: "Pricing", href: "#pricing" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <nav
      className={`fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out ${scrolled
        ? "top-4 w-[90%] md:w-[85%] lg:w-[75%] max-w-5xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] rounded-full py-3 px-6"
        : "top-0 w-full bg-transparent border-transparent py-6 px-4 md:px-6 lg:px-12"
        }`}
    >
      <div className={`${scrolled ? "w-full" : "container mx-auto"}`}>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 group">
            <div className={`relative overflow-hidden rounded-xl transition-all duration-300 ${scrolled ? "h-8 w-8" : "h-10 w-10"}`}>
              <img src={kidenLogo} alt="Kiden" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <span className={`font-semibold text-foreground tracking-tight transition-all duration-300 ${scrolled ? "text-lg" : "text-xl"}`}>
              Kiden
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 rounded-full hover:bg-white/10 ${scrolled ? "text-gray-300 hover:text-white" : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-4">
            <a
              href="/auth"
              className={`hidden sm:block text-sm font-medium transition-colors duration-200 ${scrolled ? "text-gray-300 hover:text-white" : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Login
            </a>
            <Link to="/auth">
              <Button
                variant="default"
                size={scrolled ? "sm" : "default"}
                className={`rounded-full font-medium transition-all duration-300 ${scrolled
                  ? "bg-white text-black hover:bg-gray-200 shadow-lg shadow-white/10"
                  : "bg-white text-black hover:bg-gray-200"
                  }`}
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
