
import React from 'react';

interface HeaderProps {
  contextTitle: string;
  isAdminView: boolean;
  isAdminAuthenticated: boolean;
  onSwitchToAdminView: () => void;
  onSwitchToUserView: () => void;
  onAdminLogout: () => void;
  dataTimestamp: string | null;
  onShowTimestampModal: () => void; 
}

interface TimestampDisplayInfo {
  timeDescription: string;
  tooltip: string;
}

const getTimestampDisplayInfo = (isoString: string | null): TimestampDisplayInfo | null => {
  if (!isoString) return null;
  try {
    const updateDate = new Date(isoString);
    if (isNaN(updateDate.getTime())) {
      console.warn("Invalid date string received for formatting:", isoString);
      return { timeDescription: "Invalid Date", tooltip: isoString };
    }

    const now = new Date();
    const diffInSeconds = Math.round((now.getTime() - updateDate.getTime()) / 1000);

    const fullDateTimeForTooltip = updateDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) + ', ' + updateDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    let timeDescResult: string;

    if (diffInSeconds < 0) { 
        const dateStr = updateDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = updateDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        timeDescResult = `${dateStr}, ${timeStr}`; 
    } else if (diffInSeconds < 60) {
      timeDescResult = "just now";
    } else if (diffInSeconds < 3600) { 
      const minutes = Math.floor(diffInSeconds / 60);
      timeDescResult = `${minutes} min ago`;
    } else if (diffInSeconds < 86400) { 
      const hours = Math.floor(diffInSeconds / 3600);
      timeDescResult = `${hours} h ago`;
    } else { 
      const dateStr = updateDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      const timeStr = updateDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      timeDescResult = `${dateStr}, ${timeStr}`;
    }
    
    return {
      timeDescription: timeDescResult,
      tooltip: fullDateTimeForTooltip
    };

  } catch (e) {
    console.error("Error formatting date:", e);
    return { timeDescription: "Error in timestamp", tooltip: isoString || "Error formatting timestamp" };
  }
};


const Header: React.FC<HeaderProps> = ({ 
  contextTitle, 
  isAdminView, 
  isAdminAuthenticated, 
  onSwitchToAdminView,
  onSwitchToUserView,
  onAdminLogout,
  dataTimestamp,
  onShowTimestampModal
}) => {
  const timestampInfo = getTimestampDisplayInfo(dataTimestamp);

  let displayTimestampText = "";
  if (timestampInfo) {
    displayTimestampText = `last updated : ${timestampInfo.timeDescription}`;
  }
  
  const textPrimaryRGB = "211, 195, 185";


  return (
    <header className="bg-[var(--bg-header)] sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex justify-between items-center pb-3">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div
              className="h-14 w-14 sm:h-20 sm:w-20 rounded-full border-2 border-[var(--bg-header)] shadow-md transition-transform duration-200 ease-in-out hover:scale-110 flex items-center justify-center bg-[var(--text-primary)] shrink-0"
              aria-label="App Logo Q"
            >
              <span className="text-[var(--bg-primary)] font-bold text-[2.2rem] sm:text-[2.8rem] select-none" style={{ fontFamily: 'Roboto, sans-serif'}}>
                Q
              </span>
            </div>
            {timestampInfo && displayTimestampText && (
              <button
                onClick={onShowTimestampModal}
                className="text-[var(--text-primary)] text-[0.6rem] sm:text-xs opacity-80 leading-tight hover:opacity-100 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)] rounded text-left p-0.5"
                title={timestampInfo.tooltip}
                aria-label={`Content update details: ${timestampInfo.tooltip}`}
              >
                <span className="block">{displayTimestampText}</span>
              </button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {isAdminView && isAdminAuthenticated && (
              <button
                onClick={onAdminLogout}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[var(--accent-red)] hover:bg-[var(--accent-red-hover)] text-white border border-[var(--accent-red-hover)] rounded-md transition-colors shrink-0 text-xs sm:text-sm flex items-center"
                aria-label="Logout from Admin Panel"
              >
                <i className="fa-solid fa-right-from-bracket fa-fw mr-1.5 sm:mr-2"></i>
                <span>Admin Logout</span>
              </button>
            )}
            
            {isAdminView ? (
                 <button
                    onClick={onSwitchToUserView}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-transparent hover:bg-[var(--text-primary)] text-[var(--text-primary)] hover:text-[var(--bg-primary)] border border-[var(--text-primary)] rounded-md transition-colors shrink-0 text-xs sm:text-sm flex items-center"
                    aria-label="Switch to User View"
                  >
                   <i className="fa-solid fa-user-graduate fa-fw mr-1.5 sm:mr-2"></i>
                   <span>User View</span>
                  </button>
            ) : (
                 <button
                    onClick={onSwitchToAdminView}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-transparent hover:bg-[var(--text-primary)] text-[var(--text-primary)] hover:text-[var(--bg-primary)] border border-[var(--text-primary)] rounded-md transition-colors shrink-0 text-xs sm:text-sm flex items-center"
                    aria-label="Switch to Admin Panel"
                 >
                    <i className="fa-solid fa-headset mr-1.5 sm:mr-2"></i>
                    <span>Admin Panel</span>
                </button>
            )}
          </div>
        </div>

        <div style={{
            height: '1px',
            width: '100%',
            backgroundImage: `linear-gradient(to right, transparent, rgba(${textPrimaryRGB},0.5) 25%, rgba(${textPrimaryRGB},0.5) 75%, transparent)`,
        }}></div>

        <div className="text-center pt-2.5">
          <span className="text-[var(--text-primary)] text-sm sm:text-base font-semibold truncate block" title={contextTitle}>
            {contextTitle}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
