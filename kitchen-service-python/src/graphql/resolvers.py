from typing import Optional, List, Dict, Any
import json
from ariadne import QueryType, MutationType, ObjectType
from src.database.connection import get_db_connection
from src.auth import require_auth, require_min_role

query = QueryType()
mutation = MutationType()
order_item = ObjectType("OrderItem")
chef = ObjectType("Chef")
kitchen_order = ObjectType("KitchenOrder")

# Query resolvers
@query.field("kitchenOrders")
def resolve_kitchen_orders(_, info, status: Optional[str] = None):
    """Get all kitchen orders"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        query_sql = "SELECT * FROM kitchen_orders"
        params = []
        
        if status:
            query_sql += " WHERE status = %s"
            params.append(status)
        
        query_sql += " ORDER BY priority DESC, created_at ASC"
        
        cursor.execute(query_sql, params)
        orders = cursor.fetchall()
        
        result = []
        for order in orders:
            items = json.loads(order.get('items', '[]'))
            
            # Get chef if exists
            chef_data = None
            if order.get('chef_id'):
                cursor.execute("SELECT * FROM chefs WHERE id = %s", (order['chef_id'],))
                chef_data = cursor.fetchone()
            
            result.append({
                'id': str(order['id']),
                'orderId': order['order_id'],
                'tableNumber': order.get('table_number'),
                'status': order['status'],
                'items': items,
                'priority': order.get('priority', 0),
                'estimatedTime': order.get('estimated_time'),
                'chefId': order.get('chef_id'),
                'chef': {
                    'id': str(chef_data['id']),
                    'name': chef_data['name'],
                    'specialization': chef_data.get('specialization'),
                    'status': chef_data['status'],
                    'currentOrders': chef_data.get('current_orders', 0)
                } if chef_data else None,
                'notes': order.get('notes'),
                'createdAt': order['created_at'].isoformat() if order.get('created_at') else "",
                'updatedAt': order['updated_at'].isoformat() if order.get('updated_at') else ""
            })
        
        return result
    except Exception as e:
        raise Exception(f"Error fetching kitchen orders: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@query.field("kitchenOrder")
def resolve_kitchen_order(_, info, id: str):
    """Get kitchen order by ID"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT * FROM kitchen_orders WHERE id = %s", (id,))
        order = cursor.fetchone()
        
        if not order:
            return None
        
        items = json.loads(order.get('items', '[]'))
        
        # Get chef if exists
        chef_data = None
        if order.get('chef_id'):
            cursor.execute("SELECT * FROM chefs WHERE id = %s", (order['chef_id'],))
            chef_data = cursor.fetchone()
        
        return {
            'id': str(order['id']),
            'orderId': order['order_id'],
            'tableNumber': order.get('table_number'),
            'status': order['status'],
            'items': items,
            'priority': order.get('priority', 0),
            'estimatedTime': order.get('estimated_time'),
            'chefId': order.get('chef_id'),
            'chef': {
                'id': str(chef_data['id']),
                'name': chef_data['name'],
                'specialization': chef_data.get('specialization'),
                'status': chef_data['status'],
                'currentOrders': chef_data.get('current_orders', 0)
            } if chef_data else None,
            'notes': order.get('notes'),
            'createdAt': order['created_at'].isoformat() if order.get('created_at') else "",
            'updatedAt': order['updated_at'].isoformat() if order.get('updated_at') else ""
        }
    except Exception as e:
        raise Exception(f"Error fetching order: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@query.field("kitchenOrderByOrderId")
def resolve_kitchen_order_by_order_id(_, info, orderId: str):
    """Get kitchen order by order ID"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT * FROM kitchen_orders WHERE order_id = %s", (orderId,))
        order = cursor.fetchone()
        
        if not order:
            return None
        
        items = json.loads(order.get('items', '[]'))
        
        # Get chef if exists
        chef_data = None
        if order.get('chef_id'):
            cursor.execute("SELECT * FROM chefs WHERE id = %s", (order['chef_id'],))
            chef_data = cursor.fetchone()
        
        return {
            'id': str(order['id']),
            'orderId': order['order_id'],
            'tableNumber': order.get('table_number'),
            'status': order['status'],
            'items': items,
            'priority': order.get('priority', 0),
            'estimatedTime': order.get('estimated_time'),
            'chefId': order.get('chef_id'),
            'chef': {
                'id': str(chef_data['id']),
                'name': chef_data['name'],
                'specialization': chef_data.get('specialization'),
                'status': chef_data['status'],
                'currentOrders': chef_data.get('current_orders', 0)
            } if chef_data else None,
            'notes': order.get('notes'),
            'createdAt': order['created_at'].isoformat() if order.get('created_at') else "",
            'updatedAt': order['updated_at'].isoformat() if order.get('updated_at') else ""
        }
    except Exception as e:
        raise Exception(f"Error fetching order: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@query.field("chefs")
def resolve_chefs(_, info):
    """Get all chefs"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT * FROM chefs ORDER BY name")
        chefs_data = cursor.fetchall()
        
        return [
            {
                'id': str(chef['id']),
                'name': chef['name'],
                'specialization': chef.get('specialization'),
                'status': chef['status'],
                'currentOrders': chef.get('current_orders', 0)
            }
            for chef in chefs_data
        ]
    except Exception as e:
        raise Exception(f"Error fetching chefs: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@query.field("chef")
def resolve_chef(_, info, id: str):
    """Get chef by ID"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT * FROM chefs WHERE id = %s", (id,))
        chef = cursor.fetchone()
        
        if not chef:
            return None
        
        return {
            'id': str(chef['id']),
            'name': chef['name'],
            'specialization': chef.get('specialization'),
            'status': chef['status'],
            'currentOrders': chef.get('current_orders', 0)
        }
    except Exception as e:
        raise Exception(f"Error fetching chef: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@query.field("ordersByChef")
def resolve_orders_by_chef(_, info, chefId: str):
    """Get orders by chef"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute(
            "SELECT * FROM kitchen_orders WHERE chef_id = %s AND status != 'completed' ORDER BY priority DESC",
            (chefId,)
        )
        orders = cursor.fetchall()
        
        result = []
        for order in orders:
            items = json.loads(order.get('items', '[]'))
            
            result.append({
                'id': str(order['id']),
                'orderId': order['order_id'],
                'tableNumber': order.get('table_number'),
                'status': order['status'],
                'items': items,
                'priority': order.get('priority', 0),
                'estimatedTime': order.get('estimated_time'),
                'chefId': order.get('chef_id'),
                'chef': None,
                'notes': order.get('notes'),
                'createdAt': order['created_at'].isoformat() if order.get('created_at') else "",
                'updatedAt': order['updated_at'].isoformat() if order.get('updated_at') else ""
            })
        
        return result
    except Exception as e:
        raise Exception(f"Error fetching orders by chef: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@query.field("pendingOrders")
def resolve_pending_orders(_, info):
    """Get pending orders (for kitchen display)"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute(
            "SELECT * FROM kitchen_orders WHERE status = 'pending' ORDER BY priority DESC, created_at ASC"
        )
        orders = cursor.fetchall()
        
        result = []
        for order in orders:
            items = json.loads(order.get('items', '[]'))
            
            result.append({
                'id': str(order['id']),
                'orderId': order['order_id'],
                'tableNumber': order.get('table_number'),
                'status': order['status'],
                'items': items,
                'priority': order.get('priority', 0),
                'estimatedTime': order.get('estimated_time'),
                'chefId': order.get('chef_id'),
                'chef': None,
                'notes': order.get('notes'),
                'createdAt': order['created_at'].isoformat() if order.get('created_at') else "",
                'updatedAt': order['updated_at'].isoformat() if order.get('updated_at') else ""
            })
        
        return result
    except Exception as e:
        raise Exception(f"Error fetching pending orders: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@query.field("preparingOrders")
def resolve_preparing_orders(_, info):
    """Get orders being prepared"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute(
            "SELECT * FROM kitchen_orders WHERE status = 'preparing' ORDER BY priority DESC, created_at ASC"
        )
        orders = cursor.fetchall()
        
        result = []
        for order in orders:
            items = json.loads(order.get('items', '[]'))
            
            result.append({
                'id': str(order['id']),
                'orderId': order['order_id'],
                'tableNumber': order.get('table_number'),
                'status': order['status'],
                'items': items,
                'priority': order.get('priority', 0),
                'estimatedTime': order.get('estimated_time'),
                'chefId': order.get('chef_id'),
                'chef': None,
                'notes': order.get('notes'),
                'createdAt': order['created_at'].isoformat() if order.get('created_at') else "",
                'updatedAt': order['updated_at'].isoformat() if order.get('updated_at') else ""
            })
        
        return result
    except Exception as e:
        raise Exception(f"Error fetching preparing orders: {str(e)}")
    finally:
        cursor.close()
        conn.close()

# Mutation resolvers
@mutation.field("createKitchenOrder")
def resolve_create_kitchen_order(_, info, input: Dict[str, Any]):
    """Create new kitchen order - requires authentication"""
    require_auth(info.context)
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Check if order already exists
        cursor.execute("SELECT id FROM kitchen_orders WHERE order_id = %s", (input['orderId'],))
        if cursor.fetchone():
            raise Exception("Order already exists in kitchen queue")
        
        # Prepare items JSON
        items_json = json.dumps(input['items'])
        
        # Insert order
        cursor.execute("""
            INSERT INTO kitchen_orders (order_id, table_number, status, items, priority, notes)
            VALUES (%s, %s, 'pending', %s, %s, %s)
        """, (input['orderId'], input.get('tableNumber'), items_json, input.get('priority', 0), input.get('notes')))
        
        order_id = cursor.lastrowid
        conn.commit()
        
        # Fetch created order
        cursor.execute("SELECT * FROM kitchen_orders WHERE id = %s", (order_id,))
        order = cursor.fetchone()
        
        items = json.loads(order.get('items', '[]'))
        
        return {
            'id': str(order['id']),
            'orderId': order['order_id'],
            'tableNumber': order.get('table_number'),
            'status': order['status'],
            'items': items,
            'priority': order.get('priority', 0),
            'estimatedTime': order.get('estimated_time'),
            'chefId': order.get('chef_id'),
            'chef': None,
            'notes': order.get('notes'),
            'createdAt': order['created_at'].isoformat() if order.get('created_at') else "",
            'updatedAt': order['updated_at'].isoformat() if order.get('updated_at') else ""
        }
    except Exception as e:
        conn.rollback()
        raise Exception(f"Error creating kitchen order: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@mutation.field("updateOrderStatus")
def resolve_update_order_status(_, info, id: str, status: str):
    """Update order status - requires authentication"""
    require_auth(info.context)
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
        
        return {
            'id': str(order['id']),
            'orderId': order['order_id'],
            'tableNumber': order.get('table_number'),
            'status': order['status'],
            'items': items,
            'priority': order.get('priority', 0),
            'estimatedTime': order.get('estimated_time'),
            'chefId': order.get('chef_id'),
            'chef': None,
            'notes': order.get('notes'),
            'createdAt': order['created_at'].isoformat() if order.get('created_at') else "",
            'updatedAt': order['updated_at'].isoformat() if order.get('updated_at') else ""
        }
    except Exception as e:
        conn.rollback()
        raise Exception(f"Error updating order status: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@mutation.field("assignChef")
def resolve_assign_chef(_, info, orderId: str, chefId: str):
    """Assign chef to order - requires manager role"""
    require_min_role(info.context, 'manager')
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Check if chef exists
        cursor.execute("SELECT * FROM chefs WHERE id = %s", (chefId,))
        if not cursor.fetchone():
            raise Exception("Chef not found")
        
        # Update order
        cursor.execute("""
            UPDATE kitchen_orders 
            SET chef_id = %s, status = 'preparing' 
            WHERE id = %s
        """, (chefId, orderId))
        
        # Update chef current orders
        cursor.execute("""
            UPDATE chefs 
            SET current_orders = current_orders + 1, status = 'busy' 
            WHERE id = %s
        """, (chefId,))
        
        conn.commit()
        
        # Fetch updated order
        cursor.execute("SELECT * FROM kitchen_orders WHERE id = %s", (orderId,))
        order = cursor.fetchone()
        
        items = json.loads(order.get('items', '[]'))
        
        return {
            'id': str(order['id']),
            'orderId': order['order_id'],
            'tableNumber': order.get('table_number'),
            'status': order['status'],
            'items': items,
            'priority': order.get('priority', 0),
            'estimatedTime': order.get('estimated_time'),
            'chefId': order.get('chef_id'),
            'chef': None,
            'notes': order.get('notes'),
            'createdAt': order['created_at'].isoformat() if order.get('created_at') else "",
            'updatedAt': order['updated_at'].isoformat() if order.get('updated_at') else ""
        }
    except Exception as e:
        conn.rollback()
        raise Exception(f"Error assigning chef: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@mutation.field("completeOrder")
def resolve_complete_order(_, info, orderId: str):
    """Complete order - requires authentication"""
    require_auth(info.context)
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            UPDATE kitchen_orders 
            SET status = 'completed' 
            WHERE id = %s
        """, (orderId,))
        
        # Update chef status
        cursor.execute("SELECT chef_id FROM kitchen_orders WHERE id = %s", (orderId,))
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
        cursor.execute("SELECT * FROM kitchen_orders WHERE id = %s", (orderId,))
        order = cursor.fetchone()
        
        if not order:
            raise Exception("Order not found")
        
        items = json.loads(order.get('items', '[]'))
        
        return {
            'id': str(order['id']),
            'orderId': order['order_id'],
            'tableNumber': order.get('table_number'),
            'status': order['status'],
            'items': items,
            'priority': order.get('priority', 0),
            'estimatedTime': order.get('estimated_time'),
            'chefId': order.get('chef_id'),
            'chef': None,
            'notes': order.get('notes'),
            'createdAt': order['created_at'].isoformat() if order.get('created_at') else "",
            'updatedAt': order['updated_at'].isoformat() if order.get('updated_at') else ""
        }
    except Exception as e:
        conn.rollback()
        raise Exception(f"Error completing order: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@mutation.field("updateKitchenOrder")
def resolve_update_kitchen_order(_, info, id: str, input: Dict[str, Any]):
    """Update kitchen order - requires authentication"""
    require_auth(info.context)
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        updates = []
        params = []
        
        if 'tableNumber' in input:
            updates.append("table_number = %s")
            params.append(input['tableNumber'])
        if 'items' in input and input['items']:
            updates.append("items = %s")
            params.append(json.dumps(input['items']))
        if 'priority' in input:
            updates.append("priority = %s")
            params.append(input['priority'])
        if 'notes' in input:
            updates.append("notes = %s")
            params.append(input['notes'])
        if 'estimatedTime' in input:
            updates.append("estimated_time = %s")
            params.append(input['estimatedTime'])
        
        if updates:
            params.append(id)
            cursor.execute(
                f"UPDATE kitchen_orders SET {', '.join(updates)} WHERE id = %s",
                params
            )
            conn.commit()
        
        # Fetch updated order
        cursor.execute("SELECT * FROM kitchen_orders WHERE id = %s", (id,))
        order = cursor.fetchone()
        
        if not order:
            raise Exception("Order not found")
        
        items = json.loads(order.get('items', '[]'))
        
        return {
            'id': str(order['id']),
            'orderId': order['order_id'],
            'tableNumber': order.get('table_number'),
            'status': order['status'],
            'items': items,
            'priority': order.get('priority', 0),
            'estimatedTime': order.get('estimated_time'),
            'chefId': order.get('chef_id'),
            'chef': None,
            'notes': order.get('notes'),
            'createdAt': order['created_at'].isoformat() if order.get('created_at') else "",
            'updatedAt': order['updated_at'].isoformat() if order.get('updated_at') else ""
        }
    except Exception as e:
        conn.rollback()
        raise Exception(f"Error updating kitchen order: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@mutation.field("updateEstimatedTime")
def resolve_update_estimated_time(_, info, orderId: str, estimatedTime: int):
    """Update estimated time - requires authentication"""
    require_auth(info.context)
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute(
            "UPDATE kitchen_orders SET estimated_time = %s WHERE id = %s",
            (estimatedTime, orderId)
        )
        conn.commit()
        
        # Fetch updated order
        cursor.execute("SELECT * FROM kitchen_orders WHERE id = %s", (orderId,))
        order = cursor.fetchone()
        
        if not order:
            raise Exception("Order not found")
        
        items = json.loads(order.get('items', '[]'))
        
        return {
            'id': str(order['id']),
            'orderId': order['order_id'],
            'tableNumber': order.get('table_number'),
            'status': order['status'],
            'items': items,
            'priority': order.get('priority', 0),
            'estimatedTime': order.get('estimated_time'),
            'chefId': order.get('chef_id'),
            'chef': None,
            'notes': order.get('notes'),
            'createdAt': order['created_at'].isoformat() if order.get('created_at') else "",
            'updatedAt': order['updated_at'].isoformat() if order.get('updated_at') else ""
        }
    except Exception as e:
        conn.rollback()
        raise Exception(f"Error updating estimated time: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@mutation.field("cancelOrder")
def resolve_cancel_order(_, info, orderId: str):
    """Cancel order - requires manager role"""
    require_min_role(info.context, 'manager')
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Get current order to check chef
        cursor.execute("SELECT chef_id FROM kitchen_orders WHERE id = %s", (orderId,))
        current_order = cursor.fetchone()
        
        cursor.execute(
            "UPDATE kitchen_orders SET status = 'cancelled' WHERE id = %s",
            (orderId,)
        )
        
        # Update chef status if assigned
        if current_order and current_order.get('chef_id'):
            cursor.execute("""
                UPDATE chefs 
                SET current_orders = GREATEST(0, current_orders - 1),
                    status = CASE 
                        WHEN current_orders <= 1 THEN 'available' 
                        ELSE 'busy' 
                    END
                WHERE id = %s
            """, (current_order['chef_id'],))
        
        conn.commit()
        
        # Fetch updated order
        cursor.execute("SELECT * FROM kitchen_orders WHERE id = %s", (orderId,))
        order = cursor.fetchone()
        
        if not order:
            raise Exception("Order not found")
        
        items = json.loads(order.get('items', '[]'))
        
        return {
            'id': str(order['id']),
            'orderId': order['order_id'],
            'tableNumber': order.get('table_number'),
            'status': order['status'],
            'items': items,
            'priority': order.get('priority', 0),
            'estimatedTime': order.get('estimated_time'),
            'chefId': order.get('chef_id'),
            'chef': None,
            'notes': order.get('notes'),
            'createdAt': order['created_at'].isoformat() if order.get('created_at') else "",
            'updatedAt': order['updated_at'].isoformat() if order.get('updated_at') else ""
        }
    except Exception as e:
        conn.rollback()
        raise Exception(f"Error cancelling order: {str(e)}")
    finally:
        cursor.close()
        conn.close()

# Export resolvers as list for Ariadne
resolvers = [query, mutation, order_item, chef, kitchen_order]

