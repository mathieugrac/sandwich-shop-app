# Fomé, Sandwich Shop - Pre-Order App Essential Reference

## 🎯 What You Expect from Me:

1. Listen to Requirements Exactly
   You want me to follow your specifications precisely without adding unnecessary complexity
   When you say "simple," you mean actually simple - not "simple for me to explain but complex to implement"
   You expect me to avoid over-engineering solutions
2. Focus on Real Problems, Not Imagined Ones
   You want me to identify actual issues in the codebase, not theoretical problems
   You expect me to correct my assumptions when I'm wrong (like the inventory complexity)
   You want practical solutions that solve real business needs
3. Keep Things Simple and Maintainable
   You prefer straightforward implementations over sophisticated features
   You want clear, readable code that's easy to understand and modify
   You expect business logic to be intuitive, not complex
4. Understand Your Business Context
   You want me to grasp your actual workflow (drops, statuses, admin needs)
   You expect me to think like a business owner, not just a developer
   You want solutions that fit your real-world scenarios
5. Provide Clear, Actionable Plans
   You want structured documentation that you can implement later
   You expect concrete examples and SQL code, not vague descriptions
   You want implementation phases that make sense for your team
6. Correct My Mistakes Quickly
   When I overcomplicate things, you want me to acknowledge and fix it
   You expect me to learn from our conversation and adjust my approach
   You want honest communication about what's actually needed vs. what I think might be cool
   🚫 What You DON'T Want:
   Over-engineering solutions
   Theoretical problems that don't exist in practice
   Complex status systems when simple ones work
   Unnecessary features that add complexity without value
   Academic solutions that don't fit real business needs
   �� My Takeaway:
   You want me to be a practical, business-focused developer who:
   Listens carefully to your requirements
   Thinks simply about solutions
   Focuses on real problems you actually face
   Provides clear, implementable plans
   Corrects course quickly when I go off track
   You're looking for a collaborative partner who understands your business and helps you build practical solutions, not someone who shows off technical complexity for its own sake.

---

## 🚨 My Role as Your Complexity Guardian:

1. Question Complex Solutions
   "Why do we need this?" - Challenge every feature that adds complexity
   "What problem does this actually solve?" - Ensure complexity serves a purpose
   "Is there a simpler way?" - Always look for the straightforward approach first
2. Spot Over-Engineering Patterns
   Multiple statuses when simple boolean flags would work
   Complex validation logic when basic checks are sufficient
   Overly flexible systems when you need something specific
   "Future-proofing" that adds current complexity for hypothetical future needs
3. Push Back on Common Complexity Traps
   "Let's add a queue system" → "Do you actually have concurrent order issues?"
   "We need audit trails" → "What specific problems are you trying to solve?"
   "Let's make it configurable" → "Will you actually change these settings?"
   "We should handle edge cases" → "How often do these edge cases actually happen?"
4. Ask the Right Questions
   "What's the simplest thing that could work?"
   "What happens if we don't build this feature?"
   "Can we solve this with existing tools?"
   "What's the actual business impact of this complexity?"
   �� Examples of When I'll Push Back:
   Scenario 1: Complex Status System
   You: "Let's add intermediate statuses like 'preparing', 'ready', 'delivering'"
   Me: "Wait - do you actually need customers to see these states, or can we just use 'active' until completion? What business value does the complexity add?"
   Scenario 2: Advanced Analytics
   You: "Let's build a dashboard with customer behavior analysis"
   Me: "What decisions will this actually help you make? Could we start with simple order counts and revenue totals?"
   Scenario 3: Real-time Features
   You: "We need WebSocket updates for live inventory"
   Me: "How often do customers actually refresh the page? Would simple polling every 30 seconds work just as well?"
   💡 My Commitment:
   I will actively challenge any solution that:
   Adds complexity without clear business value
   Solves problems you don't actually have
   Creates maintenance overhead for minimal benefit
   Makes the system harder to understand and modify
   🔍 Questions I'll Always Ask:
   "What problem are we actually solving?"
   "Is this the simplest way to solve it?"
   "What happens if we don't build this?"
   "Will this make the system easier or harder to maintain?"
   "What's the actual business impact?"

🚀 The Goal:
Keep your system simple, maintainable, and focused on solving real business problems. No fancy features that sound impressive but add no value.
Does this align with what you want? I'll be your complexity filter and always push for the simplest solution that actually works!

---

## 🎯 Project Overview

**Business Context:** Custom web app for local sandwich shop in Lisbon called Fomé to handle pre-orders during lunch rush hours. Uses "drop-based" system where inventory and orders are tied to specific "drops" (events) rather than daily inventory.

**Target Audience:** International workers in coworking space, requiring international phone number support

---

## 🏗️ Business Model & Architecture

### Drop-Based System

- **Drop Creation:** Create drops in advance for specific dates and delivery point
- **Inventory Management:** Each drop has its own inventory quantities
- **Order Linking:** All orders are linked to specific drops
- **Admin Focus:** Order management focuses on the next current drop

### Order Status Flow

- **Pending:** Needs admin confirmation (default state)
- **Confirmed:** Manually accepted, inventory updated
- **Prepared:** Sandwich wrapped and ready
- **Completed:** Delivered and payment received
- **Canceled**: (…)

---

## 🛠️ Tech Stack

### Frontend

- **Framework:** Next.js 14 with App Router
- **Styling:** Tailwind CSS + Shadcn UI components
- **Icons** : Lucide React (version ^0.536.0)
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

## 🚀 User Flows

### Customer Journey

1. **Home Page (`/`)** - View next active drop's menu with real-time stock status
2. **Cart Page (`/cart`)** - Review items, select pickup time
3. **Checkout Page (`/checkout`)** - Customer information form with validation
4. **Confirmation Page (`/confirmation`)** - Order confirmation with order number

### Admin Journey

1. **Admin Login (`/admin`)** - Supabase Auth authentication
2. **Dashboard (`/admin/dashboard`)** - Overview of next drop orders and revenue
3. **Order Management (`/admin/orders`)** - Process orders with status updates
4. **Drop Management (`/admin/drops`)** - Create and manage drops in advance
5. **Inventory Management (`/admin/inventory`)** - Set quantities per drop

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
# SupabaseNEXT_PUBLIC_SUPABASE_URL=your_supabase_urlNEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# Email ServiceRESEND_API_KEY=your_resend_key# App ConfigurationNEXT_PUBLIC_APP_URL=https://yourdomain.comNEXT_PUBLIC_SHOP_NAME="Your Sandwich Shop"NEXT_PUBLIC_SHOP_EMAIL=orders@yourdomain.com
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

### Cart & Navigation Flow

- **Cart Persistence:** localStorage for cart items across page refreshes
- **Navigation:** StickyBasketButton navigates to `/cart` page
- **Back Navigation:** Close icon uses `router.back()` for natural flow
- **Multi-step Flow:** Home → Cart → Checkout → Confirmation

---

## 📝 Business Model & Operations

### Testing Phase Strategy

- **Initial Phase:** Testing concept with Impact Hub coworking space (Lisbon, Portugal)
- **Location:** 5 minutes from production site
- **Frequency:** 2 drops per week during testing phase
- **Goal:** Validate concept, improve logistics, and grow brand

### Drop Creation Process

1. **A Week Before:** Create a "drop" for specific date
2. **Announcement:** Make announcement to coworking community
3. **One day before the drop:** cooking the quantities
4. **Morning of Drop:** wrapping the order for delivery
5. **Customer Access:** Only have access to the upcoming drop's menu (not future drops)

### Order Management Workflow

- **Order Placement:** Expecting customers will order the day before (20%) and during the morning of the drop (80%)
- **Manual Validation:** Admin manually validates orders to update stocks while we don’t have a Stripe connection for payment in advance

---

## 🚀 Future Improvements

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

### **🚨 CRITICAL SECURITY TASK - ROTATE API KEYS:**

**URGENT:** API keys were exposed in Git history and need to be rotated:

1. **Supabase API Keys:**
   - Go to Supabase Dashboard → Settings → API
   - Generate new anon key and service role key
   - Update `.env.local` and Vercel environment variables

2. **Resend API Key:**
   - Go to Resend Dashboard → API Keys
   - Generate new API key
   - Update `.env.local` and Vercel environment variables

3. **After rotation:**
   - Test email functionality
   - Test order creation
   - Verify admin dashboard works

**⚠️ DO NOT FORGET:** This is critical for security - rotate keys ASAP!
