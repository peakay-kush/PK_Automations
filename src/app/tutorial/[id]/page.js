'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { tutorials as fallbackTutorials } from '@/data/products';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, Tag, File as FileIcon, Edit3, Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { getToken } from '@/utils/auth';
import { useEffect, useMemo, useState } from 'react';
import ImageWithFade from '@/components/ImageWithFade';
import AdminCourseActions from '@/components/AdminCourseActions';

export default function TutorialDetail() {
  const params = useParams();
  const tutorialId = parseInt(params?.id) || 1;
  const [tutorial, setTutorial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [topicEditing, setTopicEditing] = useState({});
  const [editingData, setEditingData] = useState({});
  const [editBusy, setEditBusy] = useState({});
  const [openTopics, setOpenTopics] = useState({});

  useEffect(() => {
    let mounted = true;
    const fetchTut = async () => {
      try {
        const res = await fetch(`/api/tutorials/${tutorialId}`);
        if (res.ok) {
          const data = await res.json();
          if (mounted) setTutorial(data);
          return;
        }
      } catch (e) {
        // ignore and fall back
      }

      // fallback to static data
      const fallback = (fallbackTutorials || []).find(t => t.id === tutorialId);
      if (mounted) setTutorial(fallback || null);
    };
    fetchTut().finally(() => { if (mounted) setLoading(false); });

    // admin flags
    const handler = (e) => {
      if (e && e.detail) setEditMode(!!e.detail.editMode);
      else setEditMode(localStorage.getItem('pkat_admin_edit') === '1');
    };
    handler();
    window.addEventListener('adminEditModeChanged', handler);

    (async () => {
      try {
        const auth = await import('@/utils/auth');
        const profile = await auth.fetchProfile();
        if (profile && (profile.role === 'admin' || profile.role === 'super')) setIsAdmin(true);
        else setIsAdmin(false);
      } catch (e) {
        try { if (localStorage.getItem('pkat_token')) setIsAdmin(true); } catch (e) {}
      }
    })();

    return () => { mounted = false; window.removeEventListener('adminEditModeChanged', handler); };
  }, [tutorialId]);

  // Upload helper for topic editing (returns added media array)
  async function uploadFilesForTopic(tIdx, files) {
    if (!files || files.length === 0) return [];
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
    }
  }

  async function deleteTopicAt(tIdx) {
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
    } finally {
      setEditBusy((b) => ({ ...b, [tIdx]: false }));
    }
  }

  const media = useMemo(() => {
    if (!tutorial) return [];
    if (Array.isArray(tutorial.media) && tutorial.media.length) return tutorial.media;
    const arr = [];
    if (tutorial.video) arr.push({ type: 'video', url: tutorial.video, title: tutorial.title || 'Video', poster: tutorial.thumbnail || tutorial.image });
    if (tutorial.images && Array.isArray(tutorial.images)) tutorial.images.forEach((u, i) => arr.push({ type: 'image', url: u, title: `Image ${i + 1}` }));
    return arr;
  }, [tutorial]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">Loading...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!loading && !tutorial) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Tutorial Not Found</h1>
            <Link href="/tutorials" className="text-accent hover:text-orange-600 font-bold">
              Back to Tutorials
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }



  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-accent text-white py-12">
        <div className="container mx-auto relative">
          <div className="flex items-start justify-between">
            <div>
              <Link href="/tutorials" className="flex items-center gap-2 text-light hover:text-white mb-4 w-fit">
                <span className="inline-flex items-center gap-2"><ArrowLeft size={20} /> <span>Back to Tutorials</span></span>
              </Link>
              <h1 className="text-4xl font-montserrat font-bold">{tutorial.title}</h1>
              <div className="flex gap-6 mt-6 text-light">
                <div className="flex items-center gap-2">
                  <Calendar size={18} />
                  <span>Dec 11, 2025</span>
                </div>
                <div className="flex items-center gap-2">
                  <User size={18} />
                  <span>PK Automations</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag size={18} />
                  <span>{tutorial.category}</span>
                </div>
              </div>
            </div>

            {isAdmin && editMode && (
              <div className="ml-4 mt-2">
                <button onClick={() => window.dispatchEvent(new Event('adminAddCourse'))} className="bg-white text-primary font-bold py-2 px-5 rounded inline-flex items-center gap-2 shadow-sm hover:shadow-lg"><Plus size={16}/> Add Course</button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Admin actions (compact, no topics list) */}
      <div className="container mx-auto mt-6">
        <AdminCourseActions tutorial={tutorial} setTutorial={setTutorial} showTopics={false} />
      </div>

      {/* Content */}
      <section className="flex-grow py-12">
        <div className="container mx-auto max-w-3xl">
          <div className="mb-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold mb-3 text-primary">Topics</h2>
            </div>

            {(tutorial?.topics && tutorial.topics.length > 0) ? (
              tutorial.topics.map((topic, tIdx) => (
                <div id={`topic-${tIdx}`} key={tIdx} className="bg-white rounded-lg p-4 shadow-sm relative">
                  {/* Admin toolbar on the topic card */}
                  {isAdmin && editMode && (
                    <div className="absolute right-4 top-4 flex items-center gap-2 z-10">
                      <button onClick={() => { setTopicEditing((s) => ({ ...s, [tIdx]: true })); setEditingData((s) => ({ ...s, [tIdx]: { title: topic.title || '', description: topic.description || '' } })); setOpenTopics((s) => ({ ...s, [tIdx]: true })); }} className="bg-white border border-gray-200 text-primary p-1 rounded-full shadow-sm hover:bg-gray-50" title="Edit"><Edit3 size={16} /></button>
                      <button onClick={() => deleteTopicAt(tIdx)} className="bg-white border border-gray-200 text-red-600 p-1 rounded-full shadow-sm hover:bg-red-50" title="Delete"><Trash2 size={16} /></button>
                    </div>
                  )}

                  {topicEditing[tIdx] ? (
                    <>
                      <input className="w-full border p-2 rounded mb-2 bg-white text-gray-900 placeholder-gray-400" value={editingData[tIdx]?.title || ''} onChange={(e) => setEditingData((s) => ({ ...s, [tIdx]: { ...(s[tIdx] || {}), title: e.target.value } }))} />
                      <textarea className="w-full border p-2 rounded mb-2 bg-white text-gray-900 placeholder-gray-400" value={editingData[tIdx]?.description || ''} onChange={(e) => setEditingData((s) => ({ ...s, [tIdx]: { ...(s[tIdx] || {}), description: e.target.value } }))} />

                      <div className="mb-2">
                        <div className="flex items-center gap-2">
                          <label className="px-3 py-2 bg-accent text-white font-medium rounded cursor-pointer inline-flex items-center gap-2 shadow-sm hover:opacity-90">
                            Add images
                            <input type="file" multiple accept="image/*" className="hidden" onChange={async (e) => {
                              const files = Array.from(e.target.files || []);
                              const added = await uploadFilesForTopic(tIdx, files);
                              setEditingData((s) => ({ ...s, [tIdx]: { ...(s[tIdx] || {}), media: ((s[tIdx] && s[tIdx].media) || []).concat(added) } }));
                            }} />
                          </label>

                          <label className="px-3 py-2 bg-indigo-600 text-white font-medium rounded cursor-pointer inline-flex items-center gap-2">
                            Add videos
                            <input type="file" multiple accept="video/*" className="hidden" onChange={async (e) => { const files = Array.from(e.target.files || []); const added = await uploadFilesForTopic(tIdx, files); setEditingData((s) => ({ ...s, [tIdx]: { ...(s[tIdx] || {}), media: ((s[tIdx] && s[tIdx].media) || []).concat(added) } })); }} />
                          </label>


                        </div>

                        {/* show current media with remove button while editing */}
                        <div className="mt-2 space-y-2">
                          {((editingData[tIdx] && editingData[tIdx].media) || (topic.media || [])).filter(m => m && (m.type === 'video' || m.type === 'image')).map((m, mi) => (
                            <div key={mi} className="flex items-center justify-between bg-light rounded px-3 py-2">
                              <div className="text-sm text-gray-700">{m.title || (m.type === 'video' ? 'Video' : 'Image')}</div> 
                              <div className="flex items-center gap-2">
                                <a href={m.url} target="_blank" rel="noreferrer" className="text-accent font-bold">View</a>
                                <button onClick={() => {
                                  setEditingData((s) => {
                                    const c = { ...(s || {}) };
                                    const arr = ((c[tIdx] && c[tIdx].media) || (topic.media || [])).slice();
                                    arr.splice(mi, 1);
                                    c[tIdx] = { ...(c[tIdx] || {}), media: arr };
                                    return c;
                                  });
                                }} className="bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100">Remove</button>
                              </div>
                            </div>
                          ))}
                        </div>
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
                          {topic.description && <p className="text-gray-700 mb-2">{topic.description}</p>}
                          {(topic.media || []).filter(m => m && (m.type === 'video' || m.type === 'image')).map((m, idx) => (
                            <div key={idx} className="mb-4">
                              {m.type === 'video' && (
                                <>
                                  <div className="text-sm text-gray-600 mb-2 font-bold">{m.title || 'Video'}</div>
                                  <video controls controlsList="nodownload" src={m.url} className="w-full max-h-96 object-contain rounded mb-2" poster={m.poster || ''} onContextMenu={(e) => e.preventDefault()} />
                                </>
                              )}

 

                              {m.type === 'image' && (
                                <div>
                                  <div className="text-sm text-gray-600 font-bold mb-2">{m.title || 'Image'}</div>
                                  {isAdmin ? (
                                    <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-accent font-bold">View image</a>
                                  ) : (
                                    <>
                                      <img src={m.url} alt={m.title || 'Image'} className="w-full max-h-48 object-contain rounded mb-2" draggable={false} onContextMenu={(e) => e.preventDefault()} />
                                      <Link href={`/contact?topic=book-consultation&tutorialId=${tutorial.id}&topicIdx=${tIdx}&mediaIdx=${idx}`} className="inline-flex items-center gap-2 text-accent font-bold">Book Consultation</Link>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </>
                      )}

                      <div className="flex md:hidden flex-col gap-2 ml-4">
                        {topicEditing[tIdx] ? null : <button onClick={() => { setTopicEditing((s) => ({ ...s, [tIdx]: true })); setEditingData((s) => ({ ...s, [tIdx]: { title: topic.title || '', description: topic.description || '', media: topic.media || [] } })); setOpenTopics((s) => ({ ...s, [tIdx]: true })); }} className="bg-accent text-primary px-3 py-1 rounded">Edit</button>}
                        <button onClick={() => deleteTopicAt(tIdx)} className="bg-red-50 text-red-600 px-3 py-1 rounded">Delete</button>
                      </div>
                    </>
                  )}
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-600">No courses yet. Use <strong>Add Course</strong> to create one.</div>
            )}
          </div>

          {media && media.length > 0 && (
            <div className="mb-8 space-y-4">
              <h2 className="text-2xl font-bold mb-3 text-primary">Media</h2>
              {media.filter(m => m && (m.type === 'video' || m.type === 'image')).map((m, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 shadow-sm">
                  {m.type === 'video' && (
                    <>
                      <div className="text-sm text-gray-600 mb-2 font-bold">{m.title || 'Video'}</div>
                      <video controls controlsList="nodownload" src={m.url} className="w-full max-h-96 object-contain rounded mb-2" poster={m.poster || ''} onContextMenu={(e) => e.preventDefault()} />
                    </>
                  )}

 

                  {m.type === 'image' && (
                    <div>
                      <div className="text-sm text-gray-600 font-bold mb-2">{m.title || 'Image'}</div>
                      {isAdmin ? (
                        <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-accent font-bold">View image</a>
                      ) : (
                        <>
                          <img src={m.url} alt={m.title || 'Image'} className="w-full max-h-48 object-contain rounded mb-2" draggable={false} onContextMenu={(e) => e.preventDefault()} />
                          <Link href={`/contact?topic=book-consultation&tutorialId=${tutorial.id}&mediaIdx=${idx}`} className="inline-flex items-center gap-2 text-accent font-bold">Book Consultation</Link>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="bg-light rounded-lg p-8 mb-8">
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              {tutorial.content}
            </p>
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              In this comprehensive guide, we'll walk you through everything you need to know about {tutorial.title.toLowerCase()}. 
              Whether you're a beginner or experienced developer, this tutorial will provide valuable insights and practical examples.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed">
              By the end of this tutorial, you'll have a solid understanding of the concepts and be able to apply them to your own projects.
            </p>
          </div>

          {/* Learning Outcomes */}
          <div className="bg-white rounded-lg p-8 shadow-lg mb-8">
            <h2 className="text-2xl font-montserrat font-bold text-primary mb-6">What You'll Learn</h2>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-sm font-bold">✓</span>
                <span className="text-gray-700">Core concepts and fundamentals</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-sm font-bold">✓</span>
                <span className="text-gray-700">Practical implementation techniques</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-sm font-bold">✓</span>
                <span className="text-gray-700">Best practices and optimization</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-sm font-bold">✓</span>
                <span className="text-gray-700">Troubleshooting common issues</span>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div className="bg-primary text-white rounded-lg p-8 text-center">
            <h3 className="text-2xl font-montserrat font-bold mb-3">Need Help with Implementation?</h3>
            <p className="mb-6">Get expert guidance on this topic through our consultation services</p>
            <Link
              href="/contact"
              className="inline-block bg-accent hover:bg-orange-600 text-primary font-bold py-3 px-8 rounded-lg transition"
            >
              Contact Our Experts
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
