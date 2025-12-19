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

  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [organizationFilter, setOrganizationFilter] = useState('');
  const [dobDayFilter, setDobDayFilter] = useState('');
  const [dobMonthFilter, setDobMonthFilter] = useState('');
  const [dobYearFilter, setDobYearFilter] = useState('');

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

  const activeMembers = useMemo(() => members.filter(m => m.isActive && m.opt_in).length, [members]);

  const visible = useMemo(() => {
    let filtered = members.slice();

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        (m.fullName || "").toLowerCase().includes(query) ||
        (m.phone || "").includes(query)
      );
    }

    // Gender filter
    if (genderFilter) {
      filtered = filtered.filter(m => m.gender === genderFilter);
    }

    // Organization filter
    if (organizationFilter) {
      filtered = filtered.filter(m => m.organization === organizationFilter);
    }

    // DOB filters
    if (dobDayFilter || dobMonthFilter || dobYearFilter) {
      filtered = filtered.filter(m => {
        if (!m.birthday) return false;
        const date = new Date(m.birthday);
        if (dobDayFilter && date.getDay() !== parseInt(dobDayFilter)) return false;
        if (dobMonthFilter && (date.getMonth() + 1) !== parseInt(dobMonthFilter)) return false;
        if (dobYearFilter && date.getFullYear() !== parseInt(dobYearFilter)) return false;
        return true;
      });
    }

    return filtered.sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));
  }, [members, searchQuery, genderFilter, organizationFilter, dobDayFilter, dobMonthFilter, dobYearFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header Card */}
      <div className="bg-blue-800 text-white rounded-2xl p-6 shadow-lg mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Church Members</h1>
            <p className="text-blue-100 mt-1">Manage your congregation contacts and information</p>
            <p className="text-blue-200 text-sm mt-2">
              Total Members: {members.length} • Active: {activeMembers}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {isAdmin && (
              <>
                <PrimaryButton
                  onClick={downloadTemplate}
                  variant="success"
                  className="bg-green-600 hover:bg-green-700"
                >
                  Download Template
                </PrimaryButton>
                <label className="inline-flex items-center bg-blue-700 hover:bg-blue-800 text-white font-semibold px-5 py-2.5 rounded-lg cursor-pointer shadow-md transition">
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
            <PrimaryButton onClick={openAdd} variant="primary">
              + Add Member
            </PrimaryButton>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Gender Filter */}
          <div className="min-w-[120px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          {/* Organization Filter */}
          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Organization</label>
            <select
              value={organizationFilter}
              onChange={(e) => setOrganizationFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              {organizations.map(org => (
                <option key={org} value={org}>{org}</option>
              ))}
            </select>
          </div>
        </div>

        {/* DOB Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mt-4">
          <div className="min-w-[120px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Birthday Day</label>
            <select
              value={dobDayFilter}
              onChange={(e) => setDobDayFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="0">Sunday</option>
              <option value="1">Monday</option>
              <option value="2">Tuesday</option>
              <option value="3">Wednesday</option>
              <option value="4">Thursday</option>
              <option value="5">Friday</option>
              <option value="6">Saturday</option>
            </select>
          </div>

          <div className="min-w-[120px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Birthday Month</label>
            <select
              value={dobMonthFilter}
              onChange={(e) => setDobMonthFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              {Array.from({length: 12}, (_, i) => (
                <option key={i+1} value={i+1}>
                  {new Date(0, i).toLocaleString('en', {month: 'long'})}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[120px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Birthday Year</label>
            <select
              value={dobYearFilter}
              onChange={(e) => setDobYearFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              {Array.from({length: 100}, (_, i) => {
                const year = new Date().getFullYear() - i;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Members Table Card */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <MembersTable members={visible} onEdit={openEdit} onDelete={onDelete} />
      </div>

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
