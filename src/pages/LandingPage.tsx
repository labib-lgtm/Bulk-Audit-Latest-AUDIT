import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { ArrowRight, Check, X, Zap, Shield, Clock, TrendingUp } from "lucide-react";
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
        <footer className="border-t border-border/10 py-8 px-6 bg-card/50">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p className="font-medium">© {new Date().getFullYear()} Lynx Media</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            </div>
          </div>
        </footer>
      </div>
    </>;
};
export default LandingPage;