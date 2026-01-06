const { ApolloServer, gql } = require("apollo-server");
const fetch = require("node-fetch");
const { query, queryInsert } = require("../db/config");

const PRODUCT_URL = process.env.PRODUCT_SERVICE_URL || "http://localhost:8080/graphql/product";
const INVENTORY_URL = process.env.INVENTORY_SERVICE_URL || "http://localhost:8080/graphql/inventory";

const typeDefs = gql`
  input OrderItemInput {
    productId: ID!
    qty: Int!
  }

  type OrderItem {
    productId: ID!
    qty: Int!
    price: Int!
    subtotal: Int!
  }

  type Order {
    id: ID!
    restaurantId: String!
    items: [OrderItem!]!
    total: Int!
    status: String!
  }

  type Query {
    getOrders: [Order]
    getOrderById(orderId: ID!): Order
  }

  type Mutation {
    createOrder(
      restaurantId: String!
      items: [OrderItemInput!]!
    ): Order

    cancelOrder(orderId: ID!): Order
  }
`;

// Helper: Get order with items
async function getOrderWithItems(orderId) {
  const orderRows = await query("SELECT * FROM orders WHERE id = ?", [orderId]);
  if (!orderRows[0]) return null;

  const order = orderRows[0];
  const itemRows = await query(
    "SELECT product_id as productId, qty, price, subtotal FROM order_items WHERE order_id = ?",
    [orderId]
  );

  return {
    id: order.id,
    restaurantId: order.restaurant_id,
    total: order.total,
    status: order.status,
    items: itemRows
  };
}

// Rollback stock function
async function rollbackStock(items) {
  for (const item of items) {
    await fetch(INVENTORY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          mutation {
            increaseStock(
              productId: "${item.productId}",
              qty: ${item.qty}
            ) {
              productId
              stock
            }
          }
        `
      })
    });
  }
}

const resolvers = {
  Query: {
    getOrders: async () => {
      const orderRows = await query("SELECT * FROM orders ORDER BY id DESC");
      const orders = [];

      for (const order of orderRows) {
        const itemRows = await query(
          "SELECT product_id as productId, qty, price, subtotal FROM order_items WHERE order_id = ?",
          [order.id]
        );
        orders.push({
          id: order.id,
          restaurantId: order.restaurant_id,
          total: order.total,
          status: order.status,
          items: itemRows
        });
      }

      return orders;
    },

    getOrderById: async (_, { orderId }) => {
      return await getOrderWithItems(orderId);
    }
  },

  Mutation: {
    createOrder: async (_, { restaurantId, items }) => {
      let total = 0;
      const orderItems = [];
      const deductedItems = [];

      try {
        for (const item of items) {
          // Get product price
          const productRes = await fetch(PRODUCT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: `
                query {
                  getProductById(id: "${item.productId}") {
                    price
                  }
                }
              `
            })
          });

          const productData = await productRes.json();
          if (!productData.data?.getProductById) {
            throw new Error("Product not found");
          }

          const price = productData.data.getProductById.price;
          const subtotal = price * item.qty;
          total += subtotal;

          // Decrease stock
          const inventoryRes = await fetch(INVENTORY_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: `
                mutation {
                  decreaseStock(
                    productId: "${item.productId}",
                    qty: ${item.qty}
                  ) {
                    productId
                    stock
                  }
                }
              `
            })
          });

          const inventoryData = await inventoryRes.json();
          if (inventoryData.errors || !inventoryData.data?.decreaseStock) {
            throw new Error(inventoryData.errors?.[0]?.message || "Failed to decrease stock");
          }

          deductedItems.push({
            productId: item.productId,
            qty: item.qty
          });

          orderItems.push({
            productId: item.productId,
            qty: item.qty,
            price,
            subtotal
          });
        }

        // Insert order to database
        const orderResult = await queryInsert(
          "INSERT INTO orders (restaurant_id, total, status) VALUES (?, ?, 'CONFIRMED')",
          [restaurantId, total]
        );

        const orderId = orderResult.insertId;

        // Insert order items
        for (const item of orderItems) {
          await queryInsert(
            "INSERT INTO order_items (order_id, product_id, qty, price, subtotal) VALUES (?, ?, ?, ?, ?)",
            [orderId, item.productId, item.qty, item.price, item.subtotal]
          );
        }

        return {
          id: orderId,
          restaurantId,
          items: orderItems,
          total,
          status: "CONFIRMED"
        };

      } catch (err) {
        console.error("CREATE ORDER ERROR:", err.message);

        if (deductedItems.length > 0) {
          await rollbackStock(deductedItems);
        }

        throw err;
      }
    },

    cancelOrder: async (_, { orderId }) => {
      const order = await getOrderWithItems(orderId);

      if (!order) throw new Error("Order not found");
      if (order.status === "CANCELLED") throw new Error("Order already cancelled");

      // Rollback stock
      await rollbackStock(order.items);

      // Update order status
      await queryInsert(
        "UPDATE orders SET status = 'CANCELLED' WHERE id = ?",
        [orderId]
      );

      return { ...order, status: "CANCELLED" };
    }
  }
};

const server = new ApolloServer({ typeDefs, resolvers });

module.exports = { typeDefs, resolvers };

if (require.main === module) {
  server.listen({ port: 5002 }).then(() => console.log("🛍️ Toko Sembako Order Service running on http://localhost:5002"));
}
