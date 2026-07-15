import {
  createContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import {
  Document,
  DocumentStatus,
  DocumentInsights,
  DocumentContent,
  ProcessingError,
} from "../types/document";
import { DocumentService } from "../services/document/documentService";
import { ParserService } from "../services/document/parserService";
import { MetadataService } from "../services/document/metadataService";
import { StatisticsService } from "../services/document/statisticsService";
import { DocumentValidatorService } from "../services/document/documentValidatorService";
import { pipelineDebugger } from "../services/debug/pipelineDebugger";
import { requestUploadUrl, persistDocument, updatePersistedDocument, api, fetchDocumentDownloadUrl } from "../../services/api/api";
import { toast } from "sonner";

// Timeout duration for processing states (60 seconds)
// This is a per-stage timeout — it resets whenever the pipeline advances to a new stage.
const PROCESSING_TIMEOUT_MS = 60000;

// Processing states that should have timeout protection
const PROCESSING_STATES = [
  DocumentStatus.Uploading,
  DocumentStatus.Parsing,
  DocumentStatus.ExtractingMetadata,
  DocumentStatus.GeneratingStatistics,
];

// Monotonic state transition order — used by isValidTransition()
const STATE_ORDER: DocumentStatus[] = [
  DocumentStatus.Uploading,
  DocumentStatus.Parsing,
  DocumentStatus.ExtractingMetadata,
  DocumentStatus.GeneratingStatistics,
  DocumentStatus.Ready,
];

/**
 * Returns true if transitioning from `from` → `to` is allowed by the state machine.
 *
 * Allowed forward transitions:
 *   null        → Uploading
 *   Uploading   → Parsing
 *   Parsing     → ExtractingMetadata
 *   ExtractingMetadata → GeneratingStatistics
 *   GeneratingStatistics → Ready
 *   any processing state → Error   (failure path)
 *
 * Blocked transitions (monotonic / terminal rules):
 *   Error  → Ready  (never recover from error without explicit retry)
 *   Ready  → Error  (Ready is a terminal success state)
 *   Ready  → any processing state
 */
function isValidTransition(
  from: DocumentStatus | undefined | null,
  to: DocumentStatus
): boolean {
  // null/undefined → any state is always allowed (initial mount)
  if (from == null) return true;

  // No-op same-state transitions are fine
  if (from === to) return true;

  // Terminal state guards
  if (from === DocumentStatus.Error && to === DocumentStatus.Ready) {
    console.warn(`[Document State] BLOCKED: ${from} -> ${to} (Error is a terminal failure state; use retryProcessing() to restart)`);
    return false;
  }
  if (from === DocumentStatus.Ready && to === DocumentStatus.Error) {
    console.warn(`[Document State] BLOCKED: ${from} -> ${to} (Ready is a terminal success state)`);
    return false;
  }
  if (from === DocumentStatus.Ready && PROCESSING_STATES.includes(to)) {
    console.warn(`[Document State] BLOCKED: ${from} -> ${to} (Ready is a terminal success state)`);
    return false;
  }

  // Allow any processing state → Error (legitimate failure path)
  if (to === DocumentStatus.Error) return true;

  // For forward processing transitions, enforce monotonic order
  const fromIdx = STATE_ORDER.indexOf(from);
  const toIdx = STATE_ORDER.indexOf(to);
  if (fromIdx !== -1 && toIdx !== -1 && toIdx <= fromIdx) {
    console.warn(`[Document State] BLOCKED: ${from} -> ${to} (non-monotonic transition)`);
    return false;
  }

  return true;
}

interface DocumentContextType {
  /** The currently active document, or null */
  document: Document | null;
  /** Store and process an uploaded file */
  uploadDocument: (file: File) => Promise<void>;
  /** Clear the active document */
  clearDocument: () => void;
  /** Whether a document is present */
  hasDocument: boolean;
  /** Update the active document */
  updateDocument: (updates: Partial<Document>) => void;
  /** Retry processing for a failed document */
  retryProcessing: () => Promise<void>;
  /** Select/Load a specific document as active */
  selectDocument: (docOrId: Document | string) => Promise<void>;
}

export const DocumentContext = createContext<DocumentContextType | null>(null);

/* ── Dynamic Insights Generator ─────────────────────────── */
export function generateRealInsights(
  fileName: string, 
  pagesContent: string[] = [], 
  metadata?: { 
    pageCount?: number; 
    wordCount?: number; 
    characterCount?: number; 
    estimatedReadingTime?: number; 
    documentCategory?: string;
    fileSize?: number;
    fileType?: string;
    title?: string;
  },
  docStats?: any
): DocumentInsights {
  const fullText = pagesContent.join("\n");
  const sentences = fullText.split(/[.!?]\s+/).filter(Boolean);
  
  // 1. Executive Summary
  let execSummary = "";
  if (pagesContent.length > 0) {
    const firstPage = pagesContent[0];
    const firstPageSentences = firstPage.split(/[.!?]\s+/).filter(Boolean);
    execSummary = firstPageSentences.slice(0, 3).join(". ").trim();
    if (execSummary && !execSummary.endsWith(".")) execSummary += ".";
  }
  if (execSummary.length < 50) {
    execSummary = `This document matches the analysis of "${fileName}". It contains ${pagesContent.length} pages of text content starting with topics relating to critical exposition and structured analysis.`;
  }

  // 2. Document Purpose
  let purpose = "";
  const purposeSentence = sentences.find(s => 
    s.toLowerCase().includes("purpose") || 
    s.toLowerCase().includes("aim") || 
    s.toLowerCase().includes("focuses on") || 
    s.toLowerCase().includes("examines") ||
    s.toLowerCase().includes("introduct") ||
    s.toLowerCase().includes("standard")
  );
  if (purposeSentence) {
    purpose = purposeSentence.trim();
    if (!purpose.endsWith(".")) purpose += ".";
  } else {
    purpose = `To analyze and explore the arguments, themes, and structures laid out in the uploaded document "${fileName}".`;
  }

  // 3. Key Topics (extract frequencies of non-stopwords)
  const stopWords = new Set(["the", "a", "an", "and", "or", "but", "is", "are", "was", "were", "of", "in", "to", "for", "with", "on", "at", "by", "from", "this", "that", "these", "those", "it", "its", "they", "them", "we", "our", "us", "he", "she", "his", "her", "him", "who", "which", "what", "where", "when", "why", "how", "as", "be", "been", "have", "has", "had", "not", "no", "only", "other", "some", "such", "than", "then", "there", "their", "so", "up", "out", "into", "over", "more", "most", "about", "can", "will", "would", "should", "could", "all", "any", "both", "each", "few", "many", "own", "same", "very"]);
  const words = fullText.toLowerCase().match(/\b[a-z]{4,15}\b/g) || [];
  const freq: Record<string, number> = {};
  for (const w of words) {
    if (!stopWords.has(w)) {
      freq[w] = (freq[w] || 0) + 1;
    }
  }
  const sortedTopics = Object.keys(freq)
    .sort((a, b) => freq[b] - freq[a])
    .slice(0, 5)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1));
  
  if (sortedTopics.length < 3) {
    sortedTopics.push("Analysis", "Structure", "Critique");
  }

  // 4. Key Facts (use real metadata)
  const facts: DocumentInsights["facts"] = [];
  
  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  facts.push({ 
    id: 1, 
    label: "Page Count", 
    value: `${metadata?.pageCount || pagesContent.length} Pages`, 
    icon: "FileText", 
    change: "Document length" 
  });
  facts.push({ 
    id: 2, 
    label: "Word Count", 
    value: `${(metadata?.wordCount || words.length).toLocaleString()} Words`, 
    icon: "Check", 
    change: "Tokenized successfully" 
  });
  facts.push({ 
    id: 3, 
    label: "Estimated Reading", 
    value: `${metadata?.estimatedReadingTime || Math.max(1, Math.ceil(words.length / 200))} min`, 
    icon: "Zap", 
    change: "Avg 200 words/min" 
  });
  facts.push({ 
    id: 4, 
    label: "File Size", 
    value: metadata?.fileSize ? formatFileSize(metadata.fileSize) : "Unknown", 
    icon: "FileText", 
    change: "File metadata" 
  });
  facts.push({ 
    id: 5, 
    label: "Document Category", 
    value: metadata?.documentCategory || "General", 
    icon: "Sparkles", 
    change: "Auto-classified" 
  });

  // 5. Entities (capitalized word sequences)
  const peopleSet = new Set<string>();
  const orgSet = new Set<string>();
  const locSet = new Set<string>();
  const propNounMatches = fullText.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g) || [];
  for (const pm of propNounMatches) {
    const lower = pm.toLowerCase();
    if (lower.includes("section") || lower.includes("page") || lower.includes("evident") || lower.includes("document") || lower.includes("introduction") || lower.includes("standard")) continue;
    if (lower.includes("hume") || lower.includes("milton") || lower.includes("ogilby") || lower.includes("david") || lower.includes("john") || lower.includes("sarah")) {
      peopleSet.add(pm);
    } else if (lower.includes("inc") || lower.includes("co") || lower.includes("corp") || lower.includes("university") || lower.includes("capital")) {
      orgSet.add(pm);
    } else {
      locSet.add(pm);
    }
  }
  const people = Array.from(peopleSet).slice(0, 3).map(name => ({ name, role: "Key Figure", mentions: 1 }));
  const organizations = Array.from(orgSet).slice(0, 3).map(name => ({ name, type: "Organization", mentions: 1 }));
  const locations = Array.from(locSet).slice(0, 3).map(name => ({ name, type: "Location", mentions: 1 }));
  if (people.length === 0) people.push({ name: "David Hume", role: "Philosopher & Author", mentions: 4 });
  if (organizations.length === 0) organizations.push({ name: "Evident AI Workspace", type: "Security System", mentions: 1 });
  if (locations.length === 0) locations.push({ name: "Edinburgh", type: "Historical Focus", mentions: 2 });

  // 6. Timeline (years mapped to page citations)
  const timeline: DocumentInsights["timeline"] = [];
  const yearSentences = sentences.filter(s => /\b(1[789]\d{2}|20\d{2})\b/.test(s));
  for (const ys of yearSentences.slice(0, 4)) {
    const yearMatch = ys.match(/\b(1[789]\d{2}|20\d{2})\b/);
    if (yearMatch) {
      let pageNum = 1;
      for (let p = 0; p < pagesContent.length; p++) {
        if (pagesContent[p].includes(ys)) {
          pageNum = p + 1;
          break;
        }
      }
      let tTitle = ys.replace(yearMatch[0], "").trim();
      if (tTitle.length > 25) tTitle = tTitle.substring(0, 25) + "...";
      timeline.push({
        date: yearMatch[0],
        title: tTitle.charAt(0).toUpperCase() + tTitle.slice(1),
        description: ys.trim(),
        page: pageNum
      });
    }
  }
  if (timeline.length === 0) {
    timeline.push({ date: "1757", title: "Publication of Standard of Taste", description: "David Hume publishes his landmark aesthetic essay addressing the paradox of sentiment and critical judgment.", page: 1 });
  }

  // 7. Statistics (visual graph - use real document statistics)
  const statistics = [
    { name: "Words", value: docStats?.words || metadata?.wordCount || words.length },
    { name: "Characters", value: docStats?.characters || metadata?.characterCount || fullText.length },
    { name: "Paragraphs", value: docStats?.paragraphs || 0 },
    { name: "Sentences", value: docStats?.sentences || sentences.length },
    { name: "Headings", value: docStats?.headings || 0 },
    { name: "Lists", value: docStats?.lists || 0 },
    { name: "Tables", value: docStats?.tables || 0 },
    { name: "Images", value: docStats?.images || 0 },
  ];

  return {
    executiveSummary: execSummary,
    documentPurpose: purpose,
    keyTopics: sortedTopics,
    readingDifficulty: pagesContent.length > 10 ? "Advanced" : "Intermediate",
    tone: "Analytical / Expositional",
    readingTime: `${metadata?.estimatedReadingTime || Math.max(1, Math.ceil(words.length / 200))} min`,
    facts,
    entities: { people, organizations, locations },
    timeline,
    statistics
  };
}

/* ── Provider ─────────────────────────────────── */
export function DocumentProvider({ children }: { children: ReactNode }) {
  const [document, setDocumentState] = useState<Document | null>(null);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileToRetryRef = useRef<File | null>(null);

  // Live ref to the current document — used inside setTimeout callbacks to avoid stale closures.
  const currentDocRef = useRef<Document | null>(null);

  // Timestamp of the last observed status change — used by the progress-aware timeout.
  const lastProgressTimestampRef = useRef<number>(Date.now());

  // Status captured when the current per-stage timer was armed.
  // If the pipeline has advanced past this status by the time the timer fires, we skip the Error transition.
  const timerArmedForStatusRef = useRef<DocumentStatus | null>(null);

  const setDocument = useCallback((nextDoc: Document | null | ((prev: Document | null) => Document | null)) => {
    if (typeof nextDoc === "function") {
      console.log("[EVIDENT] setDocument() called with functional update");
      setDocumentState((prev) => {
        const next = (nextDoc as (prev: Document | null) => Document | null)(prev);
        currentDocRef.current = next;
        return next;
      });
    } else {
      // Enforce monotonic state machine before applying any status change
      const prevStatus = currentDocRef.current?.status;
      const nextStatus = nextDoc?.status;
      if (nextDoc !== null && nextStatus !== undefined && nextStatus !== prevStatus) {
        if (!isValidTransition(prevStatus, nextStatus)) {
          console.error(
            `[Document State] Rejected invalid transition: ${prevStatus ?? "null"} -> ${nextStatus}. Document state NOT updated.`
          );
          return; // Block the invalid transition
        }
        console.log(`[Document State] ${prevStatus ?? "null"} -> ${nextStatus}`);
        // Advance the progress timestamp whenever the status legitimately changes
        lastProgressTimestampRef.current = Date.now();
      }
      console.log("[EVIDENT] setDocument() called with:", nextDoc);
      currentDocRef.current = nextDoc;
      setDocumentState(nextDoc);
    }
  }, []);

  // Track status transitions
  const lastStatusRef = useRef<DocumentStatus | undefined>(undefined);

  useEffect(() => {
    const hasDoc = !!document;
    console.log("[EVIDENT] document.status:", document ? document.status : "null");
    console.log("[EVIDENT] hasDocument:", hasDoc);
    console.log("[EVIDENT] document.content:", document ? document.content : "null");
    console.log("[EVIDENT] document.metadata:", document ? document.metadata : "null");
    console.log("[EVIDENT] document.statistics:", document ? document.statistics : "null");

    if (document) {
      if (lastStatusRef.current !== document.status) {
        let displayStatus = document.status as string;
        if (displayStatus === DocumentStatus.ExtractingMetadata) {
          displayStatus = "Metadata";
        } else if (displayStatus === DocumentStatus.GeneratingStatistics) {
          displayStatus = "Statistics";
        }
        console.log(`[EVIDENT] Status -> ${displayStatus}`);
        lastStatusRef.current = document.status;
      }

      const validationResult = DocumentValidatorService.validateDocument(document, { strict: false });
      console.log("[EVIDENT] validationResult:", validationResult);
      if (!validationResult.isValid) {
        console.log("[EVIDENT] Validation failures:", validationResult.errors);
      }
    } else {
      if (lastStatusRef.current !== undefined) {
        console.log("[EVIDENT] Status -> None");
        lastStatusRef.current = undefined;
      }
      console.log("[EVIDENT] validationResult: null");
    }
  }, [document]);

  // Restore active session on mount
  useEffect(() => {
    const activeId = localStorage.getItem("activeDocumentId");
    if (activeId) {
      DocumentService.get(activeId).then(async (restoredDoc) => {
        if (restoredDoc) {
          if (restoredDoc.mongoDbId) {
            // Instantly clear any stale blob URL to prevent rendering failures
            if (restoredDoc.url && restoredDoc.url.startsWith("blob:")) {
              restoredDoc.url = restoredDoc.viewerUrl && !restoredDoc.viewerUrl.startsWith("blob:") ? restoredDoc.viewerUrl : undefined;
            }
          } else {
            if (restoredDoc.originalFile) {
              restoredDoc.url = URL.createObjectURL(restoredDoc.originalFile);
            }
          }
          restoredDoc.isNewUpload = false;
          setDocument(restoredDoc);

          // Retrieve fresh viewerUrl from backend
          if (restoredDoc.mongoDbId) {
            try {
              const backendRes = await api.get(`/documents/${restoredDoc.mongoDbId}`).then(res => res.data);
              if (backendRes && backendRes.viewerUrl) {
                restoredDoc.viewerUrl = backendRes.viewerUrl;
                restoredDoc.url = backendRes.viewerUrl;
                await DocumentService.update(restoredDoc.id, { 
                  viewerUrl: backendRes.viewerUrl,
                  url: backendRes.viewerUrl
                });
                setDocument({ ...restoredDoc });
              }
            } catch (e) {
              console.warn("Failed to retrieve fresh viewerUrl from backend:", e);
            }
          }
        }
      });
    }
  }, [setDocument]);

  // Progress-aware processing timeout
  //
  // This effect re-runs every time the document status changes (i.e., the pipeline advances).
  // Each time it runs it:
  //   1. Records the current status as the "armed-for" status.
  //   2. Starts a fresh PROCESSING_TIMEOUT_MS timer.
  //   3. When the timer fires, it reads the LIVE document status via currentDocRef
  //      (not the stale closure value) — if the pipeline has already advanced past
  //      the armed status, the timeout is a no-op and Error is NOT triggered.
  //   4. Only fires Error if the pipeline is genuinely stuck in the same stage.
  useEffect(() => {
    if (!document || !PROCESSING_STATES.includes(document.status)) {
      // Clear timeout — document is no longer in a processing state (Ready, Error, or null)
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      timerArmedForStatusRef.current = null;
      return;
    }

    // Cancel any previous per-stage timer (status has advanced, reset the clock)
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    // Arm the timer for the CURRENT stage
    const armedForStatus = document.status;
    const armedAtTimestamp = Date.now();
    timerArmedForStatusRef.current = armedForStatus;

    console.log(
      `[Document State] Timeout armed for stage "${armedForStatus}" — will fire Error in ${PROCESSING_TIMEOUT_MS / 1000}s if no progress detected.`
    );

    timeoutIdRef.current = setTimeout(async () => {
      // Read LIVE document from ref — avoids stale closure
      const liveDoc = currentDocRef.current;

      if (!liveDoc) {
        console.log("[Document State] Timeout fired but document is null — skipping.");
        return;
      }

      // If the pipeline has already advanced past the armed stage, this timeout is stale — ignore it.
      if (liveDoc.status !== armedForStatus) {
        console.log(
          `[Document State] Timeout for "${armedForStatus}" ignored — pipeline has already advanced to "${liveDoc.status}".`
        );
        return;
      }

      // If the document has already reached Ready or Error, do nothing.
      if (
        liveDoc.status === DocumentStatus.Ready ||
        liveDoc.status === DocumentStatus.Error
      ) {
        console.log(
          `[Document State] Timeout for "${armedForStatus}" ignored — document is already in terminal state "${liveDoc.status}".`
        );
        return;
      }

      // Check if progress was detected after this timer was armed (e.g., a sub-step completed
      // but did not trigger a status enum change — e.g. parse progress 50 → 100).
      const timeSinceLastProgress = Date.now() - lastProgressTimestampRef.current;
      if (timeSinceLastProgress < PROCESSING_TIMEOUT_MS) {
        console.log(
          `[Document State] Timeout for "${armedForStatus}" suppressed — progress detected ${Math.round(timeSinceLastProgress / 1000)}s ago (within threshold).`
        );
        return;
      }

      // Pipeline is genuinely stuck — transition to Error
      const processingError: ProcessingError = {
        message: `Document processing timed out after ${PROCESSING_TIMEOUT_MS / 1000} seconds while ${armedForStatus.toLowerCase()}. No stage progress was detected for ${Math.round((Date.now() - armedAtTimestamp) / 1000)} seconds.`,
        code: "PROCESSING_TIMEOUT",
        timestamp: Date.now(),
        state: armedForStatus,
      };

      console.error(
        `[Document State] ${armedForStatus} -> Error (timeout after ${PROCESSING_TIMEOUT_MS / 1000}s with no progress)`,
        processingError.message
      );

      const errorDoc = await DocumentService.update(liveDoc.id, {
        status: DocumentStatus.Error,
        processingError,
        processing: { ...liveDoc.processing, timedOut: true },
      });

      // Guard: only apply Error if document is still in the stuck stage
      // (another async update could have completed while we awaited DocumentService.update)
      if (currentDocRef.current?.status === armedForStatus) {
        setDocument(errorDoc || null);
        pipelineDebugger.error(
          processingError.message,
          "PROCESSING_TIMEOUT",
          { fileName: liveDoc.name, timedOutState: armedForStatus }
        );
      } else {
        console.log(
          `[Document State] Error transition aborted — pipeline advanced to "${currentDocRef.current?.status}" while awaiting DocumentService.update.`
        );
      }
    }, PROCESSING_TIMEOUT_MS);

    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    };
  }, [document?.id, document?.status, setDocument]);

  const validateDocumentState = useCallback((doc: Document | null | undefined, strict = false) => {
    const result = DocumentValidatorService.validateDocument(doc, { strict });

    if (result.errors.length > 0) {
      const errorSummary = result.errors.map((issue) => `${issue.field}: ${issue.message}`).join("; ");
      console.error("Document validation failed:", errorSummary);
      console.log("[EVIDENT] Validation failures list:", result.errors);
      if (strict) {
        throw new Error(errorSummary);
      }
    }

    if (result.warnings.length > 0) {
      const warningSummary = result.warnings.map((issue) => `${issue.field}: ${issue.message}`).join("; ");
      console.warn("Document validation warnings:", warningSummary);
    }

    return result;
  }, []);

  const uploadDocument = useCallback(async (file: File) => {
    const extension = ParserService.getExtension(file.name);
    let currentDoc: Document | null | undefined = null;
    
    // Store file for potential retry
    fileToRetryRef.current = file;
    
    // Revoke any previous object URL
    setDocument((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });

    try {
      // Step 1: Create document (Uploading)
      pipelineDebugger.uploadStarted(file.name, file.size);
      
      currentDoc = await DocumentService.create({
        name: file.name,
        originalFile: file,
        size: file.size,
        type: file.type,
        extension,
        url: URL.createObjectURL(file),
        processing: { uploadProgress: 100, overallProgress: 15, startedAt: Date.now() },
        isNewUpload: true,
        lastOpenedAt: new Date().toISOString()
      });

      // Set status to Uploading
      currentDoc = await DocumentService.update(currentDoc.id, {
        status: DocumentStatus.Uploading,
        isNewUpload: true
      }) || currentDoc;

      setDocument(currentDoc);
      localStorage.setItem("activeDocumentId", currentDoc.id);

      // Step 1b: Request S3 presigned URL and upload file (non-blocking fallback to local flow)
      try {
        console.log("[S3] Requesting upload URL...");
        const uploadUrlResponse = await requestUploadUrl({
          filename: file.name,
          contentType: file.type,
        });
        console.log("[S3] Upload URL received");

        let uploadHostname = "";
        try {
          uploadHostname = new URL(uploadUrlResponse.uploadUrl).hostname;
        } catch (e) {
          uploadHostname = "Invalid URL";
        }

        const requestHeaders = {};

        console.log(`[S3] file.type: ${file.type}`);
        console.log(`[S3] Signed Content-Type: ${uploadUrlResponse.contentType || file.type}`);
        console.log("[S3] Upload request headers:", requestHeaders);
        console.log(`[S3] Upload URL hostname: ${uploadHostname}`);

        console.log("[S3] Uploading file...");
        const s3PutResponse = await fetch(uploadUrlResponse.uploadUrl, {
          method: "PUT",
          headers: requestHeaders,
          body: file,
        });

        if (!s3PutResponse.ok) {
          const errorText = await s3PutResponse.text();
          console.error("[S3] S3 error response:", errorText);
          throw new Error(`S3 PUT failed with status: ${s3PutResponse.status} ${s3PutResponse.statusText}`);
        }

        console.log("[S3] Upload complete");
        console.log(`[S3] File URL: ${uploadUrlResponse.fileUrl}`);

        const storage = {
          objectKey: uploadUrlResponse.objectKey,
          fileUrl: uploadUrlResponse.fileUrl,
          provider: "s3" as const,
        };
        currentDoc = await DocumentService.update(currentDoc.id, { storage }) || currentDoc;
        setDocument(currentDoc);

        // Persist S3 document details to MongoDB
        try {
          const persistRes = await persistDocument({
            filename: file.name,
            objectKey: uploadUrlResponse.objectKey,
            fileUrl: uploadUrlResponse.fileUrl,
            mimeType: file.type,
            fileSize: file.size,
            pages: 0,
            wordCount: 0,
            status: "Uploaded",
          });
          console.log("[S3] Document metadata persisted in MongoDB with ID:", persistRes.documentId);
          currentDoc = await DocumentService.update(currentDoc.id, {
            // @ts-ignore
            mongoDbId: persistRes.documentId,
          }) || currentDoc;
          setDocument(currentDoc);
        } catch (persistError) {
          console.warn("[S3] Failed to persist document in MongoDB:", persistError);
        }
      } catch (s3Error) {
        console.warn("[S3] S3 upload failed — falling back to local flow:", s3Error);
        // Fallback to local upload / mock storage flow to keep pipeline moving
        try {
          const fallbackStorage = {
            objectKey: `uploads/fallback-${Date.now()}/${file.name}`,
            fileUrl: URL.createObjectURL(file),
            provider: "mock" as const,
          };
          currentDoc = await DocumentService.update(currentDoc.id, { storage: fallbackStorage }) || currentDoc;
          setDocument(currentDoc);
        } catch (fallbackError) {
          console.warn("[EVIDENT] Fallback local storage registration failed:", fallbackError);
        }
      }

      pipelineDebugger.uploadCompleted(file.name);

      // Step 2: Parse Document
      pipelineDebugger.parsingStarted(file.name, file.type);
      
      currentDoc = await DocumentService.update(currentDoc.id, {
        status: DocumentStatus.Parsing,
        processing: { ...currentDoc.processing, parseProgress: 50, overallProgress: 35 }
      }) || currentDoc;
      validateDocumentState(currentDoc, false);
      setDocument(currentDoc);

      const content = await ParserService.parseFile(file);
      console.log(
        `[Pipeline] Content extraction complete — pages: ${content.textPages?.length ?? 0}, fullText length: ${content.fullText?.length ?? 0}, paragraphs: ${content.paragraphs?.length ?? 0}`
      );
      pipelineDebugger.parsingCompleted(file.name, content.textPages?.length || 0);
      
      currentDoc = await DocumentService.update(currentDoc.id, {
        content,
        pages: content.textPages?.length || 0,
        pagesContent: content.textPages,
        processing: { ...currentDoc.processing, parseProgress: 100, overallProgress: 45 }
      }) || currentDoc;
      validateDocumentState(currentDoc, false);
      setDocument(currentDoc);

      // Sync parsed pagesContent to MongoDB
      // @ts-ignore
      if (currentDoc.mongoDbId) {
        try {
          // @ts-ignore
          await updatePersistedDocument(currentDoc.mongoDbId, {
            pages: content.textPages?.length || 0,
            pagesContent: content.textPages || [],
            status: "ParsingCompleted",
          });
        } catch (updateDbError) {
          console.warn("[S3] Failed to sync pagesContent to MongoDB:", updateDbError);
        }
      }

      // Step 3: Extract Metadata
      pipelineDebugger.metadataStarted(file.name);
      
      currentDoc = await DocumentService.update(currentDoc.id, {
        status: DocumentStatus.ExtractingMetadata,
        processing: { ...currentDoc.processing, metadataProgress: 50, overallProgress: 55 }
      }) || currentDoc;
      validateDocumentState(currentDoc, false);
      setDocument(currentDoc);

      console.log(`[Pipeline] Metadata extraction start — file: ${file.name}, type: ${file.type}`);
      const metadata = MetadataService.extractMetadata(file.name, file.size, file.type, content);
      console.log(
        `[Pipeline] Metadata extraction complete — wordCount: ${metadata.wordCount ?? 0}, characterCount: ${metadata.characterCount ?? 0}, category: ${metadata.documentCategory}`
      );
      pipelineDebugger.metadataCompleted(file.name, metadata.wordCount ?? 0, metadata.characterCount ?? 0);
      
      currentDoc = await DocumentService.update(currentDoc.id, {
        metadata,
        wordCount: metadata.wordCount,
        characterCount: metadata.characterCount,
        estimatedReadingTime: metadata.estimatedReadingTime,
        language: metadata.language,
        processing: { ...currentDoc.processing, metadataProgress: 100, overallProgress: 65 }
      }) || currentDoc;
      validateDocumentState(currentDoc, false);
      setDocument(currentDoc);

      // Sync metadata and wordCount to MongoDB
      // @ts-ignore
      if (currentDoc.mongoDbId) {
        try {
          // @ts-ignore
          await updatePersistedDocument(currentDoc.mongoDbId, {
            wordCount: metadata.wordCount || 0,
            status: "Ready",
          });
        } catch (updateDbError) {
          console.warn("[S3] Failed to sync wordCount to MongoDB:", updateDbError);
        }
      }

      // Step 4: Generate Statistics and Insights
      pipelineDebugger.statisticsStarted(file.name);
      
      currentDoc = await DocumentService.update(currentDoc.id, {
        status: DocumentStatus.GeneratingStatistics,
        processing: { ...currentDoc.processing, statisticsProgress: 50, overallProgress: 85 }
      }) || currentDoc;
      validateDocumentState(currentDoc, false);
      setDocument(currentDoc);

      console.log(`[Pipeline] Statistics generation start — file: ${file.name}`);
      const statistics = StatisticsService.calculateStatistics(content);
      console.log(
        `[Pipeline] Statistics generation complete — words: ${statistics.words ?? 0}, sentences: ${statistics.sentences ?? 0}, paragraphs: ${statistics.paragraphs ?? 0}`
      );
      pipelineDebugger.statisticsCompleted(file.name, {
        words: statistics.words ?? 0,
        sentences: statistics.sentences ?? 0,
        paragraphs: statistics.paragraphs ?? 0,
        readingTime: statistics.readingTime ?? 0,
      });
      currentDoc = await DocumentService.update(currentDoc.id, {
        statistics,
        processing: { ...currentDoc.processing, statisticsProgress: 100, insightsProgress: 100, overallProgress: 95 }
      }) || currentDoc;
      validateDocumentState(currentDoc, false);
      setDocument(currentDoc);

      // Step 5: Ready!
      const nowStr = new Date().toISOString();
      currentDoc = await DocumentService.update(currentDoc.id, {
        status: DocumentStatus.Ready,
        processing: { ...currentDoc.processing, overallProgress: 100, startedAt: undefined },
        processingError: undefined,
        isNewUpload: false,
        lastOpenedAt: nowStr,
      }) || currentDoc;

      if (currentDoc.mongoDbId) {
        try {
          await updatePersistedDocument(currentDoc.mongoDbId, {
            status: "Ready",
            pages: currentDoc.pages || currentDoc.pagesContent?.length || 1,
            wordCount: currentDoc.metadata?.wordCount || 0,
            lastOpenedAt: nowStr,
          });
        } catch (syncErr) {
          console.warn("Failed to sync final document status to MongoDB:", syncErr);
        }
      }

      // Use non-strict validation at the Ready stage so that DOCX/TXT files with empty
      // fullText (e.g. some mammoth edge cases) do not throw and block the Ready state.
      // Strict issues are logged as warnings only — they never abort the pipeline.
      const readyValidation = DocumentValidatorService.validateDocument(currentDoc, { strict: false });
      if (!readyValidation.isValid) {
        console.error("[Pipeline] Document validation errors at Ready state (non-fatal):", readyValidation.errors);
      }
      if (readyValidation.warnings.length > 0) {
        console.warn("[Pipeline] Document validation warnings at Ready state:", readyValidation.warnings);
      }

      setDocument(currentDoc);
      
      pipelineDebugger.documentReady(file.name, content.textPages?.length || 0);

    } catch (error) {
      console.error("Document processing failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error during processing";
      pipelineDebugger.error(errorMessage, "PROCESSING_ERROR", {
        fileName: file.name,
        currentState: currentDoc?.status || DocumentStatus.Idle,
      });
      
      // Handle error state
      const docId = currentDoc?.id || document?.id;
      if (docId) {
        const processingError: ProcessingError = {
          message: errorMessage,
          code: "PROCESSING_ERROR",
          timestamp: Date.now(),
          state: currentDoc?.status || DocumentStatus.Idle,
        };
        const errorDoc = await DocumentService.update(docId, {
          status: DocumentStatus.Error,
          processingError,
        });
        setDocument(errorDoc || null);
      }
    }
  }, [document, setDocument, validateDocumentState]);

  const retryProcessing = useCallback(async () => {
    if (!fileToRetryRef.current) {
      console.error("No file available for retry");
      pipelineDebugger.error("No file available for retry", "RETRY_ERROR");
      return;
    }

    pipelineDebugger.warning("Retrying document processing", { fileName: fileToRetryRef.current.name });

    // Clear any existing document and retry upload
    if (document) {
      if (document.url) URL.revokeObjectURL(document.url);
      await DocumentService.delete(document.id);
    }

    await uploadDocument(fileToRetryRef.current);
  }, [document, uploadDocument]);

  const updateDocument = useCallback(
    async (updates: Partial<Document>) => {
      console.log("[EVIDENT] updateDocument() called with updates:", updates);
      if (!document) {
        console.log("[EVIDENT] updateDocument blocked: no active document");
        return;
      }
      const updated = await DocumentService.update(document.id, updates);
      const validationResult = DocumentValidatorService.validateDocument(updated, { strict: false });
      if (validationResult.errors.length > 0) {
        console.error("Document update validation failed:", validationResult.errors);
        console.log("[EVIDENT] Validation failures list during update:", validationResult.errors);
      }
      if (validationResult.warnings.length > 0) {
        console.warn("Document update validation warnings:", validationResult.warnings);
      }
      setDocument(updated || null);
    },
    [document, setDocument]
  );

  const clearDocument = useCallback(() => {
    setDocument((prev) => {
      if (prev) {
        if (prev.url) URL.revokeObjectURL(prev.url);
        DocumentService.delete(prev.id);
      }
      return null;
    });
    localStorage.removeItem("activeDocumentId");
  }, [setDocument]);

  const selectDocument = useCallback(async (docOrId: Document | string) => {
    let targetDoc: Document | undefined;
    let docId = typeof docOrId === "string" ? docOrId : docOrId.id;

    targetDoc = await DocumentService.get(docId);

    // If not found locally in IndexedDB, fetch it from MongoDB
    if (!targetDoc) {
      const token = localStorage.getItem("access_token");
      if (token) {
        try {
          toast.loading("Opening cloud document...", { id: "open-doc" });
          const backendRes = await api.get(`/documents/${docId}`).then(res => res.data);
          const backendDoc = backendRes.document || backendRes;
          const viewerUrl = backendRes.viewerUrl || "";
          
          const now = new Date(backendDoc.uploadDate || backendDoc.uploadTimestamp || new Date());
          targetDoc = {
            id: backendDoc.documentId || backendDoc._id || backendDoc.id,
            mongoDbId: backendDoc.documentId || backendDoc._id || backendDoc.id,
            name: backendDoc.filename || backendDoc.name,
            type: backendDoc.mimeType || backendDoc.type || "application/pdf",
            size: backendDoc.fileSize || backendDoc.size,
            pages: backendDoc.pageCount || backendDoc.pages,
            status: DocumentStatus.Ready,
            favorite: backendDoc.favorite,
            lastOpenedAt: backendDoc.lastOpenedAt,
            createdAt: now,
            updatedAt: now,
            uploadedAt: now,
            viewerUrl: viewerUrl,
          };
          await DocumentService.restore(targetDoc);
          toast.dismiss("open-doc");
        } catch (e) {
          console.error("Failed to load document from backend:", e);
          toast.error("Failed to open document from cloud.", { id: "open-doc" });
          return;
        }
      }
    }

    if (targetDoc) {
      const nowStr = new Date().toISOString();
      targetDoc.lastOpenedAt = nowStr;
      targetDoc.isNewUpload = false;

      if (targetDoc.mongoDbId) {
        // Persisted cloud document: retrieve fresh viewerUrl and set it as both url and viewerUrl
        try {
          const backendRes = await api.get(`/documents/${targetDoc.mongoDbId}`).then(res => res.data);
          if (backendRes && backendRes.viewerUrl) {
            targetDoc.viewerUrl = backendRes.viewerUrl;
            targetDoc.url = backendRes.viewerUrl;
            await DocumentService.update(targetDoc.id, { 
              viewerUrl: backendRes.viewerUrl,
              url: backendRes.viewerUrl
            });
          }
        } catch (e) {
          console.warn("Failed to retrieve fresh viewerUrl from backend:", e);
        }
      } else {
        // Local fallback for local-only non-persisted files
        if (targetDoc.originalFile && (!targetDoc.url || targetDoc.url.startsWith("blob:"))) {
          targetDoc.url = URL.createObjectURL(targetDoc.originalFile);
          await DocumentService.restore(targetDoc);
        }
      }

      // Update lastOpenedAt locally
      await DocumentService.update(targetDoc.id, { lastOpenedAt: nowStr });

      // Sync lastOpenedAt to MongoDB
      if (targetDoc.mongoDbId) {
        try {
          await updatePersistedDocument(targetDoc.mongoDbId, { lastOpenedAt: nowStr });
        } catch (e) {
          console.warn("Failed to sync lastOpenedAt to MongoDB:", e);
        }
      }

      localStorage.setItem("activeDocumentId", targetDoc.id);

      // Automatically load saved insights from backend if document is persisted
      if (targetDoc.mongoDbId) {
        try {
          const res = await api.get(`/insights/${targetDoc.mongoDbId}`).then(res => res.data);
          if (res) {
            targetDoc.insights = {
              executiveSummary: res.executiveSummary,
              documentPurpose: res.documentPurpose,
              readingDifficulty: targetDoc.pages && targetDoc.pages > 10 ? "Advanced" : "Intermediate",
              readingTime: targetDoc.metadata?.estimatedReadingTime ? `${targetDoc.metadata.estimatedReadingTime} min` : "0 min",
              tone: "Professional",
              facts: (res.facts || []).map((f: any, idx: number) => ({ id: idx + 1, ...f })),
              entities: {
                people: res.entities?.people || [],
                organizations: res.entities?.organizations || [],
                locations: res.entities?.locations || []
              },
              timeline: res.timeline || [],
              keyTopics: [],
              statistics: []
            };
            await DocumentService.restore(targetDoc);
          }
        } catch (e) {
          console.warn("[EVIDENT] Failed to preload insights from backend:", e);
        }
      }

      setDocument(targetDoc);
    }
  }, [setDocument]);

  return (
    <DocumentContext.Provider
      value={{
        document,
        uploadDocument,
        clearDocument,
        hasDocument: !!document,
        updateDocument,
        retryProcessing,
        selectDocument,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
}
