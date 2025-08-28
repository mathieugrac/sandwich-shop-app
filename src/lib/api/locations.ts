import type { Database } from '@/types/database';

type Location = Database['public']['Tables']['locations']['Row'];
type LocationInsert = Database['public']['Tables']['locations']['Insert'];
type LocationUpdate = Database['public']['Tables']['locations']['Update'];

export async function fetchLocations(): Promise<Location[]> {
  const response = await fetch('/api/locations');
  if (!response.ok) {
    throw new Error('Failed to fetch locations');
  }
  return response.json();
}

export async function fetchLocation(id: string): Promise<Location> {
  const response = await fetch(`/api/locations/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch location');
  }
  return response.json();
}

export async function createLocation(locationData: LocationInsert): Promise<Location> {
  const response = await fetch('/api/locations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(locationData),
  });

  if (!response.ok) {
    throw new Error('Failed to create location');
  }

  return response.json();
}

export async function updateLocation(
  id: string,
  locationData: LocationUpdate
): Promise<Location> {
  const response = await fetch(`/api/locations/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(locationData),
  });

  if (!response.ok) {
    throw new Error('Failed to update location');
  }

  return response.json();
}

export async function deleteLocation(id: string): Promise<void> {
  const response = await fetch(`/api/locations/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete location');
  }
}
