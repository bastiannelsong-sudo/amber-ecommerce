'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ecommerceService } from '../../lib/services/ecommerce.service';
import ReviewForm from './ReviewForm';

interface ReviewListProps {
  productId: number;
}

interface ReviewData {
  review_id: number;
  customer_name: string;
  rating: number;
  title: string;
  comment: string;
  verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
}

export default function ReviewList({ productId }: ReviewListProps) {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  const loadReviews = async () => {
    try {
      const data = await ecommerceService.getProductReviews(productId);
      setReviews(data.reviews);
      setAverageRating(data.average_rating);
      setTotalReviews(data.total_reviews);
      setRatingDistribution(data.rating_distribution);
    } catch {
      // API not available yet - show empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const handleMarkHelpful = async (reviewId: number) => {
    try {
      await ecommerceService.markReviewHelpful(reviewId);
      setReviews((prev) =>
        prev.map((r) =>
          r.review_id === reviewId
            ? { ...r, helpful_count: r.helpful_count + 1 }
            : r,
        ),
      );
    } catch {
      // Silently fail
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-amber-gold-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Rating Summary */}
      {totalReviews > 0 && (
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Average */}
          <div className="text-center md:text-left">
            <p className="text-5xl font-light text-obsidian-900" style={{ fontFamily: 'var(--font-cormorant)' }}>
              {averageRating}
            </p>
            <div className="flex gap-0.5 mt-2 justify-center md:justify-start">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-4 h-4 ${star <= averageRating ? 'text-amber-gold-500' : 'text-pearl-300'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-xs text-platinum-600 mt-1">{totalReviews} reviews</p>
          </div>

          {/* Distribution bars */}
          <div className="flex-1 space-y-1.5 w-full max-w-sm">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingDistribution[star] || 0;
              const percent = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-xs text-platinum-600 w-3">{star}</span>
                  <svg className="w-3 h-3 text-amber-gold-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <div className="flex-1 h-2 bg-pearl-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 0.6, delay: (5 - star) * 0.1 }}
                      className="h-full bg-amber-gold-500 rounded-full"
                    />
                  </div>
                  <span className="text-[10px] text-platinum-500 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-8">
          {reviews.map((review) => (
            <div
              key={review.review_id}
              className="border-b border-pearl-200 pb-8 last:border-0"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-4 h-4 ${star <= review.rating ? 'text-amber-gold-500' : 'text-pearl-300'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    {review.verified_purchase && (
                      <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-semibold uppercase tracking-wider border border-green-200">
                        Compra verificada
                      </span>
                    )}
                  </div>
                  {review.title && (
                    <h4 className="font-medium text-obsidian-900">{review.title}</h4>
                  )}
                  <p className="text-sm text-platinum-600">
                    Por {review.customer_name} - {new Date(review.created_at).toLocaleDateString('es-CL')}
                  </p>
                </div>
              </div>
              <p className="text-platinum-700 mb-4 leading-relaxed">{review.comment}</p>
              <button
                onClick={() => handleMarkHelpful(review.review_id)}
                className="text-sm text-platinum-600 hover:text-amber-gold-500 transition-colors cursor-pointer"
              >
                Util ({review.helpful_count})
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-platinum-600 py-8">
          Se el primero en dejar una review de este producto.
        </p>
      )}

      {/* Review Form */}
      <ReviewForm productId={productId} onReviewAdded={loadReviews} />
    </div>
  );
}
