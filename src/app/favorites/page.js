'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { apiFetch } from '@/utils/api';
import Link from 'next/link';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const ids = JSON.parse(localStorage.getItem('favorites') || '[]');
        if (!Array.isArray(ids) || ids.length === 0) { setFavorites([]); setIsLoading(false); return; }
        const proms = ids.map(id => apiFetch(`/api/products/${id}/`).then(r => r.ok ? r.json() : null).catch(() => null));
        const items = (await Promise.all(proms)).filter(Boolean).map(p => ({ id: p.id, name: p.name, price: Number(p.price), category: p.category, images: p.images && Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []), image: p.image, description: p.description, specifications: p.specifications || '', related: p.related || [] }));
        setFavorites(items);
      } catch (e) { setFavorites([]); }
      setIsLoading(false);
    };

    load();
    const handler = () => load();
    window.addEventListener('favoritesUpdated', handler);
    return () => window.removeEventListener('favoritesUpdated', handler);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Your Favorites</h1>

        {isLoading ? <div>Loading...</div> : (
          favorites.length === 0 ? (
            <div className="text-center">
              <p className="mb-4 text-gray-600">You haven't saved any products yet.</p>
              <Link href="/shop" className="bg-accent text-white px-4 py-2 rounded">Browse Shop</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {favorites.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )
        )}
      </main>

      <Footer />
    </div>
  );
}