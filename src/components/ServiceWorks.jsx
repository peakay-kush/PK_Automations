'use client';

import { useState, useEffect } from 'react';
import { Download, ChevronDown, ChevronUp, Edit2, Plus } from 'lucide-react';
import Link from 'next/link';
import { getToken, fetchProfile } from '@/utils/auth';
import EditWorkModal from '@/components/EditWorkModal';



export default function ServiceWorks({ works = [], publish = false, serviceId }) {
  const [worksState, setWorksState] = useState(Array.isArray(works) ? works : []);
  const [editingIdx, setEditingIdx] = useState(-1);
  const [editingWork, setEditingWork] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [openIdx, setOpenIdx] = useState(-1);

  const token = getToken();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function check() {
      if (!token) {
        if (mounted) setIsAdmin(false);
        return;
      }
      try {
        const profile = await fetchProfile();
        if (!mounted) return;
        if (profile && (profile.role === 'admin' || profile.role === 'super' || profile.is_staff || profile.is_admin)) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (e) {
        if (mounted) setIsAdmin(false);
      }
    }
    check();
    return () => { mounted = false; };
  }, [token]);

  function toggle(i) {
    setOpenIdx((prev) => (prev === i ? -1 : i));
  }

  async function handleSaveWork(updatedWork) {
    try {
      const newWorks = editingIdx >= 0 ? worksState.map((w, i) => (i === editingIdx ? updatedWork : w)) : [...worksState, updatedWork];
      const res = await fetch(`/api/admin/services/${serviceId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ works: newWorks }) });
      if (!res.ok) throw new Error('Failed to save work');
      const data = await res.json();
      const svc = data && data.service ? data.service : data;
      setWorksState(svc.works || []);
      setModalOpen(false);
      setEditingIdx(-1);
      setEditingWork(null);
    } catch (err) {
      alert('Error saving work: ' + String(err));
    }
  }


  if (!worksState || worksState.length === 0) {
    return (
      <div className="text-center">
        <div className="text-gray-500 mb-4">No published work for this service yet.</div>
        {isAdmin ? (
          <div className="flex items-center justify-center"> 
            <button onClick={() => { setEditingIdx(-1); setEditingWork({ title: '', description: '', attachments: [] }); setModalOpen(true); }} className="bg-accent text-white px-4 py-2 rounded shadow inline-flex items-center gap-2 hover:opacity-95">
              <Plus /> Add Work
            </button>
          </div>
        ) : null}

        {modalOpen && (
          <EditWorkModal initial={editingWork} onClose={() => { setModalOpen(false); setEditingIdx(-1); setEditingWork(null); }} onSave={handleSaveWork} />
        )}
      </div>
    );
  }

  return (
    <div>
      {isAdmin && (
        <div className="mb-4 flex items-center gap-3">
          <button onClick={() => { setEditingIdx(-1); setEditingWork({ title: '', description: '', attachments: [] }); setModalOpen(true); }} className="bg-accent text-white px-4 py-2 rounded shadow inline-flex items-center gap-2 hover:opacity-95"><Plus /> Add Work</button>
        </div>
      )}

      <div className="space-y-3">
        {worksState.map((w, idx) => (
          <div key={idx} className="border rounded overflow-hidden">
            <div className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50">
              <div className="text-left flex items-center gap-3">
                <button onClick={() => toggle(idx)} aria-expanded={openIdx === idx} className="text-left w-full text-left">
                  <div className="font-montserrat text-2xl md:text-3xl font-extrabold text-primary tracking-tight leading-tight hover:text-accent transition-colors text-left">{w.title || 'Untitled work'}</div>
                </button>
                {isAdmin ? <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{((w.attachments || []).filter(a => a && a.mime && (a.mime.startsWith('image/') || a.mime.startsWith('video/')))).length ? `${((w.attachments || []).filter(a => a && a.mime && (a.mime.startsWith('image/') || a.mime.startsWith('video/')))).length} file(s)` : ''}</span> : null}
                <button onClick={() => toggle(idx)} className="px-3 py-1 rounded bg-white/50 inline-flex items-center gap-2">{openIdx === idx ? <ChevronUp /> : <ChevronDown />}</button>
              </div>
            </div>

            {openIdx === idx && (
              <div className="p-4 bg-white border-t">
                {w.description ? (
                  <div className="mb-3">
                    <div className="border-l-4 border-accent pl-4 text-gray-700 leading-relaxed space-y-3">
                      {w.description.split(/\n\s*\n/).map((para, pi) => (
                        <p key={pi} className="whitespace-pre-wrap">{para}</p>
                      ))}
                    </div>
                  </div>
                ) : null}

                {(w.attachments || []).filter(a => a && a.mime && (a.mime.startsWith('image/') || a.mime.startsWith('video/'))).length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                    {(w.attachments || []).filter(a => a && a.mime && (a.mime.startsWith('image/') || a.mime.startsWith('video/'))).map((a, i) => {
                      const origIdx = (w.attachments || []).indexOf(a);
                      return (
                        <div key={origIdx} className="border rounded p-3">
                          {a.mime && a.mime.startsWith('image/') ? (
                            <img src={a.url} alt={a.name || 'file'} className="w-full h-80 object-contain mb-2" draggable={false} onContextMenu={(e) => e.preventDefault()} />
                          ) : a.mime && a.mime.startsWith('video/') ? (
                            <video src={a.url} controls controlsList="nodownload" className="w-full h-80 object-contain mb-2" onContextMenu={(e) => e.preventDefault()} />
                          ) : null}

                          <div className="flex items-center justify-between">
                            <div className="text-sm truncate">{a.name}</div>
                            {isAdmin ? (
                              <a className="inline-flex items-center gap-2 text-accent" href={a.url} target="_blank" rel="noreferrer"><Download /> Download</a>
                            ) : (
                              <Link href={`/contact?topic=request-quote&type=service&serviceId=${serviceId}&workIdx=${idx}&attachmentIdx=${origIdx}`} className="inline-flex items-center gap-2 text-accent font-bold">Request Quote</Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )} 
              </div>
            )}
          </div>
        ))}
      </div>

      {modalOpen && (
        <EditWorkModal initial={editingWork} onClose={() => { setModalOpen(false); setEditingIdx(-1); setEditingWork(null); }} onSave={handleSaveWork} />
      )}
    </div>
  );
}
