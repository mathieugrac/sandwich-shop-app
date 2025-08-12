import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET() {
  try {
    const { data: sells, error } = await supabase
      .from('sells')
      .select(
        `
        *,
        locations (
          id,
          name,
          district,
          address,
          google_maps_link,
          delivery_timeframe
        )
      `
      )
      .order('sell_date', { ascending: true });

    if (error) {
      console.error('Error fetching sells:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sells' },
        { status: 500 }
      );
    }

    return NextResponse.json(sells);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sell_date, location_id, status, notes } = body;

    // Validate required fields
    if (!sell_date || !location_id) {
      return NextResponse.json(
        { error: 'Sell date and location are required' },
        { status: 400 }
      );
    }

    // Check if location exists and is active
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .select('id')
      .eq('id', location_id)
      .eq('active', true)
      .single();

    if (locationError || !location) {
      return NextResponse.json(
        { error: 'Invalid or inactive location' },
        { status: 400 }
      );
    }

    const { data: sell, error } = await supabase
      .from('sells')
      .insert({
        sell_date,
        location_id,
        status: status || 'draft',
        notes,
        announcement_sent: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating sell:', error);
      return NextResponse.json(
        { error: 'Failed to create sell' },
        { status: 500 }
      );
    }

    // Get all active products to create inventory entries
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .eq('active', true);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      // Don't fail the sell creation, just log the error
    } else if (products && products.length > 0) {
      // Create inventory entries for all products with 0 quantity
      const inventoryData = products.map(product => ({
        sell_id: sell.id,
        product_id: product.id,
        total_quantity: 0,
        reserved_quantity: 0,
      }));

      const { error: inventoryError } = await supabase
        .from('sell_inventory')
        .insert(inventoryData);

      if (inventoryError) {
        console.error('Error creating inventory entries:', inventoryError);
        // Don't fail the sell creation, just log the error
      }
    }

    return NextResponse.json(sell);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
