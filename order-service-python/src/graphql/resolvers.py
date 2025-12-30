from typing import Optional, List, Dict, Any
import httpx
import os
import json
from ariadne import QueryType, MutationType, ObjectType
from src.database.connection import get_db
from src.auth import require_auth, require_role, require_min_role
from dotenv import load_dotenv

load_dotenv()

# Service URLs
KITCHEN_SERVICE_URL = os.getenv("KITCHEN_SERVICE_URL", "http://localhost:4001/graphql")
INVENTORY_SERVICE_URL = os.getenv("INVENTORY_SERVICE_URL", "http://localhost:4002/graphql")
USER_SERVICE_URL = os.getenv("USER_SERVICE_URL", "http://localhost:4003/graphql")

async def call_graphql_service(url: str, query: str, variables: dict = None):
    """Helper function to call GraphQL service"""
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
        print(f"Error calling service at {url}: {str(e)}")
        raise

def parse_json_field(field):
    """Parse JSON field from database"""
    if not field:
        return None
    if isinstance(field, str):
        try:
            return json.loads(field)
        except:
            return field
    return field

query = QueryType()
mutation = MutationType()
menu = ObjectType("Menu")
order = ObjectType("Order")
cart = ObjectType("Cart")
order_item = ObjectType("OrderItem")
ingredient_info = ObjectType("IngredientInfo")
stock_check_result = ObjectType("StockCheckResult")

# Query resolvers
@query.field("menus")
async def resolve_menus(_, info, category: Optional[str] = None, available: Optional[bool] = None):
    """Get all menus"""
    pool = get_db()
    if not pool:
        return []
    
    query_sql = "SELECT * FROM menus WHERE 1=1"
    params = []
    
    if category:
        query_sql += " AND category = %s"
        params.append(category)
    if available is not None:
        query_sql += " AND available = %s"
        params.append(available)
    
    query_sql += " ORDER BY name ASC"
    
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(query_sql, params)
            rows = await cur.fetchall()
            
            menus = []
            for row in rows:
                # With DictCursor, row is already a dictionary
                menu_id = row.get("id")
                if menu_id is None:
                    continue
                    
                ingredients_data = parse_json_field(row.get("ingredients")) or []
                tags_data = parse_json_field(row.get("tags")) or []
                
                menus.append({
                    'id': str(menu_id),
                    'menuId': row.get("menu_id", ""),
                    'name': row.get("name", ""),
                    'description': row.get("description"),
                    'category': row.get("category", ""),
                    'price': float(row.get("price", 0) or 0),
                    'image': row.get("image"),
                    'ingredients': [
                        {
                            'ingredientId': ing.get("ingredientId", ""),
                            'ingredientName': ing.get("ingredientName", ""),
                            'quantity': float(ing.get("quantity", 0)),
                            'unit': ing.get("unit", "")
                        }
                        for ing in ingredients_data
                    ],
                    'available': bool(row.get("available", True)),
                    'preparationTime': row.get("preparation_time", 15),
                    'tags': tags_data,
                    'createdAt': row.get("created_at").isoformat() if row.get("created_at") else "",
                    'updatedAt': row.get("updated_at").isoformat() if row.get("updated_at") else ""
                })
    
    return menus

@query.field("menu")
async def resolve_menu(_, info, id: str):
    """Get menu by ID"""
    pool = get_db()
    if not pool:
        return None
    
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT * FROM menus WHERE id = %s", (id,))
            row = await cur.fetchone()
            
            if not row:
                return None
            
            ingredients_data = parse_json_field(row.get("ingredients")) or []
            tags_data = parse_json_field(row.get("tags")) or []
            
            return {
                'id': str(row.get("id")),
                'menuId': row.get("menu_id", ""),
                'name': row.get("name", ""),
                'description': row.get("description"),
                'category': row.get("category", ""),
                'price': float(row.get("price", 0) or 0),
                'image': row.get("image"),
                'ingredients': [
                    {
                        'ingredientId': ing.get("ingredientId", ""),
                        'ingredientName': ing.get("ingredientName", ""),
                        'quantity': float(ing.get("quantity", 0)),
                        'unit': ing.get("unit", "")
                    }
                    for ing in ingredients_data
                ],
                'available': bool(row.get("available", True)),
                'preparationTime': row.get("preparation_time", 15),
                'tags': tags_data,
                'createdAt': row.get("created_at").isoformat() if row.get("created_at") else "",
                'updatedAt': row.get("updated_at").isoformat() if row.get("updated_at") else ""
            }

@query.field("menuCategories")
async def resolve_menu_categories(_, info):
    """Get menu categories"""
    pool = get_db()
    if not pool:
        return []
    
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT DISTINCT category FROM menus WHERE category IS NOT NULL ORDER BY category")
            rows = await cur.fetchall()
            return [row[0] for row in rows]

@query.field("cart")
async def resolve_cart(_, info, cartId: str):
    """Get cart by cart ID"""
    pool = get_db()
    if not pool:
        return None
    
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT * FROM carts WHERE cart_id = %s", (cartId,))
            row = await cur.fetchone()
            
            if not row:
                return None
            
            items_data = parse_json_field(row.get("items")) or []
            subtotal = sum(float(i.get("price", 0)) * int(i.get("quantity", 0)) for i in items_data)
            tax = subtotal * 0.1
            service_charge = subtotal * 0.05
            discount = float(row.get("discount", 0) or 0)
            total = subtotal + tax + service_charge - discount
            
            return {
                'id': str(row.get("id")),
                'cartId': row.get("cart_id", ""),
                'customerId': row.get("customer_id"),
                'tableNumber': row.get("table_number"),
                'items': [
                    {
                        'menuId': i.get("menuId", ""),
                        'name': i.get("name", ""),
                        'quantity': i.get("quantity", 0),
                        'price': float(i.get("price", 0)),
                        'specialInstructions': i.get("specialInstructions")
                    }
                    for i in items_data
                ],
                'subtotal': subtotal,
                'tax': tax,
                'serviceCharge': service_charge,
                'discount': discount,
                'total': total,
                'status': row.get("status", "active"),
                'createdAt': row.get("created_at").isoformat() if row.get("created_at") else "",
                'updatedAt': row.get("updated_at").isoformat() if row.get("updated_at") else ""
            }

@query.field("cartsByCustomer")
async def resolve_carts_by_customer(_, info, customerId: str):
    """Get carts by customer ID"""
    pool = get_db()
    if not pool:
        return []
    
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT * FROM carts WHERE customer_id = %s ORDER BY created_at DESC", (customerId,))
            rows = await cur.fetchall()
            
            carts = []
            for row in rows:
                items_data = parse_json_field(row.get("items")) or []
                subtotal = sum(float(i.get("price", 0)) * int(i.get("quantity", 0)) for i in items_data)
                tax = subtotal * 0.1
                service_charge = subtotal * 0.05
                discount = float(row.get("discount", 0) or 0)
                total = subtotal + tax + service_charge - discount
                
                carts.append({
                    'id': str(row.get("id")),
                    'cartId': row.get("cart_id", ""),
                    'customerId': row.get("customer_id"),
                    'tableNumber': row.get("table_number"),
                    'items': [
                        {
                            'menuId': i.get("menuId", ""),
                            'name': i.get("name", ""),
                            'quantity': i.get("quantity", 0),
                            'price': float(i.get("price", 0)),
                            'specialInstructions': i.get("specialInstructions")
                        }
                        for i in items_data
                    ],
                    'subtotal': subtotal,
                    'tax': tax,
                    'serviceCharge': service_charge,
                    'discount': discount,
                    'total': total,
                    'status': row.get("status", "active"),
                    'createdAt': row.get("created_at").isoformat() if row.get("created_at") else "",
                    'updatedAt': row.get("updated_at").isoformat() if row.get("updated_at") else ""
                })
            
            return carts

@query.field("activeCarts")
async def resolve_active_carts(_, info):
    """Get all active carts"""
    pool = get_db()
    if not pool:
        return []
    
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT * FROM carts WHERE status = 'active' ORDER BY created_at DESC")
            rows = await cur.fetchall()
            
            carts = []
            for row in rows:
                items_data = parse_json_field(row.get("items")) or []
                subtotal = sum(float(i.get("price", 0)) * int(i.get("quantity", 0)) for i in items_data)
                tax = subtotal * 0.1
                service_charge = subtotal * 0.05
                discount = float(row.get("discount", 0) or 0)
                total = subtotal + tax + service_charge - discount
                
                carts.append({
                    'id': str(row.get("id")),
                    'cartId': row.get("cart_id", ""),
                    'customerId': row.get("customer_id"),
                    'tableNumber': row.get("table_number"),
                    'items': [
                        {
                            'menuId': i.get("menuId", ""),
                            'name': i.get("name", ""),
                            'quantity': i.get("quantity", 0),
                            'price': float(i.get("price", 0)),
                            'specialInstructions': i.get("specialInstructions")
                        }
                        for i in items_data
                    ],
                    'subtotal': subtotal,
                    'tax': tax,
                    'serviceCharge': service_charge,
                    'discount': discount,
                    'total': total,
                    'status': row.get("status", "active"),
                    'createdAt': row.get("created_at").isoformat() if row.get("created_at") else "",
                    'updatedAt': row.get("updated_at").isoformat() if row.get("updated_at") else ""
                })
            
            return carts

@query.field("orders")
async def resolve_orders(_, info, customerId: Optional[str] = None, status: Optional[str] = None):
    """Get all orders"""
    pool = get_db()
    if not pool:
        return []
    
    query_sql = "SELECT * FROM orders WHERE 1=1"
    params = []
    
    if customerId:
        query_sql += " AND customer_id = %s"
        params.append(customerId)
    if status:
        query_sql += " AND order_status = %s"
        params.append(status)
    
    query_sql += " ORDER BY created_at DESC"
    
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(query_sql, params)
            rows = await cur.fetchall()
            
            orders = []
            for row in rows:
                # With DictCursor, row is already a dictionary
                items_data = parse_json_field(row.get("items")) or []
                
                orders.append({
                    'id': str(row.get("id")),
                    'orderId': row.get("order_id", ""),
                    'customerId': row.get("customer_id"),
                    'tableNumber': row.get("table_number"),
                    'items': [
                        {
                            'menuId': item.get("menuId", "") if isinstance(item, dict) else "",
                            'name': item.get("name", "") if isinstance(item, dict) else "",
                            'quantity': item.get("quantity", 0) if isinstance(item, dict) else 0,
                            'price': float(item.get("price", 0) if isinstance(item, dict) else 0),
                            'specialInstructions': item.get("specialInstructions") if isinstance(item, dict) else None
                        }
                        for item in items_data
                    ],
                    'subtotal': float(row.get("subtotal", 0) or 0),
                    'tax': float(row.get("tax", 0) or 0),
                    'serviceCharge': float(row.get("service_charge", 0) or 0),
                    'discount': float(row.get("discount", 0) or 0),
                    'loyaltyPointsUsed': float(row.get("loyalty_points_used", 0) or 0),
                    'loyaltyPointsEarned': float(row.get("loyalty_points_earned", 0) or 0),
                    'total': float(row.get("total", 0) or 0),
                    'paymentMethod': row.get("payment_method", "cash"),
                    'paymentStatus': row.get("payment_status", "pending"),
                    'orderStatus': row.get("order_status", "pending"),
                    'kitchenStatus': row.get("kitchen_status"),
                    'staffId': row.get("staff_id"),
                    'notes': row.get("notes"),
                    'createdAt': row.get("created_at").isoformat() if row.get("created_at") else "",
                    'updatedAt': row.get("updated_at").isoformat() if row.get("updated_at") else ""
                })
    
    return orders

@query.field("order")
async def resolve_order(_, info, id: str):
    """Get order by ID"""
    pool = get_db()
    if not pool:
        return None
    
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT * FROM orders WHERE id = %s", (id,))
            row = await cur.fetchone()
            
            if not row:
                return None
            
            # With DictCursor, row is already a dictionary
            items_data = parse_json_field(row.get("items")) or []
            
            return {
                'id': str(row.get("id")),
                'orderId': row.get("order_id", ""),
                'customerId': row.get("customer_id"),
                'tableNumber': row.get("table_number"),
                'items': [
                    {
                        'menuId': item.get("menuId", "") if isinstance(item, dict) else "",
                        'name': item.get("name", "") if isinstance(item, dict) else "",
                        'quantity': item.get("quantity", 0) if isinstance(item, dict) else 0,
                        'price': float(item.get("price", 0) if isinstance(item, dict) else 0),
                        'specialInstructions': item.get("specialInstructions") if isinstance(item, dict) else None
                    }
                    for item in items_data
                ],
                'subtotal': float(row.get("subtotal", 0) or 0),
                'tax': float(row.get("tax", 0) or 0),
                'serviceCharge': float(row.get("service_charge", 0) or 0),
                'discount': float(row.get("discount", 0) or 0),
                'loyaltyPointsUsed': float(row.get("loyalty_points_used", 0) or 0),
                'loyaltyPointsEarned': float(row.get("loyalty_points_earned", 0) or 0),
                'total': float(row.get("total", 0) or 0),
                'paymentMethod': row.get("payment_method", "cash"),
                'paymentStatus': row.get("payment_status", "pending"),
                'orderStatus': row.get("order_status", "pending"),
                'kitchenStatus': row.get("kitchen_status"),
                'staffId': row.get("staff_id"),
                'notes': row.get("notes"),
                'createdAt': row.get("created_at").isoformat() if row.get("created_at") else "",
                'updatedAt': row.get("updated_at").isoformat() if row.get("updated_at") else ""
            }

@query.field("orderByOrderId")
async def resolve_order_by_order_id(_, info, orderId: str):
    """Get order by order ID"""
    pool = get_db()
    if not pool:
        return None
    
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT * FROM orders WHERE order_id = %s", (orderId,))
            row = await cur.fetchone()
            
            if not row:
                return None
            
            items_data = parse_json_field(row.get("items")) or []
            
            return {
                'id': str(row.get("id")),
                'orderId': row.get("order_id", ""),
                'customerId': row.get("customer_id"),
                'tableNumber': row.get("table_number"),
                'items': [
                    {
                        'menuId': item.get("menuId", "") if isinstance(item, dict) else "",
                        'name': item.get("name", "") if isinstance(item, dict) else "",
                        'quantity': item.get("quantity", 0) if isinstance(item, dict) else 0,
                        'price': float(item.get("price", 0) if isinstance(item, dict) else 0),
                        'specialInstructions': item.get("specialInstructions") if isinstance(item, dict) else None
                    }
                    for item in items_data
                ],
                'subtotal': float(row.get("subtotal", 0) or 0),
                'tax': float(row.get("tax", 0) or 0),
                'serviceCharge': float(row.get("service_charge", 0) or 0),
                'discount': float(row.get("discount", 0) or 0),
                'loyaltyPointsUsed': float(row.get("loyalty_points_used", 0) or 0),
                'loyaltyPointsEarned': float(row.get("loyalty_points_earned", 0) or 0),
                'total': float(row.get("total", 0) or 0),
                'paymentMethod': row.get("payment_method", "cash"),
                'paymentStatus': row.get("payment_status", "pending"),
                'orderStatus': row.get("order_status", "pending"),
                'kitchenStatus': row.get("kitchen_status"),
                'staffId': row.get("staff_id"),
                'notes': row.get("notes"),
                'createdAt': row.get("created_at").isoformat() if row.get("created_at") else "",
                'updatedAt': row.get("updated_at").isoformat() if row.get("updated_at") else "",
                'completedAt': row.get("completed_at").isoformat() if row.get("completed_at") else None
            }

@query.field("ordersByDate")
async def resolve_orders_by_date(_, info, startDate: str, endDate: str):
    """Get orders by date range"""
    pool = get_db()
    if not pool:
        return []
    
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("""
                SELECT * FROM orders 
                WHERE DATE(created_at) >= %s AND DATE(created_at) <= %s 
                ORDER BY created_at DESC
            """, (startDate, endDate))
            rows = await cur.fetchall()
            
            orders = []
            for row in rows:
                items_data = parse_json_field(row.get("items")) or []
                
                orders.append({
                    'id': str(row.get("id")),
                    'orderId': row.get("order_id", ""),
                    'customerId': row.get("customer_id"),
                    'tableNumber': row.get("table_number"),
                    'items': [
                        {
                            'menuId': item.get("menuId", "") if isinstance(item, dict) else "",
                            'name': item.get("name", "") if isinstance(item, dict) else "",
                            'quantity': item.get("quantity", 0) if isinstance(item, dict) else 0,
                            'price': float(item.get("price", 0) if isinstance(item, dict) else 0),
                            'specialInstructions': item.get("specialInstructions") if isinstance(item, dict) else None
                        }
                        for item in items_data
                    ],
                    'subtotal': float(row.get("subtotal", 0) or 0),
                    'tax': float(row.get("tax", 0) or 0),
                    'serviceCharge': float(row.get("service_charge", 0) or 0),
                    'discount': float(row.get("discount", 0) or 0),
                    'loyaltyPointsUsed': float(row.get("loyalty_points_used", 0) or 0),
                    'loyaltyPointsEarned': float(row.get("loyalty_points_earned", 0) or 0),
                    'total': float(row.get("total", 0) or 0),
                    'paymentMethod': row.get("payment_method", "cash"),
                    'paymentStatus': row.get("payment_status", "pending"),
                    'orderStatus': row.get("order_status", "pending"),
                    'kitchenStatus': row.get("kitchen_status"),
                    'staffId': row.get("staff_id"),
                    'notes': row.get("notes"),
                    'createdAt': row.get("created_at").isoformat() if row.get("created_at") else "",
                    'updatedAt': row.get("updated_at").isoformat() if row.get("updated_at") else "",
                    'completedAt': row.get("completed_at").isoformat() if row.get("completed_at") else None
                })
            
            return orders

@query.field("menuByMenuId")
async def resolve_menu_by_menu_id(_, info, menuId: str):
    """Get menu by menu ID"""
    pool = get_db()
    if not pool:
        return None
    
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT * FROM menus WHERE menu_id = %s", (menuId,))
            row = await cur.fetchone()
            
            if not row:
                return None
            
            ingredients_data = parse_json_field(row.get("ingredients")) or []
            tags_data = parse_json_field(row.get("tags")) or []
            
            return {
                'id': str(row.get("id")),
                'menuId': row.get("menu_id", ""),
                'name': row.get("name", ""),
                'description': row.get("description"),
                'category': row.get("category", ""),
                'price': float(row.get("price", 0) or 0),
                'image': row.get("image"),
                'ingredients': [
                    {
                        'ingredientId': ing.get("ingredientId", ""),
                        'ingredientName': ing.get("ingredientName", ""),
                        'quantity': float(ing.get("quantity", 0)),
                        'unit': ing.get("unit", "")
                    }
                    for ing in ingredients_data
                ],
                'available': bool(row.get("available", True)),
                'preparationTime': row.get("preparation_time", 15),
                'tags': tags_data,
                'createdAt': row.get("created_at").isoformat() if row.get("created_at") else "",
                'updatedAt': row.get("updated_at").isoformat() if row.get("updated_at") else ""
            }

@query.field("checkMenuStock")
async def resolve_check_menu_stock(_, info, menuId: str, quantity: int):
    """Check menu stock"""
    pool = get_db()
    if not pool:
        return []
    
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT * FROM menus WHERE menu_id = %s", (menuId,))
            row = await cur.fetchone()
            
            if not row:
                return []
            
            # With DictCursor, row is already a dictionary
            ingredients_data = parse_json_field(row.get("ingredients")) or []
            
            results = []
            for ing in ingredients_data:
                required = float(ing.get("quantity", 0)) * quantity
                ingredient_id = ing.get("ingredientId", "")
                
                # Check stock from inventory service
                try:
                    check_query = """
                        query CheckStock($ingredientId: String!, $quantity: Float!) {
                            checkStock(ingredientId: $ingredientId, quantity: $quantity) {
                                available
                                currentStock
                                message
                            }
                        }
                    """
                    stock_data = await call_graphql_service(
                        INVENTORY_SERVICE_URL,
                        check_query,
                        {"ingredientId": ingredient_id, "quantity": required}
                    )
                    
                    stock_check = stock_data.get("checkStock", {})
                    results.append({
                        'available': stock_check.get("available", False),
                        'message': stock_check.get("message", ""),
                        'ingredientId': ingredient_id,
                        'ingredientName': ing.get("ingredientName", ""),
                        'required': required,
                        'availableQuantity': float(stock_check.get("currentStock", 0))
                    })
                except Exception as e:
                    results.append({
                        'available': False,
                        'message': f"Error checking stock: {str(e)}",
                        'ingredientId': ingredient_id,
                        'ingredientName': ing.get("ingredientName", ""),
                        'required': required,
                        'availableQuantity': 0.0
                    })
            
            return results

# Mutation resolvers
@mutation.field("createMenu")
@require_min_role("manager")
async def resolve_create_menu(_, info, input: Dict[str, Any]):
    """Create menu - requires manager or admin role"""
    pool = get_db()
    if not pool:
        raise Exception("Database connection not available")
    
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            ingredients_json = json.dumps(input.get("ingredients", []))
            tags_json = json.dumps(input.get("tags", []))
            
            await cur.execute("""
                INSERT INTO menus (menu_id, name, description, category, price, image, ingredients, available, preparation_time, tags)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                input['menuId'], input['name'], input.get('description'),
                input['category'], input['price'], input.get('image'),
                ingredients_json, input.get('available', True),
                input.get('preparationTime', 15), tags_json
            ))
            
            await conn.commit()
            
            # Fetch by menu_id instead of lastrowid for reliability
            await cur.execute("SELECT * FROM menus WHERE menu_id = %s", (input['menuId'],))
            row = await cur.fetchone()
            
            if not row:
                raise Exception("Failed to create menu")
            
            ingredients_data = parse_json_field(row.get("ingredients")) or []
            tags_data = parse_json_field(row.get("tags")) or []
            
            menu_id = row.get("id")
            if menu_id is None:
                raise Exception("Menu created but ID not found")
            
            return {
                'id': str(menu_id),
                'menuId': row.get("menu_id", ""),
                'name': row.get("name", ""),
                'description': row.get("description"),
                'category': row.get("category", ""),
                'price': float(row.get("price", 0) or 0),
                'image': row.get("image"),
                'ingredients': [
                    {
                        'ingredientId': ing.get("ingredientId", ""),
                        'ingredientName': ing.get("ingredientName", ""),
                        'quantity': float(ing.get("quantity", 0)),
                        'unit': ing.get("unit", "")
                    }
                    for ing in ingredients_data
                ],
                'available': bool(row.get("available", True)),
                'preparationTime': row.get("preparation_time", 15),
                'tags': tags_data,
                'createdAt': row.get("created_at").isoformat() if row.get("created_at") else "",
                'updatedAt': row.get("updated_at").isoformat() if row.get("updated_at") else ""
            }

@mutation.field("updateMenu")
@require_min_role("manager")
async def resolve_update_menu(_, info, id: str, input: Dict[str, Any]):
    """Update menu - requires manager or admin role"""
    pool = get_db()
    if not pool:
        raise Exception("Database connection not available")
    
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            updates = []
            params = []
            
            if 'name' in input:
                updates.append("name = %s")
                params.append(input['name'])
            if 'description' in input:
                updates.append("description = %s")
                params.append(input.get('description'))
            if 'category' in input:
                updates.append("category = %s")
                params.append(input['category'])
            if 'price' in input:
                updates.append("price = %s")
                params.append(input['price'])
            if 'image' in input:
                updates.append("image = %s")
                params.append(input.get('image'))
            if 'ingredients' in input:
                updates.append("ingredients = %s")
                params.append(json.dumps(input['ingredients']))
            if 'available' in input:
                updates.append("available = %s")
                params.append(input['available'])
            if 'preparationTime' in input:
                updates.append("preparation_time = %s")
                params.append(input['preparationTime'])
            if 'tags' in input:
                updates.append("tags = %s")
                params.append(json.dumps(input['tags']))
            
            if not updates:
                raise Exception("No fields to update")
            
            params.append(id)
            await cur.execute(
                f"UPDATE menus SET {', '.join(updates)} WHERE id = %s",
                params
            )
            await conn.commit()
            
            await cur.execute("SELECT * FROM menus WHERE id = %s", (id,))
            row = await cur.fetchone()
            
            if not row:
                raise Exception("Menu not found")
            
            # With DictCursor, row is already a dictionary
            ingredients_data = parse_json_field(row.get("ingredients")) or []
            tags_data = parse_json_field(row.get("tags")) or []
            
            return {
                'id': str(row.get("id")),
                'menuId': row.get("menu_id", ""),
                'name': row.get("name", ""),
                'description': row.get("description"),
                'category': row.get("category", ""),
                'price': float(row.get("price", 0) or 0),
                'image': row.get("image"),
                'ingredients': [
                    {
                        'ingredientId': ing.get("ingredientId", ""),
                        'ingredientName': ing.get("ingredientName", ""),
                        'quantity': float(ing.get("quantity", 0)),
                        'unit': ing.get("unit", "")
                    }
                    for ing in ingredients_data
                ],
                'available': bool(row.get("available", True)),
                'preparationTime': row.get("preparation_time", 15),
                'tags': tags_data,
                'createdAt': row.get("created_at").isoformat() if row.get("created_at") else "",
                'updatedAt': row.get("updated_at").isoformat() if row.get("updated_at") else ""
            }

@mutation.field("deleteMenu")
@require_min_role("admin")
async def resolve_delete_menu(_, info, id: str):
    """Delete menu - requires admin role"""
    pool = get_db()
    if not pool:
        raise Exception("Database connection not available")
    
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("DELETE FROM menus WHERE id = %s", (id,))
            await conn.commit()
            return cur.rowcount > 0

@mutation.field("toggleMenuAvailability")
@require_min_role("manager")
async def resolve_toggle_menu_availability(_, info, id: str):
    """Toggle menu availability - requires manager or admin role"""
    pool = get_db()
    if not pool:
        raise Exception("Database connection not available")
    
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("UPDATE menus SET available = NOT available WHERE id = %s", (id,))
            await conn.commit()
            
            await cur.execute("SELECT * FROM menus WHERE id = %s", (id,))
            row = await cur.fetchone()
            
            if not row:
                raise Exception("Menu not found")
            
            ingredients_data = parse_json_field(row.get("ingredients")) or []
            tags_data = parse_json_field(row.get("tags")) or []
            
            return {
                'id': str(row.get("id")),
                'menuId': row.get("menu_id", ""),
                'name': row.get("name", ""),
                'description': row.get("description"),
                'category': row.get("category", ""),
                'price': float(row.get("price", 0) or 0),
                'image': row.get("image"),
                'ingredients': [
                    {
                        'ingredientId': ing.get("ingredientId", ""),
                        'ingredientName': ing.get("ingredientName", ""),
                        'quantity': float(ing.get("quantity", 0)),
                        'unit': ing.get("unit", "")
                    }
                    for ing in ingredients_data
                ],
                'available': bool(row.get("available", True)),
                'preparationTime': row.get("preparation_time", 15),
                'tags': tags_data,
                'createdAt': row.get("created_at").isoformat() if row.get("created_at") else "",
                'updatedAt': row.get("updated_at").isoformat() if row.get("updated_at") else ""
            }

@mutation.field("createCart")
@require_auth
async def resolve_create_cart(_, info, input: Dict[str, Any]):
    """Create a new cart - requires authentication"""
    pool = get_db()
    if not pool:
        raise Exception("Database connection not available")
    
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            cart_id = input.get("cartId", "")
            customer_id = input.get("customerId")
            table_number = input.get("tableNumber")
            
            await cur.execute("""
                INSERT INTO carts (cart_id, customer_id, table_number, items, status)
                VALUES (%s, %s, %s, %s, %s)
            """, (cart_id, customer_id, table_number, "[]", "active"))
            
            await conn.commit()
            
            await cur.execute("SELECT * FROM carts WHERE cart_id = %s", (cart_id,))
            row = await cur.fetchone()
            
            if not row:
                raise Exception("Cart not created")
            
            return {
                'id': str(row.get("id")),
                'cartId': row.get("cart_id", ""),
                'customerId': row.get("customer_id"),
                'tableNumber': row.get("table_number"),
                'items': [],
                'subtotal': 0.0,
                'tax': 0.0,
                'serviceCharge': 0.0,
                'discount': 0.0,
                'total': 0.0,
                'status': row.get("status", "active"),
                'createdAt': row.get("created_at").isoformat() if row.get("created_at") else "",
                'updatedAt': row.get("updated_at").isoformat() if row.get("updated_at") else ""
            }

@mutation.field("applyDiscount")
@require_min_role("manager")
async def resolve_apply_discount(_, info, cartId: str, discount: float):
    """Apply discount to cart - requires manager or admin role"""
    pool = get_db()
    if not pool:
        raise Exception("Database connection not available")
    
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("UPDATE carts SET discount = %s WHERE cart_id = %s", (discount, cartId))
            await conn.commit()
            
            await cur.execute("SELECT * FROM carts WHERE cart_id = %s", (cartId,))
            row = await cur.fetchone()
            
            if not row:
                raise Exception("Cart not found")
            
            items_data = parse_json_field(row.get("items")) or []
            subtotal = sum(float(i.get("price", 0)) * int(i.get("quantity", 0)) for i in items_data)
            tax = subtotal * 0.1
            service_charge = subtotal * 0.05
            total = subtotal + tax + service_charge - discount
            
            return {
                'id': str(row.get("id")),
                'cartId': row.get("cart_id", ""),
                'customerId': row.get("customer_id"),
                'tableNumber': row.get("table_number"),
                'items': [
                    {
                        'menuId': i.get("menuId", ""),
                        'name': i.get("name", ""),
                        'quantity': i.get("quantity", 0),
                        'price': float(i.get("price", 0)),
                        'specialInstructions': i.get("specialInstructions")
                    }
                    for i in items_data
                ],
                'subtotal': subtotal,
                'tax': tax,
                'serviceCharge': service_charge,
                'discount': discount,
                'total': total,
                'status': row.get("status", "active"),
                'createdAt': row.get("created_at").isoformat() if row.get("created_at") else "",
                'updatedAt': row.get("updated_at").isoformat() if row.get("updated_at") else ""
            }

@mutation.field("createOrderFromCart")
@require_auth
async def resolve_create_order_from_cart(_, info, cartId: str, input: Dict[str, Any]):
    """Create order from cart - requires authentication"""
    pool = get_db()
    if not pool:
        raise Exception("Database connection not available")
    
    import uuid
    
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            # Get cart
            await cur.execute("SELECT * FROM carts WHERE cart_id = %s", (cartId,))
            cart_row = await cur.fetchone()
            
            if not cart_row:
                raise Exception("Cart not found")
            
            items = parse_json_field(cart_row.get("items")) or []
            
            # Calculate totals
            subtotal = sum(float(item.get("price", 0)) * int(item.get("quantity", 0)) for item in items)
            tax = subtotal * 0.1
            service_charge = subtotal * 0.05
            discount = float(cart_row.get("discount", 0) or 0)
            loyalty_points_used = float(input.get("loyaltyPointsUsed", 0))
            loyalty_points_earned = subtotal * 0.01
            total = subtotal + tax + service_charge - discount - (loyalty_points_used * 0.01)
            
            order_id = input.get("orderId", f"ORD-{uuid.uuid4().hex[:8].upper()}")
            
            items_json = json.dumps(items)
            await cur.execute("""
                INSERT INTO orders (order_id, customer_id, table_number, items, subtotal, tax, service_charge, discount, 
                                  loyalty_points_used, loyalty_points_earned, total, payment_method, payment_status, 
                                  order_status, notes)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                order_id, input.get("customerId") or cart_row.get("customer_id"), 
                input.get("tableNumber") or cart_row.get("table_number"), items_json,
                subtotal, tax, service_charge, discount, loyalty_points_used, loyalty_points_earned, total,
                input.get("paymentMethod", "cash"), "pending", "pending", input.get("notes")
            ))
            
            await conn.commit()
            
            # Clear cart
            await cur.execute("UPDATE carts SET items = '[]', status = 'completed' WHERE cart_id = %s", (cartId,))
            await conn.commit()
            
            # Fetch created order
            await cur.execute("SELECT * FROM orders WHERE order_id = %s", (order_id,))
            row = await cur.fetchone()
            
            if not row:
                raise Exception("Order created but not found")
            
            items_data = parse_json_field(row.get("items")) or []
            
            return {
                'order': {
                    'id': str(row.get("id")),
                    'orderId': row.get("order_id", ""),
                    'customerId': row.get("customer_id"),
                    'tableNumber': row.get("table_number"),
                    'items': [
                        {
                            'menuId': item.get("menuId", ""),
                            'name': item.get("name", ""),
                            'quantity': item.get("quantity", 0),
                            'price': float(item.get("price", 0)),
                            'specialInstructions': item.get("specialInstructions")
                        }
                        for item in items_data
                    ],
                    'subtotal': float(row.get("subtotal", 0) or 0),
                    'tax': float(row.get("tax", 0) or 0),
                    'serviceCharge': float(row.get("service_charge", 0) or 0),
                    'discount': float(row.get("discount", 0) or 0),
                    'loyaltyPointsUsed': float(row.get("loyalty_points_used", 0) or 0),
                    'loyaltyPointsEarned': float(row.get("loyalty_points_earned", 0) or 0),
                    'total': float(row.get("total", 0) or 0),
                    'paymentMethod': row.get("payment_method", "cash"),
                    'paymentStatus': row.get("payment_status", "pending"),
                    'orderStatus': row.get("order_status", "pending"),
                    'kitchenStatus': row.get("kitchen_status"),
                    'staffId': row.get("staff_id"),
                    'notes': row.get("notes"),
                    'createdAt': row.get("created_at").isoformat() if row.get("created_at") else "",
                    'updatedAt': row.get("updated_at").isoformat() if row.get("updated_at") else "",
                    'completedAt': row.get("completed_at").isoformat() if row.get("completed_at") else None
                },
                'kitchenOrderCreated': False,
                'stockUpdated': False,
                'loyaltyPointsEarned': loyalty_points_earned,
                'message': 'Order created from cart successfully'
            }

@mutation.field("addItemToCart")
@require_auth
async def resolve_add_item_to_cart(_, info, cartId: str, item: Dict[str, Any]):
    """Add item to cart - requires authentication"""
    pool = get_db()
    if not pool:
        raise Exception("Database connection not available")
    
    menuId = item.get("menuId", "")
    quantity = item.get("quantity", 1)
    specialInstructions = item.get("specialInstructions")
    
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            # Get cart
            await cur.execute("SELECT * FROM carts WHERE cart_id = %s", (cartId,))
            cart_row = await cur.fetchone()
            
            if not cart_row:
                raise Exception("Cart not found")
            
            items = parse_json_field(cart_row.get("items")) or []
            
            # Add or update item
            item_found = False
            for existing_item in items:
                if existing_item.get("menuId") == menuId:
                    existing_item["quantity"] = existing_item.get("quantity", 0) + quantity
                    if specialInstructions:
                        existing_item["specialInstructions"] = specialInstructions
                    item_found = True
                    break
            
            if not item_found:
                items.append({
                    "menuId": menuId,
                    "name": item.get("name", ""),
                    "quantity": quantity,
                    "price": float(item.get("price", 0)),
                    "specialInstructions": specialInstructions
                })
            
            items_json = json.dumps(items)
            await cur.execute("UPDATE carts SET items = %s WHERE cart_id = %s", (items_json, cartId))
            await conn.commit()
            
            # Fetch updated cart
            await cur.execute("SELECT * FROM carts WHERE cart_id = %s", (cartId,))
            cart_row = await cur.fetchone()
            items_data = parse_json_field(cart_row.get("items")) or []
            
            subtotal = sum(float(i.get("price", 0)) * int(i.get("quantity", 0)) for i in items_data)
            tax = subtotal * 0.1
            service_charge = subtotal * 0.05
            discount = float(cart_row.get("discount", 0) or 0)
            total = subtotal + tax + service_charge - discount
            
            return {
                'id': str(cart_row.get("id")),
                'cartId': cart_row.get("cart_id", ""),
                'customerId': cart_row.get("customer_id"),
                'tableNumber': cart_row.get("table_number"),
                'items': [
                    {
                        'menuId': i.get("menuId", ""),
                        'name': i.get("name", ""),
                        'quantity': i.get("quantity", 0),
                        'price': float(i.get("price", 0)),
                        'specialInstructions': i.get("specialInstructions")
                    }
                    for i in items_data
                ],
                'subtotal': subtotal,
                'tax': tax,
                'serviceCharge': service_charge,
                'discount': discount,
                'total': total,
                'status': cart_row.get("status", "active"),
                'createdAt': cart_row.get("created_at").isoformat() if cart_row.get("created_at") else "",
                'updatedAt': cart_row.get("updated_at").isoformat() if cart_row.get("updated_at") else ""
            }

@mutation.field("updateCartItem")
async def resolve_update_cart_item(_, info, cartId: str, menuId: str, quantity: int):
    """Update cart item"""
    pool = get_db()
    if not pool:
        raise Exception("Database connection not available")
    
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT * FROM carts WHERE cart_id = %s", (cartId,))
            cart_row = await cur.fetchone()
            
            if not cart_row:
                raise Exception("Cart not found")
            
            items = parse_json_field(cart_row.get("items")) or []
            
            # Update item
            for item in items:
                if item.get("menuId") == menuId:
                    if quantity <= 0:
                        items.remove(item)
                    else:
                        item["quantity"] = quantity
                    break
            
            items_json = json.dumps(items)
            await cur.execute("UPDATE carts SET items = %s WHERE cart_id = %s", (items_json, cartId))
            await conn.commit()
            
            # Fetch updated cart
            await cur.execute("SELECT * FROM carts WHERE cart_id = %s", (cartId,))
            cart_row = await cur.fetchone()
            items_data = parse_json_field(cart_row.get("items")) or []
            
            subtotal = sum(float(i.get("price", 0)) * int(i.get("quantity", 0)) for i in items_data)
            tax = subtotal * 0.1
            service_charge = subtotal * 0.05
            discount = float(cart_row.get("discount", 0) or 0)
            total = subtotal + tax + service_charge - discount
            
            return {
                'id': str(cart_row.get("id")),
                'cartId': cart_row.get("cart_id", ""),
                'customerId': cart_row.get("customer_id"),
                'tableNumber': cart_row.get("table_number"),
                'items': [
                    {
                        'menuId': i.get("menuId", ""),
                        'name': i.get("name", ""),
                        'quantity': i.get("quantity", 0),
                        'price': float(i.get("price", 0)),
                        'specialInstructions': i.get("specialInstructions")
                    }
                    for i in items_data
                ],
                'subtotal': subtotal,
                'tax': tax,
                'serviceCharge': service_charge,
                'discount': discount,
                'total': total,
                'status': cart_row.get("status", "active"),
                'createdAt': cart_row.get("created_at").isoformat() if cart_row.get("created_at") else "",
                'updatedAt': cart_row.get("updated_at").isoformat() if cart_row.get("updated_at") else ""
            }

@mutation.field("removeItemFromCart")
async def resolve_remove_item_from_cart(_, info, cartId: str, menuId: str):
    """Remove item from cart"""
    return await resolve_update_cart_item(_, info, cartId, menuId, 0)

@mutation.field("clearCart")
async def resolve_clear_cart(_, info, cartId: str):
    """Clear cart"""
    pool = get_db()
    if not pool:
        raise Exception("Database connection not available")
    
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("UPDATE carts SET items = %s WHERE cart_id = %s", ("[]", cartId))
            await conn.commit()
            
            await cur.execute("SELECT * FROM carts WHERE cart_id = %s", (cartId,))
            cart_row = await cur.fetchone()
            
            if not cart_row:
                return None
            
            return {
                'id': str(cart_row.get("id")),
                'cartId': cart_row.get("cart_id", ""),
                'customerId': cart_row.get("customer_id"),
                'tableNumber': cart_row.get("table_number"),
                'items': [],
                'subtotal': 0.0,
                'tax': 0.0,
                'serviceCharge': 0.0,
                'discount': 0.0,
                'total': 0.0,
                'status': cart_row.get("status", "active"),
                'createdAt': cart_row.get("created_at").isoformat() if cart_row.get("created_at") else "",
                'updatedAt': cart_row.get("updated_at").isoformat() if cart_row.get("updated_at") else ""
            }

@mutation.field("createOrder")
async def resolve_create_order(_, info, input: Dict[str, Any]):
    """Create order"""
    # This is a simplified version - full implementation would integrate with kitchen and inventory services
    pool = get_db()
    if not pool:
        raise Exception("Database connection not available")
    
    import uuid
    from datetime import datetime
    
    order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"
    items = input.get("items", [])
    subtotal = sum(float(item.get("price", 0)) * int(item.get("quantity", 0)) for item in items)
    tax = subtotal * 0.1
    service_charge = subtotal * 0.05
    discount = 0.0
    loyalty_points_used = float(input.get("loyaltyPointsUsed", 0))
    loyalty_points_earned = subtotal * 0.01
    total = subtotal + tax + service_charge - discount - (loyalty_points_used * 0.01)
    
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            items_json = json.dumps(items)
            await cur.execute("""
                INSERT INTO orders (order_id, customer_id, table_number, items, subtotal, tax, service_charge, discount, 
                                  loyalty_points_used, loyalty_points_earned, total, payment_method, payment_status, 
                                  order_status, notes)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                order_id, input.get("customerId"), input.get("tableNumber"), items_json,
                subtotal, tax, service_charge, discount, loyalty_points_used, loyalty_points_earned, total,
                input.get("paymentMethod", "cash"), "pending", "pending", input.get("notes")
            ))
            
            order_db_id = cur.lastrowid
            await conn.commit()
            
            # Fetch created order
            await cur.execute("SELECT * FROM orders WHERE id = %s", (order_db_id,))
            row = await cur.fetchone()
            
            if not row:
                raise Exception("Order created but not found")
            
            # With DictCursor, row is already a dictionary
            items_data = parse_json_field(row.get("items")) or []
            
            return {
                'order': {
                    'id': str(row.get("id")),
                    'orderId': row.get("order_id", ""),
                    'customerId': row.get("customer_id"),
                    'tableNumber': row.get("table_number"),
                    'items': [
                        {
                            'menuId': item.get("menuId", "") if isinstance(item, dict) else item["menuId"],
                            'name': item.get("name", "") if isinstance(item, dict) else item["name"],
                            'quantity': item.get("quantity", 0) if isinstance(item, dict) else item["quantity"],
                            'price': float(item.get("price", 0) if isinstance(item, dict) else item["price"]),
                            'specialInstructions': item.get("specialInstructions") if isinstance(item, dict) else item.get("specialInstructions")
                        }
                        for item in items_data
                    ],
                    'subtotal': float(row.get("subtotal", 0) or 0),
                    'tax': float(row.get("tax", 0) or 0),
                    'serviceCharge': float(row.get("service_charge", 0) or 0),
                    'discount': float(row.get("discount", 0) or 0),
                    'loyaltyPointsUsed': float(row.get("loyalty_points_used", 0) or 0),
                    'loyaltyPointsEarned': float(row.get("loyalty_points_earned", 0) or 0),
                    'total': float(row.get("total", 0) or 0),
                    'paymentMethod': row.get("payment_method", "cash"),
                    'paymentStatus': row.get("payment_status", "pending"),
                    'orderStatus': row.get("order_status", "pending"),
                    'kitchenStatus': row.get("kitchen_status"),
                    'staffId': row.get("staff_id"),
                    'notes': row.get("notes"),
                    'createdAt': row.get("created_at").isoformat() if row.get("created_at") else "",
                    'updatedAt': row.get("updated_at").isoformat() if row.get("updated_at") else "",
                    'completedAt': row.get("completed_at").isoformat() if row.get("completed_at") else None
                },
                'kitchenOrderCreated': False,
                'stockUpdated': False,
                'loyaltyPointsEarned': loyalty_points_earned,
                'message': 'Order created successfully'
            }

@mutation.field("updateOrderStatus")
async def resolve_update_order_status(_, info, orderId: str, status: str):
    """Update order status"""
    pool = get_db()
    if not pool:
        raise Exception("Database connection not available")
    
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("UPDATE orders SET order_status = %s WHERE order_id = %s", (status, orderId))
            await conn.commit()
            
            await cur.execute("SELECT * FROM orders WHERE order_id = %s", (orderId,))
            row = await cur.fetchone()
            
            if not row:
                raise Exception("Order not found")
            
            # With DictCursor, row is already a dictionary
            items_data = parse_json_field(row.get("items")) or []
            
            return {
                'id': str(row.get("id")),
                'orderId': row.get("order_id", ""),
                'customerId': row.get("customer_id"),
                'tableNumber': row.get("table_number"),
                'items': [
                    {
                        'menuId': item.get("menuId", "") if isinstance(item, dict) else "",
                        'name': item.get("name", "") if isinstance(item, dict) else "",
                        'quantity': item.get("quantity", 0) if isinstance(item, dict) else 0,
                        'price': float(item.get("price", 0) if isinstance(item, dict) else 0),
                        'specialInstructions': item.get("specialInstructions") if isinstance(item, dict) else None
                    }
                    for item in items_data
                ],
                'subtotal': float(row.get("subtotal", 0) or 0),
                'tax': float(row.get("tax", 0) or 0),
                'serviceCharge': float(row.get("service_charge", 0) or 0),
                'discount': float(row.get("discount", 0) or 0),
                'loyaltyPointsUsed': float(row.get("loyalty_points_used", 0) or 0),
                'loyaltyPointsEarned': float(row.get("loyalty_points_earned", 0) or 0),
                'total': float(row.get("total", 0) or 0),
                'paymentMethod': row.get("payment_method", "cash"),
                'paymentStatus': row.get("payment_status", "pending"),
                'orderStatus': row.get("order_status", "pending"),
                'kitchenStatus': row.get("kitchen_status"),
                'staffId': row.get("staff_id"),
                'notes': row.get("notes"),
                'createdAt': row.get("created_at").isoformat() if row.get("created_at") else "",
                'updatedAt': row.get("updated_at").isoformat() if row.get("updated_at") else ""
            }

@mutation.field("cancelOrder")
async def resolve_cancel_order(_, info, orderId: str):
    """Cancel order"""
    return await resolve_update_order_status(_, info, orderId, "cancelled")

@mutation.field("updateOrder")
async def resolve_update_order(_, info, orderId: str, input: Dict[str, Any]):
    """Update order"""
    pool = get_db()
    if not pool:
        raise Exception("Database connection not available")
    
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            updates = []
            params = []
            
            if 'tableNumber' in input:
                updates.append("table_number = %s")
                params.append(input['tableNumber'])
            if 'items' in input:
                updates.append("items = %s")
                params.append(json.dumps(input['items']))
            if 'paymentMethod' in input:
                updates.append("payment_method = %s")
                params.append(input['paymentMethod'])
            if 'notes' in input:
                updates.append("notes = %s")
                params.append(input['notes'])
            
            if updates:
                params.append(orderId)
                await cur.execute(
                    f"UPDATE orders SET {', '.join(updates)} WHERE order_id = %s",
                    params
                )
                await conn.commit()
            
            await cur.execute("SELECT * FROM orders WHERE order_id = %s", (orderId,))
            row = await cur.fetchone()
            
            if not row:
                raise Exception("Order not found")
            
            items_data = parse_json_field(row.get("items")) or []
            
            return {
                'id': str(row.get("id")),
                'orderId': row.get("order_id", ""),
                'customerId': row.get("customer_id"),
                'tableNumber': row.get("table_number"),
                'items': [
                    {
                        'menuId': item.get("menuId", "") if isinstance(item, dict) else "",
                        'name': item.get("name", "") if isinstance(item, dict) else "",
                        'quantity': item.get("quantity", 0) if isinstance(item, dict) else 0,
                        'price': float(item.get("price", 0) if isinstance(item, dict) else 0),
                        'specialInstructions': item.get("specialInstructions") if isinstance(item, dict) else None
                    }
                    for item in items_data
                ],
                'subtotal': float(row.get("subtotal", 0) or 0),
                'tax': float(row.get("tax", 0) or 0),
                'serviceCharge': float(row.get("service_charge", 0) or 0),
                'discount': float(row.get("discount", 0) or 0),
                'loyaltyPointsUsed': float(row.get("loyalty_points_used", 0) or 0),
                'loyaltyPointsEarned': float(row.get("loyalty_points_earned", 0) or 0),
                'total': float(row.get("total", 0) or 0),
                'paymentMethod': row.get("payment_method", "cash"),
                'paymentStatus': row.get("payment_status", "pending"),
                'orderStatus': row.get("order_status", "pending"),
                'kitchenStatus': row.get("kitchen_status"),
                'staffId': row.get("staff_id"),
                'notes': row.get("notes"),
                'createdAt': row.get("created_at").isoformat() if row.get("created_at") else "",
                'updatedAt': row.get("updated_at").isoformat() if row.get("updated_at") else "",
                'completedAt': row.get("completed_at").isoformat() if row.get("completed_at") else None
            }

@mutation.field("updatePaymentStatus")
async def resolve_update_payment_status(_, info, orderId: str, paymentStatus: str):
    """Update payment status"""
    pool = get_db()
    if not pool:
        raise Exception("Database connection not available")
    
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("UPDATE orders SET payment_status = %s WHERE order_id = %s", (paymentStatus, orderId))
            await conn.commit()
            
            await cur.execute("SELECT * FROM orders WHERE order_id = %s", (orderId,))
            row = await cur.fetchone()
            
            if not row:
                raise Exception("Order not found")
            
            items_data = parse_json_field(row.get("items")) or []
            
            return {
                'id': str(row.get("id")),
                'orderId': row.get("order_id", ""),
                'customerId': row.get("customer_id"),
                'tableNumber': row.get("table_number"),
                'items': [
                    {
                        'menuId': item.get("menuId", "") if isinstance(item, dict) else "",
                        'name': item.get("name", "") if isinstance(item, dict) else "",
                        'quantity': item.get("quantity", 0) if isinstance(item, dict) else 0,
                        'price': float(item.get("price", 0) if isinstance(item, dict) else 0),
                        'specialInstructions': item.get("specialInstructions") if isinstance(item, dict) else None
                    }
                    for item in items_data
                ],
                'subtotal': float(row.get("subtotal", 0) or 0),
                'tax': float(row.get("tax", 0) or 0),
                'serviceCharge': float(row.get("service_charge", 0) or 0),
                'discount': float(row.get("discount", 0) or 0),
                'loyaltyPointsUsed': float(row.get("loyalty_points_used", 0) or 0),
                'loyaltyPointsEarned': float(row.get("loyalty_points_earned", 0) or 0),
                'total': float(row.get("total", 0) or 0),
                'paymentMethod': row.get("payment_method", "cash"),
                'paymentStatus': row.get("payment_status", "pending"),
                'orderStatus': row.get("order_status", "pending"),
                'kitchenStatus': row.get("kitchen_status"),
                'staffId': row.get("staff_id"),
                'notes': row.get("notes"),
                'createdAt': row.get("created_at").isoformat() if row.get("created_at") else "",
                'updatedAt': row.get("updated_at").isoformat() if row.get("updated_at") else "",
                'completedAt': row.get("completed_at").isoformat() if row.get("completed_at") else None
            }

@mutation.field("sendToKitchen")
async def resolve_send_to_kitchen(_, info, orderId: str):
    """Send order to kitchen"""
    pool = get_db()
    if not pool:
        raise Exception("Database connection not available")
    
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("UPDATE orders SET kitchen_status = 'pending', order_status = 'in_kitchen' WHERE order_id = %s", (orderId,))
            await conn.commit()
            
            await cur.execute("SELECT * FROM orders WHERE order_id = %s", (orderId,))
            row = await cur.fetchone()
            
            if not row:
                raise Exception("Order not found")
            
            items_data = parse_json_field(row.get("items")) or []
            
            return {
                'id': str(row.get("id")),
                'orderId': row.get("order_id", ""),
                'customerId': row.get("customer_id"),
                'tableNumber': row.get("table_number"),
                'items': [
                    {
                        'menuId': item.get("menuId", "") if isinstance(item, dict) else "",
                        'name': item.get("name", "") if isinstance(item, dict) else "",
                        'quantity': item.get("quantity", 0) if isinstance(item, dict) else 0,
                        'price': float(item.get("price", 0) if isinstance(item, dict) else 0),
                        'specialInstructions': item.get("specialInstructions") if isinstance(item, dict) else None
                    }
                    for item in items_data
                ],
                'subtotal': float(row.get("subtotal", 0) or 0),
                'tax': float(row.get("tax", 0) or 0),
                'serviceCharge': float(row.get("service_charge", 0) or 0),
                'discount': float(row.get("discount", 0) or 0),
                'loyaltyPointsUsed': float(row.get("loyalty_points_used", 0) or 0),
                'loyaltyPointsEarned': float(row.get("loyalty_points_earned", 0) or 0),
                'total': float(row.get("total", 0) or 0),
                'paymentMethod': row.get("payment_method", "cash"),
                'paymentStatus': row.get("payment_status", "pending"),
                'orderStatus': row.get("order_status", "pending"),
                'kitchenStatus': row.get("kitchen_status"),
                'staffId': row.get("staff_id"),
                'notes': row.get("notes"),
                'createdAt': row.get("created_at").isoformat() if row.get("created_at") else "",
                'updatedAt': row.get("updated_at").isoformat() if row.get("updated_at") else "",
                'completedAt': row.get("completed_at").isoformat() if row.get("completed_at") else None
            }

# Export resolvers
resolvers = [query, mutation, menu, order, cart, order_item, ingredient_info, stock_check_result]

