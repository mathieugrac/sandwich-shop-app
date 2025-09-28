import { Resend } from 'resend';
import { renderTemplate, getShopInfo } from './email-templates';

// Initialize Resend client only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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
  locationDistrict: string;
  locationUrl: string;
}

export async function sendOrderConfirmationEmail(
  data: OrderConfirmationEmailData
) {
  try {
    // Check if Resend is available
    if (!resend) {
      console.log('📧 Resend not configured - email would be sent to:', data.customerEmail);
      console.log('📧 Order confirmation email content:', {
        orderNumber: data.orderNumber,
        customerName: data.customerName,
        pickupTime: data.pickupTime,
        pickupDate: data.pickupDate,
        totalAmount: data.totalAmount
      });
      return null;
    }

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
      subject: 'All set! We’ve got your lunch.',
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
    // Check if Resend is available
    if (!resend) {
      console.log('📧 Resend not configured - admin notification would be sent for payment failure:', {
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        paymentIntentId: data.paymentIntentId,
        errorReason: data.errorReason
      });
      return null;
    }

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
    // Check if Resend is available
    if (!resend) {
      console.log('📧 Resend not configured - status update email would be sent to:', customerEmail);
      console.log('📧 Status update details:', {
        orderNumber,
        customerName,
        status
      });
      return null;
    }

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
