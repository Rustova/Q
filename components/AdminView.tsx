
import React, { useState, ChangeEvent, useRef } from 'react';
import type { Subject, Quiz, Question } from '../App.tsx';
import QuestionForm from './QuestionForm.tsx';
import AdminQuestionListItem from './AdminQuestionListItem.tsx';
import HoldToDeleteButton from './HoldToDeleteButton.tsx';

// Common classes
const inputClass = "w-full p-3 border border-slate-600 rounded-md bg-slate-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400";
const selectClass = "w-full p-3 border border-slate-600 rounded-md bg-slate-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
const buttonPrimaryClass = "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center justify-center space-x-1.5 text-sm whitespace-nowrap shrink-0";
const buttonWarningClass = "px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors text-sm whitespace-nowrap shrink-0";
const labelClass = "block text-sm font-medium text-slate-700 mb-1";
const sectionBaseClass = "bg-white p-4 sm:p-6 rounded-lg shadow-lg border border-slate-200";

interface AdminViewProps {
  subjects: Subject[];
  activeSubjectId: string | null;
  activeQuizId: string | null;
  editingQuestion: Question | null;
  setEditingQuestion: (question: Question | null) => void;
  onSetActiveSubjectId: (id: string | null) => void;
  onCreateSubject: (name: string) => void;
  onUpdateSubjectName: (id: string, newName: string) => boolean;
  onDeleteSubject: (id: string) => void;
  onSetActiveQuizId: (id: string | null) => void;
  onCreateQuiz: (subjectId: string, name: string) => void;
  onUpdateQuizName: (subjectId: string, quizId: string, newName: string) => boolean;
  onDeleteQuiz: (subjectId: string, quizId: string) => void;
  onToggleQuizStartable: (subjectId: string, quizId: string) => void;
  onAddQuestion: (subjectId: string, quizId: string, question: Omit<Question, 'id'>) => void;
  onUpdateQuestion: (subjectId: string, quizId: string, question: Question) => void;
  onDeleteQuestion: (subjectId: string, quizId: string, questionId: string) => void;
  onReorderQuestions: (subjectId: string, quizId: string) => void;
  maxOptions: number;
  showManageSubjectsSection: boolean;
  setShowManageSubjectsSection: (show: boolean) => void;
  showManageQuizzesSection: boolean;
  setShowManageQuizzesSection: (show: boolean) => void;
  activeAdminSubject: Subject | undefined;
  activeAdminQuiz: Quiz | undefined;
  onSaveChanges: (currentSubjects: Subject[]) => Promise<void>;
  isSaving: boolean;
  saveMessage: string | null;
}

const AdminView: React.FC<AdminViewProps> = (props) => {
  const {
    subjects, activeSubjectId, activeQuizId, editingQuestion, setEditingQuestion,
    onSetActiveSubjectId, onCreateSubject, onUpdateSubjectName, onDeleteSubject,
    onSetActiveQuizId, onCreateQuiz, onUpdateQuizName, onDeleteQuiz, onToggleQuizStartable,
    onAddQuestion, onUpdateQuestion, onDeleteQuestion, onReorderQuestions,
    maxOptions,
    showManageSubjectsSection, setShowManageSubjectsSection,
    showManageQuizzesSection, setShowManageQuizzesSection,
    activeAdminSubject, activeAdminQuiz,
    onSaveChanges, isSaving, saveMessage
  } = props;

  const [newSubjectName, setNewSubjectName] = useState('');
  const [editSubjectNameValue, setEditSubjectNameValue] = useState('');
  const [newQuizName, setNewQuizName] = useState('');
  const [editQuizNameValue, setEditQuizNameValue] = useState('');
  const [showDataManagementSection, setShowDataManagementSection] = useState(true);


  React.useEffect(() => {
    setEditSubjectNameValue(activeAdminSubject?.name || '');
  }, [activeAdminSubject]);

  React.useEffect(() => {
    setEditQuizNameValue(activeAdminQuiz?.name || '');
  }, [activeAdminQuiz]);


  const handleCreateSubject = () => {
    if (newSubjectName.trim()) {
      onCreateSubject(newSubjectName);
      setNewSubjectName('');
    } else {
      alert("Subject name cannot be empty.");
    }
  };

  const handleUpdateSubjectName = () => {
    if (activeSubjectId && editSubjectNameValue.trim()) {
      const success = onUpdateSubjectName(activeSubjectId, editSubjectNameValue);
      if (!success) setEditSubjectNameValue(activeAdminSubject?.name || '');
    } else if (activeSubjectId) {
        alert("Subject name cannot be empty.");
        setEditSubjectNameValue(activeAdminSubject?.name || '');
    }
  };
  
  const handleCreateQuiz = () => {
    if (activeSubjectId && newQuizName.trim()) {
      onCreateQuiz(activeSubjectId, newQuizName);
      setNewQuizName('');
    } else if (!activeSubjectId) {
        alert("Please select a subject first.");
    } else {
        alert("Quiz name cannot be empty.");
    }
  };

  const handleUpdateQuizName = () => {
    if (activeSubjectId && activeQuizId && editQuizNameValue.trim()) {
        const success = onUpdateQuizName(activeSubjectId, activeQuizId, editQuizNameValue);
        if(!success) setEditQuizNameValue(activeAdminQuiz?.name || '');
    } else if (activeSubjectId && activeQuizId) {
        alert("Quiz name cannot be empty.");
        setEditQuizNameValue(activeAdminQuiz?.name || '');
    }
  };

  const handleSaveChangesClick = () => {
    onSaveChanges(subjects);
  };

  return (
    <section className="space-y-6 sm:space-y-8">
      {/* Manage Subjects Section */}
      <div className={sectionBaseClass}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-blue-600">Manage Subjects</h2>
          <button onClick={() => setShowManageSubjectsSection(!showManageSubjectsSection)} 
                  className="p-2 text-blue-600 hover:text-blue-700 transition-colors"
                  aria-expanded={showManageSubjectsSection} aria-controls="manage-subjects-content"
                  title={showManageSubjectsSection ? "Collapse Subjects Section" : "Expand Subjects Section"}>
            <i className={`fa-solid ${showManageSubjectsSection ? 'fa-minus' : 'fa-plus'} fa-lg`}></i>
          </button>
        </div>
        {showManageSubjectsSection && (
          <div id="manage-subjects-content" className="space-y-4 pt-2">
            <div>
              <label htmlFor="newSubjectNameInput" className={labelClass}>Create New Subject</label>
              <div className="flex space-x-2">
                <input type="text" id="newSubjectNameInput" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} className={`${inputClass} flex-grow`} placeholder="Enter name for new subject" />
                <button onClick={handleCreateSubject} className={buttonPrimaryClass}><i className="fa-solid fa-plus fa-fw"></i><span>Create Subject</span></button>
              </div>
            </div>
            {subjects.length > 0 ? (
              <div className="space-y-3 pt-2">
                <label htmlFor="selectActiveSubject" className={labelClass}>Select Subject to Manage</label>
                <select id="selectActiveSubject" value={activeSubjectId || ''} onChange={(e: ChangeEvent<HTMLSelectElement>) => onSetActiveSubjectId(e.target.value || null)} className={selectClass}>
                  <option value="">-- Select a Subject --</option>
                  {subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                </select>
                {activeAdminSubject && (
                  <div className="pt-3 space-y-3 bg-slate-50 p-4 rounded-md border border-slate-200">
                    <h3 className="text-md font-medium text-slate-600">Editing: {activeAdminSubject.name}</h3>
                    <div>
                      <label htmlFor="editSubjectNameInput" className={labelClass}>Edit Subject Name</label>
                      <div className="flex space-x-2">
                        <input type="text" id="editSubjectNameInput" value={editSubjectNameValue} onChange={(e) => setEditSubjectNameValue(e.target.value)} className={`${inputClass} flex-grow`} placeholder="Enter new subject name" />
                        <button onClick={handleUpdateSubjectName} className={buttonWarningClass}>Update Name</button>
                      </div>
                    </div>
                    <HoldToDeleteButton
                        onConfirm={() => onDeleteSubject(activeAdminSubject.id)}
                        label={`Delete Subject "${activeAdminSubject.name}"`}
                    />
                  </div>
                )}
              </div>
            ) : <p className="text-sm text-slate-500">No subjects created yet. Add one above!</p>}
          </div>
        )}
      </div>

      {/* Manage Quizzes Section */}
      {activeAdminSubject && (
        <div className={`${sectionBaseClass} mt-6`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-blue-600">Manage Quizzes for "{activeAdminSubject.name}"</h2>
            <button onClick={() => setShowManageQuizzesSection(!showManageQuizzesSection)}
                    className="p-2 text-blue-600 hover:text-blue-700 transition-colors"
                    aria-expanded={showManageQuizzesSection} aria-controls="manage-quizzes-content"
                    title={showManageQuizzesSection ? "Collapse Quizzes Section" : "Expand Quizzes Section"}>
              <i className={`fa-solid ${showManageQuizzesSection ? 'fa-minus' : 'fa-plus'} fa-lg`}></i>
            </button>
          </div>
          {showManageQuizzesSection && (
            <div id="manage-quizzes-content" className="space-y-4 pt-2">
              <div>
                <label htmlFor="newQuizNameInput" className={labelClass}>Create New Quiz in "{activeAdminSubject.name}"</label>
                <div className="flex space-x-2">
                  <input type="text" id="newQuizNameInput" value={newQuizName} onChange={(e) => setNewQuizName(e.target.value)} className={`${inputClass} flex-grow`} placeholder="Enter name for new quiz" />
                  <button onClick={handleCreateQuiz} className={buttonPrimaryClass}><i className="fa-solid fa-plus fa-fw"></i><span>Create Quiz</span></button>
                </div>
              </div>
              {activeAdminSubject.quizzes.length > 0 ? (
                <div className="space-y-3 pt-2">
                  <label htmlFor="selectActiveQuiz" className={labelClass}>Select Quiz to Edit</label>
                  <select id="selectActiveQuiz" value={activeQuizId || ''} onChange={(e: ChangeEvent<HTMLSelectElement>) => onSetActiveQuizId(e.target.value || null)} className={selectClass}>
                    <option value="">-- Select a Quiz --</option>
                    {activeAdminSubject.quizzes.map(quiz => <option key={quiz.id} value={quiz.id}>{quiz.name}</option>)}
                  </select>
                  {activeAdminQuiz && (
                    <div className="pt-3 space-y-3 bg-slate-50 p-4 rounded-md border border-slate-200">
                      <h3 className="text-md font-medium text-slate-600">Editing: {activeAdminQuiz.name}</h3>
                      <div>
                        <label htmlFor="editQuizNameInput" className={labelClass}>Edit Quiz Name</label>
                        <div className="flex space-x-2 mb-3">
                          <input type="text" id="editQuizNameInput" value={editQuizNameValue} onChange={(e) => setEditQuizNameValue(e.target.value)} className={`${inputClass} flex-grow`} placeholder="Enter new quiz name" />
                          <button onClick={handleUpdateQuizName} className={buttonWarningClass}>Update Name</button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <label htmlFor="quizStartableToggle" className="text-sm font-medium text-slate-700">Available to Users:</label>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" id="quizStartableToggle" className="sr-only peer" checked={activeAdminQuiz.isStartable} onChange={() => onToggleQuizStartable(activeAdminSubject.id, activeAdminQuiz.id)} />
                          <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <HoldToDeleteButton
                        onConfirm={() => onDeleteQuiz(activeAdminSubject.id, activeAdminQuiz.id)}
                        label={`Delete Quiz "${activeAdminQuiz.name}"`}
                      />
                    </div>
                  )}
                </div>
              ) : <p className="text-sm text-slate-500">No quizzes created yet for this subject. Add one above!</p>}
            </div>
          )}
        </div>
      )}

      {/* Questions Section */}
      {activeAdminQuiz && activeSubjectId && (
        <>
          <QuestionForm
            key={editingQuestion ? editingQuestion.id : 'new-question'}
            subjectId={activeSubjectId}
            quizId={activeAdminQuiz.id}
            existingQuestion={editingQuestion}
            onSaveQuestion={editingQuestion ? onUpdateQuestion : onAddQuestion}
            onCancelEdit={() => setEditingQuestion(null)}
            maxOptions={maxOptions}
            quizName={activeAdminQuiz.name}
          />
          <div className={`${sectionBaseClass} mt-6 sm:mt-8 pt-4 sm:pt-6`}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl sm:text-2xl font-semibold text-blue-600">
                    Questions in "{activeAdminQuiz.name}" ({activeAdminQuiz.questions.length})
                </h3>
                {activeAdminQuiz.questions.length > 0 && (
                    <button
                        onClick={() => onReorderQuestions(activeSubjectId, activeAdminQuiz.id)}
                        className="px-3 py-1.5 text-xs sm:text-sm bg-sky-500 hover:bg-sky-600 text-white rounded-md transition-colors flex items-center space-x-1.5"
                        title="Reorder questions (Written first, then MCQ)"
                        aria-label="Reorder questions: Written response first, then Multiple Choice"
                    >
                        <i className="fa-solid fa-arrow-up-wide-short fa-fw"></i>
                        <span>Reorder</span>
                    </button>
                )}
            </div>
            {activeAdminQuiz.questions.length > 0 ? (
              <ul className="space-y-3">
                {activeAdminQuiz.questions.map((q, index) => (
                  <AdminQuestionListItem
                    key={q.id}
                    question={q}
                    questionNumber={index + 1}
                    onEdit={() => setEditingQuestion(q)}
                    onDelete={() => {
                        if (props.activeSubjectId && props.activeQuizId) {
                            props.onDeleteQuestion(props.activeSubjectId, props.activeQuizId, q.id);
                        } else {
                            console.error(
                                "CRITICAL ERROR: Attempted to delete question but activeSubjectId or activeQuizId prop was missing or null.",
                                { activeSubjectId: props.activeSubjectId, activeQuizId: props.activeQuizId }
                            );
                            alert(
                                "A critical error occurred: The necessary context (subject or quiz ID) was missing. Please refresh and try again."
                            );
                        }
                    }}
                  />
                ))}
              </ul>
            ) : <p className="text-slate-500">This quiz has no questions yet. Add one using the form above.</p>}
          </div>
        </>
      )}
      {!activeSubjectId && subjects.length > 0 && (
        <p className="text-center text-slate-500 mt-6">Select a subject above to manage its details and quizzes.</p>
      )}
      {activeSubjectId && !activeQuizId && activeAdminSubject?.quizzes.length > 0 && (
         <p className="text-center text-slate-500 mt-6">Select a quiz to manage its questions or edit its details.</p>
      )}

      {/* Application Data Management Section */}
      <div className={`${sectionBaseClass} mt-6 sm:mt-8`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-blue-600">Application Data Management</h2>
          <button onClick={() => setShowDataManagementSection(!showDataManagementSection)}
                  className="p-2 text-blue-600 hover:text-blue-700 transition-colors"
                  aria-expanded={showDataManagementSection} aria-controls="data-management-content"
                  title={showDataManagementSection ? "Collapse Data Management Section" : "Expand Data Management Section"}>
            <i className={`fa-solid ${showDataManagementSection ? 'fa-minus' : 'fa-plus'} fa-lg`}></i>
          </button>
        </div>
        {showDataManagementSection && (
            <div id="data-management-content" className="space-y-4 pt-2">
                <div>
                    <h3 className="text-lg font-medium text-slate-700 mb-2">Synchronize Data with Cloud (Google Drive)</h3>
                    <p className="text-sm text-slate-600 mb-3">
                        Save all current subjects, quizzes, and questions to a specific file in Google Drive.
                        This will update the data source for all users once Google Sign-In and Drive API calls are implemented.
                    </p>
                    <button 
                        onClick={handleSaveChangesClick} 
                        className={`${buttonPrimaryClass} w-full sm:w-auto bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed`}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <><i className="fa-solid fa-spinner fa-spin fa-fw"></i><span>Saving...</span></>
                        ) : (
                            <><i className="fa-solid fa-cloud-arrow-up fa-fw"></i><span>Save Changes to Google Drive</span></>
                        )}
                    </button>
                </div>
                {saveMessage && (
                    <div className={`mt-3 p-3 rounded-md text-sm ${saveMessage.toLowerCase().includes("error") || saveMessage.toLowerCase().includes("not yet implemented") || saveMessage.toLowerCase().includes("incomplete") ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-green-100 text-green-700 border border-green-300'}`}
                         role="alert"
                    >
                         <p style={{ whiteSpace: 'pre-line' }}>{saveMessage}</p>
                    </div>
                )}

                <div className="p-3 bg-sky-50 border border-sky-200 rounded-md mt-4">
                    <h4 className="text-sm font-semibold text-sky-700 mb-1 flex items-center">
                        <i className="fa-solid fa-circle-info fa-fw mr-2"></i>
                        How it Works (Future State)
                    </h4>
                    <ul className="list-disc list-inside text-xs text-sky-600 space-y-1 pl-4">
                        <li>The application will require users to "Sign in with Google".</li>
                        <li>Clicking "Save Changes to Google Drive" will send data to a specific <code>data.json</code> file in the authenticated user's Google Drive (or a shared Drive file if permissions allow).</li>
                        <li>The application will load data from this Google Drive file on startup (after user signs in).</li>
                        <li>Ensure <code>GOOGLE_DRIVE_FILE_ID</code> and <code>GOOGLE_CLIENT_ID</code> are correctly configured in <code>config.ts</code>.</li>
                        <li>The <code>data.json</code> in the project repository acts as a fallback if cloud access fails or is not yet configured/signed-in.</li>
                        <li>This direct Google Drive integration replaces the previous Google Apps Script method.</li>
                    </ul>
                </div>
            </div>
        )}
      </div>
    </section>
  );
};

export default AdminView;