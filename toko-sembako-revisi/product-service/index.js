const { ApolloServer, gql } = require("apollo-server");
const { query, queryInsert } = require("../db/config");

const typeDefs = gql`
  type Product {
    id: ID!
    name: String!
    price: Int!
    unit: String!
    category: String
    description: String
    available: Boolean
  }

  type Query {
    products(category: String): [Product]
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
    // Standard query for listing all products (legacy/admin)
    getProducts: async () => {
      const rows = await query("SELECT * FROM products ORDER BY id DESC");
      return rows;
    },
    // New query with filtering support for integration
    products: async (_, { category }) => {
      let sql = "SELECT p.*, i.stock FROM products p LEFT JOIN inventory i ON p.id = i.product_id";
      const params = [];

      if (category) {
        sql += " WHERE p.category = ?";
        params.push(category);
      }

      sql += " ORDER BY p.id DESC";
      const rows = await query(sql, params);

      return rows.map(r => ({
        ...r,
        available: (r.stock || 0) > 0
      }));
    },
    getProductById: async (_, { id }) => {
      // Need to join inventory to get stock/available status
      const rows = await query(
        "SELECT p.*, i.stock FROM products p LEFT JOIN inventory i ON p.id = i.product_id WHERE p.id = ?",
        [id]
      );
      const product = rows[0];
      if (!product) return null;

      return {
        ...product,
        available: (product.stock || 0) > 0
      };
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
