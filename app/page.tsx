import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SkipLink } from "@/components/layout/SkipLink";
import { ProjectStepIndicator } from "@/components/common/ProjectStepIndicator";
import { Intro } from "@/components/sections/Intro";
import { ProjectReveal } from "@/components/sections/ProjectReveal";
import { Skills } from "@/components/sections/Skills";
import { ScrollIndicatorsProvider } from "@/hooks/useScrollIndicators";
import { portfolio } from "@/data/portfolio";
import { siteConfig } from "@/data/site";

const profileSchema = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  name: siteConfig.title,
  url: siteConfig.url,
  description: siteConfig.description,
  mainEntity: {
    "@type": "Person",
    name: siteConfig.author.name,
    alternateName: siteConfig.author.alternateName,
    jobTitle: portfolio.title,
    url: siteConfig.url,
    email: portfolio.contactEmail,
    sameAs: portfolio.socials
      .filter(({ href }) => href.startsWith("http"))
      .map(({ href }) => href),
  },
};

export default function Home() {
  return (
    <div className="bg-neutral-950 text-white">
      <script
        id="profile-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(profileSchema).replace(/</g, "\\u003c"),
        }}
      />
      <SkipLink />
      <Header />
      <main id="content">
        <Intro />
        <ScrollIndicatorsProvider>
          <ProjectStepIndicator />
          <ProjectReveal />
        </ScrollIndicatorsProvider>
        <Skills />
      </main>
      <Footer />
    </div>
  );
}
