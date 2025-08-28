import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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
      .not('pickup_deadline', 'is', null) // Ensure deadline is set
      .gt('pickup_deadline', new Date().toISOString()) // Use deadline instead of date
      .order('pickup_deadline', { ascending: true }) // Order by deadline
      .limit(1)
      .single();

    if (dropError || !dropData) {
      if (dropError?.code === 'PGRST116') {
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
      .filter((dp: { products?: Array<{ active?: boolean }> }) => dp.products?.[0]?.active)
      .sort(
        (a: { products?: Array<{ sort_order?: number }> }, b: { products?: Array<{ sort_order?: number }> }) =>
          (a.products?.[0]?.sort_order || 0) -
          (b.products?.[0]?.sort_order || 0)
      )
      .map((dp: { 
        id: string; 
        selling_price: number; 
        available_quantity: number | null;
        products?: Array<{ 
          name?: string; 
          description?: string | null; 
          category?: string; 
          active?: boolean; 
          sort_order?: number 
        }> 
      }) => ({
        id: dp.id,
        name: dp.products?.[0]?.name || '',
        description: dp.products?.[0]?.description || null,
        selling_price: dp.selling_price,
        category: dp.products?.[0]?.category || 'sandwich',
        active: dp.products?.[0]?.active || false,
        sort_order: dp.products?.[0]?.sort_order || 0,
        availableStock: dp.available_quantity || 0,
      }));

    // Calculate time until pickup deadline
    let timeUntilDeadline = null;
    if (dropData.pickup_deadline) {
      const deadline = new Date(dropData.pickup_deadline);
      const now = new Date();
      const diffMs = deadline.getTime() - now.getTime();

      if (diffMs > 0) {
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor(
          (diffMs % (1000 * 60 * 60)) / (1000 * 60)
        );

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
