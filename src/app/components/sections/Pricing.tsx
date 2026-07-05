import { useState } from "react";
import { Check, HelpCircle, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import { Container } from "../layout/Container";
import { Section } from "../layout/Section";
import { FadeIn, Stagger, StaggerItem } from "../layout/FadeIn";
import { PRICING_PLANS } from "../../data/content";

export function Pricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annually">("annually");

  return (
    <Section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28">
      {/* Dynamic Background Gradients */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]" />
      
      <Container className="relative">
        {/* Header */}
        <FadeIn className="mx-auto mb-16 max-w-3xl text-center md:mb-24">
          <p className="font-mono-label mb-5 text-[10px] uppercase tracking-widest text-accent">
            Pricing Plans
          </p>
          <h1 className="mb-6 text-4xl font-semibold leading-none tracking-tighter text-foreground sm:text-5xl md:text-6xl">
            Simple, Transparent Pricing
          </h1>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Choose the tier that matches your research workload. All plans include accurate vector indexing and inline citation guarantees.
          </p>

          {/* Toggle Billing Cycle */}
          <div className="mt-10 flex items-center justify-center gap-4">
            <span className={`text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${billingCycle === "monthly" ? "text-foreground" : "text-muted-foreground"}`}>
              Billed Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === "monthly" ? "annually" : "monthly")}
              className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-muted transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              role="switch"
              aria-checked={billingCycle === "annually"}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-foreground shadow-lg ring-0 transition duration-200 ease-in-out ${
                  billingCycle === "annually" ? "translate-x-5 bg-accent" : "translate-x-0"
                }`}
              />
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${billingCycle === "annually" ? "text-foreground" : "text-muted-foreground"}`}>
                Billed Annually
              </span>
              <span className="font-mono-label inline-flex items-center rounded border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-accent animate-pulse">
                Save 20%
              </span>
            </div>
          </div>
        </FadeIn>

        {/* Pricing Cards Grid */}
        <Stagger className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3 md:gap-4 lg:gap-6">
          {PRICING_PLANS.map((plan) => {
            const isProfessional = plan.highlighted;
            const price = billingCycle === "monthly" ? plan.priceMonthly : plan.priceAnnually;

            return (
              <StaggerItem key={plan.name} className="h-full">
                <div
                  className={`group relative flex h-full flex-col border transition-all duration-300 ${
                    isProfessional
                      ? "border-accent bg-card/60 backdrop-blur-sm"
                      : "border-border bg-input/40 hover:border-border-hover hover:bg-input/60"
                  }`}
                >
                  {/* Decorative Border Glow for Pro Plan */}
                  {isProfessional && (
                    <div className="absolute left-0 top-0 h-[3px] w-full bg-accent" />
                  )}

                  {/* Header content */}
                  <div className="p-6 pb-0 md:p-8 md:pb-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
                        {plan.name}
                      </h3>
                      {isProfessional && (
                        <span className="font-mono-label flex items-center gap-1 border border-accent/40 bg-accent/10 px-2 py-0.5 text-[9px] uppercase tracking-widest text-accent">
                          <Sparkles className="size-2.5" />
                          Most Popular
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground min-h-[40px]">
                      {plan.description}
                    </p>
                    
                    {/* Pricing value */}
                    <div className="mt-6 flex items-baseline gap-1">
                      <span className="text-4xl font-bold tracking-tighter text-foreground md:text-5xl">
                        ${price}
                      </span>
                      <span className="font-mono-label text-[10px] text-muted-foreground">
                        / month
                      </span>
                    </div>
                    {billingCycle === "annually" && price > 0 && (
                      <p className="font-mono-label mt-1.5 text-[9px] tracking-wide text-accent/80">
                        Billed annually (${price * 12}/yr)
                      </p>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="my-6 border-t border-border/80" />

                  {/* Features list */}
                  <div className="flex-1 px-6 md:px-8">
                    <p className="font-mono-label mb-4 text-[9px] uppercase tracking-widest text-muted-foreground">
                      Includes:
                    </p>
                    <ul className="flex flex-col gap-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3 text-xs">
                          <Check className="size-4 shrink-0 text-accent pt-0.5" strokeWidth={2.5} />
                          <span className="leading-normal text-muted-foreground group-hover:text-foreground/90 transition-colors duration-150">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Footer Action Button */}
                  <div className="p-6 md:p-8">
                    <Button
                      variant={isProfessional ? "default" : "outline"}
                      className="w-full text-xs font-semibold py-5"
                    >
                      {plan.cta}
                    </Button>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>

        {/* Feature Comparison or FAQ section */}
        <FadeIn className="mt-24 border-t border-border pt-16 md:mt-32">
          <div className="mx-auto max-w-4xl">
            <h3 className="mb-10 text-center text-xl font-semibold tracking-tight text-foreground md:text-2xl">
              Frequently Asked Questions
            </h3>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-10">
              {[
                {
                  q: "How does the document citation engine work?",
                  a: "Our vector pipeline processes your uploads into overlapping chunk nodes. When a generative question is executed, the closest segments are fed directly into the model context. The model generates answers referencing source IDs, which are styled as interactive citations pointing to precise pages."
                },
                {
                  q: "Can I cancel or change my plan anytime?",
                  a: "Yes, you can upgrade, downgrade, or cancel your subscription at any time. When canceling a paid tier, your access will continue until the end of the billing period, then transition back to the Starter plan."
                },
                {
                  q: "Are my uploaded documents secure?",
                  a: "Security is our highest priority. All files are encrypted at rest with AES-256 and in transit via TLS 1.3. For Enterprise clients, we offer dedicated vector collections and full private network isolation."
                },
                {
                  q: "What files are currently supported?",
                  a: "Evident supports PDF (.pdf), Microsoft Word (.docx), and plain text (.txt) files. Support for scans/images (OCR), spreadsheets, and presentation files is currently under active development."
                }
              ].map(({ q, a }, idx) => (
                <div key={idx} className="flex flex-col gap-2">
                  <div className="flex gap-2.5">
                    <HelpCircle className="size-4 shrink-0 text-accent mt-0.5" strokeWidth={1.5} />
                    <h4 className="text-sm font-semibold tracking-tight text-foreground">
                      {q}
                    </h4>
                  </div>
                  <p className="pl-6.5 text-xs leading-relaxed text-muted-foreground">
                    {a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </Container>
    </Section>
  );
}
