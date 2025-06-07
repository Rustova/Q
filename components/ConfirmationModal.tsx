import React, { useState, FormEvent, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  requiredPassword?: string; // Optional: if not provided, no password check, just a confirm/cancel
  onConfirm: () => void;
  onCancel: () => void;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  requiredPassword,
  onConfirm,
  onCancel,
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
}) => {
  const [enteredPassword, setEnteredPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setEnteredPassword('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (requiredPassword) {
      if (enteredPassword === requiredPassword) {
        onConfirm();
      } else {
        setError('Incorrect password. Please try again.');
      }
    } else {
      onConfirm(); // No password required, just confirm
    }
  };

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) {
    console.error("Modal root element 'modal-root' not found for ConfirmationModal.");
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
      onClick={onCancel} // Close on overlay click
    >
      <div
        className="bg-[var(--bg-secondary)] p-6 md:p-8 rounded-lg shadow-xl w-full max-w-md border border-[var(--border-color)]"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <h2 id="confirmation-modal-title" className="text-xl font-semibold text-[var(--accent-primary)] mb-4 text-center">
          {title}
        </h2>
        <div className="text-sm text-[var(--text-primary)] mb-6 text-center">
          {message}
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {requiredPassword && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Enter Password to Confirm
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={enteredPassword}
                onChange={(e) => setEnteredPassword(e.target.value)}
                className="w-full p-3 border border-[var(--input-border)] rounded-md bg-[var(--input-bg)] text-[var(--input-text)] focus:ring-2 focus:ring-[var(--input-focus-ring)] focus:border-[var(--input-focus-ring)] placeholder-[var(--placeholder-color)]"
                placeholder="Enter confirmation password"
                required
                autoFocus
              />
            </div>
          )}
          {error && <p className="text-red-500 text-sm text-center -mt-2">{error}</p>}
          <div className="flex flex-col sm:flex-row-reverse gap-3 pt-2">
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover-bg)] text-[var(--btn-primary-text)] font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--btn-primary-focus-ring)] focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)]"
            >
              {confirmButtonText}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-6 py-2.5 bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover-bg)] text-[var(--btn-secondary-text)] font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--btn-secondary-focus-ring)] focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)]"
            >
              {cancelButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>,
    modalRoot
  );
};

export default ConfirmationModal;
