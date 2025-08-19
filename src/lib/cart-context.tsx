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
  dropId: string; // Reference to the actual drop.id (for validation)
  productId: string; // Reference to the original product.id
  imageUrl?: string; // Product image URL for display
}

interface DropValidation {
  orderable: boolean;
  reason?: string;
  timeUntilDeadline?: string;
  dropStatus?: string;
}

// Unified state interface
interface CartState {
  items: CartItem[];
  isInitialized: boolean;
  dropValidation: {
    isValid: boolean;
    error?: string;
    lastChecked?: Date;
  };
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
  isInitialized: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  // Single unified state
  const [cartState, setCartState] = useState<CartState>({
    items: [],
    isInitialized: false,
    dropValidation: {
      isValid: true,
      error: undefined,
      lastChecked: undefined,
    },
  });

  // Initialize cart after component mounts to avoid SSR issues
  React.useEffect(() => {
    if (typeof window !== 'undefined' && !cartState.isInitialized) {
      try {
        const savedCart = localStorage.getItem('sandwich-shop-cart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);

          // Handle backward compatibility for cart items without dropId
          const migratedCart = parsedCart.map((item: CartItem) => {
            if (!item.dropId && item.dropProductId) {
              try {
                const currentDrop = localStorage.getItem('currentDrop');
                if (currentDrop) {
                  const dropData = JSON.parse(currentDrop);
                  return { ...item, dropId: dropData.id };
                }
              } catch (error) {
                console.error('Error migrating cart item:', error);
              }
            }
            return item;
          });

          setCartState(prev => ({
            ...prev,
            items: migratedCart,
            isInitialized: true,
          }));
        } else {
          setCartState(prev => ({ ...prev, isInitialized: true }));
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        setCartState(prev => ({ ...prev, isInitialized: true }));
      }
    }
  }, [cartState.isInitialized]);

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
    setCartState(prev => {
      const existingItem = prev.items.find(item => item.id === newItem.id);
      let newItems;

      if (existingItem) {
        newItems = prev.items.map(item =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newItems = [...prev.items, { ...newItem, quantity: 1 }];
      }

      saveCartToStorage(newItems);
      return { ...prev, items: newItems };
    });
  };

  const removeFromCart = (id: string) => {
    setCartState(prev => {
      const newItems = prev.items.filter(item => item.id !== id);
      saveCartToStorage(newItems);
      return { ...prev, items: newItems };
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCartState(prev => {
        const newItems = prev.items.filter(item => item.id !== id);
        saveCartToStorage(newItems);
        return { ...prev, items: newItems };
      });
      return;
    }

    setCartState(prev => {
      const newItems = prev.items.map(item =>
        item.id === id ? { ...item, quantity } : item
      );
      saveCartToStorage(newItems);
      return { ...prev, items: newItems };
    });
  };

  const clearCart = () => {
    setCartState({
      items: [],
      isInitialized: true,
      dropValidation: {
        isValid: true,
        error: undefined,
        lastChecked: undefined,
      },
    });

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('sandwich-shop-cart');
      } catch (error) {
        console.error('Error clearing cart from localStorage:', error);
      }
    }
  };

  const validateDrop = useCallback(
    async (dropId: string): Promise<DropValidation> => {
      try {
        const response = await fetch(`/api/drops/${dropId}/orderable`);
        if (!response.ok) {
          throw new Error(
            `Failed to validate drop: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();

        setCartState(prev => ({
          ...prev,
          dropValidation: {
            isValid: data.orderable,
            error: data.orderable
              ? undefined
              : data.reason || 'Drop is not orderable',
            lastChecked: new Date(),
          },
        }));

        return data;
      } catch (error) {
        console.error('Error validating drop:', error);
        setCartState(prev => ({
          ...prev,
          dropValidation: {
            isValid: false,
            error: 'Failed to validate drop status',
            lastChecked: new Date(),
          },
        }));

        return {
          orderable: false,
          reason: 'Failed to validate drop status',
        };
      }
    },
    []
  );

  // Clean up expired cart items on mount
  React.useEffect(() => {
    if (cartState.items.length > 0) {
      const checkExpiredItems = async () => {
        try {
          const dropIds = [
            ...new Set(
              cartState.items.map(item => item.dropId).filter(Boolean)
            ),
          ];

          if (dropIds.length === 0) return;

          for (const dropId of dropIds) {
            const validation = await validateDrop(dropId);
            if (!validation.orderable) {
              clearCart();
              break;
            }
          }
        } catch (error) {
          console.error('Error checking expired items:', error);
        }
      };

      checkExpiredItems();
    }
  }, [cartState.items, validateDrop]);

  const totalItems = cartState.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const totalPrice = cartState.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const contextValue = {
    items: cartState.items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
    validateDrop,
    isDropValid: cartState.dropValidation.isValid,
    dropValidationError: cartState.dropValidation.error,
    isInitialized: cartState.isInitialized,
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
