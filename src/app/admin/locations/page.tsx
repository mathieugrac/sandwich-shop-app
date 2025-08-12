'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase/client';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  MapPin,
  ExternalLink,
} from 'lucide-react';

interface Location {
  id: string;
  name: string;
  district: string;
  address: string;
  google_maps_link: string | null;
  delivery_timeframe: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    district: '',
    address: '',
    google_maps_link: '',
    delivery_timeframe: '',
    active: true,
  });
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    loadLocations();
  }, []);

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/admin');
    }
  };

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
      google_maps_link: '',
      delivery_timeframe: '',
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
      google_maps_link: location.google_maps_link || '',
      delivery_timeframe: location.delivery_timeframe,
      active: location.active,
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
      !formData.delivery_timeframe
    )
      return;

    try {
      const locationData = {
        name: formData.name,
        district: formData.district,
        address: formData.address,
        google_maps_link: formData.google_maps_link || null,
        delivery_timeframe: formData.delivery_timeframe,
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
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => router.push('/admin/dashboard')}
              variant="ghost"
              size="sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Locations</h1>
              <p className="text-gray-600">
                Manage delivery locations and timeframes
              </p>
            </div>
          </div>
          <Button
            onClick={openCreateModal}
            className="bg-black hover:bg-gray-800"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Location
          </Button>
        </div>

        {/* Locations Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Delivery Timeframe</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map(location => (
                  <TableRow key={location.id}>
                    <TableCell className="font-medium">
                      {location.name}
                    </TableCell>
                    <TableCell>{location.district}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {location.address}
                    </TableCell>
                    <TableCell>{location.delivery_timeframe}</TableCell>
                    <TableCell>
                      <Badge
                        variant={location.active ? 'default' : 'secondary'}
                      >
                        {location.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        {location.google_maps_link && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              window.open(location.google_maps_link!, '_blank')
                            }
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(location)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteLocation(location.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

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
                <Label htmlFor="name">Location Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Impact Hub"
                />
              </div>

              <div>
                <Label htmlFor="district">District</Label>
                <Input
                  id="district"
                  value={formData.district}
                  onChange={e =>
                    setFormData({ ...formData, district: e.target.value })
                  }
                  placeholder="e.g., Penha da França"
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
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
                <Label htmlFor="google_maps_link">
                  Google Maps Link (Optional)
                </Label>
                <Input
                  id="google_maps_link"
                  value={formData.google_maps_link}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      google_maps_link: e.target.value,
                    })
                  }
                  placeholder="https://maps.google.com/..."
                />
              </div>

              <div>
                <Label htmlFor="delivery_timeframe">Delivery Timeframe</Label>
                <Input
                  id="delivery_timeframe"
                  value={formData.delivery_timeframe}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      delivery_timeframe: e.target.value,
                    })
                  }
                  placeholder="e.g., 12:00-14:00"
                />
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
                <Label htmlFor="active">Active</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button onClick={closeModal} variant="outline">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={saveLocation}
                className="bg-black hover:bg-gray-800"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingLocation ? 'Update' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
