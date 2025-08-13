export interface Product {
  id: string;
  name: string;
  description: string | null;
  sell_price: number;
  production_cost: number;
  category: 'sandwich' | 'side' | 'dessert' | 'beverage';
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
}

export interface Location {
  id: string;
  name: string;
  district: string;
  address: string;
  location_url: string | null;
  pickup_hour_start: string;
  pickup_hour_end: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Drop {
  id: string;
  date: string;
  location_id: string;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DropProduct {
  id: string;
  drop_id: string;
  product_id: string;
  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  selling_price: number;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  drop_id: string;
  client_id: string | null;
  pickup_time: string;
  order_date: string;
  status: 'pending' | 'confirmed' | 'prepared' | 'completed' | 'cancelled';
  total_amount: number;
  special_instructions: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderProduct {
  id: string;
  order_id: string;
  drop_product_id: string;
  order_quantity: number;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderFormData {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  pickupTime: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  specialInstructions?: string;
}

// Extended interfaces for API responses
export interface DropWithLocation extends Drop {
  location: Location;
}

export interface DropWithInventory extends Drop {
  location: Location;
  inventory: Array<
    DropProduct & {
      product: Product;
    }
  >;
}

export interface OrderWithDetails extends Order {
  drop: Drop;
  client: Client | null;
  order_products: Array<
    OrderProduct & {
      drop_product: DropProduct & {
        product: Product;
      };
    }
  >;
}

export interface ProductWithImages extends Product {
  images: ProductImage[];
}

// New interfaces for the improved data model
export interface DropProductWithProduct extends DropProduct {
  product: Product;
}

export interface OrderProductWithDetails extends OrderProduct {
  drop_product: DropProductWithProduct;
}

export interface DropWithProducts extends Drop {
  location: Location;
  drop_products: DropProductWithProduct[];
}

export interface ClientWithOrders extends Client {
  orders: Order[];
}

export interface LocationWithDrops extends Location {
  drops: Drop[];
}
