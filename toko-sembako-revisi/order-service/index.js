const { ApolloServer, gql } = require("apollo-server");
const fetch = require("node-fetch");
const { query, queryInsert } = require("../db/config");
const {
  getLowStockIngredients,
  getOutOfStockIngredients,
  getAllIngredients,
  getIngredientById,
  notifyStockDelivery,
  checkAnugerahRestoHealth
} = require("../services/anugerah_resto_client");

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

  # Anugerah Resto Integration Types
  type AnugerahIngredient {
    id: ID!
    name: String!
    unit: String!
    category: String
    minStockLevel: Float!
    currentStock: Float!
    costPerUnit: Float
    status: String
  }

  type StockDeliveryResult {
    success: Boolean!
    message: String!
    stockMovement: StockMovement
  }

  type StockMovement {
    id: ID
    quantity: Float
    movementType: String
    reason: String
  }

  type AnugerahHealthCheck {
    status: String!
    service: String
    version: String
    uptime: Float
    timestamp: String
  }

  type Query {
    getOrders: [Order]
    getOrderById(orderId: ID!): Order
    
    # Anugerah Resto Integration Queries
    anugerahLowStockIngredients: [AnugerahIngredient!]!
    anugerahOutOfStockIngredients: [AnugerahIngredient!]!
    anugerahIngredients(category: String): [AnugerahIngredient!]!
    anugerahIngredient(id: ID!): AnugerahIngredient
    anugerahHealth: AnugerahHealthCheck
  }

  type Mutation {
    createOrder(
      restaurantId: String!
      items: [OrderItemInput!]!
    ): Order

    cancelOrder(orderId: ID!): Order
    
    # Anugerah Resto Integration Mutations
    notifyAnugerahDelivery(
      ingredientId: ID!
      quantity: Float!
      reason: String
    ): StockDeliveryResult!
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
    },

    // Anugerah Resto Integration Queries
    anugerahLowStockIngredients: async () => {
      console.log("📦 Fetching low stock ingredients from Anugerah Resto...");
      const ingredients = await getLowStockIngredients();
      return ingredients.map(ing => ({
        id: String(ing.id),
        name: ing.name,
        unit: ing.unit,
        category: ing.category,
        minStockLevel: parseFloat(ing.minStockLevel || 0),
        currentStock: parseFloat(ing.currentStock || 0),
        costPerUnit: parseFloat(ing.costPerUnit || 0),
        status: ing.status
      }));
    },

    anugerahOutOfStockIngredients: async () => {
      console.log("📦 Fetching out of stock ingredients from Anugerah Resto...");
      const ingredients = await getOutOfStockIngredients();
      return ingredients.map(ing => ({
        id: String(ing.id),
        name: ing.name,
        unit: ing.unit,
        category: ing.category,
        minStockLevel: parseFloat(ing.minStockLevel || 0),
        currentStock: parseFloat(ing.currentStock || 0),
        costPerUnit: parseFloat(ing.costPerUnit || 0),
        status: ing.status
      }));
    },

    anugerahIngredients: async (_, { category }) => {
      console.log("📦 Fetching all ingredients from Anugerah Resto...");
      const ingredients = await getAllIngredients(category);
      return ingredients.map(ing => ({
        id: String(ing.id),
        name: ing.name,
        unit: ing.unit,
        category: ing.category,
        minStockLevel: parseFloat(ing.minStockLevel || 0),
        currentStock: parseFloat(ing.currentStock || 0),
        costPerUnit: parseFloat(ing.costPerUnit || 0),
        status: ing.status
      }));
    },

    anugerahIngredient: async (_, { id }) => {
      console.log(`📦 Fetching ingredient ${id} from Anugerah Resto...`);
      const ing = await getIngredientById(id);
      if (!ing) return null;
      return {
        id: String(ing.id),
        name: ing.name,
        unit: ing.unit,
        category: ing.category,
        minStockLevel: parseFloat(ing.minStockLevel || 0),
        currentStock: parseFloat(ing.currentStock || 0),
        costPerUnit: parseFloat(ing.costPerUnit || 0),
        status: ing.status
      };
    },

    anugerahHealth: async () => {
      console.log("🏥 Checking Anugerah Resto health...");
      return await checkAnugerahRestoHealth();
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
    },

    // Anugerah Resto Integration Mutation
    notifyAnugerahDelivery: async (_, { ingredientId, quantity, reason }) => {
      console.log(`📦 Notifying Anugerah Resto about delivery: ingredient ${ingredientId}, quantity ${quantity}`);

      const result = await notifyStockDelivery(
        ingredientId,
        quantity,
        reason || 'Delivery from Toko Sembako'
      );

      return {
        success: result.success,
        message: result.message,
        stockMovement: result.stockMovement ? {
          id: result.stockMovement.id,
          quantity: result.stockMovement.quantity,
          movementType: result.stockMovement.movementType,
          reason: result.stockMovement.reason
        } : null
      };
    }
  }
};

const server = new ApolloServer({ typeDefs, resolvers });

module.exports = { typeDefs, resolvers };

if (require.main === module) {
  server.listen({ port: 5002 }).then(() => console.log("🛍️ Toko Sembako Order Service running on http://localhost:5002"));
}
