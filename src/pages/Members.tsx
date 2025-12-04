// pages/Members.tsx
import React, { useMemo, useState } from "react";
import { useMembers } from "../context/MembersContext";
import MembersTable from "../components/MembersTable";
import MemberFormModal from "../components/MemberFormModal";
import { useToast } from "../context/ToastContext";
import { Member } from "../types";

export default function MembersPage() {
  const { members, organizations, addMember, updateMember, deleteMember, importMembersFromCSV } = useMembers();
  const { addToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Member> | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [csvText, setCsvText] = useState("");

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (m: Member) => {
    setEditing(m);
    setModalOpen(true);
  };

  const onDelete = async (m: Member) => {
    if (!m.id) return addToast("Missing member id", "error");
    try {
      await deleteMember(m.id);
      addToast("Member deleted", "success");
    } catch (e) {
      console.error(e);
      addToast("Delete failed", "error");
    }
  };

  const handleImport = async () => {
    if (!csvText.trim()) return;
    try {
      const res = await importMembersFromCSV(csvText);
      addToast(`Imported ${res.added} members, ${res.failed} failed`, "success");
      setCsvText("");
      setImportOpen(false);
    } catch (e) {
      console.error(e);
      addToast("Import failed", "error");
    }
  };

  const visible = useMemo(() => members.slice().sort((a, b) => (a.fullName || "").localeCompare(b.fullName || "")), [members]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-sm text-slate-500">Manage congregation contacts</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setImportOpen(true)} className="px-3 py-2 rounded bg-white border">Import CSV</button>
          <button onClick={openAdd} className="px-3 py-2 rounded bg-sky-600 text-white">+ Add Member</button>
        </div>
      </div>

      <MembersTable members={visible} onEdit={openEdit} onDelete={onDelete} />

      <MemberFormModal
        open={modalOpen}
        initial={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => addToast("Member saved", "success")}
      />

      {importOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-lg w-full p-4">
            <h3 className="font-bold">Import CSV</h3>
            <p className="text-xs text-slate-500 mb-2">Format: Name, Phone, Birthday(YYYY-MM-DD), Organization</p>
            <textarea value={csvText} onChange={(e) => setCsvText(e.target.value)} rows={8} className="w-full rounded border p-2 font-mono" />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setImportOpen(false)} className="px-3 py-2 rounded bg-gray-100">Cancel</button>
              <button onClick={handleImport} className="px-3 py-2 rounded bg-indigo-600 text-white">Import</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
