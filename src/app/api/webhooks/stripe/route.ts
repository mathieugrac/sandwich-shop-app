import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe/server';
import { supabase } from '@/lib/supabase/server';
import {
  sendOrderConfirmationEmail,
  sendPaymentFailureNotification,
} from '@/lib/email';
import { createOrderWithCode } from '@/lib/order-codes';

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = (await headers()).get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('Missing STRIPE_WEBHOOK_SECRET');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('🔔 Stripe webhook received:', event.type);

    // Handle successful payment
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      console.log('✅ Payment succeeded:', paymentIntent.id);

      await handleSuccessfulPayment(paymentIntent);
    }

    // Handle failed payment
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      console.log('❌ Payment failed:', paymentIntent.id);

      await handleFailedPayment(paymentIntent);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleSuccessfulPayment(paymentIntent: Stripe.PaymentIntent) {
  try {
    const metadata = paymentIntent.metadata;
    const cartItems = JSON.parse(metadata.cartItems);

    // Check if order already exists for this payment intent (webhook retry handling)
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, public_code, status')
      .eq('payment_intent_id', paymentIntent.id)
      .single();

    if (existingOrder) {
      console.log(
        '✅ Order already exists for payment intent (created by direct API):',
        {
          paymentIntentId: paymentIntent.id,
          orderId: existingOrder.id,
          orderNumber: existingOrder.public_code,
          status: existingOrder.status,
        }
      );

      // If order exists but status is still 'pending', update it to 'confirmed'
      if (existingOrder.status === 'pending') {
        await supabase
          .from('orders')
          .update({ status: 'confirmed' })
          .eq('id', existingOrder.id);
        console.log('✅ Updated existing order status to confirmed');
      }

      return; // Order already processed, skip creation
    }

    // Get or create client (by email/phone only)
    const { data: clientId, error: clientError } = await supabase.rpc(
      'get_or_create_client',
      {
        p_email: metadata.customerEmail,
        p_phone: metadata.customerPhone || null,
      }
    );

    if (clientError) {
      console.error('Error getting/creating client:', clientError);
      throw new Error('Failed to process customer information');
    }

    // Allocate sequence number using server Supabase (with service role permissions)
    const { data: sequenceNumber, error: sequenceError } = await supabase.rpc('allocate_order_sequence', {
      p_drop_id: metadata.dropId
    });
    
    if (sequenceError) {
      throw new Error(`Failed to allocate sequence: ${sequenceError.message}`);
    }
    
    // Generate the public code using server Supabase
    const { data: publicCode, error: codeError } = await supabase.rpc('generate_order_code', {
      p_drop_id: metadata.dropId,
      p_sequence_number: sequenceNumber
    });
    
    if (codeError) {
      throw new Error(`Failed to generate code: ${codeError.message}`);
    }
    
    // Create the order directly using server Supabase
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        client_id: clientId,
        customer_name: metadata.customerName, // Store name at order level for delivery bag
        pickup_time: metadata.pickupTime,
        order_date: metadata.pickupDate,
        total_amount: parseFloat(metadata.totalAmount),
        special_instructions: metadata.specialInstructions || null,
        status: 'confirmed', // Paid orders start as confirmed
        payment_intent_id: paymentIntent.id,
        payment_method: 'stripe',
        drop_id: metadata.dropId,
        sequence_number: sequenceNumber,
        public_code: publicCode
      })
      .select()
      .single();
    
    if (orderError) {
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    // Reserve inventory and create order products
    const orderProducts = cartItems.map(
      (item: {
        id: string;
        name: string;
        quantity: number;
        price: number;
      }) => ({
        drop_product_id: item.id,
        order_quantity: item.quantity,
      })
    );

    // Reserve inventory for all items
    const { error: reservationError } = await supabase.rpc(
      'reserve_multiple_drop_products',
      { p_order_items: orderProducts }
    );

    if (reservationError) {
      console.error(
        '❌ CRITICAL: Inventory reservation failed after payment succeeded:',
        {
          paymentIntentId: paymentIntent.id,
          orderId: order.id,
          error: reservationError,
          cartItems: cartItems,
        }
      );

      // This is a critical error - payment succeeded but inventory couldn't be reserved
      // We should alert the admin immediately and potentially refund the customer
      try {
        await sendPaymentFailureNotification({
          customerName: metadata.customerName,
          customerEmail: metadata.customerEmail,
          customerPhone: metadata.customerPhone || undefined,
          cartItems: cartItems.map(
            (item: {
              id: string;
              name: string;
              quantity: number;
              price: number;
            }) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            })
          ),
          totalAmount: parseFloat(metadata.totalAmount),
          errorReason: `CRITICAL: Payment succeeded but inventory reservation failed: ${reservationError.message}`,
          paymentIntentId: paymentIntent.id,
          timestamp: new Date().toISOString(),
        });
      } catch (emailError) {
        console.error(
          '❌ Failed to send critical error notification:',
          emailError
        );
      }

      throw new Error('Failed to reserve inventory after payment');
    }

    // Create order products
    const orderProductsForInsert = cartItems.map(
      (item: {
        id: string;
        name: string;
        quantity: number;
        price: number;
      }) => ({
        order_id: order.id,
        drop_product_id: item.id,
        order_quantity: item.quantity,
      })
    );

    const { error: orderProductsError } = await supabase
      .from('order_products')
      .insert(orderProductsForInsert);

    if (orderProductsError) {
      console.error('Error creating order products:', orderProductsError);
      throw new Error('Failed to create order products');
    }

    // Send confirmation email
    try {
      const emailItems = cartItems.map(
        (item: {
          id: string;
          name: string;
          quantity: number;
          price: number;
        }) => ({
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity,
        })
      );

      const pickupDateObj = new Date(metadata.pickupDate);
      const formattedPickupDate = pickupDateObj.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
      });

      // Get location info for email
      const { data: dropWithLocation } = await supabase
        .from('drops')
        .select(
          `
          locations (
            name,
            district,
            address,
            location_url
          )
        `
        )
        .eq('id', metadata.dropId)
        .single();

      await sendOrderConfirmationEmail({
        orderNumber: order.public_code,
        customerName: metadata.customerName,
        customerEmail: metadata.customerEmail,
        pickupTime: metadata.pickupTime,
        pickupDate: formattedPickupDate,
        items: emailItems,
        totalAmount: parseFloat(metadata.totalAmount),
        specialInstructions: metadata.specialInstructions,
        locationName: dropWithLocation?.locations?.name || 'Pickup Location',
        locationDistrict: dropWithLocation?.locations?.district || 'District',
        locationUrl: dropWithLocation?.locations?.location_url || '#',
      });

      console.log(
        '✅ Order confirmation email sent for order:',
        order.public_code
      );
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail the order if email fails
    }

    console.log('✅ Order created successfully:', {
      orderId: order.id,
      orderNumber: order.public_code,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('❌ Error handling successful payment:', error);
    // TODO: Implement retry mechanism or alert admin
    throw error;
  }
}

async function handleFailedPayment(paymentIntent: Stripe.PaymentIntent) {
  try {
    const metadata = paymentIntent.metadata;
    const cartItems = JSON.parse(metadata.cartItems);
    const errorMessage =
      paymentIntent.last_payment_error?.message || 'Unknown payment error';

    console.log('💸 Payment failed for customer:', {
      customerEmail: metadata.customerEmail,
      customerName: metadata.customerName,
      amount: metadata.totalAmount,
      error: errorMessage,
    });

    // Send admin notification email about failed payment
    try {
      await sendPaymentFailureNotification({
        customerName: metadata.customerName,
        customerEmail: metadata.customerEmail,
        customerPhone: metadata.customerPhone || undefined,
        cartItems: cartItems.map(
          (item: {
            id: string;
            name: string;
            quantity: number;
            price: number;
          }) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })
        ),
        totalAmount: parseFloat(metadata.totalAmount),
        errorReason: errorMessage,
        paymentIntentId: paymentIntent.id,
        timestamp: new Date().toISOString(),
      });
    } catch (emailError) {
      console.error(
        '❌ Failed to send payment failure notification:',
        emailError
      );
      // Don't fail the webhook if email fails
    }

    // Release reserved inventory since payment failed
    const orderProducts = cartItems.map(
      (item: {
        id: string;
        name: string;
        quantity: number;
        price: number;
      }) => ({
        drop_product_id: item.id,
        order_quantity: item.quantity,
      })
    );

    const { error: releaseError } = await supabase.rpc(
      'release_multiple_drop_products',
      { p_order_items: orderProducts }
    );

    if (releaseError) {
      console.error('❌ Failed to release inventory after payment failure:', {
        paymentIntentId: paymentIntent.id,
        error: releaseError,
        cartItems: cartItems,
      });
      // Continue anyway - admin will be notified
    } else {
      console.log(
        '✅ Inventory released after payment failure:',
        paymentIntent.id
      );
    }
  } catch (error) {
    console.error('❌ Error handling failed payment:', error);
  }
}
