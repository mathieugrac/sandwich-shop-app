// Core database types - these match the actual database schema
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
  product_images?: ProductImage[];
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
  pickup_deadline: string | null;
  last_modified_by: string | null;
  status_changed_at: string | null;
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

// Extended types for specific use cases - simplified and consolidated
export interface DropWithLocation extends Drop {
  location: Location;
}

// Type for drops with calculated fields from API responses
export interface DropWithCalculatedFields extends DropWithLocation {
  total_available: number;
}

export interface DropWithProducts extends Drop {
  location: Location;
  dropProducts: Array<DropProduct & {
    product: Product & {
      product_images?: ProductImage[];
    };
  }>;
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

// Admin-specific types - simplified from complex extended types
export interface AdminDrop extends Drop {
  location_name: string;
  total_available: number;
}
