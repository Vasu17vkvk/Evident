export enum DocumentStatus {
  Idle = "Idle",
  Uploading = "Uploading",
  Parsing = "Parsing",
  ExtractingMetadata = "Extracting Metadata",
  GeneratingStatistics = "Generating Statistics",
  Ready = "Ready",
  Error = "Error",
}

export interface FactInsight {
  id: number;
  label: string;
  value: string;
  icon: string;
  change?: string;
}

export interface EntityMentions {
  name: string;
  role?: string;
  type?: string;
  mentions: number;
}

export interface TimelineEvent {
  date: string;
  title: string;
  description: string;
  page: number;
}

export interface StatItem {
  name: string;
  revenue?: number;
  growth?: number;
  [key: string]: any;
}

export interface DocumentInsights {
  executiveSummary: string;
  documentPurpose: string;
  keyTopics: string[];
  readingDifficulty: string;
  tone: string;
  readingTime?: string;
  facts: FactInsight[];
  entities: {
    people: EntityMentions[];
    organizations: EntityMentions[];
    locations: EntityMentions[];
  };
  timeline: TimelineEvent[];
  statistics: StatItem[];
}

// New Metadata interface
export interface DocumentMetadata {
  title?: string;
  author?: string;
  language?: string;
  pageCount?: number;
  wordCount?: number;
  characterCount?: number;
  estimatedReadingTime?: number;
  documentType?: string;
  documentCategory?: string;
  fileType?: string;
  fileSize?: number;
}

// New Content interface
export interface DocumentContent {
  fullText?: string;
  textPages?: string[];
  paragraphs?: string[];
  sections?: string[];
}

// New Statistics interface
export interface DocumentStatistics {
  words?: number;
  characters?: number;
  paragraphs?: number;
  sentences?: number;
  tables?: number;
  images?: number;
  lists?: number;
  headings?: number;
  averageSentenceLength?: number;
  readingTime?: number;
}

// New Processing interface
export interface DocumentProcessing {
  uploadProgress?: number;
  parseProgress?: number;
  metadataProgress?: number;
  statisticsProgress?: number;
  insightsProgress?: number;
  overallProgress?: number;
  startedAt?: number; // Timestamp when processing began
  timedOut?: boolean; // Whether processing timed out
}

// Processing error details
export interface ProcessingError {
  message: string;
  code: string;
  timestamp: number;
  state: DocumentStatus;
}

// Complete Document interface
export interface Document {
  id: string;
  name: string;
  originalFile?: File;
  type: string;
  size: number;
  status: DocumentStatus;
  metadata?: DocumentMetadata;
  content?: DocumentContent;
  pages?: number;
  statistics?: DocumentStatistics;
  insights?: DocumentInsights;
  searchIndex?: any;
  processing?: DocumentProcessing;
  processingError?: ProcessingError; // Error details if processing failed
  createdAt: Date;
  updatedAt: Date;
  // Keep existing fields for backwards compatibility
  extension?: string;
  uploadedAt?: Date;
  thumbnail?: string;
  text?: string;
  url?: string; // object URL for preview
  pagesContent?: string[];
  wordCount?: number;
  characterCount?: number;
  estimatedReadingTime?: number;
  language?: string;
}

export type CreateDocumentInput = Partial<Omit<
  Document,
  "id" | "createdAt" | "updatedAt" | "status"
>>;
