import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { ArrowRight, Check, X, Zap, Shield, Clock, TrendingUp, Phone, Mail } from "lucide-react";
import lynxLogo from "@/assets/lynx_media_logo_HQ_final.png";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

// Animated counter hook
const useCountUp = (end: number, duration: number = 2000) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !isVisible) {
        setIsVisible(true);
      }
    }, {
      threshold: 0.3
    });
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, [isVisible]);
  useEffect(() => {
    if (!isVisible) return;
    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [isVisible, end, duration]);
  return {
    count,
    ref
  };
};

// Result card component with animated counter
const ResultCard = ({
  metric,
  unit,
  suffix,
  description,
  icon: Icon
}: {
  metric: number;
  unit: string;
  suffix: string;
  description: string;
  icon: React.ElementType;
}) => {
  const {
    count,
    ref
  } = useCountUp(metric, 1500);
  return <div ref={ref} className="text-center p-8 rounded-2xl bg-gradient-to-b from-card to-card/50 border border-border/50 hover:border-primary/30 transition-colors">
      <Icon className="w-8 h-8 text-primary mx-auto mb-4" />
      <p className="text-5xl font-black text-foreground mb-1">
        {count}{suffix}
        <span className="text-2xl text-primary">{unit}</span>
      </p>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>;
};
const LandingPage = () => {
  const navigate = useNavigate();
  const problems = ["Spending 4+ hours per week pulling reports from Amazon", "No idea which campaigns are actually profitable after ad spend", "ACOS looks good but you're still losing money", "Wasting budget on keywords that will never convert", "Can't see the big picture across SP, SB, and SD"];
  const benefits = ["See your TRUE profitability with TACOS (not just ACOS)", "Identify wasted spend in under 60 seconds", "Cross-campaign analytics in one dashboard", "Find your winning keywords and kill the losers", "No API setup. No developer. Just upload and go."];
  const results = [{
    metric: "4+",
    unit: "hours",
    description: "saved per week on reporting",
    icon: Clock
  }, {
    metric: "23",
    unit: "%",
    description: "average reduction in wasted spend",
    icon: TrendingUp
  }, {
    metric: "60",
    unit: "sec",
    description: "to find your profit leaks",
    icon: Zap
  }];
  const steps = [{
    step: "1",
    title: "Download your bulk file",
    desc: "30 seconds in Seller Central"
  }, {
    step: "2",
    title: "Upload it to Lynx",
    desc: "Drag, drop, done"
  }, {
    step: "3",
    title: "See insights instantly",
    desc: "TACOS, wasted spend, winners & losers"
  }];
  return <>
      <Helmet>
        <title>Lynx Media | Stop Losing Money on Amazon Ads</title>
        <meta name="description" content="Upload your Amazon bulk files. See your TRUE profitability in 60 seconds. No API required." />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground dark">
        {/* Background gradient */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-primary/8 via-primary/3 to-transparent rounded-full blur-3xl" />
        </div>

        {/* Nav */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/10">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <img alt="Lynx Media" src="/lovable-uploads/800abbfd-bcd1-4375-8093-7d5199c45706.png" className="h-8 w-auto object-contain" />
            <Button onClick={() => navigate("/auth")} className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
              Get Started Free
            </Button>
          </div>
        </nav>

        <main className="relative max-w-4xl mx-auto px-6 pt-32 pb-20">
          {/* Hero */}
          <section className="mb-24 text-center">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.5,
            delay: 0.1
          }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
              <Zap className="w-4 h-4" />
              For Amazon Sellers & Agencies
            </motion.div>
            
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-[1.05] mb-8 tracking-tight">
              <motion.span initial={{
              opacity: 0,
              y: 30
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.6,
              delay: 0.2
            }} className="block">
                Stop Guessing.
              </motion.span>
              <motion.span initial={{
              opacity: 0,
              y: 30
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.6,
              delay: 0.4
            }} className="block bg-gradient-to-r from-primary via-primary to-brand-400 bg-clip-text text-transparent">
                Start Profiting.
              </motion.span>
            </h1>
            
            <motion.p initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.5,
            delay: 0.6
          }} className="text-xl sm:text-2xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto">
              Upload your Amazon bulk file. Get cross-campaign analytics and TACOS insights in 
              <span className="text-foreground font-bold"> 60 seconds.</span>
              <br />
              <span className="text-primary font-semibold">No API. No setup. No BS.</span>
            </motion.p>

            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.5,
            delay: 0.8
          }} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => navigate("/auth")} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-10 py-7 font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-[1.02]">
                Analyze My Ads Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button onClick={() => navigate("/dashboard")} variant="outline" size="lg" className="text-lg px-10 py-7 rounded-xl border-border/50 hover:bg-muted">
                See Demo
              </Button>
            </motion.div>

            <motion.p initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} transition={{
            duration: 0.5,
            delay: 1
          }} className="text-muted-foreground text-sm mt-6">
              ✓ Free to start &nbsp;&nbsp; ✓ No credit card &nbsp;&nbsp; ✓ Results in 60 seconds
            </motion.p>
          </section>

          {/* Results */}
          <section className="mb-24">
            <div className="grid sm:grid-cols-3 gap-4">
              <ResultCard metric={4} unit="+" suffix="hours" description="saved per week on reporting" icon={Clock} />
              <ResultCard metric={23} unit="%" suffix="" description="average reduction in wasted spend" icon={TrendingUp} />
              <ResultCard metric={60} unit="sec" suffix="" description="to find your profit leaks" icon={Zap} />
            </div>
          </section>

          {/* Problem */}
          <section className="mb-24">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black mb-4">
                Here's the problem with Amazon PPC...
              </h2>
              <p className="text-muted-foreground text-lg">Sound familiar? You're not alone.</p>
            </div>
            
            <div className="space-y-4 max-w-2xl mx-auto">
              {problems.map((problem, i) => <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-destructive/5 border border-destructive/10">
                  <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <X className="w-4 h-4 text-destructive" />
                  </div>
                  <p className="text-foreground">{problem}</p>
                </div>)}
            </div>
          </section>

          {/* Solution */}
          <section className="mb-24">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black mb-4">
                What if you could see <span className="text-primary">EVERYTHING</span> in one place?
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Lynx shows you exactly what's working, what's wasting money, and what to fix next.
              </p>
            </div>

            <div className="space-y-4 max-w-2xl mx-auto">
              {benefits.map((benefit, i) => <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-foreground font-medium">{benefit}</p>
                </div>)}
            </div>
          </section>

          {/* How it works */}
          <section className="mb-24">
            <h2 className="text-3xl sm:text-4xl font-black text-center mb-12">
              Dead simple. <span className="text-primary">3 steps.</span>
            </h2>
            
            <div className="grid sm:grid-cols-3 gap-6">
              {steps.map((item, i) => <div key={i} className="relative p-6 rounded-2xl bg-card border border-border/50 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground font-black text-xl flex items-center justify-center mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                  {i < steps.length - 1 && <ArrowRight className="hidden sm:block absolute top-1/2 -right-5 w-4 h-4 text-muted-foreground/30" />}
                </div>)}
            </div>
          </section>

          {/* Objections */}
          <section className="mb-24">
            <h2 className="text-3xl sm:text-4xl font-black text-center mb-12">
              "But what about..."
            </h2>
            
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-card border border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="w-5 h-5 text-primary" />
                  <p className="font-bold">"Is my data safe?"</p>
                </div>
                <p className="text-muted-foreground text-sm">
                  Files are processed in your browser. Nothing uploads to our servers. Your data stays yours.
                </p>
              </div>
              
              <div className="p-6 rounded-2xl bg-card border border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <Zap className="w-5 h-5 text-primary" />
                  <p className="font-bold">"Do I need API access?"</p>
                </div>
                <p className="text-muted-foreground text-sm">
                  Nope. Just upload the bulk file you already have. No integrations needed.
                </p>
              </div>
              
              <div className="p-6 rounded-2xl bg-card border border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <p className="font-bold">"Multiple accounts?"</p>
                </div>
                <p className="text-muted-foreground text-sm">
                  Perfect for agencies. Analyze any client's data in seconds.
                </p>
              </div>
              
              <div className="p-6 rounded-2xl bg-card border border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <p className="font-bold">"How long does it take?"</p>
                </div>
                <p className="text-muted-foreground text-sm">
                  60 seconds. Upload, analyze, optimize. That's it.
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center p-10 sm:p-14 rounded-3xl bg-gradient-to-br from-primary/15 via-card to-card border border-primary/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.1),transparent_50%)]" />
            
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4">
                Ready to stop losing money?
              </h2>
              
              <p className="text-xl text-muted-foreground mb-8 max-w-lg mx-auto">
                Get your first analysis free. See what you've been missing.
              </p>

              <Button onClick={() => navigate("/auth")} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-12 py-7 font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-[1.02]">
                Analyze My Ads Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              
              <p className="text-sm text-muted-foreground mt-6">
                No credit card required • Results in 60 seconds
              </p>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-[hsl(240,14%,8%)] pt-16 pb-6 px-6">
          <div className="max-w-7xl mx-auto">
            {/* Main Footer Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-12">
              
              {/* Brand Column */}
              <div className="lg:col-span-1">
                <img src={lynxLogo} alt="Lynx Media" className="h-10 mb-6" />
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  We'll take you from stuttering sales to #1 in your product category. All while maintaining your brand identity and integrity.
                </p>
                <div className="space-y-3 mb-6">
                  <a href="tel:+17372831902" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Phone className="w-4 h-4 text-primary" />
                    +1 (737) 283-1902
                  </a>
                  <a href="mailto:hello@lynxmedia.com" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Mail className="w-4 h-4 text-primary" />
                    hello@lynxmedia.com
                  </a>
                </div>
                {/* Social Icons */}
                <div className="flex gap-3">
                  {["facebook", "instagram", "youtube", "linkedin"].map((social) => (
                    <a
                      key={social}
                      href="#"
                      className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all"
                    >
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

              {/* Resources Column 1 */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-5 tracking-wide">[ Resources ]</h4>
                <ul className="space-y-3">
                  {["Home", "Why Lynx Media", "Our Process", "Services", "Success Stories"].map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Resources Column 2 */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-5 tracking-wide">[ Resources ]</h4>
                <ul className="space-y-3">
                  {["About us", "Portfolio", "Blogs", "FAQ's", "Contact"].map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* What We Do Column */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-5 tracking-wide">[ What We Do ]</h4>
                <ul className="space-y-3">
                  {["PPC Management", "Creatives Services", "Vendor Management", "Brand Management", "Listing Optimization", "Catalogue Management"].map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Column */}
              <div className="lg:text-right">
                <h3 className="text-3xl lg:text-4xl font-heading font-bold leading-tight">
                  Let's build<br />
                  success story<br />
                  <span className="text-primary">together</span>
                </h3>
              </div>
            </div>

            {/* Bottom Bar */}
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
    </>;
};
export default LandingPage;