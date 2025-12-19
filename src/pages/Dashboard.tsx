
import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BirthdayDistributionChart } from '../components/DashboardStats';
import DashboardCard from '../components/DashboardCard';
import PrimaryButton from '../components/PrimaryButton';
import { useSettings } from '../context/SettingsContext';
import { useMembers } from '../context/MembersContext';
import { useAuth } from '../context/AuthContext';
import { formatISOToDDMMYYYYWithHyphens } from '../utils/date';
import { SentMessage, Member } from '../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { theme, birthdaySettings } = useSettings();
  const { members, organizations, activityLog, sentMessages } = useMembers();
  const { logout, user } = useAuth();

  // State for Duplicate Birthday Check
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicateDetails, setDuplicateDetails] = useState<{ member: Member, lastMsg: SentMessage } | null>(null);

  // SMS Balance removed - not needed for core functionality

  // 1. Calculate Stats
  const activeMembers = members.filter(m => {
    // Handle both boolean and string values for robustness
    const isActive = typeof m.isActive === 'boolean' ? m.isActive : m.isActive === 'true';
    const optIn = typeof m.opt_in === 'boolean' ? m.opt_in : m.opt_in === 'true';
    return isActive && optIn;
  });
  const totalMembers = activeMembers.length;

  // Debug logging
  console.log('Dashboard Debug:', {
    totalMembersInDB: members.length,
    activeMembersCount: totalMembers,
    membersSample: members.slice(0, 3).map(m => ({
      id: m.id,
      fullName: m.fullName,
      isActive: m.isActive,
      opt_in: m.opt_in,
      status: m.status
    })),
    inactiveMembers: members.filter(m => !m.isActive).length,
    optedOutMembers: members.filter(m => !m.opt_in).length
  });

  // Age-based breakdown for active members
  const ageBreakdown = useMemo(() => {
    const now = new Date();
    const breakdown = {
      children: { male: 0, female: 0 },
      teens: { male: 0, female: 0 },
      adults: { male: 0, female: 0 }
    };

    activeMembers.forEach(member => {
      if (!member.birthday) return;
      const birthDate = new Date(member.birthday);
      const age = now.getFullYear() - birthDate.getFullYear() -
        (now < new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate()) ? 1 : 0);

      let group: keyof typeof breakdown;
      if (age < 13) group = 'children';
      else if (age < 20) group = 'teens';
      else group = 'adults';

      if (member.gender === 'Male') breakdown[group].male++;
      else if (member.gender === 'Female') breakdown[group].female++;
    });

    return breakdown;
  }, [activeMembers]);

  const totalOrgs = organizations.length;
  
  // Calculate Messages Sent This Month
  const messagesSentMonth = useMemo(() => {
    const now = new Date();
    return sentMessages.filter(msg => {
        const d = new Date(msg.timestamp);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [sentMessages]);

  const scheduledMessages = 0; // Currently 0 as we don't have persistent scheduled state connected to backend yet

  // 2. Dynamic Birthday Logic
  const birthdayData = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // Filter
    const upcoming = members.filter(m => {
        if (!m.birthday) return false;
        const [y, month, day] = m.birthday.split('-').map(Number);
        
        let bdayDate = new Date(currentYear, month - 1, day);
        if (bdayDate < new Date(today.setHours(0,0,0,0))) {
            bdayDate.setFullYear(currentYear + 1);
        }

        if (birthdaySettings.period === 'week') {
            const nextWeek = new Date();
            nextWeek.setDate(today.getDate() + 7);
            return bdayDate >= new Date(new Date().setHours(0,0,0,0)) && bdayDate <= nextWeek;
        } 
        else if (birthdaySettings.period === 'month') {
             return bdayDate.getMonth() === today.getMonth() && bdayDate.getFullYear() === currentYear;
        }
        else if (birthdaySettings.period === 'quarter') {
             const currentQuarter = Math.floor((today.getMonth() + 3) / 3);
             const bdayQuarter = Math.floor((bdayDate.getMonth() + 3) / 3);
             return currentQuarter === bdayQuarter && bdayDate.getFullYear() === currentYear;
        }
        else if (birthdaySettings.period === 'year') {
             return bdayDate.getFullYear() === currentYear;
        }
        else if (birthdaySettings.period === 'custom' && birthdaySettings.customRange) {
             const start = new Date(birthdaySettings.customRange.start);
             const end = new Date(birthdaySettings.customRange.end);
             return bdayDate >= start && bdayDate <= end;
        }
        return false;
    }).map(m => {
        // Calculate turning age
        const [y] = m.birthday.split('-').map(Number);
        const age = currentYear - y; 
        return { ...m, turningAge: age };
    }).sort((a, b) => {
        const [y1, m1, d1] = a.birthday.split('-').map(Number);
        const [y2, m2, d2] = b.birthday.split('-').map(Number);
        if (m1 !== m2) return m1 - m2;
        return d1 - d2;
    });

    const label = {
        week: 'Birthdays This Week',
        month: 'Birthdays This Month',
        quarter: 'Birthdays This Quarter',
        year: 'Birthdays This Year',
        custom: 'Birthdays (Custom)'
    }[birthdaySettings.period];

    return { list: upcoming, label, count: upcoming.length };
  }, [members, birthdaySettings]);

  const handleSendBirthdayMessage = (member: Member) => {
    // Check for existing birthday message sent TODAY
    const todayStr = new Date().toDateString();
    
    const existingMsg = sentMessages.find(msg => 
        msg.memberId === member.id && 
        msg.type === 'birthday' && 
        new Date(msg.timestamp).toDateString() === todayStr
    );

    if (existingMsg) {
        setDuplicateDetails({ member, lastMsg: existingMsg });
        setDuplicateModalOpen(true);
    } else {
        proceedToBroadcast(member);
    }
  };

  const proceedToBroadcast = (member: Member) => {
    // Get the first name of the member
    const firstName = member.fullName?.split(' ')[0] || 'Friend';
    const birthdayMessage = `Happy Birthday, ${firstName}!\nMay God's light and love shine brightly upon you, filling your day and the year ahead with abundant blessings and happiness. We're so grateful for your wonderful presence at Bethel Society, Efutu.\n\nBethel, Nyame wa ha!`;

    navigate('/broadcast', {
        state: {
            recipientId: member.id,
            initialMessage: birthdayMessage,
            isBirthday: true
        }
    });
  };

  const handleChartClick = (monthIndex: number) => {
      navigate('/members', { state: { filterMonth: monthIndex } });
  };
  
  const handleLogout = () => {
      logout();
      navigate('/login');
  };

  const recentLogs = activityLog.slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold text-primary tracking-tight mb-2">Church Dashboard</h2>
          <p className="text-primary/70 mt-1">Managing our congregation with faith and technology</p>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-primary/50">📅 {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            {user && (
              <>
                <span className="text-sm text-primary/70">Welcome, {user.fullName}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  user.role === 'admin'
                    ? 'bg-secondary/10 text-secondary border border-secondary/20'
                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                }`}>
                  {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
            <PrimaryButton
                onClick={handleLogout}
                variant="secondary"
                size="sm"
                className="flex flex-col gap-1"
                title="Log Out"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                <span className="text-[10px] font-bold uppercase hidden md:block">Logout</span>
            </PrimaryButton>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Active Members"
          value={totalMembers}
          icon="👥"
          color="blue"
        />
        <DashboardCard
          title="SMS Sent This Month"
          value={messagesSentMonth}
          icon="💬"
          color="green"
        />
        <DashboardCard
          title={birthdayData.label}
          value={birthdayData.count}
          icon="🎂"
          color="purple"
        />
        <DashboardCard
          title="Organizations"
          value={totalOrgs}
          icon="🏢"
          color="orange"
        />
      </div>

      {/* Member Breakdown */}
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl border border-primary/20 shadow-lg p-6">
        <h3 className="text-lg font-bold text-primary mb-4">Member Breakdown by Age & Gender</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Children */}
          <div className="text-center">
            <h4 className="font-semibold text-primary mb-2">Children (0-12)</h4>
            <div className="flex justify-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{ageBreakdown.children.male}</div>
                <div className="text-sm text-primary/70">Male</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-600">{ageBreakdown.children.female}</div>
                <div className="text-sm text-primary/70">Female</div>
              </div>
            </div>
          </div>

          {/* Teens */}
          <div className="text-center">
            <h4 className="font-semibold text-primary mb-2">Teens (13-19)</h4>
            <div className="flex justify-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{ageBreakdown.teens.male}</div>
                <div className="text-sm text-primary/70">Male</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-600">{ageBreakdown.teens.female}</div>
                <div className="text-sm text-primary/70">Female</div>
              </div>
            </div>
          </div>

          {/* Adults */}
          <div className="text-center">
            <h4 className="font-semibold text-primary mb-2">Adults (20+)</h4>
            <div className="flex justify-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{ageBreakdown.adults.male}</div>
                <div className="text-sm text-primary/70">Male</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-600">{ageBreakdown.adults.female}</div>
                <div className="text-sm text-primary/70">Female</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Analytics (2/3 width) */}
        <div className="xl:col-span-2 space-y-8">
           {/* Birthday Chart */}
           <div className="cursor-pointer">
              <BirthdayDistributionChart members={members} onBarClick={handleChartClick} />
           </div>
        </div>

        {/* Right Column: Birthdays & Shortcuts (1/3 width) */}
        <div className="space-y-8">
           {/* Upcoming Birthdays Widget */}
           <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl border border-primary/20 shadow-lg flex flex-col h-[500px] transition-colors">
               <div className="p-6 border-b border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                  <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                     <span className="text-2xl">🎂</span> {birthdayData.label}
                  </h3>
                  <p className="text-sm text-primary/70 mt-1">Celebrating {birthdayData.count} members</p>
               </div>
               
               <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {birthdayData.list.map(member => {
                     const isToday = new Date().getDate() === parseInt(member.birthday.split('-')[2]) && (new Date().getMonth() + 1) === parseInt(member.birthday.split('-')[1]);
                     return (
                        <div key={member.id} className={`flex items-center gap-3 p-4 rounded-lg border transition-colors ${isToday ? 'bg-accent/10 border-accent/30 shadow-md' : 'bg-white/50 dark:bg-slate-700/30 border-primary/20'}`}>
                           <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${isToday ? 'bg-accent text-white' : 'bg-primary/20 text-primary'}`}>
                              {member.fullName?.charAt(0)}
                           </div>

                           <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-primary truncate">{member.fullName}</p>
                              <div className="flex items-center gap-2 text-xs text-primary/70">
                                 <span>Turning {member.turningAge}</span>
                                 <span>•</span>
                                 <span className={isToday ? 'text-accent font-bold' : ''}>
                                     {isToday ? '🎉 TODAY!' : formatISOToDDMMYYYYWithHyphens(member.birthday)}
                                 </span>
                              </div>
                           </div>

                           {isToday && (
                               <button
                                  onClick={() => handleSendBirthdayMessage(member)}
                                  className="p-2.5 bg-accent text-text-light hover:bg-accent-dark rounded-full transition-colors shadow-md"
                                  title="Send Birthday Message"
                               >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                               </button>
                           )}
                        </div>
                     );
                  })}
                  
                  {birthdayData.list.length === 0 && (
                     <div className="h-full flex flex-col items-center justify-center text-primary/50 text-center">
                         <span className="text-5xl mb-3">📅</span>
                         <p className="font-medium mb-2">No birthdays found</p>
                         <p className="text-sm mb-4">in this period</p>
                         <button onClick={() => navigate('/settings')} className="text-sm text-primary hover:underline font-medium bg-primary/10 px-3 py-1 rounded-full">Change Period</button>
                     </div>
                  )}
               </div>
           </div>

           {/* Quick Stats Grid */}
           <div className="grid grid-cols-2 gap-4">
               <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-4 rounded-xl border border-primary/20 shadow-lg">
                  <p className="text-xs font-bold text-primary/70 uppercase tracking-wider">Scheduled</p>
                  <p className="text-2xl font-bold text-primary mt-1">{scheduledMessages}</p>
               </div>
               <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-4 rounded-xl border border-primary/20 shadow-lg">
                  <p className="text-xs font-bold text-primary/70 uppercase tracking-wider">Organizations</p>
                  <p className="text-2xl font-bold text-primary mt-1">{totalOrgs}</p>
               </div>
           </div>
        </div>
      </div>

      {/* Duplicate Birthday Warning Modal */}
      {duplicateModalOpen && duplicateDetails && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 border-l-4 border-amber-500">
                  <div className="flex items-start gap-4 mb-4">
                      <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full text-amber-600 dark:text-amber-400">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      </div>
                      <div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Duplicate Message Warning</h3>
                          <p className="text-slate-600 dark:text-slate-300 mt-2">
                              A birthday message has already been sent to <span className="font-bold">{duplicateDetails.member.fullName}</span> today.
                          </p>
                      </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-600 text-sm space-y-2 mb-6">
                      <p><span className="font-semibold">Phone:</span> {duplicateDetails.member.phone}</p>
                      <p><span className="font-semibold">Sent at:</span> {new Date(duplicateDetails.lastMsg.timestamp).toLocaleTimeString()}</p>
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-600">
                          <p className="font-semibold mb-1 text-xs uppercase text-slate-500 dark:text-slate-400">Last Message Content:</p>
                          <p className="italic text-slate-600 dark:text-slate-300 font-mono text-xs">{duplicateDetails.lastMsg.content}</p>
                      </div>
                  </div>

                  <div className="flex justify-end gap-3">
                      <button 
                          onClick={() => setDuplicateModalOpen(false)}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      >
                          Cancel
                      </button>
                      <button
                          onClick={() => {
                              setDuplicateModalOpen(false);
                              proceedToBroadcast(duplicateDetails.member);
                          }}
                          className="px-4 py-2 bg-accent text-text-light font-medium rounded-lg hover:bg-accent-dark transition-colors shadow-sm"
                      >
                          Send Again
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;
