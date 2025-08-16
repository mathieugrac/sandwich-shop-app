'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface CartItem {
  id: string; // This will be the drop_product.id
  name: string;
  price: number;
  quantity: number;
  availableStock: number; // Available stock for this item
  dropProductId: string; // Reference to drop_product.id
  productId: string; // Reference to the original product.id
  imageUrl?: string; // Product image URL for display
}

interface DropValidation {
  orderable: boolean;
  reason?: string;
  timeUntilDeadline?: string;
  dropStatus?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  validateDrop: (dropId: string) => Promise<DropValidation>;
  isDropValid: boolean;
  dropValidationError?: string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isDropValid, setIsDropValid] = useState(true);
  const [dropValidationError, setDropValidationError] = useState<string | undefined>();

  const addToCart = (newItem: Omit<CartItem, 'quantity'>) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === newItem.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevItems, { ...newItem, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prevItems => prevItems.filter(item => item.id !== id));
      return;
    }
    setItems(prevItems =>
      prevItems.map(item => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
    setIsDropValid(true);
    setDropValidationError(undefined);
  };

  const validateDrop = useCallback(async (dropId: string): Promise<DropValidation> => {
    try {
      const response = await fetch(`/api/drops/${dropId}/orderable`);
      if (!response.ok) {
        throw new Error('Failed to validate drop');
      }
      
      const data = await response.json();
      
      if (data.orderable) {
        setIsDropValid(true);
        setDropValidationError(undefined);
      } else {
        setIsDropValid(false);
        setDropValidationError(data.reason || 'Drop is not orderable');
      }
      
      return data;
    } catch (error) {
      console.error('Error validating drop:', error);
      setIsDropValid(false);
      setDropValidationError('Failed to validate drop status');
      return {
        orderable: false,
        reason: 'Failed to validate drop status'
      };
    }
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        validateDrop,
        isDropValid,
        dropValidationError,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
