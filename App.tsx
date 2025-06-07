

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header.tsx';
import Footer from './components/Footer.tsx';
import AdminLoginModal from './components/AdminLoginModal.tsx';
import SubjectSelectionView from './components/SubjectSelectionView.tsx';
import QuizSelectionView from './components/QuizSelectionView.tsx';
import UserView from './components/UserView.tsx';
import AdminView from './components/AdminView.tsx';
import TimestampModal from './components/TimestampModal.tsx';
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

// User Answer State
export interface UserAnswer {
  selectedOptionId: string | null;
  feedback: string | null;
}

interface AppData {
  lastUpdated: string | null;
  subjects: Subject[];
}

// --- Utility Functions ---
export function generateId() {
  return Date.now().toString() + Math.random().toString(36).substring(2, 9);
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
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
  
  const [userProvidedPat, setUserProvidedPat] = useState<string>(() => localStorage.getItem('githubPat') || '');


  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [dataTimestamp, setDataTimestamp] = useState<string | null>(null);
  const [activeSubjectIdForAdmin, setActiveSubjectIdForAdminState] = useState<string | null>(null);
  const [activeQuizIdForAdmin, setActiveQuizIdForAdminState] = useState<string | null>(null);
  const [selectedSubjectForUser, setSelectedSubjectForUser] = useState<Subject | null>(null);
  const [selectedQuizForUser, setSelectedQuizForUser] = useState<Quiz | null>(null);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [showTimestampModal, setShowTimestampModal] = useState(false); 
  const [loginError, setLoginError] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataLoadMessage, setDataLoadMessage] = useState<string | null>("Gathering all the necessary app information, please hold on a moment..."); 

  const [userCurrentQuestionIndex, setUserCurrentQuestionIndex] = useState(0);
  const [currentUserSelectionAttempt, setCurrentUserSelectionAttempt] = useState<string | null>(null); 
  const [userAnswers, setUserAnswers] = useState<Array<UserAnswer | null>>([]); 
  const [userQuizComplete, setUserQuizComplete] = useState(false);


  const [showManageSubjectsSection, setShowManageSubjectsSection] = useState(true);
  const [showManageQuizzesSection, setShowManageQuizzesSection] = useState(true);

  const fetchAttemptedRef = useRef(false);

  useEffect(() => {
    if (userProvidedPat) {
      localStorage.setItem('githubPat', userProvidedPat);
    } else {
      localStorage.removeItem('githubPat');
    }
  }, [userProvidedPat]);


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
  };
  
  const handleSwitchToAdminView = () => {
    setIsAdminView(true);
    setSelectedSubjectForUser(null);
    setSelectedQuizForUser(null);
    resetUserQuizState();

    if (isAdminAuthenticated) { 
        localStorage.setItem('wasAdminViewBeforeRefresh', 'true');
    } else { 
        setShowAdminLoginModal(true);
    }
  };

  const handleSwitchToUserView = () => {
    setIsAdminView(false);
    localStorage.removeItem('wasAdminViewBeforeRefresh');
    setActiveSubjectIdForAdminState(null);
    setActiveQuizIdForAdminState(null);
    setEditingQuestion(null);
  };


  const handleAdminLogin = (password: string) => {
    if (password === ADMIN_PASSWORD) {
      setIsAdminAuthenticated(true);
      localStorage.setItem('isAdminAuthenticated', 'true');
      setIsAdminView(true); 
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
      setIsAdminView(false); 
      localStorage.removeItem('wasAdminViewBeforeRefresh');
    }
  };

  const handleToggleTimestampModal = () => {
    setShowTimestampModal(prev => !prev);
  };

  const setActiveSubjectIdForAdmin = (id: string | null) => {
    setActiveSubjectIdForAdminState(id);
    setActiveQuizIdForAdminState(null); // Also reset active quiz when subject changes
    setEditingQuestion(null);
  };

  const setActiveQuizIdForAdmin = (id: string | null) => {
    setActiveQuizIdForAdminState(id);
    setEditingQuestion(null); // Also reset editing question when quiz changes
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
    // When deleting a subject, set the active subject to the next one or null.
    setSubjects(prevSubjects => {
      const subjectIndex = prevSubjects.findIndex(s => s.id === id);
      if (subjectIndex === -1) return prevSubjects; // Subject not found

      const newSubjects = prevSubjects.filter(s => s.id !== id);

      if (activeSubjectIdForAdmin === id) { // If the deleted subject was active
        if (newSubjects.length > 0) {
          // Select the subject at the same index, or the new last subject if the deleted one was last
          const nextActiveIndex = Math.min(subjectIndex, newSubjects.length - 1);
          setActiveSubjectIdForAdmin(newSubjects[nextActiveIndex].id); // This will also clear activeQuizId
        } else {
          setActiveSubjectIdForAdmin(null); // No subjects left, also clears activeQuizId
        }
      }
      // If deleted subject wasn't active, activeSubjectIdForAdmin remains,
      // unless it was changed by setActiveSubjectIdForAdmin(null) if list became empty.
      return newSubjects;
    });
  };

  const handleCreateQuiz = (subjectId: string, name: string) => {
    const targetSubject = subjects.find(s => s.id === subjectId);
    if (!targetSubject) {
      console.error("Subject not found for creating quiz. This should not happen if UI is correct.");
      alert("Error: Could not find the subject to add the quiz to. Please try again.");
      return;
    }

    if (targetSubject.quizzes.some(q => q.name.toLowerCase() === name.toLowerCase())) {
      alert(`A quiz with the name "${name}" already exists in subject "${targetSubject.name}". Please choose a different name.`);
      return; // Prevent quiz creation due to name conflict
    }

    const newQuiz: Quiz = { id: generateId(), name, questions: [], isStartable: true };
    
    setSubjects(prevSubjects => 
      prevSubjects.map(s => 
        s.id === subjectId 
        ? { ...s, quizzes: [...s.quizzes, newQuiz] } 
        : s
      )
    );
    // After updating subjects, set the new quiz as active
    setActiveQuizIdForAdmin(newQuiz.id); 
  };

  const handleUpdateQuizName = (subjectId: string, quizId: string, newName: string): boolean => {
    let nameConflict = false;
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        if (s.quizzes.some(q => q.name.toLowerCase() === newName.toLowerCase() && q.id !== quizId)) {
            nameConflict = true;
            return s; // Return subject unchanged to avoid partial update before alert
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
    // When deleting a quiz, set active quiz to the next one in the current subject or null.
    setSubjects(prevSubjects => prevSubjects.map(s => {
      if (s.id === subjectId) {
        const quizIndex = s.quizzes.findIndex(q => q.id === quizId);
        if (quizIndex === -1) return s; // Quiz not found in this subject

        const newQuizzes = s.quizzes.filter(q => q.id !== quizId);

        if (activeQuizIdForAdmin === quizId) { // If the deleted quiz was active
          if (newQuizzes.length > 0) {
            // Select the quiz at the same index, or the new last quiz if the deleted one was last
            const nextActiveIndex = Math.min(quizIndex, newQuizzes.length - 1);
            setActiveQuizIdForAdmin(newQuizzes[nextActiveIndex].id);
          } else {
            setActiveQuizIdForAdmin(null); // No quizzes left in this subject
          }
        }
        // If deleted quiz wasn't active, activeQuizIdForAdmin remains,
        // unless it was changed by setActiveQuizIdForAdmin(null) if list became empty.
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

  const handleAddQuestion = (subjectId: string, quizId: string, questionData: Omit<Question, 'id'>) => {
    const newQuestion: Question = { ...questionData, id: generateId() };
    if(newQuestion.type === 'mcq' && newQuestion.options) {
        newQuestion.options = newQuestion.options.map((opt, index) => ({...opt, id: `option-${generateId()}-${index}`}));

        // Try to map correctOptionId based on text if original was an index-like string
        const correctOptTextFromPayload = questionData.options?.find(o => o.id === questionData.correctOptionId)?.text;
        const newCorrectOpt = newQuestion.options.find(o => o.text === correctOptTextFromPayload);
        newQuestion.correctOptionId = newCorrectOpt ? newCorrectOpt.id : undefined;

        // Fallback for older index-based correctOptionId if text match fails
        if (!newQuestion.correctOptionId && typeof questionData.correctOptionId === 'string') {
             const originalIndexMatch = questionData.correctOptionId.match(/^option-(\d+)$/);
             if (originalIndexMatch && originalIndexMatch[1]) {
                 const originalIndex = parseInt(originalIndexMatch[1], 10);
                 if (newQuestion.options[originalIndex]) {
                     newQuestion.correctOptionId = newQuestion.options[originalIndex].id;
                 }
             }
        }
        // Ensure a correct option is set if possible, default to first if none found and options exist
        if (!newQuestion.correctOptionId && newQuestion.options.length > 0) {
            console.warn("Could not determine correct option for new MCQ, defaulting to first option.");
            newQuestion.correctOptionId = newQuestion.options[0].id;
        }

    }

    setSubjects(prev => prev.map(s => s.id === subjectId ? {
      ...s,
      quizzes: s.quizzes.map(q => q.id === quizId ? { ...q, questions: [...q.questions, newQuestion] } : q)
    } : s));
    setEditingQuestion(null); // Close form/modal if it was open for adding
  };

  const handleUpdateQuestion = (subjectId: string, quizId: string, updatedQuestion: Question) => {
     if(updatedQuestion.type === 'mcq' && updatedQuestion.options) {
        // Ensure options have unique IDs, generate if missing or not in expected format
        updatedQuestion.options = updatedQuestion.options.map((opt, index) => ({
            id: opt.id && opt.id.startsWith('option-') ? opt.id : `option-${generateId()}-${index}`,
            text: opt.text
        }));

        // Re-evaluate correctOptionId if it doesn't match any new option IDs
        // This logic tries to preserve correctness based on text if IDs changed, or original index
        if (typeof updatedQuestion.correctOptionId === 'string' && !updatedQuestion.options.find(o => o.id === updatedQuestion.correctOptionId)) {
            // Try to find based on text using the 'editingQuestion' state (original question before edits)
            const originalCorrectOptionData = editingQuestion?.options?.find(o => o.id === updatedQuestion.correctOptionId); // This was the selected correct option's data
            const correctOptTextFromOriginal = originalCorrectOptionData?.text;
            
            let newCorrectOpt = updatedQuestion.options.find(o => o.text === correctOptTextFromOriginal);

            if (newCorrectOpt) {
                updatedQuestion.correctOptionId = newCorrectOpt.id;
            } else {
                 // Fallback for older index-based correctOptionId if text match fails or original was index
                 const originalIndexMatch = updatedQuestion.correctOptionId.match(/^option-(\d+)$/); // Check if it was an old index based ID
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
        // Final check: if still no valid correctOptionId for an MCQ with options, default to first.
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
    setEditingQuestion(null); // Close form/modal after update
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
      setEditingQuestion(null); // If the deleted question was being edited, clear editing state
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

  const handleSelectSubjectForUser = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    setSelectedSubjectForUser(subject || null);
    setSelectedQuizForUser(null); // Reset quiz selection when subject changes
    resetUserQuizState();
  };

  const handleSelectQuizForUser = (quizId: string) => {
    const quiz = selectedSubjectForUser?.quizzes.find(q => q.id === quizId);
    setSelectedQuizForUser(quiz || null);
    resetUserQuizState(); 
    if (quiz) {
      setUserAnswers(Array(quiz.questions.length).fill(null)); // Initialize answers array
    }
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
  
  const handleRestartQuiz = () => {
    resetUserQuizState();
    if (selectedQuizForUser) {
        setUserAnswers(Array(selectedQuizForUser.questions.length).fill(null));
    }
  };


  const handleUserOptionSelect = (optionId: string) => {
    // Allow selection only if current question is not yet answered
    if (selectedQuizForUser && userAnswers[userCurrentQuestionIndex] === null) {
      setCurrentUserSelectionAttempt(optionId);
    }
  };

  const handleUserSubmitAnswer = () => { 
    if (selectedQuizForUser && userAnswers[userCurrentQuestionIndex] === null) {
      const currentQuestion = selectedQuizForUser.questions[userCurrentQuestionIndex];
      
      if (currentQuestion.type === 'mcq') {
        if (!currentUserSelectionAttempt) {
            // This case should ideally be prevented by disabling submit button
            console.warn("Submit called for MCQ without a selection attempt.");
            return; 
        }
        let feedbackText: string | null = null;
        if (currentUserSelectionAttempt === currentQuestion.correctOptionId) {
          feedbackText = 'Correct';
        } else {
          feedbackText = 'Incorrect';
        }
        const newAnswers = [...userAnswers];
        newAnswers[userCurrentQuestionIndex] = {
          selectedOptionId: currentUserSelectionAttempt,
          feedback: feedbackText,
        };
        setUserAnswers(newAnswers);
      }
      // For 'written' type, submission is handled implicitly by moving to next question
      // Or by a dedicated submit if that was designed (currently not)
    }
  };
  
  const handleUserNextQuestion = () => {
    // If current question is 'written' and not yet "answered" (marked as seen), mark it now
    if (selectedQuizForUser) {
      const currentQuestion = selectedQuizForUser.questions[userCurrentQuestionIndex];
      if (currentQuestion.type === 'written' && userAnswers[userCurrentQuestionIndex] === null) {
        const newAnswers = [...userAnswers];
        newAnswers[userCurrentQuestionIndex] = { selectedOptionId: null, feedback: 'Seen' }; // Mark as seen
        setUserAnswers(newAnswers);
      }
    }
    
    setCurrentUserSelectionAttempt(null); // Clear selection attempt for next question
    if (selectedQuizForUser && userCurrentQuestionIndex < selectedQuizForUser.questions.length - 1) {
      setUserCurrentQuestionIndex(prevIndex => prevIndex + 1);
    } else {
      setUserQuizComplete(true); // Reached end of quiz
    }
  };
  
  const handleUserPreviousQuestion = () => {
    setCurrentUserSelectionAttempt(null); // Clear selection attempt when moving
    if (userCurrentQuestionIndex > 0) {
      setUserCurrentQuestionIndex(prevIndex => prevIndex - 1);
    }
  };

  // Derived state for admin view context titles
  const activeAdminSubject = subjects.find(s => s.id === activeSubjectIdForAdmin);
  const activeAdminQuiz = activeAdminSubject?.quizzes.find(q => q.id === activeQuizIdForAdmin);
  
  // Contextual title for the header
  let contextTitle = APP_NAME;
  if (isAdminView) {
    contextTitle = activeAdminQuiz
      ? `Admin: ${activeAdminSubject?.name || 'Unknown Subject'} > ${activeAdminQuiz.name}`
      : activeAdminSubject
        ? `Admin: ${activeAdminSubject.name}`
        : "Admin: Subject Management";
  } else { // User view
    contextTitle = selectedQuizForUser
      ? `${selectedSubjectForUser?.name || 'Quiz'}: ${selectedQuizForUser.name}`
      : selectedSubjectForUser
        ? `${selectedSubjectForUser.name}: Select Quiz`
        : APP_NAME; // Default to App Name if no subject selected by user
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

  const isQuizTakingFlowActive = !isAdminView && (selectedSubjectForUser || selectedQuizForUser);
  const mainContentClasses = `flex-grow p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto ${isQuizTakingFlowActive ? "pt-4 sm:pt-6" : "pt-2 sm:pt-3"}`;

  return (
    <>
      <Header 
        contextTitle={contextTitle} 
        isAdminView={isAdminView}
        isAdminAuthenticated={isAdminAuthenticated}
        onSwitchToAdminView={handleSwitchToAdminView}
        onSwitchToUserView={handleSwitchToUserView}
        onAdminLogout={handleAdminLogout}
        dataTimestamp={dataTimestamp}
        onShowTimestampModal={handleToggleTimestampModal}
      />
      <main className={mainContentClasses}>
        {isAdminView && isAdminAuthenticated ? (
          <AdminView
            subjects={subjects} // Pass all subjects, AdminView can filter if needed or use active IDs
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
            activeAdminSubject={activeAdminSubject} // Pass derived active subject
            activeAdminQuiz={activeAdminQuiz}     // Pass derived active quiz
            githubPat={userProvidedPat}
            setGithubPat={setUserProvidedPat}
            allSubjectsData={subjects} // For saving all data
          />
        ) : !isAdminView ? ( // User View Logic
            selectedQuizForUser ? (
              <UserView
                quiz={selectedQuizForUser}
                currentQuestionIndex={userCurrentQuestionIndex}
                userAnswers={userAnswers}
                currentUserSelectionAttempt={currentUserSelectionAttempt}
                isQuizComplete={userQuizComplete}
                onOptionSelect={handleUserOptionSelect}
                onSubmitAnswer={handleUserSubmitAnswer}
                onNextQuestion={handleUserNextQuestion}
                onPreviousQuestion={handleUserPreviousQuestion}
                onBackToQuizList={handleBackToQuizListFromUserView}
                onRestartQuiz={handleRestartQuiz}
              />
            ) : selectedSubjectForUser ? (
              <QuizSelectionView
                subject={selectedSubjectForUser}
                onSelectQuiz={handleSelectQuizForUser}
                onBackToSubjectList={handleBackToSubjectListFromQuizList}
              />
            ) : (
              <SubjectSelectionView 
                subjects={subjects} 
                onSelectSubject={handleSelectSubjectForUser} 
              />
            )
        ) : (
           // Fallback for unexpected state (e.g. admin view but not authenticated after refresh/direct nav), show SubjectSelectionView
           // This ensures users always see something functional.
           <SubjectSelectionView 
             subjects={subjects} 
             onSelectSubject={handleSelectSubjectForUser} 
           />
        )}
      </main>
      <Footer appName={APP_NAME} />
      {showAdminLoginModal && (
        <AdminLoginModal
          onLogin={handleAdminLogin}
          onClose={handleCloseAdminLoginModal}
          error={loginError}
        />
      )}
      {showTimestampModal && dataTimestamp && (
        <TimestampModal
          isOpen={showTimestampModal}
          onClose={handleToggleTimestampModal}
          timestamp={dataTimestamp}
        />
      )}
    </>
  );
};

export default App;
