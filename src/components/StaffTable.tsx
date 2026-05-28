import React, { useState, useMemo } from "react";
import { StaffMember, StaffRole, StaffClassification } from "../types";
import { useStaff } from "../context/StaffContext";
import { Pagination } from "./Pagination";
import { ConfirmationModal } from "./ConfirmationModal";

interface StaffTableProps {
  onEdit: (staff: StaffMember) => void;
}

const CARD_CONFIG = [
  { role: "Preacher" as StaffRole, icon: "👤", color: "bg-blue-100 text-blue-700", badgeColor: "bg-blue-200 text-blue-800" },
  { role: "Liturgist" as StaffRole, icon: "⛪", color: "bg-purple-100 text-purple-700", badgeColor: "bg-purple-200 text-purple-800" },
  { role: "Bible Reader" as StaffRole, icon: "📖", color: "bg-green-100 text-green-700", badgeColor: "bg-green-200 text-green-800" },
  { role: "MC" as StaffRole, icon: "🎤", color: "bg-amber-100 text-amber-700", badgeColor: "bg-amber-200 text-amber-800" },
];

const CLASSIFICATION_CONFIG = [
  { classification: "Internal" as StaffClassification, icon: "🛡️", color: "bg-cyan-100 text-cyan-700", badgeColor: "bg-cyan-200 text-cyan-800" },
  { classification: "External" as StaffClassification, icon: "🌍", color: "bg-pink-100 text-pink-700", badgeColor: "bg-pink-200 text-pink-800" },
];

const GENDER_COLORS = {
  Male: "text-blue-600",
  Female: "text-pink-600",
  Total: "text-green-600",
};

const getStats = (stats: { male: number; female: number; total: number } | undefined) => ({
  male: stats?.male ?? 0,
  female: stats?.female ?? 0,
  total: stats?.total ?? 0,
});

export const StaffTable: React.FC<StaffTableProps> = ({ onEdit }) => {
  const { staff, deleteStaff, searchStaff, genderStats, classificationGenderStats } = useStaff();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<StaffRole | "">("");
  const [classificationFilter, setClassificationFilter] = useState<StaffClassification | "">("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredStaff = React.useMemo(() => {
    let result = staff;
    if (searchQuery) {
      result = searchStaff(searchQuery);
    }
    if (roleFilter) {
      result = result.filter(s => s.roles.includes(roleFilter));
    }
    if (classificationFilter) {
      result = result.filter(s => s.classification === classificationFilter);
    }
    return result.sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [staff, searchQuery, roleFilter, classificationFilter, searchStaff]);

  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const paginatedStaff = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStaff.slice(start, start + itemsPerPage);
  }, [filteredStaff, currentPage, itemsPerPage]);

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmId) {
      await deleteStaff(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CARD_CONFIG.map(({ role, icon, color, badgeColor }) => {
          const stats = getStats(genderStats[role]);
          return (
            <div key={role} className="bg-white rounded-xl shadow-sm border border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center text-lg`}>
                    {icon}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${badgeColor}`}>
                    {role}
                  </span>
                </div>
                <h3 className="text-slate-900 dark:text-white font-bold text-base mb-3">{role}s</h3>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Male</p>
                      <p className={`text-xl font-bold ${GENDER_COLORS.Male}`}>{stats.male}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Female</p>
                      <p className={`text-xl font-bold ${GENDER_COLORS.Female}`}>{stats.female}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total</p>
                      <p className={`text-xl font-bold ${GENDER_COLORS.Total}`}>{stats.total}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CLASSIFICATION_CONFIG.map(({ classification, icon, color, badgeColor }) => {
          const stats = getStats(classificationGenderStats[classification]);
          return (
            <div key={classification} className="bg-white rounded-xl shadow-sm border border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center text-lg`}>
                    {icon}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${badgeColor}`}>
                    {classification}
                  </span>
                </div>
                <h3 className="text-slate-900 dark:text-white font-bold text-base mb-3">{classification}</h3>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Male</p>
                      <p className={`text-xl font-bold ${GENDER_COLORS.Male}`}>{stats.male}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Female</p>
                      <p className={`text-xl font-bold ${GENDER_COLORS.Female}`}>{stats.female}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total</p>
                      <p className={`text-xl font-bold ${GENDER_COLORS.Total}`}>{stats.total}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-blue-600 dark:text-blue-400 mt-0.5">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 10-16 0 8.001 8.001 0 0016 0zm6 0A14 14 0 119 5.5a14.016 14.016 0 015.5-1.5c.356.027.71.069 1.05.163a1 1 0 01.948.709v1.068A1 1 0 0115.293 8.707L12.586 11.414a1 1 0 01-1.414 0L9.293 9.293a1 1 0 00-1.414 1.414l2.586 2.586a1 1 0 001.414 0L15.293 8.707A1 1 0 0014.707 7.293L11.586 4.172A1 1 0 0010 3.414z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Statistics are updated automatically when staff are added, edited or deleted.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as StaffRole | "")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            <option value="Preacher">Preacher</option>
            <option value="Liturgist">Liturgist</option>
            <option value="Bible Reader">Bible Reader</option>
            <option value="MC">MC</option>
          </select>
        </div>
        <div>
          <select
            value={classificationFilter}
            onChange={(e) => setClassificationFilter(e.target.value as StaffClassification | "")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Classifications</option>
            <option value="Internal">Internal</option>
            <option value="External">External</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse hidden md:table">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-700">
              <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-200">Name</th>
              <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-200">Roles</th>
              <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-200">Phone</th>
              <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-200">Gender</th>
              <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-200">Status</th>
              <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedStaff.map((s) => (
              <tr key={s.id} className="border-b hover:bg-gray-50 dark:border-slate-700">
                <td className="p-3 text-sm font-medium">{s.fullName}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      s.classification === "Internal" 
                        ? "bg-indigo-100 text-indigo-800" 
                        : "bg-orange-100 text-orange-800"
                    }`}>
                      {s.classification}
                    </span>
                    {s.roles.map(role => (
                      <span key={role} className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        role === "Preacher" ? "bg-blue-100 text-blue-800" :
                        role === "Liturgist" ? "bg-purple-100 text-purple-800" :
                        role === "Bible Reader" ? "bg-green-100 text-green-800" :
                        "bg-pink-100 text-pink-800"
                      }`}>
                        {role}
                      </span>
                    ))}
                  </div>
                  {s.classification === "External" && (s as any).society && (
                    <p className="text-xs text-gray-500 mt-1">{(s as any).society}</p>
                  )}
                </td>
                <td className="p-3 text-sm">{s.phone}</td>
                <td className="p-3 text-sm">{s.gender}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                    {s.status}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(s)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(s.id!)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="md:hidden space-y-3">
          {paginatedStaff.map((s) => (
            <div key={s.id} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-white">{s.fullName}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{s.phone}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => onEdit(s)}
                    className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(s.id!)}
                    className="text-red-600 hover:text-red-800 text-sm px-2 py-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  s.classification === "Internal" 
                    ? "bg-indigo-100 text-indigo-800" 
                    : "bg-orange-100 text-orange-800"
                }`}>
                  {s.classification}
                </span>
                {s.roles.map(role => (
                  <span key={role} className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    role === "Preacher" ? "bg-blue-100 text-blue-800" :
                    role === "Liturgist" ? "bg-purple-100 text-purple-800" :
                    role === "Bible Reader" ? "bg-green-100 text-green-800" :
                    "bg-pink-100 text-pink-800"
                  }`}>
                    {role}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{s.gender}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                  {s.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {deleteConfirmId && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setDeleteConfirmId(null)}
          onConfirm={handleDeleteConfirm}
          title="Delete Staff Member"
          message="This action will permanently remove this staff member from the system. This cannot be undone. Are you sure you want to proceed?"
          confirmButtonText="Delete Staff"
          cancelButtonText="Cancel"
          dangerLevel="danger"
        />
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredStaff.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(newItemsPerPage) => {
          setItemsPerPage(newItemsPerPage);
          setCurrentPage(1);
        }}
      />
    </div>
  );
};