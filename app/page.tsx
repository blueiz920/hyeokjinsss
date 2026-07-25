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
      <main id="content" className="pt-13">
        <Intro />
        <ProjectReveal />
        <section className="breather">
          <Container className="text-center">
            <p className="text-sm uppercase tracking-[0.4em] text-white/50">
              기술을 나열하기보다
            </p>
            <p className="mt-4 text-lg text-white/70">
              어떤 문제에 사용했는지 보여드릴게요
            </p>
          </Container>
        </section>
        <SkillsHorizontal />
      </main>
      <Footer />
    </div>
  );
}
