'use client';

import { useState, useMemo, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import dynamic from 'next/dynamic';
import { products as fallbackProducts } from '@/data/products';
import { Search, Filter } from 'lucide-react';
import { apiFetch } from '@/utils/api';
const AdminSectionControls = dynamic(() => import('@/components/AdminSectionControls'), { ssr: false, loading: () => null });

export default function Shop() {
  const [products, setProducts] = useState(fallbackProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    let mounted = true;
    const fetchProducts = async () => {
      try {
        const res = await apiFetch('/api/products/');
        if (!res.ok) return;
        const data = await res.json();
        // normalize products to match existing frontend shape
        const normalized = data.map(p => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          category: p.category,
          image: p.image_url || p.image,
          description: p.description,
          specifications: p.specifications || '',
          related: p.related || [],
          quantity: (typeof p.quantity === 'number') ? p.quantity : undefined
        }));
        if (mounted) setProducts(normalized);
      } catch (err) {
        console.warn('Failed to fetch products from API, using local data.', err);
      }
    };
    fetchProducts();

    const onUpdated = (e) => { if (e && e.detail && e.detail.type === 'product') fetchProducts(); };
    window.addEventListener('adminUpdated', onUpdated);
    return () => { mounted = false; window.removeEventListener('adminUpdated', onUpdated); };
  }, []);

  const categories = ['All', ...new Set(products.map(p => p.category))];

  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // Sort
    if (sortBy === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [products, searchTerm, selectedCategory, sortBy]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Page Header */}
      <section className="bg-primary text-white py-12">
        <div className="container mx-auto">
          <h1 className="text-4xl font-montserrat font-bold">Shop Electronics & Components</h1>
          <p className="text-light mt-2">Browse our extensive collection of quality products</p>
        </div>
      </section>

      {/* Shop Section */}
      <section className="flex-grow py-12">
        <div className="container mx-auto">
          {/* Admin section controls */}
          <AdminSectionControls type="product" />

          {/* Search Bar */}
          <div className="mb-8 flex gap-4">
            <div className="flex-grow relative">
              <Search className="absolute left-4 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Filters */}
            <div className="lg:col-span-1">
              <div className="bg-light rounded-lg p-6">
                <h3 className="font-montserrat font-bold text-lg mb-4 flex items-center gap-2">
                  <Filter size={20} /> Filters
                </h3>

                {/* Categories */}
                <div className="mb-6">
                  <h4 className="font-montserrat font-bold text-primary mb-3">Category</h4>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <label key={category} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="category"
                          value={category}
                          checked={selectedCategory === category}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-4 h-4 accent-accent"
                        />
                        <span className="text-gray-700">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div className="mb-6">
                  <h4 className="font-montserrat font-bold text-primary mb-3">Sort By</h4>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-accent outline-none"
                  >
                    <option value="newest">Newest</option>
                    <option value="name">Name A-Z</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>

                {/* Clear Filters */}
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('All');
                    setSortBy('newest');
                  }}
                  className="w-full bg-accent hover:bg-orange-600 text-white font-bold py-2 rounded-lg transition"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Products Grid */}
            <div className="lg:col-span-3">
              <div className="mb-4 text-gray-600">
                Showing {filteredProducts.length} products
              </div>
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-light rounded-lg">
                  <p className="text-gray-600 text-lg">No products found. Try adjusting your filters.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
