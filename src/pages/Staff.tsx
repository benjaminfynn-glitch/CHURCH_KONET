import React, { useState } from "react";
import { StaffMember } from "../types";
import { StaffForm } from "../components/StaffForm";
import { StaffTable } from "../components/StaffTable";
import { useStaff } from "../context/StaffContext";
import { useToast } from "../context/ToastContext";
import PrimaryButton from "../components/PrimaryButton";

export default function StaffPage() {
  const { addStaff, updateStaff, exportToCSV } = useStaff();
  const { addToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  const handleSubmit = async (staff: Omit<StaffMember, "id" | "createdAt" | "updatedAt">) => {
    try {
      if (editingStaff) {
        await updateStaff(editingStaff.id!, staff);
        addToast("Staff member updated successfully", "success");
      } else {
        await addStaff(staff);
        addToast("Staff member added successfully", "success");
      }
      setModalOpen(false);
      setEditingStaff(null);
    } catch (error: any) {
      addToast(error.message || "Failed to save staff member", "error");
    }
  };

  const handleEdit = (staff: StaffMember) => {
    setEditingStaff(staff);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingStaff(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-800">Church Staff</h1>
          <p className="text-blue-600 mt-1">Manage preachers, liturgists, Bible readers, and MCs</p>
        </div>

        <div className="flex gap-3">
          <PrimaryButton onClick={exportToCSV} variant="secondary">
            Export CSV
          </PrimaryButton>
          <PrimaryButton onClick={() => setModalOpen(true)}>
            + Add Staff
          </PrimaryButton>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md">
        <StaffTable onEdit={handleEdit} />
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
              </h2>
              <StaffForm
                initial={editingStaff || undefined}
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