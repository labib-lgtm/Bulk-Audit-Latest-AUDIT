import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, BarChart3, Target, TrendingUp, Zap, 
  Search, Package, Layers, Activity, Video, Monitor,
  Users, Link, LayoutDashboard, FileText, MessageSquare,
  Briefcase, ChevronLeft, ChevronRight, Plus, Minus
} from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import lynxLogoDark from "@/assets/lynx-logo-dark.png";
import dashboardLaptopMockup from "@/assets/dashboard-laptop-mockup.png";
import dashboardMobileMockup from "@/assets/dashboard-mobile-mockup.png";
import { useState } from "react";

// Animation variants with proper typing
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6 }
  }
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.5 }
  }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.5 }
  }
};

const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -60 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.6 }
  }
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const personas = [
    { icon: BarChart3, label: "Brand Owner" },
    { icon: Users, label: "Agency" },
    { icon: Target, label: "PPC Manager" },
    { icon: Briefcase, label: "Consultant" },
    { icon: Package, label: "Amazon Seller" },
    { icon: Layers, label: "Enterprise" },
  ];

  const pillars = [
    {
      tag: "Upload",
      title: "Bulk File Processing",
      description: "Simply upload your Amazon Bulk Operations file. We parse SP, SB, and SD campaigns, keywords, targets, and placements instantly.",
      features: ["Bulk Operations", "Business Reports", "Search Terms", "No API Required"]
    },
    {
      tag: "Analyze",
      title: "Cross-Campaign Insights",
      description: "See the full picture with unified metrics across all ad types. ACOS, ROAS, TACOS, CVR—all in one executive dashboard.",
      features: ["ACOS/ROAS", "TACOS Analysis", "Branded vs Generic", "Wasted Spend", "Portfolio Breakdown", "Placement Analysis"]
    },
    {
      tag: "Optimize",
      title: "Actionable Diagnostics",
      description: "Identify underperforming targets, wasted spend, and scaling opportunities with smart diagnostics and recommendations.",
      image: true
    }
  ];

  const tools = [
    { icon: LayoutDashboard, label: "Executive Dashboard", active: true },
    { icon: Target, label: "SP Campaigns" },
    { icon: Video, label: "SB Campaigns" },
    { icon: Monitor, label: "SD Campaigns" },
    { icon: Search, label: "Search Terms" },
    { icon: Package, label: "ASIN Audit" },
    { icon: Layers, label: "Portfolios" },
    { icon: Activity, label: "Diagnostics" },
    { icon: BarChart3, label: "TACOS/ROAS" },
    { icon: FileText, label: "Reports" },
  ];

  const faqs = [
    {
      question: "What reports do I need to upload?",
      answer: "You'll need your Sponsored Products, Sponsored Brands, and Sponsored Display bulk reports from Amazon Advertising Console. Optionally, upload your Business Report for ASIN-level profitability analysis."
    },
    {
      question: "Do I need API access or technical setup?",
      answer: "No. Lynx Media works entirely with bulk file uploads. No API connections, no developer needed, no complex integrations."
    },
    {
      question: "How is this different from Amazon's built-in analytics?",
      answer: "Amazon shows you data. We show you insights. Cross-campaign analysis, N-gram breakdowns, ASIN profitability with TACOS, wasted spend detection—insights that would take hours to compile manually."
    },
    {
      question: "Can I use this for multiple brands or clients?",
      answer: "Yes! Our platform supports multi-tenant architecture, making it perfect for agencies and brands managing multiple accounts."
    },
    {
      question: "Is my data secure?",
      answer: "Your data is processed securely with enterprise-grade encryption. We prioritize your competitive intelligence and privacy."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-foreground overflow-x-hidden">
      {/* Navigation */}
      <motion.nav 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full border border-border/30 bg-[#0a0a0f]/80 backdrop-blur-xl"
      >
        <div className="flex items-center gap-8">
          <img src={lynxLogoDark} alt="Lynx Media" className="h-6" />
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">NEWSLETTERS</a>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => navigate("/auth")}
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
            >
              LOGIN
            </Button>
            <Button 
              onClick={() => navigate("/auth")}
              className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-5"
            >
              JOIN WAITLIST
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20">
        {/* Gradient orbs - Brand green */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-to-b from-primary/25 via-primary/10 to-transparent rounded-full blur-[120px] pointer-events-none" 
        />
        <div className="absolute bottom-0 left-[-10%] w-[400px] h-[400px] bg-primary/15 rounded-full blur-[150px] pointer-events-none" />
        
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-primary text-sm font-medium tracking-[0.2em] uppercase mb-6"
          >
            AMAZON PPC ANALYTICS PLATFORM
          </motion.p>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
          >
            <span className="text-foreground/80">Turn Amazon Ad Data Into</span>
            <br />
            <span className="bg-gradient-to-r from-primary via-brand-400 to-primary bg-clip-text text-transparent">
              Profitable Insights
            </span>
            <br />
            <span className="text-foreground">in <span className="font-black">Minutes, Not Hours</span></span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10"
          >
            Upload your bulk files. Get cross-campaign analytics, TACOS insights, and optimization recommendations—no API setup required.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button 
              onClick={() => navigate("/auth")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-6 text-base group transition-all"
            >
              Start Free Analysis
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              onClick={() => navigate("/dashboard")}
              variant="outline"
              className="border-border/50 text-muted-foreground hover:text-foreground hover:border-foreground/50 rounded-full px-8 py-6 text-base group transition-all"
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
          className="relative mt-12 w-full max-w-6xl mx-auto"
        >
          <div className="relative flex items-end justify-center gap-8">
            {/* Laptop Mockup */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="relative w-full max-w-3xl"
            >
              <div className="relative bg-gradient-to-b from-[#1a1a24] to-[#0d0d12] rounded-t-xl p-2 border border-border/30">
                <div className="rounded-lg overflow-hidden bg-[#13131a] aspect-[16/10]">
                  <img 
                    src={dashboardLaptopMockup} 
                    alt="Lynx Media Dashboard" 
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              </div>
              <div className="h-4 bg-gradient-to-b from-[#1a1a24] to-[#2a2a34] rounded-b-lg mx-4" />
              <div className="h-1 bg-[#2a2a34] rounded-full mx-8" />
            </motion.div>

            {/* Phone Mockup */}
            <motion.div 
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
              whileHover={{ scale: 1.05 }}
              className="absolute right-4 bottom-4 md:right-0 md:bottom-0 md:relative w-24 md:w-40 lg:w-48"
            >
              <div className="relative bg-gradient-to-b from-[#1a1a24] to-[#0d0d12] rounded-3xl p-1.5 border border-border/30">
                <div className="rounded-2xl overflow-hidden bg-[#13131a] aspect-[9/19]">
                  <img 
                    src={dashboardMobileMockup} 
                    alt="Lynx Media Mobile Dashboard" 
                    className="w-full h-full object-cover object-top"
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
          className="mt-16 flex flex-wrap justify-center gap-6 md:gap-10 max-w-4xl mx-auto"
        >
          {personas.map((persona, i) => (
            <motion.div 
              key={i} 
              variants={fadeInUp}
              whileHover={{ scale: 1.1, y: -5 }}
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#1a1a28] to-[#0f0f15] border border-border/30 flex items-center justify-center group-hover:border-primary/30 transition-colors">
                <persona.icon className="w-6 h-6 text-primary/60 group-hover:text-primary transition-colors" />
              </div>
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{persona.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Value Proposition */}
      <section className="py-32 px-6">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.p 
            variants={fadeIn}
            className="text-primary text-sm font-medium tracking-[0.2em] uppercase mb-6"
          >
            WHY LYNX MEDIA
          </motion.p>
          <motion.h2 
            variants={fadeInUp}
            className="text-3xl md:text-4xl lg:text-5xl font-medium leading-relaxed text-muted-foreground/80"
          >
            Stop drowning in spreadsheets. Get <span className="text-primary">unified analytics</span> across SP, SB & SD campaigns with <span className="text-primary">TACOS visibility</span> and <span className="text-primary">actionable diagnostics</span> that actually move the needle.
          </motion.h2>
        </motion.div>
      </section>

      {/* Three Pillars */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid md:grid-cols-3 gap-6"
          >
            {pillars.map((pillar, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="p-8 rounded-2xl bg-gradient-to-b from-[#13131a] to-[#0d0d12] border border-border/30 hover:border-primary/20 transition-colors"
              >
                {pillar.image ? (
                  <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-[#1a1a28] to-[#0f0f15] flex items-center justify-center mb-6">
                    <Monitor className="w-16 h-16 text-primary/40" />
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {pillar.features?.map((feature, i) => (
                      <span 
                        key={i}
                        className="px-3 py-1.5 rounded-full text-xs bg-[#1a1a28] border border-border/30 text-muted-foreground"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                )}
                
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4">
                  {pillar.tag}
                </span>
                
                <h3 className="text-xl font-bold text-foreground mb-3">{pillar.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{pillar.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="py-24 px-6">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.h2 
            variants={fadeInUp}
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6"
          >
            Everything you need to optimize
            <br />
            your Amazon PPC in one
            <br />
            powerful platform
          </motion.h2>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-12 flex flex-wrap justify-center gap-4"
          >
            {tools.map((tool, i) => (
              <motion.div 
                key={i}
                variants={scaleIn}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-colors cursor-pointer ${
                  tool.active 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-[#13131a] border border-border/30 hover:border-primary/30'
                }`}
              >
                <tool.icon className={`w-6 h-6 ${tool.active ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                <span className={`text-xs font-medium ${tool.active ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                  {tool.label}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Community Card */}
      <section className="py-24 px-6">
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
            className="rounded-3xl bg-gradient-to-br from-primary/15 via-card to-background border border-primary/20 p-10 md:p-14 relative overflow-hidden"
          >
            <motion.div 
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, type: "spring" }}
              className="absolute top-6 left-6 w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center"
            >
              <BarChart3 className="w-6 h-6 text-primary" />
            </motion.div>
            
            <motion.div 
              variants={slideInLeft}
              className="max-w-lg"
            >
              <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Data Processed
                <br />
                Locally & Securely
              </h3>
              <p className="text-lg text-muted-foreground font-medium mb-6">
                Your Competitive Intelligence Stays Private.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your bulk files are processed entirely in your browser. No data is uploaded to external servers. Get the insights you need while keeping your advertising strategy confidential.
              </p>
            </motion.div>

            <div className="absolute top-10 right-10 text-muted-foreground/30 text-sm hidden md:block">
              Enterprise-Grade Privacy
            </div>

            <div className="absolute bottom-8 right-8 flex gap-2">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 rounded-full border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 rounded-full border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-3xl mx-auto text-center"
        >
          <motion.p 
            variants={fadeIn}
            className="text-primary text-sm font-medium tracking-[0.2em] uppercase mb-4"
          >
            GET STARTED
          </motion.p>
          <motion.h2 
            variants={fadeInUp}
            className="text-4xl md:text-5xl font-bold text-foreground mb-8"
          >
            Ready to Optimize Your Amazon PPC?
          </motion.h2>
          <motion.div variants={scaleIn} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate("/auth")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-6 text-base font-bold"
            >
              Start Free Analysis
            </Button>
            <Button 
              onClick={() => navigate("/dashboard")}
              variant="outline"
              className="border-border/50 text-muted-foreground hover:text-foreground hover:border-foreground/50 rounded-full px-8 py-6 text-base"
            >
              Try Demo Data
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.h2 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-3xl md:text-4xl font-bold text-foreground text-center mb-16"
          >
            Frequently Asked Questions
          </motion.h2>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-3"
          >
            {faqs.map((faq, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full text-left p-6 rounded-2xl bg-[#13131a] border border-border/30 hover:border-primary/20 transition-all"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-base font-medium text-foreground">{faq.question}</h3>
                    <motion.div
                      animate={{ rotate: openFaq === index ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {openFaq === index ? (
                        <Minus className="w-5 h-5 text-primary flex-shrink-0" />
                      ) : (
                        <Plus className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      )}
                    </motion.div>
                  </div>
                  <AnimatePresence>
                    {openFaq === index && (
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-muted-foreground mt-4 text-sm leading-relaxed overflow-hidden"
                      >
                        {faq.answer}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="py-12 px-6 border-t border-border/20"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs text-muted-foreground">
            © Lynx Media {new Date().getFullYear()}. All rights reserved.
          </p>
          <img src={lynxLogoDark} alt="Lynx Media" className="h-5 opacity-60" />
          <div className="flex gap-6 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Acceptable use</a>
            <a href="#" className="hover:text-foreground transition-colors">Accessibility</a>
          </div>
        </div>
      </motion.footer>
    </div>
  );
};

export default LandingPage;
