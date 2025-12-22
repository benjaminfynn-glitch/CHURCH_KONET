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
      <div className="fixed top-6 right-6 z-[100] space-y-4 pointer-events-none max-w-sm">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto max-w-sm w-full bg-white border rounded-lg shadow-lg transform transition-all animate-in slide-in-from-right fade-in duration-300
              ${toast.type === 'success' ? 'border-green-200' : toast.type === 'error' ? 'border-red-200' : toast.type === 'warning' ? 'border-yellow-200' : 'border-blue-200'}
            `}
          >
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {toast.type === 'success' && <span className="text-green-400">✅</span>}
                  {toast.type === 'error' && <span className="text-red-400">⚠️</span>}
                  {toast.type === 'warning' && <span className="text-yellow-400">⚠️</span>}
                  {toast.type === 'info' && <span className="text-blue-400">ℹ️</span>}
                </div>
                <div className="ml-3 w-0 flex-1">
                  {toast.title && (
                    <p className="text-sm font-medium text-gray-900">{toast.title}</p>
                  )}
                  <p className={`text-sm ${toast.title ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>
                    {toast.message}
                  </p>
                  {toast.description && (
                    <p className="mt-1 text-sm text-gray-500">{toast.description}</p>
                  )}
                  {toast.actions && toast.actions.length > 0 && (
                    <div className="mt-3 flex space-x-2">
                      {toast.actions.map((action, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            action.onClick();
                            if (!toast.persistent) removeToast(toast.id);
                          }}
                          className={`
                            inline-flex justify-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                            ${action.variant === 'secondary'
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                            }
                          `}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};
