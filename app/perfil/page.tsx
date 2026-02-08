'use client';

import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuthStore } from '../lib/stores/auth.store';

export default function PerfilPage() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const logout = useAuthStore((state) => state.logout);

  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || 'Usuario Demo',
    email: user?.email || 'usuario@example.com',
    phone: user?.phone || '+56 9 1234 5678',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    updateUser(formData);
    setIsEditing(false);
  };

  // Mock orders data
  const orders = [
    {
      id: 'AMB-1234',
      date: '2024-02-01',
      status: 'Entregado',
      total: 49990,
      items: 2,
    },
    {
      id: 'AMB-1233',
      date: '2024-01-15',
      status: 'En tránsito',
      total: 29990,
      items: 1,
    },
    {
      id: 'AMB-1232',
      date: '2024-01-01',
      status: 'Entregado',
      total: 59990,
      items: 3,
    },
  ];

  return (
    <div className="min-h-screen bg-pearl-50">
      <Header />

      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1
              className="text-4xl lg:text-5xl font-light text-obsidian-900 mb-2"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Mi Cuenta
            </h1>
            <p className="text-platinum-600">Gestiona tu información y pedidos</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow-luxury rounded-lg overflow-hidden">
                <div className="p-6 bg-gradient-to-br from-obsidian-900 to-obsidian-800 text-white">
                  <div className="w-20 h-20 bg-amber-gold-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                    {formData.name.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="text-center font-medium">{formData.name}</h3>
                  <p className="text-center text-sm text-pearl-300 mt-1">{formData.email}</p>
                </div>

                <nav className="p-2">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      activeTab === 'profile'
                        ? 'bg-amber-gold-50 text-amber-gold-600 font-medium'
                        : 'text-obsidian-700 hover:bg-pearl-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Perfil
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      activeTab === 'orders'
                        ? 'bg-amber-gold-50 text-amber-gold-600 font-medium'
                        : 'text-obsidian-700 hover:bg-pearl-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      Mis Pedidos
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('addresses')}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      activeTab === 'addresses'
                        ? 'bg-amber-gold-50 text-amber-gold-600 font-medium'
                        : 'text-obsidian-700 hover:bg-pearl-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Direcciones
                    </div>
                  </button>

                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-3 rounded-lg transition-colors text-red-600 hover:bg-red-50"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Cerrar Sesión
                    </div>
                  </button>
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="bg-white shadow-luxury rounded-lg p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h2
                      className="text-3xl font-light text-obsidian-900"
                      style={{ fontFamily: 'var(--font-cormorant)' }}
                    >
                      Información Personal
                    </h2>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-6 py-2 border-2 border-obsidian-900 text-obsidian-900 text-sm uppercase tracking-widest font-medium hover:bg-obsidian-900 hover:text-white transition-colors"
                      >
                        Editar
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-6 py-2 border border-pearl-300 text-platinum-600 text-sm uppercase tracking-widest font-medium hover:bg-pearl-100 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleSave}
                          className="px-6 py-2 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors"
                        >
                          Guardar
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-obsidian-900 mb-2">
                        Nombre Completo
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none transition-colors disabled:bg-pearl-100 disabled:text-platinum-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-obsidian-900 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none transition-colors disabled:bg-pearl-100 disabled:text-platinum-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-obsidian-900 mb-2">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none transition-colors disabled:bg-pearl-100 disabled:text-platinum-600"
                      />
                    </div>

                    <div className="pt-6 border-t border-pearl-200">
                      <h3 className="text-lg font-medium text-obsidian-900 mb-4">
                        Cambiar Contraseña
                      </h3>
                      <button className="px-6 py-3 border-2 border-obsidian-900 text-obsidian-900 text-sm uppercase tracking-widest font-medium hover:bg-obsidian-900 hover:text-white transition-colors">
                        Actualizar Contraseña
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div className="bg-white shadow-luxury rounded-lg p-8">
                  <h2
                    className="text-3xl font-light text-obsidian-900 mb-8"
                    style={{ fontFamily: 'var(--font-cormorant)' }}
                  >
                    Mis Pedidos
                  </h2>

                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="border border-pearl-200 rounded-lg p-6 hover:border-amber-gold-500 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-medium text-obsidian-900 mb-1">
                              Pedido #{order.id}
                            </h3>
                            <p className="text-sm text-platinum-600">
                              {new Date(order.date).toLocaleDateString('es-CL', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              order.status === 'Entregado'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-pearl-200">
                          <div>
                            <p className="text-sm text-platinum-600">
                              {order.items} {order.items === 1 ? 'producto' : 'productos'}
                            </p>
                            <p className="text-lg font-medium text-obsidian-900">
                              ${order.total.toLocaleString('es-CL')}
                            </p>
                          </div>
                          <button className="px-6 py-2 border border-obsidian-900 text-obsidian-900 text-sm uppercase tracking-wide font-medium hover:bg-obsidian-900 hover:text-white transition-colors">
                            Ver Detalle
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Addresses Tab */}
              {activeTab === 'addresses' && (
                <div className="bg-white shadow-luxury rounded-lg p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h2
                      className="text-3xl font-light text-obsidian-900"
                      style={{ fontFamily: 'var(--font-cormorant)' }}
                    >
                      Mis Direcciones
                    </h2>
                    <button className="px-6 py-2 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors">
                      + Nueva Dirección
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Default Address */}
                    <div className="border-2 border-amber-gold-500 rounded-lg p-6 relative">
                      <span className="absolute top-4 right-4 bg-amber-gold-500 text-white text-xs px-2 py-1 rounded uppercase tracking-wide">
                        Principal
                      </span>
                      <h3 className="font-medium text-obsidian-900 mb-4">Casa</h3>
                      <p className="text-sm text-platinum-700 leading-relaxed">
                        Av. Principal 123, Depto 401
                        <br />
                        Las Condes, Santiago
                        <br />
                        Región Metropolitana
                        <br />
                        7550000
                      </p>
                      <div className="flex gap-2 mt-4">
                        <button className="text-sm text-amber-gold-600 hover:text-amber-gold-700">
                          Editar
                        </button>
                        <span className="text-platinum-400">|</span>
                        <button className="text-sm text-red-600 hover:text-red-700">
                          Eliminar
                        </button>
                      </div>
                    </div>

                    {/* Secondary Address */}
                    <div className="border border-pearl-300 rounded-lg p-6">
                      <h3 className="font-medium text-obsidian-900 mb-4">Oficina</h3>
                      <p className="text-sm text-platinum-700 leading-relaxed">
                        Av. Apoquindo 4800, Piso 12
                        <br />
                        Las Condes, Santiago
                        <br />
                        Región Metropolitana
                        <br />
                        7560000
                      </p>
                      <div className="flex gap-2 mt-4">
                        <button className="text-sm text-amber-gold-600 hover:text-amber-gold-700">
                          Marcar como principal
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
