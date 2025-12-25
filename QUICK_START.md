# Quick Start Guide - Menjalankan Order Service

## Masalah: "Failed to fetch" saat membuat menu

Error ini terjadi karena **Order Service belum berjalan**. Frontend mencoba menghubungi `http://localhost:4004/graphql` tapi service tidak tersedia.

## Solusi: Jalankan Order Service

### Opsi 1: Menggunakan Docker (Recommended)

```bash
# Dari root directory project
docker-compose -f docker-compose-python.yml up order-service-python order-db

# Atau untuk semua services
docker-compose -f docker-compose-python.yml up --build
```

### Opsi 2: Development Lokal (Manual)

#### 1. Pastikan MySQL Database Berjalan

Jika menggunakan Docker:
```bash
docker-compose -f docker-compose-python.yml up order-db -d
```

Atau pastikan MySQL berjalan di port 3310 dengan credentials:
- Host: localhost
- Port: 3310
- User: order_user
- Password: order_pass
- Database: order_db

#### 2. Setup Environment Variables

Buat file `.env` di folder `order-service/`:

```env
DB_HOST=localhost
DB_PORT=3310
DB_USER=order_user
DB_PASSWORD=order_pass
DB_NAME=order_db
PORT=4004
KITCHEN_SERVICE_URL=http://localhost:4001/graphql
INVENTORY_SERVICE_URL=http://localhost:4002/graphql
USER_SERVICE_URL=http://localhost:4003/graphql
```

#### 3. Run Database Migration & Seeding

```powershell
cd order-service
node src/database/migrate.js
node src/database/seed.js
```

#### 4. Jalankan Order Service

```powershell
# Development mode (dengan auto-reload)
npm run dev

# Atau production mode
npm start
```

Service akan berjalan di: `http://localhost:4004`
GraphQL endpoint: `http://localhost:4004/graphql`

## Verifikasi

Setelah service berjalan, buka browser dan cek:
- GraphQL Playground: http://localhost:4004/graphql
- Frontend: http://localhost:3000

Coba buat menu baru dari frontend, seharusnya sudah tidak ada error "Failed to fetch".

## Troubleshooting

### Port 4004 sudah digunakan
```powershell
# Cek process yang menggunakan port 4004
netstat -ano | findstr :4004

# Kill process jika perlu (ganti PID dengan process ID yang ditemukan)
taskkill /PID <PID> /F
```

### Database connection error
- Pastikan MySQL container berjalan: `docker ps | findstr order-db`
- Cek credentials di file `.env`
- Pastikan port 3310 tidak digunakan oleh aplikasi lain

### CORS Error
CORS sudah dikonfigurasi di `order-service/src/index.js`. Pastikan service menggunakan versi terbaru dengan CORS enabled.






