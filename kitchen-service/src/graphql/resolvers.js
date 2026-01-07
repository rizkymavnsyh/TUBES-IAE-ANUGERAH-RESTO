const axios = require('axios');
const { requireAuth, requireMinRole } = require('../auth');

// User Service URL for fetching staff/chef data
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:4003/graphql';

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

// Helper function to call User Service GraphQL API
async function callUserService(query, variables = {}) {
  try {
    const response = await axios.post(USER_SERVICE_URL, {
      query,
      variables
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }
    return response.data.data;
  } catch (error) {
    console.error('Error calling User Service:', error.message);
    throw error;
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
          id: order.id.toString(),
          orderId: order.order_id || `ORD-${order.id}`,
          tableNumber: order.table_number,
          status: order.status,
          items: safeParseJSON(order.items, []),
          priority: order.priority || 0,
          estimatedTime: order.estimated_time,
          chefId: order.chef_id,
          notes: order.notes,
          createdAt: order.created_at ? order.created_at.toISOString() : new Date().toISOString(),
          updatedAt: order.updated_at ? order.updated_at.toISOString() : new Date().toISOString()
        }));
      } catch (error) {
        throw new Error(`Error fetching kitchen orders: ${error.message}`);
      }
    },

    pendingOrders: async (parent, args, { db }) => {
      try {
        const [orders] = await db.execute(
          'SELECT * FROM kitchen_orders WHERE status = ? ORDER BY priority DESC, created_at ASC',
          ['pending']
        );
        return orders.map(order => ({
          id: order.id.toString(),
          orderId: order.order_id || `ORD-${order.id}`,
          tableNumber: order.table_number,
          status: order.status,
          items: safeParseJSON(order.items, []),
          priority: order.priority || 0,
          estimatedTime: order.estimated_time,
          chefId: order.chef_id,
          notes: order.notes,
          createdAt: order.created_at ? order.created_at.toISOString() : new Date().toISOString(),
          updatedAt: order.updated_at ? order.updated_at.toISOString() : new Date().toISOString()
        }));
      } catch (error) {
        throw new Error(`Error fetching pending orders: ${error.message}`);
      }
    },

    preparingOrders: async (parent, args, { db }) => {
      try {
        const [orders] = await db.execute(
          'SELECT * FROM kitchen_orders WHERE status = ? ORDER BY priority DESC, created_at ASC',
          ['preparing']
        );
        return orders.map(order => ({
          id: order.id.toString(),
          orderId: order.order_id || `ORD-${order.id}`,
          tableNumber: order.table_number,
          status: order.status,
          items: safeParseJSON(order.items, []),
          priority: order.priority || 0,
          estimatedTime: order.estimated_time,
          chefId: order.chef_id,
          notes: order.notes,
          createdAt: order.created_at ? order.created_at.toISOString() : new Date().toISOString(),
          updatedAt: order.updated_at ? order.updated_at.toISOString() : new Date().toISOString()
        }));
      } catch (error) {
        throw new Error(`Error fetching preparing orders: ${error.message}`);
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
          id: order.id.toString(),
          orderId: order.order_id || `ORD-${order.id}`,
          tableNumber: order.table_number,
          status: order.status,
          items: safeParseJSON(order.items, []),
          priority: order.priority || 0,
          estimatedTime: order.estimated_time,
          chefId: order.chef_id,
          notes: order.notes,
          createdAt: order.created_at ? order.created_at.toISOString() : new Date().toISOString(),
          updatedAt: order.updated_at ? order.updated_at.toISOString() : new Date().toISOString()
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
          id: order.id.toString(),
          orderId: order.order_id || `ORD-${order.id}`,
          tableNumber: order.table_number,
          status: order.status,
          items: safeParseJSON(order.items, []),
          priority: order.priority || 0,
          estimatedTime: order.estimated_time,
          chefId: order.chef_id,
          notes: order.notes,
          createdAt: order.created_at ? order.created_at.toISOString() : new Date().toISOString(),
          updatedAt: order.updated_at ? order.updated_at.toISOString() : new Date().toISOString()
        };
      } catch (error) {
        throw new Error(`Error fetching order: ${error.message}`);
      }
    },

    chefs: async (parent, args, { db }) => {
      try {
        // Query User Service for staff with role=chef
        const query = `
          query GetChefs {
            staff(role: chef, status: active) {
              id
              employeeId
              name
              email
              phone
              department
              status
            }
          }
        `;

        const data = await callUserService(query);
        const staffChefs = data.staff || [];

        // Get current orders count for each chef from kitchen_orders
        const chefsWithOrders = await Promise.all(staffChefs.map(async (chef) => {
          const [orders] = await db.execute(
            'SELECT COUNT(*) as count FROM kitchen_orders WHERE chef_id = ? AND status NOT IN ("completed", "cancelled")',
            [chef.id]
          );
          return {
            id: chef.id,
            name: chef.name,
            specialization: chef.department || 'General',
            status: 'available',
            currentOrders: orders[0].count || 0
          };
        }));

        return chefsWithOrders;
      } catch (error) {
        console.error('Error fetching chefs from User Service:', error.message);
        // Fallback to local chefs table if User Service fails
        const [chefs] = await db.execute('SELECT * FROM chefs ORDER BY name');
        return chefs.map(chef => ({
          ...chef,
          id: chef.id.toString(),
          currentOrders: chef.current_orders || 0
        }));
      }
    },

    chef: async (parent, { id }, { db }) => {
      try {
        // Query User Service for specific staff by ID
        const query = `
          query GetChef($id: ID!) {
            staffById(id: $id) {
              id
              employeeId
              name
              email
              phone
              department
              status
            }
          }
        `;

        const data = await callUserService(query, { id });
        const staffChef = data.staffById;

        if (!staffChef) {
          throw new Error('Chef not found');
        }

        // Get current orders count
        const [orders] = await db.execute(
          'SELECT COUNT(*) as count FROM kitchen_orders WHERE chef_id = ? AND status NOT IN ("completed", "cancelled")',
          [id]
        );

        return {
          id: staffChef.id,
          name: staffChef.name,
          specialization: staffChef.department || 'General',
          status: 'available',
          currentOrders: orders[0].count || 0
        };
      } catch (error) {
        console.error('Error fetching chef from User Service:', error.message);
        // Fallback to local chefs table
        const [chefs] = await db.execute('SELECT * FROM chefs WHERE id = ?', [id]);
        if (chefs.length === 0) {
          throw new Error('Chef not found');
        }
        return {
          ...chefs[0],
          id: chefs[0].id.toString()
        };
      }
    },

    ordersByChef: async (parent, { chefId }, { db }) => {
      try {
        const [orders] = await db.execute(
          'SELECT * FROM kitchen_orders WHERE chef_id = ? AND status != "completed" ORDER BY priority DESC',
          [chefId]
        );
        return orders.map(order => ({
          id: order.id.toString(),
          orderId: order.order_id || `ORD-${order.id}`,
          tableNumber: order.table_number,
          status: order.status,
          items: safeParseJSON(order.items, []),
          priority: order.priority || 0,
          estimatedTime: order.estimated_time,
          chefId: order.chef_id,
          notes: order.notes,
          createdAt: order.created_at ? order.created_at.toISOString() : new Date().toISOString(),
          updatedAt: order.updated_at ? order.updated_at.toISOString() : new Date().toISOString()
        }));
      } catch (error) {
        throw new Error(`Error fetching orders by chef: ${error.message}`);
      }
    }
  },

  Mutation: {
    createKitchenOrder: async (parent, { input }, context) => {
      // Require authentication
      requireAuth(context);
      const { db } = context;
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

    updateKitchenOrder: async (parent, { id, input }, context) => {
      // Require authentication
      requireAuth(context);
      const { db } = context;
      try {
        const [orderRows] = await db.execute('SELECT * FROM kitchen_orders WHERE id = ?', [id]);
        if (orderRows.length === 0) {
          throw new Error('Kitchen order not found');
        }

        const updates = [];
        const params = [];

        if (input.tableNumber !== undefined) {
          updates.push('table_number = ?');
          params.push(input.tableNumber);
        }
        if (input.items !== undefined) {
          updates.push('items = ?');
          params.push(JSON.stringify(input.items));
        }
        if (input.priority !== undefined) {
          updates.push('priority = ?');
          params.push(input.priority);
        }
        if (input.notes !== undefined) {
          updates.push('notes = ?');
          params.push(input.notes);
        }
        if (input.estimatedTime !== undefined) {
          updates.push('estimated_time = ?');
          params.push(input.estimatedTime);
        }

        if (updates.length > 0) {
          params.push(id);
          await db.execute(
            `UPDATE kitchen_orders SET ${updates.join(', ')} WHERE id = ?`,
            params
          );
        }

        const [updatedRows] = await db.execute('SELECT * FROM kitchen_orders WHERE id = ?', [id]);
        const o = updatedRows[0];
        return {
          id: o.id.toString(),
          orderId: o.order_id || `ORD-${o.id}`,
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
        throw new Error(`Error updating kitchen order: ${error.message}`);
      }
    },

    updateOrderStatus: async (parent, { id, status }, context) => {
      // Require authentication
      requireAuth(context);
      const { db } = context;
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
          id: orders[0].id.toString(),
          orderId: orders[0].order_id || `ORD-${orders[0].id}`,
          tableNumber: orders[0].table_number,
          status: orders[0].status,
          items: safeParseJSON(orders[0].items, []),
          priority: orders[0].priority || 0,
          estimatedTime: orders[0].estimated_time,
          chefId: orders[0].chef_id,
          notes: orders[0].notes,
          createdAt: orders[0].created_at ? orders[0].created_at.toISOString() : new Date().toISOString(),
          updatedAt: orders[0].updated_at ? orders[0].updated_at.toISOString() : new Date().toISOString()
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
          id: orders[0].id.toString(),
          orderId: orders[0].order_id || `ORD-${orders[0].id}`,
          tableNumber: orders[0].table_number,
          status: orders[0].status,
          items: safeParseJSON(orders[0].items, []),
          priority: orders[0].priority || 0,
          estimatedTime: orders[0].estimated_time,
          chefId: orders[0].chef_id,
          notes: orders[0].notes,
          createdAt: orders[0].created_at ? orders[0].created_at.toISOString() : new Date().toISOString(),
          updatedAt: orders[0].updated_at ? orders[0].updated_at.toISOString() : new Date().toISOString()
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
          id: orders[0].id.toString(),
          orderId: orders[0].order_id || `ORD-${orders[0].id}`,
          tableNumber: orders[0].table_number,
          status: orders[0].status,
          items: safeParseJSON(orders[0].items, []),
          priority: orders[0].priority || 0,
          estimatedTime: orders[0].estimated_time,
          chefId: orders[0].chef_id,
          notes: orders[0].notes,
          createdAt: orders[0].created_at ? orders[0].created_at.toISOString() : new Date().toISOString(),
          updatedAt: orders[0].updated_at ? orders[0].updated_at.toISOString() : new Date().toISOString()
        };
      } catch (error) {
        throw new Error(`Error updating estimated time: ${error.message}`);
      }
    },

    completeOrder: async (parent, { orderId }, { db }) => {
      try {
        // Determine if orderId is numeric (db id) or string (order_id like ORD-xxx)
        const isNumeric = !isNaN(orderId) && !String(orderId).startsWith('ORD');
        const whereClause = isNumeric ? 'id = ?' : 'order_id = ?';

        await db.execute(
          `UPDATE kitchen_orders SET status = "ready" WHERE ${whereClause}`,
          [orderId]
        );

        const [orders] = await db.execute(
          `SELECT * FROM kitchen_orders WHERE ${whereClause}`,
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
          id: orders[0].id.toString(),
          orderId: orders[0].order_id || `ORD-${orders[0].id}`,
          tableNumber: orders[0].table_number,
          status: orders[0].status,
          items: safeParseJSON(orders[0].items, []),
          priority: orders[0].priority || 0,
          estimatedTime: orders[0].estimated_time,
          chefId: orders[0].chef_id,
          notes: orders[0].notes,
          createdAt: orders[0].created_at ? orders[0].created_at.toISOString() : new Date().toISOString(),
          updatedAt: orders[0].updated_at ? orders[0].updated_at.toISOString() : new Date().toISOString()
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
          id: orders[0].id.toString(),
          orderId: orders[0].order_id || `ORD-${orders[0].id}`,
          tableNumber: orders[0].table_number,
          status: orders[0].status,
          items: safeParseJSON(orders[0].items, []),
          priority: orders[0].priority || 0,
          estimatedTime: orders[0].estimated_time,
          chefId: orders[0].chef_id,
          notes: orders[0].notes,
          createdAt: orders[0].created_at ? orders[0].created_at.toISOString() : new Date().toISOString(),
          updatedAt: orders[0].updated_at ? orders[0].updated_at.toISOString() : new Date().toISOString()
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
