// types.ts
export interface Member {
  id?: string;
  memberCode?: string;
  fullName?: string;
  gender?: string;
  phone?: string;
  birthday?: string; // YYYY-MM-DD
  organization?: string;
  notes?: string;
  opt_in?: boolean;
  createdAt?: number | null;
  updatedAt?: number | null;
  // Approval fields
  status?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: number | null;
  rejectionReason?: string;
}

export interface MemberApprovalRequest {
  id?: string;
  memberId: string;
  action: 'add' | 'edit' | 'delete';
  requestedData: Partial<Member>;
  requestedBy: string;
  requestedAt: number;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: number;
  rejectionReason?: string;
  deleteReason?: 'Not a Member' | 'Transferred' | 'Ceased to Fellowship' | 'Deceased';
}

export enum MessageType {
  Standard = 0,
  Flash = 1,
}

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
  success: boolean;
  batch?: string;
  category?: string;
  delivery?: boolean;
  count?: number;
  deliveryStatuses?: Array<{
    phone: string;
    status: string;
    message_id: string;
    error?: string;
  }>;
  personalized?: boolean;
  error?: string;
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
  status: "Delivered" | "Failed" | "Sent" | "Scheduled";
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: "Admin" | "Editor" | "Viewer";
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

export type ThemeMode = "light" | "dark";

export type BirthdayPeriod = "week" | "month" | "quarter" | "year" | "custom";

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
  type: "birthday" | "general";
  status: "Sent" | "Delivered" | "Failed";
}
