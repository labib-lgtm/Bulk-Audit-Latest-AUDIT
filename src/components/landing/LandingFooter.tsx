import { motion } from "framer-motion";
import { memo } from "react";

interface LandingFooterProps {
  logoSrc: string;
}

const LandingFooter = memo(({ logoSrc }: LandingFooterProps) => {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="py-8 sm:py-12 px-4 sm:px-6 border-t border-border/20"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
        <p className="text-[10px] sm:text-xs text-muted-foreground order-2 md:order-1">
          © Lynx Media {currentYear}. All rights reserved.
        </p>
        <img src={logoSrc} alt="Lynx Media" className="h-4 sm:h-5 opacity-60 order-1 md:order-2" loading="lazy" />
        <nav className="flex flex-wrap justify-center gap-4 sm:gap-6 text-[10px] sm:text-xs text-muted-foreground order-3">
          <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          <a href="#" className="hover:text-foreground transition-colors">Acceptable Use</a>
          <a href="#" className="hover:text-foreground transition-colors">Accessibility</a>
        </nav>
      </div>
    </motion.footer>
  );
});

LandingFooter.displayName = "LandingFooter";

export default LandingFooter;
