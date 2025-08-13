import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET() {
  try {
    const { data: drops, error } = await supabase
      .from('drops')
      .select(
        `
        *,
        locations (
          id,
          name,
          address,
          location_url,
          pickup_hour_start,
          pickup_hour_end
        )
      `
      )
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching drops:', error);
      return NextResponse.json(
        { error: 'Failed to fetch drops' },
        { status: 500 }
      );
    }

    return NextResponse.json(drops);
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
    const { date, location_id, status, notes } = body;

    // Validate required fields
    if (!date || !location_id) {
      return NextResponse.json(
        { error: 'Drop date and location are required' },
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

    const { data: drop, error } = await supabase
      .from('drops')
      .insert({
        date,
        location_id,
        status: status || 'upcoming',
        notes,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating drop:', error);
      return NextResponse.json(
        { error: 'Failed to create drop' },
        { status: 500 }
      );
    }

    // Get all active products to create drop product entries
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, sell_price')
      .eq('active', true);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      // Don't fail the drop creation, just log the error
    } else if (products && products.length > 0) {
      // Create drop product entries for all products with 0 quantity and captured selling price
      const dropProductData = products.map(product => ({
        drop_id: drop.id,
        product_id: product.id,
        stock_quantity: 0,
        reserved_quantity: 0,
        selling_price: product.sell_price, // Capture the selling price at drop level
      }));

      const { error: dropProductError } = await supabase
        .from('drop_products')
        .insert(dropProductData);

      if (dropProductError) {
        console.error('Error creating drop product entries:', dropProductError);
        // Don't fail the drop creation, just log the error
      }
    }

    return NextResponse.json(drop);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
