export enum DocumentStatus {
  UPLOADING = "Uploading",
  EXTRACTING_CONTENT = "Extracting Content",
  EXTRACTING_METADATA = "Extracting Metadata",
  GENERATING_INSIGHTS = "Generating Insights",
  READY = "Ready",
  ERROR = "Error",
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

export interface DocumentMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  [key: string]: unknown;
}

export interface Document {
  id: string;
  name: string;
  size: number;
  type: string;
  extension: string;
  pages?: number;
  wordCount?: number;
  characterCount?: number;
  estimatedReadingTime?: number; // in minutes
  language?: string;
  createdAt: Date;
  uploadedAt: Date;
  status: DocumentStatus;
  thumbnail?: string;
  text?: string;
  metadata?: DocumentMetadata;
  url?: string; // object URL for preview
  insights?: DocumentInsights;
  pagesContent?: string[];
}

export type CreateDocumentInput = Omit<
  Document,
  "id" | "createdAt" | "uploadedAt" | "status"
>;
