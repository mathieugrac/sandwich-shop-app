import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Use the new enhanced function from Phase 1
    const { data: drops, error: dropsError } = await supabase.rpc(
      'get_next_active_drop'
    );

    if (dropsError) {
      console.error('Error fetching next active drop:', dropsError);
      return NextResponse.json(
        { error: 'Failed to fetch next active drop' },
        { status: 500 }
      );
    }

    if (!drops || drops.length === 0) {
      return NextResponse.json(null);
    }

    const drop = drops[0];

    // Get the full drop details including pickup_deadline
    const { data: dropDetails, error: dropDetailsError } = await supabase
      .from('drops')
      .select(
        `
        id,
        date,
        status,
        pickup_deadline,
        location_id,
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
      .eq('id', drop.id)
      .single();

    if (dropDetailsError || !dropDetails) {
      console.error('Error fetching drop details:', dropDetailsError);
      return NextResponse.json(
        { error: 'Failed to fetch drop details' },
        { status: 500 }
      );
    }

    // Get products with inventory for this drop
    const { data: dropProducts, error: inventoryError } = await supabase
      .from('drop_products')
      .select(
        `
        id,
        stock_quantity,
        reserved_quantity,
        available_quantity,
        selling_price,
        products (
          id,
          name,
          description,
          category,
          active,
          sort_order
        )
      `
      )
      .eq('drop_id', drop.id)
      .eq('products.active', true)
      .order('products.sort_order', { ascending: true });

    if (inventoryError) {
      console.error('Error fetching drop inventory:', inventoryError);
      return NextResponse.json(
        { error: 'Failed to fetch drop inventory' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format
    const products =
      dropProducts?.map(dp => ({
        id: dp.products[0]?.id,
        name: dp.products[0]?.name,
        description: dp.products[0]?.description,
        selling_price: dp.selling_price,
        category: dp.products[0]?.category,
        active: dp.products[0]?.active,
        sort_order: dp.products[0]?.sort_order,
        availableStock: dp.available_quantity,
      })) || [];

    // Calculate time until pickup deadline
    let timeUntilDeadline = null;
    if (dropDetails.pickup_deadline) {
      const deadline = new Date(dropDetails.pickup_deadline);
      const now = new Date();
      const diffMs = deadline.getTime() - now.getTime();
      
      if (diffMs > 0) {
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (diffHours > 0) {
          timeUntilDeadline = `${diffHours}h ${diffMinutes}m`;
        } else {
          timeUntilDeadline = `${diffMinutes}m`;
        }
      }
    }

    const result = {
      drop: {
        id: dropDetails.id,
        date: dropDetails.date,
        status: dropDetails.status,
        pickup_deadline: dropDetails.pickup_deadline,
        time_until_deadline: timeUntilDeadline,
        location: dropDetails.locations,
      },
      products,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
