
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Broadcast from './pages/Broadcast';
import Members from './pages/Members';
import MemberProfile from './pages/MemberProfile';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Welcome from './pages/Welcome';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ToastProvider } from './context/ToastContext';
import { MembersProvider } from './context/MembersContext';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider } from './context/AuthContext';

const App: React.FC = () => {
  return (
    <ToastProvider>
      <SettingsProvider>
        <AuthProvider>
          <MembersProvider>
            <HashRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Welcome />} />
                <Route path="/login" element={<Login />} />
                
                {/* Protected Routes - Wrapped in Layout */}
                <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/broadcast" element={<Broadcast />} />
                  <Route path="/members" element={<Members />} />
                  <Route path="/members/:id" element={<MemberProfile />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>

                {/* Catch all redirect to dashboard (which handles auth redirect) or welcome */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </HashRouter>
          </MembersProvider>
        </AuthProvider>
      </SettingsProvider>
    </ToastProvider>
  );
};

export default App;
