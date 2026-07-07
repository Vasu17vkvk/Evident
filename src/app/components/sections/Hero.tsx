import {
  useState,
  useCallback,
  useRef,
  type DragEvent,
  type ChangeEvent,
} from "react";
import { useNavigate } from "react-router";
import {
  Upload,
  Shield,
  Zap,
  BookCheck,
  ArrowRight,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Container } from "../layout/Container";
import { FadeIn } from "../layout/FadeIn";
import { HERO_STEPS } from "../../data/content";
import { useDocument } from "../../hooks/useDocument";

/* ── Validation constants ─────────────────────── */
const ALLOWED_EXTENSIONS = ["pdf", "docx", "txt"];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

type UploadState = "idle" | "validating" | "uploading" | "success" | "error";

interface ValidationError {
  message: string;
}

/* ── Validation helper ────────────────────────── */
function validateFile(file: File): ValidationError | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      message: `Unsupported file type ".${ext}". Please upload a PDF, DOCX, or TXT file.`,
    };
  }
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      message: `File is ${sizeMB} MB. Maximum allowed size is 100 MB.`,
    };
  }
  if (file.size === 0) {
    return { message: "This file appears to be empty. Please choose another." };
  }
  return null;
}

/* ── Format file size ─────────────────────────── */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ── Slugify file name for URL ─────────────────── */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.[^/.]+$/, "") // strip extension
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumeric → dash
    .replace(/^-+|-+$/g, ""); // trim leading/trailing dashes
}

export function Hero() {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { uploadDocument } = useDocument();

  /* ── Core upload handler ────────────────────── */
  const startUpload = useCallback(
    (file: File) => {
      setErrorMsg(null);
      setUploadState("validating");

      // Simulate validation step
      setTimeout(() => {
        const error = validateFile(file);
        if (error) {
          setUploadState("error");
          setErrorMsg(error.message);
          toast.error(error.message);
          return;
        }

        // Validation passed → begin "upload" animation
        setUploadState("uploading");
        setProgress(0);

        // Simulate upload progress (no real backend / S3 yet)
        const interval = setInterval(() => {
          setProgress((p) => {
            if (p >= 100) {
              clearInterval(interval);
              return 100;
            }
            return p + Math.random() * 18 + 6;
          });
        }, 180);

        // When progress completes, store the doc and navigate
        const finishTimer = setTimeout(() => {
          setProgress(100);
          setUploadState("success");

          // Persist the file in context so the workspace can read it
          uploadDocument(file);

          // Build the document ID slug from the file name
          const documentId = slugify(file.name) || "document";

          // Brief success state, then redirect
          setTimeout(() => {
            navigate(`/workspace/${documentId}`);
          }, 650);
        }, 1400);

        // Cleanup on unmount
        return () => {
          clearInterval(interval);
          clearTimeout(finishTimer);
        };
      }, 500);
    },
    [navigate, uploadDocument]
  );

  /* ── Drag handlers ──────────────────────────── */
  const handleDrag = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
        setSelectedFile(file);
        startUpload(file);
      }
    },
    [startUpload]
  );

  /* ── File input change ─────────────────────── */
  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setSelectedFile(file);
        startUpload(file);
      }
      // Reset input so the same file can be re-selected later
      e.target.value = "";
    },
    [startUpload]
  );

  /* ── Reset to idle ─────────────────────────── */
  const resetUpload = useCallback(() => {
    setSelectedFile(null);
    setUploadState("idle");
    setErrorMsg(null);
    setProgress(0);
  }, []);

  const isBusy = uploadState === "validating" || uploadState === "uploading";
  const isSuccess = uploadState === "success";
  const isError = uploadState === "error";

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
              onDragEnter={isBusy ? undefined : handleDrag}
              onDragLeave={isBusy ? undefined : handleDrag}
              onDragOver={isBusy ? undefined : handleDrag}
              onDrop={isBusy ? undefined : handleDrop}
            >
              <div
                className={[
                  "relative border transition-colors duration-200",
                  isBusy
                    ? "border-accent bg-muted cursor-wait"
                    : isSuccess
                      ? "border-accent bg-muted"
                      : isError
                        ? "border-destructive bg-muted"
                        : dragActive
                          ? "border-accent bg-muted cursor-pointer"
                          : "border-border bg-input hover:border-border-hover cursor-pointer",
                ].join(" ")}
                onClick={() => !isBusy && !isSuccess && inputRef.current?.click()}
                role="button"
                tabIndex={isBusy ? -1 : 0}
                aria-label="Upload document"
                onKeyDown={(e) =>
                  !isBusy && !isSuccess && e.key === "Enter" && inputRef.current?.click()
                }
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="sr-only"
                  onChange={handleFileChange}
                  disabled={isBusy}
                />

                <div className="flex flex-col items-center gap-4 px-5 py-10 md:px-8 md:py-12">
                  {/* ── Icon state ─────────────────────── */}
                  {uploadState === "idle" && (
                    <div className="flex size-12 items-center justify-center border border-border bg-background md:size-14">
                      <Upload className="size-5 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                  )}

                  {uploadState === "validating" && (
                    <div className="flex size-12 items-center justify-center border border-accent bg-background md:size-14">
                      <Loader2 className="size-5 animate-spin text-accent" strokeWidth={1.5} />
                    </div>
                  )}

                  {uploadState === "uploading" && (
                    <div className="flex size-12 items-center justify-center border border-accent bg-background md:size-14">
                      <Loader2 className="size-5 animate-spin text-accent" strokeWidth={1.5} />
                    </div>
                  )}

                  {uploadState === "success" && (
                    <div className="flex size-12 items-center justify-center border border-accent bg-background md:size-14">
                      <CheckCircle2 className="size-5 text-accent" strokeWidth={1.5} />
                    </div>
                  )}

                  {uploadState === "error" && (
                    <div className="flex size-12 items-center justify-center border border-destructive bg-background md:size-14">
                      <AlertCircle className="size-5 text-destructive" strokeWidth={1.5} />
                    </div>
                  )}

                  {/* ── Text / status state ───────────── */}
                  {uploadState === "idle" && (
                    <div className="flex flex-col items-center gap-1.5 text-center">
                      <p className="text-sm font-medium text-foreground">
                        Drag and drop your document here
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF, DOCX, TXT up to 100 MB
                      </p>
                    </div>
                  )}

                  {uploadState === "validating" && (
                    <div className="flex flex-col items-center gap-1 text-center">
                      <p className="text-sm font-medium text-foreground">Validating file…</p>
                      <p className="text-xs text-muted-foreground">Checking format and size</p>
                    </div>
                  )}

                  {uploadState === "uploading" && selectedFile && (
                    <div className="flex w-full flex-col items-center gap-3 text-center">
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 text-accent" strokeWidth={1.5} />
                        <p className="text-sm font-medium text-foreground">
                          {selectedFile.name}
                        </p>
                      </div>
                      <p className="font-mono-label text-[10px] text-muted-foreground">
                        {formatSize(selectedFile.size)} · Uploading to secure storage…
                      </p>

                      {/* Progress bar */}
                      <div className="mt-1 h-1 w-full max-w-[240px] overflow-hidden bg-border">
                        <div
                          className="h-full bg-accent transition-all duration-200 ease-out"
                          style={{ width: `${Math.min(100, progress)}%` }}
                        />
                      </div>
                      <p className="font-mono-label text-[10px] text-muted-foreground">
                        {Math.min(100, Math.round(progress))}%
                      </p>
                    </div>
                  )}

                  {uploadState === "success" && selectedFile && (
                    <div className="flex flex-col items-center gap-1 text-center">
                      <p className="text-sm font-medium text-foreground">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-accent">Upload complete — opening workspace…</p>
                    </div>
                  )}

                  {uploadState === "error" && (
                    <div className="flex flex-col items-center gap-1 text-center">
                      <p className="text-sm font-medium text-foreground">Upload failed</p>
                      <p className="text-xs text-destructive">{errorMsg}</p>
                    </div>
                  )}

                  {/* ── Action buttons ─────────────────── */}
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    {uploadState === "idle" && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          inputRef.current?.click();
                        }}
                      >
                        Choose File
                        <ArrowRight className="size-4" strokeWidth={1.5} />
                      </Button>
                    )}

                    {(uploadState === "error") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          resetUpload();
                        }}
                      >
                        <X className="size-4" strokeWidth={1.5} />
                        Try Again
                      </Button>
                    )}

                    {isSuccess && (
                      <div className="flex items-center gap-2 font-mono-label text-[10px] uppercase tracking-widest text-accent">
                        <Loader2 className="size-3 animate-spin" strokeWidth={1.5} />
                        Redirecting
                      </div>
                    )}
                  </div>
                </div>

                {/* Accent bar — changes color with state */}
                <div
                  className={[
                    "absolute left-0 top-0 h-1 w-16 transition-colors duration-200",
                    isError ? "bg-destructive" : "bg-accent",
                  ].join(" ")}
                  aria-hidden="true"
                />
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
