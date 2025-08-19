import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Single query to get next active drop with all related data
    const { data: dropData, error: dropError } = await supabase
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
        ),
        drop_products!inner (
          id,
          stock_quantity,
          reserved_quantity,
          available_quantity,
          selling_price,
          products!inner (
            id,
            name,
            description,
            category,
            active,
            sort_order
          )
        )
      `
      )
      .eq('status', 'active')
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })
      .limit(1)
      .single();

    if (dropError || !dropData) {
      if (dropError.code === 'PGRST116') {
        // No active drops found
        return NextResponse.json(null);
      }
      console.error('Error fetching next active drop:', dropError);
      return NextResponse.json(
        { error: 'Failed to fetch next active drop' },
        { status: 500 }
      );
    }

    // Filter active products and transform data
    const products = dropData.drop_products
      .filter(dp => dp.products.active)
      .sort((a, b) => a.products.sort_order - b.products.sort_order)
      .map(dp => ({
        id: dp.id,
        name: dp.products.name,
        description: dp.products.description,
        selling_price: dp.selling_price,
        category: dp.products.category,
        active: dp.products.active,
        sort_order: dp.products.sort_order,
        availableStock: dp.available_quantity,
      }));

    // Calculate time until pickup deadline
    let timeUntilDeadline = null;
    if (dropData.pickup_deadline) {
      const deadline = new Date(dropData.pickup_deadline);
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
        id: dropData.id,
        date: dropData.date,
        status: dropData.status,
        pickup_deadline: dropData.pickup_deadline,
        time_until_deadline: timeUntilDeadline,
        location: dropData.locations,
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
