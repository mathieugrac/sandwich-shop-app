export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string;
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
  google_maps_link: string | null;
  delivery_timeframe: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Sell {
  id: string;
  sell_date: string;
  location_id: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  announcement_sent: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SellInventory {
  id: string;
  sell_id: string;
  product_id: string;
  total_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
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
  sell_id: string;
  client_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  pickup_time: string;
  status: 'pending' | 'confirmed' | 'prepared' | 'completed' | 'cancelled';
  total_amount: number;
  special_instructions: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
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
export interface SellWithLocation extends Sell {
  location: Location;
}

export interface SellWithInventory extends Sell {
  location: Location;
  inventory: Array<
    SellInventory & {
      product: Product;
    }
  >;
}

export interface OrderWithDetails extends Order {
  sell: Sell;
  client: Client | null;
  order_items: Array<
    OrderItem & {
      product: Product;
    }
  >;
}

export interface ProductWithImages extends Product {
  images: ProductImage[];
}
