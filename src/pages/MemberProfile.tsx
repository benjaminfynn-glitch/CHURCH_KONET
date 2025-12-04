// pages/MemberProfile.tsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { useMembers, formatProperCase } from "../context/MembersContext";
import { Member } from "../types";

const formatMemberID = (raw?: string) => {
  if (!raw) return "N/A";
  // if raw already like ANC-BMCE-0001 return as-is
  if (/^ANC-BMCE-\d+$/.test(raw)) return raw;
  // fallback: take digits from id and pad
  const digits = (raw.match(/\d+/g) || []).join("");
  const padded = digits ? digits.padStart(4, "0") : "0000";
  return `ANC-BMCE-${padded}`;
};

const formatDateDDMMYYYY = (dateStr?: string) => {
  if (!dateStr) return "N/A";
  if (dateStr.includes("-")) {
    const parts = dateStr.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d.toLocaleDateString("en-GB");
  return dateStr;
};

const MemberProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { getMember, updateMember, sentMessages, organizations } = useMembers();

  const member = getMember(id || "");

  const [isEditOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<Partial<Member>>({});

  if (!member) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold">Member not found</h2>
        <p className="text-slate-500 mt-2">This member does not exist or has been removed.</p>
        <div className="mt-4">
          <button onClick={() => navigate("/members")} className="text-indigo-600">Back to Members</button>
        </div>
      </div>
    );
  }

  const history = sentMessages.filter((s) => s.memberId === member.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const openEdit = () => {
    setForm({ ...member });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!member || !member.id) return;
    // minimal validation
    if (form.fullName && form.phone) {
      try {
        await updateMember(member.id, {
          fullName: formatProperCase(form.fullName),
          phone: form.phone,
          birthday: form.birthday,
          organization: form.organization ? formatProperCase(form.organization) : undefined,
          notes: form.notes,
          gender: form.gender,
        });
        setEditOpen(false);
        addToast("Member updated", "success");
      } catch (e) {
        console.error(e);
        addToast("Update failed", "error");
      }
    } else {
      addToast("Name and phone required", "error");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <header className="flex items-center justify-between border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold">{member.fullName}</h1>
          <p className="text-sm text-indigo-600">{formatMemberID(member.memberCode || member.id)}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate("/members")} className="px-3 py-2 bg-gray-100 rounded">Back</button>
          <button onClick={openEdit} className="px-3 py-2 bg-sky-600 text-white rounded">Edit</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section>
          <h2 className="font-bold mb-3">Personal Info</h2>
          <div className="space-y-4">
            <div>
              <div className="text-xs text-slate-500">Phone</div>
              <div className="font-mono font-semibold">{member.phone}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Birthday</div>
              <div>{formatDateDDMMYYYY(member.birthday)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Organization</div>
              <div>{member.organization || "-"}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Notes</div>
              <div>{member.notes || <span className="text-slate-400 italic">No notes</span>}</div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-bold mb-3">Message History</h2>
          {history.length === 0 ? (
            <div className="text-slate-400">No messages sent to this member yet.</div>
          ) : (
            <ul className="space-y-3">
              {history.map((h) => (
                <li key={h.id} className="p-3 border rounded">
                  <div className="text-xs text-slate-500">{new Date(h.timestamp).toLocaleString()}</div>
                  <div className="mt-1">{h.content}</div>
                  <div className="mt-2 text-xs text-slate-500">{h.status}</div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Edit Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-2xl shadow-lg">
            <div className="p-4 border-b">
              <h3 className="font-bold">Edit Member</h3>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-sm block">Full Name</label>
                <input value={form.fullName || ""} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="text-sm block">Phone</label>
                <input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border rounded" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-sm block">Birthday</label>
                  <input type="date" value={form.birthday || ""} onChange={(e) => setForm({ ...form, birthday: e.target.value })} className="w-full px-3 py-2 border rounded" />
                </div>
                <div className="flex-1">
                  <label className="text-sm block">Organization</label>
                  <input value={form.organization || ""} onChange={(e) => setForm({ ...form, organization: e.target.value })} className="w-full px-3 py-2 border rounded" />
                </div>
              </div>
              <div>
                <label className="text-sm block">Notes</label>
                <textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border rounded" />
              </div>
            </div>

            <div className="p-4 border-t flex justify-end gap-2">
              <button onClick={() => setEditOpen(false)} className="px-3 py-2 bg-gray-100 rounded">Cancel</button>
              <button onClick={saveEdit} className="px-3 py-2 bg-sky-600 text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberProfile;
