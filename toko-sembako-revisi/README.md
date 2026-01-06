# 🛒 Toko Sembako API

**Sistem Manajemen Toko Sembako** - GraphQL API untuk pengelolaan produk, inventori, dan pesanan.

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app)

---

## 📋 Daftar Isi

- [Tentang Project](#-tentang-project)
- [Arsitektur](#-arsitektur)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [API Endpoints](#-api-endpoints)
- [Schema GraphQL](#-schema-graphql)
- [Integrasi dengan Consumer](#-integrasi-dengan-consumer)
- [Deployment Railway](#-deployment-railway)
- [Testing](#-testing)

---

## 📖 Tentang Project

Toko Sembako adalah sistem backend untuk manajemen toko sembako yang menyediakan:
- **Product Service** - Manajemen katalog produk
- **Inventory Service** - Manajemen stok barang
- **Order Service** - Pemrosesan pesanan dari consumer (restoran)
- **Auth Service** - Autentikasi pengguna

Project ini didesain sebagai **Producer/Supplier API** yang dapat dikonsumsi oleh sistem lain (seperti Anugerah Resto).

---

## 🏗 Arsitektur

```
┌──────────────────────────────────────────────────────────────────┐
│                        TOKO SEMBAKO API                          │
│                         (Single Server)                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │   Product   │  │  Inventory  │  │    Order    │  │  Auth   │ │
│  │   Service   │  │   Service   │  │   Service   │  │ Service │ │
│  │             │  │             │  │             │  │         │ │
│  │ /graphql/   │  │ /graphql/   │  │ /graphql/   │  │/graphql/│ │
│  │   product   │  │  inventory  │  │    order    │  │  auth   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘ │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                          MySQL Database                          │
│                          (toko_sembako)                          │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

| Teknologi | Kegunaan |
|-----------|----------|
| **Node.js** | Runtime JavaScript |
| **Apollo Server** | GraphQL Server |
| **Express** | HTTP Framework |
| **MySQL** | Database |
| **Docker** | Containerization |
| **Railway** | Cloud Deployment |

---

## 🚀 Quick Start

### Prasyarat
- Node.js v16+
- MySQL 8.0+
- npm atau yarn

### 1. Clone Repository
```bash
git clone https://github.com/your-username/toko-sembako.git
cd toko-sembako
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Database
Buat database MySQL:
```sql
CREATE DATABASE toko_sembako;
```

### 4. Konfigurasi Environment
Buat file `.env` (opsional, ada default values):
```env
PORT=8080
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=toko_sembako
```

### 5. Jalankan Server
```bash
node deploy.js
```

Server akan berjalan di `http://localhost:8080`

### 6. Akses GraphQL Playground
- Product: http://localhost:8080/graphql/product
- Inventory: http://localhost:8080/graphql/inventory
- Order: http://localhost:8080/graphql/order
- Auth: http://localhost:8080/graphql/auth

---

## 📡 API Endpoints

| Endpoint | Deskripsi | Port Default |
|----------|-----------|--------------|
| `/graphql/product` | Manajemen Produk | 8080 |
| `/graphql/inventory` | Manajemen Stok | 8080 |
| `/graphql/order` | Manajemen Pesanan | 8080 |
| `/graphql/auth` | Autentikasi | 8080 |

---

## 📘 Schema GraphQL

### Product Service (`/graphql/product`)

```graphql
type Product {
  id: ID!
  name: String!
  price: Int!
  unit: String!
}

type Query {
  getProducts: [Product]
}

type Mutation {
  createProduct(name: String!, price: Int!, unit: String!): Product
}
```

**Contoh Query:**
```graphql
# Ambil semua produk
query {
  getProducts {
    id
    name
    price
    unit
  }
}

# Tambah produk baru
mutation {
  createProduct(name: "Beras Premium", price: 15000, unit: "kg") {
    id
    name
  }
}
```

---

### Inventory Service (`/graphql/inventory`)

```graphql
type Inventory {
  productId: ID!
  stock: Int!
}

type Query {
  getInventory(productId: ID!): Inventory
}

type Mutation {
  increaseStock(productId: ID!, qty: Int!): Inventory
  decreaseStock(productId: ID!, qty: Int!): Inventory
}
```

**Contoh Query:**
```graphql
# Cek stok produk
query {
  getInventory(productId: "1") {
    productId
    stock
  }
}

# Tambah stok
mutation {
  increaseStock(productId: "1", qty: 100) {
    productId
    stock
  }
}
```

---

### Order Service (`/graphql/order`)

```graphql
type OrderItem {
  productId: ID!
  qty: Int!
  price: Int!
  subtotal: Int!
}

type Order {
  id: ID!
  restaurantId: String!
  items: [OrderItem!]!
  total: Int!
  status: String!
}

type Query {
  getOrders: [Order]
  getOrderById(orderId: ID!): Order
}

type Mutation {
  createOrder(restaurantId: String!, items: [OrderItemInput!]!): Order
  cancelOrder(orderId: ID!): Order
}

input OrderItemInput {
  productId: ID!
  qty: Int!
}
```

**Contoh Query:**
```graphql
# Buat pesanan dari restoran
mutation {
  createOrder(
    restaurantId: "anugerah-resto-001"
    items: [
      { productId: "1", qty: 10 },
      { productId: "2", qty: 5 }
    ]
  ) {
    id
    total
    status
    items {
      productId
      qty
      price
      subtotal
    }
  }
}

# Batalkan pesanan
mutation {
  cancelOrder(orderId: "1") {
    id
    status
  }
}
```

---

### Auth Service (`/graphql/auth`)

```graphql
type User {
  id: ID!
  email: String!
}

type AuthPayload {
  token: String!
  user: User!
}

type Mutation {
  register(email: String!, password: String!): AuthPayload
  login(email: String!, password: String!): AuthPayload
}
```

---

## 🔗 Integrasi dengan Consumer

Toko Sembako dapat dikonsumsi oleh sistem lain (seperti Anugerah Resto) melalui GraphQL API.

### Flow Integrasi

```
┌─────────────────┐                    ┌─────────────────┐
│  Anugerah Resto │                    │  Toko Sembako   │
│    (Consumer)   │                    │   (Producer)    │
├─────────────────┤                    ├─────────────────┤
│                 │ 1. GET Products    │                 │
│                 │ ─────────────────► │                 │
│                 │                    │                 │
│                 │ 2. Check Stock     │                 │
│                 │ ─────────────────► │                 │
│                 │                    │                 │
│                 │ 3. Create Order    │                 │
│                 │ ─────────────────► │                 │
│                 │                    │ (stok berkurang)│
│                 │ ◄───────────────── │                 │
│ (stok masuk)    │ 4. Order Response  │                 │
└─────────────────┘                    └─────────────────┘
```

### Contoh Implementasi Consumer (Node.js)

```javascript
const axios = require('axios');

const TOKO_SEMBAKO_URL = 'https://your-railway-url.up.railway.app';

// Ambil produk
async function getProducts() {
  const response = await axios.post(`${TOKO_SEMBAKO_URL}/graphql/product`, {
    query: `{ getProducts { id name price unit } }`
  });
  return response.data.data.getProducts;
}

// Buat pesanan
async function createOrder(restaurantId, items) {
  const response = await axios.post(`${TOKO_SEMBAKO_URL}/graphql/order`, {
    query: `
      mutation CreateOrder($restaurantId: String!, $items: [OrderItemInput!]!) {
        createOrder(restaurantId: $restaurantId, items: $items) {
          id
          total
          status
        }
      }
    `,
    variables: { restaurantId, items }
  });
  return response.data.data.createOrder;
}
```

---

## ☁️ Deployment Railway

### 1. Connect Repository
1. Login ke [Railway](https://railway.app)
2. New Project → Deploy from GitHub repo
3. Pilih repository Toko Sembako

### 2. Konfigurasi
- **Root Directory:** `/` (jika repo khusus Toko Sembako)
- **Root Directory:** `/toko-sembako-revisi` (jika bagian dari monorepo)

### 3. Environment Variables
Railway akan otomatis set:
- `PORT` (Railway assign)
- Tambahkan MySQL credentials jika pakai external DB

### 4. Add MySQL Database
1. Klik "New" → "Database" → "MySQL"
2. Railway akan otomatis set environment variables:
   - `MYSQL_HOST`
   - `MYSQL_PORT`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_DATABASE`

### 5. Deploy
Railway akan otomatis deploy saat push ke GitHub.

**URL Production:**
```
https://your-app.up.railway.app/graphql/product
https://your-app.up.railway.app/graphql/inventory
https://your-app.up.railway.app/graphql/order
https://your-app.up.railway.app/graphql/auth
```

---

## 🧪 Testing

### Menggunakan GraphQL Playground
1. Buka endpoint di browser
2. Gunakan panel kiri untuk menulis query
3. Klik tombol Play ▶️

### Contoh Test Lengkap

```graphql
# 1. Tambah Produk
mutation {
  createProduct(name: "Gula Pasir", price: 14000, unit: "kg") {
    id
    name
  }
}

# 2. Cek Stok
query {
  getInventory(productId: "1") {
    stock
  }
}

# 3. Tambah Stok
mutation {
  increaseStock(productId: "1", qty: 100) {
    stock
  }
}

# 4. Buat Pesanan
mutation {
  createOrder(
    restaurantId: "anugerah-resto"
    items: [{ productId: "1", qty: 10 }]
  ) {
    id
    total
    status
  }
}

# 5. Cek Pesanan
query {
  getOrders {
    id
    restaurantId
    total
    status
  }
}
```

---

## 📁 Struktur Folder

```
toko-sembako-revisi/
├── deploy.js              # Entry point (menggabungkan semua service)
├── package.json           # Dependencies
├── docker-compose.yml     # Docker configuration
│
├── product-service/       # Product Service
│   ├── index.js
│   └── schema_product.graphql
│
├── inventory-service/     # Inventory Service
│   ├── index.js
│   └── schema_inventory.graphql
│
├── order-service/         # Order Service
│   ├── index.js
│   └── schema_order.graphql
│
├── auth-service/          # Auth Service
│   ├── index.js
│   └── schema.graphql
│
└── db/                    # Database
    ├── init.js            # Database initialization
    └── seed.js            # Seed data
```

---

## 👥 Tim Pengembang

| Nama | Role |
|------|------|
| [Nama 1] | Backend Developer |
| [Nama 2] | Backend Developer |
| [Nama 3] | Database Administrator |

---

## 📄 Lisensi

MIT License - Silakan gunakan untuk keperluan akademis.

---

## 🤝 Kontribusi

1. Fork repository
2. Buat branch baru (`git checkout -b feature/fitur-baru`)
3. Commit perubahan (`git commit -m 'Tambah fitur baru'`)
4. Push ke branch (`git push origin feature/fitur-baru`)
5. Buat Pull Request

---

**Dibuat dengan ❤️ untuk Tugas Besar IAE**
