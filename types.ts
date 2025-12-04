// FIX: Removed the self-import of KeywordFoundStatus which was conflicting with its own declaration.
export type KeywordFoundStatus = true | false;  // i recognize this isn't needed but was a copilot error, just leaving for now as it works technically
export type KeywordFoundStatusText = "✅ Found" | "❌ Not Found" | "N/A (Error)";

export interface Citation {
  uri: string;
  title: string;
  isUnique?: boolean;
}

export interface IterationResult {
  iterationNumber: number;
  response: string | null;
  keywordFound: KeywordFoundStatus;
  keywordFoundStatusText: KeywordFoundStatusText;
  error?: string | null;
  similarityScore?: number; // Score from 0 to 1, compared to the first iteration (Text Body)
  citations?: Citation[];
  citationSimilarityScore?: number; // Score from 0 to 1, compared to the first iteration (Citation Titles)
}

export interface AnalysisResult {
  promptNumber: number;
  prompt: string;
  iterationResults: IterationResult[];
  summaryStatus: boolean;
  summaryStatusText: string;
  noContextResult?: IterationResult; // Result of the single run without context
}

export interface ExpandedSearchOptions {
  lowercase: boolean;
  capitalize: boolean;
  removeApostrophes: boolean;
  noSpaces: boolean;
  website: boolean;
  partial: boolean;
}

export interface AnalysisSession {
  id: number; // Using timestamp for simplicity
  timestamp: string;
  keyword: string;
  prompts: { id: number; value: string }[];
  results: AnalysisResult[];
  iterations: number;
  context?: string;
  isContextEnabled?: boolean;
  useSearch?: boolean;
  isExpandedSearch?: boolean;
  expandedSearchOptions?: ExpandedSearchOptions;
  personaId?: string;
}

export interface Persona {
  id: string;
  name: string;
  content: string;
  isDefault?: boolean;
}

export interface MultiSessionAnalysis {
  id: number;
  timestamp: string;
  sessionIds: number[];
  keyword: string;
}