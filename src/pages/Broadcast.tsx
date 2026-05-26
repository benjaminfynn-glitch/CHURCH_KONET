import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { sendBroadcast, sendPersonalizedSMS, getBalance } from '../services/api';
import { MessageType, SMSRequest, SMSDestinationPersonalized, SentMessage } from '../types';
import { useToast } from '../context/ToastContext';
import { useMembers } from '../context/MembersContext';
import { calculateSMSCost } from '../services/smsUtils';
import PrimaryButton from '../components/PrimaryButton';

const roleColors: Record<string, string> = {
  preacher: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  liturgist: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  bibleReader: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  mc: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  external: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
};

const Broadcast: React.FC = () => {
  const { addToast } = useToast();
  const { members, templates, organizations, addTemplate, addSentMessage, logActivity } = useMembers();
  const location = useLocation();

  const [messageText, setMessageText] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const [scheduleType, setScheduleType] = useState<'now' | 'later'>('now');
  const [scheduleTime, setScheduleTime] = useState('');
  const [destinationMode, setDestinationMode] = useState<'individual' | 'organization' | 'all'>('organization');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
  const [showTemplateImportModal, setShowTemplateImportModal] = useState(false);
  const [showTemplateSaveModal, setShowTemplateSaveModal] = useState(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isBirthdayFlow, setIsBirthdayFlow] = useState(false);
  const [isResendFlow, setIsResendFlow] = useState(false);

  useEffect(() => {
    if (location.state) {
      const { recipientId, initialMessage, isBirthday, isResend } = location.state as any;
      if (recipientId) {
        setDestinationMode('individual');
        setSelectedMembers([recipientId]);
        setIsBirthdayFlow(!!isBirthday);
        setIsResendFlow(!!isResend);
      }
      if (initialMessage) {
        setMessageText(initialMessage);
        if (isBirthday) {
          setIsPersonalized(false);
        } else if (initialMessage.includes('{$name}')) {
          setIsPersonalized(true);
        }
      }
    }
  }, [location.state]);

  const normalizePhone = (phone: string): string => phone.trim().replace(/\s+/g, '');

  const getUniqueRecipientsForOrganizations = useMemo(() => {
    if (selectedOrgs.length === 0) return { recipients: [], uniquePhones: new Set<string>(), totalMembers: 0 };
    const matchingMembers = members.filter(m => m.isActive === true && m.organizations?.some(org => selectedOrgs.includes(org)));
    const phoneSet = new Set<string>();
    const uniqueRecipients: { id: string, fullName: string, phone: string }[] = [];
    matchingMembers.forEach(member => {
      const normalizedPhone = normalizePhone(member.phone);
      if (!phoneSet.has(normalizedPhone)) {
        phoneSet.add(normalizedPhone);
        uniqueRecipients.push({ id: member.id, fullName: member.fullName || '', phone: member.phone });
      }
    });
    return { recipients: uniqueRecipients, uniquePhones: phoneSet, totalMembers: matchingMembers.length };
  }, [selectedOrgs, members]);

  const filteredMembers = useMemo(() => {
    if (!searchQuery) return members;
    const lower = searchQuery.toLowerCase();
    return members.filter(m => m.fullName?.toLowerCase().includes(lower) || m.phone.includes(lower));
  }, [searchQuery, members]);

  const uniqueRecipientsList = useMemo(() => {
    if (destinationMode !== 'all') return [];
    const seen = new Set<string>();
    const list: { id: string, fullName: string, phone: string }[] = [];
    members.forEach(m => {
      if (!seen.has(m.phone)) {
        seen.add(m.phone);
        list.push({ id: m.id, fullName: m.fullName, phone: m.phone });
      }
    });
    return list.sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [members, destinationMode]);

  const smsStats = useMemo(() => calculateSMSCost(messageText), [messageText]);

  const estimatedCost = useMemo(() => {
    let recipientCount = 0;
    if (destinationMode === 'all') recipientCount = uniqueRecipientsList.length;
    else if (destinationMode === 'organization') recipientCount = getUniqueRecipientsForOrganizations.recipients.length;
    else if (isPersonalized) recipientCount = selectedMembers.length;
    else {
      const phones = members.filter(m => selectedMembers.includes(m.id)).map(m => m.phone);
      recipientCount = new Set(phones.map(normalizePhone)).size;
    }
    return recipientCount * smsStats.totalCost;
  }, [selectedMembers, isPersonalized, members, smsStats.totalCost, destinationMode, uniqueRecipientsList, getUniqueRecipientsForOrganizations]);

  useEffect(() => {
    if (isPersonalized && !messageText.includes('{$name}')) {
      setMessageText(prev => `Hi {$name}, ${prev}`);
    }
  }, [isPersonalized]);

  const toggleOrg = (org: string) => {
    setSelectedOrgs(selectedOrgs.includes(org) ? selectedOrgs.filter(o => o !== org) : [...selectedOrgs, org]);
    setSelectedMembers(selectedOrgs.includes(org) ? [] : getUniqueRecipientsForOrganizations.recipients.map(r => r.id));
    setIsPersonalized(false);
  };

  const toggleMember = (id: string) => setSelectedMembers(selectedMembers.includes(id) ? selectedMembers.filter(m => m !== id) : [...selectedMembers, id]);

  const selectAllSearchResults = () => setSelectedMembers(Array.from(new Set([...selectedMembers, ...filteredMembers.map(m => m.id)])));

  const handleSelectAllMembers = () => {
    setSelectedMembers(members.map(m => m.id));
    setDestinationMode('all');
    setIsPersonalized(false);
    setSelectedOrgs([]);
    addToast('Selected all members for general broadcast', 'info');
  };

  const handleClear = () => setMessageText('');

  const handleImportTemplate = (content: string) => { setMessageText(content); setShowTemplateImportModal(false); addToast('Template imported successfully', 'info'); };

  const handleSaveTemplate = () => {
    if (!newTemplateTitle || !messageText) return;
    addTemplate({ id: Date.now().toString(), title: newTemplateTitle, content: messageText });
    setNewTemplateTitle('');
    setShowTemplateSaveModal(false);
    addToast('Template saved successfully', 'success');
  };

  const getRecipientsAndDestinations = () => {
    let targets: any[];
    let destinations: string[] | SMSDestinationPersonalized[];
    if (destinationMode === 'organization') {
      targets = getUniqueRecipientsForOrganizations.recipients;
      destinations = targets.map(r => r.phone);
    } else {
      targets = members.filter(m => selectedMembers.includes(m.id));
      if (isBirthdayFlow) {
        const uniquePhones = new Set<string>(targets.map(m => normalizePhone(m.phone)));
        destinations = Array.from(uniquePhones);
      } else if (isPersonalized) {
        destinations = targets.map(m => ({ number: m.phone, values: [m.fullName?.split(' ')[0]] }));
      } else {
        const uniquePhones = new Set<string>(targets.map(m => normalizePhone(m.phone)));
        destinations = Array.from(uniquePhones);
      }
    }
    return { targets, destinations };
  };

  const handlePreview = () => {
    const hasRecipients = destinationMode === 'organization' ? getUniqueRecipientsForOrganizations.recipients.length > 0 : selectedMembers.length > 0;
    if (!hasRecipients || !messageText) { addToast('Please select destinations and enter a message.', 'error'); return; }
    if (scheduleType === 'later' && !scheduleTime) { addToast('Please select a date and time for scheduling.', 'error'); return; }
    const selectedDate = new Date(scheduleTime);
    if (scheduleType === 'later' && selectedDate <= new Date()) { addToast('Scheduled time must be in the future.', 'error'); return; }
    setShowPreviewModal(true);
  };

  const confirmSend = async () => {
    if (destinationMode === 'organization' && getUniqueRecipientsForOrganizations.recipients.length === 0) { addToast('No active members found in the selected organizations.', 'error'); return; }
    setIsSending(true);
    const { targets, destinations } = getRecipientsAndDestinations();
    const payload: SMSRequest = { text: messageText, type: MessageType.Standard, sender: 'BETHELKONET', destinations };
    if (scheduleType === 'later' && scheduleTime) payload.schedule = { dateTime: scheduleTime.replace('T', ' '), offset: '+00:00' };
    try {
      await sendBroadcast(payload);
      const timestamp = new Date().toISOString();
      const membersToLog = destinationMode === 'organization' ? targets : members.filter(m => selectedMembers.includes(m.id));
      membersToLog.forEach(member => {
        const finalContent = isBirthdayFlow || isPersonalized ? messageText.replace('{$name}', member.fullName?.split(' ')[0]) : messageText;
        addSentMessage({ id: Date.now().toString() + Math.random().toString(36).substr(2, 9), memberId: member.id, recipientName: member.fullName, recipientPhone: member.phone, content: finalContent, timestamp, type: isBirthdayFlow ? 'birthday' : 'general', status: 'Sent' });
      });
      if (isBirthdayFlow) { logActivity('Birthday Message Sent', `Sent birthday wish to ${membersToLog.map(t => t.fullName).join(', ')}`); }
      else {
        if (destinationMode === 'all') logActivity('Broadcast Sent', `Sent general broadcast to ALL members (${destinations.length} unique numbers)`);
        else if (destinationMode === 'organization') logActivity('Broadcast Sent', `Sent message to ${selectedOrgs.join(', ')} (${destinations.length} unique recipients from ${getUniqueRecipientsForOrganizations.totalMembers} active members)`);
        else logActivity('Broadcast Sent', `Sent message to ${destinations.length} recipients`);
      }
      setMessageText(''); setSelectedMembers([]); setScheduleTime(''); setScheduleType('now'); setSearchQuery(''); setSelectedOrgs([]); setDestinationMode('organization'); setShowPreviewModal(false); setIsBirthdayFlow(false); setIsResendFlow(false);
      addToast(`Broadcast ${scheduleType === 'later' ? 'scheduled' : 'sent'} successfully!`, 'success');
    } catch (e: any) {
      addToast(e.message || 'Failed to send broadcast', 'error');
    } finally { setIsSending(false); }
  };

  const resolveMessagePreview = (name: string) => isBirthdayFlow ? messageText : messageText.replace('{$name}', name.split(' ')[0]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <header className="bg-gradient-to-r from-indigo-600 to-blue-700 text-white rounded-2xl p-6 shadow-xl mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Send Broadcast</h1>
            <p className="text-indigo-100 mt-1">Compose and send SMS messages to your congregation</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="bg-white/15 backdrop-blur px-3 py-1.5 rounded-lg text-xs">
              <span className="font-bold">{getUniqueRecipientsForOrganizations.recipients.length || selectedMembers.length}</span> Recipients Selected
            </div>
            <div className="bg-white/15 backdrop-blur px-3 py-1.5 rounded-lg text-xs">
              <span className="font-bold">₵{estimatedCost.toFixed(2)}</span> Estimated Cost
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Message Editor</h3>
          <textarea rows={8} value={messageText} onChange={e => setMessageText(e.target.value)} className="w-full border-2 border-blue-400 rounded-lg p-3 text-sm focus:ring-blue-500 focus:border-blue-500 font-mono resize-none h-64 bg-white dark:bg-slate-700 dark:text-white" placeholder="Type your message here..." />
          <div className="flex justify-between items-center mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{messageText.length} chars ({smsStats.encoding})</span>
            <span>{smsStats.segments} SMS segment(s)</span>
          </div>
          {smsStats.encoding === 'Unicode' && <p className="text-xs text-amber-600 mt-1">⚠️ Unicode detected. Max 70 chars per segment.</p>}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button onClick={handleClear} className="px-3 py-1.5 text-sm text-slate-600 bg-slate-100 rounded">Clear</button>
            <button onClick={() => setShowTemplateImportModal(true)} className="px-3 py-1.5 text-sm text-indigo-700 bg-indigo-50 rounded">Import Template</button>
            <button onClick={() => setShowTemplateSaveModal(true)} className="px-3 py-1.5 text-sm text-indigo-700 bg-indigo-50 rounded">Save Template</button>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Destinations</h3>
            <button onClick={handleSelectAllMembers} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Select All</button>
          </div>
          <div className="flex gap-2 mb-4">
            <select value={destinationMode} onChange={e => setDestinationMode(e.target.value as any)} className="px-3 py-1.5 text-sm border rounded-lg">
              <option value="organization">By Organization</option>
              <option value="individual">By Individual</option>
              <option value="all">All Members</option>
            </select>
            <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1 px-3 py-1.5 text-sm border rounded-lg" />
          </div>
          {destinationMode === 'organization' && (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {organizations.map(org => (
                <label key={org} className="flex items-center p-2 border rounded-lg cursor-pointer hover:bg-slate-50">
                  <input type="checkbox" checked={selectedOrgs.includes(org)} onChange={() => toggleOrg(org)} className="mr-2" />
                  <span className="text-sm">{org}</span>
                </label>
              ))}
            </div>
          )}
          {destinationMode === 'individual' && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredMembers.map(m => (
                <div key={m.id} onClick={() => toggleMember(m.id)} className={`p-2 border rounded-lg cursor-pointer flex items-center justify-between ${selectedMembers.includes(m.id) ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                  <div>
                    <p className="text-sm font-medium">{m.fullName}</p>
                    <p className="text-xs text-slate-500">{m.phone}</p>
                  </div>
                  <span className={`w-5 h-5 border rounded ${selectedMembers.includes(m.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>{selectedMembers.includes(m.id) && <span className="text-white text-xs">✓</span>}</span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4">
            <PrimaryButton onClick={handlePreview} disabled={(!messageText || (destinationMode === 'organization' ? !getUniqueRecipientsForOrganizations.recipients.length : !selectedMembers.length))} className="w-full">Send Broadcast</PrimaryButton>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Broadcast;