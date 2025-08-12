# Fomé, Sandwich Shop Pre-Order App - Essential Reference

## 🎯 Project Overview

**Business Context:** Custom web app for local sandwich shop in Lisbon called Fomé to handle pre-orders during lunch rush hours. Uses “sell-based” system where inventory and orders are tied to specific “sells” (events) rather than daily inventory.

**Target Audience:** International workers in coworking space, requiring international phone number support.

**Current Status:** Phase 5 (Email & Polish) - 85% complete. Email system implemented and working for testing.

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

## 🚧 Phase 6: Update Logic & Database - Detailed Plan

### **Phase 6A: Database Schema & Core Logic (Week 1)**

1. **Create Locations table** and update Sells table with location relationship
   - Locations: name, district, address, google_maps_link, delivery_timeframe
   - Update sells table to reference location_id
   - Remove unique constraint on sell_date (multiple sells per date possible)
2. **Update sell status logic** with auto-completion based on delivery timeframe
   - Auto-complete sells 30 minutes after delivery timeframe ends
   - Update database functions for new logic
3. **Fix the sell-inventory relationship** - integrate inventory management into sell editing
   - Remove separate inventory management page
   - Add inventory modal within sell editing
4. **Update database functions** for the new logic

### **Phase 6B: New Home Page & Calendar (Week 2)**

1. **Redesign home page** with project description and upcoming drops calendar
   - Show all future sells (not just next active)
   - Display location info and available quantities
   - "18 left 🥪" shows total available sandwiches
2. **Create Menu page** (`/menu`) for active sells
   - Unique URL for each sell (e.g., `/menu/[sell-id]`)
   - Product catalog with real-time inventory
3. **Update navigation flow** (Home → Menu → Cart → Checkout → Confirmation)
4. **Implement location display** in calendar and sell details

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

- **Multiple sells per date** possible (different locations)
- **Location-based delivery timeframes** (moved from global to location-specific)
- **Auto-completion** 30 minutes after delivery timeframe ends
- **Cart persistence** across page refreshes maintained
- **Admin access** to all sells regardless of status
- **Inventory management** integrated into sell editing (not separate page)

### **Phase 6 Summary - COMPLETED ✅**

**Phase 6 has been successfully completed!** We have successfully:

- **✅ Built a complete admin platform** with 5 management sections
- **✅ Created all necessary database tables** (locations, clients, product_images)
- **✅ Implemented full CRUD operations** for Products, Locations, Sells, Clients, and Orders
- **✅ Fixed database compatibility issues** and ensured all queries work properly
- **✅ Created a clean, professional UI** with consistent design patterns
- **✅ Integrated inventory management** directly into sell editing
- **✅ Added comprehensive order management** with filtering and search
- **✅ Implemented client analytics** with order history and revenue tracking

**The admin platform is now production-ready** and provides a complete solution for managing a sandwich shop business.

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
- **Dashboard Priority:** View Orders → Manage Sells → Manage Inventory
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
-- Products tableCREATE TABLE products (
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
-- Sells table (sell-based model)CREATE TABLE sells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sell_date DATE NOT NULL UNIQUE,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  announcement_sent BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Sell inventory (quantities for each product per sell)CREATE TABLE sell_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sell_id UUID REFERENCES sells(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  total_quantity INTEGER NOT NULL,
  reserved_quantity INTEGER DEFAULT 0,
  available_quantity INTEGER GENERATED ALWAYS AS (total_quantity - reserved_quantity) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sell_id, product_id)
);
-- Orders tableCREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(20) UNIQUE NOT NULL,
  sell_id UUID REFERENCES sells(id) ON DELETE CASCADE,
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  pickup_time TIME NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'prepared', 'completed', 'cancelled')),
  total_amount DECIMAL(10,2) NOT NULL,
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Order items tableCREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Key Functions

```sql
-- Function to generate unique order numbersCREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN  RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Get next active sellCREATE OR REPLACE FUNCTION get_next_active_sell()
RETURNS TABLE (id UUID, sell_date DATE, status VARCHAR(20)) AS $$
BEGIN  RETURN QUERY  SELECT s.id, s.sell_date, s.status
  FROM sells s
  WHERE s.status = 'active' AND s.sell_date >= CURRENT_DATE  ORDER BY s.sell_date ASC  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Reserve sell inventoryCREATE OR REPLACE FUNCTION reserve_sell_inventory(
  p_sell_id UUID, p_product_id UUID, p_quantity INTEGER)
RETURNS BOOLEAN AS $$
DECLARE  available_qty INTEGER;
BEGIN  SELECT available_quantity INTO available_qty
  FROM sell_inventory
  WHERE sell_id = p_sell_id AND product_id = p_product_id;
  IF available_qty >= p_quantity THEN    UPDATE sell_inventory
    SET reserved_quantity = reserved_quantity + p_quantity,
        updated_at = NOW()
    WHERE sell_id = p_sell_id AND product_id = p_product_id;
    RETURN TRUE;
  ELSE    RETURN FALSE;
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
- **GET /api/sells/next-active:** Get next active sell and its products
- **GET /api/sells:** Get all sells
- **POST /api/sells:** Create new sell
- **GET /api/sells/[id]/inventory:** Get inventory for specific sell
- **PUT /api/sells/[id]/inventory:** Update inventory for specific sell

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
- **Frequency:** 2 sells per week during testing phase
- **Goal:** Validate concept, improve logistics, and grow brand

### Sell Creation Process

1. **A Week Before:** Create a “sell” for specific date
2. **Announcement:** Make announcement to coworking community
3. **One day before the sell** : cooking the quantities
4. **Morning of Sell:** wrapping the order for delivery
5. **Customer Access:** Only have access to the upcoming sell’s menu (not future sells)

### Order Management Workflow

- **Order Placement:** Expecting customers will order the day before (20%) and during the morning of the sell (80%)
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
