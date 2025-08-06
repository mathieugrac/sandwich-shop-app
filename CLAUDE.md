# Sandwich Shop Pre-Order App V1.0 - Development Specification

## 📊 Project Status Overview

| Phase                           | Status         | Progress | Next Action               |
| ------------------------------- | -------------- | -------- | ------------------------- |
| **Phase 1: Project Setup**      | ✅ COMPLETED   | 100%     | -                         |
| **Phase 2: Core UI Components** | ✅ COMPLETED   | 100%     | -                         |
| **Phase 3: Customer Features**  | 🔄 IN PROGRESS | 85%      | Implement order placement |
| **Phase 4: Admin Dashboard**    | ⏳ PENDING     | 0%       | Wait for Phase 3          |
| **Phase 5: Email & Polish**     | ⏳ PENDING     | 0%       | Wait for Phase 4          |

**Current Focus:** Phase 3 - Customer ordering flow and Supabase integration

**Next Milestone:** Complete order placement with database integration

---

## 🎯 Key Design Decisions & Architecture

### Layout Strategy

- **Home Page:** Uses MainLayout with Header, Footer, and StickyBasketButton
- **Cart Page:** Custom layout without Header/Footer for focused ordering experience
- **Mobile-First:** 480px max-width container for optimal mobile experience
- **Sticky Elements:** Header and Place Order button remain visible during scroll

### Cart & Navigation Flow

- **Cart Persistence:** localStorage for cart items across page refreshes
- **Navigation:** StickyBasketButton navigates to `/cart` page
- **Empty Cart Handling:** Automatic redirect to home page
- **Back Navigation:** Close icon uses `router.back()` for natural flow

### Pickup Time Configuration

- **Time Slots:** 15-minute intervals between 12:00 PM and 2:00 PM
- **Pre-order Cutoff:** 30 minutes before 12:00 PM (11:30 AM)
- **UI Layout:** Select aligned to the right of the label for better UX
- **Validation:** Required field for order placement

### Inventory Management Strategy

- **Real-time Validation:** Check availability when adding to cart
- **Temporary Holding:** 5-minute hold while user is on cart page
- **Stock Display:** "Sold Out", "Low Stock", and quantity indicators
- **Future Implementation:** Supabase real-time updates for inventory changes

---

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

- **Email:** Supabase + Resend for transactional emails
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

#### Shopping Cart Experience

- **User Story:** As a customer, I want to add items to my cart and view them in a dedicated cart page
- **Acceptance Criteria:**
  - ✅ Add items to cart from product cards
  - ✅ Sticky basket button appears with item count and total
  - ✅ Navigate to dedicated `/cart` page
  - ✅ Cart persists across page refreshes (localStorage)
  - ✅ Modify quantities with +/- buttons
  - ✅ Remove items from cart
  - ✅ Real-time price calculation
  - ✅ Empty cart redirects to home page

#### Order Placement

- **User Story:** As a customer, I want to review my order and specify pickup details
- **Acceptance Criteria:**
  - ✅ View all cart items with quantities and prices
  - ✅ Add special instructions via textarea
  - ✅ Select pickup time (12:00-14:00, 15-min intervals)
  - ✅ View pickup location with Google Maps integration
  - ✅ See order summary with subtotal and total
  - ✅ Place order with validation (time required)
  - ✅ Clean, focused interface without distractions

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

### Phase 1: Project Setup ✅ COMPLETED

**Tasks:**

- [x] Initialize Next.js project with TypeScript
- [x] Set up Tailwind CSS and basic styling
- [x] Configure Supabase project
- [x] Set up database schema and RLS policies
- [x] Configure environment variables
- [x] Set up Vercel deployment pipeline

**Deliverables:**

- [x] Working Next.js app deployed to Vercel
- [x] Supabase database with all tables created
- [x] Basic routing structure
- [x] Environment configuration

**Status:** ✅ **COMPLETED** - All foundational setup is complete

### Phase 2: Core UI Components ✅ COMPLETED

**Tasks:**

- [x] Create responsive layout components (Header, Footer, MainLayout, Container)
- [x] Build product card component (SandwichItem with stock status)
- [x] Create shopping cart page with full functionality
- [x] Implement cart context with localStorage persistence
- [x] Add sticky basket button with navigation
- [x] Set up Tailwind component patterns with Shadcn

**Deliverables:**

- [x] Reusable UI component library
- [x] Responsive layout working on mobile/desktop
- [x] Shopping cart page with all features
- [x] Cart state management with persistence
- [x] Navigation flow between home and cart

**Status:** ✅ **COMPLETED** - All core UI components are built and functional

**Key Features Implemented:**

- **Product Cards:** Display sandwiches with stock status, pricing, and add-to-cart functionality
- **Cart Context:** Global state management with localStorage persistence
- **Sticky Basket Button:** Appears when items are in cart, navigates to cart page
- **Cart Page:** Dedicated page with items, quantity controls, pickup time selection, and order placement
- **Responsive Design:** Mobile-first approach with 480px max-width container

### Phase 3: Customer Features 🔄 IN PROGRESS

**Tasks:**

- [x] Build shopping cart functionality (completed in Phase 2)
- [x] Create order form with validation (cart page with pickup time)
- [x] Add pickup time selection (12:00-14:00, 15-min intervals)
- [ ] Implement product catalog with Supabase integration
- [ ] Implement inventory checking with real-time validation
- [ ] Create order confirmation page
- [ ] Add customer information form

**Deliverables:**

- [x] Complete customer ordering flow (UI only)
- [x] Form validation and error handling (basic)
- [ ] Real-time inventory integration
- [ ] Database integration for orders

**Status:** 🔄 **IN PROGRESS** - 85% complete, needs Supabase integration

**Current Implementation:**

- **Product Catalog:** Mock data with 3 sandwiches (Umami Mush, Nutty Beet, Bourgundy Beef)
- **Cart Functionality:** Full cart management with localStorage persistence
- **Order Form:** Complete cart page with pickup time, location, and order placement
- **UI Flow:** Home → Add Items → Cart → Review → Place Order (console log)

### Phase 4: Admin Dashboard ⏳ PENDING

**Tasks:**

- [ ] Set up Supabase authentication
- [ ] Create admin login page
- [ ] Build inventory management interface
- [ ] Implement order management dashboard
- [ ] Add order status updates
- [ ] Create basic reporting

**Deliverables:**

- [ ] Secure admin authentication
- [ ] Inventory management system
- [ ] Order management dashboard

**Status:** ⏳ **PENDING** - Waiting for Phase 3 completion

### Phase 5: Email & Polish ⏳ PENDING

**Tasks:**

- [ ] Set up email service integration
- [ ] Create order confirmation email template
- [ ] Implement email sending functionality
- [ ] Add error handling and edge cases
- [ ] Performance optimization
- [ ] Final testing and bug fixes

**Deliverables:**

- [ ] Working email confirmations
- [ ] Polished user experience
- [ ] Comprehensive error handling

**Status:** ⏳ **PENDING** - Final phase, depends on all previous phases

---

## 📋 Task Tracking & Notes

### ✅ Recently Completed

- [x] **2025-08-04:** Project initialization with Next.js 14 + TypeScript
- [x] **2025-08-04:** Supabase project setup and database schema
- [x] **2025-08-04:** Environment variables configuration
- [x] **2025-08-04:** Vercel deployment pipeline setup
- [x] **2025-08-04:** Dependencies installation (React Hook Form, Zod, TanStack Query)
- [x] **2025-08-05:** Shadcn UI installation and component setup
- [x] **2025-08-05:** Responsive layout components (Header, Footer, MainLayout, Container)
- [x] **2025-01-XX:** Product catalog implementation with SandwichItem component
- [x] **2025-01-XX:** Cart context implementation with localStorage persistence
- [x] **2025-01-XX:** StickyBasketButton with navigation to cart page
- [x] **2025-01-XX:** Complete cart page with order form functionality
- [x] **2025-01-XX:** Pickup time selection with 15-minute intervals
- [x] **2025-01-XX:** Location integration with Google Maps
- [x] **2025-01-XX:** Order summary and place order button
- [x] **2025-01-XX:** Custom cart page layout without header/footer
- [x] **2025-01-XX:** Stock status display (Available, Low Stock, Sold Out)

### 🔄 Current Tasks

- [x] **Phase 2.1:** Install and configure Shadcn UI components
- [x] **Phase 2.2:** Create responsive layout components
- [x] **Phase 2.3:** Build product card component
- [x] **Phase 2.4:** Create shopping cart component
- [x] **Phase 2.5:** Implement basic form components
- [ ] **Phase 3.1:** Integrate Supabase for product catalog
- [ ] **Phase 3.2:** Implement real-time inventory checking
- [ ] **Phase 3.3:** Add customer information form
- [ ] **Phase 3.4:** Create order confirmation page
- [ ] **Phase 3.5:** Implement order placement with database

### ⚠️ Current Blockers

- None currently

### 📝 Notes

- Database schema is ready with sample products
- Supabase client is configured
- All dependencies are installed
- Complete UI flow is implemented and functional
- Ready to integrate with Supabase for real data

### 🎯 Next Priority: Phase 3 Completion

**Immediate Next Steps:**

1. **Supabase Integration:** Replace mock data with real database queries
2. **Inventory Management:** Implement real-time stock checking
3. **Order Placement:** Connect cart to database for actual order creation
4. **Customer Form:** Add customer information collection
5. **Order Confirmation:** Create confirmation page and email system

**Success Criteria for Phase 3:**

- ✅ Complete customer ordering flow (UI)
- [ ] Real database integration
- [ ] Working order placement
- [ ] Email confirmation system
- [ ] Inventory validation

---

## 🚀 Current User Flow & Technical Implementation

### Complete Customer Journey (Implemented)

1. **Home Page (`/`)**
   - View today's menu with 3 sandwiches
   - See stock status (Available, Low Stock, Sold Out)
   - Add items to cart using + button
   - Sticky basket button appears with count and total

2. **Cart Page (`/cart`)**
   - Review all cart items with quantities
   - Modify quantities with +/- buttons
   - Add special instructions via textarea
   - Select pickup time (12:00-14:00, 15-min intervals)
   - View pickup location with Google Maps link
   - See order summary with pricing
   - Place order (currently logs to console)

### Technical Architecture

#### File Structure (Current)

```
src/
├── app/
│   ├── cart/
│   │   └── page.tsx          # Cart page with order form
│   ├── globals.css
│   ├── layout.tsx            # Root layout with CartProvider
│   └── page.tsx              # Home page with product catalog
├── components/
│   ├── ui/                   # Shadcn UI components
│   ├── customer/
│   │   ├── SandwichItem.tsx  # Product card component
│   │   ├── StickyBasketButton.tsx # Navigation to cart
│   │   └── AboutSection.tsx  # Home page content
│   └── shared/
│       ├── MainLayout.tsx    # Layout for home page
│       ├── Header.tsx        # Home page header
│       └── Footer.tsx        # Home page footer
├── lib/
│   └── cart-context.tsx      # Cart state management
└── types/
    └── database.ts           # Supabase types
```

#### Key Components

**Cart Context (`src/lib/cart-context.tsx`)**

- Global state management for cart items
- localStorage persistence across page refreshes
- Methods: addToCart, removeFromCart, updateQuantity, clearCart
- Computed values: totalItems, totalPrice

**StickyBasketButton (`src/components/customer/StickyBasketButton.tsx`)**

- Appears when cart has items
- Shows item count and total price
- Navigates to `/cart` page on click
- Hidden on cart page itself

**Cart Page (`src/app/cart/page.tsx`)**

- Custom layout without header/footer
- Sticky header with close and trash icons
- Items section with quantity controls
- Pickup time selection (aligned right)
- Location with Google Maps integration
- Order summary and place order button

### Design Decisions & UX Patterns

#### Layout Strategy

- **Home Page:** Full layout with header, footer, and sticky basket button
- **Cart Page:** Minimal layout focused on order completion
- **Mobile-First:** 480px max-width for optimal mobile experience

#### Navigation Flow

- **Natural Back Navigation:** Close icon uses `router.back()`
- **Empty Cart Handling:** Automatic redirect to home
- **Cart Persistence:** Survives page refreshes via localStorage

#### Pickup Time UX

- **Time Slots:** 15-minute intervals (12:00, 12:15, 12:30, etc.)
- **UI Layout:** Select aligned to the right of the label
- **Validation:** Required field for order placement

#### Stock Status Display

- **Available:** Shows quantity remaining
- **Low Stock:** "X sandwiches left, hurry up!" (≤3 items)
- **Sold Out:** "SOLD OUT" with disabled add button

### Mock Data Structure

```typescript
const sandwiches = [
  {
    id: 1,
    name: 'Umami Mush',
    description: 'Marinated oyster mushrooms, crispy buckwheat...',
    price: 10.0,
    availableStock: 20,
    imageUrl: undefined,
  },
  // ... more items
];
```

### Current Limitations (To Be Addressed)

1. **No Database Integration:** Using mock data instead of Supabase
2. **No Real Inventory:** Stock levels are static
3. **No Order Placement:** Currently just logs to console
4. **No Customer Info:** Missing customer form
5. **No Email Confirmation:** No order confirmation system

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
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerEmail: z.string().email('Invalid email address'),
  customerPhone: z.string().optional(),
  pickupTime: z.string(),
  pickupDate: z.string(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().min(1),
        unitPrice: z.number().positive(),
      })
    )
    .min(1, 'At least one item required'),
  specialInstructions: z.string().optional(),
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

<p>
  Please arrive within 15 minutes of your pickup time. Call us at {{shopPhone}}
  if you need to make changes.
</p>
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
