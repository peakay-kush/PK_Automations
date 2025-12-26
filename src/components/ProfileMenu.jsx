'use client';

import { useState, useEffect, useRef } from 'react';
import { getToken } from '@/utils/auth';
import { User, Edit, LogOut } from 'lucide-react';

export default function ProfileMenu({ user, setUser }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Image cropping state
  const [imageSrc, setImageSrc] = useState(null); // selected file dataURL
  const [imgNaturalWidth, setImgNaturalWidth] = useState(0);
  const [imgNaturalHeight, setImgNaturalHeight] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStateRef = useRef({ startX: 0, startY: 0, startOffsetX: 0, startOffsetY: 0 });

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setProfileImage(user.profileImage || '');
    } else {
      setName(''); setEmail(''); setPhone(''); setProfileImage('');
    }
  }, [user]);

  const initials = (user?.name || 'U').split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase();

  const onFileChange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target.result;
      setImageSrc(data);
      const img = new Image();
      img.onload = () => {
        setImgNaturalWidth(img.width);
        setImgNaturalHeight(img.height);
        setZoom(1);
        // center image in viewport
        const vw = 200; const vh = 200;
        const dw = img.width * 1; const dh = img.height * 1;
        const ox = (vw - dw) / 2; const oy = (vh - dh) / 2;
        setOffsetX(ox);
        setOffsetY(oy);
      };
      img.src = data;
    };
    reader.readAsDataURL(f);
  };

  const onZoomChange = (val) => {
    // re-center on zoom change
    setZoom(val);
    if (!imgNaturalWidth) return;
    const vw = 200; const vh = 200;
    const dw = imgNaturalWidth * val; const dh = imgNaturalHeight * val;
    const ox = (vw - dw) / 2; const oy = (vh - dh) / 2;
    setOffsetX(ox); setOffsetY(oy);
  };

  const resetImage = () => {
    setImageSrc(null);
    setImgNaturalWidth(0); setImgNaturalHeight(0);
    setZoom(1); setOffsetX(0); setOffsetY(0);
  };

  const onMouseDown = (e) => {
    e.preventDefault();
    setDragging(true);
    dragStateRef.current.startX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    dragStateRef.current.startY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    dragStateRef.current.startOffsetX = offsetX;
    dragStateRef.current.startOffsetY = offsetY;
  };
  const onMouseMove = (e) => {
    if (!dragging) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    const dx = clientX - dragStateRef.current.startX;
    const dy = clientY - dragStateRef.current.startY;
    const newX = dragStateRef.current.startOffsetX + dx;
    const newY = dragStateRef.current.startOffsetY + dy;
    // clamp
    const pw = 200; const ph = 200;
    const dw = imgNaturalWidth * zoom; const dh = imgNaturalHeight * zoom;
    if (dw <= pw) {
      const centerX = (pw - dw) / 2;
      setOffsetX(centerX);
    } else {
      const minX = pw - dw; // negative
      const maxX = 0;
      setOffsetX(Math.max(minX, Math.min(maxX, newX)));
    }
    if (dh <= ph) {
      const centerY = (ph - dh) / 2;
      setOffsetY(centerY);
    } else {
      const minY = ph - dh;
      const maxY = 0;
      setOffsetY(Math.max(minY, Math.min(maxY, newY)));
    }
  };
  const onMouseUp = () => { setDragging(false); };

  const getCroppedDataUrl = () => {
    return new Promise((resolve, reject) => {
      if (!imageSrc) return resolve(null);
      const img = new Image();
      img.onload = () => {
        const vw = 200; const vh = 200; const out = 400;
        const sx = Math.max(0, -offsetX / zoom);
        const sy = Math.max(0, -offsetY / zoom);
        const sw = Math.min(img.width - sx, vw / zoom);
        const sh = Math.min(img.height - sy, vh / zoom);
        const canvas = document.createElement('canvas');
        canvas.width = out; canvas.height = out;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0,0,out,out);
        try {
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, out, out);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          resolve(dataUrl);
        } catch (e) { reject(e); }
      };
      img.onerror = reject;
      img.src = imageSrc;
    });
  };

  const save = async () => {
    setSaving(true); setMessage(null);
    try {
      const token = getToken();
      if (!token) throw new Error('Not authenticated');
      let finalImage = profileImage;
      if (imageSrc) {
        const cropped = await getCroppedDataUrl();
        if (cropped) finalImage = cropped;
      }
      const res = await fetch('/api/auth/profile/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ name, email, phone, profileImage: finalImage })
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || 'Save failed');
      setUser(j.user);
      setMessage('Profile updated');
      setEditing(false);
      setOpen(false);
      // notify other UI parts
      window.dispatchEvent(new Event('profileUpdated'));
    } catch (e) {
      setMessage(String(e.message || e));
    } finally { setSaving(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('pkat_token');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 p-2 hover:bg-light dark:hover:bg-primary rounded-lg transition">
        {user?.profileImage ? (
          <img src={user.profileImage} alt={user.name || 'Profile'} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-semibold">{initials}</div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-dark border rounded shadow p-4 z-50">
          {!editing ? (
            <div className="text-center">
              <div className="flex flex-col items-center gap-2">
                {user?.profileImage ? <img src={user.profileImage} alt={user.name || 'Profile'} className="w-16 h-16 rounded-full object-cover" /> : <div className="w-16 h-16 rounded-full bg-accent text-white flex items-center justify-center font-semibold">{initials}</div>}
                <div className="font-semibold mt-1">{user?.name || 'User'}</div>
                <div className="text-sm text-gray-600">{user?.email}</div>
              </div>

              <div className="mt-3 space-y-2">
                <button onClick={() => setEditing(true)} className="w-full flex items-center gap-2 justify-center py-2 bg-blue-50 text-blue-700 rounded"> <Edit size={16} /> Edit profile</button>
                <button onClick={handleLogout} className="w-full flex items-center gap-2 justify-center py-2 bg-red-50 text-red-700 rounded"> <LogOut size={16} /> Logout</button>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-sm font-semibold mb-2">Edit profile</div>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium">Name</label>
                  <input className="mt-1 w-full rounded border px-2 py-1" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium">Email</label>
                  <input className="mt-1 w-full rounded border px-2 py-1" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium">Phone</label>
                  <input className="mt-1 w-full rounded border px-2 py-1" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="2547XXXXXXXX" />
                </div>
                <div>
                  <label className="block text-xs font-medium">Profile image</label>

                  <div className="mt-2">
                    <input type="file" accept="image/*" onChange={(e) => onFileChange(e)} />
                  </div>

                  {imageSrc ? (
                    <div className="mt-2">
                      <div className="w-40 h-40 border overflow-hidden relative" onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp} onTouchStart={onMouseDown} onTouchMove={onMouseMove} onTouchEnd={onMouseUp} style={{ touchAction: 'none' }}>
                        <div style={{ width: 200, height: 200, backgroundImage: `url(${imageSrc})`, backgroundSize: `${imgNaturalWidth * zoom}px ${imgNaturalHeight * zoom}px`, backgroundPosition: `${offsetX}px ${offsetY}px` }}></div>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <label className="text-xs">Zoom</label>
                        <input type="range" min="0.2" max="3" step="0.01" value={zoom} onChange={(e) => onZoomChange(Number(e.target.value))} />
                        <button onClick={resetImage} className="px-2 py-1 border rounded text-xs">Reset</button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <input className="mt-1 w-full rounded border px-2 py-1" value={profileImage} onChange={(e) => setProfileImage(e.target.value)} placeholder="Or paste image URL (https://...)" />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <button onClick={save} disabled={saving} className="flex-1 py-2 bg-accent text-white rounded">{saving ? 'Saving…' : 'Save'}</button>
                <button onClick={() => { setEditing(false); setMessage(null); }} className="py-2 px-3 border rounded">Cancel</button>
              </div>
              {message && <div className="mt-2 text-sm text-gray-700">{message}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
