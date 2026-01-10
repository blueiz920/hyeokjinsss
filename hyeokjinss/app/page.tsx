import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SkipLink } from "@/components/layout/SkipLink";
import { Container } from "@/components/layout/Container";
import { Intro } from "@/components/sections/Intro";
import { ProjectReveal } from "@/components/sections/ProjectReveal";
import { SkillsHorizontal } from "@/components/sections/SkillsHorizontal";

export default function Home() {
  return (
    <div className="bg-neutral-950 text-white">
      <SkipLink />
      <Header />
      <main id="content" className="pt-20">
        <Intro />
        {/* <section className="breather">
          <Container className="text-center">
            <p className="text-sm uppercase tracking-[0.4em] text-white/50">
              Narrative pace
            </p>
            <p className="mt-4 text-lg text-white/70">
              Every pin is intentional. Between them, I let the story breathe.
            </p>
          </Container>
        </section> */}
        <ProjectReveal />
        <section className="breather">
          <Container className="text-center">
            <p className="text-sm uppercase tracking-[0.4em] text-white/50">
              사용자경험을 최우선으로 생각해요
            </p>
            <p className="mt-4 text-lg text-white/70">
              빠르고 편한 경험을 위해 항상 고민해요
            </p>
          </Container>
        </section>
        <SkillsHorizontal />
        <Footer />
      </main>
    </div>
  );
}
