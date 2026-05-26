
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Broadcast from './pages/Broadcast';
import Members from './pages/Members';
import MemberProfile from './pages/MemberProfile';
import Settings from './pages/Settings';
import ApprovalManagement from './pages/ApprovalManagement';
import Planner from './pages/Planner';
import Staff from './pages/Staff';
import ExternalPreacher from './pages/ExternalPreacher';
import Reports from './pages/Reports';
import Login from './pages/Login';
import Welcome from './pages/Welcome';
import PostLoginWelcome from './pages/PostLoginWelcome';
import { ProtectedRoute, AdminProtectedRoute } from './components/ProtectedRoute';
import { ToastProvider } from './context/ToastContext';
import { MembersProvider } from './context/MembersContext';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider } from './context/AuthContext';
import { PlannerProvider } from './context/PlannerContext';
import { StaffProvider } from './context/StaffContext';
import { ExternalPreacherProvider } from './context/ExternalPreacherContext';
import ErrorBoundary from './components/ErrorBoundary';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <SettingsProvider>
          <AuthProvider>
            <MembersProvider>
              <PlannerProvider>
                <StaffProvider>
                  <ExternalPreacherProvider>
                    <HashRouter>
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<Welcome />} />
                      <Route path="/login" element={<Login />} />

                      {/* Post-Login Welcome Page (Protected but without Layout) */}
                      <Route path="/welcome" element={
                        <ProtectedRoute>
                          <PostLoginWelcome />
                        </ProtectedRoute>
                      } />

                      {/* Protected Routes - Wrapped in Layout */}
                      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/planner" element={
                          <ErrorBoundary>
                            <Planner />
                          </ErrorBoundary>
                        } />
                        <Route path="/staff" element={
                          <ErrorBoundary>
                            <Staff />
                          </ErrorBoundary>
                        } />
                        <Route path="/external-preachers" element={
                          <ErrorBoundary>
                            <ExternalPreacher />
                          </ErrorBoundary>
                        } />
                        <Route path="/reports" element={
                          <ErrorBoundary>
                            <Reports />
                          </ErrorBoundary>
                        } />
                        <Route path="/broadcast" element={
                          <ErrorBoundary>
                            <Broadcast />
                          </ErrorBoundary>
                        } />
                        <Route path="/members" element={
                          <ErrorBoundary>
                            <Members />
                          </ErrorBoundary>
                        } />
                        <Route path="/members/:id" element={<MemberProfile />} />
                        <Route path="/settings" element={<Settings />} />
                      </Route>

                      {/* Admin-only Routes */}
                      <Route element={<AdminProtectedRoute><Layout /></AdminProtectedRoute>}>
                        <Route path="/approval-management" element={<ApprovalManagement />} />
                      </Route>

                      {/* Catch all redirect to dashboard (which handles auth redirect) or welcome */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </HashRouter>
                  </ExternalPreacherProvider>
                </StaffProvider>
              </PlannerProvider>
            </MembersProvider>
          </AuthProvider>
        </SettingsProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
