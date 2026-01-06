import db from "./db.js";

export const resolvers = {
  Query: {
    inventory: async () => {
      const [rows] = await db.query(`
        SELECT i.product_id as id, p.name, i.stock
        FROM inventory i
        JOIN products p ON p.id = i.product_id
      `);
      return rows;
    }
  },

  Mutation: {
    updateStock: async (_, { productId, stock }) => {
      await db.query(
        "UPDATE inventory SET stock = ? WHERE product_id = ?",
        [stock, productId]
      );
      return true;
    }
  }
};
