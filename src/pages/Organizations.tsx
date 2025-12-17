// src/pages/Organizations.tsx
import React, { useState } from "react";
import { useMembers } from "../context/MembersContext";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

export default function OrganizationsPage() {
  const { organizations, addOrganization, deleteOrganization } = useMembers();
  const { addToast } = useToast();
  const { isAdmin } = useAuth();

  const [newOrg, setNewOrg] = useState("");

  const handleAdd = async () => {
    if (!newOrg.trim()) return addToast("Organization name required", "error");
    await addOrganization(newOrg.trim());
    addToast("Organization added", "success");
    setNewOrg("");
  };

  const handleDelete = async (name: string) => {
    await deleteOrganization(name);
    addToast("Organization deleted", "success");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organizations</h1>
          <p className="text-sm text-slate-500">Manage organization list</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded shadow-sm">
        {isAdmin && (
          <div className="flex gap-2 mb-3">
            <input
              className="flex-1 border rounded px-3 py-2"
              placeholder="New organization name"
              value={newOrg}
              onChange={(e) => setNewOrg(e.target.value)}
            />
            <button className="px-3 py-2 bg-methodist-blue text-methodist-white rounded hover:bg-opacity-90" onClick={handleAdd}>
              Add
            </button>
          </div>
        )}

        <ul className="space-y-2">
          {organizations.length === 0 && <li className="text-sm text-slate-500">No organizations yet</li>}
          {organizations.map((org) => (
            <li key={org} className="flex justify-between items-center border-b py-2">
              <span>{org}</span>
              {isAdmin && (
                <button className="text-red-600" onClick={() => handleDelete(org)}>Delete</button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
