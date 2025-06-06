import React from 'react';
import type { Subject, Quiz } from '../App.tsx';

interface QuizSelectionViewProps {
  subject: Subject;
  onSelectQuiz: (quizId: string) => void;
  onBackToSubjectList: () => void;
}

const QuizSelectionView: React.FC<QuizSelectionViewProps> = ({ subject, onSelectQuiz, onBackToSubjectList }) => {
  const startableQuizzes = subject.quizzes.filter(quiz => quiz.isStartable);

  return (
    <section className="bg-white p-4 sm:p-6 rounded-lg shadow-xl border border-slate-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 pb-4 border-b border-slate-200">
        <h2 className="text-2xl sm:text-3xl font-semibold text-blue-600 truncate mb-2 sm:mb-0" title={`Quizzes in ${subject.name}`}>
          Quizzes in {subject.name}
        </h2>
        <button
          onClick={onBackToSubjectList}
          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md transition-colors text-sm sm:text-base w-full sm:w-auto"
          aria-label="Back to subject list"
        >
          &larr; Back to Subject List
        </button>
      </div>

      {subject.quizzes.length === 0 ? (
        <p className="text-lg text-slate-600 text-center py-6">No quizzes created yet for this subject.</p>
      ) : startableQuizzes.length === 0 ? (
        <p className="text-lg text-slate-600 text-center py-6">No quizzes are currently available for users in this subject. Please check back later.</p>
      ) : (
        <div className="space-y-3">
          {startableQuizzes.map(quiz => (
            <button
              key={quiz.id}
              onClick={() => onSelectQuiz(quiz.id)}
              className="quiz-select-button w-full text-left p-4 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-lg text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={`Select quiz: ${quiz.name}, ${quiz.questions.length} question${quiz.questions.length !== 1 ? 's' : ''}`}
            >
              <span className="text-lg font-semibold text-blue-600">{quiz.name}</span>
              <span className="block text-sm text-slate-500 mt-1">
                {quiz.questions.length} question{quiz.questions.length !== 1 ? 's' : ''}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

export default QuizSelectionView;