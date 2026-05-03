import { getOrderStatusMeta, TIMELINE_STEPS } from '../lib/order-status';

interface OrderStatusTimelineProps {
  status: string;
  /** 'compact' = horizontal con dots; 'full' = vertical con descriptions. */
  variant?: 'compact' | 'full';
}

/**
 * Timeline visual de los 4 pasos del cliente: Pago → Preparando → En camino → Entregado.
 *
 * Estados terminales no felices (cancelled, refunded) muestran un alert
 * compacto en lugar del timeline (no hay progreso que mostrar).
 */
export default function OrderStatusTimeline({
  status,
  variant = 'compact',
}: OrderStatusTimelineProps) {
  const meta = getOrderStatusMeta(status);

  // Estados fuera del flow normal: mostrar mensaje plano sin timeline.
  if (meta.step === null) {
    const tone = meta.accentColor === 'red' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50';
    return (
      <div className={`rounded border ${tone} px-4 py-3`}>
        <p className="text-sm font-medium text-obsidian-900">{meta.label}</p>
        <p className="mt-1 text-xs text-platinum-600">{meta.description}</p>
      </div>
    );
  }

  const currentStep = meta.step;

  if (variant === 'full') {
    return (
      <div className="space-y-4">
        {TIMELINE_STEPS.map((step, idx) => {
          const isDone = currentStep > step.step;
          const isCurrent = currentStep === step.step;
          const isPending = currentStep < step.step;

          return (
            <div key={step.id} className="flex items-start gap-4">
              {/* Dot + connector */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                    isDone
                      ? 'bg-amber-gold-500 text-white'
                      : isCurrent
                        ? 'bg-amber-gold-500 text-white ring-4 ring-amber-gold-100'
                        : 'bg-pearl-200 text-platinum-500'
                  }`}
                >
                  {isDone ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>
                {idx < TIMELINE_STEPS.length - 1 && (
                  <div
                    className={`h-12 w-0.5 ${
                      isDone ? 'bg-amber-gold-500' : 'bg-pearl-200'
                    }`}
                  />
                )}
              </div>
              {/* Texto */}
              <div className="flex-1 pb-4">
                <p
                  className={`text-sm font-medium ${
                    isPending ? 'text-platinum-500' : 'text-obsidian-900'
                  }`}
                >
                  {step.label}
                </p>
                {isCurrent && (
                  <p className="mt-1 text-xs text-platinum-600">{meta.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Compact: horizontal con dots y línea conectora.
  return (
    <div className="w-full">
      <div className="flex items-center">
        {TIMELINE_STEPS.map((step, idx) => {
          const isDone = currentStep > step.step;
          const isCurrent = currentStep === step.step;
          const isLast = idx === TIMELINE_STEPS.length - 1;

          return (
            <div key={step.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center" style={{ minWidth: 0 }}>
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold transition-colors ${
                    isDone
                      ? 'bg-amber-gold-500 text-white'
                      : isCurrent
                        ? 'bg-amber-gold-500 text-white ring-2 ring-amber-gold-200'
                        : 'bg-pearl-200 text-platinum-500'
                  }`}
                >
                  {isDone ? (
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>
                <p
                  className={`mt-1.5 text-[10px] uppercase tracking-wider ${
                    isCurrent
                      ? 'font-semibold text-obsidian-900'
                      : isDone
                        ? 'text-platinum-700'
                        : 'text-platinum-400'
                  }`}
                >
                  {step.label}
                </p>
              </div>
              {!isLast && (
                <div
                  className={`-mt-5 h-0.5 flex-1 ${
                    isDone ? 'bg-amber-gold-500' : 'bg-pearl-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
