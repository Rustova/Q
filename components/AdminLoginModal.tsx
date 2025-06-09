
import React, { useState, FormEvent } from 'react';
import { createPortal } from 'react-dom';


interface AdminLoginModalProps {
  onLogin: (password: string) => void;
  onClose: () => void;
  error: string | null;
}

const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ onLogin, onClose, error }) => {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onLogin(password);
  };

  const modalContent = (
    <div 
        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="admin-login-title"
    >
      <div className="bg-[var(--bg-secondary)] p-6 md:p-8 rounded-lg shadow-xl w-full max-w-md border border-[var(--border-color)]">
        <h2 id="admin-login-title" className="text-2xl font-semibold text-[var(--accent-primary)] mb-6 text-center">
          Admin Login
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="adminPassword" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Password
            </label>
            <input
              type="password"
              id="adminPassword"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-[var(--input-border)] rounded-md bg-[var(--input-bg)] text-[var(--input-text)] focus:ring-2 focus:ring-[var(--input-focus-ring)] focus:border-[var(--input-focus-ring)] placeholder-[var(--placeholder-color)]"
              placeholder="Enter admin password"
              required
              // autoFocus removed
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center -mt-2">{error}</p>}
          <div className="flex flex-col sm:flex-row-reverse gap-3 pt-2">
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover-bg)] text-[var(--btn-primary-text)] font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--btn-primary-focus-ring)] focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)]"
            >
              Login
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover-bg)] text-[var(--btn-secondary-text)] font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--btn-secondary-focus-ring)] focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
  
  const modalRootElement = document.getElementById('modal-root');
  if (!modalRootElement) {
    console.error("Modal root element 'modal-root' not found.");
    return null; 
  }

  return createPortal(modalContent, modalRootElement);
};

export default AdminLoginModal;