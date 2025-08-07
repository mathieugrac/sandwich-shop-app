import { Product } from './products';

export interface InventoryItem {
  id: string;
  product_id: string;
  date: string;
  total_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  created_at: string;
  updated_at: string;
  products: Product;
}

export async function fetchInventory(date: string): Promise<InventoryItem[]> {
  const response = await fetch(`/api/inventory/${date}`);

  if (!response.ok) {
    throw new Error('Failed to fetch inventory');
  }

  return response.json();
}
