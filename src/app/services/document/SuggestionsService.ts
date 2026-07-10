import { Document } from "../../types/document";

// ---------------------------------------------------------------------------
// Keyword sets used for category detection from file name / metadata
// ---------------------------------------------------------------------------

const RESUME_KEYWORDS = ["resume", "cv", "curriculum", "vitae", "portfolio"];
const LEGAL_KEYWORDS = [
  "contract", "agreement", "terms", "clause", "nda", "privacy",
  "policy", "legal", "law", "deed", "lease", "license", "mou",
];
const RESEARCH_KEYWORDS = [
  "research", "paper", "thesis", "dissertation", "study", "journal",
  "findings", "abstract", "methodology", "analysis", "survey",
];
const FINANCIAL_KEYWORDS = [
  "financial", "report", "balance", "income", "revenue", "budget",
  "forecast", "invoice", "audit", "quarterly", "annual", "fiscal",
];
const TECHNICAL_KEYWORDS = [
  "specification", "architecture", "api", "design", "system", "technical",
  "documentation", "doc", "readme", "manual", "guide", "reference",
];

type DocCategory =
  | "resume"
  | "legal"
  | "research"
  | "financial"
  | "technical"
  | "general";

// ---------------------------------------------------------------------------
// Category detection
// ---------------------------------------------------------------------------

function detectCategory(doc: Document): DocCategory {
  // 1. Trust metadata if already classified
  const category = doc.metadata?.documentCategory?.toLowerCase() ?? "";
  if (category.includes("resume") || category.includes("cv")) return "resume";
  if (category.includes("legal") || category.includes("contract")) return "legal";
  if (category.includes("research") || category.includes("paper")) return "research";
  if (
    category.includes("financial") ||
    category.includes("report") ||
    category.includes("invoice")
  )
    return "financial";
  if (category.includes("technical") || category.includes("manual")) return "technical";

  // 2. Fall back to file-name heuristics
  const name = doc.name.toLowerCase();
  if (RESUME_KEYWORDS.some((k) => name.includes(k))) return "resume";
  if (LEGAL_KEYWORDS.some((k) => name.includes(k))) return "legal";
  if (RESEARCH_KEYWORDS.some((k) => name.includes(k))) return "research";
  if (FINANCIAL_KEYWORDS.some((k) => name.includes(k))) return "financial";
  if (TECHNICAL_KEYWORDS.some((k) => name.includes(k))) return "technical";

  // 3. Scan key topics from insights
  const topics = (doc.insights?.keyTopics ?? []).map((t) => t.toLowerCase());
  if (RESUME_KEYWORDS.some((k) => topics.some((t) => t.includes(k)))) return "resume";
  if (LEGAL_KEYWORDS.some((k) => topics.some((t) => t.includes(k)))) return "legal";
  if (RESEARCH_KEYWORDS.some((k) => topics.some((t) => t.includes(k)))) return "research";
  if (FINANCIAL_KEYWORDS.some((k) => topics.some((t) => t.includes(k)))) return "financial";
  if (TECHNICAL_KEYWORDS.some((k) => topics.some((t) => t.includes(k)))) return "technical";

  return "general";
}

// ---------------------------------------------------------------------------
// Per-category base questions
// ---------------------------------------------------------------------------

const BASE_QUESTIONS: Record<DocCategory, string[]> = {
  resume: [
    "What skills are mentioned?",
    "What technologies are listed?",
    "Summarise the candidate profile.",
    "What work experience is described?",
    "What education credentials are listed?",
  ],
  legal: [
    "What are the important dates in this document?",
    "Identify the key obligations of each party.",
    "Summarise the main clauses.",
    "Are there any termination conditions?",
    "What penalties or liabilities are mentioned?",
  ],
  research: [
    "Summarise the key findings.",
    "What are the main conclusions?",
    "What methodology was used?",
    "What are the limitations of this study?",
    "Extract the most important facts.",
  ],
  financial: [
    "What are the key financial figures?",
    "Summarise the revenue and expense breakdown.",
    "What trends are identified?",
    "Are there any risks or warnings mentioned?",
    "What period does this report cover?",
  ],
  technical: [
    "Summarise the architecture described.",
    "What technologies or tools are mentioned?",
    "What are the key requirements?",
    "List the main components or modules.",
    "Are there any known limitations or constraints?",
  ],
  general: [
    "Summarise the document's main point.",
    "What are the core conclusions?",
    "Find all key figures and mentions.",
    "What is the purpose of this document?",
    "Give me an overview of the first page.",
  ],
};

// ---------------------------------------------------------------------------
// Entity-aware enrichment
// ---------------------------------------------------------------------------

function enrichWithEntities(
  questions: string[],
  doc: Document
): string[] {
  const entities = doc.insights?.entities;
  if (!entities) return questions;

  const enriched: string[] = [];

  // Mention the first person found
  const firstPerson = entities.people?.[0]?.name;
  if (firstPerson) {
    enriched.push(`What role does ${firstPerson} play in this document?`);
  }

  // Mention the first organisation found
  const firstOrg = entities.organizations?.[0]?.name;
  if (firstOrg) {
    enriched.push(`What is the involvement of ${firstOrg}?`);
  }

  return enriched;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const SuggestionsService = {
  /**
   * Generate 3–5 contextual suggested questions for the given document.
   * Returns the base category questions first, then entity-aware extras,
   * trimmed to a maximum of 5.
   */
  getSuggestions(doc: Document | null): string[] {
    if (!doc) {
      return BASE_QUESTIONS.general.slice(0, 4);
    }

    const category = detectCategory(doc);
    const base = BASE_QUESTIONS[category].slice(0, 4);
    const extras = enrichWithEntities([], doc).slice(0, 2);

    // Combine: base first, then extras, cap at 5
    const combined = [...base, ...extras].slice(0, 5);

    // Always return at least 3
    return combined.length >= 3 ? combined : BASE_QUESTIONS.general.slice(0, 4);
  },
};
