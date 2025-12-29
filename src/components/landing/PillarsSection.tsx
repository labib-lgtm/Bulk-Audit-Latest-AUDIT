import { Monitor } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { memo } from "react";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } }
};

interface Pillar {
  tag: string;
  title: string;
  description: string;
  features?: string[];
  image?: boolean;
}

interface PillarsSectionProps {
  pillars: Pillar[];
}

const PillarsSection = memo(({ pillars }: PillarsSectionProps) => {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6"
        >
          {pillars.map((pillar, index) => (
            <motion.article
              key={index}
              variants={fadeInUp}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-card to-background border border-border/30 hover:border-primary/20 transition-colors card-hover"
            >
              {pillar.image ? (
                <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-muted to-background flex items-center justify-center mb-4 sm:mb-6">
                  <Monitor className="w-12 h-12 sm:w-16 sm:h-16 text-primary/40" />
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6">
                  {pillar.features?.map((feature, i) => (
                    <span 
                      key={i}
                      className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs bg-muted border border-border/30 text-muted-foreground"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              )}
              
              <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] sm:text-xs font-medium mb-3 sm:mb-4">
                {pillar.tag}
              </span>
              
              <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 sm:mb-3">{pillar.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{pillar.description}</p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
});

PillarsSection.displayName = "PillarsSection";

export default PillarsSection;
