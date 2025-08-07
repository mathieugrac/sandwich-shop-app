export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  category: string;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export async function fetchProducts(): Promise<Product[]> {
  const response = await fetch('/api/products');

  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  return response.json();
}
