import { useNavigate } from "react-router-dom";
import { motion, Variants } from "framer-motion";
import { memo } from "react";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } }
};

interface Tool {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  route: string;
  active?: boolean;
}

interface ToolsSectionProps {
  tools: Tool[];
}

const ToolsSection = memo(({ tools }: ToolsSectionProps) => {
  const navigate = useNavigate();

  return (
    <section id="features" className="py-16 sm:py-24 px-4 sm:px-6">
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-4xl mx-auto text-center"
      >
        <motion.h2 
          variants={fadeInUp}
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6 leading-tight"
        >
          Everything you need to optimize
          <br className="hidden sm:block" />
          <span className="sm:hidden"> </span>your Amazon PPC
        </motion.h2>

        {/* First row - 7 items */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-8 sm:mt-12 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 sm:gap-3 md:gap-4 w-full max-w-4xl mx-auto"
        >
          {tools.slice(0, 7).map((tool, i) => (
            <motion.button 
              key={i}
              variants={scaleIn}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(tool.route)}
              className={`flex flex-col items-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 md:p-4 rounded-xl transition-colors cursor-pointer ${
                tool.active 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                  : 'bg-card border border-border/30 hover:border-primary/30'
              }`}
              aria-label={`Navigate to ${tool.label}`}
            >
              <tool.icon className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ${tool.active ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
              <span className={`text-[9px] sm:text-[10px] md:text-xs font-medium text-center leading-tight ${tool.active ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                {tool.label}
              </span>
            </motion.button>
          ))}
        </motion.div>
        
        {/* Second row - 3 items centered */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-2 sm:mt-3 md:mt-4 grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 w-full max-w-[200px] sm:max-w-xs md:max-w-md mx-auto"
        >
          {tools.slice(7).map((tool, i) => (
            <motion.button 
              key={i + 7}
              variants={scaleIn}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(tool.route)}
              className="flex flex-col items-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 md:p-4 rounded-xl transition-colors cursor-pointer bg-card border border-border/30 hover:border-primary/30"
              aria-label={`Navigate to ${tool.label}`}
            >
              <tool.icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-muted-foreground" />
              <span className="text-[9px] sm:text-[10px] md:text-xs font-medium text-center leading-tight text-muted-foreground">
                {tool.label}
              </span>
            </motion.button>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
});

ToolsSection.displayName = "ToolsSection";

export default ToolsSection;
