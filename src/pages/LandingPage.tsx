import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Target, TrendingUp, Zap, Shield, Clock } from "lucide-react";
import { AnimatedSection } from "@/hooks/useScrollAnimation";
import lynxLogoDark from "@/assets/lynx-logo-dark.png";
import lynxLogoIcon from "@/assets/lynx-logo-icon.png";

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: BarChart3,
      title: "Executive Dashboard",
      description: "See your entire ad performance at a glance. Total spend, revenue, ACOS, ROAS — all in one view."
    },
    {
      icon: Target,
      title: "Campaign Breakdown",
      description: "SP, SB, SD campaigns dissected. Know exactly which campaign types are printing money and which are burning it."
    },
    {
      icon: TrendingUp,
      title: "Search Term Analysis",
      description: "Find the gold. Discover which search terms convert and which ones are just eating your budget."
    },
    {
      icon: Shield,
      title: "ASIN Audit",
      description: "Product-level performance. See which ASINs deserve more ad spend and which ones need to be cut."
    },
    {
      icon: Clock,
      title: "Portfolio Insights",
      description: "Organize and analyze by portfolio. Perfect for brands managing multiple product lines."
    },
    {
      icon: Zap,
      title: "Instant Upload",
      description: "Just upload your bulk reports. No API connections. No technical setup. Results in seconds."
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

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-card/50">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              Everything You Need. <span className="text-primary">Nothing You Don't.</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              No fluff. No complexity. Just the insights that actually matter.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <AnimatedSection 
                key={index}
                delay={index * 100}
                className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 group hover:shadow-[0_0_40px_rgba(178,255,0,0.1)] hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-all group-hover:scale-110">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
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

      {/* CTA Section */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent pointer-events-none" />
        
        <AnimatedSection className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-6">
            Ready To See <span className="text-primary">The Truth?</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Upload your Amazon bulk reports and get instant insights. No credit card. No strings attached.
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
          {/* Hand holding logo recreation */}
          <div className="relative mb-12">
            <div className="absolute inset-0 bg-primary/30 rounded-full blur-[80px] animate-glow-pulse" />
            <div className="relative w-24 h-24 rounded-2xl bg-primary flex items-center justify-center shadow-[0_0_60px_rgba(178,255,0,0.5)] animate-float">
              <img src={lynxLogoIcon} alt="Lynx Media" className="w-16 h-16 object-contain" />
            </div>
          </div>
          
          <p className="text-muted-foreground text-lg mb-8">Designed with versatility in mind</p>
          
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
