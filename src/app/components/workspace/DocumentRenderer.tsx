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
}: Props) {
  const extension = doc.extension?.toLowerCase() || "";
  const type = doc.type?.toLowerCase() || "";

  // If currentView is set to "text", or if the file extension is plain text
  if (currentView === "text" || extension === "txt" || type.includes("text/plain")) {
    return (
      <TXTDocumentRenderer
        document={doc}
        currentPage={currentPage}
        onPageChange={onPageChange}
        scale={scale}
        searchQuery={searchQuery}
        searchResults={searchResults}
        activeIndex={activeIndex}
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
