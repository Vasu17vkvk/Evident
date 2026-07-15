import { Document } from "../../types/document";
import { PDFDocumentRenderer } from "./PDFDocumentRenderer";
import { DOCXDocumentRenderer } from "./DOCXDocumentRenderer";
import { TXTDocumentRenderer } from "./TXTDocumentRenderer";

interface Props {
  document: Document;
  currentPage: number;
  onPageChange: (page: number) => void;
  scale?: number;
  rotation?: number;
  searchQuery?: string;
  currentView?: "pdf" | "text";
  searchResults?: any[];
  activeIndex?: number | null;
  onRenderFailed?: () => void;
  onTotalPagesDetected?: (pages: number) => void;
}

export function DocumentRenderer({
  document: doc,
  currentPage,
  onPageChange,
  scale = 1,
  rotation = 0,
  searchQuery = "",
  currentView = "pdf",
  searchResults = [],
  activeIndex = null,
  onRenderFailed,
  onTotalPagesDetected,
}: Props) {
  const extension = doc.extension?.toLowerCase() || doc.name?.split(".").pop()?.toLowerCase() || "";
  const type = doc.type?.toLowerCase() || "";

  // If currentView is set to "text" (raw plain text mode)
  if (currentView === "text") {
    if (
      extension === "docx" ||
      type.includes("wordprocessingml") ||
      type.includes("application/msword") ||
      type.includes("docx")
    ) {
      return (
        <DOCXDocumentRenderer
          document={doc}
          currentPage={currentPage}
          onPageChange={onPageChange}
          scale={scale}
          searchQuery={searchQuery}
          searchResults={searchResults}
          activeIndex={activeIndex}
          textMode={true}
        />
      );
    }
    return (
      <TXTDocumentRenderer
        document={doc}
        currentPage={currentPage}
        onPageChange={onPageChange}
        scale={scale}
        searchQuery={searchQuery}
        searchResults={searchResults}
        activeIndex={activeIndex}
        forcePlain={true}
      />
    );
  }

  // If document is Word (docx) format
  if (
    extension === "docx" ||
    type.includes("wordprocessingml") ||
    type.includes("application/msword") ||
    type.includes("docx")
  ) {
    return (
      <DOCXDocumentRenderer
        document={doc}
        currentPage={currentPage}
        onPageChange={onPageChange}
        scale={scale}
        searchQuery={searchQuery}
        searchResults={searchResults}
        activeIndex={activeIndex}
        textMode={false}
        onTotalPagesDetected={onTotalPagesDetected}
      />
    );
  }

  // If document is Plain Text format
  if (extension === "txt" || type.includes("text/plain")) {
    return (
      <TXTDocumentRenderer
        document={doc}
        currentPage={currentPage}
        onPageChange={onPageChange}
        scale={scale}
        searchQuery={searchQuery}
        searchResults={searchResults}
        activeIndex={activeIndex}
        forcePlain={false}
      />
    );
  }

  // Fallback to PDF renderer
  return (
    <PDFDocumentRenderer
      url={doc.viewerUrl || doc.url || ""}
      currentPage={currentPage}
      onPageChange={onPageChange}
      scale={scale}
      rotation={rotation}
      searchQuery={searchQuery}
      searchResults={searchResults}
      activeIndex={activeIndex}
      onRenderFailed={onRenderFailed}
    />
  );
}
