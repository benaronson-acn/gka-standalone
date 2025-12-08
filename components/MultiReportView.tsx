import React, { useMemo, useState } from 'react';
import { AnalysisSession, AnalysisResult, IterationResult, Persona } from '../types';
import AdvancedAnalysis from './AdvancedAnalysis';
import Tooltip from './Tooltip';

// --- SHARED HELPERS & COMPONENTS ---

const ChevronIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-300 ${className}`} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'bg-teal-600/80 text-teal-100';
    if (score >= 0.7) return 'bg-yellow-600/80 text-yellow-100';
    return 'bg-orange-600/80 text-orange-100';
};


// --- MULTI-SESSION REPORT COMPONENTS ---

const IterationAccordion: React.FC<{ iteration: IterationResult }> = ({ iteration }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasSimilarityScore = typeof iteration.similarityScore === 'number';
    const scorePercentage = hasSimilarityScore ? (iteration.similarityScore! * 100).toFixed(0) : 0;

    return (
        <div className="bg-black/30 border border-[var(--acn-darkest-purple)]/50 rounded-lg overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex justify-between items-center p-2 text-left hover:bg-[var(--acn-darkest-purple)]/60 transition-colors"
            >
                <span className="text-xs font-medium text-gray-400">Iteration #{iteration.iterationNumber}</span>
                <div className="flex items-center gap-2">
                    {hasSimilarityScore && iteration.iterationNumber > 1 && (
                        <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${getScoreColor(iteration.similarityScore!)}`}>
                            {scorePercentage}% Sim.
                        </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${iteration.keywordFound ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>{iteration.keywordFoundStatusText}</span>
                    <ChevronIcon className={`h-4 w-4 text-gray-500 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
            </button>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[500px]' : 'max-h-0'}`}>
                <div className="p-3 border-t border-[var(--acn-darkest-purple)]">
                    <div className="text-xs text-gray-300 bg-black/50 border border-gray-800/70 p-3 rounded-md max-h-40 overflow-y-auto custom-scrollbar">
                        <p className="whitespace-pre-wrap">{iteration.response || 'No response.'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MultiPromptAccordion: React.FC<{ result: AnalysisResult }> = ({ result }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
        <div className="bg-gray-800/40 border border-[var(--acn-dark-purple)]/50 rounded-lg overflow-hidden">
            <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex justify-between items-center p-3 text-left hover:bg-[var(--acn-darkest-purple)]/60 transition-colors">
                <p className="text-sm text-gray-300 flex-1 truncate pr-2" title={result.prompt}>{result.prompt}</p>
                <ChevronIcon className={`h-5 w-5 text-gray-400 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[1000px]' : 'max-h-0'}`}>
                <div className="px-3 pb-3 space-y-2 border-t border-[var(--acn-dark-purple)]/50 pt-3">
                    {result.iterationResults.map(iter => <IterationAccordion key={iter.iterationNumber} iteration={iter} />)}
                </div>
            </div>
        </div>
    );
}

const SessionColumn: React.FC<{ session: AnalysisSession; allPersonas?: Persona[] }> = ({ session, allPersonas }) => {
    const [isPromptsExpanded, setIsPromptsExpanded] = useState(false);
    const [isCitationsExpanded, setIsCitationsExpanded] = useState(false);
    const [isContextExpanded, setIsContextExpanded] = useState(false);

    const { stats, personaName } = useMemo(() => {
        const totalIterations = session.results.flatMap(r => r.iterationResults).length;
        const foundIterations = session.results.flatMap(r => r.iterationResults).filter(i => i.keywordFound).length;
        const successRate = totalIterations > 0 ? Math.round((foundIterations / totalIterations) * 100) : 0;

        const allCitations = session.results.flatMap(r => r.iterationResults.flatMap(i => i.citations || []));
        const uniqueCitationsByTitle = [...new Map(allCitations.map(c => [c.title.trim().toLowerCase(), c])).values()];
        
        const avgAppearance = uniqueCitationsByTitle.length > 0 ? allCitations.length / uniqueCitationsByTitle.length : 0;
        
        let pName = 'None';
        if (session.personaId && allPersonas) {
            const persona = allPersonas.find(p => p.id === session.personaId);
            if (persona) pName = persona.name;
            else if (session.context) pName = 'Custom';
        } else if (session.context) {
            pName = 'Custom';
        }

        return { stats: { successRate, totalIterations, foundIterations, uniqueCitations: uniqueCitationsByTitle, avgAppearance }, personaName: pName };
    }, [session, allPersonas]);

    const getSuccessColor = (rate: number) => {
        if (rate >= 80) return 'text-green-300';
        if (rate >= 50) return 'text-yellow-300';
        return 'text-red-300';
    };

    return (
        <div className="bg-black/50 backdrop-blur-sm border border-[var(--acn-darkest-purple)] rounded-xl shadow-lg flex flex-col space-y-4 p-4 h-full">
            <div className="text-center pb-3 border-b border-[var(--acn-dark-purple)]/50">
                <p className="text-sm text-gray-400">Session from {session.timestamp}</p>
                <p className={`text-4xl font-bold mt-1 ${getSuccessColor(stats.successRate)}`}>{stats.successRate}%</p>
                <p className="text-xs text-gray-500 uppercase font-semibold">Success Rate</p>
            </div>
            
            <div className="text-xs space-y-2 text-gray-300">
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-400">Persona:</span>
                    <span className="text-right italic truncate pl-2" title={personaName}>{personaName}</span>
                </div>
                {session.context && (
                    <div className="pt-2 border-t border-[var(--acn-dark-purple)]/50">
                        {!isContextExpanded ? (
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-400 flex-shrink-0">Context:</span>
                                <p className="text-gray-400 italic text-xs truncate flex-1 min-w-0 hidden sm:block" title={session.context}>
                                    {session.context}
                                </p>
                                <button onClick={() => setIsContextExpanded(true)} className="text-xs text-[var(--acn-light-purple)] hover:text-white flex-shrink-0 ml-auto">
                                    Expand
                                </button>
                            </div>
                        ) : (
                            <div>
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-gray-400">Context:</span>
                                    <button onClick={() => setIsContextExpanded(false)} className="text-xs text-[var(--acn-light-purple)] hover:text-white">
                                        Collapse
                                    </button>
                                </div>
                                <p className="text-gray-400 italic text-xs mt-1 whitespace-pre-wrap bg-black/50 border border-gray-800/70 p-2 rounded-md">
                                    {session.context}
                                </p>
                            </div>
                        )}
                    </div>
                )}
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-400">Web Search:</span>
                    <span className={`font-bold ${session.useSearch ? 'text-green-400' : 'text-red-400'}`}>{session.useSearch ? 'Enabled' : 'Disabled'}</span>
                </div>
            </div>

            {/* Prompts Accordion */}
            <div className="border-t border-[var(--acn-dark-purple)]/50 pt-3">
                <button onClick={() => setIsPromptsExpanded(!isPromptsExpanded)} className="w-full flex justify-between items-center text-left">
                    <h4 className="text-sm font-bold text-[var(--acn-light-purple)] uppercase">Prompts ({session.prompts.length})</h4>
                    <ChevronIcon className={`h-5 w-5 text-gray-400 ${isPromptsExpanded ? 'rotate-180' : ''}`} />
                </button>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isPromptsExpanded ? 'max-h-[2000px] mt-2' : 'max-h-0'}`}>
                    <div className="space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar pr-1">
                        {session.results.map(res => <MultiPromptAccordion key={res.promptNumber} result={res} />)}
                    </div>
                </div>
            </div>

             {/* Citations Accordion */}
             <div className="border-t border-[var(--acn-dark-purple)]/50 pt-3 flex-grow flex flex-col">
                <button onClick={() => setIsCitationsExpanded(!isCitationsExpanded)} className="w-full flex justify-between items-center text-left">
                    <h4 className="text-sm font-bold text-[var(--acn-light-purple)] uppercase">Citation Analysis</h4>
                    <ChevronIcon className={`h-5 w-5 text-gray-400 ${isCitationsExpanded ? 'rotate-180' : ''}`} />
                </button>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isCitationsExpanded ? 'max-h-[2000px] mt-2' : 'max-h-0'}`}>
                    <div className="text-xs space-y-2 text-gray-300 mb-3">
                        <div className="flex justify-between items-center bg-black/30 border border-gray-800/70 p-2 rounded">
                            <span className="font-semibold text-gray-400">Unique Citations:</span>
                            <span className="font-mono text-lg">{stats.uniqueCitations.length}</span>
                        </div>
                        <div className="flex justify-between items-center bg-black/30 border border-gray-800/70 p-2 rounded">
                            <span className="font-semibold text-gray-400 flex items-center gap-1.5">
                                Avg. Appearances
                                <Tooltip position="top" widthClass="w-64" paddingClass="p-3">The number of times each citation source appears across each iteration</Tooltip>
                            </span>
                            <span className="font-mono text-lg">{stats.avgAppearance.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="space-y-2 max-h-[30vh] overflow-y-auto custom-scrollbar pr-1 border-t border-[var(--acn-dark-purple)]/50 pt-2">
                        {stats.uniqueCitations.length > 0 ? (
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="text-left text-gray-500">
                                        <th className="p-1 font-medium">Source</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.uniqueCitations.map(c => (
                                        <tr key={c.uri} className="border-b border-[var(--acn-darkest-purple)]/80">
                                            <td className="p-1 truncate" title={c.title}>
                                                <a href={c.uri} target="_blank" rel="noopener noreferrer" className="text-[var(--acn-light-purple)] hover:text-white">{c.title}</a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : <p className="text-xs text-center text-gray-500 italic pt-2">No citation data available.</p>}
                    </div>
                </div>
            </div>

        </div>
    );
};

const MultiReportView: React.FC<{ sessions: AnalysisSession[]; allPersonas?: Persona[] }> = ({ sessions, allPersonas }) => {
    const gridColsClass = sessions.length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3';

    return (
        <div className="flex-1 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <section className="bg-black/50 backdrop-blur-sm border border-[var(--acn-darkest-purple)] rounded-xl p-4 md:p-6 text-center shadow-lg">
                    <h2 className="text-md font-semibold text-[var(--acn-light-purple)] uppercase tracking-wider">Analysis Keyword</h2>
                    <p className="text-2xl md:text-3xl font-bold text-white font-mono mt-1 break-words">"{sessions[0].keyword}"</p>
                </section>

                <div className={`grid grid-cols-1 ${gridColsClass} gap-4 md:gap-6`}>
                    {sessions.map(session => (
                        <SessionColumn key={session.id} session={session} allPersonas={allPersonas} />
                    ))}
                </div>

                <AdvancedAnalysis sessions={sessions} allPersonas={allPersonas} />
            </div>
        </div>
    );
};

export default MultiReportView;