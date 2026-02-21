import axios from 'axios';

// Validación de variable de entorno para URL del API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

if (!process.env.NEXT_PUBLIC_API_URL && process.env.NODE_ENV === 'production') {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is required in production');
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Rutas del navegador que requieren sesión activa (solo estas redirigen al home)
const PROTECTED_ROUTES = ['/perfil', '/checkout', '/mis-pedidos'];

// Response interceptor para manejo de errores y sesión expirada
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Limpiar token y estado de autenticación
      localStorage.removeItem('auth_token');
      localStorage.removeItem('amber-auth-storage');

      // Solo redirigir si el usuario está en una ruta protegida
      const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
        window.location.pathname.startsWith(route)
      );
      if (isProtectedRoute) {
        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  }
);
