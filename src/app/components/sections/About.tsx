import { Card, CardContent } from "../ui/card";
import { Container } from "../layout/Container";
import { Section } from "../layout/Section";
import { FadeIn, Stagger, StaggerItem } from "../layout/FadeIn";
import { ABOUT_PILLARS, STATS } from "../../data/content";

export function About() {
  return (
    <Section spacing="standard">
      <Container>
        <div className="grid grid-cols-1 items-start gap-16 lg:grid-cols-12 lg:gap-20">
          <FadeIn className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="relative border border-border p-6 md:p-8">
              <div className="absolute left-0 top-0 h-1 w-16 bg-accent" aria-hidden="true" />
              <p className="font-mono-label mb-4 text-[10px] uppercase tracking-widest text-muted-foreground">
                Pipeline
              </p>
              <p className="font-display text-2xl leading-snug text-foreground md:text-3xl">
                &ldquo;Your document becomes a living knowledge source — interrogated, cited, verified.&rdquo;
              </p>
              <p className="font-mono-label mt-6 text-[9px] uppercase tracking-widest text-muted-foreground/60">
                Retrieval-Augmented Generation
              </p>
            </div>
          </FadeIn>

          <div className="flex flex-col gap-12 lg:col-span-7">
            <FadeIn>
              <p className="font-mono-label mb-5 text-[10px] uppercase tracking-widest text-muted-foreground">
                About
              </p>
              <h2 className="mb-6 text-3xl font-semibold leading-tight tracking-tighter text-foreground sm:text-4xl md:text-5xl">
                Documents that think with you
              </h2>
              <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Most documents sit inert — opened once, skimmed, then forgotten in a folder. AI Document
                Copilot changes that. We turn any static file into an interactive knowledge source you
                can interrogate, cross-reference, and build on.
              </p>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="flex flex-col gap-8 border-l-2 border-accent pl-6">
                {ABOUT_PILLARS.map(({ term, abbr, body }) => (
                  <div key={term}>
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <h3 className="text-base font-semibold tracking-tight text-foreground">
                        {term}
                      </h3>
                      <span className="font-mono-label border border-border px-2 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                        {abbr}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
                  </div>
                ))}
              </div>
            </FadeIn>

            <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {STATS.map(({ metric, title, body, tag }) => (
                <StaggerItem key={title}>
                  <Card variant="default" className="h-full">
                    <CardContent className="flex h-full flex-col gap-3">
                      <div className="text-4xl font-semibold leading-none tracking-tighter text-accent md:text-5xl">
                        {metric}
                      </div>
                      <div>
                        <p className="mb-1 text-sm font-semibold text-foreground">{title}</p>
                        <p className="text-xs leading-relaxed text-muted-foreground">{body}</p>
                      </div>
                      <span className="font-mono-label mt-auto text-[9px] uppercase tracking-widest text-muted-foreground">
                        {tag}
                      </span>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      </Container>
    </Section>
  );
}
