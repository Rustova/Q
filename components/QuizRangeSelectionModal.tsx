
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

export interface DisplayQuiz {
  id: string;
  name: string;
  subjectName: string;
  subjectId: string;
}

interface QuizMultiSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  allQuizzes: DisplayQuiz[]; 
  initiallySelectedQuizIds: string[];
  onApplySelection: (selectedIds: string[]) => void;
}

const QuizMultiSelectModal: React.FC<QuizMultiSelectModalProps> = ({
  isOpen,
  onClose,
  allQuizzes,
  initiallySelectedQuizIds,
  onApplySelection,
}) => {
  const [locallySelectedQuizIds, setLocallySelectedQuizIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setLocallySelectedQuizIds([...initiallySelectedQuizIds]);
    }
  }, [isOpen, initiallySelectedQuizIds]);

  const quizzesBySubject = useMemo(() => {
    return allQuizzes.reduce((acc, quiz) => {
        const subjectKey = quiz.subjectId;
        if (!acc[subjectKey]) {
            acc[subjectKey] = { subjectName: quiz.subjectName, quizzes: [] };
        }
        acc[subjectKey].quizzes.push(quiz);
        return acc;
    }, {} as Record<string, { subjectName: string, quizzes: DisplayQuiz[] }>);
  }, [allQuizzes]);


  if (!isOpen) {
    return null;
  }

  const handleQuizToggle = (quizId: string) => {
    setLocallySelectedQuizIds(prev =>
      prev.includes(quizId) ? prev.filter(id => id !== quizId) : [...prev, quizId]
    );
  };

  const handleSelectAllVisible = () => {
    const allVisibleQuizIds = allQuizzes.map(q => q.id);
    setLocallySelectedQuizIds(allVisibleQuizIds);
  };

  const handleDeselectAllVisible = () => {
    setLocallySelectedQuizIds([]);
  };

  const handleApply = () => {
    onApplySelection(locallySelectedQuizIds);
  };
  
  const getSelectionInfoText = () => {
    if (locallySelectedQuizIds.length === 0) return "No quizzes selected. All quizzes from chosen subjects will be included if applied now.";
    if (locallySelectedQuizIds.length === allQuizzes.length && allQuizzes.length > 0) return `All ${allQuizzes.length} available quizzes selected.`;
    return `${locallySelectedQuizIds.length} of ${allQuizzes.length} available quizzes selected.`;
  };

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) {
    console.error("Modal root element 'modal-root' not found for QuizMultiSelectModal.");
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[51] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-multiselect-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg-secondary)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-[var(--border-color)]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] rounded-t-xl shrink-0">
          <h2 id="quiz-multiselect-modal-title" className="text-lg sm:text-xl font-semibold text-[var(--accent-primary)]">
            Select Quizzes for Export
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-[var(--accent-red)] hover:text-[var(--accent-red-hover)] hover:bg-[var(--accent-red)] hover:bg-opacity-10 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-red)]"
            aria-label="Close quiz selection modal"
          >
            <i className="fa-solid fa-xmark fa-lg"></i>
          </button>
        </header>

        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-grow">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
            <p className="text-sm text-[var(--text-secondary)] p-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md flex-grow">
                {getSelectionInfoText()}
            </p>
            <div className="flex space-x-2 shrink-0">
                 <button 
                    onClick={handleSelectAllVisible} 
                    disabled={allQuizzes.length === 0}
                    className="px-3 py-1.5 text-xs bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover-bg)] text-[var(--btn-secondary-text)] rounded-md transition-colors disabled:opacity-50"
                >
                    Select All
                </button>
                <button 
                    onClick={handleDeselectAllVisible} 
                    disabled={allQuizzes.length === 0 || locallySelectedQuizIds.length === 0}
                    className="px-3 py-1.5 text-xs bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover-bg)] text-[var(--btn-secondary-text)] rounded-md transition-colors disabled:opacity-50"
                >
                    Deselect All
                </button>
            </div>
          </div>
          
          {allQuizzes.length === 0 ? (
            <p className="text-center text-[var(--text-secondary)] py-4">No quizzes available from selected subjects to choose from.</p>
          ) : (
            <div className="space-y-3 max-h-[calc(85vh-260px)] overflow-y-auto custom-scrollbar pr-2">
              {Object.entries(quizzesBySubject).map(([subjectId, { subjectName, quizzes }]) => (
                <div key={subjectId} className="py-1">
                  <h3 className="text-md font-semibold text-[var(--accent-primary)] mb-1.5 pb-1 border-b border-[var(--border-color)]">
                    {subjectName}
                  </h3>
                  <div className="space-y-1.5">
                    {quizzes.map((quiz) => {
                      const isSelected = locallySelectedQuizIds.includes(quiz.id);
                      return (
                        <label
                          key={quiz.id}
                          className={`flex items-center space-x-3 p-2.5 rounded-md transition-all duration-150 text-sm border cursor-pointer 
                            ${isSelected 
                                ? 'bg-[var(--accent-primary)] bg-opacity-25 border-[var(--accent-primary)] text-[var(--text-primary)] font-medium' 
                                : 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--accent-secondary)] hover:bg-opacity-10 hover:border-[var(--accent-secondary)]'}`}
                          title={`${quiz.subjectName} - ${quiz.name}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleQuizToggle(quiz.id)}
                            className="h-4 w-4 text-[var(--accent-primary)] bg-transparent border-[var(--input-border)] rounded focus:ring-1 focus:ring-offset-0 focus:ring-[var(--accent-primary)] shrink-0"
                          />
                          <span className="truncate flex-grow text-left">
                            {quiz.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <footer className="p-4 sm:p-5 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] rounded-b-xl flex justify-between items-center shrink-0">
          <button
            onClick={handleDeselectAllVisible} // Changed "Clear Selection" to deselect all in this modal
            className="px-4 py-2 text-sm font-medium bg-transparent hover:bg-[var(--accent-red)] hover:bg-opacity-20 text-[var(--accent-red)] border border-[var(--accent-red)] rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-red)]"
          >
            Clear Current Selection
          </button>
          <div className="space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover-bg)] text-[var(--btn-secondary-text)] rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--btn-secondary-focus-ring)]"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={allQuizzes.length === 0 && locallySelectedQuizIds.length === 0} // Allow applying empty selection
              className="px-4 py-2 text-sm font-medium bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover-bg)] text-[var(--btn-primary-text)] rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--btn-primary-focus-ring)] disabled:opacity-50"
            >
              Apply Selection
            </button>
          </div>
        </footer>
      </div>
    </div>,
    modalRoot
  );
};

export default QuizMultiSelectModal;
