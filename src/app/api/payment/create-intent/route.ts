import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { supabase } from '@/lib/supabase/server';
import {
  CartItem,
  CustomerInfo,
  calculateCartTotal,
  formatAmountForStripe,
  validateCustomerInfo,
  validateCartItems,
} from '@/lib/payments';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      items,
      customerInfo,
    }: { items: CartItem[]; customerInfo: CustomerInfo } = body;

    // Validate customer info and cart items
    const customerErrors = validateCustomerInfo(customerInfo);
    const cartErrors = validateCartItems(items);
    const allErrors = [...customerErrors, ...cartErrors];

    if (allErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: allErrors },
        { status: 400 }
      );
    }

    // Calculate total amount
    const totalAmount = calculateCartTotal(items);

    // Get active drop to validate items are available
    const { data: activeDrop, error: dropError } = await supabase
      .from('drops')
      .select('id')
      .eq('status', 'active')
      .limit(1)
      .single();

    if (dropError || !activeDrop) {
      return NextResponse.json(
        { error: 'No active drop available for ordering' },
        { status: 400 }
      );
    }

    // Reserve inventory immediately when creating payment intent
    const orderProducts = items.map(item => ({
      drop_product_id: item.id,
      order_quantity: item.quantity,
    }));

    // Reserve inventory for all items at once
    const { error: reservationError } = await supabase.rpc(
      'reserve_multiple_drop_products',
      { p_order_items: orderProducts }
    );

    if (reservationError) {
      console.error('❌ Inventory reservation error during payment intent:', {
        error: reservationError,
        items: items,
        orderProducts: orderProducts,
      });
      return NextResponse.json(
        { error: 'Insufficient inventory available' },
        { status: 400 }
      );
    }

    // Create payment intent with order metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount: formatAmountForStripe(totalAmount), // Stripe uses cents
      currency: 'eur',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone || '',
        pickupTime: customerInfo.pickupTime,
        pickupDate: customerInfo.pickupDate,
        specialInstructions: customerInfo.specialInstructions || '',
        totalAmount: totalAmount.toString(),
        cartItems: JSON.stringify(items),
        dropId: activeDrop.id,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('❌ Payment intent creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
