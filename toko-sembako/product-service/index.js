const { ApolloServer, gql } = require("apollo-server");

const products = [
  { id: "1", name: "Beras Premium", price: 12000, unit: "kg" },
  { id: "2", name: "Minyak Goreng", price: 15000, unit: "liter" },
  { id: "3", name: "Telur Ayam", price: 25000, unit: "kg" }
];

const typeDefs = gql`
  type Product {
    id: ID!
    name: String!
    price: Int!
    unit: String!
  }

  type Query {
    getProducts: [Product]
    getProductById(id: ID!): Product
  }

  type Mutation {
    createProduct(name: String!, price: Int!, unit: String!): Product
  }
`;

const resolvers = {
  Query: {
    getProducts: () => products,
    getProductById: (_, { id }) =>
      products.find(p => p.id == id)
  },
  Mutation: {
    createProduct: (_, args) => {
      const product = {
        id: products.length + 1,
        ...args
      };
      products.push(product);
      return product;
    }
  }
};

const server = new ApolloServer({ typeDefs, resolvers });

module.exports = { typeDefs, resolvers };

if (require.main === module) {
  server.listen(5001).then(() => console.log("🛒 Toko Sembako Product Service running on http://localhost:5001"));
}
