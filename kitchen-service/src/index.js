const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { ApolloServerPluginLandingPageLocalDefault } = require('apollo-server-core');
const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');
const db = require('./database/connection');
const { getAuthContext } = require('./auth');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4001;

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
    console.log('✅ Kitchen Service (Node.js/Apollo): MySQL database connected');

    // Start Apollo Server
    await server.start();
    server.applyMiddleware({ app, path: '/graphql' });

    app.listen(PORT, () => {
      console.log(`🚀 Kitchen Service (Node.js/Apollo) running on http://localhost:${PORT}`);
      console.log(`📊 GraphQL Playground: http://localhost:${PORT}/graphql`);
    });
  } catch (error) {
    console.error('❌ Error starting Kitchen Service:', error);
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

