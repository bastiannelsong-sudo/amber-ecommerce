'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authService } from '../lib/services/auth.service';
import toast from 'react-hot-toast';
import Link from 'next/link';

function PasswordStrengthBar({ password }: { password: string }) {
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

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-xl font-medium text-obsidian-900">Enlace inválido</h2>
        <p className="text-sm text-platinum-600">Este enlace no es válido o ha expirado.</p>
        <Link
          href="/"
          className="inline-block py-3 px-8 bg-obsidian-900 text-white text-sm uppercase tracking-widest hover:bg-amber-gold-500 transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-green-50 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-medium text-obsidian-900">Contraseña actualizada</h2>
        <p className="text-sm text-platinum-600">Tu contraseña ha sido restablecida correctamente.</p>
        <button
          onClick={() => router.push('/')}
          className="w-full py-3 bg-obsidian-900 text-white text-sm uppercase tracking-widest hover:bg-amber-gold-500 transition-colors cursor-pointer"
        >
          Ir al inicio
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(token, password);
      setIsSuccess(true);
      toast.success('Contraseña actualizada correctamente');
    } catch (err: any) {
      const message = err.response?.data?.message;
      if (typeof message === 'string' && message.includes('expirado')) {
        setError('Este enlace ha expirado. Solicitá un nuevo enlace de recuperación.');
      } else {
        setError(message || 'Error al restablecer la contraseña');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-obsidian-900 mb-1.5">
          Nueva contraseña
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 pr-12 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none transition-colors"
            placeholder="Mínimo 8 caracteres"
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
        <PasswordStrengthBar password={password} />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-obsidian-900 mb-1.5">
          Confirmar contraseña
        </label>
        <input
          type={showPassword ? 'text' : 'password'}
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-4 py-3 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none transition-colors"
          placeholder="Repetir contraseña"
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
          <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

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
            Restableciendo...
          </span>
        ) : (
          'Restablecer contraseña'
        )}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-pearl-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1
              className="text-3xl font-light text-obsidian-900 tracking-widest"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              AMBER
            </h1>
          </Link>
          <div className="w-10 h-[1px] bg-amber-gold-500 mx-auto mt-3" />
        </div>

        {/* Card */}
        <div className="bg-white shadow-luxury p-8">
          <h2
            className="text-2xl font-light text-obsidian-900 mb-6"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            Restablecer Contraseña
          </h2>

          <Suspense
            fallback={
              <div className="flex items-center justify-center py-8">
                <svg className="animate-spin h-8 w-8 text-amber-gold-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
