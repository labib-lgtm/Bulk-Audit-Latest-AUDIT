import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { memo } from "react";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
};

interface Persona {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

interface HeroSectionProps {
  personas: Persona[];
  laptopMockup: string;
  mobileMockup: string;
}

const HeroSection = memo(({ personas, laptopMockup, mobileMockup }: HeroSectionProps) => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 pt-24 sm:pt-20">
      {/* Gradient orbs */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[800px] h-[400px] md:h-[600px] bg-gradient-to-b from-primary/25 via-primary/10 to-transparent rounded-full blur-[120px] pointer-events-none" 
        aria-hidden="true"
      />
      <div className="absolute bottom-0 left-[-10%] w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-primary/15 rounded-full blur-[150px] pointer-events-none" aria-hidden="true" />
      
      <div className="relative z-10 max-w-5xl mx-auto text-center">
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-primary text-xs sm:text-sm font-medium tracking-[0.15em] sm:tracking-[0.2em] uppercase mb-4 sm:mb-6"
        >
          Amazon PPC Analytics Platform
        </motion.p>
        
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight"
        >
          <span className="text-foreground/80">Turn Amazon Ad Data Into</span>
          <br />
          <span className="bg-gradient-to-r from-primary via-brand-400 to-primary bg-clip-text text-transparent">
            Profitable Insights
          </span>
          <br />
          <span className="text-foreground">in <span className="font-black">Minutes</span></span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-muted-foreground text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-8 sm:mb-10 px-4"
        >
          Upload your bulk files. Get cross-campaign analytics, TACOS insights, and optimization recommendations—no API setup required.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4"
        >
          <Button 
            onClick={() => navigate("/auth")}
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base group transition-all btn-glow"
          >
            Start Free Analysis
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button 
            onClick={() => navigate("/dashboard")}
            variant="outline"
            size="lg"
            className="border-border/50 text-muted-foreground hover:text-foreground hover:border-foreground/50 rounded-full px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base"
          >
            Try Demo Data
            <Zap className="ml-2 w-4 h-4" />
          </Button>
        </motion.div>
      </div>

      {/* Device Mockups */}
      <motion.div 
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative mt-8 sm:mt-12 w-full max-w-6xl mx-auto px-4"
      >
        <div className="relative flex items-end justify-center gap-4 sm:gap-8">
          {/* Laptop Mockup */}
          <div className="relative w-full max-w-3xl">
            <div className="relative bg-gradient-to-b from-muted to-background rounded-t-xl p-1.5 sm:p-2 border border-border/30">
              <div className="rounded-lg overflow-hidden bg-card aspect-[16/10]">
                <img 
                  src={laptopMockup} 
                  alt="Lynx Media Executive Dashboard showing TACOS, ACOS, and campaign performance metrics"
                  className="w-full h-full object-cover object-top"
                  loading="eager"
                />
              </div>
            </div>
            <div className="h-3 sm:h-4 bg-gradient-to-b from-muted to-secondary rounded-b-lg mx-3 sm:mx-4" />
            <div className="h-0.5 sm:h-1 bg-secondary rounded-full mx-6 sm:mx-8" />
          </div>

          {/* Phone Mockup */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="absolute right-2 bottom-2 sm:right-4 sm:bottom-4 md:right-0 md:bottom-0 md:relative w-20 sm:w-24 md:w-40 lg:w-48"
          >
            <div className="relative bg-gradient-to-b from-muted to-background rounded-2xl sm:rounded-3xl p-1 sm:p-1.5 border border-border/30">
              <div className="rounded-xl sm:rounded-2xl overflow-hidden bg-card aspect-[9/19]">
                <img 
                  src={mobileMockup} 
                  alt="Lynx Media mobile dashboard view"
                  className="w-full h-full object-cover object-top"
                  loading="eager"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Persona Avatars */}
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mt-12 sm:mt-16 flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-10 max-w-4xl mx-auto px-4"
      >
        {personas.map((persona, i) => (
          <motion.div 
            key={i} 
            variants={fadeInUp}
            whileHover={{ scale: 1.1, y: -5 }}
            className="flex flex-col items-center gap-1.5 sm:gap-2 group cursor-pointer"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-muted to-background border border-border/30 flex items-center justify-center group-hover:border-primary/30 transition-colors">
              <persona.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary/60 group-hover:text-primary transition-colors" />
            </div>
            <span className="text-[10px] sm:text-xs text-muted-foreground group-hover:text-foreground transition-colors">{persona.label}</span>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
});

HeroSection.displayName = "HeroSection";

export default HeroSection;
