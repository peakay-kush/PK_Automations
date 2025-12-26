'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { products as fallbackProducts } from '@/data/products';
import { ShoppingCart, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import AdminInlineControls from '@/components/AdminInlineControls';

import { useParams } from 'next/navigation';
import { apiFetch } from '@/utils/api';
import Image from 'next/image';

export default function ProductDetail() {
  const params = useParams();
  const productId = parseInt(params?.id) || 1;
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyMsg, setNotifyMsg] = useState('');

  const [isFavorite, setIsFavorite] = useState(false);
  useEffect(() => {
    try {
      const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
      setIsFavorite(Array.isArray(favs) && favs.includes(productId));
    } catch (e) { setIsFavorite(false); }
    const handler = () => { try { const favs = JSON.parse(localStorage.getItem('favorites') || '[]'); setIsFavorite(Array.isArray(favs) && favs.includes(productId)); } catch (e) {} };
    window.addEventListener('favoritesUpdated', handler);
    return () => window.removeEventListener('favoritesUpdated', handler);
  }, [productId]);

  function toggleFavorite() {
    try {
      const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
      const idx = favs.indexOf(productId);
      if (idx === -1) favs.push(productId); else favs.splice(idx, 1);
      localStorage.setItem('favorites', JSON.stringify(favs));
      window.dispatchEvent(new Event('favoritesUpdated'));
      setIsFavorite(idx === -1);
    } catch (e) { console.error(e); }
  }

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        const res = await apiFetch(`/api/products/${productId}/`);
        if (res.ok) {
          const p = await res.json();
          const normalized = {
            id: p.id,
            name: p.name,
            price: Number(p.price),
            category: p.category,
            images: p.images && Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []),
            image: p.image_url || p.image,
            description: p.description,
            specifications: p.specifications || '',
            related: p.related || [],
            quantity: typeof p.quantity === 'number' ? p.quantity : undefined
          };
          setProduct(normalized);
          // fetch related products if available
          if (normalized.related && normalized.related.length > 0) {
            try {
              const relatedRes = await Promise.all(normalized.related.map(id => apiFetch(`/api/products/${id}/`)));
              const relatedJson = await Promise.all(relatedRes.map(r => r.ok ? r.json() : null));
              const relatedNorm = relatedJson.filter(Boolean).map(p => ({
                id: p.id,
                name: p.name,
                price: Number(p.price),
                category: p.category,
                images: p.images && Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []),
                image: p.image_url || p.image,
                description: p.description,
                specifications: p.specifications || '',
                related: p.related || []
              }));
              if (relatedNorm && relatedNorm.length > 0) {
                // Filter explicit related items to match strict category rules (DIY -> DIY/Kits, Electronics/Electrical -> electronics)
                const cat = String(normalized.category || '').toLowerCase();
                const isDIY = /diy|kit/i.test(cat);
                const isElect = /(electro|electron|electric)/i.test(cat);
                const filteredRelated = relatedNorm.filter(r => {
                  const rcat = String(r.category || '').toLowerCase();
                  if (isDIY) return /diy|kit/i.test(rcat);
                  if (isElect) return /(electro|electron|electric)/i.test(rcat);
                  return rcat === cat;
                });
                if (filteredRelated && filteredRelated.length > 0) {
                  setRelatedProducts(filteredRelated);
                } else {
                  // No related items matching strict category, fall back to the stricter fallback rules
                  const aCat = cat;
                  let relatedFallback = [];
                  if (aCat.includes('diy') || aCat.includes('kit')) {
                    relatedFallback = fallbackProducts.filter(fp => {
                      const fcat = String(fp.category || '').toLowerCase();
                      return (fcat.includes('diy') || fcat.includes('kit')) && fp.id !== normalized.id;
                    }).slice(0, 6);
                  } else if (/(electro|electron|electric)/i.test(aCat)) {
                    relatedFallback = fallbackProducts.filter(fp => {
                      const fcat = String(fp.category || '').toLowerCase();
                      return /(electro|electron|electric)/i.test(fcat) && fp.id !== normalized.id;
                    }).slice(0, 6);
                  } else {
                    relatedFallback = fallbackProducts.filter(fp => fp.category === normalized.category && fp.id !== normalized.id).slice(0, 6);
                  }
                  setRelatedProducts(relatedFallback);
                }
              }
            } catch (e) {
              // fallback to static mapping or category match
              const fallbackRelated = fallbackProducts.filter(fp => normalized.related && normalized.related.includes(fp.id));
              if (fallbackRelated && fallbackRelated.length > 0) setRelatedProducts(fallbackRelated);
              else {
                const isDIY = normalized.category && /diy|kit/i.test(String(normalized.category));
                const cat = String(normalized.category || '').toLowerCase();
              let relatedFallback = [];
              if (cat.includes('diy') || cat.includes('kit')) {
                relatedFallback = fallbackProducts.filter(fp => {
                  const fcat = String(fp.category || '').toLowerCase();
                  return (fcat.includes('diy') || fcat.includes('kit')) && fp.id !== normalized.id;
                }).slice(0, 6);
              } else if (cat.includes('electronic')) {
                relatedFallback = fallbackProducts.filter(fp => {
                  const fcat = String(fp.category || '').toLowerCase();
                  return fcat.includes('electronic') && fp.id !== normalized.id;
                }).slice(0, 6);
              } else {
                relatedFallback = fallbackProducts.filter(fp => fp.category === normalized.category && fp.id !== normalized.id).slice(0, 6);
              }
              setRelatedProducts(relatedFallback);
              }
            }
          }
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Failed to fetch product from API, using local data.', err);
      }

      // fallback to static
      const fp = fallbackProducts.find(p => p.id === productId);
      setProduct(fp || null);
      setRelatedProducts(fp ? fallbackProducts.filter(p => fp.related.includes(p.id)) : []);
      setIsLoading(false);
    };
    fetchProduct();
  }, [productId]);
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">Loading product...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
            <Link href="/shop" className="text-accent hover:text-orange-600 font-bold">
              Back to Shop
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }


  const addToCart = () => {
    // check stock
    if (typeof product.quantity === 'number') {
      if (product.quantity <= 0) {
        alert('This product is out of stock. Use Read more to be notified when it is restocked.');
        return;
      }
      if (Number(quantity) > product.quantity) {
        alert('Requested quantity exceeds available stock.');
        return;
      }
    }

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const imageSrc = (product.images && product.images.length > 0) ? product.images[0] : product.image;
    const existing = cart.find(c => c.id === product.id);

    if (existing) {
      existing.quantity = (existing.quantity || 1) + Number(quantity);
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: imageSrc,
        category: product.category,
        quantity: Number(quantity)
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    alert(`Added ${quantity} item(s) to cart!`);
  };

  const productImages = (product.images && product.images.length > 0) ? product.images : (product.image ? [product.image] : ['https://via.placeholder.com/800x600?text=No+Image']); // use images array when available

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-light">
        <div className="container mx-auto py-4 flex items-center gap-2 text-sm">
          <Link href="/" className="text-accent hover:text-orange-600">Home</Link>
          <span>/</span>
          <Link href="/shop" className="text-accent hover:text-orange-600">Shop</Link>
          <span>/</span>
          <span className="text-gray-700">{product.name}</span>
        </div>
      </div>

      {/* Product Detail */}
      <section className="flex-grow py-12">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
            {/* Image Gallery */}
            <div>
              <div className="bg-white rounded-lg overflow-hidden mb-4 aspect-[4/3] md:aspect-[3/2] relative">
                <div className="absolute top-3 right-3 z-10">
                  <AdminInlineControls type="product" id={product.id} />
                </div>
                <div className="relative w-full h-full bg-white flex items-center justify-center">
                  {(() => {
                    const rawSrc = productImages[imageIndex];
                    const isCloud = rawSrc && rawSrc.includes('res.cloudinary.com');
                    const src = isCloud ? require('@/utils/cloudinary').buildCloudinaryUrlFromFullUrl(rawSrc, { width: 2000, quality: '100', format: null, fit: true }) : rawSrc;
                    return (
                      <Image
                        src={src}
                        alt={product.name}
                        fill
                        style={{ objectFit: 'contain' }}
                        sizes="(min-width: 1024px) 800px, (min-width: 768px) 600px, 100vw"
                        quality={100}
                        priority={true}
                        unoptimized={true}
                      />
                    );
                  })()}
                </div>

                <button
                  onClick={() => setImageIndex((imageIndex - 1 + productImages.length) % productImages.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 hover:bg-gray-200 transition"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={() => setImageIndex((imageIndex + 1) % productImages.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 hover:bg-gray-200 transition"
                >
                  <ChevronRight size={24} />
                </button>
              </div>

              {/* Thumbnail Gallery */}
              <div className="flex gap-3">
                {productImages.map((img, idx) => (
                  <button key={idx} onClick={() => setImageIndex(idx)} className={`w-20 h-20 rounded-lg cursor-pointer overflow-hidden ${imageIndex === idx ? 'ring-4 ring-accent' : 'border-2 border-gray-200'}`}>
                    {(() => {
                      const isCloud = img && img.includes('res.cloudinary.com');
                      const src = isCloud ? require('@/utils/cloudinary').buildCloudinaryUrlFromFullUrl(img, { width: 480, quality: '100', format: null, fit: true }) : img;
                      return <Image src={src} alt={`thumb-${idx}`} width={80} height={80} style={{ objectFit: 'contain' }} sizes="80px" quality={100} unoptimized={true} />;
                    })()}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div>
              <div className="mb-4">
                <span className="bg-accent text-white px-3 py-1 rounded-full text-sm font-bold">
                  {product.category}
                </span>
              </div>

              <h1 className="text-4xl font-montserrat font-bold text-primary mb-4">
                {product.name}
              </h1>

              <div className="text-gray-700 text-lg mb-6 whitespace-pre-wrap">{product.description}</div>

              {/* Price */}
              <div className="bg-light rounded-lg p-6 mb-6">
                <div className="text-4xl font-bold text-accent mb-2">
                  KSh {product.price.toLocaleString()}
                </div>
                {typeof product.quantity === 'number' ? (
                  product.quantity > 0 ? (
                    <p className="text-green-600 font-bold">In Stock: {product.quantity}</p>
                  ) : (
                    <p className="text-red-600 font-bold">Out of stock</p>
                  )
                ) : (
                  <p className="text-green-600 font-bold">In Stock</p>
                )}
              </div>

              {/* Specifications */}
              <div className="mb-8">
                <h3 className="font-montserrat font-bold text-lg text-primary mb-3">
                  Specifications
                </h3>
                <p className="text-gray-700">{product.specifications}</p>
              </div>

              {/* Add to Cart */}
              <div className="flex gap-4 mb-8">
                <div className="flex items-center border-2 border-gray-200 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 hover:bg-light transition"
                  >
                    -
                  </button>
                  <span className="px-6 py-2 font-bold text-primary">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-2 hover:bg-light transition"
                  >
                    +
                  </button>
                </div>

                {typeof product.quantity === 'number' && product.quantity <= 0 ? (
                  <button onClick={() => setNotifyOpen(true)} className="flex-grow bg-gray-200 text-gray-800 font-bold py-3 rounded-lg transition">Read more</button>
                ) : (
                  <button
                    onClick={addToCart}
                    className="flex-grow bg-accent hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
                    disabled={typeof product.quantity === 'number' && Number(quantity) > product.quantity}
                  >
                    <ShoppingCart size={20} />
                    Add to Cart
                  </button>
                )}

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

                <button onClick={toggleFavorite} className={`px-6 py-3 border-2 rounded-lg transition flex items-center justify-center gap-2 ${isFavorite ? 'bg-accent text-white border-accent' : 'border-accent text-accent hover:bg-accent hover:text-white'}`}>
                  <Heart size={20} /> {isFavorite ? 'Saved' : 'Save'}
                </button>
              </div>


            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div>
              <h2 className="text-3xl font-montserrat font-bold mb-8">Related Products</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map(prod => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
