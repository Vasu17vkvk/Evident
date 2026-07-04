import {
  MessageSquare,
  Quote,
  Search,
  Columns2,
  Sparkles,
  PenLine,
  type LucideIcon,
} from "lucide-react";

export type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
  tag: string;
};

export const FEATURES: Feature[] = [
  {
    icon: MessageSquare,
    title: "AI Chat with Documents",
    description:
      "Ask any question in plain language and get precise answers drawn directly from your document — no paraphrasing, no invention.",
    tag: "Conversation",
  },
  {
    icon: Quote,
    title: "Verified Citations",
    description:
      "Every response links back to the exact page and passage it came from. Follow the trail or copy the reference in one click.",
    tag: "Accuracy",
  },
  {
    icon: Search,
    title: "Semantic Search",
    description:
      "Finds meaning, not just keywords. Surface relevant sections even when the wording differs from your query.",
    tag: "Retrieval",
  },
  {
    icon: Columns2,
    title: "Multi-Document Comparison",
    description:
      "Load two or more documents side by side and ask the AI to reconcile differences, spot gaps, or merge insights.",
    tag: "Analysis",
  },
  {
    icon: Sparkles,
    title: "AI Summaries",
    description:
      "Generate structured executive summaries, bullet outlines, or TL;DRs at any length — scoped to the whole file or a single section.",
    tag: "Generation",
  },
  {
    icon: PenLine,
    title: "Smart Notes",
    description:
      "Highlight passages and the AI drafts a note explaining why it matters in context. Your annotations stay linked to the source.",
    tag: "Annotation",
  },
];

export const HERO_STEPS = [
  {
    step: "01",
    title: "Upload your document",
    body: "Drop any PDF, Word doc, or plain text file. We parse and index every page in under 10 seconds.",
  },
  {
    step: "02",
    title: "Ask in plain language",
    body: "Type any question about the document. The AI reads every section and surfaces the most relevant passages.",
  },
  {
    step: "03",
    title: "Get cited answers",
    body: "Each answer includes page references and exact quotes so you can verify every claim instantly.",
  },
];

export const PROCESS_STEPS = [
  {
    label: "Upload your document",
    body: "Drag in a PDF, DOCX, or TXT. Any size up to 100 MB. Parsing begins the moment the file lands.",
  },
  {
    label: "AI processes and indexes",
    body: "The model reads every paragraph, builds a semantic index, and maps relationships between passages across pages.",
  },
  {
    label: "Ask questions naturally",
    body: "Type anything — a broad question, a specific term, or a comparison. No Boolean operators, no query syntax.",
  },
  {
    label: "Receive answers with citations",
    body: "Each response surfaces the relevant passage, page number, and a clickable bracket so you can jump directly to the source.",
  },
];

export const ABOUT_PILLARS = [
  {
    term: "Retrieval-Augmented Generation",
    abbr: "RAG",
    body: "Rather than asking a language model to memorise your document, we retrieve only the passages most relevant to your question and feed those directly into the prompt. The model reasons over real text — not compressed weights — so every answer is traceable.",
  },
  {
    term: "Semantic Search",
    abbr: "Embeddings",
    body: "Your documents are encoded into high-dimensional vectors that capture meaning, not just vocabulary. A search for \"liability clauses\" surfaces paragraphs about \"indemnification\" and \"damages\" even if those exact words never appear in your query.",
  },
  {
    term: "Transparent Citations",
    abbr: "Source-first",
    body: "Hallucination is a language-model failure mode we refuse to hide behind. Every response includes a bracket reference to the originating passage — page number, section header, and excerpt. If the document does not say it, neither do we.",
  },
];

export const STATS = [
  {
    metric: "8×",
    title: "Faster Research",
    body: "Teams using Copilot complete document review tasks in a fraction of the time versus manual reading.",
    tag: "Productivity",
  },
  {
    metric: "100%",
    title: "Source Verification",
    body: "Every generated answer is backed by a direct quote. No claim is made without a traceable passage.",
    tag: "Accuracy",
  },
  {
    metric: "50+",
    title: "Multi-Doc Intelligence",
    body: "Compare, reconcile, and synthesise across dozens of documents in a single session.",
    tag: "Scale",
  },
];
