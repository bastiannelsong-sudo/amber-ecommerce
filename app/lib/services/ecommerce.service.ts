import { apiClient } from '../api-client';

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
  }): Promise<{ order: any; init_point: string }> {
    const response = await apiClient.post('/ecommerce/orders', data);
    return response.data;
  },

  async getOrder(orderNumber: string): Promise<any> {
    const response = await apiClient.get(`/ecommerce/orders/${orderNumber}`);
    return response.data;
  },

  // ─── REVIEWS ───────────────────────────────────────

  async getProductReviews(productId: number): Promise<{
    reviews: any[];
    average_rating: number;
    total_reviews: number;
    rating_distribution: Record<number, number>;
  }> {
    const response = await apiClient.get(`/ecommerce/reviews/${productId}`);
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
  }): Promise<any> {
    const response = await apiClient.post('/ecommerce/reviews', data);
    return response.data;
  },

  async markReviewHelpful(reviewId: number): Promise<any> {
    const response = await apiClient.patch(`/ecommerce/reviews/${reviewId}/helpful`);
    return response.data;
  },

  async getBestsellerIds(): Promise<number[]> {
    const response = await apiClient.get('/ecommerce/bestsellers');
    return response.data;
  },

  // ─── COUPONS ───────────────────────────────────────

  async validateCoupon(code: string, cartTotal: number): Promise<{
    valid: boolean;
    discount_amount: number;
    message: string;
  }> {
    const response = await apiClient.post('/ecommerce/coupons/validate', {
      code,
      cart_total: cartTotal,
    });
    return response.data;
  },
};
