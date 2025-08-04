export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  category: string
  active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface DailyInventory {
  id: string
  product_id: string
  date: string
  total_quantity: number
  reserved_quantity: number
  available_quantity: number
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  pickup_time: string
  pickup_date: string
  status: 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled'
  total_amount: number
  special_instructions: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  created_at: string
}

export interface AdminUser {
  id: string
  email: string
  name: string
  role: string
  created_at: string
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface OrderFormData {
  customerName: string
  customerEmail: string
  customerPhone?: string
  pickupTime: string
  pickupDate: string
  items: Array<{
    productId: string
    quantity: number
    unitPrice: number
  }>
  specialInstructions?: string
} 