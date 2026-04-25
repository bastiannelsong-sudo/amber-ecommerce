'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ChileGeoResponse, CustomerAddress } from '../lib/types';
import {
  addressesService,
  type CreateAddressInput,
} from '../lib/services/addresses.service';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (address: CustomerAddress) => void;
  editing?: CustomerAddress | null;
}

interface FormState {
  street: string;
  apartment: string;
  region: string;
  city: string;
  zip_code: string;
  is_default: boolean;
}

const emptyForm = (seed?: CustomerAddress | null): FormState => ({
  street: seed?.street ?? '',
  apartment: seed?.apartment ?? '',
  region: seed?.region ?? '',
  city: seed?.city ?? '',
  zip_code: seed?.zip_code ?? '',
  is_default: seed?.is_default ?? false,
});

export default function AddressFormModal({
  open,
  onClose,
  onSaved,
  editing = null,
}: Props) {
  const [geo, setGeo] = useState<ChileGeoResponse | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm(editing));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form al abrir/cambiar el address editando.
  useEffect(() => {
    if (open) {
      setForm(emptyForm(editing));
      setError(null);
    }
  }, [open, editing]);

  // Cargar catalogo CL una sola vez al montar (cache del navegador hace el resto).
  useEffect(() => {
    if (!geo) {
      addressesService
        .getGeo()
        .then(setGeo)
        .catch(() => setError('No se pudo cargar el catalogo de regiones.'));
    }
  }, [geo]);

  const communesOfRegion = useMemo(() => {
    if (!geo) return [];
    const region = geo.regions.find((r) => r.short_name === form.region);
    return region?.communes ?? [];
  }, [geo, form.region]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.street || !form.region || !form.city) {
      setError('Completa calle, region y comuna.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: CreateAddressInput = {
        street: form.street.trim(),
        apartment: form.apartment.trim() || undefined,
        region: form.region,
        city: form.city,
        zip_code: form.zip_code.trim() || undefined,
        is_default: form.is_default,
      };
      const saved = editing
        ? await addressesService.update(editing.id, payload)
        : await addressesService.create(payload);
      onSaved(saved);
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Error al guardar la direccion.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian-950/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-luxury w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="p-8">
          <h3
            className="text-2xl font-light text-obsidian-900 mb-6"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            {editing ? 'Editar direccion' : 'Nueva direccion'}
          </h3>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-platinum-600 font-medium">
                Calle y numero *
              </span>
              <input
                type="text"
                required
                value={form.street}
                onChange={(e) =>
                  setForm({ ...form, street: e.target.value })
                }
                placeholder="Ej: Av. Providencia 1234"
                className="mt-1 w-full px-3 py-2 border border-pearl-300 rounded focus:outline-none focus:border-amber-gold-500"
                minLength={5}
                maxLength={255}
              />
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-wider text-platinum-600 font-medium">
                Depto / casa / oficina
              </span>
              <input
                type="text"
                value={form.apartment}
                onChange={(e) =>
                  setForm({ ...form, apartment: e.target.value })
                }
                placeholder="Opcional"
                className="mt-1 w-full px-3 py-2 border border-pearl-300 rounded focus:outline-none focus:border-amber-gold-500"
                maxLength={100}
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-platinum-600 font-medium">
                  Region *
                </span>
                <select
                  required
                  value={form.region}
                  onChange={(e) =>
                    setForm({ ...form, region: e.target.value, city: '' })
                  }
                  className="mt-1 w-full px-3 py-2 border border-pearl-300 rounded bg-white focus:outline-none focus:border-amber-gold-500"
                  disabled={!geo}
                >
                  <option value="">— Selecciona region —</option>
                  {geo?.regions.map((r) => (
                    <option key={r.id} value={r.short_name}>
                      {r.short_name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-wider text-platinum-600 font-medium">
                  Comuna *
                </span>
                <select
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-pearl-300 rounded bg-white focus:outline-none focus:border-amber-gold-500 disabled:bg-pearl-50"
                  disabled={!form.region || communesOfRegion.length === 0}
                >
                  <option value="">
                    {form.region ? '— Selecciona comuna —' : 'Elige region primero'}
                  </option>
                  {communesOfRegion.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-xs uppercase tracking-wider text-platinum-600 font-medium">
                Codigo postal
              </span>
              <input
                type="text"
                value={form.zip_code}
                onChange={(e) =>
                  setForm({ ...form, zip_code: e.target.value })
                }
                placeholder="Opcional"
                className="mt-1 w-full px-3 py-2 border border-pearl-300 rounded focus:outline-none focus:border-amber-gold-500"
                maxLength={20}
              />
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(e) =>
                  setForm({ ...form, is_default: e.target.checked })
                }
                className="w-4 h-4 accent-amber-gold-500"
              />
              <span className="text-sm text-obsidian-700">
                Usar como direccion predeterminada
              </span>
            </label>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-6 py-3 border border-pearl-300 text-obsidian-700 text-sm uppercase tracking-widest font-medium hover:border-obsidian-900 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
