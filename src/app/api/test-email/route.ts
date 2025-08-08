import { NextResponse } from 'next/server';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Test email data
    const testEmailData = {
      orderNumber: 'TEST-20241201-0001',
      customerName: 'Test Customer',
      customerEmail: email,
      pickupDate: '2024-12-01',
      pickupTime: '12:30',
      items: [
        {
          productName: 'Nutty Beet',
          quantity: 2,
          unitPrice: 9.0,
          totalPrice: 18.0,
        },
        {
          productName: 'Umami Mush',
          quantity: 1,
          unitPrice: 10.0,
          totalPrice: 10.0,
        },
      ],
      totalAmount: 28.0,
      specialInstructions: 'Extra crispy please!',
    };

    await sendOrderConfirmationEmail(testEmailData);

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
    });
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    );
  }
}
