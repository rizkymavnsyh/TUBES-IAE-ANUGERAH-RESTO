import axios from "axios";

const API_URL = "http://localhost:4001/graphql"; // product-service

export const fetchProducts = async () => {
  const response = await axios.post(API_URL, {
    query: `
      query {
        getProducts {
          id
          name
          price
          unit
        }
      }
    `
  });

  return response.data.data.getProducts;
};
