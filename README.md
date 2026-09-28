# 🕯️ Flamira — Handmade Candle & Home Décor E-Commerce Platform

> **Where Fragrance Meets Elegance** — A full-stack Sri Lankan e-commerce platform for handmade soy wax candles, home décor, and personalised gifts.

---

## 🌐 Live Features

| Area | Feature |
|---|---|
| 🛍️ Storefront | Browse products, filter by category, search, cart, guest checkout |
| 🔐 Auth | Customer signup/login, admin panel login (separate flows) |
| 📦 Orders | COD checkout, order confirmation, order tracking |
| ⭐ Reviews | Post-delivery review system with photo upload |
| 👤 Accounts | Customer profile, saved addresses, order history |
| 🎛️ Admin | Full-featured admin panel for owners and staff |

---

## 🚀 Tech Stack

```
Framework      Next.js 16 (App Router, TypeScript)
Styling        Tailwind CSS v4 with custom @theme tokens
Backend        Firebase (Firestore + Auth)
Images         Cloudinary (unsigned upload preset)
Email          EmailJS (order confirmation emails)
Analytics      Meta Pixel · TikTok Pixel · Google Analytics 4
Deployment     Vercel (recommended)
```

---

## 📁 Project Structure

```
flamira/
├── public/                        # Static assets (logo, hero images)
├── src/
│   ├── app/
│   │   ├── (storefront)           # Home, Shop, Product, Cart, Checkout
│   │   │   ├── page.tsx           # Home page with animated hero
│   │   │   ├── shop/              # Shop with URL-based category filters
│   │   │   ├── product/[slug]/    # Product detail with gallery + reviews
│   │   │   ├── cart/              # Cart with localStorage persistence
│   │   │   ├── checkout/          # Guest checkout with coupon support
│   │   │   ├── order/[orderNumber]/ # Order confirmation + review submission
│   │   │   ├── account/           # Customer login, signup, profile
│   │   │   ├── track/             # Order tracking by order number
│   │   │   ├── custom/            # Custom orders page
│   │   │   ├── about/             # Brand story
│   │   │   └── contact/           # Contact with WhatsApp link
│   │   └── admin/                 # 🔒 Admin panel (owner + staff roles)
│   │       ├── dashboard/         # Stats cards + recent orders
│   │       ├── products/          # Product CRUD + image upload
│   │       ├── categories/        # Category management + seed tool
│   │       ├── orders/            # Order management + status updates
│   │       ├── inventory/         # Stock control + history log
│   │       ├── customers/         # Customer insights from orders
│   │       ├── delivery/          # Per-district delivery rate config
│   │       ├── content/           # Banner, featured products, coupons
│   │       ├── reviews/           # Review moderation queue
│   │       ├── reports/           # Sales analytics + CSV export
│   │       └── settings/          # Admin user management + store info
│   ├── components/
│   │   ├── Navbar.tsx             # Sticky navbar with cart badge + account
│   │   ├── Footer.tsx             # Footer with contact details
│   │   ├── ShopFilters.tsx        # URL-synced filters with category tree
│   │   ├── ProductDetailView.tsx  # Product page client component
│   │   ├── HeroPhotoShuffle.tsx   # Polaroid photo shuffle animation
│   │   ├── StorefrontShell.tsx    # Storefront layout wrapper
│   │   └── admin/                 # Admin UI components
│   ├── context/
│   │   ├── CartContext.tsx        # Cart state + localStorage + tab sync
│   │   ├── AdminAuthContext.tsx   # Admin auth with role detection
│   │   └── CustomerAuthContext.tsx # Customer auth (guarded from admins)
│   └── lib/
│       ├── firebase.ts            # Firebase app initialization
│       ├── types.ts               # All TypeScript interfaces
│       ├── productService.ts      # Product CRUD + stock management
│       ├── categoryService.ts     # Category CRUD
│       ├── orderService.ts        # Order creation + status updates
│       ├── couponService.ts       # Coupon validation + management
│       ├── reviewService.ts       # Review submission + moderation
│       ├── settingsService.ts     # Site-wide settings (delivery, banner)
│       ├── adminAuthService.ts    # Admin login/logout
│       ├── adminUsersService.ts   # Admin user management
│       ├── customerAuthService.ts # Customer auth + profile
│       ├── cloudinaryUpload.ts    # Image upload to Cloudinary
│       ├── sendOrderEmail.ts      # EmailJS order confirmation
│       └── pixels.ts              # Analytics pixel helpers
├── firestore.rules                # Firebase security rules
└── next.config.ts                 # Next.js + Cloudinary configuration
```

---

## 🛠️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/chamika217/Flamira-Candle-Shop.git
cd Flamira-Candle-Shop
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the root:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=

# EmailJS (optional — for order confirmation emails)
NEXT_PUBLIC_EMAILJS_SERVICE_ID=
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=

# Analytics (optional)
NEXT_PUBLIC_META_PIXEL_ID=
NEXT_PUBLIC_TIKTOK_PIXEL_ID=
NEXT_PUBLIC_GA4_ID=

# SEO
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### 3. Set up Firebase

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Firestore Database** and **Authentication > Email/Password**
3. Publish the `firestore.rules` file from this repo (Firestore → Rules tab)
4. Seed categories: log in to `/admin/login` → Categories → **Seed Default Categories**

### 4. Create the first admin user

1. Firebase Console → Authentication → Add user (email + password)
2. Firestore → `admins` collection → Add document with ID = the user's UID:
   ```json
   {
     "uid": "<firebase-uid>",
     "name": "Flamira Owner",
     "email": "admin@yourdomain.com",
     "role": "owner",
     "createdAt": <timestamp>
   }
   ```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the storefront  
Open [http://localhost:3000/admin/login](http://localhost:3000/admin/login) for the admin panel

---

## 🎛️ Admin Panel

| Role | Access |
|---|---|
| **Owner** | Full access — all modules including Products, Categories, Customers, Delivery, Content, Reports, Settings |
| **Staff** | Orders + Inventory only |

### Key admin features

- **Products** — Add/edit products with multi-image Cloudinary upload, SKU, categories, pricing, stock
- **Categories** — 4 parent categories + 15 subcategories (seeded in one click)
- **Orders** — Update status (pending → dispatched → delivered), add courier tracking
- **Inventory** — Manual stock adjustments with reason logging and history
- **Delivery** — Per-district delivery rates for all 25 Sri Lankan districts
- **Content** — Hero banner upload, featured products selection, coupon codes
- **Reviews** — Approve/reject reviews, reply as owner, mark as featured
- **Reports** — Revenue chart, best sellers, order status breakdown, COD failure rate
- **Settings** — Add/deactivate admin users, store contact info

---

## 🛒 Storefront Features

- **Guest checkout** — No account required; COD payment; island-wide delivery
- **Category navigation** — URL-based filters (`/shop?category=candles-holders`)
- **Product gallery** — Multi-image with thumbnail strip
- **Stock badges** — In Stock / Low Stock / Made to Order / Out of Stock
- **Coupon codes** — Apply at checkout with instant discount preview
- **Order tracking** — Track by order number at `/track`
- **Customer accounts** — Saved addresses, order history, profile editing
- **Review system** — Post-delivery reviews with photo upload (moderated)

---

## 🔐 Security

- Admin and customer auth share the same Firebase Auth project but are fully isolated at the Firestore document level (`admins/{uid}` vs `customers/{uid}`)
- Admin accounts are blocked from signing in as customers
- Guest storefront never reads admin state
- Firestore rules enforce public read for products/categories/settings; authenticated writes for admin operations

---

## 🌍 Sri Lanka Specific

- **25 districts** with configurable per-district delivery fees
- **Cash on Delivery** as the primary payment method
- Prices displayed in **Sri Lankan Rupees (Rs.)**
- WhatsApp integration for custom orders and customer support
- Built for **island-wide delivery**

---

## 📦 Default Category Structure

```
Home Décor
  └── Wall Art & Frames · Candles & Holders · Vases & Planters
      Table & Shelf Décor · Lighting & Fairy Lights

Gifts
  └── Gift Boxes & Hampers · Personalized Gifts
      Couple & Anniversary Gifts · Corporate & Bulk Gifting

Handmade & Resin
  └── Resin Art · Clay & Ceramic · Macramé & Fabric

Seasonal
  └── Avurudu Collection · Christmas & New Year · Valentine's Collection
```

---

## 📄 License

This project is private and built for **Flamira** — a Sri Lankan handmade candle and home décor brand.

---

<div align="center">
  <p>Built with ❤️ for Flamira · Nugegoda, Sri Lanka</p>
  <p>🕯️ Soy Wax · Hand Poured · Handmade in Sri Lanka</p>
  <p>
    <a href="https://wa.me/94711168590">WhatsApp</a> ·
    <a href="mailto:candlesflamira@gmail.com">Email</a>
  </p>
</div>
