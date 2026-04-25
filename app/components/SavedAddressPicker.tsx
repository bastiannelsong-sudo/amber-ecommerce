'use client';

import { useEffect, useState } from 'react';
import type { CustomerAddress } from '../lib/types';
import { addressesService } from '../lib/services/addresses.service';
import { useAuthStore } from '../lib/stores/auth.store';

interface Props {
  /** Dispara cuando el usuario elige una direccion guardada (o null para nueva) */
  onSelect: (address: CustomerAddress | null) => void;
  /** Id seleccionado actualmente, o null si es nueva direccion */
  selectedId: number | null;
}

/**
 * Muestra las direcciones guardadas del customer autenticado.
 * Si no hay sesion o no hay direcciones, no renderiza nada y el checkout
 * sigue con el form inline tradicional (guest checkout).
 */
export default function SavedAddressPicker({ onSelect, selectedId }: Props) {
  const user = useAuthStore((state) => state.user);
  const [addresses, setAddresses] = useState<CustomerAddress[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setAddresses(null);
      return;
    }
    setLoading(true);
    addressesService
      .list()
      .then((list) => {
        setAddresses(list);
        // Auto-seleccionar la default si no hay nada seleccionado aun.
        if (list.length > 0 && selectedId === null) {
          const def = list.find((a) => a.is_default) ?? list[0];
          onSelect(def);
        }
      })
      .catch(() => setAddresses([]))
      .finally(() => setLoading(false));
    // Intencional: onSelect estable + solo correr al cambiar user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!user || !addresses) return null;
  if (loading) {
    return (
      <div className="mb-6 px-4 py-3 border border-pearl-200 rounded text-sm text-platinum-500">
        Cargando tus direcciones guardadas...
      </div>
    );
  }
  if (addresses.length === 0) return null;

  return (
    <div className="mb-6 border border-pearl-200 rounded-lg p-4 sm:p-6 bg-pearl-50/40">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-obsidian-900 uppercase tracking-wider">
          Usar direccion guardada
        </h3>
        <span className="text-xs text-platinum-600">
          {addresses.length} guardada{addresses.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="space-y-2">
        {addresses.map((addr) => (
          <label
            key={addr.id}
            className={`flex items-start gap-3 p-3 rounded cursor-pointer border transition-colors ${
              selectedId === addr.id
                ? 'border-amber-gold-500 bg-amber-gold-50/60'
                : 'border-pearl-300 bg-white hover:border-amber-gold-300'
            }`}
          >
            <input
              type="radio"
              name="saved-address"
              className="mt-1 accent-amber-gold-500"
              checked={selectedId === addr.id}
              onChange={() => onSelect(addr)}
            />
            <div className="flex-1 text-sm text-platinum-700">
              <p className="font-medium text-obsidian-900">
                {addr.street}
                {addr.apartment ? `, ${addr.apartment}` : ''}
                {addr.is_default && (
                  <span className="ml-2 text-xs bg-amber-gold-500 text-white px-2 py-0.5 rounded uppercase tracking-wide">
                    Principal
                  </span>
                )}
              </p>
              <p className="text-xs text-platinum-600 mt-0.5">
                {addr.city} · {addr.region}
                {addr.zip_code ? ` · ${addr.zip_code}` : ''}
              </p>
            </div>
          </label>
        ))}

        <label
          className={`flex items-center gap-3 p-3 rounded cursor-pointer border transition-colors ${
            selectedId === null
              ? 'border-amber-gold-500 bg-amber-gold-50/60'
              : 'border-dashed border-pearl-300 bg-white hover:border-amber-gold-300'
          }`}
        >
          <input
            type="radio"
            name="saved-address"
            className="accent-amber-gold-500"
            checked={selectedId === null}
            onChange={() => onSelect(null)}
          />
          <span className="text-sm text-obsidian-900">
            Usar una nueva direccion (completar abajo)
          </span>
        </label>
      </div>
    </div>
  );
}
