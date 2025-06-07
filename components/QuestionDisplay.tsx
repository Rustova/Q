
import React from 'react';
import type { Question } from '../App.tsx'; 

interface QuestionDisplayProps {
  question: Question;
  questionNumber: number;
  selectedOptionId: string | null; 
  isSubmitted: boolean; 
  onOptionSelect: (optionId: string) => void;
  correctOptionIdForDisplay?: string; 
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  questionNumber,
  selectedOptionId,
  isSubmitted,
  onOptionSelect,
  correctOptionIdForDisplay,
}) => {
  return (
    <div>
      <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-[var(--text-primary)] whitespace-pre-wrap" id={`question-${question.id}-text`}>
        {questionNumber}. {question.questionText}
      </h3>
      {question.type === 'mcq' && question.options && (
        <div className="space-y-3" role="radiogroup" aria-labelledby={`question-${question.id}-text`}>
          {question.options.map((option, index) => {
            const isActuallySelectedByUser = selectedOptionId === option.id;
            const optionLabel = String.fromCharCode(65 + index);

            let baseButtonClass = "w-full text-left p-3 rounded-md transition-all duration-150 flex items-center text-sm sm:text-base ";
            let specificStyling = "";
            let iconClass = "";

            if (isSubmitted) {
              baseButtonClass += " border-2 "; // Thicker border for all submitted options
              const isSystemCorrect = option.id === correctOptionIdForDisplay;

              if (isSystemCorrect) {
                specificStyling = "border-[var(--accent-green)] text-[var(--accent-green)] bg-[var(--accent-green-bg-soft)] font-medium";
                iconClass = "fa-solid fa-check-circle text-[var(--accent-green)]";
                if (isActuallySelectedByUser) {
                  // Make selected correct answer stand out a bit more if needed, e.g. thicker ring or slight shadow
                  specificStyling += " ring-2 ring-[var(--accent-green)] ring-offset-1 ring-offset-[var(--bg-primary)]";
                }
              } else if (isActuallySelectedByUser && !isSystemCorrect) {
                specificStyling = "border-[var(--accent-red)] text-[var(--accent-red)] bg-[var(--accent-red-bg-soft)] font-medium";
                iconClass = "fa-solid fa-times-circle text-[var(--accent-red)]";
              } else { // Other options (not selected by user, not the correct answer)
                specificStyling = "border-[var(--border-color)] text-[var(--text-secondary)] bg-[var(--bg-primary)] opacity-60 cursor-not-allowed";
                iconClass = "fa-regular fa-circle text-[var(--text-secondary)] opacity-60";
              }
            } else { // Not submitted yet
              baseButtonClass += " border "; // Standard border thickness
              if (isActuallySelectedByUser) {
                specificStyling = "bg-[var(--accent-primary-bg-selection)] border-[var(--accent-primary)] text-[var(--btn-primary-text)] font-medium";
                iconClass = "fa-solid fa-dot-circle text-[var(--btn-primary-text)]";
              } else {
                specificStyling = "bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-secondary)]";
                iconClass = "fa-regular fa-circle text-[var(--text-secondary)]";
              }
            }
            
            const finalButtonClass = baseButtonClass + specificStyling;

            return (
              <button
                key={option.id}
                data-option-id={option.id}
                className={`user-option-button ${finalButtonClass}`}
                onClick={() => onOptionSelect(option.id)}
                disabled={isSubmitted} 
                role="radio"
                aria-checked={isActuallySelectedByUser && !isSubmitted} 
                aria-label={`Option ${optionLabel}: ${option.text}`}
              >
                <i className={`${iconClass} mr-2.5 text-lg w-5 text-center`}></i> {/* Ensure icon takes consistent space */}
                <span className={`font-semibold mr-1.5`}>{optionLabel}.</span>
                <span>{option.text}</span>
              </button>
            );
          })}
        </div>
      )}
      {question.type === 'written' && (
        <div className="p-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md">
            <p className="text-[var(--text-primary)] italic">This is a written response question.</p>
        </div>
      )}
    </div>
  );
};

export default QuestionDisplay;