/**
 * CHKUI-ATOM-4
 * Presentational atom — GEO load error banner with retry trigger.
 * Pure props, no store/hook/infrastructure imports.
 */

interface CheckoutGeoErrorBannerProps {
  message: string;
  onRetry: () => void;
}

export const CheckoutGeoErrorBanner = ({
  message,
  onRetry,
}: CheckoutGeoErrorBannerProps) => {
  return (
    <div className="flex items-center justify-between gap-3 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
      <span>{message}</span>
      <button
        type="button"
        onClick={onRetry}
        className="shrink-0 underline hover:no-underline"
      >
        Reintentar
      </button>
    </div>
  );
};
