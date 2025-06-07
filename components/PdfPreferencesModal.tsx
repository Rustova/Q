
import React, { useState, useEffect, ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { jsPDF } from 'jspdf';
import type { Subject, Quiz, Question, Option } from '../App.tsx';

export interface PdfExportPreferences {
  selectedSubjectIds: string[];
  columns: 1 | 2 | 3;
  includeAnswers: boolean;
}

interface PdfPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  onGeneratePdf: (preferences: PdfExportPreferences) => void;
}

const labelClass = "block text-sm font-medium text-[var(--text-secondary)] mb-1";
const checkboxLabelClass = "ml-2 text-sm text-[var(--text-primary)] cursor-pointer";
const radioLabelClass = "ml-2 text-sm text-[var(--text-primary)] cursor-pointer";
const formElementBaseClass = "bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--input-text)] focus:ring-[var(--input-focus-ring)] focus:border-[var(--input-focus-ring)]";

// Colors from theme
const COLOR_ACCENT_PRIMARY = '#B58863'; // For main title, subject titles
const COLOR_TEXT_SECONDARY = '#A79E9C'; // For quiz names, answers, other text
const COLOR_BLACK = '#000000';         // For question text, Option text
const COLOR_ACCENT_GREEN = '#48BB78';   // For correct MCQ answers

// PDF Generation Helper
const generatePdfDocument = async (
  preferences: PdfExportPreferences,
  allSubjects: Subject[]
) => {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  const FONT_FILENAME = 'Amiri-Regular.ttf'; // The actual filename
  const FONT_FAMILY_NAME = 'Amiri';        // The name to use with setFont
  const FONT_STYLE = 'normal';
  let fontLoadedSuccessfully = false;

  try {
    const fontUrl = './Amiri-Regular.ttf'; // Assuming it's in the public root or accessible path
    const fontResponse = await fetch(fontUrl);
    if (!fontResponse.ok) {
      throw new Error(`Failed to fetch font: ${fontResponse.status} ${fontResponse.statusText || ''} from ${fontUrl}`);
    }
    const fontArrayBuffer = await fontResponse.arrayBuffer();
    const fontBase64 = btoa(new Uint8Array(fontArrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));

    doc.addFileToVFS(FONT_FILENAME, fontBase64); // Use actual filename here
    doc.addFont(FONT_FILENAME, FONT_FAMILY_NAME, FONT_STYLE); // Map filename to family name and style
    doc.setFont(FONT_FAMILY_NAME, FONT_STYLE); 
    fontLoadedSuccessfully = true;
    console.log(`${FONT_FAMILY_NAME} font loaded and registered successfully.`);
  } catch (error) {
    console.error(`Error loading ${FONT_FAMILY_NAME} font:`, error);
    alert(`Could not load the ${FONT_FAMILY_NAME} font required for Arabic characters. PDF will be generated with default font, Arabic text may not render correctly.`);
    doc.setFont("helvetica", "normal"); // Fallback
  }

  const { selectedSubjectIds, columns: numColumns, includeAnswers } = preferences;

  const PAGE_WIDTH = 210;
  const PAGE_HEIGHT = 297;
  const MARGIN_TOP = 15;
  const MARGIN_BOTTOM = 15;
  const MARGIN_LEFT = 15;
  const MARGIN_RIGHT = 15;
  const GUTTER = 5;

  const contentWidth = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
  const columnWidth = (contentWidth - (GUTTER * (numColumns - 1))) / numColumns;

  let currentX = MARGIN_LEFT;
  let currentY = MARGIN_TOP;
  let currentColumnIndex = 0;
  let questionCounter = 0;

  const applyCurrentFontAndStyle = (size?: number, color?: string) => {
    if (fontLoadedSuccessfully) {
      doc.setFont(FONT_FAMILY_NAME, FONT_STYLE);
    } else {
      doc.setFont("helvetica", "normal");
    }
    if (size) doc.setFontSize(size);
    if (color) doc.setTextColor(color);
  };

  const goToNextColumnOrPage = () => {
    currentColumnIndex++;
    if (currentColumnIndex >= numColumns) {
      currentColumnIndex = 0;
      doc.addPage();
      currentY = MARGIN_TOP;
    }
    currentX = MARGIN_LEFT + currentColumnIndex * (columnWidth + GUTTER);
    applyCurrentFontAndStyle(); // Re-apply font and style on new column/page
  };

  const checkAndAddPageIfNeeded = (estimatedHeight: number): boolean => {
    if (currentY + estimatedHeight > PAGE_HEIGHT - MARGIN_BOTTOM) {
      goToNextColumnOrPage();
      return true;
    }
    return false;
  };

  // PDF Title and Logo ("Q" as logo part)
  const mainTitleFontSize = 18; // For " FILE "
  const logoFontSize = 22;      // For "Q"

  applyCurrentFontAndStyle(logoFontSize, COLOR_ACCENT_PRIMARY);
  const logoChar = "Q";
  const logoWidth = doc.getTextWidth(logoChar);

  applyCurrentFontAndStyle(mainTitleFontSize, COLOR_ACCENT_PRIMARY);
  const fileText = " FILE "; 
  const fileTextWidth = doc.getTextWidth(fileText);

  const totalTitleCombinedWidth = logoWidth + fileTextWidth;
  let combinedStartX = (PAGE_WIDTH - totalTitleCombinedWidth) / 2;

  applyCurrentFontAndStyle(logoFontSize, COLOR_ACCENT_PRIMARY);
  doc.text(logoChar, combinedStartX, currentY);

  applyCurrentFontAndStyle(mainTitleFontSize, COLOR_ACCENT_PRIMARY);
  doc.text(fileText, combinedStartX + logoWidth, currentY);

  currentY += 10;
  
  allSubjects.forEach(subject => {
    if (!selectedSubjectIds.includes(subject.id)) return;

    checkAndAddPageIfNeeded(15);
    applyCurrentFontAndStyle(16, COLOR_ACCENT_PRIMARY);
    const subjectLines = doc.splitTextToSize(subject.name, columnWidth);
    doc.text(subjectLines, currentX, currentY);
    currentY += subjectLines.length * 7;

    subject.quizzes.forEach(quiz => {
      if(!quiz.isStartable && !includeAnswers) return;

      checkAndAddPageIfNeeded(10);
      applyCurrentFontAndStyle(14, COLOR_TEXT_SECONDARY);
      const quizLines = doc.splitTextToSize(quiz.name, columnWidth);
      doc.text(quizLines, currentX, currentY);
      currentY += quizLines.length * 6;
      
      questionCounter = 0;

      quiz.questions.forEach((question, questionIndex) => {
        questionCounter++;

        if (questionIndex > 0) {
            const previousQuestionType = quiz.questions[questionIndex - 1].type;
            if (previousQuestionType !== question.type) {
                const separatorHeight = 3;
                const separatorMarginBottom = 2; 
                if (checkAndAddPageIfNeeded(separatorHeight + separatorMarginBottom)) {
                     applyCurrentFontAndStyle();
                }
                doc.setLineWidth(0.2);
                doc.setDrawColor(COLOR_TEXT_SECONDARY);
                doc.line(currentX, currentY, currentX + columnWidth, currentY);
                currentY += separatorHeight + separatorMarginBottom;
                doc.setDrawColor(0); 
            }
        }

        let estimatedHeight = 0;
        applyCurrentFontAndStyle(10); // Set for text width calculation
        const qText = `${questionCounter}. ${question.questionText}`;
        const questionTextLines = doc.splitTextToSize(qText, columnWidth);
        estimatedHeight += questionTextLines.length * 5;

        if (question.type === 'mcq' && question.options) {
          question.options.forEach((opt, index) => {
            applyCurrentFontAndStyle(10); // Ensure font for option text calculation
            const optText = `    ${String.fromCharCode(65 + index)}. ${opt.text}`;
            const optionLines = doc.splitTextToSize(optText, columnWidth - 5);
            estimatedHeight += optionLines.length * 5;
          });
        }
        
        if (question.type === 'written' && !includeAnswers) {
           const reducedAnswerSpaceHeight = 2; 
           estimatedHeight += reducedAnswerSpaceHeight; 
        }
        estimatedHeight += 5; // General spacing after question

        if (checkAndAddPageIfNeeded(estimatedHeight)) {
          applyCurrentFontAndStyle(10, COLOR_BLACK); // Re-apply for continued text
          const prevQTextContinued = `${questionCounter}. ${question.questionText.substring(0, 20)}... (continued)`;
          doc.text(prevQTextContinued, currentX, currentY);
          currentY += 5;
        }
        
        applyCurrentFontAndStyle(10, COLOR_BLACK);
        doc.text(questionTextLines, currentX, currentY);
        currentY += questionTextLines.length * 5;


        if (question.type === 'mcq' && question.options) {
          question.options.forEach((opt, index) => {
            const isCorrect = opt.id === question.correctOptionId;
            const optText = `    ${String.fromCharCode(65 + index)}. ${opt.text}`;

            applyCurrentFontAndStyle(10); // Ensure font for option text calculation
            const optionTextLines = doc.splitTextToSize(optText, columnWidth - 5); 
            if (checkAndAddPageIfNeeded(optionTextLines.length * 5)) {
                applyCurrentFontAndStyle(10); // Re-apply font
                 if (currentColumnIndex === 0 && questionIndex > 0 && currentY === MARGIN_TOP) { 
                     doc.setTextColor(COLOR_TEXT_SECONDARY);
                     doc.text("(options continued)", currentX, currentY - 2); 
                 }
            }
            
            if (includeAnswers && isCorrect) {
              applyCurrentFontAndStyle(10, COLOR_ACCENT_GREEN);
            } else {
              applyCurrentFontAndStyle(10, COLOR_BLACK); 
            }
            doc.text(optionTextLines, currentX + 2, currentY); // Indent options
            currentY += optionTextLines.length * 5;
          });

        } else if (question.type === 'written') {
            if (!includeAnswers) {
                const reducedAnswerSpaceHeight = 2; 
                const spaceForContinuedText = 5;
                if (checkAndAddPageIfNeeded(reducedAnswerSpaceHeight + (currentY === MARGIN_TOP ? spaceForContinuedText : 0))) {
                    applyCurrentFontAndStyle(10); // Re-apply font
                     if (currentColumnIndex === 0 && questionIndex > 0 && currentY === MARGIN_TOP) {
                       doc.setTextColor(COLOR_BLACK);
                       doc.text(`${questionCounter}. (answer space continued)`, currentX, currentY);
                       currentY += spaceForContinuedText; 
                   }
                }
                currentY += reducedAnswerSpaceHeight; 
            }
        }
        currentY += 3; // Spacing after each question block
      });
       currentY += 5; // Spacing after quiz block
    });
    currentY += 7; // Spacing after subject block
  });
  doc.save('Q_FILE.pdf'); 
};


const PdfPreferencesModal: React.FC<PdfPreferencesModalProps> = ({
  isOpen,
  onClose,
  subjects,
  onGeneratePdf,
}) => {
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<Set<string>>(new Set());
  const [numColumns, setNumColumns] = useState<1 | 2 | 3>(1);
  const [includeAnswers, setIncludeAnswers] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedSubjectIds(new Set(subjects.map(s => s.id)));
      setNumColumns(1);
      setIncludeAnswers(false);
      setIsGenerating(false);
    }
  }, [isOpen, subjects]);

  if (!isOpen) {
    return null;
  }

  const handleSubjectSelectionChange = (subjectId: string) => {
    setSelectedSubjectIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subjectId)) {
        newSet.delete(subjectId);
      } else {
        newSet.add(subjectId);
      }
      return newSet;
    });
  };

  const handleSelectAllSubjects = () => {
    setSelectedSubjectIds(new Set(subjects.map(s => s.id)));
  };

  const handleDeselectAllSubjects = () => {
    setSelectedSubjectIds(new Set());
  };

  const handleGenerateClick = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 50)); 
    try {
        const currentPreferences: PdfExportPreferences = {
            selectedSubjectIds: Array.from(selectedSubjectIds),
            columns: numColumns,
            includeAnswers: includeAnswers,
        };
        await generatePdfDocument(currentPreferences, subjects);
        onGeneratePdf(currentPreferences); 
    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("An error occurred while generating the PDF. Please check the console for details.");
    } finally {
        setIsGenerating(false);
    }
  };

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) {
    console.error("Modal root element 'modal-root' not found for PdfPreferencesModal.");
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-preferences-modal-title"
      onClick={isGenerating ? undefined : onClose}
    >
      <div
        className="bg-[var(--bg-secondary)] rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-[var(--border-color)]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] rounded-t-xl">
          <h2 id="pdf-preferences-modal-title" className="text-lg sm:text-xl font-semibold text-[var(--accent-primary)]">
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

        <div className="p-4 sm:p-6 overflow-y-auto flex-grow custom-scrollbar space-y-6">
          <fieldset disabled={isGenerating}>
            <legend className={`${labelClass} text-md font-medium text-[var(--text-primary)] mb-2`}>Select Subjects</legend>
            <div className="flex space-x-2 mb-2">
                <button onClick={handleSelectAllSubjects} className="text-xs px-2 py-1 bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover-bg)] text-[var(--btn-secondary-text)] rounded disabled:opacity-50" disabled={isGenerating}>Select All</button>
                <button onClick={handleDeselectAllSubjects} className="text-xs px-2 py-1 bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover-bg)] text-[var(--btn-secondary-text)] rounded disabled:opacity-50" disabled={isGenerating}>Deselect All</button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1 p-2 border border-[var(--border-color)] rounded-md custom-scrollbar bg-[var(--bg-primary)]">
              {subjects.map(subject => (
                <label key={subject.id} className={`flex items-center p-1.5 rounded ${isGenerating ? 'cursor-not-allowed' : 'hover:bg-[var(--accent-secondary)] hover:bg-opacity-20 cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    checked={selectedSubjectIds.has(subject.id)}
                    onChange={() => handleSubjectSelectionChange(subject.id)}
                    className={`h-4 w-4 rounded ${formElementBaseClass} text-[var(--accent-primary)] disabled:opacity-70`}
                    disabled={isGenerating}
                  />
                  <span className={`${checkboxLabelClass} ${isGenerating ? 'opacity-70' : ''}`}>{subject.name}</span>
                </label>
              ))}
              {subjects.length === 0 && <p className="text-sm text-[var(--text-secondary)]">No subjects available.</p>}
            </div>
          </fieldset>

          <fieldset disabled={isGenerating}>
            <legend className={`${labelClass} text-md font-medium text-[var(--text-primary)] mb-2`}>Layout Columns</legend>
            <div className="flex space-x-4">
              {([1, 2, 3] as const).map(col => (
                <label key={col} className={`flex items-center ${isGenerating ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input
                    type="radio"
                    name="columns"
                    value={col}
                    checked={numColumns === col}
                    onChange={() => setNumColumns(col)}
                    className={`h-4 w-4 ${formElementBaseClass} text-[var(--accent-primary)] disabled:opacity-70`}
                    disabled={isGenerating}
                  />
                  <span className={`${radioLabelClass} ${isGenerating ? 'opacity-70' : ''}`}>{col} Column{col > 1 ? 's' : ''}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset disabled={isGenerating}>
            <legend className={`${labelClass} text-md font-medium text-[var(--text-primary)] mb-2`}>Content Options</legend>
            <label className={`flex items-center ${isGenerating ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
              <input
                type="checkbox"
                checked={includeAnswers}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setIncludeAnswers(e.target.checked)}
                className={`h-4 w-4 rounded ${formElementBaseClass} text-[var(--accent-primary)] disabled:opacity-70`}
                disabled={isGenerating}
              />
              <span className={`${checkboxLabelClass} ${isGenerating ? 'opacity-70' : ''}`}>Include answer information</span>
            </label>
          </fieldset>
        </div>

        <footer className="p-4 sm:p-5 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] rounded-b-xl flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={isGenerating ? undefined : onClose}
            disabled={isGenerating}
            className="px-4 py-2 text-sm font-medium bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover-bg)] text-[var(--btn-secondary-text)] rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--btn-secondary-focus-ring)] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerateClick}
            disabled={selectedSubjectIds.size === 0 || isGenerating}
            className="px-4 py-2 text-sm font-medium bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover-bg)] text-[var(--btn-primary-text)] rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--btn-primary-focus-ring)] disabled:opacity-50 flex items-center justify-center"
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
    </div>,
    modalRoot
  );
};

export default PdfPreferencesModal;
