const { ApolloServer, gql } = require("apollo-server");

const inventory = [];

const typeDefs = gql`
  type Inventory { productId: ID!, stock: Int! }
  type Query { getInventory(productId: ID!): Inventory }
  type Mutation {
    increaseStock(productId: ID!, qty: Int!): Inventory
    decreaseStock(productId: ID!, qty: Int!): Inventory
  }
`;

const resolvers = {
  Query: {
    getInventory: (_, { productId }) =>
      inventory.find(i => i.productId == productId)
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
