const axios = require('axios');
const db = require('../database/connection');
const { requireAuth, requireMinRole, requireRole } = require('../auth');

// Service URLs from environment
const KITCHEN_SERVICE_URL = process.env.KITCHEN_SERVICE_URL || 'http://localhost:4001/graphql';
const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:4002/graphql';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:4003/graphql';

// Helper function to call GraphQL service with optional auth headers
async function callGraphQLService(url, query, variables = {}, authToken = null) {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    // Pass auth token if provided (for inter-service authentication)
    if (authToken) {
      headers['Authorization'] = authToken;
    }

    const response = await axios.post(url, {
      query,
      variables
    }, { headers });

    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }
    return response.data.data;
  } catch (error) {
    console.error(`Error calling service at ${url}:`, error.message);
    throw error;
  }
}

// Helper function to parse JSON fields
function parseJSONField(field) {
  if (!field) return null;
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);
    } catch {
      return field;
    }
  }
  return field;
}

const resolvers = {
  Query: {
    menus: async (parent, { category, available }) => {
      try {
        let query = 'SELECT * FROM menus WHERE 1=1';
        const params = [];

        if (category) {
          query += ' AND category = ?';
          params.push(category);
        }
        if (available !== undefined) {
          query += ' AND available = ?';
          params.push(available);
        }

        query += ' ORDER BY name ASC';

        const [rows] = await db.execute(query, params);
        return rows.map(row => ({
          id: row.id.toString(),
          menuId: row.menu_id,
          name: row.name,
          description: row.description,
          category: row.category,
          price: parseFloat(row.price),
          image: row.image,
          ingredients: parseJSONField(row.ingredients) || [],
          available: Boolean(row.available),
          preparationTime: row.preparation_time,
          tags: parseJSONField(row.tags) || [],
          createdAt: row.created_at.toISOString(),
          updatedAt: row.updated_at.toISOString()
        }));
      } catch (error) {
        throw new Error(`Error fetching menus: ${error.message}`);
      }
    },

    menu: async (parent, { id }) => {
      try {
        const [rows] = await db.execute('SELECT * FROM menus WHERE id = ?', [id]);
        if (rows.length === 0) {
          throw new Error('Menu not found');
        }
        const row = rows[0];
        return {
          id: row.id.toString(),
          menuId: row.menu_id,
          name: row.name,
          description: row.description,
          category: row.category,
          price: parseFloat(row.price),
          image: row.image,
          ingredients: parseJSONField(row.ingredients) || [],
          available: Boolean(row.available),
          preparationTime: row.preparation_time,
          tags: parseJSONField(row.tags) || [],
          createdAt: row.created_at.toISOString(),
          updatedAt: row.updated_at.toISOString()
        };
      } catch (error) {
        throw new Error(`Error fetching menu: ${error.message}`);
      }
    },

    menuByMenuId: async (parent, { menuId }) => {
      try {
        const [rows] = await db.execute('SELECT * FROM menus WHERE menu_id = ?', [menuId]);
        if (rows.length === 0) {
          return null;
        }
        const row = rows[0];
        return {
          id: row.id.toString(),
          menuId: row.menu_id,
          name: row.name,
          description: row.description,
          category: row.category,
          price: parseFloat(row.price),
          image: row.image,
          ingredients: parseJSONField(row.ingredients) || [],
          available: Boolean(row.available),
          preparationTime: row.preparation_time,
          tags: parseJSONField(row.tags) || [],
          createdAt: row.created_at.toISOString(),
          updatedAt: row.updated_at.toISOString()
        };
      } catch (error) {
        throw new Error(`Error fetching menu: ${error.message}`);
      }
    },

    menuCategories: async () => {
      try {
        const [rows] = await db.execute('SELECT DISTINCT category FROM menus ORDER BY category');
        return rows.map(row => row.category);
      } catch (error) {
        throw new Error(`Error fetching categories: ${error.message}`);
      }
    },

    cart: async (parent, { cartId }) => {
      try {
        const [rows] = await db.execute('SELECT * FROM carts WHERE cart_id = ?', [cartId]);
        if (rows.length === 0) {
          return null;
        }
        const row = rows[0];
        return {
          id: row.id.toString(),
          cartId: row.cart_id,
          customerId: row.customer_id,
          tableNumber: row.table_number,
          items: parseJSONField(row.items) || [],
          subtotal: parseFloat(row.subtotal),
          tax: parseFloat(row.tax),
          serviceCharge: parseFloat(row.service_charge),
          discount: parseFloat(row.discount),
          total: parseFloat(row.total),
          status: row.status,
          createdAt: row.created_at.toISOString(),
          updatedAt: row.updated_at.toISOString()
        };
      } catch (error) {
        throw new Error(`Error fetching cart: ${error.message}`);
      }
    },

    orders: async (parent, { status, paymentStatus, customerId, tableNumber }) => {
      try {
        let query = 'SELECT * FROM orders WHERE 1=1';
        const params = [];

        if (status) {
          query += ' AND order_status = ?';
          params.push(status);
        }
        if (paymentStatus) {
          query += ' AND payment_status = ?';
          params.push(paymentStatus);
        }
        if (customerId) {
          query += ' AND customer_id = ?';
          params.push(customerId);
        }
        if (tableNumber) {
          query += ' AND table_number = ?';
          params.push(tableNumber);
        }

        query += ' ORDER BY created_at DESC LIMIT 100';

        const [rows] = await db.execute(query, params);
        return rows.map(row => ({
          id: row.id.toString(),
          orderId: row.order_id,
          customerId: row.customer_id,
          tableNumber: row.table_number,
          items: parseJSONField(row.items) || [],
          subtotal: parseFloat(row.subtotal),
          tax: parseFloat(row.tax),
          serviceCharge: parseFloat(row.service_charge),
          discount: parseFloat(row.discount),
          loyaltyPointsUsed: parseFloat(row.loyalty_points_used),
          loyaltyPointsEarned: parseFloat(row.loyalty_points_earned),
          total: parseFloat(row.total),
          paymentMethod: row.payment_method,
          paymentStatus: row.payment_status,
          orderStatus: row.order_status,
          kitchenStatus: row.kitchen_status,
          staffId: row.staff_id,
          notes: row.notes,
          createdAt: row.created_at.toISOString(),
          updatedAt: row.updated_at.toISOString(),
          completedAt: row.completed_at ? row.completed_at.toISOString() : null
        }));
      } catch (error) {
        throw new Error(`Error fetching orders: ${error.message}`);
      }
    },

    order: async (parent, { id }) => {
      try {
        const [rows] = await db.execute('SELECT * FROM orders WHERE id = ?', [id]);
        if (rows.length === 0) {
          throw new Error('Order not found');
        }
        const row = rows[0];
        return {
          id: row.id.toString(),
          orderId: row.order_id,
          customerId: row.customer_id,
          tableNumber: row.table_number,
          items: parseJSONField(row.items) || [],
          subtotal: parseFloat(row.subtotal),
          tax: parseFloat(row.tax),
          serviceCharge: parseFloat(row.service_charge),
          discount: parseFloat(row.discount),
          loyaltyPointsUsed: parseFloat(row.loyalty_points_used),
          loyaltyPointsEarned: parseFloat(row.loyalty_points_earned),
          total: parseFloat(row.total),
          paymentMethod: row.payment_method,
          paymentStatus: row.payment_status,
          orderStatus: row.order_status,
          kitchenStatus: row.kitchen_status,
          staffId: row.staff_id,
          notes: row.notes,
          createdAt: row.created_at.toISOString(),
          updatedAt: row.updated_at.toISOString(),
          completedAt: row.completed_at ? row.completed_at.toISOString() : null
        };
      } catch (error) {
        throw new Error(`Error fetching order: ${error.message}`);
      }
    },

    orderByOrderId: async (parent, { orderId }) => {
      try {
        const [rows] = await db.execute('SELECT * FROM orders WHERE order_id = ?', [orderId]);
        if (rows.length === 0) {
          return null;
        }
        const row = rows[0];
        return {
          id: row.id.toString(),
          orderId: row.order_id,
          customerId: row.customer_id,
          tableNumber: row.table_number,
          items: parseJSONField(row.items) || [],
          subtotal: parseFloat(row.subtotal),
          tax: parseFloat(row.tax),
          serviceCharge: parseFloat(row.service_charge),
          discount: parseFloat(row.discount),
          loyaltyPointsUsed: parseFloat(row.loyalty_points_used),
          loyaltyPointsEarned: parseFloat(row.loyalty_points_earned),
          total: parseFloat(row.total),
          paymentMethod: row.payment_method,
          paymentStatus: row.payment_status,
          orderStatus: row.order_status,
          kitchenStatus: row.kitchen_status,
          staffId: row.staff_id,
          notes: row.notes,
          createdAt: row.created_at.toISOString(),
          updatedAt: row.updated_at.toISOString(),
          completedAt: row.completed_at ? row.completed_at.toISOString() : null
        };
      } catch (error) {
        throw new Error(`Error fetching order: ${error.message}`);
      }
    },

    checkMenuStock: async (parent, { menuId, quantity }) => {
      try {
        const [menuRows] = await db.execute('SELECT * FROM menus WHERE menu_id = ?', [menuId]);
        if (menuRows.length === 0) {
          throw new Error('Menu not found');
        }

        const menu = menuRows[0];
        const ingredients = parseJSONField(menu.ingredients) || [];

        const results = [];
        for (const ingredient of ingredients) {
          const query = `
            query CheckStock($ingredientId: ID!, $quantity: Float!) {
              checkStock(ingredientId: $ingredientId, quantity: $quantity) {
                available
                currentStock
                requestedQuantity
                message
              }
            }
          `;

          try {
            const data = await callGraphQLService(INVENTORY_SERVICE_URL, query, {
              ingredientId: ingredient.ingredientId,
              quantity: ingredient.quantity * quantity
            });

            results.push({
              available: data.checkStock.available,
              message: data.checkStock.message,
              ingredientId: ingredient.ingredientId,
              ingredientName: ingredient.ingredientName,
              required: ingredient.quantity * quantity,
              availableQuantity: data.checkStock.currentStock
            });
          } catch (error) {
            results.push({
              available: false,
              message: `Error checking stock for ${ingredient.ingredientName}: ${error.message}`,
              ingredientId: ingredient.ingredientId,
              ingredientName: ingredient.ingredientName,
              required: ingredient.quantity * quantity,
              availableQuantity: 0
            });
          }
        }

        return results;
      } catch (error) {
        throw new Error(`Error checking menu stock: ${error.message}`);
      }
    }
  },

  Mutation: {
    createMenu: async (parent, { input }, context) => {
      // Require manager or admin role
      requireMinRole(context, 'manager');
      try {
        const [result] = await db.execute(`
          INSERT INTO menus (menu_id, name, description, category, price, image, ingredients, available, preparation_time, tags)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          input.menuId,
          input.name,
          input.description || null,
          input.category,
          input.price,
          input.image || null,
          JSON.stringify(input.ingredients || []),
          input.available !== undefined ? input.available : true,
          input.preparationTime || 15,
          JSON.stringify(input.tags || [])
        ]);

        const [rows] = await db.execute('SELECT * FROM menus WHERE id = ?', [result.insertId]);
        const row = rows[0];
        return {
          id: row.id.toString(),
          menuId: row.menu_id,
          name: row.name,
          description: row.description,
          category: row.category,
          price: parseFloat(row.price),
          image: row.image,
          ingredients: parseJSONField(row.ingredients) || [],
          available: Boolean(row.available),
          preparationTime: row.preparation_time,
          tags: parseJSONField(row.tags) || [],
          createdAt: row.created_at.toISOString(),
          updatedAt: row.updated_at.toISOString()
        };
      } catch (error) {
        throw new Error(`Error creating menu: ${error.message}`);
      }
    },

    updateMenu: async (parent, { id, input }, context) => {
      // Require manager or admin role
      requireMinRole(context, 'manager');
      try {
        const updates = [];
        const params = [];

        if (input.name !== undefined) {
          updates.push('name = ?');
          params.push(input.name);
        }
        if (input.description !== undefined) {
          updates.push('description = ?');
          params.push(input.description);
        }
        if (input.category !== undefined) {
          updates.push('category = ?');
          params.push(input.category);
        }
        if (input.price !== undefined) {
          updates.push('price = ?');
          params.push(input.price);
        }
        if (input.image !== undefined) {
          updates.push('image = ?');
          params.push(input.image);
        }
        if (input.ingredients !== undefined) {
          updates.push('ingredients = ?');
          params.push(JSON.stringify(input.ingredients));
        }
        if (input.available !== undefined) {
          updates.push('available = ?');
          params.push(input.available);
        }
        if (input.preparationTime !== undefined) {
          updates.push('preparation_time = ?');
          params.push(input.preparationTime);
        }
        if (input.tags !== undefined) {
          updates.push('tags = ?');
          params.push(JSON.stringify(input.tags));
        }

        if (updates.length === 0) {
          throw new Error('No fields to update');
        }

        params.push(id);
        await db.execute(
          `UPDATE menus SET ${updates.join(', ')} WHERE id = ?`,
          params
        );

        const [rows] = await db.execute('SELECT * FROM menus WHERE id = ?', [id]);
        if (rows.length === 0) {
          throw new Error('Menu not found');
        }
        const row = rows[0];
        return {
          id: row.id.toString(),
          menuId: row.menu_id,
          name: row.name,
          description: row.description,
          category: row.category,
          price: parseFloat(row.price),
          image: row.image,
          ingredients: parseJSONField(row.ingredients) || [],
          available: Boolean(row.available),
          preparationTime: row.preparation_time,
          tags: parseJSONField(row.tags) || [],
          createdAt: row.created_at.toISOString(),
          updatedAt: row.updated_at.toISOString()
        };
      } catch (error) {
        throw new Error(`Error updating menu: ${error.message}`);
      }
    },

    deleteMenu: async (parent, { id }, context) => {
      // Require admin role
      requireMinRole(context, 'admin');
      try {
        const [result] = await db.execute('DELETE FROM menus WHERE id = ?', [id]);
        return result.affectedRows > 0;
      } catch (error) {
        throw new Error(`Error deleting menu: ${error.message}`);
      }
    },

    toggleMenuAvailability: async (parent, { id }, context) => {
      // Require manager or admin role
      requireMinRole(context, 'manager');
      try {
        await db.execute('UPDATE menus SET available = NOT available WHERE id = ?', [id]);

        const [rows] = await db.execute('SELECT * FROM menus WHERE id = ?', [id]);
        if (rows.length === 0) {
          throw new Error('Menu not found');
        }
        const row = rows[0];
        return {
          id: row.id.toString(),
          menuId: row.menu_id,
          name: row.name,
          description: row.description,
          category: row.category,
          price: parseFloat(row.price),
          image: row.image,
          ingredients: parseJSONField(row.ingredients) || [],
          available: Boolean(row.available),
          preparationTime: row.preparation_time,
          tags: parseJSONField(row.tags) || [],
          createdAt: row.created_at.toISOString(),
          updatedAt: row.updated_at.toISOString()
        };
      } catch (error) {
        throw new Error(`Error toggling menu availability: ${error.message}`);
      }
    },

    createCart: async (parent, { input }, context) => {
      // Require authentication
      requireAuth(context);
      try {
        const items = input.items || [];
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.1;
        const serviceCharge = subtotal * 0.05;
        const total = subtotal + tax + serviceCharge - (input.discount || 0);

        const [result] = await db.execute(`
          INSERT INTO carts (cart_id, user_id, customer_id, table_number, items, subtotal, tax, service_charge, discount, total, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          input.cartId,
          input.customerId || input.cartId,
          input.customerId || null,
          input.tableNumber || null,
          JSON.stringify(items),
          subtotal,
          tax,
          serviceCharge,
          input.discount || 0,
          total,
          input.status || 'active'
        ]);

        const [rows] = await db.execute('SELECT * FROM carts WHERE id = ?', [result.insertId]);
        const row = rows[0];
        return {
          id: row.id.toString(),
          cartId: row.cart_id,
          customerId: row.customer_id,
          tableNumber: row.table_number,
          items: parseJSONField(row.items) || [],
          subtotal: parseFloat(row.subtotal),
          tax: parseFloat(row.tax),
          serviceCharge: parseFloat(row.service_charge),
          discount: parseFloat(row.discount),
          total: parseFloat(row.total),
          status: row.status,
          createdAt: row.created_at.toISOString(),
          updatedAt: row.updated_at.toISOString()
        };
      } catch (error) {
        throw new Error(`Error creating cart: ${error.message}`);
      }
    },

    addItemToCart: async (parent, { cartId, item }, context) => {
      // Require authentication
      requireAuth(context);
      try {
        const [cartRows] = await db.execute('SELECT * FROM carts WHERE cart_id = ?', [cartId]);
        if (cartRows.length === 0) {
          throw new Error('Cart not found');
        }

        const cart = cartRows[0];
        const items = parseJSONField(cart.items) || [];

        // Check if item already exists
        const existingItemIndex = items.findIndex(i => i.menuId === item.menuId);
        if (existingItemIndex >= 0) {
          items[existingItemIndex].quantity += item.quantity;
        } else {
          items.push(item);
        }

        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.1;
        const serviceCharge = subtotal * 0.05;
        const total = subtotal + tax + serviceCharge - parseFloat(cart.discount);

        await db.execute(`
          UPDATE carts SET items = ?, subtotal = ?, tax = ?, service_charge = ?, total = ?
          WHERE cart_id = ?
        `, [JSON.stringify(items), subtotal, tax, serviceCharge, total, cartId]);

        const [updatedRows] = await db.execute('SELECT * FROM carts WHERE cart_id = ?', [cartId]);
        const row = updatedRows[0];
        return {
          id: row.id.toString(),
          cartId: row.cart_id,
          customerId: row.customer_id,
          tableNumber: row.table_number,
          items: parseJSONField(row.items) || [],
          subtotal: parseFloat(row.subtotal),
          tax: parseFloat(row.tax),
          serviceCharge: parseFloat(row.service_charge),
          discount: parseFloat(row.discount),
          total: parseFloat(row.total),
          status: row.status,
          createdAt: row.created_at.toISOString(),
          updatedAt: row.updated_at.toISOString()
        };
      } catch (error) {
        throw new Error(`Error adding item to cart: ${error.message}`);
      }
    },

    updateCartItem: async (parent, { cartId, menuId, quantity }, context) => {
      // Require authentication
      requireAuth(context);
      try {
        const [cartRows] = await db.execute('SELECT * FROM carts WHERE cart_id = ?', [cartId]);
        if (cartRows.length === 0) {
          throw new Error('Cart not found');
        }

        const cart = cartRows[0];
        const items = parseJSONField(cart.items) || [];

        const itemIndex = items.findIndex(i => i.menuId === menuId);
        if (itemIndex === -1) {
          throw new Error('Item not found in cart');
        }

        if (quantity <= 0) {
          // Remove item
          items.splice(itemIndex, 1);
        } else {
          // Update quantity
          items[itemIndex].quantity = quantity;
        }

        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.1;
        const serviceCharge = subtotal * 0.05;
        const total = subtotal + tax + serviceCharge - parseFloat(cart.discount);

        await db.execute(`
          UPDATE carts SET items = ?, subtotal = ?, tax = ?, service_charge = ?, total = ?
          WHERE cart_id = ?
        `, [JSON.stringify(items), subtotal, tax, serviceCharge, total, cartId]);

        const [updatedRows] = await db.execute('SELECT * FROM carts WHERE cart_id = ?', [cartId]);
        const row = updatedRows[0];
        return {
          id: row.id.toString(),
          cartId: row.cart_id,
          customerId: row.customer_id,
          tableNumber: row.table_number,
          items: parseJSONField(row.items) || [],
          subtotal: parseFloat(row.subtotal),
          tax: parseFloat(row.tax),
          serviceCharge: parseFloat(row.service_charge),
          discount: parseFloat(row.discount),
          total: parseFloat(row.total),
          status: row.status,
          createdAt: row.created_at.toISOString(),
          updatedAt: row.updated_at.toISOString()
        };
      } catch (error) {
        throw new Error(`Error updating cart item: ${error.message}`);
      }
    },

    createOrder: async (parent, { input }, context) => {
      // Require authentication
      requireAuth(context);
      try {
        const { orderId, customerId, tableNumber, items, paymentMethod, loyaltyPointsUsed, notes } = input;

        // Calculate totals
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.1;
        const serviceCharge = subtotal * 0.05;
        const discount = loyaltyPointsUsed ? (loyaltyPointsUsed * 100) : 0; // 1 point = 100 rupiah
        const total = subtotal + tax + serviceCharge - discount;

        // Create order
        const [result] = await db.execute(`
          INSERT INTO orders (order_id, customer_id, table_number, items, subtotal, tax, service_charge, discount, loyalty_points_used, total, payment_method, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          orderId,
          customerId || null,
          tableNumber || null,
          JSON.stringify(items),
          subtotal,
          tax,
          serviceCharge,
          discount,
          loyaltyPointsUsed || 0,
          total,
          paymentMethod || 'cash',
          notes || null
        ]);

        const orderId_db = result.insertId;

        // Integrate with Kitchen Service
        let kitchenOrderCreated = false;
        try {
          const kitchenQuery = `
            mutation CreateKitchenOrder($input: CreateKitchenOrderInput!) {
              createKitchenOrder(input: $input) {
                id
                orderId
                status
              }
            }
          `;

          await callGraphQLService(KITCHEN_SERVICE_URL, kitchenQuery, {
            input: {
              orderId: orderId,
              tableNumber: tableNumber,
              items: items.map(item => ({
                menuId: item.menuId,
                name: item.name,
                quantity: item.quantity,
                specialInstructions: item.specialInstructions
              })),
              priority: 0
            }
          }, context.token);
          kitchenOrderCreated = true;

          // Update order kitchen status
          await db.execute('UPDATE orders SET kitchen_status = ? WHERE id = ?', ['pending', orderId_db]);
        } catch (error) {
          console.error('Error creating kitchen order:', error.message);
        }

        // Integrate with Inventory Service - reduce stock
        let stockUpdated = false;
        try {
          // Get menu items to check ingredients
          for (const orderItem of items) {
            const [menuRows] = await db.execute('SELECT * FROM menus WHERE menu_id = ?', [orderItem.menuId]);
            if (menuRows.length > 0) {
              const menu = menuRows[0];
              const ingredients = parseJSONField(menu.ingredients) || [];
              for (const ingredient of ingredients) {
                const reduceStockQuery = `
                  mutation ReduceStock($ingredientId: ID!, $quantity: Float!, $reason: String, $referenceId: String, $referenceType: String) {
                    reduceStock(ingredientId: $ingredientId, quantity: $quantity, reason: $reason, referenceId: $referenceId, referenceType: $referenceType) {
                      id
                      quantity
                    }
                  }
                `;

                await callGraphQLService(INVENTORY_SERVICE_URL, reduceStockQuery, {
                  ingredientId: ingredient.ingredientId,
                  quantity: ingredient.quantity * orderItem.quantity,
                  reason: `Order ${orderId}`,
                  referenceId: orderId,
                  referenceType: 'order'
                }, context.token);
              }
            }
          }
          stockUpdated = true;
        } catch (error) {
          console.error('Error updating inventory:', error.message);
        }

        // Integrate with User Service - earn loyalty points
        let loyaltyPointsEarned = 0;
        if (customerId) {
          try {
            // Calculate points (1% of total)
            loyaltyPointsEarned = Math.floor(total * 0.01);

            const earnPointsQuery = `
              mutation EarnPoints($customerId: ID!, $points: Float!, $orderId: String, $description: String) {
                earnPoints(customerId: $customerId, points: $points, orderId: $orderId, description: $description) {
                  id
                  points
                }
              }
            `;

            await callGraphQLService(USER_SERVICE_URL, earnPointsQuery, {
              customerId: customerId,
              points: loyaltyPointsEarned,
              orderId: orderId,
              description: `Points earned from order ${orderId}`
            });

            await db.execute('UPDATE orders SET loyalty_points_earned = ? WHERE id = ?', [loyaltyPointsEarned, orderId_db]);
          } catch (error) {
            console.error('Error earning loyalty points:', error.message);
          }
        }

        const [orderRows] = await db.execute('SELECT * FROM orders WHERE id = ?', [orderId_db]);
        const orderRow = orderRows[0];

        return {
          order: {
            id: orderRow.id.toString(),
            orderId: orderRow.order_id,
            customerId: orderRow.customer_id,
            tableNumber: orderRow.table_number,
            items: parseJSONField(orderRow.items) || [],
            subtotal: parseFloat(orderRow.subtotal),
            tax: parseFloat(orderRow.tax),
            serviceCharge: parseFloat(orderRow.service_charge),
            discount: parseFloat(orderRow.discount),
            loyaltyPointsUsed: parseFloat(orderRow.loyalty_points_used),
            loyaltyPointsEarned: parseFloat(orderRow.loyalty_points_earned),
            total: parseFloat(orderRow.total),
            paymentMethod: orderRow.payment_method,
            paymentStatus: orderRow.payment_status,
            orderStatus: orderRow.order_status,
            kitchenStatus: orderRow.kitchen_status,
            staffId: orderRow.staff_id,
            notes: orderRow.notes,
            createdAt: orderRow.created_at.toISOString(),
            updatedAt: orderRow.updated_at.toISOString(),
            completedAt: orderRow.completed_at ? orderRow.completed_at.toISOString() : null
          },
          kitchenOrderCreated,
          stockUpdated,
          loyaltyPointsEarned,
          message: 'Order created successfully'
        };
      } catch (error) {
        throw new Error(`Error creating order: ${error.message}`);
      }
    },

    createOrderFromCart: async (parent, { cartId, input }) => {
      try {
        const [cartRows] = await db.execute('SELECT * FROM carts WHERE cart_id = ?', [cartId]);
        if (cartRows.length === 0) {
          throw new Error('Cart not found');
        }

        const cart = cartRows[0];
        const items = parseJSONField(cart.items) || [];

        // Create order from cart
        const orderInput = {
          ...input,
          items: items.map(item => ({
            menuId: item.menuId,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            specialInstructions: item.specialInstructions
          }))
        };

        const result = await resolvers.Mutation.createOrder(parent, { input: orderInput });

        // Update cart status
        await db.execute('UPDATE carts SET status = ? WHERE cart_id = ?', ['completed', cartId]);

        return result;
      } catch (error) {
        throw new Error(`Error creating order from cart: ${error.message}`);
      }
    },

    updateOrder: async (parent, { orderId, input }) => {
      try {
        const [orderRows] = await db.execute('SELECT * FROM orders WHERE order_id = ?', [orderId]);
        if (orderRows.length === 0) {
          throw new Error('Order not found');
        }

        const updates = [];
        const params = [];

        if (input.tableNumber !== undefined) {
          updates.push('table_number = ?');
          params.push(input.tableNumber);
        }
        if (input.items !== undefined) {
          const items = input.items;
          const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          const tax = subtotal * 0.1;
          const serviceCharge = subtotal * 0.05;
          const total = subtotal + tax + serviceCharge;

          updates.push('items = ?', 'subtotal = ?', 'tax = ?', 'service_charge = ?', 'total = ?');
          params.push(JSON.stringify(items), subtotal, tax, serviceCharge, total);
        }
        if (input.paymentMethod !== undefined) {
          updates.push('payment_method = ?');
          params.push(input.paymentMethod);
        }
        if (input.notes !== undefined) {
          updates.push('notes = ?');
          params.push(input.notes);
        }

        if (updates.length > 0) {
          params.push(orderId);
          await db.execute(
            `UPDATE orders SET ${updates.join(', ')} WHERE order_id = ?`,
            params
          );
        }

        const [updatedRows] = await db.execute('SELECT * FROM orders WHERE order_id = ?', [orderId]);
        const row = updatedRows[0];
        return {
          id: row.id.toString(),
          orderId: row.order_id,
          customerId: row.customer_id,
          tableNumber: row.table_number,
          items: parseJSONField(row.items) || [],
          subtotal: parseFloat(row.subtotal),
          tax: parseFloat(row.tax),
          serviceCharge: parseFloat(row.service_charge),
          discount: parseFloat(row.discount),
          loyaltyPointsUsed: parseFloat(row.loyalty_points_used),
          loyaltyPointsEarned: parseFloat(row.loyalty_points_earned),
          total: parseFloat(row.total),
          paymentMethod: row.payment_method,
          paymentStatus: row.payment_status,
          orderStatus: row.order_status,
          kitchenStatus: row.kitchen_status,
          staffId: row.staff_id,
          notes: row.notes,
          createdAt: row.created_at.toISOString(),
          updatedAt: row.updated_at.toISOString(),
          completedAt: row.completed_at ? row.completed_at.toISOString() : null
        };
      } catch (error) {
        throw new Error(`Error updating order: ${error.message}`);
      }
    },

    updateOrderStatus: async (parent, { orderId, status }) => {
      try {
        const [orderRows] = await db.execute('SELECT * FROM orders WHERE order_id = ?', [orderId]);
        if (orderRows.length === 0) {
          throw new Error('Order not found');
        }

        await db.execute('UPDATE orders SET order_status = ? WHERE order_id = ?', [status, orderId]);

        // If order is completed, update kitchen service
        if (status === 'completed') {
          try {
            const kitchenOrder = await callGraphQLService(KITCHEN_SERVICE_URL, `
              query GetKitchenOrder($orderId: String!) {
                kitchenOrderByOrderId(orderId: $orderId) {
                  id
                }
              }
            `, { orderId });

            if (kitchenOrder && kitchenOrder.kitchenOrderByOrderId) {
              await callGraphQLService(KITCHEN_SERVICE_URL, `
                mutation CompleteOrder($orderId: ID!) {
                  completeOrder(orderId: $orderId) {
                    id
                    status
                  }
                }
              `, { orderId: kitchenOrder.kitchenOrderByOrderId.id });
            }

            await db.execute('UPDATE orders SET completed_at = NOW() WHERE order_id = ?', [orderId]);
          } catch (error) {
            console.error('Error updating kitchen order:', error.message);
          }
        }

        const [updatedRows] = await db.execute('SELECT * FROM orders WHERE order_id = ?', [orderId]);
        const row = updatedRows[0];
        return {
          id: row.id.toString(),
          orderId: row.order_id,
          customerId: row.customer_id,
          tableNumber: row.table_number,
          items: parseJSONField(row.items) || [],
          subtotal: parseFloat(row.subtotal),
          tax: parseFloat(row.tax),
          serviceCharge: parseFloat(row.service_charge),
          discount: parseFloat(row.discount),
          loyaltyPointsUsed: parseFloat(row.loyalty_points_used),
          loyaltyPointsEarned: parseFloat(row.loyalty_points_earned),
          total: parseFloat(row.total),
          paymentMethod: row.payment_method,
          paymentStatus: row.payment_status,
          orderStatus: row.order_status,
          kitchenStatus: row.kitchen_status,
          staffId: row.staff_id,
          notes: row.notes,
          createdAt: row.created_at.toISOString(),
          updatedAt: row.updated_at.toISOString(),
          completedAt: row.completed_at ? row.completed_at.toISOString() : null
        };
      } catch (error) {
        throw new Error(`Error updating order status: ${error.message}`);
      }
    },

    sendToKitchen: async (parent, { orderId }) => {
      try {
        const [orderRows] = await db.execute('SELECT * FROM orders WHERE order_id = ?', [orderId]);
        if (orderRows.length === 0) {
          throw new Error('Order not found');
        }

        const order = orderRows[0];
        const items = parseJSONField(order.items) || [];

        // Create kitchen order if not exists
        try {
          const kitchenQuery = `
            mutation CreateKitchenOrder($input: CreateKitchenOrderInput!) {
              createKitchenOrder(input: $input) {
                id
                orderId
                status
              }
            }
          `;

          await callGraphQLService(KITCHEN_SERVICE_URL, kitchenQuery, {
            input: {
              orderId: order.order_id,
              tableNumber: order.table_number,
              items: items.map(item => ({
                menuId: item.menuId,
                name: item.name,
                quantity: item.quantity,
                specialInstructions: item.specialInstructions
              })),
              priority: 0
            }
          });

          await db.execute('UPDATE orders SET kitchen_status = ?, order_status = ? WHERE order_id = ?',
            ['pending', 'preparing', orderId]);
        } catch (error) {
          throw new Error(`Error sending to kitchen: ${error.message}`);
        }

        const [updatedRows] = await db.execute('SELECT * FROM orders WHERE order_id = ?', [orderId]);
        const row = updatedRows[0];
        return {
          id: row.id.toString(),
          orderId: row.order_id,
          customerId: row.customer_id,
          tableNumber: row.table_number,
          items: parseJSONField(row.items) || [],
          subtotal: parseFloat(row.subtotal),
          tax: parseFloat(row.tax),
          serviceCharge: parseFloat(row.service_charge),
          discount: parseFloat(row.discount),
          loyaltyPointsUsed: parseFloat(row.loyalty_points_used),
          loyaltyPointsEarned: parseFloat(row.loyalty_points_earned),
          total: parseFloat(row.total),
          paymentMethod: row.payment_method,
          paymentStatus: row.payment_status,
          orderStatus: row.order_status,
          kitchenStatus: row.kitchen_status,
          staffId: row.staff_id,
          notes: row.notes,
          createdAt: row.created_at.toISOString(),
          updatedAt: row.updated_at.toISOString(),
          completedAt: row.completed_at ? row.completed_at.toISOString() : null
        };
      } catch (error) {
        throw new Error(`Error sending to kitchen: ${error.message}`);
      }
    }
  }
};

module.exports = resolvers;
