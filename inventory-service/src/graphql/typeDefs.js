const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Supplier {
    id: ID!
    name: String!
    contactPerson: String
    email: String
    phone: String
    address: String
    status: SupplierStatus!
    createdAt: String!
    updatedAt: String!
  }

  type Ingredient {
    id: ID!
    name: String!
    unit: String!
    category: String
    minStockLevel: Float!
    currentStock: Float!
    supplier: Supplier
    costPerUnit: Float!
    status: IngredientStatus!
    createdAt: String!
    updatedAt: String!
  }

  type StockMovement {
    id: ID!
    ingredient: Ingredient!
    movementType: MovementType!
    quantity: Float!
    reason: String
    referenceId: String
    referenceType: String
    createdBy: Int
    createdAt: String!
  }

  type PurchaseOrder {
    id: ID!
    supplier: Supplier!
    orderNumber: String!
    status: PurchaseOrderStatus!
    totalAmount: Float!
    orderDate: String
    expectedDeliveryDate: String
    receivedDate: String
    notes: String
    items: [PurchaseOrderItem!]!
    createdAt: String!
    updatedAt: String!
  }

  type PurchaseOrderItem {
    id: ID!
    ingredient: Ingredient!
    quantity: Float!
    unitPrice: Float!
    totalPrice: Float!
    receivedQuantity: Float!
  }

  # Types untuk integrasi dengan Toko Sembako
  type TokoSembakoProduct {
    id: ID!
    name: String!
    category: String
    price: Float!
    unit: String!
    available: Boolean!
    description: String
  }

  type TokoSembakoStockCheck {
    available: Boolean!
    currentStock: Float!
    requestedQuantity: Float!
    message: String!
  }

  type TokoSembakoOrder {
    id: ID!
    orderId: String!
    status: String!
    total: Float!
    items: [TokoSembakoOrderItem!]!
    createdAt: String
  }

  type TokoSembakoOrderItem {
    productId: String!
    name: String!
    quantity: Float!
    price: Float!
  }

  type PurchaseFromTokoSembakoResult {
    success: Boolean!
    message: String!
    purchaseOrder: PurchaseOrder
    tokoSembakoOrder: TokoSembakoOrder
    stockAdded: Boolean!
  }

  enum SupplierStatus {
    active
    inactive
  }

  enum IngredientStatus {
    active
    inactive
    out_of_stock
  }

  enum MovementType {
    in
    out
    adjustment
  }

  enum PurchaseOrderStatus {
    pending
    ordered
    received
    cancelled
  }

  type Query {
    # Suppliers
    suppliers(status: SupplierStatus): [Supplier!]!
    supplier(id: ID!): Supplier
    
    # Ingredients
    ingredients(category: String, status: IngredientStatus): [Ingredient!]!
    ingredient(id: ID!): Ingredient
    lowStockIngredients: [Ingredient!]!
    outOfStockIngredients: [Ingredient!]!
    
    # Stock Movements
    stockMovements(ingredientId: ID, movementType: MovementType): [StockMovement!]!
    stockMovement(id: ID!): StockMovement
    
    # Purchase Orders
    purchaseOrders(status: PurchaseOrderStatus): [PurchaseOrder!]!
    purchaseOrder(id: ID!): PurchaseOrder
    purchaseOrderByNumber(orderNumber: String!): PurchaseOrder
    
    # Check stock availability
    checkStock(ingredientId: ID!, quantity: Float!): StockCheckResult!
    
    # Toko Sembako Integration Queries
    tokoSembakoProducts(category: String): [TokoSembakoProduct!]!
    tokoSembakoProduct(id: ID!): TokoSembakoProduct
    checkTokoSembakoStock(productId: ID!, quantity: Float!): TokoSembakoStockCheck!
    tokoSembakoOrderStatus(orderId: String!): TokoSembakoOrder
  }

  type Mutation {
    # Supplier operations
    createSupplier(input: CreateSupplierInput!): Supplier!
    updateSupplier(id: ID!, input: UpdateSupplierInput!): Supplier!
    
    # Ingredient operations
    createIngredient(input: CreateIngredientInput!): Ingredient!
    updateIngredient(id: ID!, input: UpdateIngredientInput!): Ingredient!
    
    # Stock operations
    addStock(ingredientId: ID!, quantity: Float!, reason: String): StockMovement!
    reduceStock(ingredientId: ID!, quantity: Float!, reason: String, referenceId: String, referenceType: String): StockMovement!
    adjustStock(ingredientId: ID!, newQuantity: Float!, reason: String): StockMovement!
    
    # Purchase Order operations
    createPurchaseOrder(input: CreatePurchaseOrderInput!): PurchaseOrder!
    updatePurchaseOrderStatus(id: ID!, status: PurchaseOrderStatus!): PurchaseOrder!
    receivePurchaseOrder(id: ID!): PurchaseOrder!
    
    # Toko Sembako Integration Mutations
    purchaseFromTokoSembako(input: PurchaseFromTokoSembakoInput!): PurchaseFromTokoSembakoResult!
    syncStockFromTokoSembako(productId: ID!, quantity: Float!): StockMovement!
  }

  type StockCheckResult {
    available: Boolean!
    currentStock: Float!
    requestedQuantity: Float!
    message: String!
  }

  input CreateSupplierInput {
    name: String!
    contactPerson: String
    email: String
    phone: String
    address: String
  }

  input UpdateSupplierInput {
    name: String
    contactPerson: String
    email: String
    phone: String
    address: String
    status: SupplierStatus
  }

  input CreateIngredientInput {
    name: String!
    unit: String!
    category: String
    minStockLevel: Float!
    currentStock: Float!
    supplierId: ID
    costPerUnit: Float!
  }

  input UpdateIngredientInput {
    name: String
    unit: String
    category: String
    minStockLevel: Float
    supplierId: ID
    costPerUnit: Float
    status: IngredientStatus
  }

  input CreatePurchaseOrderInput {
    supplierId: ID!
    orderNumber: String!
    orderDate: String
    expectedDeliveryDate: String
    notes: String
    items: [PurchaseOrderItemInput!]!
  }

  input PurchaseOrderItemInput {
    ingredientId: ID!
    quantity: Float!
    unitPrice: Float!
  }

  input PurchaseFromTokoSembakoInput {
    orderNumber: String!
    items: [TokoSembakoOrderItemInput!]!
    notes: String
  }

  input TokoSembakoOrderItemInput {
    productId: ID!
    quantity: Float!
  }
`;

module.exports = typeDefs;

