import { z } from 'zod'

export const orderSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().optional(),
  pickupTime: z.string(),
  pickupDate: z.string(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().min(1),
    unitPrice: z.number().positive()
  })).min(1, "At least one item required"),
  specialInstructions: z.string().optional()
})

export type OrderFormData = z.infer<typeof orderSchema> 