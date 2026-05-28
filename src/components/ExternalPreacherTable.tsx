import React, { useState, useMemo } from "react";
import { ExternalPreacher } from "../types";
import { useExternalPreacher } from "../context/ExternalPreacherContext";
import { Pagination } from "./Pagination";
import { ConfirmationModal } from "./ConfirmationModal";

interface ExternalPreacherTableProps {
  onEdit: (preacher: ExternalPreacher) => void;
}

export const ExternalPreacherTable: React.FC<ExternalPreacherTableProps> = ({ onEdit }) => {
  const { externalPreachers, deletePreacher, searchPreachers, getFavoritePreachers } = useExternalPreacher();
  const [searchQuery, setSearchQuery] = useState("");
  const [favoriteFilter, setFavoriteFilter] = useState<"all" | "favorites">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredPreachers = React.useMemo(() => {
    let result = externalPreachers;
    if (searchQuery) {
      result = searchPreachers(searchQuery);
    }
    if (favoriteFilter === "favorites") {
      result = getFavoritePreachers();
    }
    return result.sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [externalPreachers, searchQuery, favoriteFilter, searchPreachers, getFavoritePreachers]);

  const totalPages = Math.ceil(filteredPreachers.length / itemsPerPage);
  const paginatedPreachers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPreachers.slice(start, start + itemsPerPage);
  }, [filteredPreachers, currentPage, itemsPerPage]);

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmId) {
      await deletePreacher(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search preachers by name, phone, or society..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <select
            value={favoriteFilter}
            onChange={(e) => setFavoriteFilter(e.target.value as "all" | "favorites")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Preachers</option>
            <option value="favorites">Favorites Only</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse hidden md:table">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left p-3 text-sm font-medium text-gray-700">Name</th>
              <th className="text-left p-3 text-sm font-medium text-gray-700">Society</th>
              <th className="text-left p-3 text-sm font-medium text-gray-700">Phone</th>
              <th className="text-left p-3 text-sm font-medium text-gray-700">Status</th>
              <th className="text-left p-3 text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPreachers.map((p) => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="p-3 text-sm font-medium">
                  <div className="flex items-center gap-2">
                    {p.isFavorite && <span className="text-yellow-500">⭐</span>}
                    {p.fullName}
                  </div>
                </td>
                <td className="p-3 text-sm">{p.society}</td>
                <td className="p-3 text-sm">{p.phone}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                    {p.status}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <button
                      onClick={() => onEdit(p)}
                      className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(p.id!)}
                      className="text-red-600 hover:text-red-800 text-sm px-2 py-1"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="md:hidden space-y-3">
          {paginatedPreachers.map((p) => (
            <div key={p.id} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {p.isFavorite && <span className="text-yellow-500">⭐</span>}
                    <p className="font-medium text-slate-900 dark:text-white">{p.fullName}</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{p.society}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{p.phone}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => onEdit(p)}
                    className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(p.id!)}
                    className="text-red-600 hover:text-red-800 text-sm px-2 py-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                  {p.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {deleteConfirmId && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setDeleteConfirmId(null)}
          onConfirm={handleDeleteConfirm}
          title="Delete External Preacher"
          message="This action will permanently remove this external preacher from the system. This cannot be undone. Are you sure you want to proceed?"
          confirmButtonText="Delete Preacher"
          cancelButtonText="Cancel"
          dangerLevel="danger"
        />
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredPreachers.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(newItemsPerPage) => {
          setItemsPerPage(newItemsPerPage);
          setCurrentPage(1);
        }}
      />
    </div>
  );
};