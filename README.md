# Anugerah Resto - Sistem Manajemen Restoran Berbasis Microservices

**Sistem manajemen restoran terintegrasi** yang dibangun dengan arsitektur microservices, menggunakan GraphQL API, Docker containerization, dan Next.js frontend dashboard.

> **Mata Kuliah:** Integrasi Aplikasi Enterprise (IAE)  
> **Tahun Akademik:** 2024/2025  
> **Kelompok:** 5

---

## 📋 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Arsitektur Sistem](#️-arsitektur-sistem)
- [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
- [Prerequisites](#-prerequisites)
- [Instalasi & Setup](#-instalasi--setup)
- [Menjalankan Sistem](#-menjalankan-sistem)
- [Frontend Dashboard](#-frontend-dashboard)
- [GraphQL API Endpoints](#-graphql-api-endpoints)
- [Database Configuration](#-database-configuration)
- [Integrasi Antar Service](#-integrasi-antar-service)
- [Integrasi Lintas Kelompok (Toko Sembako)](#-integrasi-lintas-kelompok-toko-sembako)
- [Health Check & Monitoring](#-health-check--monitoring)
- [Struktur Project](#-struktur-project)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)
- [Kontributor](#-kontributor)

---

## 🎯 Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| 🍽️ **Menu Management** | Kelola menu items, kategori, harga, bahan baku, dan ketersediaan |
| 📦 **Order Management** | Pencatatan, tracking, dan pembayaran pesanan pelanggan |
| 👨‍🍳 **Kitchen Queue** | Antrian pesanan dapur dengan status tracking real-time |
| 📋 **Inventory Management** | Manajemen stok bahan baku dengan alert low stock |
| 👥 **User Management** | Manajemen staf, customer, dan program loyalty points |
| 📊 **Dashboard** | Overview statistik dan monitoring real-time |
| 🔗 **Cross-Group Integration** | Integrasi dengan Toko Sembako untuk pembelian bahan baku via Railway |
| 🔐 **Authentication** | JWT-based authentication dengan refresh token support |

---

## 🏗️ Arsitektur Sistem

### Diagram Arsitektur

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                                   │
│                       http://localhost:3000                                  │
│   ┌─────────────┬──────────────┬──────────────┬──────────────┐              │
│   │  Dashboard  │    Menu      │   Kitchen    │  Inventory   │              │
│   │     /       │    /menu     │   /kitchen   │  /inventory  │              │
│   └─────────────┴──────────────┴──────────────┴──────────────┘              │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                        GraphQL (Apollo Client)
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         │                          │                          │
         ▼                          ▼                          ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   ORDER SERVICE  │    │  KITCHEN SERVICE │    │INVENTORY SERVICE │
│    Port 4004     │◄──►│    Port 4001     │    │    Port 4002     │
│                  │    │                  │    │                  │
│  - Menu CRUD     │    │  - Order Queue   │    │  - Ingredients   │
│  - Cart          │    │  - Status Track  │    │  - Stock Moves   │
│  - Orders        │    │  - Chef Assign   │    │  - Suppliers     │
│  - Payments      │    │  - Priority Mgmt │    │  - Purchase Order│
└────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│    ORDER DB      │    │   KITCHEN DB     │    │  INVENTORY DB    │
│   MySQL:3310     │    │   MySQL:3307     │    │   MySQL:3311     │
└──────────────────┘    └──────────────────┘    └──────────────────┘
         │
         │
         ▼
┌──────────────────┐                            ┌──────────────────┐
│   USER SERVICE   │                            │   TOKO SEMBAKO   │
│    Port 4003     │                            │    (Railway)     │
│                  │                            │                  │
│  - Staff Mgmt    │                            │  - Products API  │
│  - Customer Mgmt │           Inventory ──────►│  - Inventory API │
│  - Loyalty Points│           Service          │  - Order API     │
│  - Auth (JWT)    │                            │                  │
└────────┬─────────┘                            └──────────────────┘
         │
         ▼
┌──────────────────┐
│     USER DB      │
│   MySQL:3312     │
└──────────────────┘
```

### Deskripsi Services

#### 1. Kitchen Service (Port 4001)
- Mengelola antrian pesanan untuk dapur
- Status tracking: `pending` → `preparing` → `ready` → `completed`
- Assign chef ke pesanan
- Priority management untuk pesanan urgent

#### 2. Inventory Service (Port 4002)
- Manajemen stok bahan baku (ingredients)
- Supplier management
- Stock movements tracking (in/out/adjustment)
- Low stock & out of stock alerts
- **Integrasi dengan Toko Sembako** untuk pembelian bahan baku

#### 3. User Service (Port 4003)
- Manajemen data staff (employee management)
- Manajemen data customer
- Program loyalty points
- **JWT Authentication** dengan refresh token

#### 4. Order Service (Port 4004)
- Katalog menu items dengan ingredients
- Shopping cart management
- Order processing dengan integrasi ke semua service
- Payment processing (cash, card, QRIS)
- Automatic loyalty points calculation

---

## 🚀 Teknologi yang Digunakan

### Backend - Dual Implementation

Project ini memiliki **dua implementasi lengkap** (Node.js dan Python) untuk fleksibilitas:

| Aspek | Node.js Implementation | Python Implementation |
|-------|------------------------|----------------------|
| **Runtime** | Node.js 18+ | Python 3.11+ |
| **Web Framework** | Express | FastAPI |
| **GraphQL** | Apollo Server | Ariadne |
| **Database Driver** | mysql2 | aiomysql |
| **HTTP Client** | axios | httpx/aiohttp |
| **Auth** | jsonwebtoken | PyJWT |

### Frontend

| Teknologi | Versi | Keterangan |
|-----------|-------|------------|
| Next.js | 16 | React framework dengan App Router |
| React | 19 | UI library |
| TypeScript | Latest | Type safety |
| Tailwind CSS | V4 | Utility-first CSS |
| Apollo Client | 3.x | GraphQL client |
| TailAdmin | Latest | Dashboard template |

### Infrastructure

| Teknologi | Keterangan |
|-----------|------------|
| Docker | Container runtime |
| Docker Compose | Multi-container orchestration |
| MySQL 8.0 | Relational database |
| Railway | Cloud deployment untuk integrasi eksternal |

---

## 📋 Prerequisites

Sebelum memulai, pastikan Anda memiliki:

- **Docker** & Docker Compose (versi terbaru)
- **Node.js 18+** (untuk development lokal atau frontend)
- **Python 3.11+** (untuk development lokal Python services)
- **Git** untuk clone repository

### Port yang Diperlukan

| Port | Service |
|------|---------|
| 3000 | Frontend (Next.js) |
| 4001 | Kitchen Service |
| 4002 | Inventory Service |
| 4003 | User Service |
| 4004 | Order Service |
| 3307 | Kitchen MySQL |
| 3310 | Order MySQL |
| 3311 | Inventory MySQL |
| 3312 | User MySQL |

---

## 🔧 Instalasi & Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd anugerah-resto
```

### 2. Setup Environment Variables

#### Backend Services
Docker Compose sudah dikonfigurasi dengan default values. Untuk kustomisasi, lihat `.env.example`.

#### Frontend
Buat file `.env.local` di folder `frontend/`:

```env
NEXT_PUBLIC_ORDER_SERVICE_URL=http://localhost:4004/graphql
NEXT_PUBLIC_KITCHEN_SERVICE_URL=http://localhost:4001/graphql
NEXT_PUBLIC_INVENTORY_SERVICE_URL=http://localhost:4002/graphql
NEXT_PUBLIC_USER_SERVICE_URL=http://localhost:4003/graphql
```

---

## 🚀 Menjalankan Sistem

### Opsi 1: Docker Compose (Recommended)

#### Python Implementation (Ariadne GraphQL)
```bash
# Build dan jalankan semua services
docker-compose -f docker-compose-python.yml up --build

# Atau jalankan di background
docker-compose -f docker-compose-python.yml up -d --build

# Lihat logs
docker-compose -f docker-compose-python.yml logs -f

# Stop services
docker-compose -f docker-compose-python.yml down

# Stop dan hapus volumes (reset database)
docker-compose -f docker-compose-python.yml down -v
```

#### Node.js Implementation (Apollo Server)
```bash
# Build dan jalankan
docker-compose up -d --build

# Stop
docker-compose down
```

### 2. Setup Database (Migration & Seeding)

#### Python Services
```bash
# Run migrations
docker exec kitchen-service-python python src/database/migrate.py
docker exec inventory-service-python python src/database/migrate.py
docker exec user-service-python python src/database/migrate.py
docker exec order-service-python python src/database/migrate.py

# Seed dengan sample data
docker exec order-service-python python src/database/seed.py
```

#### Node.js Services (Auto-Migration Enabled)
> **Note:** Services ini sudah dikonfigurasi untuk **otomatis menjalankan migration dan seeding** saat container baru dijalankan. Anda TIDAK PERLU menjalankan perintah manual di bawah ini kecuali untuk troubleshooting.

```bash
# Manual Migration (Optional/Troubleshooting only)
docker exec kitchen-service npm run migrate
docker exec inventory-service npm run migrate
docker exec user-service npm run migrate
docker exec order-service npm run migrate
```

### Opsi 2: Development Lokal (Tanpa Docker)

```bash
# Python services
cd kitchen-service-python && pip install -r requirements.txt
uvicorn src.main:app --host 0.0.0.0 --port 4001

# Node.js services
cd kitchen-service && npm install
npm run dev
```

---

## 👥 Access & Credentials (Default Users)

Berikut adalah daftar pengguna default yang telah disiapkan untuk testing:

| Role | Username | Password | Deskripsi |
|------|----------|----------|-----------|
| **Admin** | `admin` | `admin123` | Akses penuh ke seluruh sistem |
| **Manager** | `manager` | `password123` | Manajemen menu, staf, report |
| **Chef** | `chef`, `chef_budi`, `chef_agus`, `chef_citra` | `password123` | Manajemen pesanan dapur |
| **Waiter** | `waiter` | `password123` | Order taking, serve food |
| **Cashier** | `cashier` | `password123` | Pembayaran dan billing |

> **Note:** Password untuk semua akun staff default adalah `password123`, kecuali Admin yang menggunakan `admin123`.

---

## 🎨 Frontend Dashboard

### Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend berjalan di: `http://localhost:3000`

### Halaman Dashboard

| Halaman | Path | Deskripsi |
|---------|------|-----------|
| Dashboard | `/` | Overview statistik real-time |
| Menu | `/menu` | Kelola menu items & kategori |
| Orders | `/orders` | Lihat & kelola pesanan |
| Kitchen | `/kitchen` | Kanban board antrian dapur |
| Inventory | `/inventory` | Stok bahan baku & suppliers |
| Users | `/users` | Staff & customer management |

---
# 📸 Dokumentasi Tampilan Sistem – Anugerah Resto

Dokumen ini berisi screenshot tampilan aplikasi **Anugerah Resto** .
Setiap gambar menunjukkan fitur dan tampilan dari masing-masing service yang telah diimplementasikan.

---
### Login
![Login](docs/Interface/1.%20Login.png)

### Login Invalid
![Login Invalid](docs/Interface/2.%20Login%20Invalid.png)

---
## 📊 Dashboard & Main Pages

### Dashboard
![Dashboard](docs/Interface/3.%20Dashboard.png)

### Menu
![Menu](docs/Interface/4.%20Menu.png)

### Orders
![Orders](docs/Interface/5.%20Orders.png)

### Kitchen
![Kitchen](docs/Interface/6.%20Kitchen.png)

### Inventory
![Inventory](docs/Interface/7.%20Inventory.png)

### Users - Staff
![Users Staff](docs/Interface/8.%20UsersStaff.png)

### Users - Pelanggan
![Users Pelanggan](docs/Interface/9.%20UserPelanggan.png)

---

## 🍽️ Menu Management

### Tambah Menu Baru
![Tambah Menu Baru](docs/Interface/10.%20Tambah%20Menu%20Baru.png)

### Hasil Tambah Menu
![Hasil Tambah Menu](docs/Interface/11.%20Hasil%20Tambah%20Menu.png)

### Hasil Edit Menu
![Hasil Edit Menu](docs/Interface/12.%20Hasil%20Edit%20Menu.png)

### Hapus Menu
![Hapus Menu](docs/Interface/13.%20Hapus%20Menu.png)

### Hasil Hapus Menu
![Hasil Hapus Menu](docs/Interface/14.%20hasil%20Hapus%20Menu%20.png)

---

## 📦 Order Management

### Order Pending
![Order Pending](docs/Interface/15.%20Order%20Pending%20.png)

### Order Confirm
![Order Confirm](docs/Interface/16.%20Order%20Confirm.png)

### Order Preparing
![Order Preparing](docs/Interface/17.%20Order%20Preparing.png)

### Order Ready
![Order Ready](docs/Interface/18.%20Order%20Ready.png)

### Order Completed
![Order Completed](docs/Interface/19.%20Order%20Completed.png)

### Order Cancel
![Order Cancel](docs/Interface/20.%20Order%20Cancel.png)

### Edit Order
![Edit Order](docs/Interface/22.%20Edit%20Order.png)

---

## 👨‍🍳 Kitchen Management

### Kitchen Order Pending
![Kitchen Order Pending](docs/Interface/21.%20Kitchen%20Order%20Pending.png)

### Kitchen Order Process
![Kitchen Order Process](docs/Interface/21.%20Kitchen%20Order%20Process.png)

---

## 📋 Inventory Management

### Beli Produk
![Beli Produk](docs/Interface/23.%20Beli%20Produk.png)

### Beli Produk
![Beli Produk](docs/Interface/24.%20Beli%20Produk.png)

### Beli Produk
![Beli Produk](docs/Interface/25.%20Beli%20Produk.png)

### Berhasil Membeli Produk
![Berhasil Membeli Produk](docs/Interface/26.%20Berhasil%20Membeli%20Beli%20Produk.png)

### Edit Bahan Baku
![Edit Bahan Baku](docs/Interface/27.%20Edit%20Bahan%20Baku.png)

### Berhasil Edit Bahan Baku
![Berhasil Edit Bahan Baku](docs/Interface/28.%20Berhasil%20Edit%20Bahan%20Baku.png)

### Hapus Bahan Baku
![Hapus Bahan Baku](docs/Interface/29.%20Hapus%20Bahan%20Baku.png)

### Bahan Baku Berhasil Dihapus
![Bahan Baku Berhasil Dihapus](docs/Interface/30.%20Bahan%20Baku%20Berhasil%20Dihapus.png)

---

## 👥 Staff Management

### Tambah Staff
![Tambah Staff](docs/Interface/31.%20%20Tambah%20Staff.png)

### Berhasil Tambah Staff
![Berhasil Tambah Staff](docs/Interface/32.%20Berhasil%20Tambah%20Staff.png)

### Hasil Edit Staff
![Hasil Edit Staff](docs/Interface/33.%20Hasil%20Edit%20Staff.png)

### Hapus Staff
![Hapus Staff](docs/Interface/34.%20Hapus%20Staff.png)

### Berhasil Hapus Staff
![Berhasil Hapus Staff](docs/Interface/35.%20Brhasil%20Hapus%20Staff.png)

### Hasil Hapus Staff
![Hasil Hapus Staff](docs/Interface/36.%20Hail%20Hapus%20staff.png)

---

## 👤 Customer Management

### Tambah Pelanggan
![Tambah Pelanggan](docs/Interface/37.%20%20Tambah%20Pelanggan.png)

### Berhasil Tambah Pelanggan
![Berhasil Tambah Pelanggan](docs/Interface/38.%20Berhasil%20Tambah%20Pelanggan.png)

### Edit Pelanggan
![Edit Pelanggan](docs/Interface/39.%20Edit%20Pelanggan.png)

### Berhasil Edit Pelanggan
![Berhasil Edit Pelanggan](docs/Interface/40.%20Berhasil%20Edit%20Pelanggan.png)

### Hapus Pelanggan
![Hapus Pelanggan](docs/Interface/41.%20Hapus%20Pelanggan.png)

### Berhasil Hapus Pelanggan
![Berhasil Hapus Pelanggan](docs/Interface/42.%20Berhasil%20Hapus%20Pelanggan.png)

---

---

## 🌐 GraphQL API Endpoints

### Service Endpoints

| Service | URL | Playground |
|---------|-----|------------|
| Kitchen | `http://localhost:4001/graphql` | ✅ |
| Inventory | `http://localhost:4002/graphql` | ✅ |
| User | `http://localhost:4003/graphql` | ✅ |
| Order | `http://localhost:4004/graphql` | ✅ |

### Contoh Query & Mutation

#### Menu Management
```graphql
# Get all menus
query {
  menus(category: "main_course") {
    id
    menuId
    name
    category
    price
    available
    ingredients {
      ingredientId
      ingredientName
      quantity
      unit
    }
  }
}

# Create menu
mutation {
  createMenu(input: {
    menuId: "MENU001"
    name: "Nasi Goreng Spesial"
    category: "main_course"
    price: 25000
    ingredients: [
      { ingredientId: "1", ingredientName: "Nasi", quantity: 200, unit: "gram" }
    ]
  }) {
    id
    name
    price
  }
}
```

#### Order Processing
```graphql
# Create order
mutation {
  createOrder(input: {
    orderId: "ORD001"
    tableNumber: "T01"
    items: [
      { menuId: "MENU001", name: "Nasi Goreng", quantity: 2, price: 25000 }
    ]
    paymentMethod: "cash"
  }) {
    order {
      id
      orderId
      total
      orderStatus
    }
    kitchenOrderCreated
    stockUpdated
    loyaltyPointsAdded
  }
}
```

#### Kitchen Queue
```graphql
# Get pending orders
query {
  kitchenOrders(status: "pending") {
    id
    orderId
    status
    priority
    items { name quantity }
    chef { name }
  }
}

# Update status
mutation {
  updateOrderStatus(id: "1", status: "preparing") {
    id
    status
  }
}
```

#### Authentication
```graphql
# Login
mutation {
  loginStaff(username: "admin", password: "admin123") {
    token
    refreshToken
    expiresAt
    staff {
      id
      name
      role
    }
    message
  }
}

# Refresh token
mutation {
  refreshToken(refreshToken: "your-refresh-token") {
    token
    expiresAt
    message
  }
}
```

---
# 📡 GraphQL Documentation

Dokumentasi ini menjelaskan implementasi GraphQL pada sistem Anugerah Resto

---

## Integration GraphQL
Digunakan untuk integrasi data antara **Anugerah Resto** dan **Toko Sembako**.

### 1. Create Produk Bumbu
![Create Produk Bumbu](docs/Graphql/integration/1.%20CREATE%20-%20produk%20bumbu.png)

### 2. Read Produk Toko Sembako
![Read Produk](docs/Graphql/integration/2.%20READ%20-Toko%20sembako%20produk.png)

### 3. Increase Stock
![Increase Stock](docs/Graphql/integration/3.%20Toko%20sembako%20increase%20stock.png)

### 4. Check Stock dari Anugerah Resto
![Check Stock](docs/Graphql/integration/4.%20anugrah%20check%20toko%20sembako%20stock.png)

---

## GraphQL – Inventory Service

### 1. Get Toko Sembako Product by ID
![Get Product by ID](docs/Graphql/inventory/1.%20READ%20–%20Get%20Toko%20Sembako%20Product%20by%20ID.png)

### 2. Check Toko Sembako Stock
![Check Stock](docs/Graphql/inventory/2.%20READ%20–%20Check%20Toko%20Sembako%20Stock.png)

### 3. Purchase From Toko Sembako (Single Item)
![Purchase Single](docs/Graphql/inventory/3.%20CREATE%20–%20Purchase%20From%20Toko%20Sembako%20(Single%20Item).png)

### 4. Purchase From Toko Sembako (Multiple Items)
![Purchase Multiple](docs/Graphql/inventory/4.%20CREATE%20–%20Purchase%20From%20Toko%20Sembako%20(Multiple%20Items).png)

### 5. Purchase From Toko Sembako (High Minimum Stock)
![Purchase High Min](docs/Graphql/inventory/5CREATE%20–%20Purchase%20From%20Toko%20Sembako%20(High%20Minimum%20Stock).png)

### 6. Get Ingredients
![Get Ingredients](docs/Graphql/inventory/6.%20READ%20–%20Get%20Ingredients.png)

### 7. Get Low Stock Ingredients
![Low Stock](docs/Graphql/inventory/7.%20READ%20–%20Get%20Low%20Stock%20Ingredients.png)

### 8. Get Suppliers
![Get Suppliers](docs/Graphql/inventory/8.%20READ%20–%20Get%20Suppliers.png)

### 9. Get Purchase Order
![Get Purchase Order](docs/Graphql/inventory/9.%20READ%20-%20Get%20Purchase%20Order.png)

### 10. Get Toko Sembako Product
![Get Toko Sembako Product](docs/Graphql/inventory/10.%20Get%20Toko%20Sembako%20Product.png)

---

## GraphQL – Kitchen Service 

### 1. Buat Kitchen Order
![Create Kitchen Order](docs/Graphql/Kitchen/1.%20CREATE%20-%20Buat%20Kitchen%20Order.png)

### 2. Ambil Semua Kitchen Orders
![Get Kitchen Orders](docs/Graphql/Kitchen/2.%20READ%20-%20Ambil%20Semua%20Kitchen%20Orders.png)

### 3. Ambil Kitchen Order by ID
![Get by ID](docs/Graphql/Kitchen/3.%20READ%20-%20Ambil%20Kitchen%20Order%20by%20ID.png)

### 4. Ambil Kitchen Order by Order ID
![Get by Order ID](docs/Graphql/Kitchen/4.%20READ%20-%20Ambil%20Kitchen%20Order%20by%20Order%20ID.png)

### 5. Filter Kitchen Orders by Status
![Filter by Status](docs/Graphql/Kitchen/5.%20READ%20-%20Filter%20Kitchen%20Orders%20by%20Status.png)

### 6. Update Order Status
![Update Status](docs/Graphql/Kitchen/6.%20UPDATE%20-%20Update%20Order%20Status.png)

### 7. Assign Chef
![Assign Chef](docs/Graphql/Kitchen/7.%20UPDATE%20-%20Assign%20Chef.png)

### 8. Update Estimated Time
![Update Time](docs/Graphql/Kitchen/8.%20UPDATE%20-%20Update%20Estimated%20Time.png)

### 9. Complete Order
![Complete Order](docs/Graphql/Kitchen/9.%20UPDATE%20-%20Complete%20Order.png)

### 10. Cancel Kitchen Order
![Cancel Order](docs/Graphql/Kitchen/10.%20DELETE%20-%20Cancel%20Kitchen%20Order.png)

### 11. Ambil Semua Chef
![Get Chef](docs/Graphql/Kitchen/11.%20READ%20-%20Ambil%20Semua%20Chef.png)

### 12. Ambil Chef by ID
![Chef by ID](docs/Graphql/Kitchen/12.%20READ%20-%20Ambil%20Chef%20by%20ID.png)

### 13. Ambil Orders by Chef
![Orders by Chef](docs/Graphql/Kitchen/13.%20READ%20-%20Ambil%20Orders%20by%20Chef.png)

---

## GraphQL – Order Service

### Menu Management

#### 1. Buat Menu Baru
![Create Menu](docs/Graphql/order/1.%20CREATE%20-%20Buat%20Menu%20Baru.png)

#### 2. Ambil Semua Menu
![Get All Menu](docs/Graphql/order/2.%20READ%20-%20Ambil%20Semua%20Menu.png)

#### 3. Ambil Menu by ID
![Get Menu by ID](docs/Graphql/order/3.%20READ%20-%20Ambil%20Menu%20by%20ID.png)

#### 4. Ambil Menu by Menu ID
![Get Menu by Menu ID](docs/Graphql/order/4.%20READ%20-%20Ambil%20Menu%20by%20Menu%20ID.png)

#### 5. Filter Menu by Category
![Filter Menu](docs/Graphql/order/5.%20READ%20-%20Filter%20Menu%20by%20Category.png)

#### 6. Ambil Kategori Menu
![Get Categories](docs/Graphql/order/6.%20READ%20-%20Ambil%20Kategori%20Menu.png)

#### 7. Update Menu
![Update Menu](docs/Graphql/order/7.%20UPDATE%20-%20Update%20Menu.png)

#### 8. Toggle Availability
![Toggle Availability](docs/Graphql/order/8.%20UPDATE%20-%20Toggle%20Availability.png)

#### 9. Hapus Menu
![Delete Menu](docs/Graphql/order/9.%20DELETE%20-%20Hapus%20Menu.png)

### Cart Management

#### 10. Buat Cart Baru
![Create Cart](docs/Graphql/order/10.%20CREATE%20-%20Buat%20Cart%20Baru.png)

#### 11. Tambah Item ke Cart
![Add to Cart](docs/Graphql/order/11.%20UPDATE%20-%20Tambah%20Item%20ke%20Cart.png)

#### 12. Update Item di Cart
![Update Cart Item](docs/Graphql/order/12.%20Picture43UPDATE%20-%20Update%20Item%20di%20Cart.png)

#### 13. Hapus Item dari Cart
![Remove from Cart](docs/Graphql/order/13.%20DELETE%20-%20Hapus%20Item%20dari%20Cart.png)

#### 14. Clear Cart
![Clear Cart](docs/Graphql/order/14.%20DELETE%20-%20Clear%20Cart.png)

#### 15. Ambil Cart
![Get Cart](docs/Graphql/order/15.%20READ%20-%20Ambil%20Cart.png)

### Order Management

#### 16. Buat Order dari Cart
![Create Order from Cart](docs/Graphql/order/16.%20CREATE%20-%20Buat%20Order%20dari%20Cart.png)

#### 17. Buat Order Langsung
![Create Direct Order](docs/Graphql/order/17.%20%20CREATE%20-%20Buat%20Order%20Langsung.png)

#### 18. Ambil Semua Order
![Get All Orders](docs/Graphql/order/18.%20READ%20-%20Ambil%20Semua%20Order.png)

#### 19. Ambil Order by ID
![Get Order by ID](docs/Graphql/order/19.%20READ%20-%20Ambil%20Order%20by%20ID.png)

#### 20. Filter Orders by Status
![Filter by Status](docs/Graphql/order/20.%20READ%20-%20Filter%20Orders%20by%20Status.png)

#### 21. Filter Orders by Customer
![Filter by Customer](docs/Graphql/order/21.%20READ%20-%20Filter%20Orders%20by%20Customer.png)

#### 22. Cek Stock Menu
![Check Stock](docs/Graphql/order/22.%20READ%20-%20Cek%20Stock%20Menu.png)

#### 23. Update Order Status
![Update Status](docs/Graphql/order/23.%20UPDATE%20-%20Update%20Order%20Status.png)

#### 24. Kirim ke Dapur
![Send to Kitchen](docs/Graphql/order/24.%20UPDATE%20-%20Kirim%20ke%20Dapur.png)

#### 25. Update Payment Status
![Update Payment Status](docs/Graphql/order/25.%20UPDATE%20-%20Update%20Payment%20Status.png)

#### 26. Cancel Order
![Cancel Order](docs/Graphql/order/26.%20DELETE%20-%20Cancel%20Order.png)

---

## GraphQL – User Service

### Staff Management

#### 1. Buat Staff Baru
![Create Staff](docs/Graphql/user/1.%20CREATE%20-%20Buat%20Staff%20Baru.png)

#### 2. Ambil Semua Staff
![Get All Staff](docs/Graphql/user/2.%20READ%20-%20Ambil%20Semua%20Staff.png)

#### 3. Ambil Staff by ID
![Get Staff by ID](docs/Graphql/user/3.%20READ%20-%20Ambil%20Staff%20by%20ID.png)

#### 4. Ambil Staff by Employee ID
![Get Staff by Employee ID](docs/Graphql/user/4.%20READ%20-%20Ambil%20Staff%20by%20Employee%20ID.png)

#### 5. Filter Staff by Role
![Filter Staff by Role](docs/Graphql/user/5.%20READ%20-%20Filter%20Staff%20by%20Role.png)

#### 6. Update Staff
![Update Staff](docs/Graphql/user/6.%20UPDATE%20-Update%20Staff.png)

#### 7. Hapus Staff
![Delete Staff](docs/Graphql/user/7.%20DELETE%20-%20Hapus%20Staff.png)

### Customer Management

#### 8. Buat Customer Baru
![Create Customer](docs/Graphql/user/8.%20CREATE%20-%20Buat%20Customer%20Baru.png)

#### 9. Ambil Semua Customer
![Get All Customers](docs/Graphql/user/9.%20READ%20-%20Ambil%20Semua%20Customer.png)

#### 10. Ambil Customer by ID
![Get Customer by ID](docs/Graphql/user/10.%20READ%20-%20Ambil%20Customer%20%20by%20ID.png)

#### 11. Ambil Customer by Customer ID
![Get Customer by Customer ID](docs/Graphql/user/11.%20READ%20-%20Ambil%20Customer%20%20by%20Customer%20ID.png)

#### 12. Update Customer
![Update Customer](docs/Graphql/user/12.%20UPDATE%20-%20Update%20Customer.png)

#### 13. Hapus Customer
![Delete Customer](docs/Graphql/user/13.%20DELETE%20-%20Hapus%20Customer.png)

### Loyalty Program

#### 14. Ambil Semua Loyalty Programs
![Get Loyalty Programs](docs/Graphql/user/14.%20READ%20-Ambil%20Semua%20Loyalty%20Programs.png)

#### 15. Enroll Customer ke Loyalty
![Enroll to Loyalty](docs/Graphql/user/15.%20CREATE%20-%20Enroll%20Customer%20ke%20Loyalty.png)

#### 16. Earn Point
![Earn Points](docs/Graphql/user/16.%20UPDATE%20-%20Earn%20Point.png)

#### 17. Redeem Points
![Redeem Points](docs/Graphql/user/17.%20UPDATE%20-Redeem%20Points.png)

#### 18. Top Customers by Point
![Top Customers](docs/Graphql/user/18.%20READ%20-%20Top%20Customers%20by%20Point.png)

### Authentication

#### 19. Login
![Login](docs/Graphql/user/19.%20LOGIN%20-Returns%20Access%20token%20(7h)%20and%20Refresh%20Token.png)

#### 20. Refresh Token
![Refresh Token](docs/Graphql/user/20.%20REFRESH%20TOKEN%20-%20Get%20New%20Access.png)

#### 21. Logout
![Logout](docs/Graphql/user/21.%20LOGOUT%20-%20Revoke%20Refresh%20Token.png)

---

## 💾 Database Configuration

### Database Ports

| Database | Port | User | Password | Database Name |
|----------|------|------|----------|---------------|
| Kitchen DB | 3307 | kitchen_user | kitchen_pass | kitchen_db |
| Order DB | 3310 | order_user | order_pass | order_db |
| Inventory DB | 3311 | inventory_user | inventory_pass | inventory_db |
| User DB | 3312 | user_user | user_pass | user_db |

### Akses Database Manual

```bash
# Contoh akses Kitchen DB
docker exec -it kitchen-db mysql -u kitchen_user -pkitchen_pass kitchen_db
```

---

## 🔗 Integrasi Antar Service

### Order Service Flow

Saat order dibuat, Order Service melakukan:

1. **Validasi menu** - Cek menu exists
2. **Cek stok** → Inventory Service
3. **Buat kitchen order** → Kitchen Service
4. **Kurangi stok** → Inventory Service
5. **Tambah loyalty points** → User Service

```
Order Service
     │
     ├──► Kitchen Service (createKitchenOrder)
     │
     ├──► Inventory Service (checkStock, reduceStock)
     │
     └──► User Service (addLoyaltyPoints)
```

---

## 🌐 Integrasi Lintas Kelompok (Toko Sembako)

### 📋 Overview Integrasi

Sistem **Anugerah Resto** (Kelompok 5) terintegrasi secara langsung dengan sistem **Toko Sembako** (Kelompok Mitra) melalui **Railway Cloud Platform**. Integrasi ini memungkinkan restoran untuk:

- 📦 **Melihat katalog produk** bahan baku dari Toko Sembako
- ✅ **Mengecek ketersediaan stok** sebelum order
- 🛒 **Melakukan pembelian otomatis** bahan baku
- 🔄 **Sinkronisasi stok real-time** ke inventory lokal

### 🌍 Railway Deployment - Link Project

#### 🍽️ Anugerah Resto (Consumer - Kelompok 5)

| Komponen | URL |
|----------|-----|
| **GraphQL Endpoint** | `https://tubes-iae-anugerah-resto-production.up.railway.app/graphql` |

#### 🏪 Toko Sembako (Provider - Kelompok Mitra)

| Service | URL |
|---------|-----|
| **Product Service** | `https://toko-sembako-revisi-production.up.railway.app/graphql/product` |
| **Inventory Service** | `https://toko-sembako-revisi-production.up.railway.app/graphql/inventory` |
| **Order Service** | `https://toko-sembako-revisi-production.up.railway.app/graphql/order` |

### 🔌 Metode Integrasi: GraphQL API

Integrasi antar kelompok menggunakan **GraphQL API** melalui protokol HTTPS. Berikut adalah detail teknisnya:

```
┌─────────────────────────────┐        HTTPS POST Request        ┌─────────────────────────────┐
│    ANUGERAH RESTO           │  ─────────────────────────────►  │      TOKO SEMBAKO           │
│    (Consumer)               │                                  │      (Provider)             │
│                             │  ◄─────────────────────────────  │                             │
│  Inventory Service          │         JSON Response            │  Railway Cloud              │
│  localhost:4002             │                                  │  toko-sembako-revisi        │
└─────────────────────────────┘                                  └─────────────────────────────┘
```

#### Spesifikasi API:

| Aspek | Detail |
|-------|--------|
| **Protokol** | HTTPS (Secure HTTP) |
| **Format API** | GraphQL (Query & Mutation) |
| **Data Format** | JSON |
| **HTTP Method** | POST |
| **Content-Type** | `application/json` |

#### Contoh Request API:

```javascript
// Request dari Anugerah Resto ke Toko Sembako
const response = await axios.post(
  'https://toko-sembako-revisi-production.up.railway.app/graphql/product',
  {
    query: `
      query GetProducts {
        products {
          id
          name
          price
          unit
          available
        }
      }
    `
  },
  {
    headers: { 'Content-Type': 'application/json' }
  }
);

// Response dari Toko Sembako
{
  "data": {
    "products": [
      { "id": "1", "name": "Beras Premium", "price": 15000, "unit": "kg", "available": true },
      { "id": "2", "name": "Minyak Goreng", "price": 18000, "unit": "liter", "available": true }
    ]
  }
}
```

#### Fitur API Integration:

| Fitur | Deskripsi |
|-------|-----------|
| 📦 **Fetch Products** | Mengambil daftar produk dari katalog Toko Sembako |
| ✅ **Check Stock** | Mengecek ketersediaan stok sebelum melakukan order |
| 🛒 **Create Order** | Membuat pesanan pembelian bahan baku |
| 🔄 **Auto Retry** | Otomatis retry 3x dengan exponential backoff (1s → 2s → 4s) jika gagal |
| ⏱️ **Timeout** | 10 detik per request untuk mencegah hanging |


### 📡 API Endpoints Toko Sembako

#### 1. Product Service - Katalog Produk

**Endpoint:** `https://toko-sembako-revisi-production.up.railway.app/graphql/product`

```graphql
# Lihat semua produk
query GetProducts {
  products {
    id
    name
    category
    price
    unit
    available
    description
  }
}

# Lihat produk berdasarkan kategori
query GetProductsByCategory {
  products(category: "Bahan Pokok") {
    id
    name
    price
    unit
    available
  }
}

# Lihat detail produk by ID
query GetProductById {
  getProductById(id: "1") {
    id
    name
    price
    unit
  }
}
```

#### 2. Inventory Service - Cek Stok

**Endpoint:** `https://toko-sembako-revisi-production.up.railway.app/graphql/inventory`

```graphql
# Cek ketersediaan stok spesifik
query CheckStock {
  checkStock(productId: "1", quantity: 50) {
    available
    currentStock
    requestedQuantity
    message
  }
}

# Lihat semua inventory
query GetAllInventory {
  getAllInventory {
    productId
    stock
  }
}

# Set stock (untuk supplier/admin)
mutation SetStock {
  setStock(productId: "1", stock: 100) {
    productId
    stock
  }
}
```

#### 3. Order Service - Pemesanan

**Endpoint:** `https://toko-sembako-revisi-production.up.railway.app/graphql/order`

```graphql
# Buat pesanan baru
mutation CreateOrder {
  createOrder(
    restaurantId: "anugerah-resto"
    items: [
      { productId: "1", qty: 10 }
      { productId: "2", qty: 5 }
    ]
  ) {
    id
    restaurantId
    items {
      productId
      qty
      price
      subtotal
    }
    total
    status
  }
}

# Cek status pesanan
query GetOrderById {
  getOrderById(orderId: "123") {
    id
    status
    total
    items {
      productId
      qty
    }
  }
}
```

### 🔄 Alur Integrasi Lengkap

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ANUGERAH RESTO (Localhost/Docker)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│    ┌─────────────────┐                      ┌───────────────────────┐       │
│    │ Inventory Service│                      │   Frontend Dashboard  │       │
│    │   (Port 4002)    │◄─────────────────────│     Toko Sembako      │       │
│    └────────┬─────────┘                      │      Integration      │       │
│             │                                └───────────────────────┘       │
│             │ HTTP/GraphQL                                                   │
│             ▼                                                                │
└─────────────┼────────────────────────────────────────────────────────────────┘
              │
              │ Internet (HTTPS)
              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      RAILWAY CLOUD (toko-sembako-revisi)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────┐  ┌─────────────────┐  ┌────────────────┐                │
│  │ Product Service│  │Inventory Service│  │ Order Service  │                │
│  │    /graphql/   │  │    /graphql/    │  │   /graphql/    │                │
│  │    product     │  │    inventory    │  │     order      │                │
│  └───────┬────────┘  └───────┬─────────┘  └───────┬────────┘                │
│          │                   │                    │                          │
│          └───────────────────┴────────────────────┘                          │
│                              │                                               │
│                              ▼                                               │
│                    ┌─────────────────┐                                       │
│                    │   MySQL (Railway)│                                       │
│                    │   toko_sembako_db│                                       │
│                    └─────────────────┘                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 💻 Implementasi di Anugerah Resto

#### Node.js Client (`inventory-service/src/services/tokoSembakoClient.js`)

```javascript
const TOKO_SEMBAKO_BASE_URL = process.env.TOKO_SEMBAKO_URL 
  || 'https://toko-sembako-revisi-production.up.railway.app';

// Fetch produk
async function getTokoSembakoProducts(category) {
  const response = await axios.post(`${TOKO_SEMBAKO_BASE_URL}/graphql/product`, {
    query: `query { products(category: "${category}") { id name price unit } }`
  });
  return response.data.data.products;
}

// Check stock
async function checkTokoSembakoStock(productId, quantity) {
  const response = await axios.post(`${TOKO_SEMBAKO_BASE_URL}/graphql/inventory`, {
    query: `query { checkStock(productId: "${productId}", quantity: ${quantity}) { available currentStock } }`
  });
  return response.data.data.checkStock;
}
```

#### Python Client (`inventory-service-python/src/services/toko_sembako_client.py`)

```python
import aiohttp

TOKO_SEMBAKO_PRODUCT_URL = os.getenv(
    'TOKO_SEMBAKO_PRODUCT_URL',
    'https://toko-sembako-revisi-production.up.railway.app/graphql/product'
)

async def get_products_from_toko_sembako(category=None):
    query = """
    query { products { id name price unit available } }
    """
    async with aiohttp.ClientSession() as session:
        async with session.post(TOKO_SEMBAKO_PRODUCT_URL, json={"query": query}) as resp:
            data = await resp.json()
            return data.get("data", {}).get("products", [])
```

### 📊 GraphQL Queries dari Anugerah Resto

Berikut adalah queries yang tersedia dari **Inventory Service** Anugerah Resto untuk berinteraksi dengan Toko Sembako:

```graphql
# =====================================================
# 📍 ENDPOINT: http://localhost:4002/graphql (Inventory Service)
# =====================================================

# 1. Lihat produk Toko Sembako
query GetTokoSembakoProducts {
  tokoSembakoProducts(category: "Bahan Pokok") {
    id
    name
    category
    price
    unit
    available
    description
  }
}

# 2. Cek stok sebelum order
query CheckTokoSembakoStock {
  checkTokoSembakoStock(productId: "1", quantity: 10) {
    available
    currentStock
    requestedQuantity
    message
  }
}

# 3. Beli dari Toko Sembako (otomatis tambah ke inventory lokal)
mutation PurchaseFromTokoSembako {
  purchaseFromTokoSembako(input: {
    orderNumber: "PO-2026-001"
    items: [
      { productId: "1", quantity: 50 }
      { productId: "2", quantity: 25 }
    ]
    notes: "Pembelian bulanan bahan pokok"
  }) {
    success
    message
    tokoSembakoOrder {
      id
      status
      total
    }
    stockAdded
  }
}

# 4. Sync stok individual
mutation SyncStockFromTokoSembako {
  syncStockFromTokoSembako(productId: "1", quantity: 100) {
    id
    name
    currentStock
    unit
  }
}
```

### ⚙️ Konfigurasi Environment Variables

#### Docker Compose (Recommended)

Di `docker-compose.yml` atau `docker-compose-python.yml`:

```yaml
services:
  inventory-service:
    environment:
      # Toko Sembako Railway Cloud URLs
      TOKO_SEMBAKO_PRODUCT_URL: https://toko-sembako-revisi-production.up.railway.app/graphql/product
      TOKO_SEMBAKO_INVENTORY_URL: https://toko-sembako-revisi-production.up.railway.app/graphql/inventory
      TOKO_SEMBAKO_ORDER_URL: https://toko-sembako-revisi-production.up.railway.app/graphql/order
```

#### Local Development (.env)

```env
TOKO_SEMBAKO_URL=https://toko-sembako-revisi-production.up.railway.app
TOKO_SEMBAKO_PRODUCT_URL=https://toko-sembako-revisi-production.up.railway.app/graphql/product
TOKO_SEMBAKO_INVENTORY_URL=https://toko-sembako-revisi-production.up.railway.app/graphql/inventory
TOKO_SEMBAKO_ORDER_URL=https://toko-sembako-revisi-production.up.railway.app/graphql/order
```

### 🔄 Fitur Smart Integration

#### 1. Smart Category Mapping
Saat membeli dari Toko Sembako, sistem otomatis mengkategorikan bahan baku:

| Nama Produk | Kategori Otomatis |
|-------------|-------------------|
| Beras, Tepung, Mie | Bahan Pokok |
| Ayam, Sapi, Ikan | Daging & Ikan |
| Bayam, Wortel, Tomat | Sayuran |
| Garam, Gula, Merica | Bumbu |
| Susu, Keju, Telur | Dairy & Telur |
| Lainnya | Bahan Baku |

#### 2. Auto-Sync Chef (Kitchen ↔ User Service)
Jika assign chef yang belum ada di database Kitchen, sistem otomatis:
1. Query ke User Service
2. Cek apakah staff tersebut role-nya CHEF
3. Tambahkan ke database Kitchen lokal
4. Lanjutkan assignment

#### 3. Retry Mechanism
API calls ke Toko Sembako dilengkapi dengan automatic retry:

| Setting | Value |
|---------|-------|
| Max Retries | 3 |
| Backoff | Exponential (1s → 2s → 4s) |
| Timeout | 10 seconds per request |

### 🧪 Testing Integrasi

#### Quick Test via GraphQL Playground

1. Buka `http://localhost:4002/graphql` (Inventory Service)
2. Jalankan query berikut:

```graphql
# Test 1: Fetch products
query { tokoSembakoProducts { id name price } }

# Test 2: Check stock
query { checkTokoSembakoStock(productId: "1", quantity: 5) { available message } }
```

#### Integration Test Scenarios

| Skenario | Expected Result |
|----------|----------------|
| Fetch products dari Railway | Return array produk dengan id, name, price |
| Check stock dengan qty tersedia | `available: true` |
| Check stock dengan qty > stock | `available: false`, message: "Stock tidak cukup" |
| Purchase dengan stock cukup | `success: true`, stock lokal bertambah |
| Purchase dengan stock kurang | Error message dari Toko Sembako |

### ❗ Troubleshooting Integrasi

#### Connection Refused
```
Error: connect ECONNREFUSED
```
**Solusi:** 
- Pastikan Railway service aktif
- Cek URL tidak typo
- Test dengan curl: `curl https://toko-sembako-revisi-production.up.railway.app/graphql/product`

#### GraphQL Errors
```
Error: Cannot query field "xxx" on type "Query"
```
**Solusi:**
- Cek schema Toko Sembako (mungkin berubah)
- Gunakan introspection untuk melihat schema terbaru

#### Network Timeout
```
Error: timeout of 10000ms exceeded
```
**Solusi:**
- Railway mungkin cold start (tunggu 10-30 detik)
- Tingkatkan timeout jika diperlukan

---

## 📡 Health Check & Monitoring

### Health Check Endpoint

Setiap service memiliki health check query:

```graphql
query {
  health {
    status
    service
    version
    uptime
    timestamp
  }
}
```

**Response:**
```json
{
  "status": "healthy",
  "service": "inventory-service-python",
  "version": "1.0.0",
  "uptime": 3600.5,
  "timestamp": "2026-01-04T08:00:00Z"
}
```

### Retry Mechanism

API calls ke Toko Sembako dilengkapi dengan automatic retry:

| Setting | Value |
|---------|-------|
| Max Retries | 3 |
| Backoff | Exponential (1s → 2s → 4s) |
| Timeout | 10 seconds per request |

---

## 📁 Struktur Project

```
anugerah-resto/
├── docker-compose.yml              # Node.js services configuration
├── docker-compose-python.yml       # Python services configuration
├── .env.example                    # Environment template
├── README.md                       # Dokumentasi (file ini)
│
├── kitchen-service/                # Node.js Kitchen Service
│   ├── src/
│   │   ├── index.js
│   │   ├── database/
│   │   │   ├── connection.js
│   │   │   └── migrate.js
│   │   └── graphql/
│   │       ├── typeDefs.js
│   │       └── resolvers.js
│   ├── package.json
│   └── Dockerfile
│
├── kitchen-service-python/         # Python Kitchen Service
│   ├── src/
│   │   ├── main.py
│   │   ├── database/
│   │   │   ├── connection.py
│   │   │   └── migrate.py
│   │   └── graphql/
│   │       ├── schema.graphql
│   │       └── resolvers.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── inventory-service/              # Node.js Inventory Service
├── inventory-service-python/       # Python Inventory Service
│   └── src/services/
│       └── toko_sembako_client.py  # Toko Sembako integration
│
├── user-service/                   # Node.js User Service
├── user-service-python/            # Python User Service
│
├── order-service/                  # Node.js Order Service
├── order-service-python/           # Python Order Service
│
├── frontend/                       # Next.js Dashboard
│   ├── src/
│   │   ├── app/(admin)/           # Pages
│   │   ├── components/            # React components
│   │   └── lib/
│   │       └── apollo-client.ts   # GraphQL client config
│   └── package.json
│
├── toko-sembako/                   # Mock Toko Sembako (for testing)
│
└── examples/                       # GraphQL query examples
    ├── test-queries.graphql
    └── toko-sembako-integration-queries.graphql
```

---

## 🧪 Testing

### 1. GraphQL Playground Testing

Akses playground di masing-masing service endpoint dan gunakan contoh queries.

### 2. End-to-End Testing Flow

```
1. Login Staff (User Service)
   └── Dapatkan JWT token
   
2. Create Menu (Order Service)
   └── Tambahkan menu baru dengan ingredients
   
3. Create Order (Order Service)
   ├── Cek stok → Inventory Service
   ├── Buat kitchen order → Kitchen Service
   ├── Kurangi stok → Inventory Service
   └── Tambah loyalty → User Service
   
4. Update Kitchen Status (Kitchen Service)
   └── pending → preparing → ready → completed
   
5. Verify Dashboard (Frontend)
   └── Cek statistik terupdate
```

### 3. Testing Toko Sembako Integration

```bash
# Test via GraphQL Playground (Inventory Service)
query { tokoSembakoProducts { id name price } }
```

---

## 🔧 Troubleshooting

### Port Already in Use

```bash
# Cek port yang digunakan
netstat -ano | findstr :4001

# Kill process (Windows)
taskkill /PID <PID> /F
```

### Database Connection Error

```bash
# Pastikan container berjalan
docker ps

# Cek database logs
docker logs kitchen-db
docker logs inventory-db

# Test connection manual
docker exec -it kitchen-db mysql -u kitchen_user -pkitchen_pass kitchen_db
```

### Service Tidak Bisa Connect ke Service Lain

```bash
# Pastikan dalam network yang sama
docker network ls
docker network inspect resto-network

# Test dari dalam container
docker exec -it kitchen-service ping inventory-service
```

### Frontend Tidak Bisa Connect ke Backend

1. Pastikan semua backend services berjalan
2. Cek CORS configuration
3. Pastikan URL di `.env.local` benar
4. Cek browser console untuk error

### Migration Error

```bash
# Hapus dan recreate database
docker-compose -f docker-compose-python.yml down -v
docker-compose -f docker-compose-python.yml up -d

# Run migration lagi
docker exec kitchen-service-python python src/database/migrate.py
```

---

## � Database Schema Details

### Kitchen Service - Tables

#### `kitchen_orders`
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Auto-increment ID |
| order_id | VARCHAR(50) | Unique order identifier |
| table_number | VARCHAR(20) | Table number |
| items | JSON | Array of order items |
| status | ENUM | 'pending', 'preparing', 'ready', 'completed' |
| priority | INT | Priority level (higher = more urgent) |
| chef_id | INT (FK) | Assigned chef |
| estimated_time | INT | Estimated prep time (minutes) |
| notes | TEXT | Special instructions |
| created_at | TIMESTAMP | Order creation time |
| updated_at | TIMESTAMP | Last update time |

#### `chefs`
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Chef ID |
| name | VARCHAR(100) | Chef name |
| specialization | VARCHAR(100) | Specialty cuisine |
| status | ENUM | 'available', 'busy', 'off_duty' |
| current_orders | INT | Number of active orders |

### Inventory Service - Tables

#### `ingredients`
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Ingredient ID |
| name | VARCHAR(100) | Ingredient name |
| unit | VARCHAR(20) | Unit of measure (kg, liter, pcs) |
| category | VARCHAR(50) | Category (protein, vegetables, spices) |
| min_stock_level | DECIMAL | Minimum stock threshold |
| current_stock | DECIMAL | Current available stock |
| supplier_id | INT (FK) | Primary supplier |
| cost_per_unit | DECIMAL | Cost per unit |
| status | ENUM | 'active', 'inactive', 'out_of_stock' |

#### `suppliers`
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Supplier ID |
| name | VARCHAR(100) | Company name |
| contact_person | VARCHAR(100) | Contact person |
| email | VARCHAR(100) | Email address |
| phone | VARCHAR(20) | Phone number |
| address | TEXT | Full address |
| status | ENUM | 'active', 'inactive' |

#### `stock_movements`
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Movement ID |
| ingredient_id | INT (FK) | Related ingredient |
| movement_type | ENUM | 'in', 'out', 'adjustment' |
| quantity | DECIMAL | Quantity moved |
| reason | TEXT | Reason for movement |
| reference_id | VARCHAR(50) | Related order/PO |
| reference_type | VARCHAR(50) | 'order', 'purchase_order' |
| created_at | TIMESTAMP | Movement timestamp |

#### `purchase_orders`
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | PO ID |
| order_number | VARCHAR(50) | PO number |
| supplier_id | INT (FK) | Supplier |
| order_date | DATE | Order date |
| expected_delivery_date | DATE | Expected delivery |
| status | ENUM | 'pending', 'ordered', 'delivered', 'cancelled' |
| total_amount | DECIMAL | Total order amount |
| notes | TEXT | Notes |

### User Service - Tables

#### `staff`
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Staff ID |
| employee_id | VARCHAR(50) | Employee code |
| username | VARCHAR(50) | Login username |
| password_hash | VARCHAR(255) | Bcrypt hashed password |
| name | VARCHAR(100) | Full name |
| email | VARCHAR(100) | Email |
| phone | VARCHAR(20) | Phone |
| role | ENUM | 'admin', 'manager', 'chef', 'waiter', 'cashier' |
| department | VARCHAR(50) | Department |
| status | ENUM | 'active', 'inactive' |
| hire_date | DATE | Hire date |
| salary | DECIMAL | Monthly salary |

#### `customers`
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Customer ID |
| customer_id | VARCHAR(50) | Customer code |
| name | VARCHAR(100) | Full name |
| email | VARCHAR(100) | Email |
| phone | VARCHAR(20) | Phone |
| address | TEXT | Address |
| date_of_birth | DATE | Birthday |
| registration_date | TIMESTAMP | Join date |
| status | ENUM | 'active', 'inactive' |

#### `customer_loyalty`
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Loyalty ID |
| customer_id | VARCHAR(50) | Customer reference |
| total_points | DECIMAL | Total earned points |
| redeemed_points | DECIMAL | Points used |
| tier | ENUM | 'bronze', 'silver', 'gold', 'platinum' |
| join_date | DATE | Program join date |
| last_activity_date | DATE | Last activity |
| status | ENUM | 'active', 'inactive' |

#### `refresh_tokens`
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Token ID |
| staff_id | INT (FK) | Staff reference |
| token_hash | VARCHAR(255) | SHA256 hashed token |
| expires_at | TIMESTAMP | Token expiry |
| revoked | BOOLEAN | Revoked status |
| created_at | TIMESTAMP | Creation time |

### Order Service - Tables

#### `menus`
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Menu ID |
| menu_id | VARCHAR(50) | Menu code |
| name | VARCHAR(100) | Item name |
| description | TEXT | Description |
| category | VARCHAR(50) | Category |
| price | DECIMAL | Selling price |
| image | VARCHAR(255) | Image URL |
| ingredients | JSON | Required ingredients |
| available | BOOLEAN | Availability status |
| preparation_time | INT | Prep time (minutes) |
| tags | JSON | Tags array |

#### `orders`
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Order ID |
| order_id | VARCHAR(50) | Order code |
| customer_id | VARCHAR(50) | Customer reference |
| table_number | VARCHAR(20) | Table |
| items | JSON | Order items |
| subtotal | DECIMAL | Items subtotal |
| tax | DECIMAL | Tax (10%) |
| service_charge | DECIMAL | Service charge (5%) |
| discount | DECIMAL | Discount amount |
| loyalty_points_used | DECIMAL | Points used |
| loyalty_points_earned | DECIMAL | Points earned |
| total | DECIMAL | Final total |
| payment_method | ENUM | 'cash', 'card', 'qris' |
| payment_status | ENUM | 'pending', 'paid', 'refunded' |
| order_status | ENUM | 'pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled' |
| staff_id | VARCHAR(50) | Cashier |
| notes | TEXT | Order notes |

---

## 🔄 Business Logic & Workflows

### 1. Order Creation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ORDER CREATION FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Customer creates order via Frontend                         │
│           │                                                     │
│           ▼                                                     │
│  2. Order Service validates menu items                          │
│           │                                                     │
│           ▼                                                     │
│  3. Check stock availability ──────► Inventory Service          │
│           │                         (checkStock query)          │
│           ▼                                                     │
│  4. Calculate totals (subtotal + tax + service - discount)      │
│           │                                                     │
│           ▼                                                     │
│  5. Create kitchen order ──────────► Kitchen Service            │
│           │                         (createKitchenOrder)        │
│           ▼                                                     │
│  6. Reduce ingredient stock ───────► Inventory Service          │
│           │                         (reduceStock mutation)      │
│           ▼                                                     │
│  7. Add loyalty points ────────────► User Service               │
│           │                         (addLoyaltyPoints)          │
│           ▼                                                     │
│  8. Return complete order response                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Kitchen Order Status Flow

```
PENDING ──► PREPARING ──► READY ──► COMPLETED
   │            │            │
   │            │            └── Served to customer
   │            │
   │            └── Chef is cooking
   │
   └── Waiting for chef assignment
```

### 3. Stock Management Flow

```
STOCK IN                          STOCK OUT
────────                          ─────────
• Purchase from supplier          • Order creation (auto)
• Return from kitchen             • Manual adjustment
• Toko Sembako delivery           • Spoilage/waste
• Manual adjustment               • Transfer
         │                               │
         └───────► CURRENT STOCK ◄───────┘
                        │
                        ▼
              ┌─────────────────┐
              │ LOW STOCK ALERT │  (current < min_stock_level)
              └─────────────────┘
```

### 4. Loyalty Points Calculation

```
Points Earned = floor(order_total / 10000)

Tier Thresholds:
- Bronze:   0 - 999 points
- Silver:   1000 - 4999 points
- Gold:     5000 - 9999 points
- Platinum: 10000+ points

Points Redemption:
- 100 points = Rp 10,000 discount
```

### 5. Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    JWT AUTHENTICATION FLOW                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Staff login (username + password)                           │
│           │                                                     │
│           ▼                                                     │
│  2. Verify password against bcrypt hash                         │
│           │                                                     │
│           ▼                                                     │
│  3. Generate Access Token (7 hours expiry)                      │
│           │                                                     │
│           ▼                                                     │
│  4. Generate Refresh Token (7 days expiry)                      │
│     Store hash in database                                      │
│           │                                                     │
│           ▼                                                     │
│  5. Return both tokens to client                                │
│           │                                                     │
│           ▼                                                     │
│  6. Client stores tokens (localStorage/httpOnly cookie)         │
│           │                                                     │
│           ▼                                                     │
│  7. Include Access Token in Authorization header                │
│     Authorization: Bearer <access_token>                        │
│           │                                                     │
│           ▼                                                     │
│  8. When Access Token expires:                                  │
│     Call refreshToken mutation with Refresh Token               │
│     Get new Access Token                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Features

### Authentication & Authorization

| Feature | Implementation |
|---------|----------------|
| Password Hashing | bcrypt with salt |
| Access Token | JWT (7 hours expiry) |
| Refresh Token | Random 64-byte hex (7 days expiry) |
| Token Storage | Refresh token hash stored in DB |
| Role-Based Access | admin, manager, chef, waiter, cashier |

### Role Permissions

| Action | Admin | Manager | Chef | Waiter | Cashier |
|--------|-------|---------|------|--------|---------|
| Create Staff | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete Staff | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create Menu | ✅ | ✅ | ❌ | ❌ | ❌ |
| Update Menu | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete Menu | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Orders | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Orders | ✅ | ✅ | ❌ | ✅ | ✅ |
| Update Kitchen | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage Inventory | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Reports | ✅ | ✅ | ❌ | ❌ | ❌ |

### Security Best Practices

1. **Environment Variables**: All sensitive data stored in env vars
2. **CORS Configuration**: Proper origin restrictions
3. **Input Validation**: GraphQL type validation
4. **SQL Injection**: Parameterized queries
5. **Rate Limiting**: Consider for production

---

## 📊 API Use Cases

### Use Case 1: Restaurant Opens for the Day

```graphql
# 1. Staff login
mutation {
  loginStaff(username: "manager1", password: "password123") {
    token
    staff { name role }
  }
}

# 2. Check low stock items
query {
  lowStockIngredients { id name currentStock minStockLevel }
}

# 3. View available menu
query {
  menus(available: true) { id name price category }
}

# 4. Check chef availability
query {
  chefs { id name status currentOrders }
}
```

### Use Case 2: Customer Places Order

```graphql
# 1. Add items to cart
mutation {
  addToCart(userId: "CUST001", input: {
    menuId: "MENU001", quantity: 2
  }) { items { name quantity } total }
}

# 2. Create order from cart
mutation {
  createOrderFromCart(input: {
    cartId: "CART001"
    tableNumber: "T05"
    customerId: "CUST001"
    paymentMethod: "qris"
  }) {
    order { orderId total orderStatus }
    kitchenOrderCreated
    stockUpdated
  }
}
```

### Use Case 3: Kitchen Prepares Order

```graphql
# 1. View pending orders
query {
  pendingOrders { id orderId tableNumber items { name quantity } priority }
}

# 2. Assign chef
mutation {
  assignChef(orderId: "1", chefId: "2") {
    id status chef { name }
  }
}

# 3. Update to preparing
mutation {
  updateOrderStatus(id: "1", status: "preparing") { id status }
}

# 4. Mark as ready
mutation {
  updateOrderStatus(id: "1", status: "ready") { id status }
}

# 5. Complete order
mutation {
  completeOrder(orderId: "1") { id status }
}
```

### Use Case 4: Inventory Restock from Toko Sembako

```graphql
# 1. Check what products are available
query {
  tokoSembakoProducts { id name price unit available }
}

# 2. Check stock availability
query {
  checkTokoSembakoStock(productId: "1", quantity: 50) {
    available currentStock message
  }
}

# 3. Create purchase order
mutation {
  purchaseFromTokoSembako(input: {
    orderNumber: "PO-20260104-001"
    items: [
      { productId: "1", quantity: 50 }
      { productId: "3", quantity: 30 }
    ]
    notes: "Weekly restock"
  }) {
    success
    message
    order { id status total }
  }
}

# 4. When delivery arrives, update stock
mutation {
  addStock(ingredientId: "5", quantity: 50, reason: "Delivery from Toko Sembako PO-20260104-001") {
    id quantity reason
  }
}
```

---

## 📈 Performance & Optimization

### Database Indexes

```sql
-- Kitchen Orders
CREATE INDEX idx_kitchen_orders_status ON kitchen_orders(status);
CREATE INDEX idx_kitchen_orders_created ON kitchen_orders(created_at);

-- Inventory
CREATE INDEX idx_ingredients_status ON ingredients(status);
CREATE INDEX idx_ingredients_category ON ingredients(category);
CREATE INDEX idx_stock_movements_ingredient ON stock_movements(ingredient_id);

-- Orders
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_date ON orders(created_at);
```

### Caching Recommendations

| Data | Cache Duration | Strategy |
|------|----------------|----------|
| Menu list | 5 minutes | Apollo cache |
| Categories | 1 hour | Local storage |
| Static data | 24 hours | Service worker |
| Real-time data | No cache | Polling/WebSocket |

### API Performance Targets

| Metric | Target |
|--------|--------|
| Query response | < 200ms |
| Mutation response | < 500ms |
| External API (Toko Sembako) | < 2s (with retry) |
| Dashboard load | < 3s |

---

## 🌍 Deployment Options

### Local Development
```bash
docker-compose -f docker-compose-python.yml up -d
```

### Railway (Recommended for Demo)
Each service can be deployed as separate Railway service with MySQL database.

### Docker Swarm / Kubernetes
Use provided Dockerfiles with container orchestration.

### Environment-Specific Configs

| Environment | Database | API URL |
|-------------|----------|---------|
| Development | localhost:3307-3312 | localhost:4001-4004 |
| Staging | Railway MySQL | railway.app URLs |
| Production | Managed MySQL | Custom domain |

---

## �📝 Notes

- **Dual Implementation**: Project memiliki implementasi Node.js dan Python. Pilih salah satu atau gunakan keduanya.
- **Database**: Semua services menggunakan MySQL 8.0.
- **Real-time**: Frontend menggunakan polling. Untuk production, pertimbangkan WebSocket.
- **Security**: Untuk production, gunakan HTTPS dan konfigurasi CORS dengan benar.

---

## 👥 Kontributor

**Tim Kelompok 5** - Integrasi Aplikasi Enterprise (IAE)

| Nama | Kontribusi |
|------|------------|
| 102022300102 - Alvina Sulistina | Kitchen Service |
| 102022300021 - Mochamad Rizky Maulana Aviansyah| Inventory Service |
| 102022330069 - Bimo Alfarizy Lukman | User Service |
| 102022330325 - Revaldo A.Nainggolan | Order Service |

---

## 📄 License

MIT License - Lihat file LICENSE untuk detail.

---

**Happy Coding! 🚀**

