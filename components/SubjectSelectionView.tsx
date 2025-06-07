

import React, { useState } from 'react';
import type { Subject } from '../App.tsx';
import PdfPreferencesModal, { PdfExportPreferences } from './PdfPreferencesModal.tsx'; // Updated Import

interface SubjectSelectionViewProps {
  subjects: Subject[];
  onSelectSubject: (subjectId: string) => void;
}

const SubjectSelectionView: React.FC<SubjectSelectionViewProps> = ({ 
  subjects, 
  onSelectSubject,
}) => {
  const FEW_SUBJECTS_THRESHOLD = 4; 
  const baseDelay = 0.1; 
  const itemStaggerDelay = 0.075; 

  const [showPdfPreferencesModal, setShowPdfPreferencesModal] = useState(false);

  const handleOpenPdfPreferencesModal = () => {
    setShowPdfPreferencesModal(true);
  };

  const handleClosePdfPreferencesModal = () => {
    setShowPdfPreferencesModal(false);
  };

  const handleGeneratePdf = (preferences: PdfExportPreferences) => { 
    console.log("PDF Preferences (generation initiated by modal):", preferences);
    setShowPdfPreferencesModal(false); // Close modal after PDF generation is handled within it
    // Optionally, show a brief success message here if desired, e.g., using a toast notification.
  };

  const renderPdfExportSection = (animationDelay: string, marginTopClass: string) => (
    <div 
        className={`${marginTopClass} text-center animate-fadeInUp`}
        style={{ animationDelay }}
    >
        <button
            onClick={handleOpenPdfPreferencesModal}
            className="inline-flex flex-col items-center space-y-1.5 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] p-4 rounded-lg hover:bg-[var(--accent-secondary)] hover:bg-opacity-10"
            aria-label="Open PDF export preferences"
        >
            <i className="fa-solid fa-file-pdf text-3xl sm:text-4xl"></i>
            <span className="text-sm font-medium">Export to PDF</span>
        </button>
        <p 
            className="text-xs text-[var(--text-secondary)] mt-3 max-w-xs sm:max-w-sm mx-auto"
        >
            Select subjects from the list above. Then, click the PDF icon to configure and generate a document containing the quizzes and questions from your chosen subjects. You'll be able to customize layout options and decide whether to include answers.
        </p>
    </div>
  );


  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 pb-4 sm:pb-6 flex flex-col flex-grow">
      <h2 
        className="text-2xl sm:text-3xl font-semibold text-[var(--accent-primary)] text-center mb-6 sm:mb-8 pb-4 border-b border-[var(--border-color)] mt-4 sm:mt-6 shrink-0 animate-fadeInUp"
        style={{ animationDelay: `${baseDelay}s` }}
      >
        Select a Subject
      </h2>
      {subjects.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center text-center py-10 px-4">
          <i 
            className="fa-solid fa-box-open text-5xl sm:text-6xl text-[var(--text-secondary)] opacity-60 mb-6 animate-fadeInUp"
            style={{ animationDelay: `${baseDelay + 0.1}s` }}
          ></i>
          <p 
            className="text-xl sm:text-2xl font-semibold text-[var(--text-primary)] mb-2 animate-fadeInUp"
            style={{ animationDelay: `${baseDelay + 0.2}s` }}
          >
            It's a bit quiet here...
          </p>
          <p 
            className="text-sm sm:text-md text-[var(--text-secondary)] max-w-md animate-fadeInUp"
            style={{ animationDelay: `${baseDelay + 0.3}s` }}
          >
            No subjects are available at the moment. Administrators can add new subjects and quizzes through the Admin Panel. Please check back soon!
          </p>
        </div>
      ) : (
        <div 
          className={`flex-grow flex flex-col items-center ${
            subjects.length < FEW_SUBJECTS_THRESHOLD ? 'justify-center' : 'justify-start'
          }`}
        >
          <div className="w-full space-y-3 py-4">
            {subjects.map((subject, index) => {
              const availableQuizzesCount = subject.quizzes.filter(q => q.isStartable).length;
              const animationDelay = baseDelay + 0.1 + (index * itemStaggerDelay); 
              return (
                <button
                  key={subject.id}
                  onClick={() => onSelectSubject(subject.id)}
                  className="w-full text-left p-4 bg-[var(--bg-primary)] hover:bg-[var(--accent-secondary)] hover:bg-opacity-20 border border-[var(--border-color)] hover:border-[var(--accent-secondary)] rounded-lg text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)] animate-fadeInUp"
                  style={{ animationDelay: `${animationDelay}s` }}
                  aria-label={`Select subject: ${subject.name}, ${availableQuizzesCount} quiz${availableQuizzesCount !== 1 ? 'zes' : ''} available`}
                >
                  <span className="text-lg font-semibold text-[var(--accent-primary)]">{subject.name}</span>
                  <span className="block text-sm text-[var(--text-secondary)] mt-1">
                    {availableQuizzesCount} quiz{availableQuizzesCount !== 1 ? 'zes' : ''} available
                  </span>
                </button>
              );
            })}
          </div>
          {subjects.length > 0 && subjects.length < FEW_SUBJECTS_THRESHOLD && (
             <>
              <p 
                  className="text-center text-xs sm:text-sm text-[var(--text-secondary)] mt-6 sm:mt-8 italic animate-fadeInUp"
                  style={{ animationDelay: `${baseDelay + 0.1 + (subjects.length * itemStaggerDelay) + 0.1}s` }}
              >
                 More subjects and quizzes are on the way. Stay tuned!
              </p>
              {renderPdfExportSection(
                `${baseDelay + 0.1 + (subjects.length * itemStaggerDelay) + 0.2}s`,
                "mt-8" // Margin top for the PDF section container
              )}
             </>
          )}
          {subjects.length >= FEW_SUBJECTS_THRESHOLD && (
             renderPdfExportSection(
                `${baseDelay + 0.1 + (subjects.length * itemStaggerDelay) + 0.1}s`,
                "mt-10" // Margin top for the PDF section container
             )
          )}
        </div>
      )}
      {showPdfPreferencesModal && (
        <PdfPreferencesModal
          isOpen={showPdfPreferencesModal}
          onClose={handleClosePdfPreferencesModal}
          subjects={subjects}
          onGeneratePdf={handleGeneratePdf}
        />
      )}
    </div>
  );
};

export default SubjectSelectionView;