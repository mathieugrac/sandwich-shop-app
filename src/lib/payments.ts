/**
 * Payment utility functions for Stripe integration
 */

export interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface CustomerInfo {
  name: string;
  email: string;
  pickupTime: string;
  pickupDate: string;
  specialInstructions?: string;
}

/**
 * Calculate total amount from cart items
 */
export function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

/**
 * Format amount for Stripe (convert to cents)
 */
export function formatAmountForStripe(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Format amount for display (convert from cents)
 */
export function formatAmountFromStripe(amountInCents: number): number {
  return amountInCents / 100;
}

/**
 * Validate customer information
 */
export function validateCustomerInfo(customerInfo: CustomerInfo): string[] {
  const errors: string[] = [];

  if (!customerInfo.name?.trim()) {
    errors.push('Customer name is required');
  }

  if (!customerInfo.email?.trim()) {
    errors.push('Customer email is required');
  } else if (!isValidEmail(customerInfo.email)) {
    errors.push('Customer email is invalid');
  }

  if (!customerInfo.pickupTime) {
    errors.push('Pickup time is required');
  }

  if (!customerInfo.pickupDate) {
    errors.push('Pickup date is required');
  }

  return errors;
}

/**
 * Validate cart items
 */
export function validateCartItems(items: CartItem[]): string[] {
  const errors: string[] = [];

  if (!items || items.length === 0) {
    errors.push('Cart cannot be empty');
    return errors;
  }

  items.forEach((item, index) => {
    if (!item.id) {
      errors.push(`Item ${index + 1}: ID is required`);
    }
    if (!item.name?.trim()) {
      errors.push(`Item ${index + 1}: Name is required`);
    }
    if (!item.quantity || item.quantity <= 0) {
      errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
    }
    if (!item.price || item.price <= 0) {
      errors.push(`Item ${index + 1}: Price must be greater than 0`);
    }
  });

  return errors;
}

/**
 * Simple email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
