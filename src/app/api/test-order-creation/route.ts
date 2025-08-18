import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function POST() {
  try {
    console.log('🧪 Testing order creation...');
    
    // Test order data
    const testOrder = {
      order_number: 'TEST-20241218-0003',
      drop_id: null, // We'll need to get a real drop_id
      client_id: null, // We'll need to get a real client_id
      pickup_time: '12:00',
      order_date: '2024-12-18',
      status: 'pending',
      total_amount: 10.00,
      special_instructions: 'Test order creation',
    };

    console.log('📝 Attempting to create test order...');
    
    // First, let's check if we can connect to the database
    const { data: drops, error: dropsError } = await supabase
      .from('drops')
      .select('id, date, status')
      .limit(1);

    if (dropsError) {
      console.error('❌ Database connection error:', dropsError);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: dropsError,
      });
    }

    console.log('✅ Database connection successful');
    console.log('📋 Available drops:', drops);

    return NextResponse.json({
      success: true,
      message: 'Database connection test successful',
      drops: drops,
      testOrder: testOrder,
    });
    
  } catch (error) {
    console.error('❌ Order creation test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
