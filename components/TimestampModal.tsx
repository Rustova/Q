

import React from 'react';
import { createPortal } from 'react-dom';

interface TimestampModalProps {
  isOpen: boolean;
  onClose: () => void;
  timestamp: string | null;
}

const TimestampModal: React.FC<TimestampModalProps> = ({ isOpen, onClose, timestamp }) => {
  if (!isOpen) {
    return null;
  }

  let formattedDate = "N/A";
  let formattedTime = "N/A";
  let fullDateTimeString = "Timestamp not available.";

  if (timestamp) {
    try {
      const dateObj = new Date(timestamp);
      if (!isNaN(dateObj.getTime())) {
        formattedDate = dateObj.toLocaleDateString(undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        formattedTime = dateObj.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short',
        });
        fullDateTimeString = `This content was last updated on: ${dateObj.toString()}`;
      } else {
        fullDateTimeString = "Invalid timestamp provided.";
      }
    } catch (e) {
      console.error("Error formatting timestamp for modal:", e);
      fullDateTimeString = "Error displaying timestamp.";
    }
  }

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) {
    console.error("Modal root element 'modal-root' not found for TimestampModal.");
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="timestamp-modal-title"
      onClick={onClose} // Close on overlay click
    >
      <div
        className="bg-[var(--bg-secondary)] p-6 md:p-8 rounded-lg shadow-xl w-full max-w-md border border-[var(--border-color)]"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <header className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--border-color)]">
            <h2 id="timestamp-modal-title" className="text-xl font-semibold text-[var(--accent-primary)]">
                Content Update Information
            </h2>
            <button
                onClick={onClose}
                className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--accent-red)] hover:bg-[var(--accent-red)] hover:bg-opacity-10 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-red)]"
                aria-label="Close timestamp information modal"
            >
                <i className="fa-solid fa-xmark fa-lg"></i>
            </button>
        </header>
        
        <div className="text-sm text-[var(--text-primary)] space-y-2">
          <p>{fullDateTimeString}</p>
          {timestamp && !isNaN(new Date(timestamp).getTime()) && (
            <>
              <p><strong>Date:</strong> {formattedDate}</p>
              <p><strong>Time:</strong> {formattedTime}</p>
            </>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-[var(--border-color)] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover-bg)] text-[var(--btn-primary-text)] font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--btn-primary-focus-ring)] focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)] text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    modalRoot
  );
};

export default TimestampModal;