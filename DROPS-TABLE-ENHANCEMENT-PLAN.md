# Drops Table Enhancement Plan

## 📋 Overview

This document outlines the plan to enhance the drops table with additional calculated columns for better inventory and order management visibility.

## 🎯 New Columns Implementation

### Current Status: **Phase 1 - Hard-coded Values**

- Using placeholder data to establish UI structure
- All new columns display mock data for design validation

### Target Status: **Phase 2 - Database Integration**

- Full database function enhancement
- Real-time calculated metrics

## 📊 Column Specifications

### 1. Date ✅

- **Status**: Already implemented
- **Source**: `drops.date`

### 2. Location ✅

- **Status**: Already implemented
- **Source**: `locations.name` via JOIN

### 3. Status ✅

- **Status**: Already implemented
- **Source**: `drops.status`

### 4. Inventory [total of items]

- **Current**: Hard-coded placeholder
- **Target**: `SUM(dp.stock_quantity)` from `drop_products`
- **Description**: Total items prepared for the drop (regardless of reservations)

### 5. Sold (total of items ordered)

- **Current**: Hard-coded placeholder
- **Target**: `SUM(op.order_quantity)` from `order_products` via `orders`
- **Description**: Total items actually ordered by customers
- **Join Path**: `drops → orders → order_products`

### 6. Loss (total items - items ordered)

- **Current**: Hard-coded placeholder
- **Target**: Calculated field `(Inventory - Sold)`
- **Description**: Items prepared but not sold (waste/loss)

### 7. Completed (percentage of orders delivered)

- **Current**: Hard-coded placeholder
- **Target**: `(COUNT(orders WHERE status='delivered') / COUNT(orders)) * 100`
- **Description**: Delivery completion rate as percentage
- **Join Path**: `drops → orders`

## 🗄️ Database Changes Required

### Phase 2 Implementation Plan

#### 1. Enhanced Database Functions

**Update `get_admin_upcoming_drops()` and `get_admin_past_drops()`:**

```sql
CREATE OR REPLACE FUNCTION get_admin_upcoming_drops()
RETURNS TABLE (
  id UUID,
  date DATE,
  status VARCHAR(20),
  location_id UUID,
  location_name VARCHAR(100),
  status_changed_at TIMESTAMP WITH TIME ZONE,
  total_inventory BIGINT,        -- NEW: SUM(stock_quantity)
  total_sold BIGINT,            -- NEW: SUM(order_quantity)
  total_loss BIGINT,            -- NEW: inventory - sold
  delivered_orders BIGINT,      -- NEW: COUNT(delivered orders)
  total_orders BIGINT,          -- NEW: COUNT(all orders)
  completion_percentage DECIMAL -- NEW: (delivered/total)*100
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.date,
    d.status,
    d.location_id,
    l.name as location_name,
    d.status_changed_at,
    COALESCE(SUM(dp.stock_quantity), 0) as total_inventory,
    COALESCE(SUM(op.order_quantity), 0) as total_sold,
    COALESCE(SUM(dp.stock_quantity), 0) - COALESCE(SUM(op.order_quantity), 0) as total_loss,
    COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) as delivered_orders,
    COUNT(o.id) as total_orders,
    CASE
      WHEN COUNT(o.id) > 0 THEN
        ROUND((COUNT(CASE WHEN o.status = 'delivered' THEN 1 END)::DECIMAL / COUNT(o.id)) * 100, 1)
      ELSE 0
    END as completion_percentage
  FROM drops d
  JOIN locations l ON d.location_id = l.id
  LEFT JOIN drop_products dp ON d.id = dp.drop_id
  LEFT JOIN orders o ON d.id = o.drop_id
  LEFT JOIN order_products op ON o.id = op.order_id
  WHERE d.status IN ('upcoming', 'active')
  GROUP BY d.id, d.date, d.status, d.location_id, l.name, d.status_changed_at
  ORDER BY d.date ASC, d.status ASC;
END;
$$ LANGUAGE plpgsql;
```

#### 2. TypeScript Interface Updates

**Extend `AdminDrop` interface:**

```typescript
export interface AdminDrop extends Drop {
  location_name: string;
  total_inventory: number; // NEW
  total_sold: number; // NEW
  total_loss: number; // NEW
  delivered_orders: number; // NEW
  total_orders: number; // NEW
  completion_percentage: number; // NEW
}
```

#### 3. API Endpoint Updates

- Update `/api/drops/admin/upcoming/route.ts`
- Update `/api/drops/admin/past/route.ts`
- Ensure proper error handling for new calculated fields

#### 4. Frontend Integration

- Update drops page to use real data instead of hard-coded values
- Add proper loading states for calculated fields
- Implement error handling for missing data

## 🔄 Migration Strategy

### Phase 1: UI Structure (Current)

- ✅ Implement new column layout
- ✅ Add hard-coded placeholder data
- ✅ Validate design and user experience
- ✅ Test all existing functionality

### Phase 2: Database Integration (Future)

1. **Create enhanced database functions**
2. **Test functions with sample data**
3. **Update TypeScript interfaces**
4. **Update API endpoints**
5. **Replace hard-coded values with real data**
6. **Add loading states and error handling**
7. **Performance testing with large datasets**

## 📈 Benefits After Implementation

### Business Intelligence

- **Inventory Efficiency**: See how much inventory is actually needed
- **Waste Reduction**: Track loss patterns to optimize preparation
- **Delivery Performance**: Monitor completion rates for operational improvements
- **Demand Forecasting**: Historical sold vs inventory data for better planning

### Operational Insights

- **Real-time Metrics**: Live view of drop performance
- **Trend Analysis**: Compare drops over time
- **Location Performance**: See which locations have better completion rates
- **Inventory Optimization**: Reduce waste by better demand prediction

## 🚨 Considerations

### Performance

- New JOINs may impact query performance with large datasets
- Consider adding database indexes for `orders.drop_id` and `order_products.order_id`
- Monitor query execution time after implementation

### Data Accuracy

- Ensure order status updates properly reflect in completion percentage
- Handle edge cases (drops with no orders, cancelled orders, etc.)
- Validate calculations against business logic

### Backwards Compatibility

- Maintain existing `total_available` field during transition
- Ensure existing functionality continues to work
- Plan gradual migration of dependent components

---

**Status**: Phase 1 Complete - UI Structure with Hard-coded Values  
**Next**: Phase 2 - Database Integration (Scheduled for future sprint)  
**Last Updated**: Current Date  
**Owner**: Development Team
