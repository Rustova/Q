
import React from 'react';
import { createPortal } from 'react-dom';
import type { Question } from '../App.tsx';
import QuestionForm from './QuestionForm.tsx';

interface EditQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId: string;
  quizId: string;
  quizName: string;
  existingQuestion: Question; // Should always be a Question when modal is open
  onSaveQuestion: (subjectId: string, quizId: string, questionData: Question) => void;
  maxOptions: number;
}

const EditQuestionModal: React.FC<EditQuestionModalProps> = ({
  isOpen,
  onClose,
  subjectId,
  quizId,
  quizName,
  existingQuestion,
  onSaveQuestion,
  maxOptions,
}) => {
  if (!isOpen) {
    return null;
  }

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) {
    console.error("Modal root element 'modal-root' not found.");
    return null;
  }

  const handleSaveAndClose = (sId: string, qId: string, questionData: Question) => {
    onSaveQuestion(sId, qId, questionData);
    // onClose will be called by AdminView via setEditingQuestion(null) which triggers modal close
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-question-modal-title"
      onClick={onClose} // Close on overlay click
    >
      <div
        className="bg-[var(--bg-secondary)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-[var(--border-color)]"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <header className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] rounded-t-xl">
          <h2 id="edit-question-modal-title" className="text-lg sm:text-xl font-semibold text-[var(--accent-primary)]">
            Edit Question in: "{quizName}"
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-[var(--accent-red)] hover:text-[var(--accent-red-hover)] hover:bg-[var(--accent-red)] hover:bg-opacity-10 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-red)]"
            aria-label="Close edit question modal"
          >
            <i className="fa-solid fa-xmark fa-lg"></i>
          </button>
        </header>

        <div className="p-1 overflow-y-auto flex-grow custom-scrollbar"> 
          {/* QuestionForm is already wrapped in sectionBaseClass, so no need for extra padding here unless desired */}
          {/* Key ensures form re-initializes if a different question is edited while modal somehow stays open (though it shouldn't) */}
          <QuestionForm
            key={existingQuestion.id} 
            subjectId={subjectId}
            quizId={quizId}
            quizName={quizName} // Passed for consistency, though modal has title
            existingQuestion={existingQuestion}
            onSaveQuestion={handleSaveAndClose}
            maxOptions={maxOptions}
          />
        </div>
      </div>
    </div>,
    modalRoot
  );
};

export default EditQuestionModal;