
import React, { useState, useEffect } from 'react';

interface TypewriterTextProps {
  textToType: string;
  speed?: number;
  className?: string;
  title?: string;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({ 
  textToType, 
  speed = 50, 
  className, 
  title 
}) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText(''); // Reset for new text
    const newText = textToType || ""; // Ensure textToType is a string

    if (newText) {
      let currentLength = 0;
      const timer = setInterval(() => {
        currentLength++;
        setDisplayedText(newText.substring(0, currentLength));
        if (currentLength >= newText.length) {
          clearInterval(timer);
        }
      }, speed);
      return () => clearInterval(timer);
    } else {
      // If textToType is empty or null from the start, ensure displayedText is also empty
      setDisplayedText(""); 
    }
  }, [textToType, speed]);

  // Render the span with the dynamically changing displayedText
  // The title attribute will use the full textToType for immediate tooltip, or the provided title prop
  return (
    <span className={className} title={title || textToType}>
      {displayedText}
    </span>
  );
};

export default TypewriterText;
