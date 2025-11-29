import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeMode, BirthdaySettings, BirthdayPeriod } from '../types';

interface SettingsContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  birthdaySettings: BirthdaySettings;
  updateBirthdaySettings: (settings: BirthdaySettings) => void;
  // Sidebar State
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme State
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('app_theme');
    return (saved as ThemeMode) || 'light';
  });

  // Birthday Settings State
  const [birthdaySettings, setBirthdaySettings] = useState<BirthdaySettings>(() => {
    const saved = localStorage.getItem('app_birthday_settings');
    return saved ? JSON.parse(saved) : { period: 'week' };
  });

  // Sidebar State
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('app_sidebar_collapsed');
    return saved === 'true';
  });

  // Apply Theme Side Effect
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  // Persist Birthday Settings
  useEffect(() => {
    localStorage.setItem('app_birthday_settings', JSON.stringify(birthdaySettings));
  }, [birthdaySettings]);

  // Persist Sidebar State
  useEffect(() => {
    localStorage.setItem('app_sidebar_collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const updateBirthdaySettings = (settings: BirthdaySettings) => {
    setBirthdaySettings(settings);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  return (
    <SettingsContext.Provider value={{ theme, toggleTheme, birthdaySettings, updateBirthdaySettings, sidebarCollapsed, toggleSidebar }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};