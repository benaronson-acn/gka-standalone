import React, { useState } from 'react';
import { AnalysisSession, Persona } from '../types';
import SingleReportView from './SingleReportView';
import MultiReportView from './MultiReportView';

interface ReportViewProps {
  sessions: AnalysisSession[];
  onBack: () => void;
  allPersonas?: Persona[];
}

const ReportView: React.FC<ReportViewProps> = ({ sessions, onBack, allPersonas }) => {
  const [fileName, setFileName] = useState("Gemini_Analysis_Report");

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = fileName || "Gemini_Analysis_Report";
    window.print();
    document.title = originalTitle;
  };
  
  return (
    <div className="flex flex-col bg-gray-900 text-gray-100 print:overflow-visible print:h-auto print:bg-white print:text-black h-screen">
      <style>{`
        @media print {
          body, #root, #root > div { background-color: white !important; color: black !important; height: auto !important; overflow: visible !important; display: block !important; }
          ::-webkit-scrollbar { display: none; }
          .prose { color: #111827 !important; } .prose h1, .prose h2, .prose h3, .prose h4, .prose strong, .prose code { color: #111827 !important; } .prose p, .prose li { color: #374151 !important; } .prose a { color: #2563eb !important; text-decoration: underline; } .prose code { background-color: #f3f4f6 !important; border: 1px solid #e5e7eb; color: #b91c1c !important; } .prose blockquote { border-left-color: #d1d5db !important; background-color: transparent !important; color: #4b5563 !important; }
          .max-w-4xl, .max-w-7xl { max-width: none !important; padding: 0 !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      {/* --- Toolbar --- */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm z-10 flex-shrink-0 print:hidden">
        <button onClick={onBack} className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
          <span className="font-medium">Back to Dashboard</span>
        </button>

        {sessions.length === 1 && (
          <div className="flex items-center space-x-3">
             <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Preview Mode</span>
             <button onClick={handlePrint} className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-gray-200 hover:bg-sky-600 hover:text-white rounded-md border border-gray-600 transition-colors shadow-lg" title="Print or Save as PDF">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                <span>Print / Save PDF</span>
             </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {sessions.length === 1 ? (
          <SingleReportView session={sessions[0]} />
        ) : (
          <MultiReportView sessions={sessions} allPersonas={allPersonas} />
        )}
      </div>
    </div>
  );
};

export default ReportView;