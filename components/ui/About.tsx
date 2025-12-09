import React from 'react';

const About: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 text-gray-300 w-full max-w-4xl mx-auto animate-fade-in">
      <header className="mb-8 border-b border-gray-700 pb-4">
        <h1 className="text-4xl font-bold text-[var(--acn-light-purple)]">
          About the Gemini Keyword Analyzer
        </h1>
        <p className="mt-2 text-lg text-gray-400">
          An internal tool for analyzing AI-generated content and its alignment with strategic keywords.
        </p>
      </header>
      
      <main className="space-y-10">
        <section>
          <h2 className="text-2xl font-semibold text-[var(--acn-light-purple)] mb-3">About the Project</h2>
          <div className="flex flex-col gap-4 items-start justify-start max-w-none text-gray-300">
            <p>
              The Gemini Keyword Analyzer is a Generative Engine Optimization (GEO) tool that allows users to explore, analyze, and monitor how often given keyword, phrase, or URL appears in AI model responses to various prompts.
            </p>
            <p>
              The intent is to allow users to simulate what kind of information is returned from AI models when they are used like search engines. The <em>prompts</em> within the app are akin to <em>search queries</em> that users may input to search engines like Google, Bing, or, nowadays, platforms like ChatGPT.
            </p>
            <p>
              Some current features include:
            </p>
            <ul className="list-disc px-2">
              <li><strong>Iterative Keyword Presence Analysis</strong>: Iteratively run up to five prompts to test if a target keyword or phrase apears in the models response, calculating a success rate and similarity score over multiple iterations</li>
              <li><strong>Evaluate Persona Impact</strong>: Compare how the response content changes based on the demographic & contextual differences provided to the model upon search</li>
              <li><strong>Web Search-based Grounding</strong>: Ground the model's responses with real-time Google web searches that inform how the model responds</li>
              <li><strong>Citation Source Analysis</strong> - Track, review, and analyze the various source URLs provided per response iteration. Eventually perform analysis on citation content type to build understanding of what kind of sources appear in model responses.</li>
            </ul>
            <p>
              Due to limitations, the current iteration of the tool only uses Google's Gemini 2.5 Pro model. Eventually, we would like to expand to as many commonly used models as possible.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--acn-light-purple)] mb-3">Roadmap</h2>
          <div className="flex flex-col gap-4 items-start justify-start max-w-none text-gray-300">
            <p>
              This tool is an evolving project. The following features and improvements are being considered for future development:
            </p>
            <ul className="list-disc px-2">
              <li><strong>Advanced Analysis Modules:</strong> Implementing the "Source Authority", "Content Theme Clustering", and "Niche Source Discovery" features to provide deeper strategic insights.</li>
              <li><strong>Historical Trend Analysis:</strong> Track how success rates and citation patterns for a given keyword change over time as the underlying models are updated.</li>
              <li><strong>Enhanced Reporting:</strong> Adding more robust data visualizations and options to export reports in various formats (e.g., CSV, detailed PDF).</li>
              <li><strong>Batch Processing:</strong> Allowing users to upload a list of keywords and prompts to run multiple analysis sessions automatically.</li>
              <li><strong>UI/UX Enhancements:</strong> Continuously refining the user interface for better usability, data presentation, and workflow efficiency.</li>
            </ul>
            <p>
                Feedback and suggestions for new features are welcome.
            </p>
          </div>
        </section>
      </main>

      <footer className="mt-12 text-center border-t border-gray-800 pt-6">
          <p className="text-sm text-gray-500">
              Project build by <a href="mailto:ben.aronson@accenture.com" className="text-[var(--acn-light-purple)] hover:underline">Ben Aronson</a>. A demo build for ACN.
          </p>
      </footer>
    </div>
  );
};

export default About;