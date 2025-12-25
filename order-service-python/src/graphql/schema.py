import strawberry
from typing import List, Optional
import httpx
import os
import json
from src.database.connection import get_db
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

# Types
@strawberry.type
class IngredientInfo:
    ingredient_id: str
    ingredient_name: str
    quantity: float
    unit: str

@strawberry.type
class Menu:
    id: str
    menu_id: str
    name: str
    description: Optional[str]
    category: str
    price: float
    image: Optional[str]
    ingredients: List[IngredientInfo]
    available: bool
    preparation_time: int
    tags: List[str]
    created_at: str
    updated_at: str

@strawberry.type
class OrderItem:
    menu_id: str
    name: str
    quantity: int
    price: float
    special_instructions: Optional[str]

@strawberry.type
class Order:
    id: str
    order_id: str
    customer_id: Optional[str]
    table_number: Optional[str]
    items: List[OrderItem]
    subtotal: float
    tax: float
    service_charge: float
    discount: float
    loyalty_points_used: float
    loyalty_points_earned: float
    total: float
    payment_method: str
    payment_status: str
    order_status: str
    kitchen_status: Optional[str]
    staff_id: Optional[str]
    notes: Optional[str]
    created_at: str
    updated_at: str
    completed_at: Optional[str]

@strawberry.type
class OrderCreationResult:
    order: Order
    kitchen_order_created: bool
    stock_updated: bool
    loyalty_points_earned: float
    message: str

# Inputs
@strawberry.input
class OrderItemInput:
    menu_id: str
    name: str
    quantity: int
    price: float
    special_instructions: Optional[str] = None

@strawberry.input
class CreateOrderInput:
    order_id: str
    customer_id: Optional[str] = None
    table_number: Optional[str] = None
    items: List[OrderItemInput]
    payment_method: Optional[str] = "cash"
    loyalty_points_used: Optional[float] = 0
    notes: Optional[str] = None

# Query
@strawberry.type
class Query:
    @strawberry.field
    async def menus(self, category: Optional[str] = None, available: Optional[bool] = None) -> List[Menu]:
        """Get all menus"""
        pool = get_db()
        if not pool:
            return []
        
        query = "SELECT * FROM menus WHERE 1=1"
        params = []
        
        if category:
            query += " AND category = %s"
            params.append(category)
        if available is not None:
            query += " AND available = %s"
            params.append(available)
        
        query += " ORDER BY name ASC"
        
        async with pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(query, params)
                rows = await cur.fetchall()
                columns = [desc[0] for desc in cur.description]
                
                menus = []
                for row in rows:
                    row_dict = dict(zip(columns, row))
                    ingredients_data = parse_json_field(row_dict.get("ingredients")) or []
                    tags_data = parse_json_field(row_dict.get("tags")) or []
                    
                    menus.append(Menu(
                        id=str(row_dict["id"]),
                        menu_id=row_dict.get("menu_id", ""),
                        name=row_dict.get("name", ""),
                        description=row_dict.get("description"),
                        category=row_dict.get("category", ""),
                        price=float(row_dict.get("price", 0)),
                        image=row_dict.get("image"),
                        ingredients=[
                            IngredientInfo(
                                ingredient_id=ing.get("ingredientId", ""),
                                ingredient_name=ing.get("ingredientName", ""),
                                quantity=float(ing.get("quantity", 0)),
                                unit=ing.get("unit", "")
                            )
                            for ing in ingredients_data
                        ],
                        available=bool(row_dict.get("available", True)),
                        preparation_time=row_dict.get("preparation_time", 15),
                        tags=tags_data,
                        created_at=row_dict.get("created_at").isoformat() if row_dict.get("created_at") else "",
                        updated_at=row_dict.get("updated_at").isoformat() if row_dict.get("updated_at") else ""
                    ))
        
        return menus

    @strawberry.field
    async def order_by_order_id(self, order_id: str) -> Optional[Order]:
        """Get order by order ID"""
        pool = get_db()
        if not pool:
            return None
        
        async with pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute("SELECT * FROM orders WHERE order_id = %s", (order_id,))
                row = await cur.fetchone()
                
                if not row:
                    return None
                
                columns = [desc[0] for desc in cur.description]
                row_dict = dict(zip(columns, row))
                items_data = parse_json_field(row_dict.get("items")) or []
                
                return Order(
                    id=str(row_dict["id"]),
                    order_id=row_dict.get("order_id", ""),
                    customer_id=row_dict.get("customer_id"),
                    table_number=row_dict.get("table_number"),
                    items=[
                        OrderItem(
                            menu_id=item.get("menuId", ""),
                            name=item.get("name", ""),
                            quantity=item.get("quantity", 0),
                            price=float(item.get("price", 0)),
                            special_instructions=item.get("specialInstructions")
                        )
                        for item in items_data
                    ],
                    subtotal=float(row_dict.get("subtotal", 0)),
                    tax=float(row_dict.get("tax", 0)),
                    service_charge=float(row_dict.get("service_charge", 0)),
                    discount=float(row_dict.get("discount", 0)),
                    loyalty_points_used=float(row_dict.get("loyalty_points_used", 0)),
                    loyalty_points_earned=float(row_dict.get("loyalty_points_earned", 0)),
                    total=float(row_dict.get("total", 0)),
                    payment_method=row_dict.get("payment_method", "cash"),
                    payment_status=row_dict.get("payment_status", "pending"),
                    order_status=row_dict.get("order_status", "pending"),
                    kitchen_status=row_dict.get("kitchen_status"),
                    staff_id=row_dict.get("staff_id"),
                    notes=row_dict.get("notes"),
                    created_at=row_dict.get("created_at").isoformat() if row_dict.get("created_at") else "",
                    updated_at=row_dict.get("updated_at").isoformat() if row_dict.get("updated_at") else "",
                    completed_at=row_dict.get("completed_at").isoformat() if row_dict.get("completed_at") else None
                )

# Mutation
@strawberry.type
class Mutation:
    @strawberry.mutation
    async def create_order(self, input: CreateOrderInput) -> OrderCreationResult:
        """Create order with full integration"""
        pool = get_db()
        if not pool:
            raise Exception("Database not connected")
        
        # Calculate totals
        subtotal = sum(item.price * item.quantity for item in input.items)
        tax = subtotal * 0.1
        service_charge = subtotal * 0.05
        discount = input.loyalty_points_used * 100 if input.loyalty_points_used else 0
        total = subtotal + tax + service_charge - discount
        
        # Prepare items for JSON storage
        items_json = json.dumps([
            {
                "menuId": item.menu_id,
                "name": item.name,
                "quantity": item.quantity,
                "price": item.price,
                "specialInstructions": item.special_instructions
            }
            for item in input.items
        ])
        
        # Create order in database
        async with pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    INSERT INTO orders (order_id, customer_id, table_number, items, subtotal, tax, service_charge, discount, loyalty_points_used, total, payment_method, notes)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    input.order_id,
                    input.customer_id,
                    input.table_number,
                    items_json,
                    subtotal,
                    tax,
                    service_charge,
                    discount,
                    input.loyalty_points_used or 0,
                    total,
                    input.payment_method or "cash",
                    input.notes
                ))
                order_id_db = cur.lastrowid
        
        # Integrate with Kitchen Service
        kitchen_order_created = False
        try:
            kitchen_query = """
                mutation CreateKitchenOrder($input: CreateKitchenOrderInput!) {
                    createKitchenOrder(input: $input) {
                        id
                        orderId
                        status
                    }
                }
            """
            
            await call_graphql_service(KITCHEN_SERVICE_URL, kitchen_query, {
                "input": {
                    "orderId": input.order_id,
                    "tableNumber": input.table_number,
                    "items": [
                        {
                            "menuId": item.menu_id,
                            "name": item.name,
                            "quantity": item.quantity,
                            "specialInstructions": item.special_instructions
                        }
                        for item in input.items
                    ],
                    "priority": 0
                }
            })
            kitchen_order_created = True
            
            # Update order kitchen status
            async with pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute("UPDATE orders SET kitchen_status = %s WHERE id = %s", ("pending", order_id_db))
        except Exception as e:
            print(f"Error creating kitchen order: {str(e)}")
        
        # Integrate with Inventory Service - reduce stock
        stock_updated = False
        try:
            # Get menu items to check ingredients
            for order_item in input.items:
                async with pool.acquire() as conn:
                    async with conn.cursor() as cur:
                        await cur.execute("SELECT * FROM menus WHERE menu_id = %s", (order_item.menu_id,))
                        row = await cur.fetchone()
                        
                        if row:
                            columns = [desc[0] for desc in cur.description]
                            menu_dict = dict(zip(columns, row))
                            ingredients = parse_json_field(menu_dict.get("ingredients")) or []
                            
                            for ingredient in ingredients:
                                reduce_stock_query = """
                                    mutation ReduceStock($ingredientId: ID!, $quantity: Float!, $reason: String, $referenceId: String, $referenceType: String) {
                                        reduceStock(ingredientId: $ingredientId, quantity: $quantity, reason: $reason, referenceId: $referenceId, referenceType: $referenceType) {
                                            id
                                            quantity
                                        }
                                    }
                                """
                                
                                await call_graphql_service(INVENTORY_SERVICE_URL, reduce_stock_query, {
                                    "ingredientId": ingredient.get("ingredientId", ""),
                                    "quantity": ingredient.get("quantity", 0) * order_item.quantity,
                                    "reason": f"Order {input.order_id}",
                                    "referenceId": input.order_id,
                                    "referenceType": "order"
                                })
            stock_updated = True
        except Exception as e:
            print(f"Error updating inventory: {str(e)}")
        
        # Integrate with User Service - earn loyalty points
        loyalty_points_earned = 0.0
        if input.customer_id:
            try:
                # Calculate points (1% of total)
                loyalty_points_earned = float(int(total * 0.01))
                
                earn_points_query = """
                    mutation EarnPoints($customerId: ID!, $points: Float!, $orderId: String, $description: String) {
                        earnPoints(customerId: $customerId, points: $points, orderId: $orderId, description: $description) {
                            id
                            points
                        }
                    }
                """
                
                await call_graphql_service(USER_SERVICE_URL, earn_points_query, {
                    "customerId": input.customer_id,
                    "points": loyalty_points_earned,
                    "orderId": input.order_id,
                    "description": f"Points earned from order {input.order_id}"
                })
                
                # Update order
                async with pool.acquire() as conn:
                    async with conn.cursor() as cur:
                        await cur.execute("UPDATE orders SET loyalty_points_earned = %s WHERE id = %s", (loyalty_points_earned, order_id_db))
            except Exception as e:
                print(f"Error earning loyalty points: {str(e)}")
        
        # Fetch the created order
        async with pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute("SELECT * FROM orders WHERE id = %s", (order_id_db,))
                row = await cur.fetchone()
                columns = [desc[0] for desc in cur.description]
                order_dict = dict(zip(columns, row))
                items_data = parse_json_field(order_dict.get("items")) or []
        
        # Build response
        order_obj = Order(
            id=str(order_dict["id"]),
            order_id=order_dict.get("order_id", ""),
            customer_id=order_dict.get("customer_id"),
            table_number=order_dict.get("table_number"),
            items=[
                OrderItem(
                    menu_id=item.get("menuId", ""),
                    name=item.get("name", ""),
                    quantity=item.get("quantity", 0),
                    price=float(item.get("price", 0)),
                    special_instructions=item.get("specialInstructions")
                )
                for item in items_data
            ],
            subtotal=order_dict["subtotal"],
            tax=order_dict["tax"],
            service_charge=order_dict["service_charge"],
            discount=order_dict["discount"],
            loyalty_points_used=order_dict["loyalty_points_used"],
            loyalty_points_earned=loyalty_points_earned,
            total=order_dict["total"],
            payment_method=order_dict["payment_method"],
            payment_status=order_dict["payment_status"],
            order_status=order_dict["order_status"],
            kitchen_status=order_dict.get("kitchen_status"),
            staff_id=order_dict.get("staff_id"),
            notes=order_dict.get("notes"),
            created_at=order_dict.get("created_at").isoformat() if order_dict.get("created_at") else "",
            updated_at=order_dict.get("updated_at").isoformat() if order_dict.get("updated_at") else "",
            completed_at=order_dict.get("completed_at").isoformat() if order_dict.get("completed_at") else None
        )
        
        return OrderCreationResult(
            order=order_obj,
            kitchen_order_created=kitchen_order_created,
            stock_updated=stock_updated,
            loyalty_points_earned=loyalty_points_earned,
            message="Order created successfully"
        )

