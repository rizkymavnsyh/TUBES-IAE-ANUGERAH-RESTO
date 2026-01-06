import { gql } from "@apollo/client";

export const GET_ORDERS = gql`
  query {
    getOrders {
      id
    }
  }
`;
