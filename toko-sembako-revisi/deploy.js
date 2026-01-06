const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { ApolloServerPluginLandingPageLocalDefault } = require('apollo-server-core');

// Database initialization
const { initDatabase } = require('./db/init');
const { seedDatabase } = require('./db/seed');

// Import Schemas (Product and Inventory first)
const product = require('./product-service');
const inventory = require('./inventory-service');

const PORT = process.env.PORT || 8080;

// IMPORTANT: Set internal URLs BEFORE importing order-service
// Because order-service reads these at module load time
const internalBaseUrl = `http://localhost:${PORT}`;
process.env.PRODUCT_SERVICE_URL = `${internalBaseUrl}/graphql/product`;
process.env.INVENTORY_SERVICE_URL = `${internalBaseUrl}/graphql/inventory`;
console.log(`🔗 Internal Service URLs set to: ${internalBaseUrl}`);

// Now import order and auth services
const order = require('./order-service');
const auth = require('./auth-service');

const app = express();

// Middleware for JSON (needed for some fetches)
app.use(express.json());

// CORS middleware for frontend
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

async function start() {
    console.log('🚀 Starting Toko Sembako Monolith...');

    // Debug: Log available env vars (keys only) to check for Railway variables
    console.log('🔍 Environment Variables Keys:', Object.keys(process.env).filter(key => !key.startsWith('npm_')).join(', '));


    // Initialize database first
    try {
        await initDatabase();
        console.log('✅ Database initialized successfully');

        // Auto-seed database
        await seedDatabase();
    } catch (err) {
        console.error('❌ Database initialization failed:', err.message);
        console.log('⚠️  Make sure MySQL is running and accessible');
        console.log('   Default config: localhost:3306, user: root, password: (empty)');
        console.log('   You can override with env vars: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME');
        process.exit(1);
    }

    // Mount Product Service
    const serverProduct = new ApolloServer({
        typeDefs: product.typeDefs,
        resolvers: product.resolvers,
        plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
        introspection: true
    });
    await serverProduct.start();
    serverProduct.applyMiddleware({ app, path: '/graphql/product' });
    console.log('✅ Product Service mounted at /graphql/product');

    // Mount Inventory Service
    const serverInventory = new ApolloServer({
        typeDefs: inventory.typeDefs,
        resolvers: inventory.resolvers,
        plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
        introspection: true
    });
    await serverInventory.start();
    serverInventory.applyMiddleware({ app, path: '/graphql/inventory' });
    console.log('✅ Inventory Service mounted at /graphql/inventory');

    // Mount Order Service
    const serverOrder = new ApolloServer({
        typeDefs: order.typeDefs,
        resolvers: order.resolvers,
        plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
        introspection: true
    });
    await serverOrder.start();
    serverOrder.applyMiddleware({ app, path: '/graphql/order' });
    console.log('✅ Order Service mounted at /graphql/order');

    // Mount Auth Service
    const serverAuth = new ApolloServer({
        typeDefs: auth.typeDefs,
        resolvers: auth.resolvers,
        plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
        introspection: true
    });
    await serverAuth.start();
    serverAuth.applyMiddleware({ app, path: '/graphql/auth' });
    console.log('✅ Auth Service mounted at /graphql/auth');

    app.listen(PORT, () => {
        console.log(`\n🚀 Toko Sembako (Combined) running on port ${PORT}`);
        console.log(`🛒 Product:   http://localhost:${PORT}/graphql/product`);
        console.log(`📦 Inventory: http://localhost:${PORT}/graphql/inventory`);
        console.log(`🛍️ Order:     http://localhost:${PORT}/graphql/order`);
        console.log(`🔐 Auth:      http://localhost:${PORT}/graphql/auth`);
        console.log('\n💾 Database: MySQL (toko_sembako)');
    });
}

start();
