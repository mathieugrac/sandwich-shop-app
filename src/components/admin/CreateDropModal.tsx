'use client';

import { useState } from 'react';
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
import { Loader2, Plus } from 'lucide-react';
import type { Database } from '@/types/database';

type Location = Database['public']['Tables']['locations']['Row'];

interface CreateDropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locations: Location[];
  onCreateDrop: () => void;
  newDropDate: string;
  newDropLocation: string;
  newDropStatus: 'upcoming' | 'active' | 'completed' | 'cancelled';
  onNewDropDateChange: (date: string) => void;
  onNewDropLocationChange: (locationId: string) => void;
  onNewDropStatusChange: (
    status: 'upcoming' | 'active' | 'completed' | 'cancelled'
  ) => void;
  creating: boolean;
}

export default function CreateDropModal({
  open,
  onOpenChange,
  locations,
  onCreateDrop,
  newDropDate,
  newDropLocation,
  newDropStatus,
  onNewDropDateChange,
  onNewDropLocationChange,
  onNewDropStatusChange,
  creating,
}: CreateDropModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              onChange={e => onNewDropDateChange(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div>
            <Label htmlFor="drop-location">Location</Label>
            <Select
              value={newDropLocation}
              onValueChange={onNewDropLocationChange}
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
                onNewDropStatusChange(
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
          <Button
            onClick={onCreateDrop}
            disabled={creating}
            className="bg-black hover:bg-gray-800"
          >
            {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Drop
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
