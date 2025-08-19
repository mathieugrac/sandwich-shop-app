'use client';

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from 'react';

interface CartItem {
  id: string; // This will be the drop_product.id
  name: string;
  price: number;
  quantity: number;
  availableStock: number; // Available stock for this item
  dropProductId: string; // Reference to drop_product.id
  dropId: string; // Reference to the actual drop.id
  productId: string; // Reference to the original product.id
  imageUrl?: string; // Product image URL for display
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isInitialized: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize cart after component mounts to avoid SSR issues
  React.useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      try {
        const savedCart = localStorage.getItem('sandwich-shop-cart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          setItems(parsedCart);
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        setIsInitialized(true);
      }
    }
  }, [isInitialized]);

  // Helper function to save cart to localStorage
  const saveCartToStorage = useCallback((cartItems: CartItem[]) => {
    if (typeof window !== 'undefined' && cartItems) {
      try {
        localStorage.setItem('sandwich-shop-cart', JSON.stringify(cartItems));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    }
  }, []);

  const addToCart = (newItem: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existingItem = prev.find(item => item.id === newItem.id);
      let newItems;

      if (existingItem) {
        newItems = prev.map(item =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newItems = [...prev, { ...newItem, quantity: 1 }];
      }

      saveCartToStorage(newItems);
      return newItems;
    });
  };

  const removeFromCart = (id: string) => {
    setItems(prev => {
      const newItems = prev.filter(item => item.id !== id);
      saveCartToStorage(newItems);
      return newItems;
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => {
        const newItems = prev.filter(item => item.id !== id);
        saveCartToStorage(newItems);
        return newItems;
      });
      return;
    }

    setItems(prev => {
      const newItems = prev.map(item =>
        item.id === id ? { ...item, quantity } : item
      );
      saveCartToStorage(newItems);
      return newItems;
    });
  };

  const clearCart = () => {
    setItems([]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('sandwich-shop-cart');
      } catch (error) {
        console.error('Error clearing cart from localStorage:', error);
      }
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const contextValue = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
    isInitialized,
  };

  return (
    <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
