'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CustomerAddress } from '../lib/types';
import { addressesService } from '../lib/services/addresses.service';
import AddressFormModal from './AddressFormModal';

export default function AddressBookSection() {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerAddress | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await addressesService.list();
      setAddresses(list);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'No se pudieron cargar tus direcciones.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaved = (saved: CustomerAddress) => {
    setAddresses((prev) => {
      const others = prev.map((a) =>
        saved.is_default ? { ...a, is_default: false } : a,
      );
      const idx = others.findIndex((a) => a.id === saved.id);
      if (idx >= 0) {
        const next = [...others];
        next[idx] = saved;
        return next;
      }
      return [...others, saved];
    });
  };

  const handleDelete = async (address: CustomerAddress) => {
    if (!confirm(`Eliminar direccion "${address.street}"?`)) return;
    try {
      await addressesService.remove(address.id);
      setAddresses((prev) => prev.filter((a) => a.id !== address.id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar.');
    }
  };

  const handleSetDefault = async (address: CustomerAddress) => {
    try {
      const updated = await addressesService.setDefault(address.id);
      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          is_default: a.id === updated.id,
        })),
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al marcar default.');
    }
  };

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (address: CustomerAddress) => {
    setEditing(address);
    setModalOpen(true);
  };

  return (
    <div className="bg-white shadow-luxury rounded-lg p-8">
      <div className="flex items-center justify-between mb-8">
        <h2
          className="text-3xl font-light text-obsidian-900"
          style={{ fontFamily: 'var(--font-cormorant)' }}
        >
          Mis Direcciones
        </h2>
        <button
          type="button"
          onClick={openCreate}
          className="px-6 py-2 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors"
        >
          + Nueva Direccion
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-platinum-500">Cargando...</div>
      ) : error ? (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
          {error}
        </div>
      ) : addresses.length === 0 ? (
        <div className="py-12 text-center text-platinum-500 border border-dashed border-pearl-300 rounded-lg">
          <p className="mb-4">Todavia no tenes direcciones guardadas.</p>
          <button
            type="button"
            onClick={openCreate}
            className="text-sm text-amber-gold-600 hover:text-amber-gold-700 underline underline-offset-4"
          >
            Agrega la primera
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`rounded-lg p-6 relative ${
                addr.is_default
                  ? 'border-2 border-amber-gold-500'
                  : 'border border-pearl-300'
              }`}
            >
              {addr.is_default && (
                <span className="absolute top-4 right-4 bg-amber-gold-500 text-white text-xs px-2 py-1 rounded uppercase tracking-wide">
                  Principal
                </span>
              )}
              <p className="text-sm text-platinum-700 leading-relaxed">
                {addr.street}
                {addr.apartment ? `, ${addr.apartment}` : ''}
                <br />
                {addr.city}
                <br />
                {addr.region}
                {addr.zip_code ? ` — ${addr.zip_code}` : ''}
              </p>
              <div className="flex flex-wrap gap-x-2 gap-y-1 mt-4 text-sm">
                <button
                  type="button"
                  onClick={() => openEdit(addr)}
                  className="text-amber-gold-600 hover:text-amber-gold-700"
                >
                  Editar
                </button>
                <span className="text-platinum-400">|</span>
                <button
                  type="button"
                  onClick={() => handleDelete(addr)}
                  className="text-red-600 hover:text-red-700"
                >
                  Eliminar
                </button>
                {!addr.is_default && (
                  <>
                    <span className="text-platinum-400">|</span>
                    <button
                      type="button"
                      onClick={() => handleSetDefault(addr)}
                      className="text-obsidian-700 hover:text-obsidian-900"
                    >
                      Marcar principal
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddressFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        editing={editing}
      />
    </div>
  );
}
