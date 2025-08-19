import {
  Drop,
  DropWithProducts,
  AdminDrop,
  DropWithCalculatedFields,
} from '@/types/database';
import { supabase } from '@/lib/supabase/client';

export async function fetchDrops(): Promise<DropWithCalculatedFields[]> {
  const response = await fetch('/api/drops');
  if (!response.ok) {
    throw new Error('Failed to fetch drops');
  }
  return response.json();
}

export async function fetchNextActiveDrop(): Promise<{
  drop: DropWithCalculatedFields;
  products: Array<{
    id: string;
    name: string;
    description: string | null;
    selling_price: number;
    category: 'sandwich' | 'side' | 'dessert' | 'beverage';
    active: boolean;
    sort_order: number;
    availableStock: number;
  }>;
} | null> {
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
): Promise<void> {
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
}

// Enhanced drop management functions (Phase 2)
export async function fetchAdminUpcomingDrops(): Promise<AdminDrop[]> {
  const response = await fetch('/api/drops/admin/upcoming');
  if (!response.ok) {
    throw new Error('Failed to fetch upcoming drops');
  }
  return response.json();
}

export async function fetchAdminPastDrops(): Promise<AdminDrop[]> {
  const response = await fetch('/api/drops/admin/past');
  if (!response.ok) {
    throw new Error('Failed to fetch past drops');
  }
  return response.json();
}

export async function changeDropStatus(
  dropId: string,
  newStatus: Drop['status']
): Promise<{ success: boolean; message: string }> {
  // Get the current session token
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('No active session');
  }

  const response = await fetch(`/api/drops/${dropId}/change-status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ newStatus }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to change drop status');
  }

  return response.json();
}

export async function calculatePickupDeadline(
  dropDate: string,
  locationId: string
): Promise<{ deadline: string }> {
  const response = await fetch('/api/drops/calculate-deadline', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ dropDate, locationId }),
  });

  if (!response.ok) {
    throw new Error('Failed to calculate pickup deadline');
  }

  return response.json();
}

export async function isDropOrderable(
  dropId: string
): Promise<{ orderable: boolean }> {
  const response = await fetch(`/api/drops/${dropId}/orderable`);
  if (!response.ok) {
    throw new Error('Failed to check if drop is orderable');
  }
  return response.json();
}

export async function fetchFutureDrops(): Promise<DropWithCalculatedFields[]> {
  const response = await fetch('/api/drops/future');
  if (!response.ok) {
    throw new Error('Failed to fetch future drops');
  }
  return response.json();
}
