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
  const { members, organizations, addMember, updateMember, deleteMember, importMembersFromCSV, importMembersFromExcel, requestMemberDelete, operationLoading } = useMembers();
  const { addToast } = useToast();
  const { isAdmin } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Member> | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [previewMembers, setPreviewMembers] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusErrors, setStatusErrors] = useState<string[]>([]);

  // Pagination
  const ITEMS_PER_PAGE = 30;
  const [currentPage, setCurrentPage] = useState(1);

  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [organizationFilter, setOrganizationFilter] = useState('');
  const [dobDayFilter, setDobDayFilter] = useState('');
  const [dobMonthFilter, setDobMonthFilter] = useState('');
  const [dobYearFilter, setDobYearFilter] = useState('');

  // Utility functions for Excel import
  const excelDateToJSDate = (serial: number): Date => {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30)); // Excel epoch: 1899-12-30
    return new Date(excelEpoch.getTime() + serial * 86400000); // 86400000 = 24 * 60 * 60 * 1000 (ms per day)
  };

  const formatDateDDMMYYYY = (date: Date): string => {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const normalizeDateOfBirth = (value: any): string => {
    // Excel numeric date serial number
    if (typeof value === 'number' && !isNaN(value) && value > 0) {
      const date = excelDateToJSDate(value);
      return formatDateDDMMYYYY(date);
    }

    // Already a string (manual entry)
    if (typeof value === 'string') {
      return value.trim();
    }

    // Empty or invalid
    return '';
  };

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

    // Clear previous status
    setStatusMessage(null);
    setStatusErrors([]);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);

      if (!workbook.SheetNames.includes("Data")) {
        addToast("Invalid template. 'Data' sheet missing.", "error");
        return;
      }

      const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets["Data"]);

      // Validate required columns
      if (rawRows.length === 0) {
        addToast("Excel file is empty.", "error");
        return;
      }

      const firstRow = rawRows[0] as any;
      const requiredColumns = ["Full Name", "Gender", "Date of Birth (DD/MM/YYYY)", "Organizations"];
      const missingColumns = requiredColumns.filter(col => !(col in firstRow));

      if (missingColumns.length > 0) {
        addToast(`Missing columns: ${missingColumns.join(", ")}`, "error");
        return;
      }

      // 🔹 STEP 1: Normalize dates IMMEDIATELY after parsing
      const normalizedRows = rawRows.map((row: any, index: number) => {
        const normalizedDate = normalizeDateOfBirth(row["Date of Birth (DD/MM/YYYY)"]);

        // Debug logging to verify conversion
        console.log(
          `Row ${index + 2} DOB:`,
          row["Date of Birth (DD/MM/YYYY)"],
          '→',
          normalizedDate
        );

        return {
          ...row,
          "Date of Birth (DD/MM/YYYY)": normalizedDate, // Replace with normalized date
          _originalDate: row["Date of Birth (DD/MM/YYYY)"], // Keep original for debugging
        };
      });

      // Check for duplicates using normalized data
      const seen = new Set<string>();
      const duplicates: number[] = [];

      normalizedRows.forEach((row: any, index: number) => {
        const fullName = String(row["Full Name"] || "").trim();
        const dob = String(row["Date of Birth (DD/MM/YYYY)"] || "").trim();
        const key = `${fullName}-${dob}`;
        if (key !== "-" && seen.has(key)) { // Only check duplicates if we have meaningful data
          duplicates.push(index + 1); // +1 for 1-based row numbers
        }
        seen.add(key);
      });

      if (duplicates.length > 0) {
        addToast(`Duplicate members found on rows: ${duplicates.join(", ")}`, "error");
        return;
      }

      setPreviewMembers(normalizedRows);
      setShowPreview(true);
      setImportOpen(false);
    } catch (error) {
      console.error("Import error:", error);
      addToast("Failed to read Excel file.", "error");
    }
  };

  const saveImportedMembers = async () => {
    try {
      // Validate data before import - collect errors per row
      const validationErrors: string[] = [];

      previewMembers.forEach((row: any, index: number) => {
        const rowNum = index + 2; // +2 because Excel is 1-based and we skip header

        // Check required fields
        if (!String(row["Full Name"] || "").trim()) {
          validationErrors.push(`Row ${rowNum} — Full Name is required`);
        }
        if (!String(row["Gender"] || "").trim()) {
          validationErrors.push(`Row ${rowNum} — Gender is required`);
        }
        if (!String(row["Phone Number"] || "").trim()) {
          validationErrors.push(`Row ${rowNum} — Phone Number is required`);
        }
        if (!String(row["Organizations"] || "").trim()) {
          validationErrors.push(`Row ${rowNum} — Organizations is required`);
        }

        // Validate date format if provided - strict DD/MM/YYYY validation
        const dob = String(row["Date of Birth (DD/MM/YYYY)"] || "").trim();
        if (dob) {
          const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
          if (!dateRegex.test(dob)) {
            validationErrors.push(`Row ${rowNum} — Date of Birth must be in DD/MM/YYYY format (got: ${dob})`);
          } else {
            const [day, month, year] = dob.split("/").map(Number);
            const date = new Date(year, month - 1, day);
            if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
              validationErrors.push(`Row ${rowNum} — Invalid date: ${dob}`);
            }
          }
        }
      });

      if (validationErrors.length > 0) {
        setStatusMessage("Import Status");
        setStatusErrors(validationErrors);
        return;
      }

      // Format members for import
      const formattedMembers = previewMembers.map((row: any, index: number) => {
        const dobString = row["Date of Birth (DD/MM/YYYY)"]; // Already normalized
        let birthday = null;
        if (dobString && dobString.trim()) {
          try {
            const [day, month, year] = dobString.split("/");
            const date = new Date(Number(year), Number(month) - 1, Number(day));
            if (!isNaN(date.getTime()) && date.getFullYear() === Number(year)) {
              birthday = date.toISOString().split('T')[0]; // YYYY-MM-DD format
              console.log(`Member ${index + 1} birthday: ${dobString} → ${birthday}`);
            } else {
              console.warn(`Invalid date for member ${index + 1}: ${dobString}`);
            }
          } catch (e) {
            console.warn(`Error parsing date for member ${index + 1}: ${dobString}`, e);
          }
        } else {
          console.log(`Member ${index + 1} has no birthday`);
        }

        return {
          fullName: String(row["Full Name"] || "").trim() || "",
          gender: String(row["Gender"] || "").trim() || "",
          phone: String(row["Phone Number"] || "").trim() || "",
          birthday,
          organizations: String(row["Organizations"] || "").trim() ? [String(row["Organizations"]).trim()] : [],
          notes: String(row["Notes"] || "").trim() || null,
          opt_in: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      });

      // Use batch import
      const res = await importMembersFromExcel(formattedMembers);

      if (res.failed > 0 || (res.duplicates && res.duplicates.length > 0)) {
        setStatusMessage("Import Status");
        const errors = [];
        if (res.duplicates && res.duplicates.length > 0) {
          errors.push(...res.duplicates);
        }
        if (res.failed > res.duplicates?.length || 0) {
          errors.push(`Imported ${res.added} members, ${res.failed - (res.duplicates?.length || 0)} failed validation`);
        }
        setStatusErrors(errors);
      } else {
        setStatusMessage(`Successfully imported ${res.added} members`);
        setStatusErrors([]);
      }

      setShowPreview(false);
      setPreviewMembers([]);
    } catch (error: any) {
      console.error("Save error:", error);
      const errorMessage = error.message || "Failed to save members";
      addToast(errorMessage, "error", {
        title: "Import Failed",
        description: "Please check your data and try again.",
        persistent: true,
      });
    }
  };

  const downloadTemplate = () => {
    // Create workbook
    const wb = XLSX.utils.book_new();

    // Instructions sheet
    const instructionsData = [
      ["Church Konet Members Import Template"],
      [""],
      ["Instructions:"],
      ["1. This template is for importing church members into the system."],
      ["2. Fill in the 'Data' sheet with member information."],
      ["3. Do not modify the column headers in the Data sheet."],
      ["4. Use the format DD/MM/YYYY for dates (e.g., 15/03/1985)."],
      ["5. Organizations should match existing ones or be new."],
      ["6. Phone Number is optional but recommended."],
      ["7. Save the file as .xlsx before importing."],
      ["8. Import the filled template via the 'Import Member' button."]
    ];
    const instructionsWS = XLSX.utils.aoa_to_sheet(instructionsData);
    instructionsWS['!cols'] = [{ wch: 50 }];

    // Data sheet with headers only
    const dataHeaders = [
      ["Full Name", "Gender", "Date of Birth (DD/MM/YYYY)", "Phone Number", "Organizations"]
    ];
    const dataWS = XLSX.utils.aoa_to_sheet(dataHeaders);
    dataWS['!cols'] = [
      { wch: 20 }, // Full Name
      { wch: 10 }, // Gender
      { wch: 25 }, // Date of Birth
      { wch: 15 }, // Phone Number
      { wch: 20 }  // Organizations
    ];

    // Add sheets to workbook
    XLSX.utils.book_append_sheet(wb, instructionsWS, "Instructions");
    XLSX.utils.book_append_sheet(wb, dataWS, "Data");

    // Set properties to ensure editable
    wb.Props = {
      Title: "Church Konet Members Template",
      Author: "Church Konet",
    } as any;

    // Set active sheet to Data
    wb.Workbook = { Views: [{ activeTab: 1 }] } as any;

    // Generate and download file
    XLSX.writeFile(wb, "Church_Konet_Members_Template.xlsx");
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
      filtered = filtered.filter(m => m.organizations?.includes(organizationFilter));
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

  const totalPages = Math.ceil(visible.length / ITEMS_PER_PAGE);
  const paginatedMembers = visible.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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

      {/* Status Message */}
      {statusMessage && (
        <div className="bg-blue-600 text-white px-4 py-3 rounded-lg shadow-md max-w-md">
          <p className="font-medium">{statusMessage}</p>
          {statusErrors.length > 0 && (
            <ul className="list-disc list-inside text-sm space-y-1 mt-2">
              {statusErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}

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
        <MembersTable members={paginatedMembers} onEdit={openEdit} onDelete={onDelete} />
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-6">
        <span className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </span>

        <div className="flex gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            className="px-3 py-1 rounded border disabled:opacity-50"
          >
            Previous
          </button>

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
            className="px-3 py-1 rounded border disabled:opacity-50"
          >
            Next
          </button>
        </div>
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
                    <th className="p-3 border border-gray-300 text-left">Phone Number</th>
                    <th className="p-3 border border-gray-300 text-left">Organizations</th>
                  </tr>
                </thead>
                <tbody>
                  {previewMembers.map((member: any, index: number) => (
                    <tr key={index} className="border border-gray-300">
                      <td className="p-3 border border-gray-300">{String(member["Full Name"] || "").trim()}</td>
                      <td className="p-3 border border-gray-300">{String(member["Gender"] || "").trim()}</td>
                      <td className="p-3 border border-gray-300">{member["Date of Birth (DD/MM/YYYY)"]}</td>
                      <td className="p-3 border border-gray-300">{String(member["Phone Number"] || "").trim()}</td>
                      <td className="p-3 border border-gray-300">{String(member["Organizations"] || "").trim()}</td>
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
                disabled={operationLoading.importMembers}
                className="px-6 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {operationLoading.importMembers ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Importing...
                  </>
                ) : (
                  'Confirm & Save Members'
                )}
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
