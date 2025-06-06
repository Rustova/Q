import React from 'react';
import type { Quiz, Question as QuestionType } from '../App.tsx';
import QuestionDisplay from './QuestionDisplay.tsx';

interface UserViewProps {
  quiz: Quiz;
  currentQuestionIndex: number;
  selectedOptionId: string | null;
  feedback: string | null; // 'Correct' | 'Incorrect'
  isSubmitted: boolean;
  isQuizComplete: boolean;
  onOptionSelect: (optionId: string) => void;
  onSubmitAnswer: () => void;
  onNextQuestion: () => void;
  onBackToQuizList: () => void;
}

const UserView: React.FC<UserViewProps> = ({
  quiz,
  currentQuestionIndex,
  selectedOptionId,
  feedback,
  isSubmitted,
  isQuizComplete,
  onOptionSelect,
  onSubmitAnswer,
  onNextQuestion,
  onBackToQuizList,
}) => {
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isWrittenQuestion = currentQuestion?.type === 'written';

  return (
    <section className="bg-white p-4 sm:p-6 rounded-lg shadow-xl border border-slate-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 pb-4 border-b border-slate-200">
        <h2 className="text-2xl sm:text-3xl font-semibold text-blue-600 truncate mb-2 sm:mb-0" title={quiz.name}>
          {quiz.name}
        </h2>
        <button
          onClick={onBackToQuizList}
          className="px-6 py-2.5 font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 text-sm sm:text-base bg-slate-200 hover:bg-slate-300 text-slate-700 focus:ring-slate-400 w-full sm:w-auto"
          aria-label="Back to quiz list"
        >
          &larr; Back to Quiz List
        </button>
      </div>

      {quiz.questions.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-lg text-slate-600">This quiz has no questions yet.</p>
        </div>
      ) : isQuizComplete ? (
        <div className="text-center py-6">
          <p className="text-2xl font-semibold text-green-600">Quiz Complete!</p>
          <p className="text-slate-600 mt-2">You've answered all available questions for "{quiz.name}".</p>
        </div>
      ) : currentQuestion ? (
        <>
          <QuestionDisplay
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            selectedOptionId={selectedOptionId}
            isSubmitted={isSubmitted}
            onOptionSelect={onOptionSelect}
          />
          {isSubmitted && feedback && !isWrittenQuestion && (
            <p className={`mt-4 sm:mt-6 text-lg font-semibold text-center ${feedback === 'Correct' ? 'text-green-600' : 'text-red-600'}`}>
              {feedback}!
            </p>
          )}
          <div className="mt-6 sm:mt-8 text-center">
            {!isSubmitted && selectedOptionId && !isWrittenQuestion && (
              <button
                onClick={onSubmitAnswer}
                className="px-6 py-2.5 font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 text-sm sm:text-base bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500"
              >
                Submit Answer
              </button>
            )}
            {(isSubmitted || isWrittenQuestion) && (
              <button
                onClick={onNextQuestion}
                className="px-6 py-2.5 font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 text-sm sm:text-base bg-green-500 hover:bg-green-600 text-white focus:ring-green-500"
              >
                {currentQuestionIndex < quiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
              </button>
            )}
          </div>
        </>
      ) : (
         <div className="text-center py-6">
            <p className="text-lg text-slate-600">Loading question...</p>
         </div>
      )}
    </section>
  );
};

export default UserView;