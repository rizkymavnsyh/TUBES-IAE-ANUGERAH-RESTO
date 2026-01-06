"""
Toko Sembako Client - Python HTTP Client for Integration
Connects to Toko Sembako GraphQL APIs deployed on Railway
"""
import os
import aiohttp
from typing import Optional, List, Dict, Any

# URLs from environment or defaults (Railway deployment)
TOKO_SEMBAKO_PRODUCT_URL = os.getenv(
    'TOKO_SEMBAKO_PRODUCT_URL', 
    'https://tubes-iae-anugerah-resto-production-3278.up.railway.app/graphql/product'
)
TOKO_SEMBAKO_INVENTORY_URL = os.getenv(
    'TOKO_SEMBAKO_INVENTORY_URL', 
    'https://tubes-iae-anugerah-resto-production-3278.up.railway.app/graphql/inventory'
)
TOKO_SEMBAKO_ORDER_URL = os.getenv(
    'TOKO_SEMBAKO_ORDER_URL', 
    'https://tubes-iae-anugerah-resto-production-3278.up.railway.app/graphql/order'
)

print(f"🔗 Toko Sembako Client Configuration (Python):")
print(f"   Product Service: {TOKO_SEMBAKO_PRODUCT_URL}")
print(f"   Inventory Service: {TOKO_SEMBAKO_INVENTORY_URL}")
print(f"   Order Service: {TOKO_SEMBAKO_ORDER_URL}")

import asyncio

# Retry configuration
MAX_RETRIES = 3
RETRY_DELAY = 1  # seconds (will use exponential backoff: 1s, 2s, 4s)

async def graphql_request(url: str, query: str, variables: Dict = None, retries: int = MAX_RETRIES) -> Dict:
    """Execute a GraphQL request with automatic retry on failure"""
    last_error = None
    
    for attempt in range(retries):
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
                payload = {"query": query}
                if variables:
                    payload["variables"] = variables
                
                async with session.post(
                    url,
                    json=payload,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    result = await response.json()
                    
                    if "errors" in result:
                        error_messages = [e.get("message", "Unknown error") for e in result["errors"]]
                        raise Exception(f"GraphQL errors: {', '.join(error_messages)}")
                    
                    return result.get("data", {})
                    
        except Exception as e:
            last_error = e
            if attempt < retries - 1:
                delay = RETRY_DELAY * (2 ** attempt)  # Exponential backoff: 1, 2, 4...
                print(f"⚠️ Request failed (attempt {attempt + 1}/{retries}), retrying in {delay}s: {e}")
                await asyncio.sleep(delay)
            else:
                print(f"❌ Request failed after {retries} attempts: {e}")
    
    raise last_error


async def get_products_from_toko_sembako(category: Optional[str] = None) -> List[Dict]:
    """Fetch all products from Toko Sembako Product Service
    
    Updated to match Node.js logic: tries 'products' query first, falls back to 'getProducts'
    """
    # 1. Try new 'products' query which supports category filtering and returns more fields
    query = """
        query GetProducts($category: String) {
            products(category: $category) {
                id
                name
                category
                price
                unit
                available
                description
            }
        }
    """
    
    try:
        data = await graphql_request(TOKO_SEMBAKO_PRODUCT_URL, query, {"category": category})
        products = data.get("products", [])
        
        # Transform to match our schema
        return [
            {
                "id": str(p.get("id", "")),
                "name": p.get("name", ""),
                "category": p.get("category", "Umum"),
                "price": float(p.get("price", 0)),
                "unit": p.get("unit", ""),
                "available": p.get("available", True),
                "description": p.get("description")
            }
            for p in products
        ]
    except Exception as e:
        print(f"⚠️ 'products' query failed, falling back to 'getProducts': {e}")
        
        # 2. Fallback to old 'getProducts' query
        fallback_query = """
            query GetProducts {
                getProducts {
                    id
                    name
                    price
                    unit
                }
            }
        """
        try:
            data = await graphql_request(TOKO_SEMBAKO_PRODUCT_URL, fallback_query)
            products = data.get("getProducts", [])
            
            return [
                {
                    "id": str(p.get("id", "")),
                    "name": p.get("name", ""),
                    "category": category or "Umum", # Default category
                    "price": float(p.get("price", 0)),
                    "unit": p.get("unit", ""),
                    "available": True,
                    "description": None
                }
                for p in products
            ]
        except Exception as e2:
            print(f"❌ Error fetching products from Toko Sembako (fallback): {e2}")
            return []


async def get_product_by_id_from_toko_sembako(product_id: str) -> Optional[Dict]:
    """Fetch single product by ID from Toko Sembako"""
    query = """
        query GetProduct($id: ID!) {
            getProductById(id: $id) {
                id
                name
                price
                unit
            }
        }
    """
    
    try:
        data = await graphql_request(
            TOKO_SEMBAKO_PRODUCT_URL, 
            query, 
            {"id": product_id}
        )
        product = data.get("getProductById")
        
        if not product:
            return None
        
        return {
            "id": str(product.get("id", "")),
            "name": product.get("name", ""),
            "category": None,
            "price": float(product.get("price", 0)),
            "unit": product.get("unit", ""),
            "available": True,
            "description": None
        }
    except Exception as e:
        print(f"❌ Error fetching product {product_id}: {e}")
        return None


async def check_stock_from_toko_sembako(product_id: str, quantity: float) -> Dict:
    """Check stock availability at Toko Sembako Inventory Service
    
    Uses checkStock query if available (toko-sembako-revisi), 
    fallback to getInventory for compatibility
    """
    # Try using checkStock query first (toko-sembako-revisi has this)
    check_stock_query = """
        query CheckStock($productId: ID!, $quantity: Int!) {
            checkStock(productId: $productId, quantity: $quantity) {
                available
                currentStock
                requestedQuantity
                message
            }
        }
    """
    
    try:
        data = await graphql_request(
            TOKO_SEMBAKO_INVENTORY_URL, 
            check_stock_query, 
            {"productId": product_id, "quantity": int(quantity)}
        )
        result = data.get("checkStock")
        
        if result:
            return {
                "available": result.get("available", False),
                "current_stock": float(result.get("currentStock", 0)),
                "requested_quantity": float(result.get("requestedQuantity", quantity)),
                "message": result.get("message", "")
            }
    except Exception as e:
        print(f"⚠️ checkStock query failed, falling back to getInventory: {e}")
    
    # Fallback: use getInventory query
    fallback_query = """
        query CheckInventory($productId: ID!) {
            getInventory(productId: $productId) {
                productId
                stock
            }
        }
    """
    
    try:
        data = await graphql_request(
            TOKO_SEMBAKO_INVENTORY_URL, 
            fallback_query, 
            {"productId": product_id}
        )
        inventory = data.get("getInventory")
        
        if not inventory:
            return {
                "available": False,
                "current_stock": 0,
                "requested_quantity": quantity,
                "message": "Product not found in inventory"
            }
        
        stock = float(inventory.get("stock", 0))
        available = stock >= quantity
        
        return {
            "available": available,
            "current_stock": stock,
            "requested_quantity": quantity,
            "message": f"Stock {'tersedia' if available else 'tidak cukup'}: {stock} unit"
        }
    except Exception as e:
        print(f"❌ Error checking stock: {e}")
        return {
            "available": False,
            "current_stock": 0,
            "requested_quantity": quantity,
            "message": f"Error: {str(e)}"
        }


async def get_all_inventory_from_toko_sembako() -> List[Dict]:
    """Get all inventory items from Toko Sembako
    
    Only available in toko-sembako-revisi version
    """
    query = """
        query GetAllInventory {
            getAllInventory {
                productId
                stock
            }
        }
    """
    
    try:
        data = await graphql_request(TOKO_SEMBAKO_INVENTORY_URL, query)
        inventory_items = data.get("getAllInventory", [])
        
        return [
            {
                "product_id": str(item.get("productId", "")),
                "stock": float(item.get("stock", 0))
            }
            for item in inventory_items
        ]
    except Exception as e:
        print(f"❌ Error fetching all inventory from Toko Sembako: {e}")
        return []


async def set_stock_at_toko_sembako(product_id: str, stock: int) -> Optional[Dict]:
    """Set stock for a product at Toko Sembako
    
    Only available in toko-sembako-revisi version
    """
    mutation = """
        mutation SetStock($productId: ID!, $stock: Int!) {
            setStock(productId: $productId, stock: $stock) {
                productId
                stock
            }
        }
    """
    
    try:
        data = await graphql_request(
            TOKO_SEMBAKO_INVENTORY_URL,
            mutation,
            {"productId": product_id, "stock": stock}
        )
        result = data.get("setStock")
        
        if result:
            return {
                "product_id": str(result.get("productId", "")),
                "stock": int(result.get("stock", 0))
            }
        return None
    except Exception as e:
        print(f"❌ Error setting stock at Toko Sembako: {e}")
        return None


async def create_order_at_toko_sembako(
    order_number: str,
    items: List[Dict],
    notes: Optional[str] = None
) -> Dict:
    """Create order at Toko Sembako Order Service"""
    
    # First, we need to ensure products exist and have stock
    # Then create the order
    mutation = """
        mutation CreateOrder($restaurantId: String!, $items: [OrderItemInput!]!) {
            createOrder(restaurantId: $restaurantId, items: $items) {
                id
                restaurantId
                items {
                    productId
                    qty
                    price
                    subtotal
                }
                total
                status
            }
        }
    """
    
    try:
        # Transform items to match Toko Sembako schema
        order_items = [
            {"productId": str(item["productId"]), "qty": int(item["quantity"])}
            for item in items
        ]
        
        data = await graphql_request(
            TOKO_SEMBAKO_ORDER_URL,
            mutation,
            {
                "restaurantId": f"anugerah-resto-{order_number}",
                "items": order_items
            }
        )
        
        order = data.get("createOrder")
        
        if order:
            return {
                "success": True,
                "message": "Order created successfully",
                "order": {
                    "id": str(order.get("id", "")),
                    "orderId": str(order.get("id", "")),
                    "status": order.get("status", "CONFIRMED"),
                    "total": float(order.get("total", 0)),
                    "items": [
                        {
                            "productId": str(item.get("productId", "")),
                            "name": f"Product {item.get('productId', '')}",
                            "quantity": float(item.get("qty", 0)),
                            "price": float(item.get("price", 0))
                        }
                        for item in order.get("items", [])
                    ],
                    "createdAt": None
                }
            }
        
        return {
            "success": False,
            "message": "Failed to create order",
            "order": None
        }
        
    except Exception as e:
        print(f"❌ Error creating order at Toko Sembako: {e}")
        return {
            "success": False,
            "message": f"Error: {str(e)}",
            "order": None
        }


async def get_order_status_from_toko_sembako(order_id: str) -> Optional[Dict]:
    """Get order status from Toko Sembako"""
    query = """
        query GetOrder($orderId: ID!) {
            getOrderById(orderId: $orderId) {
                id
                restaurantId
                items {
                    productId
                    qty
                    price
                    subtotal
                }
                total
                status
            }
        }
    """
    
    try:
        data = await graphql_request(
            TOKO_SEMBAKO_ORDER_URL,
            query,
            {"orderId": order_id}
        )
        
        order = data.get("getOrderById")
        
        if not order:
            return None
        
        return {
            "id": str(order.get("id", "")),
            "orderId": str(order.get("id", "")),
            "status": order.get("status", ""),
            "total": float(order.get("total", 0)),
            "items": [
                {
                    "productId": str(item.get("productId", "")),
                    "name": f"Product {item.get('productId', '')}",
                    "quantity": float(item.get("qty", 0)),
                    "price": float(item.get("price", 0))
                }
                for item in order.get("items", [])
            ],
            "createdAt": None
        }
        
    except Exception as e:
        print(f"❌ Error fetching order status: {e}")
        return None


async def get_products_with_stock_from_toko_sembako(category: Optional[str] = None) -> List[Dict]:
    """Get all products from Toko Sembako with their stock information
    
    Combines data from product-service and inventory-service
    """
    try:
        # Get products and inventory in parallel
        products = await get_products_from_toko_sembako(category)
        inventory_items = await get_all_inventory_from_toko_sembako()
        
        # Create stock lookup
        stock_lookup = {item["product_id"]: item["stock"] for item in inventory_items}
        
        # Merge stock info into products
        for product in products:
            product_id = product.get("id", "")
            stock = stock_lookup.get(product_id, 0)
            product["stock"] = stock
            product["available"] = stock > 0
        
        return products
        
    except Exception as e:
        print(f"❌ Error fetching products with stock: {e}")
        # Fallback: return products without stock info
        return await get_products_from_toko_sembako(category)
