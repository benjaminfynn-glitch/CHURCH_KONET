import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
  description?: string;
  actions?: ToastAction[];
  duration?: number;
  persistent?: boolean;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType, options?: {
    title?: string;
    description?: string;
    actions?: ToastAction[];
    duration?: number;
    persistent?: boolean;
  }) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'success', options?: {
    title?: string;
    description?: string;
    actions?: ToastAction[];
    duration?: number;
    persistent?: boolean;
  }) => {
    const id = Math.random().toString(36).substring(7);
    const toast: Toast = {
      id,
      message,
      type,
      title: options?.title,
      description: options?.description,
      actions: options?.actions,
      duration: options?.duration ?? 4000,
      persistent: options?.persistent ?? false,
    };
    setToasts(prev => [...prev, toast]);

    if (!toast.persistent) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, toast.duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none p-4">
        <div className="space-y-4 max-w-md w-full">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className="pointer-events-auto w-full bg-blue-600 text-white border-0 rounded-2xl shadow-2xl transform transition-all animate-in zoom-in-95 fade-in duration-500 ring-1 ring-blue-300/50 shadow-blue-100"
            >
            <div className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white">
                    {toast.type === 'success' && <span className="text-green-600 text-lg">✓</span>}
                    {toast.type === 'error' && <span className="text-red-600 text-lg">✕</span>}
                    {toast.type === 'warning' && <span className="text-yellow-600 text-lg">⚠</span>}
                    {toast.type === 'info' && <span className="text-blue-600 text-lg">ℹ</span>}
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  {toast.title && (
                    <p className="text-base font-semibold text-white mb-1">{toast.title}</p>
                  )}
                  <p className={`text-sm leading-relaxed ${toast.title ? 'text-blue-100' : 'text-white font-medium'}`}>
                    {toast.message}
                  </p>
                  {toast.description && (
                    <p className="mt-2 text-sm text-blue-200 leading-relaxed">{toast.description}</p>
                  )}
                  {toast.actions && toast.actions.length > 0 && (
                    <div className="mt-4 flex space-x-3">
                      {toast.actions.map((action, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            action.onClick();
                            if (!toast.persistent) removeToast(toast.id);
                          }}
                          className={`
                            inline-flex justify-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95
                            ${action.variant === 'secondary'
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                              : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg'
                            }
                          `}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="inline-flex w-8 h-8 items-center justify-center text-white hover:text-blue-200 hover:bg-white/10 rounded-full transition-colors duration-200"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};
