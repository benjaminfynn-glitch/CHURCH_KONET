import React, { useState } from 'react';
import { addMember } from '../src/services/members';

export default function AddMemberForm() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState(''); // DD/MM/YYYY
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const result = await addMember({ fullName, phone, email, dob });
      setMessage(`Member created (id: ${result.id})`);

      // reset form
      setFullName('');
      setPhone('');
      setDob('');
      setEmail('');
    } catch (err: any) {
      setMessage(err?.message || 'Failed to add member');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">

      <div>
        <label className="block text-sm font-medium">Full name</label>
        <input
          className="mt-1 block w-full rounded border px-3 py-2"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Phone</label>
        <input
          className="mt-1 block w-full rounded border px-3 py-2"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="+233501234567"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Date of birth (DD/MM/YYYY)</label>
        <input
          className="mt-1 block w-full rounded border px-3 py-2"
          value={dob}
          onChange={e => setDob(e.target.value)}
          placeholder="DD/MM/YYYY"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Email (optional)</label>
        <input
          className="mt-1 block w-full rounded border px-3 py-2"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      </div>

      <div>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center px-4 py-2 rounded bg-blue-600 text-white"
        >
          {busy ? 'Adding...' : 'Add Member'}
        </button>
      </div>

      {message && <div className="mt-2 text-sm">{message}</div>}

      {/* 🔵 TEST BUTTON ADDED HERE */}
      <button
        type="button"
        onClick={async () => {
          try {
            const result = await addMember({
              fullName: "Test User",
              phone: "0000000000",
              email: "test@example.com",
              dob: "01/01/2000"
            });
            console.log("TEST MEMBER ADDED:", result);
            alert("Test member added!");
          } catch (error) {
            console.error("TEST ERROR:", error);
            alert("Failed to add test member");
          }
        }}
        className="bg-blue-500 text-white p-2 rounded mt-4"
      >
        Run Firestore Test
      </button>
    </form>
  );
}
