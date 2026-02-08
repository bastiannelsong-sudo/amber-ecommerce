'use client';

import { motion } from 'framer-motion';

interface TrustBadgesProps {
  /** Horizontal layout for product detail */
  layout?: 'horizontal' | 'vertical' | 'compact';
}

const badges = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: 'Garantia 12 meses',
    subtitle: 'Cobertura total',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
    title: 'Hecho a mano',
    subtitle: '20+ anos de experiencia',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    title: 'Pago seguro',
    subtitle: 'Transaccion encriptada',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
    title: 'Envio gratis',
    subtitle: 'Sobre $30.000',
  },
];

export default function TrustBadges({ layout = 'horizontal' }: TrustBadgesProps) {
  if (layout === 'compact') {
    return (
      <div className="flex items-center gap-4 flex-wrap">
        {badges.slice(0, 3).map((badge, index) => (
          <div
            key={index}
            className="flex items-center gap-1.5 text-[10px] text-platinum-600"
          >
            <span className="text-amber-gold-500 w-3.5 h-3.5 [&>svg]:w-3.5 [&>svg]:h-3.5">
              {badge.icon}
            </span>
            <span className="uppercase tracking-wider font-medium">{badge.title}</span>
          </div>
        ))}
      </div>
    );
  }

  if (layout === 'vertical') {
    return (
      <div className="space-y-3">
        {badges.map((badge, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3 text-sm"
          >
            <div className="w-9 h-9 flex items-center justify-center bg-pearl-100 text-amber-gold-600 flex-shrink-0">
              {badge.icon}
            </div>
            <div>
              <p className="text-obsidian-900 font-medium text-xs uppercase tracking-wide">
                {badge.title}
              </p>
              <p className="text-platinum-600 text-[11px]">{badge.subtitle}</p>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  // Horizontal layout (default)
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {badges.map((badge, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08 }}
          className="flex flex-col items-center text-center gap-2 py-4 px-3 border border-pearl-200 bg-white"
        >
          <div className="text-amber-gold-500">{badge.icon}</div>
          <div>
            <p className="text-xs font-semibold text-obsidian-900 uppercase tracking-wide">
              {badge.title}
            </p>
            <p className="text-[10px] text-platinum-600 mt-0.5">{badge.subtitle}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
