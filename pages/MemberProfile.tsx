
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Member, SentMessage } from '../types';
import { useToast } from '../context/ToastContext';
import { useMembers, formatProperCase } from '../context/MembersContext';

const formatMemberID = (id: string) => {
  const cleanId = id.replace(/\D/g, ''); 
  const padded = cleanId.padStart(5, '0');
  return `ANC-BMCE-${padded}`;
};

const getAge = (birthday: string) => {
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const formatDateDDMMYYYY = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    // Fallback for timestamps in history
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-GB'); // DD/MM/YYYY format
    }
    return dateStr;
};

const MemberProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { getMember, updateMember, organizations, sentMessages } = useMembers();

  const member = getMember(id || '');
  
  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Member>>({});

  const handleEditClick = () => {
      if (member) {
          setFormData({ ...member });
          setIsEditModalOpen(true);
      }
  };

  const handleSaveChanges = () => {
      if (!member || !id) return;
      
      // Auto-format Name and Organization
      const updates = { ...formData };
      if (updates.name) updates.name = formatProperCase(updates.name);
      if (updates.organization) updates.organization = formatProperCase(updates.organization);

      updateMember(id, updates);
      setIsEditModalOpen(false);
      addToast('Member profile updated successfully', 'success');
  };

  if (!member) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Member Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-4">The member you are looking for does not exist or has been removed.</p>
        <button 
          onClick={() => navigate('/members')}
          className="text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          &larr; Back to Members
        </button>
      </div>
    );
  }

  // Filter history for this member and sort by newest first
  const history = sentMessages
    .filter(msg => msg.memberId === member.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  const age = getAge(member.birthday);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-700 pb-6 transition-colors">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/members')}
            className="group p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            title="Back to Members"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight mb-2">{member.name}</h1>
            <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{formatMemberID(member.id)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
            Schedule SMS
          </button>
          <button 
            onClick={handleEditClick}
            className="px-4 py-2 bg-sky-500 text-white font-medium rounded-lg hover:bg-sky-600 transition-colors shadow-sm"
          >
            Edit Member
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Left Column: Personal Information */}
        <section>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white pb-3 border-b border-slate-200 dark:border-slate-700 mb-6 transition-colors">
            Personal Information
          </h2>
          
          <div className="space-y-8">
            {/* Member ID */}
            <div className="flex items-start gap-4">
              <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-slate-400 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Member ID</p>
                <span className="inline-block bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono font-semibold px-3 py-1 rounded-md text-sm tracking-wide">
                  {formatMemberID(member.id)}
                </span>
              </div>
            </div>

            {/* Gender */}
            <div className="flex items-start gap-4">
               <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-slate-400 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Gender</p>
                <p className="font-bold text-slate-900 dark:text-white">{member.gender || 'Not specified'}</p>
              </div>
            </div>

            {/* Phone */}
             <div className="flex items-start gap-4">
               <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-slate-400 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Phone Number</p>
                <div className="flex items-center gap-3">
                    <p className="font-bold text-slate-900 dark:text-white text-lg">{member.phone}</p>
                    <button className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" title="Call">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    </button>
                    <button className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" title="Message">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </button>
                </div>
              </div>
            </div>

            {/* Birthday */}
            <div className="flex items-start gap-4">
               <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-slate-400 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v2"/><path d="M12 8v2"/><path d="M17 8v2"/><path d="M7 4h.01"/><path d="M12 4h.01"/><path d="M17 4h.01"/></svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Birthday & Age</p>
                <p className="font-bold text-slate-900 dark:text-white">{member.birthday} <span className="text-slate-500 dark:text-slate-400 font-normal">(turning {age + 1})</span></p>
              </div>
            </div>

            {/* Organization */}
            <div className="flex items-start gap-4">
               <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-slate-400 mt-0.5">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Organization</p>
                <div className="flex flex-wrap gap-2">
                    {member.organization ? (
                        <span className="inline-block bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full text-sm font-semibold">
                            {member.organization}
                        </span>
                    ) : (
                        <span className="text-slate-400 italic">None</span>
                    )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Notes & Admin */}
        <section className="space-y-8">
            {/* Notes */}
            <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white pb-3 mb-4">Notes</h2>
                <div className="w-full min-h-[160px] p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {member.notes ? member.notes : <span className="text-slate-400 italic">No notes for this member.</span>}
                </div>
            </div>

            {/* Admin Actions */}
            <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white pb-3 mb-4">Admin Actions</h2>
                <button className="w-full flex items-center justify-center gap-2 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium py-3 rounded-xl border border-amber-100 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    Archive Member
                </button>
            </div>
        </section>
      </div>

      {/* SMS History Section */}
      <section className="pt-8 border-t border-slate-200 dark:border-slate-700">
         <div className="flex items-center gap-3 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 dark:text-slate-400"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">SMS History</h2>
         </div>

         {history.length > 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
                 <table className="w-full text-left text-sm">
                     <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-100 dark:border-slate-700">
                         <tr>
                             <th className="px-6 py-4">Date Sent</th>
                             <th className="px-6 py-4">Message Content</th>
                             <th className="px-6 py-4">Status</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {history.map(log => (
                            <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                    {formatDateDDMMYYYY(log.timestamp)} <span className="text-slate-400 text-xs ml-1">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </td>
                                <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                                    <p className="line-clamp-2">{log.content}</p>
                                    <div className="mt-1 flex items-center gap-2">
                                        {log.type === 'birthday' && (
                                            <span className="text-xs text-pink-500 bg-pink-100 dark:bg-pink-900/30 px-1.5 py-0.5 rounded font-medium">Birthday Wish</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                        ${log.status === 'Delivered' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 
                                          log.status === 'Failed' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'}`}>
                                        {log.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                     </tbody>
                 </table>
            </div>
         ) : (
             <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 border-dashed transition-colors">
                 <p className="text-slate-400">No messages sent to this member yet.</p>
             </div>
         )}
      </section>

      {/* Edit Member Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-2xl shadow-xl my-8 transition-colors">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Member</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Member ID</label>
                <input 
                  type="text" 
                  disabled
                  value={formatMemberID(member.id)}
                  className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-500 dark:text-slate-400 italic cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-400 dark:border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
                    value={formData.name || ''}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Mobile Phone <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-400 dark:border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
                    value={formData.phone || ''}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="date" 
                    className="w-full border border-slate-400 dark:border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-slate-600 dark:text-white bg-white dark:bg-slate-700"
                    value={formData.birthday || ''}
                    onChange={e => setFormData({...formData, birthday: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select 
                    className="w-full border border-slate-400 dark:border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
                    value={formData.gender || ''}
                    onChange={e => setFormData({...formData, gender: e.target.value})}
                  >
                    <option value="" disabled>Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Organization</label>
                <select 
                   className="w-full border border-slate-400 dark:border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none bg-white dark:bg-slate-700 text-slate-600 dark:text-white"
                   value={formData.organization || ''}
                   onChange={e => setFormData({...formData, organization: e.target.value})}
                >
                  <option value="" disabled>Select organizations...</option>
                  {organizations.map(org => (
                    <option key={org} value={org}>{org}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Default Sender ID
                </label>
                <input 
                  type="text" 
                  maxLength={11}
                  className="w-full border border-slate-400 dark:border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none uppercase bg-white dark:bg-slate-700 dark:text-white"
                  value={formData.sender_name || ''}
                  onChange={e => setFormData({...formData, sender_name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Notes</label>
                <textarea 
                  rows={3}
                  className="w-full border border-slate-400 dark:border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
                  value={formData.notes || ''}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-white dark:bg-slate-800 rounded-b-xl">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="px-6 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveChanges}
                className="px-6 py-2.5 bg-[#0ea5e9] text-white font-medium rounded-lg hover:bg-sky-600 transition-colors shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberProfile;
