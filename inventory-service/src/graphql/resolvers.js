const tokoSembakoClient = require('../services/tokoSembakoClient');
const { requireAuth, requireMinRole } = require('../auth');

const resolvers = {
  Query: {
    suppliers: async (parent, { status }, { db }) => {
      try {
        let query = 'SELECT * FROM suppliers';
        const params = [];

        if (status) {
          query += ' WHERE status = ?';
          params.push(status);
        }

        query += ' ORDER BY name';

        const [suppliers] = await db.execute(query, params);
        return suppliers.map(supplier => ({
          ...supplier,
          id: supplier.id.toString()
        }));
      } catch (error) {
        throw new Error(`Error fetching suppliers: ${error.message}`);
      }
    },

    supplier: async (parent, { id }, { db }) => {
      try {
        const [suppliers] = await db.execute('SELECT * FROM suppliers WHERE id = ?', [id]);
        if (suppliers.length === 0) {
          throw new Error('Supplier not found');
        }
        return {
          ...suppliers[0],
          id: suppliers[0].id.toString()
        };
      } catch (error) {
        throw new Error(`Error fetching supplier: ${error.message}`);
      }
    },

    ingredients: async (parent, { category, status }, { db }) => {
      try {
        let query = 'SELECT * FROM ingredients';
        const conditions = [];
        const params = [];

        if (category) {
          conditions.push('category = ?');
          params.push(category);
        }

        if (status) {
          conditions.push('status = ?');
          params.push(status);
        }

        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY name';

        const [ingredients] = await db.execute(query, params);
        return ingredients.map(ingredient => ({
          ...ingredient,
          id: ingredient.id.toString(),
          minStockLevel: parseFloat(ingredient.min_stock_level),
          currentStock: parseFloat(ingredient.current_stock),
          costPerUnit: parseFloat(ingredient.cost_per_unit)
        }));
      } catch (error) {
        throw new Error(`Error fetching ingredients: ${error.message}`);
      }
    },

    ingredient: async (parent, { id }, { db }) => {
      try {
        const [ingredients] = await db.execute('SELECT * FROM ingredients WHERE id = ?', [id]);
        if (ingredients.length === 0) {
          throw new Error('Ingredient not found');
        }
        const ingredient = ingredients[0];
        return {
          ...ingredient,
          id: ingredient.id.toString(),
          minStockLevel: parseFloat(ingredient.min_stock_level),
          currentStock: parseFloat(ingredient.current_stock),
          costPerUnit: parseFloat(ingredient.cost_per_unit)
        };
      } catch (error) {
        throw new Error(`Error fetching ingredient: ${error.message}`);
      }
    },

    lowStockIngredients: async (parent, args, { db }) => {
      try {
        const [ingredients] = await db.execute(
          `SELECT * FROM ingredients 
           WHERE current_stock <= min_stock_level 
           AND status != 'inactive'
           ORDER BY (current_stock / min_stock_level) ASC`
        );
        return ingredients.map(ingredient => ({
          ...ingredient,
          id: ingredient.id.toString(),
          minStockLevel: parseFloat(ingredient.min_stock_level),
          currentStock: parseFloat(ingredient.current_stock),
          costPerUnit: parseFloat(ingredient.cost_per_unit)
        }));
      } catch (error) {
        throw new Error(`Error fetching low stock ingredients: ${error.message}`);
      }
    },

    outOfStockIngredients: async (parent, args, { db }) => {
      try {
        const [ingredients] = await db.execute(
          `SELECT * FROM ingredients 
           WHERE current_stock <= 0 
           AND status != 'inactive'
           ORDER BY name`
        );
        return ingredients.map(ingredient => ({
          ...ingredient,
          id: ingredient.id.toString(),
          minStockLevel: parseFloat(ingredient.min_stock_level),
          currentStock: parseFloat(ingredient.current_stock),
          costPerUnit: parseFloat(ingredient.cost_per_unit)
        }));
      } catch (error) {
        throw new Error(`Error fetching out of stock ingredients: ${error.message}`);
      }
    },

    stockMovements: async (parent, { ingredientId, movementType }, { db }) => {
      try {
        let query = 'SELECT * FROM stock_movements';
        const conditions = [];
        const params = [];

        if (ingredientId) {
          conditions.push('ingredient_id = ?');
          params.push(ingredientId);
        }

        if (movementType) {
          conditions.push('movement_type = ?');
          params.push(movementType);
        }

        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY created_at DESC LIMIT 100';

        const [movements] = await db.execute(query, params);
        return movements.map(movement => ({
          ...movement,
          id: movement.id.toString(),
          quantity: parseFloat(movement.quantity)
        }));
      } catch (error) {
        throw new Error(`Error fetching stock movements: ${error.message}`);
      }
    },

    purchaseOrders: async (parent, { status }, { db }) => {
      try {
        let query = 'SELECT * FROM purchase_orders';
        const params = [];

        if (status) {
          query += ' WHERE status = ?';
          params.push(status);
        }

        query += ' ORDER BY created_at DESC';

        const [orders] = await db.execute(query, params);
        return orders.map(order => ({
          ...order,
          id: order.id.toString(),
          totalAmount: parseFloat(order.total_amount)
        }));
      } catch (error) {
        throw new Error(`Error fetching purchase orders: ${error.message}`);
      }
    },

    purchaseOrder: async (parent, { id }, { db }) => {
      try {
        const [orders] = await db.execute('SELECT * FROM purchase_orders WHERE id = ?', [id]);
        if (orders.length === 0) {
          throw new Error('Purchase order not found');
        }
        return {
          ...orders[0],
          id: orders[0].id.toString(),
          totalAmount: parseFloat(orders[0].total_amount)
        };
      } catch (error) {
        throw new Error(`Error fetching purchase order: ${error.message}`);
      }
    },

    checkStock: async (parent, { ingredientId, quantity }, { db }) => {
      try {
        const [ingredients] = await db.execute('SELECT * FROM ingredients WHERE id = ?', [ingredientId]);
        if (ingredients.length === 0) {
          throw new Error('Ingredient not found');
        }

        const ingredient = ingredients[0];
        const currentStock = parseFloat(ingredient.current_stock);
        const available = currentStock >= quantity;

        return {
          available,
          currentStock,
          requestedQuantity: quantity,
          message: available
            ? `Stock tersedia: ${currentStock} ${ingredient.unit}`
            : `Stock tidak cukup. Tersedia: ${currentStock} ${ingredient.unit}, Dibutuhkan: ${quantity} ${ingredient.unit}`
        };
      } catch (error) {
        throw new Error(`Error checking stock: ${error.message}`);
      }
    },

    // Toko Sembako Integration Queries
    tokoSembakoProducts: async (parent, { category }) => {
      try {
        const products = await tokoSembakoClient.getProductsFromTokoSembako(category);
        return products;
      } catch (error) {
        throw new Error(`Error fetching products from Toko Sembako: ${error.message}`);
      }
    },

    tokoSembakoProduct: async (parent, { id }) => {
      try {
        const product = await tokoSembakoClient.getProductByIdFromTokoSembako(id);
        if (!product) {
          throw new Error('Product not found in Toko Sembako');
        }
        return product;
      } catch (error) {
        throw new Error(`Error fetching product from Toko Sembako: ${error.message}`);
      }
    },

    checkTokoSembakoStock: async (parent, { productId, quantity }) => {
      try {
        const stockCheck = await tokoSembakoClient.checkStockFromTokoSembako(productId, quantity);
        return stockCheck;
      } catch (error) {
        throw new Error(`Error checking stock from Toko Sembako: ${error.message}`);
      }
    },

    tokoSembakoOrderStatus: async (parent, { orderId }) => {
      try {
        const order = await tokoSembakoClient.getOrderStatusFromTokoSembako(orderId);
        return order;
      } catch (error) {
        throw new Error(`Error fetching order status from Toko Sembako: ${error.message}`);
      }
    }
  },

  Mutation: {
    createSupplier: async (parent, { input }, { db }) => {
      try {
        const { name, contactPerson, email, phone, address } = input;
        const [result] = await db.execute(
          `INSERT INTO suppliers (name, contact_person, email, phone, address)
           VALUES (?, ?, ?, ?, ?)`,
          [name || null, contactPerson || null, email || null, phone || null, address || null]
        );

        const [suppliers] = await db.execute('SELECT * FROM suppliers WHERE id = ?', [result.insertId]);
        return {
          ...suppliers[0],
          id: suppliers[0].id.toString()
        };
      } catch (error) {
        throw new Error(`Error creating supplier: ${error.message}`);
      }
    },

    createIngredient: async (parent, { input }, { db }) => {
      try {
        const { name, unit, category, minStockLevel, currentStock, supplierId, costPerUnit } = input;
        const [result] = await db.execute(
          `INSERT INTO ingredients (name, unit, category, min_stock_level, current_stock, supplier_id, cost_per_unit, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
          [
            name || null,
            unit || null,
            category || null,
            minStockLevel || 0,
            currentStock || 0,
            supplierId || null,
            costPerUnit || 0
          ]
        );

        const [ingredients] = await db.execute('SELECT * FROM ingredients WHERE id = ?', [result.insertId]);
        const ingredient = ingredients[0];
        return {
          ...ingredient,
          id: ingredient.id.toString(),
          minStockLevel: parseFloat(ingredient.min_stock_level),
          currentStock: parseFloat(ingredient.current_stock),
          costPerUnit: parseFloat(ingredient.cost_per_unit)
        };
      } catch (error) {
        throw new Error(`Error creating ingredient: ${error.message}`);
      }
    },

    updateIngredient: async (parent, { id, input }, { db }) => {
      try {
        const { name, unit, category, minStockLevel, supplierId, costPerUnit, status } = input;

        let query = 'UPDATE ingredients SET ';
        const params = [];
        const updates = [];

        if (name !== undefined) { updates.push('name = ?'); params.push(name); }
        if (unit !== undefined) { updates.push('unit = ?'); params.push(unit); }
        if (category !== undefined) { updates.push('category = ?'); params.push(category); }
        if (minStockLevel !== undefined) { updates.push('min_stock_level = ?'); params.push(minStockLevel); }
        if (supplierId !== undefined) { updates.push('supplier_id = ?'); params.push(supplierId); }
        if (costPerUnit !== undefined) { updates.push('cost_per_unit = ?'); params.push(costPerUnit); }
        if (status !== undefined) { updates.push('status = ?'); params.push(status); }

        if (updates.length > 0) {
          query += updates.join(', ');
          query += ' WHERE id = ?';
          params.push(id);

          await db.execute(query, params);
        }

        const [ingredients] = await db.execute('SELECT * FROM ingredients WHERE id = ?', [id]);
        if (ingredients.length === 0) throw new Error('Ingredient not found');

        const ingredient = ingredients[0];
        return {
          id: ingredient.id.toString(),
          name: ingredient.name,
          unit: ingredient.unit,
          category: ingredient.category,
          minStockLevel: parseFloat(ingredient.min_stock_level) || 0,
          currentStock: parseFloat(ingredient.current_stock) || 0,
          costPerUnit: parseFloat(ingredient.cost_per_unit) || 0,
          status: ingredient.status || 'active',
          createdAt: ingredient.created_at ? ingredient.created_at.toISOString() : new Date().toISOString(),
          updatedAt: ingredient.updated_at ? ingredient.updated_at.toISOString() : new Date().toISOString()
        };
      } catch (error) {
        throw new Error(`Error updating ingredient: ${error.message}`);
      }
    },

    addStock: async (parent, { ingredientId, quantity, reason }, { db }) => {
      try {
        // Start transaction
        await db.query('START TRANSACTION');

        // Update stock
        await db.execute(
          'UPDATE ingredients SET current_stock = current_stock + ? WHERE id = ?',
          [quantity, ingredientId]
        );

        // Update status if was out of stock
        await db.execute(
          `UPDATE ingredients 
           SET status = CASE 
             WHEN current_stock > 0 THEN 'active' 
             ELSE status 
           END 
           WHERE id = ?`,
          [ingredientId]
        );

        // Create stock movement
        const [result] = await db.execute(
          `INSERT INTO stock_movements (ingredient_id, movement_type, quantity, reason)
           VALUES (?, 'in', ?, ?)`,
          [ingredientId, quantity, reason]
        );

        await db.query('COMMIT');

        const [movements] = await db.execute('SELECT * FROM stock_movements WHERE id = ?', [result.insertId]);
        return {
          ...movements[0],
          id: movements[0].id.toString(),
          quantity: parseFloat(movements[0].quantity)
        };
      } catch (error) {
        await db.query('ROLLBACK');
        throw new Error(`Error adding stock: ${error.message}`);
      }
    },

    reduceStock: async (parent, { ingredientId, quantity, reason, referenceId, referenceType }, { db }) => {
      try {
        // Check stock availability
        const [ingredients] = await db.execute('SELECT * FROM ingredients WHERE id = ?', [ingredientId]);
        if (ingredients.length === 0) {
          throw new Error('Ingredient not found');
        }

        const currentStock = parseFloat(ingredients[0].current_stock);
        if (currentStock < quantity) {
          throw new Error(`Insufficient stock. Available: ${currentStock}, Requested: ${quantity}`);
        }

        // Start transaction
        await db.query('START TRANSACTION');

        // Update stock
        await db.execute(
          'UPDATE ingredients SET current_stock = current_stock - ? WHERE id = ?',
          [quantity, ingredientId]
        );

        // Update status if out of stock
        await db.execute(
          `UPDATE ingredients 
           SET status = CASE 
             WHEN current_stock <= 0 THEN 'out_of_stock' 
             ELSE status 
           END 
           WHERE id = ?`,
          [ingredientId]
        );

        // Create stock movement
        const [result] = await db.execute(
          `INSERT INTO stock_movements (ingredient_id, movement_type, quantity, reason, reference_id, reference_type)
           VALUES (?, 'out', ?, ?, ?, ?)`,
          [ingredientId, quantity, reason, referenceId, referenceType]
        );

        await db.query('COMMIT');

        const [movements] = await db.execute('SELECT * FROM stock_movements WHERE id = ?', [result.insertId]);
        return {
          ...movements[0],
          id: movements[0].id.toString(),
          quantity: parseFloat(movements[0].quantity)
        };
      } catch (error) {
        await db.query('ROLLBACK');
        throw new Error(`Error reducing stock: ${error.message}`);
      }
    },

    createPurchaseOrder: async (parent, { input }, { db }) => {
      try {
        const { supplierId, orderNumber, orderDate, expectedDeliveryDate, notes, items } = input;

        // Start transaction
        await db.query('START TRANSACTION');

        // Calculate total
        let totalAmount = 0;
        for (const item of items) {
          totalAmount += item.quantity * item.unitPrice;
        }

        // Create purchase order
        const [orderResult] = await db.execute(
          `INSERT INTO purchase_orders (supplier_id, order_number, order_date, expected_delivery_date, notes, total_amount)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [supplierId, orderNumber, orderDate, expectedDeliveryDate, notes, totalAmount]
        );

        // Create purchase order items
        for (const item of items) {
          await db.execute(
            `INSERT INTO purchase_order_items (purchase_order_id, ingredient_id, quantity, unit_price, total_price)
             VALUES (?, ?, ?, ?, ?)`,
            [orderResult.insertId, item.ingredientId, item.quantity, item.unitPrice, item.quantity * item.unitPrice]
          );
        }

        await db.query('COMMIT');

        const [orders] = await db.execute('SELECT * FROM purchase_orders WHERE id = ?', [orderResult.insertId]);
        return {
          ...orders[0],
          id: orders[0].id.toString(),
          totalAmount: parseFloat(orders[0].total_amount)
        };
      } catch (error) {
        await db.query('ROLLBACK');
        throw new Error(`Error creating purchase order: ${error.message}`);
      }
    },

    updatePurchaseOrderStatus: async (parent, { id, status }, { db }) => {
      try {
        await db.execute(
          'UPDATE purchase_orders SET status = ? WHERE id = ?',
          [status, id]
        );

        const [orders] = await db.execute('SELECT * FROM purchase_orders WHERE id = ?', [id]);
        if (orders.length === 0) {
          throw new Error('Purchase order not found');
        }

        return {
          ...orders[0],
          id: orders[0].id.toString(),
          totalAmount: parseFloat(orders[0].total_amount)
        };
      } catch (error) {
        throw new Error(`Error updating purchase order status: ${error.message}`);
      }
    },

    receivePurchaseOrder: async (parent, { id }, { db }) => {
      try {
        // Start transaction
        await db.query('START TRANSACTION');

        // Get purchase order items
        const [items] = await db.execute(
          'SELECT * FROM purchase_order_items WHERE purchase_order_id = ?',
          [id]
        );

        // Update received quantities and add stock
        for (const item of items) {
          // Mark as fully received
          await db.execute(
            'UPDATE purchase_order_items SET received_quantity = quantity WHERE id = ?',
            [item.id]
          );

          // Add stock
          await db.execute(
            'UPDATE ingredients SET current_stock = current_stock + ? WHERE id = ?',
            [item.quantity, item.ingredient_id]
          );

          // Update ingredient status
          await db.execute(
            `UPDATE ingredients 
             SET status = CASE 
               WHEN current_stock > 0 THEN 'active' 
               ELSE status 
             END 
             WHERE id = ?`,
            [item.ingredient_id]
          );

          // Create stock movement
          await db.execute(
            `INSERT INTO stock_movements (ingredient_id, movement_type, quantity, reason, reference_id, reference_type)
             VALUES (?, 'in', ?, ?, ?, ?)`,
            [item.ingredient_id, item.quantity, `Purchase order ${id}`, id.toString(), 'purchase_order']
          );
        }

        // Update purchase order status
        await db.execute(
          'UPDATE purchase_orders SET status = "received", received_date = CURRENT_DATE WHERE id = ?',
          [id]
        );

        await db.query('COMMIT');

        const [orders] = await db.execute('SELECT * FROM purchase_orders WHERE id = ?', [id]);
        return {
          ...orders[0],
          id: orders[0].id.toString(),
          totalAmount: parseFloat(orders[0].total_amount)
        };
      } catch (error) {
        await db.query('ROLLBACK');
        throw new Error(`Error receiving purchase order: ${error.message}`);
      }
    },

    // Toko Sembako Integration Mutations
    purchaseFromTokoSembako: async (parent, { input }, { db }) => {
      try {
        const { orderNumber, items, notes } = input;

        // 1. Check stock availability untuk semua items
        const stockChecks = [];
        for (const item of items) {
          const stockCheck = await tokoSembakoClient.checkStockFromTokoSembako(item.productId, item.quantity);
          stockChecks.push({
            productId: item.productId,
            ...stockCheck
          });

          if (!stockCheck.available) {
            throw new Error(`Stock tidak tersedia untuk product ${item.productId}: ${stockCheck.message}`);
          }
        }

        // 2. Get product details untuk mendapatkan harga
        const productDetails = [];
        for (const item of items) {
          const product = await tokoSembakoClient.getProductByIdFromTokoSembako(item.productId);
          if (!product) {
            throw new Error(`Product ${item.productId} tidak ditemukan`);
          }
          productDetails.push({
            ...item,
            name: product.name,
            price: product.price,
            unit: product.unit
          });
        }

        // 3. Create order di Toko Sembako
        let tokoSembakoOrder = null;
        try {
          tokoSembakoOrder = await tokoSembakoClient.createOrderAtTokoSembako({
            orderId: orderNumber,
            items: productDetails.map(item => ({
              productId: item.productId,
              name: item.name,
              quantity: item.quantity,
              price: item.price
            })),
            notes: notes || `Purchase order from Anugerah Resto: ${orderNumber}`
          });
        } catch (error) {
          console.error('Error creating order at Toko Sembako:', error.message);
          throw new Error(`Gagal membuat order di Toko Sembako: ${error.message}`);
        }

        // 4. Create purchase order di database lokal
        // Cari atau buat supplier untuk Toko Sembako
        let [suppliers] = await db.execute('SELECT * FROM suppliers WHERE name = ?', ['Toko Sembako']);
        let supplierId;

        if (suppliers.length === 0) {
          // Create supplier untuk Toko Sembako
          const [result] = await db.execute(
            'INSERT INTO suppliers (name, status) VALUES (?, "active")',
            ['Toko Sembako']
          );
          supplierId = result.insertId;
        } else {
          supplierId = suppliers[0].id;
        }

        // Calculate total
        let totalAmount = 0;
        for (const item of productDetails) {
          totalAmount += item.price * item.quantity;
        }

        // Start transaction
        await db.query('START TRANSACTION');

        // Create purchase order
        const [orderResult] = await db.execute(
          `INSERT INTO purchase_orders (supplier_id, order_number, total_amount, status, notes)
           VALUES (?, ?, ?, 'ordered', ?)`,
          [supplierId, orderNumber, totalAmount, notes || `Order from Toko Sembako: ${tokoSembakoOrder.orderId}`]
        );

        // Create purchase order items dan sync ke ingredients
        let stockAdded = false;
        for (const item of productDetails) {
          // Find or create ingredient
          let [ingredients] = await db.execute('SELECT * FROM ingredients WHERE name = ?', [item.name]);
          let ingredientId;

          if (ingredients.length === 0) {
            // Create new ingredient
            const [ingResult] = await db.execute(
              `INSERT INTO ingredients (name, unit, category, min_stock_level, current_stock, supplier_id, cost_per_unit, status)
               VALUES (?, ?, 'Vegetable', 10, 0, ?, ?, 'active')`,
              [item.name, item.unit, supplierId, item.price]
            );
            ingredientId = ingResult.insertId;
          } else {
            ingredientId = ingredients[0].id;
          }

          // Create purchase order item
          const totalPrice = item.quantity * item.price;
          await db.execute(
            `INSERT INTO purchase_order_items (purchase_order_id, ingredient_id, quantity, unit_price, total_price)
             VALUES (?, ?, ?, ?, ?)`,
            [orderResult.insertId, ingredientId, item.quantity, item.price, totalPrice]
          );

          // Add stock immediately (karena order sudah dibuat di Toko Sembako)
          await db.execute(
            'UPDATE ingredients SET current_stock = current_stock + ? WHERE id = ?',
            [item.quantity, ingredientId]
          );

          // Update status
          await db.execute(
            `UPDATE ingredients 
             SET status = CASE 
               WHEN current_stock > 0 THEN 'active' 
               ELSE status 
             END 
             WHERE id = ?`,
            [ingredientId]
          );

          // Create stock movement
          await db.execute(
            `INSERT INTO stock_movements (ingredient_id, movement_type, quantity, reason, reference_id, reference_type)
             VALUES (?, 'in', ?, ?, ?, ?)`,
            [ingredientId, item.quantity, `Purchase from Toko Sembako: ${orderNumber}`, tokoSembakoOrder.orderId, 'toko_sembako_order']
          );

          stockAdded = true;
        }

        await db.query('COMMIT');

        // Get created purchase order
        const [orders] = await db.execute('SELECT * FROM purchase_orders WHERE id = ?', [orderResult.insertId]);
        const po = orders[0];

        return {
          success: true,
          message: `Order berhasil dibuat di Toko Sembako dan stock telah ditambahkan`,
          purchaseOrder: {
            id: po.id.toString(),
            orderNumber: po.order_number,
            status: po.status,
            totalAmount: parseFloat(po.total_amount),
            orderDate: po.order_date ? po.order_date.toISOString() : null,
            expectedDeliveryDate: po.expected_delivery_date ? po.expected_delivery_date.toISOString() : null,
            receivedDate: po.received_date ? po.received_date.toISOString() : null,
            notes: po.notes,
            createdAt: po.created_at ? po.created_at.toISOString() : new Date().toISOString(),
            updatedAt: po.updated_at ? po.updated_at.toISOString() : new Date().toISOString()
          },
          tokoSembakoOrder: tokoSembakoOrder,
          stockAdded: stockAdded
        };
      } catch (error) {
        await db.query('ROLLBACK');
        throw new Error(`Error purchasing from Toko Sembako: ${error.message}`);
      }
    },

    syncStockFromTokoSembako: async (parent, { productId, quantity }, { db }) => {
      try {
        // Get product from Toko Sembako
        const product = await tokoSembakoClient.getProductByIdFromTokoSembako(productId);
        if (!product) {
          throw new Error('Product not found in Toko Sembako');
        }

        // Check stock
        const stockCheck = await tokoSembakoClient.checkStockFromTokoSembako(productId, quantity);
        if (!stockCheck.available) {
          throw new Error(`Stock tidak tersedia: ${stockCheck.message}`);
        }

        // Find or create ingredient
        let [ingredients] = await db.execute('SELECT * FROM ingredients WHERE name = ?', [product.name]);
        let ingredientId;

        if (ingredients.length === 0) {
          // Find Toko Sembako supplier
          let [suppliers] = await db.execute('SELECT * FROM suppliers WHERE name = ?', ['Toko Sembako']);
          let supplierId;

          if (suppliers.length === 0) {
            const [supResult] = await db.execute(
              'INSERT INTO suppliers (name, status) VALUES (?, "active")',
              ['Toko Sembako']
            );
            supplierId = supResult.insertId;
          } else {
            supplierId = suppliers[0].id;
          }

          // Create new ingredient
          const [ingResult] = await db.execute(
            `INSERT INTO ingredients (name, unit, category, min_stock_level, current_stock, supplier_id, cost_per_unit, status)
             VALUES (?, ?, 'Vegetable', 10, 0, ?, ?, 'active')`,
            [product.name, product.unit, supplierId, product.price]
          );
          ingredientId = ingResult.insertId;
        } else {
          ingredientId = ingredients[0].id;
        }

        // Start transaction
        await db.query('START TRANSACTION');

        // Add stock
        await db.execute(
          'UPDATE ingredients SET current_stock = current_stock + ? WHERE id = ?',
          [quantity, ingredientId]
        );

        // Update status
        await db.execute(
          `UPDATE ingredients 
           SET status = CASE 
             WHEN current_stock > 0 THEN 'active' 
             ELSE status 
           END 
           WHERE id = ?`,
          [ingredientId]
        );

        // Create stock movement
        const [result] = await db.execute(
          `INSERT INTO stock_movements (ingredient_id, movement_type, quantity, reason, reference_id, reference_type)
           VALUES (?, 'in', ?, ?, ?, ?)`,
          [ingredientId, quantity, `Sync from Toko Sembako product ${productId}`, productId, 'toko_sembako_product']
        );

        await db.query('COMMIT');

        const [movements] = await db.execute('SELECT * FROM stock_movements WHERE id = ?', [result.insertId]);
        return {
          ...movements[0],
          id: movements[0].id.toString(),
          quantity: parseFloat(movements[0].quantity)
        };
      } catch (error) {
        await db.query('ROLLBACK');
        throw new Error(`Error syncing stock from Toko Sembako: ${error.message}`);
      }
    }
  },

  Ingredient: {
    supplier: async (parent, args, { db }) => {
      if (!parent.supplier_id) return null;
      try {
        const [suppliers] = await db.execute('SELECT * FROM suppliers WHERE id = ?', [parent.supplier_id]);
        if (suppliers.length === 0) return null;
        return {
          ...suppliers[0],
          id: suppliers[0].id.toString()
        };
      } catch (error) {
        return null;
      }
    }
  },

  StockMovement: {
    ingredient: async (parent, args, { db }) => {
      try {
        const [ingredients] = await db.execute('SELECT * FROM ingredients WHERE id = ?', [parent.ingredient_id]);
        if (ingredients.length === 0) return null;
        const ingredient = ingredients[0];
        return {
          ...ingredient,
          id: ingredient.id.toString(),
          minStockLevel: parseFloat(ingredient.min_stock_level),
          currentStock: parseFloat(ingredient.current_stock),
          costPerUnit: parseFloat(ingredient.cost_per_unit)
        };
      } catch (error) {
        return null;
      }
    }
  },

  PurchaseOrder: {
    supplier: async (parent, args, { db }) => {
      try {
        const [suppliers] = await db.execute('SELECT * FROM suppliers WHERE id = ?', [parent.supplier_id]);
        if (suppliers.length === 0) return null;
        return {
          ...suppliers[0],
          id: suppliers[0].id.toString()
        };
      } catch (error) {
        return null;
      }
    },
    items: async (parent, args, { db }) => {
      try {
        const [items] = await db.execute(
          'SELECT * FROM purchase_order_items WHERE purchase_order_id = ?',
          [parent.id]
        );
        return items.map(item => ({
          ...item,
          id: item.id.toString(),
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unit_price),
          totalPrice: parseFloat(item.total_price),
          receivedQuantity: parseFloat(item.received_quantity)
        }));
      } catch (error) {
        return [];
      }
    }
  },

  PurchaseOrderItem: {
    ingredient: async (parent, args, { db }) => {
      try {
        const [ingredients] = await db.execute('SELECT * FROM ingredients WHERE id = ?', [parent.ingredient_id]);
        if (ingredients.length === 0) return null;
        const ingredient = ingredients[0];
        return {
          ...ingredient,
          id: ingredient.id.toString(),
          minStockLevel: parseFloat(ingredient.min_stock_level),
          currentStock: parseFloat(ingredient.current_stock),
          costPerUnit: parseFloat(ingredient.cost_per_unit)
        };
      } catch (error) {
        return null;
      }
    }
  }
};

module.exports = resolvers;

