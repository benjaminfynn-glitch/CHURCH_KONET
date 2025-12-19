import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PostLoginWelcome: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login if user data is not available and not loading
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  // Fallback to 'User' if name is not available
  const userName = user?.fullName || 'User';

  const handleContinueToDashboard = () => {
    navigate('/dashboard');
  };

  // Show loading state while fetching user data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-methodist-blue to-methodist-red mb-6">
            <div className="w-8 h-8 border-4 border-methodist-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold text-methodist-blue mb-2">Welcome to Church Konet</h2>
          <p className="text-methodist-blue/70">Preparing your personalized experience...</p>
        </div>
      </div>
    );
  }

  // Don't render the component until the user check is complete
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-methodist-blue/5 via-white to-methodist-red/5 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Main Welcome Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-methodist-blue/10 animate-in fade-in zoom-in duration-500">
          {/* Header Section with Enhanced Branding */}
          <div className="relative bg-gradient-to-r from-methodist-blue via-methodist-blue to-methodist-red p-12 md:p-16">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-methodist-gold/10 rounded-full -mr-40 -mt-40"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-methodist-white/10 rounded-full -ml-32 -mb-32"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-methodist-gold/5 rounded-full"></div>

            <div className="relative text-center">
              {/* Enhanced Logo */}
              <div className="mb-8 animate-in zoom-in duration-700 delay-100">
                <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-methodist-white via-methodist-gold/20 to-methodist-white shadow-2xl border-4 border-methodist-white/50 backdrop-blur-sm">
                  <div className="text-center">
                    <div className="text-6xl mb-1">⛪</div>
                    <div className="text-xs font-bold text-methodist-blue tracking-wider">CHURCH</div>
                  </div>
                </div>
              </div>

              {/* Welcome Message */}
              <div className="animate-in slide-in-from-bottom-4 duration-700 delay-200">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-methodist-white mb-4 leading-tight">
                  Welcome <span className="text-methodist-gold drop-shadow-lg">{userName}</span>
                </h1>
                <h2 className="text-2xl md:text-3xl font-bold text-methodist-white/90 mb-6">
                  to <span className="text-methodist-gold">Church Konet</span>
                </h2>
              </div>

              <p className="text-xl md:text-2xl text-methodist-white/80 font-medium animate-in slide-in-from-bottom-6 duration-700 delay-300 max-w-2xl mx-auto leading-relaxed">
                Your ministry management platform is ready to serve your congregation with faith and technology
              </p>
            </div>
          </div>

          {/* Content Section */}
          <div className="bg-gradient-to-b from-methodist-white to-slate-50 p-8 md:p-12">
            <div className="text-center mb-10 animate-in fade-in duration-700 delay-400">
              <p className="text-xl text-methodist-blue/80 leading-relaxed font-medium max-w-2xl mx-auto">
                Get started by exploring your dashboard, managing members, or sending broadcast messages to your congregation with faith and excellence.
              </p>
            </div>

            {/* Quick Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-10 animate-in fade-in duration-700 delay-500">
              <Link
                to="/dashboard"
                className="group p-8 bg-white rounded-2xl border-2 border-methodist-blue/20 hover:border-methodist-blue hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-methodist-blue/10 text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    📊
                  </div>
                  <h3 className="text-xl font-bold text-methodist-blue mb-3">Dashboard</h3>
                  <p className="text-methodist-blue/70 font-medium">View statistics and insights for your ministry</p>
                </div>
              </Link>

              <Link
                to="/members"
                className="group p-8 bg-white rounded-2xl border-2 border-methodist-red/20 hover:border-methodist-red hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-methodist-red/10 text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    👥
                  </div>
                  <h3 className="text-xl font-bold text-methodist-red mb-3">Members</h3>
                  <p className="text-methodist-red/70 font-medium">Manage your congregation with care</p>
                </div>
              </Link>

              <Link
                to="/broadcast"
                className="group p-8 bg-white rounded-2xl border-2 border-methodist-gold/30 hover:border-methodist-gold hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-methodist-gold/10 text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    📨
                  </div>
                  <h3 className="text-xl font-bold text-methodist-gold mb-3">Broadcast</h3>
                  <p className="text-methodist-gold/70 font-medium">Share God's word instantly</p>
                </div>
              </Link>
            </div>

            {/* Primary CTA Button */}
            <div className="text-center animate-in fade-in duration-700 delay-600">
              <button
                onClick={handleContinueToDashboard}
                className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-methodist-blue to-methodist-red hover:from-methodist-blue/90 hover:to-methodist-red/90 text-methodist-white font-bold text-lg rounded-2xl transition-all shadow-2xl shadow-methodist-blue/30 hover:shadow-3xl hover:scale-105 border-2 border-methodist-white/20"
              >
                Continue to Dashboard
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center animate-in fade-in duration-700 delay-700">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-methodist-blue/5 rounded-full border border-methodist-blue/20">
            <span className="text-methodist-blue font-medium">Need help getting started?</span>
            <Link
              to="/settings"
              className="text-methodist-red hover:text-methodist-red/80 font-semibold underline decoration-methodist-gold decoration-2 underline-offset-2 transition-colors"
            >
              Visit Settings
            </Link>
            <span className="text-methodist-blue/60">to configure your preferences</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostLoginWelcome;