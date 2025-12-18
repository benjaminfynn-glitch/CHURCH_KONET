// pages/Members.tsx
import React, { useMemo, useState } from "react";
import { useMembers } from "../context/MembersContext";
import MembersTable from "../components/MembersTable";
import MemberFormModal from "../components/MemberFormModal";
import DeleteReasonModal from "../components/DeleteReasonModal";
import PrimaryButton from "../components/PrimaryButton";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { Member } from "../types";
import * as XLSX from 'xlsx';

export default function MembersPage() {
  const { members, organizations, addMember, updateMember, deleteMember, importMembersFromCSV, importMembersFromExcel, requestMemberDelete } = useMembers();
  const { addToast } = useToast();
  const { isAdmin } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Member> | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [previewMembers, setPreviewMembers] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

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
    
    // If admin, delete immediately
    if (isAdmin) {
      try {
        await deleteMember(m.id);
        addToast("Member deleted", "success");
      } catch (e) {
        console.error(e);
        addToast("Delete failed", "error");
      }
    } else {
      // If user, show delete reason modal
      setMemberToDelete(m);
      setDeleteModalOpen(true);
    }
  };

  const handleDeleteSubmit = async (reason: 'Not a Member' | 'Transferred' | 'Ceased to Fellowship' | 'Deceased') => {
    if (!memberToDelete || !memberToDelete.id) return;
    
    try {
      await requestMemberDelete(memberToDelete.id, reason);
      addToast("Delete request submitted", "success");
      setDeleteModalOpen(false);
      setMemberToDelete(null);
    } catch (e) {
      console.error(e);
      addToast("Failed to submit delete request", "error");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);

      if (!workbook.SheetNames.includes("Data")) {
        addToast("Invalid template. 'Data' sheet missing.", "error");
        return;
      }

      const rows = XLSX.utils.sheet_to_json(workbook.Sheets["Data"]);

      // Validate required columns
      if (rows.length === 0) {
        addToast("Excel file is empty.", "error");
        return;
      }

      const firstRow = rows[0] as any;
      const requiredColumns = ["Full Name", "Gender", "Date of Birth (DD/MM/YYYY)", "Organization"];
      const missingColumns = requiredColumns.filter(col => !(col in firstRow));

      if (missingColumns.length > 0) {
        addToast(`Missing columns: ${missingColumns.join(", ")}`, "error");
        return;
      }

      // Check for duplicates
      const seen = new Set<string>();
      const duplicates: number[] = [];

      rows.forEach((row: any, index: number) => {
        const key = `${row["Full Name"]?.trim()}-${row["Date of Birth (DD/MM/YYYY)"]?.trim()}`;
        if (seen.has(key)) {
          duplicates.push(index + 1); // +1 for 1-based row numbers
        }
        seen.add(key);
      });

      if (duplicates.length > 0) {
        addToast(`Duplicate members found on rows: ${duplicates.join(", ")}`, "error");
        return;
      }

      setPreviewMembers(rows);
      setShowPreview(true);
      setImportOpen(false);
    } catch (error) {
      console.error("Import error:", error);
      addToast("Failed to read Excel file.", "error");
    }
  };

  const saveImportedMembers = async () => {
    try {
      // Parse dates and format members
      const formattedMembers = previewMembers.map((row: any) => {
        const dobString = row["Date of Birth (DD/MM/YYYY)"];
        let birthday = "";
        if (dobString) {
          try {
            const [day, month, year] = dobString.split("/");
            const date = new Date(Number(year), Number(month) - 1, Number(day));
            birthday = date.toISOString().split('T')[0]; // YYYY-MM-DD format
          } catch (e) {
            console.warn("Invalid date format:", dobString);
          }
        }

        return {
          fullName: row["Full Name"]?.trim() || "",
          gender: row["Gender"]?.trim() || "",
          phone: "", // Will be set later or left empty
          birthday,
          organization: row["Organization"]?.trim() || "",
          opt_in: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      });

      // Use batch import
      const res = await importMembersFromExcel(formattedMembers);
      addToast(`Imported ${res.added} members, ${res.failed} failed`, "success");
      setShowPreview(false);
      setPreviewMembers([]);
    } catch (error) {
      console.error("Save error:", error);
      addToast("Failed to save members.", "error");
    }
  };

  const downloadTemplate = () => {
    // Create sample data
    const sampleData = [
      {
        "Full Name": "John Doe",
        "Gender": "Male",
        "Date of Birth (DD/MM/YYYY)": "15/03/1985",
        "Organization": "Youth Ministry"
      },
      {
        "Full Name": "Mary Smith",
        "Gender": "Female",
        "Date of Birth (DD/MM/YYYY)": "22/07/1990",
        "Organization": "Choir"
      },
      {
        "Full Name": "Peter Johnson",
        "Gender": "Male",
        "Date of Birth (DD/MM/YYYY)": "10/12/1982",
        "Organization": "Elders Council"
      }
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleData);

    // Set column widths
    const colWidths = [
      { wch: 20 }, // Full Name
      { wch: 10 }, // Gender
      { wch: 25 }, // Date of Birth
      { wch: 20 }  // Organization
    ];
    ws['!cols'] = colWidths;

    // Add to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Data");

    // Generate and download file
    XLSX.writeFile(wb, "member-import-template.xlsx");
    addToast("Template downloaded successfully", "success");
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
           {isAdmin && (
             <>
               <button
                 onClick={downloadTemplate}
                 className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-medium shadow"
               >
                 Download Template
               </button>
               <label className="inline-flex items-center bg-blue-700 hover:bg-blue-800 text-white font-semibold px-5 py-2.5 rounded-lg cursor-pointer shadow">
                 Import Member
                 <input
                   type="file"
                   accept=".xlsx,.xls"
                   className="hidden"
                   onChange={handleImport}
                 />
               </label>
             </>
           )}
           <PrimaryButton onClick={openAdd} variant="primary" size="md">
             + Add Member
           </PrimaryButton>
         </div>
      </div>

      <MembersTable members={visible} onEdit={openEdit} onDelete={onDelete} />

      <MemberFormModal
        open={modalOpen}
        initial={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => addToast("Member saved", "success")}
      />

      {showPreview && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-blue-800 mb-4">Preview Imported Members</h2>

            <div className="overflow-x-auto">
              <table className="w-full border border-gray-300">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="p-3 border border-gray-300 text-left">Full Name</th>
                    <th className="p-3 border border-gray-300 text-left">Gender</th>
                    <th className="p-3 border border-gray-300 text-left">Date of Birth</th>
                    <th className="p-3 border border-gray-300 text-left">Organization</th>
                  </tr>
                </thead>
                <tbody>
                  {previewMembers.map((member: any, index: number) => (
                    <tr key={index} className="border border-gray-300">
                      <td className="p-3 border border-gray-300">{member["Full Name"]}</td>
                      <td className="p-3 border border-gray-300">{member["Gender"]}</td>
                      <td className="p-3 border border-gray-300">{member["Date of Birth (DD/MM/YYYY)"]}</td>
                      <td className="p-3 border border-gray-300">{member["Organization"]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPreview(false);
                  setPreviewMembers([]);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={saveImportedMembers}
                className="px-6 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800"
              >
                Confirm & Save Members
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteReasonModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setMemberToDelete(null);
        }}
        onSubmit={handleDeleteSubmit}
        memberName={memberToDelete?.fullName}
      />
    </div>
  );
}
