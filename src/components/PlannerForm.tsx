import React, { useState, useEffect } from "react";
import { ServicePlan, ServiceType, BibleReader, StaffMember, StaffClassification } from "../types";
import { useStaff } from "../context/StaffContext";
import { useExternalPreacher } from "../context/ExternalPreacherContext";

interface PlannerFormProps {
  initial?: Partial<ServicePlan>;
  onSubmit: (plan: Omit<ServicePlan, "id" | "createdAt" | "createdBy">) => void;
  onCancel: () => void;
}

const SERVICE_TYPES: { value: ServiceType; label: string; icon: string }[] = [
  { value: "FIRST_DIVINE_SERVICE", label: "First Divine Service (English)", icon: "📖" },
  { value: "SECOND_DIVINE_SERVICE", label: "Second Divine Service (Fante)", icon: "📖" },
  { value: "JOINT_DIVINE_SERVICE", label: "Joint Divine Service", icon: "📖" },
  { value: "WEDNESDAY_PRAYER_MEETING", label: "Wednesday Prayer Meeting", icon: "🙏" },
];

const BIBLE_READER_LABELS = ["First Bible Reader", "Second Bible Reader", "Third Bible Reader (Auto: Liturgist)"];

const getBibleReaderContact = (name: string, bibleReadersStaff: any[], liturgistName: string) => {
  if (!name) return "";
  const reader = bibleReadersStaff.find((s: any) => s.fullName === name);
  return reader?.phone || "";
};

export const PlannerForm: React.FC<PlannerFormProps> = ({ initial, onSubmit, onCancel }) => {
  const { staff, getStaffByRole, getActiveStaff, getStaffByClassification } = useStaff();
  const { externalPreachers } = useExternalPreacher();
  
  const [serviceType, setServiceType] = useState<ServiceType>(initial?.serviceType || "FIRST_DIVINE_SERVICE");
  const [serviceDate, setServiceDate] = useState(initial?.serviceDate || "");
  const [theme, setTheme] = useState(initial?.theme || "");
  const [preacherId, setPreacherId] = useState(initial?.preacherId || "");
  const [preacherClassification, setPreacherClassification] = useState<"Internal" | "External">("Internal");
  const [standbyPreacherId, setStandbyPreacherId] = useState(initial?.standbyPreacherId || "");
  const [liturgistId, setLiturgistId] = useState(initial?.liturgistId || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [mcId, setMcId] = useState(initial?.mcId || "");
  const [mcContact, setMcContact] = useState(initial?.mcContact || "");
  const [bibleReaders, setBibleReaders] = useState<BibleReader[]>(() => {
    if (initial?.bibleReaders && initial.bibleReaders.length > 0) {
      return initial.bibleReaders;
    }
    return [
      { scriptureReference: "", name: "", contact: "" },
      { scriptureReference: "", name: "", contact: "" },
      { scriptureReference: "", name: "", contact: "" },
    ];
  });
  const [preacherContact, setPreacherContact] = useState("");
  const [standbyPreacherContact, setStandbyPreacherContact] = useState("");
  const [liturgistContact, setLiturgistContact] = useState("");

  const bibleReadersStaff = getStaffByRole("Bible Reader");

  useEffect(() => {
    if (initial?.preacherId) {
      const internalPreacher = staff.find(s => s.id === initial.preacherId);
      const externalPreacher = externalPreachers.find(s => s.id === initial.preacherId);
      
      if (internalPreacher) {
        setPreacherClassification("Internal");
      } else if (externalPreacher) {
        setPreacherClassification("External");
      }
    }
  }, [initial?.preacherId, staff, externalPreachers]);

  const internalPreachers = getStaffByClassification("Internal").filter(s => s.roles.includes("Preacher"));
  const internalStandbyPreachers = getStaffByClassification("Internal").filter(s => s.roles.includes("Preacher"));
  const preachers = preacherClassification === "Internal" 
    ? internalPreachers 
    : externalPreachers.filter(p => p.status === "active");
  const mcs = getStaffByRole("MC");
  const liturgists = getStaffByRole("Liturgist");

  const getPreacherContactById = (id: string) => {
    const p = staff.find(s => s.id === id);
    return p?.phone || "";
  };

  const getExternalPreacherContactById = (id: string) => {
    const p = externalPreachers.find(s => s.id === id);
    return p?.phone || "";
  };

  const getStandbyPreacherContactById = (id: string) => {
    const p = internalStandbyPreachers.find(s => s.id === id);
    return p?.phone || "";
  };

  const getMcContact = (id: string) => {
    const m = mcs.find(s => s.id === id);
    return m?.phone || "";
  };

  const getBibleReaderContactByName = (name: string) => {
    const b = bibleReadersStaff.find(s => s.fullName === name);
    return b?.phone || "";
  };

  const getLiturgistContactById = (id: string) => {
    const l = liturgists.find(s => s.id === id);
    return l?.phone || "";
  };

  const getPreacherNameById = (id: string) => {
    if (preacherClassification === "Internal") {
      const p = staff.find(s => s.id === id);
      return p?.fullName || "";
    } else {
      const p = externalPreachers.find(s => s.id === id);
      return p?.fullName || "";
    }
  };

  const getPreacherContact = (id: string) => {
    if (preacherClassification === "Internal") {
      return getPreacherContactById(id);
    } else {
      return getExternalPreacherContactById(id);
    }
  };

  useEffect(() => {
    if (initial?.liturgistId) {
      const contact = getLiturgistContactById(initial.liturgistId);
      setLiturgistContact(contact);
      const liturgist = liturgists.find(s => s.id === initial.liturgistId);
      if (liturgist && initial.bibleReaders) {
        const thirdReader = initial.bibleReaders[2] || { scriptureReference: "", name: "", contact: "" };
        setBibleReaders([
          initial.bibleReaders[0] || { scriptureReference: "", name: "", contact: "" },
          initial.bibleReaders[1] || { scriptureReference: "", name: "", contact: "" },
          { ...thirdReader, name: liturgist.fullName, contact: liturgist.phone }
        ]);
      }
    }
  }, [initial?.liturgistId, initial?.bibleReaders]);

  useEffect(() => {
    if (preacherId) {
      setPreacherContact(getPreacherContact(preacherId));
    } else {
      setPreacherContact("");
    }
  }, [preacherId, preacherClassification]);

  useEffect(() => {
    if (initial?.standbyPreacherId) {
      const contact = getStandbyPreacherContactById(initial.standbyPreacherId);
      setStandbyPreacherContact(contact);
    }
  }, [initial?.standbyPreacherId]);

  useEffect(() => {
    if (standbyPreacherId) {
      setStandbyPreacherContact(getStandbyPreacherContactById(standbyPreacherId));
    } else {
      setStandbyPreacherContact("");
    }
  }, [standbyPreacherId]);

  useEffect(() => {
    if (liturgistId) {
      setLiturgistContact(getLiturgistContactById(liturgistId));
      const liturgist = liturgists.find(s => s.id === liturgistId);
      if (liturgist) {
        setBibleReaders(prev => {
          const newReaders = [...prev];
          newReaders[2] = {
            scriptureReference: prev[2]?.scriptureReference || "",
            name: liturgist.fullName,
            contact: liturgist.phone
          };
          return newReaders;
        });
      }
    } else {
      setLiturgistContact("");
      setBibleReaders(prev => {
        const newReaders = [...prev];
        newReaders[2] = { scriptureReference: prev[2]?.scriptureReference || "", name: "", contact: "" };
        return newReaders;
      });
    }
  }, [liturgistId]);

  useEffect(() => {
    const newReaders = bibleReaders.map((reader, index) => {
      if (index === 2 && liturgistId) {
        return {
          scriptureReference: reader.scriptureReference || "",
          name: liturgistId ? staff.find(s => s.id === liturgistId)?.fullName || "" : reader.name,
          contact: liturgistContact
        };
      }
      if (reader.name && index < 2) {
        const contact = getBibleReaderContact(reader.name, bibleReadersStaff, liturgistContact);
        if (reader.contact !== contact) {
          return { ...reader, contact };
        }
      }
      return reader;
    });
    const hasChanges = newReaders.some((reader, index) => reader.contact !== bibleReaders[index].contact);
    if (hasChanges) {
      setBibleReaders(newReaders);
    }
  }, [bibleReaders.map(r => r.name).join(","), liturgistContact, liturgistId]);

  const updateBibleReader = (index: number, field: keyof BibleReader, value: string) => {
    const newReaders = [...bibleReaders];
    newReaders[index] = { ...newReaders[index], [field]: value };
    setBibleReaders(newReaders);
  };

  const addBibleReader = () => setBibleReaders([...bibleReaders, { scriptureReference: "", name: "", contact: "" }]);
  const removeBibleReader = (index: number) => {
    if (bibleReaders.length > 1) {
      setBibleReaders(bibleReaders.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalBibleReaders = bibleReaders.map((reader, index) => {
      if (index === 2 && liturgistId) {
        return {
          scriptureReference: reader.scriptureReference || "",
          name: liturgistId ? staff.find(s => s.id === liturgistId)?.fullName || "" : reader.name,
          contact: liturgistContact
        };
      }
      return reader;
    });
    
    onSubmit({
      serviceType,
      serviceDate,
      theme: isPrayerMeeting ? "" : theme,
      preacherId,
      preacherName: getPreacherNameById(preacherId),
      preacherContact: getPreacherContact(preacherId),
      bibleReaders: finalBibleReaders.filter(br => br.scriptureReference || br.name || br.contact),
      standbyPreacherId: isPrayerMeeting ? undefined : standbyPreacherId,
      standbyPreacherName: isPrayerMeeting ? "" : internalStandbyPreachers.find(s => s.id === standbyPreacherId)?.fullName || "",
      standbyPreacherContact: isPrayerMeeting ? "" : getStandbyPreacherContactById(standbyPreacherId),
      liturgistId: isPrayerMeeting ? undefined : liturgistId,
      liturgistName: isPrayerMeeting ? "" : staff.find(s => s.id === liturgistId)?.fullName || "",
      liturgistContact: isPrayerMeeting ? "" : getLiturgistContactById(liturgistId),
      notes,
      mcId,
      mcName: mcs.find(s => s.id === mcId)?.fullName || "",
      mcContact: getMcContact(mcId),
      status: "upcoming",
      updatedAt: Date.now(),
    });
  };

  const isPrayerMeeting = serviceType === "WEDNESDAY_PRAYER_MEETING";

  useEffect(() => {
    if (isPrayerMeeting) {
      setTheme("");
      setStandbyPreacherId("");
      setLiturgistId("");
    }
  }, [serviceType]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Service Date *</label>
          <input
            type="date"
            value={serviceDate}
            onChange={(e) => setServiceDate(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Service Type *</label>
          <select
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value as ServiceType)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {SERVICE_TYPES.map(st => (
              <option key={st.value} value={st.value}>{st.label}</option>
            ))}
          </select>
        </div>
      </div>

      {!isPrayerMeeting && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Theme/Sermon Title *</label>
          <input
            type="text"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="Enter the sermon theme or title"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Preacher Classification *</label>
          <select
            value={preacherClassification}
            onChange={(e) => {
              setPreacherClassification(e.target.value as "Internal" | "External");
              setPreacherId("");
              setPreacherContact("");
            }}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="Internal">Internal</option>
            <option value="External">External</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Preacher *</label>
          <select
            value={preacherId}
            onChange={(e) => setPreacherId(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select {preacherClassification} Preacher</option>
            {preachers.map(p => (
              <option key={p.id} value={p.id}>{p.fullName}{p.classification === "External" && (p as any).society ? ` (${(p as any).society})` : ""}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
          <input
            type="text"
            value={preacherContact}
            readOnly
            placeholder="No contact available"
            className="w-full px-3 py-2 text-sm border rounded-lg bg-gray-100 cursor-not-allowed"
          />
        </div>
      </div>

      {!isPrayerMeeting && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Standby Preacher</label>
            <select
              value={standbyPreacherId}
              onChange={(e) => setStandbyPreacherId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Standby Preacher</option>
              {internalStandbyPreachers.filter(p => p.id !== preacherId).map(p => (
                <option key={p.id} value={p.id}>{p.fullName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
            <input
              type="text"
              value={standbyPreacherContact}
              readOnly
              placeholder="No contact available"
              className="w-full px-3 py-2 text-sm border rounded-lg bg-gray-100 cursor-not-allowed"
            />
          </div>
        </div>
      )}

      {!isPrayerMeeting && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Liturgist</label>
            <select
              value={liturgistId}
              onChange={(e) => setLiturgistId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Liturgist</option>
              {liturgists.map(l => (
                <option key={l.id} value={l.id}>{l.fullName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
            <input
              type="text"
              value={liturgistContact}
              readOnly
              placeholder="No contact available"
              className="w-full px-3 py-2 text-sm border rounded-lg bg-gray-100 cursor-not-allowed"
            />
          </div>
        </div>
      )}

      {!isPrayerMeeting && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Bible Readers</label>
          <div className="space-y-4">
            {bibleReaders.map((reader, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">{BIBLE_READER_LABELS[index] || `Bible Reader ${index + 1}`}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Scripture Reference</label>
                    <input
                      type="text"
                      value={reader.scriptureReference}
                      onChange={(e) => updateBibleReader(index, "scriptureReference", e.target.value)}
                      placeholder="e.g., John 3:16"
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${index === 2 ? 'bg-white' : ''}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Name</label>
                    {index === 2 ? (
                      <input
                        type="text"
                        value={reader.name}
                        readOnly
                        className="w-full px-3 py-2 text-sm border rounded-lg bg-gray-100 cursor-not-allowed"
                        placeholder="Auto-filled from Liturgist"
                      />
                    ) : (
                      <select
                        value={reader.name}
                        onChange={(e) => updateBibleReader(index, "name", e.target.value)}
                        className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Reader</option>
                        {bibleReadersStaff.map((br: any) => (
                          <option key={br.id} value={br.fullName}>{br.fullName}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Contact</label>
                    <input
                      type="text"
                      value={reader.contact}
                      readOnly={index < 2}
                      className={`w-full px-3 py-2 text-sm border rounded-lg ${index < 2 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      placeholder={index < 2 ? "Auto-filled from selection" : "Auto-filled from Liturgist"}
                    />
                  </div>
                </div>
                {index === 2 && (
                  <p className="text-xs text-gray-500 mt-2">This is automatically synchronized with the Liturgist selection. Only edit the scripture reference.</p>
                )}
                {index < 2 && bibleReaders.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeBibleReader(index)}
                    className="text-red-500 text-sm mt-3 hover:text-red-700"
                  >
                    Remove Reader
                  </button>
                )}
              </div>
            ))}
          </div>
          {bibleReaders.length < 3 && (
            <button
              type="button"
              onClick={addBibleReader}
              className="text-blue-600 text-sm mt-2 hover:text-blue-800"
            >
              + Add Bible Reader
            </button>
          )}
        </div>
      )}

      {isPrayerMeeting && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">MC *</label>
            <select
              value={mcId}
              onChange={(e) => setMcId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select MC</option>
              {mcs.map(m => (
                <option key={m.id} value={m.id}>{m.fullName}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes/Remarks</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes or remarks"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800"
        >
          Save Plan
        </button>
      </div>
    </form>
  );
};