import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import {
  ArrowRight, Check, X, Zap, Shield, Clock, TrendingUp,
  Phone, Mail, BarChart3, Target, Search, DollarSign,
  LineChart, PieChart, Layers, Brain, Upload, FileSpreadsheet,
  Users, AlertTriangle, Sparkles, ChevronDown,
  Monitor, Gauge, Eye, Filter, CalendarClock, GitBranch,
  Lock, Globe
} from "lucide-react";
import lynxLogo from "@/assets/lynx_media_logo_HQ_final.png";
import ScrollTextReveal from "@/components/landing/ScrollTextReveal";
import ZoomTunnel from "@/components/landing/ZoomTunnel";
import FeatureShowcaseSection from "@/components/landing/FeatureShowcaseSection";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, Variants, useScroll, useTransform, useSpring, useMotionValueEvent } from "framer-motion";

/* ═══════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════ */
const fadeInBlur: Variants = {
  hidden: { opacity: 0, y: 40, filter: "blur(10px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
};

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
};

const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } }
};

const heroLineStagger: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.18, delayChildren: 0.3 } }
};

const heroLineReveal: Variants = {
  hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -60, filter: "blur(6px)" },
  visible: { opacity: 1, x: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
};

const slideInRight: Variants = {
  hidden: { opacity: 0, x: 60, filter: "blur(6px)" },
  visible: { opacity: 1, x: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
};

const springHover = { type: "spring" as const, stiffness: 300, damping: 20 };

/* ═══════════════════════════════════════════════════════
   HOOKS & SUB-COMPONENTS
   ═══════════════════════════════════════════════════════ */
const useCountUp = (end: number, duration = 2000) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting && !started) setStarted(true); }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);
  useEffect(() => {
    if (!started) return;
    let start: number;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setCount(Math.floor((1 - Math.pow(1 - p, 3)) * end));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, end, duration]);
  return { count, ref };
};

const ResultCard = ({ metric, suffix, description, icon: Icon }: { metric: number; suffix: string; description: string; icon: React.ElementType }) => {
  const { count, ref } = useCountUp(metric, 1800);
  return (
    <motion.div ref={ref} variants={fadeInBlur}
      whileHover={{ scale: 1.04, y: -6, boxShadow: "0 0 50px -10px hsl(78 100% 50% / 0.2)", transition: springHover }}
      className="glass-card rounded-2xl p-8 text-center">
      <Icon className="w-8 h-8 text-primary mx-auto mb-4" />
      <p className="text-5xl font-black text-foreground mb-1">{count}<span className="text-2xl text-primary">{suffix}</span></p>
      <p className="text-muted-foreground text-sm">{description}</p>
    </motion.div>
  );
};

const FAQItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.5 }}
      className="glass-card rounded-xl overflow-hidden"
    >
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/20 transition-colors">
        <span className="font-semibold text-foreground pr-4">{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 25 }} className="flex-shrink-0">
          <ChevronDown className={`w-5 h-5 ${open ? "text-primary" : "text-muted-foreground"}`} />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}>
            <p className="px-5 pb-5 text-muted-foreground text-sm leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════
   STACKING CARD COMPONENT (AttendFlow-style sticky cards)
   ═══════════════════════════════════════════════════════ */
const StackingCard = ({ index, total, icon: Icon, step, title, desc, features }: {
  index: number; total: number; icon: React.ElementType; step: string; title: string; desc: string; features?: string[];
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const topOffset = 120 + index * 20;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="sticky mb-8"
      style={{ top: `${topOffset}px`, zIndex: total - index }}
    >
      <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-10 border border-border/30 hover:border-primary/30 transition-all duration-500 shadow-2xl shadow-black/20">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">
          <div className="flex-1">
            <span className="text-primary text-xs font-bold tracking-[0.2em] uppercase mb-3 block">
              {step}
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-foreground mb-3">{title}</h3>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-4">{desc}</p>
            {features && (
              <ul className="space-y-2">
                {features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="w-full lg:w-80 h-48 sm:h-56 rounded-xl bg-gradient-to-br from-primary/10 via-card to-card border border-border/20 flex items-center justify-center">
            <Icon className="w-16 h-16 text-primary/30" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════
   STICKY FEATURE SECTION (left text + right visual)
   ═══════════════════════════════════════════════════════ */
const StickyFeatureSection = ({ tag, title, desc, icon: Icon, children, reversed }: {
  tag: string; title: string; desc: string; icon: React.ElementType; reversed?: boolean; children?: React.ReactNode;
}) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.25 }}
    className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center py-16 sm:py-24"
  >
    <motion.div variants={reversed ? slideInRight : slideInLeft} className={reversed ? "lg:order-2" : ""}>
      <span className="text-primary text-xs font-bold tracking-[0.2em] uppercase mb-3 block">{tag}</span>
      <h3 className="text-2xl sm:text-4xl font-black text-foreground mb-4 leading-tight">{title}</h3>
      <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-6">{desc}</p>
      <Button onClick={() => {}} variant="outline" className="rounded-full group">
        Learn More <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Button>
    </motion.div>
    <motion.div variants={reversed ? slideInLeft : slideInRight} className={reversed ? "lg:order-1" : ""}>
      {children || (
        <div className="glass-card rounded-2xl p-8 h-64 sm:h-80 flex items-center justify-center border border-border/20">
          <Icon className="w-20 h-20 text-primary/20" />
        </div>
      )}
    </motion.div>
  </motion.div>
);

/* ═══════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════════════════ */
const LandingPage = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  const { scrollY, scrollYProgress } = useScroll();
  const heroY = useTransform(scrollY, [0, 800], [0, 200]);
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 500], [1, 0.95]);
  const navScale = useTransform(scrollY, [0, 120], [1, 0.97]);
  const progressScale = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  useMotionValueEvent(scrollY, "change", (v) => setIsScrolled(v > 30));

  // ── CONTENT DATA ──
  const problems = [
    "Spending 4+ hours every week pulling and formatting Amazon ad reports",
    "ACOS looks great but you're actually losing money after total ad spend",
    "No idea which campaigns cannibalize each other across SP, SB & SD",
    "Wasting budget on search terms that will never convert",
    "Can't see true profitability because TACOS is invisible in Seller Central",
    "Hourly performance data buried — no dayparting insights whatsoever",
  ];

  const painPills = [
    { icon: DollarSign, label: "Lost ad spend?" },
    { icon: Eye, label: "TACOS invisible?" },
    { icon: CalendarClock, label: "No dayparting?" },
    { icon: GitBranch, label: "Keyword cannibalization?" },
    { icon: FileSpreadsheet, label: "Manual reporting?" },
    { icon: AlertTriangle, label: "Wasted budget?" },
    { icon: Brain, label: "No AI insights?" },
    { icon: Layers, label: "Spreadsheet chaos?" },
    { icon: Target, label: "ACOS misleading?" },
    { icon: PieChart, label: "No profit view?" },
    { icon: Search, label: "Buried data?" },
    { icon: Gauge, label: "Zero automation?" },
  ];

  const stackingFeatures = [
    {
      step: "01 / 04", icon: Upload, title: "Upload in 30 Seconds",
      desc: "Drag & drop your Seller Central bulk files. Everything processes in your browser — zero data leaves your machine. No API keys, no developer, no setup.",
      features: ["Bulk campaign files", "Business reports", "Hourly performance data", "Inventory reports"],
    },
    {
      step: "02 / 04", icon: Gauge, title: "See the Full Picture Instantly",
      desc: "13 purpose-built dashboards light up with TACOS, true profitability, wasted spend detection, and cross-campaign analytics you can't get from Seller Central.",
      features: ["Executive TACOS overview", "Profit dashboard with COGS", "Search term isolation", "Dayparting heatmaps"],
    },
    {
      step: "03 / 04", icon: Brain, title: "AI-Powered Recommendations",
      desc: "Our AI analyst reviews your data and suggests optimizations in plain English — bid adjustments, budget reallocation, keyword opportunities — all automated.",
      features: ["Contextual bid suggestions", "Budget reallocation", "Keyword opportunities", "Wasted spend alerts"],
    },
    {
      step: "04 / 04", icon: TrendingUp, title: "Optimize & Scale Profitably",
      desc: "Use diagnostics to fix issues, forecasting to plan ahead, and cannibalization detection to stop campaigns fighting each other. Scale with confidence.",
      features: ["Automated diagnostics", "AI forecasting", "Cannibalization detection", "Export & share reports"],
    },
  ];

  const dashboards = [
    { icon: Gauge, name: "Executive Dashboard", desc: "Bird's-eye view with TACOS, total spend, revenue & profit" },
    { icon: DollarSign, name: "Profit Dashboard", desc: "True profitability after COGS with margin tracking" },
    { icon: PieChart, name: "Portfolio Dashboard", desc: "Portfolio-level performance with budget allocation insights" },
    { icon: Target, name: "SP Dashboard", desc: "Sponsored Products targeting, placement & bid analysis" },
    { icon: Monitor, name: "SB Dashboard", desc: "Sponsored Brands headline search and video metrics" },
    { icon: Eye, name: "SD Dashboard", desc: "Sponsored Display audience and retargeting analytics" },
    { icon: Search, name: "Search Term Analytics", desc: "Find winners, kill losers, discover opportunities" },
    { icon: Filter, name: "Search Term Isolation", desc: "Isolate high-converting terms for exact match" },
    { icon: BarChart3, name: "ASIN Audit", desc: "Per-ASIN ad dependency and organic vs paid split" },
    { icon: CalendarClock, name: "Dayparting", desc: "Hour-by-hour performance heatmaps" },
    { icon: LineChart, name: "Forecasting", desc: "AI-powered spend and revenue projections" },
    { icon: GitBranch, name: "Cannibalization", desc: "Detect campaigns competing for same keywords" },
    { icon: AlertTriangle, name: "Diagnostics", desc: "Automated health checks and wasted spend flags" },
  ];

  const objections = [
    { icon: Shield, q: "Is my data safe?", a: "100%. Files are processed entirely in your browser using client-side JavaScript. Nothing uploads to any server." },
    { icon: Zap, q: "Do I need API access?", a: "Nope. Just the bulk files you already download from Seller Central. No integrations, no developer." },
    { icon: Users, q: "Works for agencies?", a: "Built for agencies. Analyze any client's data in seconds, switch workspaces, invite team members." },
    { icon: Clock, q: "How long does setup take?", a: "Zero setup. Upload your first file and see results in under 60 seconds." },
    { icon: Brain, q: "What about AI insights?", a: "Our AI analyst provides contextual recommendations — bid adjustments, budget reallocation, keyword opportunities." },
    { icon: Layers, q: "What file types?", a: "Bulk campaigns, Business Reports, Previous Period, Inventory, and Hourly Performance data." },
  ];

  const faqs = [
    { q: "What dashboards are included?", a: "All 13 dashboards: Executive (TACOS overview), Profit (true profitability with COGS), Portfolio, Sponsored Products, Sponsored Brands, Sponsored Display, Search Term Analytics, Search Term Isolation, ASIN Audit, Dayparting, Forecasting, Cannibalization Detection, and Diagnostics." },
    { q: "What file types can I upload?", a: "Five file types from Seller Central: Bulk Campaign Files (required), Business Reports, Previous Period files, Inventory Reports, and Hourly Performance data." },
    { q: "How does the AI Analyst work?", a: "The AI Analyst reviews your uploaded data and provides contextual recommendations in plain English — bid adjustments, budget reallocation suggestions, keyword opportunities, and wasted spend alerts." },
    { q: "How does the Profit Dashboard calculate true profitability?", a: "Upload your Business Report alongside the bulk file. The Profit Dashboard factors in your product costs (COGS), ad spend across all campaign types, and total revenue to show true margin." },
    { q: "Can I save my analysis?", a: "Yes. Workspace Save & Load lets you export your entire analysis as a single file. Reload it anytime to pick up exactly where you left off." },
    { q: "How does Cannibalization Detection work?", a: "The tool cross-references your SP, SB, and SD campaigns to identify keywords and ASINs where multiple campaigns compete against each other." },
  ];

  const tiers = [
    { name: "Free", price: "0", period: "", features: ["All 13 dashboards", "Bulk file upload", "TACOS & profit analytics", "Browser-based processing", "Demo data included"], cta: "Start Free", highlight: false },
    { name: "Pro", price: "Coming Soon", period: "", features: ["Everything in Free", "AI-powered recommendations", "Workspace save & load", "Export to Excel/PDF", "Priority support"], cta: "Join Waitlist", highlight: true },
    { name: "Agency", price: "Coming Soon", period: "", features: ["Everything in Pro", "Team management", "Multi-client workspaces", "White-label exports", "Dedicated onboarding"], cta: "Contact Us", highlight: false },
  ];

  const marketplaces = [
    "🇺🇸 US", "🇬🇧 UK", "🇩🇪 DE", "🇨🇦 CA", "🇯🇵 JP", "🇮🇳 IN", "🇫🇷 FR", "🇮🇹 IT", "🇪🇸 ES", "🇦🇺 AU", "🇲🇽 MX", "🇧🇷 BR", "🇸🇦 SA", "🇦🇪 AE", "🇸🇬 SG"
  ];

  const bentoFeatures = [
    { icon: TrendingUp, title: "True TACOS Tracking", desc: "See real total ad cost of sales across SP, SB & SD combined.", span: "lg:col-span-2" },
    { icon: Brain, title: "AI-Powered Analyst", desc: "Get contextual bid, budget & keyword recommendations in plain English.", span: "lg:col-span-1" },
    { icon: Lock, title: "100% Private", desc: "All processing happens in your browser. Zero data uploaded.", span: "lg:col-span-1" },
    { icon: CalendarClock, title: "Dayparting Heatmaps", desc: "Hour-by-hour performance visualization to optimize bid schedules.", span: "lg:col-span-1" },
    { icon: AlertTriangle, title: "Auto Diagnostics", desc: "Automated health checks flag wasted spend, low CTR & bidding anomalies.", span: "lg:col-span-1" },
    { icon: LineChart, title: "AI Forecasting", desc: "Predict future spend & revenue based on your historical data.", span: "lg:col-span-1" },
  ];

  /* ═══════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════ */
  return (
    <>
      <Helmet>
        <title>Lynx Media | Stop Losing Money on Amazon Ads — See TRUE Profitability in 60 Seconds</title>
        <meta name="description" content="Upload your Amazon bulk files. Get TACOS, cross-campaign analytics, AI insights & wasted spend analysis across 13 dashboards. Free to start." />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground dark">
        {/* ─── Site Frame ─── */}
        <motion.div className="site-frame" aria-hidden="true"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.5 }} />

        {/* ─── Scroll Progress Bar ─── */}
        <motion.div aria-hidden="true"
          className="fixed top-0 left-0 right-0 h-[2px] z-[60] origin-left bg-gradient-to-r from-primary via-brand-400 to-primary"
          style={{ scaleX: progressScale }} />

        {/* ─── Floating Nav ─── */}
        <motion.nav
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          style={{ scale: navScale }}
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 sm:px-6 py-3 rounded-full backdrop-blur-2xl transition-all duration-500 ${isScrolled ? "border border-primary/25 bg-background/90 shadow-[0_10px_40px_-12px_hsl(var(--primary)/0.45)]" : "border border-border/20 bg-background/70"}`}
        >
          <div className="flex items-center gap-4 sm:gap-8">
            <img src={lynxLogo} alt="Lynx Media" className="h-5 sm:h-6" />
            <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
              <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
              <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button onClick={() => navigate("/auth")} variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs sm:text-sm">Login</Button>
              <Button onClick={() => navigate("/auth")} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-4 sm:px-5 text-xs sm:text-sm">Get Started Free</Button>
            </div>
          </div>
        </motion.nav>

        {/* ═══════════════════════════════════════════════════════
           HERO SECTION
           ═══════════════════════════════════════════════════════ */}
        <motion.section
          className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 pt-24 pb-0 overflow-hidden"
          style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
        >
          {/* Background orbs */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] md:w-[900px] h-[500px] md:h-[700px] bg-gradient-to-b from-primary/15 via-primary/5 to-transparent rounded-full blur-[150px] pointer-events-none" aria-hidden="true" />
          <div className="absolute bottom-0 left-[-10%] w-[350px] h-[350px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" aria-hidden="true" />

          <div className="relative z-10 max-w-5xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 shimmer-badge"
            >
              <Zap className="w-4 h-4" />
              Free Amazon PPC Analytics — No API Required
            </motion.div>

            {/* Staggered Headline */}
            <motion.h1 variants={heroLineStagger} initial="hidden" animate="visible"
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] mb-8 tracking-tight">
              <motion.span variants={heroLineReveal} className="block text-foreground/80">
                Your Amazon Ads Are
              </motion.span>
              <motion.span variants={heroLineReveal}
                className="block bg-gradient-to-r from-primary via-primary to-brand-400 bg-clip-text text-transparent">
                Leaking Money.
              </motion.span>
              <motion.span variants={heroLineReveal} className="block text-foreground">
                We'll Show You Where.
              </motion.span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto"
            >
              Upload your bulk files. Get <span className="text-foreground font-bold">13 analytics dashboards</span> with TACOS, AI insights & wasted spend detection in{" "}
              <span className="text-primary font-bold">60 seconds</span>.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25, delay: 1.0 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-6"
            >
              <Button onClick={() => navigate("/auth")} size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 font-bold rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-[1.02] btn-glow">
                Analyze My Ads Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button onClick={() => navigate("/dashboard")} variant="outline" size="lg"
                className="text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 rounded-full border-border/50 hover:bg-muted/50">
                Try Demo Data
                <Sparkles className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>

            {/* Trust line */}
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 1.2 }}
              className="text-muted-foreground text-xs sm:text-sm">
              ✓ Free forever &nbsp;&nbsp; ✓ No credit card &nbsp;&nbsp; ✓ Results in 60 seconds &nbsp;&nbsp; ✓ 100% browser-based
            </motion.p>
          </div>

          {/* Demo Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.92, filter: "blur(16px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 1, delay: 1.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-12 sm:mt-16 w-full max-w-5xl mx-auto px-4"
          >
            <div className="glass-card rounded-2xl sm:rounded-3xl p-2 sm:p-3">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border/20">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="h-5 rounded-full bg-muted/30 max-w-xs mx-auto" />
                </div>
              </div>
              <div className="rounded-xl overflow-hidden bg-card aspect-[16/9] flex items-center justify-center">
                <div className="text-center">
                  <Monitor className="w-16 h-16 text-primary/30 mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm">Executive Dashboard Preview</p>
                  <p className="text-muted-foreground/50 text-xs mt-1">13 dashboards • TACOS • AI Insights</p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-primary/10 blur-[60px] rounded-full" aria-hidden="true" />
          </motion.div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════════
           SCROLL TEXT REVEAL
           ═══════════════════════════════════════════════════════ */}
        <ScrollTextReveal
          paragraphs={[
            "Amazon PPC got too complicated. ✦ Too many campaigns. Too many spreadsheets. ✦ Too many disconnected metrics. ✦ What should feel simple — optimizing bids, tracking ACOS, finding wasted spend — ended up scattered everywhere.",
            "So we stripped it back. ✦ And organized everything around one thing: Your profitability. ✦"
          ]}
        />

        {/* ═══════════════════════════════════════════════════════
           MARKETPLACE CAROUSEL
           ═══════════════════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={fadeInBlur}>
            <p className="text-center text-muted-foreground text-sm mb-8">
              <Globe className="w-4 h-4 inline-block mr-2 text-primary" />
              Works with all Amazon marketplaces
            </p>
            <div className="marquee max-w-4xl mx-auto">
              <div className="marquee-track">
                {[...marketplaces, ...marketplaces].map((mp, i) => (
                  <span key={i} className="text-lg sm:text-xl text-muted-foreground/60 whitespace-nowrap font-medium select-none">{mp}</span>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        {/* ═══════════════════════════════════════════════════════
           PAIN POINT MARQUEE (Scrolling pills)
           ═══════════════════════════════════════════════════════ */}
        <section className="py-20 sm:py-28 px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="max-w-5xl mx-auto"
          >
            {/* Badge */}
            <motion.div variants={fadeInUp} className="flex justify-center mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/60 border border-border text-sm font-medium text-foreground">
                <AlertTriangle className="w-4 h-4" />
                Stuff That Shouldn't Happen in 2026
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h2 variants={fadeInUp} className="text-center text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              Amazon Ads shouldn't be{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">this hard</span>.
            </motion.h2>

            {/* Subtitle */}
            <motion.p variants={fadeInUp} className="text-center text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto mb-12">
              Your campaigns deserve better than scattered spreadsheets, hidden TACOS, and manual chaos.
            </motion.p>

            {/* Pain pill grid */}
            <motion.div
              variants={stagger}
              className="flex flex-wrap justify-center gap-3 sm:gap-4 max-w-4xl mx-auto"
            >
              {painPills.map((pill, i) => {
                const Icon = pill.icon;
                return (
                  <motion.span
                    key={i}
                    variants={fadeInUp}
                    whileHover={{ scale: 1.05, transition: { type: "spring", stiffness: 400, damping: 15 } }}
                    className="inline-flex items-center gap-2.5 px-5 py-3 rounded-full bg-card border border-border/60 text-sm sm:text-base font-medium text-foreground shadow-sm cursor-default select-none hover:border-primary/30 hover:shadow-md transition-colors"
                  >
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10">
                      <Icon className="w-3.5 h-3.5 text-primary" />
                    </span>
                    {pill.label}
                  </motion.span>
                );
              })}
            </motion.div>
          </motion.div>
        </section>

        {/* ═══════════════════════════════════════════════════════
           ZOOM TUNNEL
           ═══════════════════════════════════════════════════════ */}
        <ZoomTunnel />

        <main className="relative max-w-6xl mx-auto px-4 sm:px-6">

          {/* ═══════════════════════════════════════════════════════
             RESULTS COUNTER STRIP
             ═══════════════════════════════════════════════════════ */}
          <motion.section variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
            className="mb-24 sm:mb-32 grid sm:grid-cols-3 gap-4 sm:gap-6">
            <ResultCard metric={4} suffix="+ hrs" description="saved per week on PPC reporting" icon={Clock} />
            <ResultCard metric={23} suffix="%" description="average reduction in wasted ad spend" icon={TrendingUp} />
            <ResultCard metric={13} suffix=" dashboards" description="from a single bulk file upload" icon={BarChart3} />
          </motion.section>

          {/* ═══════════════════════════════════════════════════════
             FEATURE BENTO GRID
             ═══════════════════════════════════════════════════════ */}
          <section id="features" className="mb-24 sm:mb-32">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeInBlur} className="text-center mb-12 sm:mb-16">
              <p className="text-primary text-xs font-medium tracking-[0.2em] uppercase mb-3">Why Sellers Choose Lynx</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black">
                Everything You Need.<br /><span className="text-primary">Nothing You Don't.</span>
              </h2>
            </motion.div>

            <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {bentoFeatures.map((feature, i) => (
                <motion.div key={i} variants={fadeInBlur}
                  whileHover={{ scale: 1.03, y: -8, boxShadow: "0 0 50px -8px hsl(78 100% 50% / 0.2)", transition: springHover }}
                  className={`glass-card rounded-2xl p-6 sm:p-8 group cursor-default ${feature.span}`}>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </section>

          {/* ═══════════════════════════════════════════════════════
             PROBLEM AGITATION
             ═══════════════════════════════════════════════════════ */}
          <section className="mb-24 sm:mb-32">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeInBlur} className="text-center mb-12">
              <p className="text-primary text-xs font-medium tracking-[0.2em] uppercase mb-3">The Problem</p>
              <h2 className="text-3xl sm:text-4xl font-black mb-4">
                Amazon Gives You Data. Not <span className="text-primary">Answers.</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">If any of these sound familiar, you're leaving money on the table.</p>
            </motion.div>
            <div className="space-y-3 max-w-2xl mx-auto">
              {problems.map((problem, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -40, filter: "blur(6px)" }}
                  whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  whileHover={{ x: 6, transition: springHover }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-destructive/5 border border-destructive/10">
                  <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <X className="w-4 h-4 text-destructive" />
                  </div>
                  <p className="text-foreground text-sm sm:text-base">{problem}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════
             STACKING CARDS — HOW IT WORKS (AttendFlow-style)
             ═══════════════════════════════════════════════════════ */}
          <section id="how-it-works" className="mb-24 sm:mb-32">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeInBlur} className="text-center mb-12 sm:mb-16">
              <p className="text-primary text-xs font-medium tracking-[0.2em] uppercase mb-3">How It Works</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black">
                From Upload to <span className="text-primary">Insight</span>
              </h2>
              <p className="text-muted-foreground text-lg mt-4 max-w-xl mx-auto">Four steps to profitable Amazon advertising. No API keys. No setup. No data leaves your browser.</p>
            </motion.div>

            <div className="relative">
              {stackingFeatures.map((feature, i) => (
                <StackingCard key={i} index={i} total={stackingFeatures.length} {...feature} />
              ))}
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════
             STICKY FEATURE SECTIONS
             ═══════════════════════════════════════════════════════ */}
          <div className="mb-24 sm:mb-32 divide-y divide-border/10">
            <StickyFeatureSection
              tag="ANALYTICS"
              title="See True Profitability, Not Just ACOS"
              desc="ACOS lies to you. Our Profit Dashboard factors in COGS, total ad spend across all campaign types, and revenue to show true margin — the number that actually matters."
              icon={DollarSign}
            />
            <StickyFeatureSection
              tag="DAYPARTING"
              title="Stop Burning Budget at 3 AM"
              desc="Hour-by-hour performance heatmaps reveal exactly when your ads convert and when they're just burning cash. Optimize bid schedules with data, not guesses."
              icon={CalendarClock}
              reversed
            />
            <StickyFeatureSection
              tag="INTELLIGENCE"
              title="AI That Actually Understands Your Data"
              desc="Our AI analyst doesn't just spit out generic tips. It reviews YOUR campaigns and gives contextual recommendations — bid adjustments, budget moves, keyword opportunities."
              icon={Brain}
            />
          </div>

          {/* ═══════════════════════════════════════════════════════
             DASHBOARD SHOWCASE
             ═══════════════════════════════════════════════════════ */}
          <section className="mb-24 sm:mb-32">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeInBlur} className="text-center mb-12">
              <p className="text-primary text-xs font-medium tracking-[0.2em] uppercase mb-3">The Solution</p>
              <h2 className="text-3xl sm:text-4xl font-black mb-4">
                One Upload. <span className="text-primary">13 Dashboards.</span> Total Clarity.
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Lynx turns your existing bulk files into a full analytics suite.
              </p>
            </motion.div>

            <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboards.map((d, i) => (
                <motion.div key={i} variants={fadeInBlur}
                  whileHover={{ scale: 1.04, y: -6, boxShadow: "0 0 40px -8px hsl(78 100% 50% / 0.15)", transition: springHover }}
                  className="glass-card p-5 rounded-xl group">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <d.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm mb-1">{d.name}</h3>
                      <p className="text-muted-foreground text-xs leading-relaxed">{d.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 text-center">
              <p className="text-muted-foreground text-sm mb-4">Plus: <span className="text-primary font-semibold">AI-Powered Analyst</span> that suggests optimizations in plain English.</p>
              <Button onClick={() => navigate("/dashboard")} variant="outline" className="rounded-full">
                See All Dashboards with Demo Data
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          </section>

          {/* ═══════════════════════════════════════════════════════
             PRICING
             ═══════════════════════════════════════════════════════ */}
          <section id="pricing" className="mb-24 sm:mb-32">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeInBlur} className="text-center mb-12">
              <p className="text-primary text-xs font-medium tracking-[0.2em] uppercase mb-3">Pricing</p>
              <h2 className="text-3xl sm:text-4xl font-black mb-4">
                Start Free. <span className="text-primary">Scale When Ready.</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">Get massive value for $0. Upgrade only when you need team features or AI.</p>
            </motion.div>
            <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
              className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {tiers.map((tier, i) => (
                <motion.div key={i} variants={fadeInBlur}
                  whileHover={{ scale: tier.highlight ? 1.05 : 1.03, y: -6, boxShadow: tier.highlight ? "0 0 60px -10px hsl(78 100% 50% / 0.25)" : undefined, transition: springHover }}
                  className={`p-6 sm:p-8 rounded-2xl border transition-all ${tier.highlight ? "border-primary glass-card shadow-lg shadow-primary/10 bg-gradient-to-b from-primary/10 to-card/60" : "border-border/30 glass-card"}`}>
                  <h3 className="text-lg font-bold mb-2">{tier.name}</h3>
                  <p className="text-3xl font-black text-foreground mb-1">
                    {tier.price === "0" ? "$0" : tier.price}
                    {tier.period && <span className="text-sm font-normal text-muted-foreground">{tier.period}</span>}
                  </p>
                  <ul className="space-y-2 mt-4 mb-6">
                    {tier.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button onClick={() => navigate("/auth")}
                    className={`w-full rounded-xl ${tier.highlight ? "bg-primary text-primary-foreground hover:bg-primary/90 btn-glow" : "bg-muted text-foreground hover:bg-muted/80"}`}>
                    {tier.cta}
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          </section>

          {/* ═══════════════════════════════════════════════════════
             OBJECTION HANDLING
             ═══════════════════════════════════════════════════════ */}
          <section className="mb-24 sm:mb-32">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeInBlur} className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black">"But what about..."</h2>
            </motion.div>
            <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {objections.map((obj, i) => (
                <motion.div key={i} variants={fadeInBlur}
                  whileHover={{ y: -6, boxShadow: "0 0 30px -8px hsl(78 100% 50% / 0.12)", transition: springHover }}
                  className="glass-card p-5 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <obj.icon className="w-5 h-5 text-primary" />
                    <p className="font-bold text-sm">{obj.q}</p>
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">{obj.a}</p>
                </motion.div>
              ))}
            </motion.div>
          </section>

          {/* ═══════════════════════════════════════════════════════
             FAQ
             ═══════════════════════════════════════════════════════ */}
          <section id="faq" className="mb-24 sm:mb-32">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeInBlur} className="text-center mb-12">
              <p className="text-primary text-xs font-medium tracking-[0.2em] uppercase mb-3">FAQ</p>
              <h2 className="text-3xl sm:text-4xl font-black">Everything you need to know</h2>
            </motion.div>
            <div className="max-w-2xl mx-auto space-y-3">
              {faqs.map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} />)}
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════
             FINAL CTA
             ═══════════════════════════════════════════════════════ */}
          <motion.section
            initial={{ opacity: 0, scale: 0.94, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mb-20 text-center p-10 sm:p-16 rounded-3xl bg-gradient-to-br from-primary/15 via-card to-card border border-primary/20 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.15),transparent_50%)]" aria-hidden="true" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,hsl(var(--primary)/0.08),transparent_60%)]" aria-hidden="true" />
            <div className="relative">
              <p className="text-primary text-xs font-medium tracking-[0.2em] uppercase mb-4">Stop Guessing. Start Profiting.</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4">
                Your Ads Are Leaking Money<br /><span className="text-primary">Right Now.</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-lg mx-auto">
                Upload your bulk file. See exactly where. Fix it today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => navigate("/auth")} size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-12 py-7 font-bold rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-[1.02] btn-glow">
                  Analyze My Ads Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button onClick={() => navigate("/dashboard")} variant="outline" size="lg"
                  className="text-lg px-8 py-7 rounded-full border-border/50 hover:bg-muted/50">
                  Try Demo Data
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-6">No credit card required • 13 dashboards • Results in 60 seconds</p>
            </div>
          </motion.section>
        </main>

        {/* ═══════════════════════════════════════════════════════
           FOOTER
           ═══════════════════════════════════════════════════════ */}
        <footer className="bg-[hsl(240,14%,8%)] pt-16 pb-6 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-12">
              <div className="lg:col-span-1">
                <img src={lynxLogo} alt="Lynx Media" className="h-10 mb-6" />
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  We'll take you from stuttering sales to #1 in your product category. All while maintaining your brand identity and integrity.
                </p>
                <div className="space-y-3 mb-6">
                  <a href="tel:+17372831902" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Phone className="w-4 h-4 text-primary" /> +1 (737) 283-1902
                  </a>
                  <a href="mailto:hello@lynxmedia.com" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Mail className="w-4 h-4 text-primary" /> hello@lynxmedia.com
                  </a>
                </div>
                <div className="flex gap-3">
                  {["facebook", "instagram", "youtube", "linkedin"].map((social) => (
                    <a key={social} href="#" className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        {social === "facebook" && <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>}
                        {social === "instagram" && <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>}
                        {social === "youtube" && <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>}
                        {social === "linkedin" && <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>}
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-5 tracking-wide">[ Resources ]</h4>
                <ul className="space-y-3">
                  {["Home", "Why Lynx Media", "Our Process", "Services", "Success Stories"].map((link) => (
                    <li key={link}><a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">{link}</a></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-5 tracking-wide">[ Resources ]</h4>
                <ul className="space-y-3">
                  {["About us", "Portfolio", "Blogs", "FAQ's", "Contact"].map((link) => (
                    <li key={link}><a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">{link}</a></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-5 tracking-wide">[ What We Do ]</h4>
                <ul className="space-y-3">
                  {["PPC Management", "Creatives Services", "Vendor Management", "Brand Management", "Listing Optimization", "Catalogue Management"].map((link) => (
                    <li key={link}><a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">{link}</a></li>
                  ))}
                </ul>
              </div>
              <div className="lg:text-right">
                <h3 className="text-3xl lg:text-4xl font-heading font-bold leading-tight">
                  Let's build<br />success story<br /><span className="text-primary">together</span>
                </h3>
              </div>
            </div>
            <div className="border-t border-border/20 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
              <p>&copy;{new Date().getFullYear()} lynx media. All Rights Reserved</p>
              <div className="flex items-center gap-2">
                <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
                <span className="text-primary">&bull;</span>
                <a href="#" className="hover:text-foreground transition-colors">Terms and Conditions</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LandingPage;
