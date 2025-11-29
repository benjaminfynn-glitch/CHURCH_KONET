
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Broadcast from './pages/Broadcast';
import Members from './pages/Members';
import MemberProfile from './pages/MemberProfile';
import Settings from './pages/Settings';
import { ToastProvider } from './context/ToastContext';
import { MembersProvider } from './context/MembersContext';
import { SettingsProvider } from './context/SettingsContext';

const App: React.FC = () => {
  return (
    <ToastProvider>
      <SettingsProvider>
        <MembersProvider>
          <HashRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="broadcast" element={<Broadcast />} />
                <Route path="members" element={<Members />} />
                <Route path="members/:id" element={<MemberProfile />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </HashRouter>
        </MembersProvider>
      </SettingsProvider>
    </ToastProvider>
  );
};

export default App;
