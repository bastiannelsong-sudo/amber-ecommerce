'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ecommerceService } from '../../lib/services/ecommerce.service';
import ReviewForm from './ReviewForm';
import type { Review } from '../../lib/types';

interface ReviewListProps {
  productId: number;
}

export default function ReviewList({ productId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [helpedReviews, setHelpedReviews] = useState<Set<number>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      return new Set(JSON.parse(localStorage.getItem('amber_helpful_reviews') || '[]'));
    } catch {
      return new Set();
    }
  });

  const loadReviews = async () => {
    try {
      const data = await ecommerceService.getProductReviews(productId);
      setReviews(data.reviews as Review[]);
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
    if (helpedReviews.has(reviewId)) return;
    try {
      await ecommerceService.markReviewHelpful(reviewId);
      setReviews((prev) =>
        prev.map((r) =>
          r.review_id === reviewId
            ? { ...r, helpful_count: r.helpful_count + 1 }
            : r,
        ),
      );
      const updated = new Set(helpedReviews);
      updated.add(reviewId);
      setHelpedReviews(updated);
      localStorage.setItem('amber_helpful_reviews', JSON.stringify([...updated]));
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
              {averageRating.toFixed(1)}
            </p>
            <div className="flex gap-0.5 mt-2 justify-center md:justify-start">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFull = star <= Math.floor(averageRating);
                const isHalf = !isFull && star === Math.ceil(averageRating) && averageRating % 1 >= 0.25;
                return (
                  <svg
                    key={star}
                    className="w-4 h-4"
                    viewBox="0 0 20 20"
                  >
                    {isHalf ? (
                      <>
                        <defs>
                          <clipPath id={`avg-half-${star}`}>
                            <rect x="0" y="0" width="10" height="20" />
                          </clipPath>
                        </defs>
                        {/* Gray full star as background */}
                        <path
                          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                          fill="#e8e8e8"
                        />
                        {/* Gold half star on top */}
                        <path
                          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                          fill="#c5a028"
                          clipPath={`url(#avg-half-${star})`}
                        />
                      </>
                    ) : (
                      <path
                        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                        fill={isFull ? '#c5a028' : '#e8e8e8'}
                      />
                    )}
                  </svg>
                );
              })}
            </div>
            <p className="text-xs text-platinum-600 mt-1">{totalReviews} {totalReviews === 1 ? 'resena' : 'resenas'}</p>
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
                disabled={helpedReviews.has(review.review_id)}
                className={`inline-flex items-center gap-1.5 text-sm transition-colors cursor-pointer ${
                  helpedReviews.has(review.review_id)
                    ? 'text-amber-gold-500 cursor-default'
                    : 'text-platinum-600 hover:text-amber-gold-500'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z" />
                </svg>
                Util ({review.helpful_count})
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-platinum-600 py-8">
          Se la primera persona en compartir tu experiencia con esta pieza.
        </p>
      )}

      {/* Review Form */}
      <ReviewForm productId={productId} onReviewAdded={loadReviews} />
    </div>
  );
}
