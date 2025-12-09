
import React, { useMemo, useState } from 'react';
import { Marked } from 'marked';
import DOMPurify from 'dompurify';

interface MarkdownViewerProps {
  isOpen: boolean;
  content: string | null;
  onClose: () => void;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ isOpen, content, onClose }) => {
  const [isCopied, setIsCopied] = useState(false);

  // Parse markdown safely with breaks enabled to preserve newlines
  // Then sanitize using DOMPurify to prevent XSS attacks
  const htmlContent = useMemo(() => {
    if (!content) return '';
    try {
      // Instantiate a new Marked instance with specific options
      // breaks: true -> converts single \n to <br>
      // gfm: true -> enables GitHub Flavored Markdown (tables, etc.)
      const parser = new Marked({ 
        breaks: true, 
        gfm: true 
      });
      
      // Parse the content. Note: In basic configuration without async extensions, 
      // parser.parse returns a string synchronously.
      const rawHtml = parser.parse(content);
      
      // Ensure we have a string before sanitizing
      if (typeof rawHtml !== 'string') {
        console.warn("Marked parser returned a non-string value.");
        return content;
      }

      // Sanitize the HTML to remove malicious scripts/tags
      return DOMPurify.sanitize(rawHtml);
    } catch (e) {
      console.error("Failed to parse markdown", e);
      // Fallback: simple text encoding if parsing fails
      return content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
  }, [content]);

  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full md:w-[600px] bg-gray-900 border-l border-gray-700 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
          <h2 className="text-xl font-bold text-[var(--acn-light-purple)] flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Markdown Viewer
          </h2>
          
          <div className="flex items-center space-x-3">
             {/* Copy Button */}
             <button
                onClick={handleCopy}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 hover:text-white rounded-md transition-colors border border-gray-600"
                title="Copy raw markdown to clipboard"
             >
                {isCopied ? (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-green-400">Copied!</span>
                    </>
                ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>Copy Text</span>
                    </>
                )}
             </button>

             {/* Close Button */}
             <button 
               onClick={onClose}
               className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
               aria-label="Close"
             >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-gray-900">
             <div 
                className="prose prose-invert prose-sky max-w-none 
                prose-headings:text-sky-300 
                prose-a:text-blue-400 hover:prose-a:text-blue-300 
                prose-strong:text-gray-100
                prose-code:text-yellow-300 prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-700
                prose-blockquote:border-l-sky-500 prose-blockquote:bg-gray-800/30 prose-blockquote:py-1 prose-blockquote:px-4"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
             />
        </div>
      </div>
    </>
  );
};

export default MarkdownViewer;