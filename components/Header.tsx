import React from 'react';

interface HeaderProps {
  contextTitle: string;
  isAdminView: boolean;
  onSwitchView: () => void;
}

const Header: React.FC<HeaderProps> = ({ contextTitle, isAdminView, onSwitchView }) => {
  return (
    <header className="bg-[#005ed4] shadow-md sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3"> {/* py-3 provides overall top/bottom padding */}
        {/* Top Row: Logo and Button */}
        <div className="flex justify-between items-center pb-3"> {/* Added pb-3 for space before the line */}
          <div className="flex items-center space-x-3"> {/* Logo Group */}
            <div
              className="h-11 w-11 sm:h-14 sm:w-14 rounded-full border-2 border-[#005ed4] shadow-md transition-transform duration-200 ease-in-out hover:scale-110 flex items-center justify-center bg-white shrink-0"
              aria-label="App Logo Q"
            >
              <span className="text-[#005ed4] font-bold text-[1.7rem] sm:text-[2.2rem] select-none" style={{ fontFamily: 'Roboto, sans-serif'}}>
                Q
              </span>
            </div>
          </div>
          <button
            onClick={onSwitchView}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-transparent hover:bg-white text-white hover:text-[#005ed4] border border-white rounded-md transition-colors shrink-0 text-xs sm:text-sm flex items-center"
            aria-label={`Switch to ${isAdminView ? 'User View' : 'Admin Panel'}`}
          >
            {isAdminView ? (
              'Go to User View'
            ) : (
              <>
                <i className="fa-solid fa-headset mr-1.5 sm:mr-2"></i>
                <span>Admin Panel</span>
              </>
            )}
          </button>
        </div>

        {/* Gradient Line Separator */}
        <div style={{
            height: '1px',
            width: '100%',
            backgroundImage: 'linear-gradient(to right, transparent, rgba(255,255,255,0.5) 25%, rgba(255,255,255,0.5) 75%, transparent)',
        }}></div>

        {/* Bottom Row: Context Title (always shown, centered) */}
        <div className="text-center pt-2.5"> {/* Adjusted padding after removing static label */}
          <span className="text-white text-sm sm:text-base font-semibold truncate block" title={contextTitle}>
            {contextTitle}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;