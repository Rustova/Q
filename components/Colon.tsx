
import React from 'react';

interface ColonProps {
  className?: string;
  fontSize?: string; // Font size for the colon
}

const Colon: React.FC<ColonProps> = ({
  className = '',
  fontSize = 'text-3xl', // Default font size
}) => {
  return (
    <div
      className={`flex items-center justify-center px-1 text-slate-700 ${className}`}
      aria-hidden="true"
    >
      <span className={`${fontSize} font-mono font-bold select-none`}>:</span>
    </div>
  );
};

export default Colon;
