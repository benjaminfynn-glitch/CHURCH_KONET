
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Login: React.FC = () => {
  // State for toggling between Login and Sign Up
  const [isLogin, setIsLogin] = useState(true);
  
  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, signup } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || (!isLogin && !name)) {
        addToast('Please fill in all required fields', 'error');
        return;
    }

    setIsSubmitting(true);
    try {
        let success = false;
        if (isLogin) {
            success = await login(email, password);
        } else {
            success = await signup(name, email, password);
        }

        if (success) {
            addToast(isLogin ? 'Welcome back!' : 'Account created successfully!', 'success');
            navigate(from, { replace: true });
        } else {
            addToast('Authentication failed. Please check your details.', 'error');
        }
    } catch (error) {
        addToast('An error occurred. Please try again.', 'error');
    } finally {
        setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
      setIsLogin(!isLogin);
      // Clear sensitive fields or reset form if desired
      setPassword('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-200">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in duration-300">
        <div className="p-8">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-2xl mb-4">
                    ⛪
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    {isLogin ? 'Sign in to your dashboard' : 'Get started with Church Konet'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            placeholder="John Doe"
                            autoComplete="name"
                        />
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        placeholder="admin@churchkonet.com"
                        autoComplete="email"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Password</label>
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        placeholder="••••••••"
                        autoComplete={isLogin ? "current-password" : "new-password"}
                    />
                </div>

                <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (isLogin ? 'Sign In' : 'Create Account')}
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button 
                        onClick={toggleMode}
                        className="text-indigo-600 dark:text-indigo-400 font-medium cursor-pointer hover:underline focus:outline-none"
                    >
                        {isLogin ? 'Sign Up' : 'Sign In'}
                    </button>
                </p>
            </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-700/30 p-4 text-center border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs text-slate-400">Protected by secure authentication</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
