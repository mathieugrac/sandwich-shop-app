import { Location } from '@/types/database';

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

export async function createLocation(locationData: {
  name: string;
  address: string;
  location_url?: string;
  pickup_hour_start: string;
  pickup_hour_end: string;
}): Promise<Location> {
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
  locationData: Partial<{
    name: string;
    address: string;
    location_url: string;
    pickup_hour_start: string;
    pickup_hour_end: string;
    active: boolean;
  }>
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
