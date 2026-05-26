import React, { useState } from "react";
import { StaffMember, StaffRole, StaffClassification } from "../types";

interface StaffFormProps {
  initial?: Partial<StaffMember>;
  onSubmit: (staff: Omit<StaffMember, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}

const ROLE_OPTIONS: StaffRole[] = ["Preacher", "Liturgist", "Bible Reader", "MC"];
const CLASSIFICATION_OPTIONS: StaffClassification[] = ["Internal", "External"];

export const StaffForm: React.FC<StaffFormProps> = ({ initial, onSubmit, onCancel }) => {
  const [fullName, setFullName] = useState(initial?.fullName || "");
  const [roles, setRoles] = useState<StaffRole[]>(initial?.roles || []);
  const [phone, setPhone] = useState(initial?.phone || "");
  const [gender, setGender] = useState<"Male" | "Female" | "Other">(initial?.gender || "Male");
  const [status, setStatus] = useState<"active" | "inactive">(initial?.status || "active");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [classification, setClassification] = useState<StaffClassification>(initial?.classification || "Internal");
  const [society, setSociety] = useState((initial as any)?.society || "");

  const handleRoleToggle = (role: StaffRole) => {
    if (roles.includes(role)) {
      setRoles(roles.filter(r => r !== role));
    } else {
      setRoles([...roles, role]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: StaffMember = {
      fullName: fullName.trim(),
      roles,
      phone: phone.trim(),
      gender,
      status,
      classification,
    };
    if (notes.trim()) payload.notes = notes.trim();
    if (classification === "External" && society.trim()) payload.society = society.trim();
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Enter full name"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Roles * (Select at least one)</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {ROLE_OPTIONS.map(role => (
            <label key={role} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={roles.includes(role)}
                onChange={() => handleRoleToggle(role)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{role}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter phone number"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as "Male" | "Female" | "Other")}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Classification *</label>
        <select
          value={classification}
          onChange={(e) => setClassification(e.target.value as StaffClassification)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {CLASSIFICATION_OPTIONS.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {classification === "External" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name of Society/Organization</label>
          <input
            type="text"
            value={society}
            onChange={(e) => setSociety(e.target.value)}
            placeholder="e.g., Mt. Olivet Methodist Church"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes/Remarks</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800"
        >
          {initial ? "Update" : "Add"} Staff
        </button>
      </div>
    </form>
  );
};