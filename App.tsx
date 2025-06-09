

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header.tsx';
import Footer from './components/Footer.tsx';
import AdminLoginModal from './components/AdminLoginModal.tsx';
import SubjectSelectionView from './components/SubjectSelectionView.tsx';
import QuizSelectionView from './components/QuizSelectionView.tsx';
import UserView from './components/UserView.tsx';
import AdminView from './components/AdminView.tsx';
import TimestampModal from './components/TimestampModal.tsx';
import QuizPreferencesModal from './components/QuizPreferencesModal.tsx'; // New Modal
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
  modelAnswer?: string; // Added for written questions
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

// User Answer State
export interface UserAnswer {
  selectedOptionId: string | null;
  feedback: 'Correct' | 'Incorrect' | 'Seen' | null; // Null can mean pending feedback for 'atEnd' mode
}

interface AppData {
  lastUpdated: string | null;
  subjects: Subject[];
}

// App View Management
export type AppViewMode = 'SubjectSelection' | 'QuizSelection' | 'UserQuiz' | 'AdminPanel';

// Quiz Correction Mode
export type UserCorrectionMode = 'immediate' | 'atEnd';

// Question Display Mode
export type UserQuestionDisplayMode = 'oneByOne' | 'listed';


// --- Utility Functions ---
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
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
  const [currentAppView, setCurrentAppView] = useState<AppViewMode>(() => {
    if (localStorage.getItem('isAdminAuthenticated') === 'true' && localStorage.getItem('wasAdminViewBeforeRefresh') === 'true') {
        return 'AdminPanel';
    }
    return 'SubjectSelection';
  });
  
  const [adminGithubPat, setAdminGithubPat] = useState<string>(() => localStorage.getItem('githubPat') || '');


  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [dataTimestamp, setDataTimestamp] = useState<string | null>(null);
  const [activeSubjectIdForAdmin, setActiveSubjectIdForAdminState] = useState<string | null>(null);
  const [activeQuizIdForAdmin, setActiveQuizIdForAdminState] = useState<string | null>(null);
  const [selectedSubjectForUser, setSelectedSubjectForUser] = useState<Subject | null>(null);
  const [selectedQuizForUser, setSelectedQuizForUser] = useState<Quiz | null>(null);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [showTimestampModal, setShowTimestampModal] = useState(false); 
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataLoadMessage, setDataLoadMessage] = useState<string | null>("Gathering all the necessary app information, please hold on a moment..."); 

  const [userCurrentQuestionIndex, setUserCurrentQuestionIndex] = useState(0);
  const [currentUserSelectionAttempt, setCurrentUserSelectionAttempt] = useState<string | null>(null); 
  const [userAnswers, setUserAnswers] = useState<Array<UserAnswer | null>>([]); 
  const [userQuizComplete, setUserQuizComplete] = useState(false);

  // New states for quiz preferences
  const [userCorrectionMode, setUserCorrectionMode] = useState<UserCorrectionMode>('immediate');
  const [userQuestionDisplayMode, setUserQuestionDisplayMode] = useState<UserQuestionDisplayMode>('oneByOne');
  const [showQuizPrefsModal, setShowQuizPrefsModal] = useState(false);

  const [showManageSubjectsSection, setShowManageSubjectsSection] = useState(true);
  const [showManageQuizzesSection, setShowManageQuizzesSection] = useState(true);

  const [isPdfAnimationActive, setIsPdfAnimationActive] = useState<boolean>(false);
  const [hasPdfButtonAnimationPlayedOnce, setHasPdfButtonAnimationPlayedOnce] = useState<boolean>(() => {
    return localStorage.getItem('pdfButtonAnimationPlayedOnce') === 'true';
  });


  const fetchAttemptedRef = useRef(false);

  useEffect(() => {
    if (adminGithubPat) {
      localStorage.setItem('githubPat', adminGithubPat);
    } else {
      localStorage.removeItem('githubPat');
    }
  }, [adminGithubPat]);
  
  useEffect(() => {
    // Scroll to top when key views change
    if (currentAppView === 'UserQuiz' || currentAppView === 'QuizSelection') {
      window.scrollTo(0, 0);
    }
  }, [currentAppView]);


  const processLoadedData = (loadedData: any, source: 'remote' | 'local') => {
    if (loadedData && typeof loadedData === 'object' && !Array.isArray(loadedData)) {
        if (Array.isArray(loadedData.subjects)) {
            setSubjects(loadedData.subjects);
        } else {
            console.warn(`Loaded ${source} data object does not contain a 'subjects' array. Initializing with empty subjects.`);
            setSubjects([]);
        }
        if (typeof loadedData.lastUpdated === 'string') {
            setDataTimestamp(loadedData.lastUpdated);
        } else {
            setDataTimestamp(null);
            if (loadedData.lastUpdated !== undefined) {
                console.warn(`Loaded ${source} 'lastUpdated' field found but is not a string. Timestamp will not be set.`);
            }
        }
    } else if (Array.isArray(loadedData)) { // Backward compatibility
        setSubjects(loadedData as Subject[]);
        setDataTimestamp(null);
        console.log(`Loaded ${source} data is in old array format. No timestamp available from data.json.`);
    } else {
        console.warn(`Loaded ${source} data.json is not in the expected array or {lastUpdated, subjects} object format. Initializing with empty data.`);
        setSubjects([]);
        setDataTimestamp(null);
    }
  };


  const loadLocalDataFallback = useCallback(async (contextMessage?: string) => {
    console.warn(contextMessage || "Falling back to local data.json.");
    try {
      const localDataPath = './data.json';
      const cacheBustedLocalDataPath = `${localDataPath}?_cb_local=${Date.now().toString()}`;

      const response = await fetch(cacheBustedLocalDataPath, { cache: 'no-cache' });
      if (!response.ok) {
        if (response.status === 404) {
          console.warn("Local data.json not found, initializing with empty subjects array.");
          setSubjects([]);
          setDataTimestamp(null);
        } else {
          const errorText = await response.text();
          console.error(`Failed to fetch local data.json: ${response.status} ${response.statusText}. Response: ${errorText}`);
          setSubjects([]);
          setDataTimestamp(null);
        }
      } else {
        const loadedData = await response.json();
        processLoadedData(loadedData, 'local');
        console.log("Successfully processed local data.json");
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error loading or parsing local data.json: Name: ${error.name}, Message: ${error.message}. Stack: ${error.stack}`);
      } else {
        console.error("Error loading or parsing local data.json (non-Error object):", error);
      }
      setSubjects([]);
      setDataTimestamp(null);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (fetchAttemptedRef.current) {
        console.log("Data fetch already attempted for this component instance. Skipping.");
        return;
      }
      fetchAttemptedRef.current = true;

      setIsLoadingData(true);
      setDataLoadMessage("Gathering all the necessary app information, please hold on a moment...");
      const baseUrl = await getFetchableGitHubContentUrl(AppConfig.GITHUB_DATA_URL);

      if (baseUrl) {
        console.info(`Attempting to fetch data from: ${baseUrl}`);
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

          let loadedData;
          if (useTextParsing) {
            const rawJsonString = await response.text();
            loadedData = JSON.parse(rawJsonString);
          } else {
            loadedData = await response.json();
          }
          processLoadedData(loadedData, 'remote');
          console.log("Successfully processed data from remote source");

        } catch (error) {
           if (error instanceof Error) {
            console.error(`Error fetching or parsing data from (${baseUrl}). Type: ${error.name}, Message: ${error.message}. Stack: ${error.stack}`);
          } else {
            console.error(`Error fetching or parsing data from (${baseUrl}). Caught non-Error object:`, error);
          }
          await loadLocalDataFallback(`Failed to load from remote source (${baseUrl}).`);
        } finally {
          setIsLoadingData(false);
          setDataLoadMessage(null); 
        }
      } else {
        console.info("No remote GITHUB_DATA_URL configured, URL is invalid/placeholder, or processing error prevented getting a usable URL.");
        await loadLocalDataFallback("No remote data URL usable or remote fetch failed.");
        setIsLoadingData(false);
        setDataLoadMessage(null);
      }
    };
    fetchData();
  }, [loadLocalDataFallback]);


  const resetUserQuizState = () => {
    setUserCurrentQuestionIndex(0);
    setCurrentUserSelectionAttempt(null);
    setUserAnswers([]);
    setUserQuizComplete(false);
    // UserCorrectionMode and UserQuestionDisplayMode are persisted, not reset here.
  };
  
  const handleSwitchToAdminView = () => {
    setCurrentAppView('AdminPanel');
    setSelectedSubjectForUser(null);
    setSelectedQuizForUser(null);
    resetUserQuizState();
    setIsPdfAnimationActive(false);

    if (isAdminAuthenticated) { 
        localStorage.setItem('wasAdminViewBeforeRefresh', 'true');
    } else { 
        setShowAdminLoginModal(true);
    }
  };

  const handleSwitchToUserView = () => { // Switches to Subject Selection from Admin
    setCurrentAppView('SubjectSelection');
    localStorage.removeItem('wasAdminViewBeforeRefresh');
    setActiveSubjectIdForAdminState(null);
    setActiveQuizIdForAdminState(null);
    setEditingQuestion(null);
    setIsPdfAnimationActive(false); 
  };


  const handleAdminLogin = (password: string) => {
    if (password === ADMIN_PASSWORD) {
      setIsAdminAuthenticated(true);
      localStorage.setItem('isAdminAuthenticated', 'true');
      setCurrentAppView('AdminPanel'); 
      localStorage.setItem('wasAdminViewBeforeRefresh', 'true');
      setShowAdminLoginModal(false);
      setAdminLoginError(null);
    } else {
      setAdminLoginError("Incorrect password. Please try again.");
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem('isAdminAuthenticated');
    setCurrentAppView('SubjectSelection');
    localStorage.removeItem('wasAdminViewBeforeRefresh');
    setActiveSubjectIdForAdminState(null);
    setActiveQuizIdForAdminState(null);
    setEditingQuestion(null);
    setIsPdfAnimationActive(false);
  };

  const handleCloseAdminLoginModal = () => {
    setShowAdminLoginModal(false);
    setAdminLoginError(null);
    if (!isAdminAuthenticated) {
      setCurrentAppView('SubjectSelection');
      localStorage.removeItem('wasAdminViewBeforeRefresh');
      setIsPdfAnimationActive(false);
    }
  };

  const handleToggleTimestampModal = () => {
    setShowTimestampModal(prev => !prev);
  };

  const handleSetUserCorrectionMode = (mode: UserCorrectionMode) => {
    setUserCorrectionMode(mode);
    // Modal closure handled by handleSetUserQuestionDisplayMode or if only one pref set
  };

  const handleSetUserQuestionDisplayMode = (mode: UserQuestionDisplayMode) => {
    setUserQuestionDisplayMode(mode);
    setShowQuizPrefsModal(false); // Close modal after setting display mode
  };


  const handleToggleQuizPrefsModal = () => {
    setShowQuizPrefsModal(prev => !prev);
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
    setSubjects(prevSubjects => {
      const subjectIndex = prevSubjects.findIndex(s => s.id === id);
      if (subjectIndex === -1) return prevSubjects; 
      const newSubjects = prevSubjects.filter(s => s.id !== id);
      if (activeSubjectIdForAdmin === id) { 
        if (newSubjects.length > 0) {
          const nextActiveIndex = Math.min(subjectIndex, newSubjects.length - 1);
          setActiveSubjectIdForAdmin(newSubjects[nextActiveIndex].id); 
        } else {
          setActiveSubjectIdForAdmin(null); 
        }
      }
      return newSubjects;
    });
  };

  const handleCreateQuiz = (subjectId: string, name: string) => {
    const targetSubject = subjects.find(s => s.id === subjectId);
    if (!targetSubject) {
      alert("Error: Could not find the subject to add the quiz to. Please try again.");
      return;
    }
    if (targetSubject.quizzes.some(q => q.name.toLowerCase() === name.toLowerCase())) {
      alert(`A quiz with the name "${name}" already exists in subject "${targetSubject.name}". Please choose a different name.`);
      return; 
    }
    const newQuiz: Quiz = { id: generateId(), name, questions: [], isStartable: true };
    setSubjects(prevSubjects => 
      prevSubjects.map(s => 
        s.id === subjectId 
        ? { ...s, quizzes: [...s.quizzes, newQuiz] } 
        : s
      )
    );
    setActiveQuizIdForAdmin(newQuiz.id); 
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
    setSubjects(prevSubjects => prevSubjects.map(s => {
      if (s.id === subjectId) {
        const quizIndex = s.quizzes.findIndex(q => q.id === quizId);
        if (quizIndex === -1) return s; 
        const newQuizzes = s.quizzes.filter(q => q.id !== quizId);
        if (activeQuizIdForAdmin === quizId) { 
          if (newQuizzes.length > 0) {
            const nextActiveIndex = Math.min(quizIndex, newQuizzes.length - 1);
            setActiveQuizIdForAdmin(newQuizzes[nextActiveIndex].id);
          } else {
            setActiveQuizIdForAdmin(null); 
          }
        }
        return { ...s, quizzes: newQuizzes };
      }
      return s;
    }));
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

  const handleAddQuestion = (subjectId: string, quizId: string, questionData: Omit<Question, 'id'> & { modelAnswer?: string }) => {
    const newQuestion: Question = { 
        ...questionData, 
        id: generateId(),
        modelAnswer: questionData.modelAnswer || undefined 
    };

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
        if (!newQuestion.correctOptionId && newQuestion.options.length > 0) {
            console.warn("Could not determine correct option for new MCQ, defaulting to first option.");
            newQuestion.correctOptionId = newQuestion.options[0].id;
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
            const originalCorrectOptionData = editingQuestion?.options?.find(o => o.id === updatedQuestion.correctOptionId); 
            const correctOptTextFromOriginal = originalCorrectOptionData?.text;
            let newCorrectOpt = updatedQuestion.options.find(o => o.text === correctOptTextFromOriginal);
            if (newCorrectOpt) {
                updatedQuestion.correctOptionId = newCorrectOpt.id;
            } else {
                 const originalIndexMatch = updatedQuestion.correctOptionId.match(/^option-(\d+)$/); 
                 if (originalIndexMatch && originalIndexMatch[1]) {
                     const originalIndex = parseInt(originalIndexMatch[1], 10);
                     if (updatedQuestion.options[originalIndex]) {
                         updatedQuestion.correctOptionId = updatedQuestion.options[originalIndex].id;
                     } else {
                        console.warn("Correct option index out of bounds after update. Defaulting.");
                        updatedQuestion.correctOptionId = updatedQuestion.options.length > 0 ? updatedQuestion.options[0].id : undefined;
                     }
                 } else {
                    console.warn("Correct option ID seems invalid after update and couldn't be re-mapped by text or index. Defaulting.");
                    updatedQuestion.correctOptionId = updatedQuestion.options.length > 0 ? updatedQuestion.options[0].id : undefined;
                 }
            }
        }
        if (updatedQuestion.type === 'mcq' && updatedQuestion.options.length > 0 && !updatedQuestion.options.find(opt => opt.id === updatedQuestion.correctOptionId)) {
            console.warn("Updated MCQ question has options, but correctOptionId is invalid. Defaulting to the first option.");
            updatedQuestion.correctOptionId = updatedQuestion.options[0].id;
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

  const handleReorderQuestions = (subjectId: string, quizId: string, newQuestions: Question[]) => {
    setSubjects(prevSubjects => prevSubjects.map(subject => {
        if (subject.id === subjectId) {
            return {
                ...subject,
                quizzes: subject.quizzes.map(quiz => {
                    if (quiz.id === quizId) {
                        return { ...quiz, questions: newQuestions };
                    }
                    return quiz;
                })
            };
        }
        return subject;
    }));
  };

  const handleReorderAllQuizzesByTypeGlobal = () => {
    setSubjects(prevSubjects =>
      prevSubjects.map(subject => ({
        ...subject,
        quizzes: subject.quizzes.map(quiz => {
          const writtenQuestions = quiz.questions.filter(q => q.type === 'written');
          const mcqQuestions = quiz.questions.filter(q => q.type === 'mcq');
          return {
            ...quiz,
            questions: [...writtenQuestions, ...mcqQuestions],
          };
        }),
      }))
    );
    alert("All quizzes have been successfully reordered (Written questions first, then MCQ).");
  };


  const handleSelectSubjectForUser = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    setSelectedSubjectForUser(subject || null);
    setSelectedQuizForUser(null); 
    resetUserQuizState();
    setCurrentAppView('QuizSelection');
    setIsPdfAnimationActive(false); // Don't play when going forward
  };

  const handleSelectQuizForUser = (quizId: string) => {
    const quiz = selectedSubjectForUser?.quizzes.find(q => q.id === quizId);
    setSelectedQuizForUser(quiz || null);
    resetUserQuizState(); 
    if (quiz) {
      setUserAnswers(Array(quiz.questions.length).fill(null)); 
    }
    setCurrentAppView('UserQuiz');
  };

  const handleBackToSubjectListFromQuizList = () => {
    setSelectedSubjectForUser(null);
    setSelectedQuizForUser(null);
    resetUserQuizState();
    setCurrentAppView('SubjectSelection');
    if (!hasPdfButtonAnimationPlayedOnce) {
        setIsPdfAnimationActive(true); // Trigger animation on return only if it hasn't played globally
    }
  };

  const handleBackToQuizListFromUserView = () => {
    setSelectedQuizForUser(null);
    resetUserQuizState();
    setCurrentAppView('QuizSelection');
  };
  
  const handleRestartQuiz = () => {
    resetUserQuizState();
    if (selectedQuizForUser) {
        setUserAnswers(Array(selectedQuizForUser.questions.length).fill(null));
    }
  };

  // For 'oneByOne' display mode
  const handleUserOptionSelect = (optionId: string) => {
    setCurrentUserSelectionAttempt(optionId);
    if (selectedQuizForUser && userCorrectionMode === 'atEnd') {
      const currentQuestion = selectedQuizForUser.questions[userCurrentQuestionIndex];
      if (currentQuestion.type === 'mcq') {
        const newAnswers = [...userAnswers];
        newAnswers[userCurrentQuestionIndex] = {
          selectedOptionId: optionId,
          feedback: null, 
        };
        setUserAnswers(newAnswers);
      }
    }
  };
  
  // For 'listed' display mode
  const handleListedQuestionOptionSelect = (optionId: string, questionIndex: number) => {
    if (selectedQuizForUser) {
      const question = selectedQuizForUser.questions[questionIndex];
      if (question.type === 'mcq') {
        const newAnswers = [...userAnswers];
        let feedbackValue: UserAnswer['feedback'] = null;
        if (userCorrectionMode === 'immediate') {
          feedbackValue = optionId === question.correctOptionId ? 'Correct' : 'Incorrect';
        }
        newAnswers[questionIndex] = { selectedOptionId: optionId, feedback: feedbackValue };
        setUserAnswers(newAnswers);
      }
    }
  };


  const handleUserSubmitAnswer = () => { 
    if (selectedQuizForUser && userCorrectionMode === 'immediate' && userAnswers[userCurrentQuestionIndex] === null) {
      const currentQuestion = selectedQuizForUser.questions[userCurrentQuestionIndex];
      if (currentQuestion.type === 'mcq') {
        if (!currentUserSelectionAttempt) {
            console.warn("Submit called for MCQ without a selection attempt.");
            return; 
        }
        const feedbackText: UserAnswer['feedback'] = currentUserSelectionAttempt === currentQuestion.correctOptionId ? 'Correct' : 'Incorrect';
        
        const newAnswers = [...userAnswers];
        newAnswers[userCurrentQuestionIndex] = {
          selectedOptionId: currentUserSelectionAttempt,
          feedback: feedbackText,
        };
        setUserAnswers(newAnswers);
      }
    }
  };
  
  const handleUserNextQuestion = () => { 
    if (selectedQuizForUser) {
      const currentQuestion = selectedQuizForUser.questions[userCurrentQuestionIndex];
      
      if (userQuestionDisplayMode === 'oneByOne' && currentQuestion?.type === 'written' && userAnswers[userCurrentQuestionIndex] === null) {
        const newAnswers = [...userAnswers];
        const writtenSeenAnswer: UserAnswer = { selectedOptionId: null, feedback: 'Seen' };
        newAnswers[userCurrentQuestionIndex] = writtenSeenAnswer; 
        setUserAnswers(newAnswers);
      }
      else if (userQuestionDisplayMode === 'oneByOne' && userCorrectionMode === 'atEnd' && currentQuestion?.type === 'mcq' &&
               currentUserSelectionAttempt && userAnswers[userCurrentQuestionIndex] === null) {
        const newAnswers = [...userAnswers];
        const mcqAnswer: UserAnswer = {
          selectedOptionId: currentUserSelectionAttempt,
          feedback: null,
        };
        newAnswers[userCurrentQuestionIndex] = mcqAnswer;
        setUserAnswers(newAnswers);
      }
    }

    setCurrentUserSelectionAttempt(null); 
    const isLastQuestionInOneByOne = userQuestionDisplayMode === 'oneByOne' && selectedQuizForUser && userCurrentQuestionIndex >= selectedQuizForUser.questions.length - 1;
    const isFinishingInListedMode = userQuestionDisplayMode === 'listed';

    if (isLastQuestionInOneByOne || isFinishingInListedMode) { 
      if (userCorrectionMode === 'atEnd' && selectedQuizForUser) {
        const finalAnswers = userAnswers.map((ans, idx) => {
          if (!ans && selectedQuizForUser.questions[idx].type === 'written') {
            const writtenSeenFinalAnswer: UserAnswer = { selectedOptionId: null, feedback: 'Seen' };
            return writtenSeenFinalAnswer;
          }
          if (!ans) return null; 
          
          const question = selectedQuizForUser.questions[idx];
          if (question.type === 'mcq' && ans.selectedOptionId && ans.feedback === null) {
            const feedbackValue: 'Correct' | 'Incorrect' = ans.selectedOptionId === question.correctOptionId ? 'Correct' : 'Incorrect';
            const mcqGradedFinalAnswer: UserAnswer = {
              selectedOptionId: ans.selectedOptionId,
              feedback: feedbackValue,
            };
            return mcqGradedFinalAnswer;
          }
          return ans; 
        });
        setUserAnswers(finalAnswers);
      } else if (userCorrectionMode === 'immediate' && isFinishingInListedMode && selectedQuizForUser) {
         const finalAnswers = userAnswers.map((ans, idx) => {
            if (!ans && selectedQuizForUser.questions[idx].type === 'written') {
                const writtenSeenFinalAnswerImmediate: UserAnswer = {selectedOptionId: null, feedback: 'Seen'};
                return writtenSeenFinalAnswerImmediate;
            }
            return ans;
         });
         setUserAnswers(finalAnswers);
      }
      setUserQuizComplete(true); 
    } else if (userQuestionDisplayMode === 'oneByOne' && selectedQuizForUser && userCurrentQuestionIndex < selectedQuizForUser.questions.length - 1) {
      setUserCurrentQuestionIndex(prevIndex => prevIndex + 1);
    }
  };
  
  const handleUserPreviousQuestion = () => { 
     if (selectedQuizForUser && userCorrectionMode === 'atEnd' && userQuestionDisplayMode === 'oneByOne') {
        const currentQuestion = selectedQuizForUser.questions[userCurrentQuestionIndex];
        if (currentQuestion.type === 'mcq' && currentUserSelectionAttempt && userAnswers[userCurrentQuestionIndex] === null) {
            const newAnswers = [...userAnswers];
            const mcqAnswer: UserAnswer = {
                selectedOptionId: currentUserSelectionAttempt,
                feedback: null,
            };
            newAnswers[userCurrentQuestionIndex] = mcqAnswer;
            setUserAnswers(newAnswers);
        }
    }
    setCurrentUserSelectionAttempt(null); 
    if (userCurrentQuestionIndex > 0) {
      setUserCurrentQuestionIndex(prevIndex => prevIndex - 1);
    }
  };

  const handlePdfAnimationComplete = () => {
    setIsPdfAnimationActive(false);
    if (!hasPdfButtonAnimationPlayedOnce) {
      setHasPdfButtonAnimationPlayedOnce(true);
      localStorage.setItem('pdfButtonAnimationPlayedOnce', 'true');
    }
  };

  const activeAdminSubject = subjects.find(s => s.id === activeSubjectIdForAdmin);
  const activeAdminQuiz = activeAdminSubject?.quizzes.find(q => q.id === activeQuizIdForAdmin);
  
  let contextTitle = APP_NAME;
  const isAdminPanelActive = currentAppView === 'AdminPanel' && isAdminAuthenticated;

  if (isAdminPanelActive) {
    contextTitle = activeAdminQuiz
      ? `Admin: ${activeAdminSubject?.name || 'Unknown Subject'} > ${activeAdminQuiz.name}`
      : activeAdminSubject
        ? `Admin: ${activeAdminSubject.name}`
        : "Admin: Subject Management";
  } else if (currentAppView === 'UserQuiz' && selectedQuizForUser) {
    contextTitle = `${selectedSubjectForUser?.name || 'Quiz'}: ${selectedQuizForUser.name}`;
  } else if (currentAppView === 'QuizSelection' && selectedSubjectForUser) {
    contextTitle = `${selectedSubjectForUser.name}: Select Quiz`;
  } else { // SubjectSelection or default
    contextTitle = APP_NAME; 
  }


  if (isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg-primary)] p-4 text-center">
        <div 
          className="h-20 w-20 rounded-full flex items-center justify-center bg-[var(--text-primary)] mb-6 shadow-md"
          aria-label="App Logo Q"
        >
          <span 
            className="text-[var(--bg-primary)] font-bold text-4xl select-none" 
            style={{ fontFamily: 'Roboto, sans-serif' }}
          >
            Q
          </span>
        </div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">
          Loading Application Data
        </h1>
        <div className="flex space-x-2">
            <div className="w-3 h-3 bg-[var(--text-secondary)] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-3 h-3 bg-[var(--text-secondary)] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-3 h-3 bg-[var(--text-secondary)] rounded-full animate-bounce"></div>
        </div>
        {dataLoadMessage && (
          <p className="text-[var(--text-secondary)] text-sm mt-3">{dataLoadMessage}</p>
        )}
      </div>
    );
  }

  const isQuizTakingFlowActive = currentAppView === 'UserQuiz' || currentAppView === 'QuizSelection';
  const mainContentClasses = `flex-grow p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto ${isQuizTakingFlowActive ? "pt-4 sm:pt-6" : "pt-2 sm:pt-3"}`;

  const renderCurrentView = () => {
    switch (currentAppView) {
      case 'AdminPanel':
        if (isAdminAuthenticated) {
          return (
            <AdminView
              subjects={subjects}
              allSubjectsData={subjects}
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
              onReorderAllQuizzesByTypeGlobal={handleReorderAllQuizzesByTypeGlobal}
              maxOptions={MAX_OPTIONS}
              showManageSubjectsSection={showManageSubjectsSection}
              setShowManageSubjectsSection={setShowManageSubjectsSection}
              showManageQuizzesSection={showManageQuizzesSection}
              setShowManageQuizzesSection={setShowManageQuizzesSection}
              activeAdminSubject={activeAdminSubject}
              activeAdminQuiz={activeAdminQuiz}
              githubPat={adminGithubPat}
              setGithubPat={setAdminGithubPat}
            />
          );
        }
        return <SubjectSelectionView 
                  subjects={subjects} 
                  onSelectSubject={handleSelectSubjectForUser} 
                  playAnimation={isPdfAnimationActive && !hasPdfButtonAnimationPlayedOnce}
                  onAnimationComplete={handlePdfAnimationComplete}
                />;
      
      case 'UserQuiz':
        if (selectedQuizForUser) {
          return (
            <UserView
              quiz={selectedQuizForUser}
              currentQuestionIndex={userCurrentQuestionIndex}
              userAnswers={userAnswers}
              currentUserSelectionAttempt={currentUserSelectionAttempt}
              isQuizComplete={userQuizComplete}
              onOptionSelect={handleUserOptionSelect} // For oneByOne mode
              onListedOptionSelect={handleListedQuestionOptionSelect} // For listed mode
              onSubmitAnswer={handleUserSubmitAnswer} // For oneByOne immediate mode
              onNextQuestion={handleUserNextQuestion} // For oneByOne navigation and finishing quiz
              onPreviousQuestion={handleUserPreviousQuestion} // For oneByOne navigation
              onBackToQuizList={handleBackToQuizListFromUserView}
              onRestartQuiz={handleRestartQuiz}
              userCorrectionMode={userCorrectionMode}
              userQuestionDisplayMode={userQuestionDisplayMode}
              onTogglePrefsModal={handleToggleQuizPrefsModal}
            />
          );
        }
        setCurrentAppView('QuizSelection'); 
        return null; 

      case 'QuizSelection':
        if (selectedSubjectForUser) {
          return (
            <QuizSelectionView
              subject={selectedSubjectForUser}
              onSelectQuiz={handleSelectQuizForUser}
              onBackToSubjectList={handleBackToSubjectListFromQuizList}
            />
          );
        }
        setCurrentAppView('SubjectSelection');
        return null;

      case 'SubjectSelection':
      default:
        return <SubjectSelectionView 
                subjects={subjects} 
                onSelectSubject={handleSelectSubjectForUser} 
                playAnimation={isPdfAnimationActive && !hasPdfButtonAnimationPlayedOnce}
                onAnimationComplete={handlePdfAnimationComplete}
              />;
    }
  };


  return (
    <>
      <Header 
        contextTitle={contextTitle} 
        isAdminView={isAdminPanelActive}
        isAdminAuthenticated={isAdminAuthenticated}
        currentAppViewMode={currentAppView}
        onSwitchToAdminView={handleSwitchToAdminView}
        onSwitchToUserView={handleSwitchToUserView}
        onAdminLogout={handleAdminLogout}
        dataTimestamp={dataTimestamp}
        onShowTimestampModal={handleToggleTimestampModal}
      />
      <main className={mainContentClasses}>
        {renderCurrentView()}
      </main>
      <Footer appName={APP_NAME} />
      {showAdminLoginModal && (
        <AdminLoginModal
          onLogin={handleAdminLogin}
          onClose={handleCloseAdminLoginModal}
          error={adminLoginError}
        />
      )}
      {showTimestampModal && dataTimestamp && (
        <TimestampModal
          isOpen={showTimestampModal}
          onClose={handleToggleTimestampModal}
          timestamp={dataTimestamp}
        />
      )}
      {showQuizPrefsModal && (
        <QuizPreferencesModal
          isOpen={showQuizPrefsModal}
          onClose={handleToggleQuizPrefsModal}
          currentCorrectionMode={userCorrectionMode}
          onSetCorrectionMode={handleSetUserCorrectionMode}
          currentQuestionDisplayMode={userQuestionDisplayMode}
          onSetQuestionDisplayMode={handleSetUserQuestionDisplayMode}
        />
      )}
      <div 
        className={`pdf-animation-overlay ${isPdfAnimationActive && !hasPdfButtonAnimationPlayedOnce ? 'visible' : ''}`}
        aria-hidden={!(isPdfAnimationActive && !hasPdfButtonAnimationPlayedOnce)}
      ></div>
    </>
  );
};

export default App;
