import 'server-only';
import { cache } from 'react';

const BASE = process.env.INTERNAL_API_URL ?? 'http://localhost:3000';

export interface Review {
  review_id: number;
  customer_name: string;
  rating: number;
  title: string;
  comment: string;
  verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
}

export interface ReviewDetail {
  reviews: Review[];
  average_rating: number;
  total_reviews: number;
  rating_distribution: Record<number, number>;
}

export interface ReviewSummary {
  average_rating: number;
  total_reviews: number;
}

export const getProductReviews = cache(
  async (productId: number): Promise<ReviewDetail | null> => {
    const res = await fetch(`${BASE}/ecommerce/reviews/${productId}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return res.json();
  },
);

export const getReviewSummary = cache(
  async (productId: number): Promise<ReviewSummary | null> => {
    const detail = await getProductReviews(productId);
    if (!detail || detail.total_reviews <= 0) return null;
    const avg = Number(detail.average_rating);
    const total = Number(detail.total_reviews);
    if (!isFinite(avg) || !isFinite(total)) return null;
    return { average_rating: avg, total_reviews: total };
  },
);
