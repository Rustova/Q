import React, { useState, useEffect, useRef } from 'react';
import TypewriterText from './TypewriterText.tsx'; // Import TypewriterText

interface WelcomeScreenProps {
  onInteraction: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onInteraction }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [showTapPrompt, setShowTapPrompt] = useState(false); // Still used to enable click
  const circlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Start circle animations
    if (circlesRef.current) {
        const circles = circlesRef.current.children;
        Array.from(circles).forEach((circle, index) => {
            (circle as HTMLElement).style.animationDelay = `${index * 0.4}s`; // Stagger animation
        });
    }

    // Set showTapPrompt after a delay to enable interaction
    const promptTimer = setTimeout(() => {
        setShowTapPrompt(true);
    }, 3000); // Delay for tap prompt to appear (and interaction to be enabled) - CHANGED TO 3 SECONDS

    return () => clearTimeout(promptTimer);
  }, []);

  const handleScreenClick = () => {
    // Only allow click if prompt interaction is enabled and not already fading
    if (!showTapPrompt || isFadingOut) return; 
    setIsFadingOut(true);
    // onInteraction will be called by onAnimationEnd after fade-out completes
  };

  const handleAnimationEnd = (event: React.AnimationEvent<HTMLDivElement>) => {
    // Ensure we're reacting to the correct animation
    if (event.animationName === 'fadeOutWelcomeScreen') {
      onInteraction();
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black flex flex-col items-center justify-center z-[1001] transition-opacity duration-700 ease-in-out
                  ${isFadingOut ? 'welcome-screen-fading-out' : 'opacity-100'}
                  ${showTapPrompt ? 'cursor-pointer' : 'cursor-default'}`} // Conditional cursor
      onClick={handleScreenClick}
      onAnimationEnd={handleAnimationEnd}
      role="button"
      tabIndex={0}
      aria-label="Welcome screen, click to enter application when prompted"
    >
      <style>
        {`
          @keyframes fadeOutWelcomeScreen {
            from { opacity: 1; }
            to { opacity: 0; pointer-events: none; }
          }
          .welcome-screen-fading-out {
            animation: fadeOutWelcomeScreen 0.7s ease-in-out forwards;
          }

          @keyframes pulseLogo {
            0%, 100% { transform: scale(1); box-shadow: 0 0 15px var(--accent-primary), 0 0 30px var(--accent-primary); }
            50% { transform: scale(1.05); box-shadow: 0 0 25px var(--accent-primary), 0 0 50px var(--accent-primary); }
          }
          
          @keyframes simpleFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .welcome-q-logo-container {
            position: relative; /* For positioning circles */
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 3rem; 
            animation: simpleFadeIn 0.8s 0.2s ease-out backwards;
          }

          .welcome-q-logo-actual {
            height: 100px; 
            width: 100px;
            border-width: 3px;
            /* Changed border color to be visible on black, e.g., using accent-primary or a light gray */
            border-color: var(--accent-primary); 
            background-color: var(--text-primary);
             /* Text color for 'Q' might need adjustment if --bg-primary is too dark for black */
            color: var(--bg-secondary); /* Using --bg-secondary which is #161616, should be ok on light beige bg of Q */
            font-size: 4rem; 
            animation: pulseLogo 2.5s infinite ease-in-out;
            z-index: 10; /* Above circles */
          }
          
          .welcome-message-text-wrapper {
            color: var(--text-primary);
            font-size: 1.75rem; 
            font-weight: 500;
            margin-bottom: 1.5rem;
            
            display: flex;
            align-items: center;
            justify-content: center;

            width: 290px; 
            height: calc(1.75rem * 1.45); 

            animation: simpleFadeIn 1s 0.4s ease-out backwards;
          }

          .typewriter-inner-span {
            display: inline-block; 
            height: 1em; 
            line-height: 1em; 
          }

          .welcome-prompt-text {
            color: var(--accent-primary);
            font-size: 1.1rem; /* approx 17.6px */
            text-align: center;
            opacity: 0; /* Starts hidden, fades in via animation */
            animation: simpleFadeIn 1s 3s ease-out forwards; /* This makes the box and its content appear - CHANGED TO 3 SECONDS */
            
            /* Fixed height for stability */
            height: calc(1.1rem * 1.6); /* font-size * generous line-height factor */
            display: flex; /* For centering content within fixed height */
            align-items: center;
            justify-content: center;

            width: 100%; 
            box-sizing: border-box; 
            margin-bottom: 3rem; /* More space below */
          }

          .emerging-circles-bg {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 320px; 
            height: 320px; 
            pointer-events: none;
            z-index: 5; /* Behind logo */
          }
          .emerging-bg-circle {
            position: absolute;
            border-radius: 50%;
            border: 2px solid var(--accent-primary);
            opacity: 0;
            animation: emergeAndScaleFade 4s infinite ease-out;
            box-shadow: 0 0 8px var(--accent-primary);
          }
          .emerging-bg-circle:nth-child(1) { width: 160px; height: 160px; top: calc(50% - 80px); left: calc(50% - 80px); }
          .emerging-bg-circle:nth-child(2) { width: 220px; height: 220px; top: calc(50% - 110px); left: calc(50% - 110px); }
          .emerging-bg-circle:nth-child(3) { width: 280px; height: 280px; top: calc(50% - 140px); left: calc(50% - 140px); }
          
          @keyframes emergeAndScaleFade {
            0% { transform: scale(0.6); opacity: 0; }
            25% { opacity: 0.7; } 
            75% { opacity: 0.3; } 
            100% { transform: scale(1.1); opacity: 0; }
          }
        `}
      </style>
      
      <div className="welcome-q-logo-container">
        <div className="emerging-circles-bg" ref={circlesRef}>
            <div className="emerging-bg-circle"></div>
            <div className="emerging-bg-circle"></div>
            <div className="emerging-bg-circle"></div>
        </div>
        <div
            className="welcome-q-logo-actual rounded-full shadow-lg flex items-center justify-center select-none"
            aria-label="App Logo Q"
        >
            <span className="font-bold" style={{ fontFamily: 'Roboto, sans-serif' }}>
            Q
            </span>
        </div>
      </div>

      <div className="welcome-message-text-wrapper">
        <TypewriterText
          textToType="Welcome to Q!"
          speed={100} 
          className="typewriter-inner-span" 
        />
      </div>
      
      {/* Content of the prompt is now always rendered. Its parent (.welcome-prompt-text) fades in via CSS animation. */}
      <p className="welcome-prompt-text">
          <>
            <i className="fa-solid fa-hand-pointer fa-beat-fade mr-2" style={{animationDuration: '1.5s', color: 'var(--accent-primary)'}}></i>
            Tap anywhere to begin
          </>
      </p>
    </div>
  );
};

export default WelcomeScreen;