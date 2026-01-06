const axios = require("axios");

const INVENTORY_URL = "http://inventory-service:4000/graphql";

module.exports = async function decreaseStock(productId, qty, token) {
  const response = await axios.post(
    INVENTORY_URL,
    {
      query: `
        mutation {
          decreaseStock(productId: "${productId}", qty: ${qty}) {
            productId
            stock
          }
        }
      `
    },
    {
      headers: {
        Authorization: token
      }
    }
  );

  if (response.data.errors) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.decreaseStock;
};
