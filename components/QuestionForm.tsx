import React, { useState, useEffect, FormEvent } from 'react';
import type { Question, Option } from '../App.tsx'; 

const inputClass = "w-full p-3 border border-slate-600 rounded-md bg-slate-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400";
const labelClass = "block text-sm font-medium text-slate-700 mb-1";
const sectionBaseClass = "bg-white p-4 sm:p-6 rounded-lg shadow-lg border border-slate-200";


interface QuestionFormProps {
  subjectId: string;
  quizId: string;
  quizName: string;
  existingQuestion: Question | null;
  onSaveQuestion: (subjectId: string, quizId: string, questionData: Omit<Question, 'id'> | Question) => void;
  onCancelEdit: () => void;
  maxOptions: number;
}

const QuestionForm: React.FC<QuestionFormProps> = ({
  subjectId,
  quizId,
  quizName,
  existingQuestion,
  onSaveQuestion,
  onCancelEdit,
  maxOptions,
}) => {
  const [questionType, setQuestionType] = useState<Question['type']>('mcq');
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState<Array<{ text: string }>>(
    Array(maxOptions).fill(null).map(() => ({ text: '' }))
  );
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingQuestion) {
      setQuestionType(existingQuestion.type || 'mcq'); // Default to mcq if type is undefined
      setQuestionText(existingQuestion.questionText);
      if (existingQuestion.type === 'mcq' && existingQuestion.options) {
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
      } else { // For written questions or MCQs without options (should not happen for valid MCQs)
        setOptions(Array(maxOptions).fill(null).map(() => ({ text: '' })));
        setCorrectOptionIndex(null);
      }
    } else {
      // Reset for new question
      setQuestionType('mcq');
      setQuestionText('');
      setOptions(Array(maxOptions).fill(null).map(() => ({ text: '' })));
      setCorrectOptionIndex(null);
    }
    setError(null);
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
      };
    } else { // 'written' type
      questionPayload = {
        questionText: questionText.trim(),
        type: 'written',
        options: undefined,
        correctOptionId: undefined,
      };
    }

    if (existingQuestion) {
      onSaveQuestion(subjectId, quizId, { ...questionPayload, id: existingQuestion.id });
    } else {
      onSaveQuestion(subjectId, quizId, questionPayload as Omit<Question, 'id'>);
      // Reset form for new question only
      setQuestionType('mcq'); // Default back to mcq for next new question
      setQuestionText('');
      setOptions(Array(maxOptions).fill(null).map(() => ({ text: '' })));
      setCorrectOptionIndex(null);
    }
  };
  
  const questionFormTitle = existingQuestion ? `Edit Question in: "${quizName}"` : `Add New Question to: "${quizName}"`;

  return (
    <div className={`${sectionBaseClass} mt-6`}>
        <h3 className="text-xl sm:text-2xl font-semibold mb-4 text-blue-600">{questionFormTitle}</h3>
        {existingQuestion && <p className="text-sm text-slate-500 mb-3 -mt-2">Editing: "{existingQuestion.questionText.substring(0,50)}..." ({existingQuestion.type?.toUpperCase()})</p>}
        
        <form onSubmit={handleSubmit} className="space-y-6 p-4 bg-white rounded-md border border-slate-200 shadow-sm">
            <div>
                <label className={labelClass}>Question Type</label>
                <div className="flex space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" name="questionType" value="mcq" checked={questionType === 'mcq'} onChange={() => setQuestionType('mcq')} className="form-radio h-4 w-4 text-blue-600"/>
                        <span>Multiple Choice (MCQ)</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" name="questionType" value="written" checked={questionType === 'written'} onChange={() => setQuestionType('written')} className="form-radio h-4 w-4 text-blue-600"/>
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
                  <legend className="text-md font-medium text-slate-700 mb-2">
                      Answer Options (Provide 2 to {maxOptions})
                  </legend>
                  <div className="space-y-3">
                      {options.map((option, index) => (
                          <div key={index} className="flex items-center space-x-3">
                              <input
                                  type="radio"
                                  id={`correctAnswer-${index}`}
                                  name="correctAnswer"
                                  value={index}
                                  checked={correctOptionIndex === index}
                                  onChange={() => setCorrectOptionIndex(index)}
                                  disabled={option.text.trim() === ''}
                                  className="h-4 w-4 text-blue-600 border-slate-400 focus:ring-blue-500 shrink-0 cursor-pointer"
                                  aria-label={`Mark option ${String.fromCharCode(65 + index)} as correct`}
                              />
                              <label htmlFor={`optionText-${index}`} className="text-slate-700 w-6 text-left font-medium">
                                  {String.fromCharCode(65 + index)}.
                              </label>
                              <input
                                  id={`optionText-${index}`}
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

            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-2">
                <button
                    type="submit"
                    className="w-full sm:flex-grow py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    {existingQuestion ? 'Update Question' : 'Add Question'}
                </button>
                {existingQuestion && (
                    <button
                        type="button"
                        onClick={onCancelEdit}
                        className="w-full sm:flex-grow py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                    >
                        Cancel Edit
                    </button>
                )}
            </div>
        </form>
    </div>
  );
};

export default QuestionForm;
