import strawberry
from typing import List, Optional
from enum import Enum
import json
from src.database.connection import get_db_connection

# Enums
@strawberry.enum
class OrderStatus(Enum):
    PENDING = "pending"
    PREPARING = "preparing"
    READY = "ready"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

@strawberry.enum
class ChefStatus(Enum):
    AVAILABLE = "available"
    BUSY = "busy"
    OFFLINE = "offline"

# Types
@strawberry.type
class OrderItem:
    menu_id: str
    name: str
    quantity: int
    special_instructions: Optional[str] = None

@strawberry.type
class Chef:
    id: str
    name: str
    specialization: Optional[str]
    status: str
    current_orders: int

@strawberry.type
class KitchenOrder:
    id: str
    order_id: str
    table_number: Optional[str]
    status: str
    items: List[OrderItem]
    priority: int
    estimated_time: Optional[int]
    chef_id: Optional[int]
    chef: Optional[Chef]
    notes: Optional[str]
    created_at: str
    updated_at: str

# Inputs
@strawberry.input
class OrderItemInput:
    menu_id: str
    name: str
    quantity: int
    special_instructions: Optional[str] = None

@strawberry.input
class CreateKitchenOrderInput:
    order_id: str
    table_number: Optional[str] = None
    items: List[OrderItemInput]
    priority: int = 0
    notes: Optional[str] = None

# Query
@strawberry.type
class Query:
    @strawberry.field
    def kitchen_orders(self, status: Optional[str] = None) -> List[KitchenOrder]:
        """Get all kitchen orders"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            query = "SELECT * FROM kitchen_orders"
            params = []
            
            if status:
                query += " WHERE status = %s"
                params.append(status)
            
            query += " ORDER BY priority DESC, created_at ASC"
            
            cursor.execute(query, params)
            orders = cursor.fetchall()
            
            result = []
            for order in orders:
                items = json.loads(order.get('items', '[]'))
                order_items = [OrderItem(**item) for item in items]
                
                # Get chef if exists
                chef = None
                if order.get('chef_id'):
                    cursor.execute("SELECT * FROM chefs WHERE id = %s", (order['chef_id'],))
                    chef_data = cursor.fetchone()
                    if chef_data:
                        chef = Chef(
                            id=str(chef_data['id']),
                            name=chef_data['name'],
                            specialization=chef_data.get('specialization'),
                            status=chef_data['status'],
                            current_orders=chef_data.get('current_orders', 0)
                        )
                
                result.append(KitchenOrder(
                    id=str(order['id']),
                    order_id=order['order_id'],
                    table_number=order.get('table_number'),
                    status=order['status'],
                    items=order_items,
                    priority=order.get('priority', 0),
                    estimated_time=order.get('estimated_time'),
                    chef_id=order.get('chef_id'),
                    chef=chef,
                    notes=order.get('notes'),
                    created_at=order['created_at'].isoformat() if order.get('created_at') else "",
                    updated_at=order['updated_at'].isoformat() if order.get('updated_at') else ""
                ))
            
            return result
        except Exception as e:
            raise Exception(f"Error fetching kitchen orders: {str(e)}")
        finally:
            cursor.close()
            conn.close()

    @strawberry.field
    def kitchen_order(self, id: str) -> Optional[KitchenOrder]:
        """Get kitchen order by ID"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            cursor.execute("SELECT * FROM kitchen_orders WHERE id = %s", (id,))
            order = cursor.fetchone()
            
            if not order:
                return None
            
            items = json.loads(order.get('items', '[]'))
            order_items = [OrderItem(**item) for item in items]
            
            # Get chef if exists
            chef = None
            if order.get('chef_id'):
                cursor.execute("SELECT * FROM chefs WHERE id = %s", (order['chef_id'],))
                chef_data = cursor.fetchone()
                if chef_data:
                    chef = Chef(
                        id=str(chef_data['id']),
                        name=chef_data['name'],
                        specialization=chef_data.get('specialization'),
                        status=chef_data['status'],
                        current_orders=chef_data.get('current_orders', 0)
                    )
            
            return KitchenOrder(
                id=str(order['id']),
                order_id=order['order_id'],
                table_number=order.get('table_number'),
                status=order['status'],
                items=order_items,
                priority=order.get('priority', 0),
                estimated_time=order.get('estimated_time'),
                chef_id=order.get('chef_id'),
                chef=chef,
                notes=order.get('notes'),
                created_at=order['created_at'].isoformat() if order.get('created_at') else "",
                updated_at=order['updated_at'].isoformat() if order.get('updated_at') else ""
            )
        except Exception as e:
            raise Exception(f"Error fetching order: {str(e)}")
        finally:
            cursor.close()
            conn.close()

    @strawberry.field
    def kitchen_order_by_order_id(self, order_id: str) -> Optional[KitchenOrder]:
        """Get kitchen order by order ID"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            cursor.execute("SELECT * FROM kitchen_orders WHERE order_id = %s", (order_id,))
            order = cursor.fetchone()
            
            if not order:
                return None
            
            items = json.loads(order.get('items', '[]'))
            order_items = [OrderItem(**item) for item in items]
            
            # Get chef if exists
            chef = None
            if order.get('chef_id'):
                cursor.execute("SELECT * FROM chefs WHERE id = %s", (order['chef_id'],))
                chef_data = cursor.fetchone()
                if chef_data:
                    chef = Chef(
                        id=str(chef_data['id']),
                        name=chef_data['name'],
                        specialization=chef_data.get('specialization'),
                        status=chef_data['status'],
                        current_orders=chef_data.get('current_orders', 0)
                    )
            
            return KitchenOrder(
                id=str(order['id']),
                order_id=order['order_id'],
                table_number=order.get('table_number'),
                status=order['status'],
                items=order_items,
                priority=order.get('priority', 0),
                estimated_time=order.get('estimated_time'),
                chef_id=order.get('chef_id'),
                chef=chef,
                notes=order.get('notes'),
                created_at=order['created_at'].isoformat() if order.get('created_at') else "",
                updated_at=order['updated_at'].isoformat() if order.get('updated_at') else ""
            )
        except Exception as e:
            raise Exception(f"Error fetching order: {str(e)}")
        finally:
            cursor.close()
            conn.close()

    @strawberry.field
    def chefs(self) -> List[Chef]:
        """Get all chefs"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            cursor.execute("SELECT * FROM chefs ORDER BY name")
            chefs_data = cursor.fetchall()
            
            return [
                Chef(
                    id=str(chef['id']),
                    name=chef['name'],
                    specialization=chef.get('specialization'),
                    status=chef['status'],
                    current_orders=chef.get('current_orders', 0)
                )
                for chef in chefs_data
            ]
        except Exception as e:
            raise Exception(f"Error fetching chefs: {str(e)}")
        finally:
            cursor.close()
            conn.close()

    @strawberry.field
    def chef(self, id: str) -> Optional[Chef]:
        """Get chef by ID"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            cursor.execute("SELECT * FROM chefs WHERE id = %s", (id,))
            chef = cursor.fetchone()
            
            if not chef:
                return None
            
            return Chef(
                id=str(chef['id']),
                name=chef['name'],
                specialization=chef.get('specialization'),
                status=chef['status'],
                current_orders=chef.get('current_orders', 0)
            )
        except Exception as e:
            raise Exception(f"Error fetching chef: {str(e)}")
        finally:
            cursor.close()
            conn.close()

    @strawberry.field
    def orders_by_chef(self, chef_id: str) -> List[KitchenOrder]:
        """Get orders by chef"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            cursor.execute(
                "SELECT * FROM kitchen_orders WHERE chef_id = %s AND status != 'completed' ORDER BY priority DESC",
                (chef_id,)
            )
            orders = cursor.fetchall()
            
            result = []
            for order in orders:
                items = json.loads(order.get('items', '[]'))
                order_items = [OrderItem(**item) for item in items]
                
                result.append(KitchenOrder(
                    id=str(order['id']),
                    order_id=order['order_id'],
                    table_number=order.get('table_number'),
                    status=order['status'],
                    items=order_items,
                    priority=order.get('priority', 0),
                    estimated_time=order.get('estimated_time'),
                    chef_id=order.get('chef_id'),
                    chef=None,
                    notes=order.get('notes'),
                    created_at=order['created_at'].isoformat() if order.get('created_at') else "",
                    updated_at=order['updated_at'].isoformat() if order.get('updated_at') else ""
                ))
            
            return result
        except Exception as e:
            raise Exception(f"Error fetching orders by chef: {str(e)}")
        finally:
            cursor.close()
            conn.close()

# Mutation
@strawberry.type
class Mutation:
    @strawberry.mutation
    def create_kitchen_order(self, input: CreateKitchenOrderInput) -> KitchenOrder:
        """Create new kitchen order"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # Check if order already exists
            cursor.execute("SELECT id FROM kitchen_orders WHERE order_id = %s", (input.order_id,))
            if cursor.fetchone():
                raise Exception("Order already exists in kitchen queue")
            
            # Prepare items JSON
            items_json = json.dumps([item.__dict__ for item in input.items])
            
            # Insert order
            cursor.execute("""
                INSERT INTO kitchen_orders (order_id, table_number, status, items, priority, notes)
                VALUES (%s, %s, 'pending', %s, %s, %s)
            """, (input.order_id, input.table_number, items_json, input.priority, input.notes))
            
            order_id = cursor.lastrowid
            conn.commit()
            
            # Fetch created order
            cursor.execute("SELECT * FROM kitchen_orders WHERE id = %s", (order_id,))
            order = cursor.fetchone()
            
            items = json.loads(order.get('items', '[]'))
            order_items = [OrderItem(**item) for item in items]
            
            return KitchenOrder(
                id=str(order['id']),
                order_id=order['order_id'],
                table_number=order.get('table_number'),
                status=order['status'],
                items=order_items,
                priority=order.get('priority', 0),
                estimated_time=order.get('estimated_time'),
                chef_id=order.get('chef_id'),
                chef=None,
                notes=order.get('notes'),
                created_at=order['created_at'].isoformat() if order.get('created_at') else "",
                updated_at=order['updated_at'].isoformat() if order.get('updated_at') else ""
            )
        except Exception as e:
            conn.rollback()
            raise Exception(f"Error creating kitchen order: {str(e)}")
        finally:
            cursor.close()
            conn.close()

    @strawberry.mutation
    def update_order_status(self, id: str, status: str) -> KitchenOrder:
        """Update order status"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            cursor.execute("UPDATE kitchen_orders SET status = %s WHERE id = %s", (status, id))
            
            # Update chef status if order is completed
            if status == 'completed':
                cursor.execute("SELECT chef_id FROM kitchen_orders WHERE id = %s", (id,))
                order = cursor.fetchone()
                if order and order.get('chef_id'):
                    cursor.execute("""
                        UPDATE chefs 
                        SET current_orders = GREATEST(0, current_orders - 1) 
                        WHERE id = %s
                    """, (order['chef_id'],))
            
            conn.commit()
            
            # Fetch updated order
            cursor.execute("SELECT * FROM kitchen_orders WHERE id = %s", (id,))
            order = cursor.fetchone()
            
            if not order:
                raise Exception("Order not found")
            
            items = json.loads(order.get('items', '[]'))
            order_items = [OrderItem(**item) for item in items]
            
            return KitchenOrder(
                id=str(order['id']),
                order_id=order['order_id'],
                table_number=order.get('table_number'),
                status=order['status'],
                items=order_items,
                priority=order.get('priority', 0),
                estimated_time=order.get('estimated_time'),
                chef_id=order.get('chef_id'),
                chef=None,
                notes=order.get('notes'),
                created_at=order['created_at'].isoformat() if order.get('created_at') else "",
                updated_at=order['updated_at'].isoformat() if order.get('updated_at') else ""
            )
        except Exception as e:
            conn.rollback()
            raise Exception(f"Error updating order status: {str(e)}")
        finally:
            cursor.close()
            conn.close()

    @strawberry.mutation
    def assign_chef(self, order_id: str, chef_id: str) -> KitchenOrder:
        """Assign chef to order"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # Check if chef exists
            cursor.execute("SELECT * FROM chefs WHERE id = %s", (chef_id,))
            if not cursor.fetchone():
                raise Exception("Chef not found")
            
            # Update order
            cursor.execute("""
                UPDATE kitchen_orders 
                SET chef_id = %s, status = 'preparing' 
                WHERE id = %s
            """, (chef_id, order_id))
            
            # Update chef current orders
            cursor.execute("""
                UPDATE chefs 
                SET current_orders = current_orders + 1, status = 'busy' 
                WHERE id = %s
            """, (chef_id,))
            
            conn.commit()
            
            # Fetch updated order
            cursor.execute("SELECT * FROM kitchen_orders WHERE id = %s", (order_id,))
            order = cursor.fetchone()
            
            items = json.loads(order.get('items', '[]'))
            order_items = [OrderItem(**item) for item in items]
            
            return KitchenOrder(
                id=str(order['id']),
                order_id=order['order_id'],
                table_number=order.get('table_number'),
                status=order['status'],
                items=order_items,
                priority=order.get('priority', 0),
                estimated_time=order.get('estimated_time'),
                chef_id=order.get('chef_id'),
                chef=None,
                notes=order.get('notes'),
                created_at=order['created_at'].isoformat() if order.get('created_at') else "",
                updated_at=order['updated_at'].isoformat() if order.get('updated_at') else ""
            )
        except Exception as e:
            conn.rollback()
            raise Exception(f"Error assigning chef: {str(e)}")
        finally:
            cursor.close()
            conn.close()

    @strawberry.mutation
    def complete_order(self, order_id: str) -> KitchenOrder:
        """Complete order"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            cursor.execute("""
                UPDATE kitchen_orders 
                SET status = 'completed' 
                WHERE id = %s
            """, (order_id,))
            
            # Update chef status
            cursor.execute("SELECT chef_id FROM kitchen_orders WHERE id = %s", (order_id,))
            order = cursor.fetchone()
            if order and order.get('chef_id'):
                cursor.execute("""
                    UPDATE chefs 
                    SET current_orders = GREATEST(0, current_orders - 1),
                        status = CASE 
                            WHEN current_orders <= 1 THEN 'available' 
                            ELSE 'busy' 
                        END
                    WHERE id = %s
                """, (order['chef_id'],))
            
            conn.commit()
            
            # Fetch updated order
            cursor.execute("SELECT * FROM kitchen_orders WHERE id = %s", (order_id,))
            order = cursor.fetchone()
            
            if not order:
                raise Exception("Order not found")
            
            items = json.loads(order.get('items', '[]'))
            order_items = [OrderItem(**item) for item in items]
            
            return KitchenOrder(
                id=str(order['id']),
                order_id=order['order_id'],
                table_number=order.get('table_number'),
                status=order['status'],
                items=order_items,
                priority=order.get('priority', 0),
                estimated_time=order.get('estimated_time'),
                chef_id=order.get('chef_id'),
                chef=None,
                notes=order.get('notes'),
                created_at=order['created_at'].isoformat() if order.get('created_at') else "",
                updated_at=order['updated_at'].isoformat() if order.get('updated_at') else ""
            )
        except Exception as e:
            conn.rollback()
            raise Exception(f"Error completing order: {str(e)}")
        finally:
            cursor.close()
            conn.close()



