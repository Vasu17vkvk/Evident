import { motion } from "framer-motion";
import {
  AlertCircle,
  RotateCcw,
  Eye,
  FileJson,
  ChevronRight,
} from "lucide-react";
import { Document, DocumentStatus } from "../../types/document";

interface Props {
  document: Document;
  onRetry: () => Promise<void>;
  onOpenAnyway: () => void;
  onViewLogs: () => void;
  isRetrying?: boolean;
}

export function ProcessingErrorDisplay({
  document,
  onRetry,
  onOpenAnyway,
  onViewLogs,
  isRetrying = false,
}: Props) {
  const error = document.processingError;
  const stateWhereTimeout = error?.state || DocumentStatus.Parsing;

  const formatErrorTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12 select-none relative overflow-hidden h-full">
      {/* Dynamic ambient background glow (red tint) */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[450px] rounded-full bg-red-500/[0.02] blur-[100px] transition-all duration-700" />

      {/* Main error card container */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0, 0, 1] }}
        className="w-full max-w-[500px] border border-red-500/30 bg-card/80 backdrop-blur-md p-8 relative rounded-sm shadow-2xl"
      >
        {/* Card border accent line (red) */}
        <div className="absolute left-0 top-0 h-[2px] w-12 bg-red-500" />

        {/* Header with error icon */}
        <div className="mb-6 flex items-start justify-between border-b border-border/60 pb-5">
          <div className="min-w-0 pr-4">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-red-500">
              Processing Failed
            </span>
            <h3 className="mt-1 text-sm font-semibold tracking-tight text-foreground">
              {document.name}
            </h3>
            <p className="mt-0.5 font-mono text-[9px] text-muted-foreground">
              {formatErrorTime(error?.timestamp || Date.now())}
            </p>
          </div>
          <div className="flex shrink-0 items-center justify-center border border-red-500/30 bg-red-500/5 p-2.5 rounded-sm">
            <AlertCircle className="size-5 text-red-500" strokeWidth={1.5} />
          </div>
        </div>

        {/* Error details */}
        <div className="mb-8 space-y-3">
          {/* Error message */}
          <div className="rounded-sm border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-[13px] leading-relaxed text-foreground">
              {error?.message || "An unexpected error occurred during document processing."}
            </p>
          </div>

          {/* Error context */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                Error Code
              </span>
              <span className="font-mono text-[10px] font-semibold text-red-500/80">
                {error?.code || "UNKNOWN"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                Failed State
              </span>
              <span className="font-mono text-[10px] font-semibold text-foreground">
                {stateWhereTimeout}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          {/* Retry Processing */}
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="group flex items-center justify-between border border-red-500/40 bg-red-500/10 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.15em] text-red-500 transition-all duration-150 hover:border-red-500/60 hover:bg-red-500/15 disabled:opacity-50 disabled:cursor-not-allowed rounded-sm"
          >
            <span className="flex items-center gap-2">
              <RotateCcw className="size-3.5 transition-transform group-hover:rotate-180" strokeWidth={1.5} />
              {isRetrying ? "Retrying..." : "Retry Processing"}
            </span>
            <ChevronRight className="size-3 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" strokeWidth={2} />
          </button>

          {/* Open Anyway */}
          {document.content?.fullText || document.pagesContent?.length ? (
            <button
              onClick={onOpenAnyway}
              className="group flex items-center justify-between border border-amber-500/40 bg-amber-500/10 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.15em] text-amber-600 transition-all duration-150 hover:border-amber-500/60 hover:bg-amber-500/15 rounded-sm"
            >
              <span className="flex items-center gap-2">
                <Eye className="size-3.5 transition-transform" strokeWidth={1.5} />
                Open Anyway
              </span>
              <ChevronRight className="size-3 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" strokeWidth={2} />
            </button>
          ) : null}

          {/* View Logs */}
          <button
            onClick={onViewLogs}
            className="group flex items-center justify-between border border-border px-4 py-3 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground transition-all duration-150 hover:text-foreground hover:border-border/60 rounded-sm"
          >
            <span className="flex items-center gap-2">
              <FileJson className="size-3.5" strokeWidth={1.5} />
              View Logs
            </span>
            <ChevronRight className="size-3 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" strokeWidth={2} />
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-6 border-t border-border/40 pt-4">
          <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground/40">
            Processing took longer than expected (15 second timeout)
          </p>
        </div>
      </motion.div>

      {/* Floating disclaimer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 0.5 }}
        className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground mt-8"
      >
        Check your network connection and file size
      </motion.p>
    </div>
  );
}
