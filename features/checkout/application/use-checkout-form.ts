/**
 * CHKUI-HOOK-1, CHK-A4, CHKUI-FIX-S001, ADR-5, ADR-7
 *
 * Deferred hook — extracted from app/checkout/page.tsx inline logic.
 * Manages shipping form data, GEO region/commune cascade, and validation.
 *
 * Rules:
 * - No JSX. No sanitizePhone on input (ADR-5 — that boundary is in use-checkout-submit).
 * - GEO uses `let cancelled` flag, NOT AbortController (ADR-3 — preserve existing pattern).
 * - handleSubmitShipping delegates to domain missingShippingFields (ADR-7 — S-001 fix).
 * - trackBeginCheckout fires once per entry via ref.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { addressesService } from '@/app/lib/services/addresses.service';
import { trackBeginCheckout } from '@/app/lib/analytics';
import { missingShippingFields } from '@/features/checkout/domain/checkout.rules';
import { useCartStore } from '@/app/lib/stores/cart.store';
import toast from 'react-hot-toast';
import type { ChileGeoResponse, CustomerAddress } from '@/app/lib/types';
import type { CheckoutFormData } from '@/features/checkout/domain/checkout.types';

// ─── Spanish label map for missing field toasts (ADR-7) ──────────────────────

const FIELD_LABELS: Record<keyof CheckoutFormData, string> = {
  email: 'email',
  firstName: 'nombre',
  lastName: 'apellido',
  address: 'dirección',
  region: 'región',
  commune: 'comuna',
  phone: 'teléfono',
  apartment: 'departamento',
  postalCode: 'código postal',
};

// ─── Initial form state ───────────────────────────────────────────────────────

const INITIAL_FORM: CheckoutFormData = {
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  address: '',
  apartment: '',
  region: '',
  commune: '',
  postalCode: '',
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useCheckoutForm = () => {
  const items = useCartStore((state) => state.items);

  const [formData, setFormData] = useState<CheckoutFormData>(INITIAL_FORM);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [geo, setGeo] = useState<ChileGeoResponse | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Hydration guard
  useEffect(() => {
    setMounted(true);
  }, []);

  // trackBeginCheckout — once per entry
  const checkoutTracked = useRef(false);
  useEffect(() => {
    if (!checkoutTracked.current && items.length > 0) {
      trackBeginCheckout(items);
      checkoutTracked.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // GEO retry trigger: flipping this boolean re-runs the effect
  const [geoTrigger, setGeoTrigger] = useState(0);

  // GEO load with `let cancelled` flag — preserve existing pattern (LOCKED #3)
  useEffect(() => {
    let cancelled = false;
    setGeoError(null);
    addressesService
      .getGeo()
      .then((data) => {
        if (cancelled) return;
        if (!data || !Array.isArray(data.regions) || data.regions.length === 0) {
          setGeoError('No se pudo cargar el listado de regiones.');
          return;
        }
        setGeo(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Error desconocido';
        // eslint-disable-next-line no-console
        console.error('[checkout] getGeo() falló:', err);
        setGeoError(`No se pudo cargar regiones/comunas: ${msg}`);
      });
    return () => {
      cancelled = true;
    };
  }, [geoTrigger]);

  // Communes for the selected region (memoized)
  const communesOfRegion = useMemo(() => {
    if (!geo) return [];
    const region = geo.regions.find((r) => r.short_name === formData.region);
    return region?.communes ?? [];
  }, [geo, formData.region]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    let { name, value } = e.target;

    if (name === 'phone') {
      // Keep digits, leading +, and spaces. Strip everything else (ADR-5).
      value = value.replace(/[^\d+\s]/g, '');
    }

    if (name === 'region') {
      // Region change resets commune cascade
      setFormData((prev) => ({ ...prev, region: value, commune: '' }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectSavedAddress = (addr: CustomerAddress | null) => {
    setSelectedAddressId(addr?.id ?? null);
    if (addr) {
      setFormData((prev) => ({
        ...prev,
        address: addr.street,
        apartment: addr.apartment ?? '',
        commune: addr.city,
        region: addr.region,
        postalCode: addr.zip_code ?? '',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        address: '',
        apartment: '',
        commune: '',
        region: '',
        postalCode: '',
      }));
    }
  };

  const handleSubmitShipping = (
    e: React.FormEvent,
    setStep: (step: 'payment') => void,
  ) => {
    e.preventDefault();
    const missing = missingShippingFields(formData);
    if (missing.length > 0) {
      const labels = missing.map((k) => FIELD_LABELS[k as keyof CheckoutFormData] ?? k);
      const list =
        labels.length === 1
          ? labels[0]
          : labels.length === 2
            ? `${labels[0]} y ${labels[1]}`
            : `${labels.slice(0, -1).join(', ')} y ${labels[labels.length - 1]}`;
      toast.error(`Falta ${list} para continuar.`);
      return;
    }
    setStep('payment');
    toast.success('Información de envío guardada');
  };

  const retryGeo = () => {
    setGeo(null);
    setGeoTrigger((t) => t + 1);
  };

  return {
    formData,
    selectedAddressId,
    geo,
    geoError,
    communesOfRegion,
    mounted,
    handleInputChange,
    handleSelectSavedAddress,
    handleSubmitShipping,
    retryGeo,
  };
};
