import React, { useState } from "react";
import { ServicePlan } from "../types";
import { PlannerForm } from "../components/PlannerForm";
import { PlannerTable } from "../components/PlannerTable";
import { PlannerCalendar } from "../components/PlannerCalendar";
import { usePlanner } from "../context/PlannerContext";
import { useToast } from "../context/ToastContext";
import PrimaryButton from "../components/PrimaryButton";
import { useNavigate } from "react-router-dom";
import { formatChurchDate } from "../utils/churchDate";

type PlannerView = "table" | "calendar";

const MONTH_OPTIONS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export default function PlannerPage() {
  const { addPlan, updatePlan, plans } = usePlanner();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ServicePlan | null>(null);
  const [view, setView] = useState<PlannerView>("table");
  const [filterServiceType, setFilterServiceType] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  const handleSubmit = async (plan: any) => {
    try {
      if (editingPlan) {
        await updatePlan(editingPlan.id!, plan);
        addToast("Plan updated successfully", "success");
      } else {
        await addPlan(plan);
        addToast("Plan created successfully", "success");
      }
      setModalOpen(false);
      setEditingPlan(null);
    } catch (e) {
      addToast("Failed to save plan", "error");
    }
  };

  const handleEdit = (plan: ServicePlan) => {
    setEditingPlan(plan);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingPlan(null);
  };

  const handleExportExcel = () => {
    const headers = ["Date,Service Type,Theme,Preacher,Status"];
    const csvContent = [
      headers.join(","),
      ...plans.map(p => [formatChurchDate(p.serviceDate), p.serviceType, p.theme, p.preacherName, p.status].join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `planner-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("Excel exported successfully", "success");
  };

  const upcomingCount = plans.filter(p => p.status === 'upcoming').length;
  const pendingSmsCount = plans.filter(p => !p.preacherName || !p.liturgistName || !p.mcName).length;
  const externalMinisters = new Set(plans.map(p => p.preacherName).filter(Boolean)).size;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <header className="bg-gradient-to-r from-indigo-600 to-blue-700 text-white rounded-2xl p-6 shadow-xl mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Church Planner</h1>
            <p className="text-indigo-100 mt-1">Plan and manage all preaching, liturgy, Bible reading, and service assignments</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="bg-white/15 backdrop-blur px-3 py-1.5 rounded-lg text-xs">
              <span className="font-bold">{upcomingCount}</span> Upcoming Services
            </div>
            <div className="bg-white/15 backdrop-blur px-3 py-1.5 rounded-lg text-xs">
              <span className="font-bold">{pendingSmsCount}</span> Pending SMS
            </div>
            <div className="bg-white/15 backdrop-blur px-3 py-1.5 rounded-lg text-xs">
              <span className="font-bold">{externalMinisters}</span> External Ministers
            </div>
          </div>
        </div>
      </header>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Service Type</label>
            <select
              value={filterServiceType}
              onChange={(e) => setFilterServiceType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            >
              <option value="">All Service Types</option>
              <option value="FIRST_DIVINE_SERVICE">First Divine Service (English)</option>
              <option value="SECOND_DIVINE_SERVICE">Second Divine Service (Fante)</option>
              <option value="JOINT_DIVINE_SERVICE">Joint Divine Service</option>
              <option value="WEDNESDAY_PRAYER_MEETING">Wednesday Prayer Meeting</option>
            </select>
          </div>

          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Month</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            >
              <option value="">All Months</option>
              {MONTH_OPTIONS.map(month => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
            <button
              onClick={() => { setFilterServiceType(""); setFilterMonth(""); }}
              className="text-sm text-blue-600 hover:text-blue-800 px-3 py-2 border border-blue-600 border-rounded hover:bg-blue-50 rounded-lg"
            >
              Clear Filters
            </button>
            <PrimaryButton onClick={() => setModalOpen(true)} className="text-sm">
              + Add Plan
            </PrimaryButton>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md mb-6">
        <div className="border-b border-gray-200 dark:border-slate-700">
          <nav className="flex space-x-4 px-4">
            <button
              onClick={() => setView("table")}
              className={`py-3 text-sm font-medium ${view === "table" ? "text-indigo-700 border-b-2 border-indigo-700" : "text-gray-500 dark:text-slate-400"}`}
            >
              Service Cards
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`py-3 text-sm font-medium ${view === "calendar" ? "text-indigo-700 border-b-2 border-indigo-700" : "text-gray-500 dark:text-slate-400"}`}
            >
              Calendar View
            </button>
          </nav>
        </div>

        <div className="p-4">
          {view === "table" ? (
            <PlannerTable onEdit={handleEdit} filterServiceType={filterServiceType} filterMonth={filterMonth} />
          ) : (
            <PlannerCalendar onEdit={handleEdit} />
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
                {editingPlan ? "Edit Plan" : "Add New Plan"}
              </h2>
              <PlannerForm
                initial={editingPlan || undefined}
                onSubmit={handleSubmit}
                onCancel={handleCloseModal}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}