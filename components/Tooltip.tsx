import React from 'react';

interface TooltipProps {
  children: React.ReactNode;
  position?: 'center' | 'top';
  widthClass?: string;
  paddingClass?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ children, position = 'center', widthClass = 'w-80', paddingClass = 'p-4' }) => {
  const positionClasses = position === 'center'
    ? 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
    : 'absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2';

  return (
    <div className="group relative flex items-center justify-center cursor-help">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-[var(--acn-light-purple)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div className={`${positionClasses} ${widthClass} ${paddingClass} bg-gray-800 text-xs text-gray-300 rounded-lg shadow-2xl border border-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[100]`}>
        {children}
      </div>
    </div>
  );
};

export default Tooltip;
