// API Base URLs - pointing to combined server
const BASE_URL = "http://localhost:8080";
const PRODUCT_URL = `${BASE_URL}/graphql/product`;
const INVENTORY_URL = `${BASE_URL}/graphql/inventory`;
const ORDER_URL = `${BASE_URL}/graphql/order`;

async function request(url, query) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

/* ================= PRODUCTS ================= */
export const syncProducts = async () => {
  const data = await request(PRODUCT_URL, `
    query {
      getProducts {
        id
        name
        price
        unit
      }
    }
  `);
  return data.getProducts;
};

/* ================= INVENTORY ================= */
export const syncInventory = async (products) => {
  return Promise.all(
    products.map(async p => {
      const data = await request(INVENTORY_URL, `
        query {
          getInventory(productId: "${p.id}") {
            stock
          }
        }
      `);
      return {
        id: p.id,
        name: p.name,
        stock: data?.getInventory?.stock ?? 0,
      };
    })
  );
};

export const getAllInventory = async () => {
  const data = await request(INVENTORY_URL, `
    query {
      getAllInventory {
        productId
        stock
      }
    }
  `);
  return data.getAllInventory;
};

/* ================= ORDERS ================= */
export const fetchOrdersAPI = async () => {
  const data = await request(ORDER_URL, `
    query {
      getOrders {
        id
        restaurantId
        status
        total
        items {
          productId
          qty
          price
          subtotal
        }
      }
    }
  `);
  return data.getOrders;
};

export const createOrderAPI = async (items) => {
  const data = await request(ORDER_URL, `
    mutation {
      createOrder(
        restaurantId: "RESTO-01"
        items: ${JSON.stringify(items).replace(/"([^"]+)":/g, '$1:')}
      ) {
        id
        status
        total
      }
    }
  `);
  return data.createOrder;
};

export const cancelOrderAPI = async (orderId) => {
  const data = await request(ORDER_URL, `
    mutation {
      cancelOrder(orderId: "${orderId}") {
        id
        status
      }
    }
  `);
  return data.cancelOrder;
};
