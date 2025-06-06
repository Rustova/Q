import React, { useState, useEffect, useRef, useCallback } from 'react';

interface HoldToDeleteButtonProps {
  onConfirm: () => void;
  label: string;
  holdTimeMs?: number;
}

const HoldToDeleteButton: React.FC<HoldToDeleteButtonProps> = ({
  onConfirm,
  label,
  holdTimeMs = 3000,
}) => {
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0); // Percentage
  const [displayText, setDisplayText] = useState(label);
  
  const timerRef = useRef<number | null>(null);
  const pressStartTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const resetInteraction = useCallback(() => {
    setIsHolding(false);
    setProgress(0);
    setDisplayText(label);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    pressStartTimeRef.current = null;
  }, [label]);

  const tick = useCallback(() => {
    if (!pressStartTimeRef.current) {
      resetInteraction();
      return;
    }
    const elapsedTime = Date.now() - pressStartTimeRef.current;
    const currentProgress = Math.min((elapsedTime / holdTimeMs) * 100, 100);
    setProgress(currentProgress);

    const remainingTimeSec = Math.ceil(Math.max(0, holdTimeMs - elapsedTime) / 1000);
    setDisplayText(`${remainingTimeSec}s`);

    if (currentProgress >= 100) {
      onConfirm();
      resetInteraction();
    } else {
      animationFrameRef.current = requestAnimationFrame(tick);
    }
  }, [holdTimeMs, onConfirm, resetInteraction]);

  const startInteraction = useCallback(() => {
    if (isHolding) return;
    setIsHolding(true);
    pressStartTimeRef.current = Date.now();
    setProgress(0);
    
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(tick);
  }, [isHolding, tick]);


  useEffect(() => {
    // Cleanup on unmount
    return () => {
      resetInteraction();
    };
  }, [resetInteraction]);
  
  useEffect(() => { // Reset display text if label changes externally while not holding
    if (!isHolding) {
        setDisplayText(label);
    }
  }, [label, isHolding]);


  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Prevent text selection, etc.
    startInteraction();
  };
  const handleTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Important for touch devices
    startInteraction();
  };

  return (
    <button
      type="button"
      className="relative w-full px-3 py-1.5 text-sm text-white rounded-md transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 focus:ring-red-500 focus:ring-offset-slate-100 overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseUp={resetInteraction}
      onMouseLeave={resetInteraction} // If mouse leaves button area
      onTouchStart={handleTouchStart}
      onTouchEnd={resetInteraction}
      onTouchCancel={resetInteraction}
      aria-label={`Hold to confirm ${label}`}
    >
      <span
        className="button-hold-progress"
        style={{ width: `${progress}%` }}
      ></span>
      <span className="relative z-10 flex items-center space-x-1.5 select-none">
        <i className="fa-solid fa-trash fa-fw shrink-0"></i>
        <span className="button-label truncate">{displayText}</span>
      </span>
    </button>
  );
};

export default HoldToDeleteButton;