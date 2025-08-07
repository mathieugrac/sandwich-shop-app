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
import { supabase } from '@/lib/supabase/client';
import {
  ArrowLeft,
  Save,
  Package,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  sort_order: number;
}

interface InventoryItem {
  id: string;
  product_id: string;
  date: string;
  total_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  products: Product;
}

export default function InventoryManagementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    loadInventoryData();
  }, []);

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/admin');
    }
  };

  const loadInventoryData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Load products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('sort_order');

      // Load today's inventory
      const { data: inventoryData } = await supabase
        .from('daily_inventory')
        .select(
          `
          *,
          products (*)
        `
        )
        .eq('date', today);

      setProducts(productsData || []);
      setInventory(inventoryData || []);
    } catch (error) {
      console.error('Error loading inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInventoryForProduct = (productId: string) => {
    return inventory.find(item => item.product_id === productId);
  };

  const updateInventoryQuantity = (productId: string, quantity: number) => {
    const updatedInventory = inventory.map(item =>
      item.product_id === productId
        ? { ...item, total_quantity: quantity }
        : item
    );
    setInventory(updatedInventory);
  };

  const setAllToQuantity = (quantity: number) => {
    const updatedInventory = products.map(product => {
      const existing = getInventoryForProduct(product.id);
      return {
        id: existing?.id || '',
        product_id: product.id,
        date: new Date().toISOString().split('T')[0],
        total_quantity: quantity,
        reserved_quantity: existing?.reserved_quantity || 0,
        available_quantity: quantity - (existing?.reserved_quantity || 0),
        products: product,
      };
    });
    setInventory(updatedInventory);
  };

  const saveInventory = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const today = new Date().toISOString().split('T')[0];

      for (const item of inventory) {
        if (item.id) {
          // Update existing inventory
          await supabase
            .from('daily_inventory')
            .update({
              total_quantity: item.total_quantity,
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.id);
        } else {
          // Create new inventory
          await supabase.from('daily_inventory').insert({
            product_id: item.product_id,
            date: today,
            total_quantity: item.total_quantity,
            reserved_quantity: 0,
          });
        }
      }

      setMessage({ type: 'success', text: 'Inventory updated successfully!' });
      await loadInventoryData(); // Reload to get updated data
    } catch (error) {
      console.error('Error saving inventory:', error);
      setMessage({
        type: 'error',
        text: 'Failed to update inventory. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.available_quantity === 0) {
      return {
        status: 'sold-out',
        text: 'Sold Out',
        color: 'bg-red-100 text-red-800',
      };
    } else if (item.available_quantity <= 3) {
      return {
        status: 'low-stock',
        text: 'Low Stock',
        color: 'bg-yellow-100 text-yellow-800',
      };
    } else {
      return {
        status: 'available',
        text: 'Available',
        color: 'bg-green-100 text-green-800',
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-xl font-semibold">Inventory Management</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={saveInventory}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {message && (
          <Alert
            className={`mb-4 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
          >
            <AlertDescription
              className={
                message.type === 'success' ? 'text-green-800' : 'text-red-800'
              }
            >
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Set inventory for all products at once
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setAllToQuantity(10)}>
                Set All to 10
              </Button>
              <Button variant="outline" onClick={() => setAllToQuantity(20)}>
                Set All to 20
              </Button>
              <Button variant="outline" onClick={() => setAllToQuantity(0)}>
                Set All to 0
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Form */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Inventory</CardTitle>
            <CardDescription>
              Set quantities for today's menu items. Changes will be reflected
              immediately for customers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {products.map(product => {
                const inventoryItem = getInventoryForProduct(product.id);
                const stockStatus = inventoryItem
                  ? getStockStatus(inventoryItem)
                  : null;

                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{product.name}</h3>
                        {stockStatus && (
                          <Badge className={stockStatus.color}>
                            {stockStatus.text}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {product.description}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Price: ${product.price}</span>
                        {inventoryItem && (
                          <>
                            <span>
                              Reserved: {inventoryItem.reserved_quantity}
                            </span>
                            <span>
                              Available: {inventoryItem.available_quantity}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label
                        htmlFor={`quantity-${product.id}`}
                        className="text-sm font-medium"
                      >
                        Quantity:
                      </Label>
                      <Input
                        id={`quantity-${product.id}`}
                        type="number"
                        min="0"
                        value={inventoryItem?.total_quantity || 0}
                        onChange={e =>
                          updateInventoryQuantity(
                            product.id,
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-20"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Inventory Summary */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Inventory Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {inventory.filter(item => item.available_quantity > 3).length}
                </div>
                <div className="text-sm text-green-600">Available Items</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {
                    inventory.filter(
                      item =>
                        item.available_quantity > 0 &&
                        item.available_quantity <= 3
                    ).length
                  }
                </div>
                <div className="text-sm text-yellow-600">Low Stock Items</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {
                    inventory.filter(item => item.available_quantity === 0)
                      .length
                  }
                </div>
                <div className="text-sm text-red-600">Sold Out Items</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
