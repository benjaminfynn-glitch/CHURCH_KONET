
import React from 'react';
import { Link } from 'react-router-dom';

const Welcome: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col font-sans transition-colors duration-200">
      {/* Navbar */}
      <nav className="w-full px-6 py-4 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⛪</span>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">CHURCH KONET</h1>
        </div>
        <Link 
          to="/login"
          className="px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-white font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm shadow-sm"
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
        
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6 max-w-4xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
          Connect with your congregation <br className="hidden md:block"/> like never before.
        </h1>
        
        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          Church Konet is the all-in-one messaging platform designed for modern ministries. Manage members, automate birthday wishes, and send broadcast SMS with ease.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
          <Link 
            to="/login"
            className="px-8 py-4 bg-methodist-blue text-methodist-white font-bold rounded-xl hover:bg-opacity-90 transition-all shadow-lg shadow-methodist-blue/20 text-center"
          >
            Get Started
          </Link>
          <button className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-white font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-center shadow-sm">
            View Demo
          </button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 w-full max-w-6xl text-left animate-in fade-in zoom-in duration-700 delay-500">
           <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-2xl mb-4">📨</div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Smart Broadcasts</h3>
              <p className="text-slate-500 dark:text-slate-400">Send personalized SMS updates to specific groups, organizations, or the entire church instantly.</p>
           </div>
           <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center text-2xl mb-4">🎂</div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Automated Birthdays</h3>
              <p className="text-slate-500 dark:text-slate-400">Never miss a special day. Automatically track and send birthday wishes to your members.</p>
           </div>
           <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-2xl mb-4">🤖</div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">AI Assistance</h3>
              <p className="text-slate-500 dark:text-slate-400">Stuck on what to say? Let our integrated Gemini AI draft professional and engaging messages for you.</p>
           </div>
        </div>
      </main>
      
      <footer className="py-8 text-center text-slate-400 dark:text-slate-600 text-sm">
        &copy; {new Date().getFullYear()} Church Konet. All rights reserved.
      </footer>
    </div>
  );
};

export default Welcome;
