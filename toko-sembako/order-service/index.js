const { ApolloServer, gql } = require("apollo-server");
const fetch = require("node-fetch");

const orders = [];

const PRODUCT_URL = process.env.PRODUCT_SERVICE_URL || "http://localhost:5001/graphql";
const INVENTORY_URL = process.env.INVENTORY_SERVICE_URL || "http://localhost:5000/graphql";

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

// 🔁 rollback stok
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
    getOrders: () => orders,

    getOrderById: (_, { orderId }) => {
      const order = orders.find(o => o.id == orderId);
      if (!order) throw new Error("Order not found");
      return order;
    }
  },

  Mutation: {
    createOrder: async (_, { restaurantId, items }) => {
      let total = 0;
      const orderItems = [];

      try {
        for (const item of items) {
          // 🔹 ambil harga product
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

          // 🔹 kurangi stok
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
          if (inventoryData.errors) {
            throw new Error("Stock insufficient");
          }

          orderItems.push({
            productId: item.productId,
            qty: item.qty,
            price,
            subtotal
          });
        }

        const order = {
          id: orders.length + 1,
          restaurantId,
          items: orderItems,
          total,
          status: "CONFIRMED"
        };

        orders.push(order);
        return order;

      } catch (err) {
        await rollbackStock(orderItems);
        throw new Error("Order failed, stock rolled back");
      }
    },

    cancelOrder: async (_, { orderId }) => {
      const order = orders.find(o => o.id == orderId);

      if (!order) throw new Error("Order not found");
      if (order.status === "CANCELLED")
        throw new Error("Order already cancelled");

      await rollbackStock(order.items);

      order.status = "CANCELLED";
      return order;
    }
  }
};

const server = new ApolloServer({ typeDefs, resolvers });

module.exports = { typeDefs, resolvers };

if (require.main === module) {
  server.listen({ port: 5002 }).then(() => console.log("🛍️ Toko Sembako Order Service running on http://localhost:5002"));
}
