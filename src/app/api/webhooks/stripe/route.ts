import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe/server';
import { supabase } from '@/lib/supabase/server';
import {
  sendOrderConfirmationEmail,
  sendPaymentFailureNotification,
} from '@/lib/email';

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
      .select('id, order_number, status')
      .eq('payment_intent_id', paymentIntent.id)
      .single();

    if (existingOrder) {
      console.log(
        '✅ Order already exists for payment intent (created by direct API):',
        {
          paymentIntentId: paymentIntent.id,
          orderId: existingOrder.id,
          orderNumber: existingOrder.order_number,
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

    // Generate order number with drop_id
    const { data: orderNumber, error: orderNumberError } = await supabase.rpc(
      'generate_order_number',
      { p_drop_id: metadata.dropId }
    );

    if (orderNumberError) {
      console.error('Error generating order number:', orderNumberError);
      throw new Error('Failed to generate order number');
    }

    // Create order with 'confirmed' status (payment already processed)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        drop_id: metadata.dropId,
        client_id: clientId,
        customer_name: metadata.customerName, // Store name at order level for delivery bag
        pickup_time: metadata.pickupTime,
        order_date: metadata.pickupDate,
        total_amount: parseFloat(metadata.totalAmount),
        special_instructions: metadata.specialInstructions || null,
        status: 'confirmed', // Paid orders start as confirmed
        payment_intent_id: paymentIntent.id,
        payment_method: 'stripe',
      })
      .select('id, order_number, status')
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      throw new Error('Failed to create order');
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
        orderNumber: order.order_number,
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
        order.order_number
      );
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail the order if email fails
    }

    console.log('✅ Order created successfully:', {
      orderId: order.id,
      orderNumber: order.order_number,
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
