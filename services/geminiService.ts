
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Citation } from "../types";

const MODEL_NAME = "gemini-2.5-flash";
const USAGE_KEY = "gemini_usage_history";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
export const DAILY_LIMIT = 50;

// Helper to manage usage history in localStorage
export const getDailyUsageCount = (): number => {
  try {
    const stored = localStorage.getItem(USAGE_KEY);
    if (!stored) return 0;
    
    const timestamps: number[] = JSON.parse(stored);
    const now = Date.now();
    
    // Filter timestamps older than 24 hours
    const recentTimestamps = timestamps.filter(ts => now - ts < ONE_DAY_MS);
    
    // Update storage if we filtered out old entries to keep it clean
    if (recentTimestamps.length !== timestamps.length) {
      localStorage.setItem(USAGE_KEY, JSON.stringify(recentTimestamps));
    }
    
    return recentTimestamps.length;
  } catch (e) {
    console.error("Failed to read usage history", e);
    return 0;
  }
};

const trackUsage = (): void => {
  try {
    const stored = localStorage.getItem(USAGE_KEY);
    const timestamps: number[] = stored ? JSON.parse(stored) : [];
    const now = Date.now();
    
    // Filter old then add new
    const recentTimestamps = timestamps.filter(ts => now - ts < ONE_DAY_MS);
    recentTimestamps.push(now);
    
    localStorage.setItem(USAGE_KEY, JSON.stringify(recentTimestamps));
  } catch (e) {
    console.error("Failed to track usage", e);
  }
};

// Return type for our processing function
interface ProcessedResponse {
  text: string;
  citations: Citation[];
}

// Helper function to inject citations based on grounding metadata and extract citation objects
function processResponseWithCitations(response: GenerateContentResponse): ProcessedResponse {
  let text = response.text || "";
  const extractedCitations: Citation[] = [];

  const candidate = response.candidates?.[0];
  const groundingMetadata = candidate?.groundingMetadata;

  if (!groundingMetadata) {
      return { text, citations: [] };
  }

  // Grounding Chunks are the links to the actual web pages identified in the search. 
  const chunks = groundingMetadata.groundingChunks;
  // Grounding Supports are references to the location of corresponding text in the prompt response
  const supports = groundingMetadata.groundingSupports;

  // Extract all valid citations for analysis
  if (chunks) {
      chunks.forEach((chunk) => {
          if (chunk.web?.uri && chunk.web?.title) {
              extractedCitations.push({
                  uri: chunk.web.uri,
                  title: chunk.web.title
              });
          }
      });
  }

  // TODO: may need to look at this
  if (!supports || !chunks) return { text, citations: extractedCitations };

  // Sort supports by end_index in descending order to avoid shifting issues when inserting.
  const sortedSupports = [...supports].sort(
    (a, b) => (b.segment?.endIndex ?? 0) - (a.segment?.endIndex ?? 0),
  );

  for (const support of sortedSupports) {
    const endIndex = support.segment?.endIndex;
    if (endIndex === undefined || !support.groundingChunkIndices?.length) {
      continue;
    }

    const citationLinks = support.groundingChunkIndices
      .map((i: number) => {
        const uri = chunks[i]?.web?.uri;
        if (uri) {
          return `[${i + 1}](${uri})`;
        }
        return null;
      })
      .filter((link): link is string => link !== null);

    if (citationLinks.length > 0) {
      const citationString = citationLinks.join(", ");
      text = text.slice(0, endIndex) + citationString + text.slice(endIndex);
    }
  }

  return { text, citations: extractedCitations };
}

export const runGeminiPrompt = async (prompt: string, context?: string, useSearch?: boolean): Promise<ProcessedResponse> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }

  // Check usage limit before proceeding
  const currentUsage = getDailyUsageCount();
  if (currentUsage >= DAILY_LIMIT) {
    throw new Error("You have run out of runs for today. Contact admin for more or return tomorrow.");
  }
  
  // Track this API call
  trackUsage();

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Dynamically build the config object
  const config: {
      temperature: number,
      thinkingConfig: { thinkingBudget: number },
      systemInstruction?: string,
      tools?: any[]
    } = {
    temperature: 0.7,
    thinkingConfig: {
      thinkingBudget: 0, // Disables thinking
    },
  };

  if (context && context.trim()) {
    config.systemInstruction = context;
  }

  if (useSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: config,
    });

    let text = response.text;
    if (text === undefined || text === null) {
      throw new Error("API returned no text content.");
    }

    // Apply citations and extract metadata if search was used
    if (useSearch) {
        return processResponseWithCitations(response);
    }

    // If search wasn't used, we return text and empty citations
    return { text: text.trim(), citations: [] };

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to get response from Gemini: ${error.message}`);
    }
    throw new Error("An unknown error occurred while calling the Gemini API.");
  }
};
