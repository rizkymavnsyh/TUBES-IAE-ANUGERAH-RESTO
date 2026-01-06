import { gql } from "@apollo/client";

export const GET_PRODUCTS = gql`
  query GetProducts {
    products {
      id
      name
      price
    }
  }
`;

export const CREATE_PRODUCT = gql`
  mutation CreateProduct($name: String!, $price: Float!) {
    createProduct(name: $name, price: $price) {
      id
      name
      price
    }
  }
`;
