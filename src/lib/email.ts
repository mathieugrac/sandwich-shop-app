import { Resend } from 'resend';

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

    console.log(
      'Email service: Attempting to send email to:',
      data.customerEmail
    );
    console.log(
      'Email service: Using API key:',
      process.env.RESEND_API_KEY ? 'Present' : 'Missing'
    );

    const { data: emailData, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // Use Resend's verified sender for testing
      to: data.customerEmail,
      subject: `Order Confirmation - ${data.orderNumber}`,
      html: generateOrderConfirmationEmailHTML(data),
    });

    if (error) {
      console.error('Failed to send email:', error);
      // Don't throw error, just log it and return null
      // This prevents order creation from failing due to email issues
      return null;
    }

    console.log('Email service: Email sent successfully:', emailData);
    return emailData;
  } catch (error) {
    console.error('Email sending error:', error);
    // Don't throw error, just log it and return null
    // This prevents order creation from failing due to email issues
    return null;
  }
}

function generateOrderConfirmationEmailHTML(
  data: OrderConfirmationEmailData
): string {
  const shopName = process.env.NEXT_PUBLIC_SHOP_NAME || 'Your Sandwich Shop';
  const shopPhone = process.env.NEXT_PUBLIC_SHOP_PHONE || '+1234567890';
  const shopEmail =
    process.env.NEXT_PUBLIC_SHOP_EMAIL || 'orders@yourdomain.com';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation - ${data.orderNumber}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9f9f9;
        }
        .container {
          background-color: white;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #f0f0f0;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .order-number {
          background-color: #f8f9fa;
          padding: 10px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 18px;
          color: #495057;
        }
        .section {
          margin-bottom: 25px;
        }
        .section h3 {
          color: #2c3e50;
          border-bottom: 1px solid #e9ecef;
          padding-bottom: 8px;
          margin-bottom: 15px;
        }
        .item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #f8f9fa;
        }
        .item:last-child {
          border-bottom: none;
        }
        .total {
          font-weight: bold;
          font-size: 18px;
          color: #2c3e50;
          border-top: 2px solid #e9ecef;
          padding-top: 15px;
          margin-top: 15px;
        }
        .pickup-info {
          background-color: #e8f5e8;
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #28a745;
        }
        .contact-info {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 6px;
          margin-top: 20px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
          color: #6c757d;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="color: #2c3e50; margin-bottom: 10px;">${shopName}</h1>
          <div class="order-number">Order #${data.orderNumber}</div>
        </div>

        <div class="section">
          <h3>Hi ${data.customerName},</h3>
          <p>Thank you for your order! We're preparing your sandwiches and will have them ready for pickup at your selected time.</p>
        </div>

        <div class="section">
          <h3>Pickup Information</h3>
          <div class="pickup-info">
            <p><strong>Date:</strong> ${data.pickupDate}</p>
            <p><strong>Time:</strong> ${data.pickupTime}</p>
            <p><strong>Location:</strong> Impact Hub Lisbon (10 minutes from production site)</p>
          </div>
        </div>

        <div class="section">
          <h3>Order Details</h3>
          ${data.items
            .map(
              item => `
            <div class="item">
              <span>${item.quantity}x ${item.productName}</span>
              <span>$${item.totalPrice.toFixed(2)}</span>
            </div>
          `
            )
            .join('')}
          <div class="item total">
            <span>Total</span>
            <span>$${data.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        ${
          data.specialInstructions
            ? `
          <div class="section">
            <h3>Special Instructions</h3>
            <p style="background-color: #fff3cd; padding: 10px; border-radius: 4px; border-left: 4px solid #ffc107;">
              ${data.specialInstructions}
            </p>
          </div>
        `
            : ''
        }

        <div class="section">
          <h3>Important Notes</h3>
          <ul>
            <li>Please arrive within 15 minutes of your pickup time</li>
            <li>Payment is due in cash at pickup</li>
            <li>If you need to make changes, please contact us as soon as possible</li>
          </ul>
        </div>

        <div class="contact-info">
          <h3>Contact Information</h3>
          <p><strong>Phone:</strong> ${shopPhone}</p>
          <p><strong>Email:</strong> ${shopEmail}</p>
        </div>

        <div class="footer">
          <p>Thank you for choosing ${shopName}!</p>
          <p>We look forward to serving you.</p>
        </div>
      </div>
    </body>
    </html>
  `;
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

    const message =
      statusMessages[status as keyof typeof statusMessages] ||
      'Your order status has been updated.';

    const { data: emailData, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // Use Resend's verified sender for testing
      to: customerEmail,
      subject: `Order Status Update - ${orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Status Update</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .container {
              background-color: white;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .status-update {
              background-color: #d4edda;
              padding: 15px;
              border-radius: 6px;
              border-left: 4px solid #28a745;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Order Status Update</h2>
            <p>Hi ${customerName},</p>
            <div class="status-update">
              <p><strong>Order #${orderNumber}</strong></p>
              <p>${message}</p>
            </div>
            <p>Thank you for choosing our service!</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Failed to send status update email:', error);
      // Don't throw error, just log it and return null
      // This prevents status update from failing due to email issues
      return null;
    }

    console.log('Status update email sent successfully:', emailData);
    return emailData;
  } catch (error) {
    console.error('Status update email sending error:', error);
    // Don't throw error, just log it and return null
    // This prevents status update from failing due to email issues
    return null;
  }
}
