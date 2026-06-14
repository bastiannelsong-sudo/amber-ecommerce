/**
 * CHKUI-MOL-4
 * Presentational molecule — static MercadoPago payment info card.
 * No dynamic props. No store/hook imports.
 */
export const MercadoPagoInfoCard = () => {
  return (
    <div className="bg-white p-5 sm:p-6 shadow-luxury space-y-4">
      <h3
        className="text-lg font-light text-obsidian-900 pb-3 border-b border-pearl-200"
        style={{ fontFamily: 'var(--font-cormorant)' }}
      >
        Pago con MercadoPago
      </h3>

      <p className="text-sm text-platinum-700">
        Al confirmar serás redirigido a{' '}
        <span className="font-medium text-obsidian-900">MercadoPago</span>{' '}
        para completar tu pago de forma segura.
      </p>

      <ul className="text-sm text-platinum-700 space-y-1 list-disc list-inside">
        <li>Tarjeta de crédito o débito</li>
        <li>Transferencia bancaria</li>
        <li>Billetera MercadoPago</li>
      </ul>

      <p className="text-xs text-platinum-500">
        Tus datos están protegidos con encriptación SSL.
      </p>
    </div>
  );
};
