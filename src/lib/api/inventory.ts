import type { Database } from '@/types/database';

type Product = Database['public']['Tables']['products']['Row'];
type DropProduct = Database['public']['Tables']['drop_products']['Row'];

export interface InventoryItem extends DropProduct {
  product: Product;
}

export async function fetchInventory(date: string): Promise<InventoryItem[]> {
  const response = await fetch(`/api/inventory/${date}`);

  if (!response.ok) {
    throw new Error('Failed to fetch inventory');
  }

  return response.json();
}

export async function fetchDropInventory(
  dropId: string
): Promise<InventoryItem[]> {
  const response = await fetch(`/api/drops/${dropId}/inventory`);

  if (!response.ok) {
    throw new Error('Failed to fetch drop inventory');
  }

  return response.json();
}
