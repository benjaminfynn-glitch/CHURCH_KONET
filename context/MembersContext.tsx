
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Member, User, ActivityLogEntry, MessageTemplate, SentMessage } from '../types';
import { validatePhoneNumber } from '../services/smsUtils';

// Helper for Name Formatting
export const formatProperCase = (str: string): string => {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

// Initial Data (Clean for Backend Integration)
const INITIAL_MEMBERS: Member[] = [];
const INITIAL_ORGS: string[] = [];
const INITIAL_TEMPLATES: MessageTemplate[] = [];
const INITIAL_USERS: User[] = [];

interface MembersContextType {
  members: Member[];
  organizations: string[];
  templates: MessageTemplate[];
  users: User[];
  activityLog: ActivityLogEntry[];
  sentMessages: SentMessage[];
  
  // Member Actions
  addMember: (member: Member) => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  getMember: (id: string) => Member | undefined;
  importMembersFromCSV: (csvData: string) => { added: number, failed: number };
  
  // Organization Actions
  addOrganization: (name: string) => void;
  updateOrganization: (oldName: string, newName: string) => void;
  deleteOrganization: (name: string) => void;

  // Template Actions
  addTemplate: (template: MessageTemplate) => void;
  deleteTemplate: (id: string) => void;
  
  // User Actions
  deleteUser: (id: string) => void;
  
  // Logging
  logActivity: (action: string, description: string) => void;
  addSentMessage: (msg: SentMessage) => void;
}

const MembersContext = createContext<MembersContextType | undefined>(undefined);

export const MembersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ONE-TIME CLEANUP: Check if we've cleaned up legacy mock data for the backend transition
  useEffect(() => {
    const hasCleaned = localStorage.getItem('ck_cleanup_v1');
    if (!hasCleaned) {
      console.log('Performing one-time data cleanup for backend preparation...');
      localStorage.removeItem('ck_members');
      localStorage.removeItem('ck_organizations');
      localStorage.removeItem('ck_templates');
      localStorage.removeItem('ck_users');
      localStorage.removeItem('ck_activity_log');
      localStorage.removeItem('ck_sent_messages');
      localStorage.setItem('ck_cleanup_v1', 'true');
      
      // Force reload state to empty if they were just read
      setMembers([]);
      setOrganizations([]);
      setTemplates([]);
      setUsers([]);
      setActivityLog([]);
      setSentMessages([]);
    }
  }, []);

  // Initialize state from LocalStorage or Fallback (which is now empty)
  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem('ck_members');
    return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
  });

  const [organizations, setOrganizations] = useState<string[]>(() => {
    const saved = localStorage.getItem('ck_organizations');
    return saved ? JSON.parse(saved) : INITIAL_ORGS;
  });

  const [templates, setTemplates] = useState<MessageTemplate[]>(() => {
    const saved = localStorage.getItem('ck_templates');
    return saved ? JSON.parse(saved) : INITIAL_TEMPLATES;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('ck_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>(() => {
    const saved = localStorage.getItem('ck_activity_log');
    return saved ? JSON.parse(saved) : [];
  });

  const [sentMessages, setSentMessages] = useState<SentMessage[]>(() => {
    const saved = localStorage.getItem('ck_sent_messages');
    return saved ? JSON.parse(saved) : [];
  });

  // Persistence Effects
  useEffect(() => localStorage.setItem('ck_members', JSON.stringify(members)), [members]);
  useEffect(() => localStorage.setItem('ck_organizations', JSON.stringify(organizations)), [organizations]);
  useEffect(() => localStorage.setItem('ck_templates', JSON.stringify(templates)), [templates]);
  useEffect(() => localStorage.setItem('ck_users', JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem('ck_activity_log', JSON.stringify(activityLog)), [activityLog]);
  useEffect(() => localStorage.setItem('ck_sent_messages', JSON.stringify(sentMessages)), [sentMessages]);

  // Logger
  const logActivity = (action: string, description: string) => {
    const entry: ActivityLogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      user: 'Admin User', // Hardcoded for simulation until Auth is real
      action,
      description
    };
    setActivityLog(prev => [entry, ...prev]);
  };

  const addSentMessage = (msg: SentMessage) => {
    setSentMessages(prev => [msg, ...prev]);
  };

  // Member Logic
  const addMember = (member: Member) => {
    const formattedMember = {
      ...member,
      name: formatProperCase(member.name),
      organization: formatProperCase(member.organization || ''),
    };
    setMembers(prev => [formattedMember, ...prev]);
    logActivity('Added Member', `Added new member: ${formattedMember.name}`);
  };

  const updateMember = (id: string, updates: Partial<Member>) => {
    let finalUpdates = { ...updates };
    if (updates.name) finalUpdates.name = formatProperCase(updates.name);
    if (updates.organization) finalUpdates.organization = formatProperCase(updates.organization);
    
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...finalUpdates } : m));
    logActivity('Updated Member', `Updated member details for ID: ${id}`);
  };

  const deleteMember = (id: string) => {
    const member = members.find(m => m.id === id);
    setMembers(prev => prev.filter(m => m.id !== id));
    logActivity('Deleted Member', `Deleted member: ${member?.name || id}`);
  };

  const getMember = (id: string) => members.find(m => m.id === id);

  const importMembersFromCSV = (csvData: string) => {
    const lines = csvData.split(/\r?\n/);
    let addedCount = 0;
    let failedCount = 0;

    const newMembers: Member[] = [];

    // Skip header if present (simple check if first line contains 'name' or 'phone')
    const startIdx = lines[0].toLowerCase().includes('name') ? 1 : 0;

    for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Assumes format: Name, Phone, [Birthday], [Organization]
        const parts = line.split(',').map(p => p.trim());
        if (parts.length < 2) {
            failedCount++;
            continue;
        }

        const name = parts[0];
        const rawPhone = parts[1];
        const birthday = parts[2] || '1990-01-01'; // Default or validate
        const org = parts[3] || '';

        const validPhone = validatePhoneNumber(rawPhone);

        if (name && validPhone) {
            const member: Member = {
                id: (Date.now() + i).toString(),
                name: formatProperCase(name),
                phone: validPhone,
                birthday: birthday, // Should ideally validate date format too
                organization: formatProperCase(org),
                opt_in: true,
                gender: 'Male' // Defaulting for bulk import simplicity
            };
            newMembers.push(member);
            addedCount++;
        } else {
            failedCount++;
        }
    }

    if (newMembers.length > 0) {
        setMembers(prev => [...newMembers, ...prev]);
        logActivity('Bulk Import', `Imported ${addedCount} members from CSV`);
    }

    return { added: addedCount, failed: failedCount };
  };

  // Organization Logic
  const addOrganization = (name: string) => {
    const fmt = formatProperCase(name);
    if (!organizations.includes(fmt)) {
      setOrganizations(prev => [...prev, fmt]);
      logActivity('Added Organization', `Created organization: ${fmt}`);
    }
  };

  const updateOrganization = (oldName: string, newName: string) => {
    const fmt = formatProperCase(newName);
    if (!organizations.includes(fmt)) {
      setOrganizations(prev => prev.map(o => o === oldName ? fmt : o));
      // Also update members associated with this org
      setMembers(prev => prev.map(m => m.organization === oldName ? { ...m, organization: fmt } : m));
      logActivity('Updated Organization', `Renamed ${oldName} to ${fmt}`);
    }
  };

  const deleteOrganization = (name: string) => {
    setOrganizations(prev => prev.filter(o => o !== name));
    logActivity('Deleted Organization', `Removed organization: ${name}`);
  };

  // Template Logic
  const addTemplate = (template: MessageTemplate) => {
    setTemplates(prev => [...prev, template]);
    logActivity('Added Template', `Created template: ${template.title}`);
  };

  const deleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    logActivity('Deleted Template', `Deleted template ID: ${id}`);
  };

  // User Logic
  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    logActivity('Deleted User', `Removed user account ID: ${id}`);
  };

  return (
    <MembersContext.Provider value={{ 
      members, organizations, templates, users, activityLog, sentMessages,
      addMember, updateMember, deleteMember, getMember, importMembersFromCSV,
      addOrganization, updateOrganization, deleteOrganization,
      addTemplate, deleteTemplate,
      deleteUser,
      logActivity,
      addSentMessage
    }}>
      {children}
    </MembersContext.Provider>
  );
};

export const useMembers = () => {
  const context = useContext(MembersContext);
  if (!context) throw new Error('useMembers must be used within a MembersProvider');
  return context;
};
