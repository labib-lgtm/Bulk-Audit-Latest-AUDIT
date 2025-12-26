import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, ArrowDown, BarChart3, Target, TrendingUp, Zap, 
  Search, Package, Layers, Activity, FileDown, CheckCircle, Upload,
  PieChart, Video, Monitor, ChevronRight, Plus, Minus
} from "lucide-react";
import { AnimatedSection } from "@/hooks/useScrollAnimation";
import lynxLogoDark from "@/assets/lynx-logo-dark.png";
import { useState } from "react";

const LandingPage = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const features = [
    {
      icon: BarChart3,
      title: "Executive Dashboard",
      description: "Total spend, revenue, ACOS, ROAS—unified across SP, SB, and SD campaigns. Channel breakdown, branded vs non-branded analysis, target distribution."
    },
    {
      icon: Target,
      title: "Sponsored Products",
      description: "Campaign summaries, keyword analysis, match type performance, placement insights. Everything at the target level."
    },
    {
      icon: Video,
      title: "Sponsored Brands",
      description: "HSA, Video, and Store Spotlight performance. Compare formats, track keywords, optimize brand awareness."
    },
    {
      icon: Monitor,
      title: "Sponsored Display",
      description: "Retargeting and audience campaigns. Product contextual vs audience targeting, viewable impressions, tactic breakdown."
    },
    {
      icon: Search,
      title: "Search Term Intelligence",
      description: "N-Gram analysis, harvesting candidates, wasted spend finder, ACOS distribution, branded segmentation."
    },
    {
      icon: Package,
      title: "ASIN-Level Audit",
      description: "Product profitability analysis. TACOS, ad dependency, organic win rate. Group by parent ASIN."
    },
    {
      icon: Layers,
      title: "Portfolio Performance",
      description: "Budget allocation, utilization rates, cross-portfolio comparison. Perfect for multi-brand sellers."
    },
    {
      icon: Activity,
      title: "Diagnostics & Optimization",
      description: "Auto-detect bleeders, bid recommendations, bulk export files. Custom ACOS targets per product."
    }
  ];

  const stats = [
    { value: "$2.4M+", label: "Ad Spend Analyzed" },
    { value: "32%", label: "Avg. ACOS Reduction" },
    { value: "500+", label: "Active Sellers" },
    { value: "<60s", label: "Time to Insights" }
  ];

  const faqs = [
    {
      question: "What reports do I need to upload?",
      answer: "You'll need your Sponsored Products, Sponsored Brands, and Sponsored Display bulk reports from Amazon Advertising Console. Optionally, upload your Business Report for ASIN-level profitability analysis. All reports can be exported directly from Seller Central."
    },
    {
      question: "Do I need API access or technical setup?",
      answer: "No. Lynx Media works entirely with bulk file uploads. No API connections, no developer needed, no complex integrations. Just download your reports from Amazon and upload them here."
    },
    {
      question: "How is this different from Amazon's built-in analytics?",
      answer: "Amazon shows you data. We show you insights. Cross-campaign analysis, N-gram search term breakdowns, ASIN profitability with TACOS, wasted spend detection, harvesting candidates—insights that would take hours to compile manually."
    },
    {
      question: "Can I export data for bulk uploads?",
      answer: "Yes. The Diagnostics dashboard generates ready-to-upload bulk files for bid changes, pauses, and negative keywords. The Search Term dashboard exports negative keyword files. Just download and upload to Amazon."
    },
    {
      question: "Is my data secure?",
      answer: "Your data is processed in your browser session. We don't store your Amazon data on our servers. Upload, analyze, and close—your competitive intelligence stays private."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navigation - Minimal */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-2xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <img src={lynxLogoDark} alt="Lynx Media" className="h-8" />
          <Button 
            onClick={() => navigate("/auth")}
            variant="outline"
            className="border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground font-medium transition-all"
          >
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero Section - Full Screen Immersive */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6">
        {/* Animated Background Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/15 rounded-full blur-[200px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute top-1/4 right-0 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 max-w-5xl mx-auto text-center pt-20">
          <div 
            className="opacity-0 animate-fade-in"
            style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium mb-8">
              Amazon PPC Analytics
            </span>
          </div>
          
          <h1 
            className="text-5xl md:text-7xl lg:text-[5.5rem] font-black tracking-tight mb-8 leading-[1.05] opacity-0 animate-fade-in-up"
            style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}
          >
            The smartest way to
            <br />
            <span className="text-primary">stop wasting ad spend.</span>
          </h1>
          
          <p 
            className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed opacity-0 animate-fade-in-up"
            style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}
          >
            Upload your Amazon bulk reports. Get instant insights across 8 specialized dashboards. Take action in minutes.
          </p>

          <div 
            className="opacity-0 animate-fade-in-up"
            style={{ animationDelay: '0.7s', animationFillMode: 'forwards' }}
          >
            <Button 
              onClick={() => navigate("/auth")}
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-lg px-10 py-7 rounded-full group transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(178,255,0,0.3)]"
            >
              Start Analyzing Free
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div 
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground opacity-0 animate-fade-in"
          style={{ animationDelay: '1.2s', animationFillMode: 'forwards' }}
        >
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <ArrowDown className="w-4 h-4 animate-bounce" />
        </div>
      </section>

      {/* Problem Statement - Large Typography */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection>
            <p className="text-2xl md:text-4xl lg:text-5xl font-medium leading-relaxed text-muted-foreground">
              After years of managing Amazon PPC, one thing hasn't changed: 
              <span className="text-foreground"> sellers are drowning in spreadsheets </span>
              while money slips through the cracks.
            </p>
          </AnimatedSection>
          
          <AnimatedSection delay={200} className="mt-12">
            <p className="text-2xl md:text-4xl lg:text-5xl font-medium leading-relaxed text-primary">
              It's time for a new approach.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Stats Section - Dark Card */}
      <section className="py-24 px-6">
        <AnimatedSection>
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 p-10 md:p-16 rounded-3xl bg-card/80 border border-border backdrop-blur-sm">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-4xl md:text-5xl lg:text-6xl font-black text-primary mb-2">{stat.value}</p>
                  <p className="text-sm md:text-base text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* Features Grid - Clean Cards */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-6">
              8 Dashboards.<br />
              <span className="text-primary">One Platform.</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Every tool you need to analyze, optimize, and scale your Amazon advertising.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <AnimatedSection 
                key={index}
                delay={index * 50}
                className="group p-6 rounded-2xl bg-card/50 border border-border hover:border-primary/50 hover:bg-card transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Numbered Steps */}
      <section className="py-24 px-6 bg-card/30">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              3 minutes to your first insights.
            </h2>
            <p className="text-xl text-muted-foreground">
              No setup friction. No integration delays.
            </p>
          </AnimatedSection>

          <div className="space-y-0">
            {[
              {
                step: "01",
                title: "Download your reports",
                description: "Export bulk reports from Amazon Seller Central. SP, SB, SD campaigns, plus your Business Report for ASIN analysis."
              },
              {
                step: "02",
                title: "Upload & analyze",
                description: "Drop your files into Lynx Media. Our engine processes everything instantly—campaigns, keywords, targets, search terms, ASINs."
              },
              {
                step: "03",
                title: "Take action",
                description: "Use insights to optimize bids, find wasted spend, harvest keywords, and export bulk files for immediate implementation."
              }
            ].map((item, index) => (
              <AnimatedSection 
                key={index}
                delay={index * 150}
                className="flex gap-8 items-start py-10 border-b border-border last:border-0"
              >
                <span className="text-5xl md:text-7xl font-black text-primary/30">{item.step}</span>
                <div className="flex-1 pt-2">
                  <h3 className="text-2xl md:text-3xl font-bold mb-3 text-foreground">{item.title}</h3>
                  <p className="text-lg text-muted-foreground max-w-xl">{item.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial - Large Quote */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <AnimatedSection>
            <blockquote className="text-2xl md:text-3xl lg:text-4xl font-medium leading-relaxed text-foreground mb-10">
              "I found $3,200 in wasted spend within the first 10 minutes. The Search Term dashboard alone is worth 10x what I was paying for other tools."
            </blockquote>
            <div>
              <p className="text-lg font-bold text-foreground">Marcus Chen</p>
              <p className="text-muted-foreground">7-Figure Private Label Seller</p>
              <p className="text-primary mt-2 font-medium">Reduced ACOS from 42% to 24%</p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* More Social Proof */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "The ASIN Audit feature changed everything. I finally understand which products are actually profitable after ad spend.",
                name: "Sarah Mitchell",
                role: "Brand Owner, Home & Kitchen",
                metric: "2.8x ROAS increase"
              },
              {
                quote: "No API setup, no developer needed. I upload my reports and have actionable insights in seconds.",
                name: "David Park",
                role: "Agency Owner, 15+ Clients",
                metric: "Saves 12+ hours/week"
              },
              {
                quote: "The Diagnostics feature identified bid optimization opportunities I completely missed. Results in days.",
                name: "Alex Rivera",
                role: "Electronics Seller",
                metric: "41% more orders, same spend"
              }
            ].map((testimonial, index) => (
              <AnimatedSection 
                key={index}
                delay={index * 100}
                className="p-8 rounded-2xl bg-card border border-border"
              >
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-primary fill-primary" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-foreground mb-6 leading-relaxed">"{testimonial.quote}"</p>
                <div className="border-t border-border pt-6">
                  <p className="font-bold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground mb-2">{testimonial.role}</p>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    <TrendingUp className="w-3 h-3" />
                    {testimonial.metric}
                  </span>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 bg-card/30">
        <div className="max-w-3xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              Still have questions?
            </h2>
            <p className="text-xl text-muted-foreground">
              Here's what sellers ask most.
            </p>
          </AnimatedSection>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <AnimatedSection key={index} delay={index * 50}>
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full text-left p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-foreground">{faq.question}</h3>
                    {openFaq === index ? (
                      <Minus className="w-5 h-5 text-primary flex-shrink-0" />
                    ) : (
                      <Plus className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                  {openFaq === index && (
                    <p className="text-muted-foreground mt-4 leading-relaxed">
                      {faq.answer}
                    </p>
                  )}
                </button>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Big Impact */}
      <section className="py-32 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[200px] pointer-events-none" />
        
        <AnimatedSection className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black mb-8">
            Ready to see
            <br />
            <span className="text-primary">the truth?</span>
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Upload your Amazon reports. Get insights in seconds. No credit card required.
          </p>
          <Button 
            onClick={() => navigate("/auth")}
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xl px-12 py-8 rounded-full group transition-all hover:scale-105 hover:shadow-[0_0_80px_rgba(178,255,0,0.4)]"
          >
            Get Started Free
            <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Button>
        </AnimatedSection>
      </section>

      {/* Footer - Minimal */}
      <footer className="py-16 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <img src={lynxLogoDark} alt="Lynx Media" className="h-6 opacity-60" />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Lynx Media. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;