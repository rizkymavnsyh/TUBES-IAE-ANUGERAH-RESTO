const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Menu {
    id: ID!
    menuId: String!
    name: String!
    description: String
    category: String!
    price: Float!
    image: String
    ingredients: [IngredientInfo]
    available: Boolean!
    preparationTime: Int!
    tags: [String!]!
    createdAt: String!
    updatedAt: String!
  }

  type IngredientInfo {
    ingredientId: String!
    ingredientName: String!
    quantity: Float!
    unit: String!
  }

  type CartItem {
    menuId: String!
    name: String!
    quantity: Int!
    price: Float!
    specialInstructions: String
  }

  type Cart {
    id: ID!
    cartId: String!
    customerId: String
    tableNumber: String
    items: [CartItem!]!
    subtotal: Float!
    tax: Float!
    serviceCharge: Float!
    discount: Float!
    total: Float!
    status: CartStatus!
    createdAt: String!
    updatedAt: String!
  }

  type OrderItem {
    menuId: String!
    name: String!
    quantity: Int!
    price: Float!
    specialInstructions: String
  }

  type Order {
    id: ID!
    orderId: String!
    customerId: String
    tableNumber: String
    items: [OrderItem!]!
    subtotal: Float!
    tax: Float!
    serviceCharge: Float!
    discount: Float!
    loyaltyPointsUsed: Float!
    loyaltyPointsEarned: Float!
    total: Float!
    paymentMethod: PaymentMethod!
    paymentStatus: PaymentStatus!
    orderStatus: OrderStatus!
    kitchenStatus: String
    staffId: String
    notes: String
    createdAt: String!
    updatedAt: String!
    completedAt: String
  }

  type StockCheckResult {
    available: Boolean!
    message: String!
    ingredientId: String!
    ingredientName: String!
    required: Float!
    availableQuantity: Float!
  }

  type OrderCreationResult {
    order: Order!
    kitchenOrderCreated: Boolean!
    stockUpdated: Boolean!
    loyaltyPointsEarned: Float!
    message: String!
  }

  enum CartStatus {
    active
    abandoned
    completed
  }

  enum PaymentMethod {
    cash
    card
    digital_wallet
    loyalty_points
  }

  enum PaymentStatus {
    pending
    paid
    refunded
  }

  enum OrderStatus {
    pending
    confirmed
    preparing
    ready
    served
    completed
    cancelled
  }

  type Query {
    # Menu queries
    menus(category: String, available: Boolean): [Menu!]!
    menu(id: ID!): Menu
    menuByMenuId(menuId: String!): Menu
    menuCategories: [String!]!
    
    # Cart queries
    cart(cartId: String!): Cart
    cartsByCustomer(customerId: String!): [Cart!]!
    activeCarts: [Cart!]!
    
    # Order queries
    orders(status: OrderStatus, paymentStatus: PaymentStatus, customerId: String, tableNumber: String): [Order!]!
    order(id: ID!): Order
    orderByOrderId(orderId: String!): Order
    ordersByDate(startDate: String!, endDate: String!): [Order!]!
    
    # Check stock for menu items
    checkMenuStock(menuId: String!, quantity: Int!): [StockCheckResult!]!
  }

  type Mutation {
    # Menu operations
    createMenu(input: CreateMenuInput!): Menu!
    updateMenu(id: ID!, input: UpdateMenuInput!): Menu!
    deleteMenu(id: ID!): Boolean!
    toggleMenuAvailability(id: ID!): Menu!
    
    # Cart operations
    createCart(input: CreateCartInput!): Cart!
    addItemToCart(cartId: String!, item: CartItemInput!): Cart!
    updateCartItem(cartId: String!, menuId: String!, quantity: Int!): Cart!
    removeItemFromCart(cartId: String!, menuId: String!): Cart!
    clearCart(cartId: String!): Cart!
    applyDiscount(cartId: String!, discount: Float!): Cart!
    
    # Order operations
    createOrderFromCart(cartId: String!, input: CreateOrderInput!): OrderCreationResult!
    createOrder(input: CreateOrderInput!): OrderCreationResult!
    updateOrderStatus(orderId: String!, status: OrderStatus!): Order!
    updatePaymentStatus(orderId: String!, paymentStatus: PaymentStatus!): Order!
    cancelOrder(orderId: String!): Order!
    
    # Kitchen integration
    sendToKitchen(orderId: String!): Order!
  }

  input CreateMenuInput {
    menuId: String!
    name: String!
    description: String
    category: String!
    price: Float!
    image: String
    ingredients: [IngredientInfoInput!]
    preparationTime: Int
    tags: [String!]
    available: Boolean
  }

  input IngredientInfoInput {
    ingredientId: String!
    ingredientName: String!
    quantity: Float!
    unit: String!
  }

  input UpdateMenuInput {
    name: String
    description: String
    category: String
    price: Float
    image: String
    ingredients: [IngredientInfoInput!]
    available: Boolean
    preparationTime: Int
    tags: [String!]
  }

  input CreateCartInput {
    cartId: String!
    customerId: String
    tableNumber: String
  }

  input CartItemInput {
    menuId: String!
    name: String!
    quantity: Int!
    price: Float!
    specialInstructions: String
  }

  input CreateOrderInput {
    orderId: String!
    customerId: String
    tableNumber: String
    items: [OrderItemInput!]!
    paymentMethod: PaymentMethod
    loyaltyPointsUsed: Float
    notes: String
  }

  input OrderItemInput {
    menuId: String!
    name: String!
    quantity: Int!
    price: Float!
    specialInstructions: String
  }
`;

module.exports = typeDefs;



