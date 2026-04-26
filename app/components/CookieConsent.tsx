'use client';

import { useEffect } from 'react';
import * as CookieConsent from 'vanilla-cookieconsent';
import 'vanilla-cookieconsent/dist/cookieconsent.css';
import { setAnalyticsConsent } from '../lib/analytics';

/**
 * Cookie consent banner (Ley Chile 19.628 + GDPR-friendly).
 *
 * Tres categorias:
 * - necessary: siempre activa (sesion, carrito, csrf, idioma).
 * - analytics: GA4, Meta Pixel para metricas anonimas de uso.
 * - marketing: remarketing pixels, ads conversion tracking.
 *
 * Persistencia: vanilla-cookieconsent guarda la decision en cookie
 * 'cc_cookie' por 1 ano. El usuario puede cambiarla via boton del footer
 * (data-cc="show-preferencesModal" en cualquier link).
 *
 * Integracion GTM: setAnalyticsConsent(true|false) emite event
 * 'consent_update' al dataLayer; los tags GTM con condicion analytics===true
 * se activan/desactivan dinamicamente.
 */
export default function CookieConsentBanner() {
  useEffect(() => {
    CookieConsent.run({
      revision: 1,
      autoShow: true,
      hideFromBots: true,
      disablePageInteraction: false,

      cookie: {
        name: 'cc_cookie',
        expiresAfterDays: 365,
        sameSite: 'Lax',
      },

      // Disparar callbacks cuando cambia el consent.
      onConsent: ({ cookie }) => {
        const analyticsAccepted = cookie.categories.includes('analytics');
        setAnalyticsConsent(analyticsAccepted);
      },
      onChange: ({ cookie }) => {
        const analyticsAccepted = cookie.categories.includes('analytics');
        setAnalyticsConsent(analyticsAccepted);
      },

      categories: {
        necessary: {
          enabled: true,
          readOnly: true,
        },
        analytics: {
          enabled: false,
          autoClear: {
            cookies: [
              { name: /^_ga/ },
              { name: '_gid' },
              { name: /^_gtag/ },
            ],
          },
        },
        marketing: {
          enabled: false,
          autoClear: {
            cookies: [
              { name: /^_fbp/ },
              { name: /^_fbc/ },
              { name: /^_ttp/ }, // TikTok
            ],
          },
        },
      },

      language: {
        default: 'es',
        translations: {
          es: {
            consentModal: {
              title: 'Cookies en AMBER',
              description:
                'Usamos cookies para que la tienda funcione, medir como la usas y personalizar contenido. Podes aceptar todas, solo las esenciales o configurar tus preferencias.',
              acceptAllBtn: 'Aceptar todas',
              acceptNecessaryBtn: 'Solo esenciales',
              showPreferencesBtn: 'Configurar',
              footer:
                '<a href="/privacidad">Politica de Privacidad</a> · <a href="/terminos-condiciones">Terminos</a>',
            },
            preferencesModal: {
              title: 'Preferencias de cookies',
              acceptAllBtn: 'Aceptar todas',
              acceptNecessaryBtn: 'Solo esenciales',
              savePreferencesBtn: 'Guardar preferencias',
              closeIconLabel: 'Cerrar',
              sections: [
                {
                  title: 'Uso de cookies',
                  description:
                    'Activa o desactiva las categorias segun preferencia. Las esenciales no se pueden desactivar.',
                },
                {
                  title: 'Esenciales',
                  description:
                    'Necesarias para la sesion, el carrito y la seguridad del sitio. Siempre activas.',
                  linkedCategory: 'necessary',
                },
                {
                  title: 'Analitica',
                  description:
                    'Google Analytics anonimo para entender como usas el sitio y mejorarlo.',
                  linkedCategory: 'analytics',
                },
                {
                  title: 'Marketing',
                  description:
                    'Pixels de remarketing (Meta, TikTok) para mostrarte anuncios relevantes en otras plataformas.',
                  linkedCategory: 'marketing',
                },
              ],
            },
          },
        },
      },

      guiOptions: {
        consentModal: {
          layout: 'box inline',
          position: 'bottom right',
          equalWeightButtons: false,
          flipButtons: false,
        },
        preferencesModal: {
          layout: 'box',
          equalWeightButtons: true,
          flipButtons: false,
        },
      },
    });
  }, []);

  return null;
}
