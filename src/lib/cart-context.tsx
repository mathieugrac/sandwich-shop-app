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
  // Initialize cart from localStorage if available
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedCart = localStorage.getItem('sandwich-shop-cart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);

          // Handle backward compatibility for cart items without dropId
          const migratedCart = parsedCart.map((item: CartItem) => {
            if (!item.dropId && item.dropProductId) {
              // For backward compatibility, try to get dropId from currentDrop in localStorage
              try {
                const currentDrop = localStorage.getItem('currentDrop');
                if (currentDrop) {
                  const dropData = JSON.parse(currentDrop);
                  console.log(
                    '🔄 Migrating cart item with dropId:',
                    dropData.id
                  );
                  return { ...item, dropId: dropData.id };
                }
              } catch (error) {
                console.error('Error migrating cart item:', error);
              }
            }
            return item;
          });

          console.log('📦 Cart loaded from localStorage:', migratedCart);
          return migratedCart;
        }
        return [];
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        return [];
      }
    }
    return [];
  });

  const [isDropValid, setIsDropValid] = useState(true);
  const [dropValidationError, setDropValidationError] = useState<
    string | undefined
  >();

  // Helper function to save cart to localStorage
  const saveCartToStorage = useCallback((cartItems: CartItem[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('sandwich-shop-cart', JSON.stringify(cartItems));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    }
  }, []);

  const addToCart = (newItem: Omit<CartItem, 'quantity'>) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === newItem.id);
      let newItems;
      if (existingItem) {
        newItems = prevItems.map(item =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newItems = [...prevItems, { ...newItem, quantity: 1 }];
      }
      // Save to localStorage
      saveCartToStorage(newItems);
      return newItems;
    });
  };

  const removeFromCart = (id: string) => {
    setItems(prevItems => {
      const newItems = prevItems.filter(item => item.id !== id);
      saveCartToStorage(newItems);
      return newItems;
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prevItems => {
        const newItems = prevItems.filter(item => item.id !== id);
        saveCartToStorage(newItems);
        return newItems;
      });
      return;
    }
    setItems(prevItems => {
      const newItems = prevItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      );
      saveCartToStorage(newItems);
      return newItems;
    });
  };

  const clearCart = () => {
    setItems([]);
    setIsDropValid(true);
    setDropValidationError(undefined);
    // Clear from localStorage
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
        console.log('🔍 Validating drop:', dropId);
        const response = await fetch(`/api/drops/${dropId}/orderable`);
        if (!response.ok) {
          throw new Error(
            `Failed to validate drop: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        console.log('✅ Drop validation response:', data);

        if (data.orderable) {
          setIsDropValid(true);
          setDropValidationError(undefined);
        } else {
          setIsDropValid(false);
          setDropValidationError(data.reason || 'Drop is not orderable');
        }

        return data;
      } catch (error) {
        console.error('❌ Error validating drop:', error);
        setIsDropValid(false);
        setDropValidationError('Failed to validate drop status');
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
    if (items.length > 0) {
      // Check if any items are from expired drops
      const checkExpiredItems = async () => {
        try {
          // Get unique drop IDs from cart items (filter out undefined dropIds)
          const dropIds = [
            ...new Set(items.map(item => item.dropId).filter(Boolean)),
          ];

          if (dropIds.length === 0) {
            console.log('No valid drop IDs found in cart, skipping validation');
            return;
          }

          for (const dropId of dropIds) {
            const validation = await validateDrop(dropId);
            if (!validation.orderable) {
              console.log('Drop expired, clearing cart');
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
  }, [items, validateDrop]);

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
