'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  AdminPageTemplate,
  AdminTable,
  AdminTableHeader,
  AdminTableHead,
  AdminTableBody,
  AdminTableRow,
  AdminTableCell,
  AdminCard,
  AdminCardContent,
  AdminButton,
  AdminBadge,
  AdminInput,
  AdminLabel,
} from '@/components/admin';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase/client';
import { useRequireAuth } from '@/lib/hooks';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  ExternalLink,
  MoreHorizontal,
} from 'lucide-react';
import type { Database } from '@/types/database';

// Use types from database instead of duplicate interfaces
type Location = Database['public']['Tables']['locations']['Row'];

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    district: '',
    address: '',
    location_url: '',
    pickup_hour_start: '',
    pickup_hour_end: '',
    active: true,
  });
  const router = useRouter();

  useRequireAuth();

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error loading locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      district: '',
      address: '',
      location_url: '',
      pickup_hour_start: '',
      pickup_hour_end: '',
      active: true,
    });
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (location: Location) => {
    setFormData({
      name: location.name,
      district: location.district,
      address: location.address,
      location_url: location.location_url || '',
      pickup_hour_start: location.pickup_hour_start,
      pickup_hour_end: location.pickup_hour_end,
      active: location.active || false,
    });
    setEditingLocation(location);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingLocation(null);
    resetForm();
  };

  const saveLocation = async () => {
    if (
      !formData.name ||
      !formData.district ||
      !formData.address ||
      !formData.pickup_hour_start ||
      !formData.pickup_hour_end
    )
      return;

    try {
      const locationData = {
        name: formData.name,
        district: formData.district,
        address: formData.address,
        location_url: formData.location_url || null,
        pickup_hour_start: formData.pickup_hour_start,
        pickup_hour_end: formData.pickup_hour_end,
        active: formData.active,
      };

      if (editingLocation) {
        // Update existing location
        const { error } = await supabase
          .from('locations')
          .update(locationData)
          .eq('id', editingLocation.id);

        if (error) throw error;
      } else {
        // Create new location
        const { error } = await supabase.from('locations').insert(locationData);

        if (error) throw error;
      }

      closeModal();
      await loadLocations();
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  const deleteLocation = async (locationId: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return;

    try {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', locationId);

      if (error) throw error;
      await loadLocations();
    } catch (error) {
      console.error('Error deleting location:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading locations...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminPageTemplate
      title="Locations"
      subtitle="Manage delivery locations and timeframes"
      primaryAction={{
        label: 'Add Location',
        onClick: openCreateModal,
        icon: Plus,
      }}
    >
      {/* Locations Table */}
      <AdminCard>
        <AdminCardContent className="p-0">
          <AdminTable>
            <AdminTableHeader>
              <AdminTableRow>
                <AdminTableHead>Name</AdminTableHead>
                <AdminTableHead>District</AdminTableHead>
                <AdminTableHead>Address</AdminTableHead>
                <AdminTableHead>Pickup Hours</AdminTableHead>
                <AdminTableHead>Status</AdminTableHead>
                <AdminTableHead className="w-12">
                  <span className="sr-only">Actions</span>
                </AdminTableHead>
              </AdminTableRow>
            </AdminTableHeader>
            <AdminTableBody>
              {locations.map(location => (
                <AdminTableRow key={location.id}>
                  <AdminTableCell className="font-medium">
                    {location.name}
                  </AdminTableCell>
                  <AdminTableCell>{location.district}</AdminTableCell>
                  <AdminTableCell className="max-w-xs truncate">
                    {location.address}
                  </AdminTableCell>
                  <AdminTableCell>
                    {location.pickup_hour_start} - {location.pickup_hour_end}
                  </AdminTableCell>
                  <AdminTableCell>
                    <AdminBadge
                      variant={location.active ? 'success' : 'secondary'}
                    >
                      {location.active ? 'Active' : 'Inactive'}
                    </AdminBadge>
                  </AdminTableCell>
                  <AdminTableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <AdminButton
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </AdminButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {location.location_url && (
                          <DropdownMenuItem
                            onClick={() =>
                              window.open(location.location_url!, '_blank')
                            }
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Location
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => openEditModal(location)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteLocation(location.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminTableBody>
          </AdminTable>
        </AdminCardContent>
      </AdminCard>

      {/* Create/Edit Modal */}
      <Dialog
        open={showCreateModal || !!editingLocation}
        onOpenChange={closeModal}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? 'Edit Location' : 'Create Location'}
            </DialogTitle>
            <DialogDescription>
              {editingLocation
                ? 'Update location information'
                : 'Add a new delivery location'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <AdminLabel htmlFor="name">Location Name</AdminLabel>
              <AdminInput
                id="name"
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Impact Hub"
              />
            </div>

            <div>
              <AdminLabel htmlFor="district">District</AdminLabel>
              <AdminInput
                id="district"
                value={formData.district}
                onChange={e =>
                  setFormData({ ...formData, district: e.target.value })
                }
                placeholder="e.g., Penha da França"
              />
            </div>

            <div>
              <AdminLabel htmlFor="address">Address</AdminLabel>
              <Textarea
                id="address"
                value={formData.address}
                onChange={e =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Full address"
                rows={2}
              />
            </div>

            <div>
              <AdminLabel htmlFor="location_url">
                Location URL (Optional)
              </AdminLabel>
              <AdminInput
                id="location_url"
                value={formData.location_url}
                onChange={e =>
                  setFormData({
                    ...formData,
                    location_url: e.target.value,
                  })
                }
                placeholder="https://maps.google.com/..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <AdminLabel htmlFor="pickup_hour_start">
                  Pickup Start Time
                </AdminLabel>
                <AdminInput
                  id="pickup_hour_start"
                  type="time"
                  value={formData.pickup_hour_start}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      pickup_hour_start: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <AdminLabel htmlFor="pickup_hour_end">
                  Pickup End Time
                </AdminLabel>
                <AdminInput
                  id="pickup_hour_end"
                  type="time"
                  value={formData.pickup_hour_end}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      pickup_hour_end: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="active"
                type="checkbox"
                checked={formData.active}
                onChange={e =>
                  setFormData({ ...formData, active: e.target.checked })
                }
                className="rounded"
              />
              <AdminLabel htmlFor="active">Active</AdminLabel>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <AdminButton onClick={closeModal} variant="outline">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </AdminButton>
            <AdminButton onClick={saveLocation} variant="admin-primary">
              <Save className="w-4 h-4 mr-2" />
              {editingLocation ? 'Update' : 'Create'}
            </AdminButton>
          </div>
        </DialogContent>
      </Dialog>
    </AdminPageTemplate>
  );
}
