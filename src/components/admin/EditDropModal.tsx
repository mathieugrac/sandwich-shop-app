'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import type { Database } from '@/types/database';

type Location = Database['public']['Tables']['locations']['Row'];

interface EditDropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locations: Location[];
  onSaveEdit: () => void;
  editDropDate: string;
  editDropLocation: string;
  editDropStatus: 'upcoming' | 'active' | 'completed' | 'cancelled';
  onEditDropDateChange: (date: string) => void;
  onEditDropLocationChange: (locationId: string) => void;
  onEditDropStatusChange: (
    status: 'upcoming' | 'active' | 'completed' | 'cancelled'
  ) => void;
}

export default function EditDropModal({
  open,
  onOpenChange,
  locations,
  onSaveEdit,
  editDropDate,
  editDropLocation,
  editDropStatus,
  onEditDropDateChange,
  onEditDropLocationChange,
  onEditDropStatusChange,
}: EditDropModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Drop</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="edit-drop-date">Drop Date</Label>
            <Input
              id="edit-drop-date"
              type="date"
              value={editDropDate}
              onChange={e => onEditDropDateChange(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="edit-drop-location">Location</Label>
            <Select
              value={editDropLocation}
              onValueChange={onEditDropLocationChange}
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
          <div className="space-y-3">
            <Label htmlFor="edit-drop-status">Status</Label>
            <Select
              value={editDropStatus}
              onValueChange={(value: string) =>
                onEditDropStatusChange(
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
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Cancel
          </Button>
          <Button onClick={onSaveEdit} className="bg-black hover:bg-gray-800">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
