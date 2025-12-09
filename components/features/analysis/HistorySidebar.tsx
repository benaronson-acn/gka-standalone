import React from 'react';
import { AnalysisSession, MultiSessionAnalysis } from '../../../types';

interface HistorySidebarProps {
  history: AnalysisSession[];
  analysisHistory: MultiSessionAnalysis[];
  currentSessionId: number | null;
  onLoadSession: (id: number) => void;
  onDeleteSession: (id: number) => void;
  onNewSession: () => void;
  onViewReport: () => void;
  isMultiSelectMode: boolean;
  onToggleMultiSelect: () => void;
  selectedSessionIds: Set<number>;
  onSessionSelect: (id: number) => void;
  onAnalyzeSelectedSessions: () => void;
  onLoadMultiSessionAnalysis: (id: number) => void;
  onDeleteMultiSessionAnalysis: (id: number) => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ 
    history, 
    analysisHistory,
    currentSessionId, 
    onLoadSession, 
    onDeleteSession, 
    onNewSession, 
    onViewReport,
    isMultiSelectMode,
    onToggleMultiSelect,
    selectedSessionIds,
    onSessionSelect,
    onAnalyzeSelectedSessions,
    onLoadMultiSessionAnalysis,
    onDeleteMultiSessionAnalysis
}) => {
  return (
    <aside className="w-full md:w-72 lg:w-80 flex-shrink-0 bg-[var(--darker-charcoal)] backdrop-blur-sm border-r border-[var(--acn-darkest-purple)] p-4 flex flex-col max-h-screen">
      <button
        onClick={onNewSession}
        className="w-full flex items-center justify-center space-x-2 mb-4 bg-[var(--acn-dark-purple)] hover:bg-[var(--acn-main-purple)] text-white font-bold py-2 px-4 rounded-md shadow-lg transition-all duration-300"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        <span>New Analysis</span>
      </button>

      <div className="flex-grow overflow-y-auto custom-scrollbar -mr-2 pr-2">
        <h2 className="text-xl font-bold text-[var(--acn-light-purple)] mb-2">Session History</h2>
        {history.length === 0 ? (
          <p className="text-gray-500 text-center mt-4">No history yet. Run an analysis to save it here.</p>
        ) : (
          <ul className="space-y-2">
            {history.map((session) => {
              const isSelected = selectedSessionIds.has(session.id);
              const hasSuccess = session.results.some(r => r.summaryStatus === true);
              return (
              <li key={session.id}>
                <div
                  onClick={() => isMultiSelectMode ? onSessionSelect(session.id) : onLoadSession(session.id)}
                  className={`group w-full text-left p-3 rounded-lg cursor-pointer transition-all duration-200 flex items-start gap-3 ${
                    isMultiSelectMode
                      ? isSelected ? 'bg-[var(--acn-main-purple)]/20 border border-[var(--acn-main-purple)]' : 'bg-gray-900 hover:bg-gray-800'
                      : currentSessionId === session.id ? 'bg-[var(--acn-main-purple)]/10 border border-[var(--acn-main-purple)]' : 'bg-gray-900 hover:bg-gray-800'
                  }`}
                >
                  {isMultiSelectMode && (
                      <div className="flex-shrink-0 pt-1">
                          <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="w-4 h-4 text-[var(--acn-main-purple)] bg-gray-700 border-gray-600 rounded focus:ring-0 focus:ring-offset-0 pointer-events-none"
                          />
                      </div>
                  )}
                  <div className="flex-1 flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-200 truncate pr-2" title={session.keyword}>
                        Keyword: "{session.keyword}"
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{session.timestamp}</p>
                      
                      {/* Feature Indicators */}
                      <div className="flex items-center space-x-2 mt-2">
                        {hasSuccess && (
                          <div title="Keyword Found" className="flex items-center text-green-400 bg-green-900/20 px-1.5 py-0.5 rounded border border-green-500/30">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                          </div>
                        )}
                        {session.isContextEnabled !== false && session.context && (
                           <div title="Persona/Context Enabled" className="flex items-center text-purple-400 bg-purple-900/20 px-1.5 py-0.5 rounded border border-purple-500/30">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                           </div>
                        )}
                        {session.useSearch && (
                            <div title="Google Search Enabled" className="flex items-center text-blue-400 bg-blue-900/20 px-1.5 py-0.5 rounded border border-blue-500/30">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                      </div>

                    </div>
                    {!isMultiSelectMode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent onLoadSession from firing
                            onDeleteSession(session.id);
                          }}
                          className="p-1 text-gray-500 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500/50 hover:text-white transition-all duration-200"
                          aria-label="Delete session"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                    )}
                  </div>
                </div>
              </li>
            )})}
          </ul>
        )}

        {analysisHistory.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-bold text-[var(--acn-light-purple)] mb-2">Analysis History</h2>
            <ul className="space-y-2">
              {analysisHistory.map((analysis) => (
                <li key={analysis.id}>
                  <div
                    onClick={() => onLoadMultiSessionAnalysis(analysis.id)}
                    className="group w-full text-left p-3 rounded-lg cursor-pointer transition-colors duration-200 flex items-start justify-between gap-3 bg-gray-900 hover:bg-gray-800"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-200 truncate pr-2" title={analysis.keyword}>
                        Analysis: "{analysis.keyword}"
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{analysis.timestamp}</p>
                      <p className="text-xs text-gray-500 mt-1">{analysis.sessionIds.length} sessions</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteMultiSessionAnalysis(analysis.id);
                      }}
                      className="p-1 text-gray-500 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500/50 hover:text-white transition-all duration-200 flex-shrink-0"
                      aria-label="Delete analysis"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* View Analysis Report Button */}
      <div className="mt-4 pt-4 border-t border-[var(--acn-darkest-purple)] space-y-2">
        <button
          onClick={onViewReport}
          disabled={history.length === 0 || isMultiSelectMode}
          className="w-full flex items-center justify-center space-x-2 bg-[var(--acn-main-purple)] hover:bg-[var(--acn-dark-purple)] text-white font-bold py-2 px-4 rounded-md shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-800 disabled:text-gray-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>View Analysis Report</span>
        </button>
        <button
          onClick={onToggleMultiSelect}
          disabled={history.length < 2}
          className="w-full flex items-center justify-center space-x-2 bg-[var(--acn-dark-purple)] hover:bg-[var(--acn-darkest-purple)] text-white font-bold py-2 px-4 rounded-md shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-800 disabled:text-gray-500"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v6m-3-3h6M3 10h18M3 14h18M3 6h18M3 18h18" />
            </svg>
          <span>Multi-Session Report</span>
        </button>
      </div>

      {isMultiSelectMode && (
          <div className="mt-2 p-3 border border-dashed border-[var(--acn-dark-purple)] rounded-lg space-y-3 animate-fade-in bg-black/20">
            <p className="text-xs text-center text-gray-400">Select 2 to 3 sessions to compare.</p>
            <button
              onClick={onAnalyzeSelectedSessions}
              disabled={selectedSessionIds.size < 2 || selectedSessionIds.size > 3}
              className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-md shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-800 disabled:text-gray-500"
            >
              <span>Analyze ({selectedSessionIds.size}) Sessions</span>
            </button>
            <button
              onClick={onToggleMultiSelect}
              className="w-full text-center text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
    </aside>
  );
};

export default HistorySidebar;