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
      subject: `Order Confirmation - ${data.orderNumber}`,
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
      confirmed: 'Your order has been confirmed and is being prepared!',
      ready: 'Your order is ready for pickup!',
      completed: 'Thank you for your order!',
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
