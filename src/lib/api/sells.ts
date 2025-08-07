export interface Sell {
  id: string;
  sell_date: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  announcement_sent: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface SellInventoryItem {
  id: string;
  sell_id: string;
  product_id: string;
  total_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  created_at: string;
  updated_at: string;
  products: {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url?: string;
    category: string;
    active: boolean;
    sort_order: number;
  };
}

export interface NextActiveSell {
  sell: {
    id: string;
    sell_date: string;
    status: string;
  };
  products: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    image_url?: string;
    category: string;
    active: boolean;
    sort_order: number;
    availableStock: number;
  }>;
}

export async function fetchSells(): Promise<Sell[]> {
  const response = await fetch('/api/sells');

  if (!response.ok) {
    throw new Error('Failed to fetch sells');
  }

  return response.json();
}

export async function fetchSellInventory(sellId: string): Promise<SellInventoryItem[]> {
  const response = await fetch(`/api/sells/${sellId}/inventory`);

  if (!response.ok) {
    throw new Error('Failed to fetch sell inventory');
  }

  return response.json();
}

export async function fetchNextActiveSell(): Promise<NextActiveSell> {
  const response = await fetch('/api/sells/next-active');

  if (!response.ok) {
    throw new Error('Failed to fetch next active sell');
  }

  return response.json();
} 