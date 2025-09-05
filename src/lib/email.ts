import { Resend } from 'resend';
import { renderTemplate, getShopInfo } from './email-templates';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

export interface OrderConfirmationEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  pickupDate: string;
  pickupTime: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  totalAmount: number;
  specialInstructions?: string;
  locationName: string;
  locationUrl: string;
}

export async function sendOrderConfirmationEmail(
  data: OrderConfirmationEmailData
) {
  try {
    // Validate required data
    if (!data.customerEmail || !data.orderNumber) {
      throw new Error(
        'Missing required email data: customerEmail or orderNumber'
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.customerEmail)) {
      throw new Error(`Invalid email format: ${data.customerEmail}`);
    }

    // Get shop information
    const shopInfo = getShopInfo();

    // Render email template
    const html = renderTemplate('order-confirmation', {
      ...data,
      ...shopInfo,
    });

    const { data: emailData, error } = await resend.emails.send({
      from: shopInfo.shopEmail,
      to: data.customerEmail,
      subject: `All set! Your Fomé order is confirmed — see you at ${data.pickupTime}!`,
      html,
    });

    if (error) {
      console.error('Email sending failed:', error);
      return null;
    }

    return emailData;
  } catch (error) {
    console.error('Email sending error:', error);
    return null;
  }
}

export interface PaymentFailureNotificationData {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  cartItems: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  errorReason: string;
  paymentIntentId: string;
  timestamp: string;
}

export async function sendPaymentFailureNotification(
  data: PaymentFailureNotificationData
) {
  try {
    // Get admin email from environment
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.error(
        'ADMIN_EMAIL not configured - cannot send payment failure notification'
      );
      return null;
    }

    // Get shop information
    const shopInfo = getShopInfo();

    // Render email template
    const html = renderTemplate('admin-payment-failed', {
      ...data,
      ...shopInfo,
    });

    const { data: emailData, error } = await resend.emails.send({
      from: shopInfo.shopEmail,
      to: adminEmail,
      subject: `🚨 Payment Failed - ${data.customerName} (${data.paymentIntentId})`,
      html,
    });

    if (error) {
      console.error('Failed to send payment failure notification:', error);
      return null;
    }

    console.log('✅ Payment failure notification sent to admin');
    return emailData;
  } catch (error) {
    console.error('Payment failure notification error:', error);
    return null;
  }
}

export async function sendOrderStatusUpdateEmail(
  customerEmail: string,
  customerName: string,
  orderNumber: string,
  status: string
) {
  try {
    // Validate required data
    if (!customerEmail || !orderNumber || !status) {
      throw new Error('Missing required data for status update email');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      throw new Error(`Invalid email format: ${customerEmail}`);
    }

    const statusMessages = {
      delivered: 'Your order has been delivered! Thank you for choosing Fomé!',
    };

    const statusMessage =
      statusMessages[status as keyof typeof statusMessages] ||
      'Your order status has been updated.';

    // Get shop information
    const shopInfo = getShopInfo();

    // Render email template
    const html = renderTemplate('order-status-update', {
      customerEmail,
      customerName,
      orderNumber,
      statusMessage,
      ...shopInfo,
    });

    const { data: emailData, error } = await resend.emails.send({
      from: shopInfo.shopEmail,
      to: customerEmail,
      subject: `Order Status Update - ${orderNumber}`,
      html,
    });

    if (error) {
      console.error('Failed to send status update email:', error);
      return null;
    }

    return emailData;
  } catch (error) {
    console.error('Status update email sending error:', error);
    return null;
  }
}
