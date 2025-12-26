'use client';

import { useState, useRef, useEffect } from 'react';
import { getToken } from '@/utils/auth';

export default function AdminImageUploader({ value, onChange, accept = 'image/*', allowCrop = true }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // cropping state
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState('');
  const [cropFile, setCropFile] = useState(null);
  const [imgNatural, setImgNatural] = useState({ width: 0, height: 0 });
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  // refs for smoother dragging and direct DOM updates
  const imgElRef = useRef(null);
  const previewElRef = useRef(null);
  const posRef = useRef({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const dragStartRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function isVideo(url) {
    if (!url) return false;
    return /\.(mp4|webm|ogg|mov|m4v)(?:\?|$)/i.test(url) || /video\//i.test(url);
  }

  async function uploadFileBlob(file, mimeType) {
    const fd = new FormData();
    fd.append('file', file, file.name || 'cropped.jpg');
    const token = getToken();
    const res = await fetch('/api/admin/uploads', { method: 'POST', body: fd, headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json && json.error ? json.error : 'Upload failed');
    }
    const json = await res.json();
    if (json && json.url) return json.url;
    throw new Error('Upload did not return url');
  }

  async function handleUploadOriginal(f) {
    const fd = new FormData();
    fd.append('file', f);
    const token = getToken();
    const res = await fetch('/api/admin/uploads', { method: 'POST', body: fd, headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json && json.error ? json.error : 'Upload failed');
    }
    const json = await res.json();
    if (json && json.url) return json.url;
    throw new Error('Upload did not return url');
  }

  async function onPick(e) {
    setError('');
    const f = e.target.files && e.target.files[0];
    if (!f) return;

    // If cropping is allowed and file is an image, open crop UI
    const isImg = f.type && f.type.startsWith('image/');
    if (allowCrop && isImg) {
      const url = URL.createObjectURL(f);
      setCropSrc(url);
      setCropFile(f);
      setCropOpen(true);
      // reset crop state
      setPos({ x: 0, y: 0 });
      setScale(1);
      setImgNatural({ width: 0, height: 0 });
      return;
    }

    // otherwise upload directly
    setBusy(true);
    try {
      const url = await handleUploadOriginal(f);
      onChange(url, f.type);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  function onImageLoad(e) {
    const iw = e.currentTarget.naturalWidth;
    const ih = e.currentTarget.naturalHeight;
    setImgNatural({ width: iw, height: ih });
    // center image in crop area
    const cw = 600; const ch = 400; // crop preview size
    const baseScale = Math.max(cw / iw, ch / ih);
    const displayW = iw * baseScale;
    const displayH = ih * baseScale;
    const initialPos = { x: (cw - displayW) / 2, y: (ch - displayH) / 2 };
    setPos(initialPos);
    posRef.current = initialPos;
    setScale(1);

    // set refs and apply initial DOM styles for smoothness
    imgElRef.current = e.currentTarget;
    if (imgElRef.current) {
      imgElRef.current.style.left = initialPos.x + 'px';
      imgElRef.current.style.top = initialPos.y + 'px';
      imgElRef.current.style.transform = `scale(${1})`;
    }
    if (previewElRef.current) {
      previewElRef.current.style.objectPosition = `${-initialPos.x}px ${-initialPos.y}px`;
      previewElRef.current.style.transform = `scale(${1})`;
    }
  }

  function onPointerDown(e) {
    try { e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
    draggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY, orig: { ...posRef.current } };
    imgElRef.current = e.currentTarget;
  }

  function onPointerMove(e) {
    if (!draggingRef.current || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const newPos = { x: dragStartRef.current.orig.x + dx, y: dragStartRef.current.orig.y + dy };
    posRef.current = newPos;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (imgElRef.current) {
        imgElRef.current.style.left = newPos.x + 'px';
        imgElRef.current.style.top = newPos.y + 'px';
        imgElRef.current.style.transform = `scale(${scale})`;
      }
      if (previewElRef.current) {
        previewElRef.current.style.objectPosition = `${-newPos.x}px ${-newPos.y}px`;
        previewElRef.current.style.transform = `scale(${scale})`;
      }
    });
  }

  function onPointerUp(e) {
    try { e.currentTarget.releasePointerCapture && e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) {}
    draggingRef.current = false;
    dragStartRef.current = null;
    // commit position to react state so cropping math uses latest
    setPos(posRef.current);
  }

  async function applyCropAndUpload() {
    if (!cropFile || !imgNatural.width) return;
    setBusy(true);
    setError('');
    try {
      // preview size (same as shown to user)
      const cw = 1200; const ch = 800; // use larger to get better result
      const canvas = document.createElement('canvas');
      canvas.width = cw; canvas.height = ch;
      const ctx = canvas.getContext('2d');

      const img = new Image();
      img.src = cropSrc;
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });

      const iw = imgNatural.width; const ih = imgNatural.height;
      const baseScale = Math.max(cw / iw, ch / ih);
      const currentScale = baseScale * scale;
      const sx = Math.max(0, Math.min(iw, Math.round((0 - pos.x) / currentScale)));
      const sy = Math.max(0, Math.min(ih, Math.round((0 - pos.y) / currentScale)));
      const sWidth = Math.max(1, Math.round(Math.min(iw - sx, cw / currentScale)));
      const sHeight = Math.max(1, Math.round(Math.min(ih - sy, ch / currentScale)));

      ctx.fillStyle = '#fff'; ctx.fillRect(0,0,cw,ch);
      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, cw, ch);

      const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.92));
      const fileName = (cropFile && cropFile.name) ? cropFile.name.replace(/\.[^.]+$/, '') + '-crop.jpg' : 'upload-crop.jpg';
      const blobFile = new File([blob], fileName, { type: 'image/jpeg' });
      const uploadedUrl = await uploadFileBlob(blobFile, 'image/jpeg');
      onChange(uploadedUrl, 'image/jpeg');
      // cleanup
      setCropOpen(false);
      URL.revokeObjectURL(cropSrc);
      setCropSrc(''); setCropFile(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  async function uploadOriginalWhileInCrop() {
    if (!cropFile) return;
    setBusy(true);
    setError('');
    try {
      const url = await handleUploadOriginal(cropFile);
      onChange(url, cropFile.type);
      setCropOpen(false);
      URL.revokeObjectURL(cropSrc);
      setCropSrc(''); setCropFile(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {value ? (
        isVideo(value) ? (
          <video src={value} controls className="h-28 w-auto object-contain border" />
        ) : (
          <img src={value} alt="preview" className="h-28 w-auto object-contain border" />
        )
      ) : <div className="h-28 w-full flex items-center justify-center border text-sm text-gray-500">No file</div>}

      <div className="flex items-center gap-2">
        <label className="px-3 py-2 border rounded bg-white cursor-pointer">
          <input onChange={onPick} type="file" accept={accept} className="hidden" />
          {busy ? 'Uploading...' : (accept && accept.startsWith('video') ? 'Upload video' : 'Upload image')}
        </label>
        {value && (
          <button type="button" onClick={async () => {
            // try to delete from server when possible
            if (!confirm('Delete this file from server?')) {
              onChange('');
              return;
            }
            // for external urls we simply clear the field; for local uploads, attempt server delete
            if (!value.startsWith('/uploads/')) {
              onChange('');
              return;
            }
            setBusy(true);
            setError('');
            try {
              const token = getToken();
              const res = await fetch('/api/admin/uploads', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify({ url: value }) });
              if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j && j.error ? j.error : 'Failed to delete');
              }
              onChange('');
            } catch (err) {
              setError(String(err));
            } finally {
              setBusy(false);
            }
          }} className="px-3 py-2 rounded border">Delete</button>
        )}
      </div>

      {error && <div className="text-red-600">{error}</div>}

      {/* Crop Modal */}
      {cropOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded p-4 max-w-4xl w-full">
            <h3 className="font-bold mb-2">Crop & Position Image</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="w-full bg-gray-100 overflow-hidden" style={{ width: '100%', height: 400, position: 'relative' }}>
                  <img
                    ref={imgElRef}
                    src={cropSrc}
                    alt="crop"
                    onLoad={onImageLoad}
                    style={{ position: 'absolute', top: pos.y + 'px', left: pos.x + 'px', transform: `scale(${scale})`, transformOrigin: 'top left', cursor: draggingRef.current ? 'grabbing' : 'grab', touchAction: 'none' }}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                    className="select-none -webkit-user-drag-none"
                  />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <label className="text-sm">Zoom</label>
                  <input type="range" min={1} max={3} step={0.01} value={scale} onChange={(e) => {
                    const v = Number(e.target.value);
                    setScale(v);
                    if (rafRef.current) cancelAnimationFrame(rafRef.current);
                    rafRef.current = requestAnimationFrame(() => {
                      if (imgElRef.current) imgElRef.current.style.transform = `scale(${v})`;
                      if (previewElRef.current) previewElRef.current.style.transform = `scale(${v})`;
                    });
                  }} className="flex-1" />
                  <button onClick={() => { setScale(1); setPos({ x: 0, y: 0 }); }} className="px-3 py-1 border rounded">Reset</button>
                </div>
              </div>

              <div>
                <div className="mb-2 text-sm text-gray-600">Preview</div>
                <div className="w-full h-64 bg-gray-100 overflow-hidden flex items-center justify-center">
                  <img ref={previewElRef} src={cropSrc} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${-pos.x}px ${-pos.y}px`, transform: `scale(${scale})` }} />
                </div>

                <div className="mt-4 flex gap-2">
                  <button onClick={applyCropAndUpload} disabled={busy} className="px-4 py-2 bg-accent text-white rounded">Apply & Upload</button>
                  <button onClick={uploadOriginalWhileInCrop} disabled={busy} className="px-4 py-2 border rounded">Upload Original</button>
                  <button onClick={() => { setCropOpen(false); URL.revokeObjectURL(cropSrc); setCropSrc(''); setCropFile(null); }} className="px-4 py-2 border rounded">Cancel</button>
                </div>
                <div className="text-sm text-gray-500 mt-2">Tip: drag the image to position it and use Zoom to scale.</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
