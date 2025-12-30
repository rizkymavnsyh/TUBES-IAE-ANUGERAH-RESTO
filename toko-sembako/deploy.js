const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { ApolloServerPluginLandingPageLocalDefault } = require('apollo-server-core');

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

// Now import order service (it will read the correct env vars)
const order = require('./order-service');

const app = express();

// Middleware for JSON (needed for some fetches)
app.use(express.json());

async function start() {
    console.log('🚀 Starting Toko Sembako Monolith...');

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

    app.listen(PORT, () => {
        console.log(`\n🚀 Toko Sembako (Combined) running on port ${PORT}`);
        console.log(`🛒 Product:   http://localhost:${PORT}/graphql/product`);
        console.log(`📦 Inventory: http://localhost:${PORT}/graphql/inventory`);
        console.log(`🛍️ Order:     http://localhost:${PORT}/graphql/order`);
    });
}

start();
