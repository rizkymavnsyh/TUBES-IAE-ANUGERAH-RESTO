# 📚 GraphQL Schemas - Anugerah Resto

Folder ini berisi definisi skema GraphQL untuk setiap microservice dalam sistem Anugerah Resto.

## 📂 Struktur File

```
schemas/
├── README.md                    # Dokumentasi ini
├── user-service.graphql         # Schema User Service
├── order-service.graphql        # Schema Order Service
├── kitchen-service.graphql      # Schema Kitchen Service
├── inventory-service.graphql    # Schema Inventory Service
└── queries/                     # Contoh Query & Mutation
    └── examples.graphql
```

## 🔗 Service Endpoints

| Service | Port | Endpoint |
|---------|------|----------|
| Kitchen Service | 4001 | http://localhost:4001/graphql |
| Inventory Service | 4002 | http://localhost:4002/graphql |
| User Service | 4003 | http://localhost:4003/graphql |
| Order Service | 4004 | http://localhost:4004/graphql |

## 📋 Ringkasan Layanan

### User Service (Authentication & Authorization)
- **Database:** MySQL (user_db)
- **Fungsi:** Autentikasi JWT, manajemen staff & customer, program loyalitas
- **Keys:** `Staff`, `Customer`, `LoyaltyProgram`, `CustomerLoyalty`

### Order Service (Order Management & Orchestration)
- **Database:** MySQL (order_db)
- **Fungsi:** Katalog menu, keranjang belanja, pemesanan, integrasi layanan
- **Keys:** `Menu`, `Cart`, `Order`, `OrderCreationResult`

### Kitchen Service (Kitchen Queue Management)
- **Database:** MySQL (kitchen_db)
- **Fungsi:** Antrian pesanan dapur, penugasan chef, tracking status
- **Keys:** `KitchenOrder`, `Chef`

### Inventory Service (Inventory & Supplier Management)
- **Database:** MySQL (inventory_db)
- **Fungsi:** Stok bahan baku, supplier, integrasi Toko Sembako
- **Keys:** `Ingredient`, `Supplier`, `StockMovement`, `PurchaseOrder`

## 🔄 Integrasi Lintas Kelompok

### Sebagai Consumer (Inventory Service → Toko Sembako)
- `tokoSembakoProducts` - Ambil daftar produk
- `checkTokoSembakoStock` - Cek ketersediaan stok
- `purchaseFromTokoSembako` - Buat pesanan pembelian

### Sebagai Provider (Untuk Kelompok Lain)
- **User Service:** `customerById`, `staffById`
- **Order Service:** `orders`, `order`, `checkMenuStock`
