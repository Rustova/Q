
import React, { useState, useEffect, useCallback } from 'react';
import CustomDigitColumn from './CustomDigitColumn.tsx';
import Colon from './Colon.tsx';

interface ClockProps {
  mode?: 'current' | 'countdown';
  initialTimeSeconds?: number; // Required for countdown mode
  onTimeUp?: () => void; // For countdown mode
  showSeconds?: boolean;
  showLabels?: boolean;
  className?: string; // Class for the main clock container
  digitContainerClassName?: string; // Class for the element wrapping digits and colons
  digitCircleSize?: number;
  digitFontSize?: string;
  colonFontSize?: string;
}

const Clock: React.FC<ClockProps> = ({
  mode = 'current',
  initialTimeSeconds = 0,
  onTimeUp,
  showSeconds = true,
  showLabels = false,
  className = 'p-2 rounded-lg',
  digitContainerClassName = 'flex items-center justify-center space-x-1',
  digitCircleSize, // Will use DigitCircle's default if undefined
  digitFontSize,   // Will use DigitCircle's default if undefined
  colonFontSize,   // Will use Colon's default if undefined
}) => {
  const calculateTimeLeft = useCallback(() => {
    if (mode === 'countdown') {
      return initialTimeSeconds > 0 ? initialTimeSeconds : 0;
    }
    return 0; // Not used for 'current' mode directly in this state
  }, [mode, initialTimeSeconds]);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [remainingSeconds, setRemainingSeconds] = useState<number>(calculateTimeLeft());

  useEffect(() => {
    if (mode === 'countdown') {
      setRemainingSeconds(initialTimeSeconds > 0 ? initialTimeSeconds : 0);
    }
  }, [mode, initialTimeSeconds]);
  
  useEffect(() => {
    let timerId: number;

    if (mode === 'current') {
      timerId = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
    } else if (mode === 'countdown') {
      if (remainingSeconds <= 0) {
        onTimeUp?.();
        return; // Stop the timer if time is up
      }
      timerId = setInterval(() => {
        setRemainingSeconds((prevSeconds) => {
          if (prevSeconds <= 1) {
            clearInterval(timerId);
            onTimeUp?.();
            return 0;
          }
          return prevSeconds - 1;
        });
      }, 1000);
    }

    return () => {
      clearInterval(timerId);
    };
  }, [mode, remainingSeconds, onTimeUp]);

  const getDisplayTime = () => {
    if (mode === 'current') {
      return {
        hours: currentTime.getHours(),
        minutes: currentTime.getMinutes(),
        seconds: currentTime.getSeconds(),
      };
    } else { // countdown
      const hours = Math.floor(remainingSeconds / 3600);
      const minutes = Math.floor((remainingSeconds % 3600) / 60);
      const seconds = remainingSeconds % 60;
      return { hours, minutes, seconds };
    }
  };

  const { hours, minutes, seconds } = getDisplayTime();

  return (
    <div className={className} role="timer" aria-live="polite">
      <div className={digitContainerClassName}>
        <CustomDigitColumn 
          value={hours} 
          label={showLabels ? 'Hrs' : undefined} 
          digitCircleSize={digitCircleSize} 
          digitFontSize={digitFontSize} 
        />
        <Colon fontSize={colonFontSize} />
        <CustomDigitColumn 
          value={minutes} 
          label={showLabels ? 'Min' : undefined} 
          digitCircleSize={digitCircleSize} 
          digitFontSize={digitFontSize} 
        />
        {showSeconds && (
          <>
            <Colon fontSize={colonFontSize} />
            <CustomDigitColumn 
              value={seconds} 
              label={showLabels ? 'Sec' : undefined} 
              digitCircleSize={digitCircleSize} 
              digitFontSize={digitFontSize} 
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Clock;