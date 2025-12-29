import { portfolio } from "@/data/portfolio";
import { Container } from "./Container";

export const Footer = () => {
  return (
    <footer id="contact" className="border-t border-white/10 bg-neutral-950">
      <Container className="space-y-6 py-16">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            Contact
          </p>
          <h2 className="text-2xl font-semibold text-white md:text-3xl">
            Let&apos;s build the next narrative together.
          </h2>
          <p className="text-base text-white/70">
            Reach out at{" "}
            <a
              className="text-white underline decoration-white/40 underline-offset-4"
              href={`mailto:${portfolio.contactEmail}`}
            >
              {portfolio.contactEmail}
            </a>
            .
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-white/70">
          {portfolio.socials.map((social) => (
            <a
              key={social.label}
              className="transition hover:text-white"
              href={social.href}
              target="_blank"
              rel="noreferrer"
            >
              {social.label}
            </a>
          ))}
        </div>
      </Container>
    </footer>
  );
};
