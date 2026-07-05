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

export interface PricingPlan {
  name: string;
  priceMonthly: number;
  priceAnnually: number;
  description: string;
  features: string[];
  cta: string;
  highlighted: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: "Starter",
    priceMonthly: 0,
    priceAnnually: 0,
    description: "Perfect for students and casual researchers looking to interrogate individual files.",
    features: [
      "Up to 3 documents total",
      "Maximum 10 MB per file (PDF, TXT)",
      "50 questions per month",
      "Standard vector retrieval (RAG)",
      "Standard inline citations"
    ],
    cta: "Start for free",
    highlighted: false
  },
  {
    name: "Professional",
    priceMonthly: 24,
    priceAnnually: 19,
    description: "Designed for knowledge workers, developers, and teams needing multi-document insights.",
    features: [
      "Unlimited document uploads",
      "Maximum 100 MB per file (PDF, DOCX, TXT)",
      "Unlimited semantic queries",
      "Multi-document side-by-side search",
      "Priority citation verification mapping",
      "API access (up to 1,000 reqs/mo)",
      "Priority email support"
    ],
    cta: "Upgrade to Professional",
    highlighted: true
  },
  {
    name: "Enterprise",
    priceMonthly: 99,
    priceAnnually: 79,
    description: "Custom deployment, maximum security, and tailored pipelines for large organizations.",
    features: [
      "Custom document size limits (> 100 MB)",
      "Dedicated secure database and vector index",
      "Custom SLA & uptime guarantees",
      "Fine-tuned embedding models",
      "Collaborative workspace dashboards",
      "Full API access with infinite scale",
      "Dedicated account engineer"
    ],
    cta: "Contact Sales",
    highlighted: false
  }
];

export interface DocsPage {
  id: string;
  title: string;
  content: string;
  codeSnippet?: {
    language: string;
    code: string;
  };
}

export interface DocsSection {
  id: string;
  title: string;
  pages: DocsPage[];
}

export const DOCS_SECTIONS: DocsSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    pages: [
      {
        id: "introduction",
        title: "Introduction",
        content: "Welcome to Evident. Evident is an AI-powered document analysis system built around the concept of Retrieval-Augmented Generation (RAG). By reading your uploaded documents, parsing them into high-dimensional vector embeddings, and storing them in an encrypted database, we provide an interactive interrogation dashboard that responds to natural language queries. Crucially, every answer generated is backed by direct inline quotes and page/line citations, preventing AI hallucinations."
      },
      {
        id: "quickstart",
        title: "Quickstart Guide",
        content: "To get started with Evident: 1) Drag and drop any PDF, DOCX, or TXT document into the upload component on the home page. 2) Wait a few seconds for the document to be parsed and semantic chunks to be generated. 3) Ask a natural question in the chat bar (e.g., 'What is the liability cap under section 9?'). 4) Click on the inline bracket citation link to jump straight to the source passage in the document viewer."
      }
    ]
  },
  {
    id: "features-guides",
    title: "Feature Guides",
    pages: [
      {
        id: "citations",
        title: "Verified Citations",
        content: "Every single answer returned by our AI features inline citation references. Under the hood, the RAG engine returns matching paragraphs from your source file. We map these matched nodes to document pages using metadata keys. When the LLM outputs a sentence, it anchors it to the retrieved node. You can hover over any citation number to see a quick excerpt preview, or click it to highlight the exact matching lines in the document viewer."
      },
      {
        id: "semantic-search",
        title: "Semantic Search Mechanics",
        content: "Unlike standard keyword search (which looks for exact word occurrences), semantic search encodes your text and queries into mathematical vectors representing semantic concepts. When you ask 'how do we handle liability?', our indexers lookup concepts matching 'indemnification', 'liquidated damages', and 'insurance coverage', surfacing passages that contain relevant definitions even if the word 'liability' is absent."
      }
    ]
  },
  {
    id: "api-reference",
    title: "API Reference",
    pages: [
      {
        id: "authentication",
        title: "Authentication",
        content: "All Evident API endpoints require authentication via a Bearer token sent in the Authorization header. You can generate an API key from the developer console on your Account page. Keep this key private: it permits reading and deleting document indexes in your workspace.",
        codeSnippet: {
          language: "bash",
          code: "curl -X GET https://api.evident.ai/v1/documents \\\n  -H \"Authorization: Bearer ev_live_839f...\""
        }
      },
      {
        id: "documents-api",
        title: "Upload Documents",
        content: "Use the /v1/documents endpoint to upload a document to your semantic workspace programmatically. You can pass a standard multipart form containing the binary file. In return, the API sends a document UUID and initiates asynchronous background indexing.",
        codeSnippet: {
          language: "javascript",
          code: "const formData = new FormData();\nformData.append('file', fileInput.files[0]);\n\nconst response = await fetch('https://api.evident.ai/v1/documents', {\n  method: 'POST',\n  headers: {\n    'Authorization': 'Bearer ev_live_839f...'\n  },\n  body: formData\n});\nconst docInfo = await response.json();\nconsole.log(`Document ID: ${docInfo.id}`);"
        }
      }
    ]
  }
];

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  readTime: string;
  author: string;
  category: string;
  featured?: boolean;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    id: "introducing-evident",
    title: "Introducing Evident: Document Intelligence with Citation Verification",
    excerpt: "Today, we are launching Evident in public beta. Learn how we are ending AI hallucinations by anchoring models directly to source passages with vector embeddings.",
    content: "Today we are thrilled to introduce Evident, a new document intelligence dashboard designed to solve the single greatest obstacle to using LLMs for research: hallucinations. Most language models operate as closed boxes, compressing billions of documents into numeric weights and drawing on intuition rather than concrete facts. Evident operates differently. By indexing documents using vector embeddings and applying Retrieval-Augmented Generation (RAG), we ensure that the model is only allowed to speak if it has a direct quote to back it up. Every answer comes with clear, highlighted citations pointing to page, paragraph, and line numbers.",
    date: "July 2, 2026",
    readTime: "4 min read",
    author: "Vasu K.",
    category: "Product Updates",
    featured: true
  },
  {
    id: "solving-hallucinations",
    title: "Solving AI Hallucinations in Enterprise Search",
    excerpt: "Hallucination is a model failure mode we refuse to hide behind. Here is a deep dive into citation anchoring and semantic indexing pipelines.",
    content: "Enterprise search projects often struggle when users request summaries of complex contracts or manuals. If an AI generates a plausible-sounding paragraph that is slightly incorrect, it can lead to massive errors. At Evident, we solve this using strict prompt constraints and source mapping. During search retrieval, document segments are ranked based on semantic similarity. The generative model receives these segments as isolated context containers. We instruct the model to produce inline tags correlating to container IDs. The UI then converts these tags into responsive UI links that preview the underlying source file.",
    date: "June 25, 2026",
    readTime: "6 min read",
    author: "DeepMind Engineer",
    category: "Technical Research",
    featured: false
  },
  {
    id: "building-custom-rag",
    title: "How to Build a Custom RAG Pipeline for PDF Parsing",
    excerpt: "A step-by-step developer guide on parsing complex multi-column PDFs, extracting structural elements, and generating embeddings.",
    content: "Parsing PDFs is notoriously difficult. Columns, footers, headers, and images break regular layout lines, resulting in scrambled text chunks. To build a robust RAG pipeline, you must extract structural layouts. First, use a layout-aware PDF reader to extract text blocks in reading order. Next, split texts using recursive character chunking (overlapping by 10-20% to retain context). Finally, run these chunks through embedding engines and insert them into vector store indexes. In this article, we show you how to set up a basic Python script doing just that.",
    date: "June 18, 2026",
    readTime: "8 min read",
    author: "AI Research Team",
    category: "Developer Guides",
    featured: false
  }
];

