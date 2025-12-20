// components/MemberFormModal.tsx
import React, { useEffect, useState } from "react";
import { Member } from "../types";
import { useMembers } from "../context/MembersContext";
import { useToast } from "../context/ToastContext";
import { validatePhoneNumber } from "../services/smsUtils";

type Props = {
  open: boolean;
  initial?: Partial<Member> | null;
  onClose: () => void;
  onSaved?: () => void;
};

const MemberFormModal: React.FC<Props> = ({ open, initial = null, onClose, onSaved }) => {
  const { addMember, updateMember, organizations, operationLoading } = useMembers();
  const { addToast } = useToast();

  // Use fullName consistently
  const [form, setForm] = useState<Partial<Member>>({
    fullName: "",
    phone: "",
    birthday: "",
    gender: "",
    organizations: [],
    notes: "",
    opt_in: true,
  });

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        fullName: initial.fullName ?? "",
        phone: initial.phone ?? "",
        birthday: initial.birthday ?? "",
        gender: initial.gender ?? "",
        organizations: Array.isArray(initial.organizations)
          ? initial.organizations
          : ((initial as any).organization ? [(initial as any).organization] : []),
        notes: initial.notes ?? "",
        opt_in: typeof initial.opt_in === "boolean" ? initial.opt_in : true,
      });
    } else {
      setForm({
        fullName: "",
        phone: "",
        birthday: "",
        gender: "",
        organizations: [],
        notes: "",
        opt_in: true,
      });
    }
  }, [open, initial]);

  const handleSave = async () => {
    // basic validation
    if (!form.fullName?.trim()) {
      addToast("Full name is required", "error");
      return;
    }
    if (!form.phone?.trim()) {
      addToast("Phone number is required", "error");
      return;
    }
    if (!form.birthday) {
      addToast("Birthday is required", "error");
      return;
    }

    const phone = validatePhoneNumber(form.phone.trim());
    if (!phone) {
      addToast("Invalid phone number format. Please use format: 233xxxxxxxxx", "error");
      return;
    }

    try {
      if (initial && initial.id) {
        await updateMember(initial.id, { ...form, phone, fullName: form.fullName.trim() });
        addToast("Member updated successfully", "success");
      } else {
        await addMember({ ...form, phone, fullName: form.fullName.trim() });
        addToast("Member added successfully", "success");
      }
      onSaved && onSaved();
      onClose();
    } catch (e: any) {
      console.error("Save error", e);
      const errorMessage = e.message || "Failed to save member";
      addToast(errorMessage, "error", {
        title: "Save Failed",
        description: "Please check your data and try again.",
        persistent: true,
      });
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-2xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
          <h3 className="text-lg font-bold">{initial ? "Edit Member" : "Add Member"}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">Close</button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium">Full Name *</label>
            <input
              value={form.fullName || ""}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Phone *</label>
            <input
              value={form.phone || ""}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 border rounded font-mono"
              placeholder="233xxxxxxxxx"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Birthday *</label>
              <input
                type="date"
                value={form.birthday || ""}
                onChange={(e) => setForm({ ...form, birthday: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Gender</label>
              <select
                value={form.gender || ""}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Organizations</label>
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-3 bg-gray-50">
              {organizations.map((org) => (
                <label key={org} className="flex items-center space-x-2 cursor-pointer hover:bg-white p-1 rounded">
                  <input
                    type="checkbox"
                    checked={(form.organizations || []).includes(org)}
                    onChange={(e) => {
                      const currentOrgs = form.organizations || [];
                      if (e.target.checked) {
                        setForm({ ...form, organizations: [...currentOrgs, org] });
                      } else {
                        setForm({ ...form, organizations: currentOrgs.filter(o => o !== org) });
                      }
                    }}
                    className="rounded border-gray-300 text-methodist-blue focus:ring-methodist-blue"
                  />
                  <span className="text-sm">{org}</span>
                </label>
              ))}
              {organizations.length === 0 && (
                <p className="text-sm text-gray-500 italic">No organizations available</p>
              )}
            </div>
            {(form.organizations || []).length > 0 && (
              <p className="text-xs text-gray-600 mt-1">
                Selected: {(form.organizations || []).join(', ')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Notes</label>
            <textarea
              value={form.notes || ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              rows={3}
            />
          </div>
        </div>

        <div className="p-4 border-t dark:border-slate-700 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded">Cancel</button>
          <button
            onClick={handleSave}
            disabled={operationLoading.addMember || operationLoading.updateMember}
            className="px-4 py-2 bg-sky-600 text-white rounded disabled:bg-sky-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {(operationLoading.addMember || operationLoading.updateMember) ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Saving...
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemberFormModal;
