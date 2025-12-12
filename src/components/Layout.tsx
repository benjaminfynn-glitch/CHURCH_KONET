
import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';

// Simple SVG Icons
const Icons = {
  Dashboard: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>,
  Broadcast: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 5"></path><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"></path><circle cx="12" cy="12" r="2"></circle><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"></path><path d="M19.1 5c3.9 3.9 3.9 10.2 0 14.1"></path></svg>,
  Members: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
  Settings: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
  Menu: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>,
  ChevronLeft: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>,
  ChevronRight: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>,
  Logout: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
};

const Layout: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar } = useSettings();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <Icons.Dashboard /> },
    { name: 'Broadcast', path: '/broadcast', icon: <Icons.Broadcast /> },
    { name: 'Members', path: '/members', icon: <Icons.Members /> },
    { name: 'Settings', path: '/settings', icon: <Icons.Settings /> },
  ];

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full overflow-hidden bg-gradient-to-b from-church-cream to-white dark:from-slate-800 dark:to-slate-900">
       <div className="p-6 border-b border-amber-200 dark:border-slate-700 flex items-center h-[73px] whitespace-nowrap overflow-hidden">
         <div className="text-3xl mr-3 min-w-[24px] text-church-gold">✞</div>
         
         <h1 className={`
            font-church font-bold text-church-brown dark:text-church-gold tracking-tight text-xl transition-all duration-300
            ${!isMobile && sidebarCollapsed
              ? 'lg:opacity-0 lg:w-0 lg:group-hover/sidebar:opacity-0 lg:group-hover/sidebar:w-0'
              : 'lg:opacity-100 lg:w-auto'
            }
            md:opacity-0 md:w-0 md:group-hover/sidebar:opacity-100 md:group-hover/sidebar:w-auto
         `}>
           <span className="text-church-gold">CHURCH</span> KONET
         </h1>
       </div>

       <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap
                 ${isActive
                    ? 'bg-amber-50 dark:bg-amber-900/20 text-church-brown dark:text-church-gold border-l-4 border-church-gold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-church-brown dark:hover:text-church-gold border-l-4 border-transparent'
                 }
                `
              }
            >
              <span className="min-w-[24px] flex justify-center">
                {item.icon}
              </span>
              
              <span className={`
                ml-3 transition-all duration-300 font-body
                ${!isMobile && sidebarCollapsed
                    ? 'lg:opacity-0 lg:translate-x-[-10px] lg:group-hover/sidebar:opacity-0 lg:group-hover/sidebar:translate-x-[-10px]'
                    : 'lg:opacity-100 lg:translate-x-0'
                }
                md:opacity-0 md:translate-x-[-10px] md:group-hover/sidebar:opacity-100 md:group-hover/sidebar:translate-x-0
              `}>
                {item.name}
              </span>
            </NavLink>
          ))}
       </nav>

       {!isMobile && (
        <div className="hidden lg:flex p-4 border-t border-amber-200 dark:border-slate-700 justify-end">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg bg-amber-100 dark:bg-slate-700 text-church-brown dark:text-church-gold hover:bg-amber-200 transition-colors"
            aria-label={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {sidebarCollapsed ? <Icons.ChevronRight /> : <Icons.ChevronLeft />}
          </button>
        </div>
       )}
       
       <div className={`
         p-4 border-t border-amber-200 dark:border-slate-700 overflow-hidden whitespace-nowrap transition-all duration-300
         ${!isMobile && sidebarCollapsed
           ? 'lg:h-0 lg:p-0 lg:group-hover/sidebar:h-0 lg:group-hover/sidebar:p-0 lg:border-none'
           : 'lg:h-auto'
         }
         md:h-0 md:p-0 md:group-hover/sidebar:h-auto md:group-hover/sidebar:p-4
       `}>
         <div className="bg-amber-50 dark:bg-slate-800 rounded-lg p-3 border border-amber-200 dark:border-slate-700 space-y-3 shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-church-brown dark:text-church-gold uppercase truncate">System Status</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-church-green animate-pulse"></span>
                <span className="text-xs text-church-brown dark:text-church-gold font-medium">Online</span>
              </div>
            </div>
            
            <div className="pt-3 border-t border-amber-200 dark:border-slate-600">
               <div className="flex items-center gap-2 mb-2">
                 <div className="w-6 h-6 rounded-full bg-church-gold flex items-center justify-center text-xs font-bold text-white">
                    {user?.fullName?.charAt(0) || 'A'}
                 </div>
                 <p className="text-xs font-medium text-church-brown dark:text-church-gold truncate">{user?.fullName || 'User'}</p>
               </div>
               <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 text-xs text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded transition-colors"
               >
                 <Icons.Logout />
                 <span>Sign Out</span>
               </button>
            </div>
         </div>
       </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-church-cream to-amber-50 dark:from-slate-900 dark:to-slate-800 transition-colors duration-200 overflow-hidden">
      
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-50 w-3/4 max-w-xs bg-gradient-to-b from-church-cream to-white dark:from-slate-800 dark:to-slate-900 shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
         <SidebarContent isMobile={true} />
      </div>

      <aside
        className={`
          hidden md:flex flex-col bg-gradient-to-b from-church-cream to-white dark:from-slate-800 dark:to-slate-900 border-r border-amber-200 dark:border-slate-700 shadow-lg
          transition-all duration-300 ease-in-out z-30 relative group/sidebar
          ${sidebarCollapsed
            ? 'lg:w-20 lg:hover:w-20'
            : 'lg:w-64'
          }
          md:w-20 md:hover:w-64
        `}
      >
        <SidebarContent />
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gradient-to-br from-church-cream to-amber-50 dark:from-slate-900 dark:to-slate-800">
        <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-amber-200 dark:border-slate-700 px-4 py-3 flex justify-between items-center md:hidden sticky top-0 z-20 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 -ml-2 text-church-brown dark:text-church-gold hover:bg-amber-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                aria-label="Open Menu"
              >
                <Icons.Menu />
              </button>
              <h1 className="text-lg font-church font-bold text-church-brown dark:text-church-gold flex items-center gap-2">
                <span className="text-church-gold">✞</span> CHURCH KONET
              </h1>
            </div>
        </header>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
           <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
