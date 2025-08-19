import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Check if a drop is within its pickup deadline (including grace period)
 * @param pickupDeadline - The pickup deadline timestamp
 * @param gracePeriodMinutes - Grace period in minutes (default: 15)
 * @returns Object with validation results
 */
export function validateDropDeadline(
  pickupDeadline: string | null,
  gracePeriodMinutes: number = 15
): {
  isValid: boolean;
  isGracePeriod: boolean;
  timeRemaining: string | null;
  isExpired: boolean;
} {
  if (!pickupDeadline) {
    return {
      isValid: false,
      isGracePeriod: false,
      timeRemaining: null,
      isExpired: true,
    };
  }

  const deadline = new Date(pickupDeadline);
  const now = new Date();
  const graceDeadline = new Date(deadline.getTime() + (gracePeriodMinutes * 60 * 1000));
  
  const isExpired = now > graceDeadline;
  const isGracePeriod = now > deadline && now <= graceDeadline;
  const isValid = now <= graceDeadline;
  
  let timeRemaining: string | null = null;
  if (isValid) {
    const targetDeadline = isGracePeriod ? graceDeadline : deadline;
    const diffMs = targetDeadline.getTime() - now.getTime();
    
    if (diffMs > 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (diffHours > 0) {
        timeRemaining = `${diffHours}h ${diffMinutes}m`;
      } else {
        timeRemaining = `${diffMinutes}m`;
      }
    }
  }

  return {
    isValid,
    isGracePeriod,
    timeRemaining,
    isExpired,
  };
}

/**
 * Format deadline for display
 * @param deadline - The deadline timestamp
 * @returns Formatted deadline string
 */
export function formatDeadline(deadline: string | null): string {
  if (!deadline) return 'No deadline set';
  
  const date = new Date(deadline);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
