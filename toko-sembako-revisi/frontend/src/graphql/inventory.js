import { gql } from "@apollo/client";

export const GET_INVENTORY_BY_PRODUCT = gql`
  query GetInventory($productId: ID!) {
    getInventory(productId: $productId) {
      productId
      stock
    }
  }
`;
