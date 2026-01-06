const { ApolloServer, gql } = require("apollo-server");
const { query, queryInsert } = require("../db/config");

const typeDefs = gql`
  type Inventory { 
    productId: ID!
    stock: Int! 
  }
  
  type StockCheckResult {
    available: Boolean!
    currentStock: Int!
    requestedQuantity: Int!
    message: String!
  }
  
  type Query { 
    getInventory(productId: ID!): Inventory
    getAllInventory: [Inventory]
    checkStock(productId: ID!, quantity: Int!): StockCheckResult
  }
  
  type Mutation {
    increaseStock(productId: ID!, qty: Int!): Inventory
    decreaseStock(productId: ID!, qty: Int!): Inventory
    setStock(productId: ID!, stock: Int!): Inventory
  }
`;

const resolvers = {
  Query: {
    getInventory: async (_, { productId }) => {
      const rows = await query(
        "SELECT product_id as productId, stock FROM inventory WHERE product_id = ?",
        [productId]
      );
      return rows[0] || null;
    },

    getAllInventory: async () => {
      const rows = await query("SELECT product_id as productId, stock FROM inventory");
      return rows;
    },

    checkStock: async (_, { productId, quantity }) => {
      const rows = await query(
        "SELECT stock FROM inventory WHERE product_id = ?",
        [productId]
      );
      const currentStock = rows[0]?.stock || 0;
      const available = currentStock >= quantity;

      return {
        available,
        currentStock,
        requestedQuantity: quantity,
        message: available ? "Stock available" : "Insufficient stock"
      };
    }
  },

  Mutation: {
    increaseStock: async (_, { productId, qty }) => {
      // Upsert: insert if not exists, update if exists
      await queryInsert(
        `INSERT INTO inventory (product_id, stock) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE stock = stock + ?`,
        [productId, qty, qty]
      );

      const rows = await query(
        "SELECT product_id as productId, stock FROM inventory WHERE product_id = ?",
        [productId]
      );
      return rows[0];
    },

    decreaseStock: async (_, { productId, qty }) => {
      // Check current stock first
      const rows = await query(
        "SELECT stock FROM inventory WHERE product_id = ?",
        [productId]
      );

      const currentStock = rows[0]?.stock || 0;
      console.log("DECREASE STOCK:", productId, qty, currentStock);

      if (currentStock < qty) {
        throw new Error("Stock insufficient");
      }

      await queryInsert(
        "UPDATE inventory SET stock = stock - ? WHERE product_id = ?",
        [qty, productId]
      );

      return { productId, stock: currentStock - qty };
    },

    setStock: async (_, { productId, stock }) => {
      await queryInsert(
        `INSERT INTO inventory (product_id, stock) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE stock = ?`,
        [productId, stock, stock]
      );

      return { productId, stock };
    }
  }
};

const server = new ApolloServer({ typeDefs, resolvers });

module.exports = { typeDefs, resolvers };

if (require.main === module) {
  server.listen(5000).then(() => console.log("📦 Toko Sembako Inventory Service running on http://localhost:5000"));
}
