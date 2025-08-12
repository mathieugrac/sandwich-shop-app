'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { supabase } from '@/lib/supabase/client';
import {
  ArrowLeft,
  Plus,
  Calendar,
  Settings,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  MapPin,
  Package,
} from 'lucide-react';

interface Location {
  id: string;
  name: string;
  district: string;
  address: string;
  delivery_timeframe: string;
}

interface Sell {
  id: string;
  sell_date: string;
  location_id: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  announcement_sent: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
  locations?: Location;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  sort_order: number;
}

interface SellInventory {
  id: string;
  sell_id: string;
  product_id: string;
  total_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  products?: Product;
}

export default function SellManagementPage() {
  const [sells, setSells] = useState<Sell[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [selectedSell, setSelectedSell] = useState<Sell | null>(null);
  const [newSellDate, setNewSellDate] = useState('');
  const [newSellLocation, setNewSellLocation] = useState('');
  const [newSellNotes, setNewSellNotes] = useState('');
  const [inventory, setInventory] = useState<{ [key: string]: number }>({});
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/admin');
    }
  };

  const loadData = async () => {
    try {
      console.log('🔄 Loading data...');

      // First, let's check what tables exist
      console.log('🔍 Checking database structure...');

      // Test basic table access
      try {
        const { data: testData, error: testError } = await supabase
          .from('sells')
          .select('id')
          .limit(1);

        if (testError) {
          console.error('❌ Sells table test failed:', testError);
        } else {
          console.log(
            '✅ Sells table accessible, found rows:',
            testData?.length || 0
          );
        }
      } catch (testErr) {
        console.error('❌ Sells table test exception:', testErr);
      }

      // Load sells with location information
      console.log('🔄 Loading sells...');
      const { data: sellsData, error: sellsError } = await supabase
        .from('sells')
        .select('*')
        .order('sell_date', { ascending: true });

      if (sellsError) {
        console.error('❌ Error loading sells:', sellsError);
        console.error('❌ Error details:', {
          message: sellsError.message,
          details: sellsError.details,
          hint: sellsError.hint,
          code: sellsError.code,
        });
      } else {
        console.log('✅ Sells loaded:', sellsData);
      }

      // Load locations
      console.log('🔄 Loading locations...');
      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select('*')
        .eq('active', true)
        .order('name');

      if (locationsError) {
        console.error('❌ Error loading locations:', locationsError);
        console.error('❌ Error details:', {
          message: locationsError.message,
          details: locationsError.details,
          hint: locationsError.hint,
          code: locationsError.code,
        });
      } else {
        console.log('✅ Locations loaded:', locationsData);
      }

      // Load products
      console.log('🔄 Loading products...');
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('sort_order');

      if (productsError) {
        console.error('❌ Error loading products:', productsError);
        console.error('❌ Error details:', {
          message: productsError.message,
          details: productsError.details,
          hint: productsError.hint,
          code: productsError.code,
        });
      } else {
        console.log('✅ Products loaded:', productsData);
      }

      // Combine sells with location information
      if (sellsData && locationsData) {
        const sellsWithLocations = sellsData.map(sell => {
          const location = locationsData.find(
            loc => loc.id === sell.location_id
          );
          return {
            ...sell,
            locations: location || null,
          };
        });
        console.log('✅ Combined sells with locations:', sellsWithLocations);
        setSells(sellsWithLocations);
      } else {
        setSells(sellsData || []);
      }

      setLocations(locationsData || []);
      setProducts(productsData || []);
    } catch (error) {
      console.error('❌ Unexpected error in loadData:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSell = async () => {
    if (!newSellDate || !newSellLocation) {
      setMessage({
        type: 'error',
        text: 'Please select both a sell date and location',
      });
      return;
    }

    setCreating(true);
    setMessage(null);

    try {
      console.log('Creating sell with:', {
        sell_date: newSellDate,
        location_id: newSellLocation,
        status: 'draft',
        notes: newSellNotes,
      });

      const { data: sell, error } = await supabase
        .from('sells')
        .insert({
          sell_date: newSellDate,
          location_id: newSellLocation,
          status: 'draft',
          notes: newSellNotes,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Sell created successfully:', sell);

      // Create inventory for all products
      const inventoryData = products.map(product => ({
        sell_id: sell.id,
        product_id: product.id,
        total_quantity: 0, // Default to 0, admin will set later
        reserved_quantity: 0,
      }));

      const { error: inventoryError } = await supabase
        .from('sell_inventory')
        .insert(inventoryData);

      if (inventoryError) {
        console.error('Inventory creation error:', inventoryError);
      }

      setMessage({ type: 'success', text: 'Sell created successfully!' });
      setShowCreateForm(false);
      setNewSellDate('');
      setNewSellLocation('');
      setNewSellNotes('');

      // Reload data to show the new sell
      await loadData();
    } catch (error) {
      console.error('Error creating sell:', error);
      setMessage({
        type: 'error',
        text: 'Failed to create sell. Please try again.',
      });
    } finally {
      setCreating(false);
    }
  };

  const openInventoryModal = async (sell: Sell) => {
    setSelectedSell(sell);

    // Load current inventory for this sell
    const { data: inventoryData } = await supabase
      .from('sell_inventory')
      .select(
        `
        *,
        products (
          id,
          name,
          description,
          price
        )
      `
      )
      .eq('sell_id', sell.id);

    if (inventoryData) {
      const inventoryMap: { [key: string]: number } = {};
      inventoryData.forEach(item => {
        inventoryMap[item.product_id] = item.total_quantity;
      });
      setInventory(inventoryMap);
    }

    setShowInventoryModal(true);
  };

  const saveInventory = async () => {
    if (!selectedSell) return;

    try {
      // Update inventory for each product
      for (const [productId, quantity] of Object.entries(inventory)) {
        await supabase.from('sell_inventory').upsert({
          sell_id: selectedSell.id,
          product_id: productId,
          total_quantity: quantity,
          reserved_quantity: 0,
        });
      }

      setMessage({ type: 'success', text: 'Inventory updated successfully!' });
      setShowInventoryModal(false);
      setSelectedSell(null);
      setInventory({});
      await loadData();
    } catch (error) {
      console.error('Error updating inventory:', error);
      setMessage({
        type: 'error',
        text: 'Failed to update inventory. Please try again.',
      });
    }
  };

  const updateSellStatus = async (sellId: string, newStatus: string) => {
    try {
      await supabase
        .from('sells')
        .update({ status: newStatus })
        .eq('id', sellId);

      // Update local state
      setSells(
        sells.map(sell =>
          sell.id === sellId
            ? { ...sell, status: newStatus as Sell['status'] }
            : sell
        )
      );
    } catch (error) {
      console.error('Error updating sell status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Clock className="h-4 w-4" />;
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isToday = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  };

  const isFuture = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString > today;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sells...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">
                Sell Management
              </h1>
              <p className="text-gray-600">Create and manage sandwich sells</p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-black hover:bg-gray-800"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Sell
          </Button>
        </div>

        {/* Message */}
        {message && (
          <Alert
            className={`mb-6 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}
          >
            <AlertDescription
              className={
                message.type === 'error' ? 'text-red-800' : 'text-green-800'
              }
            >
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Create Sell Form */}
        {showCreateForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create New Sell</CardTitle>
              <CardDescription>
                Set up a new sandwich sell event
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="sell-date">Sell Date</Label>
                  <Input
                    id="sell-date"
                    type="date"
                    value={newSellDate}
                    onChange={e => setNewSellDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="sell-location">Location</Label>
                  <Select
                    value={newSellLocation}
                    onValueChange={setNewSellLocation}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(location => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name} - {location.district}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sell-notes">Notes (Optional)</Label>
                  <Input
                    id="sell-notes"
                    value={newSellNotes}
                    onChange={e => setNewSellNotes(e.target.value)}
                    placeholder="Special instructions or notes"
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={createSell}
                  disabled={creating}
                  className="bg-black hover:bg-gray-800"
                >
                  {creating && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Create Sell
                </Button>
                <Button
                  onClick={() => setShowCreateForm(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sells List */}
        <div className="grid gap-6">
          {sells.map(sell => (
            <Card key={sell.id} className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(sell.status)}
                        {getStatusBadge(sell.status)}
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span
                          className={
                            isToday(sell.sell_date)
                              ? 'font-semibold text-black'
                              : ''
                          }
                        >
                          {formatDate(sell.sell_date)}
                        </span>
                        {isToday(sell.sell_date) && (
                          <Badge variant="outline" className="ml-2">
                            Today
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Location Information */}
                    {sell.locations && (
                      <div className="flex items-center space-x-2 text-gray-600 mb-2">
                        <MapPin className="w-4 h-4" />
                        <span className="font-medium">
                          {sell.locations.name}
                        </span>
                        <span className="text-sm">
                          ({sell.locations.district})
                        </span>
                        <span className="text-sm">
                          • {sell.locations.delivery_timeframe}
                        </span>
                      </div>
                    )}

                    {sell.notes && (
                      <p className="text-gray-600 text-sm mb-3">{sell.notes}</p>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    {/* Inventory Management Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openInventoryModal(sell)}
                      className="flex items-center space-x-2"
                    >
                      <Package className="w-4 h-4" />
                      <span>Inventory</span>
                    </Button>

                    {/* Status Update Buttons */}
                    {sell.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => updateSellStatus(sell.id, 'active')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Activate
                      </Button>
                    )}
                    {sell.status === 'active' && (
                      <Button
                        size="sm"
                        onClick={() => updateSellStatus(sell.id, 'completed')}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Complete
                      </Button>
                    )}
                    {sell.status === 'draft' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => updateSellStatus(sell.id, 'cancelled')}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Inventory Management Modal */}
        <Dialog open={showInventoryModal} onOpenChange={setShowInventoryModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Manage Inventory - {selectedSell?.locations?.name}
              </DialogTitle>
              <DialogDescription>
                Set quantities for each product in this sell
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {products.map(product => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-black">{product.name}</h4>
                    <p className="text-sm text-gray-600">
                      {product.description}
                    </p>
                    <p className="text-sm text-gray-600">€{product.price}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor={`qty-${product.id}`} className="text-sm">
                      Quantity:
                    </Label>
                    <Input
                      id={`qty-${product.id}`}
                      type="number"
                      min="0"
                      value={inventory[product.id] || 0}
                      onChange={e =>
                        setInventory({
                          ...inventory,
                          [product.id]: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-20"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                onClick={saveInventory}
                className="bg-black hover:bg-gray-800"
              >
                Save Inventory
              </Button>
              <Button
                onClick={() => setShowInventoryModal(false)}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
