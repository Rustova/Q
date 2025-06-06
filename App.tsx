
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header.tsx';
import Footer from './components/Footer.tsx';
import AdminLoginModal from './components/AdminLoginModal.tsx';
import SubjectSelectionView from './components/SubjectSelectionView.tsx';
import QuizSelectionView from './components/QuizSelectionView.tsx';
import UserView from './components/UserView.tsx';
import AdminView from './components/AdminView.tsx';
import AppConfig, { PLACEHOLDER_GOOGLE_CLIENT_ID } from './config.ts';

// --- Constants ---
const ADMIN_PASSWORD = "e2c841f407";
const APP_NAME = "Q";
const MAX_OPTIONS = 5;

// --- Retry Logic Configuration ---
// This might still be useful for other fetch calls, or for Drive API calls if wrapped.
const MAX_FETCH_RETRIES = 2; 
const INITIAL_RETRY_DELAY_MS = 1000;


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

// Helper function for fetch with retry (kept for potential future use or wrapping Drive API calls)
async function fetchWithRetry(url: string, options: RequestInit): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= MAX_FETCH_RETRIES; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) {
        return response;
      }
      lastError = new Error(`Server error (status ${response.status}) on attempt ${attempt + 1} for ${options.method || 'GET'} ${url}.`);
      if (attempt === MAX_FETCH_RETRIES) {
        console.warn(`${lastError.message} No more retries.`);
        return response;
      }
      await response.text(); 
      console.warn(`${lastError.message} Will retry.`);

    } catch (error) { 
      lastError = error as Error;
      console.warn(`Fetch attempt ${attempt + 1} for ${options.method || 'GET'} ${url} failed: ${lastError.message}.`);
      if (attempt === MAX_FETCH_RETRIES) {
        console.error(`All ${MAX_FETCH_RETRIES + 1} fetch attempts failed for ${options.method || 'GET'} ${url}. Last error:`, lastError);
        throw lastError; 
      }
    }
    const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
    console.log(`Waiting ${delay}ms before next retry... (Attempt ${attempt + 2}/${MAX_FETCH_RETRIES + 1})`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  throw lastError || new Error(`All fetch attempts for ${url} failed after ${MAX_FETCH_RETRIES + 1} attempts.`);
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
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  
  // TODO: Add state for Google Sign-In status (e.g., isSignedIn, gapiReady, gisReady)


  // User quiz taking state
  const [userCurrentQuestionIndex, setUserCurrentQuestionIndex] = useState(0);
  const [userSelectedOptionId, setUserSelectedOptionId] = useState<string | null>(null);
  const [userFeedback, setUserFeedback] = useState<string | null>(null); 
  const [userIsSubmitted, setUserIsSubmitted] = useState(false);
  const [userQuizComplete, setUserQuizComplete] = useState(false);

  // Admin view collapsible sections
  const [showManageSubjectsSection, setShowManageSubjectsSection] = useState(true);
  const [showManageQuizzesSection, setShowManageQuizzesSection] = useState(true);

  const loadLocalDataFallback = useCallback(async (errorMessage?: string) => {
    if (errorMessage) {
        setSaveMessage(prev => prev ? `${prev}\n${errorMessage}` : errorMessage);
    }
    console.warn(errorMessage || "Falling back to local data.json.");
    try {
      const response = await fetch('./data.json');
      if (!response.ok) {
        if (response.status === 404) {
          console.warn("Local data.json not found, initializing with empty subjects array.");
          setSubjects([]);
        } else {
          throw new Error(`Failed to fetch local data.json: ${response.statusText}`);
        }
      } else {
        const data = await response.json();
        setSubjects(Array.isArray(data) ? data : []);
         if (errorMessage && !errorMessage.includes("Loaded local fallback successfully.")) {
            setSaveMessage(prev => `${prev} Loaded local fallback data successfully.`);
         } else if (!errorMessage) {
            setSaveMessage("Loaded local fallback data successfully.");
         }
      }
    } catch (error) {
      console.error("Error loading subjects from local data.json fallback:", error);
      setSubjects([]);
      if (errorMessage) {
        setSaveMessage(prev => `${prev}\nFailed to load local fallback data: ${(error as Error).message}. Initializing with empty data.`);
      } else {
        setSaveMessage(`Failed to load local fallback data: ${(error as Error).message}. Initializing with empty data.`);
      }
    }
  }, []);


  const loadDataFromCloud = useCallback(async () => {
    setIsLoadingData(true);
    setSaveMessage(null); 

    // TODO: Implement Google Drive API load logic here
    // 0. Initialize gapi client and Google Identity Services (GIS). Handle sign-in.
    //    This typically involves:
    //    - Loading 'client:auth2' for gapi, or using GIS token client.
    //    - Initializing with your GOOGLE_CLIENT_ID.
    //    - Prompting user to sign in if not already, and request 'https://www.googleapis.com/auth/drive.file' scope.
    //
    // 1. Check if user is signed in and token is available.
    //    If not, display message to sign in or handle accordingly.
    //
    // 2. If signed in, use gapi.client.drive.files.get() to fetch the file:
    //    try {
    //      const response = await gapi.client.drive.files.get({
    //        fileId: AppConfig.GOOGLE_DRIVE_FILE_ID,
    //        alt: 'media',
    //      });
    //      const data = response.result; // This should be your JSON object/array
    //      if (Array.isArray(data)) { // Or check structure specific to your data.json
    //        setSubjects(data);
    //        // setSaveMessage("Data loaded from Google Drive successfully.");
    //      } else {
    //        throw new Error('Invalid data structure from Google Drive.');
    //      }
    //    } catch (error) {
    //      console.error("Failed to load data from Google Drive:", error);
    //      let detailedErrorMessage = `Error loading from Google Drive: ${(error as any).result?.error?.message || (error as Error).message}.`;
    //      // Handle specific errors like 401 (unauthenticated), 403 (forbidden/scope issue), 404 (file not found)
    //      loadLocalDataFallback(detailedErrorMessage);
    //    } finally {
    //      setIsLoadingData(false);
    //    }
    //
    // For now, this function will just use the fallback as Drive integration is not complete.
    console.warn("Google Drive loadDataFromCloud: Not yet implemented. Falling back to local data.");
    loadLocalDataFallback("Google Drive loading is not yet implemented. Using local fallback.");
    setIsLoadingData(false);

    /* Old Apps Script Logic (commented out):
    try {
      const response = await fetchWithRetry(AppConfig.APPS_SCRIPT_WEB_APP_URL, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json', 
        },
        mode: 'cors', 
        cache: 'no-cache', 
      });

      if (!response.ok) {
        let errorBodyText = "Could not retrieve error details from server.";
        try {
            errorBodyText = await response.text(); 
        } catch (textError) {
            console.warn("Could not read error response body:", textError);
        }
        throw new Error(`Cloud fetch error: ${response.status} ${response.statusText}. Server response: ${errorBodyText.substring(0, 200)}. Ensure Apps Script is deployed for 'Anyone' and URL in config.ts is correct.`);
      }
      
      const data = await response.json();
      if (data.success && Array.isArray(data.payload)) {
        setSubjects(data.payload);
      } else {
        throw new Error(data.message || 'Invalid data structure from cloud. Check Apps Script response.');
      }
    } catch (error) {
      console.error("Failed to load data from cloud (after retries if applicable):", error);
      let detailedErrorMessage = `Error loading from cloud: ${(error as Error).message}.`;
      const lowerCaseErrorMessage = (error as Error).message.toLowerCase();
      
      if (lowerCaseErrorMessage.includes('failed to fetch') || lowerCaseErrorMessage.includes('load failed') || lowerCaseErrorMessage.includes('networkerror') || lowerCaseErrorMessage.includes('all fetch attempts failed')) {
        detailedErrorMessage += "\n\nThis often means:\n1. Internet connectivity issue.\n2. Google Apps Script URL in config.ts is incorrect or the script is not deployed correctly (specifically, 'Who has access' must be set to 'Anyone').\n3. A browser extension (e.g., ad blocker, privacy tool) is blocking the request.\n4. CORS policy issue (less likely if Apps Script is correctly deployed for 'Anyone' access).\n\nPlease check your Google Apps Script deployment settings and the browser's Network Tab (in developer tools) for more details on the failed request.";
      } else if (lowerCaseErrorMessage.includes('json')) {
         detailedErrorMessage += "\n\nThe cloud script might have returned non-JSON data (e.g. an HTML error page). Check the Apps Script logs and ensure it returns valid JSON."
      }
      loadLocalDataFallback(detailedErrorMessage);
    } finally {
      setIsLoadingData(false);
    }
    */
  }, [loadLocalDataFallback]);

  useEffect(() => {
    // This effect now checks for Google Client ID placeholder
    if (AppConfig.GOOGLE_CLIENT_ID === PLACEHOLDER_GOOGLE_CLIENT_ID) {
      setIsLoadingData(true);
      const missingConfigMessage = "Admin: Google Drive integration is not fully configured. Please set 'GOOGLE_CLIENT_ID' in config.ts after obtaining it from Google Cloud Console. Cloud features will be limited. Using local data only.";
      
      console.warn(missingConfigMessage.replace("Admin: ", ""));
      setSaveMessage(missingConfigMessage);
      loadLocalDataFallback().finally(() => setIsLoadingData(false));
    } else {
      // TODO: Initialize Google API client and GIS here, then call loadDataFromCloud
      // Example (conceptual, needs proper gapi/gis loading and error handling):
      // window.gapi.load('client:auth2', () => {
      //   window.gapi.client.init({
      //     clientId: AppConfig.GOOGLE_CLIENT_ID,
      //     scope: 'https://www.googleapis.com/auth/drive.file',
      //     discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
      //   }).then(() => {
      //     // Check sign-in state, prompt if necessary
      //     // Then loadDataFromCloud();
      //     console.log("Google API client initialized (conceptual). Implement sign-in and then call loadDataFromCloud.");
           loadDataFromCloud(); // Temporarily call directly, real call should be after gapi/gis init & sign-in
      //   }).catch(error => {
      //     console.error("Error initializing Google API client:", error);
      //     setSaveMessage("Error initializing Google API client. Cloud features disabled. Using local data.");
      //     loadLocalDataFallback().finally(() => setIsLoadingData(false));
      //   });
      // });
      console.warn("Google Client ID is set, but full GAPI/GIS initialization and sign-in flow are required before calling loadDataFromCloud. Proceeding with current non-functional cloud load.");
      loadDataFromCloud(); // Placeholder call
    }
  }, [loadDataFromCloud, loadLocalDataFallback]);


  const handleSaveChangesToCloud = async (currentSubjects: Subject[]) => {
    if (AppConfig.GOOGLE_CLIENT_ID === PLACEHOLDER_GOOGLE_CLIENT_ID) {
      const errorMessage = "Google Drive Save Error: Configuration incomplete. 'GOOGLE_CLIENT_ID' is a placeholder in config.ts. Please update it and implement Google Sign-In and Drive API calls.";
      setSaveMessage(errorMessage);
      setIsSaving(false);
      return;
    }
    setIsSaving(true);
    setSaveMessage("Saving changes to Google Drive (Not Yet Implemented)...");

    // TODO: Implement Google Drive API save logic here
    // 0. Ensure gapi client is initialized and user is signed in.
    // 1. Convert currentSubjects to a JSON string.
    //    const jsonData = JSON.stringify(currentSubjects, null, 2); // Pretty print for readability in Drive
    //
    // 2. Use gapi.client.drive.files.update() to upload the new content.
    //    This requires a multipart request if you're just updating content.
    //    Or use the simpler media upload:
    //    try {
    //       const boundary = '-------314159265358979323846'; // Or generate one
    //       const delimiter = "\r\n--" + boundary + "\r\n";
    //       const close_delim = "\r\n--" + boundary + "--";
    //       const metadata = {
    //         'mimeType': 'application/json'
    //       };
    //       const base64Data = btoa(unescape(encodeURIComponent(jsonData))); // Ensure correct encoding for binary
    //       
    //       let multipartRequestBody =
    //           delimiter +
    //           'Content-Type: application/json\r\n\r\n' +
    //           JSON.stringify(metadata) +
    //           delimiter +
    //           'Content-Type: application/json\r\n' +
    //           // 'Content-Transfer-Encoding: base64\r\n' + // Only if sending base64 string directly
    //           '\r\n' +
    //           jsonData + // Sending raw JSON string
    //           close_delim;

    //      const response = await gapi.client.request({
    //        'path': `/upload/drive/v3/files/${AppConfig.GOOGLE_DRIVE_FILE_ID}`,
    //        'method': 'PATCH', // or 'PUT' if replacing entirely
    //        'params': {'uploadType': 'multipart'},
    //        'headers': {
    //          'Content-Type': 'multipart/related; boundary="' + boundary + '"'
    //        },
    //        'body': multipartRequestBody});
    //
    //      setSubjects(currentSubjects); 
    //      setSaveMessage("Changes saved to Google Drive successfully!");
    //    } catch (error) {
    //      console.error("Error saving data to Google Drive:", error);
    //      let detailedSaveErrorMessage = `Google Drive Save Error: ${(error as any).result?.error?.message || (error as Error).message}.`;
    //      setSaveMessage(detailedSaveErrorMessage);
    //    } finally {
    //      setIsSaving(false);
    //    }
    //
    // For now, this is a placeholder
    console.warn("Google Drive handleSaveChangesToCloud: Not yet implemented.");
    setTimeout(() => {
        setSaveMessage("Google Drive saving is not yet implemented. Data not saved to cloud.");
        setIsSaving(false);
    }, 1500);


    /* Old Apps Script Logic (commented out):
    setIsSaving(true);
    setSaveMessage("Saving changes to cloud...");
    try {
      const response = await fetchWithRetry(AppConfig.APPS_SCRIPT_WEB_APP_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Data-Api-Key': AppConfig.PUBLIC_API_KEY,
        },
        body: JSON.stringify({ subjects: currentSubjects }),
        mode: 'cors', 
      });

      let resultText = await response.text(); 
      let result;
      try {
        result = JSON.parse(resultText); 
      } catch (e) {
        console.error("Failed to parse server response as JSON. Raw response:", resultText);
        let specificError = `Server returned non-JSON response (Status: ${response.status}). This might be an HTML error page from Apps Script (e.g. if API key is wrong or script error). Check console for raw response.`;
        if(!response.ok) {
           specificError = `Server error (Status: ${response.status}) and returned non-JSON response. Raw: ${resultText.substring(0,200)}`;
        }
        throw new Error(specificError);
      }

      if (!response.ok) {
        throw new Error(result.message || `Server error: ${response.status}. ${resultText.substring(0,200)}`);
      }
      
      if (result.success) {
        setSubjects(currentSubjects); 
        setSaveMessage("Changes saved to cloud successfully!");
      } else {
        throw new Error(result.message || "Unknown error from cloud save operation. Check Apps Script logs.");
      }
    } catch (error) {
      console.error("Error saving data to cloud (after retries if applicable):", error);
      let detailedSaveErrorMessage = `Cloud Save Error: ${(error as Error).message}`;
      const lowerCaseErrorMessage = (error as Error).message.toLowerCase();
      if (lowerCaseErrorMessage.includes('failed to fetch') || lowerCaseErrorMessage.includes('load failed') || lowerCaseErrorMessage.includes('networkerror') || lowerCaseErrorMessage.includes('all fetch attempts failed')) {
         detailedSaveErrorMessage += "\n\nCheck internet, Apps Script URL (in config.ts), deployment, and API Key (in config.ts). Also, ensure the Apps Script can handle POST requests and CORS for POST.";
      }
      setSaveMessage(detailedSaveErrorMessage);
    } finally {
      setIsSaving(false);
    }
    */
  };


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
          {saveMessage && ( 
            <div className={`mt-3 p-3 rounded-md text-sm text-center ${saveMessage.toLowerCase().includes("error") || saveMessage.toLowerCase().includes("failed") || saveMessage.toLowerCase().includes("disabled") || saveMessage.toLowerCase().includes("incomplete") ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-yellow-100 text-yellow-700 border border-yellow-300'}`}
                 role="status"
                 style={{ whiteSpace: 'pre-line', maxWidth: '400px', margin: '10px auto 0' }}
            >
                 {saveMessage}
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
            onSaveChanges={() => handleSaveChangesToCloud(subjects)}
            isSaving={isSaving}
            saveMessage={saveMessage}
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