import { motion, Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { type LucideIcon } from "lucide-react";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

interface MockCardItem {
  icon: LucideIcon;
  label: string;
  value?: string;
  badge?: string;
  badgeColor?: string;
  sub?: string;
}

interface FeatureShowcaseItem {
  badge: string;
  badgeColor: string;
  title: string;
  description: string;
  cta: string;
  route: string;
  gradient: string;
  cardTitle: string;
  cardSub: string;
  cardIcon: LucideIcon;
  items: MockCardItem[];
  footer?: { label: string; color: string };
  metrics?: { icon: LucideIcon; value: string; label: string; change: string; changeColor: string }[];
  barChart?: { label: string; value: number; max: number }[];
}

interface FeatureShowcaseSectionProps {
  features: FeatureShowcaseItem[];
}

const FeatureShowcaseSection = ({ features }: FeatureShowcaseSectionProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-24 sm:space-y-32 py-16 sm:py-24">
      {features.map((feature, index) => {
        const CardIcon = feature.cardIcon;
        return (
          <motion.div
            key={index}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-6xl mx-auto px-4 sm:px-6"
          >
            {/* Text side */}
            <motion.div variants={fadeInUp} className={index % 2 === 1 ? "lg:order-2" : ""}>
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-[0.15em] uppercase mb-6 border"
                style={{
                  color: feature.badgeColor,
                  borderColor: `${feature.badgeColor}33`,
                  backgroundColor: `${feature.badgeColor}0d`,
                }}
              >
                {feature.badge}
              </span>

              <h3 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold leading-[1.15] tracking-tight text-foreground mb-5">
                {feature.title}
              </h3>

              <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-8 max-w-lg">
                {feature.description}
              </p>

              <button
                onClick={() => navigate(feature.route)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-primary/30 text-primary text-sm font-medium hover:bg-primary/5 transition-colors"
              >
                {feature.cta}
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>

            {/* Card side */}
            <motion.div
              variants={fadeInUp}
              className={index % 2 === 1 ? "lg:order-1" : ""}
            >
              <div
                className="rounded-2xl p-6 sm:p-8 relative overflow-hidden"
                style={{ background: feature.gradient }}
              >
                {/* Mock card */}
                <div className="bg-white rounded-xl shadow-lg p-5 sm:p-6 relative z-10">
                  {/* Card header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: feature.gradient }}>
                      <CardIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{feature.cardTitle}</p>
                      <p className="text-gray-500 text-xs">{feature.cardSub}</p>
                    </div>
                  </div>

                  {/* Metrics row */}
                  {feature.metrics && (
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      {feature.metrics.map((m, mi) => {
                        const MIcon = m.icon;
                        return (
                          <div key={mi} className="text-center p-3 rounded-lg border border-gray-100">
                            <MIcon className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                            <p className="font-bold text-gray-900 text-lg">{m.value}</p>
                            <p className="text-gray-500 text-[10px]">{m.label}</p>
                            <p className="text-xs font-medium" style={{ color: m.changeColor }}>{m.change}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* List items */}
                  {feature.items.length > 0 && (
                    <div className="space-y-3">
                      {feature.items.map((item, ii) => {
                        const ItemIcon = item.icon;
                        return (
                          <div key={ii} className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <ItemIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-900 text-sm font-medium truncate">{item.label}</p>
                              {item.sub && <p className="text-gray-400 text-xs">{item.sub}</p>}
                            </div>
                            {item.value && <span className="text-sm font-semibold text-gray-900">{item.value}</span>}
                            {item.badge && (
                              <span
                                className="text-[11px] font-medium px-2.5 py-1 rounded-full text-white flex-shrink-0"
                                style={{ backgroundColor: item.badgeColor || "#6366f1" }}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Bar chart */}
                  {feature.barChart && (
                    <div className="mt-4 space-y-2.5">
                      {feature.barChart.map((bar, bi) => (
                        <div key={bi} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-20 truncate text-right">{bar.label}</span>
                          <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${(bar.value / bar.max) * 100}%`,
                                background: feature.gradient,
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-700 w-8">{bar.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  {feature.footer && (
                    <div className="mt-4 pt-3 border-t border-gray-100 text-center">
                      <span className="text-sm font-medium" style={{ color: feature.footer.color }}>
                        ✓ {feature.footer.label}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default FeatureShowcaseSection;
