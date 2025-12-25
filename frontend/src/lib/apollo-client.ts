import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

// Service URLs - adjust these based on your environment
const ORDER_SERVICE_URL = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || 'http://localhost:4004/graphql';
const KITCHEN_SERVICE_URL = process.env.NEXT_PUBLIC_KITCHEN_SERVICE_URL || 'http://localhost:4001/graphql';
const INVENTORY_SERVICE_URL = process.env.NEXT_PUBLIC_INVENTORY_SERVICE_URL || 'http://localhost:4002/graphql';
const USER_SERVICE_URL = process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'http://localhost:4003/graphql';

// Create HTTP links for each service
const orderServiceLink = createHttpLink({
  uri: ORDER_SERVICE_URL,
});

const kitchenServiceLink = createHttpLink({
  uri: KITCHEN_SERVICE_URL,
});

const inventoryServiceLink = createHttpLink({
  uri: INVENTORY_SERVICE_URL,
});

const userServiceLink = createHttpLink({
  uri: USER_SERVICE_URL,
});

// Apollo Client for Order Service (default)
export const apolloClient = new ApolloClient({
  link: orderServiceLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});

// Apollo Client for Kitchen Service
export const kitchenApolloClient = new ApolloClient({
  link: kitchenServiceLink,
  cache: new InMemoryCache(),
});

// Apollo Client for Inventory Service
export const inventoryApolloClient = new ApolloClient({
  link: inventoryServiceLink,
  cache: new InMemoryCache(),
});

// Apollo Client for User Service
export const userApolloClient = new ApolloClient({
  link: userServiceLink,
  cache: new InMemoryCache(),
});

// Helper function to get the appropriate client based on service
export function getApolloClient(service: 'order' | 'kitchen' | 'inventory' | 'user' = 'order') {
  switch (service) {
    case 'kitchen':
      return kitchenApolloClient;
    case 'inventory':
      return inventoryApolloClient;
    case 'user':
      return userApolloClient;
    default:
      return apolloClient;
  }
}







