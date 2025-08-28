'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase/client';
import { ArrowLeft, Package, TrendingUp, TrendingDown } from 'lucide-react';
import type { Database } from '@/types/database';

// Use types from database instead of duplicate interfaces
type Product = Database['public']['Tables']['products']['Row'];
type Drop = Database['public']['Tables']['drops']['Row'];
type DropProduct = Database['public']['Tables']['drop_products']['Row'];

export default function DropProductsPage() {
  const [drops, setDrops] = useState<
    Array<Drop & { location?: { name: string; address: string } }>
  >([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [dropProducts, setDropProducts] = useState<
    Array<
      DropProduct & {
        product?: Product;
        drop?: Drop & { location?: { name: string; address: string } };
      }
    >
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedDrop, setSelectedDrop] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<DropProduct | null>(
    null
  );
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    stock_quantity: 0,
    selling_price: 0,
  });

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
      console.log('🔄 Loading drop products data...');

      // Load drops
      const { data: dropsData, error: dropsError } = await supabase
        .from('drops')
        .select(
          `
          id,
          date,
          status,
          location:locations (
            name,
            address
          )
        `
        )
        .order('date', { ascending: false });

      if (dropsError) {
        console.error('❌ Error loading drops:', dropsError);
      } else {
        // Transform the data to match our interface
        const transformedDrops = (dropsData || []).map(drop => ({
          id: drop.id,
          date: drop.date,
          status: drop.status,
          location_id: null, // Not available in this query
          notes: null, // Not available in this query
          created_at: null, // Not available in this query
          updated_at: null, // Not available in this query
          last_modified_by: null, // Not available in this query
          status_changed_at: null, // Not available in this query
          pickup_deadline: null, // Not available in this query
          location: Array.isArray(drop.location)
            ? drop.location[0]
            : drop.location,
        }));
        setDrops(transformedDrops);
      }

      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('name');

      if (productsError) {
        console.error('❌ Error loading products:', productsError);
      } else {
        setProducts(productsData || []);
      }

      // Load drop products with related data
      const { data: dropProductsData, error: dropProductsError } =
        await supabase
          .from('drop_products')
          .select(
            `
          *,
          product:products (*),
          drop:drops (
            id,
            date,
            status,
            location:locations (
              name,
              address
            )
          )
        `
          )
          .order('created_at', { ascending: false });

      if (dropProductsError) {
        console.error('❌ Error loading drop products:', dropProductsError);
      } else {
        // Transform the data to match our interface
        const transformedDropProducts = (dropProductsData || []).map(dp => ({
          ...dp,
          drop: dp.drop
            ? {
                ...dp.drop,
                location: Array.isArray(dp.drop.location)
                  ? dp.drop.location[0]
                  : dp.drop.location,
              }
            : undefined,
        }));
        setDropProducts(transformedDropProducts);
      }
    } catch (error) {
      console.error('❌ Unexpected error in loadData:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (dropProduct: DropProduct) => {
    setEditingProduct(dropProduct);
    setEditForm({
      stock_quantity: dropProduct.stock_quantity,
      selling_price: dropProduct.selling_price,
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingProduct(null);
    setEditForm({ stock_quantity: 0, selling_price: 0 });
  };

  const saveDropProduct = async () => {
    if (!editingProduct) return;

    try {
      const { error } = await supabase
        .from('drop_products')
        .update({
          stock_quantity: editForm.stock_quantity,
          selling_price: editForm.selling_price,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingProduct.id);

      if (error) throw error;

      closeEditModal();
      await loadData();
    } catch (error) {
      console.error('Error updating drop product:', error);
    }
  };

  const filteredDropProducts = dropProducts.filter(dp => {
    if (selectedDrop === 'all') return true;
    return dp.drop_id === selectedDrop;
  });

  const getStockStatus = (
    available: number,
    stock: number,
    reserved: number
  ) => {
    if (stock === 0)
      return {
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        text: 'Not Sold',
      };
    if (reserved === stock)
      return {
        color: 'bg-red-100 text-red-800 border-red-200',
        text: 'Sold Out',
      };
    if (available <= stock * 0.1)
      return {
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        text: 'Low Stock',
      };
    return {
      color: 'bg-green-100 text-green-800 border-green-200',
      text: 'In Stock',
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading drop products...</p>
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
                Drop Products Management
              </h1>
              <p className="text-gray-600">
                Monitor and edit product availability across all drops
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Drop Products Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="drop-filter">Filter by Drop</Label>
                <Select value={selectedDrop} onValueChange={setSelectedDrop}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Drops</SelectItem>
                    {drops.map(drop => (
                      <SelectItem key={drop.id} value={drop.id}>
                        {new Date(drop.date).toLocaleDateString()} -{' '}
                        {drop.location?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Drop Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Drop Products</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Drop</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDropProducts.map(dropProduct => {
                  const stockStatus = getStockStatus(
                    dropProduct.available_quantity || 0,
                    dropProduct.stock_quantity,
                    dropProduct.reserved_quantity || 0
                  );
                  return (
                    <TableRow key={dropProduct.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {dropProduct.product?.name || 'Unknown Product'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {dropProduct.product?.category}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {new Date(
                              dropProduct.drop?.date || ''
                            ).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {dropProduct.drop?.location?.name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {dropProduct.stock_quantity}
                      </TableCell>
                      <TableCell className="text-orange-600">
                        {dropProduct.reserved_quantity}
                      </TableCell>
                      <TableCell className="font-medium">
                        {dropProduct.available_quantity}
                      </TableCell>
                      <TableCell className="font-medium">
                        €{dropProduct.selling_price}
                      </TableCell>
                      <TableCell>
                        <Badge className={stockStatus.color}>
                          {stockStatus.text}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(dropProduct)}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Modal */}
        {showEditModal && editingProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Edit Drop Product</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={editForm.stock_quantity}
                    onChange={e =>
                      setEditForm({
                        ...editForm,
                        stock_quantity: parseInt(e.target.value) || 0,
                      })
                    }
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="price">Selling Price (€)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={editForm.selling_price}
                    onChange={e =>
                      setEditForm({
                        ...editForm,
                        selling_price: parseFloat(e.target.value) || 0,
                      })
                    }
                    min="0"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button onClick={closeEditModal} variant="outline">
                  Cancel
                </Button>
                <Button
                  onClick={saveDropProduct}
                  className="bg-black hover:bg-gray-800"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
