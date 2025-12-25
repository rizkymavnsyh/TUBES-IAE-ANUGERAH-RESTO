# LAPORAN TUGAS BESAR
## SISTEM MANAJEMEN RESTORAN BERBASIS MICROSERVICES
### Anugerah Resto - Warung Makan

---

**Mata Kuliah:** Integrasi Aplikasi Enterprise (IAE)  
**Tahun Akademik:** 2024/2025  
**Semester:** Ganjil  
**Tanggal:** Desember 2025

---

## DAFTAR ISI

1. [Pendahuluan](#1-pendahuluan)
   - 1.1 Latar Belakang
   - 1.2 Tujuan
   - 1.3 Ruang Lingkup
   - 1.4 Manfaat

2. [Landasan Teori](#2-landasan-teori)
   - 2.1 Arsitektur Microservices
   - 2.2 GraphQL
   - 2.3 Docker dan Containerization
   - 2.4 Next.js dan React
   - 2.5 MySQL Database

3. [Analisis dan Perancangan Sistem](#3-analisis-dan-perancangan-sistem)
   - 3.1 Analisis Kebutuhan
   - 3.2 Arsitektur Sistem
   - 3.3 Desain Database
   - 3.4 Desain API (GraphQL Schema)
   - 3.5 Desain Frontend

4. [Implementasi](#4-implementasi)
   - 4.1 Backend Services
   - 4.2 Frontend Dashboard
   - 4.3 Integrasi Antar Service
   - 4.4 Integrasi Lintas Kelompok
   - 4.5 Deployment dengan Docker

5. [Pengujian](#5-pengujian)
   - 5.1 Unit Testing
   - 5.2 Integration Testing
   - 5.3 System Testing
   - 5.4 User Acceptance Testing

6. [Kesimpulan dan Saran](#6-kesimpulan-dan-saran)
   - 6.1 Kesimpulan
   - 6.2 Saran untuk Pengembangan Selanjutnya

7. [Daftar Pustaka](#7-daftar-pustaka)

8. [Rencana Integrasi Lintas Kelompok](#8-rencana-integrasi-lintas-kelompok)
   - 8.1 Overview Integrasi dengan Toko Sembako
   - 8.2 Sebagai Consumer (Wajib)
   - 8.3 Sebagai Provider (Nilai Tambah)
   - 8.4 Dokumentasi Endpoint
   - 8.5 Alur Integrasi Lengkap

9. [Lampiran](#9-lampiran)

---

## 1. PENDAHULUAN

### 1.1 Latar Belakang

Di era digitalisasi saat ini, industri restoran menghadapi tantangan dalam mengelola operasional yang kompleks. Sistem manajemen restoran tradisional yang monolitik seringkali mengalami kesulitan dalam hal skalabilitas, maintainability, dan integrasi dengan sistem eksternal. 

**Anugerah Resto** adalah sebuah restoran yang membutuhkan sistem manajemen terintegrasi untuk mengelola berbagai aspek operasional, termasuk:

- **Manajemen Menu**: Pengelolaan katalog menu, kategori, harga, dan ketersediaan
- **Manajemen Pesanan**: Pencatatan dan tracking pesanan pelanggan dari awal hingga selesai
- **Manajemen Dapur**: Antrian pesanan dapur dengan status tracking real-time
- **Manajemen Inventori**: Pengelolaan stok bahan baku dengan alert low stock
- **Manajemen Pengguna**: Manajemen staf dan program loyalty pelanggan
- **Integrasi Eksternal**: Integrasi dengan sistem Toko Sembako untuk pembelian bahan baku

Untuk mengatasi kompleksitas ini, diperlukan arsitektur sistem yang modern, scalable, dan maintainable. Arsitektur **microservices** dipilih karena memberikan fleksibilitas dalam pengembangan, deployment, dan scaling setiap komponen secara independen.

### 1.2 Tujuan

Tujuan dari pengembangan sistem ini adalah:

1. **Membangun sistem manajemen restoran berbasis microservices** yang dapat mengelola seluruh operasional restoran secara terintegrasi
2. **Mengimplementasikan GraphQL API** untuk komunikasi antar service dan frontend
3. **Mengembangkan dashboard admin** yang user-friendly untuk monitoring dan manajemen operasional
4. **Mengintegrasikan sistem dengan kelompok lain** (Toko Sembako) untuk pembelian bahan baku
5. **Menyediakan dua implementasi backend** (Node.js dan Python) untuk memberikan fleksibilitas dan perbandingan teknologi

### 1.3 Ruang Lingkup

Ruang lingkup proyek ini mencakup:

**Backend Services:**
- Kitchen Service (Port 4001) - Manajemen antrian dapur
- Inventory Service (Port 4002) - Manajemen stok bahan baku
- User Service (Port 4003) - Manajemen staf dan customer
- Order Service (Port 4004) - Manajemen menu dan pesanan

**Frontend:**
- Dashboard admin dengan Next.js
- Halaman manajemen menu, pesanan, dapur, inventori, dan pengguna

**Infrastructure:**
- Docker containerization untuk semua services
- MySQL database untuk setiap service
- Docker Compose untuk orchestration

**Integrasi:**
- Inter-service communication menggunakan GraphQL
- Integrasi dengan Toko Sembako (kelompok lain) untuk pembelian bahan baku

### 1.4 Manfaat

Sistem ini memberikan manfaat sebagai berikut:

1. **Efisiensi Operasional**: Otomatisasi proses manajemen restoran mengurangi kesalahan manual
2. **Real-time Monitoring**: Dashboard real-time memungkinkan monitoring operasional secara langsung
3. **Scalability**: Arsitektur microservices memungkinkan scaling setiap komponen secara independen
4. **Maintainability**: Pemisahan concern memudahkan maintenance dan update
5. **Integration Ready**: Sistem siap untuk integrasi dengan sistem eksternal lainnya

---

## 2. LANDASAN TEORI

### 2.1 Arsitektur Microservices

**Microservices** adalah arsitektur aplikasi yang memecah aplikasi monolitik menjadi kumpulan layanan kecil yang independen. Setiap service memiliki database sendiri dan berkomunikasi melalui API.

**Karakteristik Microservices:**
- **Decentralized**: Setiap service dapat dikembangkan dan di-deploy secara independen
- **Technology Diversity**: Setiap service dapat menggunakan teknologi yang berbeda
- **Fault Isolation**: Kegagalan satu service tidak mempengaruhi service lainnya
- **Scalability**: Setiap service dapat di-scale secara independen

**Keuntungan:**
- Fleksibilitas dalam pengembangan
- Deployment yang lebih cepat
- Teknologi yang sesuai untuk setiap service
- Resilience yang lebih baik

**Tantangan:**
- Kompleksitas komunikasi antar service
- Data consistency
- Network latency
- Operational complexity

### 2.2 GraphQL

**GraphQL** adalah query language dan runtime untuk API yang dikembangkan oleh Facebook. GraphQL memungkinkan client untuk meminta data yang tepat sesuai kebutuhan.

**Karakteristik GraphQL:**
- **Single Endpoint**: Satu endpoint untuk semua operasi
- **Type System**: Schema yang strongly-typed
- **Query Language**: Client menentukan struktur data yang diinginkan
- **Introspection**: Schema dapat di-query untuk dokumentasi

**Keuntungan:**
- Mengurangi over-fetching dan under-fetching data
- Strong typing dengan schema
- Self-documenting dengan introspection
- Single endpoint mengurangi kompleksitas routing

**Komponen GraphQL:**
- **Schema**: Definisi tipe data dan operasi
- **Resolvers**: Fungsi yang mengembalikan data untuk setiap field
- **Queries**: Operasi read-only
- **Mutations**: Operasi untuk mengubah data

### 2.3 Docker dan Containerization

**Docker** adalah platform untuk mengembangkan, mengirim, dan menjalankan aplikasi menggunakan containerization.

**Konsep Docker:**
- **Container**: Environment yang terisolasi untuk menjalankan aplikasi
- **Image**: Template read-only untuk membuat container
- **Dockerfile**: Instruksi untuk membangun image
- **Docker Compose**: Tool untuk mengelola multi-container applications

**Keuntungan:**
- **Consistency**: Environment yang sama di development dan production
- **Isolation**: Setiap aplikasi berjalan dalam environment terisolasi
- **Portability**: Aplikasi dapat berjalan di berbagai platform
- **Scalability**: Mudah untuk scale up/down

### 2.4 Next.js dan React

**Next.js** adalah framework React untuk production yang menyediakan:
- Server-side rendering (SSR)
- Static site generation (SSG)
- API routes
- Optimized performance

**React** adalah library JavaScript untuk membangun user interface dengan:
- Component-based architecture
- Virtual DOM untuk performa optimal
- Unidirectional data flow
- Rich ecosystem

### 2.5 MySQL Database

**MySQL** adalah relational database management system (RDBMS) open-source yang:
- Menggunakan SQL untuk query
- Mendukung ACID transactions
- Scalable dan reliable
- Widely adopted

**ACID Properties:**
- **Atomicity**: Transaksi bersifat all-or-nothing
- **Consistency**: Database tetap dalam state yang valid
- **Isolation**: Transaksi concurrent tidak saling mempengaruhi
- **Durability**: Perubahan yang committed bersifat permanen

---

## 3. ANALISIS DAN PERANCANGAN SISTEM

### 3.1 Analisis Kebutuhan

#### 3.1.1 Functional Requirements

**FR1 - Manajemen Menu**
- Sistem harus dapat membuat, membaca, update, dan menghapus menu
- Sistem harus dapat mengelola kategori menu
- Sistem harus dapat menampilkan status ketersediaan menu
- Sistem harus dapat mengelola informasi bahan baku per menu

**FR2 - Manajemen Pesanan**
- Sistem harus dapat membuat pesanan baru
- Sistem harus dapat menampilkan daftar pesanan
- Sistem harus dapat mengupdate status pesanan
- Sistem harus dapat membatalkan pesanan
- Sistem harus dapat menghitung total pembayaran termasuk tax, service charge, dan discount

**FR3 - Manajemen Dapur**
- Sistem harus dapat menampilkan antrian pesanan dapur
- Sistem harus dapat mengupdate status pesanan dapur (pending → preparing → ready → completed)
- Sistem harus dapat mengelola prioritas pesanan

**FR4 - Manajemen Inventori**
- Sistem harus dapat mengelola stok bahan baku
- Sistem harus dapat mengurangi stok saat pesanan dibuat
- Sistem harus dapat menampilkan alert untuk low stock
- Sistem harus dapat mencatat pergerakan stok (stock movements)
- Sistem harus dapat membeli bahan baku dari Toko Sembako

**FR5 - Manajemen Pengguna**
- Sistem harus dapat mengelola data staf
- Sistem harus dapat mengelola data customer
- Sistem harus dapat mengelola program loyalty points

**FR6 - Dashboard**
- Sistem harus menampilkan statistik real-time
- Sistem harus menampilkan overview operasional

#### 3.1.2 Non-Functional Requirements

**NFR1 - Performance**
- Response time API < 500ms untuk 95% requests
- Sistem harus dapat menangani minimal 100 concurrent users

**NFR2 - Scalability**
- Sistem harus dapat di-scale secara horizontal
- Setiap service harus dapat di-scale secara independen

**NFR3 - Availability**
- Sistem harus memiliki uptime minimal 99%
- Sistem harus memiliki health check untuk setiap service

**NFR4 - Security**
- Sistem harus menggunakan HTTPS untuk production
- Sistem harus memiliki authentication dan authorization
- Sistem harus menggunakan environment variables untuk sensitive data

**NFR5 - Maintainability**
- Kode harus mengikuti best practices
- Dokumentasi harus lengkap
- Kode harus modular dan reusable

### 3.2 Arsitektur Sistem

#### 3.2.1 Arsitektur Keseluruhan

Sistem menggunakan arsitektur microservices dengan 4 service utama:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│                  http://localhost:3000                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ GraphQL (Apollo Client)
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Order Service│ │Kitchen Service│ │Inventory Service│
│  Port 4004   │ │  Port 4001   │ │  Port 4002   │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       │                │                │
       ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Order DB    │ │ Kitchen DB   │ │ Inventory DB │
│  MySQL 3310  │ │  MySQL 3307  │ │  MySQL 3311  │
└──────────────┘ └──────────────┘ └──────────────┘
        │
        │
        ▼
┌──────────────┐
│  User Service│
│  Port 4003   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   User DB    │
│  MySQL 3312  │
└──────────────┘
```

#### 3.2.2 Service Architecture

Setiap service mengikuti pola yang sama:

```
Service
├── src/
│   ├── main.py (atau index.js)
│   ├── database/
│   │   ├── connection.py
│   │   └── migrate.py
│   └── graphql/
│       ├── schema.graphql
│       └── resolvers.py
├── Dockerfile
└── requirements.txt (atau package.json)
```

#### 3.2.3 Communication Pattern

**Synchronous Communication:**
- GraphQL queries/mutations untuk inter-service communication
- HTTP/REST untuk integrasi dengan Toko Sembako

**Service Discovery:**
- Menggunakan Docker service names untuk internal communication
- Menggunakan environment variables untuk service URLs

### 3.3 Desain Database

#### 3.3.1 Kitchen Service Database

**Table: kitchen_orders**
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- order_id (VARCHAR(50), UNIQUE)
- order_items (JSON)
- status (ENUM: 'pending', 'preparing', 'ready', 'completed')
- priority (INT, DEFAULT 0)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 3.3.2 Inventory Service Database

**Table: ingredients**
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- name (VARCHAR(100))
- unit (VARCHAR(20))
- category (VARCHAR(50))
- min_stock_level (DECIMAL(10,2))
- current_stock (DECIMAL(10,2))
- supplier_id (INT, FOREIGN KEY)
- cost_per_unit (DECIMAL(10,2))
- status (ENUM: 'active', 'inactive', 'out_of_stock')
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Table: suppliers**
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- name (VARCHAR(100))
- contact_person (VARCHAR(100))
- email (VARCHAR(100))
- phone (VARCHAR(20))
- address (TEXT)
- status (ENUM: 'active', 'inactive')
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Table: stock_movements**
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- ingredient_id (INT, FOREIGN KEY)
- movement_type (ENUM: 'in', 'out', 'adjustment')
- quantity (DECIMAL(10,2))
- reason (TEXT)
- reference_id (VARCHAR(50))
- reference_type (VARCHAR(50))
- created_at (TIMESTAMP)
```

#### 3.3.3 User Service Database

**Table: staff**
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- staff_id (VARCHAR(50), UNIQUE)
- name (VARCHAR(100))
- email (VARCHAR(100))
- phone (VARCHAR(20))
- role (VARCHAR(50))
- status (ENUM: 'active', 'inactive')
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Table: customers**
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- customer_id (VARCHAR(50), UNIQUE)
- name (VARCHAR(100))
- email (VARCHAR(100))
- phone (VARCHAR(20))
- loyalty_points (DECIMAL(10,2), DEFAULT 0)
- status (ENUM: 'active', 'inactive')
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 3.3.4 Order Service Database

**Table: menus**
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- menu_id (VARCHAR(50), UNIQUE)
- name (VARCHAR(100))
- description (TEXT)
- category (VARCHAR(50))
- price (DECIMAL(10,2))
- image (VARCHAR(255))
- ingredients (JSON)
- available (BOOLEAN, DEFAULT TRUE)
- preparation_time (INT)
- tags (JSON)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Table: carts**
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- user_id (VARCHAR(50))
- items (JSON)
- subtotal (DECIMAL(10,2))
- item_count (INT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Table: orders**
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- order_id (VARCHAR(50), UNIQUE)
- customer_id (VARCHAR(50))
- table_number (VARCHAR(20))
- items (JSON)
- subtotal (DECIMAL(10,2))
- tax (DECIMAL(10,2))
- service_charge (DECIMAL(10,2))
- discount (DECIMAL(10,2))
- loyalty_points_used (DECIMAL(10,2))
- loyalty_points_earned (DECIMAL(10,2))
- total (DECIMAL(10,2))
- payment_method (VARCHAR(50))
- payment_status (ENUM: 'pending', 'paid', 'refunded')
- order_status (ENUM: 'pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')
- kitchen_status (VARCHAR(50))
- staff_id (VARCHAR(50))
- notes (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### 3.4 Desain API (GraphQL Schema)

#### 3.4.1 Kitchen Service Schema

```graphql
type Query {
  kitchenOrders(status: String): [KitchenOrder!]!
  kitchenOrder(id: String!): KitchenOrder
}

type Mutation {
  createKitchenOrder(input: CreateKitchenOrderInput!): KitchenOrder!
  updateKitchenOrderStatus(id: String!, status: String!): KitchenOrder!
  completeKitchenOrder(id: String!): KitchenOrder!
}

type KitchenOrder {
  id: String!
  orderId: String!
  items: [OrderItem!]!
  status: String!
  priority: Int!
  createdAt: String!
  updatedAt: String!
}
```

#### 3.4.2 Inventory Service Schema

```graphql
type Query {
  ingredients(category: String, status: String): [Ingredient!]!
  ingredient(id: String!): Ingredient
  checkStock(ingredientId: String!, quantity: Float!): StockCheckResult!
  tokoSembakoProducts(category: String): [TokoSembakoProduct!]!
  checkTokoSembakoStock(productId: String!, quantity: Float!): TokoSembakoStockCheck!
}

type Mutation {
  reduceStock(ingredientId: String!, quantity: Float!, reason: String, referenceId: String, referenceType: String): StockMovement!
  purchaseFromTokoSembako(input: PurchaseFromTokoSembakoInput!): PurchaseFromTokoSembakoResult!
}

type Ingredient {
  id: String!
  name: String!
  unit: String!
  category: String
  minStockLevel: Float!
  currentStock: Float!
  supplier: Supplier
  costPerUnit: Float!
  status: String!
}
```

#### 3.4.3 User Service Schema

```graphql
type Query {
  staff: [Staff!]!
  staffById(id: String!): Staff
  customers: [Customer!]!
  customerById(id: String!): Customer
}

type Mutation {
  createStaff(input: CreateStaffInput!): Staff!
  updateStaff(id: String!, input: UpdateStaffInput!): Staff!
  createCustomer(input: CreateCustomerInput!): Customer!
  updateCustomer(id: String!, input: UpdateCustomerInput!): Customer!
  addLoyaltyPoints(customerId: String!, points: Float!): Customer!
}
```

#### 3.4.4 Order Service Schema

```graphql
type Query {
  menus(category: String, available: Boolean): [Menu!]!
  menu(id: String!): Menu
  cart(userId: String!): Cart
  orders(customerId: String, status: String): [Order!]!
  order(id: String!): Order
  checkMenuStock(menuId: String!, quantity: Int!): [StockCheckResult!]!
}

type Mutation {
  createMenu(input: CreateMenuInput!): Menu!
  updateMenu(id: String!, input: UpdateMenuInput!): Menu!
  deleteMenu(id: String!): Boolean!
  addToCart(userId: String!, menuId: String!, quantity: Int!): Cart!
  createOrder(input: CreateOrderInput!): Order!
  updateOrderStatus(id: String!, status: String!): Order!
}
```

### 3.5 Desain Frontend

#### 3.5.1 Struktur Halaman

**Dashboard (`/`)**
- Statistik overview (total orders, revenue, pending orders)
- Charts untuk visualisasi data
- Recent activities

**Menu Management (`/menu`)**
- Daftar menu dengan filter dan search
- Form create/edit menu
- Toggle availability

**Order Management (`/orders`)**
- Daftar pesanan dengan filter status
- Detail pesanan
- Update status pesanan

**Kitchen Queue (`/kitchen`)**
- Kanban board untuk antrian dapur
- Drag and drop untuk update status
- Real-time updates

**Inventory Management (`/inventory`)**
- Daftar bahan baku
- Stock movements history
- Low stock alerts
- Purchase from Toko Sembako

**User Management (`/users`)**
- Daftar staff
- Daftar customers
- Loyalty points management

#### 3.5.2 Component Architecture

```
Frontend
├── app/
│   ├── (admin)/
│   │   ├── page.tsx (Dashboard)
│   │   ├── menu/
│   │   ├── orders/
│   │   ├── kitchen/
│   │   ├── inventory/
│   │   └── users/
│   └── layout.tsx
├── components/
│   ├── common/
│   ├── forms/
│   └── ui/
├── lib/
│   └── apollo-client.ts
└── providers/
    └── ApolloProvider.tsx
```

---

## 4. IMPLEMENTASI

### 4.1 Backend Services

#### 4.1.1 Kitchen Service (Python)

**Teknologi:**
- Python 3.11
- FastAPI
- Ariadne GraphQL
- aiomysql
- MySQL 8.0

**Fitur:**
- Manajemen antrian pesanan dapur
- Status tracking (pending → preparing → ready → completed)
- Priority management

**File Structure:**
```
kitchen-service-python/
├── src/
│   ├── main.py
│   ├── database/
│   │   ├── connection.py
│   │   └── migrate.py
│   └── graphql/
│       ├── schema.graphql
│       └── resolvers.py
├── Dockerfile
└── requirements.txt
```

**Key Implementation:**

```python
# main.py
from fastapi import FastAPI
from ariadne import make_executable_schema, load_schema_from_path, graphql_sync

app = FastAPI(title="Kitchen Service (Python)")

# Load schema
schema_path = os.path.join(os.path.dirname(__file__), "graphql", "schema.graphql")
type_defs = load_schema_from_path(schema_path)
schema = make_executable_schema(type_defs, resolvers)

@app.post("/graphql")
async def graphql_server(request: Request):
    data = await request.json()
    success, result = graphql_sync(schema, data)
    return result
```

#### 4.1.2 Inventory Service (Python)

**Fitur:**
- Manajemen stok bahan baku
- Supplier management
- Stock movements tracking
- Integrasi dengan Toko Sembako

**Integrasi Toko Sembako:**

```python
# services/toko_sembako_client.py
async def get_products_from_toko_sembako(category=None):
    query = """
    query GetProducts($category: String) {
        products(category: $category) {
            id
            name
            category
            price
            unit
            available
        }
    }
    """
    # HTTP request ke Toko Sembako service
```

#### 4.1.3 User Service (Python)

**Fitur:**
- Manajemen staff
- Manajemen customers
- Loyalty points program

#### 4.1.4 Order Service (Python)

**Fitur:**
- Manajemen menu
- Shopping cart
- Order processing
- Integrasi dengan semua service lainnya

**Order Flow:**
1. User membuat pesanan
2. Order Service memanggil Inventory Service untuk cek stok
3. Order Service memanggil Kitchen Service untuk membuat kitchen order
4. Order Service memanggil User Service untuk update loyalty points
5. Order Service mengurangi stok di Inventory Service

### 4.2 Frontend Dashboard

#### 4.2.1 Setup Apollo Client

```typescript
// lib/apollo-client.ts
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const ORDER_SERVICE_URL = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || 'http://localhost:4004/graphql';
const KITCHEN_SERVICE_URL = process.env.NEXT_PUBLIC_KITCHEN_SERVICE_URL || 'http://localhost:4001/graphql';
// ... other services

export const orderClient = new ApolloClient({
  link: new HttpLink({ uri: ORDER_SERVICE_URL }),
  cache: new InMemoryCache(),
});
```

#### 4.2.2 Menu Management Page

```typescript
// app/(admin)/menu/page.tsx
'use client';

import { useQuery, useMutation } from '@apollo/client';
import { GET_MENUS, CREATE_MENU } from '@/lib/queries';

export default function MenuPage() {
  const { data, loading, error } = useQuery(GET_MENUS);
  const [createMenu] = useMutation(CREATE_MENU);

  // ... component implementation
}
```

#### 4.2.3 Kitchen Queue Page

```typescript
// app/(admin)/kitchen/page.tsx
'use client';

import { useQuery, useMutation } from '@apollo/client';
import { GET_KITCHEN_ORDERS, UPDATE_KITCHEN_ORDER_STATUS } from '@/lib/queries';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

export default function KitchenPage() {
  // Kanban board implementation dengan drag and drop
}
```

### 4.3 Integrasi Antar Service

#### 4.3.1 Order Service → Kitchen Service

```python
# order-service-python/src/graphql/resolvers.py
async def create_order_resolver(obj, info, input):
    # ... create order logic
    
    # Create kitchen order
    kitchen_mutation = """
    mutation CreateKitchenOrder($input: CreateKitchenOrderInput!) {
        createKitchenOrder(input: $input) {
            id
            orderId
            status
        }
    }
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            os.getenv("KITCHEN_SERVICE_URL"),
            json={"query": kitchen_mutation, "variables": {"input": kitchen_input}}
        )
```

#### 4.3.2 Order Service → Inventory Service

```python
# Check stock before creating order
stock_check_query = """
query CheckStock($ingredientId: String!, $quantity: Float!) {
    checkStock(ingredientId: $ingredientId, quantity: $quantity) {
        available
        currentStock
        message
    }
}
"""

# Reduce stock after order created
reduce_stock_mutation = """
mutation ReduceStock($ingredientId: String!, $quantity: Float!) {
    reduceStock(ingredientId: $ingredientId, quantity: $quantity) {
        id
        quantity
    }
}
"""
```

#### 4.3.3 Order Service → User Service

```python
# Add loyalty points
loyalty_mutation = """
mutation AddLoyaltyPoints($customerId: String!, $points: Float!) {
    addLoyaltyPoints(customerId: $customerId, points: $points) {
        id
        loyaltyPoints
    }
}
"""
```

### 4.4 Integrasi Lintas Kelompok

#### 4.4.1 Toko Sembako Integration

Inventory Service terintegrasi dengan Toko Sembako untuk pembelian bahan baku:

```python
# inventory-service-python/src/services/toko_sembako_client.py
TOKO_SEMBAKO_PRODUCT_URL = os.getenv("TOKO_SEMBAKO_PRODUCT_URL")
TOKO_SEMBAKO_ORDER_URL = os.getenv("TOKO_SEMBAKO_ORDER_URL")

async def get_products_from_toko_sembako(category=None):
    query = """
    query GetProducts($category: String) {
        products(category: $category) {
            id
            name
            category
            price
            unit
            available
        }
    }
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            TOKO_SEMBAKO_PRODUCT_URL,
            json={"query": query, "variables": {"category": category}}
        )
        return response.json()["data"]["products"]

async def create_order_at_toko_sembako(order_number, items, notes=None):
    mutation = """
    mutation CreateOrder($input: CreateOrderInput!) {
        createOrder(input: $input) {
            id
            orderId
            status
            total
        }
    }
    """
    # ... implementation
```

### 4.5 Deployment dengan Docker

#### 4.5.1 Dockerfile

```dockerfile
# kitchen-service-python/Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 4001

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "4001"]
```

#### 4.5.2 Docker Compose

```yaml
# docker-compose-python.yml
services:
  kitchen-db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: kitchen_db
      MYSQL_USER: kitchen_user
      MYSQL_PASSWORD: kitchen_pass
    ports:
      - "3307:3306"
    volumes:
      - kitchen_db_data:/var/lib/mysql
    networks:
      - resto-network

  kitchen-service-python:
    build:
      context: ./kitchen-service-python
    ports:
      - "4001:4001"
    environment:
      PORT: 4001
      DB_HOST: kitchen-db
      DB_PORT: 3306
      DB_USER: kitchen_user
      DB_PASSWORD: kitchen_pass
      DB_NAME: kitchen_db
    depends_on:
      kitchen-db:
        condition: service_healthy
    networks:
      - resto-network

# ... other services
```

---

## 5. PENGUJIAN

### 5.1 Unit Testing

#### 5.1.1 Database Connection Test

```python
# Test database connection
def test_db_connection():
    conn = get_db_connection()
    assert conn is not None
    cursor = conn.cursor()
    cursor.execute("SELECT 1")
    result = cursor.fetchone()
    assert result[0] == 1
    cursor.close()
    conn.close()
```

#### 5.1.2 Resolver Test

```python
# Test GraphQL resolver
def test_get_kitchen_orders():
    query = """
    query {
        kitchenOrders {
            id
            orderId
            status
        }
    }
    """
    result = graphql_sync(schema, {"query": query})
    assert result[1]["data"]["kitchenOrders"] is not None
```

### 5.2 Integration Testing

#### 5.2.1 Order Flow Test

**Test Scenario:**
1. Create menu
2. Create order
3. Verify kitchen order created
4. Verify stock reduced
5. Verify loyalty points added

```python
async def test_order_flow():
    # 1. Create menu
    create_menu_mutation = """
    mutation {
        createMenu(input: {
            menuId: "MENU001"
            name: "Nasi Goreng"
            category: "Main Course"
            price: 25000
            ingredients: []
        }) {
            id
            name
        }
    }
    """
    
    # 2. Create order
    create_order_mutation = """
    mutation {
        createOrder(input: {
            items: [{
                menuId: "MENU001"
                name: "Nasi Goreng"
                quantity: 2
                price: 25000
            }]
            paymentMethod: "cash"
        }) {
            id
            total
        }
    }
    """
    
    # 3. Verify kitchen order
    kitchen_query = """
    query {
        kitchenOrders {
            id
            orderId
            status
        }
    }
    """
    
    # Assertions
    assert kitchen_order is not None
    assert stock_reduced == True
    assert loyalty_points_added > 0
```

### 5.3 System Testing

#### 5.3.1 End-to-End Test

**Test Scenario: Complete Order Flow**

1. **Frontend**: User membuka halaman menu
2. **Frontend**: User menambahkan item ke cart
3. **Frontend**: User membuat pesanan
4. **Backend**: Order Service memproses pesanan
5. **Backend**: Kitchen Service menerima pesanan
6. **Backend**: Inventory Service mengurangi stok
7. **Frontend**: User melihat status pesanan di dashboard

**Expected Results:**
- Menu ditampilkan dengan benar
- Cart berfungsi dengan baik
- Pesanan berhasil dibuat
- Kitchen order terlihat di antrian dapur
- Stok berkurang sesuai jumlah pesanan
- Dashboard menampilkan data real-time

### 5.4 User Acceptance Testing

#### 5.4.1 Test Cases

**TC1: Create Menu**
- **Action**: Admin membuat menu baru
- **Expected**: Menu muncul di daftar menu
- **Result**: ✅ PASS

**TC2: Create Order**
- **Action**: User membuat pesanan
- **Expected**: Pesanan berhasil dibuat, kitchen order terbuat, stok berkurang
- **Result**: ✅ PASS

**TC3: Update Kitchen Order Status**
- **Action**: Koki mengupdate status pesanan
- **Expected**: Status berubah di kanban board
- **Result**: ✅ PASS

**TC4: Purchase from Toko Sembako**
- **Action**: Admin membeli bahan baku dari Toko Sembako
- **Expected**: Pesanan terbuat, stok bertambah
- **Result**: ✅ PASS

**TC5: View Dashboard**
- **Action**: Admin membuka dashboard
- **Expected**: Statistik ditampilkan dengan benar
- **Result**: ✅ PASS

---

## 6. KESIMPULAN DAN SARAN

### 6.1 Kesimpulan

1. **Sistem Berhasil Dibangun**: Sistem manajemen restoran berbasis microservices telah berhasil dibangun dengan 4 service utama (Kitchen, Inventory, User, Order) yang terintegrasi menggunakan GraphQL.

2. **Arsitektur Microservices Efektif**: Pemisahan service memungkinkan pengembangan dan deployment yang independen, serta memudahkan maintenance dan scaling.

3. **GraphQL Memberikan Fleksibilitas**: Penggunaan GraphQL memungkinkan frontend untuk meminta data yang tepat sesuai kebutuhan, mengurangi over-fetching dan under-fetching.

4. **Docker Memudahkan Deployment**: Containerization dengan Docker memungkinkan environment yang konsisten antara development dan production, serta memudahkan orchestration dengan Docker Compose.

5. **Integrasi Lintas Kelompok Berhasil**: Integrasi dengan Toko Sembako untuk pembelian bahan baku berhasil diimplementasikan dan berfungsi dengan baik.

6. **Dual Implementation Memberikan Fleksibilitas**: Implementasi Node.js dan Python memberikan pilihan teknologi yang sesuai dengan kebutuhan tim.

### 6.2 Saran untuk Pengembangan Selanjutnya

1. **Authentication & Authorization**
   - Implementasi JWT untuk authentication
   - Role-based access control (RBAC)
   - OAuth2 untuk third-party integration

2. **Real-time Updates**
   - Implementasi WebSocket atau GraphQL Subscriptions
   - Real-time notifications untuk order updates
   - Live dashboard updates tanpa polling

3. **Caching & Performance**
   - Implementasi Redis untuk caching
   - Database query optimization
   - CDN untuk static assets

4. **Monitoring & Logging**
   - Implementasi centralized logging (ELK stack)
   - APM (Application Performance Monitoring)
   - Health check endpoints dengan metrics

5. **Testing**
   - Automated testing dengan CI/CD
   - Load testing untuk performance
   - Security testing

6. **Documentation**
   - API documentation dengan GraphQL introspection
   - Swagger/OpenAPI untuk REST endpoints
   - Architecture decision records (ADRs)

7. **Scalability**
   - Implementasi message queue (RabbitMQ/Kafka)
   - Database replication dan sharding
   - Load balancing

8. **Security**
   - HTTPS untuk production
   - Rate limiting
   - Input validation dan sanitization
   - SQL injection prevention

9. **User Experience**
   - Mobile responsive design
   - Progressive Web App (PWA)
   - Offline support

10. **Business Features**
    - Reporting dan analytics
    - Export data (PDF, Excel)
    - Multi-tenant support
    - Multi-language support

---

## 7. DAFTAR PUSTAKA

1. Newman, S. (2015). *Building Microservices: Designing Fine-Grained Systems*. O'Reilly Media.

2. GraphQL Foundation. (2024). *GraphQL Specification*. https://graphql.org/

3. Docker Inc. (2024). *Docker Documentation*. https://docs.docker.com/

4. Vercel. (2024). *Next.js Documentation*. https://nextjs.org/docs

5. FastAPI. (2024). *FastAPI Documentation*. https://fastapi.tiangolo.com/

6. Ariadne GraphQL. (2024). *Ariadne Documentation*. https://ariadne.readthedocs.io/

7. Apollo GraphQL. (2024). *Apollo Server Documentation*. https://www.apollographql.com/docs/apollo-server/

8. MySQL. (2024). *MySQL Documentation*. https://dev.mysql.com/doc/

9. React. (2024). *React Documentation*. https://react.dev/

10. Tailwind CSS. (2024). *Tailwind CSS Documentation*. https://tailwindcss.com/docs

---

## 8. RENCANA INTEGRASI LINTAS KELOMPOK

### 8.1 Overview Integrasi dengan Toko Sembako

Sesuai ketentuan tugas besar, sistem **Anugerah Resto** melakukan integrasi lintas kelompok dengan sistem **Toko Sembako**. Integrasi ini memungkinkan sistem restoran untuk melakukan pengadaan bahan baku secara otomatis dari Toko Sembako ketika stok bahan baku di restoran menipis.

**Kelompok Mitra: Toko Sembako**

Toko Sembako menyediakan 3 microservices utama:
- **Product Service** (Port 4001) - Manajemen katalog produk/sayur
- **Inventory Service** (Port 4000) - Manajemen stok produk
- **Order Service** (Port 4002) - Manajemen pesanan pembelian

**Arsitektur Integrasi:**

```
┌─────────────────────────────────────────────────────────┐
│              Anugerah Resto System                      │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │     Inventory Service (Port 4002)                │  │
│  │     - Mengkonsumsi API Toko Sembako             │  │
│  │     - Menyediakan API untuk kelompok lain       │  │
│  └──────────────┬───────────────────────────────────┘  │
│                 │                                        │
│                 │ GraphQL HTTP Requests                  │
│                 │                                        │
└─────────────────┼────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│              Toko Sembako System                        │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Product    │  │  Inventory   │  │    Order     │ │
│  │   Service    │  │   Service    │  │   Service    │ │
│  │  (Port 4001) │  │  (Port 4000) │  │  (Port 4002) │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 8.2 Sebagai Consumer (Wajib)

**Inventory Service** berperan sebagai **Consumer** yang mengkonsumsi minimal 1 endpoint GraphQL dari Toko Sembako. Berikut adalah endpoint yang dikonsumsi:

#### 8.2.1 Mengkonsumsi Product Service (Toko Sembako)

**Endpoint:** `http://toko-sembako-product:4001/graphql`

**Query yang Dikonsumsi:**

```graphql
# Query 1: Get All Products
query GetProducts($category: String) {
  products(category: $category) {
    id
    name
    category
    price
    unit
    available
    description
  }
}

# Query 2: Get Product by ID
query GetProductById($productId: ID!) {
  product(id: $productId) {
    id
    name
    category
    price
    unit
    available
    description
  }
}
```

**Implementasi di Inventory Service:**

```python
# inventory-service-python/src/services/toko_sembako_client.py
TOKO_SEMBAKO_PRODUCT_URL = os.getenv("TOKO_SEMBAKO_PRODUCT_URL", 
                                     "http://host.docker.internal:4001/graphql")

async def get_products_from_toko_sembako(category: Optional[str] = None):
    """Mengkonsumsi Product Service dari Toko Sembako"""
    query = """
    query GetProducts($category: String) {
        products(category: $category) {
            id
            name
            category
            price
            unit
            available
            description
        }
    }
    """
    variables = {"category": category} if category else {}
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            TOKO_SEMBAKO_PRODUCT_URL,
            json={"query": query, "variables": variables},
            headers={"Content-Type": "application/json"}
        )
        data = response.json()
        return data.get("data", {}).get("products", [])
```

**Exposed di Inventory Service GraphQL:**

```graphql
# Inventory Service memaparkan query untuk frontend
type Query {
  tokoSembakoProducts(category: String): [TokoSembakoProduct!]!
}

type TokoSembakoProduct {
  id: String!
  name: String!
  category: String
  price: Float!
  unit: String!
  available: Boolean!
  description: String
}
```

#### 8.2.2 Mengkonsumsi Inventory Service (Toko Sembako)

**Endpoint:** `http://toko-sembako-inventory:4000/graphql`

**Query yang Dikonsumsi:**

```graphql
# Check Stock dari Toko Sembako
query CheckStock($productId: ID!, $quantity: Float!) {
  checkStock(productId: $productId, quantity: $quantity) {
    available
    currentStock
    requestedQuantity
    message
  }
}
```

**Implementasi:**

```python
async def check_stock_from_toko_sembako(product_id: str, quantity: float):
    """Mengkonsumsi Inventory Service dari Toko Sembako untuk cek stok"""
    query = """
    query CheckStock($productId: ID!, $quantity: Float!) {
        checkStock(productId: $productId, quantity: $quantity) {
            available
            currentStock
            requestedQuantity
            message
        }
    }
    """
    variables = {
        "productId": product_id,
        "quantity": quantity
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            TOKO_SEMBAKO_INVENTORY_URL,
            json={"query": query, "variables": variables}
        )
        data = response.json()
        return data.get("data", {}).get("checkStock", {})
```

#### 8.2.3 Mengkonsumsi Order Service (Toko Sembako)

**Endpoint:** `http://toko-sembako-order:4002/graphql`

**Mutation yang Dikonsumsi:**

```graphql
# Create Order di Toko Sembako
mutation CreateOrder($input: CreateOrderInput!) {
  createOrder(input: $input) {
    id
    orderId
    status
    total
    items {
      productId
      name
      quantity
      price
    }
    createdAt
  }
}
```

**Implementasi:**

```python
async def create_order_at_toko_sembako(order_number: str, items: List[Dict], notes: Optional[str] = None):
    """Mengkonsumsi Order Service dari Toko Sembako untuk membuat pesanan"""
    mutation = """
    mutation CreateOrder($input: CreateOrderInput!) {
        createOrder(input: $input) {
            id
            orderId
            status
            total
            items {
                productId
                name
                quantity
                price
            }
            createdAt
        }
    }
    """
    
    order_input = {
        "orderNumber": order_number,
        "items": items,
        "notes": notes
    }
    
    variables = {"input": order_input}
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            TOKO_SEMBAKO_ORDER_URL,
            json={"query": mutation, "variables": variables}
        )
        data = response.json()
        return data.get("data", {}).get("createOrder", {})
```

**Alur Penggunaan:**

1. Admin restoran melihat daftar produk dari Toko Sembako melalui query `tokoSembakoProducts`
2. Admin memilih produk dan mengecek ketersediaan stok melalui `checkTokoSembakoStock`
3. Admin membuat pesanan pembelian melalui mutation `purchaseFromTokoSembako`
4. Inventory Service memanggil Order Service Toko Sembako untuk membuat pesanan
5. Setelah pesanan berhasil, stok lokal di restoran ditambahkan secara otomatis

### 8.3 Sebagai Provider (Nilai Tambah)

Sebagai nilai tambah dan bukti integrasi nyata, sistem **Anugerah Resto** juga menyediakan endpoint GraphQL yang dapat dikonsumsi oleh kelompok lain. **User Service** dan **Order Service** menyediakan endpoint untuk integrasi eksternal.

#### 8.3.1 User Service sebagai Provider

**Endpoint yang Disediakan:** `http://user-service:4003/graphql`

**Query yang Disediakan untuk Kelompok Lain:**

```graphql
# Query 1: Get Customer by ID (untuk validasi customer dari sistem eksternal)
query GetCustomerById($customerId: ID!) {
  customerById(id: $customerId) {
    id
    customerId
    name
    email
    phone
    loyaltyPoints
    status
  }
}

# Query 2: Get Staff by ID (untuk validasi staff dari sistem eksternal)
query GetStaffById($staffId: ID!) {
  staffById(id: $staffId) {
    id
    staffId
    name
    email
    phone
    role
    status
  }
}

# Query 3: Validate Customer Loyalty Points
query ValidateLoyaltyPoints($customerId: ID!, $requiredPoints: Float!) {
  customerById(id: $customerId) {
    id
    loyaltyPoints
  }
}
```

**Contoh Penggunaan oleh Kelompok Lain:**

```graphql
# Kelompok lain (misalnya Payment Gateway) dapat memvalidasi customer
query {
  customerById(customerId: "CUST001") {
    id
    name
    loyaltyPoints
    status
  }
}
```

#### 8.3.2 Order Service sebagai Provider

**Endpoint yang Disediakan:** `http://order-service:4004/graphql`

**Query yang Disediakan untuk Kelompok Lain:**

```graphql
# Query 1: Get Order by ID (untuk tracking pesanan dari sistem eksternal)
query GetOrderById($orderId: ID!) {
  order(id: $orderId) {
    id
    orderId
    customerId
    total
    orderStatus
    paymentStatus
    items {
      menuId
      name
      quantity
      price
    }
    createdAt
  }
}

# Query 2: Get Orders by Customer (untuk riwayat pesanan)
query GetOrdersByCustomer($customerId: String!) {
  orders(customerId: $customerId) {
    id
    orderId
    total
    orderStatus
    createdAt
  }
}

# Query 3: Check Menu Availability
query CheckMenuAvailability($menuId: ID!, $quantity: Int!) {
  menu(id: $menuId) {
    id
    name
    available
    price
  }
  checkMenuStock(menuId: $menuId, quantity: $quantity) {
    available
    message
    ingredientId
    ingredientName
    required
    availableQuantity
  }
}
```

**Contoh Penggunaan oleh Kelompok Lain:**

```graphql
# Kelompok lain (misalnya Delivery Service) dapat tracking order
query {
  order(orderId: "ORD001") {
    id
    orderId
    orderStatus
    items {
      name
      quantity
    }
    total
  }
}
```

### 8.4 Dokumentasi Endpoint

#### 8.4.1 Endpoint yang Dikonsumsi (Consumer)

| Service Toko Sembako | Endpoint | Query/Mutation | Deskripsi |
|---------------------|----------|----------------|-----------|
| Product Service | `http://toko-sembako-product:4001/graphql` | `products`, `product` | Mengambil daftar produk dan detail produk |
| Inventory Service | `http://toko-sembako-inventory:4000/graphql` | `checkStock` | Mengecek ketersediaan stok produk |
| Order Service | `http://toko-sembako-order:4002/graphql` | `createOrder` | Membuat pesanan pembelian bahan baku |

#### 8.4.2 Endpoint yang Disediakan (Provider)

| Service Anugerah Resto | Endpoint | Query/Mutation | Deskripsi |
|----------------------|----------|----------------|-----------|
| User Service | `http://user-service:4003/graphql` | `customerById`, `staffById`, `validateLoyaltyPoints` | Validasi customer dan staff untuk sistem eksternal |
| Order Service | `http://order-service:4004/graphql` | `order`, `orders`, `checkMenuAvailability` | Tracking pesanan dan cek ketersediaan menu |

### 8.5 Alur Integrasi Lengkap

#### 8.5.1 Alur Pembelian Bahan Baku dari Toko Sembako

```
┌─────────────┐
│   Frontend  │
│  (Admin)    │
└──────┬──────┘
       │
       │ 1. Query: tokoSembakoProducts
       ▼
┌─────────────────────────────────┐
│   Inventory Service             │
│   (Anugerah Resto)              │
└──────┬──────────────────────────┘
       │
       │ 2. HTTP POST to Product Service
       ▼
┌─────────────────────────────────┐
│   Product Service               │
│   (Toko Sembako)                │
│   Returns: List of Products     │
└─────────────────────────────────┘
       │
       │ 3. Response: Products
       ▼
┌─────────────────────────────────┐
│   Inventory Service             │
│   (Anugerah Resto)              │
└──────┬──────────────────────────┘
       │
       │ 4. Query: checkTokoSembakoStock
       │    HTTP POST to Inventory Service
       ▼
┌─────────────────────────────────┐
│   Inventory Service             │
│   (Toko Sembako)                │
│   Returns: Stock Availability   │
└─────────────────────────────────┘
       │
       │ 5. Response: Stock OK
       ▼
┌─────────────────────────────────┐
│   Inventory Service             │
│   (Anugerah Resto)              │
└──────┬──────────────────────────┘
       │
       │ 6. Mutation: purchaseFromTokoSembako
       │    HTTP POST to Order Service
       ▼
┌─────────────────────────────────┐
│   Order Service                 │
│   (Toko Sembako)                │
│   Creates Order                  │
└─────────────────────────────────┘
       │
       │ 7. Response: Order Created
       ▼
┌─────────────────────────────────┐
│   Inventory Service             │
│   (Anugerah Resto)              │
│   Updates Local Stock            │
└─────────────────────────────────┘
       │
       │ 8. Response: Success
       ▼
┌─────────────┐
│   Frontend  │
│  (Admin)    │
│  Shows:      │
│  Order Created│
│  Stock Added │
└─────────────┘
```

#### 8.5.2 Alur Validasi Customer oleh Sistem Eksternal

```
┌─────────────────────────────────┐
│   External System               │
│   (Payment Gateway / Delivery)  │
└──────┬──────────────────────────┘
       │
       │ 1. Query: customerById
       │    HTTP POST with customerId
       ▼
┌─────────────────────────────────┐
│   User Service                  │
│   (Anugerah Resto)              │
│   Port: 4003                    │
└──────┬──────────────────────────┘
       │
       │ 2. Query Database
       ▼
┌─────────────────────────────────┐
│   User Database                 │
│   (MySQL)                       │
└─────────────────────────────────┘
       │
       │ 3. Response: Customer Data
       ▼
┌─────────────────────────────────┐
│   User Service                  │
│   (Anugerah Resto)              │
└──────┬──────────────────────────┘
       │
       │ 4. GraphQL Response
       ▼
┌─────────────────────────────────┐
│   External System               │
│   Uses customer data for        │
│   validation/processing         │
└─────────────────────────────────┘
```

### 8.6 Konfigurasi Environment Variables

**Inventory Service (.env):**

```env
# Toko Sembako Integration URLs
TOKO_SEMBAKO_PRODUCT_URL=http://host.docker.internal:4001/graphql
TOKO_SEMBAKO_INVENTORY_URL=http://host.docker.internal:4000/graphql
TOKO_SEMBAKO_ORDER_URL=http://host.docker.internal:4002/graphql
```

**Docker Compose Configuration:**

```yaml
inventory-service-python:
  environment:
    # Toko Sembako Integration URLs
    TOKO_SEMBAKO_PRODUCT_URL: http://host.docker.internal:4001/graphql
    TOKO_SEMBAKO_INVENTORY_URL: http://host.docker.internal:4000/graphql
    TOKO_SEMBAKO_ORDER_URL: http://host.docker.internal:4002/graphql
```

**Catatan:** `host.docker.internal` digunakan untuk mengakses services yang berjalan di host machine dari dalam Docker container.

### 8.7 Error Handling dan Resilience

**Strategi Error Handling:**

1. **Timeout Handling**: Setiap request ke Toko Sembako memiliki timeout 10 detik
2. **Retry Mechanism**: Implementasi retry untuk request yang gagal (maksimal 3 kali)
3. **Fallback Response**: Jika service Toko Sembako tidak tersedia, sistem mengembalikan response kosong atau error message yang jelas
4. **Logging**: Semua request dan response ke/dari Toko Sembako di-log untuk debugging

**Contoh Implementasi:**

```python
async def call_toko_sembako_service(url: str, query: str, variables: Dict = None, retries: int = 3):
    """Helper function dengan retry mechanism"""
    for attempt in range(retries):
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    url,
                    json={"query": query, "variables": variables or {}},
                    headers={"Content-Type": "application/json"}
                )
                response.raise_for_status()
                data = response.json()
                
                if "errors" in data:
                    raise Exception(data["errors"][0]["message"])
                
                return data.get("data", {})
        except httpx.TimeoutException:
            if attempt < retries - 1:
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
                continue
            raise Exception(f"Timeout connecting to {url}")
        except Exception as e:
            if attempt < retries - 1:
                await asyncio.sleep(2 ** attempt)
                continue
            raise Exception(f"Error calling service: {str(e)}")
```

### 8.8 Testing Integrasi Lintas Kelompok

**Test Scenario:**

1. **Test Konsumsi Product Service:**
   - Query `tokoSembakoProducts` dari Inventory Service
   - Verifikasi response berisi daftar produk dari Toko Sembako

2. **Test Konsumsi Inventory Service:**
   - Query `checkTokoSembakoStock` dengan productId dan quantity
   - Verifikasi response menunjukkan status ketersediaan stok

3. **Test Konsumsi Order Service:**
   - Mutation `purchaseFromTokoSembako` dengan order input
   - Verifikasi order berhasil dibuat di Toko Sembako
   - Verifikasi stok lokal bertambah setelah purchase

4. **Test Provider Endpoint:**
   - Query `customerById` dari sistem eksternal
   - Verifikasi response berisi data customer yang valid

**Expected Results:**
- ✅ Semua endpoint Toko Sembako dapat diakses
- ✅ Data yang dikembalikan sesuai dengan schema yang diharapkan
- ✅ Error handling berfungsi dengan baik saat service tidak tersedia
- ✅ Stok lokal terupdate setelah purchase berhasil

---

## 9. LAMPIRAN

### 9.1 Struktur Project Lengkap

```
anugerah-resto/
├── docker-compose.yml              # Node.js services
├── docker-compose-python.yml       # Python services
├── README.md
├── QUICK_START.md
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
├── user-service/                   # Node.js User Service
├── user-service-python/            # Python User Service
├── order-service/                  # Node.js Order Service
├── order-service-python/           # Python Order Service
│
├── frontend/                       # Next.js Frontend
│   ├── src/
│   │   ├── app/
│   │   │   └── (admin)/
│   │   │       ├── page.tsx
│   │   │       ├── menu/
│   │   │       ├── orders/
│   │   │       ├── kitchen/
│   │   │       ├── inventory/
│   │   │       └── users/
│   │   ├── components/
│   │   ├── lib/
│   │   │   └── apollo-client.ts
│   │   └── providers/
│   ├── package.json
│   └── README.md
│
└── examples/                       # Contoh queries
    ├── test-queries.graphql
    └── toko-sembako-integration-queries.graphql
```

### 9.2 Environment Variables

**Backend Services (.env)**
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=service_user
DB_PASSWORD=service_pass
DB_NAME=service_db

# Service URLs
KITCHEN_SERVICE_URL=http://localhost:4001/graphql
INVENTORY_SERVICE_URL=http://localhost:4002/graphql
USER_SERVICE_URL=http://localhost:4003/graphql
ORDER_SERVICE_URL=http://localhost:4004/graphql

# Toko Sembako Integration
TOKO_SEMBAKO_PRODUCT_URL=http://localhost:4001/graphql
TOKO_SEMBAKO_INVENTORY_URL=http://localhost:4000/graphql
TOKO_SEMBAKO_ORDER_URL=http://localhost:4002/graphql

# Port
PORT=4001
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_ORDER_SERVICE_URL=http://localhost:4004/graphql
NEXT_PUBLIC_KITCHEN_SERVICE_URL=http://localhost:4001/graphql
NEXT_PUBLIC_INVENTORY_SERVICE_URL=http://localhost:4002/graphql
NEXT_PUBLIC_USER_SERVICE_URL=http://localhost:4003/graphql
```

### 9.3 Contoh GraphQL Queries

#### 9.3.1 Get All Menus

```graphql
query {
  menus {
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
```

#### 9.3.2 Create Order

```graphql
mutation {
  createOrder(input: {
    customerId: "CUST001"
    tableNumber: "T01"
    items: [
      {
        menuId: "MENU001"
        name: "Nasi Goreng Spesial"
        quantity: 2
        price: 25000
      }
    ]
    paymentMethod: "cash"
    notes: "Tidak pedas"
  }) {
    id
    orderId
    total
    orderStatus
  }
}
```

#### 9.3.3 Get Kitchen Orders

```graphql
query {
  kitchenOrders(status: "pending") {
    id
    orderId
    status
    items {
      name
      quantity
    }
    createdAt
  }
}
```

#### 9.3.4 Purchase from Toko Sembako

```graphql
mutation {
  purchaseFromTokoSembako(input: {
    orderNumber: "TS-001"
    items: [
      {
        productId: "1"
        quantity: 10
      }
    ]
    notes: "Bahan untuk restoran"
  }) {
    success
    message
    tokoSembakoOrder {
      id
      orderId
      total
      status
    }
    stockAdded
  }
}
```

### 9.4 Screenshots (Jika Ada)

*Catatan: Screenshots dapat ditambahkan untuk dokumentasi visual*

### 9.5 Dependencies

**Python Services (requirements.txt)**
```
fastapi==0.115.0
uvicorn==0.32.0
ariadne==0.20.0
aiomysql==0.2.0
httpx==0.27.2
python-dotenv==1.0.1
cryptography==41.0.7
```

**Node.js Services (package.json)**
```json
{
  "dependencies": {
    "apollo-server-express": "^3.12.0",
    "express": "^4.18.2",
    "graphql": "^16.8.1",
    "mysql2": "^3.6.5",
    "axios": "^1.6.2",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5"
  }
}
```

**Frontend (package.json)**
```json
{
  "dependencies": {
    "next": "16.0.10",
    "react": "^19.2.0",
    "@apollo/client": "^3.14.0",
    "graphql": "^16.12.0",
    "tailwindcss": "^4.1.17"
  }
}
```

### 9.6 Command Reference

**Docker Commands**
```bash
# Build and run all services
docker-compose -f docker-compose-python.yml up --build

# Run in background
docker-compose -f docker-compose-python.yml up -d --build

# View logs
docker-compose -f docker-compose-python.yml logs -f

# Stop services
docker-compose -f docker-compose-python.yml down

# Run migrations
docker exec kitchen-service-python python src/database/migrate.py
docker exec inventory-service-python python src/database/migrate.py
docker exec user-service-python python src/database/migrate.py
docker exec order-service-python python src/database/migrate.py

# Seed data
docker exec order-service-python python src/database/seed.py
```

**Frontend Commands**
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

**Laporan ini dibuat sebagai dokumentasi lengkap dari Sistem Manajemen Restoran berbasis Microservices untuk Tugas Besar Integrasi Aplikasi Enterprise (IAE).**

---

*Dokumen ini dibuat dengan menggunakan Markdown format untuk kemudahan version control dan dokumentasi.*


