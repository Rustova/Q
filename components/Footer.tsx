
import React from 'react';

interface FooterProps {
  appName: string;
}

const Footer: React.FC<FooterProps> = ({ appName }) => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-center py-4 sm:py-5 border-t border-[var(--border-color)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <p className="text-xs sm:text-sm">
          &copy; {currentYear} {appName}. Made with <i className="fa-solid fa-heart text-[var(--accent-red)] animate-heartbeat"></i>
        </p>
      </div>
    </footer>
  );
};

export default Footer;