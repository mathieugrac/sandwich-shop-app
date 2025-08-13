import { Drop, Location } from '@/types/database';

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
    image_url: string | null;
    category: string;
    active: boolean;
    sort_order: number;
    availableStock: number;
  }>;
}

export async function fetchDrops(): Promise<Drop[]> {
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

export async function fetchDropWithInventory(dropId: string): Promise<unknown> {
  const response = await fetch(`/api/drops/${dropId}/drop-products`);
  if (!response.ok) {
    throw new Error('Failed to fetch drop inventory');
  }
  return response.json();
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

export async function updateDropInventory(
  dropId: string,
  inventory: Array<{
    product_id: string;
    total_quantity: number;
  }>
): Promise<void> {
  const response = await fetch(`/api/drops/${dropId}/drop-products`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inventory }),
  });

  if (!response.ok) {
    throw new Error('Failed to update drop inventory');
  }
}

export async function fetchFutureDrops(): Promise<
  Array<Drop & { total_available: number }>
> {
  const response = await fetch('/api/drops/future');
  if (!response.ok) {
    throw new Error('Failed to fetch future drops');
  }
  return response.json();
}
