import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { memo } from "react";

interface LandingNavProps {
  logoSrc: string;
}

const LandingNav = memo(({ logoSrc }: LandingNavProps) => {
  const navigate = useNavigate();

  return (
    <motion.nav 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 sm:px-6 py-3 rounded-full border border-border/30 bg-background/80 backdrop-blur-xl"
    >
      <div className="flex items-center gap-4 sm:gap-8">
        <img src={logoSrc} alt="Lynx Media - Amazon PPC Analytics" className="h-5 sm:h-6" />
        <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button 
            onClick={() => navigate("/auth")}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground text-xs sm:text-sm"
          >
            Login
          </Button>
          <Button 
            onClick={() => navigate("/auth")}
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-3 sm:px-5 text-xs sm:text-sm"
          >
            Get Started Free
          </Button>
        </div>
      </div>
    </motion.nav>
  );
});

LandingNav.displayName = "LandingNav";

export default LandingNav;
