# Fomé, Sandwich Shop Pre-Order App - Essential Reference

## 🎯 Project Overview

**Business Context:** Custom web app for local sandwich shop in Lisbon called Fomé to handle pre-orders during lunch rush hours. Uses “sell-based” system where inventory and orders are tied to specific “sells” (events) rather than daily inventory.

**Target Audience:** International workers in coworking space, requiring international phone number support.

**Current Status:** Phase 6 (New Data Model Implementation) - 0% complete. Starting implementation of new drop-based data model structure.

---

## 🚧 Development Phases

🟢 Phase 1: Project Setup
🟢 Phase 2: Core UI Components
🟢 Phase 3: Customer Features
🟢 Phase 4: Admin Dashboard
🟢 Phase 4.5: Business Model Adaptation
🟠 Phase 5: Email & Polish
**→** Phase 6 : Update Logic & database **← next focus**
🔴 Phase 7 : UI Design of the Customer side
🔴 Phase 8 : Redesign of the dashboard
🔴 Phase 9 : Stripe integration

---

## 🚧 Phase 6: New Data Model Implementation - Detailed Plan

### **Phase 6A: New Data Model Implementation (Week 1)**

1. **Implement new data model structure** with DROPS instead of SELLS
   - Drops: date, location_id, status (upcoming, active, completed, cancelled)
   - Drop_products: stock_quantity, reserved_quantity, available_quantity, selling_price
   - Order_products: links to drop_products instead of separate product references
2. **Update location structure** with pickup hours at location level
   - Locations: pickup_hour_start, pickup_hour_end instead of delivery_timeframe
3. **Enhance product structure** with production costs and better categories
   - Products: production_cost field, categories (sandwich, side, dessert, beverage)
4. **Implement new database functions** for drop-based operations

### **Phase 6B: New Home Page & Calendar (Week 2)**

1. **Redesign home page** with project description and upcoming drops calendar
   - Show all future drops (not just next active)
   - Display location info and available quantities
   - "18 left 🥪" shows total available sandwiches
2. **Create Menu page** (`/menu`) for active drops
   - Unique URL for each drop (e.g., `/menu/[drop-id]`)
   - Product catalog with real-time inventory
3. **Update navigation flow** (Home → Menu → Cart → Checkout → Confirmation)
4. **Implement location display** in calendar and drop details

### **Phase 6C: Admin Platform Updates (Week 3) ✅ COMPLETED**

1. **✅ Simplified Admin Dashboard** - Clean navigation with 5 management sections
2. **✅ Enhanced Product Management** - Full CRUD operations with categories (sandwich, drink, dessert)
3. **✅ Enhanced Location Management** - Full CRUD operations for delivery locations
4. **✅ Enhanced Sell Management** - Location selection and integrated inventory modal
5. **✅ New Clients Management** - Customer info, order history, and revenue tracking
6. **✅ New Orders Management** - All orders grouped by sell date with filtering and search

### **Phase 6D: Client Management & Polish (Week 4) ✅ COMPLETED**

1. **✅ Clients table and management system** - Full CRUD operations
2. **✅ Client analytics** - Order count and total revenue per client
3. **✅ Order history modal** - View all orders for each client
4. **✅ Admin platform polish** - Consistent design, clean navigation, proper error handling
5. **✅ Database integration** - All tables properly connected and functional

### **Key Business Logic Changes**

- **Multiple drops per date** possible (different locations)
- **Location-based pickup hours** (moved from global to location-specific)
- **Auto-completion** 30 minutes after pickup hours end
- **Cart persistence** across page refreshes maintained
- **Admin access** to all drops regardless of status
- **Inventory management** integrated into drop editing (not separate page)
- **Price capture** at drop level to prevent price changes affecting existing orders

### **Phase 6 Summary - COMPLETED ✅**

**Phase 6 is now focused on implementing the new data model!** We will:

- **🔄 Migrate from SELLS to DROPS** based system
- **🔄 Update database schema** with new table structure
- **🔄 Implement new inventory management** at drop_product level
- **🔄 Update admin platform** to work with new data model
- **🔄 Enhance analytics capabilities** with improved data structure
- **🔄 Maintain all existing functionality** while improving data model

**The new data model will provide better analytics, cleaner relationships, and improved business logic.**

---

## 🏗️ Business Model & Architecture

### Sell-Based System

- **Sell Creation:** Create sells in advance for specific dates and delivery point
- **Inventory Management:** Each sell has its own inventory quantities
- **Order Linking:** All orders are linked to specific sells
- **Customer Access:** Customers only see the next active sell’s menu
- **Admin Focus:** Order management focuses on the next active sell

### Order Status Flow

- **Pending:** Needs admin confirmation (default state)
- **Confirmed:** Manually accepted, inventory updated
- **Prepared:** Sandwich wrapped and ready
- **Completed:** Delivered and payment received

### Admin Workflow

- **Primary Task:** “Inbox 0” for pending orders
- **Order Management:** Clickable status cards for quick filtering
- **Dashboard Priority:** View Orders → Manage Drops → Manage Inventory
- **Default Focus:** Pending orders when landing on Order Management

---

## 🛠️ Tech Stack

### Frontend

- **Framework:** Next.js 14 with App Router
- **Styling:** Tailwind CSS + Shadcn UI components
- **Icons** :  Lucide React (version ^0.536.0)
- **TypeScript:** Yes
- **State Management:** React Context for cart, React Query for server state
- **Form Handling:** React Hook Form with Zod validation

### Backend & Database

- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth (admin only)
- **Real-time:** Supabase Realtime
- **File Storage:** Supabase Storage

### Hosting & Services

- **Frontend:** Vercel
- **Email:** Resend API
- **Analytics:** Vercel Analytics

---

## 🗄️ Database Schema

### Core Tables

```sql
-- Products table (catalogue of food products)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN ('sandwich', 'side', 'dessert', 'beverage')),
  sell_price DECIMAL(10,2) NOT NULL,
  production_cost DECIMAL(10,2) NOT NULL,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product images table (multiple images per product)
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Locations table (delivery/pickup points)
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  location_url TEXT,
  pickup_hour_start TIME NOT NULL,
  pickup_hour_end TIME NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drops table (sell events at specific time & location)
CREATE TABLE drops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  location_id UUID REFERENCES locations(id) ON DELETE RESTRICT,
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop products table (product quantities available for specific drops)
CREATE TABLE drop_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id UUID REFERENCES drops(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  stock_quantity INTEGER NOT NULL CHECK (stock_quantity >= 0),
  reserved_quantity INTEGER DEFAULT 0 CHECK (reserved_quantity >= 0),
  available_quantity INTEGER GENERATED ALWAYS AS (stock_quantity - reserved_quantity) STORED,
  selling_price DECIMAL(10,2) NOT NULL, -- Captured price at drop level
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(drop_id, product_id)
);

-- Clients table (customers who order food)
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(email)
);

-- Orders table (customer orders for specific drops)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(20) UNIQUE NOT NULL,
  drop_id UUID REFERENCES drops(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  pickup_time TIME NOT NULL, -- 15-min slot within location pickup hours
  order_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'prepared', 'completed', 'cancelled')),
  total_amount DECIMAL(10,2) NOT NULL,
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order products table (products ordered by customers)
CREATE TABLE order_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  drop_product_id UUID REFERENCES drop_products(id) ON DELETE RESTRICT,
  order_quantity INTEGER NOT NULL CHECK (order_quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Key Functions

```sql
-- Function to generate unique order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Get next active drop
CREATE OR REPLACE FUNCTION get_next_active_drop()
RETURNS TABLE (id UUID, date DATE, status VARCHAR(20), location_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT d.id, d.date, d.status, d.location_id
  FROM drops d
  JOIN locations l ON d.location_id = l.id
  WHERE d.status = 'active'
    AND d.date >= CURRENT_DATE
    AND l.active = true
  ORDER BY d.date ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Reserve drop product inventory
CREATE OR REPLACE FUNCTION reserve_drop_product_inventory(
  p_drop_product_id UUID, p_quantity INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  available_qty INTEGER;
BEGIN
  SELECT available_quantity INTO available_qty
  FROM drop_products
  WHERE id = p_drop_product_id;

  IF available_qty >= p_quantity THEN
    UPDATE drop_products
    SET reserved_quantity = reserved_quantity + p_quantity,
        updated_at = NOW()
    WHERE id = p_drop_product_id;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Auto-complete expired drops
CREATE OR REPLACE FUNCTION auto_complete_expired_drops()
RETURNS INTEGER AS $$
DECLARE
  completed_count INTEGER := 0;
  drop_record RECORD;
BEGIN
  -- Find drops that should be auto-completed (30 minutes after pickup hours end)
  FOR drop_record IN
    SELECT d.id, d.date, l.pickup_hour_end
    FROM drops d
    JOIN locations l ON d.location_id = l.id
    WHERE d.status = 'active'
      AND d.date <= CURRENT_DATE
      AND l.pickup_hour_end IS NOT NULL
  LOOP
    -- For now, complete drops from previous days
    -- In production, parse pickup_hour_end and check actual time
    IF drop_record.date < CURRENT_DATE THEN
      UPDATE drops
      SET status = 'completed', updated_at = NOW()
      WHERE id = drop_record.id;
      completed_count := completed_count + 1;
    END IF;
  END LOOP;

  RETURN completed_count;
END;
$$ LANGUAGE plpgsql;

-- Get or create client
CREATE OR REPLACE FUNCTION get_or_create_client(
  p_name VARCHAR(100), p_email VARCHAR(255), p_phone VARCHAR(20))
RETURNS UUID AS $$
DECLARE
  client_id UUID;
BEGIN
  -- Try to find existing client by email
  SELECT id INTO client_id
  FROM clients
  WHERE email = p_email;

  IF client_id IS NOT NULL THEN
    -- Update existing client info if name/phone changed
    UPDATE clients
    SET name = COALESCE(p_name, name),
        phone = COALESCE(p_phone, phone),
        updated_at = NOW()
    WHERE id = client_id;
    RETURN client_id;
  ELSE
    -- Create new client
    INSERT INTO clients (name, email, phone)
    VALUES (p_name, p_email, p_phone)
    RETURNING id INTO client_id;
    RETURN client_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLSALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sells ENABLE ROW LEVEL SECURITY;
ALTER TABLE sell_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
-- Public read access for active productsCREATE POLICY "Public can view active products" ON products
  FOR SELECT USING (active = true);
-- Public read access for active sellsCREATE POLICY "Public can view active sells" ON sells
  FOR SELECT USING (status = 'active');
-- Public read access for sell inventoryCREATE POLICY "Public can view sell inventory" ON sell_inventory
  FOR SELECT USING (true);
-- Authenticated admin access for ordersCREATE POLICY "Admin can manage orders" ON orders
  FOR ALL USING (auth.role() = 'authenticated');
-- Public can insert orders (customer orders)CREATE POLICY "Anyone can create orders" ON orders
  FOR INSERT WITH CHECK (true);
```

---

## Validation Schema

```tsx
// Order validation with Zodconst orderSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),  customerEmail: z.string().email('Invalid email address'),  customerPhone: z.string().optional(),  pickupTime: z.string(),  pickupDate: z.string(),  items: z
    .array(
      z.object({
        productId: z.string().uuid(),        quantity: z.number().min(1),        unitPrice: z.number().positive(),      })
    )
    .min(1, 'At least one item required'),  specialInstructions: z.string().optional(),});
```

---

## 🆕 New Data Model Structure

### Key Changes from Previous Schema

**✅ Improved Structure:**

- **PRODUCTS**: Added `production_cost` field, updated categories to `('sandwich', 'side', 'dessert', 'beverage')`
- **LOCATIONS**: Moved pickup hours to location level (`pickup_hour_start`, `pickup_hour_end`)
- **DROPS**: Replaced "sells" concept with clearer "drops" terminology
- **DROP_PRODUCTS**: Added `selling_price` capture at drop level for price history
- **ORDER_PRODUCTS**: Links directly to drop products instead of separate product references
- **CLIENTS**: Centralized customer management with order history

**🔧 Technical Improvements:**

- **Price Capture**: Selling prices are captured at drop level, preventing price changes from affecting existing orders
- **Inventory Management**: Stock, reserved, and available quantities at drop_product level
- **Better Analytics**: Structure optimized for comprehensive business analytics
- **Cleaner Relationships**: More intuitive table relationships and constraints

**📊 Analytics Capabilities:**

- **Best-selling products** across all drops and time periods
- **Customer insights** with order history and lifetime value
- **Revenue analytics** by drop, location, product category
- **Inventory optimization** with detailed stock tracking
- **Performance metrics** by location and time periods

---

## 🚀 User Flows

### Customer Journey

1. **Home Page (`/`)** - View next active sell’s menu with real-time stock status
2. **Cart Page (`/cart`)** - Review items, select pickup time (12:00-14:00, 15-min intervals)
3. **Checkout Page (`/checkout`)** - Customer information form with validation
4. **Confirmation Page (`/confirmation`)** - Order confirmation with order number

### Admin Journey

1. **Admin Login (`/admin`)** - Supabase Auth authentication
2. **Dashboard (`/admin/dashboard`)** - Overview of next sell orders and revenue
3. **Order Management (`/admin/orders`)** - Process orders with status updates
4. **Sell Management (`/admin/sells`)** - Create and manage sells in advance
5. **Inventory Management (`/admin/inventory`)** - Set quantities per sell

---

## 📁 File Structure

```
src/
├── app/
│   ├── admin/                    # Admin dashboard pages
│   ├── cart/                     # Cart page with order form
│   ├── checkout/                 # Customer information form
│   ├── confirmation/             # Order confirmation page
│   ├── api/                      # API routes
│   └── page.tsx                  # Home page with product catalog
├── components/
│   ├── ui/                       # Shadcn UI components
│   ├── customer/                 # Customer-facing components
│   ├── admin/                    # Admin components
│   └── shared/                   # Shared layout components
├── lib/
│   ├── cart-context.tsx          # Cart state management
│   ├── api/                      # API client functions
│   ├── email.ts                  # Email service integration
│   └── supabase/                 # Supabase client
└── types/
    └── database.ts               # Supabase types
```

---

## 🔧 Key Components

### Cart Context (`src/lib/cart-context.tsx`)

- Global state management for cart items
- localStorage persistence across page refreshes
- Methods: addToCart, removeFromCart, updateQuantity, clearCart

### StickyBasketButton (`src/components/customer/StickyBasketButton.tsx`)

- Appears when cart has items
- Shows item count and total price
- Navigates to `/cart` page on click

### API Routes

- **GET /api/products:** Fetch active products
- **GET /api/inventory/[date]:** Fetch inventory for specific date
- **POST /api/orders:** Create new order with inventory reservation
- **GET /api/drops/next-active:** Get next active drop and its products
- **GET /api/drops:** Get all drops
- **POST /api/drops:** Create new drop
- **GET /api/drops/[id]/inventory:** Get inventory for specific drop
- **PUT /api/drops/[id]/inventory:** Update inventory for specific drop

---

## ⚙️ Environment Variables

```bash
# SupabaseNEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# Email ServiceRESEND_API_KEY=your_resend_key
# App ConfigurationNEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_SHOP_NAME="Your Sandwich Shop"NEXT_PUBLIC_SHOP_EMAIL=orders@yourdomain.com
NEXT_PUBLIC_SHOP_PHONE="+1234567890"# AdminADMIN_EMAIL=admin@yourdomain.com
```

---

## 📧 Email System Status

**✅ Working Features:**

- Resend API integration complete
- Order confirmation emails with professional HTML template
- Status update emails for order status changes

**⚠️ Production Requirements:**

- **Domain Verification Required:** Must verify domain at resend.com/domains
- **From Address:** Update from `onboarding@resend.dev` to verified domain
- **Error Handling:** Improve error handling for email failures

---

## 📝 Key Decisions

### Layout Strategy

- **Home Page:** Full layout with header, footer, and sticky basket button
- **Cart Page:** Minimal layout focused on order completion
- **Mobile-First:** 480px max-width for optimal mobile experience

### Pickup Time Configuration

- **Time Slots:** 15-minute intervals between 12:00 PM and 2:00 PM
- **Pre-order Cutoff:** 30 minutes before 12:00 PM (11:30 AM)

### Stock Status Display

- **Not Available:** Product not offered for this sell (gray)
- **Sold Out:** Product offered but no stock left (red)
- **Low Stock:** “X sandwiches left, hurry up!” (≤3 items, yellow)
- **Available:** Shows quantity remaining (green)

### Cart & Navigation Flow

- **Cart Persistence:** localStorage for cart items across page refreshes
- **Navigation:** StickyBasketButton navigates to `/cart` page
- **Empty Cart Handling:** Automatic redirect to home page
- **Back Navigation:** Close icon uses `router.back()` for natural flow
- **Multi-step Flow:** Home → Cart → Checkout → Confirmation

---

## 📝 Business Model & Operations

### Testing Phase Strategy

- **Initial Phase:** Testing concept with Impact Hub coworking space (Lisbon, Portugal)
- **Location:** 5 minutes from production site
- **Frequency:** 2 drops per week during testing phase
- **Goal:** Validate concept, improve logistics, and grow brand

### Sell Creation Process

1. **A Week Before:** Create a “sell” for specific date
2. **Announcement:** Make announcement to coworking community
3. **One day before the sell** : cooking the quantities
4. **Morning of Sell:** wrapping the order for delivery
5. **Customer Access:** Only have access to the upcoming sell’s menu (not future sells)

### Order Management Workflow

- **Order Placement:** Expecting customers will order the day before (20%) and during the morning of the drop (80%)
- **Manual Validation:** Admin manually validates orders to update stocks while we don’t have a Stripe connection for payment in advance
- **Order Status Flow:**
  - **Pending:** Needs admin confirmation
  - **Confirmed:** Manually accepted, stock updated
  - **Prepared:** Sandwich wrapped and ready
  - **Completed:** Delivered and cash payment received at pickup

---

## 📈 Success Metrics for V1.0

- 10+ orders per day through the app
- <2 minutes average order completion time
- 90%+ order completion rate
- Reduced phone call volume during lunch rush

---

## 🚀 Future Improvements (Post-MVP)

### Customer Experience

- **Repeat Customer Tracking:** Customer accounts and order history
- **Guest Checkout:** Option for one-time orders without account
- **Auto-complete:** Common names/emails from localStorage
- **Estimated Pickup Time:** Show based on current time + prep time
- **Order Again Feature:** Quick reorder from previous orders
- **Order Banner:** Smart banner to remind users of active orders and prevent duplicate ordering

### Business Logic

- **Inventory Limits:** Prevent ordering more than available stock
- **Order Limits:** Maximum orders per customer per day
- **High Order Warnings:** Alert for unusually large orders
- **Order Modification:** Allow customers to modify/cancel orders
- **Order Status Updates:** Real-time status (preparing, ready, etc.)

### Data & Security

- **Data Encryption:** Encrypt sensitive customer data
- **Privacy Compliance:** GDPR and other privacy regulations
- **Data Retention:** Implement data retention policies
- **Data Export/Deletion:** Customer data management options

### Communication

- **SMS Notifications:** Order confirmations and status updates
- **Email Validation:** Double-opt-in email confirmation
- **Dietary Restrictions:** Collect and track dietary preferences
- **Allergy Tracking:** Special handling for food allergies

### Accessibility & UX

- **Keyboard Navigation:** Full keyboard support for all interactions
- **Multi-step Forms:** Guided checkout process
- **Mobile Optimization:** Enhanced mobile experience

### Technical Improvements

- **Real-time Updates:** Live inventory and order status
- **Offline Support:** Basic PWA features for offline viewing
- **Performance:** Optimize loading times and responsiveness
- **Analytics:** Customer behavior and order analytics

---

## Other

### **⚠️ Important Notes for Production:**

- **Domain Verification Required:** Must verify a domain at resend.com/domains for production use
- **From Address:** Currently using `onboarding@resend.dev` for testing, needs to be changed to verified domain
- **Test Emails:** Can only send test emails to `mathieugrac@gmail.com` (verified email)
- **Production Setup:** Update `from` address in `src/lib/email.ts` to use verified domain
- **Error Handling:** Need to improve error handling for email failures (currently logs but doesn’t fail orders)

### **⚠️ Phase 5 Remaining Tasks:**

1. **Domain Verification:** Verify domain at resend.com/domains for production
2. **Update From Address:** Change to verified domain email
3. **Error Handling:** Add comprehensive error handling for email failures
4. **Final Testing:** End-to-end testing and optimization
5. **Production Deployment:** Deploy with verified domain email

**Success Criteria for Phase 5:**

- [x] Working email confirmations (testing only)
- [x] Professional email templates
- [ ] Comprehensive error handling
- [ ] Optimized performance
- [ ] Complete end-to-end testing
- [ ] Production domain verification
