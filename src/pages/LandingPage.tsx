import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, BarChart3, Target, TrendingUp, Zap, Shield, Clock, 
  Search, Package, Layers, Activity, FileDown, CheckCircle, Upload,
  PieChart, Video, Monitor, AlertCircle, Sparkles
} from "lucide-react";
import { AnimatedSection } from "@/hooks/useScrollAnimation";
import lynxLogoDark from "@/assets/lynx-logo-dark.png";
import lynxLogoIcon from "@/assets/lynx-logo-icon.png";

const LandingPage = () => {
  const navigate = useNavigate();

  const mainFeatures = [
    {
      icon: BarChart3,
      title: "Executive Dashboard",
      description: "Your command center for Amazon PPC. See total spend, revenue, ACOS, ROAS, impressions, clicks, and conversion rates across all campaign types in one unified view. Includes channel-by-channel breakdown (SP, SB, SD), branded vs non-branded analysis, and detailed target type distribution.",
      highlights: ["Real-time KPI matrix", "Channel performance comparison", "Branded vs Non-Branded insights", "Target type breakdown"]
    },
    {
      icon: Target,
      title: "Sponsored Products (SP) Dashboard",
      description: "Deep-dive into your SP campaigns with campaign-level summaries, keyword and product target analysis, match type performance (Exact, Phrase, Broad, Auto), and placement insights (Top of Search, Product Pages, Rest of Search).",
      highlights: ["Campaign performance tables", "Match type distribution", "Placement analysis", "Target-level metrics"]
    },
    {
      icon: Video,
      title: "Sponsored Brands (SB) Dashboard",
      description: "Analyze Headline Search Ads, Video campaigns, and Store Spotlight performance. Track keywords, product targets, and see how different ad formats (HSA, Video, Store) compare against each other.",
      highlights: ["Video vs HSA comparison", "Store Spotlight tracking", "Format-level ROAS", "Keyword analysis"]
    },
    {
      icon: Monitor,
      title: "Sponsored Display (SD) Dashboard",
      description: "Master your retargeting and audience campaigns. Analyze product contextual targeting vs audience targeting, track viewable impressions, and optimize your display strategy with tactic-level insights.",
      highlights: ["Audience vs Contextual", "Viewable impressions", "Tactic breakdown", "Retargeting analysis"]
    },
    {
      icon: Search,
      title: "Search Term Intelligence",
      description: "The most powerful search term analysis tool for Amazon. Aggregated search term performance, N-Gram analysis (1, 2, 3-word phrases), branded vs non-branded segmentation, ACOS/CVR distribution charts, wasted spend identification, and keyword harvesting candidates.",
      highlights: ["N-Gram analysis", "Harvesting candidates", "Wasted spend finder", "Match type coverage"]
    },
    {
      icon: Package,
      title: "ASIN-Level Audit",
      description: "Product-level profitability analysis. See which ASINs are printing money and which are draining your budget. Includes TACOS (Total ACOS), ad dependency ratio, organic win rate, and the ability to group by Parent ASIN for variation analysis.",
      highlights: ["TACOS tracking", "Ad dependency %", "Organic win rate", "Parent/Child grouping"]
    },
    {
      icon: Layers,
      title: "Portfolio Performance",
      description: "Organize and analyze by portfolio. See budget allocation, utilization rates, spend vs sales by portfolio, and identify which product lines are performing best. Perfect for multi-brand sellers and agencies.",
      highlights: ["Budget utilization", "Portfolio-level ROAS", "Spend allocation charts", "Cross-portfolio comparison"]
    },
    {
      icon: Activity,
      title: "Diagnostics & Optimization",
      description: "Automated bid optimization recommendations. Find 'bleeders' (keywords with spend but zero sales) and high-ACOS targets that need bid adjustments. Export ready-to-upload bulk files for instant implementation.",
      highlights: ["Auto-detect bleeders", "Bid recommendations", "Bulk export files", "Custom ACOS targets"]
    }
  ];

  const tableFeatures = [
    {
      title: "Campaign Summary Tables",
      description: "Sortable, searchable tables with columns for Spend, Sales, ROAS, ACOS, Orders, CPC, CTR, CVR, and more. Filter by campaign state, search by name.",
      icon: BarChart3
    },
    {
      title: "Target Analysis Tables",
      description: "Drill into keywords and product targets. See bid, spend, spend share, sales, ROAS, ACOS, orders, and CVR for every single target.",
      icon: Target
    },
    {
      title: "Match Type Breakdown",
      description: "Visual pie charts and detailed tables showing performance by match type. Identify which match types drive the best ROI.",
      icon: PieChart
    },
    {
      title: "Placement Performance",
      description: "Understand where your ads perform best: Top of Search, Product Pages, or Rest of Search. Optimize placement bids based on data.",
      icon: Monitor
    },
    {
      title: "Search Term Tables",
      description: "Every search term with impressions, clicks, CTR, CPC, spend, spend share, orders, CVR, sales, ACOS, ROAS, and match type coverage indicators.",
      icon: Search
    },
    {
      title: "Export to Excel",
      description: "Export negative keyword bulk files, bid optimization files, and full data exports ready for Amazon Seller Central upload.",
      icon: FileDown
    }
  ];

  const benefits = [
    {
      title: "No API Required",
      description: "Just download your bulk reports from Amazon and upload. No complex API setup, no developer needed.",
      icon: Upload
    },
    {
      title: "Instant Analysis",
      description: "Results in seconds, not hours. Upload your files and immediately see insights across all dashboards.",
      icon: Zap
    },
    {
      title: "Actionable Exports",
      description: "Generate bulk upload files for bid changes, negative keywords, and pauses—ready to upload to Amazon.",
      icon: FileDown
    },
    {
      title: "Product-Level Goals",
      description: "Set different ACOS targets per ASIN. The diagnostics engine uses your custom goals for smarter recommendations.",
      icon: Target
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border animate-fade-in-down">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <img src={lynxLogoDark} alt="Lynx Media" className="h-10" />
          <Button 
            onClick={() => navigate("/auth")}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold transition-all hover:scale-105"
          >
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        {/* Animated Glow Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[150px] pointer-events-none animate-glow-pulse" />
        
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in"
            style={{ animationDelay: '0.2s' }}
          >
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Amazon PPC Analytics Tool</span>
          </div>
          
          <h1 
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 leading-[0.9] opacity-0 animate-fade-in-up"
            style={{ animationDelay: '0.3s' }}
          >
            <span className="text-foreground">STOP WASTING</span>
            <br />
            <span className="text-primary">AD SPEND.</span>
          </h1>
          
          <p 
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed opacity-0 animate-fade-in-up"
            style={{ animationDelay: '0.5s' }}
          >
            Most Amazon sellers are bleeding money on ads without even knowing it.
            <span className="text-foreground font-semibold"> This tool shows you exactly where.</span>
          </p>

          <div 
            className="flex flex-col sm:flex-row gap-4 justify-center opacity-0 animate-fade-in-up"
            style={{ animationDelay: '0.7s' }}
          >
            <Button 
              onClick={() => navigate("/auth")}
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-lg px-8 py-6 rounded-xl group transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(178,255,0,0.3)]"
            >
              Start Analyzing Now
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="outline"
              size="lg"
              onClick={() => {
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="border-border text-foreground hover:bg-muted font-bold text-lg px-8 py-6 rounded-xl transition-all hover:scale-105"
            >
              See What You Get
            </Button>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 px-6 relative">
        <AnimatedSection className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-8">
            Here's The <span className="text-primary">Brutal Truth</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            You're spending hours in Amazon Seller Central trying to make sense of endless spreadsheets. 
            You're guessing which keywords work. You're unsure if your ACOS is good or terrible. 
            <span className="text-foreground font-semibold"> And every day, money is slipping through the cracks.</span>
          </p>
        </AnimatedSection>
      </section>

      {/* Main Features Section */}
      <section id="features" className="py-24 px-6 bg-card/50">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              8 Powerful Dashboards. <span className="text-primary">One Platform.</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Every tool you need to analyze, optimize, and scale your Amazon PPC campaigns—without the complexity.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-6">
            {mainFeatures.map((feature, index) => (
              <AnimatedSection 
                key={index}
                delay={index * 100}
                className="p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 group hover:shadow-[0_0_40px_rgba(178,255,0,0.1)]"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-all group-hover:scale-110">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-3 text-foreground">{feature.title}</h3>
                    <p className="text-muted-foreground mb-4 leading-relaxed">{feature.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {feature.highlights.map((highlight, i) => (
                        <span 
                          key={i}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                        >
                          <CheckCircle className="w-3 h-3" />
                          {highlight}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Data Tables Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              Tables That <span className="text-primary">Actually Make Sense</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Every table is sortable, searchable, and packed with the metrics that matter. No more spreadsheet hell.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tableFeatures.map((feature, index) => (
              <AnimatedSection 
                key={index}
                delay={index * 80}
                className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Why Use This Tool Section */}
      <section className="py-24 px-6 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              Why Sellers <span className="text-primary">Love This Tool</span>
            </h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <AnimatedSection 
                key={index}
                delay={index * 100}
                className="text-center p-6"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-foreground">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm">{benefit.description}</p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              See It <span className="text-primary">In Action</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Real dashboards. Real data. Real results.
            </p>
          </AnimatedSection>

          {/* Mock Dashboard Preview */}
          <AnimatedSection delay={200}>
            <div className="relative rounded-2xl border border-border bg-card overflow-hidden shadow-2xl hover:shadow-[0_20px_60px_rgba(178,255,0,0.1)] transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
              
              {/* Mock Header */}
              <div className="border-b border-border p-4 flex items-center gap-4">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-full bg-muted text-sm text-muted-foreground">
                    lynxmedia.app/dashboard
                  </div>
                </div>
              </div>

              {/* Mock Dashboard Content */}
              <div className="p-6 space-y-6">
                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Total Spend", value: "$24,892", change: "+12%" },
                    { label: "Revenue", value: "$89,234", change: "+28%" },
                    { label: "ACOS", value: "27.8%", change: "-3.2%" },
                    { label: "ROAS", value: "3.58x", change: "+0.4" }
                  ].map((stat, i) => (
                    <div 
                      key={i} 
                      className="p-4 rounded-xl bg-muted/50 border border-border hover:border-primary/30 transition-all"
                    >
                      <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-sm text-primary">{stat.change}</p>
                    </div>
                  ))}
                </div>

                {/* Mock Chart Area with animated bars */}
                <div className="h-48 rounded-xl bg-muted/30 border border-border flex items-end justify-around p-4">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((height, i) => (
                    <div 
                      key={i}
                      className="w-6 rounded-t bg-gradient-to-t from-primary/50 to-primary transition-all hover:from-primary/70 hover:to-primary"
                      style={{ 
                        height: `${height}%`,
                        animation: `bar-grow 0.8s ease-out ${i * 0.05}s forwards`,
                        '--bar-height': `${height}%`
                      } as React.CSSProperties}
                    />
                  ))}
                </div>

                {/* Mock Table */}
                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="grid grid-cols-5 gap-4 p-4 bg-muted/50 border-b border-border text-sm font-medium text-muted-foreground">
                    <span>Campaign</span>
                    <span>Spend</span>
                    <span>Revenue</span>
                    <span>ACOS</span>
                    <span>Status</span>
                  </div>
                  {[
                    { name: "Brand - Core", spend: "$4,892", revenue: "$18,234", acos: "26.8%", status: "Active" },
                    { name: "Product - Launch", spend: "$2,341", revenue: "$8,923", acos: "26.2%", status: "Active" },
                    { name: "Category - Defense", spend: "$1,876", revenue: "$5,234", acos: "35.8%", status: "Review" }
                  ].map((row, i) => (
                    <div 
                      key={i} 
                      className="grid grid-cols-5 gap-4 p-4 border-b border-border last:border-0 text-sm hover:bg-muted/30 transition-colors"
                    >
                      <span className="font-medium text-foreground">{row.name}</span>
                      <span className="text-muted-foreground">{row.spend}</span>
                      <span className="text-muted-foreground">{row.revenue}</span>
                      <span className="text-muted-foreground">{row.acos}</span>
                      <span className={`${row.status === "Active" ? "text-primary" : "text-yellow-500"}`}>
                        {row.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-6 bg-card/50">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              How It <span className="text-primary">Works</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Three simple steps to unlock your PPC insights.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Download Your Reports",
                description: "Export your bulk reports from Amazon Seller Central (Sponsored Products, Brands, Display campaigns, and Business Report)."
              },
              {
                step: "02",
                title: "Upload & Analyze",
                description: "Drop your files into Lynx Media. Our engine processes everything instantly—campaigns, keywords, targets, search terms, and ASINs."
              },
              {
                step: "03",
                title: "Take Action",
                description: "Use the insights to optimize bids, find wasted spend, identify winning keywords, and export bulk files for immediate implementation."
              }
            ].map((item, index) => (
              <AnimatedSection 
                key={index}
                delay={index * 150}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-6 text-2xl font-black">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials & Social Proof Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              Trusted By <span className="text-primary">Amazon Sellers</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              See what our users are saying about their results.
            </p>
          </AnimatedSection>

          {/* Stats Bar */}
          <AnimatedSection delay={100} className="mb-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 rounded-2xl bg-card border border-border">
              {[
                { value: "2.4M+", label: "Ad Spend Analyzed" },
                { value: "32%", label: "Avg. ACOS Reduction" },
                { value: "500+", label: "Sellers Using Lynx" },
                { value: "4.9/5", label: "User Satisfaction" }
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-3xl md:text-4xl font-black text-primary mb-1">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </AnimatedSection>

          {/* Testimonial Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "I found $3,200 in wasted spend within the first 10 minutes. The Search Term dashboard alone is worth 10x what I was paying for other tools.",
                name: "Marcus Chen",
                role: "7-Figure Private Label Seller",
                metric: "Reduced ACOS from 42% to 24%"
              },
              {
                quote: "The ASIN Audit feature changed everything. I finally understand which products are actually profitable after ad spend, not just which ones sell the most.",
                name: "Sarah Mitchell",
                role: "Brand Owner, Home & Kitchen",
                metric: "Increased ROAS by 2.8x"
              },
              {
                quote: "No API setup, no developer needed. I upload my reports and have actionable insights in seconds. The bulk export files save me hours every week.",
                name: "David Park",
                role: "Agency Owner, 15+ Clients",
                metric: "Saves 12+ hours/week"
              },
              {
                quote: "The Executive Dashboard gives me the 30,000ft view I need, while the deep-dive dashboards let me optimize at the keyword level. Best of both worlds.",
                name: "Jennifer Okonkwo",
                role: "6-Figure Supplement Brand",
                metric: "Cut wasted spend by 67%"
              },
              {
                quote: "I was skeptical at first, but the Diagnostics feature identified bid optimization opportunities I completely missed. Implemented the changes and saw results in days.",
                name: "Alex Rivera",
                role: "Electronics Seller",
                metric: "41% more orders, same spend"
              },
              {
                quote: "Finally, a tool that understands Amazon PPC at a deep level. Match type analysis, placement data, branded vs non-branded—it's all here and actually makes sense.",
                name: "Priya Sharma",
                role: "Multi-Brand Portfolio Owner",
                metric: "Managing $50K+/mo in ad spend"
              }
            ].map((testimonial, index) => (
              <AnimatedSection 
                key={index}
                delay={index * 100}
                className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 flex flex-col"
              >
                <div className="flex-1">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 text-primary fill-primary" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 leading-relaxed">"{testimonial.quote}"</p>
                </div>
                <div className="border-t border-border pt-4 mt-4">
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

      {/* CTA Section */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent pointer-events-none" />
        
        <AnimatedSection className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Start analyzing in under 60 seconds</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-black mb-6">
            Ready To See <span className="text-primary">The Truth?</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Upload your Amazon bulk reports and get instant insights across all 8 dashboards. No credit card required. No strings attached.
          </p>
          <Button 
            onClick={() => navigate("/auth")}
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xl px-12 py-7 rounded-xl group transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(178,255,0,0.4)]"
          >
            Get Started Free
            <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Button>
        </AnimatedSection>
      </section>

      {/* Footer with Hand + Logo */}
      <footer className="py-24 px-6 border-t border-border">
        <AnimatedSection className="max-w-4xl mx-auto flex flex-col items-center">
          <p className="text-muted-foreground text-lg mb-8">The only Amazon PPC analytics tool you'll ever need.</p>
          
          <img src={lynxLogoDark} alt="Lynx Media" className="h-8 opacity-60 hover:opacity-100 transition-opacity" />
          
          <p className="text-sm text-muted-foreground mt-8">
            © {new Date().getFullYear()} Lynx Media. All rights reserved.
          </p>
        </AnimatedSection>
      </footer>
    </div>
  );
};

export default LandingPage;
