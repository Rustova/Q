

import React, { useState, ChangeEvent, useEffect, useCallback } from 'react';
import type { Subject, Quiz, Question } from '../App.tsx';
import QuestionForm from './QuestionForm.tsx';
import AdminQuestionListItem from './AdminQuestionListItem.tsx';
import HoldToDeleteButton from './HoldToDeleteButton.tsx'; // Re-enabled
import ConfirmationModal from './ConfirmationModal.tsx'; 
import AppConfig, { PLACEHOLDER_GITHUB_DATA_URL, PLACEHOLDER_APPS_SCRIPT_PAT_URL, PLACEHOLDER_APPS_SCRIPT_SECRET } from '../config.ts';
import EditQuestionModal from './EditQuestionModal.tsx';
import ReorderQuestionsModal from './ReorderQuestionsModal.tsx';
import TypewriterText from './TypewriterText.tsx';

// Theme-aware classes using CSS Variables
const inputClass = "w-full p-3 border rounded-md focus:ring-2 placeholder-[var(--placeholder-color)] bg-[var(--input-bg)] text-[var(--input-text)] border-[var(--input-border)] focus:border-[var(--input-focus-ring)] focus:ring-[var(--input-focus-ring)]";
const selectClass = "w-full p-3 border rounded-md focus:ring-2 bg-[var(--input-bg)] text-[var(--input-text)] border-[var(--input-border)] focus:border-[var(--input-focus-ring)] focus:ring-[var(--input-focus-ring)]";
const buttonPrimaryClass = "px-4 py-2 bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover-bg)] text-[var(--btn-primary-text)] rounded-md transition-colors flex items-center justify-center space-x-1.5 text-sm whitespace-nowrap shrink-0 focus:outline-none focus:ring-2 focus:ring-[var(--btn-primary-focus-ring)]";
const buttonSecondaryClass = "px-4 py-2 bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover-bg)] text-[var(--btn-secondary-text)] rounded-md transition-colors flex items-center justify-center space-x-1.5 text-sm whitespace-nowrap shrink-0 focus:outline-none focus:ring-2 focus:ring-[var(--btn-secondary-focus-ring)]";
const buttonRedClass = "px-4 py-2 bg-[var(--accent-red)] hover:bg-[var(--accent-red-hover)] text-white rounded-md transition-colors flex items-center justify-center space-x-1.5 text-sm whitespace-nowrap shrink-0 focus:outline-none focus:ring-2 focus:ring-[var(--accent-red)]";
const buttonGreenClass = "px-4 py-2 bg-[var(--accent-green)] hover:bg-[var(--accent-green-hover)] text-white rounded-md transition-colors flex items-center justify-center space-x-1.5 text-sm whitespace-nowrap shrink-0 focus:outline-none focus:ring-2 focus:ring-[var(--accent-green)] focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)]";
const buttonWarningClass = "px-4 py-2 bg-[var(--accent-amber)] hover:bg-[var(--accent-amber-hover)] text-[var(--btn-amber-text)] rounded-md transition-colors text-sm whitespace-nowrap shrink-0";
const labelClass = "block text-sm font-medium text-[var(--text-secondary)] mb-1";
const sectionBaseClass = "bg-[var(--bg-secondary)] p-4 sm:p-6 rounded-lg shadow-lg border border-[var(--border-color)]";

const ADMIN_ACTION_PASSWORD = "a7f39d5b1c"; // Password for critical admin actions

interface GitHubRepoInfo {
  owner: string;
  repo: string;
  branch: string;
  path: string;
}

interface AppDataToSave {
  lastUpdated: string;
  subjects: Subject[];
}

const parseGitHubUrl = (url: string): GitHubRepoInfo | null => {
  if (!url) {
    console.error('GitHub URL is null or empty.');
    return null;
  }
  try {
    const urlObj = new URL(url);

    if (urlObj.hostname === 'raw.githubusercontent.com') {
      const pathSegments = urlObj.pathname.split('/').filter(Boolean);
      if (pathSegments.length < 4) {
        console.error('Invalid GitHub Raw URL: Path too short. Expected owner/repo/branch/path... Given:', url);
        return null;
      }
      return {
        owner: pathSegments[0],
        repo: pathSegments[1],
        branch: pathSegments[2],
        path: pathSegments.slice(3).join('/'),
      };
    }

    if (urlObj.hostname === 'github.com') {
      const blobPattern = /^\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+)$/;
      const blobMatch = urlObj.pathname.match(blobPattern);

      if (blobMatch) {
        const [, owner, repo, branch, path] = blobMatch;
        return {
          owner,
          repo,
          branch,
          path: path.replace(/\?.*$/, ""),
        };
      }
    }
    // Check for API URL structure
    if (urlObj.hostname === 'api.github.com' && urlObj.pathname.startsWith('/repos/')) {
        const pathSegments = urlObj.pathname.split('/').filter(Boolean);
        // /repos/{owner}/{repo}/contents/{path}
        if (pathSegments.length >= 5 && pathSegments[0] === 'repos' && pathSegments[3] === 'contents') {
            const queryParams = new URLSearchParams(urlObj.search);
            const ref = queryParams.get('ref') || 'main'; // Default to main if no ref

            return {
                owner: pathSegments[1],
                repo: pathSegments[2],
                branch: ref,
                path: pathSegments.slice(4).join('/'),
            };
        }
    }


    console.warn(`URL (${url}) is not a recognized GitHub raw, blob, or API URL for saving. Saving via GitHub API might fail.`);
    return null;
  } catch (error) {
    console.error('Error parsing GitHub URL for saving:', url, error);
    return null;
  }
};


interface AdminViewProps {
  subjects: Subject[];
  allSubjectsData: Subject[];
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
  onReorderQuestions: (subjectId: string, quizId: string, newQuestions: Question[]) => void;
  maxOptions: number;
  showManageSubjectsSection: boolean;
  setShowManageSubjectsSection: (show: boolean) => void;
  showManageQuizzesSection: boolean;
  setShowManageQuizzesSection: (show: boolean) => void;
  activeAdminSubject: Subject | undefined;
  activeAdminQuiz: Quiz | undefined;
  githubPat: string; 
  setGithubPat: (pat: string) => void; 
}

const AdminView: React.FC<AdminViewProps> = (props) => {
  const {
    subjects, allSubjectsData, activeSubjectId, activeQuizId, editingQuestion, setEditingQuestion,
    onSetActiveSubjectId, onCreateSubject, onUpdateSubjectName, onDeleteSubject,
    onSetActiveQuizId, onCreateQuiz, onUpdateQuizName, onDeleteQuiz, onToggleQuizStartable,
    onAddQuestion, onUpdateQuestion, onDeleteQuestion, onReorderQuestions,
    maxOptions,
    showManageSubjectsSection, setShowManageSubjectsSection,
    showManageQuizzesSection, setShowManageQuizzesSection,
    activeAdminSubject, activeAdminQuiz,
    githubPat, setGithubPat
  } = props;

  const [newSubjectName, setNewSubjectName] = useState('');
  const [editSubjectNameValue, setEditSubjectNameValue] = useState('');
  const [newQuizName, setNewQuizName] = useState('');
  const [editQuizNameValue, setEditQuizNameValue] = useState('');
  const [showDataManagementSection, setShowDataManagementSection] = useState(true);
  const [showPatInfoAdmin, setShowPatInfoAdmin] = useState(false);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const isDataSavingConfigured = AppConfig.GITHUB_DATA_URL && AppConfig.GITHUB_DATA_URL !== PLACEHOLDER_GITHUB_DATA_URL;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  
  const [isFetchingPat, setIsFetchingPat] = useState<boolean>(false);
  const [fetchPatStatus, setFetchPatStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const isPatFetcherConfigured = AppConfig.GOOGLE_APPS_SCRIPT_PAT_FETCHER_URL &&
                                AppConfig.GOOGLE_APPS_SCRIPT_PAT_FETCHER_URL !== PLACEHOLDER_APPS_SCRIPT_PAT_URL &&
                                AppConfig.APPS_SCRIPT_SHARED_SECRET &&
                                AppConfig.APPS_SCRIPT_SHARED_SECRET !== PLACEHOLDER_APPS_SCRIPT_SECRET;

  // State for Confirmation Modal
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState<(() => void) | null>(null);
  const [confirmationTitle, setConfirmationTitle] = useState('');
  const [confirmationMessage, setConfirmationMessage] = useState<React.ReactNode>('');


  useEffect(() => {
    if (editingQuestion) {
      setIsEditModalOpen(true);
    } else {
      setIsEditModalOpen(false);
    }
  }, [editingQuestion]);

  useEffect(() => {
    setEditSubjectNameValue(activeAdminSubject?.name || '');
  }, [activeAdminSubject]);

  useEffect(() => {
    setEditQuizNameValue(activeAdminQuiz?.name || '');
  }, [activeAdminQuiz]);


  const handleFetchPatFromSheet = useCallback(async (isAutoAttempt = false) => {
    if (!isPatFetcherConfigured) {
      if (!isAutoAttempt) {
          setFetchPatStatus({ message: 'PAT Fetcher not configured. Please check application settings.', type: 'error'});
      } else {
          console.info("PAT Fetcher not configured, skipping automatic fetch.");
      }
      return;
    }
    setIsFetchingPat(true);
    setFetchPatStatus({ message: 'Fetching PAT...', type: 'info' });
    try {
      const fetchUrl = `${AppConfig.GOOGLE_APPS_SCRIPT_PAT_FETCHER_URL}?secret=${encodeURIComponent(AppConfig.APPS_SCRIPT_SHARED_SECRET)}&_cb_pat=${Date.now()}`;
      const response = await fetch(fetchUrl, { mode: 'cors' });

      if (!response.ok) {
        let errorMsg = `Error fetching PAT: ${response.status} ${response.statusText}`;
        try {
            const errorData = await response.json(); 
            errorMsg = errorData.error || errorMsg;
        } catch (e) { 
            try {
                const textError = await response.text();
                errorMsg += ` - Response: ${textError.substring(0, 100)}`; 
            } catch (textErr) { /* Ignore */ }
        }
        console.error("Raw error from PAT fetcher:", errorMsg);
        throw new Error("Could not retrieve PAT. Ensure the PAT fetcher is configured and network is stable. You can try fetching again.");
      }

      const data = await response.json();
      if (data.error) {
        console.error("Error from PAT fetcher script:", data.error);
        throw new Error("Could not retrieve PAT. Ensure the PAT fetcher is configured and network is stable. You can try fetching again.");
      }

      let patValue: string | undefined = undefined;
      if (data.pat && typeof data.pat === 'string') {
        patValue = data.pat;
      } else if (data.valueFromA1 && typeof data.valueFromA1 === 'string') { 
        patValue = data.valueFromA1;
        console.warn("Fetched PAT using fallback key 'valueFromA1'. Recommended key is 'pat'.");
      }

      if (patValue) {
        setGithubPat(patValue);
        setFetchPatStatus({ message: 'PAT retrieved.', type: 'success' });
      } else {
        console.error("Raw data received from PAT fetcher that was not in the expected format:", data); 
        throw new Error('Could not retrieve PAT. Ensure the PAT fetcher is configured and network is stable. You can try fetching again.');
      }
    } catch (error: any) {
      console.error("Error during PAT fetch process:", error);
      setFetchPatStatus({ message: error.message || "Could not retrieve PAT. An unknown error occurred.", type: 'error' });
    } finally {
      setIsFetchingPat(false);
    }
  }, [isPatFetcherConfigured, setGithubPat]);

  useEffect(() => {
    if (isPatFetcherConfigured && !githubPat) {
      console.log("AdminView: Attempting automatic PAT fetch on load.");
      handleFetchPatFromSheet(true); 
    }
  }, [isPatFetcherConfigured, githubPat, handleFetchPatFromSheet]);

  const openConfirmationForSubject = (title: string, message: React.ReactNode, action: () => void) => {
    setConfirmationTitle(title);
    setConfirmationMessage(message);
    setConfirmationAction(() => action); // Store the action
    setShowConfirmationModal(true);
  };

  const handleConfirmAction = () => {
    if (confirmationAction) {
      confirmationAction();
    }
    setShowConfirmationModal(false);
    setConfirmationAction(null);
  };

  const handleCancelConfirmation = () => {
    setShowConfirmationModal(false);
    setConfirmationAction(null);
  };


  const handleCreateNewSubject = () => {
    if (!newSubjectName.trim()) {
      alert('Subject name cannot be empty.');
      return;
    }
    if (subjects.some(s => s.name.toLowerCase() === newSubjectName.trim().toLowerCase())) {
        alert(`A subject with the name "${newSubjectName.trim()}" already exists. Please choose a different name.`);
        return;
    }
    openConfirmationForSubject(
        "Confirm Create Subject",
        <p>Are you sure you want to create the subject: <strong>{newSubjectName.trim()}</strong>?</p>,
        () => {
            onCreateSubject(newSubjectName.trim());
            setNewSubjectName('');
        }
    );
  };

  const handleSelectSubjectToManage = (e: ChangeEvent<HTMLSelectElement>) => {
    onSetActiveSubjectId(e.target.value || null);
  };

  const handleUpdateSelectedSubjectName = () => {
    if (!activeSubjectId || !editSubjectNameValue.trim()) {
      alert('No subject selected or name is empty.');
      return;
    }
    const currentSubjectName = activeAdminSubject?.name;
    openConfirmationForSubject(
        "Confirm Update Subject Name",
        <p>Are you sure you want to rename the subject from "<strong>{currentSubjectName}</strong>" to "<strong>{editSubjectNameValue.trim()}</strong>"?</p>,
        () => {
            if (!onUpdateSubjectName(activeSubjectId, editSubjectNameValue.trim())) {
                // alert handled by onUpdateSubjectName on failure
            }
        }
    );
  };

  const handleDeleteSelectedSubject = () => {
    if (activeSubjectId && activeAdminSubject) {
      openConfirmationForSubject(
          "Confirm Delete Subject",
          <p>Are you sure you want to delete the subject: <strong>{activeAdminSubject.name}</strong>? This action cannot be undone and will delete all its quizzes and questions.</p>,
          () => onDeleteSubject(activeSubjectId)
      );
    } else {
      alert('No subject selected to delete.');
    }
  };

  const handleCreateNewQuiz = () => {
    if (!activeSubjectId || !newQuizName.trim()) {
      alert('No subject selected or quiz name is empty.');
      return;
    }
    // Direct action: Name conflict check is handled in App.tsx by onCreateQuiz
    onCreateQuiz(activeSubjectId, newQuizName.trim());
    setNewQuizName('');
  };
  
  const handleSelectQuizToManage = (e: ChangeEvent<HTMLSelectElement>) => {
    onSetActiveQuizId(e.target.value || null);
  };

  const handleUpdateSelectedQuizName = () => {
    if (!activeSubjectId || !activeQuizId || !editQuizNameValue.trim()) {
      alert('No subject/quiz selected or name is empty.');
      return;
    }
    // Direct action: Name conflict check is handled in App.tsx by onUpdateQuizName
    if(!onUpdateQuizName(activeSubjectId, activeQuizId, editQuizNameValue.trim())) {
        // alert handled by onUpdateQuizName on failure, if any
    }
  };

  const handleDeleteSelectedQuiz = () => {
    if (activeSubjectId && activeQuizId && activeAdminQuiz) {
      // Direct action, to be replaced by HoldToDeleteButton logic
      onDeleteQuiz(activeSubjectId, activeQuizId);
    } else {
      alert('No quiz selected to delete.');
    }
  };

  const handleToggleSelectedQuizStartable = () => {
    if (activeSubjectId && activeQuizId) {
        onToggleQuizStartable(activeSubjectId, activeQuizId);
    }
  };
  
  const handleEditQuestionClick = (question: Question) => {
    setEditingQuestion(question);
  };

  const handleDeleteQuestionClick = (questionId: string) => {
    console.log('[AdminView] handleDeleteQuestionClick called for question ID:', questionId);
    if (activeSubjectId && activeQuizId && activeAdminQuiz) {
      const questionToDelete = activeAdminQuiz.questions.find(q => q.id === questionId);
      if (questionToDelete) {
        onDeleteQuestion(activeSubjectId, activeQuizId, questionId);
      } else {
        alert(`Question not found in the current quiz (ID: ${questionId}). It might have already been deleted.`);
        console.warn(`[AdminView] Attempted to delete question ID ${questionId}, but it was not found in activeAdminQuiz.questions.`);
      }
    } else {
      alert('Cannot delete question: context missing (subject/quiz). Please ensure a quiz is selected.');
      console.error(`[AdminView] handleDeleteQuestionClick: Context missing. activeSubjectId: ${activeSubjectId}, activeQuizId: ${activeQuizId}.`);
    }
  };

  const handleSaveQuestion = (subjectId: string, quizId: string, questionData: Omit<Question, 'id'> | Question) => {
    if ('id' in questionData) { 
      onUpdateQuestion(subjectId, quizId, questionData as Question);
    } else { 
      onAddQuestion(subjectId, quizId, questionData);
    }
    setEditingQuestion(null); 
  };
  
  const handleOpenReorderModal = () => {
    if (activeAdminQuiz) {
        setIsReorderModalOpen(true);
    }
  };

  const handleConfirmReorderInModal = (reorderedQuestions: Question[]) => {
    if (activeSubjectId && activeQuizId) {
        onReorderQuestions(activeSubjectId, activeQuizId, reorderedQuestions);
    }
    setIsReorderModalOpen(false);
  };


  const handleSaveDataToJson = async () => {
    if (!githubPat) {
      setSaveStatus({ message: 'A PAT is required to save data.', type: 'error' });
      return;
    }
    if (!isDataSavingConfigured) {
      setSaveStatus({ message: 'Data saving is not configured. Cannot save.', type: 'error' });
      return;
    }

    setIsSaving(true);
    setSaveStatus({ message: 'Saving Data...', type: 'info' });

    const repoInfo = parseGitHubUrl(AppConfig.GITHUB_DATA_URL);
    if (!repoInfo) {
      setSaveStatus({ message: 'Could not parse GitHub URL. Check console for details and ensure it\'s a raw, blob, or API URL.', type: 'error' });
      setIsSaving(false);
      return;
    }
    console.log("GitHub Repo Info for Save:", repoInfo);

    const { owner, repo, branch, path } = repoInfo;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const commitMessage = "Quiz App: Update application data via Web Editor";
    const appDataToSave: AppDataToSave = {
      lastUpdated: new Date().toISOString(),
      subjects: allSubjectsData 
    };
    const contentToSave = JSON.stringify(appDataToSave, null, 2);
    const contentBase64 = btoa(unescape(encodeURIComponent(contentToSave))); 

    try {
      let sha: string | undefined;
      const shaFetchUrl = new URL(apiUrl);
      shaFetchUrl.searchParams.append('ref', branch);
      shaFetchUrl.searchParams.append('_cb_sha', Date.now().toString()); 

      try {
        const getFileResponse = await fetch(shaFetchUrl.toString(), {
          method: 'GET',
          headers: {
            'Authorization': `token ${githubPat}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        });
        if (getFileResponse.ok) {
          const fileData = await getFileResponse.json();
          sha = fileData.sha;
          console.log("Fetched current file SHA:", sha);
        } else if (getFileResponse.status !== 404) { 
          const errorData = await getFileResponse.text();
          throw new Error(`Failed to get current file SHA: ${getFileResponse.status} - ${errorData}`);
        } else {
          console.log("File not found (404) when fetching SHA. Will attempt to create a new file.");
        }
      } catch (e: any) {
         console.error("Error fetching file SHA:", e);
         throw new Error(`Network or unexpected error fetching file SHA: ${e.message}`);
      }

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${githubPat}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: commitMessage,
          content: contentBase64,
          sha: sha, 
          branch: branch,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('GitHub API Error Data during PUT:', errorData);
        throw new Error(`GitHub API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('Save successful:', result);
      setSaveStatus({ message: 'Data saved successfully!', type: 'success' });
    } catch (error: any) {
      console.error('Error saving data:', error);
      setSaveStatus({ message: `Error saving data: ${error.message}`, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSection = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(prev => !prev);
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-8">
      {/* Manage Subjects Section */}
      <section className={sectionBaseClass} aria-labelledby="manage-subjects-heading">
        <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => toggleSection(setShowManageSubjectsSection)}>
          <h2 id="manage-subjects-heading" className="text-xl sm:text-2xl font-semibold text-[var(--accent-primary)]">Manage Subjects</h2>
          <i className={`fa-solid ${showManageSubjectsSection ? 'fa-minus' : 'fa-plus'} text-[var(--text-secondary)] transition-transform`}></i>
        </div>
        {showManageSubjectsSection && (
          <div className="space-y-4">
            <div>
              <label htmlFor="newSubjectName" className={labelClass}>Create New Subject</label>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <input
                  type="text"
                  id="newSubjectName"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="Enter name for new subject"
                  className={inputClass}
                />
                <button onClick={handleCreateNewSubject} className={buttonPrimaryClass} aria-label="Create New Subject">
                    <i className="fa-solid fa-plus fa-fw"></i> Create Subject
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="selectSubjectToManage" className={labelClass}>Select Subject to Manage</label>
              <select id="selectSubjectToManage" value={activeSubjectId || ''} onChange={handleSelectSubjectToManage} className={selectClass}>
                <option value="">-- Select a Subject --</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </div>

            {activeSubjectId && activeAdminSubject && (
              <div className="p-3 border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-md space-y-3 mt-2">
                <p className="text-sm text-[var(--text-secondary)]">Managing: 
                  <TypewriterText 
                    key={activeAdminSubject.id} 
                    textToType={activeAdminSubject.name} 
                    className="font-semibold text-[var(--text-primary)] truncate max-w-[200px] sm:max-w-xs inline-block align-bottom" 
                    title={activeAdminSubject.name}
                  />
                </p>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <input
                    type="text"
                    value={editSubjectNameValue}
                    onChange={(e) => setEditSubjectNameValue(e.target.value)}
                    placeholder="New name for selected subject"
                    className={inputClass}
                    aria-label="New name for selected subject"
                  />
                  <button onClick={handleUpdateSelectedSubjectName} className={buttonSecondaryClass} aria-label="Update Selected Subject Name">
                    <i className="fa-solid fa-pen-to-square fa-fw"></i> Update Name
                  </button>
                </div>
                 <button
                    onClick={handleDeleteSelectedSubject}
                    className={`${buttonRedClass} w-full`}
                    aria-label="Delete Selected Subject"
                  >
                    <i className="fa-solid fa-trash fa-fw"></i> Delete Subject
                  </button>
              </div>
            )}
             {!activeSubjectId && (
                <p className="text-sm text-[var(--text-secondary)] text-center py-2">Select a subject above to manage its details and quizzes.</p>
            )}
          </div>
        )}
      </section>

      {/* Manage Quizzes Section */}
      {activeSubjectId && activeAdminSubject && (
        <section className={sectionBaseClass} aria-labelledby="manage-quizzes-heading">
          <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => toggleSection(setShowManageQuizzesSection)}>
            <h2 id="manage-quizzes-heading" className="text-xl sm:text-2xl font-semibold text-[var(--accent-primary)]">
              Manage Quizzes for: <span className="truncate">{activeAdminSubject.name}</span>
            </h2>
             <i className={`fa-solid ${showManageQuizzesSection ? 'fa-minus' : 'fa-plus'} text-[var(--text-secondary)] transition-transform`}></i>
          </div>
          {showManageQuizzesSection && (
            <div className="space-y-4">
                <div>
                  <label htmlFor="newQuizName" className={labelClass}>Create New Quiz</label>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <input
                      type="text"
                      id="newQuizName"
                      value={newQuizName}
                      onChange={(e) => setNewQuizName(e.target.value)}
                      placeholder="Enter name for new quiz"
                      className={inputClass}
                    />
                    <button onClick={handleCreateNewQuiz} className={buttonPrimaryClass} aria-label="Create New Quiz">
                        <i className="fa-solid fa-plus fa-fw"></i> Create Quiz
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="selectQuizToManage" className={labelClass}>Select Quiz to Manage</label>
                  <select id="selectQuizToManage" value={activeQuizId || ''} onChange={handleSelectQuizToManage} className={selectClass}>
                    <option value="">-- Select a Quiz --</option>
                    {activeAdminSubject.quizzes.map(quiz => (
                      <option key={quiz.id} value={quiz.id}>
                        {quiz.name}
                        {!quiz.isStartable && ' (Not Available)'}
                      </option>
                    ))}
                  </select>
                </div>

                {activeQuizId && activeAdminQuiz && (
                  <div className="p-3 border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-md space-y-3 mt-2">
                     <p className="text-sm text-[var(--text-secondary)]">Managing: 
                       <TypewriterText 
                         key={activeAdminQuiz.id} 
                         textToType={activeAdminQuiz.name} 
                         className="font-semibold text-[var(--text-primary)]" 
                         title={activeAdminQuiz.name}
                       />
                     </p>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <input
                        type="text"
                        value={editQuizNameValue}
                        onChange={(e) => setEditQuizNameValue(e.target.value)}
                        placeholder="New name for selected quiz"
                        className={inputClass}
                        aria-label="New name for selected quiz"
                      />
                      <button onClick={handleUpdateSelectedQuizName} className={buttonSecondaryClass} aria-label="Update Selected Quiz Name">
                        <i className="fa-solid fa-pen-to-square fa-fw"></i> Update Name
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-md bg-[var(--input-bg)] border border-[var(--input-border)]">
                      <span className="text-[var(--text-primary)] text-sm">Available to users</span>
                      <button
                        onClick={handleToggleSelectedQuizStartable}
                        className={`rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--input-bg)]
                          ${activeAdminQuiz.isStartable
                            ? 'focus:ring-[var(--accent-green)]'
                            : 'focus:ring-[var(--accent-secondary)]'
                          } flex items-center justify-center p-1`}
                        aria-checked={activeAdminQuiz.isStartable}
                        role="switch"
                        title={activeAdminQuiz.isStartable ? 'Click to make unavailable to users' : 'Click to make available to users'}
                      >
                        <div className="relative inline-block w-12 h-6 select-none">
                            <div className={`toggle-track absolute w-12 h-6 rounded-full shadow-inner transition-colors duration-200 ease-in-out ${activeAdminQuiz.isStartable ? 'bg-[var(--accent-green)]' : 'bg-[var(--accent-secondary)]'}`}></div>
                            <div className={`toggle-knob absolute w-5 h-5 bg-white rounded-full shadow top-0.5 left-0.5 transition-transform duration-200 ease-in-out transform ${activeAdminQuiz.isStartable ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                      </button>
                    </div>
                    <HoldToDeleteButton
                        onConfirm={() => onDeleteQuiz(activeSubjectId!, activeQuizId!)}
                        label="Delete Quiz"
                        holdTimeMs={3000}
                    />
                  </div>
                )}

                {!activeQuizId && activeAdminSubject.quizzes.length > 0 && (
                    <p className="text-sm text-[var(--text-secondary)] text-center py-2">Select a quiz above to manage its questions and details.</p>
                )}
                 {activeAdminSubject.quizzes.length === 0 && (
                    <p className="text-sm text-[var(--text-secondary)] text-center py-2">No quizzes created yet for "{activeAdminSubject.name}".</p>
                )}
            </div>
          )}
        </section>
      )}

      {/* Manage Questions Section */}
      {activeSubjectId && activeQuizId && activeAdminQuiz && (
        <section className={`${sectionBaseClass} mt-6`} aria-labelledby="manage-questions-heading">
          <h2 id="manage-questions-heading" className="text-xl sm:text-2xl font-semibold text-[var(--accent-primary)] mb-4">
            Manage Questions for: <span className="truncate">{activeAdminQuiz.name}</span>
          </h2>

          <QuestionForm
              subjectId={activeSubjectId}
              quizId={activeQuizId}
              quizName={activeAdminQuiz.name}
              existingQuestion={null} 
              onSaveQuestion={handleSaveQuestion}
              maxOptions={maxOptions}
          />
          
          {isEditModalOpen && editingQuestion && (
            <EditQuestionModal
              isOpen={isEditModalOpen}
              onClose={() => setEditingQuestion(null)}
              subjectId={activeSubjectId}
              quizId={activeQuizId}
              quizName={activeAdminQuiz.name}
              existingQuestion={editingQuestion}
              onSaveQuestion={handleSaveQuestion}
              maxOptions={maxOptions}
            />
          )}

          <div className="mt-6">
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-3">
                Current Questions ({activeAdminQuiz.questions.length})
                {activeAdminQuiz.questions.length > 1 && (
                     <button
                        onClick={handleOpenReorderModal}
                        className="ml-3 px-2.5 py-1 text-xs bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover-bg)] text-[var(--btn-secondary-text)] rounded-md transition-colors"
                        aria-label="Reorder questions"
                    >
                        <i className="fa-solid fa-sort mr-1"></i> Reorder
                    </button>
                )}
            </h3>
            {activeAdminQuiz.questions.length === 0 ? (
              <p className="text-[var(--text-secondary)] text-center py-3">No questions added yet. Use the form above to add some!</p>
            ) : (
              <ul className="space-y-2">
                {activeAdminQuiz.questions.map((q, index) => (
                  <AdminQuestionListItem
                    key={q.id}
                    question={q}
                    questionNumber={index + 1}
                    onEdit={() => handleEditQuestionClick(q)}
                    onDelete={() => handleDeleteQuestionClick(q.id)}
                  />
                ))}
              </ul>
            )}
             {isReorderModalOpen && activeAdminQuiz && (
                <ReorderQuestionsModal
                    isOpen={isReorderModalOpen}
                    quizName={activeAdminQuiz.name}
                    initialQuestions={activeAdminQuiz.questions}
                    onConfirmReorder={handleConfirmReorderInModal}
                    onClose={() => setIsReorderModalOpen(false)}
                />
            )}
          </div>
        </section>
      )}


      {/* Application Data Management Section */}
      <section className={sectionBaseClass} aria-labelledby="app-data-management-heading">
        <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => toggleSection(setShowDataManagementSection)}>
          <h2 id="app-data-management-heading" className="text-xl sm:text-2xl font-semibold text-[var(--accent-primary)]">Application Data Management</h2>
          <i className={`fa-solid ${showDataManagementSection ? 'fa-minus' : 'fa-plus'} text-[var(--text-secondary)] transition-transform`}></i>
        </div>

        {showDataManagementSection && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>
                Personal Access Token (PAT)
                 <button
                    onClick={() => setShowPatInfoAdmin(prev => !prev)}
                    className="ml-1.5 text-[var(--accent-secondary)] hover:text-[var(--accent-primary)] text-xs focus:outline-none"
                    aria-label={showPatInfoAdmin ? "Hide PAT information" : "Show PAT information"}
                    title="Toggle PAT Information"
                  >
                    <i className={`fa-solid ${showPatInfoAdmin ? 'fa-eye-slash' : 'fa-eye'}`}></i> Info
                </button>
              </label>
              <div className="mt-1"> 
                {!isPatFetcherConfigured && (
                     <p className="text-xs text-[var(--text-secondary)]">PAT Fetcher not configured.</p>
                )}
                {fetchPatStatus && (
                  <p className={`text-xs whitespace-pre-wrap ${fetchPatStatus.type === 'error' ? 'text-red-400' : fetchPatStatus.type === 'success' ? 'text-green-400' : 'text-[var(--text-secondary)]'}`}>
                      {fetchPatStatus.message}
                  </p>
                )}
                {isPatFetcherConfigured && isFetchingPat && !fetchPatStatus && (
                    <p className="text-xs text-[var(--text-secondary)]">
                        <i className="fa-solid fa-spinner fa-spin fa-fw mr-1"></i>Attempting to retrieve PAT...
                    </p>
                )}
              </div>
              {showPatInfoAdmin && (
                <p className="text-xs text-[var(--text-secondary)] mt-1.5">
                  Your PAT is stored in browser localStorage. It needs 'repo' scope (Classic PAT) or 'Contents: Read & Write' (Fine-Grained PAT) for the repository containing the application data.
                  <a href="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens" target="_blank" rel="noopener noreferrer" className="text-[var(--accent-primary)] hover:underline ml-1">More info</a>
                </p>
              )}
            </div>
            
            <button
              onClick={handleSaveDataToJson}
              disabled={isSaving || !isDataSavingConfigured || !githubPat}
              className={`${buttonGreenClass} w-full sm:w-auto ${isSaving || !isDataSavingConfigured || !githubPat ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <i className={`fa-solid ${isSaving ? 'fa-spinner fa-spin' : 'fa-save'} fa-fw`}></i>
              {isSaving ? 'Saving Data...' : 'Save Data'}
            </button>

            {!isDataSavingConfigured && (
                <div className="p-3 bg-[var(--accent-amber)] bg-opacity-10 border border-[var(--accent-amber)] text-[var(--accent-amber)] rounded-md text-sm mt-2">
                    <i className="fa-solid fa-triangle-exclamation mr-2"></i>
                    Data saving is not configured. Please set GITHUB_DATA_URL in <strong>config.ts</strong>.
                </div>
            )}
            {!githubPat && isDataSavingConfigured && (
                 <p className="text-xs text-[var(--text-secondary)] text-center mt-1">
                    A PAT is required to enable saving. Please ensure it's correctly configured and fetched.
                </p>
            )}

            {saveStatus && (
              <p className={`text-sm mt-2 text-center ${saveStatus.type === 'error' ? 'text-red-400' : saveStatus.type === 'success' ? 'text-green-400' : 'text-[var(--text-secondary)]'}`}>
                {saveStatus.message}
              </p>
            )}

            <div className="mt-4 p-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md">
              <div className="flex items-start space-x-2">
                <i className="fa-solid fa-circle-info text-[var(--accent-secondary)] mt-1 text-lg"></i>
                <div>
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">Saving Your Work</h4>
                    <p className="text-xs text-[var(--text-secondary)]">
                        Manage your subjects, quizzes, and questions using the sections above. If data saving is configured, ensure your PAT is fetched and click 'Save Data' to store all changes.
                    </p>
                </div>
              </div>
            </div>

          </div>
        )}
      </section>

      {showConfirmationModal && (
        <ConfirmationModal
          isOpen={showConfirmationModal}
          title={confirmationTitle}
          message={confirmationMessage}
          requiredPassword={ADMIN_ACTION_PASSWORD} // This will always be the subject password when this modal is shown
          onConfirm={handleConfirmAction}
          onCancel={handleCancelConfirmation}
        />
      )}
    </div>
  );
};

export default AdminView;
