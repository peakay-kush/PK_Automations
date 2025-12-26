'use client';

import { useState } from 'react';

export default function ImageWithFade({ src, alt, className = '', placeholderColor = '#f8fafc', ...rest }) {
  const [loaded, setLoaded] = useState(false);
  const handleLoad = () => setLoaded(true);
  const handleError = (e) => { e.target.onerror = null; setLoaded(true); e.target.src = 'https://via.placeholder.com/400x250?text=Tutorial'; };

  return (
    <div className={`w-full h-full ${className} relative overflow-hidden`} style={{ backgroundColor: placeholderColor }}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100 group-hover:scale-105 transform-gpu transition-transform duration-300' : 'opacity-0'}`}
        style={{ willChange: 'opacity, transform' }}
        {...rest}
      />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          {/* small skeleton */}
          <div className="w-24 h-16 bg-gray-200 animate-pulse rounded" />
        </div>
      )}
    </div>
  );
}
