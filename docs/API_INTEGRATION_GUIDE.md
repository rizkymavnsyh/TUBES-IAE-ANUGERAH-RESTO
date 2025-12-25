# API Integration Guide - Anugerah Resto ↔ Toko Sembako

## Overview

| Role | Keterangan |
|------|------------|
| **CONSUMER** | Resto memanggil API Toko Sembako untuk beli bahan baku |
| **PROVIDER** | Resto menyediakan API untuk Toko Sembako (notifikasi, dll) |

---

## 1. RESTO sebagai CONSUMER (Memanggil Toko Sembako)

### Endpoint yang Dipanggil:
```
Toko Sembako Product: http://TOKO_SEMBAKO_IP:PORT/graphql
Toko Sembako Order: http://TOKO_SEMBAKO_IP:PORT/graphql
```

### Mutations/Queries yang Digunakan:

```graphql
# Lihat produk tersedia
query {
  products { id name price stock unit }
}

# Cek ketersediaan stock
query {
  checkStock(productId: "xxx", quantity: 10) {
    available
    message
  }
}

# Buat pesanan bahan baku
mutation {
  createOrder(input: {
    orderId: "PO-001"
    items: [{ productId: "xxx", quantity: 10 }]
  }) {
    id status total
  }
}
```

### File Konfigurasi:
- JS: `inventory-service/src/services/tokoSembakoClient.js`
- Python: `inventory-service-python/src/services/toko_sembako_client.py`

---

## 2. RESTO sebagai PROVIDER (Dipanggil oleh Toko Sembako)

### Endpoint yang Disediakan:
```
Inventory Service: http://YOUR_IP:4002/graphql
```

### API untuk Toko Sembako:

```graphql
# Cek kebutuhan bahan di Resto
query {
  ingredients { 
    id 
    name 
    currentStock 
    minStockLevel 
    status 
  }
}

# Cek item low stock (perlu restok)
query {
  lowStockIngredients {
    id
    name
    currentStock
    minStockLevel
  }
}

# Notifikasi pengiriman tiba (Toko Sembako panggil ini)
mutation {
  addStock(ingredientId: "1", quantity: 50, reason: "Delivery from Toko Sembako") {
    id
    quantity
    reason
  }
}
```

---

## 3. Contoh Alur Komunikasi

```
┌──────────────────┐                    ┌──────────────────┐
│  ANUGERAH RESTO  │                    │  TOKO SEMBAKO    │
│  (Consumer &     │                    │  (Provider &     │
│   Provider)      │                    │   Consumer)      │
└────────┬─────────┘                    └────────┬─────────┘
         │                                       │
         │  1. Query: getProducts()              │
         │ ─────────────────────────────────────>│
         │                                       │
         │  2. Response: [products...]           │
         │ <─────────────────────────────────────│
         │                                       │
         │  3. Mutation: createOrder()           │
         │ ─────────────────────────────────────>│
         │                                       │
         │  4. Response: order created           │
         │ <─────────────────────────────────────│
         │                                       │
         │  5. Query: lowStockIngredients()      │
         │ <─────────────────────────────────────│
         │                                       │
         │  6. Response: [low stock items...]    │
         │ ─────────────────────────────────────>│
         │                                       │
         │  7. Mutation: addStock() (delivery)   │
         │ <─────────────────────────────────────│
         │                                       │
         │  8. Response: stock updated           │
         │ ─────────────────────────────────────>│
         │                                       │
```

---

## 4. Konfigurasi Koneksi

### Update IP Toko Sembako di Resto:

**File**: `inventory-service/src/services/tokoSembakoClient.js`
```javascript
const TOKO_SEMBAKO_BASE_URL = process.env.TOKO_SEMBAKO_URL || 'http://IP_TOKO_SEMBAKO:PORT';
```

### Share ke Toko Sembako:
```
Resto Inventory API: http://YOUR_PUBLIC_IP:4002/graphql
```

---

## 5. Testing Commands

### Test sebagai Consumer:
```powershell
# Panggil Toko Sembako
Invoke-RestMethod -Uri "http://TOKO_IP:PORT/graphql" -Method POST `
  -ContentType "application/json" `
  -Body '{"query":"{ products { id name price } }"}'
```

### Test sebagai Provider:
```powershell
# API yang Toko Sembako panggil
Invoke-RestMethod -Uri "http://localhost:4002/graphql" -Method POST `
  -ContentType "application/json" `
  -Body '{"query":"{ lowStockIngredients { id name currentStock } }"}'
```
