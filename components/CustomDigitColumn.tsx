
import React from 'react';
import DigitCircle from './DigitCircle.tsx';

interface CustomDigitColumnProps {
  value: number;
  label?: string;
  digitCircleSize?: number;
  digitFontSize?: string;
  labelClassName?: string;
  columnClassName?: string;
}

const CustomDigitColumn: React.FC<CustomDigitColumnProps> = ({
  value,
  label,
  digitCircleSize = 40,
  digitFontSize = 'text-xl',
  labelClassName = 'text-xs text-slate-500 font-medium tracking-wider uppercase select-none',
  columnClassName = 'flex flex-col items-center space-y-1',
}) => {
  const tens = String(Math.floor(value / 10) % 10);
  const ones = String(value % 10);

  return (
    <div className={columnClassName}>
      <div className="flex space-x-1">
        <DigitCircle digit={tens} size={digitCircleSize} fontSize={digitFontSize} />
        <DigitCircle digit={ones} size={digitCircleSize} fontSize={digitFontSize} />
      </div>
      {label && <span className={labelClassName}>{label}</span>}
    </div>
  );
};

export default CustomDigitColumn;
