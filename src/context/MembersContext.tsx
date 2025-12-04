// context/MembersContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Member,
  User,
  ActivityLogEntry,
  MessageTemplate,
  SentMessage,
} from "../types";
import { db } from "../firebase";
import { useAuth } from "./AuthContext";
import { validatePhoneNumber } from "../services/smsUtils";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  setDoc,
  runTransaction,
  getDoc,
} from "firebase/firestore";

/**
 * MembersContext
 *
 * Responsibilities:
 *  - real-time listeners for collections used by the UI
 *  - add/update/delete member operations (clean undefineds)
 *  - generate deterministic member codes using a transaction (metadata/memberCounter)
 *  - CSV import
 *
 * Notes:
 *  - Uses `fullName` consistently for the name field.
 *  - Does not modify SMSOnlineGH code or integration.
 */

// Small helper to convert undefined values to null (Firestore rejects undefined)
const cleanForFirestore = (obj: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v === undefined ? null : v])
  );

// Proper-case formatter for display names/orgs
export const formatProperCase = (s?: string) => {
  if (!s) return "";
  return s
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

// Generate unique member code using a transaction on metadata/memberCounter
const generateMemberCode = async (): Promise<string> => {
  const counterRef = doc(db, "metadata", "memberCounter");

  const code = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    let nextNumber = 1;
    if (!snap.exists()) {
      tx.set(counterRef, { lastNumber: 1 });
      nextNumber = 1;
    } else {
      const d = snap.data() as { lastNumber?: number } | undefined;
      const last = (d && d.lastNumber) || 0;
      nextNumber = last + 1;
      tx.update(counterRef, { lastNumber: nextNumber });
    }
    return `ANC-BMCE-${String(nextNumber).padStart(4, "0")}`;
  });

  return code;
};

interface MembersContextType {
  members: Member[];
  organizations: string[];
  templates: MessageTemplate[];
  users: User[];
  activityLog: ActivityLogEntry[];
  sentMessages: SentMessage[];

  addMember: (m: Partial<Member>) => Promise<string>; // returns doc id
  updateMember: (id: string, updates: Partial<Member>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  getMember: (id: string) => Member | undefined;
  importMembersFromCSV: (csvData: string) => Promise<{ added: number; failed: number }>;

  addOrganization: (name: string) => Promise<void>;
  updateOrganization: (oldName: string, newName: string) => Promise<void>;
  deleteOrganization: (name: string) => Promise<void>;

  addTemplate: (template: MessageTemplate) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;

  deleteUser: (id: string) => Promise<void>;

  logActivity: (action: string, description: string) => Promise<void>;
  addSentMessage: (msg: SentMessage) => Promise<void>;
}

const MembersContext = createContext<MembersContextType | undefined>(undefined);

export const MembersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading: authLoading } = useAuth();

  const [members, setMembers] = useState<Member[]>([]);
  const [organizations, setOrganizations] = useState<string[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [sentMessages, setSentMessages] = useState<SentMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!db) {
      console.warn("Firestore not initialized. Skipping listeners.");
      return;
    }

    // If no authenticated user, clear local state and skip attaching listeners.
    if (!user) {
      setMembers([]);
      setOrganizations([]);
      setTemplates([]);
      setActivityLog([]);
      setSentMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubMembers = onSnapshot(collection(db, "members"), (snap) =>
      setMembers(
        snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            memberCode: data.memberCode || null,
            fullName: data.fullName || data.name || "",
            gender: data.gender || "",
            phone: data.phone || "",
            birthday: data.birthday || "",
            organization: data.organization || "",
            notes: data.notes || "",
            opt_in: data.opt_in ?? true,
            createdAt: data.createdAt ?? null,
            updatedAt: data.updatedAt ?? null,
          } as Member;
        })
      )
    );

    const unsubOrgs = onSnapshot(collection(db, "organizations"), (snap) =>
      setOrganizations(snap.docs.map((d) => (d.data() as any).name || "Unknown").sort())
    );

    const unsubTemplates = onSnapshot(collection(db, "templates"), (snap) =>
      setTemplates(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as MessageTemplate)))
    );

    const unsubSent = onSnapshot(
      query(collection(db, "sent_messages"), orderBy("timestamp", "desc")),
      (snap) =>
        setSentMessages(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as SentMessage)))
    );

    const unsubLogs = onSnapshot(
      query(collection(db, "activity_logs"), orderBy("timestamp", "desc")),
      (snap) =>
        setActivityLog(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as ActivityLogEntry)))
    );

    setLoading(false);

    return () => {
      unsubMembers();
      unsubOrgs();
      unsubTemplates();
      unsubSent();
      unsubLogs();
    };
  }, [user, authLoading]);

  // Logging & sent messages
  const logActivity = async (action: string, description: string) => {
    if (!db || !user) return;
    try {
      await addDoc(collection(db, "activity_logs"), {
        timestamp: new Date().toISOString(),
        user: user.name || user.email || "Unknown",
        action,
        description,
      });
    } catch (e) {
      console.error("logActivity error", e);
    }
  };

  const addSentMessage = async (msg: SentMessage) => {
    if (!db) return;
    try {
      await addDoc(collection(db, "sent_messages"), cleanForFirestore(msg));
    } catch (e) {
      console.error("addSentMessage error", e);
    }
  };

  // Member operations
  const addMember = async (memberPartial: Partial<Member>) => {
    if (!db) throw new Error("Database not initialized");

    try {
      const memberCode = await generateMemberCode();

      const payload: any = {
        memberCode,
        fullName: formatProperCase(memberPartial.fullName || memberPartial.name || ""),
        gender: memberPartial.gender || null,
        phone: memberPartial.phone || null,
        birthday: memberPartial.birthday || null,
        organization: formatProperCase(memberPartial.organization || ""),
        notes: memberPartial.notes || null,
        opt_in: typeof memberPartial.opt_in === "boolean" ? memberPartial.opt_in : true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // remove undefined
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

      const docRef = await addDoc(collection(db, "members"), cleanForFirestore(payload));
      // update local state optimistically
      setMembers((prev) => [{ id: docRef.id, ...payload }, ...prev]);
      await logActivity("Add Member", `Added ${payload.fullName}`);
      return docRef.id;
    } catch (e) {
      console.error("addMember error", e);
      throw e;
    }
  };

  const updateMember = async (id: string, updates: Partial<Member>) => {
    if (!db) throw new Error("Database not initialized");

    try {
      const cleaned: Record<string, any> = {};
      if (updates.fullName !== undefined) cleaned.fullName = formatProperCase(updates.fullName);
      if (updates.gender !== undefined) cleaned.gender = updates.gender;
      if (updates.phone !== undefined) cleaned.phone = updates.phone;
      if (updates.birthday !== undefined) cleaned.birthday = updates.birthday;
      if (updates.organization !== undefined) cleaned.organization = formatProperCase(updates.organization);
      if (updates.notes !== undefined) cleaned.notes = updates.notes;
      if (typeof updates.opt_in !== "undefined") cleaned.opt_in = updates.opt_in;

      cleaned.updatedAt = Date.now();

      await updateDoc(doc(db, "members", id), cleanForFirestore(cleaned));

      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...cleaned } : m)));

      await logActivity("Update Member", `Updated member ${id}`);
    } catch (e) {
      console.error("updateMember error", e);
      throw e;
    }
  };

  const deleteMember = async (id: string) => {
    if (!db) throw new Error("Database not initialized");
    try {
      await deleteDoc(doc(db, "members", id));
      setMembers((prev) => prev.filter((m) => m.id !== id));
      await logActivity("Delete Member", `Deleted ${id}`);
    } catch (e) {
      console.error("deleteMember error", e);
      throw e;
    }
  };

  const getMember = (id: string) => members.find((m) => m.id === id);

  // CSV import
  const importMembersFromCSV = async (csvData: string) => {
    if (!db) return { added: 0, failed: 0 };
    const lines = csvData.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    let added = 0;
    let failed = 0;
    const start = lines[0]?.toLowerCase().includes("name") ? 1 : 0;

    for (const line of lines.slice(start)) {
      const [name, rawPhone, birthday = "", org = ""] = line.split(",").map((p) => p.trim());
      const phone = validatePhoneNumber(rawPhone);
      if (!name || !phone) {
        failed++;
        continue;
      }

      try {
        const memberCode = await generateMemberCode();
        await addDoc(collection(db, "members"), cleanForFirestore({
          memberCode,
          fullName: formatProperCase(name),
          phone,
          birthday,
          organization: formatProperCase(org),
          opt_in: true,
          gender: "Male",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }));
        added++;
      } catch (e) {
        console.error("CSV add error", e);
        failed++;
      }
    }

    await logActivity("CSV Import", `Imported ${added}, failed ${failed}`);
    return { added, failed };
  };

  // Organizations & templates & users
  const addOrganization = async (name: string) => {
    const fmt = formatProperCase(name);
    await setDoc(doc(db, "organizations", fmt), { name: fmt });
    await logActivity("Add Org", fmt);
  };

  const updateOrganization = async (oldName: string, newName: string) => {
    const fmt = formatProperCase(newName);
    await setDoc(doc(db, "organizations", fmt), { name: fmt });
    await deleteDoc(doc(db, "organizations", oldName));
    await logActivity("Update Org", `${oldName} → ${fmt}`);
  };

  const deleteOrganization = async (name: string) => {
    await deleteDoc(doc(db, "organizations", name));
    await logActivity("Delete Org", name);
  };

  const addTemplate = async (template: MessageTemplate) => {
    const { id, ...data } = template as any;
    await addDoc(collection(db, "templates"), cleanForFirestore(data));
    await logActivity("Add Template", template.title);
  };

  const deleteTemplate = async (id: string) => {
    await deleteDoc(doc(db, "templates", id));
    await logActivity("Delete Template", id);
  };

  const deleteUser = async (id: string) => {
    // Placeholder: admin deletion should be implemented using Admin SDK/cloud function
    console.log("Request to delete user:", id);
  };

  return (
    <MembersContext.Provider
      value={{
        members,
        organizations,
        templates,
        users,
        activityLog,
        sentMessages,
        addMember,
        updateMember,
        deleteMember,
        getMember,
        importMembersFromCSV,
        addOrganization,
        updateOrganization,
        deleteOrganization,
        addTemplate,
        deleteTemplate,
        deleteUser,
        logActivity,
        addSentMessage,
      }}
    >
      {children}
    </MembersContext.Provider>
  );
};

export const useMembers = () => {
  const ctx = useContext(MembersContext);
  if (!ctx) throw new Error("useMembers must be used inside MembersProvider");
  return ctx;
};
