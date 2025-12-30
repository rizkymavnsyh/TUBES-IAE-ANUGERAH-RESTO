const { ApolloServer, gql } = require("apollo-server");
const fetch = require("node-fetch");

const orders = [];

const getProductUrl = () => process.env.PRODUCT_SERVICE_URL || "http://localhost:5001/graphql";
const getInventoryUrl = () => process.env.INVENTORY_SERVICE_URL || "http://localhost:5000/graphql";

const typeDefs = gql`
  input OrderItemInput {
    productId: ID!
    qty: Int!
  }

  input CreateOrderInput {
    orderNumber: String!
    items: [OrderItemInput!]!
    notes: String
  }

  type OrderItem {
    productId: ID!
    qty: Int!
    price: Int!
    subtotal: Int!
  }

  type Order {
    id: ID!
    orderId: String!
    status: String!
    total: Int!
    items: [OrderItem!]!
    createdAt: String
  }

  type Query {
    getOrders: [Order]
    getOrderById(orderId: String!): Order
    orderByOrderId(orderId: String!): Order
  }

  type Mutation {
    createOrder(input: CreateOrderInput!): Order
    cancelOrder(orderId: ID!): Order
  }
`;

// 🔁 rollback stok
async function rollbackStock(items) {
  for (const item of items) {
    await fetch(getInventoryUrl(), {
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
      const order = orders.find(o => o.id == orderId || o.orderId == orderId);
      if (!order) throw new Error("Order not found");
      return order;
    },

    orderByOrderId: (_, { orderId }) => {
      const order = orders.find(o => o.orderId == orderId);
      return order;
    }
  },

  Mutation: {
    createOrder: async (_, { input }) => {
      const { orderNumber, items } = input;
      let total = 0;
      const orderItems = [];

      try {
        for (const item of items) {
          // 🔹 ambil harga product
          const productRes = await fetch(getProductUrl(), {
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
            throw new Error(`Product ${item.productId} not found`);
          }

          const price = productData.data.getProductById.price;
          const subtotal = price * item.qty;
          total += subtotal;

          // 🔹 kurangi stok
          const inventoryRes = await fetch(getInventoryUrl(), {
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
            // Log error from inventory
            console.error("Inventory Error:", JSON.stringify(inventoryData.errors));
            throw new Error("Stock insufficient or inventory error");
          }

          orderItems.push({
            productId: item.productId,
            qty: item.qty,
            price,
            subtotal
          });
        }

        const order = {
          id: String(orders.length + 1),
          orderId: orderNumber,
          restaurantId: "ANUGERAH_RESTO", // Default
          items: orderItems,
          total,
          status: "CONFIRMED",
          createdAt: new Date().toISOString()
        };

        orders.push(order);
        return order;

      } catch (err) {
        console.error("Order Creation Failed:", err.message);
        await rollbackStock(orderItems);
        throw new Error(`Order failed: ${err.message}`);
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
