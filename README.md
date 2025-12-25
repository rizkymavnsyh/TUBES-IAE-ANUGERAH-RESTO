# Warung Makan (Anugerah Resto) - Sistem Manajemen Restoran

Sistem manajemen restoran berbasis microservices dengan arsitektur terintegrasi menggunakan GraphQL, Docker, dan Next.js frontend dashboard.

## 📋 Daftar Isi

- [Overview](#overview)
- [Arsitektur Sistem](#arsitektur-sistem)
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Prerequisites](#prerequisites)
- [Instalasi & Setup](#instalasi--setup)
- [Menjalankan Sistem](#menjalankan-sistem)
- [Frontend Dashboard](#frontend-dashboard)
- [GraphQL Endpoints](#graphql-endpoints)
- [Database Configuration](#database-configuration)
- [Integrasi Antar Service](#integrasi-antar-service)
- [Integrasi Lintas Kelompok](#integrasi-lintas-kelompok)
- [Struktur Project](#struktur-project)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

Sistem manajemen restoran **Anugerah Resto** adalah aplikasi berbasis microservices yang mengelola seluruh operasional restoran, mulai dari manajemen menu, pemesanan, antrian dapur, inventori bahan baku, hingga manajemen staf dan pelanggan. Sistem ini dibangun dengan arsitektur microservices yang memungkinkan setiap layanan beroperasi secara independen namun tetap terintegrasi melalui GraphQL API.

### Fitur Utama

- 🍽️ **Menu Management** - Kelola menu items, kategori, dan ketersediaan
- 📦 **Order Management** - Pencatatan dan tracking pesanan pelanggan
- 👨‍🍳 **Kitchen Queue** - Antrian pesanan dapur dengan real-time updates
- 📋 **Inventory Management** - Manajemen stok bahan baku dengan alert low stock
- 👥 **User Management** - Manajemen staf dan program loyalty pelanggan
- 📊 **Dashboard** - Overview statistik dan monitoring real-time
- 🔗 **Cross-Group Integration** - Integrasi dengan Toko Sembako untuk pembelian bahan baku

## 🏗️ Arsitektur Sistem

Sistem ini terdiri dari **4 layanan microservices** utama:

### 1. Kitchen Service (Port 4001, MySQL)
- Pengelolaan antrian pesanan koki
- Status tracking pesanan dapur (pending → preparing → ready → completed)
- Priority management untuk pesanan
- Real-time queue updates

### 2. Inventory Service (Port 4002, MySQL)
- Manajemen stok bahan baku
- Supplier management
- Stock tracking dan alerts
- Integrasi dengan Toko Sembako untuk pembelian bahan baku

### 3. User Service (Port 4003, MySQL)
- Manajemen data staf (staff management)
- Loyalty program pelanggan
- Customer management
- Authentication & authorization (JWT)

### 4. Order Service (Port 4004, MySQL)
- Katalog menu items
- Keranjang belanja (shopping cart)
- Pencatatan transaksi
- Integrasi dengan semua service lainnya
- Payment processing
- Loyalty points integration

## 🚀 Teknologi yang Digunakan

Project ini memiliki **dua implementasi lengkap** (Node.js dan Python) untuk memberikan fleksibilitas:

### Node.js Implementation (Apollo Server)
- **Node.js 18+** dengan Express
- **GraphQL** (Apollo Server)
- **mysql2** (MySQL driver)
- **axios** (HTTP client untuk inter-service communication)
- **dotenv** (Environment variables)

### Python Implementation (Strawberry GraphQL)
- **Python 3.11** dengan FastAPI
- **GraphQL** (Strawberry GraphQL)
- **aiomysql** (MySQL async driver)
- **httpx** (HTTP client untuk inter-service communication)
- **python-dotenv** (Environment variables)

### Frontend
- **Next.js 16** dengan App Router
- **React 19** dengan TypeScript
- **Tailwind CSS V4** untuk styling
- **Apollo Client** untuk GraphQL
- **TailAdmin Template** sebagai base dashboard

### Infrastructure
- **Docker** & Docker Compose untuk containerization
- **MySQL 8.0** untuk semua services (Kitchen, Inventory, User, Order)
- **Docker Networking** untuk inter-service communication

## 📋 Prerequisites

Sebelum memulai, pastikan Anda memiliki:

- **Docker** & Docker Compose (versi terbaru)
- **Node.js 18+** (untuk development lokal Node.js)
- **Python 3.11+** (untuk development lokal Python)
- **Git** untuk clone repository
- **Ports yang tersedia**: 4001, 4002, 4003, 4004, 3307-3310, 3000

## 🔧 Instalasi & Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd anugerah-resto
```

### 2. Setup Environment Variables

#### Backend Services

Setiap service memiliki environment variables yang dapat dikonfigurasi melalui Docker Compose atau file `.env` lokal.

**Docker Compose** sudah dikonfigurasi dengan default values:
- Database credentials
- Service URLs untuk inter-service communication
- Toko Sembako integration URLs

#### Frontend

Buat file `.env.local` di folder `frontend/`:

```env
NEXT_PUBLIC_ORDER_SERVICE_URL=http://localhost:4004/graphql
NEXT_PUBLIC_KITCHEN_SERVICE_URL=http://localhost:4001/graphql
NEXT_PUBLIC_INVENTORY_SERVICE_URL=http://localhost:4002/graphql
NEXT_PUBLIC_USER_SERVICE_URL=http://localhost:4003/graphql
```

## 🚀 Menjalankan Sistem

### Opsi 1: Menggunakan Docker Compose (Recommended)

#### Node.js Implementation (Apollo Server)

```bash
# Build dan jalankan semua services
docker-compose up --build

# Atau jalankan di background
docker-compose up -d --build

# Lihat logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop dan hapus volumes
docker-compose down -v
```

#### Python Implementation (Strawberry GraphQL)

```bash
# Build dan jalankan semua services
docker-compose -f docker-compose-python.yml up --build

# Atau jalankan di background
docker-compose -f docker-compose-python.yml up -d --build

# Lihat logs
docker-compose -f docker-compose-python.yml logs -f

# Stop services
docker-compose -f docker-compose-python.yml down
```

### 2. Setup Database (Migration & Seeding)

Setelah semua container berjalan, jalankan migration dan seeding:

#### Node.js Implementation

```bash
# Run migrations
docker exec kitchen-service npm run migrate
docker exec inventory-service npm run migrate
docker exec user-service npm run migrate
docker exec order-service npm run migrate

# Seed order service dengan sample menu
docker exec order-service npm run seed
```

#### Python Implementation

```bash
# Run migrations
docker exec kitchen-service-python python src/database/migrate.py
docker exec inventory-service-python python src/database/migrate.py
docker exec user-service-python python src/database/migrate.py
docker exec order-service-python python src/database/migrate.py

# Seed order service dengan sample menu
docker exec order-service-python python src/database/seed.py
```

### Opsi 2: Development Lokal (Tanpa Docker)

#### Node.js Services

```bash
# Install dependencies untuk setiap service
cd kitchen-service && npm install
cd ../inventory-service && npm install
cd ../user-service && npm install
cd ../order-service && npm install

# Setup database (pastikan MySQL berjalan)
# Jalankan migration scripts di masing-masing service
cd kitchen-service && npm run migrate
cd ../inventory-service && npm run migrate
cd ../user-service && npm run migrate
cd ../order-service && npm run migrate
cd ../order-service && npm run seed

# Jalankan setiap service (di terminal terpisah)
cd kitchen-service && npm run dev      # Port 4001
cd inventory-service && npm run dev    # Port 4002
cd user-service && npm run dev         # Port 4003
cd order-service && npm run dev        # Port 4004
```

#### Python Services

```bash
# Install dependencies untuk setiap service
cd kitchen-service-python && pip install -r requirements.txt
cd ../inventory-service-python && pip install -r requirements.txt
cd ../user-service-python && pip install -r requirements.txt
cd ../order-service-python && pip install -r requirements.txt

# Setup database (pastikan MySQL berjalan)
# Jalankan migration scripts
cd kitchen-service-python && python src/database/migrate.py
cd ../inventory-service-python && python src/database/migrate.py
cd ../user-service-python && python src/database/migrate.py
cd ../order-service-python && python src/database/migrate.py
cd ../order-service-python && python src/database/seed.py

# Jalankan setiap service (di terminal terpisah)
cd kitchen-service-python && uvicorn src.main:app --host 0.0.0.0 --port 4001
cd inventory-service-python && uvicorn src.main:app --host 0.0.0.0 --port 4002
cd user-service-python && uvicorn src.main:app --host 0.0.0.0 --port 4003
cd order-service-python && uvicorn src.main:app --host 0.0.0.0 --port 4004
```

## 🎨 Frontend Dashboard

Frontend dashboard dibangun menggunakan Next.js dengan TailAdmin template.

### Setup Frontend

```bash
# Masuk ke folder frontend
cd frontend

# Install dependencies
npm install

# Buat file .env.local (lihat bagian Setup Environment Variables)

# Jalankan development server
npm run dev

# Build untuk production
npm run build
npm start
```

Frontend akan berjalan di `http://localhost:3000`

### Halaman Frontend

- **Dashboard** (`/`) - Overview statistik dengan real-time updates
- **Menu Management** (`/menu`) - Kelola menu items
- **Order Management** (`/orders`) - Lihat dan kelola orders
- **Kitchen Queue** (`/kitchen`) - Kanban board untuk antrian dapur
- **Inventory Management** (`/inventory`) - Kelola stok bahan baku
- **User Management** (`/users`) - Kelola staff dan customers

## 🌐 GraphQL Endpoints

Setelah semua service berjalan, akses GraphQL Playground di:

- **Kitchen Service**: http://localhost:4001/graphql
- **Inventory Service**: http://localhost:4002/graphql
- **User Service**: http://localhost:4003/graphql
- **Order Service**: http://localhost:4004/graphql

### Contoh Query

#### Get All Menus
```graphql
query {
  menus {
    id
    menuId
    name
    category
    price
    available
  }
}
```

#### Create Order
```graphql
mutation {
  createOrder(input: {
    orderId: "ORD001"
    tableNumber: "T01"
    items: [
      {
        menuId: "MENU001"
        name: "Nasi Goreng Spesial"
        quantity: 2
        price: 25000
      }
    ]
  }) {
    order {
      id
      orderId
      total
    }
    kitchenOrderCreated
    stockUpdated
  }
}
```

#### Get Kitchen Orders
```graphql
query {
  kitchenOrders {
    id
    orderId
    status
    items {
      name
      quantity
    }
  }
}
```

Lihat folder `examples/` untuk contoh query lengkap.

## 💾 Database Configuration

### Database Ports (Docker)

- **Kitchen DB**: localhost:3307
- **Inventory DB**: localhost:3308
- **User DB**: localhost:3309
- **Order DB**: localhost:3310

### Database Credentials (Default)

Semua database menggunakan credentials default:
- **User**: `{service}_user` (e.g., `kitchen_user`)
- **Password**: `{service}_pass` (e.g., `kitchen_pass`)
- **Database**: `{service}_db` (e.g., `kitchen_db`)
- **Root Password**: `rootpassword`

> **Note**: Untuk production, ubah credentials di `docker-compose.yml`

## 🔗 Integrasi Antar Service

### Order Service mengkonsumsi:
- **Kitchen Service**: Mengirim pesanan ke dapur saat order dibuat
- **Inventory Service**: Mengecek dan mengurangi stok bahan saat order dibuat
- **User Service**: Menghitung dan menambahkan loyalty points untuk customer

### Kitchen Service mengkonsumsi:
- **Order Service**: Mendapatkan detail pesanan (optional, untuk validasi)

### Inventory Service mengkonsumsi:
- **Order Service**: Update stok setelah pesanan dibuat
- **Toko Sembako Services**: Untuk pembelian bahan baku (lihat bagian Integrasi Lintas Kelompok)

## 🌐 Integrasi Lintas Kelompok

Sistem ini terintegrasi dengan **Toko Sembako** (kelompok lain) untuk pembelian bahan baku.

### Toko Sembako Services

Toko Sembako menyediakan 3 microservices:
- **Product Service** (port 4001) - Data produk/sayur
- **Inventory Service** (port 4000) - Stok produk
- **Order Service** (port 4002) - Pesanan pembelian

### Integrasi dari Inventory Service

Inventory Service dapat:
- **Melihat produk** dari Toko Sembako
- **Cek stok** produk di Toko Sembako
- **Membuat pesanan** pembelian bahan baku
- **Sync stok** dari Toko Sembako

### GraphQL Queries untuk Toko Sembako

```graphql
# Get products from Toko Sembako
query {
  tokoSembakoProducts {
    id
    name
    category
    price
  }
}

# Check stock
query {
  checkTokoSembakoStock(productId: "1", quantity: 10) {
    available
    currentStock
    message
  }
}

# Purchase from Toko Sembako
mutation {
  purchaseFromTokoSembako(input: {
    productId: "1"
    quantity: 10
  }) {
    success
    orderId
    message
  }
}
```

### Konfigurasi URL Toko Sembako

Di `docker-compose.yml`, konfigurasi URL Toko Sembako:
```yaml
environment:
  TOKO_SEMBAKO_PRODUCT_URL: http://host.docker.internal:4001/graphql
  TOKO_SEMBAKO_INVENTORY_URL: http://host.docker.internal:4000/graphql
  TOKO_SEMBAKO_ORDER_URL: http://host.docker.internal:4002/graphql
```

> **Note**: `host.docker.internal` digunakan untuk mengakses services di host machine dari dalam Docker container.

## 📁 Struktur Project

```
anugerah-resto/
├── docker-compose.yml              # Node.js services configuration
├── docker-compose-python.yml       # Python services configuration
├── README.md                       # Dokumentasi utama
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
│   │       └── schema.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── inventory-service/              # Node.js Inventory Service
│   ├── src/
│   │   ├── index.js
│   │   ├── database/
│   │   ├── graphql/
│   │   └── services/
│   │       └── tokoSembakoClient.js  # Toko Sembako integration
│   └── ...
│
├── inventory-service-python/        # Python Inventory Service
│   ├── src/
│   │   ├── main.py
│   │   ├── database/
│   │   ├── graphql/
│   │   └── services/
│   │       └── toko_sembako_client.py
│   └── ...
│
├── user-service/                   # Node.js User Service
├── user-service-python/            # Python User Service
├── order-service/                  # Node.js Order Service
├── order-service-python/           # Python Order Service
│
├── frontend/                       # Next.js Frontend Dashboard
│   ├── src/
│   │   ├── app/
│   │   │   └── (admin)/
│   │   │       ├── page.tsx        # Dashboard
│   │   │       ├── menu/
│   │   │       ├── orders/
│   │   │       ├── kitchen/
│   │   │       ├── inventory/
│   │   │       └── users/
│   │   ├── lib/
│   │   │   └── apollo-client.ts
│   │   └── layout/
│   ├── package.json
│   └── README.md
│
└── examples/                       # Contoh GraphQL queries
    ├── test-queries.graphql
    └── toko-sembako-integration-queries.graphql
```

## 🧪 Testing

### Manual Testing dengan GraphQL Playground

1. Akses GraphQL Playground di masing-masing service endpoint
2. Gunakan contoh queries dari folder `examples/`
3. Test create, read, update operations

### Testing Flow Lengkap

1. **Create Menu** (Order Service)
2. **Create Order** (Order Service) - akan trigger:
   - Kitchen order creation
   - Stock reduction
   - Loyalty points calculation
3. **Check Kitchen Queue** (Kitchen Service)
4. **Update Kitchen Order Status** (Kitchen Service)
5. **Check Inventory** (Inventory Service)
6. **View Dashboard** (Frontend)

### Testing Toko Sembako Integration

1. Pastikan Toko Sembako services berjalan
2. Test query products dari Inventory Service
3. Test purchase dari Toko Sembako
4. Verify stock update

## 🔧 Troubleshooting

### Port Already in Use

```bash
# Cek port yang digunakan
netstat -ano | findstr :4001
netstat -ano | findstr :4002
# dll

# Atau ubah port di docker-compose.yml
```

### Database Connection Error

```bash
# Pastikan database container berjalan
docker ps

# Cek database logs
docker logs kitchen-db
docker logs inventory-db
# dll

# Test connection
docker exec -it kitchen-db mysql -u kitchen_user -pkitchen_pass kitchen_db
```

### Service Tidak Bisa Connect ke Service Lain

```bash
# Pastikan semua services dalam network yang sama
docker network ls
docker network inspect resto-network

# Test dari dalam container
docker exec -it kitchen-service ping inventory-service
```

### Frontend Tidak Bisa Connect ke Backend

1. Pastikan semua backend services berjalan
2. Cek CORS configuration di backend
3. Pastikan URL di `.env.local` benar
4. Cek browser console untuk error

### Migration Error

```bash
# Hapus dan recreate database
docker-compose down -v
docker-compose up -d

# Run migration lagi
docker exec kitchen-service npm run migrate
```

## 📝 Notes

- **Dual Implementation**: Project ini memiliki implementasi Node.js dan Python. Pilih salah satu atau gunakan keduanya untuk perbandingan.
- **Database**: Semua services menggunakan MySQL (termasuk Order Service yang sebelumnya MongoDB).
- **Real-time Updates**: Frontend menggunakan polling untuk real-time updates. Untuk production, pertimbangkan WebSocket atau GraphQL Subscriptions.
- **Security**: Untuk production, pastikan:
  - Menggunakan environment variables untuk sensitive data
  - Mengaktifkan authentication/authorization
  - Menggunakan HTTPS
  - Mengkonfigurasi CORS dengan benar

## 👥 Kontributor

- [Nama Anggota 1] - Kitchen Service
- [Nama Anggota 2] - Inventory Service
- [Nama Anggota 3] - User Service
- [Nama Anggota 4] - Order Service
- [Nama Anggota 5] - Frontend Dashboard

## 📄 License

[Masukkan license jika ada]

---

**Happy Coding! 🚀**
