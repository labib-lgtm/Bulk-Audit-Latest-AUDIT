import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { memo } from "react";

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } }
};

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
};

const CTASection = memo(() => {
  const navigate = useNavigate();

  return (
    <section className="py-24 sm:py-32 px-4 sm:px-6">
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-3xl mx-auto text-center"
      >
        <motion.p 
          variants={fadeIn}
          className="text-primary text-xs sm:text-sm font-medium tracking-[0.15em] sm:tracking-[0.2em] uppercase mb-3 sm:mb-4"
        >
          Get Started Today
        </motion.p>
        <motion.h2 
          variants={fadeInUp}
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6 sm:mb-8"
        >
          Ready to Optimize Your Amazon PPC?
        </motion.h2>
        <motion.p
          variants={fadeInUp}
          className="text-muted-foreground text-sm sm:text-base mb-8 max-w-xl mx-auto"
        >
          Join thousands of Amazon sellers who save hours every week with automated analytics and actionable insights.
        </motion.p>
        <motion.div variants={scaleIn} className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Button 
            onClick={() => navigate("/auth")}
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-bold btn-glow group"
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
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
});

CTASection.displayName = "CTASection";

export default CTASection;
