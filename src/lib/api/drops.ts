import {
  Drop,
  DropWithLocation,
  Location,
  Product,
  DropWithProducts,
} from '@/types/database';

export interface NextActiveDrop {
  drop: {
    id: string;
    date: string;
    status: string;
    location: Location;
  };
  products: Array<{
    id: string;
    name: string;
    description: string | null;
    sell_price: number;
    category: 'sandwich' | 'side' | 'dessert' | 'beverage';
    active: boolean;
    sort_order: number;
    availableStock: number;
  }>;
}

export async function fetchDrops(): Promise<DropWithLocation[]> {
  const response = await fetch('/api/drops');
  if (!response.ok) {
    throw new Error('Failed to fetch drops');
  }
  return response.json();
}

export async function fetchNextActiveDrop(): Promise<NextActiveDrop | null> {
  const response = await fetch('/api/drops/next-active');
  if (!response.ok) {
    throw new Error('Failed to fetch next active drop');
  }
  return response.json();
}

export async function fetchDropWithProducts(
  dropId: string
): Promise<DropWithProducts | null> {
  try {
    const response = await fetch(`/api/drops/${dropId}/drop-products`);
    if (!response.ok) {
      throw new Error('Failed to fetch drop products');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching drop products:', error);
    return null;
  }
}

export async function createDrop(dropData: {
  date: string;
  location_id: string;
  notes?: string;
}): Promise<Drop> {
  const response = await fetch('/api/drops', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dropData),
  });

  if (!response.ok) {
    throw new Error('Failed to create drop');
  }

  return response.json();
}

export async function updateDropStatus(
  dropId: string,
  status: Drop['status']
): Promise<void> {
  const response = await fetch(`/api/drops/${dropId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error('Failed to update drop status');
  }
}

export async function updateDropProducts(
  dropId: string,
  dropProducts: Array<{
    product_id: string;
    stock_quantity: number;
    selling_price: number;
  }>
): Promise<boolean> {
  try {
    const response = await fetch(`/api/drops/${dropId}/drop-products`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dropProducts }),
    });

    if (!response.ok) {
      throw new Error('Failed to update drop products');
    }

    return true;
  } catch (error) {
    console.error('Error updating drop products:', error);
    return false;
  }
}

export async function fetchFutureDrops(): Promise<
  Array<DropWithLocation & { total_available: number }>
> {
  const response = await fetch('/api/drops/future');
  if (!response.ok) {
    throw new Error('Failed to fetch future drops');
  }
  return response.json();
}
