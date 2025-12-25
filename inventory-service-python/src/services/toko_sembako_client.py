import os
import httpx
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

# URLs untuk Toko Sembako services
TOKO_SEMBAKO_PRODUCT_URL = os.getenv("TOKO_SEMBAKO_PRODUCT_URL", "http://localhost:4001/graphql")
TOKO_SEMBAKO_INVENTORY_URL = os.getenv("TOKO_SEMBAKO_INVENTORY_URL", "http://localhost:4000/graphql")
TOKO_SEMBAKO_ORDER_URL = os.getenv("TOKO_SEMBAKO_ORDER_URL", "http://localhost:4002/graphql")

async def call_toko_sembako_service(url: str, query: str, variables: Dict[str, Any] = None) -> Dict[str, Any]:
    """Helper function untuk memanggil GraphQL service dari Toko Sembako"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                url,
                json={"query": query, "variables": variables or {}},
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            data = response.json()
            
            if "errors" in data:
                raise Exception(data["errors"][0]["message"])
            
            return data.get("data", {})
    except Exception as e:
        print(f"Error calling Toko Sembako service at {url}: {str(e)}")
        raise

async def get_products_from_toko_sembako(category: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get products (sayur) dari Toko Sembako Product Service"""
    try:
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
        """ if category else """
            query GetProducts {
                products {
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
        
        variables = {"category": category} if category else {}
        data = await call_toko_sembako_service(TOKO_SEMBAKO_PRODUCT_URL, query, variables)
        return data.get("products", [])
    except Exception as e:
        print(f"Error fetching products from Toko Sembako: {str(e)}")
        return []

async def get_product_by_id_from_toko_sembako(product_id: str) -> Optional[Dict[str, Any]]:
    """Get product by ID dari Toko Sembako"""
    try:
        query = """
            query GetProduct($id: ID!) {
                product(id: $id) {
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
        
        data = await call_toko_sembako_service(TOKO_SEMBAKO_PRODUCT_URL, query, {"id": product_id})
        return data.get("product")
    except Exception as e:
        print(f"Error fetching product from Toko Sembako: {str(e)}")
        return None

async def check_stock_from_toko_sembako(product_id: str, quantity: float) -> Dict[str, Any]:
    """Check stock dari Toko Sembako Inventory Service"""
    try:
        query = """
            query CheckStock($productId: ID!, $quantity: Float!) {
                checkStock(productId: $productId, quantity: $quantity) {
                    available
                    currentStock
                    requestedQuantity
                    message
                }
            }
        """
        
        data = await call_toko_sembako_service(
            TOKO_SEMBAKO_INVENTORY_URL, 
            query, 
            {"productId": product_id, "quantity": quantity}
        )
        
        return data.get("checkStock", {
            "available": False,
            "currentStock": 0,
            "requestedQuantity": quantity,
            "message": f"Error checking stock"
        })
    except Exception as e:
        print(f"Error checking stock from Toko Sembako: {str(e)}")
        return {
            "available": False,
            "currentStock": 0,
            "requestedQuantity": quantity,
            "message": f"Error checking stock: {str(e)}"
        }

async def create_order_at_toko_sembako(order_input: Dict[str, Any]) -> Dict[str, Any]:
    """Create order di Toko Sembako Order Service"""
    try:
        query = """
            mutation CreateOrder($input: CreateOrderInput!) {
                createOrder(input: $input) {
                    id
                    orderId
                    status
                    total
                    items {
                        productId
                        name
                        quantity
                        price
                    }
                    createdAt
                }
            }
        """
        
        data = await call_toko_sembako_service(TOKO_SEMBAKO_ORDER_URL, query, {"input": order_input})
        return data.get("createOrder")
    except Exception as e:
        print(f"Error creating order at Toko Sembako: {str(e)}")
        raise

async def get_order_status_from_toko_sembako(order_id: str) -> Optional[Dict[str, Any]]:
    """Get order status dari Toko Sembako"""
    try:
        query = """
            query GetOrder($orderId: String!) {
                orderByOrderId(orderId: $orderId) {
                    id
                    orderId
                    status
                    items {
                        productId
                        name
                        quantity
                    }
                }
            }
        """
        
        data = await call_toko_sembako_service(TOKO_SEMBAKO_ORDER_URL, query, {"orderId": order_id})
        return data.get("orderByOrderId")
    except Exception as e:
        print(f"Error fetching order from Toko Sembako: {str(e)}")
        return None








