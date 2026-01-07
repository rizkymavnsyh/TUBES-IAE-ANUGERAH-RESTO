import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// Service URLs Configuration
// INVENTORY SERVICE → Local (Port 4002) - Acts as bridge to Toko Sembako Cloud
// Toko Sembako Cloud: https://toko-sembako-revisi-production.up.railway.app

const ORDER_SERVICE_URL = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || 'http://localhost:4004/graphql';
const KITCHEN_SERVICE_URL = process.env.NEXT_PUBLIC_KITCHEN_SERVICE_URL || 'http://localhost:4001/graphql';
const INVENTORY_SERVICE_URL = process.env.NEXT_PUBLIC_INVENTORY_SERVICE_URL || 'http://localhost:4002/graphql';
const USER_SERVICE_URL = process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'http://localhost:4003/graphql';

// Auth middleware to add JWT token to requests
const authLink = setContext((_, { headers }) => {
  // Get token from localStorage (client-side only)
  let token = '';
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('auth_token') || '';
    // Debug logging
    console.log('[Apollo Auth] Token found:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
  }

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  };
});

// Create HTTP links for each service
const orderServiceLink = createHttpLink({
  uri: ORDER_SERVICE_URL,
});

const kitchenServiceLink = createHttpLink({
  uri: KITCHEN_SERVICE_URL,
});

const inventoryServiceLink = createHttpLink({
  uri: INVENTORY_SERVICE_URL, // Local Inventory Service → bridges to Toko Sembako Cloud
});

const userServiceLink = createHttpLink({
  uri: USER_SERVICE_URL,
});

// Apollo Client for Order Service (default)
export const apolloClient = new ApolloClient({
  link: from([authLink, orderServiceLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});

// Apollo Client for Kitchen Service
export const kitchenApolloClient = new ApolloClient({
  link: from([authLink, kitchenServiceLink]),
  cache: new InMemoryCache(),
});

// Apollo Client for Inventory Service
export const inventoryApolloClient = new ApolloClient({
  link: from([authLink, inventoryServiceLink]),
  cache: new InMemoryCache(),
});

// Apollo Client for User Service
export const userApolloClient = new ApolloClient({
  link: from([authLink, userServiceLink]),
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
