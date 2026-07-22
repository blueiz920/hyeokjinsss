import { portfolio } from "@/data/portfolio";
import { Container } from "./Container";

export const Footer = () => {
  return (
    <footer id="contact" className="site-footer">
      <div className="site-footer-curve" aria-hidden="true" />

      <Container className="relative z-10 pb-10 pt-20 md:pb-12 md:pt-28">
        <div className="space-y-8 md:space-y-10">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-950/50">
            Contact
          </p>
          <div className="flex items-end justify-between gap-6">
            <h2 className="max-w-4xl text-[clamp(2.75rem,8vw,5.5rem)] font-medium leading-[0.95] tracking-[-0.045em] text-neutral-950">
              다음 경험을
              <br />
              함께 만들어요.
            </h2>
            <span
              aria-hidden="true"
              className="hidden pb-2 text-4xl font-light text-neutral-950/55 md:block"
            >
              ↘
            </span>
          </div>
        </div>

        <div className="relative mt-16 border-t border-neutral-950/20 pt-24 md:mt-20 md:pt-28">
          <a
            href={`mailto:${portfolio.contactEmail}`}
            className="site-footer-action group"
          >
            <span className="relative z-10 flex items-center gap-2">
              연락하기
              <span
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
              >
                ↗
              </span>
            </span>
          </a>

          <p className="max-w-lg text-base leading-relaxed text-neutral-950/65 md:text-lg">
            새로운 프로젝트나 협업에 관한 이야기를 편하게 보내 주세요.
            좋은 경험을 함께 고민하겠습니다.
          </p>
        </div>

        <div className="mt-12 flex flex-col gap-8 border-t border-neutral-950/15 pt-8 md:mt-16 md:flex-row md:items-end md:justify-between">
          <a
            className="site-footer-pill"
            href={`mailto:${portfolio.contactEmail}`}
          >
            {portfolio.contactEmail}
          </a>

          <nav aria-label="Footer links" className="space-y-3">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-neutral-950/45">
              Links
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-950/70">
              {portfolio.socials
                .filter((social) => !social.href.startsWith("mailto:"))
                .map((social) => {
                  const isExternalLink = social.href.startsWith("http");

                  return (
                    <a
                      key={social.label}
                      className="transition-colors hover:text-neutral-950"
                      href={social.href}
                      target={isExternalLink ? "_blank" : undefined}
                      rel={isExternalLink ? "noopener noreferrer" : undefined}
                      aria-label={
                        isExternalLink
                          ? `${social.label} 새 탭에서 열기`
                          : undefined
                      }
                    >
                      {social.label}
                    </a>
                  );
                })}
            </div>
          </nav>
        </div>
      </Container>
    </footer>
  );
};
