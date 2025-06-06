import React from 'react';

interface FooterProps {
  appName: string;
}

const Footer: React.FC<FooterProps> = ({ appName }) => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-slate-200 text-slate-600 text-center py-4 sm:py-5 border-t border-slate-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <p className="text-xs sm:text-sm">
          &copy; {currentYear} {appName}. Made with <i className="fa-solid fa-heart text-red-500"></i>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
