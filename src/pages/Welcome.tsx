
import React from 'react';
import { Link } from 'react-router-dom';

const Welcome: React.FC = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Navbar */}
      <nav className="w-full px-6 py-4 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⛪</span>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">CHURCH KONET</h1>
        </div>
        <Link
          to="/login"
          className="px-5 py-2.5 font-medium rounded-lg border transition-colors text-sm shadow-sm"
          style={{
            backgroundColor: '#0B3C5D',
            color: '#FFFFFF',
            borderColor: '#0B3C5D'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#072B43'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0B3C5D'}
        >
          Sign In
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center pb-20 mt-10 md:mt-0">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 dark:bg-primary-dark/30 text-primary dark:text-primary-light text-xs font-semibold uppercase tracking-wide mb-6 border border-primary/20 dark:border-primary-dark/80 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          Now with AI-Powered Drafting
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold text-methodist-blue tracking-tight mb-6 max-w-4xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
          Connect with your congregation <br className="hidden md:block"/> like never before.
        </h1>
        
        <p className="text-lg md:text-xl text-muted mb-10 max-w-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          Church Konet is the all-in-one messaging platform designed for modern ministries. Manage members, automate birthday wishes, and send broadcast SMS with ease.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
          <Link
            to="/login"
            className="px-8 py-4 font-bold rounded-xl transition-all shadow-lg text-center"
            style={{
              backgroundColor: '#0B3C5D',
              color: '#FFFFFF'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#072B43'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0B3C5D'}
          >
            Get Started
          </Link>
          <button
            onClick={() => {
              const featuresSection = document.querySelector('main');
              featuresSection?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-8 py-4 border-2 font-bold rounded-xl transition-colors text-center"
            style={{
              borderColor: '#0B3C5D',
              color: '#0B3C5D'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#0B3C5D';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#0B3C5D';
            }}
          >
            View Demo
          </button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 w-full max-w-6xl text-left animate-in fade-in zoom-in duration-700 delay-500">
           <div className="p-6 bg-white rounded-2xl border-t-4 border-methodist-blue shadow-sm hover:shadow-md transition-shadow">
             <div className="w-12 h-12 bg-methodist-blue rounded-lg flex items-center justify-center text-2xl mb-4 text-methodist-white">📨</div>
             <h3 className="text-lg font-bold text-ink mb-2">Smart Broadcasts</h3>
             <p className="text-muted">Send personalized SMS updates to specific groups, organizations, or the entire church instantly.</p>
           </div>
           <div className="p-6 bg-white rounded-2xl border-t-4 border-methodist-gold shadow-sm hover:shadow-md transition-shadow">
             <div className="w-12 h-12 bg-methodist-gold rounded-lg flex items-center justify-center text-2xl mb-4 text-methodist-blue">🎂</div>
             <h3 className="text-lg font-bold text-ink mb-2">Automated Birthdays</h3>
             <p className="text-muted">Never miss a special day. Automatically track and send birthday wishes to your members.</p>
           </div>
           <div className="p-6 bg-white rounded-2xl border-t-4 border-methodist-red shadow-sm hover:shadow-md transition-shadow">
             <div className="w-12 h-12 bg-methodist-red rounded-lg flex items-center justify-center text-2xl mb-4 text-methodist-white">🤖</div>
             <h3 className="text-lg font-bold text-ink mb-2">AI Assistance</h3>
             <p className="text-muted">Stuck on what to say? Let our integrated Gemini AI draft professional and engaging messages for you.</p>
           </div>
        </div>
      </main>
      
      <footer className="py-8 text-center text-muted text-sm">
        &copy; {new Date().getFullYear()} Church Konet. All rights reserved.
      </footer>
    </div>
  );
};

export default Welcome;
