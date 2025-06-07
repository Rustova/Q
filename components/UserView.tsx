
import React from 'react';
import type { Quiz, UserAnswer, Question as QuestionType, Option } from '../App.tsx'; 
import QuestionDisplay from './QuestionDisplay.tsx';

interface UserViewProps {
  quiz: Quiz;
  currentQuestionIndex: number;
  userAnswers: Array<UserAnswer | null>; 
  currentUserSelectionAttempt: string | null; 
  isQuizComplete: boolean;
  onOptionSelect: (optionId: string) => void;
  onSubmitAnswer: () => void;
  onNextQuestion: () => void;
  onPreviousQuestion: () => void; 
  onBackToQuizList: () => void;
  onRestartQuiz: () => void;
}

const UserView: React.FC<UserViewProps> = ({
  quiz,
  currentQuestionIndex,
  userAnswers,
  currentUserSelectionAttempt,
  isQuizComplete,
  onOptionSelect,
  onSubmitAnswer,
  onNextQuestion,
  onPreviousQuestion,
  onBackToQuizList,
  onRestartQuiz,
}) => {
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const currentQuestionAnswer = userAnswers[currentQuestionIndex];
  const isCurrentQuestionAnswered = currentQuestionAnswer !== null;
  const isMcq = currentQuestion?.type === 'mcq';

  const displaySelectedOptionId = isCurrentQuestionAnswered
    ? currentQuestionAnswer.selectedOptionId
    : currentUserSelectionAttempt;
  const displayFeedback = isCurrentQuestionAnswered ? currentQuestionAnswer.feedback : null;
  
  const progressPercent = quiz.questions.length > 0 
    ? ((currentQuestionIndex + 1) / quiz.questions.length) * 100 
    : 0;

  // --- Updated Navigation Logic ---
  const showPreviousIconButton = !isQuizComplete && currentQuestionIndex > 0;
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  
  // Visibility of the Next icon button (becomes Finish on last question)
  const showNextOrFinishIconButton = !isQuizComplete && currentQuestion;

  // Central Submit Button for MCQs
  const showCentralSubmitButton = !isQuizComplete && currentQuestion && isMcq && !isCurrentQuestionAnswered;
  const isCentralSubmitButtonDisabled = currentUserSelectionAttempt === null;

  // Next or Finish Icon Button disabled state: Disabled if an unsubmitted MCQ is showing
  const isNextOrFinishIconDisabled = showCentralSubmitButton;


  const handleNextIconClick = () => {
    if (isQuizComplete || !currentQuestion) return;
    // Submission is now handled by the central button for MCQs
    onNextQuestion();
  };
  
  const iconButtonBaseClass = "p-3 text-[var(--accent-primary)] transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] disabled:opacity-40 disabled:cursor-not-allowed";
  const centralSubmitButtonClass = "px-10 py-4 sm:px-12 sm:py-4 text-[var(--btn-primary-text)] bg-[var(--accent-primary)] transition-colors rounded-lg shadow-sm border border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] disabled:opacity-40 disabled:cursor-not-allowed";
  // --- End Updated Navigation Logic ---


  const getResults = () => {
    let correctMcqCount = 0;
    userAnswers.forEach((answer, index) => {
      if (answer && quiz.questions[index].type === 'mcq' && answer.feedback === 'Correct') {
        correctMcqCount++;
      }
    });
    return { correctMcqCount };
  };

  const renderResults = () => {
    return (
      <div className="py-6">
        <h3 className="text-2xl sm:text-3xl font-semibold text-[var(--accent-green)] text-center mb-6">
          Quiz Results for: "{quiz.name}"
        </h3>
        
        <div className="space-y-4 max-h-[calc(55vh+5rem)] sm:max-h-[calc(55vh+3rem)] overflow-y-auto pr-2 custom-scrollbar">
          {quiz.questions.map((q, index) => {
            const userAnswer = userAnswers[index];
            
            return (
              <div key={q.id} className="p-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md shadow-sm">
                <p className="text-md font-semibold text-[var(--text-primary)] mb-2 whitespace-pre-wrap">
                  {index + 1}. {q.questionText} <span className="text-xs text-[var(--accent-secondary)]">({q.type.toUpperCase()})</span>
                </p>
                {q.type === 'mcq' && userAnswer && q.options && (
                  <div className="text-sm space-y-2 mt-1">
                    <ul className="space-y-1.5">
                      {q.options.map((option, optionIndex) => {
                        const isUserSelected = userAnswer.selectedOptionId === option.id;
                        const isCorrect = q.correctOptionId === option.id;
                        const optionLetter = String.fromCharCode(65 + optionIndex);

                        let liClass = "p-2 rounded-md border flex items-center text-sm transition-all duration-150 ";
                        let icon = null;
                        let label = null;

                        if (isCorrect) { 
                          liClass += "bg-green-500 bg-opacity-20 border-green-600 text-green-300 font-medium ";
                          icon = <i className="fa-solid fa-check fa-fw mr-2 text-green-400"></i>;
                          label = <span className="ml-auto text-xs font-normal">(Correct answer)</span>;
                          if (isUserSelected) { 
                            liClass += "ring-2 ring-green-500 shadow-md "; 
                            icon = <i className="fa-solid fa-check fa-fw mr-2 text-green-300"></i>; 
                            label = <span className="ml-auto text-xs font-semibold">(Your correct choice)</span>;
                          }
                        } else if (isUserSelected) { 
                          liClass += "bg-red-500 bg-opacity-20 border-red-600 text-red-300 font-medium shadow-md ";
                          icon = <i className="fa-solid fa-times-circle fa-fw mr-2 text-red-400"></i>;
                          label = <span className="ml-auto text-xs font-semibold">(Your incorrect choice)</span>;
                        } else { 
                          liClass += "bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-secondary)] ";
                          icon = <i className="fa-regular fa-circle fa-fw mr-2 text-[var(--text-secondary)] opacity-70"></i>; 
                        }

                        return (
                          <li key={option.id} className={liClass}>
                            {icon}
                            <span className="font-semibold mr-1.5">{optionLetter}.</span>
                            <span className="flex-grow min-w-0 break-words">{option.text}</span>
                            {label}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                {q.type === 'written' && (
                  <p className="text-sm text-[var(--text-secondary)] italic mt-1">This is a written response question.</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            onClick={onRestartQuiz}
            className="px-6 py-2.5 font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 text-sm sm:text-base bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover-bg)] text-[var(--btn-primary-text)] focus:ring-[var(--btn-primary-focus-ring)] focus:ring-offset-[var(--bg-secondary)] w-full sm:w-auto"
          >
            Restart Quiz
          </button>
          <button
            onClick={onBackToQuizList}
            className="px-6 py-2.5 font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 text-sm sm:text-base bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover-bg)] text-[var(--btn-secondary-text)] focus:ring-[var(--btn-secondary-focus-ring)] focus:ring-offset-[var(--bg-secondary)] w-full sm:w-auto"
          >
            Back to Quiz List
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full p-4 sm:p-6">
      {!isQuizComplete && (
        <div className="flex items-center justify-between mb-6 sm:mb-8 pb-4 border-b border-[var(--border-color)]">
          <button
            onClick={onBackToQuizList}
            className="px-4 py-2 font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 text-xs sm:text-sm bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover-bg)] text-[var(--btn-secondary-text)] focus:ring-[var(--btn-secondary-focus-ring)] focus:ring-offset-[var(--bg-secondary)] shrink-0"
            aria-label="Back to quiz list"
          >
            &larr; Back to Quiz List
          </button>
          
          <h2 
            className="text-2xl sm:text-3xl font-semibold text-[var(--accent-primary)] truncate flex-grow text-center px-2"
            title={quiz.name}
          >
            {quiz.name}
          </h2>

          <div 
            className="px-4 py-2 font-semibold rounded-md text-xs sm:text-sm shrink-0 invisible"
            aria-hidden="true"
          >
            &larr; Back to Quiz List
          </div>
        </div>
      )}

      {quiz.questions.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-lg text-[var(--text-secondary)]">This quiz has no questions yet.</p>
        </div>
      ) : isQuizComplete ? (
        renderResults()
      ) : currentQuestion ? (
        <>
          <div className="mb-4 sm:mb-6">
            <div className="flex justify-between items-center text-sm text-[var(--text-secondary)] mb-1">
              <span>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
              {isMcq && displayFeedback && (
                   <span className={`font-semibold ${displayFeedback === 'Correct' ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
                      {displayFeedback}
                   </span>
              )}
            </div>
            <div className="bg-[var(--border-color)] rounded-full h-2.5 w-full" role="progressbar" aria-valuenow={currentQuestionIndex + 1} aria-valuemin={1} aria-valuemax={quiz.questions.length} aria-label="Quiz progress">
              <div
                className="bg-[var(--accent-primary)] h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
          <QuestionDisplay
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            selectedOptionId={displaySelectedOptionId}
            isSubmitted={isCurrentQuestionAnswered} 
            onOptionSelect={onOptionSelect}
            correctOptionIdForDisplay={isCurrentQuestionAnswered && isMcq ? currentQuestion.correctOptionId : undefined}
          />
          
          {/* Updated Navigation Bar */}
          {!isQuizComplete && currentQuestion && (
            <div className="mt-8 sm:mt-10 flex justify-between items-center">
              {/* Previous Button Area */}
              <div className="w-14 h-14 flex items-center justify-center">
                {showPreviousIconButton && (
                  <button
                    onClick={onPreviousQuestion}
                    className={iconButtonBaseClass}
                    aria-label="Previous Question"
                    title="Previous Question"
                  >
                    <i className="fa-solid fa-chevron-left fa-lg"></i>
                  </button>
                )}
              </div>

              {/* Central Submit Button Area (for MCQs) */}
              <div className="flex-grow flex justify-center items-center min-h-[3.5rem] sm:min-h-[4rem]"> {/* min-h to prevent layout shift */}
                {showCentralSubmitButton && (
                  <button
                    onClick={onSubmitAnswer}
                    disabled={isCentralSubmitButtonDisabled}
                    className={`${centralSubmitButtonClass} focus:ring-offset-[var(--bg-primary)]`}
                    aria-label="Submit Answer"
                    title="Submit Answer"
                  >
                    <i className="fa-solid fa-circle-check fa-xl"></i>
                  </button>
                )}
              </div>

              {/* Next / Finish Button Area */}
              <div className="w-14 h-14 flex items-center justify-center">
                {showNextOrFinishIconButton && (
                  <button
                    onClick={handleNextIconClick}
                    disabled={isNextOrFinishIconDisabled}
                    className={iconButtonBaseClass}
                    aria-label={isLastQuestion ? "Finish Quiz" : "Next Question"}
                    title={isLastQuestion ? "Finish Quiz" : "Next Question"}
                  >
                    <i className={`fa-solid ${isLastQuestion ? 'fa-flag-checkered' : 'fa-chevron-right'} fa-lg`}></i>
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
         <div className="text-center py-6">
            <p className="text-lg text-[var(--text-secondary)]">Loading question...</p>
         </div>
      )}
    </div>
  );
};

export default UserView;
