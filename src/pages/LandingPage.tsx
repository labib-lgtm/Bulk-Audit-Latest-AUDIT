import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { ArrowRight, Check } from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();

  const problems = [
    "Spending 4+ hours per week pulling reports from Amazon",
    "No idea which campaigns are actually profitable after ad spend",
    "ACOS looks good but you're still losing money",
    "Wasting budget on keywords that will never convert",
    "Can't see the big picture across SP, SB, and SD",
  ];

  const benefits = [
    "See your TRUE profitability with TACOS (not just ACOS)",
    "Identify wasted spend in under 60 seconds",
    "Cross-campaign analytics in one dashboard",
    "Find your winning keywords and kill the losers",
    "No API setup. No developer. Just upload and go.",
  ];

  const results = [
    { metric: "4+ hours", description: "saved per week on reporting" },
    { metric: "23%", description: "average reduction in wasted ad spend" },
    { metric: "60 seconds", description: "to find your biggest profit leaks" },
  ];

  return (
    <>
      <Helmet>
        <title>Lynx Media | Stop Losing Money on Amazon Ads</title>
        <meta name="description" content="Upload your Amazon bulk files. See your TRUE profitability in 60 seconds. No API required." />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground dark">
        {/* Nav */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/20">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <span className="text-xl font-bold text-primary">LYNX</span>
            <Button 
              onClick={() => navigate("/auth")}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Get Started Free
            </Button>
          </div>
        </nav>

        <main className="max-w-3xl mx-auto px-6 pt-32 pb-20">
          {/* Hero */}
          <section className="mb-20">
            <p className="text-primary font-medium mb-4 tracking-wide">FOR AMAZON SELLERS & AGENCIES</p>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-[1.1] mb-6">
              Stop Guessing.
              <br />
              <span className="text-primary">Start Profiting.</span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-muted-foreground mb-8 leading-relaxed">
              Upload your Amazon bulk file. Get cross-campaign analytics and TACOS insights in 60 seconds. 
              <span className="text-foreground font-medium"> No API. No setup. No BS.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => navigate("/auth")}
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6 font-bold"
              >
                Analyze My Ads Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                onClick={() => navigate("/dashboard")}
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6"
              >
                See Demo
              </Button>
            </div>
          </section>

          {/* Problem */}
          <section className="mb-20">
            <h2 className="text-2xl sm:text-3xl font-bold mb-8">
              Here's the problem with Amazon PPC...
            </h2>
            
            <div className="space-y-4">
              {problems.map((problem, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-destructive font-bold text-xl">✗</span>
                  <p className="text-lg text-muted-foreground">{problem}</p>
                </div>
              ))}
            </div>

            <p className="text-xl mt-8 text-foreground font-medium">
              Sound familiar? You're not alone. Most sellers are flying blind.
            </p>
          </section>

          {/* Solution */}
          <section className="mb-20">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              What if you could see EVERYTHING in one place?
            </h2>
            
            <p className="text-lg text-muted-foreground mb-8">
              Lynx takes your bulk operations file and shows you exactly what's working, what's wasting money, and what to fix next.
            </p>

            <div className="space-y-4">
              {benefits.map((benefit, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-lg text-foreground">{benefit}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Results */}
          <section className="mb-20 p-8 rounded-2xl bg-card border border-border">
            <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">
              What sellers are seeing:
            </h2>
            
            <div className="grid sm:grid-cols-3 gap-8">
              {results.map((result, i) => (
                <div key={i} className="text-center">
                  <p className="text-4xl sm:text-5xl font-black text-primary mb-2">{result.metric}</p>
                  <p className="text-muted-foreground">{result.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* How it works */}
          <section className="mb-20">
            <h2 className="text-2xl sm:text-3xl font-bold mb-8">
              Dead simple. Here's how it works:
            </h2>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <span className="text-3xl font-black text-primary">1.</span>
                <div>
                  <p className="text-xl font-bold">Download your bulk file from Amazon</p>
                  <p className="text-muted-foreground">Takes 30 seconds in Seller Central</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <span className="text-3xl font-black text-primary">2.</span>
                <div>
                  <p className="text-xl font-bold">Upload it to Lynx</p>
                  <p className="text-muted-foreground">Drag, drop, done</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <span className="text-3xl font-black text-primary">3.</span>
                <div>
                  <p className="text-xl font-bold">See your insights instantly</p>
                  <p className="text-muted-foreground">TACOS, wasted spend, winning keywords, problem areas—all in one view</p>
                </div>
              </div>
            </div>
          </section>

          {/* Objection handling */}
          <section className="mb-20">
            <h2 className="text-2xl sm:text-3xl font-bold mb-8">
              "But what about..."
            </h2>
            
            <div className="space-y-6">
              <div>
                <p className="text-lg font-bold text-foreground">"Is my data safe?"</p>
                <p className="text-muted-foreground">Your files are processed in your browser. Nothing gets uploaded to our servers. Your competitive data stays yours.</p>
              </div>
              
              <div>
                <p className="text-lg font-bold text-foreground">"Do I need to connect my Amazon API?"</p>
                <p className="text-muted-foreground">Nope. Just upload the bulk file you already have access to. No integrations, no permissions, no waiting.</p>
              </div>
              
              <div>
                <p className="text-lg font-bold text-foreground">"What if I manage multiple accounts?"</p>
                <p className="text-muted-foreground">Perfect for agencies. Analyze any client's data in seconds without asking for API access.</p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center py-12 px-8 rounded-2xl bg-gradient-to-b from-primary/10 to-transparent border border-primary/20">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              Ready to stop losing money?
            </h2>
            
            <p className="text-xl text-muted-foreground mb-8">
              Get your first analysis free. See what you've been missing.
            </p>

            <Button 
              onClick={() => navigate("/auth")}
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-10 py-6 font-bold"
            >
              Analyze My Ads Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required. Upload and see results in 60 seconds.
            </p>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/20 py-8 px-6">
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Lynx Media. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LandingPage;
