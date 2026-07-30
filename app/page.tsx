import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SkipLink } from "@/components/layout/SkipLink";
import { Intro } from "@/components/sections/Intro";
import { ProjectReveal } from "@/components/sections/ProjectReveal";
import { Skills } from "@/components/sections/Skills";

export default function Home() {
  return (
    <div className="bg-neutral-950 text-white">
      <SkipLink />
      <Header />
      <main id="content">
        <Intro />
        <ProjectReveal />
        <Skills />
      </main>
      <Footer />
    </div>
  );
}
