// API Base URLs - pointing to combined server
const BASE_URL = "http://localhost:8080";
const PRODUCT_URL = `${BASE_URL}/graphql/product`;
const INVENTORY_URL = `${BASE_URL}/graphql/inventory`;
const ORDER_URL = `${BASE_URL}/graphql/order`;

async function graphqlRequest(url, query) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

// PRODUCT
export const fetchProducts = () =>
  graphqlRequest(PRODUCT_URL, `
    query {
      getProducts {
        id
        name
        price
        unit
      }
    }
  `);

export const createProduct = (name, price, unit) =>
  graphqlRequest(PRODUCT_URL, `
    mutation {
      createProduct(name: "${name}", price: ${price}, unit: "${unit}") {
        id
        name
        price
        unit
      }
    }
  `);

// INVENTORY
export const fetchInventory = (productId) =>
  graphqlRequest(INVENTORY_URL, `
    query {
      getInventory(productId: "${productId}") {
        productId
        stock
      }
    }
  `);

export const increaseStock = (productId, qty) =>
  graphqlRequest(INVENTORY_URL, `
    mutation {
      increaseStock(productId: "${productId}", qty: ${qty}) {
        productId
        stock
      }
    }
  `);

export const decreaseStock = (productId, qty) =>
  graphqlRequest(INVENTORY_URL, `
    mutation {
      decreaseStock(productId: "${productId}", qty: ${qty}) {
        productId
        stock
      }
    }
  `);

// ORDER
export const createOrder = (items) =>
  graphqlRequest(ORDER_URL, `
    mutation {
      createOrder(
        restaurantId: "RESTO-01"
        items: ${JSON.stringify(items).replace(/"([^"]+)":/g, '$1:')}
      ) {
        id
        total
        status
      }
    }
  `);

export const fetchOrders = () =>
  graphqlRequest(ORDER_URL, `
    query {
      getOrders {
        id
        restaurantId
        total
        status
        items {
          productId
          qty
          price
          subtotal
        }
      }
    }
  `);

export const cancelOrder = (orderId) =>
  graphqlRequest(ORDER_URL, `
    mutation {
      cancelOrder(orderId: "${orderId}") {
        id
        status
      }
    }
  `);
