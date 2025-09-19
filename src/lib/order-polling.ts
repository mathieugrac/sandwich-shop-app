/**
 * Waits for webhook to create order after successful payment
 * Polls the database until order is found or timeout occurs
 */
export async function waitForWebhookOrderCreation(
  paymentIntentId: string
): Promise<string> {
  const maxAttempts = 30; // 30 seconds total (reasonable for webhook processing)
  const pollInterval = 1000; // Check every 1 second

  console.log(
    `🔄 Waiting for webhook to create order for payment: ${paymentIntentId}`
  );

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Check if order exists with this payment_intent_id
      const response = await fetch(
        `/api/orders/by-payment-intent/${paymentIntentId}`
      );

      if (response.ok) {
        const { orderId, orderNumber } = await response.json();
        console.log(`✅ Order found after ${attempt} attempts: ${orderNumber}`);
        return orderId;
      }

      // Log progress every 5 seconds to help with debugging
      if (attempt % 5 === 0) {
        console.log(
          `⏳ Still waiting for order creation... (${attempt}/${maxAttempts})`
        );
      }
    } catch (error) {
      console.error(`❌ Error checking for order (attempt ${attempt}):`, error);
    }

    // Wait before next attempt (except on last attempt)
    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }

  // Timeout reached
  console.error(`❌ Timeout waiting for order creation: ${paymentIntentId}`);
  throw new Error(
    'Order creation is taking longer than expected. Please contact support if payment was charged.'
  );
}
