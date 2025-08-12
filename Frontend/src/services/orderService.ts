// Service for order-related API calls (list current user's orders)
import { api } from "../lib/api";
import type { ResponseOrder } from "../types/order";

export const orderService = {
  // Cookie/JWT-based; backend uses current user, no userId param
  listMy: () => api.get<ResponseOrder[]>("/order/me"),
};
