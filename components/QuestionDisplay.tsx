import React from 'react';
import type { Question, Option } from '../App.tsx';

interface QuestionDisplayProps {
  question: Question;
  questionNumber: number;
  selectedOptionId: string | null;
  isSubmitted: boolean;
  onOptionSelect: (optionId: string) => void;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  questionNumber,
  selectedOptionId,
  isSubmitted,
  onOptionSelect,
}) => {
  return (
    <div>
      <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-slate-700" id={`question-${question.id}-text`}>
        {questionNumber}. {question.questionText}
      </h3>
      {question.type === 'mcq' && question.options && (
        <div className="space-y-3" role="radiogroup" aria-labelledby={`question-${question.id}-text`}>
          {question.options.map((option, index) => {
            const isSelected = selectedOptionId === option.id;
            const optionLabel = String.fromCharCode(65 + index);
            let buttonClass = "w-full text-left p-3 rounded-md border transition-all duration-150 flex items-center text-sm sm:text-base ";

            if (isSubmitted) {
              if (option.id === question.correctOptionId) {
                buttonClass += "bg-green-500 border-green-400 text-white hover:bg-green-500 font-medium";
              } else if (isSelected && option.id !== question.correctOptionId) {
                buttonClass += "bg-red-500 border-red-400 text-white hover:bg-red-500 font-medium";
              } else {
                buttonClass += "bg-slate-100 border-slate-300 text-slate-500 opacity-80 cursor-not-allowed";
              }
            } else {
              if (isSelected) {
                buttonClass += "bg-blue-100 border-blue-500 text-blue-700 ring-2 ring-blue-500 font-medium";
              } else {
                buttonClass += "bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400";
              }
            }

            return (
              <button
                key={option.id}
                data-option-id={option.id}
                className={`user-option-button ${buttonClass}`}
                onClick={() => onOptionSelect(option.id)}
                disabled={isSubmitted}
                role="radio"
                aria-checked={isSelected}
                aria-label={`Option ${optionLabel}: ${option.text}`}
              >
                <span className="font-semibold mr-2.5 text-slate-500">{optionLabel}.</span>
                <span>{option.text}</span>
              </button>
            );
          })}
        </div>
      )}
      {question.type === 'written' && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
            <p className="text-slate-700 italic">This is a written response question. Consider your answer based on the prompt above.</p>
        </div>
      )}
    </div>
  );
};

export default QuestionDisplay;