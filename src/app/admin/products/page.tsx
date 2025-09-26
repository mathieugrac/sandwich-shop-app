'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useRequireAuth } from '@/lib/hooks';
import type { Database } from '@/types/database';
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
  FilterBar,
  FilterOption,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Upload,
  Image as ImageIcon,
  MoreHorizontal,
} from 'lucide-react';
import Image from 'next/image';

// Use types from database instead of duplicate interfaces
type Product = Database['public']['Tables']['products']['Row'];
type ProductImage = Database['public']['Tables']['product_images']['Row'];

// Extended product type with images
interface ProductWithImages extends Product {
  product_images?: ProductImage[];
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductWithImages[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithImages[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sell_price: '',
    production_cost: '',
    category: 'sandwich' as 'sandwich' | 'side' | 'dessert' | 'beverage',
    active: true,
    sort_order: 0,
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const router = useRouter();

  useRequireAuth();

  useEffect(() => {
    loadProducts();
  }, []);

  // Filter products based on search and filters
  useEffect(() => {
    let filtered = products;

    // Apply search filter
    if (searchValue) {
      filtered = filtered.filter(
        product =>
          product.name.toLowerCase().includes(searchValue.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchValue.toLowerCase())
      );
    }

    // Apply category filters
    if (activeFilters.length > 0) {
      filtered = filtered.filter(product =>
        activeFilters.includes(product.category || 'sandwich')
      );
    }

    setFilteredProducts(filtered);
  }, [products, searchValue, activeFilters]);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(
          `
          *,
          product_images (
            id,
            image_url,
            alt_text,
            sort_order
          )
        `
        )
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
      category: 'sandwich',
      active: true,
      sort_order: 0,
    });
    setSelectedImage(null);
    setImagePreview(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = async (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description || '',
      sell_price: product.sell_price.toString(),
      production_cost: product.production_cost.toString(),
      category:
        (product.category as 'sandwich' | 'side' | 'dessert' | 'beverage') ||
        'sandwich',
      active: product.active || false,
      sort_order: product.sort_order || 0,
    });

    // Load existing image if any
    try {
      const { data: images } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', product.id)
        .order('sort_order', { ascending: true })
        .limit(1);

      if (images && images.length > 0) {
        setImagePreview(images[0].image_url);
      }
    } catch (error) {
      console.error('Error loading product images:', error);
    }

    setEditingProduct(product);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingProduct(null);
    resetForm();
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = e => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (productId: string): Promise<string | null> => {
    if (!selectedImage) return null;

    try {
      setUploadingImage(true);

      // Upload to Supabase Storage
      const fileExt = selectedImage.name.split('.').pop();
      const fileName = `${productId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, selectedImage);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('product-images').getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    } finally {
      setUploadingImage(false);
    }
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

      let productId: string;

      if (editingProduct) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        productId = editingProduct.id;
      } else {
        // Create new product
        const { data, error } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();

        if (error) throw error;
        productId = data.id;
      }

      // Handle image upload
      if (selectedImage) {
        const imageUrl = await uploadImage(productId);
        if (imageUrl) {
          // Save image record to database
          const { error: imageError } = await supabase
            .from('product_images')
            .upsert({
              product_id: productId,
              image_url: imageUrl,
              alt_text: formData.name,
              sort_order: 0,
            });

          if (imageError) {
            console.error('Error saving image record:', imageError);
          }
        }
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
      // Delete associated images from storage
      const { data: images } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('product_id', productId);

      if (images) {
        for (const image of images) {
          const fileName = image.image_url.split('/').pop();
          if (fileName) {
            await supabase.storage.from('product-images').remove([fileName]);
          }
        }
      }

      // Delete image records
      await supabase
        .from('product_images')
        .delete()
        .eq('product_id', productId);

      // Delete product
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

  // Filter options for the filter bar
  const filterOptions: FilterOption[] = [
    {
      label: 'Sandwich',
      value: 'sandwich',
      active: activeFilters.includes('sandwich'),
    },
    {
      label: 'Side',
      value: 'side',
      active: activeFilters.includes('side'),
    },
    {
      label: 'Dessert',
      value: 'dessert',
      active: activeFilters.includes('dessert'),
    },
    {
      label: 'Beverage',
      value: 'beverage',
      active: activeFilters.includes('beverage'),
    },
  ];

  const handleFilterChange = (filterValue: string) => {
    setActiveFilters(prev =>
      prev.includes(filterValue)
        ? prev.filter(f => f !== filterValue)
        : [...prev, filterValue]
    );
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
    <AdminPageTemplate
      title="Products"
      subtitle="Manage your sandwich menu"
      primaryAction={{
        label: 'Add Product',
        onClick: openCreateModal,
        icon: Plus,
      }}
      showFilterBar={true}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      searchPlaceholder="Search products..."
      filters={filterOptions}
      onFilterChange={handleFilterChange}
    >
      {/* Products Table */}
      <AdminCard>
        <AdminCardContent className="p-0">
          <AdminTable>
            <AdminTableHeader>
              <AdminTableRow>
                <AdminTableHead>Product</AdminTableHead>
                <AdminTableHead>Category</AdminTableHead>
                <AdminTableHead>Status</AdminTableHead>
                <AdminTableHead>Price</AdminTableHead>
                <AdminTableHead>Cost</AdminTableHead>
                <AdminTableHead>Profit</AdminTableHead>
                <AdminTableHead>Margin</AdminTableHead>
                <AdminTableHead className="w-12">
                  <span className="sr-only">Actions</span>
                </AdminTableHead>
              </AdminTableRow>
            </AdminTableHeader>
            <AdminTableBody>
              {filteredProducts.map(product => (
                <AdminTableRow key={product.id}>
                  <AdminTableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {product.product_images &&
                        product.product_images.length > 0 ? (
                          <Image
                            src={product.product_images[0].image_url}
                            alt={
                              product.product_images[0].alt_text || product.name
                            }
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {product.name}
                        </div>
                      </div>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <AdminBadge variant="outline">
                      {product.category}
                    </AdminBadge>
                  </AdminTableCell>
                  <AdminTableCell>
                    <AdminBadge
                      variant={product.active ? 'success' : 'secondary'}
                    >
                      {product.active ? 'Active' : 'Inactive'}
                    </AdminBadge>
                  </AdminTableCell>
                  <AdminTableCell>€{product.sell_price}</AdminTableCell>
                  <AdminTableCell className="text-gray-900">
                    €{product.production_cost}
                  </AdminTableCell>
                  <AdminTableCell className="text-gray-900">
                    €{(product.sell_price - product.production_cost).toFixed(2)}
                  </AdminTableCell>
                  <AdminTableCell className="text-gray-900">
                    {product.sell_price > 0
                      ? `${Math.round(((product.sell_price - product.production_cost) / product.sell_price) * 100)}%`
                      : '0%'}
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
                        <DropdownMenuItem
                          onClick={() => openEditModal(product)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteProduct(product.id)}
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
            {/* Image Upload */}
            <div className="space-y-3">
              <AdminLabel htmlFor="image">Product Image</AdminLabel>
              <div className="mt-2">
                {imagePreview ? (
                  <div className="relative">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      width={200}
                      height={200}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <AdminButton
                      type="button"
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </AdminButton>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Click to upload an image
                    </p>
                    <AdminInput
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <AdminButton
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('image')?.click()}
                    >
                      Choose Image
                    </AdminButton>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <AdminLabel htmlFor="name">Name</AdminLabel>
              <AdminInput
                id="name"
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Product name"
              />
            </div>

            <div className="space-y-3">
              <AdminLabel htmlFor="description">Description</AdminLabel>
              <AdminInput
                id="description"
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Product description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <AdminLabel htmlFor="sell_price">Selling Price (€)</AdminLabel>
                <AdminInput
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

              <div className="space-y-3">
                <AdminLabel htmlFor="production_cost">
                  Production Cost (€)
                </AdminLabel>
                <AdminInput
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

            <div className="space-y-3">
              <AdminLabel htmlFor="category">Category</AdminLabel>
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
              <div className="space-y-3">
                <AdminLabel htmlFor="sort_order">Sort Order</AdminLabel>
                <AdminInput
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
                <AdminLabel htmlFor="active">Active</AdminLabel>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <AdminButton onClick={closeModal} variant="outline">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </AdminButton>
            <AdminButton
              onClick={saveProduct}
              variant="admin-primary"
              disabled={uploadingImage}
            >
              <Save className="w-4 h-4 mr-2" />
              {uploadingImage
                ? 'Uploading...'
                : editingProduct
                  ? 'Update'
                  : 'Create'}
            </AdminButton>
          </div>
        </DialogContent>
      </Dialog>
    </AdminPageTemplate>
  );
}
