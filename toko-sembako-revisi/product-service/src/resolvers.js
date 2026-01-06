import db from "./db.js";

export const resolvers = {
  Query: {
    products: async () => {
      const [rows] = await db.query("SELECT * FROM products");
      return rows;
    }
  },

  Mutation: {
    createProduct: async (_, { name, price, unit }) => {
      const [result] = await db.query(
        "INSERT INTO products (name, price, unit) VALUES (?, ?, ?)",
        [name, price, unit]
      );

      return {
        id: result.insertId,
        name,
        price,
        unit
      };
    }
  }
};
