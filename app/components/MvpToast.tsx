'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

export default function MvpToast() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('mvp') === '1') {
      toast('Compra por WhatsApp para atencion personalizada', {
        icon: '💬',
        duration: 4000,
      });
      // Limpiar el parametro de la URL sin recargar
      window.history.replaceState(null, '', '/catalogo');
    }
  }, [searchParams]);

  return null;
}
