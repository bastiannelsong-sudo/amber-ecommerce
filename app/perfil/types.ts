export interface MyOrder {
  order_id: number;
  order_number: string;
  status: string;
  total: number | string;
  items: { name: string; quantity: number }[];
  created_at: string;
}

export interface OrdersResponse {
  orders: MyOrder[];
  total: number;
}
