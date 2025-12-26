'use client';

import { useState, useEffect } from 'react';
import AdminImageUploader from './AdminImageUploader';

export default function AdminPageForm({ initial = {}, onCancel, onSave }) {
  const [form, setForm] = useState({
    id: initial.id || '',
    title: initial.title || '',
    heroImage: initial.heroImage || initial.image || '',
    heroTitle: initial.heroTitle || '',
    heroSubtitle: initial.heroSubtitle || '',
    ctaPrimaryText: initial.ctaPrimaryText || initial.ctaSectionPrimaryText || '',
    ctaPrimaryHref: initial.ctaPrimaryHref || '',
    ctaSecondaryText: initial.ctaSecondaryText || initial.ctaSectionSecondaryText || '',
    ctaSecondaryHref: initial.ctaSecondaryHref || '',
    content: initial.content || '',
    servicesTitle: initial.servicesTitle || '',
    studentHubTitle: initial.studentHubTitle || '',
    studentHubContent: initial.studentHubContent || '',
    studentHubImage: initial.studentHubImage || initial.studentImage || '',
    studentHubCTAText: initial.studentHubCTAText || '',
    studentHubCTAHref: initial.studentHubCTAHref || '/student-hub',
    studentHubBullets: Array.isArray(initial.studentHubBullets) ? initial.studentHubBullets : (initial.studentHubBullets ? initial.studentHubBullets.split(/\r?\n/).map(x => x.trim()).filter(Boolean) : [
      'Project Consultation & Guidance',
      'DIY Tutorials & Code Samples',
      'Proteus/Multisim Support',
      'AutoCAD floor plan drawings',
      'Custom Project Kits'
    ]),
    testimonialsTitle: initial.testimonialsTitle || '',
    ctaSectionTitle: initial.ctaSectionTitle || '',
    ctaSectionText: initial.ctaSectionText || '',
    ctaSectionPrimaryText: initial.ctaSectionPrimaryText || '',
    ctaSectionSecondaryText: initial.ctaSectionSecondaryText || '',
    contactPhone: initial.contactPhone || initial.phone || '',
    contactEmail: initial.contactEmail || initial.email || '',
    location: initial.location || '',
    whatsapp: initial.whatsapp || '',
    mapEmbed: initial.mapEmbed || '',
    quickAnswers: Array.isArray(initial.quickAnswers) ? initial.quickAnswers : (initial.quickAnswers ? initial.quickAnswers.split(/\r?\n/).map(x => ({ q: '', a: x })) : [])
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // auto-generate id (slug) from title when creating new
    if (!initial.id && form.title) {
      const slug = form.title.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
      setForm((f) => ({ ...f, id: f.id || slug }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.title]);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!form.id) throw new Error('Page id (slug) is required');
      const payload = {
        id: form.id,
        title: form.title,
        heroImage: form.heroImage,
        heroTitle: form.heroTitle,
        heroSubtitle: form.heroSubtitle,
        ctaPrimaryText: form.ctaPrimaryText,
        ctaPrimaryHref: form.ctaPrimaryHref,
        ctaSecondaryText: form.ctaSecondaryText,
        ctaSecondaryHref: form.ctaSecondaryHref,
        servicesTitle: form.servicesTitle,
        studentHubTitle: form.studentHubTitle,
        studentHubContent: form.studentHubContent,
        studentHubImage: form.studentHubImage || '',
        studentHubCTAText: form.studentHubCTAText || '',
        studentHubCTAHref: form.studentHubCTAHref || '/student-hub',
        studentHubBullets: Array.isArray(form.studentHubBullets) ? form.studentHubBullets : (typeof form.studentHubBullets === 'string' ? form.studentHubBullets.split(/\r?\n/).map(x => x.trim()).filter(Boolean) : (form.studentHubBullets || [])), 
        testimonialsTitle: form.testimonialsTitle,
        ctaSectionTitle: form.ctaSectionTitle,
        ctaSectionText: form.ctaSectionText,
        ctaSectionPrimaryText: form.ctaSectionPrimaryText,
        ctaSectionSecondaryText: form.ctaSectionSecondaryText,
        content: form.content,
        contactPhone: form.contactPhone || form.phone || '',
        contactEmail: form.contactEmail || form.email || '',
        location: form.location || '',
        whatsapp: form.whatsapp || '',
        mapEmbed: form.mapEmbed || '',
        quickAnswers: Array.isArray(form.quickAnswers) ? form.quickAnswers : (typeof form.quickAnswers === 'string' ? form.quickAnswers.split(/\r?\n/).map(x => x.trim()).filter(Boolean) : (form.quickAnswers || []))
      };

      await onSave(payload);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="text-red-600">{error}</div>}

      <div>
        <label className="block text-sm font-medium">Page ID (slug)</label>
        <input className="mt-1 w-full rounded border px-3 py-2" value={form.id} onChange={(e) => update('id', e.target.value)} />
      </div>

      <div>
        <label className="block text-sm font-medium">Title</label>
        <input className="mt-1 w-full rounded border px-3 py-2" value={form.title} onChange={(e) => update('title', e.target.value)} />
      </div>

      <div>
        <label className="block text-sm font-medium">Hero Image</label>
        <div className="mt-2">
          <AdminImageUploader value={form.heroImage} onChange={(v) => update('heroImage', v)} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Hero Title</label>
        <input className="mt-1 w-full rounded border px-3 py-2" value={form.heroTitle || ''} onChange={(e) => update('heroTitle', e.target.value)} placeholder="Hero title" />
      </div>

      <div>
        <label className="block text-sm font-medium">Hero Subtitle</label>
        <textarea rows={3} className="mt-1 w-full rounded border px-3 py-2" value={form.heroSubtitle || ''} onChange={(e) => update('heroSubtitle', e.target.value)} placeholder="Hero subtitle" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Primary CTA Text</label>
          <input className="mt-1 w-full rounded border px-3 py-2" value={form.ctaPrimaryText || ''} onChange={(e) => update('ctaPrimaryText', e.target.value)} placeholder="Shop Components" />
        </div>
        <div>
          <label className="block text-sm font-medium">Primary CTA Href</label>
          <input className="mt-1 w-full rounded border px-3 py-2" value={form.ctaPrimaryHref || ''} onChange={(e) => update('ctaPrimaryHref', e.target.value)} placeholder="/shop" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Secondary CTA Text</label>
          <input className="mt-1 w-full rounded border px-3 py-2" value={form.ctaSecondaryText || ''} onChange={(e) => update('ctaSecondaryText', e.target.value)} placeholder="Explore Services" />
        </div>
        <div>
          <label className="block text-sm font-medium">Secondary CTA Href</label>
          <input className="mt-1 w-full rounded border px-3 py-2" value={form.ctaSecondaryHref || ''} onChange={(e) => update('ctaSecondaryHref', e.target.value)} placeholder="/services" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Services Section Title</label>
        <input className="mt-1 w-full rounded border px-3 py-2" value={form.servicesTitle || ''} onChange={(e) => update('servicesTitle', e.target.value)} placeholder="Our Services" />
      </div>

      <div>
        <label className="block text-sm font-medium">Student Hub Title</label>
        <input className="mt-1 w-full rounded border px-3 py-2" value={form.studentHubTitle || ''} onChange={(e) => update('studentHubTitle', e.target.value)} placeholder="Student Hub" />
      </div>

      <div>
        <label className="block text-sm font-medium">Student Hub Content</label>
        <textarea rows={4} className="mt-1 w-full rounded border px-3 py-2" value={form.studentHubContent || ''} onChange={(e) => update('studentHubContent', e.target.value)} placeholder="Student Hub description" />
      </div>

      <div>
        <label className="block text-sm font-medium">Student Hub Image</label>
        <div className="mt-2">
          <AdminImageUploader value={form.studentHubImage} onChange={(v) => update('studentHubImage', v)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Student Hub CTA Text</label>
          <input className="mt-1 w-full rounded border px-3 py-2" value={form.studentHubCTAText || ''} onChange={(e) => update('studentHubCTAText', e.target.value)} placeholder="Explore Student Hub" />
        </div>
        <div>
          <label className="block text-sm font-medium">Student Hub CTA Href</label>
          <input className="mt-1 w-full rounded border px-3 py-2" value={form.studentHubCTAHref || ''} onChange={(e) => update('studentHubCTAHref', e.target.value)} placeholder="/student-hub" />
        </div>
      </div> 

      <div>
        <label className="block text-sm font-medium">Student Hub Bullets</label>
        <div className="space-y-2 mt-2">
          {(form.studentHubBullets || []).map((b, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input className="flex-1 border p-2 rounded" value={b || ''} onChange={(e) => update('studentHubBullets', (form.studentHubBullets || []).map((x,i) => i === idx ? e.target.value : x))} />
              <button type="button" onClick={() => update('studentHubBullets', (form.studentHubBullets || []).filter((_,i) => i !== idx))} className="px-3 py-1 border rounded text-red-600">Remove</button>
            </div>
          ))}

          <div>
            <button type="button" onClick={() => update('studentHubBullets', [...(form.studentHubBullets || []), ''])} className="px-3 py-1 rounded border">Add Bullet</button>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Testimonials Title</label>
        <input className="mt-1 w-full rounded border px-3 py-2" value={form.testimonialsTitle || ''} onChange={(e) => update('testimonialsTitle', e.target.value)} placeholder="What Our Customers Say" />
      </div>

      <div>
        <label className="block text-sm font-medium">CTA Section Title</label>
        <input className="mt-1 w-full rounded border px-3 py-2" value={form.ctaSectionTitle || ''} onChange={(e) => update('ctaSectionTitle', e.target.value)} placeholder="Ready to Get Started?" />
      </div>

      <div>
        <label className="block text-sm font-medium">CTA Section Text</label>
        <textarea rows={3} className="mt-1 w-full rounded border px-3 py-2" value={form.ctaSectionText || ''} onChange={(e) => update('ctaSectionText', e.target.value)} placeholder="Join thousands of customers..." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">CTA Primary Button Text</label>
          <input className="mt-1 w-full rounded border px-3 py-2" value={form.ctaSectionPrimaryText || ''} onChange={(e) => update('ctaSectionPrimaryText', e.target.value)} placeholder="Start Shopping" />
        </div>
        <div>
          <label className="block text-sm font-medium">CTA Secondary Button Text</label>
          <input className="mt-1 w-full rounded border px-3 py-2" value={form.ctaSectionSecondaryText || ''} onChange={(e) => update('ctaSectionSecondaryText', e.target.value)} placeholder="Contact Us" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Content</label>
        <textarea rows={8} className="mt-1 w-full rounded border px-3 py-2" value={form.content} onChange={(e) => update('content', e.target.value)} />
      </div>

      {/* Contact fields and quick answers are only relevant for the Contact page */}
      {(form.id === 'contact') && (
        <>
          <div>
            <label className="block text-sm font-medium">Contact Phone</label>
            <input className="mt-1 w-full rounded border px-3 py-2" value={form.contactPhone || form.phone || ''} onChange={(e) => update('contactPhone', e.target.value)} placeholder="+254 700 000 000" />
          </div>

          <div>
            <label className="block text-sm font-medium">Contact Email</label>
            <input className="mt-1 w-full rounded border px-3 py-2" value={form.contactEmail || form.email || ''} onChange={(e) => update('contactEmail', e.target.value)} placeholder="hello@example.com" />
          </div>

          <div>
            <label className="block text-sm font-medium">Location / Address</label>
            <input className="mt-1 w-full rounded border px-3 py-2" value={form.location || ''} onChange={(e) => update('location', e.target.value)} placeholder="Nairobi, Kenya" />
          </div>

          <div>
            <label className="block text-sm font-medium">WhatsApp</label>
            <input className="mt-1 w-full rounded border px-3 py-2" value={form.whatsapp || ''} onChange={(e) => update('whatsapp', e.target.value)} placeholder="+254700000000" />
          </div>

          <div>
            <label className="block text-sm font-medium">Map Embed URL</label>
            <input className="mt-1 w-full rounded border px-3 py-2" value={form.mapEmbed || ''} onChange={(e) => update('mapEmbed', e.target.value)} placeholder="https://www.google.com/maps/embed?..." />
          </div>

          <div>
            <label className="block text-sm font-medium">Quick Answers</label>
            <div className="space-y-2 mt-2">
              {(form.quickAnswers || []).map((qa, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <input className="w-1/3 border p-2 rounded" placeholder="Question" value={qa.q || ''} onChange={(e) => update('quickAnswers', (form.quickAnswers || []).map((x,i) => i === idx ? Object.assign({}, x, { q: e.target.value }) : x))} />
                  <input className="flex-1 border p-2 rounded" placeholder="Answer" value={qa.a || ''} onChange={(e) => update('quickAnswers', (form.quickAnswers || []).map((x,i) => i === idx ? Object.assign({}, x, { a: e.target.value }) : x))} />
                  <button type="button" onClick={() => update('quickAnswers', (form.quickAnswers || []).filter((_,i) => i !== idx))} className="px-3 py-1 border rounded text-red-600">Remove</button>
                </div>
              ))}

              <div>
                <button type="button" onClick={() => update('quickAnswers', [...(form.quickAnswers || []), { q: '', a: '' }])} className="px-3 py-1 rounded border">Add Quick Answer</button>
              </div>
            </div>
          </div>
        </>
      )} 

      <div className="flex items-center gap-3">
        <button type="submit" disabled={loading} className="bg-accent text-white px-4 py-2 rounded">{loading ? 'Saving...' : 'Save'}</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded border">Cancel</button>
      </div>
    </form>
  );
}
