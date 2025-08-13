import { Product } from '@/types/database';

export async function fetchProducts(): Promise<Product[]> {
  const response = await fetch('/api/products');

  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  return response.json();
}

export async function createProduct(productData: {
  name: string;
  description: string;
  sell_price: number;
  production_cost: number;
  category: 'sandwich' | 'side' | 'dessert' | 'beverage';
  active?: boolean;
  sort_order?: number;
}): Promise<Product> {
  const response = await fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(productData),
  });

  if (!response.ok) {
    throw new Error('Failed to create product');
  }

  return response.json();
}

export async function updateProduct(
  productId: string,
  productData: Partial<Product>
): Promise<Product> {
  const response = await fetch(`/api/products/${productId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(productData),
  });

  if (!response.ok) {
    throw new Error('Failed to update product');
  }

  return response.json();
}
