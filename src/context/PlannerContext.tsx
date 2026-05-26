import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ServicePlan, ServiceType, PlannerFilter, ServiceStatus } from "../types";
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
  where,
  getDocs,
} from "firebase/firestore";

const getStatusFromDate = (serviceDate: string): ServiceStatus => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const service = new Date(serviceDate);
  service.setHours(0, 0, 0, 0);
  return service < today ? "completed" : "upcoming";
};

interface PlannerContextType {
  plans: ServicePlan[];
  loading: boolean;
  filter: PlannerFilter;
  setFilter: (filter: PlannerFilter) => void;
  addPlan: (plan: Omit<ServicePlan, "id" | "createdAt" | "updatedAt" | "createdBy">) => Promise<string>;
  updatePlan: (id: string, updates: Partial<ServicePlan>) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  duplicatePlan: (id: string, newDate: string) => Promise<string>;
  getPlansByDate: (date: string) => ServicePlan[];
  getPlansByServiceType: (serviceType: ServiceType) => ServicePlan[];
  exportToPDF: () => Promise<void>;
  exportToExcel: () => Promise<void>;
}

const PlannerContext = createContext<PlannerContextType | undefined>(undefined);

export const PlannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PlannerFilter>({});

  useEffect(() => {
    if (!db) {
      console.warn("Firestore not initialized. Skipping listeners.");
      return;
    }

    const q = query(collection(db, "planner"), orderBy("serviceDate", "desc"));
    const unsub = onSnapshot(q, async (snap) => {
      const updatedPlans = snap.docs.map((d) => {
        const plan = { id: d.id, ...(d.data() as ServicePlan) } as ServicePlan;
        const computedStatus = getStatusFromDate(plan.serviceDate);
        if (plan.status !== computedStatus && plan.status !== "cancelled") {
          updateDoc(doc(db, "planner", d.id), { status: computedStatus });
        }
        return plan;
      });
      setPlans(updatedPlans);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const addPlan = useCallback(async (planPartial: Omit<ServicePlan, "id" | "createdAt" | "updatedAt" | "createdBy">) => {
    if (!db) throw new Error("Database not initialized");

    const status = getStatusFromDate(planPartial.serviceDate);

    const cleanPlan = Object.fromEntries(
      Object.entries(planPartial).filter(([_, v]) => v !== undefined)
    );

    const plan: ServicePlan = {
      ...cleanPlan,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: user?.fullName || user?.email || "Unknown",
      status,
    } as ServicePlan;

    const docRef = await addDoc(collection(db, "planner"), plan);
    return docRef.id;
  }, [user]);

  const updatePlan = useCallback(async (id: string, updates: Partial<ServicePlan>) => {
    if (!db) throw new Error("Database not initialized");
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await updateDoc(doc(db, "planner", id), { ...cleanUpdates, updatedAt: Date.now() });
  }, []);

  const deletePlan = useCallback(async (id: string) => {
    if (!db) throw new Error("Database not initialized");
    await deleteDoc(doc(db, "planner", id));
  }, []);

  const duplicatePlan = useCallback(async (id: string, newDate: string) => {
    const plan = plans.find(p => p.id === id);
    if (!plan) throw new Error("Plan not found");

    const newPlan: Omit<ServicePlan, "id" | "createdAt" | "updatedAt" | "createdBy"> = {
      serviceDate: newDate,
      serviceType: plan.serviceType,
      theme: plan.theme,
      preacherId: plan.preacherId,
      preacherName: plan.preacherName,
      preacherContact: plan.preacherContact,
      bibleReaders: plan.bibleReaders,
      standbyPreacherId: plan.standbyPreacherId,
      standbyPreacherName: plan.standbyPreacherName,
      standbyPreacherContact: plan.standbyPreacherContact,
      liturgistId: plan.liturgistId,
      liturgistName: plan.liturgistName,
      liturgistContact: plan.liturgistContact,
      notes: plan.notes,
      mcId: plan.mcId,
      mcName: plan.mcName,
      mcContact: plan.mcContact,
      status: "upcoming",
    };

    return addPlan(newPlan);
  }, [plans, addPlan]);

  const getPlansByDate = useCallback((date: string) => {
    return plans.filter(p => p.serviceDate === date);
  }, [plans]);

  const getPlansByServiceType = useCallback((serviceType: ServiceType) => {
    return plans.filter(p => p.serviceType === serviceType);
  }, [plans]);

  const exportToPDF = useCallback(async () => {
    window.print();
  }, []);

  const exportToExcel = useCallback(async () => {
    const headers = ["Date", "Service Type", "Theme", "Preacher", "Status"];
    const csvContent = [
      headers.join(","),
      ...plans.map(p => [p.serviceDate, p.serviceType, p.theme, p.preacherName, p.status].join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `planner-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [plans]);

  const filteredPlans = plans.filter(plan => {
    if (filter.date && plan.serviceDate !== filter.date) return false;
    if (filter.month && !plan.serviceDate.startsWith(filter.month)) return false;
    if (filter.serviceType && plan.serviceType !== filter.serviceType) return false;
    if (filter.preacher && plan.preacherName !== filter.preacher) return false;
    if (filter.searchQuery) {
      const q = filter.searchQuery.toLowerCase();
      return (
        plan.theme.toLowerCase().includes(q) ||
        plan.preacherName.toLowerCase().includes(q) ||
        plan.bibleReaders.some(br => br.name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <PlannerContext.Provider
      value={{
        plans: filteredPlans,
        loading,
        filter,
        setFilter,
        addPlan,
        updatePlan,
        deletePlan,
        duplicatePlan,
        getPlansByDate,
        getPlansByServiceType,
        exportToPDF,
        exportToExcel,
      }}
    >
      {children}
    </PlannerContext.Provider>
  );
};

export const usePlanner = () => {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error("usePlanner must be used inside PlannerProvider");
  return ctx;
};