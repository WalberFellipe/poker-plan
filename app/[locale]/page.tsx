import { LandingHero } from "@/components/landing/landing-hero";
import { HighlightsSection } from "@/components/landing/highlights-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { FeaturesGridSection } from "@/components/landing/features-grid-section";
import { TableShowcaseSection } from "@/components/landing/table-showcase-section";
import { FaqSection } from "@/components/landing/faq-section";
import { SiteFooter } from "@/components/landing/site-footer";

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-background">
      <LandingHero />
      <HighlightsSection />
      <HowItWorksSection />
      <FeaturesGridSection />
      <TableShowcaseSection />
      <FaqSection />
      <SiteFooter />
    </div>
  );
}
