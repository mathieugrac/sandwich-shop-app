'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, Clock, X } from 'lucide-react';

interface ActiveOrder {
  orderNumber: string;
  pickupTime: string;
  pickupDate: string;
  items: Array<{ name: string; quantity: number }>;
  totalAmount: number;
}

export function OrderBanner() {
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  const [timeUntilPickup, setTimeUntilPickup] = useState<string>('');

  useEffect(() => {
    // Load active order from localStorage
    const savedOrder = localStorage.getItem('activeOrder');
    console.log('OrderBanner: Checking localStorage:', savedOrder);

    if (savedOrder) {
      try {
        const order = JSON.parse(savedOrder);
        console.log('OrderBanner: Parsed order:', order);
        setActiveOrder(order);
      } catch (error) {
        console.error('Error parsing active order:', error);
        localStorage.removeItem('activeOrder');
      }
    } else {
      console.log('OrderBanner: No active order found');
    }
  }, []);

  // Check if banner should be hidden for this session
  useEffect(() => {
    const hideBanner = sessionStorage.getItem('hideOrderBanner');
    if (hideBanner) {
      const hideUntil = parseInt(hideBanner);
      const now = Date.now();

      console.log(
        'OrderBanner: Checking hide status - now:',
        new Date(now).toLocaleString(),
        'hide until:',
        new Date(hideUntil).toLocaleString()
      );

      if (now < hideUntil) {
        // Banner is still hidden
        console.log(
          'OrderBanner: Banner is hidden until',
          new Date(hideUntil).toLocaleString()
        );
        setActiveOrder(null);
      } else {
        // Hide period has expired, clear the flag
        console.log('OrderBanner: Hide period expired, showing banner again');
        sessionStorage.removeItem('hideOrderBanner');
      }
    }
  }, []);

  useEffect(() => {
    if (!activeOrder) return;

    const updateTimeUntilPickup = () => {
      const now = new Date();
      // Create pickup datetime in local timezone
      const [hours, minutes] = activeOrder.pickupTime.split(':');
      const pickupDate = new Date(activeOrder.pickupDate);
      const pickupDateTime = new Date(
        pickupDate.getFullYear(),
        pickupDate.getMonth(),
        pickupDate.getDate(),
        parseInt(hours),
        parseInt(minutes),
        0,
        0
      );

      const timeDiff = pickupDateTime.getTime() - now.getTime();

      console.log(
        'OrderBanner: Time check - now:',
        now.toLocaleString(),
        'pickup:',
        pickupDateTime.toLocaleString(),
        'diff:',
        timeDiff
      );

      // Check if it's past midnight of the order date (end of day)
      const endOfDay = new Date(activeOrder.pickupDate);
      endOfDay.setHours(23, 59, 59, 999); // End of the order date

      if (now.getTime() > endOfDay.getTime()) {
        // Past midnight of the order date, remove the banner
        console.log('OrderBanner: End of day passed, removing banner');
        localStorage.removeItem('activeOrder');
        setActiveOrder(null);
        return;
      }

      const hoursRemaining = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutesRemaining = Math.floor(
        (timeDiff % (1000 * 60 * 60)) / (1000 * 60)
      );

      if (hoursRemaining > 0) {
        setTimeUntilPickup(
          `${hoursRemaining}h ${minutesRemaining}m until pickup`
        );
      } else {
        setTimeUntilPickup(`${minutesRemaining}m until pickup`);
      }
    };

    // Update immediately
    updateTimeUntilPickup();

    // Update every minute
    const interval = setInterval(updateTimeUntilPickup, 60000);

    return () => clearInterval(interval);
  }, [activeOrder]);

  const getBannerMessage = () => {
    if (!activeOrder) return '';

    const now = new Date();
    // Create pickup datetime in local timezone
    const [hours, minutes] = activeOrder.pickupTime.split(':');
    const pickupDate = new Date(activeOrder.pickupDate);
    const pickupDateTime = new Date(
      pickupDate.getFullYear(),
      pickupDate.getMonth(),
      pickupDate.getDate(),
      parseInt(hours),
      parseInt(minutes),
      0,
      0
    );

    const timeDiff = pickupDateTime.getTime() - now.getTime();
    const minutesUntilPickup = Math.floor(timeDiff / (1000 * 60));

    if (minutesUntilPickup <= 0) {
      return 'Your order is ready for pickup!';
    } else if (minutesUntilPickup <= 15) {
      return 'Your order is being prepared!';
    } else {
      return 'Order confirmed!';
    }
  };

  const handleContact = () => {
    // Open phone dialer or email
    window.open('tel:+1234567890', '_blank');
  };

  if (!activeOrder) {
    console.log('OrderBanner: No active order, not rendering');
    return null;
  }

  console.log(
    'OrderBanner: Rendering banner with order:',
    activeOrder.orderNumber
  );

  const handleClose = () => {
    // Hide banner temporarily but keep data in localStorage
    setActiveOrder(null);
    // Set a flag to hide banner for 5 minutes
    const hideUntil = Date.now() + 5 * 60 * 1000; // 5 minutes from now
    sessionStorage.setItem('hideOrderBanner', hideUntil.toString());
    console.log(
      'OrderBanner: Banner closed, hidden until',
      new Date(hideUntil).toLocaleString()
    );
  };

  return (
    <div className="sticky top-0 z-40 bg-black text-white px-4 py-2 text-sm">
      <div className="max-w-[480px] mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Clock className="h-4 w-4" />
          <div>
            <p className="font-medium">{getBannerMessage()}</p>
            <p className="text-xs text-gray-300">
              Pickup at {activeOrder.pickupTime} • {timeUntilPickup}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleContact}
            className="text-white hover:text-gray-300 p-1"
          >
            <Phone className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-white hover:text-gray-300 p-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
