# Sandwich Shop Pre-Order App V1.0 - Development Specification

## 📊 Project Status Overview

| Phase                                    | Status         | Progress | Next Action                  |
| ---------------------------------------- | -------------- | -------- | ---------------------------- |
| **Phase 1: Project Setup**               | ✅ COMPLETED   | 100%     | -                            |
| **Phase 2: Core UI Components**          | ✅ COMPLETED   | 100%     | -                            |
| **Phase 3: Customer Features**           | ✅ COMPLETED   | 100%     | -                            |
| **Phase 4: Admin Dashboard**             | ✅ COMPLETED   | 100%     | -                            |
| **Phase 4.5: Business Model Adaptation** | ✅ COMPLETED   | 100%     | -                            |
| **Phase 5: Email & Polish**              | 🔄 IN PROGRESS | 85%      | Final testing and deployment |

**Current Focus:** Phase 5 - Email confirmations and final polish

**Next Milestone:** Complete email system and final testing

---

## 🎯 Key Design Decisions & Architecture

### Business Model & Operations

#### Sell-Based System

- **Sell Creation:** Create sells in advance for specific dates
- **Inventory Management:** Each sell has its own inventory quantities
- **Order Linking:** All orders are linked to specific sells
- **Customer Access:** Customers only see the next active sell's menu
- **Admin Focus:** Order management focuses on the next active sell

#### Order Status Flow

- **Pending:** Needs admin confirmation (default state)
- **Confirmed:** Manually accepted, inventory updated
- **Prepared:** Sandwich wrapped and ready
- **Completed:** Delivered and payment received

#### Admin Workflow

- **Primary Task:** "Inbox 0" for pending orders
- **Order Management:** Clickable status cards for quick filtering
- **Dashboard Priority:** View Orders → Manage Sells → Manage Inventory
- **Default Focus:** Pending orders when landing on Order Management

### Layout Strategy

- **Home Page:** Uses MainLayout with Header, Footer, and StickyBasketButton
- **Cart Page:** Custom layout without Header/Footer for focused ordering experience
- **Checkout Page:** Dedicated customer information form
- **Confirmation Page:** Order confirmation display
- **Mobile-First:** 480px max-width container for optimal mobile experience
- **Sticky Elements:** Header and Place Order button remain visible during scroll

### Cart & Navigation Flow

- **Cart Persistence:** localStorage for cart items across page refreshes
- **Navigation:** StickyBasketButton navigates to `/cart` page
- **Empty Cart Handling:** Automatic redirect to home page
- **Back Navigation:** Close icon uses `router.back()` for natural flow
- **Multi-step Flow:** Home → Cart → Checkout → Confirmation

### Pickup Time Configuration

- **Time Slots:** 15-minute intervals between 12:00 PM and 2:00 PM
- **Pre-order Cutoff:** 30 minutes before 12:00 PM (11:30 AM)
- **UI Layout:** Select aligned to the right of the label for better UX
- **Validation:** Required field for order placement

### Inventory Management Strategy

- **Sell-Based Inventory:** Each sell has specific inventory quantities
- **Real-time Validation:** Check availability when adding to cart
- **Stock Display:** "Not Available", "Sold Out", "Low Stock", and "Available"
- **Database Integration:** Supabase real-time updates for inventory changes

---

## Project Summary

### Business Context

We are developing a custom web application for a local sandwich shop to handle pre-orders during lunch rush hours. The shop operates on a "sell-based" system where inventory and orders are tied to specific "sells" (events) rather than just daily inventory.

**Target Audience:** International workers based in a coworking space, requiring support for international phone numbers and diverse customer base.

### Business Model & Operations

#### Testing Phase Strategy

- **Initial Phase:** Testing concept with Impact Hub coworking space (Lisbon, Portugal)
- **Location:** 10 minutes from production site
- **Frequency:** 2 sells per week during testing phase
- **Goal:** Validate concept, improve logistics, and grow brand

#### Sell Creation Process

1. **Day Before:** Create a "sell" (inventory) for specific date
2. **Announcement:** Make announcement to coworking community
3. **Morning of Sell:** Define quantities based on available ingredients
4. **Customer Access:** Only see next sell's menu (not future sells)

#### Order Management Workflow

- **Order Placement:** Customers order at night/morning
- **Manual Validation:** Admin manually validates orders to update stocks
- **Order Status Flow:**
  - **Pending:** Needs admin confirmation
  - **Confirmed:** Manually accepted, stock updated
  - **Prepared:** Sandwich wrapped and ready
  - **Completed:** Delivered and cash payment received at pickup

#### Key Admin Requirements

1. **Create sells in advance** for specific dates
2. **Track orders, status, and revenue per sell**
3. **Order Management:** Show only next sell's orders
4. **Table view with status tabs** for quick order processing
5. **Main Goal:** Quickly process pending orders (inbox 0)

### Problem Statement

- Manual phone orders create bottlenecks during lunch rush
- No real-time inventory visibility leads to customer disappointment
- Cash-only transactions result in no-shows and revenue loss
- Staff overwhelmed with order-taking instead of food preparation

### V1.0 Goals

Build a minimum viable product (MVP) that allows customers to:

- View available sandwiches for the next active sell
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

-- Sells table (sell-based model)
CREATE TABLE sells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sell_date DATE NOT NULL UNIQUE,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  announcement_sent BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sell inventory (quantities for each product per sell)
CREATE TABLE sell_inventory (
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

-- Orders table
CREATE TABLE orders (
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

-- Order items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
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

-- Function to get next active sell
CREATE OR REPLACE FUNCTION get_next_active_sell()
RETURNS TABLE (
  id UUID,
  sell_date DATE,
  status VARCHAR(20)
) AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.sell_date, s.status
  FROM sells s
  WHERE s.status = 'active' AND s.sell_date >= CURRENT_DATE
  ORDER BY s.sell_date ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to reserve sell inventory
CREATE OR REPLACE FUNCTION reserve_sell_inventory(
  p_sell_id UUID,
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  available_qty INTEGER;
BEGIN
  SELECT available_quantity INTO available_qty
  FROM sell_inventory
  WHERE sell_id = p_sell_id AND product_id = p_product_id;

  IF available_qty >= p_quantity THEN
    UPDATE sell_inventory
    SET reserved_quantity = reserved_quantity + p_quantity,
        updated_at = NOW()
    WHERE sell_id = p_sell_id AND product_id = p_product_id;
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
ALTER TABLE sells ENABLE ROW LEVEL SECURITY;
ALTER TABLE sell_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Public read access for active products
CREATE POLICY "Public can view active products" ON products
  FOR SELECT USING (active = true);

-- Public read access for active sells
CREATE POLICY "Public can view active sells" ON sells
  FOR SELECT USING (status = 'active');

-- Public read access for sell inventory
CREATE POLICY "Public can view sell inventory" ON sell_inventory
  FOR SELECT USING (true);

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

#### Product Catalog (Sell-Based)

- **User Story:** As a customer, I want to see the next active sell's available sandwiches
- **Acceptance Criteria:**
  - ✅ Display only products from the next active sell
  - ✅ Show remaining quantity for each item
  - ✅ Display "Not Available", "Sold Out", "Low Stock", or "Available"
  - ✅ Mobile-responsive grid layout
  - ✅ Product images (placeholder if none)
  - ✅ Show "shop closed" message when no active sell

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

#### Customer Information Form

- **User Story:** As a customer, I want to provide my contact information for order pickup
- **Acceptance Criteria:**
  - ✅ Required fields: Name (min 3 chars), Email
  - ✅ Optional field: Phone (international format support)
  - ✅ Email format validation
  - ✅ Phone number formatting on submit
  - ✅ Auto-save to localStorage for repeat customers
  - ✅ Form validation with error messages

#### Order Confirmation

- **User Story:** As a customer, I want to receive confirmation of my order
- **Acceptance Criteria:**
  - ✅ Generate unique order number
  - ✅ Display order summary on screen
  - ✅ Include pickup instructions
  - ✅ Reserve inventory temporarily
  - ✅ Show order details with customer info

### Admin Features

#### Sell Management

- **User Story:** As a shop owner, I want to create sells in advance and manage them
- **Acceptance Criteria:**
  - ✅ Create sells for specific dates
  - ✅ Set sell status (draft → active → completed)
  - ✅ Manage inventory quantities per sell
  - ✅ Track announcement status
  - ✅ View sell overview with revenue and order counts

#### Order Management

- **User Story:** As a shop owner, I want to quickly process orders for the next sell
- **Acceptance Criteria:**
  - ✅ Show only orders for the next active sell
  - ✅ Clickable status cards for quick filtering
  - ✅ Default to Pending tab when landing on page
  - ✅ Order status flow: Pending → Confirmed → Prepared → Completed
  - ✅ Revenue tracking per sell
  - ✅ Quick "inbox 0" processing for pending orders

#### Inventory Management

- **User Story:** As a shop owner, I want to set inventory quantities for specific sells
- **Acceptance Criteria:**
  - ✅ Select sell from dropdown
  - ✅ Set quantities for each product per sell
  - ✅ Visual status indicators (Not Available, Sold Out, Low Stock, Available)
  - ✅ Bulk quantity updates
  - ✅ Real-time inventory tracking

#### Dashboard Overview

- **User Story:** As a shop owner, I want to see key metrics for the next sell
- **Acceptance Criteria:**
  - ✅ Next sell orders count
  - ✅ Pending orders count
  - ✅ Revenue for next sell
  - ✅ Active products count
  - ✅ Quick action cards in priority order

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

### Phase 3: Customer Features ✅ COMPLETED

**Tasks:**

- [x] Build shopping cart functionality (completed in Phase 2)
- [x] Create order form with validation (cart page with pickup time)
- [x] Add pickup time selection (12:00-14:00, 15-min intervals)
- [x] Implement product catalog with Supabase integration
- [x] Implement inventory checking with real-time validation
- [x] Create order confirmation page
- [x] Add customer information form

**Deliverables:**

- [x] Complete customer ordering flow (UI only)
- [x] Form validation and error handling (basic)
- [x] Real-time inventory integration
- [x] Database integration for orders

**Status:** ✅ **COMPLETED** - 100% complete, full customer flow implemented

### Phase 4: Admin Dashboard ✅ COMPLETED

**Tasks:**

- [x] Set up Supabase authentication
- [x] Create admin login page
- [x] Build inventory management interface
- [x] Implement order management dashboard
- [x] Add order status updates
- [x] Create basic reporting

**Deliverables:**

- [x] Secure admin authentication
- [x] Inventory management system
- [x] Order management dashboard

**Status:** ✅ **COMPLETED** - Full admin dashboard implemented

### Phase 4.5: Business Model Adaptation ✅ COMPLETED

**Tasks:**

- [x] Update database schema for sell-based model
- [x] Create sell management interface
- [x] Update order management for sell-focused workflow
- [x] Modify customer interface for next sell only
- [x] Implement new order status flow
- [x] Add clickable status cards for filtering

**Deliverables:**

- [x] Sell management system
- [x] Updated order processing workflow
- [x] Customer interface for next sell
- [x] Enhanced admin dashboard

**Status:** ✅ **COMPLETED** - Sell-based business model fully implemented

**Key Implementations:**

#### Database Schema Changes

- **✅ New `sells` table:** Replace daily inventory concept with sell-based model
- **✅ New `sell_inventory` table:** Link inventory to specific sells
- **✅ Updated `orders` table:** Link orders to sells, update status flow
- **✅ PostgreSQL functions:** `get_next_active_sell()`, `reserve_sell_inventory()`

#### Admin Interface Changes

- **✅ Sell Management:** Create and manage sells in advance
- **✅ Order Management:** Focus on next sell with clickable status cards
- **✅ Dashboard:** Show next sell info and pending orders prominently
- **✅ Inventory Management:** Sell-specific inventory management

#### Customer Interface Changes

- **✅ Home page:** Only show next active sell's menu
- **✅ Order flow:** Link orders to specific sells
- **✅ Error handling:** Handle "no active sell" gracefully

#### Order Status Flow

- **✅ Pending:** Needs admin confirmation (default state)
- **✅ Confirmed:** Manually accepted, stock updated
- **✅ Prepared:** Sandwich wrapped and ready
- **✅ Completed:** Delivered and payment received

### Phase 5: Email & Polish 🔄 IN PROGRESS

**Tasks:**

- [x] Set up email service integration
- [x] Create order confirmation email template
- [x] Implement email sending functionality
- [ ] Add error handling and edge cases
- [ ] Performance optimization
- [ ] Final testing and bug fixes

**Deliverables:**

- [x] Working email confirmations
- [ ] Polished user experience
- [ ] Comprehensive error handling

**Status:** 🔄 **IN PROGRESS** - Email system implemented with error handling, final testing needed

---

## 📋 Task Tracking & Notes

### ✅ Recently Completed

- [x] **Phase 4.5:** Sell-based business model implementation
- [x] **Database Migration:** Updated schema for sell-based model
- [x] **Admin Authentication:** Secure login with Supabase Auth
- [x] **Sell Management:** Create and manage sells in advance
- [x] **Order Management:** Clickable status cards with default to Pending
- [x] **Inventory Management:** Sell-specific inventory management
- [x] **Customer Interface:** Next active sell only display
- [x] **Dashboard Reorganization:** View Orders → Manage Sells → Manage Inventory
- [x] **Error Handling:** Graceful handling of "no active sell" state

### 🔄 Current Tasks

- [x] **Phase 5.1:** Set up email service integration
- [x] **Phase 5.2:** Create order confirmation email template
- [x] **Phase 5.3:** Implement email sending functionality
- [x] **Phase 5.4:** Add error handling and edge cases
- [ ] **Phase 5.5:** Performance optimization and final testing

### ⚠️ Current Blockers

- None currently

### 📋 MVP Requirements (Phase 5 Remaining)

#### Email Confirmation System

- **Email Service:** Set up Resend or similar email service
- **Order Confirmation Template:** Professional email template
- **Email Sending:** Automatic email on order placement
- **Email Validation:** Verify email delivery and tracking

#### Error Handling & Polish

- **Comprehensive Error Handling:** Handle all edge cases
- **Loading States:** Better loading indicators
- **Form Validation:** Enhanced validation with better UX
- **Performance Optimization:** Optimize loading times
- **Final Testing:** End-to-end testing of all features

### 🚀 Future Improvements (Post-MVP)

#### Customer Experience

- **Repeat Customer Tracking:** Customer accounts and order history
- **Guest Checkout:** Option for one-time orders without account
- **Auto-complete:** Common names/emails from localStorage
- **Estimated Pickup Time:** Show based on current time + prep time
- **Order Again Feature:** Quick reorder from previous orders
- **Order Banner:** Smart banner to remind users of active orders and prevent duplicate ordering

#### Business Logic

- **Inventory Limits:** Prevent ordering more than available stock
- **Order Limits:** Maximum orders per customer per day
- **High Order Warnings:** Alert for unusually large orders
- **Order Modification:** Allow customers to modify/cancel orders
- **Order Status Updates:** Real-time status (preparing, ready, etc.)

#### Data & Security

- **Data Encryption:** Encrypt sensitive customer data
- **Privacy Compliance:** GDPR and other privacy regulations
- **Data Retention:** Implement data retention policies
- **Data Export/Deletion:** Customer data management options

#### Communication

- **SMS Notifications:** Order confirmations and status updates
- **Email Validation:** Double-opt-in email confirmation
- **Dietary Restrictions:** Collect and track dietary preferences
- **Allergy Tracking:** Special handling for food allergies

#### Accessibility & UX

- **Voice Input:** Accessibility support for voice commands
- **Keyboard Navigation:** Full keyboard support for all interactions
- **Multi-step Forms:** Guided checkout process
- **Mobile Optimization:** Enhanced mobile experience

#### Technical Improvements

- **Real-time Updates:** Live inventory and order status
- **Offline Support:** Basic PWA features for offline viewing
- **Performance:** Optimize loading times and responsiveness
- **Analytics:** Customer behavior and order analytics

### 📝 Notes

- Database schema is ready with sell-based model
- Supabase client is configured
- All dependencies are installed
- Complete UI flow is implemented and functional
- Full customer ordering flow is working with database integration
- Admin dashboard is fully functional with sell-based workflow
- **Email system is implemented and working for testing**

### 📧 Email System Status

**✅ Working Features:**

- Resend API integration complete
- Order confirmation emails with professional HTML template
- Status update emails for order status changes
- Test email functionality at `/test-email`
- Environment variables properly configured

**⚠️ Important Notes for Production:**

- **Domain Verification Required:** Must verify a domain at resend.com/domains for production use
- **From Address:** Currently using `onboarding@resend.dev` for testing, needs to be changed to verified domain
- **Test Emails:** Can only send test emails to `mathieugrac@gmail.com` (verified email)
- **Production Setup:** Update `from` address in `src/lib/email.ts` to use verified domain
- **Error Handling:** Need to improve error handling for email failures (currently logs but doesn't fail orders)

**🔧 Technical Implementation:**

- Email templates include order details, pickup info, contact details
- Status update emails for confirmed, prepared, completed statuses
- Professional HTML styling with responsive design
- Integrated with order placement and status update APIs

### 🎯 Next Priority: Phase 5 Completion

**Immediate Next Steps:**

1. **Domain Verification:** Verify a domain at resend.com/domains for production
2. **Update From Address:** Change from `onboarding@resend.dev` to verified domain email
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

---

## 🚀 Current User Flow & Technical Implementation

### Complete Customer Journey (Implemented)

1. **Home Page (`/`)**
   - View next active sell's menu with sandwiches from Supabase
   - See real-time stock status (Not Available, Sold Out, Low Stock, Available)
   - Add items to cart using + button
   - Sticky basket button appears with count and total
   - Shows "shop closed" message when no active sell

2. **Cart Page (`/cart`)**
   - Review all cart items with quantities
   - Modify quantities with +/- buttons
   - Add special instructions via textarea
   - Select pickup time (12:00-14:00, 15-min intervals)
   - View pickup location with Google Maps link
   - See order summary with pricing
   - Place order (navigates to checkout)

3. **Checkout Page (`/checkout`)**
   - Customer information form with validation
   - Name, email, and phone number fields
   - Auto-save to localStorage for repeat customers
   - Form validation with error messages
   - Submit order to database

4. **Confirmation Page (`/confirmation`)**
   - Display order confirmation with order number
   - Show order details and pickup information
   - Customer can return to home page

### Complete Admin Journey (Implemented)

1. **Admin Login (`/admin`)**
   - Secure authentication with Supabase Auth
   - Email/password login
   - Redirect to dashboard on success

2. **Dashboard (`/admin/dashboard`)**
   - Overview of next sell orders and revenue
   - Quick action cards: View Orders → Manage Sells → Manage Inventory
   - Real-time stats for pending orders

3. **Order Management (`/admin/orders`)**
   - Default to Pending tab for quick processing
   - Clickable status cards for filtering (Pending, Confirmed, Ready, Completed)
   - Order status updates with inventory reservation
   - Focus on next active sell only

4. **Sell Management (`/admin/sells`)**
   - Create sells in advance for specific dates
   - Manage sell status (draft → active → completed)
   - View sell overview with revenue and order counts

5. **Inventory Management (`/admin/inventory`)**
   - Select sell from dropdown
   - Set quantities for each product per sell
   - Visual status indicators for inventory levels

### Technical Architecture

#### File Structure (Current)

```
src/
├── app/
│   ├── admin/
│   │   ├── page.tsx              # Admin login
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Admin dashboard
│   │   ├── orders/
│   │   │   └── page.tsx          # Order management
│   │   ├── sells/
│   │   │   └── page.tsx          # Sell management
│   │   └── inventory/
│   │       └── page.tsx          # Inventory management
│   ├── cart/
│   │   └── page.tsx              # Cart page with order form
│   ├── checkout/
│   │   └── page.tsx              # Customer information form
│   ├── confirmation/
│   │   └── page.tsx              # Order confirmation page
│   ├── api/
│   │   ├── products/
│   │   │   └── route.ts          # Products API
│   │   ├── inventory/
│   │   │   └── [date]/
│   │   │       └── route.ts      # Inventory API
│   │   ├── orders/
│   │   │   └── route.ts          # Orders API
│   │   ├── sells/
│   │   │   ├── route.ts          # Sells API
│   │   │   ├── [id]/inventory/
│   │   │   │   └── route.ts      # Sell inventory API
│   │   │   └── next-active/
│   │   │       └── route.ts      # Next active sell API
│   │   └── test/
│   │       └── route.ts          # Test API
│   ├── globals.css
│   ├── layout.tsx                # Root layout with CartProvider
│   └── page.tsx                  # Home page with product catalog
├── components/
│   ├── ui/                       # Shadcn UI components
│   ├── customer/
│   │   ├── SandwichItem.tsx      # Product card component
│   │   ├── StickyBasketButton.tsx # Navigation to cart
│   │   └── AboutSection.tsx      # Home page content
│   ├── admin/                    # Admin components
│   └── shared/
│       ├── MainLayout.tsx        # Layout for home page
│       ├── Header.tsx            # Home page header
│       └── Footer.tsx            # Home page footer
├── lib/
│   ├── cart-context.tsx          # Cart state management
│   ├── api/
│   │   ├── products.ts           # Products API client
│   │   ├── inventory.ts          # Inventory API client
│   │   └── sells.ts              # Sells API client
│   └── supabase/
│       └── client.ts             # Supabase client
└── types/
    └── database.ts               # Supabase types
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

**Checkout Page (`src/app/checkout/page.tsx`)**

- Customer information form with validation
- Auto-save to localStorage
- International phone number support
- Form validation with error messages
- Submit order to database

**API Routes**

- **GET /api/products:** Fetch active products from Supabase
- **GET /api/inventory/[date]:** Fetch inventory for specific date
- **POST /api/orders:** Create new order with inventory reservation
- **GET /api/sells/next-active:** Get next active sell and its products
- **GET /api/sells:** Get all sells
- **POST /api/sells:** Create new sell
- **GET /api/sells/[id]/inventory:** Get inventory for specific sell
- **PUT /api/sells/[id]/inventory:** Update inventory for specific sell

### Design Decisions & UX Patterns

#### Layout Strategy

- **Home Page:** Full layout with header, footer, and sticky basket button
- **Cart Page:** Minimal layout focused on order completion
- **Checkout Page:** Clean form layout for customer information
- **Confirmation Page:** Success-focused layout
- **Mobile-First:** 480px max-width for optimal mobile experience

#### Navigation Flow

- **Natural Back Navigation:** Close icon uses `router.back()`
- **Empty Cart Handling:** Automatic redirect to home
- **Cart Persistence:** Survives page refreshes via localStorage
- **Multi-step Flow:** Clear progression through ordering process

#### Pickup Time UX

- **Time Slots:** 15-minute intervals (12:00, 12:15, 12:30, etc.)
- **UI Layout:** Select aligned to the right of the label
- **Validation:** Required field for order placement

#### Stock Status Display

- **Not Available:** Product not offered for this sell (gray)
- **Sold Out:** Product offered but no stock left (red)
- **Low Stock:** "X sandwiches left, hurry up!" (≤3 items, yellow)
- **Available:** Shows quantity remaining (green)

### Database Integration

#### Real-time Data

- **Products:** Fetched from Supabase products table
- **Sells:** Sell-based inventory from sell_inventory table
- **Orders:** Created in orders and order_items tables
- **Inventory Reservation:** Automatic reservation when orders are placed

#### API Implementation

- **Products API:** Returns active products with proper error handling
- **Next Active Sell API:** Returns next active sell with available products
- **Orders API:** Creates orders with inventory reservation and validation
- **Sells API:** Manage sells and their inventory

### Current Limitations (To Be Addressed in Phase 5)

1. **No Email Confirmation:** No order confirmation emails
2. **Limited Error Handling:** Basic error handling only
3. **No Performance Optimization:** Basic performance
4. **No Final Testing:** End-to-end testing needed

### Key Components Built

#### Admin Components

```typescript
// Authentication
<AdminLogin />
<ProtectedRoute />

// Sell management
<SellManager sells={sells} />
<SellForm onSubmit={handleSellCreate} />

// Inventory management
<InventoryManager products={products} inventory={inventory} />
<InventoryForm onSubmit={handleInventoryUpdate} />

// Order management
<OrderDashboard orders={orders} />
<OrderList orders={orders} onStatusUpdate={handleStatusUpdate} />
<OrderCard order={order} />
```

#### Admin API Routes

```typescript
// GET /api/admin/orders - Get all orders
// PUT /api/admin/orders/[id] - Update order status
// GET /api/admin/inventory - Get current inventory
// PUT /api/admin/inventory - Update daily inventory
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

- [x] View products on mobile and desktop
- [x] Add items to cart
- [x] Remove items from cart
- [x] Select pickup time
- [x] Fill out customer information
- [x] Submit order successfully
- [x] View order confirmation page
- [ ] Receive email confirmation (Phase 5)

#### Admin Flow

- [x] Login to admin dashboard
- [x] Create sells in advance
- [x] Set sell-specific inventory
- [x] View next sell's orders
- [x] Update order status
- [x] View order details
- [x] Use clickable status cards for filtering

#### Edge Cases

- [x] Try to order more than available inventory
- [x] Submit order with invalid email
- [x] Try to select past pickup time
- [x] Test with no active sell
- [x] Test sell-based inventory management
- [ ] Test email delivery failures

### Performance Requirements

- [x] Page load time < 3 seconds
- [x] Cart updates < 500ms
- [x] Order submission < 2 seconds
- [x] Mobile responsive on all screen sizes
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

- [x] All features tested and working
- [ ] Email delivery tested
- [x] Mobile responsiveness verified
- [x] Admin dashboard functional
- [x] Database backup configured
- [ ] Error monitoring set up
- [ ] Performance optimized

### Launch Day

- [x] Deploy to production
- [x] Test complete customer flow
- [x] Test admin dashboard
- [ ] Monitor error logs
- [x] Set daily inventory
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

- Create sells in advance
- Set inventory quantities for sells
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
