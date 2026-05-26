import React, { useState } from "react";
import { StaffMember, StaffRole, StaffClassification } from "../types";
import { useStaff } from "../context/StaffContext";

interface StaffTableProps {
  onEdit: (staff: StaffMember) => void;
}

const ROLE_BADGES: Record<StaffRole, string> = {
  Preacher: "bg-blue-100 text-blue-800",
  Liturgist: "bg-purple-100 text-purple-800",
  "Bible Reader": "bg-green-100 text-green-800",
  MC: "bg-pink-100 text-pink-800",
};

const CLASSIFICATION_BADGES: Record<StaffClassification, string> = {
  Internal: "bg-indigo-100 text-indigo-800",
  External: "bg-orange-100 text-orange-800",
};

export const StaffTable: React.FC<StaffTableProps> = ({ onEdit }) => {
  const { staff, deleteStaff, searchStaff, roleStats, classificationStats } = useStaff();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<StaffRole | "">("");
  const [classificationFilter, setClassificationFilter] = useState<StaffClassification | "">("");

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

  const handleDelete = async (id: string) => {
    await deleteStaff(id);
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {(["Preacher", "Liturgist", "Bible Reader", "MC"] as StaffRole[]).map(role => (
          <div key={role} className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-800">{roleStats[role]}</p>
            <p className="text-sm text-gray-600">{role}{roleStats[role] !== 1 ? "s" : ""}</p>
          </div>
        ))}
        {(["Internal", "External"] as StaffClassification[]).map(classification => (
          <div key={classification} className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-800">{classificationStats[classification]}</p>
            <p className="text-sm text-gray-600">{classification}</p>
          </div>
        ))}
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
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left p-3 text-sm font-medium text-gray-700">Name</th>
              <th className="text-left p-3 text-sm font-medium text-gray-700">Roles</th>
              <th className="text-left p-3 text-sm font-medium text-gray-700">Phone</th>
              <th className="text-left p-3 text-sm font-medium text-gray-700">Gender</th>
              <th className="text-left p-3 text-sm font-medium text-gray-700">Status</th>
              <th className="text-left p-3 text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map((s) => (
              <tr key={s.id} className="border-b hover:bg-gray-50">
                <td className="p-3 text-sm font-medium">{s.fullName}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CLASSIFICATION_BADGES[s.classification]}`}>
                      {s.classification}
                    </span>
                    {s.roles.map(role => (
                      <span key={role} className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_BADGES[role]}`}>
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
                      onClick={() => setDeleteConfirm(s.id!)}
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
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-4">Are you sure you want to delete this staff member?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};