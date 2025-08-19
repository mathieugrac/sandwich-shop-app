'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Product } from '@/types/database';

interface InventoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDrop: {
    id: string;
    location_name?: string;
  } | null;
  products: Product[];
  inventory: { [key: string]: number };
  onInventoryChange: (productId: string, quantity: number) => void;
  onSaveDropMenu: () => void;
}

export default function InventoryModal({
  open,
  onOpenChange,
  selectedDrop,
  products,
  inventory,
  onInventoryChange,
  onSaveDropMenu,
}: InventoryModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Inventory Management</DialogTitle>
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
                      onInventoryChange(product.id, newQty);
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
                      onInventoryChange(product.id, newQty);
                    }}
                    className="w-20 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newQty = currentQuantity + 1;
                      onInventoryChange(product.id, newQty);
                    }}
                  >
                    +
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Summary</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Object.values(inventory).filter(qty => qty > 0).length}
              </div>
              <div className="text-sm text-gray-600">Products in Stock</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Object.values(inventory).reduce((sum, qty) => sum + qty, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Stock</div>
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
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Cancel
          </Button>
          <Button
            onClick={onSaveDropMenu}
            className="bg-black hover:bg-gray-800"
            disabled={Object.values(inventory).every(qty => qty === 0)}
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
