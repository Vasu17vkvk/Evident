import { PDFViewer } from "./PDFViewer";

interface Props {
  url: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  scale?: number;
  rotation?: number;
  searchQuery?: string;
  searchResults?: any[];
  activeIndex?: number | null;
  onRenderFailed?: () => void;
}

export function PDFDocumentRenderer(props: Props) {
  return <PDFViewer {...props} />;
}
