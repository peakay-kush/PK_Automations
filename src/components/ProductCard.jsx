'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import AdminInlineControls from './AdminInlineControls';

export default function ProductCard({ product, featured = false }) {
  const [editMode, setEditMode] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyMsg, setNotifyMsg] = useState('');

  const [isFavorite, setIsFavorite] = useState(false);
  useEffect(() => {
    try {
      const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
      setIsFavorite(Array.isArray(favs) && favs.includes(product.id));
    } catch (e) { setIsFavorite(false); }
    const handler = () => { try { const favs = JSON.parse(localStorage.getItem('favorites') || '[]'); setIsFavorite(Array.isArray(favs) && favs.includes(product.id)); } catch (e) {} };
    window.addEventListener('favoritesUpdated', handler);
    return () => window.removeEventListener('favoritesUpdated', handler);
  }, [product.id]);

  function toggleFavorite() {
    try {
      const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
      const idx = favs.indexOf(product.id);
      if (idx === -1) favs.push(product.id); else favs.splice(idx, 1);
      localStorage.setItem('favorites', JSON.stringify(favs));
      window.dispatchEvent(new Event('favoritesUpdated'));
      setIsFavorite(idx === -1);
    } catch (e) { console.error(e); }
  }

  useEffect(() => {
    const handler = (e) => {
      const val = (e && e.detail && e.detail.editMode) ? !!e.detail.editMode : (localStorage.getItem('pkat_admin_edit') === '1');
      setEditMode(val);
    };
    handler();
    window.addEventListener('adminEditModeChanged', handler);
    return () => window.removeEventListener('adminEditModeChanged', handler);
  }, []);

  const addToCart = () => {
    // Check stock if quantity is managed
    if (typeof product.quantity === 'number') {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const existing = cart.find(c => c.id === product.id);
      const currentQty = existing ? (existing.quantity || 0) : 0;
      if (product.quantity <= 0) {
        alert('This product is out of stock. Click Read more to be notified when it is restocked.');
        return;
      }
      if (currentQty + 1 > product.quantity) {
        alert('Cannot add more than available stock.');
        return;
      }
    }

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');

    const existing = cart.find(c => c.id === product.id);
    const imageSrc = (product.images && product.images.length > 0) ? product.images[0] : product.image;
    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: imageSrc,
        category: product.category,
        quantity: 1,
        stock: (typeof product.quantity === 'number') ? product.quantity : null
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    alert('Added to cart!');
  };


  return (
    <div className="relative bg-white rounded-lg shadow-lg hover:shadow-xl transition overflow-hidden group">
      <div className="overflow-hidden bg-white aspect-[4/3] md:aspect-[3/2]">
        <div className="relative w-full h-full flex items-center justify-center">
          {((product.images && product.images.length > 0) ? product.images[0] : product.image) ? (
            (() => {
              const rawSrc = (product.images && product.images.length > 0) ? product.images[0] : product.image;
              const isCloud = rawSrc && rawSrc.includes('res.cloudinary.com');
              const desiredWidth = featured ? 1400 : 1000; // larger to ensure good quality
              const src = isCloud ? require('@/utils/cloudinary').buildCloudinaryUrlFromFullUrl(rawSrc, { width: desiredWidth, quality: '100', format: null, fit: true }) : rawSrc;
              return (
                <Image
                  src={src}
                  alt={product.name}
                  fill
                  style={{ objectFit: 'contain', objectPosition: 'center' }}
                  sizes="(min-width: 1024px) 350px, (min-width: 768px) 300px, 100vw"
                  quality={100}
                  priority={featured}
                  unoptimized={true}
                />
              );
            })()
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white text-gray-400">No image</div>
          )}
        </div>
        <div className="absolute top-4 right-4 bg-accent text-white px-3 py-1 rounded-full text-xs font-bold">
          {product.category}
        </div>
      </div>

      {/* admin inline controls (edit/delete) - placed at card root to avoid clipping */}
      <div className="absolute top-3 left-3 z-40 pointer-events-auto">
        <AdminInlineControls type="product" id={product.id} vertical />
      </div>

      <div className="p-4">
        <h3 className="font-montserrat font-bold text-lg text-primary mb-2 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold text-accent">KSh {product.price.toLocaleString()}</span>
          <div className="flex items-center gap-1">
            <Star size={16} className="fill-accent text-accent" />
            <span className="text-sm text-gray-600">4.5</span>
          </div>
        </div>

        {typeof product.quantity === 'number' ? (
          product.quantity > 0 ? (
            <div className="text-sm text-gray-700 mb-3">In stock: {product.quantity}</div>
          ) : (
            <div className="text-sm text-red-600 mb-3">Out of stock</div>
          )
        ) : null}

        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0 flex items-center gap-2">
            { (typeof product.quantity === 'number' && product.quantity <= 0) ? (
              <button onClick={() => setNotifyOpen(true)} className="flex-1 min-w-0 bg-gray-200 text-gray-800 font-bold py-2 px-3 rounded-md transition text-sm truncate text-center">Read more</button>
            ) : (
              <button
                onClick={addToCart}
                className="flex-1 min-w-0 bg-accent hover:bg-orange-600 text-white font-bold py-2 px-3 rounded-md transition flex items-center justify-center gap-2 text-sm truncate"
              >
                <ShoppingCart size={18} />
                <span className="truncate">Add to Cart</span>
              </button>
            )}

            <Link
              href={`/product/${product.id}`}
              className="flex-none w-24 border-2 border-accent text-accent hover:bg-accent hover:text-white font-bold py-2 px-3 rounded-md transition flex items-center justify-center text-sm"
            >
              View
            </Link>
          </div>

          {/* Favorite button */}
          <button onClick={toggleFavorite} className={`w-10 h-10 flex items-center justify-center rounded-md border ml-1 transition ${isFavorite ? 'bg-accent text-white' : 'text-accent'}`} title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" className={`${isFavorite ? 'fill-white' : ''}`}>
              <path d="M12 21s-6.716-4.35-9-7.05C-0.05 9.85 3 4 8.5 4 11 4 12 6 12 6s1-2 3.5-2C21 4 24.05 9.85 21 13.95 18.716 16.65 12 21 12 21z" fill={isFavorite ? '#ffffff' : 'none'} stroke={isFavorite ? 'none' : '#00A86B'} strokeWidth="1.2" />
            </svg>
          </button>
        </div>

        {notifyOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-2">Notify me when back in stock</h3>
              <p className="text-sm text-gray-600 mb-4">Enter your email and we'll notify you when this product is restocked.</p>
              <input className="w-full border p-2 rounded mb-3" placeholder="you@example.com" value={notifyEmail} onChange={(e) => setNotifyEmail(e.target.value)} />
              {notifyMsg && <div className="text-sm text-green-600 mb-2">{notifyMsg}</div>}
              <div className="flex gap-3 justify-end">
                <button onClick={() => { setNotifyOpen(false); setNotifyMsg(''); setNotifyEmail(''); }} className="px-3 py-2 rounded border">Cancel</button>
                <button onClick={async () => {
                  try {
                    setNotifyMsg('Sending...');
                    const res = await fetch('/api/notifications/restock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: product.id, email: notifyEmail }) });
                    const j = await res.json();
                    if (!res.ok) throw new Error(j?.error || 'Failed');
                    setNotifyMsg('You will be notified when this product is restocked.');
                    setTimeout(() => { setNotifyOpen(false); setNotifyMsg(''); setNotifyEmail(''); }, 2500);
                  } catch (e) {
                    setNotifyMsg('Failed to subscribe.');
                    console.error(e);
                  }
                }} className="px-3 py-2 rounded bg-accent text-white">Notify me</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
