import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function POST() {
  try {
    console.log('🧪 Testing simple order creation...');
    
    // Get the first available drop
    const { data: drops, error: dropsError } = await supabase
      .from('drops')
      .select('id, date, status')
      .limit(1);

    if (dropsError || !drops || drops.length === 0) {
      console.error('❌ No drops available:', dropsError);
      return NextResponse.json({
        success: false,
        error: 'No drops available',
        details: dropsError,
      });
    }

    const drop = drops[0];
    console.log('✅ Using drop:', drop);

    // Create a simple order
    const orderNumber = 'SIMPLE-' + Date.now();
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        drop_id: drop.id,
        client_id: null, // Skip client for now
        pickup_time: '12:00',
        order_date: '2024-12-18',
        status: 'pending',
        total_amount: 10.00,
        special_instructions: 'Simple test order',
      })
      .select()
      .single();

    if (orderError) {
      console.error('❌ Order creation error:', orderError);
      return NextResponse.json({
        success: false,
        error: 'Order creation failed',
        details: orderError,
      });
    }

    console.log('✅ Simple order created:', order);

    return NextResponse.json({
      success: true,
      message: 'Simple order created successfully',
      order: order,
    });
    
  } catch (error) {
    console.error('❌ Simple order test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
