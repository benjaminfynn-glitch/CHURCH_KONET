import React, { useState, useMemo } from "react";
import { ServicePlan, ServiceStatus, ServiceType, StaffRole } from "../types";
import { usePlanner } from "../context/PlannerContext";
import { SendSMSModal } from "./SendSMSModal";
import { ConfirmationModal } from "./ConfirmationModal";
import { motion, AnimatePresence } from "framer-motion";
import { formatChurchDate } from "../utils/churchDate";

interface PlannerTableProps {
  onEdit: (plan: ServicePlan) => void;
  filterServiceType?: string;
  filterMonth?: string;
}

const STATUS_CONFIG: Record<ServiceStatus, { label: string; className: string }> = {
  upcoming: { label: "Upcoming", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  completed: { label: "Completed", className: "hidden" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
};

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  FIRST_DIVINE_SERVICE: "First Divine Service (English)",
  SECOND_DIVINE_SERVICE: "Second Divine Service (Fante)",
  JOINT_DIVINE_SERVICE: "Joint Divine Service",
  WEDNESDAY_PRAYER_MEETING: "Wednesday Prayer Meeting",
};

const ROLE_COLORS: Record<StaffRole, string> = {
  Preacher: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  Liturgist: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  "Bible Reader": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  MC: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
};

const shouldShowLiturgist = (serviceType: ServiceType): boolean => {
  return serviceType !== "WEDNESDAY_PRAYER_MEETING";
};

const shouldShowBibleReaders = (serviceType: ServiceType): boolean => {
  return serviceType !== "WEDNESDAY_PRAYER_MEETING";
};

export const PlannerTable: React.FC<PlannerTableProps> = ({ onEdit, filterServiceType = "", filterMonth = "" }) => {
  const { plans, deletePlan, updatePlan } = usePlanner();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [smsPlan, setSmsPlan] = useState<ServicePlan | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const filteredPlans = useMemo(() => {
    let result = [...plans];
    
    if (filterServiceType) {
      result = result.filter(plan => plan.serviceType === filterServiceType);
    }
    
    if (filterMonth) {
      result = result.filter(plan => {
        if (!plan.serviceDate) return false;
        const planMonth = plan.serviceDate.substring(5, 7);
        return planMonth === filterMonth;
      });
    }
    
    return result;
  }, [plans, filterServiceType, filterMonth]);

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmId) {
      await deletePlan(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const handleDelete = async (id: string) => {
    await deletePlan(id);
    setDeleteConfirmId(null);
  };

  const handleStatusChange = async (id: string, status: ServiceStatus) => {
    await updatePlan(id, { status });
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCards(newExpanded);
  };

  const handleCardClick = (e: React.MouseEvent, id: string) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('select')) {
      return;
    }
    toggleExpand(id);
  };

  return (
    <div className="space-y-4">
      {filteredPlans.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">📅</div>
          <p className="text-gray-500 mb-2">No planner entries found</p>
          <p className="text-gray-400 text-sm">Try adjusting your filters or add a new plan</p>
        </div>
      ) : (
        filteredPlans.map((plan) => {
          const isExpanded = expandedCards.has(plan.id!);
          const isPrayerMeeting = plan.serviceType === "WEDNESDAY_PRAYER_MEETING";
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 1, y: 0 }}
              className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-200 ${
                isExpanded ? 'shadow-md' : 'hover:shadow-sm'
              }`}
            >
              <motion.div
                onClick={(e) => handleCardClick(e, plan.id!)}
                className="p-3 cursor-pointer select-none"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{SERVICE_TYPE_LABELS[plan.serviceType]}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_CONFIG[plan.status].className}`}>
                        {STATUS_CONFIG[plan.status].label}
                      </span>
                    </div>
                    {!isPrayerMeeting && plan.theme && (
                      <p className="text-lg font-bold text-slate-800 dark:text-slate-700 mb-2">{plan.theme}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                      <span>{formatChurchDate(plan.serviceDate)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <select
                      value={plan.status}
                      onChange={(e) => handleStatusChange(plan.id!, e.target.value as ServiceStatus)}
                      onClick={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      className={`text-xs px-2 py-1 rounded-full font-medium border-none cursor-pointer ${STATUS_CONFIG[plan.status].className}`}
                    >
                      {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                        <option key={value} value={value}>{config.label}</option>
                      ))}
                    </select>
                    <motion.span
                      className="text-slate-500 text-sm px-2"
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      ▼
                    </motion.span>
                  </div>
                </div>
              </motion.div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2 pb-3 px-3 border-t border-slate-100 dark:border-slate-700">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Preacher</p>
                          {plan.preacherName ? (
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-800 dark:text-slate-200">{plan.preacherName}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded ${ROLE_COLORS.Preacher}`}>Preacher</span>
                            </div>
                          ) : <span className="text-gray-400">—</span>}
                        </div>
                        {shouldShowLiturgist(plan.serviceType) && (
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Liturgist</p>
                            {plan.liturgistName ? (
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-800 dark:text-slate-200">{plan.liturgistName}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded ${ROLE_COLORS.Liturgist}`}>Liturgist</span>
                              </div>
                            ) : <span className="text-gray-400">—</span>}
                          </div>
                        )}
                        {shouldShowBibleReaders(plan.serviceType) && (
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Bible Readers</p>
                            {plan.bibleReaders?.filter(br => br.name).length ? (
                              <div className="space-y-1">
                                {plan.bibleReaders.filter(br => br.name).map((br, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <span className="font-medium text-slate-800 dark:text-slate-200">{br.name}</span>
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${ROLE_COLORS["Bible Reader"]}`}>
                                      {idx === 0 ? "First" : idx === 1 ? "Second" : "Third"} Reader
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : <span className="text-gray-400">—</span>}
                          </div>
                        )}
                        {plan.mcName && (
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">MC</p>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-800 dark:text-slate-200">{plan.mcName}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded ${ROLE_COLORS.MC}`}>MC</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <motion.div
                        className="flex flex-row flex-wrap gap-2 justify-end mt-3 pt-2 border-t border-slate-100 dark:border-slate-700"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); setSmsPlan(plan); }}
                          className="px-3 py-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded text-sm font-medium"
                        >
                          Send SMS
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onEdit(plan); }}
                          className="px-3 py-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteClick(plan.id!); }}
                          className="px-3 py-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded text-sm font-medium"
                        >
                          Delete
                        </button>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })
      )}

      {deleteConfirmId && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setDeleteConfirmId(null)}
          onConfirm={handleDeleteConfirm}
          title="Delete Service Plan"
          message="This action will permanently remove this service plan from the system. This cannot be undone. Are you sure you want to proceed?"
          confirmButtonText="Delete Plan"
          cancelButtonText="Cancel"
          dangerLevel="danger"
        />
      )}

      {smsPlan && (
        <SendSMSModal plan={smsPlan} onClose={() => setSmsPlan(null)} />
      )}
    </div>
  );
};