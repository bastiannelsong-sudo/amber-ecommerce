'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../lib/stores/auth.store';
import toast from 'react-hot-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const login = useAuthStore((state) => state.login);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (mode === 'register' && !formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (mode !== 'forgot') {
      if (!formData.password) {
        newErrors.password = 'La contraseña es requerida';
      } else if (formData.password.length < 6) {
        newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      }

      if (mode === 'register') {
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      if (mode === 'login') {
        login({
          id: '1',
          email: formData.email,
          name: formData.name || 'Usuario',
        }, 'mock-token-login');
        toast.success('Bienvenido de vuelta!');
        onClose();
      } else if (mode === 'register') {
        login({
          id: '1',
          email: formData.email,
          name: formData.name,
        }, 'mock-token-register');
        toast.success('¡Cuenta creada exitosamente!');
        onClose();
      } else if (mode === 'forgot') {
        toast.success('Se ha enviado un email para restablecer tu contraseña');
        setMode('login');
      }

      setFormData({ name: '', email: '', password: '', confirmPassword: '' });
      setIsLoading(false);
    }, 1000);
  };

  const handleClose = () => {
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
    setErrors({});
    setMode('login');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-obsidian-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        onClick={handleClose}
      >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white w-full max-w-md shadow-2xl overflow-hidden relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="bg-gradient-to-br from-obsidian-950 to-obsidian-800 text-white px-8 pt-10 pb-8">
              <div className="w-10 h-[1px] bg-amber-gold-500 mb-6"></div>
              <h2
                className="text-3xl lg:text-4xl font-light"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                {mode === 'login' && 'Iniciar Sesion'}
                {mode === 'register' && 'Crear Cuenta'}
                {mode === 'forgot' && 'Recuperar Contrasena'}
              </h2>
              <p className="text-pearl-300 mt-3 text-sm tracking-wide">
                {mode === 'login' && 'Bienvenido de vuelta a Amber'}
                {mode === 'register' && 'Unete a nuestra comunidad exclusiva'}
                {mode === 'forgot' && 'Te enviaremos un email para restablecer tu contrasena'}
              </p>
            </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Name field - only for register */}
            {mode === 'register' && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-obsidian-900 mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border ${
                    errors.name ? 'border-red-500' : 'border-pearl-300'
                  } focus:border-amber-gold-500 focus:outline-none transition-colors`}
                  placeholder="Juan Pérez"
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
              </div>
            )}

            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-obsidian-900 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border ${
                  errors.email ? 'border-red-500' : 'border-pearl-300'
                } focus:border-amber-gold-500 focus:outline-none transition-colors`}
                placeholder="tu@email.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>

            {/* Password field - not for forgot */}
            {mode !== 'forgot' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-obsidian-900 mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border ${
                    errors.password ? 'border-red-500' : 'border-pearl-300'
                  } focus:border-amber-gold-500 focus:outline-none transition-colors`}
                  placeholder="••••••••"
                />
                {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
              </div>
            )}

            {/* Confirm Password field - only for register */}
            {mode === 'register' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-obsidian-900 mb-2">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border ${
                    errors.confirmPassword ? 'border-red-500' : 'border-pearl-300'
                  } focus:border-amber-gold-500 focus:outline-none transition-colors`}
                  placeholder="••••••••"
                />
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
              </div>
            )}

            {/* Forgot password link - only for login */}
            {mode === 'login' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-sm text-amber-gold-600 hover:text-amber-gold-700 transition-colors cursor-pointer"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            {/* Submit button */}
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
                  Procesando...
                </span>
              ) : (
                <>
                  {mode === 'login' && 'Iniciar Sesión'}
                  {mode === 'register' && 'Crear Cuenta'}
                  {mode === 'forgot' && 'Enviar Email'}
                </>
              )}
            </button>

            {/* Toggle mode */}
            <div className="text-center pt-4 border-t border-pearl-200">
              {mode === 'login' && (
                <p className="text-sm text-platinum-600">
                  ¿No tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="text-amber-gold-600 hover:text-amber-gold-700 font-medium transition-colors cursor-pointer"
                  >
                    Regístrate aquí
                  </button>
                </p>
              )}
              {mode === 'register' && (
                <p className="text-sm text-platinum-600">
                  ¿Ya tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-amber-gold-600 hover:text-amber-gold-700 font-medium transition-colors cursor-pointer"
                  >
                    Inicia sesión
                  </button>
                </p>
              )}
              {mode === 'forgot' && (
                <p className="text-sm text-platinum-600">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-amber-gold-600 hover:text-amber-gold-700 font-medium transition-colors cursor-pointer"
                  >
                    Volver a iniciar sesión
                  </button>
                </p>
              )}
            </div>
          </form>
          </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
