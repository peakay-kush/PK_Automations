'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { tutorials as fallbackTutorials } from '@/data/products';
import { ArrowRight, Search, Play, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { getToken, fetchProfile } from '@/utils/auth';
import AdminInlineControls from '@/components/AdminInlineControls';
import AdminSectionControls from '@/components/AdminSectionControls';
import ImageWithFade from '@/components/ImageWithFade';

export default function Tutorials() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [tutorials, setTutorials] = useState(fallbackTutorials || []);

  const [isAdmin, setIsAdmin] = useState(false);
  // Avoid reading localStorage at module/init time so build/export doesn't fail
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchTuts = async () => {
      try {
        const res = await fetch('/api/tutorials');
        if (res.ok) {
          const data = await res.json();
          const arr = Array.isArray(data) ? data : (data.tutorials || []);
          if (mounted) setTutorials(arr);
        }
      } catch (e) {
        // ignore and keep fallback tutorials
      }
    };
    fetchTuts();

    const onUpdated = (e) => {
      fetchTuts();
    };
    window.addEventListener('adminUpdated', onUpdated);

    return () => { mounted = false; window.removeEventListener('adminUpdated', onUpdated); };
  }, []);

  // Determine if current user is an admin and observe edit-mode changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = getToken();
        if (!token) return;
        const profile = await fetchProfile();
        if (!mounted) return;
        if (profile && (profile.role === 'admin' || profile.role === 'super')) setIsAdmin(true);
      } catch (e) {
        // ignore
      }
    })();

    const handler = (e) => {
      const val = (e && e.detail && typeof e.detail.editMode !== 'undefined') ? !!e.detail.editMode : (localStorage.getItem('pkat_admin_edit') === '1');
      setIsEditing(val);
    };
    handler();
    window.addEventListener('adminEditModeChanged', handler);
    return () => { mounted = false; window.removeEventListener('adminEditModeChanged', handler); };
  }, []);

  const categories = ['All', ...new Set((tutorials || []).map(t => t.category))];

  const filteredTutorials = useMemo(() => {
    return tutorials.filter(tutorial => {
      const matchesSearch = tutorial.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || tutorial.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory, tutorials]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Page Header */}
      <section className="bg-primary text-white py-12">
        <div className="container mx-auto flex items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-montserrat font-bold">Tutorials & Guides</h1>
            <p className="text-light mt-2">Learn from expert-crafted tutorials and guides</p>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const newVal = !isEditing;
                  try { localStorage.setItem('pkat_admin_edit', newVal ? '1' : '0'); } catch (e) {}
                  window.dispatchEvent(new CustomEvent('adminEditModeChanged', { detail: { editMode: newVal } }));
                  setIsEditing(newVal);
                }}
                className={`px-4 py-2 rounded ${isEditing ? 'bg-white text-primary' : 'bg-white/20 text-white border border-white/30'}`}>
                {isEditing ? 'Editing: On' : 'Edit'}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Tutorials Section */}
      <section className="py-20 flex-grow">
        <div className="container mx-auto">
          {/* Admin section controls */}
          <AdminSectionControls type="tutorial" />

          {/* Search and Filter */}
          <div className="mb-12 space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search tutorials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent outline-none transition"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full font-bold transition ${
                    selectedCategory === category
                      ? 'bg-accent text-white'
                      : 'bg-light text-primary hover:bg-gray-300'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Tutorials Grid */}
          {filteredTutorials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTutorials.map((tutorial) => (
                <div key={tutorial.id} className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition">
                  <div className="relative h-32 bg-light overflow-hidden group" style={{ contain: 'paint' }}>
                    <div className="absolute top-3 right-3 z-10">
                      <AdminInlineControls type="tutorial" id={tutorial.id} />
                    </div>

                    {tutorial.video && (
                      <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
                        <div className="bg-black/40 rounded-full p-4">
                          <Play size={26} className="text-white" />
                        </div>
                      </div>
                    )}

                    { (tutorial.thumbnail || tutorial.image) ? (
                      <ImageWithFade
                        src={tutorial.thumbnail || tutorial.image}
                        alt={tutorial.title}
                        className="w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-500 p-4">
                        <ImageIcon size={40} />
                        <div className="mt-2 text-sm font-bold text-center px-2">{tutorial.title}</div>
                      </div>
                    ) }

                    <div className="absolute top-4 right-4 bg-accent text-white px-3 py-1 rounded-full text-xs font-bold">
                      {tutorial.category}
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="font-montserrat font-bold text-lg mb-3 text-primary">
                      {tutorial.title}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {tutorial.excerpt}
                    </p>

                    <Link
                      href={`/tutorial/${tutorial.id}`}
                      className="inline-flex items-center gap-2 text-accent font-bold hover:text-orange-600 transition"
                    >
                      Read More <ArrowRight size={18} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-light rounded-lg">
              <p className="text-gray-600 text-lg">No tutorials found. Try adjusting your filters.</p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Section */}
      <section className="bg-primary text-white py-20">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-montserrat font-bold mb-6">Want to Share Your Knowledge?</h2>
          <p className="text-light text-lg mb-8 max-w-2xl mx-auto">
            Have expertise in electronics, programming, or IoT? We're looking for contributors to expand our tutorial library.
          </p>
          <Link
            href="/contact"
            className="bg-accent hover:bg-orange-600 text-primary font-bold py-3 px-8 rounded-lg transition inline-flex items-center gap-2"
          >
            Get in Touch <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
