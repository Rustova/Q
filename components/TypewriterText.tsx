import React from 'react';

interface TypewriterTextProps {
  textToType: string;
  speed?: number; // No longer used, but kept for API compatibility if other components expect it
  className?: string;
  title?: string;
  cursorClassName?: string; // No longer used
}

const TypewriterText: React.FC<TypewriterTextProps> = ({
  textToType,
  // speed, // No longer used internally
  className,
  title,
  // cursorClassName, // No longer used
}) => {
  const effectiveText = textToType || "";

  return (
    <span className={className} title={title || textToType}>
      {effectiveText}
    </span>
  );
};

export default TypewriterText;