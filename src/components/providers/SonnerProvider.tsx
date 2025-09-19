'use client';

import { Toaster } from 'sonner';

export default function SonnerProvider() {
  return (
    <Toaster
      position="top-right"
      expand={true}
      richColors={true}
      closeButton={true}
      toastOptions={{
        style: {
          background: 'white',
          border: '1px solid #e5e7eb',
          fontSize: '14px',
        },
        className: 'sonner-toast',
      }}
    />
  );
}