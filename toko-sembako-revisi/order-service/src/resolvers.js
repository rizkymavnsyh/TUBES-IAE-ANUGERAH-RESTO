import db from "./db.js";

export const resolvers = {
  Query: {
    orders: async () => {
      const [orders] = await db.query("SELECT * FROM orders");

      for (let order of orders) {
        const [items] = await db.query(
          "SELECT product_id, qty FROM order_items WHERE order_id = ?",
          [order.id]
        );
        order.items = items;
      }

      return orders;
    }
  },

  Mutation: {
    createOrder: async (_, { items }) => {
      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();

        const [orderResult] = await conn.query(
          "INSERT INTO orders (status, total) VALUES ('CONFIRMED', 0)"
        );

        const orderId = orderResult.insertId;
        let total = 0;

        for (let item of items) {
          const [[product]] = await conn.query(
            "SELECT price FROM products WHERE id = ?",
            [item.productId]
          );

          total += product.price * item.qty;

          await conn.query(
            "INSERT INTO order_items (order_id, product_id, qty) VALUES (?, ?, ?)",
            [orderId, item.productId, item.qty]
          );

          await conn.query(
            "UPDATE inventory SET stock = stock - ? WHERE product_id = ?",
            [item.qty, item.productId]
          );
        }

        await conn.query(
          "UPDATE orders SET total = ? WHERE id = ?",
          [total, orderId]
        );

        await conn.commit();
        return true;

      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    }
  }
};
