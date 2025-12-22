import React from 'react';

interface ValidationErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  errors: string[];
}

const ValidationErrorModal: React.FC<ValidationErrorModalProps> = ({
  isOpen,
  onClose,
  title = "Validation Failed",
  subtitle,
  errors
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 transform transition-all flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-red-600 p-6 text-white flex justify-between items-center relative overflow-hidden shrink-0">
          <div className="relative z-10">
            <h3 className="text-2xl font-bold tracking-tight">{title}</h3>
            {subtitle && (
              <p className="text-red-200 text-sm mt-1">{subtitle}</p>
            )}
          </div>
          <div className="relative z-10 bg-white/10 p-2.5 rounded-full backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-500 rounded-full opacity-50"></div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="font-semibold text-red-800 dark:text-red-200">
                {errors.length} validation error{errors.length !== 1 ? 's' : ''} found
              </span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {errors.map((error, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-red-600 dark:text-red-400 font-mono text-xs mt-0.5">•</span>
                  <span className="text-red-700 dark:text-red-300 leading-relaxed">{error}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
            <strong>Please fix these errors and try again.</strong> You can:
            <ul className="mt-1 ml-4 list-disc space-y-1">
              <li>Correct the data in your Excel file</li>
              <li>Ensure dates are in DD/MM/YYYY format</li>
              <li>Verify all required fields are filled</li>
              <li>Check that phone numbers are valid</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-600 text-white font-bold text-sm rounded-xl hover:bg-slate-700 transition-all shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ValidationErrorModal;