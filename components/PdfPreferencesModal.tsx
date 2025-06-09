

import React, { useState, useEffect, ChangeEvent, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { Subject, Quiz, Question as QuestionType, Option } from '../App.tsx';
import jsPDF from 'jspdf';
import QuizMultiSelectModal, { DisplayQuiz as MultiSelectDisplayQuiz } from './QuizRangeSelectionModal.tsx'; // Corrected import path

// Default color values mapping to CSS variables
const defaultColors = {
  title: '#233239',        // User requested: Dark Slate Blue/Grey
  questionText: '#000000', // User requested: Black
  answerText: '#474747',   // User requested: Dark Grey
  correctAnswer: '#48BB78',// var(--accent-green) - Kept for correct answer highlight
};

export interface PdfExportPreferences {
  showAnswers: boolean;
  fontSize: number; // Base font size for content pages
  // layout: '1-column' | '2-column'; // Removed layout option
  colors: {
    title: string;
    questionText: string;
    answerText: string;
    correctAnswer: string;
  };
  selectedSubjectIds: string[];
}

interface PdfPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
}

const inputClass = "p-2 border rounded-md focus:ring-1 placeholder-[var(--placeholder-color)] bg-[var(--input-bg)] text-[var(--input-text)] border-[var(--input-border)] focus:border-[var(--input-focus-ring)] focus:ring-[var(--input-focus-ring)] text-sm";
const labelClass = "block text-sm font-medium text-[var(--text-secondary)] mb-1";
const fieldsetLegendClass = "text-md font-semibold text-[var(--accent-primary)] mb-2";

// PDF constants
const PAGE_WIDTH_PT = 595.28; // A4 width in points
const PAGE_HEIGHT_PT = 841.89; // A4 height in points
const MARGIN_PT = 40;
const CONTENT_WIDTH_PT = PAGE_WIDTH_PT - 2 * MARGIN_PT;
const LINE_HEIGHT_MULTIPLIER = 1.4;
const COVER_PAGE_TEXT_COLOR = '#000000'; // Black
const COVER_PAGE_FONT_SIZE_PT = 18;
const CONTENT_PAGE_START_Y = 135;


const PdfPreferencesModal: React.FC<PdfPreferencesModalProps> = ({
  isOpen,
  onClose,
  subjects,
}) => {
  const [prefs, setPrefs] = useState<PdfExportPreferences>({
    showAnswers: true,
    fontSize: 12,
    // layout: '1-column', // Removed layout option
    colors: { ...defaultColors } as PdfExportPreferences['colors'],
    selectedSubjectIds: [],
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [arabicFontLoaded, setArabicFontLoaded] = useState(false);
  const [showQuizSelectModal, setShowQuizSelectModal] = useState(false);
  const [selectedIndividualQuizIds, setSelectedIndividualQuizIds] = useState<string[] | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPrefs({
        showAnswers: true,
        fontSize: 12,
        // layout: '1-column', // Removed layout option
        colors: { ...defaultColors } as PdfExportPreferences['colors'],
        selectedSubjectIds: subjects.map(s => s.id),
      });
      setIsGenerating(false);
      setArabicFontLoaded(false);
      setShowQuizSelectModal(false);
      setSelectedIndividualQuizIds(null); // Default to all quizzes from selected subjects
    }
  }, [isOpen, subjects]);

  const flatQuizzesForSelector = useMemo(() => {
    if (!isOpen) return [];
    const flatList: Array<MultiSelectDisplayQuiz> = [];
    subjects.forEach(subject => {
        if (prefs.selectedSubjectIds.includes(subject.id)) {
            subject.quizzes.filter(q => q.isStartable).forEach(quiz => {
                flatList.push({
                    id: quiz.id,
                    name: quiz.name,
                    subjectName: subject.name,
                    subjectId: subject.id,
                });
            });
        }
    });
    return flatList;
  }, [subjects, prefs.selectedSubjectIds, isOpen]);

  if (!isOpen && !showQuizSelectModal) { 
    return null;
  }


  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setPrefs(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setPrefs(prev => ({ ...prev, [name]: parseInt(value, 10) }));
    } else {
      setPrefs(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleColorChange = (colorName: keyof PdfExportPreferences['colors'], value: string) => {
    setPrefs(prev => ({
      ...prev,
      colors: { ...prev.colors, [colorName]: value },
    }));
  };

  const handleSubjectSelectionChange = (subjectId: string) => {
    setPrefs(prev => {
      const newSelectedSubjectIds = prev.selectedSubjectIds.includes(subjectId)
        ? prev.selectedSubjectIds.filter(id => id !== subjectId)
        : [...prev.selectedSubjectIds, subjectId];
      // Reset individual quiz selection if subject selection changes
      setSelectedIndividualQuizIds(null); 
      return { ...prev, selectedSubjectIds: newSelectedSubjectIds };
    });
  };


  const handleOpenQuizSelectModal = () => {
    if (prefs.selectedSubjectIds.length === 0) {
        alert("Please select at least one subject before selecting specific quizzes.");
        return;
    }
    setShowQuizSelectModal(true);
  };

  const handleApplyQuizSelection = (selectedIds: string[]) => {
    setSelectedIndividualQuizIds(selectedIds.length > 0 ? selectedIds : null);
    setShowQuizSelectModal(false);
  };

  const loadFileAsBase64 = async (url: string, expectedTypePrefix: string): Promise<string> => {
    let response: Response;
    try {
      response = await fetch(url);
    } catch (networkError) {
      console.error(`Network error loading file ${url}:`, networkError);
      throw new Error(`Network error loading file ${url}: ${networkError instanceof Error ? networkError.message : String(networkError)}`);
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Could not retrieve error body.");
      console.error(`Failed to load file ${url}: ${response.status} ${response.statusText}. Body: ${errorText.substring(0, 200)}`);
      throw new Error(`Failed to load file ${url}: ${response.status} ${response.statusText}`);
    }

    const contentTypeFromServer = response.headers.get('Content-Type');

    try {
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          let result = reader.result as string;
          const genericOctetStreamPrefix = 'data:application/octet-stream;base64,';
          const isExpectedImage = expectedTypePrefix.startsWith('data:image/');

          if (result.startsWith(expectedTypePrefix)) {
            resolve(result);
          } else if (isExpectedImage && result.startsWith(genericOctetStreamPrefix)) {
            console.warn(`File ${url} (expected ${expectedTypePrefix}) was received as octet-stream. Correcting MIME type for PDF.`);
            result = expectedTypePrefix + result.substring(genericOctetStreamPrefix.length);
            resolve(result);
          } else {
            const actualPrefix = result.substring(0, Math.min(result.indexOf(';') + 8, result.length, 50)) + "...";
            const errMsg = `File ${url} loaded with unexpected type. Expected prefix: ${expectedTypePrefix}, but got: ${actualPrefix} (Full Content-Type from server: ${contentTypeFromServer || 'N/A'}). Check if the file is correct and accessible.`;
            console.error(errMsg);
            reject(new Error(errMsg));
          }
        };
        reader.onerror = (errorEvent) => {
            const errMsg = `FileReader error for ${url}: ${errorEvent.target?.error?.message || 'Unknown FileReader error'}`;
            console.error(errMsg, errorEvent);
            reject(new Error(errMsg));
        };
        reader.readAsDataURL(blob);
      });
    } catch (blobError) {
      console.error(`Error processing blob for ${url}:`, blobError);
      throw new Error(`Error processing blob for ${url}: ${blobError instanceof Error ? blobError.message : String(blobError)}`);
    }
  };


  const handleSubmit = async () => {
    if (prefs.selectedSubjectIds.length === 0) {
      alert("Please select at least one subject to include in the PDF.");
      return;
    }
    // Removed 2-column layout warning

    setIsGenerating(true);
    let fontActuallyLoaded = false;

    try {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'pt',
        format: 'a4',
      });

      try {
        const amiriFontBase64Raw = await loadFileAsBase64('https://rustova.github.io/Q/assets/Amiri-Regular.ttf', 'data:font/ttf;base64,');
        const amiriFontBase64 = amiriFontBase64Raw.substring(amiriFontBase64Raw.indexOf(',') + 1);
        doc.addFileToVFS('Amiri-Regular.ttf', amiriFontBase64);
        doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
        doc.addFont('Amiri-Regular.ttf', 'Amiri', 'bold');
        doc.setFont('Amiri', 'normal');
        fontActuallyLoaded = true;
        setArabicFontLoaded(true);
      } catch (fontError) {
        console.warn("Failed to load Amiri-Regular.ttf. PDF will be generated with default fonts.", fontError);
        doc.setFont('Helvetica', 'normal');
      }

      const mainPageImageBase64 = await loadFileAsBase64('https://rustova.github.io/Q/assets/main.PNG', 'data:image/png;base64,');
      const regularPageImageBase64 = await loadFileAsBase64('https://rustova.github.io/Q/assets/regular.PNG', 'data:image/png;base64,');

      let currentY = MARGIN_PT; 
      const subjectTitleRenderSize = prefs.fontSize * 1.5; 

      const applyFontAndColor = (fontSize: number, color: string, isBold: boolean = false) => {
        doc.setFontSize(fontSize);
        doc.setTextColor(color);
        if (fontActuallyLoaded) {
            doc.setFont('Amiri', isBold ? 'bold' : 'normal');
        } else {
            doc.setFont('Helvetica', isBold ? 'bold' : 'normal');
        }
      };
      
      const checkAndAddPage = (neededHeight: number = prefs.fontSize * LINE_HEIGHT_MULTIPLIER) => {
        if (currentY + neededHeight > PAGE_HEIGHT_PT - MARGIN_PT) { 
          doc.addPage();
          doc.addImage(regularPageImageBase64, 'PNG', 0, 0, PAGE_WIDTH_PT, PAGE_HEIGHT_PT, undefined, 'FAST');
          currentY = CONTENT_PAGE_START_Y; 
        }
      };

      const addWrappedText = (text: string, x: number, maxWidth: number, fontSize: number, color: string, isBold: boolean = false, isCoverPageText: boolean = false) => {
        applyFontAndColor(fontSize, color, isBold);
        const lines = doc.splitTextToSize(text, maxWidth);
        const effectiveLineHeightMultiplier = isCoverPageText ? LINE_HEIGHT_MULTIPLIER * 1.1 : LINE_HEIGHT_MULTIPLIER;
        const textHeight = lines.length * fontSize * (isBold ? 1.05 : 1.0) * effectiveLineHeightMultiplier * 0.8;

        if (!isCoverPageText) checkAndAddPage(textHeight);
        doc.text(lines, x, currentY);
        currentY += textHeight + (fontSize * (effectiveLineHeightMultiplier * 0.2));
      };

      // --- Cover Page ---
      doc.addImage(mainPageImageBase64, 'PNG', 0, 0, PAGE_WIDTH_PT, PAGE_HEIGHT_PT, undefined, 'FAST');
      currentY = 416 + (COVER_PAGE_FONT_SIZE_PT * LINE_HEIGHT_MULTIPLIER * 1.1); 
      applyFontAndColor(COVER_PAGE_FONT_SIZE_PT, COVER_PAGE_TEXT_COLOR, true);
      doc.text("Subjects included:", 28, 416); 

      const subjectsToDisplayOnCover = subjects.filter(s => prefs.selectedSubjectIds.includes(s.id));
      if (subjectsToDisplayOnCover.length > 0) {
        subjectsToDisplayOnCover.forEach(sub => {
            if (currentY + (COVER_PAGE_FONT_SIZE_PT * LINE_HEIGHT_MULTIPLIER * 1.1) > PAGE_HEIGHT_PT - MARGIN_PT) { 
                doc.addPage();
                doc.addImage(regularPageImageBase64, 'PNG', 0, 0, PAGE_WIDTH_PT, PAGE_HEIGHT_PT, undefined, 'FAST'); 
                currentY = CONTENT_PAGE_START_Y; 
            }
            addWrappedText(`- ${sub.name}`, MARGIN_PT + 20, CONTENT_WIDTH_PT - 20, COVER_PAGE_FONT_SIZE_PT, COVER_PAGE_TEXT_COLOR, false, true);
        });
      }
      // --- End Cover Page ---

      let quizzesForExport: Array<Quiz & { subjectName: string; subjectId: string }> = [];
      
      subjects.forEach(subject => {
        if (prefs.selectedSubjectIds.includes(subject.id)) {
          subject.quizzes
            .filter(q => q.isStartable && q.questions.length > 0)
            .forEach(quiz => {
              if (selectedIndividualQuizIds === null || selectedIndividualQuizIds.includes(quiz.id)) {
                quizzesForExport.push({
                  ...quiz,
                  subjectName: subject.name,
                  subjectId: subject.id,
                });
              }
            });
        }
      });
      // Ensure quizzesForExport are sorted by original subject order, then quiz order within subject.
      // This is implicitly handled if `subjects` array is stable and iteration order is preserved.


      // --- Content Pages ---
      let isFirstContentPageAfterCover = true;
      for (const quiz of quizzesForExport) {
        if (isFirstContentPageAfterCover) {
          doc.addPage();
          doc.addImage(regularPageImageBase64, 'PNG', 0, 0, PAGE_WIDTH_PT, PAGE_HEIGHT_PT, undefined, 'FAST');
          currentY = CONTENT_PAGE_START_Y;
          isFirstContentPageAfterCover = false;
        } else {
          const estimatedHeightForNextQuiz = (subjectTitleRenderSize * LINE_HEIGHT_MULTIPLIER) + (prefs.fontSize * 1.2 * LINE_HEIGHT_MULTIPLIER);
          checkAndAddPage(estimatedHeightForNextQuiz); 
        }
        
        const subjectNameMaxWidth = CONTENT_WIDTH_PT - (70 - MARGIN_PT);
        addWrappedText(quiz.subjectName, 70, subjectNameMaxWidth, subjectTitleRenderSize, prefs.colors.title, true);
        currentY += prefs.fontSize * 0.2; 
        
        addWrappedText(quiz.name, MARGIN_PT, CONTENT_WIDTH_PT, prefs.fontSize * 1.2, prefs.colors.title, true);
        currentY += prefs.fontSize * 0.7; 

        quiz.questions.forEach((question, qIndex) => {
          addWrappedText(`${qIndex + 1}. ${question.questionText}`, MARGIN_PT, CONTENT_WIDTH_PT, prefs.fontSize, prefs.colors.questionText);
          currentY += prefs.fontSize * 0.3;

          if (question.type === 'mcq' && question.options) {
            question.options.forEach((option, oIndex) => {
              const optionLetter = String.fromCharCode(65 + oIndex);
              let optionDisplay = `${optionLetter}. ${option.text}`;
              let optionColor = prefs.colors.answerText;

              if (prefs.showAnswers && option.id === question.correctOptionId) {
                optionColor = prefs.colors.correctAnswer;
              }
              addWrappedText(optionDisplay, MARGIN_PT + 20, CONTENT_WIDTH_PT - 20, prefs.fontSize * 0.9, optionColor);
              currentY += prefs.fontSize * 0.1;
            });
          }
          currentY += prefs.fontSize * 0.5; 
        });
      }

      if (quizzesForExport.length === 0 && prefs.selectedSubjectIds.length > 0) {
        if (isFirstContentPageAfterCover) {
            doc.addPage();
            doc.addImage(regularPageImageBase64, 'PNG', 0, 0, PAGE_WIDTH_PT, PAGE_HEIGHT_PT, undefined, 'FAST');
        }
        currentY = CONTENT_PAGE_START_Y;
        addWrappedText("No quizzes match the current selection criteria.", MARGIN_PT, CONTENT_WIDTH_PT, prefs.fontSize, prefs.colors.questionText);
      }

      doc.save('Quiz_Export.pdf');

    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(`Failed to generate PDF. Check console for details. Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsGenerating(false);
      onClose();
    }
  };

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot && isOpen) { 
    console.error("Modal root element 'modal-root' not found for PdfPreferencesModal.");
    return null;
  }
  if (!isOpen) return null;

  const colorFields: Array<{ key: keyof PdfExportPreferences['colors']; label: string }> = [
    { key: 'title', label: 'Title Color (Content)' },
    { key: 'questionText', label: 'Question Text Color' },
    { key: 'answerText', label: 'Answer Text Color' },
    { key: 'correctAnswer', label: 'Correct Answer Highlight' },
  ];

  const getQuizSelectionButtonText = () => {
    if (selectedIndividualQuizIds === null) {
        return "Select Specific Quizzes... (All from selected subjects)";
    }
    if (selectedIndividualQuizIds.length === 0) {
        return "Select Specific Quizzes... (None selected)";
    }
    return `${selectedIndividualQuizIds.length} Quizzes Selected`;
  };


  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-prefs-modal-title"
      onClick={isGenerating ? undefined : onClose}
    >
      <div
        className="bg-[var(--bg-secondary)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-[var(--border-color)]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] rounded-t-xl shrink-0">
          <h2 id="pdf-prefs-modal-title" className="text-lg sm:text-xl font-semibold text-[var(--accent-primary)]">
            PDF Export Preferences
          </h2>
          <button
            onClick={isGenerating ? undefined : onClose}
            disabled={isGenerating}
            className="p-2 text-[var(--accent-red)] hover:text-[var(--accent-red-hover)] hover:bg-[var(--accent-red)] hover:bg-opacity-10 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-red)] disabled:opacity-50"
            aria-label="Close PDF preferences modal"
          >
            <i className="fa-solid fa-xmark fa-lg"></i>
          </button>
        </header>

        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar flex-grow">
          <fieldset disabled={isGenerating}>
            <legend className={fieldsetLegendClass}>General Options</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div className="flex items-center space-x-2 p-2 border border-[var(--input-border)] rounded-md bg-[var(--input-bg)]">
                <input
                  type="checkbox"
                  id="showAnswers"
                  name="showAnswers"
                  checked={prefs.showAnswers}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-[var(--accent-primary)] bg-[var(--input-bg)] border-[var(--input-border)] focus:ring-[var(--accent-primary)] rounded cursor-pointer"
                />
                <label htmlFor="showAnswers" className="text-sm text-[var(--input-text)] cursor-pointer">Show Answers in PDF</label>
              </div>
              <div>
                <label htmlFor="fontSize" className={labelClass}>Base Font Size (Content Pages)</label>
                <input
                  type="number"
                  id="fontSize"
                  name="fontSize"
                  value={prefs.fontSize}
                  onChange={handleInputChange}
                  min="8" max="32" step="1"
                  className={`${inputClass} w-full`}
                />
              </div>
              {/* Removed Layout Radio Buttons */}
            </div>
          </fieldset>

          <fieldset disabled={isGenerating}>
            <legend className={fieldsetLegendClass}>Color Scheme (Content Pages)</legend>
            {/* Removed the specific paragraph about cover page text color and font size */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
              {colorFields.map(field => (
                <div key={field.key}>
                  <label htmlFor={field.key} className={`${labelClass} truncate`} title={field.label}>{field.label}</label>
                  <input
                    type="color"
                    id={field.key}
                    name={field.key}
                    value={prefs.colors[field.key as keyof typeof prefs.colors]}
                    onChange={(e) => handleColorChange(field.key as keyof PdfExportPreferences['colors'], e.target.value)}
                    className="w-full h-9 p-0.5 border rounded-md cursor-pointer bg-[var(--input-bg)] border-[var(--input-border)] focus:outline-none focus:ring-1 focus:ring-[var(--input-focus-ring)]"
                  />
                </div>
              ))}
            </div>
          </fieldset>

          <fieldset disabled={isGenerating}>
            <legend className={fieldsetLegendClass}>Select Content</legend>
            {subjects.length > 0 ? (
                <>
                    <div className="flex flex-wrap gap-2 mb-3 items-center">
                        <button
                            onClick={handleOpenQuizSelectModal}
                            disabled={prefs.selectedSubjectIds.length === 0}
                            className="px-3 py-1.5 text-xs bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--btn-primary-text)] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed truncate max-w-xs"
                            title={getQuizSelectionButtonText()}
                        >
                            {getQuizSelectionButtonText()}
                        </button>
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar border border-[var(--input-border)] bg-[var(--input-bg)] rounded-md p-3">
                    {subjects.map(subject => {
                        const quizCount = subject.quizzes.filter(q => q.isStartable).length;
                        return (
                        <label key={subject.id} className="flex items-center space-x-2 p-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md cursor-pointer hover:bg-[var(--accent-secondary)] hover:bg-opacity-10">
                            <input
                            type="checkbox"
                            checked={prefs.selectedSubjectIds.includes(subject.id)}
                            onChange={() => handleSubjectSelectionChange(subject.id)}
                            className="h-4 w-4 text-[var(--accent-primary)] bg-[var(--input-bg)] border-[var(--input-border)] focus:ring-[var(--accent-primary)] rounded"
                            />
                            <span className="text-sm text-[var(--input-text)] flex-grow truncate" title={subject.name}>{subject.name}</span>
                            <span className="text-xs text-[var(--text-secondary)] shrink-0">({quizCount} quiz{quizCount !== 1 ? 'zes' : ''})</span>
                        </label>
                        );
                    })}
                    </div>
                     {prefs.selectedSubjectIds.length === 0 && (
                        <p className="text-xs text-[var(--text-secondary)] italic mt-1">Select subjects to enable quiz selection.</p>
                    )}
                </>
            ) : (
                <p className="text-sm text-[var(--text-secondary)]">No subjects available to select.</p>
            )}
          </fieldset>
        </div>

        <footer className="p-4 sm:p-5 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] rounded-b-xl flex justify-end space-x-3 shrink-0">
          <button
            onClick={isGenerating ? undefined : onClose}
            disabled={isGenerating}
            className="px-4 py-2 text-sm font-medium bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover-bg)] text-[var(--btn-secondary-text)] rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--btn-secondary-focus-ring)] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isGenerating || subjects.length === 0 || prefs.selectedSubjectIds.length === 0}
            className="px-4 py-2 text-sm font-medium bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover-bg)] text-[var(--btn-primary-text)] rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--btn-primary-focus-ring)] disabled:opacity-50 flex items-center justify-center min-w-[120px]"
          >
            {isGenerating ? (
              <>
                <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                Generating...
              </>
            ) : (
             "Generate PDF"
            )}
          </button>
        </footer>
      </div>
      {showQuizSelectModal && (
        <QuizMultiSelectModal
            isOpen={showQuizSelectModal}
            onClose={() => setShowQuizSelectModal(false)}
            allQuizzes={flatQuizzesForSelector}
            initiallySelectedQuizIds={selectedIndividualQuizIds || []}
            onApplySelection={handleApplyQuizSelection}
        />
      )}
    </div>,
    modalRoot
  );
};

export default PdfPreferencesModal;
