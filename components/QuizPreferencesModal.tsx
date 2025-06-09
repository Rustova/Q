
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { UserCorrectionMode, UserQuestionDisplayMode } from '../App.tsx';

interface QuizPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCorrectionMode: UserCorrectionMode;
  onSetCorrectionMode: (mode: UserCorrectionMode) => void;
  currentQuestionDisplayMode: UserQuestionDisplayMode;
  onSetQuestionDisplayMode: (mode: UserQuestionDisplayMode) => void;
}

const QuizPreferencesModal: React.FC<QuizPreferencesModalProps> = ({
  isOpen,
  onClose,
  currentCorrectionMode,
  onSetCorrectionMode,
  currentQuestionDisplayMode,
  onSetQuestionDisplayMode,
}) => {
  const [modalSelectedCorrectionMode, setModalSelectedCorrectionMode] = useState<UserCorrectionMode>(currentCorrectionMode);
  const [modalSelectedQuestionDisplayMode, setModalSelectedQuestionDisplayMode] = useState<UserQuestionDisplayMode>(currentQuestionDisplayMode);

  useEffect(() => {
    if (isOpen) {
      setModalSelectedCorrectionMode(currentCorrectionMode); 
      setModalSelectedQuestionDisplayMode(currentQuestionDisplayMode);
    }
  }, [isOpen, currentCorrectionMode, currentQuestionDisplayMode]);

  if (!isOpen) {
    return null;
  }

  const handleCorrectionModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setModalSelectedCorrectionMode(event.target.value as UserCorrectionMode);
  };

  const handleQuestionDisplayModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setModalSelectedQuestionDisplayMode(event.target.value as UserQuestionDisplayMode);
  };

  const handleSave = () => {
    onSetCorrectionMode(modalSelectedCorrectionMode);
    onSetQuestionDisplayMode(modalSelectedQuestionDisplayMode);
    // onClose(); // App.tsx's onSetQuestionDisplayMode now closes the modal
  };
  

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) {
    console.error("Modal root element 'modal-root' not found for QuizPreferencesModal.");
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-prefs-modal-title"
      onClick={onClose} 
    >
      <div
        className="bg-[var(--bg-secondary)] p-6 md:p-8 rounded-lg shadow-xl w-full max-w-lg border border-[var(--border-color)] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()} 
      >
        <header className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--border-color)] shrink-0">
            <h2 id="quiz-prefs-modal-title" className="text-xl font-semibold text-[var(--accent-primary)]">
                إعدادات الاختبار (Quiz Preferences)
            </h2>
            <button
                onClick={onClose}
                className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--accent-red)] hover:bg-[var(--accent-red)] hover:bg-opacity-10 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-red)]"
                aria-label="Close preferences modal"
            >
                <i className="fa-solid fa-xmark fa-lg"></i>
            </button>
        </header>
        
        <div className="space-y-6 mb-6 overflow-y-auto custom-scrollbar pr-1 flex-grow">
          <div>
            <h3 className="text-md font-semibold text-[var(--text-primary)] mb-2">نمط التصحيح (Correction Mode)</h3>
            <p className="text-xs text-[var(--text-secondary)] mb-2">Choose how you want quiz answers to be graded:</p>
            <div className="space-y-2">
                <label className="flex items-center space-x-3 p-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md cursor-pointer hover:border-[var(--accent-primary)] has-[:checked]:border-[var(--accent-primary)] has-[:checked]:ring-1 has-[:checked]:ring-[var(--accent-primary)] transition-all">
                    <input
                    type="radio"
                    name="correctionMode"
                    value="immediate"
                    checked={modalSelectedCorrectionMode === 'immediate'}
                    onChange={handleCorrectionModeChange} 
                    className="form-radio h-4 w-4 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] bg-[var(--input-bg)] border-[var(--input-border)]"
                    />
                    <span className="text-[var(--text-primary)] text-sm">نمط المذاكرة : تصحيح السؤال اول باول</span>
                </label>

                <label className="flex items-center space-x-3 p-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md cursor-pointer hover:border-[var(--accent-primary)] has-[:checked]:border-[var(--accent-primary)] has-[:checked]:ring-1 has-[:checked]:ring-[var(--accent-primary)] transition-all">
                    <input
                    type="radio"
                    name="correctionMode"
                    value="atEnd"
                    checked={modalSelectedCorrectionMode === 'atEnd'}
                    onChange={handleCorrectionModeChange}
                    className="form-radio h-4 w-4 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] bg-[var(--input-bg)] border-[var(--input-border)]"
                    />
                    <span className="text-[var(--text-primary)] text-sm">نمط المراجعة : تصحيح الكويز عند التسليم</span>
                </label>
            </div>
          </div>

          <div>
            <h3 className="text-md font-semibold text-[var(--text-primary)] mb-2">نمط عرض الأسئلة (Question Display Mode)</h3>
            <p className="text-xs text-[var(--text-secondary)] mb-2">Choose how questions are presented during the quiz:</p>
            <div className="space-y-2">
                <label className="flex items-center space-x-3 p-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md cursor-pointer hover:border-[var(--accent-primary)] has-[:checked]:border-[var(--accent-primary)] has-[:checked]:ring-1 has-[:checked]:ring-[var(--accent-primary)] transition-all">
                    <input
                    type="radio"
                    name="questionDisplayMode"
                    value="oneByOne"
                    checked={modalSelectedQuestionDisplayMode === 'oneByOne'}
                    onChange={handleQuestionDisplayModeChange}
                    className="form-radio h-4 w-4 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] bg-[var(--input-bg)] border-[var(--input-border)]"
                    />
                    <span className="text-[var(--text-primary)] text-sm">نمط السؤال الواحد: عرض الأسئلة سؤالًا تلو الآخر</span>
                </label>

                <label className="flex items-center space-x-3 p-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md cursor-pointer hover:border-[var(--accent-primary)] has-[:checked]:border-[var(--accent-primary)] has-[:checked]:ring-1 has-[:checked]:ring-[var(--accent-primary)] transition-all">
                    <input
                    type="radio"
                    name="questionDisplayMode"
                    value="listed"
                    checked={modalSelectedQuestionDisplayMode === 'listed'}
                    onChange={handleQuestionDisplayModeChange}
                    className="form-radio h-4 w-4 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] bg-[var(--input-bg)] border-[var(--input-border)]"
                    />
                    <span className="text-[var(--text-primary)] text-sm">نمط القائمة: عرض جميع أسئلة الاختبار في قائمة واحدة</span>
                </label>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-[var(--border-color)] flex flex-col sm:flex-row-reverse gap-3 shrink-0">
          <button
            type="button"
            onClick={handleSave}
            className="w-full sm:w-auto px-6 py-2.5 bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover-bg)] text-[var(--btn-primary-text)] font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--btn-primary-focus-ring)] focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)]"
          >
            Save Preferences
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover-bg)] text-[var(--btn-secondary-text)] font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--btn-secondary-focus-ring)] focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    modalRoot
  );
};

export default QuizPreferencesModal;
