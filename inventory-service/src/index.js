const express = require('express');
const cors = require('cors');
const { ApolloServer } = require('apollo-server-express');
const { ApolloServerPluginLandingPageLocalDefault } = require('apollo-server-core');
const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');
const db = require('./database/connection');
const { getAuthContext } = require('./auth');
const anugerahRestoProvider = require('./services/anugerahRestoProvider');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4002;

// CORS configuration for cross-origin requests (ngrok)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Parse JSON body for REST endpoints
app.use(express.json());

// Mount Anugerah Resto Provider REST API endpoints
// These endpoints are consumed by Toko Sembako via ngrok
app.use(anugerahRestoProvider);

// Initialize Apollo Server with embedded Sandbox and auth context
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    const authContext = getAuthContext(req);
    return {
      db,
      req,
      ...authContext
    };
  },
  introspection: true,
  plugins: [
    ApolloServerPluginLandingPageLocalDefault({ embed: true })
  ]
});

async function startServer() {
  try {
    // Test database connection
    await db.execute('SELECT 1');
    console.log('✅ Inventory Service (Node.js/Apollo): MySQL database connected');

    // Auto-Migrate Database (Create Tables if not exist)
    try {
      console.log('🔄 Checking database schema...');

      await db.query(`
        CREATE TABLE IF NOT EXISTS suppliers (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          contact_person VARCHAR(255),
          email VARCHAR(255),
          phone VARCHAR(50),
          address TEXT,
          status VARCHAR(50) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS ingredients (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          unit VARCHAR(50) NOT NULL,
          category VARCHAR(100),
          min_stock_level FLOAT DEFAULT 0,
          current_stock FLOAT DEFAULT 0,
          cost_per_unit DECIMAL(10, 2) DEFAULT 0,
          supplier_id INT,
          status VARCHAR(50) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS stock_movements (
          id INT AUTO_INCREMENT PRIMARY KEY,
          ingredient_id INT NOT NULL,
          movement_type VARCHAR(20) NOT NULL,
          quantity FLOAT NOT NULL,
          reason TEXT,
          reference_id VARCHAR(100),
          reference_type VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS purchase_orders (
          id INT AUTO_INCREMENT PRIMARY KEY,
          supplier_id INT NOT NULL,
          order_number VARCHAR(100),
          order_date DATE,
          expected_delivery_date DATE,
          received_date DATE,
          status VARCHAR(50) DEFAULT 'pending',
          total_amount DECIMAL(10, 2) DEFAULT 0,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS purchase_order_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          purchase_order_id INT NOT NULL,
          ingredient_id INT NOT NULL,
          quantity FLOAT NOT NULL,
          unit_price DECIMAL(10, 2) DEFAULT 0,
          total_price DECIMAL(10, 2) DEFAULT 0,
          received_quantity FLOAT DEFAULT 0,
          FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
          FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
        )
      `);

      // Add missing columns to existing tables (safe migration)
      const alterStatements = [
        // suppliers
        "ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'",
        "ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255)",
        "ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS email VARCHAR(255)",
        "ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS phone VARCHAR(50)",
        // ingredients  
        "ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS category VARCHAR(100)",
        "ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS min_stock_level FLOAT DEFAULT 0",
        "ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS current_stock FLOAT DEFAULT 0",
        "ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS cost_per_unit DECIMAL(10,2) DEFAULT 0",
        "ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'",
        // stock_movements
        "ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS movement_type VARCHAR(20)",
        "ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS reason TEXT",
        "ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS reference_id VARCHAR(100)",
        "ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50)",
        // purchase_orders
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(100)",
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS notes TEXT",
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS expected_delivery_date DATE",
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS received_date DATE",
        // purchase_order_items
        "ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2) DEFAULT 0",
        "ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2) DEFAULT 0",
        "ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS received_quantity FLOAT DEFAULT 0"
      ];

      for (const sql of alterStatements) {
        try {
          await db.query(sql);
        } catch (e) {
          // Ignore errors (column might already exist or different MySQL version)
        }
      }

      // Also handle status column type change for purchase_orders (from ENUM to VARCHAR)
      try {
        await db.query("ALTER TABLE purchase_orders MODIFY COLUMN status VARCHAR(50) DEFAULT 'pending'");
      } catch (e) { /* ignore */ }

      // Seed dummy data if needed
      const [suppliers] = await db.query('SELECT COUNT(*) as count FROM suppliers');
      if (suppliers[0].count === 0) {
        console.log('🌱 Seeding initial data...');
        await db.query(`
          INSERT INTO suppliers (name, phone, address, status) VALUES 
          ('Supplier Sayur Segar', '08123456789', 'Jl. Kebun Sayur No. 1', 'active'),
          ('Toko Daging Barokah', '08987654321', 'Pasar Baru Blok A', 'active')
        `);
      }

      console.log('✅ Database schema verified and migrated');
    } catch (err) {
      console.error('⚠️ Migration warning:', err.message);
    }

    // Start Apollo Server
    await server.start();
    server.applyMiddleware({ app, path: '/graphql' });

    app.listen(PORT, () => {
      console.log(`🚀 Inventory Service (Node.js/Apollo) running on http://localhost:${PORT}`);
      console.log(`📊 GraphQL Playground: http://localhost:${PORT}/graphql`);
      console.log(`🔗 REST API (for Toko Sembako): http://localhost:${PORT}/api/*`);
      console.log('');
      console.log('📦 Available Provider Endpoints:');
      console.log(`   GET  /api/restaurant        - Restaurant info`);
      console.log(`   GET  /api/ingredient-needs  - Low stock ingredients`);
      console.log(`   GET  /api/consumption-report - Consumption report`);
      console.log(`   GET  /api/ingredients       - All ingredients`);
      console.log(`   POST /api/webhooks/order-delivered - Order webhook`);
      console.log(`   GET  /api/health            - Health check`);
    });
  } catch (error) {
    console.error('❌ Error starting Inventory Service:', error);
    process.exit(1);
  }
}


startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await db.end();
  process.exit(0);
});

