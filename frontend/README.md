# Anugerah Resto - Frontend Dashboard

Frontend dashboard untuk sistem manajemen restoran Anugerah Resto menggunakan Next.js dan TailAdmin template.

## Teknologi

- **Next.js 16** - React framework dengan App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS V4** - Styling
- **Apollo Client** - GraphQL client
- **TailAdmin Template** - Admin dashboard template

## Fitur

- 📊 **Dashboard** - Overview statistik restaurant dengan real-time updates
- 🍽️ **Menu Management** - Kelola menu items, kategori, dan ketersediaan
- 📦 **Order Management** - Lihat dan kelola semua pesanan
- 👨‍🍳 **Kitchen Queue** - Antrian dapur dengan real-time updates (Kanban style)
- 📋 **Inventory Management** - Kelola stok bahan baku dengan alert low stock
- 👥 **User Management** - Kelola staff dan customer dengan loyalty points

## Setup

### Prerequisites

- Node.js 18.x atau lebih baru (disarankan 20.x+)
- Backend services berjalan di:
  - Order Service: `http://localhost:4004/graphql`
  - Kitchen Service: `http://localhost:4001/graphql`
  - Inventory Service: `http://localhost:4002/graphql`
  - User Service: `http://localhost:4003/graphql`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Buat file `.env.local` di root folder frontend:
```env
NEXT_PUBLIC_ORDER_SERVICE_URL=http://localhost:4004/graphql
NEXT_PUBLIC_KITCHEN_SERVICE_URL=http://localhost:4001/graphql
NEXT_PUBLIC_INVENTORY_SERVICE_URL=http://localhost:4002/graphql
NEXT_PUBLIC_USER_SERVICE_URL=http://localhost:4003/graphql
```

3. Jalankan development server:
```bash
npm run dev
```

4. Buka browser di `http://localhost:3000`

## Struktur Project

```
frontend/
├── src/
│   ├── app/
│   │   ├── (admin)/
│   │   │   ├── page.tsx          # Dashboard
│   │   │   ├── menu/
│   │   │   │   └── page.tsx      # Menu Management
│   │   │   ├── orders/
│   │   │   │   └── page.tsx      # Order Management
│   │   │   ├── kitchen/
│   │   │   │   └── page.tsx      # Kitchen Queue
│   │   │   ├── inventory/
│   │   │   │   └── page.tsx      # Inventory Management
│   │   │   └── users/
│   │   │       └── page.tsx      # User Management
│   │   └── layout.tsx
│   ├── components/                # Reusable components
│   ├── lib/
│   │   └── apollo-client.ts       # Apollo Client configuration
│   ├── layout/
│   │   └── AppSidebar.tsx        # Sidebar navigation
│   └── providers/
│       └── ApolloProvider.tsx     # Apollo Provider wrapper
```

## Halaman

### Dashboard (`/`)
- Statistik total orders, pending orders, revenue
- Kitchen queue status
- Low stock alerts
- Recent orders dan kitchen queue

### Menu Management (`/menu`)
- Lihat semua menu items
- Filter berdasarkan kategori dan ketersediaan
- Tambah menu item baru
- Edit menu item (coming soon)

### Order Management (`/orders`)
- Lihat semua orders dengan filter status dan payment status
- Update order status
- Detail items per order

### Kitchen Queue (`/kitchen`)
- Kanban board dengan 3 kolom: Pending, Preparing, Ready
- Real-time updates setiap 3 detik
- Update status order (Start Preparing, Mark Ready, Complete)
- Priority indicator

### Inventory Management (`/inventory`)
- Lihat semua ingredients dengan stock level
- Alert untuk low stock dan out of stock items
- Update stock (add/reduce)
- Filter dan search

### User Management (`/users`)
- Tab untuk Staff dan Customers
- Lihat informasi staff (role, position, status)
- Lihat informasi customers dengan loyalty points
- Filter dan search

## GraphQL Integration

Frontend menggunakan Apollo Client untuk berkomunikasi dengan backend GraphQL services. Setiap service memiliki client terpisah:

- `apolloClient` - Order Service (default)
- `kitchenApolloClient` - Kitchen Service
- `inventoryApolloClient` - Inventory Service
- `userApolloClient` - User Service

## Real-time Updates

Beberapa halaman menggunakan polling untuk real-time updates:
- Dashboard: 5 detik
- Kitchen Queue: 3 detik
- Inventory: 10 detik
- Orders: 5 detik

## Build untuk Production

```bash
npm run build
npm start
```

## Notes

- Pastikan semua backend services sudah berjalan sebelum menjalankan frontend
- CORS sudah dikonfigurasi di backend untuk menerima request dari `http://localhost:3000`
- Untuk production, update environment variables sesuai dengan URL backend services
