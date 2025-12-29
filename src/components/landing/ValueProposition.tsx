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

const ValueProposition = memo(() => {
  return (
    <section className="py-20 sm:py-32 px-4 sm:px-6">
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="max-w-4xl mx-auto text-center"
      >
        <motion.p 
          variants={fadeIn}
          className="text-primary text-xs sm:text-sm font-medium tracking-[0.15em] sm:tracking-[0.2em] uppercase mb-4 sm:mb-6"
        >
          Why Lynx Media
        </motion.p>
        <motion.h2 
          variants={fadeInUp}
          className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-medium leading-relaxed text-muted-foreground/80"
        >
          Stop drowning in spreadsheets. Get <span className="text-primary font-semibold">unified analytics</span> across SP, SB & SD campaigns with <span className="text-primary font-semibold">TACOS visibility</span> and <span className="text-primary font-semibold">actionable diagnostics</span> that actually move the needle.
        </motion.h2>
      </motion.div>
    </section>
  );
});

ValueProposition.displayName = "ValueProposition";

export default ValueProposition;
