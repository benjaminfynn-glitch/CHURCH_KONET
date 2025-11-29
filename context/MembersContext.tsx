import React, { createContext, useContext, useState, useEffect } from 'react';
import { Member, User, ActivityLogEntry, MessageTemplate, SentMessage } from '../types';
import { validatePhoneNumber } from '../services/smsUtils';
import { db } from '../services/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  setDoc
} from 'firebase/firestore';

// Helper for Name Formatting
export const formatProperCase = (str: string): string => {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

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
  const [members, setMembers] = useState<Member[]>([]);
  const [organizations, setOrganizations] = useState<string[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [sentMessages, setSentMessages] = useState<SentMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Real-time Firestore Listeners ---

  useEffect(() => {
    // Guard Clause: If DB is not initialized (e.g. missing keys), do not attempt to connect.
    if (!db) {
      console.warn("Firestore not initialized. Skipping data listeners.");
      setLoading(false);
      return;
    }

    try {
      // 1. Members Listener
      const unsubMembers = onSnapshot(collection(db, 'members'), (snapshot) => {
        const ms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
        setMembers(ms);
      }, (error) => console.error("Members Listener Error:", error));

      // 2. Organizations Listener
      const unsubOrgs = onSnapshot(collection(db, 'organizations'), (snapshot) => {
        const orgs = snapshot.docs.map(doc => doc.data().name as string).sort();
        setOrganizations(orgs);
      }, (error) => console.error("Orgs Listener Error:", error));

      // 3. Templates Listener
      const unsubTemplates = onSnapshot(collection(db, 'templates'), (snapshot) => {
        const ts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MessageTemplate));
        setTemplates(ts);
      }, (error) => console.error("Templates Listener Error:", error));

      // 4. Sent Messages Listener
      const qMessages = query(collection(db, 'sent_messages'), orderBy('timestamp', 'desc'));
      const unsubMessages = onSnapshot(qMessages, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SentMessage));
        setSentMessages(msgs);
      }, (error) => console.error("Messages Listener Error:", error));

      // 5. Activity Log Listener
      const qLogs = query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'));
      const unsubLogs = onSnapshot(qLogs, (snapshot) => {
        const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLogEntry));
        setActivityLog(logs);
      }, (error) => console.error("Logs Listener Error:", error));

      setLoading(false);

      return () => {
        unsubMembers();
        unsubOrgs();
        unsubTemplates();
        unsubMessages();
        unsubLogs();
      };
    } catch (err) {
      console.error("Error setting up Firestore listeners:", err);
      setLoading(false);
    }
  }, []);

  // Logger
  const logActivity = async (action: string, description: string) => {
    if (!db) return;
    try {
      await addDoc(collection(db, 'activity_logs'), {
        timestamp: new Date().toISOString(),
        user: 'Admin', // TODO: Fetch current auth user name
        action,
        description
      });
    } catch (e) {
      console.error("Error logging activity", e);
    }
  };

  const addSentMessage = async (msg: SentMessage) => {
    if (!db) return;
    try {
      await addDoc(collection(db, 'sent_messages'), msg);
    } catch (e) {
      console.error("Error saving sent message", e);
    }
  };

  // Member Logic
  const addMember = async (member: Member) => {
    if (!db) { alert("Database not connected."); return; }
    const formattedMember = {
      ...member,
      name: formatProperCase(member.name),
      organization: formatProperCase(member.organization || ''),
    };
    const { id, ...data } = formattedMember;
    
    try {
      await addDoc(collection(db, 'members'), data);
      logActivity('Added Member', `Added new member: ${formattedMember.name}`);
    } catch (e) {
      console.error("Error adding member", e);
    }
  };

  const updateMember = async (id: string, updates: Partial<Member>) => {
    if (!db) return;
    let finalUpdates = { ...updates };
    if (updates.name) finalUpdates.name = formatProperCase(updates.name);
    if (updates.organization) finalUpdates.organization = formatProperCase(updates.organization);
    
    try {
      const memberRef = doc(db, 'members', id);
      await updateDoc(memberRef, finalUpdates);
      logActivity('Updated Member', `Updated member details for ID: ${id}`);
    } catch (e) {
      console.error("Error updating member", e);
    }
  };

  const deleteMember = async (id: string) => {
    if (!db) return;
    const member = members.find(m => m.id === id);
    try {
      await deleteDoc(doc(db, 'members', id));
      logActivity('Deleted Member', `Deleted member: ${member?.name || id}`);
    } catch (e) {
      console.error("Error deleting member", e);
    }
  };

  const getMember = (id: string) => members.find(m => m.id === id);

  const importMembersFromCSV = (csvData: string) => {
    if (!db) return { added: 0, failed: 0 };
    const lines = csvData.split(/\r?\n/);
    let addedCount = 0;
    let failedCount = 0;

    const startIdx = lines[0].toLowerCase().includes('name') ? 1 : 0;

    lines.slice(startIdx).forEach(async (line) => {
        if (!line.trim()) return;

        const parts = line.split(',').map(p => p.trim());
        if (parts.length < 2) {
            failedCount++;
            return;
        }

        const name = parts[0];
        const rawPhone = parts[1];
        const birthday = parts[2] || '1990-01-01';
        const org = parts[3] || '';

        const validPhone = validatePhoneNumber(rawPhone);

        if (name && validPhone) {
            const memberData = {
                name: formatProperCase(name),
                phone: validPhone,
                birthday: birthday,
                organization: formatProperCase(org),
                opt_in: true,
                gender: 'Male' 
            };
            try {
              await addDoc(collection(db, 'members'), memberData);
              addedCount++;
            } catch (e) {
              failedCount++;
            }
        } else {
            failedCount++;
        }
    });

    logActivity('Bulk Import', `Initiated import from CSV`);
    return { added: addedCount, failed: failedCount };
  };

  // Organization Logic
  const addOrganization = async (name: string) => {
    if (!db) return;
    const fmt = formatProperCase(name);
    if (!organizations.includes(fmt)) {
      try {
        await setDoc(doc(db, 'organizations', fmt), { name: fmt });
        logActivity('Added Organization', `Created organization: ${fmt}`);
      } catch (e) { console.error(e); }
    }
  };

  const updateOrganization = async (oldName: string, newName: string) => {
    if (!db) return;
    const fmt = formatProperCase(newName);
    if (!organizations.includes(fmt)) {
       try {
         await setDoc(doc(db, 'organizations', fmt), { name: fmt });
         await deleteDoc(doc(db, 'organizations', oldName));
         logActivity('Updated Organization', `Renamed ${oldName} to ${fmt}`);
       } catch (e) { console.error(e); }
    }
  };

  const deleteOrganization = async (name: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'organizations', name));
      logActivity('Deleted Organization', `Removed organization: ${name}`);
    } catch (e) { console.error(e); }
  };

  // Template Logic
  const addTemplate = async (template: MessageTemplate) => {
    if (!db) return;
    const { id, ...data } = template;
    try {
      await addDoc(collection(db, 'templates'), data);
      logActivity('Added Template', `Created template: ${template.title}`);
    } catch (e) { console.error(e); }
  };

  const deleteTemplate = async (id: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'templates', id));
      logActivity('Deleted Template', `Deleted template ID: ${id}`);
    } catch (e) { console.error(e); }
  };

  const deleteUser = (id: string) => {
    console.log("Delete user request", id);
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
