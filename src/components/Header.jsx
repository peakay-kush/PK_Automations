'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ShoppingCart, Sun, Moon, Heart } from 'lucide-react';
import AdminToolbar from '@/components/AdminToolbar';
import ProfileMenu from '@/components/ProfileMenu';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState(null);
  // Set isLoading false by default so server-rendered markup matches client (avoids hydration mismatch when user/login links toggle)
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const getCount = (cart) => {
      try {
        if (!Array.isArray(cart)) return 0;
        // aggregated items with quantity
        if (cart.length > 0 && typeof cart[0].quantity === 'number') {
          return cart.reduce((acc, it) => acc + (it.quantity || 0), 0);
        }
        // legacy array of repeated items
        return cart.length;
      } catch (e) { return 0; }
    };

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(getCount(cart));

    const handleCartUpdate = () => {
      const updatedCart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartCount(getCount(updatedCart));
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  const [waHref, setWaHref] = useState('https://wa.me/254712345678');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const profile = await import('@/utils/auth').then((m) => m.fetchProfile());
        if (profile) setUser(profile);
        else localStorage.removeItem('pkat_token');
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      }
      setIsLoading(false);
    };
    fetchUser();
    window.addEventListener('profileUpdated', fetchUser);
    // cleanup added at end of effect

    // Load WhatsApp number from pages API (home)
    (async () => {
      try {
        const res = await fetch('/api/pages/home');
        if (res.ok) {
          const j = await res.json();
          if (j && j.whatsapp) {
            setWaHref(`https://wa.me/${String(j.whatsapp).replace(/[^0-9]/g, '')}`);
          }
        }
      } catch (e) {}
    })();

    // Favorites count initial and listener
    const updateFavCount = () => {
      try {
        const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
        const el = document.getElementById('header-fav-count');
        if (!el) return;
        if (favs && favs.length > 0) {
          el.textContent = favs.length;
          el.classList.remove('hidden');
        } else {
          el.classList.add('hidden');
        }
      } catch (e) { /* ignore */ }
    };
    updateFavCount();
    window.addEventListener('favoritesUpdated', updateFavCount);
    return () => {
      window.removeEventListener('favoritesUpdated', updateFavCount);
      window.removeEventListener('profileUpdated', fetchUser);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('pkat_token');
    setUser(null);
    window.location.href = '/';
  };

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    if (isDark) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/shop', label: 'Shop' },
    { href: '/services', label: 'Services' },
    { href: '/tutorials', label: 'Tutorials' },
    { href: '/student-hub', label: 'Student Hub' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white shadow-lg dark:bg-primary">
      <nav className="container mx-auto flex items-center justify-between p-4">
        <Link href="/" className="flex items-center">
          <picture>
            <source srcSet="/pk-automations-logo.webp" type="image/webp" />
            <img
              src="/pk-automations-logo.png"
              alt="PK Automations"
              className="h-16 md:h-20 lg:h-24 w-auto"
              onError={(e) => { if (!e.currentTarget.dataset.fallback) { e.currentTarget.dataset.fallback = '1'; e.currentTarget.src = '/pk-automations-logo.svg'; } }}
            />
          </picture>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-primary dark:text-light hover:text-accent transition font-medium"
            >
              {link.label}
            </Link>
          ))}
          {!isLoading && (
            user ? (
              <div className="flex items-center gap-4">
                {user.role === 'super' && (
                  <Link href="/admin" className="text-primary dark:text-light hover:text-accent transition font-medium">Admin</Link>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/login" className="text-primary dark:text-light hover:text-accent transition font-medium">
                  Login
                </Link>
                <Link href="/register" className="bg-accent hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition">
                  Register
                </Link>
              </div>
            )
          )}
        </div>

        {/* Right Side Icons */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 hover:bg-light dark:hover:bg-primary rounded-lg transition"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <Link
            href="/cart"
            className="relative p-2 hover:bg-light dark:hover:bg-primary rounded-lg transition"
          >
            <ShoppingCart size={20} />
            <span className={`absolute top-0 right-0 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ${cartCount > 0 ? '' : 'hidden'}`}>
              {cartCount}
            </span>
          </Link>

          {/* Favorites button - opens /favorites (moved left of profile) */}
          <Link href="/favorites" className="relative p-2 hover:bg-light dark:hover:bg-primary rounded-lg transition">
            <Heart size={20} className="text-accent" />
            <span id="header-fav-count" className="absolute top-0 right-0 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center hidden">0</span>
          </Link>

          {/* Profile area - opens inline editor (visible only when logged in) */}
          {user && (
            <div className="p-1">
              <ProfileMenu user={user} setUser={setUser} />
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 hover:bg-light dark:hover:bg-primary rounded-lg transition"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-light dark:bg-dark border-t border-gray-200 dark:border-gray-700">
          <div className="container mx-auto py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-2 text-primary dark:text-light hover:bg-white dark:hover:bg-primary rounded transition"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {!isLoading && (
              user ? (
                <>
                  {user.role === 'super' && (
                    <Link href="/admin" className="block w-full text-left px-4 py-2 text-primary hover:bg-white dark:hover:bg-primary rounded transition" onClick={() => setIsOpen(false)}>Admin</Link>
                  )}
                  <Link href="/profile" className="block w-full text-left px-4 py-2 text-primary hover:bg-white dark:hover:bg-primary rounded transition" onClick={() => setIsOpen(false)}>Edit profile</Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block px-4 py-2 text-primary dark:text-light hover:bg-white dark:hover:bg-primary rounded transition"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="block px-4 py-2 text-accent hover:bg-white dark:hover:bg-primary rounded transition"
                    onClick={() => setIsOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )
            )}
          </div>
        </div>
      )}

      {/* Floating WhatsApp button (bottom-right) */}
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="fixed z-[9999] bottom-6 right-6 w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition hover:scale-105 bg-white p-2 overflow-hidden"
        title="Chat with us on WhatsApp"
      >
        <img
          src={encodeURI('/whatsapp logo.webp')}
          alt="WhatsApp"
          className="w-14 h-14 rounded-full object-cover"
          onError={(e) => { if (!e.currentTarget.dataset.fallback) { e.currentTarget.dataset.fallback = '1'; e.currentTarget.src = '/whatsapp.svg'; } }}
        />
      </a>

      {/* Admin toolbar appears for super users */}
      <AdminToolbar />
    </header>
  );
}
