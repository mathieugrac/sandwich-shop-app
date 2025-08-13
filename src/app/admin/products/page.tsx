'use client';

import { useEffect, useState } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase/client';
import { ArrowLeft, Plus, Edit, Trash2, Save, X } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  sell_price: number;
  production_cost: number;
  category: 'sandwich' | 'side' | 'dessert' | 'beverage';
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sell_price: '',
    production_cost: '',
    category: 'sandwich' as const,
    active: true,
    sort_order: 0,
  });
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    loadProducts();
  }, []);

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/admin');
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sell_price: '',
      production_cost: '',
      category: 'sandwich' as const,
      active: true,
      sort_order: 0,
    });
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description || '',
      sell_price: product.sell_price.toString(),
      production_cost: product.production_cost.toString(),
      category: product.category,
      active: product.active,
      sort_order: product.sort_order,
    });
    setEditingProduct(product);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingProduct(null);
    resetForm();
  };

  const saveProduct = async () => {
    if (!formData.name || !formData.sell_price || !formData.production_cost)
      return;

    try {
      const productData = {
        name: formData.name,
        description: formData.description || null,
        sell_price: parseFloat(formData.sell_price),
        production_cost: parseFloat(formData.production_cost),
        category: formData.category,
        active: formData.active,
        sort_order: formData.sort_order,
      };

      if (editingProduct) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
      } else {
        // Create new product
        const { error } = await supabase.from('products').insert(productData);

        if (error) throw error;
      }

      closeModal();
      await loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      await loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Products</h1>
              <p className="text-gray-600">Manage your sandwich menu</p>
            </div>
          </div>
          <Button
            onClick={openCreateModal}
            className="bg-black hover:bg-gray-800"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Products</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>Production Cost</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sort Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map(product => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {product.description || '-'}
                    </TableCell>
                    <TableCell>€{product.sell_price}</TableCell>
                    <TableCell>€{product.production_cost}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.active ? 'default' : 'secondary'}>
                        {product.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{product.sort_order}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(product)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteProduct(product.id)}
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
          open={showCreateModal || !!editingProduct}
          onOpenChange={closeModal}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Edit Product' : 'Create Product'}
              </DialogTitle>
              <DialogDescription>
                {editingProduct
                  ? 'Update product information'
                  : 'Add a new product to your menu'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Product name"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={e =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Product description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sell_price">Selling Price (€)</Label>
                  <Input
                    id="sell_price"
                    type="number"
                    step="0.01"
                    value={formData.sell_price}
                    onChange={e =>
                      setFormData({ ...formData, sell_price: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="production_cost">Production Cost (€)</Label>
                  <Input
                    id="production_cost"
                    type="number"
                    step="0.01"
                    value={formData.production_cost}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        production_cost: e.target.value,
                      })
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={value =>
                    setFormData({
                      ...formData,
                      category: value as
                        | 'sandwich'
                        | 'side'
                        | 'dessert'
                        | 'beverage',
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandwich">Sandwich</SelectItem>
                    <SelectItem value="side">Side</SelectItem>
                    <SelectItem value="dessert">Dessert</SelectItem>
                    <SelectItem value="beverage">Beverage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sort_order">Sort Order</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        sort_order: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="flex items-center space-x-2 pt-6">
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
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button onClick={closeModal} variant="outline">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={saveProduct}
                className="bg-black hover:bg-gray-800"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingProduct ? 'Update' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
