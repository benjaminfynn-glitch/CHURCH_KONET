import React, { useState } from "react";
import { ExternalPreacher } from "../types";
import { useExternalPreacher } from "../context/ExternalPreacherContext";

interface ExternalPreacherTableProps {
  onEdit: (preacher: ExternalPreacher) => void;
}

export const ExternalPreacherTable: React.FC<ExternalPreacherTableProps> = ({ onEdit }) => {
  const { externalPreachers, deletePreacher, searchPreachers, getFavoritePreachers } = useExternalPreacher();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [favoriteFilter, setFavoriteFilter] = useState<"all" | "favorites">("all");

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

  const handleDelete = async (id: string) => {
    await deletePreacher(id);
    setDeleteConfirm(null);
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
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left p-3 text-sm font-medium text-gray-700">Name</th>
              <th className="text-left p-3 text-sm font-medium text-gray-700">Society</th>
              <th className="text-left p-3 text-sm font-medium text-gray-700">Phone</th>
              <th className="text-left p-3 text-sm font-medium text-gray-700">Denomination</th>
              <th className="text-left p-3 text-sm font-medium text-gray-700">Status</th>
              <th className="text-left p-3 text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPreachers.map((p) => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="p-3 text-sm font-medium">
                  <div className="flex items-center gap-2">
                    {p.isFavorite && <span className="text-yellow-500">⭐</span>}
                    {p.fullName}
                  </div>
                </td>
                <td className="p-3 text-sm">{p.society}</td>
                <td className="p-3 text-sm">{p.phone}</td>
                <td className="p-3 text-sm">{p.denomination || "-"}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                    {p.status}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(p)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(p.id!)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-4">Are you sure you want to delete this external preacher?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};