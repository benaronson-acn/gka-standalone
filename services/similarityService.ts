
// services/similarityService.ts

// A common list of English stop words. This can be expanded.
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', "aren't", 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  "can't", 'cannot', 'could', "couldn't", 'did', "didn't", 'do', 'does', "doesn't", 'doing', "don't", 'down', 'during',
  'each', 'few', 'for', 'from', 'further', 'had', "hadn't", 'has', "hasn't", 'have', "haven't", 'having', 'he', "he'd",
  "he'll", "he's", 'her', 'here', "here's", 'hers', 'herself', 'him', 'himself', 'his', 'how', "how's",
  'i', "i'd", "i'll", "i'm", "i've", 'if', 'in', 'into', 'is', "isn't", 'it', "it's", 'its', 'itself',
  "let's", 'me', 'more', 'most', "mustn't", 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only',
  'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', "shan't", 'she', "she'd", "she'll",
  "she's", 'should', "shouldn't", 'so', 'some', 'such', 'than', 'that', "that's", 'the', 'their', 'theirs', 'them',
  'themselves', 'then', 'there', "there's", 'these', 'they', "they'd", "they'll", "they're", "they've", 'this', 'those',
  'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', "wasn't", 'we', "we'd", "we'll", "we're", "we've",
  'were', "weren't", 'what', "what's", 'when', "when's", 'where', "where's", 'which', 'while', 'who', "who's", 'whom',
  'why', "why's", 'with', "won't", 'would', "wouldn't", 'you', "you'd", "you'll", "you're", "you've", 'your', 'yours',
  'yourself', 'yourselves'
]);

/**
 * Pre-processes text by converting to lowercase, removing punctuation, and filtering stop words.
 * @param text The input string.
 * @returns An array of processed words (tokens).
 */
const preprocessAndTokenize = (text: string): string[] => {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/) // Split into words
    .filter(word => word && !STOP_WORDS.has(word)); // Filter out empty strings and stop words
};

/**
 * Creates a word frequency map (vector) from an array of tokens.
 * @param tokens An array of words.
 * @returns A map of word to its frequency.
 */
const createFrequencyMap = (tokens: string[]): Map<string, number> => {
  const freqMap = new Map<string, number>();
  for (const token of tokens) {
    freqMap.set(token, (freqMap.get(token) || 0) + 1);
  }
  return freqMap;
};

/**
 * Calculates the cosine similarity between two texts.
 * @param textA The first text string.
 * @param textB The second text string.
 * @returns A similarity score between 0 and 1. Returns 0 if either text is empty.
 */
export const calculateCosineSimilarity = (textA: string, textB: string): number => {
  if (!textA || !textB) {
    return 0;
  }

  const tokensA = preprocessAndTokenize(textA);
  const tokensB = preprocessAndTokenize(textB);

  if (tokensA.length === 0 || tokensB.length === 0) {
    return 0;
  }

  const freqMapA = createFrequencyMap(tokensA);
  const freqMapB = createFrequencyMap(tokensB);

  const vocabulary = new Set([...tokensA, ...tokensB]);

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (const token of vocabulary) {
    const freqA = freqMapA.get(token) || 0;
    const freqB = freqMapB.get(token) || 0;

    dotProduct += freqA * freqB;
    magnitudeA += freqA * freqA;
    magnitudeB += freqB * freqB;
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0; // Avoid division by zero
  }

  return dotProduct / (magnitudeA * magnitudeB);
};

/**
 * Calculates the Jaccard Similarity between two lists of strings (e.g. Citation Titles).
 * Comparison is insensitive to case and whitespace.
 * @param listA First list of strings
 * @param listB Second list of strings
 * @returns A score between 0 and 1.
 */
export const calculateSetSimilarity = (listA: string[], listB: string[]): number => {
  const normalize = (s: string) => s.trim().toLowerCase();
  
  const setA = new Set(listA.map(normalize));
  const setB = new Set(listB.map(normalize));

  if (setA.size === 0 && setB.size === 0) {
    return 1; // Both are empty, so they are identical in their lack of citations
  }

  // Intersection: Items in both sets
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  
  // Union: All unique items
  const union = new Set([...setA, ...setB]);

  return intersection.size / union.size;
};
