
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header.tsx';
import Footer from './components/Footer.tsx';
import AdminLoginModal from './components/AdminLoginModal.tsx';
import SubjectSelectionView from './components/SubjectSelectionView.tsx';
import QuizSelectionView from './components/QuizSelectionView.tsx';
import UserView from './components/UserView.tsx';
import AdminView from './components/AdminView.tsx';
import AppConfig, { PLACEHOLDER_GITHUB_DATA_URL } from './config.ts';

// --- Constants ---
const ADMIN_PASSWORD = "e2c841f407";
const APP_NAME = "Q";
const MAX_OPTIONS = 5;

// --- Types ---
interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  questionText: string;
  type: 'mcq' | 'written'; 
  options?: Option[]; 
  correctOptionId?: string; 
}

interface Quiz {
  id: string;
  name: string;
  questions: Question[];
  isStartable: boolean;
}

interface Subject {
  id: string;
  name: string;
  quizzes: Quiz[];
}

export type { Option, Question, Quiz, Subject };

// --- Utility Functions ---
export function generateId() {
  return Date.now().toString() + Math.random().toString(36).substring(2, 9);
}

const App: React.FC = () => {
  const [isAdminView, setIsAdminView] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeSubjectIdForAdmin, setActiveSubjectIdForAdminState] = useState<string | null>(null);
  const [activeQuizIdForAdmin, setActiveQuizIdForAdminState] = useState<string | null>(null);
  const [selectedSubjectForUser, setSelectedSubjectForUser] = useState<Subject | null>(null);
  const [selectedQuizForUser, setSelectedQuizForUser] = useState<Quiz | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataLoadMessage, setDataLoadMessage] = useState<string | null>(null); // For data loading messages
  
  // User quiz taking state
  const [userCurrentQuestionIndex, setUserCurrentQuestionIndex] = useState(0);
  const [userSelectedOptionId, setUserSelectedOptionId] = useState<string | null>(null);
  const [userFeedback, setUserFeedback] = useState<string | null>(null); 
  const [userIsSubmitted, setUserIsSubmitted] = useState(false);
  const [userQuizComplete, setUserQuizComplete] = useState(false);

  // Admin view collapsible sections
  const [showManageSubjectsSection, setShowManageSubjectsSection] = useState(true);
  const [showManageQuizzesSection, setShowManageQuizzesSection] = useState(true);

  const loadLocalDataFallback = useCallback(async (contextMessage?: string) => {
    let messagePrefix = "Loading local fallback data (./data.json).";
    if (contextMessage) {
        messagePrefix = `${contextMessage} ${messagePrefix}`;
    }
    setDataLoadMessage(messagePrefix);
    console.warn(contextMessage || "Falling back to local data.json.");
    try {
      const response = await fetch('./data.json');
      if (!response.ok) {
        if (response.status === 404) {
          console.warn("Local data.json not found, initializing with empty subjects array.");
          setSubjects([]);
          setDataLoadMessage(`${messagePrefix} Local data.json not found. Initialized with empty data.`);
        } else {
          throw new Error(`Failed to fetch local data.json: ${response.statusText}`);
        }
      } else {
        const data = await response.json();
        setSubjects(Array.isArray(data) ? data : []);
        setDataLoadMessage(`${messagePrefix} Loaded local fallback data successfully.`);
      }
    } catch (error) {
      console.error("Error loading subjects from local data.json fallback:", error);
      setSubjects([]);
      setDataLoadMessage(`${messagePrefix} Failed to load local fallback: ${(error as Error).message}. Initializing with empty data.`);
    }
  }, []);

  // Main data loading effect
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      setDataLoadMessage("Starting data load sequence...");

      if (!AppConfig.GITHUB_DATA_URL || AppConfig.GITHUB_DATA_URL === PLACEHOLDER_GITHUB_DATA_URL) {
        setDataLoadMessage("GitHub Data URL not configured (or is placeholder). Attempting local fallback.");
        console.warn("GitHub Data URL not configured (or is placeholder).");
        await loadLocalDataFallback("GitHub Data URL not configured.");
        setIsLoadingData(false);
        return;
      }

      const githubURL = AppConfig.GITHUB_DATA_URL;
      setDataLoadMessage(`Attempting to load data from GitHub URL: ${githubURL}`);
      
      try {
        const response = await fetch(githubURL);
        if (!response.ok) {
          throw new Error(`Failed to fetch from GitHub: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          setSubjects(data);
          setDataLoadMessage("Data loaded from GitHub successfully.");
          console.log("Data loaded from GitHub successfully:", data);
        } else {
          throw new Error('Invalid data structure from GitHub. Expected an array.');
        }
      } catch (error) {
        console.error("Failed to load data from GitHub:", error);
        await loadLocalDataFallback(`GitHub load failed: ${(error as Error).message}.`);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadLocalDataFallback]);


  const resetUserQuizState = useCallback(() => {
    setUserCurrentQuestionIndex(0);
    setUserSelectedOptionId(null);
    setUserFeedback(null);
    setUserIsSubmitted(false);
    setUserQuizComplete(false);
  }, []);

  const handleSwitchView = () => {
    if (isAdminView) {
      setIsAdminView(false);
      setSelectedSubjectForUser(null);
      setSelectedQuizForUser(null);
      resetUserQuizState();
    } else {
      if (isAdminAuthenticated) {
        setIsAdminView(true);
      } else {
        setShowAdminLoginModal(true);
        setLoginError(null);
      }
    }
  };

  const handleAdminLoginAttempt = (password: string) => {
    if (password === ADMIN_PASSWORD) {
      setIsAdminAuthenticated(true);
      setShowAdminLoginModal(false);
      setIsAdminView(true);
      setLoginError(null);
    } else {
      setLoginError("Incorrect password. Please try again.");
    }
  };

  const handleCloseLoginModal = () => {
    setShowAdminLoginModal(false);
    setLoginError(null);
  };

  const setActiveSubjectIdForAdmin = (subjectId: string | null) => {
    setActiveSubjectIdForAdminState(subjectId);
    setActiveQuizIdForAdminState(null);
    setEditingQuestion(null);
  };

  const setActiveQuizIdForAdmin = (quizId: string | null) => {
    setActiveQuizIdForAdminState(quizId);
    setEditingQuestion(null);
  };

  // Subject CRUD
  const createSubjectHandler = (name: string) => {
    const newSubject: Subject = {
      id: generateId(),
      name: name.trim() || `Subject ${subjects.length + 1}`,
      quizzes: [],
    };
    setSubjects(prev => [...prev, newSubject]);
    setActiveSubjectIdForAdmin(newSubject.id); 
    setActiveQuizIdForAdminState(null);
    setEditingQuestion(null);
  };

  const updateSubjectNameHandler = (subjectId: string, newName: string) => {
    const trimmedName = newName.trim();
    if (!trimmedName) {
        alert("Subject name cannot be empty.");
        return false;
    }
    setSubjects(prev => prev.map(s => s.id === subjectId ? { ...s, name: trimmedName } : s));
    return true;
  };

  const deleteSubjectHandler = (subjectId: string) => {
    setSubjects(prev => prev.filter(s => s.id !== subjectId));
    if (activeSubjectIdForAdmin === subjectId) {
      setActiveSubjectIdForAdmin(null);
    }
    if (selectedSubjectForUser?.id === subjectId) {
      setSelectedSubjectForUser(null);
      setSelectedQuizForUser(null);
      resetUserQuizState();
    }
  };

  // Quiz CRUD
  const createQuizHandler = (subjectId: string, name: string) => {
    const newQuiz: Quiz = {
      id: generateId(),
      name: name.trim() || `Quiz ${subjects.find(s => s.id === subjectId)?.quizzes.length || 0 + 1}`,
      questions: [],
      isStartable: false,
    };
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        return { ...s, quizzes: [...s.quizzes, newQuiz] };
      }
      return s;
    }));
    setActiveQuizIdForAdmin(newQuiz.id);
    setEditingQuestion(null);
  };

  const updateQuizNameHandler = (subjectId: string, quizId: string, newName: string) => {
    const trimmedName = newName.trim();
     if (!trimmedName) {
        alert("Quiz name cannot be empty.");
        return false;
    }
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        return {
          ...s,
          quizzes: s.quizzes.map(q => q.id === quizId ? { ...q, name: trimmedName } : q)
        };
      }
      return s;
    }));
    return true;
  };

  const deleteQuizHandler = (subjectId: string, quizId: string) => {
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        return { ...s, quizzes: s.quizzes.filter(q => q.id !== quizId) };
      }
      return s;
    }));
    if (activeQuizIdForAdmin === quizId) {
      setActiveQuizIdForAdmin(null);
    }
    if (selectedQuizForUser?.id === quizId) {
        setSelectedQuizForUser(null);
        resetUserQuizState();
    }
  };

  const toggleQuizStartableHandler = (subjectId: string, quizId: string) => {
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        return {
          ...s,
          quizzes: s.quizzes.map(q => q.id === quizId ? { ...q, isStartable: !q.isStartable } : q)
        };
      }
      return s;
    }));
  };

  // Question CRUD
  const addQuestionToQuizHandler = (subjectId: string, quizId: string, newQuestionData: Omit<Question, 'id'>) => {
    const questionWithId: Question = { ...newQuestionData, id: generateId() };
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        return {
          ...s,
          quizzes: s.quizzes.map(q => {
            if (q.id === quizId) {
              return { ...q, questions: [...q.questions, questionWithId] };
            }
            return q;
          })
        };
      }
      return s;
    }));
    setEditingQuestion(null);
  };

  const updateQuestionInQuizHandler = (subjectId: string, quizId: string, updatedQuestion: Question) => {
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        return {
          ...s,
          quizzes: s.quizzes.map(q => {
            if (q.id === quizId) {
              return { ...q, questions: q.questions.map(ques => ques.id === updatedQuestion.id ? updatedQuestion : ques) };
            }
            return q;
          })
        };
      }
      return s;
    }));
    setEditingQuestion(null);
  };

  const deleteQuestionFromQuizHandler = (subjectId: string, quizId: string, questionId: string) => {
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        return {
          ...s,
          quizzes: s.quizzes.map(q => {
            if (q.id === quizId) {
              return { ...q, questions: q.questions.filter(ques => ques.id !== questionId) };
            }
            return q;
          })
        };
      }
      return s;
    }));
    if (editingQuestion?.id === questionId) {
      setEditingQuestion(null);
    }
  };

  const reorderQuestionsHandler = (subjectId: string, quizId: string) => {
    setSubjects(prevSubjects =>
      prevSubjects.map(s => {
        if (s.id === subjectId) {
          return {
            ...s,
            quizzes: s.quizzes.map(q => {
              if (q.id === quizId) {
                const sortedQuestions = [...q.questions].sort((a, b) => {
                  if (a.type === 'written' && b.type === 'mcq') {
                    return -1;
                  }
                  if (a.type === 'mcq' && b.type === 'written') {
                    return 1; 
                  }
                  return 0; 
                });
                return { ...q, questions: sortedQuestions };
              }
              return q;
            }),
          };
        }
        return s;
      })
    );
  };

  // User Navigation & Quiz Taking
  const selectSubjectForTakingHandler = (subjectId: string) => {
    const subjectToTake = subjects.find(s => s.id === subjectId);
    if (subjectToTake) {
      setSelectedSubjectForUser(subjectToTake);
      setSelectedQuizForUser(null);
      resetUserQuizState();
    }
  };

  const clearSelectedSubjectForUserHandler = () => {
      setSelectedSubjectForUser(null);
      setSelectedQuizForUser(null);
      resetUserQuizState();
  };

  const selectQuizForTakingHandler = (quizId: string) => {
    if (!selectedSubjectForUser) return;
    const quizToTake = selectedSubjectForUser.quizzes.find(q => q.id === quizId);
    if (quizToTake) {
      setSelectedQuizForUser(quizToTake);
      resetUserQuizState();
    }
  };

  const clearSelectedQuizForUserHandler = () => {
    setSelectedQuizForUser(null);
    resetUserQuizState();
  };

  const handleOptionSelect = (optionId: string) => {
    if (!userIsSubmitted) {
      setUserSelectedOptionId(optionId);
    }
  };

  const handleSubmitAnswer = () => {
    if (!selectedQuizForUser) return;
    const currentQuestion = selectedQuizForUser.questions[userCurrentQuestionIndex];
    if (!currentQuestion || currentQuestion.type === 'written' || !userSelectedOptionId) return;

    setUserIsSubmitted(true);
    setUserFeedback(userSelectedOptionId === currentQuestion.correctOptionId ? 'Correct' : 'Incorrect');
  };

  const handleNextQuestion = () => {
    if (!selectedQuizForUser) return;
    if (userCurrentQuestionIndex < selectedQuizForUser.questions.length - 1) {
      setUserCurrentQuestionIndex(prev => prev + 1);
      setUserSelectedOptionId(null);
      setUserFeedback(null);
      setUserIsSubmitted(false);
    } else {
      setUserQuizComplete(true);
    }
  };

  const getContextTitle = () => {
    let currentContextTitle = "Quiz Platform";
    if (isAdminView) {
        const currentAdminSubject = subjects.find(s => s.id === activeSubjectIdForAdmin);
        const currentAdminQuiz = currentAdminSubject?.quizzes.find(q => q.id === activeQuizIdForAdmin);
        if (currentAdminSubject && currentAdminQuiz) {
        currentContextTitle = `Admin: ${currentAdminSubject.name} / ${currentAdminQuiz.name}`;
        } else if (currentAdminSubject) {
        currentContextTitle = `Admin: ${currentAdminSubject.name}`;
        } else {
        currentContextTitle = "Admin Panel";
        }
    } else {
        if (selectedSubjectForUser && selectedQuizForUser) {
        currentContextTitle = `${selectedSubjectForUser.name} / ${selectedQuizForUser.name}`;
        } else if (selectedSubjectForUser) {
        currentContextTitle = `Quizzes in ${selectedSubjectForUser.name}`;
        } else {
        currentContextTitle = "Select a Subject";
        }
    }
    return currentContextTitle;
  }

  const activeAdminSubject = subjects.find(s => s.id === activeSubjectIdForAdmin);
  const activeAdminQuiz = activeAdminSubject?.quizzes.find(q => q.id === activeQuizIdForAdmin);

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="p-6 bg-white rounded-lg shadow-lg text-center">
          <i className="fa-solid fa-spinner fa-spin fa-2x text-blue-600 mb-4"></i>
          <p className="text-slate-700 text-lg">Loading application data...</p>
          {dataLoadMessage && ( 
            <div className={`mt-3 p-3 rounded-md text-sm text-center ${dataLoadMessage.toLowerCase().includes("error") || dataLoadMessage.toLowerCase().includes("failed") || dataLoadMessage.toLowerCase().includes("disabled") || dataLoadMessage.toLowerCase().includes("incomplete") || dataLoadMessage.toLowerCase().includes("not found") || dataLoadMessage.toLowerCase().includes("skipping") ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-yellow-100 text-yellow-700 border border-yellow-300'}`}
                 role="status"
                 style={{ whiteSpace: 'pre-line', maxWidth: '400px', margin: '10px auto 0' }}
            >
                 {dataLoadMessage}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <Header
        contextTitle={getContextTitle()}
        isAdminView={isAdminView}
        onSwitchView={handleSwitchView}
      />
      <main className="flex-grow w-full max-w-5xl mx-auto p-4 sm:p-6">
        {isAdminView && isAdminAuthenticated ? (
          <AdminView
            subjects={subjects}
            activeSubjectId={activeSubjectIdForAdmin}
            activeQuizId={activeQuizIdForAdmin}
            editingQuestion={editingQuestion}
            setEditingQuestion={setEditingQuestion}
            onSetActiveSubjectId={setActiveSubjectIdForAdmin}
            onCreateSubject={createSubjectHandler}
            onUpdateSubjectName={updateSubjectNameHandler}
            onDeleteSubject={deleteSubjectHandler}
            onSetActiveQuizId={setActiveQuizIdForAdmin}
            onCreateQuiz={createQuizHandler}
            onUpdateQuizName={updateQuizNameHandler}
            onDeleteQuiz={deleteQuizHandler}
            onToggleQuizStartable={toggleQuizStartableHandler}
            onAddQuestion={addQuestionToQuizHandler}
            onUpdateQuestion={updateQuestionInQuizHandler}
            onDeleteQuestion={deleteQuestionFromQuizHandler}
            onReorderQuestions={reorderQuestionsHandler}
            maxOptions={MAX_OPTIONS}
            showManageSubjectsSection={showManageSubjectsSection}
            setShowManageSubjectsSection={setShowManageSubjectsSection}
            showManageQuizzesSection={showManageQuizzesSection}
            setShowManageQuizzesSection={setShowManageQuizzesSection}
            activeAdminSubject={activeAdminSubject}
            activeAdminQuiz={activeAdminQuiz}
          />
        ) : selectedSubjectForUser ? (
          selectedQuizForUser ? (
            <UserView
              quiz={selectedQuizForUser}
              currentQuestionIndex={userCurrentQuestionIndex}
              selectedOptionId={userSelectedOptionId}
              feedback={userFeedback}
              isSubmitted={userIsSubmitted}
              isQuizComplete={userQuizComplete}
              onOptionSelect={handleOptionSelect}
              onSubmitAnswer={handleSubmitAnswer}
              onNextQuestion={handleNextQuestion}
              onBackToQuizList={clearSelectedQuizForUserHandler}
            />
          ) : (
            <QuizSelectionView
              subject={selectedSubjectForUser}
              onSelectQuiz={selectQuizForTakingHandler}
              onBackToSubjectList={clearSelectedSubjectForUserHandler}
            />
          )
        ) : (
          <SubjectSelectionView
            subjects={subjects}
            onSelectSubject={selectSubjectForTakingHandler}
          />
        )}
      </main>
      <Footer appName={APP_NAME} />
      {showAdminLoginModal && (
        <AdminLoginModal
          onLogin={handleAdminLoginAttempt}
          onClose={handleCloseLoginModal}
          error={loginError}
        />
      )}
    </>
  );
};

export default App;
