/**
 * Order Code Generation and Formatting Utilities
 * 
 * Handles the generation of human-friendly order codes in the format:
 * #IH01-001 (Location Code + Drop Number + Sequence Number)
 */

import { supabase as defaultSupabase } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface OrderCodeComponents {
  locationCode: string
  dropNumber: number
  sequenceNumber: number
}

/**
 * Parse an order code into its components
 * @param orderCode - The order code (with or without #)
 * @returns Parsed components or null if invalid
 */
export function parseOrderCode(orderCode: string): OrderCodeComponents | null {
  // Remove # if present
  const cleanCode = orderCode.replace(/^#/, '')
  
  // Match pattern: LOCATION_CODE + DROP_NUMBER + "-" + SEQUENCE
  // Example: IH01-001
  const match = cleanCode.match(/^([A-Z]{1,4})(\d{2})-(\d{3})$/)
  
  if (!match) {
    return null
  }
  
  return {
    locationCode: match[1],
    dropNumber: parseInt(match[2], 10),
    sequenceNumber: parseInt(match[3], 10)
  }
}

/**
 * Format order code components into display string
 * @param components - The order code components
 * @param includeHash - Whether to include # prefix (default: true)
 * @returns Formatted order code
 */
export function formatOrderCode(components: OrderCodeComponents, includeHash = true): string {
  const code = `${components.locationCode}${components.dropNumber.toString().padStart(2, '0')}-${components.sequenceNumber.toString().padStart(3, '0')}`
  return includeHash ? `#${code}` : code
}

/**
 * Generate order code from drop ID and sequence number using database function
 * @param dropId - The drop UUID
 * @param sequenceNumber - The sequence number within the drop
 * @param supabaseClient - Optional Supabase client (defaults to client-side)
 * @returns Promise<string> - The generated order code (without #)
 */
export async function generateOrderCode(
  dropId: string, 
  sequenceNumber: number, 
  supabaseClient?: SupabaseClient
): Promise<string> {
  const supabase = supabaseClient || defaultSupabase
  
  const { data, error } = await supabase.rpc('generate_order_code', {
    p_drop_id: dropId,
    p_sequence_number: sequenceNumber
  })
  
  if (error) {
    throw new Error(`Failed to generate order code: ${error.message}`)
  }
  
  return data
}

/**
 * Allocate next sequence number for a drop (atomic operation)
 * @param dropId - The drop UUID
 * @param supabaseClient - Optional Supabase client (defaults to client-side)
 * @returns Promise<number> - The allocated sequence number
 */
export async function allocateOrderSequence(
  dropId: string, 
  supabaseClient?: SupabaseClient
): Promise<number> {
  const supabase = supabaseClient || defaultSupabase
  
  const { data, error } = await supabase.rpc('allocate_order_sequence', {
    p_drop_id: dropId
  })
  
  if (error) {
    throw new Error(`Failed to allocate order sequence: ${error.message}`)
  }
  
  return data
}

/**
 * Get next drop number for a location
 * @param locationId - The location UUID
 * @param supabaseClient - Optional Supabase client (defaults to client-side)
 * @returns Promise<number> - The next drop number for this location
 */
export async function getNextDropNumber(
  locationId: string, 
  supabaseClient?: SupabaseClient
): Promise<number> {
  const supabase = supabaseClient || defaultSupabase
  
  const { data, error } = await supabase.rpc('get_next_drop_number', {
    p_location_id: locationId
  })
  
  if (error) {
    throw new Error(`Failed to get next drop number: ${error.message}`)
  }
  
  return data
}

/**
 * Validate order code format
 * @param orderCode - The order code to validate
 * @returns boolean - Whether the code is valid
 */
export function isValidOrderCode(orderCode: string): boolean {
  return parseOrderCode(orderCode) !== null
}

/**
 * Create a complete order with generated code
 * This is the main function to use when creating orders
 * @param dropId - The drop UUID
 * @param orderData - The order data (without public_code and sequence_number)
 * @param supabaseClient - Optional Supabase client (defaults to client-side)
 * @returns Promise<{order: any, publicCode: string}> - The created order and its public code
 */
export async function createOrderWithCode(
  dropId: string, 
  orderData: Omit<any, 'id' | 'public_code' | 'sequence_number' | 'created_at' | 'updated_at'>,
  supabaseClient?: SupabaseClient
): Promise<{order: any, publicCode: string}> {
  const supabase = supabaseClient || defaultSupabase
  
  // Start a transaction
  const { data: sequenceNumber, error: sequenceError } = await supabase.rpc('allocate_order_sequence', {
    p_drop_id: dropId
  })
  
  if (sequenceError) {
    throw new Error(`Failed to allocate sequence: ${sequenceError.message}`)
  }
  
  // Generate the public code
  const { data: publicCode, error: codeError } = await supabase.rpc('generate_order_code', {
    p_drop_id: dropId,
    p_sequence_number: sequenceNumber
  })
  
  if (codeError) {
    throw new Error(`Failed to generate code: ${codeError.message}`)
  }
  
  // Create the order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      ...orderData,
      drop_id: dropId,
      sequence_number: sequenceNumber,
      public_code: publicCode
    })
    .select()
    .single()
  
  if (orderError) {
    throw new Error(`Failed to create order: ${orderError.message}`)
  }
  
  return { order, publicCode }
}

/**
 * Format order code for display in UI
 * @param orderCode - Raw order code from database
 * @returns Formatted code with # prefix
 */
export function displayOrderCode(orderCode: string): string {
  // If it already has #, return as is
  if (orderCode.startsWith('#')) {
    return orderCode
  }
  
  // Add # prefix
  return `#${orderCode}`
}

/**
 * Create test order code (for development/testing)
 * @param sequenceNumber - The sequence number
 * @returns Test order code
 */
export function createTestOrderCode(sequenceNumber: number): string {
  return `TST-${sequenceNumber.toString().padStart(3, '0')}`
}
