
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Login: React.FC = () => {
  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/welcome';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
        addToast('Please enter both email and password', 'error');
        return;
    }

    setIsSubmitting(true);
    try {
        const success = await login(email, password);

        if (success) {
            addToast('Welcome back!', 'success');
            navigate(from, { replace: true });
        } else {
            addToast('Invalid credentials. Please try again.', 'error');
        }
    } catch (error) {
        addToast('An error occurred. Please try again.', 'error');
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-200">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in duration-300">
        <div className="p-8">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-2xl mb-4">
                    ⛪
                </div>
                <h2 className="text-2xl font-bold text-methodist-blue">
                    Church Konet Login
                </h2>
                <p className="text-muted mt-2">
                    Sign in to access your dashboard
                </p>
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                        💡 Use credentials provided by the administrator
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-ink mb-2">
                        Email Address
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none transition-all"
                        placeholder="admin@churchkonet.com"
                        autoComplete="email"
                        required
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-ink mb-2">
                        Password
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-4 bg-methodist-blue hover:bg-opacity-90 text-methodist-white font-bold rounded-xl transition-all shadow-lg shadow-methodist-blue/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        'Sign In'
                    )}
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-xs text-muted">
                    For account assistance, please contact your administrator
                </p>
            </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-700/30 p-4 text-center border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs text-slate-400">Secure Firebase Authentication</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
