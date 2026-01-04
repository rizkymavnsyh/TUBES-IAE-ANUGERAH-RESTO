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
    """Fetch all products from Toko Sembako Product Service"""
    query = """
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
        data = await graphql_request(TOKO_SEMBAKO_PRODUCT_URL, query)
        products = data.get("getProducts", [])
        
        # Transform to match our schema
        return [
            {
                "id": str(p.get("id", "")),
                "name": p.get("name", ""),
                "category": category,  # Toko Sembako doesn't have category
                "price": float(p.get("price", 0)),
                "unit": p.get("unit", ""),
                "available": True,
                "description": None
            }
            for p in products
        ]
    except Exception as e:
        print(f"❌ Error fetching products from Toko Sembako: {e}")
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
    """Check stock availability at Toko Sembako Inventory Service"""
    query = """
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
            query, 
            {"productId": product_id}
        )
        inventory = data.get("getInventory")
        
        if not inventory:
            return {
                "available": False,
                "current_stock": 0,
                "message": "Product not found in inventory"
            }
        
        stock = float(inventory.get("stock", 0))
        available = stock >= quantity
        
        return {
            "available": available,
            "current_stock": stock,
            "message": f"Stock {'tersedia' if available else 'tidak cukup'}: {stock} unit"
        }
    except Exception as e:
        print(f"❌ Error checking stock: {e}")
        return {
            "available": False,
            "current_stock": 0,
            "message": f"Error: {str(e)}"
        }


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
