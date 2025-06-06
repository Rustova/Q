
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

async function getFetchableGitHubContentUrl(configUrl: string): Promise<string | null> {
  if (!configUrl || configUrl === PLACEHOLDER_GITHUB_DATA_URL) {
    console.info("GitHub data URL is placeholder or empty. Will attempt local fallback.");
    return null;
  }

  const blobPattern = /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+)$/;
  const blobMatch = configUrl.match(blobPattern);

  if (blobMatch) {
    const [, owner, repo, branch, path] = blobMatch;
    const apiRawContentUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path.replace(/\?.*$/, "")}?ref=${branch}`;
    console.log(`Resolved GitHub blob URL to API raw content URL: ${apiRawContentUrl}`);
    return apiRawContentUrl;
  }

  try {
    new URL(configUrl); 
    if (/^https:\/\/raw\.githubusercontent\.com\//.test(configUrl) || 
        /^https:\/\/api\.github\.com\/repos\/[^\/]+\/[^\/]+\/contents\//.test(configUrl) ||
        !/^https:\/\/github\.com\//.test(configUrl) 
       ) {
      return configUrl;
    } else {
        console.warn(`The provided GITHUB_DATA_URL (${configUrl}) is a github.com URL but not a 'blob' URL. This format is not directly processable for raw content in this version. Please use a blob URL or a raw content URL.`);
        return null;
    }
  } catch (e) {
    console.warn(`The GITHUB_DATA_URL (${configUrl}) is not a valid absolute URL or a recognized GitHub format. Fallback will likely occur.`);
    return null;
  }
}


const App: React.FC = () => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => localStorage.getItem('isAdminAuthenticated') === 'true');
  const [isAdminView, setIsAdminView] = useState(() => isAdminAuthenticated && localStorage.getItem('wasAdminViewBeforeRefresh') === 'true');
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeSubjectIdForAdmin, setActiveSubjectIdForAdminState] = useState<string | null>(null);
  const [activeQuizIdForAdmin, setActiveQuizIdForAdminState] = useState<string | null>(null);
  const [selectedSubjectForUser, setSelectedSubjectForUser] = useState<Subject | null>(null);
  const [selectedQuizForUser, setSelectedQuizForUser] = useState<Quiz | null>(null);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataLoadMessage, setDataLoadMessage] = useState<string | null>("Initializing...");
  
  const [userCurrentQuestionIndex, setUserCurrentQuestionIndex] = useState(0);
  const [userSelectedOptionId, setUserSelectedOptionId] = useState<string | null>(null);
  const [userFeedback, setUserFeedback] = useState<string | null>(null); 
  const [userIsSubmitted, setUserIsSubmitted] = useState(false);
  const [userQuizComplete, setUserQuizComplete] = useState(false);

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
      const localDataPath = './data.json'; 
      const cacheBustedLocalDataPath = `${localDataPath}?_cb_local=${Date.now().toString()}`;
      
      const response = await fetch(cacheBustedLocalDataPath, { cache: 'no-cache' });
      if (!response.ok) {
        if (response.status === 404) {
          console.warn("Local data.json not found, initializing with empty subjects array.");
          setSubjects([]);
          setDataLoadMessage(`${messagePrefix} Local data.json not found. Initializing with empty quiz data.`);
        } else {
          const errorText = await response.text();
          console.error(`Failed to fetch local data.json: ${response.status} ${response.statusText}. Response: ${errorText}`);
          setSubjects([]);
          setDataLoadMessage(`${messagePrefix} Error fetching local data.json (${response.status}). Initializing with empty quiz data.`);
        }
      } else {
        const data = await response.json();
        setSubjects(Array.isArray(data) ? data as Subject[] : []);
        setDataLoadMessage(`${messagePrefix} Successfully loaded.`);
        console.log("Successfully loaded local data.json");
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error loading or parsing local data.json: Name: ${error.name}, Message: ${error.message}. Stack: ${error.stack}`);
      } else {
        console.error("Error loading or parsing local data.json (non-Error object):", error);
      }
      setSubjects([]);
      setDataLoadMessage(`${messagePrefix} Error loading local data. See console for details. Initializing with empty quiz data.`);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      setDataLoadMessage("Attempting to load data from configuration...");
      const baseUrl = await getFetchableGitHubContentUrl(AppConfig.GITHUB_DATA_URL);

      if (baseUrl) {
        setDataLoadMessage(`Fetching data from: ${baseUrl}`);
        try {
          const url = new URL(baseUrl); 
          url.searchParams.append('_cb_data', Date.now().toString());
          const finalUrlToFetch = url.toString();
          console.log("Fetching final data from:", finalUrlToFetch);

          const fetchOptions: RequestInit = { cache: 'no-cache' };
          let useTextParsing = false;

          if (url.hostname === 'api.github.com' && url.pathname.includes('/repos/') && url.pathname.includes('/contents/')) {
            fetchOptions.headers = { 'Accept': 'application/vnd.github.v3.raw' };
            useTextParsing = true;
            console.log("Using GitHub API raw content fetch method.");
          } else {
            console.log("Using standard fetch method for non-API or raw.githubusercontent.com URL.");
          }
          
          const response = await fetch(finalUrlToFetch, fetchOptions);
          if (!response.ok) {
            const errorBody = await response.text(); 
            throw new Error(`Failed to fetch from ${finalUrlToFetch}: ${response.status} ${response.statusText}. Body: ${errorBody}`);
          }

          let data;
          if (useTextParsing) {
            const rawJsonString = await response.text();
            data = JSON.parse(rawJsonString);
          } else {
            data = await response.json();
          }
          
          setSubjects(Array.isArray(data) ? data as Subject[] : []);
          setDataLoadMessage("Data loaded successfully from remote source.");
          console.log("Successfully loaded data from remote source");

        } catch (error) {
           if (error instanceof Error) {
            console.error(`Error fetching or parsing data from (${baseUrl}). Type: ${error.name}, Message: ${error.message}. Stack: ${error.stack}`);
          } else {
            console.error(`Error fetching or parsing data from (${baseUrl}). Caught non-Error object:`, error);
          }
          await loadLocalDataFallback(`Failed to load from remote source (${baseUrl}).`);
        } finally {
          setIsLoadingData(false);
        }
      } else {
        console.info("No remote GITHUB_DATA_URL configured, URL is invalid/placeholder, or processing error prevented getting a usable URL.");
        await loadLocalDataFallback("No remote data URL usable or remote fetch failed.");
        setIsLoadingData(false); 
      }
    };
    fetchData();
  }, [loadLocalDataFallback]);


  const resetUserQuizState = () => {
    setUserCurrentQuestionIndex(0);
    setUserSelectedOptionId(null);
    setUserFeedback(null);
    setUserIsSubmitted(false);
    setUserQuizComplete(false);
  };

  const handleSwitchView = () => {
    const targetIsAdminView = !isAdminView;
    setIsAdminView(targetIsAdminView);
    setSelectedSubjectForUser(null);
    setSelectedQuizForUser(null);
    resetUserQuizState();

    if (isAdminAuthenticated) {
        if (targetIsAdminView) {
            localStorage.setItem('wasAdminViewBeforeRefresh', 'true');
        } else {
            localStorage.removeItem('wasAdminViewBeforeRefresh');
        }
    }

    if (targetIsAdminView && !isAdminAuthenticated) {
      setShowAdminLoginModal(true);
    }
  };

  const handleAdminLogin = (password: string) => {
    if (password === ADMIN_PASSWORD) {
      setIsAdminAuthenticated(true);
      localStorage.setItem('isAdminAuthenticated', 'true');
      setIsAdminView(true); // Switch to admin view on successful login
      localStorage.setItem('wasAdminViewBeforeRefresh', 'true');
      setShowAdminLoginModal(false);
      setLoginError(null);
    } else {
      setLoginError("Incorrect password. Please try again.");
    }
  };

  const handleAdminLogout = () => { 
    setIsAdminAuthenticated(false);
    localStorage.removeItem('isAdminAuthenticated');
    setIsAdminView(false); 
    localStorage.removeItem('wasAdminViewBeforeRefresh');
    setActiveSubjectIdForAdminState(null);
    setActiveQuizIdForAdminState(null);
    setEditingQuestion(null);
  };

  const handleCloseAdminLoginModal = () => {
    setShowAdminLoginModal(false);
    setLoginError(null);
    if (!isAdminAuthenticated) { 
      setIsAdminView(false); // If modal closed without login, switch back from potential admin view attempt
      localStorage.removeItem('wasAdminViewBeforeRefresh');
    }
  };

  const setActiveSubjectIdForAdmin = (id: string | null) => {
    setActiveSubjectIdForAdminState(id);
    setActiveQuizIdForAdminState(null); 
    setEditingQuestion(null); 
  };

  const setActiveQuizIdForAdmin = (id: string | null) => {
    setActiveQuizIdForAdminState(id);
    setEditingQuestion(null); 
  };

  const handleCreateSubject = (name: string) => {
    const newSubject: Subject = { id: generateId(), name, quizzes: [] };
    setSubjects(prev => [...prev, newSubject]);
  };

  const handleUpdateSubjectName = (id: string, newName: string): boolean => {
    if (subjects.some(s => s.name.toLowerCase() === newName.toLowerCase() && s.id !== id)) {
        alert(`A subject with the name "${newName}" already exists. Please choose a different name.`);
        return false;
    }
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, name: newName } : s));
    return true;
  };

  const handleDeleteSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
    if (activeSubjectIdForAdmin === id) {
      setActiveSubjectIdForAdmin(null);
    }
  };
  
  const handleCreateQuiz = (subjectId: string, name: string) => {
    const newQuiz: Quiz = { id: generateId(), name, questions: [], isStartable: false };
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        if (s.quizzes.some(q => q.name.toLowerCase() === name.toLowerCase())) {
            alert(`A quiz with the name "${name}" already exists in subject "${s.name}". Please choose a different name.`);
            return s;
        }
        return { ...s, quizzes: [...s.quizzes, newQuiz] };
      }
      return s;
    }));
  };

  const handleUpdateQuizName = (subjectId: string, quizId: string, newName: string): boolean => {
    let nameConflict = false;
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        if (s.quizzes.some(q => q.name.toLowerCase() === newName.toLowerCase() && q.id !== quizId)) {
            nameConflict = true;
            return s;
        }
        return {
          ...s,
          quizzes: s.quizzes.map(q => q.id === quizId ? { ...q, name: newName } : q)
        };
      }
      return s;
    }));
    if (nameConflict) {
        const subjectName = subjects.find(s => s.id === subjectId)?.name || "the current subject";
        alert(`A quiz with the name "${newName}" already exists in ${subjectName}. Please choose a different name.`);
        return false;
    }
    return true;
  };

  const handleDeleteQuiz = (subjectId: string, quizId: string) => {
    setSubjects(prev => prev.map(s => s.id === subjectId ? { ...s, quizzes: s.quizzes.filter(q => q.id !== quizId) } : s));
    if (activeQuizIdForAdmin === quizId) {
      setActiveQuizIdForAdmin(null);
    }
  };

  const handleToggleQuizStartable = (subjectId: string, quizId: string) => {
    setSubjects(prev => prev.map(s => s.id === subjectId ? {
      ...s,
      quizzes: s.quizzes.map(q => q.id === quizId ? { ...q, isStartable: !q.isStartable } : q)
    } : s));
  };

  const handleSetEditingQuestion = (question: Question | null) => {
    setEditingQuestion(question);
  };

  const handleAddQuestion = (subjectId: string, quizId: string, questionData: Omit<Question, 'id'>) => {
    const newQuestion: Question = { ...questionData, id: generateId() };
    if(newQuestion.type === 'mcq' && newQuestion.options) {
        newQuestion.options = newQuestion.options.map((opt, index) => ({...opt, id: `option-${generateId()}-${index}`}));
        
        const correctOptTextFromPayload = questionData.options?.find(o => o.id === questionData.correctOptionId)?.text;
        const newCorrectOpt = newQuestion.options.find(o => o.text === correctOptTextFromPayload);
        newQuestion.correctOptionId = newCorrectOpt ? newCorrectOpt.id : undefined;

        if (!newQuestion.correctOptionId && typeof questionData.correctOptionId === 'string') {
             const originalIndexMatch = questionData.correctOptionId.match(/^option-(\d+)$/);
             if (originalIndexMatch && originalIndexMatch[1]) {
                 const originalIndex = parseInt(originalIndexMatch[1], 10);
                 if (newQuestion.options[originalIndex]) {
                     newQuestion.correctOptionId = newQuestion.options[originalIndex].id;
                 }
             }
        }

    }

    setSubjects(prev => prev.map(s => s.id === subjectId ? {
      ...s,
      quizzes: s.quizzes.map(q => q.id === quizId ? { ...q, questions: [...q.questions, newQuestion] } : q)
    } : s));
    setEditingQuestion(null);
  };
  
  const handleUpdateQuestion = (subjectId: string, quizId: string, updatedQuestion: Question) => {
     if(updatedQuestion.type === 'mcq' && updatedQuestion.options) {
        updatedQuestion.options = updatedQuestion.options.map((opt, index) => ({
            id: opt.id && opt.id.startsWith('option-') ? opt.id : `option-${generateId()}-${index}`, 
            text: opt.text
        }));

        if (typeof updatedQuestion.correctOptionId === 'string' && !updatedQuestion.options.find(o => o.id === updatedQuestion.correctOptionId)) {
            const correctOptTextFromPayload = (editingQuestion?.options?.find(o => o.id === updatedQuestion.correctOptionId))?.text; 
            const newCorrectOpt = updatedQuestion.options.find(o => o.text === correctOptTextFromPayload);

            if (newCorrectOpt) {
                updatedQuestion.correctOptionId = newCorrectOpt.id;
            } else {
                 const originalIndexMatch = updatedQuestion.correctOptionId.match(/^option-(\d+)$/);
                 if (originalIndexMatch && originalIndexMatch[1]) {
                     const originalIndex = parseInt(originalIndexMatch[1], 10);
                     if (updatedQuestion.options[originalIndex]) {
                         updatedQuestion.correctOptionId = updatedQuestion.options[originalIndex].id;
                     } else {
                        console.warn("Correct option index out of bounds after update.");
                        updatedQuestion.correctOptionId = undefined; 
                     }
                 } else {
                    console.warn("Correct option ID seems invalid after update and couldn't be re-mapped.");
                    updatedQuestion.correctOptionId = updatedQuestion.options.length > 0 ? updatedQuestion.options[0].id : undefined;
                 }
            }
        }
        
        const currentCorrectOption = updatedQuestion.options.find(opt => opt.id === updatedQuestion.correctOptionId);
        if(!currentCorrectOption && updatedQuestion.options.length > 0) {
            console.warn("Updated question has MCQ type and options, but correctOptionId seems invalid or mismatched even after re-mapping attempts.");
        }
    }


    setSubjects(prev => prev.map(s => s.id === subjectId ? {
      ...s,
      quizzes: s.quizzes.map(q => q.id === quizId ? {
        ...q,
        questions: q.questions.map(ques => ques.id === updatedQuestion.id ? updatedQuestion : ques)
      } : q)
    } : s));
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = (subjectId: string, quizId: string, questionId: string) => {
    setSubjects(prev => prev.map(s => s.id === subjectId ? {
      ...s,
      quizzes: s.quizzes.map(q => q.id === quizId ? {
        ...q,
        questions: q.questions.filter(ques => ques.id !== questionId)
      } : q)
    } : s));
    if (editingQuestion?.id === questionId) {
      setEditingQuestion(null);
    }
  };

  const handleReorderQuestions = (subjectId: string, quizId: string) => {
    setSubjects(prevSubjects => prevSubjects.map(subject => {
        if (subject.id === subjectId) {
            return {
                ...subject,
                quizzes: subject.quizzes.map(quiz => {
                    if (quiz.id === quizId) {
                        const sortedQuestions = [...quiz.questions].sort((a, b) => {
                            if (a.type === 'written' && b.type === 'mcq') return -1;
                            if (a.type === 'mcq' && b.type === 'written') return 1;
                            return 0; 
                        });
                        return { ...quiz, questions: sortedQuestions };
                    }
                    return quiz;
                })
            };
        }
        return subject;
    }));
  };

  const handleSelectSubjectForUser = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    setSelectedSubjectForUser(subject || null);
    setSelectedQuizForUser(null);
    resetUserQuizState();
  };

  const handleSelectQuizForUser = (quizId: string) => {
    const quiz = selectedSubjectForUser?.quizzes.find(q => q.id === quizId);
    setSelectedQuizForUser(quiz || null);
    resetUserQuizState();
  };

  const handleBackToSubjectListFromQuizList = () => {
    setSelectedSubjectForUser(null);
    setSelectedQuizForUser(null); 
    resetUserQuizState();
  };

  const handleBackToQuizListFromUserView = () => {
    setSelectedQuizForUser(null);
    resetUserQuizState();
  };
  
  const handleUserOptionSelect = (optionId: string) => {
    if (!userIsSubmitted) {
      setUserSelectedOptionId(optionId);
    }
  };

  const handleUserSubmitAnswer = () => {
    if (!selectedQuizForUser || !userSelectedOptionId) return;
    const currentQuestion = selectedQuizForUser.questions[userCurrentQuestionIndex];
    if (!currentQuestion || currentQuestion.type === 'written') return;

    if (currentQuestion.correctOptionId === userSelectedOptionId) {
      setUserFeedback('Correct');
    } else {
      setUserFeedback('Incorrect');
    }
    setUserIsSubmitted(true);
  };

  const handleUserNextQuestion = () => {
    if (!selectedQuizForUser) return;
    if (userCurrentQuestionIndex < selectedQuizForUser.questions.length - 1) {
      setUserCurrentQuestionIndex(prevIndex => prevIndex + 1);
      setUserSelectedOptionId(null);
      setUserFeedback(null);
      setUserIsSubmitted(false);
    } else {
      setUserQuizComplete(true);
      setUserFeedback(null); 
    }
  };

  // Determine context title for header
  let contextTitle = APP_NAME;
  const activeAdminSubject = subjects.find(s => s.id === activeSubjectIdForAdmin);
  const activeAdminQuiz = activeAdminSubject?.quizzes.find(q => q.id === activeQuizIdForAdmin);

  if (isAdminView) {
    if (isAdminAuthenticated) {
      contextTitle = "Admin Panel";
      if (activeAdminSubject) {
        contextTitle += ` > ${activeAdminSubject.name}`;
        if (activeAdminQuiz) {
          contextTitle += ` > ${activeAdminQuiz.name}`;
          if (editingQuestion) {
            contextTitle += ' > Edit Question';
          } else if (activeAdminQuiz.questions.length > 0 || activeQuizIdForAdmin) {
            contextTitle += ' > Manage Questions';
          }
        } else if (activeAdminSubject.quizzes.length > 0 || activeSubjectIdForAdmin) {
          contextTitle += ' > Manage Quizzes';
        }
      } else {
         contextTitle += ' > Manage Subjects';
      }
    } else {
      contextTitle = "Admin Login Required";
    }
  } else {
    if (selectedQuizForUser && selectedSubjectForUser) {
      contextTitle = `${selectedSubjectForUser.name} > ${selectedQuizForUser.name}`;
    } else if (selectedSubjectForUser) {
      contextTitle = `${selectedSubjectForUser.name} > Select Quiz`;
    } else {
      contextTitle = "Select Subject";
    }
  }
  
  const renderContent = () => {
    if (isLoadingData) {
      return (
        <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
          <div className="text-2xl font-semibold text-blue-600 mb-2">
            <i className="fas fa-spinner fa-spin mr-2"></i>Loading Application Data...
          </div>
          <p className="text-slate-500">{dataLoadMessage || "Please wait."}</p>
        </div>
      );
    }
    if (isAdminView) {
      if (isAdminAuthenticated) {
        return (
          <AdminView
            subjects={subjects}
            activeSubjectId={activeSubjectIdForAdmin}
            activeQuizId={activeQuizIdForAdmin}
            editingQuestion={editingQuestion}
            setEditingQuestion={handleSetEditingQuestion}
            onSetActiveSubjectId={setActiveSubjectIdForAdmin}
            onCreateSubject={handleCreateSubject}
            onUpdateSubjectName={handleUpdateSubjectName}
            onDeleteSubject={handleDeleteSubject}
            onSetActiveQuizId={setActiveQuizIdForAdmin}
            onCreateQuiz={handleCreateQuiz}
            onUpdateQuizName={handleUpdateQuizName}
            onDeleteQuiz={handleDeleteQuiz}
            onToggleQuizStartable={handleToggleQuizStartable}
            onAddQuestion={handleAddQuestion}
            onUpdateQuestion={handleUpdateQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onReorderQuestions={handleReorderQuestions}
            maxOptions={MAX_OPTIONS}
            showManageSubjectsSection={showManageSubjectsSection}
            setShowManageSubjectsSection={setShowManageSubjectsSection}
            showManageQuizzesSection={showManageQuizzesSection}
            setShowManageQuizzesSection={setShowManageQuizzesSection}
            activeAdminSubject={activeAdminSubject}
            activeAdminQuiz={activeAdminQuiz}
          />
        );
      } else {
        // Admin view selected but not authenticated (modal should be shown)
        // This path is typically covered by the modal, but a fallback message can be here
        // Or if app loads into admin view but no longer authenticated.
        if (showAdminLoginModal) {
            return <p className="text-center p-4">Redirecting to Admin Login...</p>;
        }
        return <p className="text-center p-4">Admin authentication required. Please switch to User View or attempt login via Admin Panel button.</p>;
      }
    } else { // User View
      if (selectedQuizForUser && selectedSubjectForUser) {
        return (
          <UserView
            quiz={selectedQuizForUser}
            currentQuestionIndex={userCurrentQuestionIndex}
            selectedOptionId={userSelectedOptionId}
            feedback={userFeedback}
            isSubmitted={userIsSubmitted}
            isQuizComplete={userQuizComplete}
            onOptionSelect={handleUserOptionSelect}
            onSubmitAnswer={handleUserSubmitAnswer}
            onNextQuestion={handleUserNextQuestion}
            onBackToQuizList={handleBackToQuizListFromUserView}
          />
        );
      } else if (selectedSubjectForUser) {
        return (
          <QuizSelectionView
            subject={selectedSubjectForUser}
            onSelectQuiz={handleSelectQuizForUser}
            onBackToSubjectList={handleBackToSubjectListFromQuizList}
          />
        );
      } else {
        return <SubjectSelectionView subjects={subjects} onSelectSubject={handleSelectSubjectForUser} />;
      }
    }
  };

  return (
    <>
      <Header
        contextTitle={contextTitle}
        isAdminView={isAdminView}
        isAdminAuthenticated={isAdminAuthenticated}
        onSwitchView={handleSwitchView}
        onAdminLogout={handleAdminLogout}
      />
      <main className="flex-grow p-4 sm:p-6 md:p-8 max-w-5xl w-full mx-auto">
        {renderContent()}
      </main>
      {showAdminLoginModal && !isAdminAuthenticated && (
        <AdminLoginModal
          onLogin={handleAdminLogin}
          onClose={handleCloseAdminLoginModal}
          error={loginError}
        />
      )}
      <Footer appName={APP_NAME} />
    </>
  );
};

export default App;
