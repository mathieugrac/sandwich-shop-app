import { Product, DropProduct } from '@/types/database';

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
