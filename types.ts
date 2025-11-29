
export interface Member {
  id: string;
  name: string;
  phone: string;
  birthday: string; // YYYY-MM-DD
  gender?: string;
  organization?: string;
  notes?: string;
  sender_name?: string;
  opt_in: boolean;
}

export enum MessageType {
  Standard = 0,
  Flash = 1,
}

// SMSOnlineGH Payload Structures
export interface SMSDestinationPersonalized {
  number: string;
  values: string[];
}

export interface SMSRequest {
  text: string;
  type: MessageType;
  sender: string;
  destinations: string[] | SMSDestinationPersonalized[];
  schedule?: {
    dateTime: string;
    offset: string;
  };
}

export interface SMSResponse {
  handshake: {
    id: number;
    error: string;
    label: string;
  };
  data: {
    batch?: string;
    message?: string;
  };
}

export interface BalanceResponse {
  balance: number;
  currency: string;
}

export interface BroadcastStats {
  date: string;
  sent: number;
  delivered: number;
  failed: number;
}

export interface SMSLog {
  id: string;
  timestamp: string;
  message: string;
  senderId: string;
  status: 'Delivered' | 'Failed' | 'Sent' | 'Scheduled';
}

// --- NEW TYPES FOR SETTINGS & DATA ---

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Editor' | 'Viewer';
  dateCreated: string;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  description: string;
}

export interface MessageTemplate {
  id: string;
  title: string;
  content: string;
}

export type ThemeMode = 'light' | 'dark';

export type BirthdayPeriod = 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface BirthdaySettings {
  period: BirthdayPeriod;
  customRange?: {
    start: string;
    end: string;
  };
}

export interface SentMessage {
  id: string;
  memberId: string;
  recipientName: string;
  recipientPhone: string;
  content: string;
  timestamp: string;
  type: 'birthday' | 'general';
  status: 'Sent' | 'Delivered' | 'Failed';
}
