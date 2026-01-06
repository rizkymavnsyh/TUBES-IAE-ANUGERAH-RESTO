import { gql } from "graphql-tag";

const typeDefs = gql`
  type Product {
    id: ID!
    name: String!
  }

  type Query {
    products: [Product]
  }
`;

export default typeDefs;
