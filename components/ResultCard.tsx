import React, { useState } from 'react';
import { AnalysisResult, IterationResult, KeywordFoundStatus, KeywordFoundStatusText } from '../types';

const ChevronIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-300 ${className}`} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

const Tooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="group relative flex items-center justify-center cursor-help">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-sky-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 p-4 bg-gray-800 text-xs text-gray-300 rounded-lg shadow-2xl border border-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[100]">
        {children}
      </div>
    </div>
);

const getStatusColors = (status: KeywordFoundStatus | boolean, statusText: KeywordFoundStatusText | string) => {
    const isFound = status;
    const isError = !status && (statusText.startsWith("N/A") || statusText === "Error");
    
    if (isError) return { bg: 'bg-yellow-900/50', text: 'text-yellow-300' };
    return isFound 
      ? { bg: 'bg-green-900/50', text: 'text-green-300' }
      : { bg: 'bg-red-900/50', text: 'text-red-300' };
};

const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'bg-teal-600/80 text-teal-100';
    if (score >= 0.7) return 'bg-yellow-600/80 text-yellow-100';
    return 'bg-orange-600/80 text-orange-100';
}

const getCitationScoreColor = (score: number) => {
    if (score >= 0.9) return 'bg-indigo-600/80 text-indigo-100';
    if (score >= 0.7) return 'bg-purple-600/80 text-purple-100';
    return 'bg-fuchsia-600/80 text-fuchsia-100';
}

interface CommonResultCardProps {
    iteration: IterationResult;
    title: string;
    isBaseline: boolean;
    onViewMarkdown: (content: string) => void;
}

const CommonResultCard: React.FC<CommonResultCardProps> = ({ iteration, title, isBaseline, onViewMarkdown }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isCitationsExpanded, setIsCitationsExpanded] = useState(false);
    const [isCitationsCopied, setIsCitationsCopied] = useState(false);
    const [showNewOnly, setShowNewOnly] = useState(false);

    const { bg, text } = getStatusColors(iteration.keywordFound, iteration.keywordFoundStatusText);

    const hasSimilarityScore = typeof iteration.similarityScore === 'number';
    const scorePercentage = hasSimilarityScore ? (iteration.similarityScore! * 100).toFixed(0) : 0;
    
    const hasCitationScore = typeof iteration.citationSimilarityScore === 'number';
    const citationScorePercentage = hasCitationScore ? (iteration.citationSimilarityScore! * 100).toFixed(0) : 0;

    const displayedCitations = iteration.citations ? (
        showNewOnly 
            ? iteration.citations.filter(c => c.isUnique)
            : iteration.citations
    ) : [];

    const handleCopyCitations = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!displayedCitations || displayedCitations.length === 0) return;
        const text = displayedCitations.map(c => c.title).join('\n');
        navigator.clipboard.writeText(text);
        setIsCitationsCopied(true);
        setTimeout(() => setIsCitationsCopied(false), 2000);
    };

    return (
        <div className="bg-gray-900/60 border border-gray-700 rounded-lg overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex justify-between items-center p-3 text-left hover:bg-gray-800/50 transition-colors duration-200"
                aria-expanded={isExpanded}
            >
                <div className="flex flex-wrap items-center gap-3">
                    <span className="font-semibold text-gray-300 w-auto sm:w-24 text-left">{title}</span>
                    {isBaseline ? (
                        <span className="font-semibold px-2.5 py-1 rounded-full text-xs bg-gray-600 text-gray-300">
                            Baseline
                        </span>
                    ) : (
                        <div className="flex space-x-2">
                             {/* Text Similarity Badge */}
                            {hasSimilarityScore ? (
                                <span className={`font-bold px-2.5 py-1 rounded-full text-xs ${getScoreColor(iteration.similarityScore!)}`} title={`Text Similarity Score: ${scorePercentage}%`}>
                                    Text: {scorePercentage}%
                                </span>
                            ) : (
                                <span className="font-semibold px-2.5 py-1 rounded-full text-xs bg-gray-700 text-gray-400">
                                    No Score
                                </span>
                            )}

                            {/* Citation Similarity Badge */}
                            {hasCitationScore && (
                                <span className={`font-bold px-2.5 py-1 rounded-full text-xs ${getCitationScoreColor(iteration.citationSimilarityScore!)}`} title={`Citation Similarity Score: ${citationScorePercentage}%`}>
                                    Cit: {citationScorePercentage}%
                                </span>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex items-center space-x-3 ml-2">
                    <span className={`font-bold px-2.5 py-1 rounded-full text-xs whitespace-nowrap ${bg} ${text}`}>
                        {iteration.keywordFoundStatusText}
                    </span>
                    <ChevronIcon className={isExpanded ? 'transform rotate-180' : ''} />
                </div>
            </button>
            <div className={`accordion-content ${isExpanded ? 'expanded' : ''}`}>
                 <div className="px-4 space-y-4 pb-4">
                    {iteration.response && (
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-md font-semibold text-sky-400">Gemini Response</h4>
                                <button 
                                    onClick={() => onViewMarkdown(iteration.response!)}
                                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium px-3 py-1 rounded shadow transition-colors flex items-center gap-1"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    View as Markdown
                                </button>
                            </div>
                            <div className="text-gray-300 bg-black/30 p-3 rounded-md max-h-48 overflow-y-auto custom-scrollbar">
                                <p className="whitespace-pre-wrap">{iteration.response}</p>
                            </div>

                            {/* Citations Accordion */}
                            {iteration.citations && iteration.citations.length > 0 && (
                                <div className="mt-4 border border-gray-700/50 rounded-lg overflow-hidden bg-gray-800/30">
                                    <div className="w-full flex justify-between items-center p-3">
                                        <button
                                            onClick={() => setIsCitationsExpanded(!isCitationsExpanded)}
                                            className="flex items-center space-x-2 text-left hover:text-white transition-colors duration-200"
                                        >
                                            <span className="text-sm font-semibold text-sky-400">Sources & Citations</span>
                                            <span className="bg-sky-900/50 text-sky-200 text-xs px-2 py-0.5 rounded-full border border-sky-700/50">
                                                {iteration.citations.length}
                                            </span>
                                            <ChevronIcon className={`h-4 w-4 text-gray-400 ${isCitationsExpanded ? 'transform rotate-180' : ''}`} />
                                        </button>
                                        
                                        <div className="flex items-center gap-4">
                                            {/* Show New Only Toggle */}
                                            <div className="flex items-center cursor-pointer" onClick={(e) => { e.stopPropagation(); setShowNewOnly(!showNewOnly); }}>
                                                <span className={`text-xs mr-2 ${showNewOnly ? 'text-green-400 font-medium' : 'text-gray-500'}`}>Show New Only</span>
                                                <div className={`w-8 h-4 rounded-full relative transition-colors duration-200 ${showNewOnly ? 'bg-green-900/60 border border-green-600' : 'bg-gray-700 border border-gray-600'}`}>
                                                    <div className={`w-2 h-2 rounded-full bg-white absolute top-1 transition-all duration-200 ${showNewOnly ? 'left-5' : 'left-1'}`}></div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleCopyCitations}
                                                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                                                title="Copy visible citation titles as text"
                                            >
                                                {isCitationsCopied ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isCitationsExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <div className="p-0 border-t border-gray-700/50">
                                            {/* Scrollable Container */}
                                            <div className="overflow-x-auto overflow-y-auto max-h-64 custom-scrollbar">
                                                {displayedCitations.length === 0 ? (
                                                    <div className="p-4 text-center text-gray-500 text-sm italic">
                                                        {showNewOnly ? "No new citations found in this iteration." : "No citations available."}
                                                    </div>
                                                ) : (
                                                    <table className="w-full text-sm text-left text-gray-400">
                                                        <thead className="text-xs text-gray-500 uppercase bg-gray-900/50 sticky top-0 z-10 backdrop-blur-sm">
                                                            <tr>
                                                                <th className="px-4 py-2 w-16 text-center">#</th>
                                                                <th className="px-4 py-2">Source Title</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-800">
                                                            {displayedCitations.map((citation, index) => (
                                                                <tr key={index} className={"hover:bg-gray-700/20 transition-colors " + (citation.title.includes("skysthelimit") ? "bg-green-900/60" : "")}>
                                                                    <td className="px-4 py-2.5 text-center font-mono text-gray-500">
                                                                        [{index + 1}]
                                                                    </td>
                                                                    <td className="px-4 py-2.5">
                                                                        <div className="flex items-center gap-2">
                                                                            <a 
                                                                                href={citation.uri}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1 group"
                                                                            >
                                                                                <span className="truncate max-w-[200px] sm:max-w-md md:max-w-lg block">
                                                                                    {citation.title}
                                                                                </span>
                                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                                </svg>
                                                                            </a>
                                                                            {citation.isUnique && (
                                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-900/60 text-green-300 border border-green-700/50 uppercase tracking-wide">
                                                                                    New
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {iteration.error && (
                        <div>
                            <h4 className="text-md font-semibold text-red-400 mb-2">Error</h4>
                            <p className="text-red-300 bg-red-900/30 p-3 rounded-md whitespace-pre-wrap">{iteration.error}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

interface ResultCardProps {
  result: AnalysisResult;
  onViewMarkdown: (content: string) => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, onViewMarkdown }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { bg: summaryBg, text: summaryText } = getStatusColors(result.summaryStatus, result.summaryStatusText);
  
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-lg w-full animate-fade-in overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-700/50 transition-colors duration-200"
        aria-expanded={isExpanded}
        aria-controls={`accordion-content-${result.promptNumber}`}
      >
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          <span className="font-bold text-sky-400 whitespace-nowrap">Prompt #{result.promptNumber}</span>
          <p className="text-gray-300 truncate hidden sm:block" title={result.prompt}>{result.prompt || 'Empty Prompt'}</p>
        </div>
        <div className="flex items-center space-x-3 ml-2">
          <span className={`font-bold px-2.5 py-1 rounded-full text-xs whitespace-nowrap ${summaryBg} ${summaryText}`}>
            {result.summaryStatusText}
          </span>
          <ChevronIcon className={isExpanded ? 'transform rotate-180' : ''} />
        </div>
      </button>

      <div
        id={`accordion-content-${result.promptNumber}`}
        className={`accordion-content ${isExpanded ? 'expanded' : ''}`}
      >
        <div className="px-6 border-t border-gray-700 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-sky-300 mb-2">Full Prompt</h3>
            <p className="text-gray-300 bg-gray-900/70 p-3 rounded-md">{result.prompt}</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-sky-300 mb-2">Iteration Results (With Context)</h3>
            <div className="space-y-3">
                {result.iterationResults.map((iteration) => (
                    <CommonResultCard 
                      key={iteration.iterationNumber}
                      iteration={iteration}
                      title={`Iteration #${iteration.iterationNumber}`}
                      isBaseline={iteration.iterationNumber === 1}
                      onViewMarkdown={onViewMarkdown}
                    />
                ))}
            </div>
          </div>
          
          {result.noContextResult && (
            <div>
              <h3 className="text-lg font-semibold text-sky-300 mb-2 flex items-center gap-2">
                <span>Comparison: No Context Run</span>
                <Tooltip>
                    You have the Additional Context / System Instructions toggle enabled. This run is performed <em>without</em> that additional context for you to compare and analyze the differences in how additional context directs the response content.
                </Tooltip>
              </h3>
              <CommonResultCard
                  iteration={result.noContextResult}
                  title="No Context"
                  isBaseline={false}
                  onViewMarkdown={onViewMarkdown}
              />
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ResultCard;