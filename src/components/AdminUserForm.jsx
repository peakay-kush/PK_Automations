'use client';

import { useState } from 'react';
import { getToken } from '@/utils/auth';

export default function AdminUserForm({ initial = {}, onCancel, onSave }) {
  const [name, setName] = useState(initial.name || '');
  const [email, setEmail] = useState(initial.email || '');
  const [role, setRole] = useState(initial.role || 'user');
  const [disabled, setDisabled] = useState(!!initial.disabled);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const token = getToken();
      if (!token) return alert('Not authorized');
      const payload = { name, role, disabled };
      const res = await fetch(`/api/admin/users/${initial.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j && j.error ? j.error : 'Failed');
      }
      const j = await res.json();
      onSave && onSave(j.user);
    } catch (err) {
      alert(String(err));
    } finally {
      setSaving(false);
    }
  }

  if (!initial || !initial.id) return null;

  return (
    <div className="p-4 border rounded">
      <div className="grid gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="border px-2 py-1" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="border px-2 py-1" disabled />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="border px-2 py-1">
          <option value="user">user</option>
          <option value="admin">admin</option>
          <option value="super">super</option>
        </select>
        <label className="flex items-center gap-2"><input type="checkbox" checked={disabled} onChange={(e) => setDisabled(e.target.checked)} /> Disabled</label>
        <div className="flex gap-2">
          <button onClick={save} disabled={saving} className="px-3 py-1 bg-accent text-white rounded">Save</button>
          <button onClick={onCancel} disabled={saving} className="px-3 py-1 border rounded">Cancel</button>
        </div>
      </div>
    </div>
  );
}