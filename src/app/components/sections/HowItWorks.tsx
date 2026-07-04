import { Container } from "../layout/Container";
import { Section } from "../layout/Section";
import { FadeIn, Stagger, StaggerItem } from "../layout/FadeIn";
import { PROCESS_STEPS } from "../../data/content";

export function HowItWorks() {
  return (
    <Section muted spacing="standard">
      <Container>
        <FadeIn className="mb-16 flex flex-col gap-6 md:mb-24 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="font-mono-label mb-5 text-[10px] uppercase tracking-widest text-muted-foreground">
              Process
            </p>
            <h2 className="text-3xl font-semibold leading-tight tracking-tighter text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
              From file to insight in four steps
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground md:text-base lg:text-right">
            No setup. No training runs. Drop a document and the pipeline runs automatically.
          </p>
        </FadeIn>

        <Stagger className="grid grid-cols-1 gap-0 lg:grid-cols-4 lg:gap-8">
          {PROCESS_STEPS.map(({ label, body }, i) => (
            <StaggerItem key={label}>
              <div className="group border-b border-border py-10 last:border-b-0 lg:border-b-0 lg:py-0">
                <div className="mb-6 flex items-center gap-4 lg:flex-col lg:items-start">
                  <span className="font-mono-label flex size-10 shrink-0 items-center justify-center border border-border text-[10px] text-muted-foreground transition-colors duration-150 group-hover:border-accent group-hover:text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="hidden h-px flex-1 bg-border lg:block lg:h-8 lg:w-px lg:flex-none" />
                </div>
                <h3 className="mb-2 text-base font-semibold tracking-tight text-foreground">
                  {label}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        <FadeIn delay={0.2}>
          <p className="font-mono-label mt-16 text-center text-[10px] tracking-wide text-muted-foreground/60 md:mt-20">
            Average indexing time: 8 s · Answer latency: &lt; 2 s · No data retained after session
          </p>
        </FadeIn>
      </Container>
    </Section>
  );
}
