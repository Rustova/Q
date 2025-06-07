
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
    <div className="w-full p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 pb-4 border-b border-[var(--border-color)]">
        <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--accent-primary)] truncate mb-2 sm:mb-0" title={`Quizzes in ${subject.name}`}>
          Quizzes in {subject.name}
        </h2>
        <button
          onClick={onBackToSubjectList}
          className="px-4 py-2 bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover-bg)] text-[var(--btn-secondary-text)] rounded-md transition-colors text-sm sm:text-base w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-[var(--btn-secondary-focus-ring)] focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)]"
          aria-label="Back to subject list"
        >
          &larr; Back to Subject List
        </button>
      </div>

      {subject.quizzes.length === 0 ? (
        <p className="text-lg text-[var(--text-secondary)] text-center py-6">No quizzes created yet for this subject.</p>
      ) : startableQuizzes.length === 0 ? (
        <p className="text-lg text-[var(--text-secondary)] text-center py-6">No quizzes are currently available for users in this subject. Please check back later.</p>
      ) : (
        <div className="space-y-3">
          {startableQuizzes.map(quiz => (
            <button
              key={quiz.id}
              onClick={() => onSelectQuiz(quiz.id)}
              className="quiz-select-button w-full text-left p-4 bg-[var(--bg-primary)] hover:bg-[var(--accent-secondary)] hover:bg-opacity-30 border border-[var(--border-color)] hover:border-[var(--accent-secondary)] rounded-lg text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)]"
              aria-label={`Select quiz: ${quiz.name}, ${quiz.questions.length} question${quiz.questions.length !== 1 ? 's' : ''}`}
            >
              <span className="text-lg font-semibold text-[var(--accent-primary)]">{quiz.name}</span>
              <span className="block text-sm text-[var(--text-secondary)] mt-1">
                {quiz.questions.length} question{quiz.questions.length !== 1 ? 's' : ''}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizSelectionView;