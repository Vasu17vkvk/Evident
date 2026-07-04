import { ArrowRight } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Container } from "../layout/Container";
import { Section } from "../layout/Section";
import { FadeIn, Stagger, StaggerItem } from "../layout/FadeIn";
import { FEATURES } from "../../data/content";

export function Features() {
  return (
    <Section id="features">
      <Container>
        <FadeIn className="mb-16 max-w-2xl md:mb-20 lg:mb-24">
          <p className="font-mono-label mb-5 text-[10px] uppercase tracking-widest text-muted-foreground">
            Capabilities
          </p>
          <h2 className="mb-5 text-3xl font-semibold leading-tight tracking-tighter text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
            Everything you need to master any document
          </h2>
          <p className="max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
            Six tightly integrated tools built around a single idea — your document
            is the source of truth, and the AI keeps it that way.
          </p>
        </FadeIn>

        <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {FEATURES.map(({ icon: Icon, title, description, tag }, i) => (
            <StaggerItem key={title}>
              <Card className="h-full hover:bg-muted">
                <CardHeader className="relative">
                  <span className="font-mono-label absolute right-0 top-0 text-[9px] text-muted-foreground/50">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Icon className="size-6 text-accent md:size-7" strokeWidth={1.5} />
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-2">
                  <CardTitle className="text-base md:text-lg">{title}</CardTitle>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </CardContent>
                <CardFooter className="border-t border-border pt-4">
                  <span className="font-mono-label text-[9px] uppercase tracking-widest text-muted-foreground">
                    {tag}
                  </span>
                </CardFooter>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>

        <FadeIn className="mt-16 flex flex-col items-start justify-between gap-6 border-t border-border pt-10 sm:flex-row sm:items-center">
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground md:text-base">
            All features are available from day one — no add-ons, no gated tiers.
          </p>
          <Button>
            Start for free
            <ArrowRight className="size-4" strokeWidth={1.5} />
          </Button>
        </FadeIn>
      </Container>
    </Section>
  );
}
