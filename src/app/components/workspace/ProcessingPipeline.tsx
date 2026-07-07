import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  Loader2, 
  Upload, 
  Binary, 
  Cpu, 
  Network, 
  CheckCircle2, 
  Database,
  Eye
} from "lucide-react";
import { DocumentStatus } from "../../types/document";

interface Props {
  status: DocumentStatus;
  fileName: string;
  fileSize: number;
}

export function ProcessingPipeline({ status, fileName, fileSize }: Props) {
  const steps = [
    {
      id: DocumentStatus.UPLOADING,
      label: "Upload Document",
      icon: Upload,
      activeDesc: "Uploading file payload to session cache...",
      detail: "Creating AES-256 secure memory partition...",
      progressVal: 15,
    },
    {
      id: DocumentStatus.EXTRACTING_CONTENT,
      label: "Extract Content",
      icon: Binary,
      activeDesc: "Parsing UTF-8 bytes and loading layout models...",
      detail: "Grounded semantic paragraph chunking in progress...",
      progressVal: 40,
    },
    {
      id: DocumentStatus.EXTRACTING_METADATA,
      label: "Extract Metadata",
      icon: Cpu,
      activeDesc: "Calculating reading index parameters...",
      detail: "Wordcount, token mapping, and estimated reading time resolution...",
      progressVal: 65,
    },
    {
      id: DocumentStatus.GENERATING_INSIGHTS,
      label: "Generate Insights",
      icon: Network,
      activeDesc: "Executing RAG model pipelines...",
      detail: "Extracting executive summary, locations, and timeline entities...",
      progressVal: 90,
    },
    {
      id: DocumentStatus.READY,
      label: "Display in Workspace",
      icon: Eye,
      activeDesc: "Syncing workspace cache...",
      detail: "Binding chat copilot context grounded references...",
      progressVal: 100,
    },
  ];

  const activeIdx = steps.findIndex((step) => step.id === status);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const currentProgress = steps[activeIdx]?.progressVal ?? 0;

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12 select-none relative overflow-hidden h-full">
      {/* Dynamic ambient background glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[450px] rounded-full bg-[#ff3d00]/[0.025] blur-[100px] transition-all duration-700" />

      {/* Main glass card container */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0, 0, 1] }}
        className="w-full max-w-[500px] border border-border bg-card/80 backdrop-blur-md p-8 relative rounded-sm shadow-2xl"
      >
        {/* Card border accent line */}
        <div className="absolute left-0 top-0 h-[1.5px] w-12 bg-[#ff3d00]" />

        {/* Header containing File Name & Size */}
        <div className="mb-6 flex items-start justify-between border-b border-border/60 pb-5">
          <div className="min-w-0 pr-4">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#ff3d00]">
              Ingestion Pipeline
            </span>
            <h3 className="mt-1 truncate text-sm font-semibold tracking-tight text-foreground">
              {fileName}
            </h3>
            <p className="mt-0.5 font-mono text-[9px] text-muted-foreground">
              {formatSize(fileSize)}
            </p>
          </div>
          <div className="flex shrink-0 items-center justify-center border border-border bg-secondary p-2.5">
            <FileText className="size-5 text-muted-foreground" strokeWidth={1.25} />
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              Total Progress
            </span>
            <span className="font-mono text-[10px] font-semibold text-[#ff3d00]">
              {currentProgress}%
            </span>
          </div>
          <div className="h-[2px] w-full bg-secondary overflow-hidden rounded-full">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: `${currentProgress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-[#ff3d00] to-[#ff6633]"
            />
          </div>
        </div>

        {/* Steps List */}
        <div className="relative flex flex-col gap-6">
          {steps.map((step, idx) => {
            const isCompleted = idx < activeIdx;
            const isActive = idx === activeIdx;
            const isPending = idx > activeIdx;
            const StepIcon = step.icon;

            return (
              <div key={step.id} className="relative flex gap-4 items-start group">
                {/* Connecting lines between steps */}
                {idx !== steps.length - 1 && (
                  <div 
                    className={`absolute left-4 top-8 bottom-[-16px] w-[1px] ${
                      isCompleted ? "bg-[#ff3d00]" : "bg-border"
                    } transition-colors duration-300`} 
                  />
                )}

                {/* Circle Icon Container */}
                <div className="relative flex size-8 shrink-0 items-center justify-center">
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="flex size-6 items-center justify-center rounded-full bg-[#ff3d00]/10 border border-[#ff3d00]"
                    >
                      <CheckCircle2 className="size-3.5 text-[#ff3d00]" strokeWidth={2.5} />
                    </motion.div>
                  ) : isActive ? (
                    <div className="flex size-7 items-center justify-center rounded-full bg-[#ff3d00]/15 border border-[#ff3d00] relative">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        className="absolute inset-0 rounded-full border border-t-[#ff3d00] border-r-transparent border-b-transparent border-l-transparent"
                      />
                      <StepIcon className="size-3.5 text-[#ff3d00] animate-pulse" strokeWidth={1.5} />
                    </div>
                  ) : (
                    <div className="flex size-6 items-center justify-center rounded-full border border-border bg-secondary">
                      <StepIcon className="size-3 text-muted-foreground/60" strokeWidth={1.5} />
                    </div>
                  )}
                </div>

                {/* Step Metadata Texts */}
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-center justify-between">
                    <span 
                      className={`text-xs font-semibold tracking-tight transition-colors duration-200 ${
                        isActive ? "text-foreground" : isCompleted ? "text-muted-foreground/80" : "text-muted-foreground/45"
                      }`}
                    >
                      {step.label}
                    </span>
                    {isActive && (
                      <span className="font-mono text-[9px] uppercase tracking-wider text-[#ff3d00] animate-pulse">
                        Active
                      </span>
                    )}
                  </div>
                  
                  {/* Expand active descriptor / subtext */}
                  {isActive ? (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-1 overflow-hidden"
                    >
                      <p className="text-[10px] text-[#ff3d00] leading-relaxed">
                        {step.activeDesc}
                      </p>
                      <p className="text-[9px] text-muted-foreground leading-relaxed mt-0.5">
                        {step.detail}
                      </p>
                    </motion.div>
                  ) : isCompleted ? (
                    <p className="text-[9px] text-muted-foreground/60 mt-0.5 leading-relaxed truncate">
                      Completed successfully
                    </p>
                  ) : (
                    <p className="text-[9px] text-muted-foreground/30 mt-0.5 leading-relaxed truncate">
                      Queue pending
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Floating Processing latency disclaimer */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 0.5 }}
        className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground mt-8"
      >
        Initializing vector workspace indexes · AES-256 session mapping
      </motion.p>
    </div>
  );
}
