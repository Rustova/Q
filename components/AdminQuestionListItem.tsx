import React from 'react';
import type { Question } from '../App.tsx';
// import HoldToDeleteButton from './HoldToDeleteButton.tsx'; // No longer needed for this specific component

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


  return (
    <li className="flex items-center justify-between p-3 bg-white rounded-md border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700 truncate" title={question.questionText}>
          <span className="font-semibold">{questionNumber}.</span> {question.questionText} 
          <span className="text-xs text-blue-500 ml-1">({question.type === 'written' ? 'Written' : 'MCQ'})</span>
        </p>
        <p className="text-xs text-slate-500">
          {detailsText}
        </p>
      </div>
      <div className="flex space-x-2 ml-2 shrink-0">
        <button
          onClick={onEdit}
          className="edit-question-button px-3 py-1 text-xs bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors"
          aria-label={`Edit question: ${question.questionText.substring(0,30)}...`}
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="delete-question-button px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors flex items-center space-x-1"
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