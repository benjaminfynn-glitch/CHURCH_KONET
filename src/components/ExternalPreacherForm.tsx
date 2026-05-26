import React, { useState } from "react";
import { ExternalPreacher } from "../types";

interface ExternalPreacherFormProps {
  initial?: Partial<ExternalPreacher>;
  onSubmit: (preacher: Omit<ExternalPreacher, "id" | "createdAt" | "updatedAt" | "classification">) => void;
  onCancel: () => void;
}

export const ExternalPreacherForm: React.FC<ExternalPreacherFormProps> = ({ initial, onSubmit, onCancel }) => {
  const [fullName, setFullName] = useState(initial?.fullName || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [society, setSociety] = useState(initial?.society || "");
  const [denomination, setDenomination] = useState(initial?.denomination || "");
  const [status, setStatus] = useState<"active" | "inactive">(initial?.status || "active");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [isFavorite, setIsFavorite] = useState(initial?.isFavorite || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !society.trim()) return;
    const payload: ExternalPreacher = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      society: society.trim(),
      classification: "External",
      status,
      isFavorite,
    };
    if (denomination.trim()) payload.denomination = denomination.trim();
    if (notes.trim()) payload.notes = notes.trim();
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
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name of Society/Organization *</label>
        <input
          type="text"
          value={society}
          onChange={(e) => setSociety(e.target.value)}
          placeholder="e.g., Mt. Olivet Methodist Church, Esuekyir"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Denomination</label>
        <input
          type="text"
          value={denomination}
          onChange={(e) => setDenomination(e.target.value)}
          placeholder="e.g., Methodist, Presbyterian, etc."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isFavorite"
          checked={isFavorite}
          onChange={(e) => setIsFavorite(e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="isFavorite" className="text-sm text-gray-700 cursor-pointer">
          Mark as favorite/preferred preacher
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes/Remarks</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Special arrangements or notes"
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
          {initial ? "Update" : "Add"} Preacher
        </button>
      </div>
    </form>
  );
};