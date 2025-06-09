

import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Subject } from '../App.tsx';
import PdfPreferencesModal from './PdfPreferencesModal.tsx'; 

interface SubjectSelectionViewProps {
  subjects: Subject[];
  onSelectSubject: (subjectId: string) => void;
  playAnimation: boolean;
  onAnimationComplete: () => void;
}

const FADE_IN_UP_DURATION_MS = 500; // Duration of the .animate-fadeInUp animation

const SubjectSelectionView: React.FC<SubjectSelectionViewProps> = ({ 
  subjects, 
  onSelectSubject,
  playAnimation,
  onAnimationComplete,
}) => {
  const FEW_SUBJECTS_THRESHOLD = 4; 
  const baseDelay = 0.1; 
  const itemStaggerDelay = 0.075; 

  const [showPdfPreferencesModal, setShowPdfPreferencesModal] = useState(false);
  const [pdfButtonAnimationState, setPdfButtonAnimationState] = useState<'idle' | 'growing' | 'shining' | 'returning' | 'finished'>('idle');
  const pdfButtonRef = useRef<HTMLButtonElement>(null);
  const initialButtonRectRef = useRef<DOMRect | null>(null);
  const [isInitialRectCaptured, setIsInitialRectCaptured] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);


  const handleOpenPdfPreferences = () => {
    setShowPdfPreferencesModal(true);
  };

  const handleClosePdfPreferences = () => {
    setShowPdfPreferencesModal(false);
  };

  let emptyIconDelay = 0, emptyText1Delay = 0, emptyText2Delay = 0;
  if (subjects.length === 0) {
    emptyIconDelay = baseDelay + 0.1;
    emptyText1Delay = emptyIconDelay + 0.1;
    emptyText2Delay = emptyText1Delay + 0.1;
  }
  
  const calculatedPdfButtonContainerDelay: number = useMemo(() => {
    if (subjects.length === 0) {
      return emptyText2Delay + itemStaggerDelay + 0.2;
    } else {
      let delayOfLastElementInListStructure: number;
      const lastSubjectItemActualDelay = baseDelay + 0.1 + ((subjects.length - 1) * itemStaggerDelay);
      if (subjects.length < FEW_SUBJECTS_THRESHOLD) {
        const moreSubjectsMessageActualDelay = baseDelay + 0.1 + (subjects.length * itemStaggerDelay);
        delayOfLastElementInListStructure = moreSubjectsMessageActualDelay;
      } else {
        delayOfLastElementInListStructure = lastSubjectItemActualDelay;
      }
      return delayOfLastElementInListStructure + itemStaggerDelay + 0.2;
    }
  }, [subjects.length, baseDelay, itemStaggerDelay, FEW_SUBJECTS_THRESHOLD, emptyText2Delay]);


  // Effect to capture initial button geometry once its container is stable
  useEffect(() => {
    if (pdfButtonRef.current && !initialButtonRectRef.current && subjects.length > 0 && !isInitialRectCaptured) {
        // Increased buffer from 100ms to 300ms for more stability before capture
        const delayForCapture = (calculatedPdfButtonContainerDelay * 1000) + FADE_IN_UP_DURATION_MS + 300; 
        const timer = setTimeout(() => {
            if (pdfButtonRef.current) {
                initialButtonRectRef.current = pdfButtonRef.current.getBoundingClientRect();
                setIsInitialRectCaptured(true);
            }
        }, delayForCapture);
        return () => clearTimeout(timer);
    }
     // Reset if subjects become empty, allowing re-capture if they populate again
     if (subjects.length === 0 && isInitialRectCaptured) {
        setIsInitialRectCaptured(false);
        initialButtonRectRef.current = null;
        setPdfButtonAnimationState('idle'); 
    }
  }, [subjects.length, calculatedPdfButtonContainerDelay, isInitialRectCaptured]);

  // Effect to get audio element reference
  useEffect(() => {
    const audioElement = document.getElementById('shine-sound') as HTMLAudioElement;
    if (audioElement) {
      audioRef.current = audioElement;
    }
  }, []);


  // Main animation sequence controller
  useEffect(() => {
    // Entry condition for starting the animation sequence
    if (playAnimation && pdfButtonAnimationState === 'idle' && isInitialRectCaptured && subjects.length > 0 && pdfButtonRef.current) {
        if (pdfButtonRef.current) { 
            setPdfButtonAnimationState('growing');
        }
        // No explicit timer here, animation starts based on prop change
    }

    const button = pdfButtonRef.current;
    if (!button) return;

    const initialRect = initialButtonRectRef.current;
    if (!initialRect && ['growing', 'shining', 'returning'].includes(pdfButtonAnimationState)) {
        console.error("Animation stage attempted without initial rect. Resetting.");
        setPdfButtonAnimationState('idle');
        setIsInitialRectCaptured(false); // Reset to allow re-capture
        if(playAnimation) onAnimationComplete(); // Reset trigger in App.tsx if it was active
        return;
    }

    let stageTimer: number;

    // Clear previous animation classes
    button.classList.remove('pdf-button-growing', 'pdf-button-shining', 'pdf-button-returning');
    
    const translateX = initialRect ? (window.innerWidth / 2) - (initialRect.left + initialRect.width / 2) : 0;
    const translateY = initialRect ? (window.innerHeight / 2) - (initialRect.top + initialRect.height / 2) : 0;


    if (pdfButtonAnimationState === 'growing') {
        if (!initialRect) return; 
        button.style.position = 'fixed';
        button.style.top = `${initialRect.top}px`;
        button.style.left = `${initialRect.left}px`;
        button.style.width = `${initialRect.width}px`;
        button.style.height = `${initialRect.height}px`;
        button.style.margin = '0';
        button.style.zIndex = '1000';
        button.style.transformOrigin = 'center center';
        
        button.style.setProperty('--translate-to-center-x', `${translateX}px`);
        button.style.setProperty('--translate-to-center-y', `${translateY}px`);
        button.style.transform = 'translate(0px, 0px) scale(1)';

        void button.offsetWidth; 
        button.classList.add('pdf-button-growing');

        stageTimer = window.setTimeout(() => {
            setPdfButtonAnimationState('shining');
        }, 800); 

    } else if (pdfButtonAnimationState === 'shining') {
        if (!initialRect) return;
        button.style.position = 'fixed';
        button.style.top = `${initialRect.top}px`;
        button.style.left = `${initialRect.left}px`;
        button.style.width = `${initialRect.width}px`;
        button.style.height = `${initialRect.height}px`;
        button.style.margin = '0';
        button.style.zIndex = '1000';
        button.style.transformOrigin = 'center center';
        
        button.style.transform = `translate(var(--translate-to-center-x), var(--translate-to-center-y)) scale(2.5)`;
        button.style.overflow = 'hidden'; 
        
        void button.offsetWidth; 
        button.classList.add('pdf-button-shining');

        if (audioRef.current) {
          audioRef.current.currentTime = 0; 
          audioRef.current.play().catch(error => console.warn("Audio play failed:", error.name, error.message));
        }

        stageTimer = window.setTimeout(() => {
            setPdfButtonAnimationState('returning');
        }, 1500); 

    } else if (pdfButtonAnimationState === 'returning') {
        if (!initialRect) return;
        button.style.overflow = ''; 
        
        void button.offsetWidth; 
        button.classList.add('pdf-button-returning');

        stageTimer = window.setTimeout(() => {
            setPdfButtonAnimationState('finished');
        }, 600); 

    } else if (pdfButtonAnimationState === 'finished') {
        button.style.transform = 'translate(0px, 0px) scale(1)';
        void button.offsetWidth; 

        button.style.position = ''; 
        
        button.style.top = '';
        button.style.left = '';
        button.style.width = '';
        button.style.height = '';
        button.style.margin = ''; 
        button.style.zIndex = '';
        button.style.transformOrigin = '';
        button.style.overflow = '';
        button.style.removeProperty('--translate-to-center-x');
        button.style.removeProperty('--translate-to-center-y');
        button.style.transform = ''; 
        
        onAnimationComplete(); // Notify App.tsx that animation is done
        // Reset local state to 'idle' to allow re-triggering if playAnimation becomes true again
        // setPdfButtonAnimationState('idle'); // No, let App.tsx control the trigger. If it becomes true again, effect re-runs.
    }

    return () => {
        window.clearTimeout(stageTimer);
    };
  }, [playAnimation, pdfButtonAnimationState, isInitialRectCaptured, subjects.length, onAnimationComplete]);


  return (
    <>
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 pb-4 sm:pb-6 flex flex-col flex-grow">
        <h2 
          className="text-2xl sm:text-3xl font-semibold text-[var(--accent-primary)] text-center mb-6 sm:mb-8 pb-4 border-b border-[var(--border-color)] mt-4 sm:mt-6 shrink-0 animate-fadeInUp"
          style={{ animationDelay: `${baseDelay}s` }}
        >
          Select a Subject
        </h2>
        {subjects.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center py-10 px-4">
            <i 
              className="fa-solid fa-box-open text-5xl sm:text-6xl text-[var(--text-secondary)] opacity-60 mb-6 animate-fadeInUp"
              style={{ animationDelay: `${emptyIconDelay}s` }}
            ></i>
            <p 
              className="text-xl sm:text-2xl font-semibold text-[var(--text-primary)] mb-2 animate-fadeInUp"
              style={{ animationDelay: `${emptyText1Delay}s` }}
            >
              It's a bit quiet here...
            </p>
            <p 
              className="text-sm sm:text-md text-[var(--text-secondary)] max-w-md animate-fadeInUp"
              style={{ animationDelay: `${emptyText2Delay}s` }}
            >
              No subjects are available at the moment. Administrators can add new subjects and quizzes through the Admin Panel. Please check back soon!
            </p>
          </div>
        ) : (
          <div 
            className={`flex-grow flex flex-col items-center ${
              subjects.length < FEW_SUBJECTS_THRESHOLD ? 'justify-center' : 'justify-start'
            }`}
          >
            <div className="w-full space-y-3 py-4">
              {subjects.map((subject, index) => {
                const availableQuizzesCount = subject.quizzes.filter(q => q.isStartable).length;
                const subjectItemAnimationDelay = baseDelay + 0.1 + (index * itemStaggerDelay); 
                return (
                  <button
                    key={subject.id}
                    onClick={() => onSelectSubject(subject.id)}
                    className="w-full text-left p-4 bg-[var(--bg-primary)] hover:bg-[var(--accent-secondary)] hover:bg-opacity-20 border border-[var(--border-color)] hover:border-[var(--accent-secondary)] rounded-lg text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)] animate-fadeInUp"
                    style={{ animationDelay: `${subjectItemAnimationDelay}s` }}
                    aria-label={`Select subject: ${subject.name}, ${availableQuizzesCount} quiz${availableQuizzesCount !== 1 ? 'zes' : ''} available`}
                  >
                    <span className="text-lg font-semibold text-[var(--accent-primary)]">{subject.name}</span>
                    <span className="block text-sm text-[var(--text-secondary)] mt-1">
                      {availableQuizzesCount} quiz{availableQuizzesCount !== 1 ? 'zes' : ''} available
                    </span>
                  </button>
                );
              })}
            </div>
            {subjects.length < FEW_SUBJECTS_THRESHOLD && (
              <p 
                  className="text-center text-xs sm:text-sm text-[var(--text-secondary)] mt-4 mb-4 italic animate-fadeInUp"
                  style={{ animationDelay: `${baseDelay + 0.1 + (subjects.length * itemStaggerDelay)}s` }} 
              >
                  More subjects and quizzes are on the way. Stay tuned!
              </p>
            )}
          </div>
        )}
        
        <div 
          className="mt-auto pt-6 border-t border-[var(--border-color)] text-center animate-fadeInUp" 
          style={{ animationDelay: `${calculatedPdfButtonContainerDelay}s` }}
        >
          <button
            ref={pdfButtonRef}
            onClick={handleOpenPdfPreferences}
            className="px-6 py-3 bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover-bg)] text-[var(--btn-secondary-text)] rounded-lg transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--btn-secondary-focus-ring)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] flex items-center justify-center mx-auto"
            aria-label="Open PDF export preferences"
            disabled={pdfButtonAnimationState !== 'idle' && pdfButtonAnimationState !== 'finished'}
          >
            <i className="fa-solid fa-file-pdf fa-lg mr-2.5"></i>
            Export Quizzes to PDF
          </button>
        </div>
      </div>
      <PdfPreferencesModal
        isOpen={showPdfPreferencesModal}
        onClose={handleClosePdfPreferences}
        subjects={subjects}
      />
    </>
  );
};

export default SubjectSelectionView;
