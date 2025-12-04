import React, { useState } from 'react';
import { AnalysisSession, Persona, Citation } from '../types';

interface AdvancedAnalysisProps {
  sessions: AnalysisSession[];
  allPersonas?: Persona[];
}

type AnalysisMode = 'none' | 'citationByPersona' | 'sourceAuthority' | 'contentTheme' | 'nicheSources';

// --- Types for Analysis Results ---
interface PersonaCitationResult {
    personaName: string;
    uniqueCitations: Citation[];
}
  
interface CitationAnalysisResult {
    commonCitations: Citation[];
    personaResults: PersonaCitationResult[];
    prompt: string;
}

const analysisInfo = {
  citationByPersona: {
    title: 'Citation Sources by Persona',
    description: 'This analysis shows how changing the user persona affects the citation sources Gemini provides. It helps to validate personas and provides a clear roadmap for creating targeted content for different audience segments.'
  },
  sourceAuthority: {
    title: 'Source Authority Analysis',
    description: 'Identifies which domains consistently appear across all compared sessions, regardless of persona. These are the high-authority players and prime SEO competitors in this topic space according to the AI.'
  },
  contentTheme: {
    title: 'Content Theme Clustering',
    description: 'Analyzes the titles of all unique citations across the sessions to identify recurring themes. This gives a data-driven view of the primary sub-topics needed to be seen as a comprehensive resource.'
  },
  nicheSources: {
    title: 'Niche Source Discovery',
    description: 'Identifies which sources are unique to a single session or persona. These represent content gaps and opportunities for long-tail keywords that competitors might be ignoring.'
  }
};

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center py-4">
      <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span className="text-md text-gray-300">Analyzing...</span>
    </div>
);


const AdvancedAnalysis: React.FC<AdvancedAnalysisProps> = ({ sessions, allPersonas }) => {
    const [activeAnalysis, setActiveAnalysis] = useState<AnalysisMode>('none');
    
    // State for the analysis workflow
    const [isLoading, setIsLoading] = useState(false);
    const [analysisStep, setAnalysisStep] = useState<'initial' | 'selectPrompt' | 'results' | 'noCommonPrompts'>('initial');
    const [commonPrompts, setCommonPrompts] = useState<string[]>([]);
    const [selectedPrompt, setSelectedPrompt] = useState<string>('');
    const [analysisResult, setAnalysisResult] = useState<CitationAnalysisResult | null>(null);

    const handleAnalysisSelection = (mode: AnalysisMode) => {
        const newMode = activeAnalysis === mode ? 'none' : mode;
        setActiveAnalysis(newMode);
        // Reset state when switching analysis
        setAnalysisStep('initial');
        setAnalysisResult(null);
        setSelectedPrompt('');
        setCommonPrompts([]);
    }

    const handleRunInitialAnalysis = () => {
        if (activeAnalysis !== 'citationByPersona') return;

        setIsLoading(true);

        // Find prompts common to all sessions
        if (sessions.length < 2) {
            setIsLoading(false);
            return;
        }

        const promptSets = sessions.map(s => new Set(s.prompts.map(p => p.value.trim())));
        
        const intersection = promptSets.reduce((acc, currentSet) => {
            return new Set([...acc].filter(prompt => currentSet.has(prompt)));
        });

        const commonPromptsArray = Array.from(intersection);

        if (commonPromptsArray.length > 0) {
            setCommonPrompts(commonPromptsArray);
            setSelectedPrompt(commonPromptsArray[0]);
            setAnalysisStep('selectPrompt');
        } else {
            setAnalysisStep('noCommonPrompts');
        }

        setIsLoading(false);
    };

    const performPersonaCitationAnalysis = () => {
        if (!selectedPrompt) return;
        setIsLoading(true);
        setAnalysisResult(null);

        // Aggregate citations for the selected prompt, grouped by persona
        const citationsByPersona = new Map<string, Citation[]>();
        
        sessions.forEach(session => {
            const personaName = allPersonas?.find(p => p.id === session.personaId)?.name || 'Custom/None';
            const relevantResult = session.results.find(res => res.prompt.trim() === selectedPrompt);
            if (!relevantResult) return;

            const allCitationsForPrompt = relevantResult.iterationResults.flatMap(iter => iter.citations || []);
            // TODO: we actually dont want uniqueCitations, we want all the citaitons so we really get a better idea of each source
            // const uniqueCitations = [...new Map(allCitationsForPrompt.map(c => [c.uri.trim().toLowerCase(), c])).values()];
            citationsByPersona.set(personaName, allCitationsForPrompt);
        });

        // Find intersection (common citations)
        const personaCitationSets = Array.from(citationsByPersona.values()).map(citations => new Set(citations.map(c => c.uri.trim().toLowerCase())));
        if (personaCitationSets.length === 0) {
            setIsLoading(false);
            return;
        }

        const commonUris = personaCitationSets.reduce((acc, currentSet) => {
            return new Set([...acc].filter(uri => currentSet.has(uri)));
        });
        
        const firstPersonaCitations = citationsByPersona.get(Array.from(citationsByPersona.keys())[0]) || [];
        const commonCitations = firstPersonaCitations.filter(c => commonUris.has(c.uri.trim().toLowerCase()));
        
        // Find unique citations per persona
        const personaResults: PersonaCitationResult[] = [];
        for (const [personaName, citations] of citationsByPersona.entries()) {
            const uniqueCitations = citations.filter(c => {
                const currentUri = c.uri.trim().toLowerCase();
                if (commonUris.has(currentUri)) return false;

                for (const [otherPersonaName, otherCitations] of citationsByPersona.entries()) {
                    if (personaName === otherPersonaName) continue;
                    if (otherCitations.some(oc => oc.uri.trim().toLowerCase() === currentUri)) return false;
                }
                return true;
            });
            personaResults.push({ personaName, uniqueCitations });
        }

        setAnalysisResult({
            prompt: selectedPrompt,
            commonCitations,
            personaResults
        });
        setAnalysisStep('results');
        setIsLoading(false);
    };

    const renderPersonaCitationAnalysis = () => {
        if (isLoading) {
            return <LoadingSpinner />;
        }

        switch (analysisStep) {
            case 'initial':
                return (
                     <div className="mt-6">
                        <button onClick={handleRunInitialAnalysis} className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold py-2 px-6 rounded-md shadow-lg transform hover:scale-105 transition-all duration-300">
                            Run Analysis
                        </button>
                    </div>
                );
            
            case 'noCommonPrompts':
                return (
                    <div className="mt-6 p-4 bg-yellow-900/30 border border-yellow-700 rounded-md text-yellow-300 text-sm max-w-lg mx-auto">
                        No common prompts were found across all selected sessions. This analysis requires at least one identical prompt to compare results.
                    </div>
                );

            case 'selectPrompt':
                return (
                    <div className="mt-6 max-w-lg mx-auto space-y-4">
                        <label htmlFor="prompt-select" className="block text-sm font-medium text-gray-300">Select a common prompt to analyze:</label>
                        <select
                            id="prompt-select"
                            value={selectedPrompt}
                            onChange={(e) => setSelectedPrompt(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-200"
                        >
                            {commonPrompts.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <button onClick={performPersonaCitationAnalysis} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-2 px-6 rounded-md shadow-lg transform hover:scale-105 transition-all duration-300">
                            Analyze Citations for this Prompt
                        </button>
                    </div>
                );
            
            case 'results':
                if (!analysisResult) return null;
                const gridColsClass = sessions.length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3';
                return (
                    <div className="mt-6 space-y-6">
                        <div className="text-center">
                            <p className="text-sm text-gray-400">Showing results for prompt:</p>
                            <p className="text-md text-sky-300 italic">"{analysisResult.prompt}"</p>
                        </div>
                        
                        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                            <h5 className="text-md font-bold text-gray-200 mb-2">Common Ground: Sources Shared Across Personas ({analysisResult.commonCitations.length})</h5>
                            {analysisResult.commonCitations.length > 0 ? (
                                <ul className="space-y-1 text-sm list-disc list-inside">
                                    {analysisResult.commonCitations.map(c => (
                                        <li key={c.uri} className="text-gray-300">
                                            <a href={c.uri} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">{c.title}</a>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-500 italic">No common citation sources were found for this prompt.</p>
                            )}
                        </div>

                        <div className={`grid grid-cols-1 ${gridColsClass} gap-4`}>
                            {analysisResult.personaResults.map(({ personaName, uniqueCitations }) => (
                                <div key={personaName} className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                                    <h5 className="text-md font-bold text-gray-200 mb-2">Unique to {personaName} ({uniqueCitations.length})</h5>
                                    {uniqueCitations.length > 0 ? (
                                        <ul className="space-y-1 text-sm list-disc list-inside">
                                            {uniqueCitations.map(c => (
                                                <li key={c.uri} className="text-gray-300">
                                                    <a href={c.uri} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">{c.title}</a>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No unique sources found.</p>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="text-center pt-4">
                             <button onClick={() => setAnalysisStep('selectPrompt')} className="text-sm text-sky-400 hover:text-sky-300 transition-colors">
                                &larr; Analyze a different prompt
                             </button>
                        </div>
                    </div>
                );
            default: return null;
        }
    };


    const AnalysisButton: React.FC<{ mode: AnalysisMode; children: React.ReactNode }> = ({ mode, children }) => {
        const isActive = activeAnalysis === mode;
        return (
            <button
                onClick={() => handleAnalysisSelection(mode)}
                className={`w-full font-medium py-2 px-4 rounded-md transition-all duration-200 border-2 ${
                    isActive
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                        : 'bg-gray-700 hover:bg-gray-600 border-transparent text-gray-200'
                }`}
            >
                {children}
            </button>
        );
    };

    return (
        <section className="mt-6 md:mt-8 bg-gray-800/50 border border-gray-700 rounded-xl p-4 md:p-6 shadow-lg">
            <h3 className="text-xl md:text-2xl font-bold text-sky-300 text-center mb-4">Additional Analysis</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
                <AnalysisButton mode="citationByPersona">Citation Sources by Persona</AnalysisButton>
                <AnalysisButton mode="sourceAuthority">Source Authority Analysis</AnalysisButton>
                <AnalysisButton mode="contentTheme">Content Theme Clustering</AnalysisButton>
                <AnalysisButton mode="nicheSources">Niche Sources</AnalysisButton>
            </div>
            
            {activeAnalysis !== 'none' && (
                <div className="mt-6 border-t border-gray-700 pt-6 animate-fade-in text-center">
                    <h4 className="text-lg font-bold text-sky-400">{analysisInfo[activeAnalysis].title}</h4>
                    <p className="mt-2 text-sm text-gray-400 max-w-3xl mx-auto">{analysisInfo[activeAnalysis].description}</p>
                    
                    {activeAnalysis === 'citationByPersona' && renderPersonaCitationAnalysis()}

                    {/* Placeholder for other analyses */}
                    {activeAnalysis !== 'citationByPersona' && (
                        <div className="mt-6">
                            <button className="bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold py-2 px-6 rounded-md shadow-lg cursor-not-allowed" disabled>
                                Coming Soon
                            </button>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

export default AdvancedAnalysis;