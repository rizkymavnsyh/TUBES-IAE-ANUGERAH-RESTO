const axios = require('axios');

// Helper function to safely parse JSON
function safeParseJSON(field, defaultValue = []) {
  if (field === null || field === undefined) return defaultValue;
  if (typeof field === 'object') return field;
  try {
    return JSON.parse(field);
  } catch (e) {
    return defaultValue;
  }
}

const resolvers = {
  Query: {
    kitchenOrders: async (parent, { status }, { db }) => {
      try {
        let query = 'SELECT * FROM kitchen_orders';
        const params = [];

        if (status) {
          query += ' WHERE status = ?';
          params.push(status);
        }

        query += ' ORDER BY priority DESC, created_at ASC';

        const [orders] = await db.execute(query, params);
        return orders.map(order => ({
          ...order,
          items: safeParseJSON(order.items, []),
          id: order.id.toString()
        }));
      } catch (error) {
        throw new Error(`Error fetching kitchen orders: ${error.message}`);
      }
    },

    kitchenOrder: async (parent, { id }, { db }) => {
      try {
        const [orders] = await db.execute(
          'SELECT * FROM kitchen_orders WHERE id = ?',
          [id]
        );
        if (orders.length === 0) {
          throw new Error('Order not found');
        }
        const order = orders[0];
        return {
          ...order,
          items: JSON.parse(order.items || '[]'),
          id: order.id.toString()
        };
      } catch (error) {
        throw new Error(`Error fetching order: ${error.message}`);
      }
    },

    kitchenOrderByOrderId: async (parent, { orderId }, { db }) => {
      try {
        const [orders] = await db.execute(
          'SELECT * FROM kitchen_orders WHERE order_id = ?',
          [orderId]
        );
        if (orders.length === 0) {
          return null;
        }
        const order = orders[0];
        return {
          ...order,
          items: JSON.parse(order.items || '[]'),
          id: order.id.toString()
        };
      } catch (error) {
        throw new Error(`Error fetching order: ${error.message}`);
      }
    },

    chefs: async (parent, args, { db }) => {
      try {
        const [chefs] = await db.execute('SELECT * FROM chefs ORDER BY name');
        return chefs.map(chef => ({
          ...chef,
          id: chef.id.toString(),
          currentOrders: chef.current_orders || 0
        }));
      } catch (error) {
        throw new Error(`Error fetching chefs: ${error.message}`);
      }
    },

    chef: async (parent, { id }, { db }) => {
      try {
        const [chefs] = await db.execute('SELECT * FROM chefs WHERE id = ?', [id]);
        if (chefs.length === 0) {
          throw new Error('Chef not found');
        }
        return {
          ...chefs[0],
          id: chefs[0].id.toString()
        };
      } catch (error) {
        throw new Error(`Error fetching chef: ${error.message}`);
      }
    },

    ordersByChef: async (parent, { chefId }, { db }) => {
      try {
        const [orders] = await db.execute(
          'SELECT * FROM kitchen_orders WHERE chef_id = ? AND status != "completed" ORDER BY priority DESC',
          [chefId]
        );
        return orders.map(order => ({
          ...order,
          items: JSON.parse(order.items || '[]'),
          id: order.id.toString()
        }));
      } catch (error) {
        throw new Error(`Error fetching orders by chef: ${error.message}`);
      }
    }
  },

  Mutation: {
    createKitchenOrder: async (parent, { input }, { db }) => {
      try {
        const { orderId, tableNumber, items, priority = 0, notes } = input;

        // Check if order already exists
        const [existing] = await db.execute(
          'SELECT id FROM kitchen_orders WHERE order_id = ?',
          [orderId]
        );

        if (existing.length > 0) {
          throw new Error('Order already exists in kitchen queue');
        }

        // Ensure items is a JSON string
        const itemsJson = typeof items === 'string' ? items : JSON.stringify(items || []);

        const [result] = await db.execute(
          `INSERT INTO kitchen_orders (order_id, table_number, status, items, priority, notes)
           VALUES (?, ?, 'pending', ?, ?, ?)`,
          [orderId, tableNumber || null, itemsJson, priority, notes || null]
        );

        const [orders] = await db.execute(
          'SELECT * FROM kitchen_orders WHERE id = ?',
          [result.insertId]
        );

        const o = orders[0];
        return {
          id: o.id.toString(),
          orderId: o.order_id,
          tableNumber: o.table_number,
          status: o.status || 'pending',
          items: safeParseJSON(o.items, []),
          priority: o.priority || 0,
          estimatedTime: o.estimated_time,
          chefId: o.chef_id,
          notes: o.notes,
          createdAt: o.created_at ? o.created_at.toISOString() : new Date().toISOString(),
          updatedAt: o.updated_at ? o.updated_at.toISOString() : new Date().toISOString()
        };
      } catch (error) {
        throw new Error(`Error creating kitchen order: ${error.message}`);
      }
    },

    updateOrderStatus: async (parent, { id, status }, { db }) => {
      try {
        await db.execute(
          'UPDATE kitchen_orders SET status = ? WHERE id = ?',
          [status, id]
        );

        const [orders] = await db.execute(
          'SELECT * FROM kitchen_orders WHERE id = ?',
          [id]
        );

        if (orders.length === 0) {
          throw new Error('Order not found');
        }

        // Update chef status if order is completed
        if (status === 'completed' && orders[0].chef_id) {
          await db.execute(
            'UPDATE chefs SET current_orders = GREATEST(0, current_orders - 1) WHERE id = ?',
            [orders[0].chef_id]
          );
        }

        return {
          ...orders[0],
          items: JSON.parse(orders[0].items || '[]'),
          id: orders[0].id.toString()
        };
      } catch (error) {
        throw new Error(`Error updating order status: ${error.message}`);
      }
    },

    assignChef: async (parent, { orderId, chefId }, { db }) => {
      try {
        // Check if chef is available
        const [chefs] = await db.execute('SELECT * FROM chefs WHERE id = ?', [chefId]);
        if (chefs.length === 0) {
          throw new Error('Chef not found');
        }

        // Update order
        await db.execute(
          'UPDATE kitchen_orders SET chef_id = ?, status = "preparing" WHERE id = ?',
          [chefId, orderId]
        );

        // Update chef current orders
        await db.execute(
          'UPDATE chefs SET current_orders = current_orders + 1, status = "busy" WHERE id = ?',
          [chefId]
        );

        const [orders] = await db.execute(
          'SELECT * FROM kitchen_orders WHERE id = ?',
          [orderId]
        );

        return {
          ...orders[0],
          items: JSON.parse(orders[0].items || '[]'),
          id: orders[0].id.toString()
        };
      } catch (error) {
        throw new Error(`Error assigning chef: ${error.message}`);
      }
    },

    updateEstimatedTime: async (parent, { orderId, estimatedTime }, { db }) => {
      try {
        await db.execute(
          'UPDATE kitchen_orders SET estimated_time = ? WHERE id = ?',
          [estimatedTime, orderId]
        );

        const [orders] = await db.execute(
          'SELECT * FROM kitchen_orders WHERE id = ?',
          [orderId]
        );

        if (orders.length === 0) {
          throw new Error('Order not found');
        }

        return {
          ...orders[0],
          items: JSON.parse(orders[0].items || '[]'),
          id: orders[0].id.toString()
        };
      } catch (error) {
        throw new Error(`Error updating estimated time: ${error.message}`);
      }
    },

    completeOrder: async (parent, { orderId }, { db }) => {
      try {
        await db.execute(
          'UPDATE kitchen_orders SET status = "completed" WHERE id = ?',
          [orderId]
        );

        const [orders] = await db.execute(
          'SELECT * FROM kitchen_orders WHERE id = ?',
          [orderId]
        );

        if (orders.length === 0) {
          throw new Error('Order not found');
        }

        // Update chef status
        if (orders[0].chef_id) {
          await db.execute(
            'UPDATE chefs SET current_orders = GREATEST(0, current_orders - 1), status = CASE WHEN current_orders <= 1 THEN "available" ELSE "busy" END WHERE id = ?',
            [orders[0].chef_id]
          );
        }

        return {
          ...orders[0],
          items: JSON.parse(orders[0].items || '[]'),
          id: orders[0].id.toString()
        };
      } catch (error) {
        throw new Error(`Error completing order: ${error.message}`);
      }
    },

    cancelOrder: async (parent, { orderId }, { db }) => {
      try {
        await db.execute(
          'UPDATE kitchen_orders SET status = "cancelled" WHERE id = ?',
          [orderId]
        );

        const [orders] = await db.execute(
          'SELECT * FROM kitchen_orders WHERE id = ?',
          [orderId]
        );

        if (orders.length === 0) {
          throw new Error('Order not found');
        }

        // Update chef status if assigned
        if (orders[0].chef_id) {
          await db.execute(
            'UPDATE chefs SET current_orders = GREATEST(0, current_orders - 1), status = CASE WHEN current_orders <= 1 THEN "available" ELSE "busy" END WHERE id = ?',
            [orders[0].chef_id]
          );
        }

        return {
          ...orders[0],
          items: JSON.parse(orders[0].items || '[]'),
          id: orders[0].id.toString()
        };
      } catch (error) {
        throw new Error(`Error cancelling order: ${error.message}`);
      }
    }
  },

  KitchenOrder: {
    chef: async (parent, args, { db }) => {
      if (!parent.chefId) return null;
      try {
        const [chefs] = await db.execute('SELECT * FROM chefs WHERE id = ?', [parent.chefId]);
        if (chefs.length === 0) return null;
        return {
          ...chefs[0],
          id: chefs[0].id.toString(),
          currentOrders: chefs[0].current_orders || 0
        };
      } catch (error) {
        return null;
      }
    }
  }
};

module.exports = resolvers;
