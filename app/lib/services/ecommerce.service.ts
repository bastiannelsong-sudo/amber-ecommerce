import { apiClient } from '../api-client';

interface ReviewListResponse {
  reviews: {
    review_id: number;
    customer_name: string;
    rating: number;
    title: string;
    comment: string;
    verified_purchase: boolean;
    helpful_count: number;
    created_at: string;
  }[];
  average_rating: number;
  total_reviews: number;
  rating_distribution: Record<number, number>;
}

interface CouponValidateResponse {
  valid: boolean;
  discount_amount: number;
  message: string;
}

/**
 * Servicios ecommerce desde el browser — apuntan al BFF /api/*.
 * Jamás al backend NestJS directo (está en subnet privada).
 */
export const ecommerceService = {
  // ─── ORDERS / PAYMENTS ─────────────────────────────

  async createOrder(data: {
    customer_email: string;
    customer_name: string;
    customer_phone?: string;
    shipping_address: string;
    shipping_city: string;
    shipping_region: string;
    shipping_postal_code?: string;
    items: {
      product_id: number;
      name: string;
      internal_sku: string;
      quantity: number;
      unit_price: number;
      image_url?: string;
    }[];
    coupon_code?: string;
  }): Promise<{ order: Record<string, unknown>; init_point: string }> {
    const response = await apiClient.post<{
      order: Record<string, unknown>;
      init_point: string;
    }>('/orders', data);
    return response.data;
  },

  async getOrder(orderNumber: string): Promise<Record<string, unknown>> {
    const response = await apiClient.get<Record<string, unknown>>(
      `/orders/${orderNumber}`,
    );
    return response.data;
  },

  // ─── REVIEWS ───────────────────────────────────────

  async getProductReviews(productId: number): Promise<ReviewListResponse> {
    const response = await apiClient.get<ReviewListResponse>(`/reviews/${productId}`);
    return response.data;
  },

  async createReview(data: {
    product_id: number;
    customer_name: string;
    customer_email: string;
    rating: number;
    title?: string;
    comment: string;
    order_number?: string;
  }): Promise<Record<string, unknown>> {
    const response = await apiClient.post<Record<string, unknown>>('/reviews', data);
    return response.data;
  },

  async markReviewHelpful(reviewId: number): Promise<Record<string, unknown>> {
    const response = await apiClient.patch<Record<string, unknown>>(
      `/reviews/${reviewId}/helpful`,
    );
    return response.data;
  },

  async getBestsellerIds(): Promise<number[]> {
    const response = await apiClient.get<number[]>('/bestsellers');
    return response.data;
  },

  // ─── COUPONS ───────────────────────────────────────

  async validateCoupon(code: string, cartTotal: number): Promise<CouponValidateResponse> {
    const response = await apiClient.post<CouponValidateResponse>('/coupons/validate', {
      code,
      cart_total: cartTotal,
    });
    return response.data;
  },
};
