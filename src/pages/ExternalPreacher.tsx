import React, { useState } from "react";
import { ExternalPreacher } from "../types";
import { ExternalPreacherForm } from "../components/ExternalPreacherForm";
import { ExternalPreacherTable } from "../components/ExternalPreacherTable";
import { useExternalPreacher } from "../context/ExternalPreacherContext";
import { useToast } from "../context/ToastContext";
import PrimaryButton from "../components/PrimaryButton";

export default function ExternalPreacherPage() {
  const { addPreacher, updatePreacher, exportToCSV } = useExternalPreacher();
  const { addToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPreacher, setEditingPreacher] = useState<ExternalPreacher | null>(null);

  const handleSubmit = async (preacher: any) => {
    try {
      if (editingPreacher) {
        await updatePreacher(editingPreacher.id!, preacher);
        addToast("External preacher updated successfully", "success");
      } else {
        await addPreacher(preacher);
        addToast("External preacher added successfully", "success");
      }
      setModalOpen(false);
      setEditingPreacher(null);
    } catch (e) {
      addToast("Failed to save external preacher", "error");
    }
  };

  const handleEdit = (preacher: ExternalPreacher) => {
    setEditingPreacher(preacher);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingPreacher(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-800">External Preachers</h1>
          <p className="text-blue-600 mt-1">Manage guest preachers and visiting ministers</p>
        </div>

        <div className="flex gap-3">
          <PrimaryButton onClick={exportToCSV} variant="secondary">
            Export CSV
          </PrimaryButton>
          <PrimaryButton onClick={() => setModalOpen(true)}>
            + Add Preacher
          </PrimaryButton>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md">
        <ExternalPreacherTable onEdit={handleEdit} />
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingPreacher ? "Edit External Preacher" : "Add New External Preacher"}
              </h2>
              <ExternalPreacherForm
                initial={editingPreacher || undefined}
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