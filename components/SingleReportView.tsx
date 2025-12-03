import React, { useMemo, useState } from 'react';
import { AnalysisSession, AnalysisResult, IterationResult } from '../types';
import { Marked } from 'marked';
import DOMPurify from 'dompurify';

// --- SHARED HELPERS & COMPONENTS ---

const getScoreColor = (score: number) => {
  if (score >= 0.9) return 'bg-teal-600/80 text-teal-100 print:bg-teal-100 print:text-teal-900 print:border print:border-teal-200';
  if (score >= 0.7) return 'bg-yellow-600/80 text-yellow-100 print:bg-yellow-100 print:text-yellow-900 print:border print:border-yellow-200';
  return 'bg-orange-600/80 text-orange-100 print:bg-orange-100 print:text-orange-900 print:border print:border-orange-200';
};

const getIterationColor = (iterationNumber: number) => {
    switch (iterationNumber) {
      case 1: return 'bg-blue-900/50 text-blue-300 border border-blue-700/50 print:bg-blue-100 print:text-blue-900 print:border-blue-200';
      case 2: return 'bg-green-900/50 text-green-300 border border-green-700/50 print:bg-green-100 print:text-green-900 print:border-green-200';
      case 3: return 'bg-yellow-900/50 text-yellow-300 border border-yellow-700/50 print:bg-yellow-100 print:text-yellow-900 print:border-yellow-200';
      case 4: return 'bg-purple-900/50 text-purple-300 border border-purple-700/50 print:bg-purple-100 print:text-purple-900 print:border-purple-200';
      case 5: return 'bg-red-900/50 text-red-300 border border-red-700/50 print:bg-red-100 print:text-red-900 print:border-red-200';
      default: return 'bg-gray-700 text-gray-300 border border-gray-600';
    }
  };

const renderMarkdown = (content: string | null) => {
  if (!content) return { __html: '' };
  try {
    const parser = new Marked({ breaks: true, gfm: true });
    const rawHtml = parser.parse(content);
    const stringHtml = typeof rawHtml === 'string' ? rawHtml : '';
    const sanitized = DOMPurify.sanitize(stringHtml);
    return { __html: sanitized };
  } catch (e) {
    return { __html: content || '' };
  }
};

const ChevronIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-300 ${className}`} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);


// --- SINGLE-SESSION REPORT COMPONENT ---

const SingleReportView: React.FC<{ session: AnalysisSession }> = ({ session }) => {
  const [showAllIterations, setShowAllIterations] = useState(false);
  const [showCitationAnalysisInPrint, setShowCitationAnalysisInPrint] = useState(true);
  const [collapsedCitations, setCollapsedCitations] = useState<Record<number, boolean>>({});

  const { sessionStats, promptStats } = useMemo(() => {
    let totalIterations = 0, successfulIterations = 0;
    const pStats = session.results.map((result) => {
      const pTotal = result.iterationResults.length;
      const pFound = result.iterationResults.filter(i => i.keywordFound).length;
      const scores = result.iterationResults.map(i => i.similarityScore).filter((s): s is number => typeof s === 'number');
      const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
      totalIterations += pTotal; successfulIterations += pFound;
      return { promptNumber: result.promptNumber, prompt: result.prompt, total: pTotal, found: pFound, avgSimilarity: avgScore };
    });
    const successRate = totalIterations > 0 ? Math.round((successfulIterations / totalIterations) * 100) : 0;
    return { sessionStats: { successRate, totalIterations, successfulIterations }, promptStats: pStats };
  }, [session]);

  const getSuccessColor = (rate: number) => {
    if (rate >= 80) return 'text-green-400 border-green-500/30 bg-green-900/20 print:bg-green-100 print:text-green-800 print:border-green-300';
    if (rate >= 50) return 'text-yellow-400 border-yellow-500/30 bg-yellow-900/20 print:bg-yellow-100 print:text-yellow-800 print:border-yellow-300';
    return 'text-red-400 border-red-500/30 bg-red-900/20 print:bg-red-100 print:text-red-800 print:border-red-300';
  };

  const scrollToPrompt = (promptNumber: number) => document.getElementById(`prompt-detail-${promptNumber}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Accordion for single report view prompts
  const ReportPromptAccordion: React.FC<{ result: any; promptTotal: number; foundCount: number; showAllIterations: boolean; }> = ({ result, promptTotal, foundCount, showAllIterations }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [expandedIterations, setExpandedIterations] = useState<Record<number, boolean>>({});
    const toggleIterationExpansion = (iterNum: number) => setExpandedIterations(prev => ({ ...prev, [iterNum]: !prev[iterNum] }));
    return (
      <div id={`prompt-detail-${result.promptNumber}`} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-lg break-inside-avoid transition-all duration-300 print:bg-white print:border-gray-300 print:shadow-none print:rounded-none print:border-b-2 print:mb-4">
        <button onClick={() => setIsExpanded(!isExpanded)} className="w-full text-left p-6 border-b border-gray-700 bg-gray-800/80 hover:bg-gray-700/50 transition-colors flex justify-between items-start gap-4 print:bg-white print:border-gray-200 print:p-0 print:mb-2 print:block">
          <div className="flex-1">
            <h3 className="text-sm text-gray-500 font-bold uppercase mb-1 print:text-gray-600">Prompt #{result.promptNumber}</h3>
            <p className="text-lg text-white font-medium print:text-black print:font-bold">{result.prompt}</p>
          </div>
          <div className="flex flex-col items-end space-y-2 print:flex-row print:items-center print:gap-4 print:space-y-0">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${foundCount === promptTotal ? 'bg-green-900/30 text-green-300 border-green-500/30 print:bg-green-100 print:text-green-800 print:border-green-200' : foundCount > 0 ? 'bg-yellow-900/30 text-yellow-300 border-yellow-500/30 print:bg-yellow-100 print:text-yellow-800 print:border-yellow-200' : 'bg-red-900/30 text-red-300 border-red-500/30 print:bg-red-100 print:text-red-800 print:border-red-200'}`}>Keyword found in {foundCount}/{promptTotal} iterations</div>
            <ChevronIcon className={`text-gray-400 ${isExpanded ? 'transform rotate-180' : ''} print:hidden`} />
          </div>
        </button>
        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[8000px] opacity-100' : 'max-h-0 opacity-0'} print:!max-h-none print:!opacity-100 print:!block`}>
          <div className="p-6 bg-gray-900/30 space-y-6 print:bg-white print:p-0 print:pt-4">
            {result.iterationResults.map((iter: IterationResult, index: number) => {
                if (index > 0 && !showAllIterations) return null;
                const isBaseline = index === 0, isTextExpanded = !!expandedIterations[iter.iterationNumber], scorePercentage = iter.similarityScore ? (iter.similarityScore * 100).toFixed(0) : 0, showToggleButton = iter.response && iter.response.length > 400;
                return (
                  <div key={iter.iterationNumber} className={!isBaseline ? "border-t border-gray-700/50 pt-6 animate-fade-in print:border-gray-200" : ""}>
                      <div className="flex items-center justify-between mb-3"><h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider print:text-gray-600">{isBaseline ? 'Baseline Response (Iteration #1)' : `Iteration #${iter.iterationNumber}`}</h4>{!isBaseline && iter.similarityScore !== undefined && (<span className={`font-bold px-2.5 py-0.5 rounded-full text-xs ${getScoreColor(iter.similarityScore)}`}>{scorePercentage}% Sim.</span>)}</div>
                      <div className={`bg-gray-900 border border-gray-700 rounded-lg p-5 transition-all duration-300 print:bg-white print:border-l-4 print:border-y-0 print:border-r-0 print:border-l-gray-300 print:rounded-none print:opacity-100 print:p-0 print:pl-4`}>
                          {iter.response ? (<div className="relative"><div className={`prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-headings:text-sky-300 prose-a:text-sky-400 prose-code:text-yellow-200 ${!isTextExpanded ? 'line-clamp-3 print:line-clamp-none' : ''}`} dangerouslySetInnerHTML={renderMarkdown(iter.response)} />{!isTextExpanded && (<div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none print:hidden"></div>)}{showToggleButton && (<div className="text-right mt-2 print:hidden"><button onClick={() => toggleIterationExpansion(iter.iterationNumber)} className="text-xs text-sky-400 hover:text-sky-300 font-semibold">{isTextExpanded ? 'Show Less' : 'Show More...'}</button></div>)}</div>) : (<p className="text-gray-500 italic">No response data available.</p>)}
                      </div>
                  </div>
                );
            })}
            {!showAllIterations && result.iterationResults.length > 1 && (<div className="text-center pt-2 print:hidden"><span className="text-xs text-gray-600 italic">{result.iterationResults.length - 1} other iteration{result.iterationResults.length - 1 > 1 ? 's' : ''} hidden. Use the 'Include All Iterations' toggle in Print Options to view.</span></div>)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex print:block">
      <div className="flex-1 p-8 print:p-0 print:w-full">
        <div className="max-w-4xl mx-auto space-y-8 pb-12 print:space-y-6 print:pb-0">
          <section className="bg-gray-800 border border-gray-700 rounded-xl p-8 shadow-xl print:bg-white print:border-gray-300 print:shadow-none print:p-0 print:border-b-2 print:rounded-none print:mb-4 print:break-inside-avoid">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:flex-row print:items-center">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2 print:text-black">Gemini Keyword Analysis Report</h1>
                <div className="flex flex-col space-y-1 text-sm text-gray-400 print:text-gray-600"><span><strong>Session ID:</strong> {session.id}</span><span><strong>Date Generated:</strong> {session.timestamp}</span><span><strong>Target Keyword:</strong> <span className="text-sky-400 font-mono bg-sky-900/20 px-2 py-0.5 rounded print:text-blue-800 print:bg-blue-100 print:border print:border-blue-200">{session.keyword}</span></span></div>
              </div>
              <div className={`flex flex-col items-center justify-center p-4 rounded-lg border flex-shrink-0 ${getSuccessColor(sessionStats.successRate)} min-w-[140px] print:p-4 print:min-w-0 print:border-2`}><span className="text-4xl font-bold">{sessionStats.successRate}%</span><div className="flex items-center gap-2"><div className="group relative flex items-center justify-center cursor-help print:hidden"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-sky-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-80 p-4 bg-gray-800 text-xs text-gray-300 rounded-lg shadow-xl border border-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50"><p className="mb-2"><strong className="text-sky-400">Success Rate</strong>: The number of times the <span className="text-sky-400 font-mono bg-sky-900/20 px-2 py-0.5 rounded">{session.keyword}</span> was found in the prompt response text as measured across all iterations for each prompt.</p></div></div><span className="text-xs uppercase tracking-wider font-semibold opacity-80 print:text-gray-700">Success Rate</span></div></div>
            </div>
          </section>
          <section className="bg-gray-800 border border-gray-700 rounded-xl p-8 shadow-xl print:bg-white print:border-gray-300 print:shadow-none print:p-0 print:border-b-2 print:rounded-none print:mb-4 print:break-inside-avoid"><h2 className="text-xl font-bold text-sky-400 mb-4 border-b border-gray-700 pb-2 print:text-black print:border-gray-300">Configuration Context</h2><div className="grid grid-cols-1 gap-6"><div><h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2 print:text-gray-600">Persona / System Instructions</h3><div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50 print:bg-gray-50 print:border-gray-200 print:text-black">{session.context ? (<p className="text-gray-300 whitespace-pre-wrap leading-relaxed print:text-gray-800">{session.context}</p>) : (<p className="text-gray-500 italic">No specific persona or context was provided for this session.</p>)}</div></div></div></section>
          <section className="bg-gray-800 border border-gray-700 rounded-xl p-8 shadow-xl print:bg-white print:border-gray-300 print:shadow-none print:p-0 print:border-b-2 print:rounded-none print:mb-8 print:break-inside-avoid"><h2 className="text-xl font-bold text-sky-400 mb-4 border-b border-gray-700 pb-2 print:text-black print:border-gray-300">Prompt Response Overview</h2><div className="rounded-lg border border-gray-700/50 print:border-gray-300"><table className="w-full text-left border-collapse"><thead><tr className="bg-gray-900/50 text-gray-400 text-xs uppercase tracking-wider print:bg-gray-100 print:text-black"><th className="p-4 font-medium border-b border-gray-700 print:border-gray-300">Prompt Text</th><th className="p-4 font-medium border-b border-gray-700 text-center w-32 print:border-gray-300">Found Rate</th><th className="p-4 font-medium border-b border-gray-700 text-center w-40 relative z-20 print:border-gray-300"><div className="flex items-center justify-center gap-1">Avg. Similarity<div className="group relative flex items-center justify-center cursor-help print:hidden"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-sky-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-72 p-3 bg-gray-800 text-xs normal-case tracking-normal text-gray-300 rounded-lg shadow-xl border border-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[100]">Similarity scores are calculated by converting text into vectorized word frequency maps (token arrays) and measuring the cosine angle between them. This determines how semantically close the response is to the baseline.</div></div></div></th></tr></thead><tbody className="divide-y divide-gray-700 print:divide-gray-300">{promptStats.map((stat) => (<tr key={stat.promptNumber} className="hover:bg-gray-700/30 transition-colors print:hover:bg-transparent"><td className="p-4 print:py-2"><button onClick={() => scrollToPrompt(stat.promptNumber)} className="text-gray-300 hover:text-sky-400 text-sm font-medium text-left transition-colors line-clamp-2 print:text-black print:line-clamp-none print:hover:text-black print:cursor-auto">{stat.prompt}</button></td><td className="p-4 text-center print:py-2"><span className={`inline-block px-2 py-1 rounded text-xs font-bold ${stat.found === stat.total ? 'bg-green-900/30 text-green-300 print:bg-green-100 print:text-green-800' : stat.found > 0 ? 'bg-yellow-900/30 text-yellow-300 print:bg-yellow-100 print:text-yellow-800' : 'bg-red-900/30 text-red-300 print:bg-red-100 print:text-red-800'}`}>{stat.found}/{stat.total}</span></td><td className="p-4 text-center print:py-2">{stat.avgSimilarity !== null ? (<span className={`inline-block px-2 py-1 rounded text-xs font-bold ${getScoreColor(stat.avgSimilarity)}`}>{(stat.avgSimilarity * 100).toFixed(0)}%</span>) : (<span className="text-gray-600 text-xs">N/A</span>)}</td></tr>))}</tbody></table></div></section>
          <section id="citation-analysis" className={`bg-gray-800 border border-gray-700 rounded-xl p-8 shadow-xl print:bg-white print:border-gray-300 print:shadow-none print:p-0 print:border-b-2 print:rounded-none print:mb-8 print:break-inside-avoid ${!showCitationAnalysisInPrint ? 'print:hidden' : ''}`}>
            <h2 className="text-xl font-bold text-sky-400 mb-2 border-b border-gray-700 pb-2 print:text-black print:border-gray-300">Unique Citation Analysis</h2><p className="text-xs text-gray-500 italic mb-6">For now, the hyperlinks only link to the first mention of the given source. They do not reflect the various endpoints per source website.</p>
            <div className="space-y-8">{session.useSearch ? (session.results.map((result) => { const allCitationsForPrompt = result.iterationResults.flatMap(iter => iter.citations || []); const citationCounts = allCitationsForPrompt.reduce((acc, citation) => { const key = citation.title.trim().toLowerCase(); acc[key] = (acc[key] || 0) + 1; return acc; }, {} as Record<string, number>); const uniqueCitations = result.iterationResults.flatMap(iter => (iter.citations || []).filter(c => c.isUnique).map(c => ({ ...c, iterationNumber: iter.iterationNumber, totalCount: citationCounts[c.title.trim().toLowerCase()] || 1 }))); const isCollapsed = collapsedCitations[result.promptNumber]; return (<div key={`citation-prompt-${result.promptNumber}`} className="border-t border-gray-700/50 pt-6 first:border-t-0 first:pt-0 print:border-gray-200"><div className="flex justify-between items-start mb-3"><div className="flex-1"><h3 className="text-sm text-gray-500 font-bold uppercase print:text-gray-600">Prompt #{result.promptNumber}</h3><p className="text-md text-gray-200 print:text-gray-800">{result.prompt}</p></div>{uniqueCitations.length > 0 && (<button onClick={() => setCollapsedCitations(prev => ({ ...prev, [result.promptNumber]: !prev[result.promptNumber] }))} className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium text-gray-400 bg-gray-700/50 hover:bg-gray-700 hover:text-white rounded-md transition-colors border border-gray-600/50 print:hidden"><ChevronIcon className={`h-4 w-4 transform transition-transform ${isCollapsed ? '' : 'rotate-180'}`} /><span>{isCollapsed ? 'Expand Table' : 'Collapse Table'}</span></button>)}</div>{uniqueCitations.length > 0 ? (<div className={`transition-all duration-500 ease-in-out overflow-hidden ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'}`}><div className="overflow-x-auto rounded-lg border border-gray-700/50 print:border-gray-300"><table className="w-full text-sm text-left text-gray-300 print:text-black"><thead className="text-xs text-gray-400 uppercase bg-gray-900/50 print:bg-gray-100 print:text-black"><tr><th className="px-4 py-2 w-12 text-center border-b border-gray-700 print:border-gray-300">#</th><th className="px-4 py-2 border-b border-gray-700 print:border-gray-300">Source Title</th><th className="px-4 py-2 w-32 text-center border-b border-gray-700 print:border-gray-300">Total Appearances</th><th className="px-4 py-2 w-40 text-center border-b border-gray-700 print:border-gray-300">First Appearance</th></tr></thead><tbody className="divide-y divide-gray-800 print:divide-gray-300">{uniqueCitations.map((citation, index) => (<tr key={index} className={`hover:bg-gray-700/20 transition-colors print:hover:bg-transparent ${citation.uri.toLowerCase().includes('skysthelimit.org') ? 'bg-green-900/60 print:bg-green-50' : ''}`}><td className="px-4 py-2.5 text-center font-mono text-gray-500">{index + 1}</td><td className="px-4 py-2.5"><a href={citation.uri} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 hover:underline group print:text-blue-600 print:no-underline" title={citation.uri}><span className="truncate max-w-md block">{citation.title}</span><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity print:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></a></td><td className="px-4 py-2.5 text-center text-gray-400 print:text-gray-700">{citation.totalCount}</td><td className="px-4 py-2.5 text-center text-gray-400 print:text-gray-700"><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${getIterationColor(citation.iterationNumber)}`}>Iteration #{citation.iterationNumber}</span></td></tr>))}</tbody></table></div></div>) : (<div className="text-center text-gray-500 text-sm italic py-4 bg-gray-900/30 rounded-lg border border-dashed border-gray-700/50 print:bg-gray-50 print:border-gray-200">No new or unique citations were found for this prompt.</div>)}</div>);})) : (<div className="text-center text-gray-500 text-sm italic py-4">Citation analysis is not available because Google Search was not enabled for this session.</div>)}</div>
          </section>
          <section className="space-y-6 print:space-y-8"><div className="flex items-center justify-between print:mb-4"><h2 className="text-xl font-bold text-sky-400 print:text-black">Detailed Findings</h2></div>{session.results.map((result, idx) => { const foundCount = result.iterationResults.filter(r => (r.keywordFound == true)).length; const promptTotal = result.iterationResults.length; return (<ReportPromptAccordion key={idx} result={result} showAllIterations={showAllIterations} promptTotal={promptTotal} foundCount={foundCount} />); })}</section>
        </div>
      </div>
      <div className="w-80 bg-gray-800/50 border-l border-gray-700 p-6 flex-shrink-0 z-20 backdrop-blur-sm print:hidden">
        <h3 className="text-lg font-bold text-white mb-6 border-b border-gray-700 pb-2">Print Options</h3><div className="space-y-6"><div><label htmlFor="filename-input" className="block text-sm font-medium text-gray-400 mb-2">Filename</label><input id="filename-input" type="text" value={"Gemini_Analysis_Report"} onChange={() => {}} placeholder="Gemini_Report" className="w-full bg-gray-900 border border-gray-600 rounded-md p-2.5 text-sm text-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-200" /><p className="text-xs text-gray-500 mt-1 text-right">.pdf</p></div><div className="flex items-center justify-between border-t border-gray-700/50 pt-6"><div className="pr-4"><label htmlFor="toggle-citations-print" className="text-sm font-medium text-gray-300 block">Include Citation Analysis</label><p className="text-xs text-gray-500 mt-0.5">Show the unique citations table</p></div><label className="relative inline-flex items-center cursor-pointer flex-shrink-0"><input type="checkbox" id="toggle-citations-print" className="sr-only peer" checked={showCitationAnalysisInPrint} onChange={() => setShowCitationAnalysisInPrint(!showCitationAnalysisInPrint)} /><div className="w-11 h-6 bg-gray-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-sky-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div></label></div><div className="flex items-center justify-between border-t border-gray-700/50 pt-6"><div className="pr-4"><label htmlFor="toggle-iterations" className="text-sm font-medium text-gray-300 block">Include All Iterations</label><p className="text-xs text-gray-500 mt-0.5">Include additional iterations in report</p></div><label className="relative inline-flex items-center cursor-pointer flex-shrink-0"><input type="checkbox" id="toggle-iterations" className="sr-only peer" checked={showAllIterations} onChange={() => setShowAllIterations(!showAllIterations)} /><div className="w-11 h-6 bg-gray-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-sky-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div></label></div></div>
      </div>
    </div>
  );
};

export default SingleReportView;
