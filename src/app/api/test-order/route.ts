import { NextResponse } from 'next/server';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function POST() {
  try {
    console.log('🧪 Testing order creation and email...');
    
    // Simulate order creation data
    const orderData = {
      orderNumber: 'TEST-20241218-0002',
      customerName: 'Test Customer',
      customerEmail: 'mathieugrac@gmail.com',
      pickupTime: '12:00',
      pickupDate: '2024-12-18',
      items: [
        {
          productName: 'Nutty Beet',
          quantity: 1,
          unitPrice: 10.00,
          totalPrice: 10.00,
        },
      ],
      totalAmount: 10.00,
      specialInstructions: 'Test order from API',
    };

    console.log('📧 Attempting to send order confirmation email...');
    
    const emailResult = await sendOrderConfirmationEmail(orderData);

    if (emailResult) {
      console.log('✅ Order confirmation email sent successfully:', emailResult);
      return NextResponse.json({
        success: true,
        message: 'Order created and email sent successfully',
        orderNumber: orderData.orderNumber,
        emailData: emailResult,
      });
    } else {
      console.log('❌ Order confirmation email failed - no result returned');
      return NextResponse.json({
        success: false,
        message: 'Order created but email failed',
        orderNumber: orderData.orderNumber,
      });
    }
    
  } catch (error) {
    console.error('❌ Order creation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
