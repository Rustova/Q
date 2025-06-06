import React from 'react';
import type { Subject } from '../App.tsx';

interface SubjectSelectionViewProps {
  subjects: Subject[];
  onSelectSubject: (subjectId: string) => void;
}

const SubjectSelectionView: React.FC<SubjectSelectionViewProps> = ({ subjects, onSelectSubject }) => {
  return (
    <section className="bg-white p-4 sm:p-6 rounded-lg shadow-xl border border-slate-200">
      <h2 className="text-2xl sm:text-3xl font-semibold text-blue-600 text-center mb-6 sm:mb-8 pb-4 border-b border-slate-200">
        Select subject
      </h2>
      {subjects.length === 0 ? (
        <p className="text-lg text-slate-600 text-center py-6">
          No subjects available yet. Please check back later or ask an admin to create some!
        </p>
      ) : (
        <div className="space-y-3">
          {subjects.map(subject => {
            const availableQuizzesCount = subject.quizzes.filter(q => q.isStartable).length;
            return (
              <button
                key={subject.id}
                onClick={() => onSelectSubject(subject.id)}
                className="w-full text-left p-4 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-lg text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={`Select subject: ${subject.name}, ${availableQuizzesCount} quiz${availableQuizzesCount !== 1 ? 'zes' : ''} available`}
              >
                <span className="text-lg font-semibold text-blue-600">{subject.name}</span>
                <span className="block text-sm text-slate-500 mt-1">
                  {availableQuizzesCount} quiz{availableQuizzesCount !== 1 ? 'zes' : ''} available
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default SubjectSelectionView;