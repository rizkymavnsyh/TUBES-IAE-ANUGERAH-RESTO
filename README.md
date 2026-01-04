# Anugerah Resto - Sistem Manajemen Restoran

Sistem manajemen restoran berbasis **microservices** dengan arsitektur terintegrasi menggunakan **GraphQL**, **Docker**, dan **Next.js** frontend dashboard.

## 📋 Fitur Utama

- 🍽️ **Menu Management** - Kelola menu items, kategori, dan ketersediaan
- 📦 **Order Management** - Pencatatan dan tracking pesanan pelanggan
- 👨‍🍳 **Kitchen Queue** - Antrian pesanan dapur dengan real-time updates
- 📋 **Inventory Management** - Manajemen stok bahan baku dengan alert low stock
- 👥 **User Management** - Manajemen staf dan program loyalty pelanggan
- 🔗 **API Integration** - Integrasi dengan Toko Sembako (Railway) untuk pembelian bahan baku

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│                  http://localhost:3000                       │
└─────────────────────────┬───────────────────────────────────┘
                          │ GraphQL (Apollo Client)
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Order Service│ │Kitchen Service│ │Inventory     │ │ User Service │
│  Port 4004   │ │  Port 4001   │ │Service 4002  │ │  Port 4003   │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
      │               │               │                  │
      ▼               ▼               ▼                  ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Order DB    │ │ Kitchen DB   │ │ Inventory DB │ │   User DB    │
│  MySQL 3310  │ │  MySQL 3307  │ │  MySQL 3311  │ │  MySQL 3312  │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

### Services
| Service | Port | Database Port | Deskripsi |
|---------|------|---------------|-----------|
| Kitchen Service | 4001 | 3307 | Antrian pesanan dapur |
| Inventory Service | 4002 | 3311 | Stok bahan baku + integrasi Toko Sembako |
| User Service | 4003 | 3312 | Staff & customer management |
| Order Service | 4004 | 3310 | Menu & order processing |

---

## 🚀 Teknologi

### Backend (Dual Implementation)
| Stack | Framework | Database Driver |
|-------|-----------|-----------------|
| **Node.js** | Apollo Server + Express | mysql2 |
| **Python** | Ariadne + FastAPI | aiomysql |

### Frontend
- **Next.js 16** dengan App Router
- **React 19** + TypeScript
- **Tailwind CSS V4**
- **Apollo Client** untuk GraphQL

### Infrastructure
- **Docker** & Docker Compose
- **MySQL 8.0** untuk semua services

---

## 🔧 Quick Start

### 1. Clone & Setup
```bash
git clone <repository-url>
cd anugerah-resto
```

### 2. Jalankan dengan Docker

**Python Services (Recommended):**
```bash
docker-compose -f docker-compose-python.yml up -d --build
```

**Node.js Services:**
```bash
docker-compose up -d --build
```

### 3. Run Migrations
```bash
# Python
docker exec kitchen-service-python python src/database/migrate.py
docker exec inventory-service-python python src/database/migrate.py
docker exec user-service-python python src/database/migrate.py
docker exec order-service-python python src/database/migrate.py
docker exec order-service-python python src/database/seed.py
```

### 4. Jalankan Frontend
```bash
cd frontend
npm install
npm run dev
```

### 5. Akses Aplikasi
- **Frontend**: http://localhost:3000
- **GraphQL Playground**: http://localhost:4001-4004/graphql

---

## 🌐 Integrasi API - Toko Sembako (Railway)

Sistem terintegrasi dengan **Toko Sembako** untuk pembelian bahan baku melalui Railway cloud.

### Sebagai Consumer (Memanggil Toko Sembako)
```graphql
# Get products
query { tokoSembakoProducts { id name price unit } }

# Check stock
query { checkTokoSembakoStock(productId: "1", quantity: 10) { available message } }

# Purchase
mutation { purchaseFromTokoSembako(input: { productId: "1", quantity: 10 }) { success orderId } }
```

### Sebagai Provider (Dipanggil oleh Toko Sembako)
```graphql
# Low stock items
query { lowStockIngredients { id name currentStock minStockLevel } }

# Update stock
mutation { addStock(ingredientId: "1", quantity: 50, reason: "Delivery") { id quantity } }
```

### Konfigurasi Railway URLs
```yaml
# docker-compose.yml
environment:
  TOKO_SEMBAKO_PRODUCT_URL: https://xxx.up.railway.app/graphql/product
  TOKO_SEMBAKO_INVENTORY_URL: https://xxx.up.railway.app/graphql/inventory
  TOKO_SEMBAKO_ORDER_URL: https://xxx.up.railway.app/graphql/order
```

---

## 📡 Health Check & Monitoring

Setiap service memiliki health check endpoint:
```graphql
query { health { status service version uptime timestamp } }
```

**Retry Mechanism:**
- Auto-retry 3x dengan exponential backoff (1s → 2s → 4s)
- Timeout: 10 seconds per request

---

## 📁 Struktur Project

```
anugerah-resto/
├── docker-compose.yml              # Node.js services
├── docker-compose-python.yml       # Python services
├── .env.example                    # Environment template
│
├── kitchen-service/                # Node.js Kitchen
├── kitchen-service-python/         # Python Kitchen
├── inventory-service/              # Node.js Inventory
├── inventory-service-python/       # Python Inventory
├── user-service/                   # Node.js User
├── user-service-python/            # Python User
├── order-service/                  # Node.js Order
├── order-service-python/           # Python Order
│
├── frontend/                       # Next.js Dashboard
├── toko-sembako/                   # Mock Toko Sembako (testing)
└── examples/                       # GraphQL query examples
```

---

## 🧪 Testing

### GraphQL Playground
Akses di masing-masing service endpoint untuk testing queries/mutations.

### Flow Testing
1. **Create Menu** → Order Service
2. **Create Order** → triggers Kitchen + Inventory + Loyalty
3. **Update Kitchen Status** → pending → preparing → ready → completed
4. **View Dashboard** → real-time statistics

---

## 🔧 Troubleshooting

### Port Already in Use
```bash
netstat -ano | findstr :4001
taskkill /PID <PID> /F
```

### Database Connection Error
```bash
docker ps  # Check containers
docker logs kitchen-db  # Check logs
```

### Service Tidak Connect
```bash
docker network inspect resto-network
```

---

## 👥 Kontributor

Tim Kelompok 5 - Integrasi Aplikasi Enterprise (IAE)

---

**Happy Coding! 🚀**
