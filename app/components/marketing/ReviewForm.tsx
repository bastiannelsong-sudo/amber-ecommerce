'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ecommerceService } from '../../lib/services/ecommerce.service';
import toast from 'react-hot-toast';

interface ReviewFormProps {
  productId: number;
  onReviewAdded: () => void;
}

export default function ReviewForm({ productId, onReviewAdded }: ReviewFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    title: '',
    comment: '',
    order_number: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Selecciona una calificacion');
      return;
    }
    if (!form.customer_name || !form.customer_email || !form.comment) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      await ecommerceService.createReview({
        product_id: productId,
        rating,
        ...form,
      });
      toast.success('Review enviada exitosamente');
      setIsOpen(false);
      setRating(0);
      setForm({ customer_name: '', customer_email: '', title: '', comment: '', order_number: '' });
      onReviewAdded();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al enviar review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full py-4 border-2 border-obsidian-900 text-obsidian-900 text-sm uppercase tracking-widest font-medium hover:bg-obsidian-900 hover:text-white transition-colors cursor-pointer"
        >
          Escribir una review
        </button>
      ) : (
        <AnimatePresence>
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="border border-pearl-200 p-6 space-y-5"
          >
            <div className="flex items-center justify-between">
              <h3
                className="text-xl text-obsidian-900 font-light"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                Tu opinion
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-platinum-500 hover:text-obsidian-900 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Star rating */}
            <div>
              <label className="block text-sm font-medium text-obsidian-900 mb-2">
                Calificacion *
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="cursor-pointer p-0.5"
                  >
                    <svg
                      className={`w-7 h-7 transition-colors ${
                        star <= (hoverRating || rating)
                          ? 'text-amber-gold-500'
                          : 'text-pearl-300'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-2 text-sm text-platinum-600 self-center">
                    {rating}/5
                  </span>
                )}
              </div>
            </div>

            {/* Name & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-obsidian-900 mb-1.5">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 text-sm border border-pearl-300 focus:border-amber-gold-500 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-obsidian-900 mb-1.5">
                  Email *
                </label>
                <input
                  type="email"
                  value={form.customer_email}
                  onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 text-sm border border-pearl-300 focus:border-amber-gold-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Order number (optional for verified purchase) */}
            <div>
              <label className="block text-sm font-medium text-obsidian-900 mb-1.5">
                Numero de orden
                <span className="text-platinum-500 font-normal"> (para compra verificada)</span>
              </label>
              <input
                type="text"
                value={form.order_number}
                onChange={(e) => setForm({ ...form, order_number: e.target.value })}
                placeholder="AMB..."
                className="w-full px-3 py-2.5 text-sm border border-pearl-300 focus:border-amber-gold-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-obsidian-900 mb-1.5">
                Titulo
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Resumen de tu experiencia"
                className="w-full px-3 py-2.5 text-sm border border-pearl-300 focus:border-amber-gold-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-obsidian-900 mb-1.5">
                Tu review *
              </label>
              <textarea
                value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                required
                rows={4}
                placeholder="Cuentanos tu experiencia con este producto..."
                className="w-full px-3 py-2.5 text-sm border border-pearl-300 focus:border-amber-gold-500 focus:outline-none transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Enviando...' : 'Enviar review'}
            </button>
          </motion.form>
        </AnimatePresence>
      )}
    </div>
  );
}
