

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import type { Question } from '../App.tsx';

interface ReorderQuestionsModalProps {
  isOpen: boolean;
  quizName: string;
  initialQuestions: Question[];
  onConfirmReorder: (reorderedQuestions: Question[]) => void;
  onClose: () => void;
}

const ReorderQuestionsModal: React.FC<ReorderQuestionsModalProps> = ({
  isOpen,
  quizName,
  initialQuestions,
  onConfirmReorder,
  onClose,
}) => {
  const [orderedQuestions, setOrderedQuestions] = useState<Question[]>([]);

  useEffect(() => {
    setOrderedQuestions([...initialQuestions]);
  }, [initialQuestions, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);


  if (!isOpen) {
    return null;
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return; 
    }

    const items = Array.from(orderedQuestions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setOrderedQuestions(items);
  };

  const handleSave = () => {
    onConfirmReorder(orderedQuestions);
  };

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) {
    console.error("Modal root element 'modal-root' not found.");
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-[51] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reorder-questions-modal-title"
      onClick={onClose} 
    >
      <div
        className="bg-[var(--bg-secondary)] rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-[var(--border-color)]"
        onClick={(e) => e.stopPropagation()} 
      >
        <header className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] rounded-t-xl">
          <h2 id="reorder-questions-modal-title" className="text-lg sm:text-xl font-semibold text-[var(--accent-primary)] truncate min-w-0 mr-2" title={`Reorder Questions for: "${quizName}"`}>
            Reorder Questions for: "<span className="truncate">{quizName}</span>"
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-[var(--accent-red)] hover:text-[var(--accent-red-hover)] hover:bg-[var(--accent-red)] hover:bg-opacity-10 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-red)]"
            aria-label="Close reorder questions modal"
          >
            <i className="fa-solid fa-xmark fa-xl"></i>
          </button>
        </header>

        <div className="p-4 sm:p-6 overflow-y-auto flex-grow custom-scrollbar">
          <p className="text-sm text-[var(--text-secondary)] mb-4">Drag and drop the questions to change their order.</p>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="questionsReorderList">
              {(provided) => (
                <ul
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {orderedQuestions.map((question, index) => (
                    <Draggable key={question.id} draggableId={question.id} index={index}>
                      {(providedDraggable, snapshot) => (
                        <li
                          ref={providedDraggable.innerRef}
                          {...providedDraggable.draggableProps} 
                          className={`border rounded-md flex 
                            ${snapshot.isDragging 
                              ? 'bg-[var(--accent-primary)] bg-opacity-20 shadow-lg border-[var(--accent-primary)]' 
                              : 'bg-[var(--bg-primary)] border-[var(--border-color)] hover:bg-[var(--accent-secondary)] hover:bg-opacity-20'}`}
                        >
                          <div className="p-3 flex-grow min-w-0">
                            <span className="text-sm text-[var(--text-primary)] truncate block" title={question.questionText}>
                              <span className="font-medium mr-1">{index + 1}.</span>
                              {question.questionText}
                               <span className="text-xs text-[var(--accent-secondary)] ml-1.5">({question.type === 'mcq' ? 'MCQ' : 'Written'})</span>
                            </span>
                          </div>
                          <div
                            {...providedDraggable.dragHandleProps} // Apply dragHandleProps here
                            className="px-5 py-3 bg-[var(--accent-secondary)] hover:bg-[var(--accent-secondary-hover)] text-[var(--text-primary)] rounded-r-md cursor-grab active:cursor-grabbing flex items-center justify-center shrink-0"
                            aria-label="Drag to reorder question"
                          >
                            <i className="fa-solid fa-sort fa-fw fa-xl text-[var(--text-primary)]"></i> 
                          </div>
                        </li>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>
          {initialQuestions.length === 0 && (
            <p className="text-[var(--text-secondary)] text-center py-4">This quiz has no questions to reorder.</p>
          )}
        </div>

        <footer className="p-4 sm:p-5 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] rounded-b-xl flex justify-end space-x-3">
          <button
            onClick={handleSave}
            disabled={initialQuestions.length === 0}
            className="px-4 py-2 text-sm font-medium bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover-bg)] text-[var(--btn-primary-text)] rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--btn-primary-focus-ring)] disabled:opacity-50"
          >
            Save Order
          </button>
        </footer>
      </div>
    </div>,
    modalRoot
  );
};

export default ReorderQuestionsModal;