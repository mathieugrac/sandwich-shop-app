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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Trash2,
  Edit,
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
  inventory_count?: number;
  inventory_total?: number;
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSell, setSelectedSell] = useState<Sell | null>(null);
  const [editingSell, setEditingSell] = useState<Sell | null>(null);
  const [newSellDate, setNewSellDate] = useState('');
  const [newSellLocation, setNewSellLocation] = useState('');
  const [newSellNotes, setNewSellNotes] = useState('');
  const [editSellDate, setEditSellDate] = useState('');
  const [editSellLocation, setEditSellLocation] = useState('');
  const [editSellNotes, setEditSellNotes] = useState('');
  const [inventory, setInventory] = useState<{ [key: string]: number }>({});
  const [sellInventoryCache, setSellInventoryCache] = useState<{
    [sellId: string]: { [productId: string]: number };
  }>({});
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

      // Load inventory counts and totals for each sell
      let sellsWithInventoryCount = sellsData || [];
      if (sellsData && sellsData.length > 0) {
        const { data: inventoryData } = await supabase
          .from('sell_inventory')
          .select('sell_id, total_quantity');

        if (inventoryData) {
          const countMap: { [key: string]: number } = {};
          const totalMap: { [key: string]: number } = {};

          inventoryData.forEach(item => {
            if (!countMap[item.sell_id]) {
              countMap[item.sell_id] = 0;
              totalMap[item.sell_id] = 0;
            }
            if (item.total_quantity > 0) {
              countMap[item.sell_id]++;
            }
            totalMap[item.sell_id] += item.total_quantity;
          });

          sellsWithInventoryCount = sellsData.map(sell => ({
            ...sell,
            inventory_count: countMap[sell.id] || 0,
            inventory_total: totalMap[sell.id] || 0,
          }));
        }
      }

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
      if (sellsWithInventoryCount && locationsData) {
        const sellsWithLocations = sellsWithInventoryCount.map(sell => {
          const location = locationsData.find(
            loc => loc.id === sell.location_id
          );
          return {
            ...sell,
            locations: location || null,
          };
        });
        console.log(
          '✅ Combined sells with locations and inventory counts:',
          sellsWithLocations
        );
        setSells(sellsWithLocations);
      } else {
        setSells(sellsWithInventoryCount || []);
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

    // Check if we have cached inventory for this sell
    if (sellInventoryCache[sell.id]) {
      setInventory(sellInventoryCache[sell.id]);
      setShowInventoryModal(true);
      return;
    }

    // Load current inventory for this sell from database
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

    if (inventoryData && inventoryData.length > 0) {
      const inventoryMap: { [key: string]: number } = {};
      inventoryData.forEach(item => {
        inventoryMap[item.product_id] = item.total_quantity;
      });
      setInventory(inventoryMap);
      // Cache this inventory data
      setSellInventoryCache(prev => ({
        ...prev,
        [sell.id]: inventoryMap,
      }));
    } else {
      // Initialize with all products at 0
      const inventoryMap: { [key: string]: number } = {};
      products.forEach(product => {
        inventoryMap[product.id] = 0;
      });
      setInventory(inventoryMap);
      // Cache this inventory data
      setSellInventoryCache(prev => ({
        ...prev,
        [sell.id]: inventoryMap,
      }));
    }

    setShowInventoryModal(true);
  };

  const openEditModal = (sell: Sell) => {
    setEditingSell(sell);
    setEditSellDate(sell.sell_date);
    setEditSellLocation(sell.location_id);
    setEditSellNotes(sell.notes || '');
    setShowEditModal(true);
  };

  const saveInventory = async () => {
    if (!selectedSell) return;

    try {
      // Prepare all inventory updates
      const inventoryUpdates = Object.entries(inventory).map(
        ([productId, quantity]) => ({
          sell_id: selectedSell.id,
          product_id: productId,
          total_quantity: quantity,
          reserved_quantity: 0,
        })
      );

      // Use upsert with proper conflict resolution
      const { error: upsertError } = await supabase
        .from('sell_inventory')
        .upsert(inventoryUpdates, {
          onConflict: 'sell_id,product_id',
        });

      if (upsertError) {
        console.error('Upsert error:', upsertError);
        throw upsertError;
      }

      // Update the cache with the new inventory data
      setSellInventoryCache(prev => ({
        ...prev,
        [selectedSell.id]: inventory,
      }));

      setMessage({ type: 'success', text: 'Menu updated successfully!' });
      setShowInventoryModal(false);
      await loadData();
    } catch (error) {
      console.error('Error updating menu:', error);
      setMessage({
        type: 'error',
        text: 'Failed to update menu. Please try again.',
      });
    }
  };

  const saveEditSell = async () => {
    if (!editingSell) return;

    try {
      const { error } = await supabase
        .from('sells')
        .update({
          sell_date: editSellDate,
          location_id: editSellLocation,
          notes: editSellNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingSell.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Sell updated successfully!' });
      setShowEditModal(false);
      setEditingSell(null);
      await loadData();
    } catch (error) {
      console.error('Error updating sell:', error);
      setMessage({
        type: 'error',
        text: 'Failed to update sell. Please try again.',
      });
    }
  };

  const deleteSell = async (sellId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this sell? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      // Delete the sell (this will cascade delete related inventory and orders)
      const { error } = await supabase.from('sells').delete().eq('id', sellId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Sell deleted successfully!' });
      await loadData();
    } catch (error) {
      console.error('Error deleting sell:', error);
      setMessage({
        type: 'error',
        text: 'Failed to delete sell. Please try again.',
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

        {/* Sells Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Sells</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sells.map(sell => (
                  <TableRow key={sell.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span
                          className={
                            isToday(sell.sell_date) ? 'font-semibold' : ''
                          }
                        >
                          {formatDate(sell.sell_date)}
                        </span>
                        {isToday(sell.sell_date) && (
                          <Badge variant="outline" className="mt-1 w-fit">
                            Today
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {sell.locations?.name || 'No location'}
                    </TableCell>
                    <TableCell>{getStatusBadge(sell.status)}</TableCell>
                    <TableCell>
                      <span className="text-gray-600">
                        {sell.inventory_total || 0} items
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openInventoryModal(sell)}
                          className="flex items-center space-x-2"
                        >
                          <span>Manage Menu</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            router.push(`/admin/orders?sell=${sell.id}`)
                          }
                          className="flex items-center space-x-2"
                        >
                          <span>View Orders</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(sell)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteSell(sell.id)}
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

        {/* Inventory Management Modal */}
        <Dialog open={showInventoryModal} onOpenChange={setShowInventoryModal}>
          <DialogContent className="w-[800px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Manage Menu - {selectedSell?.locations?.name}
              </DialogTitle>
              <DialogDescription>
                Add products to this sell's menu and set quantities for each
                item
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Product Selection and Quantity Management */}
              {products.map(product => {
                const currentQuantity = inventory[product.id] || 0;
                const isInMenu = currentQuantity > 0;

                return (
                  <div
                    key={product.id}
                    className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                      isInMenu
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex-1">
                      <h4
                        className={`font-medium ${currentQuantity === 0 ? 'text-gray-400' : 'text-black'}`}
                      >
                        {product.name}
                      </h4>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newQty = Math.max(0, currentQuantity - 1);
                          const newInventory = {
                            ...inventory,
                            [product.id]: newQty,
                          };
                          console.log('Updating inventory:', newInventory);
                          setInventory(newInventory);
                        }}
                        disabled={currentQuantity === 0}
                      >
                        -
                      </Button>

                      <Input
                        id={`qty-${product.id}`}
                        type="number"
                        min="0"
                        value={currentQuantity}
                        onChange={e => {
                          const newQty = parseInt(e.target.value) || 0;
                          const newInventory = {
                            ...inventory,
                            [product.id]: newQty,
                          };
                          console.log('Updating inventory:', newInventory);
                          setInventory(newInventory);
                        }}
                        className="w-20 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newQty = currentQuantity + 1;
                          const newInventory = {
                            ...inventory,
                            [product.id]: newQty,
                          };
                          console.log('Updating inventory:', newInventory);
                          setInventory(newInventory);
                        }}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Menu Summary */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Menu Summary</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Object.values(inventory).filter(qty => qty > 0).length}
                  </div>
                  <div className="text-sm text-gray-600">Products</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Object.values(inventory).reduce(
                      (sum, qty) => sum + qty,
                      0
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Total Items</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Object.entries(inventory)
                      .filter(([_, qty]) => qty > 0)
                      .reduce((sum, [_, qty]) => {
                        const product = products.find(p => p.id === _);
                        return sum + (product ? product.price * qty : 0);
                      }, 0)
                      .toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Total Value (€)</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                onClick={() => setShowInventoryModal(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={saveInventory}
                className="bg-black hover:bg-gray-800"
                disabled={Object.values(inventory).every(qty => qty === 0)}
              >
                Save Menu
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Sell Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Sell</DialogTitle>
              <DialogDescription>Update the sell information</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-sell-date">Sell Date</Label>
                <Input
                  id="edit-sell-date"
                  type="date"
                  value={editSellDate}
                  onChange={e => setEditSellDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label htmlFor="edit-sell-location">Location</Label>
                <Select
                  value={editSellLocation}
                  onValueChange={setEditSellLocation}
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
                <Label htmlFor="edit-sell-notes">Notes (Optional)</Label>
                <Input
                  id="edit-sell-notes"
                  value={editSellNotes}
                  onChange={e => setEditSellNotes(e.target.value)}
                  placeholder="Special instructions or notes"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button onClick={() => setShowEditModal(false)} variant="outline">
                Cancel
              </Button>
              <Button
                onClick={saveEditSell}
                className="bg-black hover:bg-gray-800"
              >
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
