import React, { useState, useEffect } from 'react';
import { runGeminiPrompt, getDailyUsageCount, DAILY_LIMIT } from './services/geminiService';
import { calculateCosineSimilarity, calculateSetSimilarity } from './services/similarityService';
import { AnalysisResult, KeywordFoundStatus, KeywordFoundStatusText, AnalysisSession, IterationResult, Persona, Citation, ExpandedSearchOptions, MultiSessionAnalysis } from './types';
import { DefaultPersonas, MockSession } from './data';
import ResultCard from './components/ResultCard';
import HistorySidebar from './components/HistorySidebar';
import PersonaSaveModal from './components/PersonaSaveModal';
import MarkdownViewer from './components/MarkdownViewer';
import LoginScreen from './components/LoginScreen';
import ReportView from './components/ReportView';
import AlertModal from './components/AlertModal';
import Navbar from './components/Navbar';
import About from './components/About';
import Tooltip from './components/Tooltip';
import './index.css';

const MAX_PROMPTS = 5;
const MAX_ITERATIONS = 5;
const HISTORY_KEY = 'geminiAnalysisHistory';
const ANALYSIS_HISTORY_KEY = 'geminiMultiAnalysisHistory';
const PERSONA_KEY = 'geminiCustomPersonas';
const AUTH_SESSION_KEY = 'gemini_app_auth';

// NOTE: Set this to `process.env.NODE_ENV === 'production'` or `import.meta.env.PROD` 
// if you only want to enforce the password in production.
// For now, it defaults to true so you can verify the feature works.
const ENABLE_AUTH_PROTECTION = true; 

const DEFAULT_PERSONAS: Persona[] = DefaultPersonas;

const MOCK_SESSION: AnalysisSession = MockSession;

/**
 * @param: index = iterationResults[i]
 */
const calculateCitationUniqueness = (currentIteration: IterationResult, seenUrls: Set<string>, i: number) => {
  const normalize = (s: string) => s.trim().toLowerCase();
  const currentCitations = currentIteration.citations || [];

  // i=0 base case, add to seenUrls
  if (i === 0) {
    // add the title of each item in current citations to seenUrls to build base
    currentCitations.forEach(c => {
      seenUrls.add(normalize(c.title));
      c.isUnique = true;
    });

    return seenUrls;
  } else {
    for (let j = 0; j < currentCitations.length; j++) {
      const citation = currentCitations[j];
      const normalizedTitle = normalize(citation.title);

      if (!seenUrls.has(normalizedTitle)) {
        citation.isUnique = true;
        seenUrls.add(normalizedTitle);
      } else {
        citation.isUnique = false;
      }
    }
    return seenUrls;
  }
}


const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center">
    <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-[var(--acn-light-purple)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <span className="text-lg text-gray-300">Analyzing...</span>
  </div>
);

const App: React.FC = () => {
  const [prompts, setPrompts] = useState([{ id: Date.now(), value: "entrepreneur mentorship opportunities" }]);
  const [keyword, setKeyword] = useState<string>("sky's the limit");
  const [iterations, setIterations] = useState<number>(1);
  const [context, setContext] = useState<string>("");
  const [isContextEnabled, setIsContextEnabled] = useState<boolean>(true);
  const [useSearch, setUseSearch] = useState<boolean>(false);
  const [isTargetUrlEnabled, setIsTargetUrlEnabled] = useState<boolean>(true);
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [isTargetUrlValid, setIsTargetUrlValid] = useState<boolean>(true);
  const [isExpandedSearch, setIsExpandedSearch] = useState<boolean>(false);
  const [expandedSearchOptions, setExpandedSearchOptions] = useState<ExpandedSearchOptions>({
    lowercase: true,
    capitalize: true,
    removeApostrophes: true,
    noSpaces: true,
    website: true,
    partial: false,
  });
  const [results, setResults] = useState<AnalysisResult[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AnalysisSession[]>([]);
  const [analysisHistory, setAnalysisHistory] = useState<MultiSessionAnalysis[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [dailyUsageCount, setDailyUsageCount] = useState<number>(0);
  
  // Page navigation state
  const [currentPage, setCurrentPage] = useState<'home' | 'about'>('home');

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Persona State
  const [customPersonas, setCustomPersonas] = useState<Persona[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>("");
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);

  // Markdown Viewer State
  const [markdownContent, setMarkdownContent] = useState<string | null>(null);
  const [isMarkdownViewerOpen, setIsMarkdownViewerOpen] = useState(false);

  // Report View State
  const [sessionsForReport, setSessionsForReport] = useState<AnalysisSession[] | null>(null);

  // Multi-Session Select State
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<number>>(new Set());
  
  // Alert Modal State
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertModalMessage, setAlertModalMessage] = useState('');

  useEffect(() => {
    // Check Authentication
    if (ENABLE_AUTH_PROTECTION) {
      const auth = sessionStorage.getItem(AUTH_SESSION_KEY);
      if (auth === 'true') {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(true);
    }

    // Load History
    try {
      const storedHistory = localStorage.getItem(HISTORY_KEY);
      let parsedHistory: AnalysisSession[] = [];
      if (storedHistory) {
        parsedHistory = JSON.parse(storedHistory);
      }

      // Add Mock Session if not present
      if (!parsedHistory.some(s => s.id === MOCK_SESSION.id)) {
        parsedHistory.push(MOCK_SESSION);
      }
      
      setHistory(parsedHistory.sort((a, b) => b.id - a.id));
    } catch (e) {
      console.error("Failed to parse history from localStorage", e);
      // Fallback to mock session on error
      setHistory([MOCK_SESSION]);
      localStorage.removeItem(HISTORY_KEY);
    }

    // Load Analysis History
    try {
      const storedAnalysisHistory = localStorage.getItem(ANALYSIS_HISTORY_KEY);
      if (storedAnalysisHistory) {
        setAnalysisHistory(JSON.parse(storedAnalysisHistory));
      }
    } catch(e) {
      console.error("Failed to parse analysis history from localStorage", e);
    }

    // Load Custom Personas
    try {
      const storedPersonas = localStorage.getItem(PERSONA_KEY);
      if (storedPersonas) {
        setCustomPersonas(JSON.parse(storedPersonas));
      }
    } catch (e) {
      console.error("Failed to parse personas from localStorage", e);
    }

    // Load initial usage count
    setDailyUsageCount(getDailyUsageCount());
  }, []);
  
  useEffect(() => {
    if (!isTargetUrlEnabled || targetUrl.trim() === '') {
        setIsTargetUrlValid(true);
        return;
    }
    // Simple regex to check for something like domain.tld. Allows for subdomains.
    const urlRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    setIsTargetUrlValid(urlRegex.test(targetUrl.trim()));
  }, [targetUrl, isTargetUrlEnabled]);

  const handleLogin = () => {
    sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
    setIsAuthenticated(true);
  };

  const handlePromptChange = (id: number, value: string) => {
    setPrompts(prompts.map(p => (p.id === id ? { ...p, value } : p)));
  };

  const handleAddPrompt = () => {
    if (prompts.length < MAX_PROMPTS) {
      setPrompts([...prompts, { id: Date.now(), value: "" }]);
    }
  };

  const handleRemovePrompt = (id: number) => {
    if (prompts.length > 1) {
      setPrompts(prompts.filter(p => p.id !== id));
    }
  };

  const handleIterationsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value) || value < 1) {
        value = 1;
    } else if (value > MAX_ITERATIONS) {
        value = MAX_ITERATIONS;
    }
    setIterations(value);
  };
  
  const handleLoadSession = (id: number) => {
    const session = history.find(s => s.id === id);
    if (session) {
      setKeyword(session.keyword);
      setPrompts(session.prompts);
      setResults(session.results);
      setIterations(session.iterations || 1);
      setContext(session.context || "");
      setIsContextEnabled(session.isContextEnabled !== false);
      setUseSearch(session.useSearch ?? false);
      setIsTargetUrlEnabled(session.isTargetUrlEnabled ?? true);
      setTargetUrl(session.targetUrl || '');
      setIsExpandedSearch(session.isExpandedSearch ?? false);
      if (session.expandedSearchOptions) {
        setExpandedSearchOptions(session.expandedSearchOptions);
      }
      setCurrentSessionId(session.id);
      setError(null);
      setIsLoading(false);
      
      // Try to match context to a persona
      setSelectedPersonaId(session.personaId || "");
    }
  };

  const handleDeleteSession = (id: number) => {
    setHistory(prevHistory => {
      const updatedHistory = prevHistory.filter(s => s.id !== id);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
      
      if (currentSessionId === id) {
        handleNewSession();
      }
      
      return updatedHistory;
    });
  };

  const handleNewSession = () => {
    setPrompts([{ id: Date.now(), value: "" }]);
    setKeyword("");
    setResults(null);
    setError(null);
    setIterations(1);
    setContext("");
    setIsContextEnabled(true);
    setUseSearch(false);
    setIsTargetUrlEnabled(true);
    setTargetUrl('');
    setIsExpandedSearch(false);
    setCurrentSessionId(null);
    setSelectedPersonaId("");
    setIsLoading(false);
  };

  const handleSavePersona = (name: string) => {
    // Check if duplicate exists
    const existingIndex = customPersonas.findIndex(p => p.name.toLowerCase() === name.trim().toLowerCase());

    if (existingIndex >= 0) {
        // Update existing persona
        const updatedPersonas = [...customPersonas];
        const existingPersona = updatedPersonas[existingIndex];
        updatedPersonas[existingIndex] = {
            ...existingPersona,
            content: context // Update content with current context
        };
        setCustomPersonas(updatedPersonas);
        localStorage.setItem(PERSONA_KEY, JSON.stringify(updatedPersonas));
        setSelectedPersonaId(existingPersona.id);
    } else {
        // Create new persona
        const newPersona: Persona = {
          id: `custom_${Date.now()}`,
          name: name,
          content: context,
          isDefault: false
        };
    
        const updatedPersonas = [...customPersonas, newPersona];
        setCustomPersonas(updatedPersonas);
        localStorage.setItem(PERSONA_KEY, JSON.stringify(updatedPersonas));
        setSelectedPersonaId(newPersona.id);
    }
    
    setIsPersonaModalOpen(false);
  };

  const handleContextChange = (newContext: string) => {
    setContext(newContext);
    // If the user manually edits the text, we check if it still matches the selected persona.
    // If not, deselect the persona (switch to "Custom/None" state implicitly in UI logic).
    const allPersonas = [...DEFAULT_PERSONAS, ...customPersonas];
    const currentPersona = allPersonas.find(p => p.id === selectedPersonaId);
    
    if (currentPersona && currentPersona.content !== newContext) {
      setSelectedPersonaId("");
    }
  };

  const handlePersonaSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedPersonaId(id);
    
    if (id) {
      const allPersonas = [...DEFAULT_PERSONAS, ...customPersonas];
      const persona = allPersonas.find(p => p.id === id);
      if (persona) {
        setContext(persona.content);
      }
    } else {
      setContext("");
    }
  };

  const handleViewMarkdown = (content: string) => {
    setMarkdownContent(content);
    setIsMarkdownViewerOpen(true);
  };

  // Report Handlers
  const handleOpenReport = () => {
    if (history.length > 0) {
      const reportSession = currentSessionId 
        ? history.find(s => s.id === currentSessionId) || history[0]
        : history[0];
      setSessionsForReport([reportSession]);
    } else {
      setError("Run an analysis first to generate a report.");
    }
  };

  const handleCloseReport = () => {
    setSessionsForReport(null);
  };

  const handleToggleMultiSelect = () => {
    setIsMultiSelectMode(prev => !prev);
    setSelectedSessionIds(new Set()); // Reset on toggle
  };

  const handleSessionSelect = (id: number) => {
    setSelectedSessionIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else if (newSet.size < 3) {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleAnalyzeSelectedSessions = () => {
    if (selectedSessionIds.size >= 2 && selectedSessionIds.size <= 3) {
      const selectedSessions = history
        .filter(s => selectedSessionIds.has(s.id))
        .sort((a, b) => a.id - b.id);
      
      const firstKeyword = selectedSessions[0]?.keyword;
      const allKeywordsMatch = selectedSessions.every(s => s.keyword === firstKeyword);

      if (!allKeywordsMatch) {
        setAlertModalMessage("For now, you can only compare sessions that use the same keyword.");
        setIsAlertModalOpen(true);
        return;
      }
        
      setSessionsForReport(selectedSessions);
      
      const newAnalysis: MultiSessionAnalysis = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        sessionIds: selectedSessions.map(s => s.id),
        keyword: firstKeyword,
      };

      setAnalysisHistory(prev => {
        const updatedHistory = [newAnalysis, ...prev];
        localStorage.setItem(ANALYSIS_HISTORY_KEY, JSON.stringify(updatedHistory));
        return updatedHistory;
      });

      setIsMultiSelectMode(false);
      setSelectedSessionIds(new Set());
    }
  };

  const handleLoadMultiSessionAnalysis = (analysisId: number) => {
    const analysis = analysisHistory.find(a => a.id === analysisId);
    if (analysis) {
      const sessionsToReport = history.filter(s => analysis.sessionIds.includes(s.id));
      if (sessionsToReport.length === analysis.sessionIds.length) {
        setSessionsForReport(sessionsToReport.sort((a,b) => a.id - b.id));
      } else {
        setAlertModalMessage("Some sessions from this analysis could not be found. They may have been deleted.");
        setIsAlertModalOpen(true);
      }
    }
  };

  const handleDeleteMultiSessionAnalysis = (analysisId: number) => {
    setAnalysisHistory(prev => {
      const updatedHistory = prev.filter(a => a.id !== analysisId);
      localStorage.setItem(ANALYSIS_HISTORY_KEY, JSON.stringify(updatedHistory));
      return updatedHistory;
    });
  };


  const handleExpandedSearchOptionsChange = (option: keyof ExpandedSearchOptions) => {
    setExpandedSearchOptions(prev => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  const checkKeywordVariations = (text: string, baseKeyword: string, options: ExpandedSearchOptions): boolean => {
    if (!text || !baseKeyword) return false;
  
    const variations: string[] = [baseKeyword];
  
    if (options.lowercase) {
      variations.push(baseKeyword.toLowerCase());
    }
    if (options.capitalize) {
      variations.push(baseKeyword.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '));
    }
    if (options.removeApostrophes) {
      variations.push(baseKeyword.replace(/'/g, ''));
    }
    if (options.noSpaces) {
      variations.push(baseKeyword.replace(/\s+/g, ''));
    }
    if (options.website) {
      const noSpaceNoApostrophe = baseKeyword.replace(/'/g, '').replace(/\s+/g, '').toLowerCase();
      variations.push(`${noSpaceNoApostrophe}.org`, `${noSpaceNoApostrophe}.com`, `${noSpaceNoApostrophe}.net`);
    }
  
    const uniqueVariations = [...new Set(variations)];
    const lowerText = text.toLowerCase();
  
    for (const variation of uniqueVariations) {
      if (lowerText.includes(variation.toLowerCase())) {
        return true;
      }
    }
  
    return false;
  };

  const handleSearch = async () => {
    const activePrompts = prompts.filter(p => p.value.trim());
    if (activePrompts.length === 0 || !keyword.trim()) {
      setError("Please provide a keyword and at least one prompt.");
      setResults(null);
      return;
    }

    if (dailyUsageCount >= DAILY_LIMIT) {
        setError("You have run out of runs for today. Contact admin for more or return tomorrow.");
        return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    const analysisPromises = prompts.map(async (p, index): Promise<AnalysisResult> => {
      if (!p.value.trim()) {
        return {
          promptNumber: index + 1,
          prompt: p.value,
          iterationResults: [{
            iterationNumber: 1,
            response: null,
            keywordFound: false,
            keywordFoundStatusText:  "N/A (Error)",
            error: "Prompt cannot be empty."
          }],
          summaryStatus: false,
          summaryStatusText: "Error"
        };
      }
      
      const iterationPromises = Array.from({ length: iterations }, (_, i) => i + 1).map(
        async (iterNum): Promise<IterationResult> => {
          let responseText: string | null = null;
          let citations: Citation[] = [];
          let errorMessage: string | null = null;
          try {
            const result = await runGeminiPrompt(p.value, isContextEnabled ? context : undefined, useSearch);
            responseText = result.text;
            citations = result.citations;
          } catch (e) {
            errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
          }

          let foundStatus: KeywordFoundStatus = false;
          let foundStatusText: KeywordFoundStatusText = "❌ Not Found";
          if (errorMessage) {
              foundStatus = false;
              foundStatusText = "N/A (Error)";
          } else if (responseText) {
              if (isExpandedSearch) {
                  foundStatus = checkKeywordVariations(responseText, keyword, expandedSearchOptions);
              } else {
                  foundStatus = responseText.toLowerCase().includes(keyword.toLowerCase());
              }

              if (foundStatus) {
                  foundStatusText = "✅ Found";
              }
          }

          return {
            iterationNumber: iterNum,
            response: responseText,
            keywordFound: foundStatus,
            keywordFoundStatusText: foundStatusText,
            error: errorMessage,
            citations: citations
          };
        }
      );
      
      let noContextPromise: Promise<IterationResult | null> = Promise.resolve(null);
      if (isContextEnabled && context.trim()) {
        noContextPromise = (async (): Promise<IterationResult> => {
          let responseText: string | null = null;
          let citations: Citation[] = [];
          let errorMessage: string | null = null;
          try {
            const result = await runGeminiPrompt(p.value, undefined, useSearch); 
            responseText = result.text;
            citations = result.citations;
          } catch (e) {
            errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
          }

          let foundStatus: KeywordFoundStatus = false;
          let foundStatusText: KeywordFoundStatusText = "❌ Not Found";
          if (errorMessage) {
              foundStatus = false;
              foundStatusText = "N/A (Error)";
          } else if (responseText) {
            if (isExpandedSearch) {
                foundStatus = checkKeywordVariations(responseText, keyword, expandedSearchOptions);
            } else {
                foundStatus = responseText.toLowerCase().includes(keyword.toLowerCase());
            }

            if (foundStatus) {
                foundStatusText = "✅ Found";
            }
          }

          return {
            iterationNumber: 0, // Special ID for no-context
            response: responseText,
            keywordFound: foundStatus,
            keywordFoundStatusText: foundStatusText,
            error: errorMessage,
            citations: citations
          };
        })();
      }

      const [iterationResults, noContextResultData] = await Promise.all([
        Promise.all(iterationPromises),
        noContextPromise
      ]);

      // Calculate Similarity Score, Citation Similarity and Citation Uniqueness across iterations
      let seenUrls = new Set<string>();
      if (iterationResults.length > 0 && iterationResults[0].response) {
        const baselineResponse = iterationResults[0].response;
        // Use citations from the first iteration as the baseline for comparison
        const baselineCitations = iterationResults[0].citations || [];
        const baselineTitles = baselineCitations.map(c => c.title);

        // Add citations from iteration 1 (i=0) to seenUrls first
        if (iterationResults[0] && useSearch && iterationResults[0].citations) {
          seenUrls = calculateCitationUniqueness(iterationResults[0], seenUrls, 0);
        }
        

        // Score for normal iterations
        for (let i = 1; i < iterationResults.length; i++) {
          const currentResponse = iterationResults[i].response;
          if (currentResponse) {
            // Calculate Response Similarity Score
            iterationResults[i].similarityScore = calculateCosineSimilarity(baselineResponse, currentResponse);
            
            if (useSearch && iterationResults[i].citations) {
                // Calculate Citation Similarity
                const currentTitles = iterationResults[i].citations!.map(c => c.title);

                iterationResults[i].citationSimilarityScore = calculateSetSimilarity(baselineTitles, currentTitles);

                // Calculate Citation Uniqueness
                seenUrls = calculateCitationUniqueness(iterationResults[i], seenUrls, i);
            }
          }
        }
        
        // Score for no-context result
        if (noContextResultData && noContextResultData.response) {
          noContextResultData.similarityScore = calculateCosineSimilarity(baselineResponse, noContextResultData.response);
           if (useSearch && noContextResultData.citations) {
                const currentTitles = noContextResultData.citations!.map(c => c.title);
                noContextResultData.citationSimilarityScore = calculateSetSimilarity(baselineTitles, currentTitles);
            }
        }
      }
      
      const foundCount = iterationResults.filter(r => r.keywordFound == true).length;
      let summaryStatus: boolean;
      let summaryStatusText: string;
      if (foundCount > 0) {
        summaryStatus = true;
        summaryStatusText = `✅ Found in ${foundCount}/${iterations}`;
      } else {
        summaryStatus = false;
        summaryStatusText = `❌ Not Found in ${iterations} iterations`;
      }

      return {
        promptNumber: index + 1,
        prompt: p.value,
        iterationResults: iterationResults,
        summaryStatus: summaryStatus,
        summaryStatusText: summaryStatusText,
        noContextResult: noContextResultData || undefined,
      };
    });

    const analysisResults = await Promise.all(analysisPromises);
    setResults(analysisResults);
    setIsLoading(false);
    
    // Refresh usage count after all iterations are done
    setDailyUsageCount(getDailyUsageCount());

    const newSession: AnalysisSession = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      keyword: keyword,
      prompts: prompts,
      results: analysisResults,
      iterations: iterations,
      context: context,
      isContextEnabled: isContextEnabled,
      useSearch: useSearch,
      isTargetUrlEnabled: isTargetUrlEnabled,
      targetUrl: targetUrl,
      isExpandedSearch: isExpandedSearch,
      expandedSearchOptions: expandedSearchOptions,
      personaId: selectedPersonaId,
    };

    setHistory(prevHistory => {
        const updatedHistory = [newSession, ...prevHistory];
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
        return updatedHistory;
    });
    setCurrentSessionId(newSession.id);
  };
  
  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const allPersonas = [...DEFAULT_PERSONAS, ...customPersonas];
  const isLimitReached = dailyUsageCount >= DAILY_LIMIT;

  // Render Report View
  if (sessionsForReport) {
    return (
      <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col relative print:h-auto print:overflow-visible print:block">
         <ReportView sessions={sessionsForReport} onBack={handleCloseReport} allPersonas={allPersonas} />
      </div>
    );
  }
  
  // Render Main Dashboard
  return (
    <div className="h-screen bg-[#141414] text-white font-sans flex flex-col overflow-hidden relative">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1f2937; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6b7280; }
        .animate-fade-in { animation: fadeIn 0.5s ease-in-out; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .accordion-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease-out, padding 0.3s ease-out;
          padding-top: 0;
          padding-bottom: 0;
        }
        .accordion-content.expanded {
          max-height: 8000px; /* Greatly increased to prevent clipping long content */
          transition: max-height 0.8s ease-in-out, padding 0.5s ease-in-out;
          padding-top: 1rem;
          padding-bottom: 1.5rem;
        }
        .accordion-textarea.expanded {
          max-height: 600px;
          transition: max-height 0.4s ease-in-out;
        }
      `}</style>
      
      <PersonaSaveModal 
        isOpen={isPersonaModalOpen}
        onClose={() => setIsPersonaModalOpen(false)}
        onSave={handleSavePersona}
        currentContent={context}
        existingPersonas={customPersonas}
      />

      <MarkdownViewer 
        isOpen={isMarkdownViewerOpen}
        content={markdownContent}
        onClose={() => setIsMarkdownViewerOpen(false)}
      />

      <AlertModal 
        isOpen={isAlertModalOpen}
        message={alertModalMessage}
        onClose={() => setIsAlertModalOpen(false)}
      />

      {/* Usage Indicator Badge */}
      <div 
        className={`fixed bottom-4 right-4 z-40 bg-gray-800/90 backdrop-blur border ${isLimitReached ? 'border-red-500' : 'border-gray-600'} rounded-full px-4 py-2 shadow-xl flex items-center space-x-2 animate-fade-in transition-colors duration-300`} 
        title="API calls in the last 24 hours"
      >
         <div className={`w-2 h-2 rounded-full ${isLimitReached ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`}></div>
         <span className={`text-xs font-semibold ${isLimitReached ? 'text-red-300' : 'text-gray-300'}`}>
            {isLimitReached 
                ? "You have run out of runs for today. Contact admin for more or return tomorrow." 
                : `Gemini Usage: ${dailyUsageCount} / ${DAILY_LIMIT}`
            }
         </span>
      </div>

      <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />
      
      <div className="flex flex-1 overflow-hidden">
        {currentPage === 'home' && (
          <HistorySidebar
            history={history}
            analysisHistory={analysisHistory}
            currentSessionId={currentSessionId}
            onLoadSession={handleLoadSession}
            onDeleteSession={handleDeleteSession}
            onNewSession={handleNewSession}
            onViewReport={handleOpenReport}
            isMultiSelectMode={isMultiSelectMode}
            onToggleMultiSelect={handleToggleMultiSelect}
            selectedSessionIds={selectedSessionIds}
            onSessionSelect={handleSessionSelect}
            onAnalyzeSelectedSessions={handleAnalyzeSelectedSessions}
            onLoadMultiSessionAnalysis={handleLoadMultiSessionAnalysis}
            onDeleteMultiSessionAnalysis={handleDeleteMultiSessionAnalysis}
          />
        )}
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar relative">
          {currentPage === 'home' ? (
            <div className="w-full max-w-3xl mx-auto flex-grow p-4 sm:p-6 lg:p-8">
              <header className="text-center mb-8">
                  <h1 className={"text-4xl sm:text-5xl font-bold text-[var(--acn-light-purple)]"}>
                      Gemini Keyword Analyzer
                  </h1>
                  <p className="mt-3 text-lg text-gray-400">
                      Test if Gemini's responses contain a specific keyword or phrase over multiple iterations.
                  </p>
              </header>

              <main className="space-y-6">
                <div className="bg-gray-800/50 backdrop-blur-sm border border-[#460073]/50 p-6 rounded-xl shadow-lg space-y-6">
                  <div>
                    <label htmlFor="keyword" className="block text-sm font-medium text-[var(--acn-light-purple)] mb-2">
                      <div className="flex items-center space-x-2">
                        <span>Keyword to Find</span>
                        <Tooltip>
                          <p className="mb-2">This is the keyword or phrase that the analyzer will search for in the response text. Enable the 'Expanded Search' option below to include common search query variants of this phase.</p>
                          <p>Example: "sky's the limit" would expand to include, for instance, "skysthelimit" (no spaces), "Sky's The Limit" (capitalize), "skys the limit" (no apostrophe), and so on</p>
                        </Tooltip>
                      </div>
                    </label>
                    <input
                      id="keyword"
                      type="text"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder="e.g., sky's the limit"
                      className="w-full bg-gray-900 border border-gray-600 rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-[var(--acn-light-purple)] focus:border-[var(--acn-light-purple)] transition duration-200"
                    />
                  </div>

                  {/* Expanded Search Toggle */}
                  <div>
                    <div className="flex justify-between items-center">
                      <label htmlFor="expand-search-toggle" className="block text-sm font-medium text-[var(--acn-light-purple)]">
                        <div className="flex items-center space-x-2">
                          <span>Enable Expanded Search</span>
                          <Tooltip>
                              <p>Expand the keyword search to include common variations, such as different casing, spacing, or domain extensions.</p>
                          </Tooltip>
                        </div>
                      </label>
                      <label htmlFor="expand-search-toggle" className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          id="expand-search-toggle" 
                          className="sr-only peer"
                          checked={isExpandedSearch}
                          onChange={() => setIsExpandedSearch(!isExpandedSearch)}
                        />
                        <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-[#7500C0] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--acn-light-purple)]"></div>
                      </label>
                    </div>
                    <div className={`accordion-content ${isExpandedSearch ? 'expanded !pb-0' : ''}`}>
                      <div className="pt-4 pl-2 border-t border-gray-700/50">
                        <p className="text-xs text-gray-400 mb-3">Select which keyword variations to include in the analysis:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
                          <label className="flex items-center space-x-3 text-gray-300 cursor-pointer">
                            <input type="checkbox" checked={expandedSearchOptions.lowercase} onChange={() => handleExpandedSearchOptionsChange('lowercase')} className="w-4 h-4 text-[var(--acn-light-purple)] bg-gray-700 border-gray-600 rounded focus:ring-[#7500C0]" />
                            <span>lowercase</span>
                          </label>
                          <label className="flex items-center space-x-3 text-gray-300 cursor-pointer">
                            <input type="checkbox" checked={expandedSearchOptions.capitalize} onChange={() => handleExpandedSearchOptionsChange('capitalize')} className="w-4 h-4 text-[var(--acn-light-purple)] bg-gray-700 border-gray-600 rounded focus:ring-[#7500C0]" />
                            <span>Capitalize</span>
                          </label>
                          <label className="flex items-center space-x-3 text-gray-300 cursor-pointer">
                            <input type="checkbox" checked={expandedSearchOptions.removeApostrophes} onChange={() => handleExpandedSearchOptionsChange('removeApostrophes')} className="w-4 h-4 text-[var(--acn-light-purple)] bg-gray-700 border-gray-600 rounded focus:ring-[#7500C0]" />
                            <span>remove apostrophes</span>
                          </label>
                          <label className="flex items-center space-x-3 text-gray-300 cursor-pointer">
                            <input type="checkbox" checked={expandedSearchOptions.noSpaces} onChange={() => handleExpandedSearchOptionsChange('noSpaces')} className="w-4 h-4 text-[var(--acn-light-purple)] bg-gray-700 border-gray-600 rounded focus:ring-[#7500C0]" />
                            <span>no spaces</span>
                          </label>
                          <label className="flex items-center space-x-3 text-gray-300 cursor-pointer">
                            <input type="checkbox" checked={expandedSearchOptions.website} onChange={() => handleExpandedSearchOptionsChange('website')} className="w-4 h-4 text-[var(--acn-light-purple)] bg-gray-700 border-gray-600 rounded focus:ring-[#7500C0]" />
                            <span>website (.org, .com, .net)</span>
                          </label>
                          <div className="flex items-center space-x-2 text-gray-500 cursor-not-allowed">
                              <input type="checkbox" checked={expandedSearchOptions.partial} disabled className="w-4 h-4 bg-gray-800 border-gray-600 rounded cursor-not-allowed" />
                              <span>Partial</span>
                              <Tooltip><p>Disabled for now.</p></Tooltip>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Context / Persona Section */}
                  <div>
                    <div className="flex justify-between items-center">
                      <label htmlFor="context-toggle" className="block text-sm font-medium text-[var(--acn-light-purple)]">
                        <div className="flex items-center space-x-2">
                          <span>Provide Additional Context (System Instruction)</span>
                          <Tooltip>
                            <p className="mb-2">
                              <a href="https://ai.google.dev/gemini-api/docs/text-generation#system-instructions" target="_blank" rel="noopener noreferrer" className="text-[#C2A3FF] hover:underline">System Instructions</a> are additional inputs that provide context to the AI model on how to behave, in what format to response, and what information is important to inform the response.
                            </p>
                            <p className="mb-2">
                              In this case, it provides us with an option to try to simulate how the Gemini model would respond for various user personas. This can be helpful to consider user demographics, context behind searches, or other information that your platform (or Google) may already have about a user.
                            </p>
                            <p><strong className="text-[#C2A3FF]">Developer Note:</strong> This is not a perfect solution for replicating what a user might see when sending prompts to various AI search engine platforms. For now, though, it can be helpful to get an idea for how web search results might differ based on a user's location or age range, for example.</p>
                          </Tooltip>
                        </div>
                      </label>
                      <label htmlFor="context-toggle" className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          id="context-toggle" 
                          className="sr-only peer"
                          checked={isContextEnabled}
                          onChange={() => setIsContextEnabled(!isContextEnabled)}
                        />
                        <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-[#7500C0] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--acn-light-purple)]"></div>
                      </label>
                    </div>
                    <div className={`accordion-content ${isContextEnabled ? 'expanded accordion-textarea' : ''}`}>
                        <div className="pt-4 space-y-4">
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                  <label htmlFor="persona-select" className="block text-sm font-medium text-gray-400">
                                    Select a Persona or write your own:
                                  </label>
                                  <div className="group relative flex items-center justify-center cursor-help">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-[#C2A3FF] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 p-4 bg-gray-800 text-xs text-gray-300 rounded-lg shadow-2xl border border-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[100]">
                                      <p className="mb-2"><strong className="text-[#C2A3FF]">Persona</strong>: a description of a target audience member.</p>
                                      <p className="mb-2">Typically, personas detail demographic information and product usage behavior to help product stakeholders better understand the context surrounding their average users or target audience.</p>
                                      <p className="mb-2">In this case, the default personas describe underrepresented entrepreneur users most likely to be utilizing the Sky's The Limit website for help with finding mentorship and grant opportunities.</p>
                                      <p>Feel free to modify the default personas or create your own.</p>
                                    </div>
                                  </div>
                                </div>
                              <select
                                id="persona-select"
                                value={selectedPersonaId}
                                onChange={handlePersonaSelect}
                                className="w-full bg-gray-900 border border-gray-600 rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-[var(--acn-light-purple)] focus:border-[var(--acn-light-purple)] transition duration-200"
                              >
                                <option value="">-- Custom / No Persona --</option>
                                <optgroup label="Default Personas">
                                  {DEFAULT_PERSONAS.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                  ))}
                                </optgroup>
                                {customPersonas.length > 0 && (
                                    <optgroup label="My Saved Personas">
                                      {customPersonas.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                      ))}
                                    </optgroup>
                                )}
                              </select>
                            </div>
                            
                            <textarea
                                id="context"
                                value={context}
                                onChange={(e) => handleContextChange(e.target.value)}
                                placeholder="e.g., I am a small business owner looking for marketing advice..."
                                rows={3}
                                className="w-full bg-gray-900 border border-gray-600 rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-[var(--acn-light-purple)] focus:border-[var(--acn-light-purple)] transition duration-200"
                            />
                            
                            {context.trim().length > 0 && selectedPersonaId === "" && (
                              <div className="flex justify-end">
                                <button
                                  onClick={() => setIsPersonaModalOpen(true)}
                                  className="text-sm flex items-center space-x-1 text-[#C2A3FF] hover:text-white transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                  </svg>
                                  <span>Save as Persona</span>
                                </button>
                              </div>
                            )}
                        </div>
                    </div>
                  </div>

                  {/* Google Search Toggle */}
                  <div className="pt-3">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--acn-light-purple)]" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                            <label htmlFor="search-toggle" className="block text-sm font-medium text-[var(--acn-light-purple)]">
                                Enable Google Search & Citations
                            </label>
                            <Tooltip>
                              <p className="mb-2">Toggle this option to On to instruct the model to inform its answers with a web search rather than relying only on the content it was trained on.</p>
                              <p className="mb-2">Toggling this on will enable <strong>citation results</strong>.</p>
                              <p>Read more: <a href="https://ai.google.dev/gemini-api/docs/google-search" target="_blank" rel="noopener noreferrer" className="text-[#C2A3FF] hover:underline">Grounding with Google Search</a>.</p>
                            </Tooltip>
                        </div>
                        <label htmlFor="search-toggle" className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                id="search-toggle" 
                                className="sr-only peer"
                                checked={useSearch}
                                onChange={() => setUseSearch(!useSearch)}
                            />
                            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-[#7500C0] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--acn-light-purple)]"></div>
                        </label>
                    </div>
                  </div>

                  {/* Target URL Feature */}
                  {useSearch && (
                      <div className="pt-3 animate-fade-in">
                          <div className="flex justify-between items-center">
                              <label htmlFor="target-url-toggle" className="block text-sm font-medium text-[var(--acn-light-purple)]">
                                  Enable Target URL
                              </label>
                              <label htmlFor="target-url-toggle" className="relative inline-flex items-center cursor-pointer">
                                  <input 
                                      type="checkbox" 
                                      id="target-url-toggle" 
                                      className="sr-only peer"
                                      checked={isTargetUrlEnabled}
                                      onChange={() => setIsTargetUrlEnabled(!isTargetUrlEnabled)}
                                  />
                                  <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-[#7500C0] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--acn-light-purple)]"></div>
                              </label>
                          </div>
                          
                          {isTargetUrlEnabled && (
                            <div className="mt-4 animate-fade-in">
                                <label htmlFor="target-url" className="block text-sm font-medium text-[var(--acn-light-purple)] mb-2">
                                    <div className="flex items-center space-x-2">
                                        <span>URL to Find</span>
                                        <Tooltip>
                                            <p>Similar to the target keyword field, this field searches for the specified URL in the model's response content. Valid examples include: google.com, skysthelimit.org, etc.</p>
                                        </Tooltip>
                                    </div>
                                </label>
                                <input
                                    id="target-url"
                                    type="text"
                                    value={targetUrl}
                                    onChange={(e) => setTargetUrl(e.target.value)}
                                    placeholder="e.g., www.skysthelimit.org"
                                    className={`w-full bg-gray-900 border rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-[var(--acn-light-purple)] focus:border-[var(--acn-light-purple)] transition duration-200 ${!isTargetUrlValid ? 'border-red-500' : 'border-gray-600'}`}
                                />
                                {!isTargetUrlValid && (
                                    <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        Please enter a valid URL format (e.g., example.com).
                                    </p>
                                )}
                            </div>
                          )}
                      </div>
                  )}

                  {/* Prompts Section */}
                  <div className="space-y-3 border-t border-gray-700 pt-6">
                    <div className="flex justify-between items-center">
                        <label className="block text-sm font-medium text-[var(--acn-light-purple)]">
                          Prompts for Gemini ({prompts.length}/{MAX_PROMPTS})
                        </label>
                        <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-2">
                                <label htmlFor="iterations" className="text-sm font-medium text-[var(--acn-light-purple)]">Iterations</label>
                                <Tooltip>
                                    <p className="mb-2">Indicate how many times the tool should re-run each prompt.</p>
                                    <p className="mb-2"><strong className="text-[#C2A3FF]">Developer's Note:</strong> With traditional SEO, a single search query run repeatedly in a single session will almost always return the same ranking results. With agentic search engines, responses can vary greatly between iterations.</p>
                                    <p>An acknowledgement that this can partially be controlled when using models like Gemini by setting a model's <strong className="text-[#C2A3FF]">temperature</strong>, as opposed to strictly web-based AI results which generally do not allow for users to change this. This feature may be updated as development progresses.</p>
                                </Tooltip>
                            </div>
                            <input
                                id="iterations"
                                type="number"
                                value={iterations}
                                onChange={handleIterationsChange}
                                min="1"
                                max={MAX_ITERATIONS}
                                className="w-20 bg-gray-900 border border-gray-600 rounded-md p-2 text-center text-gray-200 focus:ring-2 focus:ring-[var(--acn-light-purple)] focus:border-[var(--acn-light-purple)] transition duration-200"
                            />
                        </div>
                    </div>
                    {prompts.map((p, index) => (
                      <div key={p.id} className="flex items-center space-x-2">
                        <input
                          value={p.value}
                          onChange={(e) => handlePromptChange(p.id, e.target.value)}
                          placeholder={`Prompt #${index + 1}`}
                          className="flex-grow bg-gray-900 border border-gray-600 rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-[var(--acn-light-purple)] focus:border-[var(--acn-light-purple)] transition duration-200"
                        />
                        <button 
                          onClick={() => handleRemovePrompt(p.id)}
                          disabled={prompts.length <= 1}
                          className="p-2 text-gray-400 hover:text-white hover:bg-red-500/50 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                          aria-label="Remove prompt"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>

                  {prompts.length < MAX_PROMPTS && (
                    <button onClick={handleAddPrompt} className="w-full text-[#C2A3FF] border-2 border-dashed border-gray-600 hover:border-[var(--acn-light-purple)] hover:bg-[var(--acn-light-purple)]/10 rounded-md py-2 transition-all duration-200">
                      + Add Prompt
                    </button>
                  )}
                
                  <button
                    onClick={handleSearch}
                    disabled={isLoading || isLimitReached || (isTargetUrlEnabled && !isTargetUrlValid)}
                    className="w-full flex justify-center items-center bg-[var(--acn-main-purple)] hover:bg-[#7500C0] text-white font-bold py-3 px-4 rounded-md shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                  >
                    {isLoading ? 'Analyzing...' : 'Analyze All Responses'}
                  </button>
                </div>

                {error && (
                    <div className="bg-red-900/30 border border-red-500 text-red-300 p-4 rounded-xl animate-fade-in">
                      <p><span className="font-bold">Error:</span> {error}</p>
                    </div>
                )}

                <div className="mt-8 space-y-4">
                  {isLoading && <LoadingSpinner />}
                  {results && (
                    <>
                      <h2 className="text-2xl font-bold text-[var(--acn-light-purple)]">Analysis Results</h2>
                      {results.map((result, index) => (
                        <ResultCard key={index} result={result} onViewMarkdown={handleViewMarkdown} isTargetUrlEnabled={isTargetUrlEnabled} targetUrl={targetUrl} />
                      ))}
                    </>
                  )}
                </div>
              </main>
              
              <footer className="mt-12 mb-6 text-center border-t border-gray-800 pt-6">
                <p className="text-sm text-gray-500">
                  Project build by <a href="mailto:ben.aronson@accenture.com">Ben Aronson</a>. A demo build for ACN.
                </p>
              </footer>
            </div>
          ) : (
            <About />
          )}
        </div>
      </div>
    </div>
  );
};

export default App;