import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import {
  ArrowRight, Check, X, Zap, Shield, Clock, TrendingUp,
  Phone, Mail, BarChart3, Target, Search, DollarSign,
  LineChart, PieChart, Layers, Brain, Upload, FileSpreadsheet,
  Users, AlertTriangle, Sparkles, ChevronDown, ChevronUp,
  Monitor, Gauge, Eye, Filter, CalendarClock, GitBranch
} from "lucide-react";
import lynxLogo from "@/assets/lynx_media_logo_HQ_final.png";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Animated counter hook
const useCountUp = (end: number, duration: number = 2000) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !isVisible) setIsVisible(true);
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [isVisible]);
  useEffect(() => {
    if (!isVisible) return;
    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isVisible, end, duration]);
  return { count, ref };
};

// Result card
const ResultCard = ({ metric, suffix, description, icon: Icon }: {
  metric: number; suffix: string; description: string; icon: React.ElementType;
}) => {
  const { count, ref } = useCountUp(metric, 1500);
  return (
    <div ref={ref} className="text-center p-8 rounded-2xl bg-gradient-to-b from-card to-card/50 border border-border/50 hover:border-primary/30 transition-colors">
      <Icon className="w-8 h-8 text-primary mx-auto mb-4" />
      <p className="text-5xl font-black text-foreground mb-1">
        {count}<span className="text-2xl text-primary">{suffix}</span>
      </p>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
};

// FAQ Item
const FAQItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border/50 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/30 transition-colors">
        <span className="font-semibold text-foreground pr-4">{q}</span>
        {open ? <ChevronUp className="w-5 h-5 text-primary flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="px-5 pb-5 text-muted-foreground text-sm leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();

  // === FUNNEL CONTENT ===

  const problems = [
    "Spending 4+ hours every week pulling and formatting Amazon ad reports",
    "ACOS looks great but you're actually losing money after total ad spend",
    "No idea which campaigns cannibalize each other across SP, SB & SD",
    "Wasting budget on search terms that will never convert",
    "Can't see true profitability because TACOS is invisible in Seller Central",
    "Hourly performance data buried — no dayparting insights whatsoever",
  ];

  const dashboards = [
    { icon: Gauge, name: "Executive Dashboard", desc: "Bird's-eye view with TACOS, total spend, revenue & profit across all campaign types" },
    { icon: DollarSign, name: "Profit Dashboard", desc: "True profitability after COGS with product-level cost analysis and margin tracking" },
    { icon: PieChart, name: "Portfolio Dashboard", desc: "Portfolio-level performance breakdown with budget allocation insights" },
    { icon: Target, name: "SP Dashboard", desc: "Sponsored Products deep dive — targeting, placement & bid analysis" },
    { icon: Monitor, name: "SB Dashboard", desc: "Sponsored Brands performance with headline search and video metrics" },
    { icon: Eye, name: "SD Dashboard", desc: "Sponsored Display audience and retargeting analytics" },
    { icon: Search, name: "Search Term Analytics", desc: "Find winning keywords, kill losers, and discover new opportunities" },
    { icon: Filter, name: "Search Term Isolation", desc: "Isolate high-converting search terms for exact match campaigns" },
    { icon: BarChart3, name: "ASIN Audit", desc: "Per-ASIN performance audit showing ad dependency and organic vs paid split" },
    { icon: CalendarClock, name: "Dayparting", desc: "Hour-by-hour performance heatmaps to optimize bid schedules" },
    { icon: LineChart, name: "Forecasting", desc: "AI-powered spend and revenue projections based on historical trends" },
    { icon: GitBranch, name: "Cannibalization", desc: "Detect campaigns competing against each other for the same keywords" },
    { icon: AlertTriangle, name: "Diagnostics", desc: "Automated health checks flagging wasted spend, low CTR & bidding issues" },
  ];

  const steps = [
    { step: "1", title: "Download Your Bulk Files", desc: "30 seconds from Seller Central — bulk sheets, business reports, inventory & hourly data", icon: FileSpreadsheet },
    { step: "2", title: "Upload to Lynx", desc: "Drag & drop up to 5 file types. Everything processes in your browser — zero data leaves your machine", icon: Upload },
    { step: "3", title: "Get Insights Instantly", desc: "13 dashboards light up with TACOS, wasted spend analysis, AI recommendations & more", icon: Sparkles },
  ];

  const objections = [
    { icon: Shield, q: "Is my data safe?", a: "100%. Files are processed entirely in your browser using client-side JavaScript. Nothing uploads to any server. Your data never leaves your machine." },
    { icon: Zap, q: "Do I need API access?", a: "Nope. Just the bulk files you already download from Seller Central. No integrations, no developer, no API keys." },
    { icon: Users, q: "Works for agencies?", a: "Built for agencies. Analyze any client's data in seconds, switch between workspaces, invite team members, and export branded reports." },
    { icon: Clock, q: "How long does setup take?", a: "Zero setup. Upload your first file and see results in under 60 seconds. No onboarding calls, no configuration." },
    { icon: Brain, q: "What about AI insights?", a: "Our AI analyst reviews your data and provides contextual recommendations — bid adjustments, budget reallocation, keyword opportunities — all automated." },
    { icon: Layers, q: "What file types?", a: "Bulk campaign files, Business Reports, Previous Period comparisons, Inventory Reports, and Hourly Performance data. All standard Seller Central exports." },
  ];

  const faqs = [
    { q: "What's TACOS and why does it matter?", a: "TACOS (Total Advertising Cost of Sales) measures your ad spend against TOTAL revenue — not just ad-attributed revenue like ACOS. It's the only metric that tells you if your ads are actually growing your business profitably. Amazon doesn't show this anywhere. Lynx calculates it automatically." },
    { q: "How is this different from Helium 10 / Pacvue / Perpetua?", a: "Those tools require API connections, monthly subscriptions, and complex setup. Lynx works with the bulk files you already have — no API, no subscription lock-in, no data sharing with third parties. Plus, your data stays in your browser." },
    { q: "Can I use this alongside my current PPC tool?", a: "Absolutely. Lynx complements any existing tool by giving you cross-campaign visibility and TACOS insights that most tools don't provide. Use it as your analytics layer on top of whatever management tool you prefer." },
    { q: "What if I manage multiple brands/accounts?", a: "Each workspace is independent. Upload different client data into separate sessions, save and load workspaces, and switch between them instantly." },
    { q: "Is there a limit to how much data I can analyze?", a: "No artificial limits. The processing happens in your browser, so it scales with your machine. We've tested with accounts running 10,000+ campaigns without issues." },
    { q: "Do you offer white-label or agency pricing?", a: "We're building agency-specific features including white-label exports and team management. Contact us for early access to agency plans." },
  ];

  const tiers = [
    { name: "Free", price: "0", period: "", features: ["All 13 dashboards", "Bulk file upload", "TACOS & profit analytics", "Browser-based processing", "Demo data included"], cta: "Start Free", highlight: false },
    { name: "Pro", price: "Coming Soon", period: "", features: ["Everything in Free", "AI-powered recommendations", "Workspace save & load", "Export to Excel/PDF", "Priority support"], cta: "Join Waitlist", highlight: true },
    { name: "Agency", price: "Coming Soon", period: "", features: ["Everything in Pro", "Team management", "Multi-client workspaces", "White-label exports", "Dedicated onboarding"], cta: "Contact Us", highlight: false },
  ];

  return (
    <>
      <Helmet>
        <title>Lynx Media | Stop Losing Money on Amazon Ads — See TRUE Profitability in 60 Seconds</title>
        <meta name="description" content="Upload your Amazon bulk files. Get TACOS, cross-campaign analytics, AI insights & wasted spend analysis across 13 dashboards. No API. No setup. Free to start." />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground dark">
        {/* Background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-primary/8 via-primary/3 to-transparent rounded-full blur-3xl" />
        </div>

        {/* Nav */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/10">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <img alt="Lynx Media" src="/lovable-uploads/800abbfd-bcd1-4375-8093-7d5199c45706.png" className="h-8 w-auto object-contain" />
            <div className="flex items-center gap-3">
              <Button onClick={() => navigate("/auth")} variant="ghost" className="text-muted-foreground hover:text-foreground hidden sm:inline-flex">Login</Button>
              <Button onClick={() => navigate("/auth")} className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-full px-6">
                Get Started Free
              </Button>
            </div>
          </div>
        </nav>

        <main className="relative max-w-5xl mx-auto px-6 pt-32 pb-20">

          {/* ===== SECTION 1: HERO — The Hook ===== */}
          <section className="mb-28 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8"
            >
              <Zap className="w-4 h-4" />
              Free Amazon PPC Analytics — No API Required
            </motion.div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-[1.05] mb-8 tracking-tight">
              <motion.span initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="block text-foreground/80">
                Your Amazon Ads Are
              </motion.span>
              <motion.span initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
                className="block bg-gradient-to-r from-primary via-primary to-brand-400 bg-clip-text text-transparent"
              >
                Leaking Money.
              </motion.span>
              <motion.span initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }} className="block text-foreground">
                We'll Show You Where.
              </motion.span>
            </h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.7 }}
              className="text-xl sm:text-2xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto"
            >
              Upload your bulk files. Get <span className="text-foreground font-bold">13 analytics dashboards</span> with TACOS, AI insights & wasted spend detection in{" "}
              <span className="text-primary font-bold">60 seconds</span>.
              <br />
              <span className="text-sm text-muted-foreground/70 mt-2 block">No API. No setup. No data leaves your browser.</span>
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button onClick={() => navigate("/auth")} size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-10 py-7 font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-[1.02]"
              >
                Analyze My Ads Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button onClick={() => navigate("/dashboard")} variant="outline" size="lg"
                className="text-lg px-10 py-7 rounded-xl border-border/50 hover:bg-muted"
              >
                Try Demo Data
                <Sparkles className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 1 }}
              className="text-muted-foreground text-sm mt-6"
            >
              ✓ Free forever tier &nbsp;&nbsp; ✓ No credit card &nbsp;&nbsp; ✓ Results in 60 seconds &nbsp;&nbsp; ✓ 100% browser-based
            </motion.p>
          </section>

          {/* ===== SECTION 2: RESULTS — Social Proof / Outcomes ===== */}
          <section className="mb-28">
            <div className="grid sm:grid-cols-3 gap-4">
              <ResultCard metric={4} suffix="+ hrs" description="saved per week on PPC reporting" icon={Clock} />
              <ResultCard metric={23} suffix="%" description="average reduction in wasted ad spend" icon={TrendingUp} />
              <ResultCard metric={13} suffix=" dashboards" description="from a single bulk file upload" icon={BarChart3} />
            </div>
          </section>

          {/* ===== SECTION 3: PROBLEM AGITATION ===== */}
          <section className="mb-28">
            <div className="text-center mb-12">
              <p className="text-primary text-xs font-medium tracking-[0.2em] uppercase mb-3">The Problem</p>
              <h2 className="text-3xl sm:text-4xl font-black mb-4">
                Amazon Gives You Data. Not <span className="text-primary">Answers.</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">If any of these sound familiar, you're leaving money on the table.</p>
            </div>
            <div className="space-y-3 max-w-2xl mx-auto">
              {problems.map((problem, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-destructive/5 border border-destructive/10"
                >
                  <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <X className="w-4 h-4 text-destructive" />
                  </div>
                  <p className="text-foreground text-sm sm:text-base">{problem}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ===== SECTION 4: SOLUTION — The Value Bomb ===== */}
          <section className="mb-28">
            <div className="text-center mb-12">
              <p className="text-primary text-xs font-medium tracking-[0.2em] uppercase mb-3">The Solution</p>
              <h2 className="text-3xl sm:text-4xl font-black mb-4">
                One Upload. <span className="text-primary">13 Dashboards.</span> Total Clarity.
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Lynx turns your existing bulk files into a full analytics suite that shows you exactly what's working, what's bleeding money, and what to fix next.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboards.map((d, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  className="p-5 rounded-xl bg-card border border-border/50 hover:border-primary/20 transition-all hover:shadow-lg hover:shadow-primary/5 group"
                >
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
            </div>

            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="mt-8 text-center"
            >
              <p className="text-muted-foreground text-sm mb-4">Plus: <span className="text-primary font-semibold">AI-Powered Analyst</span> that reviews your data and suggests optimizations in plain English.</p>
              <Button onClick={() => navigate("/dashboard")} variant="outline" className="rounded-full">
                See All Dashboards with Demo Data
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          </section>

          {/* ===== SECTION 5: HOW IT WORKS — 3 Steps ===== */}
          <section className="mb-28">
            <div className="text-center mb-12">
              <p className="text-primary text-xs font-medium tracking-[0.2em] uppercase mb-3">How It Works</p>
              <h2 className="text-3xl sm:text-4xl font-black">
                Dead Simple. <span className="text-primary">3 Steps.</span>
              </h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              {steps.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                  className="relative p-6 rounded-2xl bg-card border border-border/50 text-center"
                >
                  <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground font-black text-xl flex items-center justify-center mx-auto mb-4">
                    {item.step}
                  </div>
                  <item.icon className="w-6 h-6 text-primary/40 mx-auto mb-3" />
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                  {i < steps.length - 1 && <ArrowRight className="hidden sm:block absolute top-1/2 -right-5 w-4 h-4 text-muted-foreground/30" />}
                </motion.div>
              ))}
            </div>
          </section>

          {/* ===== SECTION 6: 5 UPLOAD TYPES ===== */}
          <section className="mb-28">
            <div className="text-center mb-10">
              <p className="text-primary text-xs font-medium tracking-[0.2em] uppercase mb-3">Data Inputs</p>
              <h2 className="text-3xl sm:text-4xl font-black mb-4">
                5 File Types. <span className="text-primary">Complete Picture.</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">Each file unlocks deeper analytics. Start with just the bulk file — add more for the full picture.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { name: "Bulk Campaign", desc: "Core ad data — campaigns, ad groups, keywords, bids", required: true },
                { name: "Business Report", desc: "Sales, sessions & conversion data for TACOS calculation", required: false },
                { name: "Previous Period", desc: "Compare performance trends week-over-week or month-over-month", required: false },
                { name: "Inventory Report", desc: "Stock levels & FBA data for inventory-aware bidding", required: false },
                { name: "Hourly Performance", desc: "Hour-by-hour data for dayparting optimization", required: false },
              ].map((file, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className="p-4 rounded-xl bg-card border border-border/50 text-center"
                >
                  <FileSpreadsheet className="w-6 h-6 text-primary mx-auto mb-2" />
                  <h4 className="font-bold text-sm mb-1">{file.name}</h4>
                  <p className="text-muted-foreground text-xs leading-relaxed">{file.desc}</p>
                  {file.required && <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Required</span>}
                </motion.div>
              ))}
            </div>
          </section>

          {/* ===== SECTION 7: ASCENSION — Pricing Tiers ===== */}
          <section className="mb-28">
            <div className="text-center mb-12">
              <p className="text-primary text-xs font-medium tracking-[0.2em] uppercase mb-3">Pricing</p>
              <h2 className="text-3xl sm:text-4xl font-black mb-4">
                Start Free. <span className="text-primary">Scale When Ready.</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">Get massive value for $0. Upgrade only when you need team features or AI recommendations.</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {tiers.map((tier, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className={`p-6 rounded-2xl border ${tier.highlight ? "border-primary bg-gradient-to-b from-primary/10 to-card shadow-lg shadow-primary/10" : "border-border/50 bg-card"}`}
                >
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
                    className={`w-full rounded-xl ${tier.highlight ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-foreground hover:bg-muted/80"}`}
                  >
                    {tier.cta}
                  </Button>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ===== SECTION 8: OBJECTION HANDLING ===== */}
          <section className="mb-28">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black">"But what about..."</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {objections.map((obj, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className="p-5 rounded-xl bg-card border border-border/50"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <obj.icon className="w-5 h-5 text-primary" />
                    <p className="font-bold text-sm">{obj.q}</p>
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">{obj.a}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ===== SECTION 9: FAQ ===== */}
          <section className="mb-28">
            <div className="text-center mb-12">
              <p className="text-primary text-xs font-medium tracking-[0.2em] uppercase mb-3">FAQ</p>
              <h2 className="text-3xl sm:text-4xl font-black">Frequently Asked Questions</h2>
            </div>
            <div className="max-w-2xl mx-auto space-y-3">
              {faqs.map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} />)}
            </div>
          </section>

          {/* ===== SECTION 10: FINAL CTA — Ascension ===== */}
          <section className="text-center p-10 sm:p-14 rounded-3xl bg-gradient-to-br from-primary/15 via-card to-card border border-primary/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.1),transparent_50%)]" />
            <div className="relative">
              <p className="text-primary text-xs font-medium tracking-[0.2em] uppercase mb-4">Stop Guessing. Start Profiting.</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4">
                Your Ads Are Leaking Money<br />
                <span className="text-primary">Right Now.</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-lg mx-auto">
                Upload your bulk file. See exactly where. Fix it today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => navigate("/auth")} size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-12 py-7 font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-[1.02]"
                >
                  Analyze My Ads Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button onClick={() => navigate("/dashboard")} variant="outline" size="lg"
                  className="text-lg px-8 py-7 rounded-xl border-border/50 hover:bg-muted"
                >
                  Try Demo Data
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-6">
                No credit card required • 13 dashboards • Results in 60 seconds
              </p>
            </div>
          </section>
        </main>

        {/* Footer */}
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
              <p>©{new Date().getFullYear()} lynx media. All Rights Reserved</p>
              <div className="flex items-center gap-2">
                <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
                <span className="text-primary">•</span>
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
