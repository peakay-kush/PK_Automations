import React from 'react';

// PdfViewer: Disabled — site no longer supports inline PDF rendering.
export default function PdfViewer() {
  if (typeof window !== 'undefined') console.warn('PdfViewer used but PDF support is disabled.');
  return null;
}
