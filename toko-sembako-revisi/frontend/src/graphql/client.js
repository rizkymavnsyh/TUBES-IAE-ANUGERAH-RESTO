import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

const link = new HttpLink({
  uri: "http://localhost:8080/graphql/product",
});

export const client = new ApolloClient({
  link,
  cache: new InMemoryCache(),
});

// Create separate clients for each service
export const productClient = new ApolloClient({
  link: new HttpLink({ uri: "http://localhost:8080/graphql/product" }),
  cache: new InMemoryCache(),
});

export const inventoryClient = new ApolloClient({
  link: new HttpLink({ uri: "http://localhost:8080/graphql/inventory" }),
  cache: new InMemoryCache(),
});

export const orderClient = new ApolloClient({
  link: new HttpLink({ uri: "http://localhost:8080/graphql/order" }),
  cache: new InMemoryCache(),
});

export const authClient = new ApolloClient({
  link: new HttpLink({ uri: "http://localhost:8080/graphql/auth" }),
  cache: new InMemoryCache(),
});
