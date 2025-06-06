
import React from 'react';

interface DigitCircleProps {
  digit: string | number;
  className?: string;
  size?: number; // Diameter of the circle
  fontSize?: string; // Font size for the digit
}

const DigitCircle: React.FC<DigitCircleProps> = ({
  digit,
  className = '',
  size = 40, // Default size: 40px
  fontSize = 'text-xl', // Default font size
}) => {
  return (
    <div
      className={`flex items-center justify-center bg-slate-800 text-white rounded-full shadow-md ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      aria-hidden="true" // Decorative if part of a larger clock reading
    >
      <span className={`${fontSize} font-mono font-semibold select-none`}>
        {String(digit).padStart(1, '0')}
      </span>
    </div>
  );
};

export default DigitCircle;
