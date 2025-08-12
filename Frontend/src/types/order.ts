export type OrderItem = {
  id: number;
  productId: number;
  name?: string;
  quantity: number;
  price: number;
  product?: {
    id: number;
    name: string;
    price: number;
    imageUrl?: string | null;
  };
};

export type ResponseOrder = {
  id: number;
  status: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
};
