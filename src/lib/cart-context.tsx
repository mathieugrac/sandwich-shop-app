'use client';

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from 'react';

export interface CartItem {
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
  comment: string;
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  setComment: (comment: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isInitialized: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartData {
  items: CartItem[];
  comment: string;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [comment, setComment] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize cart after component mounts to avoid SSR issues
  React.useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      try {
        const savedCart = localStorage.getItem('sandwich-shop-cart');
        if (savedCart) {
          const parsedCart: CartData = JSON.parse(savedCart);
          // Handle both old format (array) and new format (object)
          if (Array.isArray(parsedCart)) {
            // Old format: just items array
            setItems(parsedCart);
            setComment('');
          } else {
            // New format: object with items and comment
            setItems(parsedCart.items || []);
            setComment(parsedCart.comment || '');
          }
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        setIsInitialized(true);
      }
    }
  }, [isInitialized]);

  // Helper function to save cart to localStorage
  const saveCartToStorage = useCallback(
    (cartItems: CartItem[], cartComment: string) => {
      if (typeof window !== 'undefined') {
        try {
          const cartData: CartData = {
            items: cartItems,
            comment: cartComment,
          };
          localStorage.setItem('sandwich-shop-cart', JSON.stringify(cartData));
        } catch (error) {
          console.error('Error saving cart to localStorage:', error);
        }
      }
    },
    []
  );

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

      saveCartToStorage(newItems, comment);
      return newItems;
    });
  };

  const removeFromCart = (id: string) => {
    setItems(prev => {
      const newItems = prev.filter(item => item.id !== id);

      // If cart becomes empty, clear everything
      if (newItems.length === 0) {
        clearCart();
        return [];
      } else {
        saveCartToStorage(newItems, comment);
        return newItems;
      }
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => {
        const newItems = prev.filter(item => item.id !== id);

        // If cart becomes empty, clear everything
        if (newItems.length === 0) {
          clearCart();
          return [];
        } else {
          saveCartToStorage(newItems, comment);
          return newItems;
        }
      });
      return;
    }

    setItems(prev => {
      const newItems = prev.map(item =>
        item.id === id ? { ...item, quantity } : item
      );
      saveCartToStorage(newItems, comment);
      return newItems;
    });
  };

  const handleSetComment = (newComment: string) => {
    setComment(newComment);
    saveCartToStorage(items, newComment);
  };

  const clearCart = () => {
    setItems([]);
    setComment('');
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
    comment,
    addToCart,
    removeFromCart,
    updateQuantity,
    setComment: handleSetComment,
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
