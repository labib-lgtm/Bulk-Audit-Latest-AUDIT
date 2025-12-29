import { BarChart3, Shield, Lock } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { memo } from "react";

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
};

const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } }
};

const PrivacyCard = memo(() => {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6">
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={scaleIn}
        className="max-w-4xl mx-auto"
      >
        <motion.div 
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/15 via-card to-background border border-primary/20 p-6 sm:p-10 md:p-14 relative overflow-hidden"
        >
          <motion.div 
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, type: "spring" }}
            className="absolute top-4 left-4 sm:top-6 sm:left-6 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/20 flex items-center justify-center"
          >
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </motion.div>
          
          <motion.div 
            variants={slideInLeft}
            className="max-w-lg pt-8 sm:pt-0"
          >
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">
              Data Processed
              <br />
              Locally & Securely
            </h3>
            <p className="text-base sm:text-lg text-muted-foreground font-medium mb-4 sm:mb-6">
              Your Competitive Intelligence Stays Private.
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Your bulk files are processed entirely in your browser. No data is uploaded to external servers. Get the insights you need while keeping your advertising strategy confidential.
            </p>
            
            {/* Trust indicators */}
            <div className="flex flex-wrap gap-3 sm:gap-4 mt-6 sm:mt-8">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                <span>Browser-based processing</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                <span>No data uploads</span>
              </div>
            </div>
          </motion.div>

          <div className="absolute top-6 sm:top-10 right-6 sm:right-10 text-muted-foreground/30 text-xs sm:text-sm hidden md:block">
            Enterprise-Grade Privacy
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
});

PrivacyCard.displayName = "PrivacyCard";

export default PrivacyCard;
