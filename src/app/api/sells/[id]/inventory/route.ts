import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get the sell with location information
    const { data: sell, error: sellError } = await supabase
      .from('sells')
      .select(
        `
        *,
        location:locations (
          id,
          name,
          district,
          address,
          google_maps_link,
          delivery_timeframe
        )
      `
      )
      .eq('id', id)
      .single();

    if (sellError || !sell) {
      console.error('Error fetching sell:', sellError);
      return NextResponse.json({ error: 'Sell not found' }, { status: 404 });
    }

    // Get inventory for this sell
    const { data: inventory, error: inventoryError } = await supabase
      .from('sell_inventory')
      .select(
        `
        *,
        product:products (
          id,
          name,
          description,
          price,
          image_url,
          category,
          active,
          sort_order
        )
      `
      )
      .eq('sell_id', id);

    if (inventoryError) {
      console.error('Error fetching sell inventory:', inventoryError);
      return NextResponse.json(
        { error: 'Failed to fetch sell inventory' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...sell,
      inventory: inventory || [],
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { inventory } = body;

    if (!inventory || !Array.isArray(inventory)) {
      return NextResponse.json(
        { error: 'Inventory data is required' },
        { status: 400 }
      );
    }

    // Update inventory for each product
    for (const item of inventory) {
      const { error } = await supabase.from('sell_inventory').upsert({
        sell_id: id,
        product_id: item.product_id,
        total_quantity: item.total_quantity,
        reserved_quantity: item.reserved_quantity || 0,
      });

      if (error) {
        console.error('Error updating inventory:', error);
        return NextResponse.json(
          { error: 'Failed to update inventory' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
