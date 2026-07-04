import { useState, useCallback, useRef, type DragEvent, type ChangeEvent } from "react";
import { Upload, Shield, Zap, BookCheck, ArrowRight } from "lucide-react";
import { Button } from "../ui/button";
import { Container } from "../layout/Container";
import { FadeIn } from "../layout/FadeIn";
import { HERO_STEPS } from "../../data/content";

export function Hero() {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setFileName(file.name);
  }, []);

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFileName(file.name);
  }, []);

  return (
    <header className="relative overflow-hidden pt-14 md:pt-16">
      {/* Decorative background type — sits behind left column */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-4 top-32 hidden select-none font-sans text-[8rem] font-bold leading-none tracking-tighter text-border/30 lg:block xl:text-[10rem]"
      >
        DOC
      </div>

      <Container className="relative pt-12 pb-20 md:pt-16 md:pb-24 lg:pt-20 lg:pb-28">
        <FadeIn>
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-12 xl:gap-16">
            {/* Left — headline & copy */}
            <div className="flex flex-col items-start gap-6 md:gap-8 lg:col-span-7">
              <p className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">
                Now in public beta — no account required
              </p>

              <h1 className="text-4xl font-semibold leading-tight tracking-tighter text-foreground sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl 2xl:text-7xl">
                Understand Any
                <br />
                <span className="text-accent">Document</span> with AI
              </h1>

              <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Upload a PDF, DOCX, or TXT file and ask questions in plain language.
                Every answer is grounded in AI-backed citations — no hallucinations,
                no guessing.
              </p>

              <div className="flex flex-wrap gap-x-8 gap-y-4 pt-2 lg:pt-4">
                {[
                  { icon: Shield, label: "Secure Upload", sub: "AES-256 encrypted" },
                  { icon: Zap, label: "AI Powered", sub: "GPT-4o · Claude 3.5" },
                  { icon: BookCheck, label: "Source Verified", sub: "Inline citations" },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="flex items-center gap-3">
                    <Icon className="size-4 text-accent" strokeWidth={1.5} />
                    <div>
                      <p className="text-xs font-medium text-foreground">{label}</p>
                      <p className="font-mono-label text-[10px] text-muted-foreground">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — upload zone */}
            <div
              className="w-full lg:col-span-5"
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div
                className={[
                  "relative cursor-pointer border transition-colors duration-200",
                  dragActive
                    ? "border-accent bg-muted"
                    : "border-border bg-input hover:border-border-hover",
                ].join(" ")}
                onClick={() => inputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label="Upload document"
                onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="sr-only"
                  onChange={handleFileChange}
                />

                <div className="flex flex-col items-center gap-4 px-5 py-10 md:px-8 md:py-12">
                  <div className="flex size-12 items-center justify-center border border-border bg-background md:size-14">
                    <Upload className="size-5 text-muted-foreground" strokeWidth={1.5} />
                  </div>

                  {fileName ? (
                    <div className="flex flex-col items-center gap-1 text-center">
                      <p className="text-sm font-medium text-foreground">{fileName}</p>
                      <p className="text-xs text-muted-foreground">Ready to analyze</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-center">
                      <p className="text-sm font-medium text-foreground">
                        Drag and drop your document here
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF, DOCX, TXT up to 100 MB
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-center gap-4">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        inputRef.current?.click();
                      }}
                    >
                      Choose File
                      <ArrowRight className="size-4" strokeWidth={1.5} />
                    </Button>
                    {fileName && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFileName(null);
                        }}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>

                <div className="absolute left-0 top-0 h-1 w-16 bg-accent" aria-hidden="true" />
              </div>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.15} className="mt-24 md:mt-32">
          <div className="mb-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">
              How it works
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-3">
            {HERO_STEPS.map(({ step, title, body }) => (
              <div
                key={step}
                className="group bg-background px-6 py-8 transition-colors duration-200 hover:bg-muted md:px-8"
              >
                <p className="font-mono-label mb-4 text-[10px] uppercase tracking-widest text-muted-foreground transition-colors duration-150 group-hover:text-accent">
                  {step}
                </p>
                <h3 className="mb-2 text-base font-semibold tracking-tight text-foreground">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </FadeIn>
      </Container>
    </header>
  );
}
