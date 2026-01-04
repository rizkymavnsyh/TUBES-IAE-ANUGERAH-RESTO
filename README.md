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

#### Node.js Services
```bash
docker exec kitchen-service npm run migrate
docker exec inventory-service npm run migrate
docker exec user-service npm run migrate
docker exec order-service npm run migrate
docker exec order-service npm run seed
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

### Overview

Sistem terintegrasi dengan **Toko Sembako** (kelompok lain) via Railway cloud untuk pembelian bahan baku.

### Sebagai Consumer (Memanggil Toko Sembako)

```graphql
# Lihat produk tersedia
query {
  tokoSembakoProducts {
    id
    name
    price
    unit
    available
  }
}

# Cek ketersediaan stok
query {
  checkTokoSembakoStock(productId: "1", quantity: 10) {
    available
    currentStock
    message
  }
}

# Buat pesanan pembelian
mutation {
  purchaseFromTokoSembako(input: {
    orderNumber: "PO-001"
    items: [
      { productId: "1", quantity: 10 }
    ]
  }) {
    success
    message
    order {
      id
      status
      total
    }
  }
}
```

### Sebagai Provider (Dipanggil oleh Toko Sembako)

```graphql
# Cek item low stock
query {
  lowStockIngredients {
    id
    name
    currentStock
    minStockLevel
  }
}

# Update stok (notifikasi pengiriman)
mutation {
  addStock(ingredientId: "1", quantity: 50, reason: "Delivery from Toko Sembako") {
    id
    quantity
    reason
  }
}
```

### Konfigurasi Railway URLs

Di `docker-compose.yml` atau environment variables:

```yaml
environment:
  TOKO_SEMBAKO_PRODUCT_URL: https://tubes-iae-anugerah-resto-production-3278.up.railway.app/graphql/product
  TOKO_SEMBAKO_INVENTORY_URL: https://tubes-iae-anugerah-resto-production-3278.up.railway.app/graphql/inventory
  TOKO_SEMBAKO_ORDER_URL: https://tubes-iae-anugerah-resto-production-3278.up.railway.app/graphql/order
```

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

## 📝 Notes

- **Dual Implementation**: Project memiliki implementasi Node.js dan Python. Pilih salah satu atau gunakan keduanya.
- **Database**: Semua services menggunakan MySQL 8.0.
- **Real-time**: Frontend menggunakan polling. Untuk production, pertimbangkan WebSocket.
- **Security**: Untuk production, gunakan HTTPS dan konfigurasi CORS dengan benar.

---

## 👥 Kontributor

**Tim Kelompok 5** - Integrasi Aplikasi Enterprise (IAE)

| Nama | Kontribusi |
|------|------------|
| Anggota 1 | Kitchen Service |
| Anggota 2 | Inventory Service |
| Anggota 3 | User Service |
| Anggota 4 | Order Service |
| Anggota 5 | Frontend Dashboard |

---

## 📄 License

MIT License - Lihat file LICENSE untuk detail.

---

**Happy Coding! 🚀**
