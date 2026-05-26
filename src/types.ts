// types.ts
export interface Member {
  id?: string;
  memberCode?: string;
  fullName?: string;
  gender?: string;
  phone?: string;
  birthday?: string; // YYYY-MM-DD
  organizations?: string[];
  notes?: string;
  opt_in?: boolean;
  createdAt?: number | null;
  updatedAt?: number | null;
  memberKey?: string; // composite key for duplicate prevention
  // Approval fields
  isActive?: boolean;
  status?: 'inactive' | 'active' | 'pending' | 'approved' | 'rejected';
  statusMessage?: string;
  approvedBy?: string;
  approvedAt?: number | null;
  rejectionReason?: string;
}

export interface MemberApprovalRequest {
  id?: string;
  memberId: string;
  action: 'add' | 'edit' | 'delete' | 'delete_template';
  requestedData: Partial<Member> | MessageTemplate;
  requestedBy: string;
  requestedAt: number;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: number;
  rejectionReason?: string;
  deleteReason?: 'Not a Member' | 'Transferred' | 'Ceased to Fellowship' | 'Deceased';
  changes?: Array<{field: string, oldValue: any, newValue: any}>;
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

export type ServiceType = "FIRST_DIVINE_SERVICE" | "SECOND_DIVINE_SERVICE" | "JOINT_DIVINE_SERVICE" | "WEDNESDAY_PRAYER_MEETING";

export type ServiceStatus = "upcoming" | "completed" | "cancelled"

export interface BibleReader {
  scriptureReference: string;
  name: string;
  contact: string;
}

export interface ServicePlan {
  id?: string;
  serviceDate: string;
  serviceType: ServiceType;
  theme: string;
  preacherId?: string;
  preacherName?: string;
  preacherContact?: string;
  bibleReaders: BibleReader[];
  standbyPreacherId?: string;
  standbyPreacherName?: string;
  standbyPreacherContact?: string;
  liturgistId?: string;
  liturgistName?: string;
  liturgistContact?: string;
  notes: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  status: ServiceStatus;
  mcId?: string;
  mcName?: string;
  mcContact?: string;
}

export interface PlannerFilter {
  date?: string;
  month?: string;
  serviceType?: ServiceType;
  preacher?: string;
  searchQuery?: string;
}

export type StaffRole = "Preacher" | "Liturgist" | "Bible Reader" | "MC";

export type StaffClassification = "Internal" | "External";

export interface StaffMember {
  id?: string;
  fullName: string;
  roles: StaffRole[];
  phone: string;
  gender: "Male" | "Female" | "Other";
  status: "active" | "inactive";
  notes?: string;
  createdAt?: number;
  updatedAt?: number;
  assignmentCount?: number;
  classification: StaffClassification;
  society?: string;
}

export interface ExternalPreacher {
  id?: string;
  fullName: string;
  phone: string;
  society: string;
  denomination?: string;
  classification: "External";
  status: "active" | "inactive";
  availability?: string[];
  notes?: string;
  createdAt?: number;
  updatedAt?: number;
  appointmentHistory?: ExternalPreacherAppointment[];
  isFavorite: boolean;
}

export interface ExternalPreacherAppointment {
  id?: string;
  externalPreacherId: string;
  serviceDate: string;
  serviceType: ServiceType;
  theme: string;
  status: "Scheduled" | "Confirmed" | "Completed" | "Cancelled";
  createdAt: number;
  updatedAt: number;
}

export interface PreacherAssignment {
  id?: string;
  internalPreacherId?: string;
  externalPreacherId?: string;
  serviceDate: string;
  serviceType: ServiceType;
  theme: string;
  status: "Scheduled" | "Confirmed" | "Completed" | "Cancelled";
  createdAt: number;
  updatedAt: number;
}
