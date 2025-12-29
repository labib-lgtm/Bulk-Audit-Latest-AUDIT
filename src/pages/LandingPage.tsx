import { 
  BarChart3, Target, Search, Package, Layers, Activity, 
  Video, Monitor, Users, LayoutDashboard, FileText, Briefcase 
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import lynxLogoDark from "@/assets/lynx-logo-dark.png";
import dashboardLaptopMockup from "@/assets/dashboard-laptop-mockup.png";
import dashboardMobileMockup from "@/assets/dashboard-mobile-mockup.png";
import {
  LandingNav,
  HeroSection,
  ValueProposition,
  PillarsSection,
  ToolsSection,
  PrivacyCard,
  CTASection,
  FAQSection,
  LandingFooter
} from "@/components/landing";

// Static data
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
  { icon: LayoutDashboard, label: "Executive Dashboard", active: true, route: "/dashboard" },
  { icon: Target, label: "SP Campaigns", route: "/dashboard/sp" },
  { icon: Video, label: "SB Campaigns", route: "/dashboard/sb" },
  { icon: Monitor, label: "SD Campaigns", route: "/dashboard/sd" },
  { icon: Search, label: "Search Terms", route: "/dashboard/search-terms" },
  { icon: Package, label: "ASIN Audit", route: "/dashboard/asin-audit" },
  { icon: Layers, label: "Portfolios", route: "/dashboard/portfolios" },
  { icon: Activity, label: "Diagnostics", route: "/dashboard/diagnostics" },
  { icon: BarChart3, label: "TACOS/ROAS", route: "/dashboard" },
  { icon: FileText, label: "Reports", route: "/dashboard" },
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

// JSON-LD structured data
const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Lynx Media",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "description": "Amazon PPC analytics platform that transforms bulk file data into actionable insights for ACOS, ROAS, and TACOS optimization.",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "150"
  }
};

const LandingPage = () => {
  return (
    <>
      <Helmet>
        <title>Lynx Media | Amazon PPC Analytics Platform - Turn Ad Data Into Profitable Insights</title>
        <meta name="description" content="Upload your Amazon bulk files and get cross-campaign analytics, TACOS insights, and optimization recommendations in minutes. No API setup required." />
        <meta name="keywords" content="Amazon PPC, Amazon advertising, ACOS, ROAS, TACOS, campaign analytics, bulk operations, sponsored products, sponsored brands, sponsored display" />
        <link rel="canonical" href="https://lynxmedia.io" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Lynx Media | Amazon PPC Analytics Platform" />
        <meta property="og:description" content="Turn Amazon ad data into profitable insights in minutes. Upload bulk files, get cross-campaign analytics and TACOS optimization." />
        <meta property="og:url" content="https://lynxmedia.io" />
        <meta property="og:site_name" content="Lynx Media" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Lynx Media | Amazon PPC Analytics Platform" />
        <meta name="twitter:description" content="Turn Amazon ad data into profitable insights in minutes. No API setup required." />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background text-foreground overflow-x-hidden dark">
        <LandingNav logoSrc={lynxLogoDark} />
        
        <main>
          <HeroSection 
            personas={personas}
            laptopMockup={dashboardLaptopMockup}
            mobileMockup={dashboardMobileMockup}
          />
          
          <ValueProposition />
          
          <PillarsSection pillars={pillars} />
          
          <ToolsSection tools={tools} />
          
          <PrivacyCard />
          
          <CTASection />
          
          <FAQSection faqs={faqs} />
        </main>
        
        <LandingFooter logoSrc={lynxLogoDark} />
      </div>
    </>
  );
};

export default LandingPage;
