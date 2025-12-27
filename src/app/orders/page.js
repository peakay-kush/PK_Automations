'use client';

export const dynamic = 'force-dynamic';

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
      } catch (e) { /* ignore */ }
    };
    fetchTuts();
    window.addEventListener('adminUpdated', fetchTuts);
    return () => { mounted = false; window.removeEventListener('adminUpdated', fetchTuts); };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = getToken();
        if (!token) return;
        const profile = await fetchProfile();
        if (!mounted) return;
        if (profile && (profile.role === 'admin' || profile.role === 'super')) setIsAdmin(true);
      } catch (e) {}
    })();
    // admin edit mode handler uses localStorage and window events
    const handler = (e) => {
      const val = (e && e.detail && typeof e.detail.editMode !== 'undefined') ? !!e.detail.editMode : (localStorage.getItem('pkat_admin_edit') === '1');
      setIsEditing(val);
    };
    handler();
    window.addEventListener('adminEditModeChanged', handler);
    return () => { mounted = false; window.removeEventListener('adminEditModeChanged', handler); };
  }, []);

  const filteredTutorials = useMemo(() => {
    return tutorials.filter(tut => {
      const matchesSearch = tut.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || tut.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [tutorials, searchTerm, selectedCategory]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <section className="py-12">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-primary mb-6">Tutorials</h1>

          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  placeholder="Search tutorials..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border rounded"
                />
              </div>

              <div className="flex-shrink-0">
                <Link href="/tutorials/new" className="inline-block px-4 py-2 bg-accent text-white rounded shadow hover:bg-accent-dark transition">
                  <ArrowRight className="w-4 h-4 inline-block mr-2 -mt-1" />
                  Create Tutorial
                </Link>
              </div>
            </div>

            <div className="mt-4">
              <AdminSectionControls />
            </div>
          </div>

          {filteredTutorials.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No tutorials found. Try adjusting your search or category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTutorials.map(tut => (
                <div key={tut.id} className="bg-white rounded shadow overflow-hidden group">
                  <div className="relative">
                    <ImageWithFade
                      src={tut.thumbnail || '/placeholder.png'}
                      alt={tut.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <Link href={`/tutorial/${tut.id}`} className="text-white text-lg font-semibold">
                        <Play className="w-5 h-5 inline-block mr-2 -mt-1" />
                        Watch Tutorial
                      </Link>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2">
                      <Link href={`/tutorial/${tut.id}`} className="text-primary hover:underline">
                        {tut.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">{tut.description}</p>

                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs rounded-full" style={{ paddingLeft: '0.5rem', paddingRight: '0.5rem', paddingTop: '0.125rem', paddingBottom: '0.125rem', backgroundColor: '#f3f4f6', color: '#374151' }}>
                        {tut.category}
                      </span>

                      <span className="text-xs rounded-full" style={{ paddingLeft: '0.5rem', paddingRight: '0.5rem', paddingTop: '0.125rem', paddingBottom: '0.125rem', backgroundColor: '#f3f4f6', color: '#374151' }}>
                        {new Date(tut.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="p-4 pt-0">
                      <AdminInlineControls
                        itemId={tut.id}
                        itemType="tutorial"
                        className="flex gap-2"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}