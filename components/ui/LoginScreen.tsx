import React, { useState } from 'react';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'acn') {
      onLogin();
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  return (
    <div className="h-screen w-screen bg-[#141414] flex items-center justify-center p-4">
      <div className="bg-[var(--dark-purple-modal)] backdrop-blur-sm border border-[var(--acn-light0purple)]/50 rounded-xl shadow-2xl w-full max-w-md p-8 animate-fade-in">
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 bg-[#A100FF]/10 rounded-full flex items-center justify-center mb-4 border border-[#A100FF]/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#A100FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-100">Restricted Access</h1>
          <p className="text-gray-400 mt-2">This application is password protected.</p>
          <p className="text-gray-400 mt-2">To request access, contact Ben Aronson or Andrew Morris.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[var(--very-dark-purple)] border border-gray-700 rounded-md p-3 text-white focus:ring-2 focus:ring-[#A100FF] focus:border-[#A100FF] transition duration-200"
              placeholder="Enter password"
              autoFocus
            />
          </div>

          {error && (
            <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-md text-red-300 text-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[#A100FF] hover:bg-[#7500C0] text-white font-bold py-3 px-4 rounded-md shadow-lg transition-all duration-200"
          >
            Access Application
          </button>
        </form>
        
        <p className="text-xs text-center text-gray-600 mt-6">
          Authorized personnel only.
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;