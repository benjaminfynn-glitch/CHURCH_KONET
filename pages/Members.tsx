
import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Member } from '../types';
import { useToast } from '../context/ToastContext';
import { useMembers } from '../context/MembersContext';
import { validatePhoneNumber } from '../services/smsUtils';

const formatDateDDMMYYYY = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const Members: React.FC = () => {
  const location = useLocation();
  const { addToast } = useToast();
  const { members, organizations, addMember, updateMember, deleteMember, importMembersFromCSV } = useMembers();
  
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Import State
  const [csvText, setCsvText] = useState('');

  // Edit/Create State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Member>>({ opt_in: true });
  
  // Delete State
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterOrg, setFilterOrg] = useState('');
  const [filterAge, setFilterAge] = useState('');
  const [sortOption, setSortOption] = useState('name_asc');

  // Handle Navigation State (e.g. click from Dashboard chart)
  useEffect(() => {
      if (location.state && (location.state as any).filterMonth) {
          setFilterMonth((location.state as any).filterMonth.toString());
      }
  }, [location.state]);

  const filteredMembers = useMemo(() => {
    return members.filter(member => {
        // Search
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = member.name.toLowerCase().includes(searchLower) || member.phone.includes(searchLower);

        // Month
        let matchesMonth = true;
        if (filterMonth) {
            const month = member.birthday ? parseInt(member.birthday.split('-')[1]) : -1;
            matchesMonth = month === parseInt(filterMonth);
        }

        // Organization
        let matchesOrg = true;
        if (filterOrg) {
            matchesOrg = member.organization === filterOrg;
        }

        // Age Range
        let matchesAge = true;
        if (filterAge && member.birthday) {
            const birthDate = new Date(member.birthday);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            if (filterAge === 'child') matchesAge = age < 13;
            else if (filterAge === 'youth') matchesAge = age >= 13 && age < 30;
            else if (filterAge === 'adult') matchesAge = age >= 30 && age < 60;
            else if (filterAge === 'senior') matchesAge = age >= 60;
        }

        return matchesSearch && matchesMonth && matchesOrg && matchesAge;
    }).sort((a, b) => {
        if (sortOption === 'name_asc') return a.name.localeCompare(b.name);
        if (sortOption === 'name_desc') return b.name.localeCompare(a.name);
        if (sortOption === 'newest') return parseInt(b.id) - parseInt(a.id); 
        if (sortOption === 'oldest') return parseInt(a.id) - parseInt(b.id);
        return 0;
    });
  }, [members, searchQuery, filterMonth, filterOrg, filterAge, sortOption]);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ opt_in: true }); 
    setShowModal(true);
  };

  const openEditModal = (member: Member) => {
      setEditingId(member.id);
      setFormData({ ...member });
      setShowModal(true);
  };

  const confirmDelete = (member: Member) => {
      setMemberToDelete(member);
      setShowDeleteModal(true);
  };

  const handleDelete = () => {
      if (memberToDelete) {
          deleteMember(memberToDelete.id);
          setShowDeleteModal(false);
          setMemberToDelete(null);
          addToast('Member deleted successfully', 'success');
      }
  };

  const handleSave = () => {
    if(!formData.name || !formData.phone || !formData.birthday) {
        addToast('Please fill in all required fields.', 'error');
        return;
    }

    const validPhone = validatePhoneNumber(formData.phone);
    if (!validPhone) {
        addToast('Invalid phone number. Use 10 digits (024...) or 12 digits (233...)', 'error');
        return;
    }

    if (editingId) {
        // Update
        updateMember(editingId, { ...formData, phone: validPhone });
        addToast('Member updated successfully', 'success');
    } else {
        // Create
        const member: Member = {
            id: Date.now().toString(),
            name: formData.name!,
            phone: validPhone,
            birthday: formData.birthday!,
            gender: formData.gender,
            organization: formData.organization,
            notes: formData.notes,
            opt_in: true
        };
        addMember(member);
        addToast('New member added successfully', 'success');
    }
    setShowModal(false);
  };

  const handleImport = () => {
      if (!csvText) return;
      const { added, failed } = importMembersFromCSV(csvText);
      addToast(`Imported ${added} members. ${failed} failed rows.`, added > 0 ? 'success' : 'error');
      setShowImportModal(false);
      setCsvText('');
  };

  const clearFilters = () => {
      setSearchQuery('');
      setFilterMonth('');
      setFilterOrg('');
      setFilterAge('');
      setSortOption('name_asc');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Members Directory</h2>
           <p className="text-slate-500 dark:text-slate-400">Manage congregation contacts and birthdays.</p>
        </div>
        <div className="flex gap-2">
            <button 
              onClick={() => setShowImportModal(true)}
              className="bg-white dark:bg-slate-700 text-slate-700 dark:text-white border border-slate-300 dark:border-slate-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors shadow-sm flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Import CSV
            </button>
            <button 
              onClick={openAddModal}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            >
              + Add Member
            </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 transition-colors">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Search name or phone..." 
                    className="w-full pl-9 pr-3 py-2 border border-slate-400 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
                <svg className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>

            {/* Month Filter */}
            <select 
                className="w-full px-3 py-2 border border-slate-400 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                value={filterMonth}
                onChange={e => setFilterMonth(e.target.value)}
            >
                <option value="">All Months</option>
                {Array.from({length: 12}, (_, i) => (
                    <option key={i} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                ))}
            </select>

            {/* Org Filter */}
            <select 
                className="w-full px-3 py-2 border border-slate-400 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                value={filterOrg}
                onChange={e => setFilterOrg(e.target.value)}
            >
                <option value="">All Organizations</option>
                {organizations.map(org => (
                    <option key={org} value={org!}>{org}</option>
                ))}
            </select>

             {/* Age Filter */}
             <select 
                className="w-full px-3 py-2 border border-slate-400 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                value={filterAge}
                onChange={e => setFilterAge(e.target.value)}
            >
                <option value="">All Ages</option>
                <option value="child">Children (0-12)</option>
                <option value="youth">Youth (13-29)</option>
                <option value="adult">Adults (30-59)</option>
                <option value="senior">Seniors (60+)</option>
            </select>

            {/* Sort */}
            <select 
                className="w-full px-3 py-2 border border-slate-400 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                value={sortOption}
                onChange={e => setSortOption(e.target.value)}
            >
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
                <option value="newest">Newest Added</option>
                <option value="oldest">Oldest Added</option>
            </select>
         </div>
         <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700">
             <span className="text-xs text-slate-500 dark:text-slate-400">Showing {filteredMembers.length} results</span>
             <button 
                onClick={clearFilters}
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium"
             >
                 Clear Filters
             </button>
         </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-100 dark:border-slate-700">
                    <tr>
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Phone Number</th>
                        <th className="px-6 py-4">Birthday</th>
                        <th className="px-6 py-4">Organization</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {filteredMembers.map(member => (
                    <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                            <Link 
                                to={`/members/${member.id}`} 
                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline"
                            >
                                {member.name}
                            </Link>
                            {member.gender && <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">({member.gender === 'Male' ? 'M' : 'F'})</span>}
                        </td>
                        <td className="px-6 py-4 font-mono">{member.phone}</td>
                        <td className="px-6 py-4">{formatDateDDMMYYYY(member.birthday)}</td>
                        <td className="px-6 py-4">{member.organization || '-'}</td>
                        <td className="px-6 py-4">
                            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full text-xs font-semibold">Active</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-3">
                                <button 
                                    onClick={() => openEditModal(member)}
                                    className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                    title="Edit"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                </button>
                                <button 
                                    onClick={() => confirmDelete(member)}
                                    className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                    title="Delete"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                    ))}
                    {filteredMembers.length === 0 && (
                        <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                                No members found matching your filters.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-2xl shadow-xl my-8 transition-colors">
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{editingId ? 'Edit Member' : 'Add New Member'}</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Member ID</label>
                <input 
                  type="text" 
                  disabled
                  value={editingId || ''}
                  placeholder="Auto-generated upon save"
                  className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm text-slate-500 dark:text-slate-400 italic"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-400 dark:border-slate-600 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
                    value={formData.name || ''}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Phone <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    placeholder="233xxxxxxxxx"
                    className="w-full border border-slate-400 dark:border-slate-600 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
                    value={formData.phone || ''}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Format: 233... (International)</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="date" 
                    className="w-full border border-slate-400 dark:border-slate-600 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-slate-600 dark:text-white bg-white dark:bg-slate-700"
                    value={formData.birthday || ''}
                    onChange={e => setFormData({...formData, birthday: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select 
                    className="w-full border border-slate-400 dark:border-slate-600 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
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
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Organization</label>
                <select 
                   className="w-full border border-slate-400 dark:border-slate-600 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none bg-white dark:bg-slate-700 text-slate-600 dark:text-white"
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
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Notes</label>
                <textarea 
                  rows={3}
                  className="w-full border border-slate-400 dark:border-slate-600 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
                  value={formData.notes || ''}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-white dark:bg-slate-800 rounded-b-xl">
              <button 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="px-4 py-2 bg-[#0ea5e9] text-white font-medium rounded-lg hover:bg-sky-600 transition-colors shadow-sm text-sm"
              >
                {editingId ? 'Save Changes' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
             <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-lg shadow-xl p-6 transition-colors">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Import Members (CSV)</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Paste CSV data below. Format: <br/>
                    <code>Name, Phone, Birthday(YYYY-MM-DD), Organization</code>
                </p>
                <textarea 
                    value={csvText}
                    onChange={e => setCsvText(e.target.value)}
                    rows={10}
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-sm font-mono focus:ring-indigo-500 bg-white dark:bg-slate-700 dark:text-white"
                    placeholder="John Doe, 233241234567, 1990-01-01, Choir&#10;Jane Smith, 0241234567, 1995-05-05, Ushers"
                ></textarea>
                <div className="flex justify-end gap-3 mt-4">
                    <button 
                        onClick={() => setShowImportModal(false)}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleImport}
                        disabled={!csvText}
                        className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        Import Members
                    </button>
                </div>
             </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-sm shadow-xl p-6 text-center transition-colors">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Member</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                    Are you sure you want to delete <span className="font-bold text-slate-700 dark:text-slate-200">{memberToDelete?.name}</span>? This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-center">
                    <button 
                        onClick={() => setShowDeleteModal(false)}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleDelete}
                        className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Delete Member
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Members;
