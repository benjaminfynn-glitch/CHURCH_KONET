// components/MembersTable.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Member } from "../types";
import { formatDateDDMMYYYY } from "../utils/date";

type Props = {
  members: Member[];
  onEdit: (m: Member) => void;
  onDelete: (m: Member) => void;
};

const MembersTable: React.FC<Props> = ({ members, onEdit, onDelete }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-medium border-b">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Phone</th>
              <th className="px-6 py-3">Birthday</th>
              <th className="px-6 py-3">Organization</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                <td className="px-6 py-4">
                  <div
                    className="font-medium text-blue-700 dark:text-blue-400 cursor-pointer hover:underline"
                    onClick={() => navigate(`/members/${m.id}`)}
                  >
                    {m.fullName}
                  </div>
                  <div className="text-xs text-slate-400">{m.memberCode || ""}</div>
                </td>
                <td className="px-6 py-4 font-mono">{m.phone}</td>
                <td className="px-6 py-4">{formatDateDDMMYYYY(m.birthday)}</td>
                <td className="px-6 py-4">{(m.organizations || []).join(', ') || "-"}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => onEdit(m)} title="Edit" className="text-slate-500 hover:text-indigo-600">
                      Edit
                    </button>
                    <button onClick={() => onDelete(m)} title="Delete" className="text-red-500 hover:text-red-600">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {members.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                  No members found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MembersTable;
