import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { StaffMember, StaffRole, StaffClassification } from "../types";
import { db } from "../firebase";
import { useAuth } from "./AuthContext";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
} from "firebase/firestore";

interface StaffContextType {
  staff: StaffMember[];
  loading: boolean;
  addStaff: (staff: Omit<StaffMember, "id" | "createdAt" | "updatedAt">) => Promise<string>;
  updateStaff: (id: string, updates: Partial<StaffMember>) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  getStaffByRole: (role: StaffRole) => StaffMember[];
  getStaffByClassification: (classification: StaffClassification) => StaffMember[];
  getActiveStaff: () => StaffMember[];
  searchStaff: (query: string) => StaffMember[];
  exportToCSV: () => void;
  roleStats: Record<StaffRole, number>;
  classificationStats: Record<StaffClassification, number>;
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

const ALL_ROLES: StaffRole[] = ["Preacher", "Liturgist", "Bible Reader", "MC"];

export const StaffProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      console.warn("Firestore not initialized. Skipping listeners.");
      return;
    }

    const q = query(collection(db, "staff"), orderBy("fullName", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setStaff(snap.docs.map((d) => ({ id: d.id, ...(d.data() as StaffMember) } as StaffMember)));
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const addStaff = useCallback(async (staffPartial: Omit<StaffMember, "id" | "createdAt" | "updatedAt">) => {
    if (!db) throw new Error("Database not initialized");

    const cleanStaff = Object.fromEntries(
      Object.entries(staffPartial).filter(([_, v]) => v !== undefined)
    );

    const staffMember: StaffMember = {
      ...cleanStaff,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      assignmentCount: 0,
    } as StaffMember;

    const docRef = await addDoc(collection(db, "staff"), staffMember);
    return docRef.id;
  }, []);

  const updateStaff = useCallback(async (id: string, updates: Partial<StaffMember>) => {
    if (!db) throw new Error("Database not initialized");
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await updateDoc(doc(db, "staff", id), { ...cleanUpdates, updatedAt: Date.now() });
  }, []);

  const deleteStaff = useCallback(async (id: string) => {
    if (!db) throw new Error("Database not initialized");
    await deleteDoc(doc(db, "staff", id));
  }, []);

  const getStaffByRole = useCallback((role: StaffRole) => {
    return staff.filter(s => s.roles.includes(role) && s.status === "active");
  }, [staff]);

  const getStaffByClassification = useCallback((classification: StaffClassification) => {
    return staff.filter(s => s.classification === classification && s.status === "active");
  }, [staff]);

  const getActiveStaff = useCallback(() => {
    return staff.filter(s => s.status === "active");
  }, [staff]);

  const searchStaff = useCallback((query: string) => {
    const q = query.toLowerCase();
    return staff.filter(s =>
      s.fullName.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      s.roles.some(role => role.toLowerCase().includes(q))
    );
  }, [staff]);

  const exportToCSV = useCallback(() => {
    const headers = ["Full Name,Roles,Phone,Gender,Status,Notes"];
    const csvContent = [
      headers.join(","),
      ...staff.map(s => [s.fullName, s.roles.join("; "), s.phone, s.gender, s.status, s.notes || ""].join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `staff-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [staff]);

  const roleStats = ALL_ROLES.reduce((acc, role) => {
    acc[role] = staff.filter(s => s.roles.includes(role) && s.status === "active").length;
    return acc;
  }, {} as Record<StaffRole, number>);

  const classificationStats = (["Internal", "External"] as StaffClassification[]).reduce((acc, classification) => {
    acc[classification] = staff.filter(s => s.classification === classification && s.status === "active").length;
    return acc;
  }, {} as Record<StaffClassification, number>);

  return (
    <StaffContext.Provider
      value={{
        staff,
        loading,
        addStaff,
        updateStaff,
        deleteStaff,
        getStaffByRole,
        getStaffByClassification,
        getActiveStaff,
        searchStaff,
        exportToCSV,
        roleStats,
        classificationStats,
      }}
    >
      {children}
    </StaffContext.Provider>
  );
};

export const useStaff = () => {
  const ctx = useContext(StaffContext);
  if (!ctx) throw new Error("useStaff must be used inside StaffProvider");
  return ctx;
};