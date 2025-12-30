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
          contact_info VARCHAR(255),
          address TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS ingredients (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          unit VARCHAR(50) NOT NULL,
          stock FLOAT DEFAULT 0,
          min_stock FLOAT DEFAULT 0,
          supplier_id INT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS stock_movements (
          id INT AUTO_INCREMENT PRIMARY KEY,
          ingredient_id INT NOT NULL,
          type ENUM('IN', 'OUT', 'ADJUSTMENT') NOT NULL,
          quantity FLOAT NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS purchase_orders (
          id INT AUTO_INCREMENT PRIMARY KEY,
          supplier_id INT NOT NULL,
          status ENUM('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED') DEFAULT 'PENDING',
          total_amount DECIMAL(10, 2) DEFAULT 0,
          order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS purchase_order_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          purchase_order_id INT NOT NULL,
          ingredient_id INT NOT NULL,
          quantity FLOAT NOT NULL,
          price_per_unit DECIMAL(10, 2) NOT NULL,
          FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
          FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
        )
      `);

      // Seed dummy data if needed
      const [suppliers] = await db.query('SELECT COUNT(*) as count FROM suppliers');
      if (suppliers[0].count === 0) {
        console.log('🌱 Seeding initial data...');
        await db.query(`
          INSERT INTO suppliers (name, contact_info, address) VALUES 
          ('Supplier Sayur Segar', '08123456789', 'Jl. Kebun Sayur No. 1'),
          ('Toko Daging Barokah', '08987654321', 'Pasar Baru Blok A')
        `);
      }

      console.log('✅ Database schema verified');
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

