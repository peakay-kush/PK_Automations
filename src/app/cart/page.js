'use client';

import { useState, useEffect, useRef } from 'react';
import { normalizeKenyanPhone, isValidKenyanPhone } from '@/utils/helpers';
import { useRouter } from 'next/navigation';
import { getToken, fetchProfile } from '@/utils/auth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Trash2, Plus, Minus, ArrowLeft } from 'lucide-react';

export default function Cart() {
  const [isLoading, setIsLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isEmailReadOnly, setIsEmailReadOnly] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('invoice');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const [messageType, setMessageType] = useState('info');

  // Shipping / address fields
  const [county, setCounty] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [shippingAmt, setShippingAmt] = useState(0);
  const [shippingNote, setShippingNote] = useState('');
  const [shippingLocation, setShippingLocation] = useState(null);

  // public shipping locations and selection
  const [locationsList, setLocationsList] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [arrangeOwnShipping, setArrangeOwnShipping] = useState(false);
  const [addressLine, setAddressLine] = useState('');

  // modal ref for focus/scroll and helper to open modal and focus
  const modalRef = useRef(null);
  const mpesaIntervalRef = useRef(null);
  const [mpesaOrderId, setMpesaOrderId] = useState(null);
  const router = useRouter();
  const canProceedToCheckout = () => arrangeOwnShipping || Boolean(selectedLocationId);
  const openCheckout = () => {
    if (!canProceedToCheckout()) {
      setCheckoutMessage('Please select a shipping location or choose "I will arrange my own shipping" before proceeding to checkout');
      setMessageType('error');
      return;
    }

    setShowCheckout(true);
    setTimeout(() => { try { modalRef.current?.focus(); modalRef.current?.scrollTo({ top: 0 }); } catch (e){} }, 120);
  };

  // lock body scroll when modal is open to avoid sideways scrolling and ensure vertical scroll inside modal
  useEffect(() => {
    if (showCheckout) {
      try { document.body.style.overflow = 'hidden'; } catch (e) {}
    } else {
      try { document.body.style.overflow = ''; } catch (e) {}
    }
    return () => { try { document.body.style.overflow = ''; } catch (e) {} };
  }, [showCheckout]);

  // Poll Mpesa order status when an mpesaOrderId is present
  useEffect(() => {
    if (!mpesaOrderId) return;
    let tries = 0;
    mpesaIntervalRef.current = setInterval(async () => {
      tries++;
      try {
        const res = await fetch(`/api/orders/${mpesaOrderId}`);
        if (!res.ok) return;
        const j = await res.json();
        if (j?.ok && j.order) {
          const o = j.order;
          if (o.paid || o.status === 'paid') {
            if (mpesaIntervalRef.current) { clearInterval(mpesaIntervalRef.current); mpesaIntervalRef.current = null; }
            localStorage.setItem('cart', JSON.stringify([])); setCartItems([]); window.dispatchEvent(new Event('cartUpdated'));
            setShowCheckout(false);
            setCheckoutMessage('Payment confirmed. Redirecting to order details...');
            setMessageType('success');
            router.push(`/order/${mpesaOrderId}`);
            return;
          }
        }
      } catch (e) {
        // ignore transient errors
      }
      if (tries > 120) { // ~10 minutes at 5s interval
        if (mpesaIntervalRef.current) { clearInterval(mpesaIntervalRef.current); mpesaIntervalRef.current = null; }
        setCheckoutMessage('Payment confirmation is taking longer than expected. Please check your Order History or try again.');
        setMessageType('error');
      }
    }, 5000);

    return () => { if (mpesaIntervalRef.current) { clearInterval(mpesaIntervalRef.current); mpesaIntervalRef.current = null; } };
  }, [mpesaOrderId, router]);

  const handleCheckout = async () => {
    if (!name && !isLoggedIn) {
      setCheckoutMessage('Please provide your name');
      setMessageType('error');
      return;
    }
    if (!phone) {
      setCheckoutMessage('Please provide your phone number');
      setMessageType('error');
      return;
    }

    // normalize and validate phone (accept 2547,2541,07,01, +2547/+2541 and minor variations)
    const normalized = normalizeKenyanPhone(phone);
    if (!isValidKenyanPhone(phone)) {
      setCheckoutMessage('Phone number should be in these formats: 2547XXXXXXXX, 2541XXXXXXXX, 07XXXXXXXX, 01XXXXXXXX (or +2547...)');
      setMessageType('error');
      return;
    }

    // ensure shipping is set (via the summary selector) or user chose to arrange own shipping
    if (!arrangeOwnShipping && !selectedLocationId) {
      setCheckoutMessage('Please select a shipping location before proceeding to checkout');
      setMessageType('error');
      return;
    }

    // require county, city and town/home address for delivery unless the customer will arrange their own shipping
    if (!arrangeOwnShipping && (!county || !city || !addressLine || String(addressLine || '').trim().length < 3)) {
      setCheckoutMessage('Please provide county, city and town/home address for delivery');
      setMessageType('error');
      setIsSubmitting(false);
      return;
    }

    // require shipping to be calculated (if cart contains shippable items) - calculate shipping first if not present
    setIsSubmitting(true);
    setCheckoutMessage('');
    try {
      const subtotal = cartItems.reduce((s, it) => s + ((it.price || 0) * (it.quantity || 1)), 0);
      const payload = {
        name,
        phone: normalized,
        email,
        paymentMethod,
        items: cartItems,
        subtotal,
        total: subtotal + Number(shippingAmt || 0),
        shipping: Number(shippingAmt || 0),
        shippingAddress: (county || city || postcode || addressLine) ? { county, city, postcode, line: addressLine } : null,
        shippingLocation: shippingLocation || null
      };

      const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json();

      if (!res.ok) {
        setCheckoutMessage(json?.error || 'Checkout failed');
        setMessageType('error');
        return;
      }

      // If server initiated Mpesa STK push, set mpesaOrderId and wait for confirmation
      if (json?.mpesaInitiated) {
        setMpesaOrderId(json.order?.id || null);
        setCheckoutMessage('Mpesa prompt sent to your phone. Please complete the payment; we will confirm automatically.');
        setMessageType('info');
        return; // don't clear cart yet
      }

      // default invoice flow: mark order placed and clear cart
      setCheckoutMessage('Order placed successfully');
      setMessageType('success');
      // clear cart
      setCartItems([]);
      localStorage.setItem('cart', JSON.stringify([]));
      window.dispatchEvent(new Event('cartUpdated'));
      setShowCheckout(false);
    } catch (e) {
      console.error('checkout error', e);
      setCheckoutMessage('Failed to place the order (network error)');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  }; 

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileUser, setProfileUser] = useState(null);

  useEffect(() => {
    const raw = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItems(raw || []);
    setIsLoading(false);
    // determine login state on client only to avoid hydration mismatch
    try {
      const logged = !!getToken();
      setIsLoggedIn(logged);
      if (logged) {
        // fetch profile to auto-fill email and lock the field and hide inputs
        (async () => {
          try {
            const prof = await fetchProfile();
            if (prof) {
              setProfileUser(prof);
              if (prof.email) {
                setEmail(prof.email);
                setIsEmailReadOnly(true);
              }
              if (prof.name) setName(prof.name);
              if (prof.phone) setPhone(prof.phone);
            }
          } catch (e) { /* ignore */ }
        })();
      }
    } catch (e) { setIsLoggedIn(false); }
  }, []);

  useEffect(() => {
    async function loadLocations() {
      try {
        setLoadingLocations(true);
        const res = await fetch('/api/shipping/locations');
        if (!res.ok) throw new Error('Failed to fetch shipping locations');
        const j = await res.json();
        const list = j?.locations || j || [];
        setLocationsList(list);
      } catch (e) {
        setLocationsList([]);
      } finally { setLoadingLocations(false); }
    }
    loadLocations();
  }, []);



  const clearCart = () => {
    if (!confirm('Clear cart?')) return;
    localStorage.setItem('cart', JSON.stringify([]));
    setCartItems([]);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const changeQty = (idx, newQty) => {
    newQty = Math.max(1, Math.floor(Number(newQty) || 1));
    const item = cartItems[idx];
    if (!item) return;
    if (typeof item.stock === 'number' && newQty > item.stock) {
      alert(`Only ${item.stock} available`);
      return;
    }
    const newCart = cartItems.map((c, i) => (i === idx ? { ...c, quantity: newQty } : c));
    setCartItems(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <section className="bg-primary text-white py-12">
        <div className="container mx-auto">
          <h1 className="text-4xl font-montserrat font-bold">Shopping Cart</h1>
        </div>
      </section>

      <section className="flex-grow py-12">
        <div className="container mx-auto">
          {cartItems && cartItems.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((it, i) => (
                  <div key={i} className="bg-white rounded-lg p-6 shadow transition flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <img src={it.image || it.thumbnail || 'https://via.placeholder.com/80x80?text=No+Image'} alt={it.name || it.title} className="w-20 h-20 object-cover rounded" />
                      <div>
                        <div className="font-semibold">{it.name || it.title}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <button onClick={() => changeQty(i, (it.quantity || 1) - 1)} className="px-2 py-1 rounded border inline-flex items-center" title="Decrease quantity"><Minus size={14} /></button>
                          <div className="px-3">{it.quantity || 1}</div>
                          <button onClick={() => changeQty(i, (it.quantity || 1) + 1)} className="px-2 py-1 rounded border inline-flex items-center" title="Increase quantity"><Plus size={14} /></button>
                          {it.stock ? <span className="text-xs text-gray-400 ml-2">({it.stock} available)</span> : null}
                        </div>
                      </div>
                    </div>
                    <div className="text-accent font-bold">KSh {Number((it.price || 0) * (it.quantity || 1)).toLocaleString()}</div>
                    <button onClick={() => { const newCart = cartItems.filter((_, idx) => idx !== i); setCartItems(newCart); localStorage.setItem('cart', JSON.stringify(newCart)); window.dispatchEvent(new Event('cartUpdated')); }} className="text-red-500 ml-4"><Trash2 /></button>
                  </div>
                ))}

                <button onClick={clearCart} className="w-full border-2 border-red-500 text-red-500 hover:bg-red-50 font-bold py-2 rounded-lg transition">Clear Cart</button>
              </div>

              <div className="lg:col-span-1 bg-light rounded-lg p-6">
                <h2 className="font-bold text-lg text-primary mb-4">Order Summary</h2>
                <div className="flex justify-between"><span>Subtotal</span><span className="font-bold">KSh {cartItems.reduce((s, it) => s + ((it.price || 0) * (it.quantity || 1)), 0).toLocaleString()}</span></div>
                <div className="mt-4">
                  <div className="bg-light rounded-lg p-4 flex flex-col gap-4 relative">
                    <div className="w-full">
                      <div className="flex items-center justify-between w-full border-b border-gray-200 pb-3">
                        <h4 className="text-lg font-semibold text-primary">Order Summary</h4>
                      </div>

                      <div className="mt-3">
                        <div className="text-sm">Subtotal: <strong>KSh {Number(cartItems.reduce((s, it) => s + ((it.price || 0) * (it.quantity || 1)), 0)).toLocaleString()}</strong></div>
                        <div className="text-sm mt-2">Shipping: <strong>KSh {Number(shippingAmt || 0).toLocaleString()}</strong></div>
                        <div className="text-lg font-bold mt-2">Total: <strong>KSh {Number((cartItems.reduce((s, it) => s + ((it.price || 0) * (it.quantity || 1)), 0)) + Number(shippingAmt || 0)).toLocaleString()}</strong></div>

                        <div className="mt-4 border-t pt-4">
                          <label className="block text-sm font-medium">Shipping location</label>

                          <div className="mt-2">
                            {loadingLocations ? (
                              <div className="text-sm text-gray-500">Loading locations…</div>
                            ) : (
                              <select aria-label="Shipping location" value={selectedLocationId} onChange={(e) => {
                                const val = e.target.value;
                                setSelectedLocationId(val);
                                setArrangeOwnShipping(false);
                                if (!val) { setShippingAmt(0); setShippingNote(''); setShippingLocation(null); return; }
                                if (val === 'arrange') {
                                  setArrangeOwnShipping(true);
                                  setShippingAmt(0); setShippingNote('Customer will arrange shipping'); setShippingLocation({ note: 'Customer arranged' });
                                  return;
                                }
                                const loc = locationsList.find(l => String(l.id) === String(val));
                                if (loc) { setShippingAmt(Number(loc.charge || 0)); setShippingNote(loc.note || loc.name || ''); setShippingLocation(loc); }
                              }} className="w-full rounded border px-3 py-2 bg-white">
                                <option value="">Select a location</option>
                                {locationsList.map(l => <option key={l.id} value={l.id}>{l.name} — KSh {Number(l.charge || 0).toLocaleString()}</option>)}
                                <option value="arrange">I will arrange my own shipping</option>
                              </select>
                            )}
                          </div>

                          {shippingNote && <div className="mt-2 text-xs text-gray-600">{shippingNote}</div>}

                          <div className="mt-4 flex flex-col gap-3">
                            <button onClick={openCheckout} disabled={!canProceedToCheckout()} className={`w-full ${canProceedToCheckout() ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'} font-bold py-3 rounded-lg text-center`}>Proceed to Checkout</button>
                            <Link href="/shop" className="w-full inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-primary font-bold py-3 rounded-lg transition"> <ArrowLeft size={18} /> Continue Shopping</Link>
                            {isLoggedIn && <Link href="/orders" className="w-full inline-flex items-center justify-center gap-2 text-sm text-blue-600 hover:underline">View Order History</Link>}
                            {!canProceedToCheckout() && <div className="text-xs text-red-600">Select a shipping location or choose "I will arrange my own shipping" to continue</div>}
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>

                  {showCheckout && (
                    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
                      <div className="fixed inset-0 bg-black opacity-40" onClick={() => setShowCheckout(false)}></div>
                      <div role="dialog" aria-modal="true" tabIndex={-1} ref={modalRef} className="bg-white rounded-lg max-w-3xl w-full p-6 z-10 shadow-lg max-h-[calc(100vh-160px)] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-primary">Checkout</h3>
                          <button onClick={() => setShowCheckout(false)} className="text-gray-500 hover:text-gray-800">Close</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            {/* Personal details */}
                            {!isLoggedIn ? (
                              <div className="mb-3">
                                <label className="block text-sm font-medium">Full name <span className="text-red-500">*</span></label>
                                <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" placeholder="Jane Doe" />
                              </div>
                            ) : (
                              <>
                                <div className="mb-3">
                                  <label className="block text-sm font-medium">Full name</label>
                                  <input value={name || profileUser?.name || ''} readOnly className="mt-1 w-full rounded border px-3 py-2 bg-gray-50" />
                                </div>

                                <div className="mb-3">
                                  <label className="block text-sm font-medium">Phone (Mpesa) <span className="text-red-500">*</span></label>
                                  {profileUser?.phone ? (
                                    <input value={phone} readOnly className="mt-1 w-full rounded border px-3 py-2 bg-gray-50" />
                                  ) : (
                                    <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" placeholder="2547XXXXXXXX" />
                                  )}
                                </div>

                                <div className="mb-3">
                                  <label className="block text-sm font-medium">Email</label>
                                  <input value={email || profileUser?.email || ''} readOnly className="mt-1 w-full rounded border px-3 py-2 bg-gray-50" />
                                </div>

                                <div className="mt-2 text-xs text-gray-500">Details have been autofilled from your profile — <a href="/profile" className="text-blue-600 hover:underline">edit profile</a> to change details.</div>
                              </>
                            )}

                            {!arrangeOwnShipping && (
                              <>
                                <div className="mb-3">
                                  <label className="block text-sm font-medium">County <span className="text-red-500">*</span></label>
                                  <input value={county} onChange={(e) => setCounty(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" placeholder="e.g., Nairobi" />
                                </div>

                                <div className="mb-3">
                                  <label className="block text-sm font-medium">City <span className="text-red-500">*</span></label>
                                  <input value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" placeholder="e.g., Westlands" />
                                </div>

                                <div className="mb-3">
                                  <label className="block text-sm font-medium">Town / Home address <span className="text-red-500">*</span></label>
                                  <input value={addressLine} onChange={(e) => setAddressLine(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" placeholder="Town, estate, house number" />
                                </div>
                              </>
                            )}

                            <div className="mb-2">
                              <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={arrangeOwnShipping} onChange={(e) => { setArrangeOwnShipping(e.target.checked); if (e.target.checked) { setShippingAmt(0); setShippingNote('Customer will arrange shipping'); setSelectedLocationId('arrange'); setShippingLocation({ note: 'Customer arranged' }); } else { setSelectedLocationId(''); setShippingNote(''); setShippingLocation(null); } }} /> <span>I will arrange my own shipping</span></label>
                            </div>

                          </div>

                          <div>
                            <div className="bg-light rounded p-4">
                              <h4 className="font-semibold">Order summary</h4>
                              <div className="mt-3 text-sm">Subtotal: <strong>KSh {cartItems.reduce((s, it) => s + ((it.price || 0) * (it.quantity || 1)), 0).toLocaleString()}</strong></div>
                              <div className="mt-2 text-sm">Shipping: <strong>KSh {Number(shippingAmt || 0).toLocaleString()}</strong></div>
                              <div className="mt-3 text-lg font-bold">Total: <strong>KSh {(cartItems.reduce((s, it) => s + ((it.price || 0) * (it.quantity || 1)), 0) + Number(shippingAmt || 0)).toLocaleString()}</strong></div>

                              <div className="mt-4">
                                <label className="block text-sm font-medium">Payment Method</label>
                                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="mt-1 w-full rounded border px-3 py-2">
                                  <option value="free">Free / Invoice</option>
                                  <option value="mpesa">Mpesa (STK Push)</option>
                                </select>
                              </div>

                              {checkoutMessage && <div className={`mt-4 p-2 rounded ${messageType === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{checkoutMessage}</div>}

                              {mpesaOrderId && (
                                <div className="mt-3 text-sm bg-yellow-50 rounded p-2">
                                  <div>Mpesa payment in progress for order <strong>{mpesaOrderId}</strong>. Use the button below to check status manually or wait for automatic confirmation.</div>
                                  <div className="mt-2">
                                    <button onClick={async () => {
                                      try {
                                        setCheckoutMessage('Checking payment status...'); setMessageType('info');
                                        const r = await fetch(`/api/orders/${mpesaOrderId}`);
                                        if (!r.ok) { setCheckoutMessage('Failed to check payment status'); setMessageType('error'); return; }
                                        const j = await r.json();
                                        if (j?.ok && j.order) {
                                          if (j.order.paid || j.order.status === 'paid') {
                                            setCheckoutMessage('Payment confirmed. Redirecting...'); setMessageType('success');
                                            localStorage.setItem('cart', JSON.stringify([])); setCartItems([]); window.dispatchEvent(new Event('cartUpdated'));
                                            setShowCheckout(false); router.push(`/order/${mpesaOrderId}`);
                                            return;
                                          } else {
                                            setCheckoutMessage('No payment yet. Please complete the Mpesa prompt and try again or wait a moment.'); setMessageType('info');
                                          }
                                        }
                                      } catch (e) { setCheckoutMessage('Network error while checking payment'); setMessageType('error'); }
                                    }} className="mt-2 px-3 py-2 rounded bg-blue-50 text-blue-700 border">Check payment status</button>
                                  </div>
                                </div>
                              )}

                              <div className="mt-6 flex items-center justify-end gap-3">
                                <button onClick={() => setShowCheckout(false)} className="px-4 py-2 rounded border">Cancel</button>
                                <button onClick={handleCheckout} disabled={isSubmitting} className={`px-4 py-2 rounded font-bold ${isSubmitting ? 'bg-gray-300 text-gray-600' : 'bg-accent text-white'}`}>
                                  {isSubmitting ? 'Placing order...' : 'Place Order'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-light rounded-lg">
              <h2 className="text-2xl font-montserrat font-bold text-primary mb-4">Your cart is empty</h2>
              <p className="text-gray-700 mb-8">Start shopping to add items to your cart</p>
              <div className="flex items-center justify-center gap-4">
                <Link href="/shop" className="inline-flex items-center gap-2 bg-accent hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition"><ArrowLeft size={18} /> Continue Shopping</Link>
                {isLoggedIn && <Link href="/orders" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline">View Order History</Link>}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
