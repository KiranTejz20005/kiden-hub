import { motion } from "framer-motion";

const Footer = () => {
  return (
    <footer className="py-8 border-t border-border/30">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center">
              <span className="text-background text-xs">●</span>
            </div>
            <span className="text-sm text-muted-foreground tracking-widest uppercase">
              THE AUTONOMOUS MIND PROJECT
            </span>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-8">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wider">
              TWITTER
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wider">
              DISCORD
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wider">
              GITHUB
            </a>
          </div>

          {/* Version */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-sm text-primary tracking-wider">
              V1.0.4 PRE-ALPHA
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;