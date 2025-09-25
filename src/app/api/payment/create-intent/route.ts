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
      dropId,
    }: { items: CartItem[]; customerInfo: CustomerInfo; dropId?: string } = body;

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

    // Get the specific drop or fall back to any active drop
    let targetDrop;
    if (dropId) {
      // Use specific drop ID if provided
      const { data: specificDrop, error: specificDropError } = await supabase
        .from('drops')
        .select('id, status')
        .eq('id', dropId)
        .single();

      if (specificDropError || !specificDrop) {
        return NextResponse.json(
          { error: 'Selected drop not found' },
          { status: 400 }
        );
      }

      if (specificDrop.status !== 'active') {
        return NextResponse.json(
          { error: 'Selected drop is no longer active for ordering' },
          { status: 400 }
        );
      }

      targetDrop = specificDrop;
    } else {
      // Fall back to any active drop (legacy behavior)
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

      targetDrop = activeDrop;
    }

    // Check availability without reserving
    const orderProducts = items.map(item => ({
      drop_product_id: item.id,
      order_quantity: item.quantity,
    }));

    // Check if all items are available (new function)
    const { data: availabilityCheck, error: availabilityError } =
      await supabase.rpc('check_multiple_drop_products_availability', {
        p_order_items: orderProducts,
      });

    if (availabilityError || !availabilityCheck) {
      console.error('❌ Availability check failed during payment intent:', {
        error: availabilityError,
        items: items,
        orderProducts: orderProducts,
      });
      return NextResponse.json(
        { error: 'Some items are no longer available' },
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
        dropId: targetDrop.id,
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
