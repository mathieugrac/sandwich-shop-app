# Sandwich Shop Pre-Order App

A custom web application for a local sandwich shop to handle pre-orders during lunch rush hours. Built with Next.js 14, Supabase, and Tailwind CSS.

## 🚀 Features

### Customer Features

- **Product Catalog**: View today's available sandwiches with real-time inventory
- **Shopping Cart**: Add/remove items with automatic price calculation
- **Order Placement**: Select pickup time and provide contact information
- **Order Confirmation**: Receive email confirmation with order details

### Admin Features

- **Drop Management**: Create and manage drops (events) in advance
- **Inventory Management**: Set quantities and pricing for each drop
- **Order Management**: View and update order statuses
- **Dashboard**: Monitor daily orders and business metrics

## 🛠 Tech Stack

- **Frontend**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + Shadcn UI
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel
- **Email**: Supabase + Resend

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Vercel account (for deployment)

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/sandwich-shop-app.git
cd sandwich-shop-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file:

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

### 4. Set up the database

Run the SQL schema in your Supabase project:

```bash
# Copy the contents of supabase-schema.sql to your Supabase SQL editor
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 🗄 Database Structure

### Core Tables

The app uses a modern "drop-based" system where inventory and orders are tied to specific "drops" (events) rather than daily inventory:

- **`products`** - Available sandwich items with production costs
- **`product_images`** - Multiple images per product with sorting
- **`locations`** - Pickup/delivery points with pickup hours
- **`drops`** - Daily drop events (formerly "sells")
- **`drop_products`** - Products available in each drop with pricing
- **`clients`** - Customer information and order history
- **`orders`** - Customer orders for specific drops
- **`order_products`** - Items within each order (links to drop_products)
- **`admin_users`** - Admin authentication

### Key Benefits of New Structure

- **Better Price Management**: Prices captured at drop level for historical tracking
- **Location Flexibility**: Multiple drops per date at different locations
- **Improved Analytics**: Better insights into product performance and customer behavior
- **Inventory Optimization**: Centralized inventory management at drop level
- **Cleaner Relationships**: More intuitive table relationships and constraints

### Database Schema

See `supabase-schema.sql` for the complete database schema with all tables, functions, and constraints.

## 📊 Business Logic

### Drop-Based System

Instead of daily inventory, the app uses "drops" - specific events where:

1. **Admin creates drops** in advance with dates and locations
2. **Inventory is set per drop** with individual pricing
3. **Customers order from active drops** with real-time availability
4. **Orders are processed** through the drop lifecycle

### Order Flow

1. **Customer views active drop** with available products
2. **Adds items to cart** with real-time stock checking
3. **Provides contact information** and completes order
4. **Receives email confirmation** with order details
5. **Admin manages orders** through dashboard with status updates

### Drop Status Management

- **Manual Control**: Admin manually opens and closes drops (no automatic time-based completion)
- **Simple Status Flow**: upcoming → active → completed
- **Business Flexibility**: Extend drops, close early, or reopen as needed
- **Full Visibility**: Clear status in admin dashboard

### Inventory Management

- **Drops created in advance** with specific dates and locations
- **Inventory quantities set per drop** with individual pricing
- **Real-time availability checking** prevents overselling
- **Reserved quantities tracked** during order process

## 🚀 Deployment

### Vercel Deployment

1. **Connect to GitHub**: Push your code to GitHub
2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables
   - Deploy!

### Environment Variables for Production

Set these in your Vercel dashboard:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SHOP_NAME`
- `NEXT_PUBLIC_SHOP_EMAIL`
- `NEXT_PUBLIC_SHOP_PHONE`
- `ADMIN_EMAIL`

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin routes
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   ├── customer/         # Customer-facing components
│   └── admin/            # Admin components
├── lib/                  # Utility libraries
│   ├── supabase/         # Supabase client
│   ├── validations/      # Zod schemas
│   └── utils/            # Helper functions
└── types/                # TypeScript types
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Code Style

- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Tailwind CSS for styling

## 📈 Analytics Capabilities

The new data model provides comprehensive business insights:

### Product Analytics

- Best-selling products across all drops and time periods
- Category performance analysis
- Price optimization insights

### Customer Analytics

- Customer lifetime value analysis
- Order history and preferences
- Customer segmentation

### Business Analytics

- Revenue tracking by drop, location, and category
- Location performance metrics
- Inventory optimization insights
- Seasonal trend analysis

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@yourdomain.com or create an issue in this repository.

---

**Built with ❤️ for local sandwich shops**
