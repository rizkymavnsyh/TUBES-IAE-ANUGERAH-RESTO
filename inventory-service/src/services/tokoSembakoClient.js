const axios = require('axios');
require('dotenv').config();

/**
 * Toko Sembako Integration Client
 * 
 * URL Configuration:
 * - For local development: Uses localhost URLs to Toko Sembako services
 *   - Product Service: http://localhost:5001/graphql
 *   - Inventory Service: http://localhost:5000/graphql
 *   - Order Service: http://localhost:5002/graphql
 * - For cross-team integration: Set individual URLs via environment variables
 */

// Base URL untuk Toko Sembako (ngrok URL dari kelompok mereka jika remote)
const TOKO_SEMBAKO_BASE_URL = process.env.TOKO_SEMBAKO_URL || 'http://localhost';

// Individual service URLs - default to local Toko Sembako services
const TOKO_SEMBAKO_PRODUCT_URL = process.env.TOKO_SEMBAKO_PRODUCT_URL || `${TOKO_SEMBAKO_BASE_URL}:5001/graphql`;
const TOKO_SEMBAKO_INVENTORY_URL = process.env.TOKO_SEMBAKO_INVENTORY_URL || `${TOKO_SEMBAKO_BASE_URL}:5000/graphql`;
const TOKO_SEMBAKO_ORDER_URL = process.env.TOKO_SEMBAKO_ORDER_URL || `${TOKO_SEMBAKO_BASE_URL}:5002/graphql`;

// Log configuration on startup
console.log('🔗 Toko Sembako Client Configuration:');
console.log(`   Product Service: ${TOKO_SEMBAKO_PRODUCT_URL}`);
console.log(`   Inventory Service: ${TOKO_SEMBAKO_INVENTORY_URL}`);
console.log(`   Order Service: ${TOKO_SEMBAKO_ORDER_URL}`);

/**
 * Helper function untuk memanggil GraphQL service dari Toko Sembako
 */
async function callTokoSembakoService(url, query, variables = {}) {
  try {
    const response = await axios.post(url, {
      query,
      variables
    }, {
      timeout: 10000, // 10 seconds timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }

    return response.data.data;
  } catch (error) {
    console.error(`Error calling Toko Sembako service at ${url}:`, error.message);
    throw error;
  }
}

/**
 * Get products (sayur) dari Toko Sembako Product Service
 */
async function getProductsFromTokoSembako(category = null) {
  try {
    const query = category
      ? `
        query GetProducts($category: String) {
          products(category: $category) {
            id
            name
            category
            price
            unit
            available
            description
          }
        }
      `
      : `
        query GetProducts {
          getProducts {
            id
            name
            price
            unit
          }
        }
      `;

    const data = await callTokoSembakoService(TOKO_SEMBAKO_PRODUCT_URL, query, { category });
    const products = data.getProducts || data.products || [];

    // Ensure all products have required fields with defaults
    return products.map(product => ({
      id: product.id,
      name: product.name,
      category: product.category || 'Umum',
      price: product.price,
      unit: product.unit,
      available: product.available !== undefined ? product.available : true, // Default to true if not provided
      description: product.description || null
    }));
  } catch (error) {
    console.error('Error fetching products from Toko Sembako:', error.message);
    return [];
  }
}


/**
 * Get product by ID dari Toko Sembako
 */
async function getProductByIdFromTokoSembako(productId) {
  try {
    const query = `
      query GetProduct($id: ID!) {
        getProductById(id: $id) {
          id
          name
          price
          unit
        }
      }
    `;

    const data = await callTokoSembakoService(TOKO_SEMBAKO_PRODUCT_URL, query, { id: productId });
    return data.getProductById;
  } catch (error) {
    console.error('Error fetching product from Toko Sembako:', error.message);
    return null;
  }
}

/**
 * Check stock dari Toko Sembako Inventory Service
 */
async function checkStockFromTokoSembako(productId, quantity) {
  try {
    const query = `
      query CheckStock($productId: ID!, $quantity: Int!) {
        checkStock(productId: $productId, quantity: $quantity) {
          available
          currentStock
          requestedQuantity
          message
        }
      }
    `;

    const data = await callTokoSembakoService(TOKO_SEMBAKO_INVENTORY_URL, query, {
      productId,
      quantity: parseInt(quantity, 10)
    });

    return data.checkStock;
  } catch (error) {
    console.error('Error checking stock from Toko Sembako:', error.message);
    return {
      available: false,
      currentStock: 0,
      requestedQuantity: quantity,
      message: `Error checking stock: ${error.message}`
    };
  }
}

/**
 * Create order di Toko Sembako Order Service
 */
async function createOrderAtTokoSembako(orderInput) {
  try {
    // Build items array for the mutation
    const itemsStr = orderInput.items.map(item =>
      `{ productId: "${item.productId}", qty: ${Math.floor(item.quantity)} }`
    ).join(', ');

    const query = `
      mutation {
        createOrder(
          restaurantId: "${orderInput.restaurantId || 'anugerah-resto'}"
          items: [${itemsStr}]
        ) {
          id
          restaurantId
          items {
            productId
            qty
            price
            subtotal
          }
          total
          status
        }
      }
    `;

    const data = await callTokoSembakoService(TOKO_SEMBAKO_ORDER_URL, query);

    // Map response to expected format
    const order = data.createOrder;
    return {
      id: order.id,
      orderId: `TS-${order.id}`,
      status: order.status,
      total: order.total,
      items: order.items.map(i => ({
        productId: i.productId,
        name: `Product ${i.productId}`, // Mock name
        quantity: i.qty,
        price: i.price
      })),
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error creating order at Toko Sembako:', error.message);
    throw error;
  }
}

/**
 * Get order status dari Toko Sembako
 */
async function getOrderStatusFromTokoSembako(orderId) {
  try {
    const query = `
      query GetOrder($orderId: String!) {
        orderByOrderId(orderId: $orderId) {
          id
          orderId
          status
          items {
            productId
            name
            quantity
          }
        }
      }
    `;

    const data = await callTokoSembakoService(TOKO_SEMBAKO_ORDER_URL, query, { orderId });
    return data.orderByOrderId;
  } catch (error) {
    console.error('Error fetching order from Toko Sembako:', error.message);
    return null;
  }
}

module.exports = {
  getProductsFromTokoSembako,
  getProductByIdFromTokoSembako,
  checkStockFromTokoSembako,
  createOrderAtTokoSembako,
  getOrderStatusFromTokoSembako
};








