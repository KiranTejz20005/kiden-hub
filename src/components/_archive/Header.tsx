import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import kidenLogo from "@/assets/kiden-logo.png";

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
          <Link to="/" className="flex items-center gap-2">
            <img src={kidenLogo} alt="Kiden" className="w-8 h-8 rounded-lg" />
            <span className="font-serif text-xl font-semibold text-foreground italic">kiden</span>
          </Link>

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
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="hidden sm:flex gap-2 text-muted-foreground hover:text-foreground">
                <LogIn className="w-4 h-4" />
                SIGN IN
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-5">
                GET STARTED
              </Button>
            </Link>
          </div>
        </nav>
      </div>
    </motion.header>
  );
};

export default Header;