/**
 * Anugerah Resto Client - HTTP Client for Integration
 * Connects to Anugerah Resto GraphQL API (Inventory Service)
 * 
 * Toko Sembako sebagai CONSUMER, Anugerah Resto sebagai PROVIDER
 */

const fetch = require('node-fetch');

// URLs from environment or defaults
const ANUGERAH_RESTO_INVENTORY_URL = process.env.ANUGERAH_RESTO_INVENTORY_URL ||
    'http://localhost:4002/graphql';

console.log('🔗 Anugerah Resto Client Configuration:');
console.log(`   Inventory Service: ${ANUGERAH_RESTO_INVENTORY_URL}`);

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

/**
 * Execute a GraphQL request with automatic retry on failure
 */
async function graphqlRequest(url, query, variables = {}, retries = MAX_RETRIES) {
    let lastError = null;

    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, variables }),
                timeout: 10000
            });

            const result = await response.json();

            if (result.errors) {
                const errorMessages = result.errors.map(e => e.message).join(', ');
                throw new Error(`GraphQL errors: ${errorMessages}`);
            }

            return result.data || {};
        } catch (err) {
            lastError = err;
            if (attempt < retries - 1) {
                const delay = RETRY_DELAY * Math.pow(2, attempt);
                console.log(`⚠️ Request failed (attempt ${attempt + 1}/${retries}), retrying in ${delay}ms: ${err.message}`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                console.log(`❌ Request failed after ${retries} attempts: ${err.message}`);
            }
        }
    }

    throw lastError;
}

/**
 * Get low stock ingredients from Anugerah Resto
 * Useful to know what ingredients they need to restock
 */
async function getLowStockIngredients() {
    const query = `
        query GetLowStockIngredients {
            lowStockIngredients {
                id
                name
                unit
                category
                minStockLevel
                currentStock
            }
        }
    `;

    try {
        const data = await graphqlRequest(ANUGERAH_RESTO_INVENTORY_URL, query);
        return data.lowStockIngredients || [];
    } catch (err) {
        console.error('❌ Error fetching low stock ingredients:', err.message);
        return [];
    }
}

/**
 * Get out of stock ingredients from Anugerah Resto
 */
async function getOutOfStockIngredients() {
    const query = `
        query GetOutOfStockIngredients {
            outOfStockIngredients {
                id
                name
                unit
                category
                minStockLevel
                currentStock
            }
        }
    `;

    try {
        const data = await graphqlRequest(ANUGERAH_RESTO_INVENTORY_URL, query);
        return data.outOfStockIngredients || [];
    } catch (err) {
        console.error('❌ Error fetching out of stock ingredients:', err.message);
        return [];
    }
}

/**
 * Get all ingredients from Anugerah Resto
 */
async function getAllIngredients(category = null) {
    const query = `
        query GetIngredients($category: String) {
            ingredients(category: $category) {
                id
                name
                unit
                category
                minStockLevel
                currentStock
                costPerUnit
                status
            }
        }
    `;

    try {
        const data = await graphqlRequest(ANUGERAH_RESTO_INVENTORY_URL, query, { category });
        return data.ingredients || [];
    } catch (err) {
        console.error('❌ Error fetching ingredients:', err.message);
        return [];
    }
}

/**
 * Get ingredient by ID from Anugerah Resto
 */
async function getIngredientById(id) {
    const query = `
        query GetIngredient($id: ID!) {
            ingredient(id: $id) {
                id
                name
                unit
                category
                minStockLevel
                currentStock
                costPerUnit
                status
            }
        }
    `;

    try {
        const data = await graphqlRequest(ANUGERAH_RESTO_INVENTORY_URL, query, { id });
        return data.ingredient;
    } catch (err) {
        console.error(`❌ Error fetching ingredient ${id}:`, err.message);
        return null;
    }
}

/**
 * Notify Anugerah Resto that stock has been added (after delivery)
 * This calls their addStock mutation to update their inventory
 */
async function notifyStockDelivery(ingredientId, quantity, reason = 'Delivery from Toko Sembako') {
    const mutation = `
        mutation AddStock($ingredientId: ID!, $quantity: Float!, $reason: String) {
            addStock(ingredientId: $ingredientId, quantity: $quantity, reason: $reason) {
                id
                quantity
                movementType
                reason
                ingredient {
                    id
                    name
                    currentStock
                }
            }
        }
    `;

    try {
        const data = await graphqlRequest(
            ANUGERAH_RESTO_INVENTORY_URL,
            mutation,
            { ingredientId, quantity, reason }
        );

        if (data.addStock) {
            return {
                success: true,
                message: 'Stock delivery notified successfully',
                stockMovement: data.addStock
            };
        }

        return {
            success: false,
            message: 'Failed to notify stock delivery',
            stockMovement: null
        };
    } catch (err) {
        console.error('❌ Error notifying stock delivery:', err.message);
        return {
            success: false,
            message: `Error: ${err.message}`,
            stockMovement: null
        };
    }
}

/**
 * Check health of Anugerah Resto Inventory Service
 */
async function checkAnugerahRestoHealth() {
    const query = `
        query Health {
            health {
                status
                service
                version
                uptime
                timestamp
            }
        }
    `;

    try {
        const data = await graphqlRequest(ANUGERAH_RESTO_INVENTORY_URL, query);
        return data.health;
    } catch (err) {
        console.error('❌ Error checking Anugerah Resto health:', err.message);
        return {
            status: 'unhealthy',
            service: 'anugerah-resto-inventory',
            message: err.message
        };
    }
}

module.exports = {
    getLowStockIngredients,
    getOutOfStockIngredients,
    getAllIngredients,
    getIngredientById,
    notifyStockDelivery,
    checkAnugerahRestoHealth,
    ANUGERAH_RESTO_INVENTORY_URL
};
