import { ArrowRight } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Container } from "../layout/Container";
import { FadeIn } from "../layout/FadeIn";

const FOOTER_LINKS = {
  Product: ["Features", "Pricing", "Changelog", "API"],
  Company: ["About", "Blog", "Careers", "Contact"],
  Legal: ["Privacy", "Terms", "Security"],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-foreground text-background">
      <Container className="py-20 md:py-28">
        <FadeIn className="mb-16 max-w-2xl">
          <p className="font-mono-label mb-5 text-[10px] uppercase tracking-widest text-background/50">
            Get started
          </p>
          <h2 className="mb-4 text-3xl font-semibold leading-tight tracking-tighter sm:text-4xl md:text-5xl">
            Start reading smarter today
          </h2>
          <p className="mb-8 text-base leading-relaxed text-background/70">
            Join the beta. No credit card, no setup — upload a document and ask your first question in seconds.
          </p>
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
            onSubmit={(e) => e.preventDefault()}
          >
            <Input
              type="email"
              placeholder="you@company.com"
              className="h-12 border-background/30 bg-transparent text-background placeholder:text-background/50 focus-visible:border-accent md:h-14 md:flex-1"
            />
            <Button
              variant="outline"
              className="border-background text-background hover:bg-background hover:text-foreground"
            >
              Request access
              <ArrowRight className="size-4" strokeWidth={1.5} />
            </Button>
          </form>
        </FadeIn>

        <div className="grid grid-cols-2 gap-10 border-t border-background/20 pt-12 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <p className="text-sm font-semibold tracking-tight">Copilot</p>
            <p className="mt-2 text-xs leading-relaxed text-background/50">
              AI document intelligence with verified citations.
            </p>
          </div>
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group}>
              <p className="font-mono-label mb-4 text-[10px] uppercase tracking-widest text-background/40">
                {group}
              </p>
              <ul className="flex flex-col gap-2">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-xs text-background/70 transition-colors duration-150 hover:text-background"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-background/20 pt-8 sm:flex-row sm:items-center">
          <p className="font-mono-label text-[10px] text-background/40">
            © 2026 AI Document Copilot
          </p>
          <p className="font-mono-label text-[10px] text-background/40">
            Built with Bold Typography
          </p>
        </div>
      </Container>
    </footer>
  );
}
