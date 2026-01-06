import db from "./db.js";

export const resolvers = {
  Query: {
    getProducts: async () => {
      const [rows] = await db.query("SELECT * FROM products");
      return rows;
    },
    getProductById: async (_, { id }) => {
      const [rows] = await db.query("SELECT * FROM products WHERE id = ?", [id]);
      return rows[0] || null;
    }
  },

  Mutation: {
    createProduct: async (_, { name, price, unit, category }) => {
      const [result] = await db.query(
        "INSERT INTO products (name, price, unit, category) VALUES (?, ?, ?, ?)",
        [name, price, unit, category || null]
      );

      return {
        id: result.insertId,
        name,
        price,
        unit,
        category: category || null
      };
    }
  }
};
