const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type KitchenOrder {
    id: ID!
    orderId: String!
    tableNumber: String
    status: OrderStatus!
    items: [OrderItem]
    priority: Int
    estimatedTime: Int
    chefId: Int
    chef: Chef
    notes: String
    createdAt: String!
    updatedAt: String!
  }

  type OrderItem {
    menuId: String!
    name: String!
    quantity: Int!
    specialInstructions: String
  }

  type Chef {
    id: ID!
    name: String!
    specialization: String
    status: ChefStatus!
    currentOrders: Int!
  }

  enum OrderStatus {
    pending
    preparing
    ready
    completed
    cancelled
  }

  enum ChefStatus {
    available
    busy
    offline
  }

  type Query {
    # Get all kitchen orders
    kitchenOrders(status: OrderStatus): [KitchenOrder!]!
    
    # Get order by ID
    kitchenOrder(id: ID!): KitchenOrder
    
    # Get order by order ID
    kitchenOrderByOrderId(orderId: String!): KitchenOrder
    
    # Get all chefs
    chefs: [Chef!]!
    
    # Get chef by ID
    chef(id: ID!): Chef
    
    # Get orders by chef
    ordersByChef(chefId: ID!): [KitchenOrder!]!
  }

  type Mutation {
    # Create new kitchen order
    createKitchenOrder(input: CreateKitchenOrderInput!): KitchenOrder!
    
    # Update order status
    updateOrderStatus(id: ID!, status: OrderStatus!): KitchenOrder!
    
    # Assign chef to order
    assignChef(orderId: ID!, chefId: ID!): KitchenOrder!
    
    # Update estimated time
    updateEstimatedTime(orderId: ID!, estimatedTime: Int!): KitchenOrder!
    
    # Complete order
    completeOrder(orderId: ID!): KitchenOrder!
    
    # Cancel order
    cancelOrder(orderId: ID!): KitchenOrder!
  }

  input CreateKitchenOrderInput {
    orderId: String!
    tableNumber: String
    items: [OrderItemInput!]!
    priority: Int
    notes: String
  }

  input OrderItemInput {
    menuId: String!
    name: String!
    quantity: Int!
    specialInstructions: String
  }
`;

module.exports = typeDefs;








