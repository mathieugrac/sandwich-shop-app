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
import { Drop, DropWithLocation, Location, Product } from '@/types/database';

interface DropProduct {
  id: string;
  drop_id: string;
  product_id: string;
  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  selling_price: number;
  created_at: string;
  updated_at: string;
  products?: Product;
}

export default function DropManagementPage() {
  const [drops, setDrops] = useState<
    (DropWithLocation & {
      drop_products_count?: number;
      drop_products_total?: number;
    })[]
  >([]);
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
  const [selectedDrop, setSelectedDrop] = useState<
    | (DropWithLocation & {
        drop_products_count?: number;
        drop_products_total?: number;
      })
    | null
  >(null);
  const [editingDrop, setEditingDrop] = useState<
    | (DropWithLocation & {
        drop_products_count?: number;
        drop_products_total?: number;
      })
    | null
  >(null);
  const [newDropDate, setNewDropDate] = useState('');
  const [newDropLocation, setNewDropLocation] = useState('');
  const [newDropStatus, setNewDropStatus] = useState<
    'upcoming' | 'active' | 'completed' | 'cancelled'
  >('upcoming');
  const [editDropDate, setEditDropDate] = useState('');
  const [editDropLocation, setEditDropLocation] = useState('');
  const [editDropStatus, setEditDropStatus] = useState<
    'upcoming' | 'active' | 'completed' | 'cancelled'
  >('upcoming');
  const [inventory, setInventory] = useState<{ [key: string]: number }>({});
  const [dropInventoryCache, setDropInventoryCache] = useState<{
    [dropId: string]: { [productId: string]: number };
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
          .from('drops')
          .select('id')
          .limit(1);

        if (testError) {
          console.error('❌ Drops table test failed:', testError);
        } else {
          console.log(
            '✅ Drops table accessible, found rows:',
            testData?.length || 0
          );
        }
      } catch (testErr) {
        console.error('❌ Drops table test exception:', testErr);
      }

      // Load drops with location information
      console.log('🔄 Loading drops...');
      const { data: dropsData, error: dropsError } = await supabase
        .from('drops')
        .select('*')
        .order('date', { ascending: true });

      // Load inventory counts and totals for each drop
      let dropsWithInventoryCount = dropsData || [];
      if (dropsData && dropsData.length > 0) {
        const { data: dropProductData } = await supabase
          .from('drop_products')
          .select('drop_id, stock_quantity');

        if (dropProductData) {
          const countMap: { [key: string]: number } = {};
          const totalMap: { [key: string]: number } = {};

          dropProductData.forEach(item => {
            if (!countMap[item.drop_id]) {
              countMap[item.drop_id] = 0;
              totalMap[item.drop_id] = 0;
            }
            if (item.stock_quantity > 0) {
              countMap[item.drop_id]++;
            }
            totalMap[item.drop_id] += item.stock_quantity;
          });

          dropsWithInventoryCount = dropsData.map(drop => ({
            ...drop,
            drop_products_count: countMap[drop.id] || 0,
            drop_products_total: totalMap[drop.id] || 0,
          }));
        }
      }

      if (dropsError) {
        console.error('❌ Error loading drops:', dropsError);
        console.error('❌ Error details:', {
          message: dropsError.message,
          details: dropsError.details,
          hint: dropsError.hint,
          code: dropsError.code,
        });
      } else {
        console.log('✅ Drops loaded:', dropsData);
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

      // Combine drops with location information
      if (dropsWithInventoryCount && locationsData) {
        const dropsWithLocations = dropsWithInventoryCount.map(drop => {
          const location = locationsData.find(
            loc => loc.id === drop.location_id
          );
          return {
            ...drop,
            location: location || null,
          };
        });
        console.log(
          '✅ Combined drops with locations and inventory counts:',
          dropsWithLocations
        );
        setDrops(dropsWithLocations);
      } else {
        setDrops(dropsWithInventoryCount || []);
      }

      setLocations(locationsData || []);
      setProducts(productsData || []);
    } catch (error) {
      console.error('❌ Unexpected error in loadData:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDrop = async () => {
    if (!newDropDate || !newDropLocation) {
      setMessage({
        type: 'error',
        text: 'Please select both a drop date and location',
      });
      return;
    }

    setCreating(true);
    setMessage(null);

    try {
      console.log('Creating drop with:', {
        date: newDropDate,
        location_id: newDropLocation,
        status: newDropStatus,
      });

      const { data: drop, error } = await supabase
        .from('drops')
        .insert({
          date: newDropDate,
          location_id: newDropLocation,
          status: newDropStatus,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Drop created successfully:', drop);

      // Don't automatically create drop products - let admin manage menu manually
      // This ensures only selected products are attached to drops

      setMessage({
        type: 'success',
        text: 'Drop created successfully! You can now manage its menu.',
      });
      setShowCreateForm(false);
      setNewDropDate('');
      setNewDropLocation('');
      setNewDropStatus('upcoming');

      // Reload data to show the new drop
      await loadData();
    } catch (error) {
      console.error('Error creating drop:', error);
      setMessage({
        type: 'error',
        text: 'Failed to create drop. Please try again.',
      });
    } finally {
      setCreating(false);
    }
  };

  const openInventoryModal = async (
    drop: DropWithLocation & {
      drop_products_count?: number;
      drop_products_total?: number;
    }
  ) => {
    setSelectedDrop(drop);

    // Check if we have cached inventory for this drop
    if (dropInventoryCache[drop.id]) {
      setInventory(dropInventoryCache[drop.id]);
      setShowInventoryModal(true);
      return;
    }

    // Load current inventory for this drop from database
    const { data: inventoryData } = await supabase
      .from('drop_products')
      .select(
        `
        *,
        products (
          id,
          name,
          description,
          sell_price
        )
      `
      )
      .eq('drop_id', drop.id);

    if (inventoryData && inventoryData.length > 0) {
      // Transform the data to match our interface
      const inventoryMap: { [key: string]: number } = {};
      inventoryData.forEach(item => {
        inventoryMap[item.product_id] = item.stock_quantity;
      });
      setInventory(inventoryMap);
      // Cache this inventory data
      setDropInventoryCache(prev => ({
        ...prev,
        [drop.id]: inventoryMap,
      }));
    } else {
      // Initialize with NO products (empty inventory)
      // This means no products are attached to the drop by default
      setInventory({});
      // Cache this empty inventory data
      setDropInventoryCache(prev => ({
        ...prev,
        [drop.id]: {},
      }));
    }

    setShowInventoryModal(true);
  };

  const openEditModal = (
    drop: DropWithLocation & {
      drop_products_count?: number;
      drop_products_total?: number;
    }
  ) => {
    setEditingDrop(drop);
    setEditDropDate(drop.date);
    setEditDropLocation(drop.location_id);
    setEditDropStatus(drop.status);
    setShowEditModal(true);
  };

  const saveDropMenu = async () => {
    if (!selectedDrop) return;

    try {
      // Get only products that have quantities > 0 (products actually in this drop's menu)
      const productsToInclude = Object.entries(inventory)
        .filter(([productId, quantity]) => quantity > 0)
        .map(([productId, quantity]) => {
          const product = products.find(p => p.id === productId);
          if (!product) {
            throw new Error(`Product ${productId} not found`);
          }

          return {
            drop_id: selectedDrop.id,
            product_id: productId,
            stock_quantity: quantity,
            reserved_quantity: 0,
            selling_price: product.sell_price,
          };
        });

      console.log(
        `🔄 Updating drop menu for: ${selectedDrop.date} at ${selectedDrop.location?.name}`
      );
      console.log(`📦 Products to include: ${productsToInclude.length}`);

      // Check if there are existing orders for this drop
      const { data: existingOrders, error: ordersCheckError } = await supabase
        .from('orders')
        .select('id')
        .eq('drop_id', selectedDrop.id);

      if (ordersCheckError) {
        console.error('❌ Error checking existing orders:', ordersCheckError);
        throw ordersCheckError;
      }

      const hasExistingOrders = existingOrders && existingOrders.length > 0;

      if (hasExistingOrders) {
        console.log(
          `⚠️ Drop has ${existingOrders.length} existing orders - using UPDATE approach`
        );

        // Get current drop products to see what needs to be updated vs inserted
        const { data: currentDropProducts, error: currentError } =
          await supabase
            .from('drop_products')
            .select('id, product_id, stock_quantity, selling_price')
            .eq('drop_id', selectedDrop.id);

        if (currentError) {
          console.error(
            '❌ Error fetching current drop products:',
            currentError
          );
          throw currentError;
        }

        // Create a map of current products for easy lookup
        const currentProductsMap = new Map(
          currentDropProducts?.map(dp => [dp.product_id, dp]) || []
        );

        // Process each product to include
        for (const productToInclude of productsToInclude) {
          const existingProduct = currentProductsMap.get(
            productToInclude.product_id
          );

          if (existingProduct) {
            // Update existing product
            const { error: updateError } = await supabase
              .from('drop_products')
              .update({
                stock_quantity: productToInclude.stock_quantity,
                selling_price: productToInclude.selling_price,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingProduct.id);

            if (updateError) {
              console.error('❌ Error updating drop product:', updateError);
              throw updateError;
            }
          } else {
            // Insert new product
            const { error: insertError } = await supabase
              .from('drop_products')
              .insert(productToInclude);

            if (insertError) {
              console.error(
                '❌ Error inserting new drop product:',
                insertError
              );
              throw insertError;
            }
          }
        }

        // Remove products that are no longer in the menu (only if no orders exist)
        const productsToRemove =
          currentDropProducts?.filter(
            cp => !productsToInclude.some(p => p.product_id === cp.product_id)
          ) || [];

        for (const productToRemove of productsToRemove) {
          // Check if this specific drop_product has any orders
          const { data: productOrders, error: productOrdersError } =
            await supabase
              .from('order_products')
              .select('id')
              .eq('drop_product_id', productToRemove.id);

          if (productOrdersError) {
            console.error(
              '❌ Error checking product orders:',
              productOrdersError
            );
            throw productOrdersError;
          }

          if (productOrders && productOrders.length > 0) {
            console.log(
              `⚠️ Cannot remove product ${productToRemove.product_id} - has ${productOrders.length} orders`
            );
            // Set quantity to 0 instead of deleting
            const { error: zeroError } = await supabase
              .from('drop_products')
              .update({
                stock_quantity: 0,
                updated_at: new Date().toISOString(),
              })
              .eq('id', productToRemove.id);

            if (zeroError) {
              console.error('❌ Error zeroing drop product:', zeroError);
              throw zeroError;
            }
          } else {
            // Safe to delete
            const { error: deleteError } = await supabase
              .from('drop_products')
              .delete()
              .eq('id', productToRemove.id);

            if (deleteError) {
              console.error('❌ Error deleting drop product:', deleteError);
              throw deleteError;
            }
          }
        }
      } else {
        console.log('✅ No existing orders - using DELETE + INSERT approach');

        // First, remove all existing products from this drop
        const { error: deleteError } = await supabase
          .from('drop_products')
          .delete()
          .eq('drop_id', selectedDrop.id);

        if (deleteError) {
          console.error('❌ Error removing existing products:', deleteError);
          throw deleteError;
        }

        // If no products to include, we're done (drop has empty menu)
        if (productsToInclude.length === 0) {
          console.log('✅ Drop menu cleared (no products)');
          setMessage({
            type: 'success',
            text: 'Drop menu cleared successfully!',
          });
          setShowInventoryModal(false);
          await loadData();
          return;
        }

        // Add the selected products to this drop's menu
        const { error: insertError } = await supabase
          .from('drop_products')
          .insert(productsToInclude);

        if (insertError) {
          console.error('❌ Error adding products to drop:', insertError);
          throw insertError;
        }
      }

      // Update the cache with the new menu data
      setDropInventoryCache(prev => ({
        ...prev,
        [selectedDrop.id]: inventory,
      }));

      console.log('✅ Drop menu updated successfully');
      setMessage({
        type: 'success',
        text: `Drop menu updated with ${productsToInclude.length} products!`,
      });
      setShowInventoryModal(false);
      await loadData();
    } catch (error) {
      console.error('❌ Error updating drop menu:', error);
      if (error instanceof Error) {
        setMessage({
          type: 'error',
          text: `Failed to update drop menu: ${error.message}`,
        });
      } else {
        setMessage({
          type: 'error',
          text: 'Failed to update drop menu. Please try again.',
        });
      }
    }
  };

  const saveEditDrop = async () => {
    if (!editingDrop) return;

    try {
      const { error } = await supabase
        .from('drops')
        .update({
          date: editDropDate,
          location_id: editDropLocation,
          status: editDropStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingDrop.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Drop updated successfully!' });
      setShowEditModal(false);
      setEditingDrop(null);
      await loadData();
    } catch (error) {
      console.error('Error updating drop:', error);
      setMessage({
        type: 'error',
        text: 'Failed to update drop. Please try again.',
      });
    }
  };

  const deleteDrop = async (dropId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this drop? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      // Delete the drop (this will cascade delete related inventory and orders)
      const { error } = await supabase.from('drops').delete().eq('id', dropId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Drop deleted successfully!' });
      await loadData();
    } catch (error) {
      console.error('Error deleting drop:', error);
      setMessage({
        type: 'error',
        text: 'Failed to delete drop. Please try again.',
      });
    }
  };

  const updateDropStatus = async (dropId: string, newStatus: string) => {
    try {
      await supabase
        .from('drops')
        .update({ status: newStatus })
        .eq('id', dropId);

      // Update local state
      setDrops(
        drops.map(drop =>
          drop.id === dropId
            ? { ...drop, status: newStatus as Drop['status'] }
            : drop
        )
      );
    } catch (error) {
      console.error('Error updating drop status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="secondary">Upcoming</Badge>;
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
      case 'upcoming':
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
          <p className="text-gray-600">Loading drops...</p>
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
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Drop Management
              </h1>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-black hover:bg-gray-800"
          >
            Create Drop
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

        {/* Create Drop Modal */}
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Drop</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="drop-date">Drop Date</Label>
                <Input
                  id="drop-date"
                  type="date"
                  value={newDropDate}
                  onChange={e => setNewDropDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label htmlFor="drop-location">Location</Label>
                <Select
                  value={newDropLocation}
                  onValueChange={setNewDropLocation}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(location => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name} - {location.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="drop-status">Status</Label>
                <Select
                  value={newDropStatus}
                  onValueChange={(value: string) =>
                    setNewDropStatus(
                      value as 'upcoming' | 'active' | 'completed' | 'cancelled'
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                onClick={() => setShowCreateForm(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={createDrop}
                disabled={creating}
                className="bg-black hover:bg-gray-800"
              >
                {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Drop
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Drops Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Drops</CardTitle>
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
                {drops.map(drop => (
                  <TableRow key={drop.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span
                          className={isToday(drop.date) ? 'font-semibold' : ''}
                        >
                          {formatDate(drop.date)}
                        </span>
                        {isToday(drop.date) && (
                          <Badge variant="outline" className="mt-1 w-fit">
                            Today
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {drop.location?.name || 'No location'}
                    </TableCell>
                    <TableCell>{getStatusBadge(drop.status)}</TableCell>
                    <TableCell>
                      <span className="text-gray-600">
                        {drop.drop_products_total || 0} items
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openInventoryModal(drop)}
                          className="flex items-center space-x-2"
                        >
                          <span>Manage Menu</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            router.push(`/admin/orders?drop=${drop.id}`)
                          }
                          className="flex items-center space-x-2"
                        >
                          <span>View Orders</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(drop)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteDrop(drop.id)}
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
                Manage Drop Menu - {selectedDrop?.location?.name}
              </DialogTitle>
              <DialogDescription>
                Select which products to include in this drop&apos;s menu and
                set quantities for each item
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Help Text */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> Products are not automatically added
                  to drops. Use the + button to add products to this drop&apos;s
                  menu, or set quantities to 0 to remove them. Only products
                  with quantities &gt; 0 will be included in the customer menu.
                </p>
              </div>

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

            {/* Drop Menu Summary */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">
                Drop Menu Summary
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Object.values(inventory).filter(qty => qty > 0).length}
                  </div>
                  <div className="text-sm text-gray-600">Products in Menu</div>
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
                        return sum + (product ? product.sell_price * qty : 0);
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
                onClick={saveDropMenu}
                className="bg-black hover:bg-gray-800"
                disabled={Object.values(inventory).every(qty => qty === 0)}
              >
                {Object.values(inventory).every(qty => qty === 0)
                  ? 'Clear Menu'
                  : 'Save Drop Menu'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Drop Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Drop</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-drop-date">Drop Date</Label>
                <Input
                  id="edit-drop-date"
                  type="date"
                  value={editDropDate}
                  onChange={e => setEditDropDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label htmlFor="edit-drop-location">Location</Label>
                <Select
                  value={editDropLocation}
                  onValueChange={setEditDropLocation}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(location => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name} - {location.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-drop-status">Status</Label>
                <Select
                  value={editDropStatus}
                  onValueChange={(value: string) =>
                    setEditDropStatus(
                      value as 'upcoming' | 'active' | 'completed' | 'cancelled'
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button onClick={() => setShowEditModal(false)} variant="outline">
                Cancel
              </Button>
              <Button
                onClick={saveEditDrop}
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
