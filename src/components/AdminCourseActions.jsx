'use client';

import { useEffect, useState } from 'react';
import { getToken } from '@/utils/auth';
import { Plus, UploadCloud, Trash2, Edit3, Save, File as FileIcon, ChevronDown, ChevronUp } from 'lucide-react';


export default function AdminCourseActions({ tutorial, setTutorial, showTopics = true }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newFiles, setNewFiles] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newVideos, setNewVideos] = useState([]);

  const [topicEditing, setTopicEditing] = useState({}); // idx -> true
  const [editingData, setEditingData] = useState({}); // idx -> { title, description, media }
  const [editBusy, setEditBusy] = useState({});
  const [openTopics, setOpenTopics] = useState({}); // idx -> expanded boolean

  useEffect(() => {
    const handler = (e) => {
      if (e && e.detail) setEditMode(!!e.detail.editMode);
      else setEditMode(localStorage.getItem('pkat_admin_edit') === '1');
    };
    handler();
    window.addEventListener('adminEditModeChanged', handler);

    // listen for global add-course from toolbar
    const addHandler = (e) => {
      setShowAddForm(true);
    };
    window.addEventListener('adminAddCourse', addHandler);

    // optimistic token presence
    try { if (localStorage.getItem('pkat_token')) setIsAdmin(true); } catch (e) {}

    (async () => {
      try {
        const auth = await import('@/utils/auth');
        const profile = await auth.fetchProfile();
        if (profile && (profile.role === 'admin' || profile.role === 'super')) setIsAdmin(true);
        else setIsAdmin(false);
      } catch (e) {
        // keep optimistic
      }
    })();

    return () => {
      window.removeEventListener('adminEditModeChanged', handler);
      window.removeEventListener('adminAddCourse', addHandler);
    };
  }, []);

  if (!isAdmin || !editMode) return null;

  function addTopic() {
    // show the add-course form where admin can specify title, description and upload files
    setShowAddForm(true);
    setNewTitle('');
    setNewDescription('');
    setNewFiles([]);
  }

  function updateTopic(idx, payload) {
    setTutorial((t) => {
      const copy = JSON.parse(JSON.stringify(t || {}));
      copy.topics = copy.topics || [];
      copy.topics[idx] = { ...copy.topics[idx], ...payload };
      return copy;
    });
    setDirty(true);
  }

  function removeTopic(idx) {
    if (!confirm('Delete this course/topic?')) return;
    setTutorial((t) => {
      const copy = JSON.parse(JSON.stringify(t || {}));
      copy.topics = copy.topics || [];
      copy.topics.splice(idx, 1);
      return copy;
    });
    setDirty(true);
  }

  async function uploadFiles(idx, files) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const token = getToken();
      const added = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const fd = new FormData(); fd.append('file', f);
        const res = await fetch('/api/admin/uploads', { method: 'POST', body: fd, headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j && j.error ? j.error : 'Upload failed');
        }
        const j = await res.json();
        const url = j && j.url;
        const type = f.type && f.type.startsWith && f.type.startsWith('video') ? 'video' : 'image';
        const item = { type, url, title: f.name };
        added.push(item);
      }
      // attach added media to topic
      setTutorial((t) => {
        const copy = JSON.parse(JSON.stringify(t || {}));
        copy.topics = copy.topics || [];
        copy.topics[idx] = copy.topics[idx] || { title: 'Topic', media: [] };
        copy.topics[idx].media = [...(copy.topics[idx].media || []), ...added];
        return copy;
      });
      setDirty(true);
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Uploaded successfully', type: 'success' } }));
    } catch (err) {
      alert(String(err));
    } finally { setBusy(false); }
  }

  async function uploadFilesForNewTopic(files) {
    if (!files || files.length === 0) return [];
    setBusy(true);
    try {
      const token = getToken();
      const added = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const fd = new FormData(); fd.append('file', f);
        const res = await fetch('/api/admin/uploads', { method: 'POST', body: fd, headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j && j.error ? j.error : 'Upload failed');
        }
        const j = await res.json();
        const url = j && j.url;
        const type = f.type && f.type.startsWith && f.type.startsWith('video') ? 'video' : 'image';
        const item = { type, url, title: f.name };
        added.push(item);
      }
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Uploaded successfully', type: 'success' } }));
      return added;
    } catch (err) {
      alert(String(err));
      return [];
    } finally { setBusy(false); }
  }

  async function removeMedia(topicIdx, mediaIdx) {
    if (!confirm('Delete this media?')) return;
    setTutorial((t) => {
      const copy = JSON.parse(JSON.stringify(t || {}));
      copy.topics = copy.topics || [];
      if (!copy.topics[topicIdx] || !copy.topics[topicIdx].media) return copy;
      copy.topics[topicIdx].media.splice(mediaIdx, 1);
      return copy;
    });
    setDirty(true);
  }

  // helper to delete a topic with persistence
  async function deleteTopic(tIdx) {
    if (!confirm('Delete this course/topic?')) return;
    setEditBusy((b) => ({ ...b, [tIdx]: true }));
    try {
      const token = getToken();
      const copy = JSON.parse(JSON.stringify(tutorial || {}));
      copy.topics = copy.topics || [];
      copy.topics.splice(tIdx, 1);
      const res = await fetch(`/api/admin/tutorials/${tutorial.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify({ topics: copy.topics }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j && j.error ? j.error : 'Delete failed');
      setTutorial(copy);
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Course deleted', type: 'success' } }));
    } catch (err) {
      alert(String(err));
    } finally { setEditBusy((b) => ({ ...b, [tIdx]: false })); }
  }

  async function saveChanges() {
    if (!tutorial || !tutorial.id) return alert('Missing tutorial id');
    setBusy(true);
    try {
      const token = getToken();
      const payload = { topics: tutorial.topics || [] };
      const res = await fetch(`/api/admin/tutorials/${tutorial.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify(payload) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j && j.error ? j.error : 'Save failed');
      window.dispatchEvent(new CustomEvent('adminUpdated', { detail: { type: 'tutorial', id: tutorial.id } }));
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Saved successfully', type: 'success' } }));
      setDirty(false);
    } catch (err) {
      alert(String(err));
    } finally { setBusy(false); }
  }


  return (
    <div>

      {showAddForm && (
        <div className="bg-white rounded-lg p-4 shadow-md mb-6">
          <h3 className="font-bold text-lg text-primary mb-2">New Course</h3>
          <input className="w-full border p-2 rounded mb-2 bg-white text-gray-900 placeholder-gray-400" placeholder="Course title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          <div className="mb-2">
            <textarea rows={5} className="w-full border p-2 rounded" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Course description" />
          </div>
          <div className="mb-2 grid grid-cols-3 gap-3">
            <label className="inline-flex flex-col items-start gap-2 bg-white text-primary font-medium px-3 py-2 rounded border cursor-pointer">
              Select images
              <input type="file" multiple accept="image/*" onChange={(e) => setNewImages(Array.from(e.target.files))} className="hidden" />
            </label>
            <label className="inline-flex flex-col items-start gap-2 bg-white text-primary font-medium px-3 py-2 rounded border cursor-pointer">
              Select videos
              <input type="file" multiple accept="video/*" onChange={(e) => setNewVideos(Array.from(e.target.files))} className="hidden" />
            </label>

          </div>

          {(newImages.length > 0 || newVideos.length > 0) && (
            <div className="mb-2">
              <div className="text-sm text-gray-600 mb-1">Files to upload:</div>
              <ul className="list-disc ml-5 text-sm text-gray-700">
                {newImages.map((f, i) => <li key={`img-${i}`}>Image: {f.name} ({Math.round(f.size/1024)} KB)</li>)}
                {newVideos.map((f, i) => <li key={`vid-${i}`}>Video: {f.name} ({Math.round(f.size/1024)} KB)</li>)}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button onClick={async () => {
              if (!newTitle) return alert('Please provide a title');
              setBusy(true);
              try {
                // upload per-type files
                const imgs = await uploadFilesForNewTopic(newImages || []);
                const vids = await uploadFilesForNewTopic(newVideos || []);
                const media = [...imgs, ...vids];

                const newTopic = { title: newTitle, description: newDescription, media };

                // Prepare updated topics array
                const updatedTopics = [...(tutorial?.topics || []), newTopic];

                // Persist immediately
                const token = getToken();
                const res = await fetch(`/api/admin/tutorials/${tutorial.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
                  body: JSON.stringify({ topics: updatedTopics })
                });
                const j = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(j && j.error ? j.error : 'Save failed');

                // Update local state with saved tutorial (ensure images/thumbnail preserved)
                const updatedTutorial = { ...(tutorial || {}), topics: updatedTopics };
                setTutorial(updatedTutorial);
                setDirty(false);

                setShowAddForm(false);
                setNewTitle(''); setNewDescription(''); setNewImages([]); setNewVideos([]);
              } finally { setBusy(false); }
            }} className="bg-white text-primary border border-accent font-bold px-4 py-2 rounded shadow-sm hover:bg-gray-50">Add Course</button>

            <button onClick={() => { setShowAddForm(false); setNewTitle(''); setNewDescription(''); setNewFiles([]); }} className="bg-white text-gray-700 border border-gray-200 px-3 py-2 rounded hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {/* Topics list (display-only while edit mode is on) */}
      <div className={`space-y-4 ${!showTopics ? 'hidden' : ''}`}>
        {(tutorial?.topics || []).map((topic, tIdx) => {
          const isVisible = topic && ((topic.title && topic.title.trim()) || (topic.description && topic.description.trim()) || (Array.isArray(topic.media) && topic.media.length > 0));
          if (!isVisible) return null;
          return (
            <div id={`topic-${tIdx}`} key={tIdx} className="bg-white rounded-lg p-4 shadow-sm relative overflow-hidden">
    

              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {isAdmin && editMode && (
                    <div className="flex items-center justify-end mb-2 gap-2">
                      <button onClick={() => { setTopicEditing((s) => ({ ...s, [tIdx]: true })); setEditingData((s) => ({ ...s, [tIdx]: { title: topic.title || '', description: topic.description || '', media: topic.media || [] } })); setOpenTopics((s) => ({ ...s, [tIdx]: true })); }} className="bg-white border border-gray-200 text-primary p-1 rounded-full shadow-sm hover:bg-gray-50" title="Edit"><Edit3 size={14} /></button>
                      <button onClick={() => deleteTopic(tIdx)} className="bg-white border border-gray-200 text-red-600 p-1 rounded-full shadow-sm hover:bg-red-50" title="Delete"><Trash2 size={14} /></button>
                    </div>
                  )}

                  {topicEditing[tIdx] ? (
                    <>
                    <input className="w-full border p-2 rounded mb-2 bg-white text-gray-900 placeholder-gray-400" value={editingData[tIdx]?.title || ''} onChange={(e) => setEditingData((s) => ({ ...s, [tIdx]: { ...(s[tIdx] || {}), title: e.target.value } }))} />
                    <div className="mb-2">
                      <textarea rows={5} className="w-full border p-2 rounded" value={editingData[tIdx]?.description || ''} onChange={(e) => setEditingData((s) => ({ ...s, [tIdx]: { ...(s[tIdx] || {}), description: e.target.value } }))} />
                    </div>
                      <div className="mb-2">
                        <label className="px-3 py-2 bg-accent text-white font-medium rounded cursor-pointer inline-flex items-center gap-2 shadow-sm hover:opacity-90">
                          Add images
                          <input type="file" multiple accept="image/*" className="hidden" onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            const added = await uploadFiles(tIdx, files);
                            setEditingData((s) => ({ ...s, [tIdx]: { ...(s[tIdx] || {}), media: ((s[tIdx] && s[tIdx].media) || []).concat(added) } }));
                          }} />
                        </label>
                        <label className="px-3 py-2 bg-indigo-600 text-white font-medium rounded cursor-pointer inline-flex items-center gap-2 ml-2 shadow-sm hover:opacity-90">
                          Add videos
                          <input type="file" multiple accept="video/*" className="hidden" onChange={async (e) => { const files = Array.from(e.target.files || []); const added = await uploadFiles(tIdx, files); setEditingData((s) => ({ ...s, [tIdx]: { ...(s[tIdx] || {}), media: ((s[tIdx] && s[tIdx].media) || []).concat(added) } })); }} />
                        </label>

                      </div>

                      <div className="flex items-center gap-2">
                        <button onClick={async () => {
                          setEditBusy((b) => ({ ...b, [tIdx]: true }));
                          try {
                            const token = getToken();
                            const copy = JSON.parse(JSON.stringify(tutorial || {}));
                            copy.topics = copy.topics || [];
                            copy.topics[tIdx] = { ...(copy.topics[tIdx] || {}), ...(editingData[tIdx] || {}) };
                            const res = await fetch(`/api/admin/tutorials/${tutorial.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify({ topics: copy.topics }) });
                            const j = await res.json().catch(() => ({}));
                            if (!res.ok) throw new Error(j && j.error ? j.error : 'Save failed');
                            setTutorial(copy);
                            setTopicEditing((s) => ({ ...s, [tIdx]: false }));
                            setEditingData((s) => { const c = { ...s }; delete c[tIdx]; return c; });
                            window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Topic saved', type: 'success' } }));
                          } catch (err) {
                            alert(String(err));
                          } finally { setEditBusy((b) => ({ ...b, [tIdx]: false })); }
                        }} className="bg-accent text-white px-3 py-1 rounded">Save</button>

                      <button onClick={() => { setTopicEditing((s) => ({ ...s, [tIdx]: false })); setEditingData((s) => { const c = { ...s }; delete c[tIdx]; return c; }); }} className="bg-white text-gray-700 border border-gray-200 px-3 py-1 rounded hover:bg-gray-50">Cancel</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="font-montserrat font-bold text-lg text-primary mb-3">
                        <button onClick={() => {
                          const newVal = !openTopics[tIdx];
                          setOpenTopics((s) => ({ ...(s || {}), [tIdx]: newVal }));
                          if (newVal) { setTimeout(() => { const el = document.getElementById(`topic-${tIdx}`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50); }
                        }} aria-expanded={!!openTopics[tIdx]} className="flex items-center gap-3 w-full text-left">
                          <span className="flex-1">{topic.title}</span>
                          <span className="text-sm text-gray-600">{openTopics[tIdx] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
                        </button>
                      </h3>

                      {openTopics[tIdx] && (
                        <>
                          {topic.description && <div className="text-gray-700 mb-2 whitespace-pre-wrap">{topic.description}</div>}
                          {(topic.media || []).map((m, idx) => (
                            <div key={idx} className="mb-4">
                              {m.type === 'video' && (
                                <>
                                  <div className="text-sm text-gray-600 mb-2 font-bold">{m.title || 'Video'}</div>
                                  <video controls src={m.url} className="w-full max-h-96 object-contain rounded mb-2" poster={m.poster || ''} />
                                </>
                              )}

 

                              {m.type === 'image' && (
                                <div className="flex items-center justify-between">
                                  <div className="text-sm text-gray-600 font-bold">{m.title || 'Image'}</div>
                                  <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-accent font-bold">View image</a>
                                </div>
                              )}
                            </div>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </div>

                <div className="flex md:hidden flex-col gap-2 ml-4">
                  {topicEditing[tIdx] ? null : <button onClick={() => { setTopicEditing((s) => ({ ...s, [tIdx]: true })); setEditingData((s) => ({ ...s, [tIdx]: { title: topic.title || '', description: topic.description || '', media: topic.media || [] } })); setOpenTopics((s) => ({ ...s, [tIdx]: true })); }} className="bg-accent text-primary px-3 py-1 rounded">Edit</button>}
                  <button onClick={async () => {
                    if (!confirm('Delete this course/topic?')) return;
                    try {
                      setEditBusy((b) => ({ ...b, [tIdx]: true }));
                      const token = getToken();
                      const copy = JSON.parse(JSON.stringify(tutorial || {}));
                      copy.topics = copy.topics || [];
                      copy.topics.splice(tIdx, 1);
                      const res = await fetch(`/api/admin/tutorials/${tutorial.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify({ topics: copy.topics }) });
                      const j = await res.json().catch(() => ({}));
                      if (!res.ok) throw new Error(j && j.error ? j.error : 'Delete failed');
                      setTutorial(copy);
                      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Course deleted', type: 'success' } }));
                    } catch (err) {
                      alert(String(err));
                    } finally { setEditBusy((b) => ({ ...b, [tIdx]: false })); }
                  }} className="bg-red-50 text-red-600 px-3 py-1 rounded">Delete</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .ac-small { padding: .35rem .6rem; font-size: .85rem }
      `}</style>
    </div>
  );
}
