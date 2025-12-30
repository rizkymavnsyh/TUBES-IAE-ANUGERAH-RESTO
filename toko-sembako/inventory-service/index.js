const { ApolloServer, gql } = require("apollo-server");

const inventory = [
  { productId: "1", stock: 100 },
  { productId: "2", stock: 50 },
  { productId: "3", stock: 200 }
];

const typeDefs = gql`
  type Inventory { productId: ID!, stock: Int! }
  type StockCheckResult {
     available: Boolean!
     currentStock: Int!
     requestedQuantity: Int!
     message: String!
  }
  type Query { 
    getInventory(productId: ID!): Inventory
    checkStock(productId: ID!, quantity: Float!): StockCheckResult
  }
  type Mutation {
    increaseStock(productId: ID!, qty: Int!): Inventory
    decreaseStock(productId: ID!, qty: Int!): Inventory
  }
`;

const resolvers = {
  Query: {
    getInventory: (_, { productId }) =>
      inventory.find(i => i.productId == productId),

    checkStock: (_, { productId, quantity }) => {
      const item = inventory.find(i => i.productId == productId);
      const currentStock = item ? item.stock : 0;
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
    increaseStock: (_, { productId, qty }) => {
      let item = inventory.find(i => i.productId == productId);
      if (!item) {
        item = { productId, stock: 0 };
        inventory.push(item);
      }
      item.stock += qty;
      return item;
    },
    decreaseStock: (_, { productId, qty }) => {
      const item = inventory.find(i => i.productId == productId);
      if (!item || item.stock < qty) throw new Error("Stock insufficient");
      item.stock -= qty;
      return item;
    }
  }
};

const server = new ApolloServer({ typeDefs, resolvers });

module.exports = { typeDefs, resolvers };

if (require.main === module) {
  server.listen(5000).then(() => console.log("📦 Toko Sembako Inventory Service running on http://localhost:5000"));
}
