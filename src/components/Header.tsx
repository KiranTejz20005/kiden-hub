import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
const Header = () => {
  return <motion.header initial={{
    opacity: 0,
    y: -20
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.5
  }} className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="container mx-auto px-6">
        <nav className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">K</span>
            </div>
            <span className="font-serif text-xl font-semibold text-foreground">kiden</span>
          </a>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors link-underline text-sm">
              Product
            </a>
            <a href="#personas" className="text-muted-foreground hover:text-foreground transition-colors link-underline text-sm">
              Who It's For
            </a>
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors link-underline text-sm">
              About
            </a>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="hidden sm:flex">
              Log In
            </Button>
            <Button variant="hero" size="sm">
              Join Waitlist
            </Button>
          </div>
        </nav>
      </div>
    </motion.header>;
};
export default Header;