import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { supabase } from '@/lib/supabase/server';
import { ERROR_MESSAGES } from '@/lib/constants/messages';

export async function POST(request: Request) {
  try {
    const { clientSecret } = await request.json();

    if (!clientSecret) {
      return NextResponse.json(
        { error: 'Client secret is required' },
        { status: 400 }
      );
    }

    // Get payment intent from Stripe to retrieve cart items
    const paymentIntentId = clientSecret.split('_secret_')[0];
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent.metadata.cartItems) {
      return NextResponse.json(
        { error: 'Cart items not found in payment intent' },
        { status: 400 }
      );
    }

    const cartItems = JSON.parse(paymentIntent.metadata.cartItems);
    const orderProducts = cartItems.map((item: any) => ({
      drop_product_id: item.id,
      order_quantity: item.quantity,
    }));

    // Check availability
    const { data: availabilityCheck, error: availabilityError } =
      await supabase.rpc('check_multiple_drop_products_availability', {
        p_order_items: orderProducts,
      });

    if (availabilityError || !availabilityCheck) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.ITEMS_NO_LONGER_AVAILABLE },
        { status: 400 }
      );
    }

    return NextResponse.json({ available: true });
  } catch (error) {
    console.error('❌ Availability check error:', error);
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    );
  }
}
