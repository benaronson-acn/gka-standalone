import React from 'react';

interface NavbarProps {
  currentPage: 'home' | 'about';
  onNavigate: (page: 'home' | 'about') => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const linkClasses = "px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200";
  const activeLinkClasses = "bg-[var(--acn-darkest-purple)] text-white";
  const inactiveLinkClasses = "text-gray-400 hover:bg-gray-800/50 hover:text-white";

  return (
    <nav className="bg-black/50 backdrop-blur-sm border-b border-[var(--acn-darkest-purple)] px-4 sm:px-6 lg:px-8 flex-shrink-0">
      <div className="flex items-center h-16">
        <div className="flex-1 flex justify-start">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('home')}>
                {/* <img src="./Acc_Logo_White_Purple_RGB.png" alt="Accenture Logo" className="h-8 w-auto"/> // image not loading within google ai studio for some reason */}
                <span className="text-xl font-bold text-white">Accenture</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--acn-main-purple)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </div>

        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => onNavigate('home')}
            className={`${linkClasses} ${currentPage === 'home' ? activeLinkClasses : inactiveLinkClasses}`}
          >
            Home
          </button>
          <button
            onClick={() => onNavigate('about')}
            className={`${linkClasses} ${currentPage === 'about' ? activeLinkClasses : inactiveLinkClasses}`}
          >
            About
          </button>
        </div>
        
        <div className="flex-1"></div>
      </div>
    </nav>
  );
};

export default Navbar;