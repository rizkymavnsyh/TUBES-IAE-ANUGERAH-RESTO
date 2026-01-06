const { ApolloServer, gql } = require("apollo-server");
const { query, queryInsert } = require("../db/config");

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
    updateProduct(id: ID!, name: String, price: Int, unit: String): Product
    deleteProduct(id: ID!): Boolean
  }
`;

const resolvers = {
  Query: {
    getProducts: async () => {
      const rows = await query("SELECT * FROM products ORDER BY id DESC");
      return rows;
    },
    getProductById: async (_, { id }) => {
      const rows = await query("SELECT * FROM products WHERE id = ?", [id]);
      return rows[0] || null;
    }
  },
  Mutation: {
    createProduct: async (_, { name, price, unit }) => {
      const result = await queryInsert(
        "INSERT INTO products (name, price, unit) VALUES (?, ?, ?)",
        [name, price, unit]
      );
      return {
        id: result.insertId,
        name,
        price,
        unit
      };
    },
    updateProduct: async (_, { id, name, price, unit }) => {
      // Get current product
      const rows = await query("SELECT * FROM products WHERE id = ?", [id]);
      if (!rows[0]) throw new Error("Product not found");

      const product = rows[0];
      const newName = name !== undefined ? name : product.name;
      const newPrice = price !== undefined ? price : product.price;
      const newUnit = unit !== undefined ? unit : product.unit;

      await queryInsert(
        "UPDATE products SET name = ?, price = ?, unit = ? WHERE id = ?",
        [newName, newPrice, newUnit, id]
      );

      return { id, name: newName, price: newPrice, unit: newUnit };
    },
    deleteProduct: async (_, { id }) => {
      const result = await queryInsert("DELETE FROM products WHERE id = ?", [id]);
      return result.affectedRows > 0;
    }
  }
};

const server = new ApolloServer({ typeDefs, resolvers });

module.exports = { typeDefs, resolvers };

if (require.main === module) {
  server.listen(5001).then(() => console.log("🛒 Toko Sembako Product Service running on http://localhost:5001"));
}
