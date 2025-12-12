import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useMembers } from '../context/MembersContext';
import { useToast } from '../context/ToastContext';
import { BirthdayPeriod } from '../types';

const Settings: React.FC = () => {
  const { theme, toggleTheme, birthdaySettings, updateBirthdaySettings } = useSettings();
  const { 
    users, deleteUser,
    organizations, addOrganization, deleteOrganization, updateOrganization,
    templates, addTemplate, deleteTemplate,
    activityLog 
  } = useMembers();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'users'|'theme'|'birthdays'|'orgs'|'templates'|'logs'>('theme');

  // Org State
  const [newOrgName, setNewOrgName] = useState('');
  const [editingOrg, setEditingOrg] = useState<{old: string, new: string} | null>(null);

  // Template State
  const [newTemplate, setNewTemplate] = useState({ title: '', content: '' });

  const tabs = [
    { id: 'theme', label: 'Theme & Appearance', icon: '🎨' },
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'birthdays', label: 'Birthday Settings', icon: '🎂' },
    { id: 'orgs', label: 'Organizations', icon: '🏢' },
    { id: 'templates', label: 'Message Templates', icon: '📝' },
    { id: 'logs', label: 'Activity Log', icon: '📜' },
  ];

  return (
    <div className="space-y-6">
       <div>
           <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h2>
           <p className="text-slate-500 dark:text-slate-400">Configure application preferences and manage data.</p>
       </div>

       <div className="flex flex-col lg:flex-row gap-8">
           {/* Sidebar Navigation */}
           <div className="w-full lg:w-64 flex flex-col gap-1">
               {tabs.map(tab => (
                   <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id as any)}
                     className={`text-left px-4 py-3 rounded-lg font-medium flex items-center gap-3 transition-colors ${activeTab === tab.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                   >
                       <span>{tab.icon}</span>
                       {tab.label}
                   </button>
               ))}
           </div>

           {/* Main Content Area */}
           <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 min-h-[500px] transition-colors">
               
               {/* Theme Settings */}
               {activeTab === 'theme' && (
                   <div className="space-y-6">
                       <h3 className="text-lg font-bold text-slate-900 dark:text-white">Theme & Appearance</h3>
                       <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-600 rounded-lg">
                           <div>
                               <p className="font-medium text-slate-800 dark:text-white">Dark Mode</p>
                               <p className="text-sm text-slate-500 dark:text-slate-400">Toggle between light and dark visual themes.</p>
                           </div>
                           <button 
                             onClick={toggleTheme}
                             className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-300'}`}
                           >
                               <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
                           </button>
                       </div>
                   </div>
               )}

               {/* Birthday Settings */}
               {activeTab === 'birthdays' && (
                   <div className="space-y-6">
                       <h3 className="text-lg font-bold text-slate-900 dark:text-white">Birthday Reminder Period</h3>
                       <div className="grid gap-4">
                           {(['week', 'month', 'quarter', 'year'] as BirthdayPeriod[]).map(period => (
                               <label key={period} className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${birthdaySettings.period === period ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                                   <input 
                                     type="radio" 
                                     name="birthdayPeriod" 
                                     checked={birthdaySettings.period === period}
                                     onChange={() => updateBirthdaySettings({ ...birthdaySettings, period })}
                                     className="text-indigo-600 focus:ring-indigo-500"
                                   />
                                   <div>
                                       <span className="font-medium text-slate-800 dark:text-white capitalize">This {period}</span>
                                       <p className="text-xs text-slate-500 dark:text-slate-400">Show birthdays happening within the current {period}.</p>
                                   </div>
                               </label>
                           ))}
                           
                           {/* Custom (Placeholder for now) */}
                           <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${birthdaySettings.period === 'custom' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
                               <input 
                                     type="radio" 
                                     name="birthdayPeriod" 
                                     checked={birthdaySettings.period === 'custom'}
                                     onChange={() => updateBirthdaySettings({ ...birthdaySettings, period: 'custom', customRange: { start: new Date().toISOString(), end: new Date().toISOString() } })} // Mock default
                                     className="text-indigo-600 focus:ring-indigo-500"
                               />
                               <div>
                                   <span className="font-medium text-slate-800 dark:text-white">Custom Date Range</span>
                                   <p className="text-xs text-slate-500 dark:text-slate-400">Select specific start and end dates.</p>
                               </div>
                           </label>
                       </div>
                   </div>
               )}

               {/* User Management */}
               {activeTab === 'users' && (
                   <div className="space-y-6">
                       <h3 className="text-lg font-bold text-slate-900 dark:text-white">User Management</h3>
                       <div className="overflow-x-auto">
                           <table className="w-full text-sm text-left">
                               <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-medium">
                                   <tr>
                                       <th className="px-4 py-3">Name</th>
                                       <th className="px-4 py-3">Email</th>
                                       <th className="px-4 py-3">Role</th>
                                       <th className="px-4 py-3 text-right">Actions</th>
                                   </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                   {users.map(user => (
                                       <tr key={user.id}>
                                           <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{user.fullName}</td>
                                           <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{user.email}</td>
                                           <td className="px-4 py-3">
                                               <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-semibold">{user.role}</span>
                                           </td>
                                           <td className="px-4 py-3 text-right">
                                               <button 
                                                 onClick={() => {
                                                     deleteUser(user.id);
                                                     addToast('User deleted successfully', 'success');
                                                 }}
                                                 className="text-red-500 hover:text-red-700 dark:hover:text-red-400 text-sm font-medium"
                                               >
                                                   Delete
                                               </button>
                                           </td>
                                       </tr>
                                   ))}
                               </tbody>
                           </table>
                       </div>
                   </div>
               )}

               {/* Organization Management */}
               {activeTab === 'orgs' && (
                   <div className="space-y-6">
                       <div className="flex justify-between items-center">
                           <h3 className="text-lg font-bold text-slate-900 dark:text-white">Organization Management</h3>
                       </div>
                       
                       <div className="flex gap-2">
                           <input 
                             type="text" 
                             value={newOrgName}
                             onChange={e => setNewOrgName(e.target.value)}
                             placeholder="New Organization Name"
                             className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white"
                           />
                           <button 
                             onClick={() => {
                                 if(newOrgName) {
                                     addOrganization(newOrgName);
                                     setNewOrgName('');
                                     addToast('Organization added', 'success');
                                 }
                             }}
                             className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
                           >
                               Add
                           </button>
                       </div>

                       <ul className="space-y-2 max-h-96 overflow-y-auto">
                           {organizations.map(org => (
                               <li key={org} className="flex justify-between items-center p-3 border border-slate-100 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                   {editingOrg?.old === org ? (
                                       <div className="flex gap-2 flex-1">
                                           <input 
                                             value={editingOrg.new}
                                             onChange={e => setEditingOrg({...editingOrg, new: e.target.value})}
                                             className="flex-1 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm dark:bg-slate-800 dark:text-white"
                                           />
                                           <button onClick={() => { updateOrganization(org, editingOrg.new); setEditingOrg(null); }} className="text-green-600 text-xs font-bold">SAVE</button>
                                           <button onClick={() => setEditingOrg(null)} className="text-slate-400 text-xs">CANCEL</button>
                                       </div>
                                   ) : (
                                       <span className="text-slate-700 dark:text-slate-200 font-medium">{org}</span>
                                   )}
                                   
                                   {!editingOrg && (
                                       <div className="flex gap-3">
                                           <button onClick={() => setEditingOrg({old: org, new: org})} className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400">Edit</button>
                                           <button onClick={() => { deleteOrganization(org); addToast('Organization deleted', 'success'); }} className="text-slate-400 hover:text-red-600 dark:hover:text-red-400">Delete</button>
                                       </div>
                                   )}
                               </li>
                           ))}
                       </ul>
                   </div>
               )}

               {/* Template Management */}
               {activeTab === 'templates' && (
                   <div className="space-y-6">
                       <h3 className="text-lg font-bold text-slate-900 dark:text-white">Message Templates</h3>
                       
                       <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-3">
                           <input 
                             placeholder="Template Title"
                             value={newTemplate.title}
                             onChange={e => setNewTemplate({...newTemplate, title: e.target.value})}
                             className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white"
                           />
                           <textarea 
                             placeholder="Message Content..."
                             value={newTemplate.content}
                             onChange={e => setNewTemplate({...newTemplate, content: e.target.value})}
                             className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white"
                             rows={2}
                           />
                           <button 
                             onClick={() => {
                                 if(newTemplate.title && newTemplate.content) {
                                     addTemplate({ id: Date.now().toString(), ...newTemplate });
                                     setNewTemplate({ title: '', content: '' });
                                     addToast('Template added', 'success');
                                 }
                             }}
                             className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
                           >
                               Add New Template
                           </button>
                       </div>

                       <div className="space-y-3">
                           {templates.map(t => (
                               <div key={t.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg relative group">
                                   <h4 className="font-bold text-slate-800 dark:text-white">{t.title}</h4>
                                   <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{t.content}</p>
                                   <button 
                                     onClick={() => { deleteTemplate(t.id); addToast('Template deleted', 'success'); }}
                                     className="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                                   >
                                       DELETE
                                   </button>
                               </div>
                           ))}
                       </div>
                   </div>
               )}

               {/* Activity Log */}
               {activeTab === 'logs' && (
                   <div className="space-y-6">
                       <h3 className="text-lg font-bold text-slate-900 dark:text-white">Activity Log</h3>
                       <div className="max-h-[500px] overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                           <table className="w-full text-sm text-left">
                               <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-medium sticky top-0">
                                   <tr>
                                       <th className="px-4 py-3">Time</th>
                                       <th className="px-4 py-3">Action</th>
                                       <th className="px-4 py-3">User</th>
                                       <th className="px-4 py-3">Details</th>
                                   </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                   {activityLog.map(log => (
                                       <tr key={log.id}>
                                           <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                               {new Date(log.timestamp).toLocaleString()}
                                           </td>
                                           <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{log.action}</td>
                                           <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{log.user}</td>
                                           <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">{log.description}</td>
                                       </tr>
                                   ))}
                                   {activityLog.length === 0 && (
                                       <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No recent activity.</td></tr>
                                   )}
                               </tbody>
                           </table>
                       </div>
                   </div>
               )}

           </div>
       </div>
    </div>
  );
};

export default Settings;