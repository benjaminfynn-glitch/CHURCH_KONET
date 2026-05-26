import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ExternalPreacher, ExternalPreacherAppointment, ServiceType } from "../types";
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
} from "firebase/firestore";

interface ExternalPreacherContextType {
  externalPreachers: ExternalPreacher[];
  loading: boolean;
  addPreacher: (preacher: Omit<ExternalPreacher, "id" | "createdAt" | "updatedAt">) => Promise<string>;
  updatePreacher: (id: string, updates: Partial<ExternalPreacher>) => Promise<void>;
  deletePreacher: (id: string) => Promise<void>;
  archivePreacher: (id: string) => Promise<void>;
  getActivePreachers: () => ExternalPreacher[];
  getFavoritePreachers: () => ExternalPreacher[];
  searchPreachers: (query: string) => ExternalPreacher[];
  getPreacherById: (id: string) => ExternalPreacher | undefined;
  addAppointment: (appointment: Omit<ExternalPreacherAppointment, "id" | "createdAt" | "updatedAt">) => Promise<string>;
  getAppointmentsByPreacher: (preacherId: string) => ExternalPreacherAppointment[];
  getAppointmentsByDate: (date: string) => ExternalPreacherAppointment[];
  exportToCSV: () => void;
}

const ExternalPreacherContext = createContext<ExternalPreacherContextType | undefined>(undefined);

export const ExternalPreacherProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [externalPreachers, setExternalPreachers] = useState<ExternalPreacher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      console.warn("Firestore not initialized. Skipping listeners.");
      return;
    }

    const q = query(collection(db, "externalPreachers"), orderBy("fullName", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setExternalPreachers(snap.docs.map((d) => ({ id: d.id, ...(d.data() as ExternalPreacher) } as ExternalPreacher)));
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const addPreacher = useCallback(async (preacherPartial: Omit<ExternalPreacher, "id" | "createdAt" | "updatedAt">) => {
    if (!db) throw new Error("Database not initialized");

    const cleanPreacher = Object.fromEntries(
      Object.entries(preacherPartial).filter(([_, v]) => v !== undefined)
    );

    const preacher: ExternalPreacher = {
      ...cleanPreacher,
      classification: "External",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isFavorite: false,
      status: "active",
    } as ExternalPreacher;

    const docRef = await addDoc(collection(db, "externalPreachers"), preacher);
    return docRef.id;
  }, []);

  const updatePreacher = useCallback(async (id: string, updates: Partial<ExternalPreacher>) => {
    if (!db) throw new Error("Database not initialized");
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await updateDoc(doc(db, "externalPreachers", id), { ...cleanUpdates, updatedAt: Date.now() });
  }, []);

  const deletePreacher = useCallback(async (id: string) => {
    if (!db) throw new Error("Database not initialized");
    await deleteDoc(doc(db, "externalPreachers", id));
  }, []);

  const archivePreacher = useCallback(async (id: string) => {
    if (!db) throw new Error("Database not initialized");
    await updateDoc(doc(db, "externalPreachers", id), { status: "inactive", updatedAt: Date.now() });
  }, []);

  const getActivePreachers = useCallback(() => {
    return externalPreachers.filter(p => p.status === "active");
  }, [externalPreachers]);

  const getFavoritePreachers = useCallback(() => {
    return externalPreachers.filter(p => p.isFavorite);
  }, [externalPreachers]);

  const searchPreachers = useCallback((query: string) => {
    const q = query.toLowerCase();
    return externalPreachers.filter(p =>
      p.fullName.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      (p.society && p.society.toLowerCase().includes(q)) ||
      (p.denomination && p.denomination.toLowerCase().includes(q))
    );
  }, [externalPreachers]);

  const getPreacherById = useCallback((id: string) => {
    return externalPreachers.find(p => p.id === id);
  }, [externalPreachers]);

  const addAppointment = useCallback(async (appointmentPartial: Omit<ExternalPreacherAppointment, "id" | "createdAt" | "updatedAt">) => {
    if (!db) throw new Error("Database not initialized");

    const cleanAppointment = Object.fromEntries(
      Object.entries(appointmentPartial).filter(([_, v]) => v !== undefined)
    );

    const appointment: ExternalPreacherAppointment = {
      ...cleanAppointment,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as ExternalPreacherAppointment;

    const docRef = await addDoc(collection(db, "externalPreacherAppointments"), appointment);
    return docRef.id;
  }, []);

  const getAppointmentsByPreacher = useCallback((preacherId: string) => {
    return externalPreachers
      .flatMap(p => p.appointmentHistory || [])
      .filter(a => a.externalPreacherId === preacherId);
  }, [externalPreachers]);

  const getAppointmentsByDate = useCallback((date: string) => {
    return externalPreachers
      .flatMap(p => p.appointmentHistory || [])
      .filter(a => a.serviceDate === date);
  }, [externalPreachers]);

  const exportToCSV = useCallback(() => {
    const headers = ["Full Name,Phone,Society,Denomination,Status,Favorite"];
    const csvContent = [
      headers.join(","),
      ...externalPreachers.map(p => [p.fullName, p.phone, p.society, p.denomination || "", p.status, p.isFavorite ? "Yes" : "No"].join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `external-preachers-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [externalPreachers]);

  return (
    <ExternalPreacherContext.Provider
      value={{
        externalPreachers,
        loading,
        addPreacher,
        updatePreacher,
        deletePreacher,
        archivePreacher,
        getActivePreachers,
        getFavoritePreachers,
        searchPreachers,
        getPreacherById,
        addAppointment,
        getAppointmentsByPreacher,
        getAppointmentsByDate,
        exportToCSV,
      }}
    >
      {children}
    </ExternalPreacherContext.Provider>
  );
};

export const useExternalPreacher = () => {
  const ctx = useContext(ExternalPreacherContext);
  if (!ctx) throw new Error("useExternalPreacher must be used inside ExternalPreacherProvider");
  return ctx;
};