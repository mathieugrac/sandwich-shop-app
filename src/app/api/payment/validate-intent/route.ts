import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';

export async function POST(request: Request) {
  try {
    const { paymentIntentId } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Check if payment intent is in a valid state for reuse
    if (
      paymentIntent.status === 'requires_payment_method' ||
      paymentIntent.status === 'requires_confirmation'
    ) {
      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        valid: true,
      });
    }

    // Payment intent is not reusable
    return NextResponse.json(
      { error: 'Payment intent is not reusable', valid: false },
      { status: 400 }
    );
  } catch (error) {
    console.error('❌ Payment intent validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate payment intent', valid: false },
      { status: 500 }
    );
  }
}
