import {
  Sell,
  SellWithLocation,
  SellWithInventory,
  Location,
} from '@/types/database';

export interface NextActiveSell {
  sell: {
    id: string;
    sell_date: string;
    status: string;
    location: Location;
  };
  products: Array<{
    id: string;
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
    category: string;
    active: boolean;
    sort_order: number;
    availableStock: number;
  }>;
}

export async function fetchSells(): Promise<SellWithLocation[]> {
  const response = await fetch('/api/sells');
  if (!response.ok) {
    throw new Error('Failed to fetch sells');
  }
  return response.json();
}

export async function fetchNextActiveSell(): Promise<NextActiveSell | null> {
  const response = await fetch('/api/sells/next-active');
  if (!response.ok) {
    throw new Error('Failed to fetch next active sell');
  }
  return response.json();
}

export async function fetchSellWithInventory(
  sellId: string
): Promise<SellWithInventory | null> {
  const response = await fetch(`/api/sells/${sellId}/inventory`);
  if (!response.ok) {
    throw new Error('Failed to fetch sell inventory');
  }
  return response.json();
}

export async function createSell(sellData: {
  sell_date: string;
  location_id: string;
  notes?: string;
}): Promise<Sell> {
  const response = await fetch('/api/sells', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(sellData),
  });

  if (!response.ok) {
    throw new Error('Failed to create sell');
  }

  return response.json();
}

export async function updateSellStatus(
  sellId: string,
  status: Sell['status']
): Promise<void> {
  const response = await fetch(`/api/sells/${sellId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error('Failed to update sell status');
  }
}

export async function updateSellInventory(
  sellId: string,
  inventory: Array<{
    product_id: string;
    total_quantity: number;
  }>
): Promise<void> {
  const response = await fetch(`/api/sells/${sellId}/inventory`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inventory }),
  });

  if (!response.ok) {
    throw new Error('Failed to update sell inventory');
  }
}

export async function fetchFutureSells(): Promise<Array<SellWithLocation & { total_available: number }>> {
  const response = await fetch('/api/sells/future');
  if (!response.ok) {
    throw new Error('Failed to fetch future sells');
  }
  return response.json();
}
