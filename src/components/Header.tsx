import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

const Header = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 py-4"
    >
      <div className="container mx-auto px-6">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-foreground flex items-center justify-center">
              <span className="text-background font-bold text-sm">●</span>
            </div>
            <span className="font-serif text-xl font-semibold text-foreground italic">kiden</span>
          </a>

          {/* Center Navigation */}
          <div className="hidden md:flex items-center nav-pill">
            <a href="#product" className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              PRODUCT
            </a>
            <a href="#workspace" className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              WORKSPACE
            </a>
            <a href="#pricing" className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              PRICING
            </a>
            <a href="#docs" className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              DOCS
            </a>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="hidden sm:flex gap-2 text-muted-foreground hover:text-foreground">
              <LogIn className="w-4 h-4" />
              SIGN IN
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-5">
              GET STARTED
            </Button>
          </div>
        </nav>
      </div>
    </motion.header>
  );
};

export default Header;