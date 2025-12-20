// pages/MemberProfile.tsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { useMembers, formatProperCase } from "../context/MembersContext";
import { formatDateDDMMYYYY } from "../utils/date";
import PrimaryButton from "../components/PrimaryButton";
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

// Reusable Profile Row Component
const ProfileRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between py-3 border-b border-gray-100 last:border-b-0">
    <span className="text-gray-600 font-medium">{label}</span>
    <span className="text-gray-800 font-semibold">{value}</span>
  </div>
);

const MemberProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { getMember, updateMember, sentMessages } = useMembers();

  const member = getMember(id || "");

  if (!member) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-gray-800">Member not found</h2>
        <p className="text-gray-500 mt-2">This member does not exist or has been removed.</p>
        <div className="mt-4">
          <PrimaryButton onClick={() => navigate("/members")} variant="secondary">
            Back to Members
          </PrimaryButton>
        </div>
      </div>
    );
  }

  const history = sentMessages.filter((s) => s.memberId === member.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const openEdit = () => {
    navigate(`/members/${member.id}/edit`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">

      {/* Header Card */}
      <div className="bg-blue-800 text-white rounded-2xl p-6 shadow-lg mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{member.fullName}</h1>
            <p className="text-blue-100 mt-1">
              {member.organizations?.join(', ') || "No Organization"}
            </p>
            <p className="text-blue-200 text-sm mt-1">
              Member ID: {formatMemberID(member.memberCode || member.id)}
            </p>
          </div>

          {/* Avatar */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ${
            member.gender === 'Male'
              ? 'bg-blue-600 text-white'
              : 'bg-pink-600 text-white'
          } shadow-lg`}>
            {member.fullName?.charAt(0).toUpperCase()}
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
            member.opt_in ? "bg-green-500" : "bg-red-500"
          }`}>
            {member.opt_in ? "Active Member" : "Inactive Member"}
          </span>
          <span className="text-blue-200 text-sm">
            Gender: {member.gender || "Not specified"}
          </span>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Personal Information */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-4 border-b border-blue-100 pb-2">
            Personal Information
          </h2>

          <ProfileRow label="Full Name" value={member.fullName} />
          <ProfileRow label="Phone Number" value={member.phone || "Not provided"} />
          <ProfileRow label="Date of Birth" value={formatDateDDMMYYYY(member.birthday) || "Not provided"} />
          <ProfileRow label="Gender" value={member.gender || "Not specified"} />
        </div>

        {/* Church Details */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-4 border-b border-blue-100 pb-2">
            Church Details
          </h2>

          <ProfileRow label="Organization" value={member.organizations?.join(', ') || "Not assigned"} />
          <ProfileRow label="Membership Status" value={member.opt_in ? "Active" : "Inactive"} />
          <ProfileRow label="Member Since" value={member.createdAt ? new Date(member.createdAt).toLocaleDateString() : "Unknown"} />
          {member.notes && <ProfileRow label="Notes" value={member.notes} />}
        </div>

      </div>

      {/* Message History */}
      <div className="bg-white rounded-xl shadow-md p-6 mt-6">
        <h2 className="text-lg font-semibold text-blue-800 mb-4 border-b border-blue-100 pb-2">
          Message History
        </h2>

        {history.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            No messages sent to this member yet.
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((h) => (
              <div key={h.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm text-gray-500">
                    {new Date(h.timestamp).toLocaleString()}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    h.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                    h.status === 'Failed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {h.status || 'Sent'}
                  </span>
                </div>
                <div className="text-gray-800">{h.content}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mt-8">
        <PrimaryButton onClick={openEdit} variant="primary">
          Edit Member
        </PrimaryButton>

        <PrimaryButton
          onClick={() => navigate(`/broadcast?member=${member.id}`)}
          variant="success"
        >
          Send SMS
        </PrimaryButton>

        <PrimaryButton
          onClick={() => navigate("/members")}
          variant="secondary"
        >
          Back to Members
        </PrimaryButton>
      </div>

    </div>
  );
};

export default MemberProfile;
