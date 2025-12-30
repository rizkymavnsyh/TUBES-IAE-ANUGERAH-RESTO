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

