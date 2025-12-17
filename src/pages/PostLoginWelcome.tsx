import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PostLoginWelcome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login if user data is not available
    if (!user) {
      navigate('/login'); // Or your designated login route
    }
  }, [user, navigate]);

  // Fallback to 'User' if name is not available
  const userName = user?.fullName || 'User';

  const handleContinueToDashboard = () => {
    navigate('/dashboard');
  };

  // Don't render the component until the user check is complete
  if (!user) {
    return null; // Or a loading spinner
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        {/* Main Welcome Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in duration-500">
          {/* Header Section with Decorative Elements */}
          <div className="relative bg-gradient-to-r from-methodist-blue to-methodist-red p-8 md:p-12">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
            
            <div className="relative text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm text-5xl mb-6 shadow-lg animate-in zoom-in duration-700 delay-100">
                <span aria-hidden="true">⛪</span>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-3 animate-in slide-in-from-bottom-4 duration-700 delay-200">
                Welcome {userName} to Church Konet
              </h1>
              <p className="text-lg md:text-xl text-indigo-100 animate-in slide-in-from-bottom-6 duration-700 delay-300">
                Your ministry management platform is ready
              </p>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-8 md:p-12">
            <div className="text-center mb-8 animate-in fade-in duration-700 delay-400">
              <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                Get started by exploring your dashboard, managing members, or sending broadcast messages to your congregation.
              </p>
            </div>

            {/* Quick Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 animate-in fade-in duration-700 delay-500">
              <Link 
                to="/dashboard"
                className="group p-6 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border-2 border-slate-100 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-lg transition-all duration-300"
              >
                <div aria-hidden="true" className="text-4xl mb-3 group-hover:scale-110 transition-transform">📊</div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Dashboard</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">View statistics and insights</p>
              </Link>

              <Link 
                to="/members"
                className="group p-6 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border-2 border-slate-100 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-lg transition-all duration-300"
              >
                <div aria-hidden="true" className="text-4xl mb-3 group-hover:scale-110 transition-transform">👥</div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Members</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Manage your congregation</p>
              </Link>

              <Link 
                to="/broadcast"
                className="group p-6 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border-2 border-slate-100 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-lg transition-all duration-300"
              >
                <div aria-hidden="true" className="text-4xl mb-3 group-hover:scale-110 transition-transform">📨</div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Broadcast</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Send messages instantly</p>
              </Link>
            </div>

            {/* Primary CTA Button */}
            <div className="text-center animate-in fade-in duration-700 delay-600">
              <button
                onClick={handleContinueToDashboard}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-methodist-blue to-methodist-red hover:from-methodist-blue/90 hover:to-methodist-red/90 text-methodist-white font-bold rounded-xl transition-all shadow-lg shadow-methodist-blue/20 hover:shadow-xl hover:scale-105"
              >
                Continue to Dashboard
                <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center animate-in fade-in duration-700 delay-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Need help getting started? Visit the{' '}
            <Link to="/settings" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
              Settings
            </Link>{' '}
            page to configure your preferences.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PostLoginWelcome;