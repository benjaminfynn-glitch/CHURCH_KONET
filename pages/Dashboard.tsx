
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VolumeChart, DeliveryChart, PersonalizationChart, BirthdayDistributionChart } from '../components/DashboardStats';
import { useSettings } from '../context/SettingsContext';
import { useMembers } from '../context/MembersContext';
import { SentMessage, Member } from '../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { theme, birthdaySettings } = useSettings();
  const { members, organizations, activityLog, sentMessages } = useMembers();

  // State for Duplicate Birthday Check
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicateDetails, setDuplicateDetails] = useState<{ member: Member, lastMsg: SentMessage } | null>(null);

  // 1. Calculate Stats
  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.opt_in).length;
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
    const birthdayMessage = `Happy Birthday, {$name}\nMay God's light and love shine brightly upon you, filling your day and the year ahead with abundant blessings and happiness. We're so grateful for your wonderful presence at Bethel Society, Efutu.\n\nBethel, Nyame wa ha!`;

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

  const recentLogs = activityLog.slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Overview of church engagement and messaging.</p>
        </div>
        <div className="text-right bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
           <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-1">SMS Credits</p>
           <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">GHS 1,042.50</p>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Members', value: totalMembers, icon: '👥', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Active Members', value: activeMembers, icon: '✨', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: birthdayData.label, value: birthdayData.count, icon: '🎂', color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-900/20' },
          { label: 'Msgs Sent (Month)', value: messagesSentMonth.toLocaleString(), icon: '📨', color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 group">
             <div className="flex justify-between items-start">
               <div>
                 <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
                 <h3 className="text-3xl font-bold text-slate-900 dark:text-white group-hover:scale-105 transition-transform origin-left">{stat.value}</h3>
               </div>
               <div className={`p-3 rounded-lg ${stat.bg} ${stat.color} text-xl`}>
                 {stat.icon}
               </div>
             </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Analytics (2/3 width) */}
        <div className="xl:col-span-2 space-y-8">
           {/* Charts Grid */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                 <VolumeChart />
              </div>
              
              <div className="md:col-span-2 cursor-pointer">
                 <BirthdayDistributionChart members={members} onBarClick={handleChartClick} />
              </div>

              <DeliveryChart />
              <PersonalizationChart />
           </div>

           {/* Activity Log */}
           <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 dark:text-white">Recent Activity</h3>
                  <button onClick={() => navigate('/settings')} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">View All</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-medium">
                        <tr>
                            <th className="px-6 py-3">Timestamp</th>
                            <th className="px-6 py-3">Action</th>
                            <th className="px-6 py-3">User</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {recentLogs.map(log => (
                          <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                              <td className="px-6 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{new Date(log.timestamp).toLocaleDateString()} <span className="text-xs">{new Date(log.timestamp).toLocaleTimeString()}</span></td>
                              <td className="px-6 py-3 font-medium text-slate-800 dark:text-white">{log.action}</td>
                              <td className="px-6 py-3 text-slate-600 dark:text-slate-300">{log.user}</td>
                          </tr>
                        ))}
                        {recentLogs.length === 0 && (
                           <tr><td colSpan={3} className="px-6 py-4 text-center text-slate-400">No activity recorded yet.</td></tr>
                        )}
                    </tbody>
                </table>
              </div>
           </div>
        </div>

        {/* Right Column: Birthdays & Shortcuts (1/3 width) */}
        <div className="space-y-8">
           {/* Upcoming Birthdays Widget */}
           <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-[500px] transition-colors">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                 <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    <span>🎉</span> {birthdayData.label}
                 </h3>
                 <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Celebrating {birthdayData.count} members</p>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                 {birthdayData.list.map(member => {
                    const isToday = new Date().getDate() === parseInt(member.birthday.split('-')[2]) && (new Date().getMonth() + 1) === parseInt(member.birthday.split('-')[1]);
                    return (
                       <div key={member.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${isToday ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' : 'bg-white dark:bg-slate-700/50 border-slate-100 dark:border-slate-600'}`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${isToday ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'}`}>
                             {member.name.charAt(0)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                             <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{member.name}</p>
                             <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <span>Turning {member.turningAge}</span>
                                <span>•</span>
                                <span className={isToday ? 'text-indigo-600 font-bold' : ''}>
                                    {isToday ? 'TODAY' : member.birthday.split('-').slice(1).reverse().join('/')}
                                </span>
                             </div>
                          </div>

                          {isToday && (
                              <button 
                                 onClick={() => handleSendBirthdayMessage(member)}
                                 className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-full transition-colors"
                                 title="Send Birthday Message"
                              >
                                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                              </button>
                          )}
                       </div>
                    );
                 })}
                 
                 {birthdayData.list.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
                        <span className="text-4xl mb-2">📅</span>
                        <p>No birthdays found in this period.</p>
                        <button onClick={() => navigate('/settings')} className="text-sm text-indigo-600 mt-2 hover:underline">Change Period</button>
                    </div>
                 )}
              </div>
           </div>

           {/* Quick Stats Grid */}
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                 <p className="text-xs text-slate-500 uppercase font-bold">Scheduled</p>
                 <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{scheduledMessages}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                 <p className="text-xs text-slate-500 uppercase font-bold">Organizations</p>
                 <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{totalOrgs}</p>
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
                              A birthday message has already been sent to <span className="font-bold">{duplicateDetails.member.name}</span> today.
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
                          className="px-4 py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors shadow-sm"
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
