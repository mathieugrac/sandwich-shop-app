import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET() {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Single query to get next active drop with all related data
    const { data: dropData, error: dropError } = await supabase
      .from('drops')
      .select(
        `
        id,
        date,
        status,
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
      .gte('date', new Date().toISOString().split('T')[0]) // Use date instead of pickup_deadline
      .order('date', { ascending: true }) // Order by date
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
      .filter(
        (dp: { products?: Array<{ active?: boolean }> }) =>
          dp.products?.[0]?.active
      )
      .sort(
        (
          a: { products?: Array<{ sort_order?: number }> },
          b: { products?: Array<{ sort_order?: number }> }
        ) =>
          (a.products?.[0]?.sort_order || 0) -
          (b.products?.[0]?.sort_order || 0)
      )
      .map(
        (dp: {
          id: string;
          selling_price: number;
          available_quantity: number | null;
          products?: Array<{
            name?: string;
            description?: string | null;
            category?: string;
            active?: boolean;
            sort_order?: number;
          }>;
        }) => ({
          id: dp.id,
          name: dp.products?.[0]?.name || '',
          description: dp.products?.[0]?.description || null,
          selling_price: dp.selling_price,
          category: dp.products?.[0]?.category || 'sandwich',
          active: dp.products?.[0]?.active || false,
          sort_order: dp.products?.[0]?.sort_order || 0,
          availableStock: dp.available_quantity || 0,
        })
      );

    // Calculate time until drop date
    let timeUntilDeadline = null;
    if (dropData.date) {
      const dropDate = new Date(dropData.date);
      const now = new Date();
      const diffMs = dropDate.getTime() - now.getTime();

      if (diffMs > 0) {
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(
          (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );

        if (diffDays > 0) {
          timeUntilDeadline = `${diffDays}d ${diffHours}h`;
        } else if (diffHours > 0) {
          timeUntilDeadline = `${diffHours}h`;
        } else {
          timeUntilDeadline = 'Today';
        }
      }
    }

    const result = {
      drop: {
        id: dropData.id,
        date: dropData.date,
        status: dropData.status,
        location: dropData.locations,
      },
      products,
      timeUntilDeadline,
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
