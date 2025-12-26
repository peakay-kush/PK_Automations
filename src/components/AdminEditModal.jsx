'use client';

import { useEffect, useState } from 'react';
import { getToken } from '@/utils/auth';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Heart, Share2, ChevronLeft, ChevronRight, Star } from 'lucide-react';

import AdminImageUploader from './AdminImageUploader';
import AdminTopicsEditor from './AdminTopicsEditor';
import AdminAttachmentsUploader from './AdminAttachmentsUploader';
import AdminTutorialForm from './AdminTutorialForm';
import AdminProductForm from './AdminProductForm';

export default function AdminEditModal() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(null);
  const [id, setId] = useState(null);
  const [mode, setMode] = useState('edit');
  const [loading, setLoading] = useState(false);
  const [item, setItem] = useState(null);
  const [error, setError] = useState(null);

  const [pendingAction, setPendingAction] = useState(null);
  const [showTopicsEditor, setShowTopicsEditor] = useState(false);

  const [focusField, setFocusField] = useState(null);
  const [fieldTarget, setFieldTarget] = useState(null); // keep requested field for focused editing

  // Services management state (for Manage Services modal view)
  const [servicesList, setServicesList] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      const d = (e && e.detail) || {};
      console.log('[AdminEditModal] adminOpenEdit payload', d);

      // Special action: open/manage services section by toggling edit mode and scrolling
      if (d && d.field === 'manageServices') {
        try {
          window.dispatchEvent(new CustomEvent('adminEditModeChanged', { detail: { editMode: true } }));
          setTimeout(() => {
            try {
              const el = document.getElementById('services-section');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } catch (err) { /* ignore */ }
          }, 80);
        } catch (err) {}

        // Ensure the modal opens and target is set even if other handlers run
        setType('page');
        setId('home');
        setMode('edit');
        setPendingAction(null);
        setFocusField(null);
        setFieldTarget('manageServices');
        setOpen(true);
      }

      setType(d.type || null);
      setId(d.id || null);
      setMode(d.mode || 'edit');
      setPendingAction(d.action || null);
      setFocusField(d.field || null);
      setFieldTarget(d.field || null);
      setOpen(true);
    };
    window.addEventListener('adminOpenEdit', handler);
    return () => window.removeEventListener('adminOpenEdit', handler);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!open || !type) return;
      setLoading(true);
      setError(null);

      // If creating a new item, initialize defaults for that type
      if (mode === 'new') {
        const defaults = {
          product: { name: '', price: 0, category: 'DIY Kits', images: [], image: '', description: '', specifications: '', related: [] },
          service: { title: '', price: '', features: [], image: '' },
          tutorial: { title: '', excerpt: '', content: '', thumbnail: '' },
          page: { id: '', title: '', content: '', heroImage: '', quickAnswers: [] },
          team: { name: '', role: '', image: '' },
        };

        // If no explicit type was provided, try to infer from the current path (helps Tutorials page)
        let initType = type;
        try {
          if (!initType && typeof window !== 'undefined') {
            const p = window.location && window.location.pathname ? window.location.pathname.toLowerCase() : '';
            if (p.startsWith('/tutorials') || p.startsWith('/tutorial')) initType = 'tutorial';
            else if (p.startsWith('/about') || p.startsWith('/contact') || p.startsWith('/services') || p === '/') initType = 'page';
          }
        } catch (e) {}

        console.log('[AdminEditModal] initializing defaults for type=', type, 'inferredType=', initType, 'default=', defaults[initType]);
        if (mounted) {
          setItem(defaults[initType] ? Object.assign({}, defaults[initType]) : {});
          setLoading(false);
        }
        return;
      }

      // For view mode with no id, nothing to load
      if (!id) { setLoading(false); return; }

      try {
        const token = getToken();
        const res = await fetch(`/api/admin/${type}s/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) {
          // more informative errors for auth issues
          if (res.status === 401 || res.status === 403) {
            if (mounted) {
              setError('Unauthorized: please sign in as an admin to edit this resource.');
            }
            return;
          }

          // If a page resource is missing, initialize a new page draft so the admin can create it
          if (res.status === 404 && type === 'page') {
            if (mounted) {
              // initialize a default page with the requested id prefilled
              setItem(Object.assign({}, { id, title: (id || '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), content: '', heroImage: '', quickAnswers: [] }));
              setMode('new');
              setLoading(false);
            }
            return;
          }

          const txt = await res.text().catch(() => null);
          throw new Error(txt || 'Failed to load');
        }
        const data = await res.json();
        if (mounted) {
          setItem(data);
          // Process any pending admin actions (e.g., addTopic, addMedia)
          if (pendingAction === 'addTopic') {
            setItem((s) => ({ ...s, topics: [...(s.topics || []), { title: 'New Topic', media: [] }] }));
            setPendingAction(null);
          } else if (pendingAction === 'addMedia') {
            setItem((s) => ({ ...s, media: [...(s.media || []), { type: 'video', url: '', title: 'New media' }] }));
            setPendingAction(null);
          }
        }
      } catch (e) {
        if (mounted) setError(String(e));
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [open, type, id, mode]);

  useEffect(() => {
    if (!pendingAction || !item) return;
    if (pendingAction === 'addTopic') {
      setItem((s) => ({ ...s, topics: [...(s.topics || []), { title: 'New Topic', media: [] }] }));
      setPendingAction(null);
    } else if (pendingAction === 'addMedia') {
      setItem((s) => ({ ...s, media: [...(s.media || []), { type: 'video', url: '', title: 'New media' }] }));
      setPendingAction(null);
    }
  }, [pendingAction, item]);

  // Focus a specific field if requested via adminOpenEdit { field }
  useEffect(() => {
    if (!focusField || !item) return;
    // small delay to ensure DOM is rendered
    setTimeout(() => {
      try {
        const el = document.querySelector(`[data-admin-field="${focusField}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (typeof el.focus === 'function') el.focus();
        }
      } catch (e) {
        console.warn('[AdminEditModal] focusField error', e);
      }
      setFocusField(null);
      // Note: keep `fieldTarget` so the modal can render the small field editor UI
    }, 80);
  }, [focusField, item]);

  // Close modal if the currently-open item was deleted elsewhere
  useEffect(() => {
    function onDeleted(e) {
      try {
        const d = (e && e.detail) || {};
        if (open && d && d.type === type && d.id === id) {
          setOpen(false);
        }
      } catch (err) {}
    }
    window.addEventListener('adminDeleted', onDeleted);
    return () => window.removeEventListener('adminDeleted', onDeleted);
  }, [open, type, id]);

  // When opening the Manage Services view, fetch services list for inline admin management
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!open || fieldTarget !== 'manageServices') return;
      setServicesLoading(true);
      try {
        const token = getToken();
        if (!token) return setServicesList([]);
        const res = await fetch('/api/admin/services', { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error('Failed to load services');
        const data = await res.json();
        if (mounted) setServicesList(Array.isArray(data) ? data : []);
      } catch (e) {
        if (mounted) setServicesList([]);
      } finally { if (mounted) setServicesLoading(false); }
    })();
    return () => { mounted = false; };
  }, [open, fieldTarget]);

  async function handleSave(overrideItem) {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      const payload = Object.assign({}, overrideItem || item);
      console.log('[AdminEditModal] handleSave', { type, mode, id, payload });

      // Normalize arrays
      if (payload.images && !Array.isArray(payload.images)) payload.images = [payload.images];
      if (payload.features && !Array.isArray(payload.features)) payload.features = [payload.features];
      if (payload.values && !Array.isArray(payload.values)) payload.values = (typeof payload.values === 'string') ? payload.values.split(/\r?\n/).map(x => x.trim()).filter(Boolean) : [payload.values];

      // Sanitize payload to remove DOM nodes, functions, and circular refs before stringifying
      function sanitize(obj) {
        const seen = new WeakSet();
        function _clone(v) {
          if (v && typeof v === 'object') {
            if (seen.has(v)) return undefined;
            // Skip DOM elements (have nodeType) and React internals
            if (typeof v.nodeType === 'number' || (v._reactInternals || v._reactRootContainer)) return undefined;
            seen.add(v);
            if (Array.isArray(v)) return v.map(_clone).filter(v2 => v2 !== undefined);
            const out = {};
            for (const k of Object.keys(v)) {
              const val = v[k];
              if (typeof val === 'function') continue;
              const c = _clone(val);
              if (c !== undefined) out[k] = c;
            }
            return out;
          }
          // primitives OK
          return v;
        }
        return _clone(obj);
      }

      const safePayload = sanitize(payload);

      let res, j;
      if (mode === 'new' || !id) {
        res = await fetch(`/api/admin/${type}s`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(safePayload) });
        j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j && j.error ? j.error : 'Failed to create');
        const created = j && (j[type] || j.member || j.page) ? (j[type] || j.member || j.page) : j;
        window.dispatchEvent(new CustomEvent('adminUpdated', { detail: { type, id: created && created.id ? created.id : null } }));
      } else {
        res = await fetch(`/api/admin/${type}s/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(safePayload) });
        j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j && j.error ? j.error : 'Failed to save');
        window.dispatchEvent(new CustomEvent('adminUpdated', { detail: { type, id } }));
      }

      // show success toast
      try { window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Saved successfully', type: 'success' } })); } catch (e) {}

      setOpen(false);
    } catch (e) {
      const msg = (e && e.message) ? e.message : String(e);
      console.error('[AdminEditModal] save error', e);
      setError(msg);
      try { window.dispatchEvent(new CustomEvent('toast', { detail: { message: msg, type: 'error' } })); } catch (err) {}
    } finally { setLoading(false); }
  }

  if (!open) return null;

  const isReadOnly = mode === 'view';

  function renderBody() {
    if (loading) return <div>Loading...</div>;
    if (error) return (
      <div className="text-red-600 space-y-3">
        <div>{error}</div>
        {typeof error === 'string' && error.toLowerCase().includes('unauthorized') && (
          <div>
            <button onClick={() => { window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`; }} className="px-3 py-1 bg-accent text-white rounded">Sign in</button>
          </div>
        )}
      </div>
    );
    if (!item) return <div>No item data</div>;

    // If an editor was requested for a single field, render a compact field-only editor
    if (fieldTarget && type === 'page') {
      // studentHubBullets-N
      if (fieldTarget.startsWith('studentHubBullets-')) {
        const idx = parseInt(fieldTarget.split('-')[1], 10);
        const current = (item.studentHubBullets && item.studentHubBullets[idx]) ? item.studentHubBullets[idx] : '';

        // Support both simple string bullets and {name, desc} objects
        if (current && typeof current === 'object' && !Array.isArray(current)) {
          const nameVal = current.name || '';
          const descVal = current.desc || '';
          return (
            <div>
              <label className="block text-sm font-semibold mb-1">Edit Tool #{idx + 1}</label>

              <div className="mb-2">
                <label className="block text-xs font-semibold mb-1">Tool Name</label>
                <input className="w-full border p-2 rounded mb-2" value={nameVal} onChange={(e) => setItem((s) => { const copy = Object.assign({}, s); copy.studentHubBullets = Array.isArray(copy.studentHubBullets) ? Array.from(copy.studentHubBullets) : []; copy.studentHubBullets[idx] = Object.assign({}, copy.studentHubBullets[idx] || {}, { name: e.target.value, desc: copy.studentHubBullets[idx] && copy.studentHubBullets[idx].desc ? copy.studentHubBullets[idx].desc : descVal }); return copy; })} data-admin-field={`studentHubBullets-${idx}-name`} />

                <label className="block text-xs font-semibold mb-1">Description</label>
                <input className="w-full border p-2 rounded" value={descVal} onChange={(e) => setItem((s) => { const copy = Object.assign({}, s); copy.studentHubBullets = Array.isArray(copy.studentHubBullets) ? Array.from(copy.studentHubBullets) : []; copy.studentHubBullets[idx] = Object.assign({}, copy.studentHubBullets[idx] || {}, { desc: e.target.value, name: copy.studentHubBullets[idx] && copy.studentHubBullets[idx].name ? copy.studentHubBullets[idx].name : nameVal }); return copy; })} data-admin-field={`studentHubBullets-${idx}-desc`} />
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => handleSave({ studentHubBullets: item.studentHubBullets })} disabled={loading} className="px-4 py-2 bg-accent text-white rounded">Save</button>
                <button onClick={() => { setFieldTarget(null); setOpen(false); }} className="px-4 py-2 border rounded">Cancel</button>
              </div>
            </div>
          );
        }

        // Fallback: treat as simple string
        return (
          <div>
            <label className="block text-sm font-semibold mb-1">Edit Bullet #{idx + 1}</label>
            <input className="w-full border p-2 rounded mb-4" value={current} onChange={(e) => setItem((s) => { const copy = Object.assign({}, s); copy.studentHubBullets = Array.isArray(copy.studentHubBullets) ? Array.from(copy.studentHubBullets) : []; copy.studentHubBullets[idx] = e.target.value; return copy; })} data-admin-field={`studentHubBullets-${idx}`} />
            <div className="flex items-center gap-2">
              <button onClick={() => handleSave({ studentHubBullets: item.studentHubBullets })} disabled={loading} className="px-4 py-2 bg-accent text-white rounded">Save</button>
              <button onClick={() => { setFieldTarget(null); setOpen(false); }} className="px-4 py-2 border rounded">Cancel</button>
            </div>
          </div>
        );
      }

      // ABOUT section focused editor (Story, Hero Image, Mission, Vision, Values)
      if (fieldTarget === 'aboutSection') {
        const story = item.content || '';
        const heroImage = item.heroImage || '';
        const mission = item.mission || '';
        const vision = item.vision || '';
        const valuesText = (Array.isArray(item.values)) ? item.values.join('\n') : (typeof item.values === 'string' ? item.values : '');

        return (
          <div>
            <label className="block text-sm font-semibold mb-1">Our Story</label>
            <textarea rows={6} data-admin-field="aboutContent" className="w-full border p-2 rounded mb-3" value={story} onChange={(e) => setItem((s) => (Object.assign({}, s, { content: e.target.value })))} />

            <label className="block text-sm font-semibold mb-1">Hero Image</label>
            <div className="mb-3"><AdminImageUploader value={heroImage} onChange={(url) => setItem((s) => (Object.assign({}, s, { heroImage: url })))} /></div>

            <label className="block text-sm font-semibold mb-1">Mission</label>
            <textarea rows={2} data-admin-field="mission" className="w-full border p-2 rounded mb-3" value={mission} onChange={(e) => setItem((s) => (Object.assign({}, s, { mission: e.target.value })))} />

            <label className="block text-sm font-semibold mb-1">Vision</label>
            <textarea rows={2} data-admin-field="vision" className="w-full border p-2 rounded mb-3" value={vision} onChange={(e) => setItem((s) => (Object.assign({}, s, { vision: e.target.value })))} />

            <label className="block text-sm font-semibold mb-1">Values (one per line)</label>
            <textarea rows={4} data-admin-field="values" className="w-full border p-2 rounded mb-3" value={valuesText} onChange={(e) => setItem((s) => (Object.assign({}, s, { values: e.target.value.split(/\r?\n/).map(x => x.trim()).filter(Boolean) })))} />

            <div className="flex items-center gap-2">
              <button onClick={() => handleSave({ content: item.content, heroImage: item.heroImage, mission: item.mission, vision: item.vision, values: item.values })} disabled={loading} className="px-4 py-2 bg-accent text-white rounded">Save</button>
              <button onClick={() => { setFieldTarget(null); setOpen(false); }} className="px-4 py-2 border rounded">Cancel</button>
            </div>
          </div>
        );
      }

      // studentHubBullets (tools editor, supports name + description)
      if (fieldTarget === 'studentHubBullets') {
        return (
          <div>
            <div className="mb-2 text-sm text-gray-600">Edit Simulation Tools (name and description)</div>
            <div className="space-y-3 mt-2">
              {(item.studentHubBullets || []).map((b, idx) => {
                const current = (typeof b === 'string') ? { name: b, desc: '' } : (b || { name: '', desc: '' });
                return (
                  <div key={idx} className="border rounded p-3">
                    <div className="flex gap-2 items-start mb-2">
                      <input data-admin-field={`studentHubBullets-${idx}-name`} placeholder="Tool name" disabled={isReadOnly} className="w-1/3 border p-2 rounded" value={current.name || ''} onChange={(e) => setItem((s) => { const copy = Object.assign({}, s); copy.studentHubBullets = Array.isArray(copy.studentHubBullets) ? Array.from(copy.studentHubBullets) : []; copy.studentHubBullets[idx] = Object.assign({}, copy.studentHubBullets[idx] || {}, { name: e.target.value, desc: (copy.studentHubBullets[idx] && copy.studentHubBullets[idx].desc) ? copy.studentHubBullets[idx].desc : current.desc }); return copy; })} />
                      <input data-admin-field={`studentHubBullets-${idx}-desc`} placeholder="Description" disabled={isReadOnly} className="flex-1 border p-2 rounded" value={current.desc || ''} onChange={(e) => setItem((s) => { const copy = Object.assign({}, s); copy.studentHubBullets = Array.isArray(copy.studentHubBullets) ? Array.from(copy.studentHubBullets) : []; copy.studentHubBullets[idx] = Object.assign({}, copy.studentHubBullets[idx] || {}, { desc: e.target.value, name: (copy.studentHubBullets[idx] && copy.studentHubBullets[idx].name) ? copy.studentHubBullets[idx].name : current.name }); return copy; })} />
                      {!isReadOnly && <button type="button" onClick={() => setItem((s) => { const copy = Object.assign({}, s); copy.studentHubBullets = Array.isArray(copy.studentHubBullets) ? Array.from(copy.studentHubBullets) : []; copy.studentHubBullets.splice(idx, 1); return copy; })} className="px-3 py-1 border rounded text-red-600">Remove</button>}
                    </div>
                  </div>
                );
              })}

              {!isReadOnly && <div><button type="button" onClick={() => setItem((s) => (Object.assign({}, s, { studentHubBullets: [...(s.studentHubBullets || []), { name: '', desc: '' }] })))} className="px-3 py-1 rounded border">Add Tool</button></div>}
            </div>

            <div className="flex items-center gap-2 mt-3">
              <button onClick={() => handleSave({ studentHubBullets: item.studentHubBullets })} disabled={loading} className="px-4 py-2 bg-accent text-white rounded">Save</button>
              <button onClick={() => { setFieldTarget(null); setOpen(false); }} className="px-4 py-2 border rounded">Cancel</button>
            </div>
          </div>
        );
      }

      // manageConsultation (edit consultation block: title, content, image, bullets)
      if (fieldTarget === 'manageConsultation') {
        return (
          <div>
            <div className="mb-2 text-sm text-gray-600">Manage Consultation Section</div>

            <div className="mb-3">
              <label className="block text-sm font-semibold mb-1">Section Title</label>
              <input data-admin-field="consultationTitle" disabled={isReadOnly} className="w-full border p-2 rounded" value={item.consultationTitle || ''} onChange={(e) => setItem((s) => (Object.assign({}, s, { consultationTitle: e.target.value })))} />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-semibold mb-1">Content</label>
              <textarea data-admin-field="consultationContent" rows={3} disabled={isReadOnly} className="w-full border p-2 rounded" value={item.consultationContent || ''} onChange={(e) => setItem((s) => (Object.assign({}, s, { consultationContent: e.target.value })))} />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-semibold mb-1">Image</label>
              <div className="mt-2 mb-4"><AdminImageUploader value={item.consultationImage || ''} onChange={(url) => setItem((s) => (Object.assign({}, s, { consultationImage: url })))} /></div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Consultation Bullets</label>
              <div className="space-y-2 mt-2">
                {(item.consultationBullets || []).map((b, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input data-admin-field={`consultationBullets-${idx}`} disabled={isReadOnly} className="flex-1 border p-2 rounded" value={b || ''} onChange={(e) => setItem((s) => { const copy = Object.assign({}, s); copy.consultationBullets = Array.isArray(copy.consultationBullets) ? Array.from(copy.consultationBullets) : []; copy.consultationBullets[idx] = e.target.value; return copy; })} />
                    {!isReadOnly && <button type="button" onClick={() => setItem((s) => { const copy = Object.assign({}, s); copy.consultationBullets = Array.isArray(copy.consultationBullets) ? Array.from(copy.consultationBullets) : []; copy.consultationBullets.splice(idx, 1); return copy; })} className="px-3 py-1 border rounded text-red-600">Remove</button>}
                  </div>
                ))}
                {!isReadOnly && <div><button type="button" onClick={() => setItem((s) => (Object.assign({}, s, { consultationBullets: [...(s.consultationBullets || []), ''] })))} className="px-3 py-1 rounded border">Add Bullet</button></div>}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <button onClick={() => handleSave({ consultationTitle: item.consultationTitle, consultationContent: item.consultationContent, consultationImage: item.consultationImage, consultationBullets: item.consultationBullets })} disabled={loading} className="px-4 py-2 bg-accent text-white rounded">Save</button>
              <button onClick={() => { setFieldTarget(null); setOpen(false); }} className="px-4 py-2 border rounded">Cancel</button>
            </div>
          </div>
        );
      }

      // manageServices (inline services manager in modal)
      if (fieldTarget === 'manageServices') {
        async function handleDeleteService(sid) {
          if (!confirm('Delete this service? This action cannot be undone.')) return;
          try {
            setServicesLoading(true);
            const token = getToken();
            const res = await fetch(`/api/admin/services/${sid}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error('Failed to delete');
            setServicesList((prev) => prev.filter((x) => x.id !== sid));
            try { window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Deleted', type: 'success' } })); } catch (e) {}
            // Notify other pages (e.g., Student Hub) to refresh their services list
            try { window.dispatchEvent(new CustomEvent('adminUpdated', { detail: { type: 'service', id: sid } })); } catch (e) {}
          } catch (e) {
            try { window.dispatchEvent(new CustomEvent('toast', { detail: { message: String(e), type: 'error' } })); } catch (err) {}
          } finally { setServicesLoading(false); }
        }

        return (
          <div>
            <div className="mb-2 text-sm text-gray-600">Manage Services (Add / Edit / Delete)</div>
            <div className="flex items-center gap-2 mb-3">
              <button onClick={() => window.dispatchEvent(new CustomEvent('adminOpenEdit', { detail: { type: 'service', id: null, mode: 'new' } }))} className="px-3 py-1 rounded bg-accent text-white">New Service</button>
              <button onClick={() => { setFieldTarget(null); setOpen(false); }} className="px-3 py-1 rounded border">Close</button>
            </div>

            {servicesLoading ? <div>Loading services...</div> : (
              <div className="space-y-3">
                {servicesList.length === 0 && <div className="text-sm text-gray-600">No services found.</div>}
                {servicesList.map((s) => (
                  <div key={s.id} className="border rounded p-3 flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{s.title || s.name || s.service || 'Untitled'}</div>
                      {s.description && <div className="text-sm text-gray-600">{s.description}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => window.dispatchEvent(new CustomEvent('adminOpenEdit', { detail: { type: 'service', id: s.id, mode: 'edit' } }))} className="px-3 py-1 rounded border">Edit</button>
                      <button onClick={() => handleDeleteService(s.id)} className="px-3 py-1 rounded border text-red-600">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }

      // studentTestimonials (list editor)
      if (fieldTarget === 'studentTestimonials') {
        return (
          <div>
            <div className="mb-2 text-sm text-gray-600">Edit Student Success Stories</div>
            <div className="space-y-3 mt-2">
              {(item.studentTestimonials || []).map((t, idx) => (
                <div key={idx} className="border rounded p-3">
                  <div className="flex gap-2 items-start mb-2">
                    <input data-admin-field={`studentTestimonials-${idx}-name`} placeholder="Name" disabled={isReadOnly} className="w-1/4 border p-2 rounded" value={t.name || ''} onChange={(e) => setItem((s) => { const copy = Object.assign({}, s); copy.studentTestimonials = Array.isArray(copy.studentTestimonials) ? Array.from(copy.studentTestimonials) : []; copy.studentTestimonials[idx] = Object.assign({}, copy.studentTestimonials[idx] || {}, { name: e.target.value }); return copy; })} />
                    <input data-admin-field={`studentTestimonials-${idx}-project`} placeholder="Project / Subtitle" disabled={isReadOnly} className="w-1/6 border p-2 rounded" value={t.project || ''} onChange={(e) => setItem((s) => { const copy = Object.assign({}, s); copy.studentTestimonials = Array.isArray(copy.studentTestimonials) ? Array.from(copy.studentTestimonials) : []; copy.studentTestimonials[idx] = Object.assign({}, copy.studentTestimonials[idx] || {}, { project: e.target.value }); return copy; })} />
                    <input data-admin-field={`studentTestimonials-${idx}-rating`} type="number" min="1" max="5" placeholder="Rating (1-5)" disabled={isReadOnly} className="w-1/6 border p-2 rounded" value={(typeof t.rating !== 'undefined' && t.rating !== null) ? t.rating : 5} onChange={(e) => setItem((s) => { const copy = Object.assign({}, s); copy.studentTestimonials = Array.isArray(copy.studentTestimonials) ? Array.from(copy.studentTestimonials) : []; copy.studentTestimonials[idx] = Object.assign({}, copy.studentTestimonials[idx] || {}, { rating: Math.max(1, Math.min(5, Number(e.target.value || 1))) }); return copy; })} />
                    <div className="flex-1">
                      <input data-admin-field={`studentTestimonials-${idx}-avatar`} placeholder="Avatar URL (or use uploader)" disabled={isReadOnly} className="w-full border p-2 rounded" value={t.avatar || ''} onChange={(e) => setItem((s) => { const copy = Object.assign({}, s); copy.studentTestimonials = Array.isArray(copy.studentTestimonials) ? Array.from(copy.studentTestimonials) : []; copy.studentTestimonials[idx] = Object.assign({}, copy.studentTestimonials[idx] || {}, { avatar: e.target.value }); return copy; })} />
                    </div>
                    {!isReadOnly && <button type="button" onClick={() => setItem((s) => { const copy = Object.assign({}, s); copy.studentTestimonials = Array.isArray(copy.studentTestimonials) ? Array.from(copy.studentTestimonials) : []; copy.studentTestimonials.splice(idx, 1); return copy; })} className="px-3 py-1 border rounded text-red-600">Remove</button>}
                  </div>

                  <div>
                    <textarea data-admin-field={`studentTestimonials-${idx}-story`} rows={3} placeholder="Story / Quote" disabled={isReadOnly} className="w-full border p-2 rounded" value={t.story || ''} onChange={(e) => setItem((s) => { const copy = Object.assign({}, s); copy.studentTestimonials = Array.isArray(copy.studentTestimonials) ? Array.from(copy.studentTestimonials) : []; copy.studentTestimonials[idx] = Object.assign({}, copy.studentTestimonials[idx] || {}, { story: e.target.value }); return copy; })} />
                  </div>

                  <div className="mt-3">
                    <AdminImageUploader value={t.avatar || ''} onChange={(url) => setItem((s) => { const copy = Object.assign({}, s); copy.studentTestimonials = Array.isArray(copy.studentTestimonials) ? Array.from(copy.studentTestimonials) : []; copy.studentTestimonials[idx] = Object.assign({}, copy.studentTestimonials[idx] || {}, { avatar: url }); return copy; })} />
                  </div>
                </div>
              ))}

              {!isReadOnly && <div><button type="button" onClick={() => setItem((s) => (Object.assign({}, s, { studentTestimonials: [...(s.studentTestimonials || []), { name: '', project: '', story: '', avatar: '', rating: 5 }] })))} className="px-3 py-1 rounded border">Add Story</button></div>}
            </div>

            <div className="flex items-center gap-2 mt-3">
              <button onClick={() => handleSave({ studentTestimonials: item.studentTestimonials })} disabled={loading} className="px-4 py-2 bg-accent text-white rounded">Save</button>
              <button onClick={() => { setFieldTarget(null); setOpen(false); }} className="px-4 py-2 border rounded">Cancel</button>
            </div>
          </div>
        );
      }

      // studentTestimonials-N (name/project/story/avatar)
      if (fieldTarget && fieldTarget.startsWith('studentTestimonials-')) {
        const idx = parseInt(fieldTarget.split('-')[1], 10);
        const current = (item.studentTestimonials && item.studentTestimonials[idx]) ? Object.assign({}, item.studentTestimonials[idx]) : { name: '', project: '', story: '', avatar: '' };
        return (
          <div>
            <label className="block text-sm font-semibold mb-1">Student Name</label>
            <input className="w-full border p-2 rounded mb-2" value={current.name} onChange={(e) => setItem((s) => { const copy = Object.assign({}, s); copy.studentTestimonials = Array.isArray(copy.studentTestimonials) ? Array.from(copy.studentTestimonials) : []; copy.studentTestimonials[idx] = Object.assign({}, copy.studentTestimonials[idx] || {}, { name: e.target.value }); return copy; })} data-admin-field={`studentTestimonials-${idx}-name`} />

            <label className="block text-sm font-semibold mb-1">Project / Subtitle</label>
            <input className="w-full border p-2 rounded mb-2" value={current.project} onChange={(e) => setItem((s) => { const copy = Object.assign({}, s); copy.studentTestimonials = Array.isArray(copy.studentTestimonials) ? Array.from(copy.studentTestimonials) : []; copy.studentTestimonials[idx] = Object.assign({}, copy.studentTestimonials[idx] || {}, { project: e.target.value }); return copy; })} data-admin-field={`studentTestimonials-${idx}-project`} />

            <label className="block text-sm font-semibold mb-1">Rating (1-5)</label>
            <input type="number" min="1" max="5" className="w-full border p-2 rounded mb-2" value={(typeof current.rating !== 'undefined' && current.rating !== null) ? current.rating : 5} onChange={(e) => setItem((s) => { const copy = Object.assign({}, s); copy.studentTestimonials = Array.isArray(copy.studentTestimonials) ? Array.from(copy.studentTestimonials) : []; copy.studentTestimonials[idx] = Object.assign({}, copy.studentTestimonials[idx] || {}, { rating: Math.max(1, Math.min(5, Number(e.target.value || 1))) }); return copy; })} data-admin-field={`studentTestimonials-${idx}-rating`} />

            <label className="block text-sm font-semibold mb-1">Story</label>
            <textarea rows={3} className="w-full border p-2 rounded mb-2" value={current.story} onChange={(e) => setItem((s) => { const copy = Object.assign({}, s); copy.studentTestimonials = Array.isArray(copy.studentTestimonials) ? Array.from(copy.studentTestimonials) : []; copy.studentTestimonials[idx] = Object.assign({}, copy.studentTestimonials[idx] || {}, { story: e.target.value }); return copy; })} data-admin-field={`studentTestimonials-${idx}-story`} />

            <label className="block text-sm font-semibold mb-1">Avatar</label>
            <div className="mb-4"><AdminImageUploader value={current.avatar || ''} onChange={(url) => setItem((s) => { const copy = Object.assign({}, s); copy.studentTestimonials = Array.isArray(copy.studentTestimonials) ? Array.from(copy.studentTestimonials) : []; copy.studentTestimonials[idx] = Object.assign({}, copy.studentTestimonials[idx] || {}, { avatar: url }); return copy; })} /></div>

            <div className="flex items-center gap-2">
              <button onClick={() => handleSave({ studentTestimonials: item.studentTestimonials })} disabled={loading} className="px-4 py-2 bg-accent text-white rounded">Save</button>
              <button onClick={() => { setFieldTarget(null); setOpen(false); }} className="px-4 py-2 border rounded">Cancel</button>
            </div>
          </div>
        );
      }

      if (fieldTarget === 'studentHubImage') {
        return (
          <div>
            <label className="block text-sm font-semibold mb-1">Student Hub Image</label>
            <div className="mt-2 mb-4"><AdminImageUploader value={item.studentHubImage ?? ''} onChange={(url) => setItem((s) => (Object.assign({}, s, { studentHubImage: url })))} /></div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleSave({ studentHubImage: item.studentHubImage })} disabled={loading} className="px-4 py-2 bg-accent text-white rounded">Save</button>
              <button onClick={() => { setFieldTarget(null); setOpen(false); }} className="px-4 py-2 border rounded">Cancel</button>
            </div>
          </div>
        );
      }

      if (fieldTarget === 'studentHubTitle' || fieldTarget === 'servicesTitle' || fieldTarget === 'testimonialsTitle') {
        const valKey = fieldTarget;
        const value = item[valKey] ?? '';
        return (
          <div>
            <label className="block text-sm font-semibold mb-1">Edit {valKey}</label>
            <input className="w-full border p-2 rounded mb-4" value={value} onChange={(e) => setItem((s) => (Object.assign({}, s, { [valKey]: e.target.value })))} data-admin-field={valKey} />
            <div className="flex items-center gap-2">
              <button onClick={() => handleSave({ [valKey]: item[valKey] })} disabled={loading} className="px-4 py-2 bg-accent text-white rounded">Save</button>

              {/* Open the full page editor (keeps modal open) */}
              <button onClick={() => { setFieldTarget(null); }} className="px-4 py-2 rounded border">Open Full Editor</button>

              {/* Directly go to the Manage Services inline manager */}
              {valKey === 'servicesTitle' && (
                <button onClick={() => setFieldTarget('manageServices')} className="px-4 py-2 rounded border">Manage Services</button>
              )}

              <button onClick={() => { setFieldTarget(null); setOpen(false); }} className="px-4 py-2 border rounded">Cancel</button>
            </div>
          </div>
        );
      }

      if (fieldTarget === 'studentHubContent') {
        const value = item.studentHubContent ?? '';
        return (
          <div>
            <label className="block text-sm font-semibold mb-1">Student Hub Content</label>
            <textarea rows={4} className="w-full border p-2 rounded mb-4" value={value} onChange={(e) => setItem((s) => (Object.assign({}, s, { studentHubContent: e.target.value })))} data-admin-field="studentHubContent" />
            <div className="flex items-center gap-2">
              <button onClick={() => handleSave({ studentHubContent: item.studentHubContent })} disabled={loading} className="px-4 py-2 bg-accent text-white rounded">Save</button>
              <button onClick={() => { setFieldTarget(null); setOpen(false); }} className="px-4 py-2 border rounded">Cancel</button>
            </div>
          </div>
        );
      }

      // studentHubSection (compact editor: title, content, bullets, image, CTA)
      if (fieldTarget === 'studentHubSection') {
        const title = item.studentHubTitle ?? '';
        const content = item.studentHubContent ?? '';
        const bullets = Array.isArray(item.studentHubBullets) ? item.studentHubBullets : [];
        const ctaText = item.studentHubCTAText ?? '';
        const ctaHref = item.studentHubCTAHref ?? '/student-hub';

        return (
          <div>
            <label className="block text-sm font-semibold mb-1">Student Hub Title</label>
            <input className="w-full border p-2 rounded mb-2" value={title} disabled={isReadOnly} onChange={(e) => setItem(s => Object.assign({}, s, { studentHubTitle: e.target.value }))} data-admin-field="studentHubTitle" />

            <label className="block text-sm font-semibold mb-1">Student Hub Content</label>
            <textarea rows={4} className="w-full border p-2 rounded mb-2" value={content} disabled={isReadOnly} onChange={(e) => setItem(s => Object.assign({}, s, { studentHubContent: e.target.value }))} data-admin-field="studentHubContent" />

            <label className="block text-sm font-semibold mb-1">Student Hub Bullets</label>
            <div className="space-y-2 mb-4">
              {bullets.map((b, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input className="flex-1 border p-2 rounded" value={b || ''} disabled={isReadOnly} onChange={(e) => setItem(s => { const copy = Object.assign({}, s); copy.studentHubBullets = Array.isArray(copy.studentHubBullets) ? Array.from(copy.studentHubBullets) : []; copy.studentHubBullets[idx] = e.target.value; return copy; })} data-admin-field={`studentHubBullets-${idx}`} />
                  {!isReadOnly && <button type="button" onClick={() => setItem(s => { const copy = Object.assign({}, s); copy.studentHubBullets = Array.isArray(copy.studentHubBullets) ? Array.from(copy.studentHubBullets) : []; copy.studentHubBullets.splice(idx, 1); return copy; })} className="px-3 py-1 border rounded text-red-600">Remove</button>}
                </div>
              ))}
              {!isReadOnly && <div><button type="button" onClick={() => setItem(s => Object.assign({}, s, { studentHubBullets: [...(s.studentHubBullets || []), ''] }))} className="px-3 py-1 rounded border">Add Bullet</button></div>}
            </div>

            <label className="block text-sm font-semibold mb-1">Student Hub Image</label>
            <div className="mb-4"><AdminImageUploader value={item.studentHubImage ?? ''} onChange={(url) => setItem(s => Object.assign({}, s, { studentHubImage: url }))} /></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold mb-1">CTA Text</label>
                <input className="w-full border p-2 rounded" value={ctaText} disabled={isReadOnly} onChange={(e) => setItem(s => Object.assign({}, s, { studentHubCTAText: e.target.value }))} data-admin-field="studentHubCTAText" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">CTA Href</label>
                <input className="w-full border p-2 rounded" value={ctaHref} disabled={isReadOnly} onChange={(e) => setItem(s => Object.assign({}, s, { studentHubCTAHref: e.target.value }))} data-admin-field="studentHubCTAHref" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => handleSave({ studentHubTitle: item.studentHubTitle, studentHubContent: item.studentHubContent, studentHubBullets: item.studentHubBullets, studentHubImage: item.studentHubImage, studentHubCTAText: item.studentHubCTAText, studentHubCTAHref: item.studentHubCTAHref })} disabled={loading} className="px-4 py-2 bg-accent text-white rounded">Save</button>
              <button onClick={() => { setFieldTarget(null); setOpen(false); }} className="px-4 py-2 border rounded">Cancel</button>
            </div>
          </div>
        );
      }

      // default fallback: no specific lightweight editor available
      return (
        <div>
          <div className="text-sm text-gray-600 mb-3">No specialized editor for this field; opening full page editor.</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setFieldTarget(null)} className="px-4 py-2 bg-accent text-white rounded">Open Full Editor</button>
            <button onClick={() => { setFieldTarget(null); setOpen(false); }} className="px-4 py-2 border rounded">Cancel</button>
          </div>
        </div>
      );
    }

    // If modal was opened specifically in upload mode, show a simple focused uploader
    if (mode === 'upload') {
      const key = (function () {
        if (Object.prototype.hasOwnProperty.call(item, 'avatar')) return 'avatar';
        if (Object.prototype.hasOwnProperty.call(item, 'thumbnail')) return 'thumbnail';
        if (Object.prototype.hasOwnProperty.call(item, 'studentHubImage')) return 'studentHubImage';
        if (Object.prototype.hasOwnProperty.call(item, 'heroImage')) return 'heroImage';
        if (Object.prototype.hasOwnProperty.call(item, 'image')) return 'image';
        return 'image';
      })();

      return (
        <div>
          <div className="mb-2 text-sm text-gray-600">Upload image for {type} ({key})</div>
          <div className="mb-3"><AdminImageUploader value={item[key] ?? ''} onChange={(url) => setItem((s) => (Object.assign({}, s, { [key]: url })))} /></div>
          <div className="flex items-center gap-2">
            <button onClick={() => handleSave({ [key]: item[key] })} disabled={loading} className="px-4 py-2 bg-accent text-white rounded">Save</button>
            <button onClick={() => setOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Page-specific fields */}
        {type === 'page' && (
          <>
            {mode === 'new' && (
              <div>
                <label className="block text-sm font-semibold mb-1">Page ID / Slug</label>
                <input disabled={isReadOnly} className="w-full border p-2 rounded" value={item.id ?? ''} onChange={(e) => setItem((s) => (Object.assign({}, s, { id: e.target.value })))} placeholder="about" />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold mb-1">Hero Title</label>
              <input disabled={isReadOnly} className="w-full border p-2 rounded" value={item.heroTitle ?? item.title ?? ''} onChange={(e) => setItem((s) => (Object.assign({}, s, { heroTitle: e.target.value })))} />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Hero Subtitle</label>
              <textarea disabled={isReadOnly} rows={3} className="w-full border p-2 rounded" value={item.heroSubtitle ?? ''} onChange={(e) => setItem((s) => (Object.assign({}, s, { heroSubtitle: e.target.value })))} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Primary CTA Text</label>
                <input disabled={isReadOnly} className="w-full border p-2 rounded" value={item.ctaPrimaryText ?? ''} onChange={(e) => setItem((s) => (Object.assign({}, s, { ctaPrimaryText: e.target.value })))} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Primary CTA Href</label>
                <input disabled={isReadOnly} className="w-full border p-2 rounded" value={item.ctaPrimaryHref ?? ''} onChange={(e) => setItem((s) => (Object.assign({}, s, { ctaPrimaryHref: e.target.value })))} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Secondary CTA Text</label>
                <input disabled={isReadOnly} className="w-full border p-2 rounded" value={item.ctaSecondaryText ?? ''} onChange={(e) => setItem((s) => (Object.assign({}, s, { ctaSecondaryText: e.target.value })))} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Secondary CTA Href</label>
                <input disabled={isReadOnly} className="w-full border p-2 rounded" value={item.ctaSecondaryHref ?? ''} onChange={(e) => setItem((s) => (Object.assign({}, s, { ctaSecondaryHref: e.target.value })))} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Services Section Title</label>
              <input data-admin-field="servicesTitle" disabled={isReadOnly} className="w-full border p-2 rounded" value={item.servicesTitle ?? ''} onChange={(e) => setItem((s) => (Object.assign({}, s, { servicesTitle: e.target.value })))} />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Student Hub Title</label>
              <input data-admin-field="studentHubTitle" disabled={isReadOnly} className="w-full border p-2 rounded" value={item.studentHubTitle ?? ''} onChange={(e) => setItem((s) => (Object.assign({}, s, { studentHubTitle: e.target.value })))} />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Student Hub Content</label>
              <textarea data-admin-field="studentHubContent" disabled={isReadOnly} rows={4} className="w-full border p-2 rounded" value={item.studentHubContent ?? ''} onChange={(e) => setItem((s) => (Object.assign({}, s, { studentHubContent: e.target.value })))} />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Student Hub Image</label>
              <div className="mt-2"><AdminImageUploader value={item.studentHubImage ?? ''} onChange={(url) => setItem((s) => (Object.assign({}, s, { studentHubImage: url })))} /></div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Student Hub Bullets</label>
              <div className="space-y-2 mt-2">
                {(item.studentHubBullets || []).map((b, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input data-admin-field={`studentHubBullets-${idx}`} disabled={isReadOnly} className="flex-1 border p-2 rounded" value={b || ''} onChange={(e) => setItem((s) => { const copy = Object.assign({}, s); copy.studentHubBullets = Array.isArray(copy.studentHubBullets) ? Array.from(copy.studentHubBullets) : []; copy.studentHubBullets[idx] = e.target.value; return copy; })} />
                    {!isReadOnly && <button type="button" onClick={() => setItem((s) => { const copy = Object.assign({}, s); copy.studentHubBullets = Array.isArray(copy.studentHubBullets) ? Array.from(copy.studentHubBullets) : []; copy.studentHubBullets.splice(idx, 1); return copy; })} className="px-3 py-1 border rounded text-red-600">Remove</button>}
                  </div>
                ))}
                {!isReadOnly && <div><button type="button" onClick={() => setItem((s) => (Object.assign({}, s, { studentHubBullets: [...(s.studentHubBullets || []), ''] })))} className="px-3 py-1 rounded border">Add Bullet</button></div>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Testimonials Title</label>
              <input data-admin-field="testimonialsTitle" disabled={isReadOnly} className="w-full border p-2 rounded" value={item.testimonialsTitle ?? ''} onChange={(e) => setItem((s) => (Object.assign({}, s, { testimonialsTitle: e.target.value })))} />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Student Success Stories</label>
              <div className="space-y-3 mt-2">
                {(item.studentTestimonials || []).map((t, idx) => (
                  <div key={idx} className="border rounded p-3">
                    <div className="flex gap-2 items-start mb-2">
                      <input data-admin-field={`studentTestimonials-${idx}-name`} placeholder="Name" disabled={isReadOnly} className="w-1/4 border p-2 rounded" value={t.name || ''} onChange={(e) => setItem((s) => { const copy = Object.assign({}, s); copy.studentTestimonials = Array.isArray(copy.studentTestimonials) ? Array.from(copy.studentTestimonials) : []; copy.studentTestimonials[idx] = Object.assign({}, copy.studentTestimonials[idx] || {}, { name: e.target.value }); return copy; })} />
                      <input data-admin-field={`studentTestimonials-${idx}-project`} placeholder="Project / Subtitle" disabled={isReadOnly} className="w-1/4 border p-2 rounded" value={t.project || ''} onChange={(e) => setItem((s) => { const copy = Object.assign({}, s); copy.studentTestimonials = Array.isArray(copy.studentTestimonials) ? Array.from(copy.studentTestimonials) : []; copy.studentTestimonials[idx] = Object.assign({}, copy.studentTestimonials[idx] || {}, { project: e.target.value }); return copy; })} />
                      <div className="flex-1">
                        <input data-admin-field={`studentTestimonials-${idx}-avatar`} placeholder="Avatar URL (or use uploader)" disabled={isReadOnly} className="w-full border p-2 rounded" value={t.avatar || ''} onChange={(e) => setItem((s) => { const copy = Object.assign({}, s); copy.studentTestimonials = Array.isArray(copy.studentTestimonials) ? Array.from(copy.studentTestimonials) : []; copy.studentTestimonials[idx] = Object.assign({}, copy.studentTestimonials[idx] || {}, { avatar: e.target.value }); return copy; })} />
                      </div>
                      {!isReadOnly && <button type="button" onClick={() => setItem((s) => { const copy = Object.assign({}, s); copy.studentTestimonials = Array.isArray(copy.studentTestimonials) ? Array.from(copy.studentTestimonials) : []; copy.studentTestimonials.splice(idx, 1); return copy; })} className="px-3 py-1 border rounded text-red-600">Remove</button>}
                    </div>

                    <div>
                      <textarea data-admin-field={`studentTestimonials-${idx}-story`} rows={3} placeholder="Story / Quote" disabled={isReadOnly} className="w-full border p-2 rounded" value={t.story || ''} onChange={(e) => setItem((s) => { const copy = Object.assign({}, s); copy.studentTestimonials = Array.isArray(copy.studentTestimonials) ? Array.from(copy.studentTestimonials) : []; copy.studentTestimonials[idx] = Object.assign({}, copy.studentTestimonials[idx] || {}, { story: e.target.value }); return copy; })} />
                    </div>

                    <div className="mt-3">
                      <AdminImageUploader value={t.avatar || ''} onChange={(url) => setItem((s) => { const copy = Object.assign({}, s); copy.studentTestimonials = Array.isArray(copy.studentTestimonials) ? Array.from(copy.studentTestimonials) : []; copy.studentTestimonials[idx] = Object.assign({}, copy.studentTestimonials[idx] || {}, { avatar: url }); return copy; })} />
                    </div>
                  </div>
                ))}

                {!isReadOnly && <div><button type="button" onClick={() => setItem((s) => (Object.assign({}, s, { studentTestimonials: [...(s.studentTestimonials || []), { name: '', project: '', story: '', avatar: '' }] })))} className="px-3 py-1 rounded border">Add Story</button></div>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">CTA Section Title</label>
              <input disabled={isReadOnly} className="w-full border p-2 rounded" value={item.ctaSectionTitle ?? ''} onChange={(e) => setItem((s) => (Object.assign({}, s, { ctaSectionTitle: e.target.value })))} />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">CTA Section Text</label>
              <textarea disabled={isReadOnly} rows={3} className="w-full border p-2 rounded" value={item.ctaSectionText ?? ''} onChange={(e) => setItem((s) => (Object.assign({}, s, { ctaSectionText: e.target.value })))} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">CTA Primary Button Text</label>
                <input disabled={isReadOnly} className="w-full border p-2 rounded" value={item.ctaSectionPrimaryText ?? item.ctaPrimaryText ?? ''} onChange={(e) => setItem((s) => (Object.assign({}, s, { ctaSectionPrimaryText: e.target.value })))} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">CTA Secondary Button Text</label>
                <input disabled={isReadOnly} className="w-full border p-2 rounded" value={item.ctaSectionSecondaryText ?? item.ctaSecondaryText ?? ''} onChange={(e) => setItem((s) => (Object.assign({}, s, { ctaSectionSecondaryText: e.target.value })))} />
              </div>
            </div>

            {/* Contact-specific fields (only show for Contact page) */}
            {((item && item.id === 'contact') || id === 'contact') && (
              <>
                <div>
                  <label className="block text-sm font-semibold mb-1">Contact Phone</label>
                  <input disabled={isReadOnly} className="w-full border p-2 rounded" value={item.contactPhone ?? item.phone ?? ''} onChange={(e) => setItem((s) => (Object.assign({}, s, { contactPhone: e.target.value, phone: e.target.value })))} />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Contact Email</label>
                  <input disabled={isReadOnly} className="w-full border p-2 rounded" value={item.contactEmail ?? item.email ?? ''} onChange={(e) => setItem((s) => (Object.assign({}, s, { contactEmail: e.target.value, email: e.target.value })))} />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Location / Address</label>
                  <textarea disabled={isReadOnly} rows={2} className="w-full border p-2 rounded" value={item.location ?? ''} onChange={(e) => setItem((s) => (Object.assign({}, s, { location: e.target.value })))} />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">WhatsApp Number</label>
                  <input disabled={isReadOnly} className="w-full border p-2 rounded" value={item.whatsapp ?? ''} onChange={(e) => setItem((s) => (Object.assign({}, s, { whatsapp: e.target.value })))} />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Map Embed URL</label>
                  <input disabled={isReadOnly} className="w-full border p-2 rounded" value={item.mapEmbed ?? ''} onChange={(e) => setItem((s) => (Object.assign({}, s, { mapEmbed: e.target.value })))} placeholder="https://www.google.com/maps/embed?pb=..." />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Quick Answers</label>
                  <div className="space-y-2 mt-2">
                    {(item.quickAnswers || []).map((qa, idx) => (
                      <div key={idx} className="flex gap-2 items-start">
                        <input disabled={isReadOnly} placeholder="Question" className="w-1/3 border p-2 rounded" value={qa.q || ''} onChange={(e) => setItem((s) => { const copy = Object.assign({}, s); copy.quickAnswers = Array.isArray(copy.quickAnswers) ? Array.from(copy.quickAnswers) : []; copy.quickAnswers[idx] = Object.assign({}, copy.quickAnswers[idx] || {}, { q: e.target.value }); return copy; })} />
                        <input disabled={isReadOnly} placeholder="Answer" className="flex-1 border p-2 rounded" value={qa.a || ''} onChange={(e) => setItem((s) => { const copy = Object.assign({}, s); copy.quickAnswers = Array.isArray(copy.quickAnswers) ? Array.from(copy.quickAnswers) : []; copy.quickAnswers[idx] = Object.assign({}, copy.quickAnswers[idx] || {}, { a: e.target.value }); return copy; })} />
                        {!isReadOnly && <button type="button" onClick={() => setItem((s) => { const copy = Object.assign({}, s); copy.quickAnswers = Array.isArray(copy.quickAnswers) ? Array.from(copy.quickAnswers) : []; copy.quickAnswers.splice(idx, 1); return copy; })} className="px-3 py-1 border rounded text-red-600">Remove</button>}
                      </div>
                    ))}

                    {!isReadOnly && <div><button type="button" onClick={() => setItem((s) => (Object.assign({}, s, { quickAnswers: [...(s.quickAnswers || []), { q: '', a: '' }] })))} className="px-3 py-1 rounded border">Add Quick Answer</button></div>}
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center gap-2">
              {!isReadOnly && <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-accent text-white rounded">Save</button>}
              <button onClick={() => setOpen(false)} className="px-4 py-2 border rounded">{isReadOnly ? 'Close' : 'Cancel'}</button>
            </div>
          </>
        )}

        {/* Team-specific fields */}
        {type === 'team' && (
          <>
            {isReadOnly ? (
              <div className="space-y-3">
                <h4 className="font-bold text-lg">{item.name || 'Team Member'}</h4>
                {item.role && <div className="text-gray-700">{item.role}</div>}
                {item.image ? <div className="mt-3"><img src={item.image} alt={item.name || ''} className="max-w-xs rounded" /></div> : null}
                <div className="flex items-center gap-2 mt-4">
                  <button onClick={() => setOpen(false)} className="px-4 py-2 border rounded">Close</button>
                </div>
              </div>
            ) : (
              <div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Name</label>
                  <input disabled={isReadOnly} data-admin-field="teamName" className="w-full border p-2 rounded" value={item.name || ''} onChange={(e) => setItem((s) => (Object.assign({}, s, { name: e.target.value })))} />
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-semibold mb-1">Role</label>
                  <input disabled={isReadOnly} data-admin-field="teamRole" className="w-full border p-2 rounded" value={item.role || ''} onChange={(e) => setItem((s) => (Object.assign({}, s, { role: e.target.value })))} />
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-semibold mb-1">Image</label>
                  <div className="mt-2"><AdminImageUploader value={item.image || ''} onChange={(url) => setItem((s) => (Object.assign({}, s, { image: url })))} /></div>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <button onClick={() => handleSave({ name: item.name, role: item.role, image: item.image })} disabled={loading} className="px-4 py-2 bg-accent text-white rounded">Save</button>
                  <button onClick={() => setOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Service-specific fields */}
        {type === 'service' && (
          <>
            <div>
              <label className="block text-sm font-semibold mb-1">Title</label>
              <input disabled={isReadOnly} className="w-full border p-2 rounded" value={item.title ?? item.name ?? ''} onChange={(e) => setItem((s) => (Object.assign({}, s, { title: e.target.value, name: e.target.value })))} />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Description</label>
              <textarea disabled={isReadOnly} rows={3} className="w-full border p-2 rounded" value={item.description ?? ''} onChange={(e) => setItem((s) => (Object.assign({}, s, { description: e.target.value })))} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Price</label>
                <input disabled={isReadOnly} className="w-full border p-2 rounded" value={item.price ?? ''} onChange={(e) => setItem((s) => (Object.assign({}, s, { price: e.target.value })))} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Image</label>
                <div className="mt-2"><AdminImageUploader value={item.image ?? ''} onChange={(url) => setItem((s) => (Object.assign({}, s, { image: url })))} /></div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Features</label>
              <div className="space-y-2 mt-2">
                {(item.features || []).map((f, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input disabled={isReadOnly} className="flex-1 border p-2 rounded" value={f || ''} onChange={(e) => setItem((s) => { const copy = Object.assign({}, s); copy.features = Array.isArray(copy.features) ? Array.from(copy.features) : []; copy.features[idx] = e.target.value; return copy; })} />
                    {!isReadOnly && <button type="button" onClick={() => setItem((s) => { const copy = Object.assign({}, s); copy.features = Array.isArray(copy.features) ? Array.from(copy.features) : []; copy.features.splice(idx, 1); return copy; })} className="px-3 py-1 border rounded text-red-600">Remove</button>}
                  </div>
                ))}

                {!isReadOnly && <div><button type="button" onClick={() => setItem((s) => (Object.assign({}, s, { features: [...(s.features || []), ''] })))} className="px-3 py-1 rounded border">Add Feature</button></div>}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isReadOnly && <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-accent text-white rounded">Save</button>}
              <button onClick={() => setOpen(false)} className="px-4 py-2 border rounded">{isReadOnly ? 'Close' : 'Cancel'}</button>
            </div>
          </>
        )}

        {/* Product-specific fields */}
        {type === 'product' && (
          <>
            {isReadOnly ? (
              // --- Rich product read-only view (gallery + info + add-to-cart) ---
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Gallery */}
                <div>
                  <div className="bg-white rounded-lg overflow-hidden mb-4 aspect-[4/3] md:aspect-[3/2] relative">
                    <div className="absolute top-3 right-3 z-10">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setOpen(false)} className="px-3 py-1 rounded border bg-white">Close</button>
                      </div>
                    </div>

                    <div className="relative w-full h-full bg-white flex items-center justify-center">
                      {(() => {
                        const images = (item.images && item.images.length > 0) ? item.images : (item.image ? [item.image] : ['https://via.placeholder.com/800x600?text=No+Image']);
                        const idx = typeof item._admin_image_index === 'number' ? item._admin_image_index : 0;
                        const raw = images[idx];
                        const isCloud = raw && raw.includes('res.cloudinary.com');
                        const src = isCloud ? require('@/utils/cloudinary').buildCloudinaryUrlFromFullUrl(raw, { width: 1600, quality: '80', format: null, fit: true }) : raw;
                        return <Image src={src} alt={item.name} fill style={{ objectFit: 'contain' }} sizes="(min-width:1024px) 600px, (min-width:768px) 400px, 100vw" unoptimized={true} />;
                      })()}
                    </div>

                  </div>

                  {/* Thumbnails */}
                  <div className="flex gap-3">
                    {(item.images && item.images.length > 0 ? item.images : (item.image ? [item.image] : [])).map((img, idx) => (
                      <button key={idx} onClick={() => setItem(s => (Object.assign({}, s, { _admin_image_index: idx })))} className={`w-20 h-20 rounded-lg cursor-pointer overflow-hidden ${((item._admin_image_index || 0) === idx) ? 'ring-4 ring-accent' : 'border-2 border-gray-200'}`}>
                        {(() => { const isCloud = img && img.includes('res.cloudinary.com'); const src = isCloud ? require('@/utils/cloudinary').buildCloudinaryUrlFromFullUrl(img, { width: 480, quality: '80', format: null, fit: true }) : img; return <Image src={src} alt={`thumb-${idx}`} width={80} height={80} style={{ objectFit: 'contain' }} unoptimized={true} />; })()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right: Info */}
                <div>
                  <div className="mb-3">
                    <span className="bg-accent text-white px-3 py-1 rounded-full text-sm font-bold">{item.category}</span>
                  </div>

                  <h2 className="text-2xl font-montserrat font-bold text-primary mb-2">{item.name}</h2>
                  <div className="text-gray-700 mb-4 whitespace-pre-wrap">{item.description}</div>

                  <div className="bg-light rounded-lg p-4 mb-4">
                    <div className="text-3xl font-bold text-accent mb-2">KSh {Number(item.price || 0).toLocaleString()}</div>
                    {typeof item.quantity === 'number' ? (
                      item.quantity > 0 ? (
                        <p className="text-green-600 font-bold">In stock: {item.quantity}</p>
                      ) : (
                        <p className="text-red-600 font-bold">Out of stock</p>
                      )
                    ) : (
                      <p className="text-green-600 font-bold">In stock</p>
                    )}
                  </div>

                  {/* Quantity + Add to cart */}
                  <div className="flex gap-3 items-center mb-4">
                    <div className="flex items-center border-2 border-gray-200 rounded-lg">
                      <button onClick={() => setItem(s => (Object.assign({}, s, { _admin_qty: Math.max(1, (s._admin_qty || 1) - 1) })))} className="px-3 py-2">-</button>
                      <span className="px-6 py-2 font-bold text-primary">{item._admin_qty || 1}</span>
                      <button onClick={() => setItem(s => (Object.assign({}, s, { _admin_qty: (s._admin_qty || 1) + 1 })))} className="px-3 py-2">+</button>
                    </div>

                    {typeof item.quantity === 'number' && item.quantity <= 0 ? (
                      <button onClick={() => setNotifyOpen(true)} className="bg-gray-200 text-gray-800 font-bold py-3 px-5 rounded-lg transition">Read more</button>
                    ) : (
                      <button onClick={() => {
                        try {
                          // add to cart (admin modal view)
                          const qty = item._admin_qty || 1;
                          if (typeof item.quantity === 'number' && qty > item.quantity) {
                            alert('Requested quantity exceeds available stock.');
                            return;
                          }
                          const cart = JSON.parse(localStorage.getItem('cart') || '[]');
                          const rawImg = (item.images && item.images.length > 0) ? item.images[0] : item.image;
                          const existing = cart.find(c => c.id === item.id);
                          if (existing) existing.quantity = (existing.quantity || 1) + qty; else cart.push({ id: item.id, name: item.name, price: Number(item.price || 0), image: rawImg, category: item.category, quantity: qty });
                          localStorage.setItem('cart', JSON.stringify(cart));
                          window.dispatchEvent(new Event('cartUpdated'));
                          alert(`Added ${qty} item(s) to cart`);
                        } catch (e) { console.error(e); alert('Failed to add to cart'); }
                      }} className="bg-accent hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition flex items-center gap-2">
                        <ShoppingCart size={18} /> Add to Cart
                      </button>
                    )}

                    <Link href={`/product/${item.id}`} className="px-4 py-2 border-2 border-accent text-accent hover:bg-accent hover:text-white rounded-lg transition">View full product page</Link>
                  </div>

                  {/* Specifications */}
                  <div className="mb-4">
                    <h4 className="font-bold mb-2">Specifications</h4>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">{item.specifications}</div>
                  </div>

                  {/* Attachments */}
                  {Array.isArray(item.attachments) && item.attachments.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-bold mb-2">Attachments</h4>
                      <ul className="list-disc ml-5 text-sm">
                        {item.attachments.map((a, idx) => <li key={idx}><a className="text-accent" href={a.url} target="_blank" rel="noreferrer">{a.name || a.url}</a></li>)}
                      </ul>
                    </div>
                  )}

                  {/* Related (small) */}
                  {Array.isArray(item.related) && item.related.length > 0 && (
                    <div>
                      <h4 className="font-bold mb-2">Related</h4>
                      <div className="flex gap-3 overflow-x-auto">
                        {item.related.slice(0,6).map((rid) => (
                          <Link key={rid} href={`/product/${rid}`} className="border rounded p-2 min-w-[160px]">View #{rid}</Link>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            ) : (
              <div>
                <AdminProductForm initial={item || {}} onCancel={() => setOpen(false)} onSave={async (payload) => { await handleSave(payload); }} />
              </div>
            )}
          </>
        )}

        {/* Tutorial-specific fields */}
        {type === 'tutorial' && (
          <>
            {isReadOnly ? (
              <div className="space-y-3">
                <h4 className="font-bold text-lg">{item.title}</h4>
                {item.excerpt ? <div className="text-gray-700">{item.excerpt}</div> : null}
                {item.thumbnail ? <div className="mt-3"><img src={item.thumbnail} alt="" className="max-w-xs rounded" /></div> : null}
                <div className="prose mt-4" dangerouslySetInnerHTML={{ __html: item.content || '' }}></div>
                <div className="flex items-center gap-2 mt-4">
                  <button onClick={() => setOpen(false)} className="px-4 py-2 border rounded">Close</button>
                </div>
              </div>
            ) : (
              <div>
                <AdminTutorialForm initial={item || {}} onCancel={() => setOpen(false)} onSave={async (payload) => { await handleSave(payload); }} />
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg w-[min(960px,95%)] max-h-[90vh] overflow-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">{mode === 'upload' ? 'Upload' : (mode === 'view' ? 'View' : (mode === 'new' ? 'Create' : 'Edit'))} {type}</h3>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 rounded border" onClick={() => setOpen(false)}>Close</button>
          </div>
        </div>

        {renderBody()}

      </div>
    </div>

  );
}