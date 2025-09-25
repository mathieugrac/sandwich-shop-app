'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AdminButton } from '@/components/admin';
import { Archive, Trash2 } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  customer_email: string;
  total_amount: number;
  client_id?: string;
}

interface DeleteDropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: Order[];
  onArchive: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
  isArchiving?: boolean;
}

export function DeleteDropModal({
  open,
  onOpenChange,
  orders,
  onArchive,
  onDelete,
  isDeleting = false,
  isArchiving = false,
}: DeleteDropModalProps) {
  const hasOrders = orders && orders.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {hasOrders
              ? `This drop has ${orders.length} existing order${orders.length > 1 ? 's' : ''}`
              : 'Delete Drop'}
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this drop?
          </DialogDescription>
        </DialogHeader>

        {hasOrders && (
          <div className="py-4">
            <div className="max-h-60 overflow-y-auto">
              <ul className="space-y-2">
                {orders.map(order => (
                  <li
                    key={order.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-sm">
                        {order.order_number}
                      </span>
                      <span className="text-sm text-gray-600">
                        {order.customer_email}
                      </span>
                    </div>
                    <span className="font-semibold text-sm">
                      ${order.total_amount.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-2">
          {hasOrders && (
            <AdminButton
              variant="outline"
              onClick={onArchive}
              disabled={isArchiving || isDeleting}
              className="flex items-center gap-2"
            >
              <Archive className="w-4 h-4" />
              {isArchiving ? 'Archiving...' : 'Archive this drop'}
            </AdminButton>
          )}

          <AdminButton
            variant="destructive"
            onClick={onDelete}
            disabled={isDeleting || isArchiving}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? 'Deleting...' : 'Delete Permanently'}
          </AdminButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
