
import React, { useState, useEffect } from 'react';
import type { Quiz, UserAnswer, Question as QuestionType, Option, UserCorrectionMode, UserQuestionDisplayMode } from '../App.tsx'; 
import QuestionDisplay from './QuestionDisplay.tsx';

interface UserViewProps {
  quiz: Quiz;
  currentQuestionIndex: number; // Used for 'oneByOne' mode
  userAnswers: Array<UserAnswer | null>; 
  currentUserSelectionAttempt: string | null; // Used for 'oneByOne' mode
  isQuizComplete: boolean;
  onOptionSelect: (optionId: string) => void; // For 'oneByOne' mode
  onListedOptionSelect: (optionId: string, questionIndex: number) => void; // For 'listed' mode
  onSubmitAnswer: () => void; // For 'oneByOne' immediate mode
  onNextQuestion: () => void; // For 'oneByOne' navigation and finishing quiz (both modes)
  onPreviousQuestion: () => void; // For 'oneByOne' navigation
  onBackToQuizList: () => void;
  onRestartQuiz: () => void;
  userCorrectionMode: UserCorrectionMode;
  userQuestionDisplayMode: UserQuestionDisplayMode;
  onTogglePrefsModal: () => void;
}

const UserView: React.FC<UserViewProps> = ({
  quiz,
  currentQuestionIndex,
  userAnswers,
  currentUserSelectionAttempt,
  isQuizComplete,
  onOptionSelect,
  onListedOptionSelect,
  onSubmitAnswer,
  onNextQuestion,
  onPreviousQuestion,
  onBackToQuizList,
  onRestartQuiz,
  userCorrectionMode,
  userQuestionDisplayMode,
  onTogglePrefsModal,
}) => {
  const [animateSettingsIcon, setAnimateSettingsIcon] = useState(true);

  useEffect(() => {
    setAnimateSettingsIcon(true); // Trigger animation
    const timer = setTimeout(() => {
      setAnimateSettingsIcon(false); // Remove class after animation duration
    }, 1200); // Duration of the animation in ms

    return () => clearTimeout(timer); // Cleanup timer on unmount or if quiz.id changes
  }, [quiz.id]); // Re-trigger animation if the quiz itself changes


  // --- Logic for 'oneByOne' display mode ---
  const currentQuestionOneByOne = userQuestionDisplayMode === 'oneByOne' ? quiz.questions[currentQuestionIndex] : null;
  const currentQuestionAnswerObjectOneByOne = userQuestionDisplayMode === 'oneByOne' ? userAnswers[currentQuestionIndex] : null;
  const isMcqOneByOne = currentQuestionOneByOne?.type === 'mcq';

  const questionHasBeenAttemptedOneByOne = currentQuestionAnswerObjectOneByOne != null;
  const questionHasBeenGradedOneByOne = currentQuestionAnswerObjectOneByOne !== null && currentQuestionAnswerObjectOneByOne.feedback !== null;

  const questionDisplayIsSubmittedOneByOne: boolean = 
    userCorrectionMode === 'immediate' 
        ? questionHasBeenGradedOneByOne
        : isQuizComplete;

  const displaySelectedOptionIdOneByOne = questionHasBeenAttemptedOneByOne
    ? currentQuestionAnswerObjectOneByOne.selectedOptionId
    : currentUserSelectionAttempt;
  
  const feedbackTextForHeaderOneByOne = (userCorrectionMode === 'immediate' || isQuizComplete) && questionHasBeenGradedOneByOne 
    ? currentQuestionAnswerObjectOneByOne.feedback 
    : null;
  
  const progressPercent = quiz.questions.length > 0 && userQuestionDisplayMode === 'oneByOne'
    ? ((currentQuestionIndex + 1) / quiz.questions.length) * 100 
    : 0;

  const showPreviousIconButton = !isQuizComplete && currentQuestionIndex > 0 && userQuestionDisplayMode === 'oneByOne';
  const isLastQuestionInOneByOneMode = userQuestionDisplayMode === 'oneByOne' && currentQuestionIndex === quiz.questions.length - 1;
  
  const showNextOrFinishIconButtonOneByOne = !isQuizComplete && currentQuestionOneByOne && userQuestionDisplayMode === 'oneByOne';

  const showCentralSubmitButtonOneByOne = !isQuizComplete && 
                                  currentQuestionOneByOne && 
                                  isMcqOneByOne && 
                                  !questionHasBeenGradedOneByOne && 
                                  userCorrectionMode === 'immediate' &&
                                  userQuestionDisplayMode === 'oneByOne';

  const isCentralSubmitButtonDisabledOneByOne = currentUserSelectionAttempt === null;
  const isNextOrFinishIconDisabledOneByOne = userCorrectionMode === 'immediate' && showCentralSubmitButtonOneByOne;
  // --- End Logic for 'oneByOne' ---


  const handleNextIconClick = () => { // Used by both modes to finish, oneByOne for next
    if (isQuizComplete && userQuestionDisplayMode === 'oneByOne' && !currentQuestionOneByOne) return;
    onNextQuestion();
  };
  
  const iconButtonBaseClass = "p-3 text-[var(--accent-primary)] transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] disabled:opacity-40 disabled:cursor-not-allowed";
  const centralSubmitButtonClass = "px-10 py-4 sm:px-12 sm:py-4 text-[var(--btn-primary-text)] bg-[var(--accent-primary)] transition-colors rounded-lg shadow-sm border border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] disabled:opacity-40 disabled:cursor-not-allowed";
  const finishQuizButtonListedModeClass = "w-full sm:w-auto mt-8 px-8 py-3 text-lg font-semibold text-[var(--btn-primary-text)] bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] transition-colors rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]";


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
                {q.type === 'mcq' && q.options && (
                  <div className="text-sm space-y-2 mt-1">
                    {!userAnswer?.selectedOptionId && q.type === 'mcq' && ( 
                       <p className="text-sm text-[var(--accent-amber)] italic mb-1.5">You did not answer this question.</p>
                    )}
                    <ul className="space-y-1.5">
                      {q.options.map((option, optionIndex) => {
                        const isUserSelected = userAnswer ? userAnswer.selectedOptionId === option.id : false;
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
                  (userAnswer?.feedback === 'Seen' || (isQuizComplete && !userAnswer))
                  ? <p className="text-sm text-[var(--text-secondary)] italic mt-1">You viewed this written response question.</p>
                  : <p className="text-sm text-[var(--text-secondary)] italic mt-1">This is a written response question.</p> 
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
          {!isQuizComplete && (
             <button 
                onClick={onTogglePrefsModal} 
                className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] focus:outline-none p-1 rounded-full mx-2"
                aria-label="Quiz Preferences"
                title="Quiz Preferences"
              >
               <i className={`fa-solid fa-gear text-base ${animateSettingsIcon ? 'animate-settings-init' : ''}`}></i>
             </button>
          )}
        </div>
      )}

      {quiz.questions.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-lg text-[var(--text-secondary)]">This quiz has no questions yet.</p>
        </div>
      ) : isQuizComplete ? (
        renderResults()
      ) : userQuestionDisplayMode === 'oneByOne' && currentQuestionOneByOne ? ( // One By One Display Mode
        <>
          <div className="mb-4 sm:mb-6">
            <div className="flex justify-between items-center text-sm text-[var(--text-secondary)] mb-1">
              <span className="flex-1">Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
              {/* Preferences button moved to header row */}
              {isMcqOneByOne && feedbackTextForHeaderOneByOne && ( 
                   <span className={`font-semibold flex-1 text-right ${feedbackTextForHeaderOneByOne === 'Correct' ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
                      {feedbackTextForHeaderOneByOne}
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
            question={currentQuestionOneByOne}
            questionNumber={currentQuestionIndex + 1}
            selectedOptionId={displaySelectedOptionIdOneByOne}
            isSubmitted={questionDisplayIsSubmittedOneByOne} 
            onOptionSelect={onOptionSelect} // Uses the general onOptionSelect for oneByOne
            correctOptionIdForDisplay={feedbackTextForHeaderOneByOne && isMcqOneByOne ? currentQuestionOneByOne.correctOptionId : undefined}
          />
          
          <div className="mt-8 sm:mt-10 flex justify-between items-center">
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

            <div className="flex-grow flex justify-center items-center min-h-[3.5rem] sm:min-h-[4rem]">
              {showCentralSubmitButtonOneByOne && (
                <button
                  onClick={onSubmitAnswer}
                  disabled={isCentralSubmitButtonDisabledOneByOne}
                  className={`${centralSubmitButtonClass} focus:ring-offset-[var(--bg-primary)]`}
                  aria-label="Submit Answer"
                  title="Submit Answer"
                >
                  <i className="fa-solid fa-circle-check fa-xl"></i>
                </button>
              )}
            </div>

            <div className="w-14 h-14 flex items-center justify-center">
              {showNextOrFinishIconButtonOneByOne && (
                <button
                  onClick={handleNextIconClick}
                  disabled={isNextOrFinishIconDisabledOneByOne}
                  className={iconButtonBaseClass}
                  aria-label={isLastQuestionInOneByOneMode ? "Finish Quiz" : "Next Question"}
                  title={isLastQuestionInOneByOneMode ? "Finish Quiz" : "Next Question"}
                >
                  <i className={`fa-solid ${isLastQuestionInOneByOneMode ? 'fa-flag-checkered' : 'fa-chevron-right'} fa-lg`}></i>
                </button>
              )}
            </div>
          </div>
        </>
      ) : userQuestionDisplayMode === 'listed' ? ( // Listed Display Mode
        <div className="space-y-8">
            {quiz.questions.map((question, index) => {
                const answerObject = userAnswers[index];
                const hasBeenAttempted = answerObject != null;
                const hasBeenGraded = answerObject !== null && answerObject.feedback !== null;
                const displayIsSubmitted = userCorrectionMode === 'immediate' ? hasBeenGraded : isQuizComplete;
                const selectedOptId = hasBeenAttempted ? answerObject.selectedOptionId : null;
                const correctOptId = (userCorrectionMode === 'immediate' || isQuizComplete) && hasBeenGraded && question.type === 'mcq'
                                     ? question.correctOptionId
                                     : undefined;

                return (
                    <div key={question.id} className="py-4 border-b border-[var(--border-color)] last:border-b-0">
                        <QuestionDisplay
                            question={question}
                            questionNumber={index + 1}
                            selectedOptionId={selectedOptId}
                            isSubmitted={displayIsSubmitted}
                            onOptionSelect={(optionId) => onListedOptionSelect(optionId, index)}
                            correctOptionIdForDisplay={correctOptId}
                        />
                    </div>
                );
            })}
            <div className="flex justify-center">
                <button
                    onClick={handleNextIconClick} // Re-use handleNextIconClick which handles quiz completion
                    className={finishQuizButtonListedModeClass}
                    aria-label="Finish Quiz"
                    title="Finish Quiz"
                >
                    <i className="fa-solid fa-flag-checkered fa-lg mr-2"></i>
                    Finish Quiz
                </button>
            </div>
        </div>
      ) : (
         <div className="text-center py-6">
            <p className="text-lg text-[var(--text-secondary)]">Loading questions...</p>
         </div>
      )}
    </div>
  );
};

export default UserView;