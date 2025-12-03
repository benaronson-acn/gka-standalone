
import React, { useState, useEffect } from 'react';
import { Persona } from '../types';

interface PersonaSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  currentContent: string;
  existingPersonas: Persona[];
}

const PersonaSaveModal: React.FC<PersonaSaveModalProps> = ({ isOpen, onClose, onSave, currentContent, existingPersonas }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isDuplicate, setIsDuplicate] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
        setName('');
        setError('');
        setIsDuplicate(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (error) setError('');
    
    // Check for duplicates (case-insensitive)
    const normalizedName = val.trim().toLowerCase();
    const exists = existingPersonas.some(p => p.name.toLowerCase() === normalizedName);
    setIsDuplicate(exists);
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError('Please provide a name for this persona.');
      return;
    }
    onSave(name);
    setName('');
    setError('');
    setIsDuplicate(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          <h3 className="text-xl font-bold text-sky-400 mb-4">Save New Persona</h3>
          
          <div className="mb-4">
            <label htmlFor="persona-name" className="block text-sm font-medium text-gray-300 mb-2">
              Persona Name
            </label>
            <input
              id="persona-name"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Tech Entrepreneur, Local Artist"
              className="w-full bg-gray-900 border border-gray-600 rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-200"
              autoFocus
            />
            {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
            
            {isDuplicate && (
                <div className="flex items-start space-x-2 text-amber-300 text-sm mt-3 bg-amber-900/30 border border-amber-700/50 p-2.5 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>Warning: A persona with this name already exists. Saving will update the existing persona.</span>
                </div>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              System Instruction Content (Preview)
            </label>
            <div className="bg-gray-900/50 p-3 rounded-md border border-gray-700 max-h-40 overflow-y-auto custom-scrollbar">
              <p className="text-sm text-gray-400 whitespace-pre-wrap italic">
                {currentContent}
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                onClose();
              }}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className={`px-4 py-2 text-white rounded-md font-medium transition-colors ${isDuplicate ? 'bg-amber-600 hover:bg-amber-500' : 'bg-sky-600 hover:bg-sky-500'}`}
            >
              {isDuplicate ? 'Update Persona' : 'Save Persona'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonaSaveModal;
