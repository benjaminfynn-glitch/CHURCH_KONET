
import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { sendBroadcast, sendPersonalizedSMS, getBalance } from '../services/api';
import { MessageType, SMSRequest, SMSDestinationPersonalized, SentMessage } from '../types';
import { useToast } from '../context/ToastContext';
import { useMembers } from '../context/MembersContext';
import { calculateSMSCost } from '../services/smsUtils';

const Broadcast: React.FC = () => {
  const { addToast } = useToast();
  const { members, templates, organizations, addTemplate, addSentMessage, logActivity } = useMembers();
  const location = useLocation();

  // State
  const [messageText, setMessageText] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [isSending, setIsSending] = useState(false);
  // Balance checking removed - application should not block SMS sending based on balance verification
  
  // Scheduling State
  const [scheduleType, setScheduleType] = useState<'now' | 'later'>('now');
  const [scheduleTime, setScheduleTime] = useState('');

  // Destination State
  const [destinationMode, setDestinationMode] = useState<'individual' | 'organization' | 'all'>('organization');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Multi-select organizations
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
  
  // Templates State
  const [showTemplateImportModal, setShowTemplateImportModal] = useState(false);
  const [showTemplateSaveModal, setShowTemplateSaveModal] = useState(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState('');

  // Preview Modal State
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Is Birthday Flow?
  const [isBirthdayFlow, setIsBirthdayFlow] = useState(false);
  const [isResendFlow, setIsResendFlow] = useState(false);

  // Balance checking removed - application should not block SMS sending based on balance verification

  // Check for navigation state (e.g. from Dashboard Birthday Widget)
  useEffect(() => {
    if (location.state) {
        const { recipientId, initialMessage, isBirthday, isResend } = location.state;
        
        if (recipientId) {
            setDestinationMode('individual');
            setSelectedMembers([recipientId]);
            setIsBirthdayFlow(!!isBirthday);
            setIsResendFlow(!!isResend);
        }
        
        if (initialMessage) {
            setMessageText(initialMessage);
            // For birthday messages, ensure they are treated as regular broadcasts
            if (isBirthday) {
                setIsPersonalized(false);
            } else {
                // Auto-detect personalization variable for non-birthday messages
                if (initialMessage.includes('{$name}')) {
                    setIsPersonalized(true);
                }
            }
        }
    }
  }, [location.state]);

  // Derived Data
  const filteredMembers = useMemo(() => {
    if (!searchQuery) return members;
    const lower = searchQuery.toLowerCase();
    return members.filter(m => m.fullName?.toLowerCase().includes(lower) || m.phone.includes(lower));
  }, [searchQuery, members]);

  // Derived Data for 'All' mode: Unique List
  const uniqueRecipientsList = useMemo(() => {
      if (destinationMode !== 'all') return [];
      const seen = new Set<string>();
      const list: { id: string, fullName: string, phone: string }[] = [];
      
      // Filter for unique phones, prioritizing existing member order
      members.forEach(m => {
          if (!seen.has(m.phone)) {
              seen.add(m.phone);
              list.push({ id: m.id, fullName: m.fullName, phone: m.phone });
          }
      });
      // Sort alphabetically for display
      return list.sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [members, destinationMode]);

  // Calculate Cost using utility
  const smsStats = useMemo(() => calculateSMSCost(messageText), [messageText]);
  
  // Cost Calculation Logic with De-duplication check
  const estimatedCost = useMemo(() => {
      let recipientCount = 0;
      if (destinationMode === 'all') {
         recipientCount = uniqueRecipientsList.length;
      } else if (isPersonalized) {
          // Personalized: Every selected member gets a message
          recipientCount = selectedMembers.length;
      } else {
          // Non-personalized: Unique phone numbers only
          const phones = members
            .filter(m => selectedMembers.includes(m.id))
            .map(m => m.phone);
          recipientCount = new Set(phones).size;
      }
      return recipientCount * smsStats.totalCost;
  }, [selectedMembers, isPersonalized, members, smsStats.totalCost, destinationMode, uniqueRecipientsList]);

  // Balance checking removed - application should not block SMS sending based on balance verification

  // Effect: Auto-insert {$name} when personalization is toggled ON (Only if not already present)
  useEffect(() => {
    if (isPersonalized && !messageText.includes('{$name}')) { 
      setMessageText(prev => `Hi {$name}, ${prev}`);
    }
  }, [isPersonalized]);

  // Destination Handlers
  const toggleOrg = (org: string) => {
    let newOrgs: string[];
    if (selectedOrgs.includes(org)) {
        newOrgs = selectedOrgs.filter(o => o !== org);
    } else {
        newOrgs = [...selectedOrgs, org];
    }
    setSelectedOrgs(newOrgs);

    // Update selected members based on combined organizations
    const membersInOrgs = members.filter(m => m.organization && newOrgs.includes(m.organization)).map(m => m.id);
    setSelectedMembers(membersInOrgs);
    setIsPersonalized(false); // Organization messages usually standard
  };

  const toggleMember = (id: string) => {
    let newSelected: string[];
    if (selectedMembers.includes(id)) {
      newSelected = selectedMembers.filter(m => m !== id);
    } else {
      newSelected = [...selectedMembers, id];
    }
    setSelectedMembers(newSelected);
  };

  const selectAllSearchResults = () => {
      const ids = filteredMembers.map(m => m.id);
      const newSelected = Array.from(new Set([...selectedMembers, ...ids]));
      setSelectedMembers(newSelected);
  };

  const handleSelectAllMembers = () => {
      // 1. Get all member IDs
      const allIds = members.map(m => m.id);
      setSelectedMembers(allIds);
      
      // 2. Set mode to 'all' - this triggers the unique list view
      setDestinationMode('all');
      
      // 3. Reset conflicting states
      setIsPersonalized(false); // Force non-personalized for bulk generic
      setSelectedOrgs([]);
      
      addToast('Selected all members for general broadcast', 'info');
  };

  // Template Handlers
  const handleClear = () => setMessageText('');
  
  const handleImportTemplate = (content: string) => {
    setMessageText(content);
    setShowTemplateImportModal(false);
    addToast('Template imported successfully', 'info');
  };

  const handleSaveTemplate = () => {
    if (!newTemplateTitle || !messageText) return;
    addTemplate({
      id: Date.now().toString(),
      title: newTemplateTitle,
      content: messageText
    });
    setNewTemplateTitle('');
    setShowTemplateSaveModal(false);
    addToast('Template saved successfully', 'success');
  };

  // Send Logic
  const handlePreview = () => {
    if (selectedMembers.length === 0 || !messageText) {
      addToast('Please select destinations and enter a message.', 'error');
      return;
    }

    if (scheduleType === 'later') {
        if (!scheduleTime) {
            addToast('Please select a date and time for scheduling.', 'error');
            return;
        }
        const selectedDate = new Date(scheduleTime);
        const now = new Date();
        if (selectedDate <= now) {
            addToast('Scheduled time must be in the future.', 'error');
            return;
        }
    }

    setShowPreviewModal(true);
  };

  const confirmSend = async () => {
    // Balance checking removed - application should not block SMS sending based on balance verification
    // SMSONLINEGH will handle all validation and processing
    setIsSending(true);

    const targets = members.filter(m => selectedMembers.includes(m.id));
    let destinations: string[] | SMSDestinationPersonalized[];

    // For birthday messages, always treat as regular broadcast (no personalization)
    if (isBirthdayFlow) {
      // BIRTHDAY: Remove duplicate phone numbers - send one message per unique number
      const uniquePhones = new Set<string>(targets.map(m => m.phone));
      destinations = Array.from(uniquePhones);
    } else if (isPersonalized) {
      // PERSONALIZED: Allow duplicates (e.g. twins sharing a phone number for birthday wishes)
      // Each entry needs specific values (name)
      destinations = targets.map(m => ({
        number: m.phone,
        values: [m.fullName?.split(' ')[0]] // First name only
      }));
    } else {
      // NON-PERSONALIZED / GENERAL BROADCAST: Remove duplicate phone numbers
      // We only want to send one message per unique number
      const uniquePhones = new Set<string>(targets.map(m => m.phone));
      destinations = Array.from(uniquePhones);
    }

    const payload: SMSRequest = {
      text: messageText,
      type: MessageType.Standard,
      sender: 'BETHELKONET',
      destinations: destinations,
    };

    if (scheduleType === 'later' && scheduleTime) {
      payload.schedule = {
        dateTime: scheduleTime.replace('T', ' '),
        offset: '+00:00'
      };
    }

    try {
      console.log('=== FRONTEND BROADCAST DEBUG ===');
      console.log('Sending broadcast with payload:', JSON.stringify({
        text: messageText,
        destinations: destinations,
        sender: 'CHURCH',
        schedule: scheduleType === 'later' ? scheduleTime : undefined
      }, null, 2));
      console.log('Targets count:', targets.length);
      console.log('Personalized:', isPersonalized);
      console.log('Birthday Flow:', isBirthdayFlow);
      console.log('=== END FRONTEND DEBUG ===');

      // Always use the regular broadcast endpoint - it can handle both personalized and non-personalized messages
      await sendBroadcast(payload);
      
      // LOGGING & HISTORY
      const timestamp = new Date().toISOString();
      
      // For logging history, we still want to log against the member ID,
      // even if the physical SMS was de-duplicated.
      targets.forEach(member => {
         const finalContent = isBirthdayFlow || isPersonalized ? messageText.replace('{$name}', member.fullName?.split(' ')[0]) : messageText;
         
         const logEntry: SentMessage = {
             id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
             memberId: member.id,
             recipientName: member.fullName,
             recipientPhone: member.phone,
             content: finalContent,
             timestamp: timestamp,
             type: isBirthdayFlow ? 'birthday' : 'general',
             status: 'Sent'
         };
         addSentMessage(logEntry);
      });

      if (isBirthdayFlow) {
          if (isResendFlow) {
            logActivity('Birthday Message Resent', `Resent birthday wish to ${targets.map(t => t.fullName).join(', ')}`);
          } else {
            logActivity('Birthday Message Sent', `Sent birthday wish to ${targets.map(t => t.fullName).join(', ')}`);
          }
      } else {
          // More descriptive log for All Members
          if (destinationMode === 'all') {
              logActivity('Broadcast Sent', `Sent general broadcast to ALL members (${destinations.length} unique numbers)`);
          } else {
              logActivity('Broadcast Sent', `Sent message to ${destinations.length} recipients`);
          }
      }

      // Reset after success
      setMessageText('');
      setSelectedMembers([]);
      setScheduleTime('');
      setScheduleType('now');
      setSearchQuery('');
      setSelectedOrgs([]);
      setDestinationMode('organization'); // Reset to default
      setShowPreviewModal(false);
      setIsBirthdayFlow(false);
      setIsResendFlow(false);
      
      const action = scheduleType === 'later' ? 'scheduled' : 'sent';
      addToast(`Broadcast ${action} successfully!`, 'success');
    } catch (e) {
      console.error('=== FRONTEND BROADCAST ERROR ===');
      console.error('Broadcast failed:', e);
      console.error('Error details:', JSON.stringify(e, null, 2));
      console.error('=== END FRONTEND ERROR ===');
      addToast('Failed to send broadcast. Please try again.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const resolveMessagePreview = (name: string) => {
      const firstName = name.split(' ')[0];
      // For birthday messages, the name is already injected, so just return the message as is
      // For non-birthday messages, replace the {$name} placeholder
      return isBirthdayFlow ? messageText : messageText.replace('{$name}', firstName);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 relative animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">New Broadcast</h2>
        <p className="text-slate-500 dark:text-slate-400">Compose and send SMS updates to the congregation.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Editor (Always Visible) */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full transition-colors">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Message Editor</h3>
            
            <div className="flex-1">
              <textarea 
                rows={8}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full border-2 border-blue-400 rounded-lg p-3 text-sm focus:ring-blue-500 focus:border-blue-500 font-mono resize-none h-64 bg-white dark:bg-slate-700 dark:text-white"
                placeholder="Type your message here..."
              ></textarea>
              <div className="flex justify-between items-center mt-2 text-xs text-slate-500 dark:text-slate-400">
                <span className={smsStats.encoding === 'Unicode' ? 'text-amber-600 font-bold' : ''}>
                    {messageText.length} chars ({smsStats.encoding})
                </span>
                <span>{smsStats.segments} SMS segment(s)</span>
              </div>
              {smsStats.encoding === 'Unicode' && (
                  <p className="text-xs text-amber-600 mt-1">⚠️ Message contains special characters (emojis/unicode). Max length reduced to 70 chars per SMS.</p>
              )}
            </div>

            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              <button 
                onClick={handleClear}
                className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors font-medium"
              >
                Clear
              </button>
              <button 
                onClick={() => setShowTemplateImportModal(true)}
                className="px-4 py-2 text-sm text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors font-medium"
              >
                Import Template
              </button>
              <button 
                 onClick={() => setShowTemplateSaveModal(true)}
                 className="px-4 py-2 text-sm text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors font-medium"
              >
                Save as Template
              </button>
            </div>

             <div className="mt-4">
               <div className="flex items-center gap-2 mb-2">
                 <input 
                   type="checkbox" 
                   id="personalize" 
                   checked={isPersonalized} 
                   onChange={(e) => {
                       if (destinationMode === 'all') {
                           addToast('Personalization is disabled for "All Members" broadcast to avoid duplicates.', 'info');
                           return;
                       }
                       setIsPersonalized(e.target.checked);
                   }}
                   disabled={destinationMode === 'all'}
                   className="rounded text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                 />
                 <label htmlFor="personalize" className={`text-sm font-medium ${destinationMode === 'all' ? 'text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>Enable Personalization</label>
               </div>
               <p className="text-xs text-slate-500 dark:text-slate-400">Use <code>{`{$name}`}</code> in your message. It will be replaced by the member's first name.</p>
            </div>
            
            {/* Scheduling Section */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Scheduling</label>
                <div className="flex gap-4 mb-3">
                     <label className="flex items-center gap-2 cursor-pointer">
                         <input 
                            type="radio" 
                            name="scheduleType" 
                            value="now"
                            checked={scheduleType === 'now'}
                            onChange={() => setScheduleType('now')}
                            className="text-indigo-600 focus:ring-indigo-500"
                         />
                         <span className="text-sm text-slate-700 dark:text-slate-300">Send Now</span>
                     </label>
                     <label className="flex items-center gap-2 cursor-pointer">
                         <input 
                            type="radio" 
                            name="scheduleType" 
                            value="later"
                            checked={scheduleType === 'later'}
                            onChange={() => setScheduleType('later')}
                            className="text-indigo-600 focus:ring-indigo-500"
                         />
                         <span className="text-sm text-slate-700 dark:text-slate-300">Schedule for Later</span>
                     </label>
                </div>

                {scheduleType === 'later' && (
                    <div className="animate-in fade-in duration-200">
                        <input 
                            type="datetime-local" 
                            value={scheduleTime}
                            min={new Date().toISOString().slice(0, 16)}
                            onChange={(e) => setScheduleTime(e.target.value)}
                            className="w-full border-2 border-blue-400 rounded-lg p-2 text-sm text-slate-600 dark:text-white bg-white dark:bg-slate-700 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Select a future date and time.</p>
                    </div>
                )}
            </div>

          </div>
        </div>

        {/* Right Column: Destinations */}
        <div className="space-y-4">
           <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm min-h-[500px] flex flex-col transition-colors">
             <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Destinations</h3>
             
             {/* Tabs */}
             <div className="flex p-1 bg-slate-100 dark:bg-slate-700 rounded-lg mb-6 overflow-x-auto">
                <button 
                  onClick={() => { setDestinationMode('organization'); setSelectedMembers([]); setSelectedOrgs([]); setIsPersonalized(false); }}
                  className={`flex-1 py-2 px-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${destinationMode === 'organization' ? 'bg-white dark:bg-slate-600 shadow text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  By Organization
                </button>
                <button 
                  onClick={() => { setDestinationMode('individual'); setSelectedMembers([]); setSelectedOrgs([]); }}
                  className={`flex-1 py-2 px-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${destinationMode === 'individual' ? 'bg-white dark:bg-slate-600 shadow text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  By Individual
                </button>
             </div>
             
             {/* Special Action: Send to All */}
             <div className="mb-6">
                 <button 
                    onClick={handleSelectAllMembers}
                    className={`w-full py-3 rounded-lg border-2 border-dashed border-indigo-300 dark:border-indigo-700 flex items-center justify-center gap-2 font-bold transition-all
                        ${destinationMode === 'all' 
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                            : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                        }
                    `}
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    Send to All Members
                 </button>
             </div>

             {/* Mode Content */}
             <div className="flex-1">
               {destinationMode === 'organization' && (
                 <div className="space-y-4">
                    <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Select Organizations (Multiple)</label>
                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg max-h-64 overflow-y-auto">
                        {organizations.map(org => (
                            <label key={org} className="flex items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-0">
                                <input 
                                    type="checkbox"
                                    checked={selectedOrgs.includes(org)}
                                    onChange={() => toggleOrg(org)}
                                    className="rounded text-indigo-600 focus:ring-indigo-500 mr-3"
                                />
                                <span className="text-sm text-slate-700 dark:text-slate-200 font-medium">{org}</span>
                            </label>
                        ))}
                    </div>
                    
                    {selectedOrgs.length > 0 && (
                      <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-lg text-sm">
                        Selected <strong>{selectedOrgs.length}</strong> groups. <br/>
                        Total Recipients: <strong>{selectedMembers.length}</strong>
                      </div>
                    )}
                 </div>
               )}
               
               {destinationMode === 'individual' && (
                 <div className="flex flex-col h-full">
                    <div className="flex gap-2 mb-4">
                        <input 
                            type="text" 
                            placeholder="Search name or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 border-2 border-blue-400 rounded-lg p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
                        />
                        {searchQuery && (
                            <button 
                                onClick={selectAllSearchResults}
                                className="px-3 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-lg hover:bg-indigo-200"
                            >
                                Select All
                            </button>
                        )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg max-h-[300px]">
                      {filteredMembers.map(member => (
                        <div 
                          key={member.id}
                          onClick={() => toggleMember(member.id)}
                          className={`p-3 border-b border-slate-100 dark:border-slate-700 cursor-pointer flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 ${selectedMembers.includes(member.id) ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}`}
                        >
                           <div>
                             <p className="text-sm font-medium text-slate-900 dark:text-white">{member.fullName}</p>
                             <p className="text-xs text-slate-500 dark:text-slate-400">{member.phone}</p>
                           </div>
                           <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedMembers.includes(member.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600'}`}>
                             {selectedMembers.includes(member.id) && <span className="text-white text-xs">✓</span>}
                           </div>
                        </div>
                      ))}
                      {filteredMembers.length === 0 && (
                        <p className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">No members found.</p>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-slate-500 dark:text-slate-400 text-right">
                      {selectedMembers.length} selected
                    </div>
                 </div>
               )}
               
               {destinationMode === 'all' && (
                  <div className="flex flex-col h-full animate-in fade-in duration-300">
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800 mb-4">
                           <div className="flex items-center justify-between">
                               <div>
                                   <p className="font-bold text-indigo-900 dark:text-indigo-100">All Members Selected</p>
                                   <p className="text-xs text-indigo-600 dark:text-indigo-300 mt-0.5">Broadcasting to entire database</p>
                               </div>
                               <div className="text-right">
                                   <span className="block text-2xl font-bold text-indigo-700 dark:text-indigo-300">{uniqueRecipientsList.length}</span>
                                   <span className="text-[10px] uppercase font-bold text-indigo-500 dark:text-indigo-400 tracking-wider">Unique #s</span>
                               </div>
                           </div>
                      </div>

                      <div className="flex-1 flex flex-col min-h-0">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                              Unique Recipients List
                          </label>
                          <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800">
                              {uniqueRecipientsList.map((recipient) => (
                                  <div key={recipient.id} className="flex justify-between items-center p-3 border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{recipient.fullName}</span>
                                      <span className="text-xs font-mono text-slate-500">{recipient.phone}</span>
                                  </div>
                              ))}
                              {uniqueRecipientsList.length === 0 && (
                                  <div className="p-4 text-center text-slate-400 text-sm">No members found.</div>
                              )}
                          </div>
                      </div>
                  </div>
               )}
             </div>

             <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-700">
               <button 
                 onClick={handlePreview}
                 disabled={selectedMembers.length === 0 || !messageText}
                 className="w-full bg-primary text-text-light py-3 rounded-xl font-medium hover:bg-primary-dark disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors shadow-sm"
               >
                 Broadcast
               </button>
             </div>
           </div>
        </div>
      </div>
      
      {/* Import Template Modal */}
      {showTemplateImportModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-lg shadow-xl max-h-[80vh] flex flex-col transition-colors">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">Import Template</h3>
              <button onClick={() => setShowTemplateImportModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">✕</button>
            </div>
            <div className="p-5 overflow-y-auto space-y-3">
              {templates.map(t => (
                <div key={t.id} onClick={() => handleImportTemplate(t.content)} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer transition-all group">
                   <h4 className="font-semibold text-slate-800 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-400">{t.title}</h4>
                   <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">{t.content}</p>
                </div>
              ))}
              {templates.length === 0 && <p className="text-center text-slate-500 dark:text-slate-400">No saved templates.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Save Template Modal */}
      {showTemplateSaveModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-md shadow-xl p-6 transition-colors">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">Save Template</h3>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Template Title</label>
            <input 
              type="text" 
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm mb-4 bg-white dark:bg-slate-700 dark:text-white"
              value={newTemplateTitle}
              onChange={e => setNewTemplateTitle(e.target.value)}
              placeholder="e.g. Weekly Meeting Reminder"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowTemplateSaveModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium">Cancel</button>
              <button onClick={handleSaveTemplate} disabled={!newTemplateTitle} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 transform transition-all flex flex-col max-h-[90vh]">
            {/* Styled Header */}
            <div className="bg-indigo-600 p-6 text-white flex justify-between items-center relative overflow-hidden shrink-0">
               <div className="relative z-10">
                 <h3 className="text-2xl font-bold tracking-tight">Confirm Broadcast</h3>
                 <p className="text-indigo-200 text-sm mt-1">
                     {scheduleType === 'later' 
                        ? `Scheduled for: ${new Date(scheduleTime).toLocaleString()}` 
                        : 'Sending Immediately'}
                 </p>
               </div>
               <div className="relative z-10 bg-white/10 p-2.5 rounded-full backdrop-blur-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
               </div>
               <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500 rounded-full opacity-50"></div>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-sm">
                 {/* Destinations Tile */}
                 <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-xl border border-slate-200 dark:border-slate-600">
                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-2">Destinations</p>
                    {destinationMode === 'organization' ? (
                       <div>
                         <p className="font-bold text-slate-900 dark:text-white text-lg leading-tight mb-1">{selectedOrgs.join(', ')}</p>
                         <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md inline-flex">
                            <span className="text-xs font-bold">{selectedMembers.length} Active</span>
                         </div>
                       </div>
                    ) : destinationMode === 'all' ? (
                       <div>
                         <p className="font-bold text-slate-900 dark:text-white text-lg leading-tight mb-1">ALL MEMBERS</p>
                         <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md inline-flex">
                             <span className="text-xs font-bold">{uniqueRecipientsList.length} Unique Phones</span>
                         </div>
                       </div>
                    ) : (
                       <div>
                         <p className="font-bold text-slate-900 dark:text-white text-lg leading-tight mb-1">Selections</p>
                         <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md inline-flex">
                             <span className="text-xs font-bold">{selectedMembers.length} Individual{selectedMembers.length !== 1 ? 's' : ''}</span>
                         </div>
                       </div>
                    )}
                 </div>

                 {/* Cost Tile */}
              </div>

              {/* Message Preview Section */}
              <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-white mb-2">Message Preview</p>
                  
                  {isPersonalized && destinationMode === 'individual' ? (
                      <div className="space-y-3 max-h-48 overflow-y-auto pr-2 border border-slate-100 dark:border-slate-700 rounded-lg p-2">
                          {selectedMembers.map(id => {
                              const member = members.find(m => m.id === id);
                              if (!member) return null;
                              return (
                                  <div key={id} className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg border border-slate-200 dark:border-slate-600 text-sm">
                                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mb-1">To: {member.fullName}</p>
                                      <p className="text-slate-700 dark:text-slate-200 font-mono whitespace-pre-wrap">{resolveMessagePreview(member.fullName)}</p>
                                  </div>
                              );
                          })}
                      </div>
                  ) : (
                      <div className="relative group">
                        <div className="bg-white dark:bg-slate-700 p-5 rounded-xl border border-indigo-100 dark:border-indigo-900/30 text-slate-700 dark:text-slate-200 text-sm font-mono whitespace-pre-wrap shadow-[0_2px_8px_-2px_rgba(99,102,241,0.1)] leading-relaxed relative">
                            {messageText}
                        </div>
                        {isPersonalized && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 px-3 py-1.5 rounded-lg border border-amber-100 dark:border-amber-900/50">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                <span className="font-medium">Personalization Enabled: Each member will receive their own name.</span>
                            </div>
                        )}
                        <div className="text-right mt-1.5 text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                        {smsStats.segments} Segment(s)
                        </div>
                    </div>
                  )}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-end gap-3 shrink-0">
               <button 
                 onClick={() => setShowPreviewModal(false)}
                 className="px-5 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-all shadow-sm"
               >
                 Cancel
               </button>
               <button
                 onClick={confirmSend}
                 disabled={isSending}
                 className="px-6 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-200 dark:shadow-none flex items-center gap-2 transform active:scale-95"
               >
                 {isSending ? (
                   <>
                     <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                     Processing...
                   </>
                 ) : (
                   <>
                    <span>{scheduleType === 'later' ? 'Schedule Broadcast' : 'Confirm Send'}</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                   </>
                 )}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Broadcast;
