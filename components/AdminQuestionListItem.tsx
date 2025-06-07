


import React from 'react';
import type { Question } from '../App.tsx';

interface AdminQuestionListItemProps {
  question: Question;
  questionNumber: number;
  onEdit: () => void;
  onDelete: () => void;
}

const AdminQuestionListItem: React.FC<AdminQuestionListItemProps> = ({
  question,
  questionNumber,
  onEdit,
  onDelete,
}) => {
  let detailsText = '';
  if (question.type === 'written') {
    detailsText = 'Type: Written';
  } else { // MCQ
    const correctOptionText = question.options?.find(opt => opt.id === question.correctOptionId)?.text || 'N/A';
    detailsText = `${question.options?.length || 0} options, Correct: ${correctOptionText.substring(0,25)}${correctOptionText.length > 25 ? '...' : ''}`;
  }

  const itemStyle: React.CSSProperties = {
    userSelect: 'none', 
    transition: 'background-color 0.2s ease, border-color 0.2s ease', // Added border-color transition
  };

  return (
    <li
      className={`flex items-center justify-between p-3 bg-[var(--bg-primary)] rounded-md border border-[var(--border-color)] hover:bg-[var(--accent-secondary)] hover:bg-opacity-20 hover:border-[var(--accent-secondary)] shadow-sm`}
      style={itemStyle}
    >
      <div className="flex-1 min-w-0 mr-2">
        <p className="text-sm text-[var(--text-primary)] truncate" title={question.questionText}>
          <span className="font-semibold">{questionNumber}.</span> {question.questionText} 
          <span className="text-xs text-[var(--text-secondary)] ml-1">({question.type === 'written' ? 'Written' : 'MCQ'})</span>
        </p>
        <p className="text-xs text-[var(--text-secondary)]">
          {detailsText}
        </p>
      </div>
      <div className="flex space-x-2 ml-2 shrink-0">
        <button
          onClick={onEdit}
          className="edit-question-button px-3 py-1 text-xs bg-[var(--accent-amber)] hover:bg-[var(--accent-amber-hover)] text-[var(--btn-amber-text)] rounded-md transition-colors"
          aria-label={`Edit question: ${question.questionText.substring(0,30)}...`}
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="delete-question-button px-3 py-1 text-xs bg-[var(--accent-red)] hover:bg-[var(--accent-red-hover)] text-white rounded-md transition-colors flex items-center space-x-1"
          aria-label={`Delete question: ${question.questionText.substring(0,30)}...`}
        >
          <i className="fa-solid fa-trash fa-fw"></i>
          <span>Delete</span>
        </button>
      </div>
    </li>
  );
};

export default AdminQuestionListItem;