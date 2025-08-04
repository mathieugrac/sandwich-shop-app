# Sandwich Shop Pre-Order App

A custom web application for a local sandwich shop to handle pre-orders during lunch rush hours. Built with Next.js 14, Supabase, and Tailwind CSS.

## 🚀 Features

### Customer Features
- **Product Catalog**: View today's available sandwiches with real-time inventory
- **Shopping Cart**: Add/remove items with automatic price calculation
- **Order Placement**: Select pickup time and provide contact information
- **Order Confirmation**: Receive email confirmation with order details

### Admin Features
- **Inventory Management**: Set daily inventory quantities each morning
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

## 🗄 Database Setup

The app uses the following main tables:
- `products` - Available sandwich items
- `daily_inventory` - Daily inventory quantities
- `orders` - Customer orders
- `order_items` - Items within each order
- `admin_users` - Admin authentication

See `supabase-schema.sql` for the complete database schema.

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
│   ├── (admin)/           # Admin routes
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

## 📈 Business Logic

### Inventory Management
- Daily inventory is set each morning by admin
- Real-time availability checking prevents overselling
- Reserved quantities are tracked during order process

### Order Flow
1. Customer views available products
2. Adds items to cart
3. Selects pickup time (15-minute intervals)
4. Provides contact information
5. Receives email confirmation
6. Admin manages orders through dashboard

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
