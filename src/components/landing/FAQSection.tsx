import { Plus, Minus } from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { memo, useState } from "react";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
};

interface FAQ {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  faqs: FAQ[];
}

const FAQSection = memo(({ faqs }: FAQSectionProps) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section id="faq" className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <motion.h2 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground text-center mb-10 sm:mb-16"
        >
          Frequently Asked Questions
        </motion.h2>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-2 sm:space-y-3"
          itemScope
          itemType="https://schema.org/FAQPage"
        >
          {faqs.map((faq, index) => (
            <motion.div 
              key={index} 
              variants={fadeInUp}
              itemScope
              itemProp="mainEntity"
              itemType="https://schema.org/Question"
            >
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full text-left p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-card border border-border/30 hover:border-primary/20 transition-all"
                aria-expanded={openFaq === index}
                aria-controls={`faq-answer-${index}`}
              >
                <div className="flex items-center justify-between gap-3 sm:gap-4">
                  <h3 itemProp="name" className="text-sm sm:text-base font-medium text-foreground pr-2">{faq.question}</h3>
                  <motion.div
                    animate={{ rotate: openFaq === index ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0"
                  >
                    {openFaq === index ? (
                      <Minus className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    ) : (
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                    )}
                  </motion.div>
                </div>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      id={`faq-answer-${index}`}
                      itemScope
                      itemProp="acceptedAnswer"
                      itemType="https://schema.org/Answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p itemProp="text" className="text-muted-foreground mt-3 sm:mt-4 text-xs sm:text-sm leading-relaxed">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
});

FAQSection.displayName = "FAQSection";

export default FAQSection;
