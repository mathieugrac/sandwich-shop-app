# Sandwich Shop Pre-Order App V1.0 - Development Specification

## Project Summary

### Business Context
We are developing a custom web application for a local sandwich shop to handle pre-orders during lunch rush hours. The shop has limited daily inventory and needs to prevent overselling while providing customers with a convenient ordering experience.

### Problem Statement
- Manual phone orders create bottlenecks during lunch rush
- No real-time inventory visibility leads to customer disappointment
- Cash-only transactions result in no-shows and revenue loss
- Staff overwhelmed with order-taking instead of food preparation

### V1.0 Goals
Build a minimum viable product (MVP) that allows customers to:
- View available sandwiches for the day
- Place pre-orders with pickup times
- Receive order confirmations via email
- Enable shop owner to manage orders efficiently

### Success Metrics for V1.0
- 10+ orders per day through the app
- <2 minutes average order completion time
- 90%+ order completion rate
- Reduced phone call volume during lunch rush

---

## Tech Stack & Architecture

### Frontend
- **Framework:** Next.js 14 with App Router
- **Styling:** Tailwind CSS
- **TypeScript:** Yes (strongly recommended)
- **State Management:** React Query (TanStack Query) for server state
- **Form Handling:** React Hook Form with Zod validation
- **UI Components:** Shadcn

### Backend & Database
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth (admin only for V1.0)
- **Real-time:** Supabase Realtime (foundation for future versions)
- **File Storage:** Supabase Storage (for product images)

### Hosting & Deployment
- **Frontend Hosting:** Vercel
- **Domain:** Connect custom domain
- **SSL:** Automatic via Vercel
- **Environment:** Production + Preview environments

### External Services
- **Email:** Supabase + Resend or SendGrid for transactional emails
- **Analytics:** Vercel Analytics (built-in)
- **Monitoring:** Vercel monitoring + Supabase dashboard

---

## Database Schema

### Core Tables

```sql
-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category VARCHAR(50) DEFAULT 'sandwich',
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily inventory (manually set each morning)
CREATE TABLE daily_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_quantity INTEGER NOT NULL,
  reserved_quantity INTEGER DEFAULT 0,
  available_quantity INTEGER GENERATED ALWAYS AS (total_quantity - reserved_quantity) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, date)
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(20) UNIQUE NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  pickup_time TIME NOT NULL,
  pickup_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'ready', 'completed', 'cancelled')),
  total_amount DECIMAL(10,2) NOT NULL,
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin users (shop owner/staff)
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Database Functions

```sql
-- Function to generate unique order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to reserve inventory
CREATE OR REPLACE FUNCTION reserve_inventory(p_product_id UUID, p_date DATE, p_quantity INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  available_qty INTEGER;
BEGIN
  SELECT available_quantity INTO available_qty
  FROM daily_inventory
  WHERE product_id = p_product_id AND date = p_date;
  
  IF available_qty >= p_quantity THEN
    UPDATE daily_inventory
    SET reserved_quantity = reserved_quantity + p_quantity,
        updated_at = NOW()
    WHERE product_id = p_product_id AND date = p_date;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Public read access for active products
CREATE POLICY "Public can view active products" ON products
  FOR SELECT USING (active = true);

-- Public read access for current inventory
CREATE POLICY "Public can view current inventory" ON daily_inventory
  FOR SELECT USING (date >= CURRENT_DATE);

-- Authenticated admin access for orders
CREATE POLICY "Admin can manage orders" ON orders
  FOR ALL USING (auth.role() = 'authenticated');

-- Public can insert orders (customer orders)
CREATE POLICY "Anyone can create orders" ON orders
  FOR INSERT WITH CHECK (true);
```

---

## Application Features & User Stories

### Customer-Facing Features

#### Product Catalog
- **User Story:** As a customer, I want to see today's available sandwiches with descriptions and prices
- **Acceptance Criteria:**
  - Display all active products for today
  - Show remaining quantity for each item
  - Display "Sold Out" when quantity = 0
  - Mobile-responsive grid layout
  - Product images (placeholder if none)

#### Order Placement
- **User Story:** As a customer, I want to select items and specify pickup time
- **Acceptance Criteria:**
  - Add/remove items from cart
  - Select pickup time in 15-minute intervals (11:30 AM - 2:00 PM)
  - Validate inventory availability in real-time
  - Calculate total price automatically
  - Require customer contact information

#### Order Confirmation
- **User Story:** As a customer, I want to receive confirmation of my order
- **Acceptance Criteria:**
  - Generate unique order number
  - Send email confirmation immediately
  - Display order summary on screen
  - Include pickup instructions
  - Reserve inventory temporarily

### Admin Features

#### Inventory Management
- **User Story:** As a shop owner, I want to set daily inventory each morning
- **Acceptance Criteria:**
  - Simple form to set quantities for each product
  - Default to previous day's quantities
  - One-click "Set All to 10" option
  - Save and immediately update customer-facing inventory

#### Order Management
- **User Story:** As a shop owner, I want to view and manage today's orders
- **Acceptance Criteria:**
  - List all orders for today
  - Filter by status (pending, confirmed, ready, completed)
  - Update order status
  - View customer contact information
  - Print order details

---

## Development Phases for V1.0

### Phase 1: Project Setup

**Tasks:**
1. Initialize Next.js project with TypeScript
2. Set up Tailwind CSS and basic styling
3. Configure Supabase project
4. Set up database schema and RLS policies
5. Configure environment variables
6. Set up Vercel deployment pipeline

**Deliverables:**
- Working Next.js app deployed to Vercel
- Supabase database with all tables created
- Basic routing structure
- Environment configuration

### Phase 2: Core UI Components

**Tasks:**
1. Create responsive layout components
2. Build product card component
3. Create shopping cart component
4. Implement basic form components
5. Add loading states and error handling
6. Set up Tailwind component patterns

**Deliverables:**
- Reusable UI component library
- Responsive layout working on mobile/desktop
- Basic design system established

### Phase 3: Customer Features (Week 2-3)

**Tasks:**
1. Implement product catalog with Supabase integration
2. Build shopping cart functionality
3. Create order form with validation
4. Implement inventory checking
5. Add pickup time selection
6. Create order confirmation page

**Deliverables:**
- Complete customer ordering flow
- Real-time inventory integration
- Form validation and error handling

### Phase 4: Admin Dashboard (Week 3-4)

**Tasks:**
1. Set up Supabase authentication
2. Create admin login page
3. Build inventory management interface
4. Implement order management dashboard
5. Add order status updates
6. Create basic reporting

**Deliverables:**
- Secure admin authentication
- Inventory management system
- Order management dashboard

### Phase 5: Email & Polish (Week 4)
**Duration:** 3-5 days

**Tasks:**
1. Set up email service integration
2. Create order confirmation email template
3. Implement email sending functionality
4. Add error handling and edge cases
5. Performance optimization
6. Final testing and bug fixes

**Deliverables:**
- Working email confirmations
- Polished user experience
- Comprehensive error handling

---

## Technical Implementation Details

### File Structure
```
src/
├── app/
│   ├── (admin)/
│   │   ├── admin/
│   │   │   ├── dashboard/
│   │   │   ├── inventory/
│   │   │   └── orders/
│   │   └── login/
│   ├── api/
│   │   ├── orders/
│   │   └── inventory/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   ├── customer/
│   ├── admin/
│   └── shared/
├── lib/
│   ├── supabase/
│   ├── validations/
│   └── utils/
└── types/
```

### Key Components to Build

#### Customer Components
```typescript
// Product catalog
<ProductGrid products={products} inventory={inventory} />
<ProductCard product={product} onAddToCart={handleAdd} />

// Shopping cart
<ShoppingCart items={cartItems} onUpdateCart={handleUpdate} />
<CartItem item={item} onRemove={handleRemove} />

// Order form
<OrderForm cart={cart} onSubmit={handleOrderSubmit} />
<PickupTimeSelector onSelect={handleTimeSelect} />
<CustomerInfoForm onSubmit={handleInfoSubmit} />

// Order confirmation
<OrderConfirmation order={order} />
```

#### Admin Components
```typescript
// Inventory management
<InventoryManager products={products} inventory={inventory} />
<InventoryForm onSubmit={handleInventoryUpdate} />

// Order management
<OrderDashboard orders={orders} />
<OrderList orders={orders} onStatusUpdate={handleStatusUpdate} />
<OrderCard order={order} />
```

### API Routes

#### Customer APIs
```typescript
// GET /api/products - Get active products
// GET /api/inventory/[date] - Get inventory for date
// POST /api/orders - Create new order
// GET /api/orders/[id] - Get order details
```

#### Admin APIs
```typescript
// PUT /api/inventory - Update daily inventory
// GET /api/admin/orders - Get all orders
// PUT /api/admin/orders/[id] - Update order status
// GET /api/admin/dashboard - Get dashboard stats
```

### Environment Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email Service
RESEND_API_KEY=your_resend_key

# App Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_SHOP_NAME="Your Sandwich Shop"
NEXT_PUBLIC_SHOP_EMAIL=orders@yourdomain.com
NEXT_PUBLIC_SHOP_PHONE="+1234567890"

# Admin
ADMIN_EMAIL=admin@yourdomain.com
```

### Validation Schemas
```typescript
// Order validation with Zod
const orderSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().optional(),
  pickupTime: z.string(),
  pickupDate: z.string(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().min(1),
    unitPrice: z.number().positive()
  })).min(1, "At least one item required"),
  specialInstructions: z.string().optional()
});
```

---

## Testing Strategy

### Manual Testing Checklist

#### Customer Flow
- [ ] View products on mobile and desktop
- [ ] Add items to cart
- [ ] Remove items from cart
- [ ] Select pickup time
- [ ] Fill out customer information
- [ ] Submit order successfully
- [ ] Receive email confirmation
- [ ] View order confirmation page

#### Admin Flow
- [ ] Login to admin dashboard
- [ ] Set daily inventory
- [ ] View today's orders
- [ ] Update order status
- [ ] View order details

#### Edge Cases
- [ ] Try to order more than available inventory
- [ ] Submit order with invalid email
- [ ] Try to select past pickup time
- [ ] Test with no inventory set
- [ ] Test email delivery failures

### Performance Requirements
- [ ] Page load time < 3 seconds
- [ ] Cart updates < 500ms
- [ ] Order submission < 2 seconds
- [ ] Mobile responsive on all screen sizes
- [ ] Works offline for viewing (basic PWA features)

---

## Deployment Configuration

### Vercel Configuration
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "outputDirectory": ".next"
}
```

### Environment Setup
1. Connect Vercel to GitHub repository
2. Set up production and preview environments
3. Configure environment variables in Vercel dashboard
4. Set up custom domain
5. Enable Vercel Analytics

### Supabase Configuration
1. Create new Supabase project
2. Run database migrations
3. Set up RLS policies
4. Configure authentication settings
5. Set up email templates

---

## Content Requirements

### Sample Products Data
```sql
INSERT INTO products (name, description, price, category, sort_order) VALUES
('Nutty Beet', 'honey-roasted beetroot, creamy labneh, zaatar, crunchy hazelnuts, pickled oignons and fresh mint', 9, 'sandwich', 1),
('Umami Mush', 'Marinated oyster mushrooms, crispy buckwheat, pickled apple, fresh coriander and miso butter', 10, 'sandwich', 2),
('Burgundy Beef', 'wine-glazed beef cheek, caramelized onions, pickled carrots, arugula and garlic butter', 11, 'sandwich', 3);
```

### Email Templates
```html
<!-- Order Confirmation Email -->
<h1>Order Confirmation - {{orderNumber}}</h1>
<p>Hi {{customerName}},</p>
<p>Thanks for your order! Here are the details:</p>

<h3>Pickup Information</h3>
<p><strong>Date:</strong> {{pickupDate}}</p>
<p><strong>Time:</strong> {{pickupTime}}</p>
<p><strong>Location:</strong> [Shop Address]</p>

<h3>Order Details</h3>
{{#each items}}
<p>{{quantity}}x {{productName}} - ${{totalPrice}}</p>
{{/each}}

<p><strong>Total: ${{totalAmount}}</strong></p>

<p>Please arrive within 15 minutes of your pickup time. Call us at {{shopPhone}} if you need to make changes.</p>
```

---

## Launch Checklist

### Pre-Launch (Final Week)
- [ ] All features tested and working
- [ ] Email delivery tested
- [ ] Mobile responsiveness verified
- [ ] Admin dashboard functional
- [ ] Database backup configured
- [ ] Error monitoring set up
- [ ] Performance optimized

### Launch Day
- [ ] Deploy to production
- [ ] Test complete customer flow
- [ ] Test admin dashboard
- [ ] Monitor error logs
- [ ] Set daily inventory
- [ ] Announce to customers

### Post-Launch (Week 1)
- [ ] Monitor order volume
- [ ] Track conversion rates
- [ ] Collect customer feedback
- [ ] Monitor system performance
- [ ] Document issues for V1.1

---

## Support & Maintenance

### Daily Tasks
- Set inventory quantities each morning
- Monitor incoming orders
- Update order statuses
- Check email delivery

### Weekly Tasks
- Review order analytics
- Check system performance
- Backup database
- Plan menu updates

### Monthly Tasks
- Review customer feedback
- Plan feature improvements
- Update product catalog
- Analyze business metrics

---

## Next Steps After V1.0

Once V1.0 is stable and generating orders:
1. **V1.1:** Add Stripe payment integration
2. **V1.2:** Implement real-time inventory updates
3. **V2.0:** Add SMS notifications and customer accounts
4. **V2.1:** Build analytics dashboard
5. **V3.0:** Prepare for POS integration

This foundation will support all future enhancements while keeping the initial development focused and achievable.