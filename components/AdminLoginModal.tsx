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
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="admin-login-title"
    >
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl w-full max-w-md border border-slate-300">
        <h2 id="admin-login-title" className="text-2xl font-semibold text-blue-600 mb-6 text-center">
          Admin Login
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="adminPassword" className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="adminPassword"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-slate-600 rounded-md bg-slate-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400"
              placeholder="Enter admin password"
              required
              autoFocus
            />
          </div>
          {error && <p className="text-red-600 text-sm text-center -mt-2">{error}</p>}
          <div className="flex flex-col sm:flex-row-reverse gap-3 pt-2">
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Login
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
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