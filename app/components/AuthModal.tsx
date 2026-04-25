'use client';

import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../lib/stores/auth.store';
import { authService } from '../lib/services/auth.service';
import toast from 'react-hot-toast';

type ModalView = 'login' | 'register' | 'forgot' | 'forgot-response' | 'linked';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

// Barra de fortaleza de contraseña
function PasswordStrength({ password }: { password: string }) {
  const getStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strength = getStrength();
  if (!password) return null;

  const labels = ['Muy débil', 'Débil', 'Regular', 'Buena', 'Fuerte'];
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'];

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < strength ? colors[strength - 1] : 'bg-pearl-200'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-platinum-500 mt-1">{labels[strength - 1] || 'Muy débil'}</p>
    </div>
  );
}

// Botón de Google
function GoogleButton({ onClick, isLoading }: { onClick: () => void; isLoading: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-pearl-300 hover:border-pearl-400 bg-white hover:bg-pearl-50 transition-colors cursor-pointer disabled:opacity-50"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
      <span className="text-sm font-medium text-obsidian-900">Continuar con Google</span>
    </button>
  );
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [view, setView] = useState<ModalView>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [forgotResponse, setForgotResponse] = useState<{ provider?: string; message?: string } | null>(null);
  const [shakeForm, setShakeForm] = useState(false);
  // Cuando el backend nos avisa que el email del intento usa otro provider
  // (ej: la cuenta es Google-only y el usuario intenta login con password),
  // mostramos un banner con CTA directo al método correcto. Estructurado
  // (`provider` en el JSON del error), no string-matching frágil.
  const [providerHint, setProviderHint] = useState<{
    provider: 'google' | 'email';
    message: string;
  } | null>(null);

  const setUser = useAuthStore((state) => state.setUser);

  // Reset cuando se abre/cierra
  useEffect(() => {
    if (isOpen) {
      setView(initialMode);
      setFormData({ first_name: '', last_name: '', email: '', password: '' });
      setErrors({});
      setShowPassword(false);
      setForgotResponse(null);
      setProviderHint(null);
    }
  }, [isOpen, initialMode]);

  // Limpiar el hint de provider al cambiar de vista (login/register/forgot).
  useEffect(() => {
    setProviderHint(null);
  }, [view]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    // El usuario está escribiendo de nuevo → limpiar el hint contextual.
    if (providerHint) setProviderHint(null);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (view === 'register') {
      if (!formData.first_name.trim()) newErrors.first_name = 'El nombre es requerido';
      if (!formData.last_name.trim()) newErrors.last_name = 'El apellido es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (view === 'login' || view === 'register') {
      if (!formData.password) {
        newErrors.password = 'La contraseña es requerida';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Mínimo 8 caracteres';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const triggerShake = () => {
    setShakeForm(true);
    setTimeout(() => setShakeForm(false), 500);
  };

  // ─── LOGIN ────────────────────────────────────────────

  const handleLogin = async () => {
    try {
      const response = await authService.login({
        email: formData.email,
        password: formData.password,
      });
      // Tokens viven en cookie httpOnly seteada por /api/auth/login.
      setUser(response.customer);
      toast.success(`Bienvenida de vuelta, ${response.customer.first_name}`);
      onClose();
    } catch (error: any) {
      const data = error.response?.data;
      // Backend nos avisa que la cuenta usa otro provider → CTA contextual.
      if (data?.provider === 'google') {
        setProviderHint({
          provider: 'google',
          message: data.message ?? 'Esta cuenta inició con Google.',
        });
        return;
      }
      setErrors({ password: 'Email o contraseña incorrectos' });
      triggerShake();
    }
  };

  // ─── REGISTER ─────────────────────────────────────────

  const handleRegister = async () => {
    try {
      const response = await authService.register({
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
      });
      setUser(response.customer);
      toast.success('Cuenta creada exitosamente');
      onClose();
    } catch (error: any) {
      const data = error.response?.data;
      // El email ya existe — orientar al usuario al método correcto en vez de
      // dejarlo "registrándose" hasta crear una cuenta paralela.
      if (data?.provider === 'google') {
        setProviderHint({
          provider: 'google',
          message: data.message ?? 'Esta cuenta ya existe con Google.',
        });
        return;
      }
      if (data?.provider === 'email') {
        setProviderHint({
          provider: 'email',
          message: data.message ?? 'Esta cuenta ya existe. Iniciá sesión.',
        });
        return;
      }
      setErrors({ email: data?.message ?? 'Error al crear la cuenta' });
    }
  };

  // ─── FORGOT PASSWORD ─────────────────────────────────

  const handleForgotPassword = async () => {
    try {
      const response = await authService.forgotPassword(formData.email);
      if (response.provider === 'google') {
        setForgotResponse({ provider: 'google', message: response.message });
      } else {
        setForgotResponse({});
      }
      setView('forgot-response');
    } catch {
      toast.error('Error al enviar el email');
    }
  };

  // ─── GOOGLE AUTH ──────────────────────────────────────

  const handleGoogleAuth = useCallback(async () => {
    // Pre-checks antes de tocar el SDK — mensajes específicos > genérico.
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      toast.error(
        'Google Sign-In no configurado. Definir NEXT_PUBLIC_GOOGLE_CLIENT_ID en .env',
      );
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as any).google;
    if (!google?.accounts?.id) {
      toast.error(
        'No se pudo cargar Google Sign-In. Verificá tu conexión y bloqueadores de scripts.',
      );
      return;
    }

    setIsGoogleLoading(true);

    try {
      google.accounts.id.initialize({
        client_id: clientId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callback: async (response: any) => {
          try {
            const result = await authService.googleAuth(response.credential);
            setUser(result.customer);

            if (result.was_linked) {
              setView('linked');
              setTimeout(() => onClose(), 3000);
              return;
            }

            toast.success(
              result.is_new_account
                ? 'Cuenta creada con Google'
                : `Bienvenida, ${result.customer.first_name}`,
            );
            onClose();
          } catch {
            toast.error('Error al autenticar con Google');
          } finally {
            setIsGoogleLoading(false);
          }
        },
      });

      // El callback de prompt() permite detectar cuando Google decide no
      // mostrar el popup (FedCM disabled, cooldown, browser restrictions).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      google.accounts.id.prompt((notification: any) => {
        if (
          notification.isNotDisplayed?.() ||
          notification.isSkippedMoment?.()
        ) {
          setIsGoogleLoading(false);
          toast.error(
            'No se pudo abrir el popup de Google. Intentá nuevamente o usá email + contraseña.',
          );
        }
      });
    } catch {
      setIsGoogleLoading(false);
      toast.error('Error al iniciar Google Sign-In');
    }
  }, [setUser, onClose]);

  // ─── SUBMIT ───────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (view === 'login') await handleLogin();
      else if (view === 'register') await handleRegister();
      else if (view === 'forgot') await handleForgotPassword();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const titles: Record<ModalView, string> = {
    login: 'Iniciar Sesión',
    register: 'Crear Cuenta',
    forgot: 'Recuperar Contraseña',
    'forgot-response': 'Recuperar Contraseña',
    linked: 'Cuenta Vinculada',
  };

  const subtitles: Record<ModalView, string> = {
    login: 'Bienvenida de vuelta a Amber',
    register: 'Únete a nuestra comunidad exclusiva',
    forgot: 'Te enviaremos un enlace para restablecer tu contraseña',
    'forgot-response': '',
    linked: '',
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-obsidian-900/70 backdrop-blur-sm z-[100] overflow-y-auto"
        onClick={onClose}
      >
        <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white w-full sm:max-w-md shadow-2xl overflow-hidden relative rounded-t-2xl sm:rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="bg-gradient-to-br from-obsidian-950 to-obsidian-800 text-white px-6 sm:px-8 pt-8 sm:pt-10 pb-6 sm:pb-8">
              <div className="w-10 h-[1px] bg-amber-gold-500 mb-6"></div>
              <h2
                className="text-3xl lg:text-4xl font-light"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                {titles[view]}
              </h2>
              {subtitles[view] && (
                <p className="text-pearl-300 mt-3 text-sm tracking-wide">{subtitles[view]}</p>
              )}
            </div>

            {/* ─── VISTA: LINKED (merge confirmado) ─── */}
            {view === 'linked' && (
              <div className="p-6 sm:p-8 text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-green-50 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-obsidian-900 font-medium">Tu cuenta de Google se vinculó con tu cuenta existente.</p>
                <p className="text-sm text-platinum-600">Ahora podés iniciar sesión con cualquiera de los dos métodos.</p>
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-obsidian-900 text-white text-sm uppercase tracking-widest hover:bg-amber-gold-500 transition-colors cursor-pointer"
                >
                  Continuar
                </button>
              </div>
            )}

            {/* ─── VISTA: FORGOT RESPONSE ─── */}
            {view === 'forgot-response' && (
              <div className="p-6 sm:p-8 space-y-4">
                {forgotResponse?.provider === 'google' ? (
                  <>
                    <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-blue-900">Tu cuenta está vinculada a Google</p>
                        <p className="text-sm text-blue-700 mt-1">{forgotResponse.message}</p>
                      </div>
                    </div>
                    <GoogleButton onClick={handleGoogleAuth} isLoading={isGoogleLoading} />
                  </>
                ) : (
                  <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-green-900">Revisa tu bandeja de entrada</p>
                      <p className="text-sm text-green-700 mt-1">
                        Te enviamos un enlace a <strong>{formData.email}</strong> para restablecer tu contraseña.
                      </p>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="text-sm text-amber-gold-600 hover:text-amber-gold-700 transition-colors cursor-pointer"
                >
                  ← Volver a iniciar sesión
                </button>
              </div>
            )}

            {/* ─── VISTAS: LOGIN / REGISTER / FORGOT ─── */}
            {(view === 'login' || view === 'register' || view === 'forgot') && (
              <div className="p-6 sm:p-8">
                {/* Banner contextual: el backend detectó que la cuenta usa
                    otro provider. Prevenimos la duplicación de cuentas
                    orientando al usuario al método correcto con CTA directo. */}
                {providerHint && (
                  <div className="mb-5 p-4 bg-amber-gold-50 border border-amber-gold-200 rounded-lg flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-gold-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-obsidian-900">{providerHint.message}</p>
                      <div className="mt-3">
                        {providerHint.provider === 'google' ? (
                          <button
                            type="button"
                            onClick={handleGoogleAuth}
                            disabled={isGoogleLoading}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-pearl-300 hover:border-amber-gold-400 text-sm font-medium text-obsidian-900 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Continuar con Google
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setView('login');
                              setProviderHint(null);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-obsidian-900 hover:bg-obsidian-800 text-sm font-medium text-white rounded-md transition-colors cursor-pointer"
                          >
                            Iniciar sesión con email
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Google button (login y register) */}
                {(view === 'login' || view === 'register') && (
                  <>
                    <GoogleButton onClick={handleGoogleAuth} isLoading={isGoogleLoading} />
                    <div className="flex items-center gap-4 my-5">
                      <div className="flex-1 h-[1px] bg-pearl-200" />
                      <span className="text-xs text-platinum-500 uppercase tracking-wider">o</span>
                      <div className="flex-1 h-[1px] bg-pearl-200" />
                    </div>
                  </>
                )}

                <form onSubmit={handleSubmit} className={`space-y-4 ${shakeForm ? 'animate-shake' : ''}`}>
                  {/* Nombre y Apellido — solo register */}
                  {view === 'register' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="first_name" className="block text-sm font-medium text-obsidian-900 mb-1.5">
                          Nombre
                        </label>
                        <input
                          type="text"
                          id="first_name"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border ${errors.first_name ? 'border-red-500' : 'border-pearl-300'} focus:border-amber-gold-500 focus:outline-none transition-colors`}
                          placeholder="María"
                        />
                        {errors.first_name && <p className="mt-1 text-xs text-red-500">{errors.first_name}</p>}
                      </div>
                      <div>
                        <label htmlFor="last_name" className="block text-sm font-medium text-obsidian-900 mb-1.5">
                          Apellido
                        </label>
                        <input
                          type="text"
                          id="last_name"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border ${errors.last_name ? 'border-red-500' : 'border-pearl-300'} focus:border-amber-gold-500 focus:outline-none transition-colors`}
                          placeholder="González"
                        />
                        {errors.last_name && <p className="mt-1 text-xs text-red-500">{errors.last_name}</p>}
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-obsidian-900 mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border ${errors.email ? 'border-red-500' : 'border-pearl-300'} focus:border-amber-gold-500 focus:outline-none transition-colors`}
                      placeholder="tu@email.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.email}
                        {errors.email.includes('Iniciar sesión') && (
                          <button
                            type="button"
                            onClick={() => setView('login')}
                            className="ml-1 underline text-amber-gold-600 cursor-pointer"
                          >
                            Ir a login
                          </button>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Password — login y register */}
                  {(view === 'login' || view === 'register') && (
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-obsidian-900 mb-1.5">
                        Contraseña
                        {view === 'register' && (
                          <span className="text-platinum-400 font-normal ml-1">(mín. 8 caracteres)</span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 pr-12 border ${errors.password ? 'border-red-500' : 'border-pearl-300'} focus:border-amber-gold-500 focus:outline-none transition-colors`}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-platinum-500 hover:text-obsidian-900 transition-colors cursor-pointer"
                        >
                          {showPassword ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                      {view === 'register' && <PasswordStrength password={formData.password} />}
                    </div>
                  )}

                  {/* Forgot link — solo login */}
                  {view === 'login' && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setView('forgot')}
                        className="text-sm text-amber-gold-600 hover:text-amber-gold-700 transition-colors cursor-pointer"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors disabled:bg-platinum-400 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        {view === 'login' ? 'Iniciando...' : view === 'register' ? 'Creando cuenta...' : 'Enviando...'}
                      </span>
                    ) : (
                      <>
                        {view === 'login' && 'Iniciar Sesión'}
                        {view === 'register' && 'Crear Cuenta'}
                        {view === 'forgot' && 'Enviar enlace de recuperación'}
                      </>
                    )}
                  </button>

                  {/* Toggle / Back links */}
                  <div className="text-center pt-4 border-t border-pearl-200">
                    {view === 'login' && (
                      <p className="text-sm text-platinum-600">
                        ¿No tienes cuenta?{' '}
                        <button type="button" onClick={() => setView('register')} className="text-amber-gold-600 hover:text-amber-gold-700 font-medium transition-colors cursor-pointer">
                          Crear cuenta
                        </button>
                      </p>
                    )}
                    {view === 'register' && (
                      <p className="text-sm text-platinum-600">
                        ¿Ya tienes cuenta?{' '}
                        <button type="button" onClick={() => setView('login')} className="text-amber-gold-600 hover:text-amber-gold-700 font-medium transition-colors cursor-pointer">
                          Iniciar sesión
                        </button>
                      </p>
                    )}
                    {view === 'forgot' && (
                      <button type="button" onClick={() => setView('login')} className="text-sm text-amber-gold-600 hover:text-amber-gold-700 transition-colors cursor-pointer">
                        ← Volver a iniciar sesión
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
