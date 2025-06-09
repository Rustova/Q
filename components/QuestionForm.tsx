

import React, { useState, useEffect, FormEvent } from 'react';
import type { Question, Option } from '../App.tsx'; 

// Theme-aware classes using CSS Variables
const inputClass = "w-full p-3 border rounded-md focus:ring-2 placeholder-[var(--placeholder-color)] bg-[var(--input-bg)] text-[var(--input-text)] border-[var(--input-border)] focus:border-[var(--input-focus-ring)] focus:ring-[var(--input-focus-ring)]";
const labelClass = "block text-sm font-medium text-[var(--text-secondary)] mb-1";
// Removed border border-[var(--border-color)] from sectionBaseClass
const sectionBaseClass = "bg-[var(--bg-secondary)] p-4 sm:p-6 rounded-lg shadow-lg"; 
const buttonPrimaryFullClass = "w-full py-2.5 px-4 bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover-bg)] text-[var(--btn-primary-text)] font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--btn-primary-focus-ring)] focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)]";

interface QuestionFormProps {
  subjectId: string;
  quizId: string;
  quizName: string;
  existingQuestion: Question | null;
  onSaveQuestion: (subjectId: string, quizId: string, questionData: Omit<Question, 'id'> | Question) => void;
  maxOptions: number;
}

const QuestionForm: React.FC<QuestionFormProps> = ({
  subjectId,
  quizId,
  quizName,
  existingQuestion,
  onSaveQuestion,
  maxOptions,
}) => {
  const [questionType, setQuestionType] = useState<Question['type']>('mcq');
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState<Array<{ text: string }>>(
    Array(maxOptions).fill(null).map(() => ({ text: '' }))
  );
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number | null>(null);
  const [modelAnswer, setModelAnswer] = useState(''); // Added for written questions
  const [error, setError] = useState<string | null>(null);

  const resetFormFields = (isNewQuestion: boolean) => {
    setQuestionType(isNewQuestion ? 'mcq' : (existingQuestion?.type || 'mcq'));
    setQuestionText(isNewQuestion ? '' : (existingQuestion?.questionText || ''));
    setModelAnswer(isNewQuestion ? '' : (existingQuestion?.modelAnswer || ''));
    
    if (!isNewQuestion && existingQuestion?.type === 'mcq' && existingQuestion?.options) {
      const newOptions = Array(maxOptions).fill(null).map(() => ({ text: '' }));
      let correctIdx: number | null = null;
      existingQuestion.options.forEach((opt, index) => {
        if (index < maxOptions) {
          newOptions[index] = { text: opt.text };
        }
      });
      
      const correctOptionData = existingQuestion.options.find(o => o.id === existingQuestion.correctOptionId);
      if (correctOptionData) {
          const idxInForm = newOptions.findIndex(formOpt => formOpt.text === correctOptionData.text);
          if (idxInForm !== -1) {
              correctIdx = idxInForm;
          }
      }
      setOptions(newOptions);
      setCorrectOptionIndex(correctIdx);
    } else { // For new questions, written questions, or MCQs without options
      setOptions(Array(maxOptions).fill(null).map(() => ({ text: '' })));
      setCorrectOptionIndex(null);
    }
    setError(null);
  };

  useEffect(() => {
    resetFormFields(!existingQuestion);
  }, [existingQuestion, maxOptions]);

  const handleOptionTextChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = { text: value };
    setOptions(newOptions);
    if (value.trim() === '' && correctOptionIndex === index) {
      setCorrectOptionIndex(null); // Unset correct if text is removed
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!questionText.trim()) {
      setError('Question text cannot be empty.');
      return;
    }

    let questionPayload: Omit<Question, 'id'> | Question;

    if (questionType === 'mcq') {
      const providedOptions = options
        .map((opt, index) => ({ text: opt.text.trim(), originalIndex: index }))
        .filter(opt => opt.text !== '');

      if (providedOptions.length < 2) {
        setError('Please provide at least two answer options for an MCQ.');
        return;
      }

      if (correctOptionIndex === null || options[correctOptionIndex].text.trim() === '') {
        setError('Please select a correct answer from the non-empty options for an MCQ.');
        return;
      }
      
      const finalOptionsData = providedOptions.map((opt, idx) => ({
          id: `option-${idx}`, 
          text: opt.text,
      }));

      const correctOptionOriginalText = options[correctOptionIndex].text.trim();
      const correctOptionInFinalList = finalOptionsData.find(opt => opt.text === correctOptionOriginalText);

      if (!correctOptionInFinalList) {
          setError("Error determining correct option ID. The selected correct option might be empty or not among the provided options.");
          return;
      }
      const finalCorrectOptionId = correctOptionInFinalList.id;

      questionPayload = {
        questionText: questionText.trim(),
        type: 'mcq',
        options: finalOptionsData,
        correctOptionId: finalCorrectOptionId,
        modelAnswer: undefined, // MCQs don't have model answers
      };
    } else { // 'written' type
      questionPayload = {
        questionText: questionText.trim(),
        type: 'written',
        options: undefined,
        correctOptionId: undefined,
        modelAnswer: modelAnswer.trim() || undefined,
      };
    }

    if (existingQuestion) {
      onSaveQuestion(subjectId, quizId, { ...questionPayload, id: existingQuestion.id });
    } else {
      onSaveQuestion(subjectId, quizId, questionPayload as Omit<Question, 'id'>);
      resetFormFields(true); 
    }
  };
  
  const submitButtonText = existingQuestion ? 'Update Question' : 'Add Question';

  return (
    <div className={`${sectionBaseClass} mt-3 mb-3 sm:mt-4 sm:mb-4`}>
        {/* The H3 title for "Add New Question" was here and has been removed. */}
        {existingQuestion && <p className="text-sm text-[var(--text-secondary)] mb-3 -mt-2">Editing: "{existingQuestion.questionText.substring(0,50)}..." ({existingQuestion.type?.toUpperCase()})</p>}
        
        <form onSubmit={handleSubmit} className="space-y-6 p-4 bg-[var(--bg-secondary)] rounded-md border border-[var(--border-color)] shadow-sm">
            <div>
                <label className={`${labelClass} text-[var(--text-primary)]`}>Question Type</label>
                <div className="flex space-x-4 text-[var(--text-primary)]">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" name="questionType" value="mcq" checked={questionType === 'mcq'} onChange={() => setQuestionType('mcq')} className="form-radio h-4 w-4 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] bg-[var(--input-bg)] border-[var(--input-border)]"/>
                        <span>Multiple Choice (MCQ)</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" name="questionType" value="written" checked={questionType === 'written'} onChange={() => setQuestionType('written')} className="form-radio h-4 w-4 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] bg-[var(--input-bg)] border-[var(--input-border)]"/>
                        <span>Written Response</span>
                    </label>
                </div>
            </div>
            
            <div>
                <label htmlFor="questionText" className={labelClass}>Question Text</label>
                <textarea
                    id="questionText"
                    rows={3}
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    className={inputClass}
                    placeholder="Enter the question"
                />
            </div>

            {questionType === 'mcq' && (
              <fieldset>
                  <legend className={`text-md font-medium ${labelClass} mb-2`}>
                      Answer Options (Provide 2 to {maxOptions})
                  </legend>
                  <div className="space-y-3">
                      {options.map((option, index) => (
                          <div key={index} className="flex items-center space-x-3">
                              <input
                                  type="radio"
                                  id={`correctAnswer-${index}-${existingQuestion ? existingQuestion.id : 'new'}`}
                                  name={`correctAnswer-${existingQuestion ? existingQuestion.id : 'new'}`}
                                  value={index}
                                  checked={correctOptionIndex === index}
                                  onChange={() => setCorrectOptionIndex(index)}
                                  disabled={option.text.trim() === ''}
                                  className="h-4 w-4 text-[var(--accent-primary)] border-[var(--input-border)] focus:ring-[var(--accent-primary)] shrink-0 cursor-pointer bg-[var(--input-bg)]"
                                  aria-label={`Mark option ${String.fromCharCode(65 + index)} as correct`}
                              />
                              <label htmlFor={`optionText-${index}-${existingQuestion ? existingQuestion.id : 'new'}`} className="text-[var(--text-primary)] w-6 text-left font-medium">
                                  {String.fromCharCode(65 + index)}.
                              </label>
                              <input
                                  id={`optionText-${index}-${existingQuestion ? existingQuestion.id : 'new'}`}
                                  type="text"
                                  value={option.text}
                                  onChange={(e) => handleOptionTextChange(index, e.target.value)}
                                  className={`${inputClass} flex-grow option-text-input`}
                                  placeholder={`Option ${String.fromCharCode(65 + index)} text`}
                                  data-option-index={index}
                              />
                          </div>
                      ))}
                  </div>
              </fieldset>
            )}

            {questionType === 'written' && (
              <div>
                <label htmlFor="modelAnswer" className={labelClass}>
                  Model Answer (Optional)
                </label>
                <textarea
                  id="modelAnswer"
                  rows={4}
                  value={modelAnswer}
                  onChange={(e) => setModelAnswer(e.target.value)}
                  className={inputClass}
                  placeholder="Enter the model answer for this written question (optional)"
                />
                 <p className="text-xs text-[var(--text-secondary)] mt-1">This answer can be shown to users in the quiz.</p>
              </div>
            )}

            {error && <p className="text-red-600 dark:text-red-400 text-sm mt-2">{error}</p>}
            <div className="flex flex-col pt-2"> 
                <button
                    type="submit"
                    className={buttonPrimaryFullClass}
                >
                    {submitButtonText}
                </button>
            </div>
        </form>
    </div>
  );
};

export default QuestionForm;
