/**
 * Anugerah Resto Provider API
 * REST endpoints untuk dikonsumsi oleh Toko Sembako via ngrok
 */
const express = require('express');
const router = express.Router();
const db = require('../database/connection');

/**
 * GET /api/restaurant
 * Info restoran untuk partner Toko Sembako
 */
router.get('/api/restaurant', (req, res) => {
    res.json({
        id: 'anugerah-resto',
        name: 'Anugerah Resto',
        description: 'Restaurant Management System - Tugas Besar IAE',
        address: 'Bandung, Indonesia',
        type: 'Restaurant',
        status: 'active',
        services: ['inventory', 'kitchen', 'order'],
        integration: {
            version: '1.0.0',
            endpoints: [
                'GET /api/restaurant',
                'GET /api/ingredient-needs',
                'GET /api/consumption-report',
                'GET /api/ingredients',
                'POST /api/webhooks/order-delivered'
            ]
        }
    });
});

/**
 * GET /api/ingredient-needs
 * Kebutuhan ingredient yang perlu dibeli dari Toko Sembako
 */
router.get('/api/ingredient-needs', async (req, res) => {
    try {
        // Get low stock ingredients
        const [lowStock] = await db.execute(`
      SELECT 
        id, 
        name, 
        current_stock as currentStock, 
        min_stock_level as minStockLevel, 
        unit, 
        category,
        cost_per_unit as costPerUnit
      FROM ingredients 
      WHERE current_stock < min_stock_level AND status = 'active'
      ORDER BY (min_stock_level - current_stock) DESC
    `);

        // Get out of stock ingredients
        const [outOfStock] = await db.execute(`
      SELECT 
        id, 
        name, 
        current_stock as currentStock, 
        min_stock_level as minStockLevel,
        unit, 
        category
      FROM ingredients 
      WHERE current_stock = 0 OR status = 'out_of_stock'
    `);

        res.json({
            success: true,
            lowStock,
            outOfStock,
            summary: {
                lowStockCount: lowStock.length,
                outOfStockCount: outOfStock.length,
                urgentPurchaseNeeded: outOfStock.length > 0
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching ingredient needs:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/consumption-report
 * Laporan konsumsi bahan untuk analisis Toko Sembako
 */
router.get('/api/consumption-report', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;

        // Get consumption data
        const [consumptions] = await db.execute(`
      SELECT 
        i.id,
        i.name, 
        i.unit,
        i.category,
        SUM(CASE WHEN sm.movement_type = 'out' THEN sm.quantity ELSE 0 END) as totalConsumed,
        SUM(CASE WHEN sm.movement_type = 'in' THEN sm.quantity ELSE 0 END) as totalReceived,
        COUNT(sm.id) as movementCount
      FROM ingredients i
      LEFT JOIN stock_movements sm ON i.id = sm.ingredient_id 
        AND sm.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY i.id
      HAVING totalConsumed > 0 OR totalReceived > 0
      ORDER BY totalConsumed DESC
    `, [days]);

        // Get top consumed
        const topConsumed = consumptions.slice(0, 10);

        res.json({
            success: true,
            period: `last_${days}_days`,
            periodStart: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
            periodEnd: new Date().toISOString(),
            consumptions,
            topConsumed,
            summary: {
                totalItems: consumptions.length,
                totalConsumed: consumptions.reduce((sum, c) => sum + parseFloat(c.totalConsumed || 0), 0),
                totalReceived: consumptions.reduce((sum, c) => sum + parseFloat(c.totalReceived || 0), 0)
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching consumption report:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/ingredients
 * Daftar semua ingredients untuk referensi Toko Sembako
 */
router.get('/api/ingredients', async (req, res) => {
    try {
        const category = req.query.category;

        let query = `
      SELECT 
        id, 
        name, 
        unit, 
        category, 
        current_stock as currentStock,
        min_stock_level as minStockLevel,
        cost_per_unit as costPerUnit,
        status
      FROM ingredients
      WHERE status != 'inactive'
    `;

        const params = [];
        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        query += ' ORDER BY category, name';

        const [ingredients] = await db.execute(query, params);

        res.json({
            success: true,
            count: ingredients.length,
            ingredients,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching ingredients:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/webhooks/order-delivered
 * Webhook untuk menerima notifikasi order dari Toko Sembako telah dikirim
 */
router.post('/api/webhooks/order-delivered', async (req, res) => {
    try {
        const { orderId, status, items, deliveredAt, totalAmount } = req.body;

        console.log(`📦 [Toko Sembako Webhook] Order ${orderId} - Status: ${status}`);

        if (!orderId || !items || !Array.isArray(items)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid webhook payload. Required: orderId, items[]'
            });
        }

        const processedItems = [];

        // Process each item - add stock for delivered items
        for (const item of items) {
            try {
                // Find matching ingredient by name (fuzzy match)
                const [ingredients] = await db.execute(
                    `SELECT id, name, current_stock FROM ingredients 
           WHERE LOWER(name) LIKE LOWER(?) OR LOWER(name) LIKE LOWER(?)`,
                    [`%${item.name}%`, `%${item.productName || ''}%`]
                );

                if (ingredients.length > 0) {
                    const ingredient = ingredients[0];
                    const quantity = parseFloat(item.qty || item.quantity || 0);

                    // Update stock
                    await db.execute(
                        `UPDATE ingredients SET current_stock = current_stock + ?, status = 'active' WHERE id = ?`,
                        [quantity, ingredient.id]
                    );

                    // Record stock movement
                    await db.execute(
                        `INSERT INTO stock_movements 
             (ingredient_id, movement_type, quantity, reason, reference_id, reference_type, created_at) 
             VALUES (?, 'in', ?, ?, ?, 'toko_sembako_order', NOW())`,
                        [ingredient.id, quantity, `Order dari Toko Sembako - ${orderId}`, orderId]
                    );

                    processedItems.push({
                        productId: item.productId,
                        name: item.name,
                        quantity,
                        ingredientId: ingredient.id,
                        ingredientName: ingredient.name,
                        status: 'stock_added'
                    });

                    console.log(`  ✅ Added ${quantity} ${ingredient.name} to stock`);
                } else {
                    processedItems.push({
                        productId: item.productId,
                        name: item.name,
                        quantity: item.qty || item.quantity,
                        status: 'ingredient_not_found'
                    });
                    console.log(`  ⚠️ No matching ingredient for: ${item.name}`);
                }
            } catch (itemError) {
                console.error(`  ❌ Error processing item ${item.name}:`, itemError.message);
                processedItems.push({
                    productId: item.productId,
                    name: item.name,
                    status: 'error',
                    error: itemError.message
                });
            }
        }

        res.json({
            success: true,
            message: `Order ${orderId} processed successfully`,
            orderId,
            processedItems,
            summary: {
                total: items.length,
                stockAdded: processedItems.filter(i => i.status === 'stock_added').length,
                notFound: processedItems.filter(i => i.status === 'ingredient_not_found').length,
                errors: processedItems.filter(i => i.status === 'error').length
            },
            processedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Webhook error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/api/health', async (req, res) => {
    try {
        await db.execute('SELECT 1');
        res.json({
            status: 'healthy',
            service: 'anugerah-resto-inventory',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            service: 'anugerah-resto-inventory',
            database: 'disconnected',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;
