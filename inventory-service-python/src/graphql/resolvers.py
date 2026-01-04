from typing import Optional, Dict, Any
from ariadne import QueryType, MutationType, ObjectType
from src.database.connection import get_db_connection
from src.auth import require_auth, require_min_role
from src.services.toko_sembako_client import (
    get_products_from_toko_sembako,
    get_product_by_id_from_toko_sembako,
    check_stock_from_toko_sembako,
    create_order_at_toko_sembako,
    get_order_status_from_toko_sembako
)

query = QueryType()
mutation = MutationType()
ingredient = ObjectType("Ingredient")
supplier = ObjectType("Supplier")
stock_movement = ObjectType("StockMovement")
stock_check_result = ObjectType("StockCheckResult")
toko_sembako_product = ObjectType("TokoSembakoProduct")
toko_sembako_stock_check = ObjectType("TokoSembakoStockCheck")
purchase_order = ObjectType("PurchaseOrder")
purchase_order_item = ObjectType("PurchaseOrderItem")

# Query resolvers
@query.field("ingredients")
def resolve_ingredients(_, info, category: Optional[str] = None, status: Optional[str] = None):
    """Get all ingredients"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        query_sql = "SELECT * FROM ingredients"
        params = []
        conditions = []
        
        if category:
            conditions.append("category = %s")
            params.append(category)
        if status:
            conditions.append("status = %s")
            params.append(status)
        
        if conditions:
            query_sql += " WHERE " + " AND ".join(conditions)
        
        query_sql += " ORDER BY name"
        cursor.execute(query_sql, params)
        ingredients_data = cursor.fetchall()
        
        result = []
        for ing in ingredients_data:
            supplier_data = None
            if ing.get('supplier_id'):
                cursor.execute("SELECT * FROM suppliers WHERE id = %s", (ing['supplier_id'],))
                sup = cursor.fetchone()
                if sup:
                    supplier_data = {
                        'id': str(sup['id']),
                        'name': sup['name'],
                        'contactPerson': sup.get('contact_person'),
                        'email': sup.get('email'),
                        'phone': sup.get('phone'),
                        'address': sup.get('address'),
                        'status': sup['status']
                    }
            
            result.append({
                'id': str(ing['id']),
                'name': ing['name'],
                'unit': ing['unit'],
                'category': ing.get('category'),
                'minStockLevel': float(ing.get('min_stock_level', 0)),
                'currentStock': float(ing.get('current_stock', 0)),
                'supplier': supplier_data,
                'costPerUnit': float(ing.get('cost_per_unit', 0)),
                'status': ing['status']
            })
        
        return result
    except Exception as e:
        raise Exception(f"Error fetching ingredients: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@query.field("ingredient")
def resolve_ingredient(_, info, id: str):
    """Get ingredient by ID"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT * FROM ingredients WHERE id = %s", (id,))
        ing = cursor.fetchone()
        
        if not ing:
            return None
        
        supplier_data = None
        if ing.get('supplier_id'):
            cursor.execute("SELECT * FROM suppliers WHERE id = %s", (ing['supplier_id'],))
            sup = cursor.fetchone()
            if sup:
                supplier_data = {
                    'id': str(sup['id']),
                    'name': sup['name'],
                    'contactPerson': sup.get('contact_person'),
                    'email': sup.get('email'),
                    'phone': sup.get('phone'),
                    'address': sup.get('address'),
                    'status': sup['status']
                }
        
        return {
            'id': str(ing['id']),
            'name': ing['name'],
            'unit': ing['unit'],
            'category': ing.get('category'),
            'minStockLevel': float(ing.get('min_stock_level', 0)),
            'currentStock': float(ing.get('current_stock', 0)),
            'supplier': supplier_data,
            'costPerUnit': float(ing.get('cost_per_unit', 0)),
            'status': ing['status']
        }
    except Exception as e:
        raise Exception(f"Error fetching ingredient: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@query.field("checkStock")
def resolve_check_stock(_, info, ingredientId: str, quantity: float):
    """Check stock availability"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT * FROM ingredients WHERE id = %s", (ingredientId,))
        ingredient = cursor.fetchone()
        
        if not ingredient:
            raise Exception("Ingredient not found")
        
        current_stock = float(ingredient['current_stock'])
        available = current_stock >= quantity
        
        return {
            'available': available,
            'currentStock': current_stock,
            'requestedQuantity': quantity,
            'message': f"Stock {'tersedia' if available else 'tidak cukup'}: {current_stock} {ingredient['unit']}"
        }
    except Exception as e:
        raise Exception(f"Error checking stock: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@query.field("tokoSembakoProducts")
async def resolve_toko_sembako_products(_, info, category: Optional[str] = None):
    """Get products from Toko Sembako"""
    try:
        products = await get_products_from_toko_sembako(category)
        return [
            {
                'id': str(p.get('id', '')),
                'name': p.get('name', ''),
                'category': p.get('category'),
                'price': float(p.get('price', 0)),
                'unit': p.get('unit', ''),
                'available': p.get('available', False),
                'description': p.get('description')
            }
            for p in products
        ]
    except Exception as e:
        raise Exception(f"Error fetching Toko Sembako products: {str(e)}")

@query.field("checkTokoSembakoStock")
async def resolve_check_toko_sembako_stock(_, info, productId: str, quantity: float):
    """Check stock from Toko Sembako"""
    try:
        stock_check = await check_stock_from_toko_sembako(productId, quantity)
        return {
            'available': stock_check.get('available', False),
            'currentStock': float(stock_check.get('current_stock', 0)),
            'requestedQuantity': quantity,
            'message': stock_check.get('message', '')
        }
    except Exception as e:
        raise Exception(f"Error checking Toko Sembako stock: {str(e)}")

@query.field("suppliers")
def resolve_suppliers(_, info, status: Optional[str] = None):
    """Get all suppliers"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        query_sql = "SELECT * FROM suppliers"
        params = []
        
        if status:
            query_sql += " WHERE status = %s"
            params.append(status)
        
        query_sql += " ORDER BY name"
        cursor.execute(query_sql, params)
        suppliers = cursor.fetchall()
        
        return [
            {
                'id': str(s['id']),
                'name': s['name'],
                'contactPerson': s.get('contact_person'),
                'email': s.get('email'),
                'phone': s.get('phone'),
                'address': s.get('address'),
                'status': s['status'],
                'createdAt': s['created_at'].isoformat() if s.get('created_at') else "",
                'updatedAt': s['updated_at'].isoformat() if s.get('updated_at') else ""
            }
            for s in suppliers
        ]
    except Exception as e:
        raise Exception(f"Error fetching suppliers: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@query.field("supplier")
def resolve_supplier(_, info, id: str):
    """Get supplier by ID"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT * FROM suppliers WHERE id = %s", (id,))
        s = cursor.fetchone()
        
        if not s:
            return None
            
        return {
            'id': str(s['id']),
            'name': s['name'],
            'contactPerson': s.get('contact_person'),
            'email': s.get('email'),
            'phone': s.get('phone'),
            'address': s.get('address'),
            'status': s['status'],
            'createdAt': s['created_at'].isoformat() if s.get('created_at') else "",
            'updatedAt': s['updated_at'].isoformat() if s.get('updated_at') else ""
        }
    except Exception as e:
        raise Exception(f"Error fetching supplier: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@query.field("lowStockIngredients")
def resolve_low_stock_ingredients(_, info):
    """Get ingredients with low stock"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            SELECT * FROM ingredients 
            WHERE current_stock <= min_stock_level 
            AND status != 'inactive'
            ORDER BY (current_stock / NULLIF(min_stock_level, 0)) ASC
        """)
        ingredients_data = cursor.fetchall()
        
        result = []
        for ing in ingredients_data:
            supplier_data = None
            if ing.get('supplier_id'):
                cursor.execute("SELECT * FROM suppliers WHERE id = %s", (ing['supplier_id'],))
                sup = cursor.fetchone()
                if sup:
                    supplier_data = {
                        'id': str(sup['id']),
                        'name': sup['name'],
                        'contactPerson': sup.get('contact_person'),
                        'email': sup.get('email'),
                        'phone': sup.get('phone'),
                        'address': sup.get('address'),
                        'status': sup['status']
                    }
            
            result.append({
                'id': str(ing['id']),
                'name': ing['name'],
                'unit': ing['unit'],
                'category': ing.get('category'),
                'minStockLevel': float(ing.get('min_stock_level', 0)),
                'currentStock': float(ing.get('current_stock', 0)),
                'supplier': supplier_data,
                'costPerUnit': float(ing.get('cost_per_unit', 0)),
                'status': ing['status']
            })
        return result
    except Exception as e:
        raise Exception(f"Error fetching low stock ingredients: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@query.field("outOfStockIngredients")
def resolve_out_of_stock_ingredients(_, info):
    """Get ingredients out of stock"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            SELECT * FROM ingredients 
            WHERE current_stock <= 0 
            AND status != 'inactive'
            ORDER BY name
        """)
        ingredients_data = cursor.fetchall()
        
        result = []
        for ing in ingredients_data:
            supplier_data = None
            if ing.get('supplier_id'):
                cursor.execute("SELECT * FROM suppliers WHERE id = %s", (ing['supplier_id'],))
                sup = cursor.fetchone()
                if sup:
                    supplier_data = {
                        'id': str(sup['id']),
                        'name': sup['name'],
                        'contactPerson': sup.get('contact_person'),
                        'email': sup.get('email'),
                        'phone': sup.get('phone'),
                        'address': sup.get('address'),
                        'status': sup['status']
                    }
            
            result.append({
                'id': str(ing['id']),
                'name': ing['name'],
                'unit': ing['unit'],
                'category': ing.get('category'),
                'minStockLevel': float(ing.get('min_stock_level', 0)),
                'currentStock': float(ing.get('current_stock', 0)),
                'supplier': supplier_data,
                'costPerUnit': float(ing.get('cost_per_unit', 0)),
                'status': ing['status']
            })
        return result
    except Exception as e:
        raise Exception(f"Error fetching out of stock ingredients: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@query.field("stockMovements")
def resolve_stock_movements(_, info, ingredientId: Optional[str] = None, movementType: Optional[str] = None):
    """Get stock movements history"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        query_sql = "SELECT * FROM stock_movements"
        conditions = []
        params = []
        
        if ingredientId:
            conditions.append("ingredient_id = %s")
            params.append(ingredientId)
        if movementType:
            conditions.append("movement_type = %s")
            params.append(movementType)
            
        if conditions:
            query_sql += " WHERE " + " AND ".join(conditions)
            
        query_sql += " ORDER BY created_at DESC LIMIT 100"
        
        cursor.execute(query_sql, params)
        movements = cursor.fetchall()
        
        result = []
        for mov in movements:
            # Fetch ingredient for each movement
            cursor.execute("SELECT * FROM ingredients WHERE id = %s", (mov['ingredient_id'],))
            ing = cursor.fetchone()
            
            ing_data = None
            if ing:
                ing_data = {
                    'id': str(ing['id']),
                    'name': ing['name'],
                    'unit': ing['unit'],
                    'category': ing.get('category'),
                    'minStockLevel': float(ing.get('min_stock_level', 0)),
                    'currentStock': float(ing.get('current_stock', 0)),
                    'costPerUnit': float(ing.get('cost_per_unit', 0)),
                    'status': ing['status']
                }
            
            result.append({
                'id': str(mov['id']),
                'ingredient': ing_data,
                'movementType': mov['movement_type'],
                'quantity': float(mov['quantity']),
                'reason': mov.get('reason'),
                'referenceId': mov.get('reference_id'),
                'referenceType': mov.get('reference_type'),
                'createdBy': mov.get('created_by'),
                'createdAt': mov['created_at'].isoformat() if mov.get('created_at') else ""
            })
            
        return result
    except Exception as e:
        raise Exception(f"Error fetching stock movements: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@query.field("purchaseOrders")
def resolve_purchase_orders(_, info, status: Optional[str] = None):
    """Get all purchase orders"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        query_sql = "SELECT * FROM purchase_orders"
        params = []
        
        if status:
            query_sql += " WHERE status = %s"
            params.append(status)
            
        query_sql += " ORDER BY created_at DESC"
        cursor.execute(query_sql, params)
        orders = cursor.fetchall()
        
        result = []
        for order in orders:
            # Fetch items
            cursor.execute("SELECT * FROM purchase_order_items WHERE purchase_order_id = %s", (order['id'],))
            items = cursor.fetchall()
            
            items_data = []
            for item in items:
                items_data.append({
                    'id': str(item['id']),
                    'ingredient_id': item['ingredient_id'], 
                    'quantity': float(item['quantity']),
                    'unitPrice': float(item['price_per_unit']),
                    'totalPrice': float(item['quantity'] * item['price_per_unit']),
                    'receivedQuantity': float(item.get('received_quantity', 0))
                })

            result.append({
                'id': str(order['id']),
                'supplier_id': order['supplier_id'],
                'orderNumber': order['order_number'],
                'status': order['status'],
                'totalAmount': float(order['total_amount']),
                'orderDate': order['order_date'].isoformat() if order.get('order_date') else None,
                'expectedDeliveryDate': order['expected_delivery_date'].isoformat() if order.get('expected_delivery_date') else None,
                'receivedDate': order['received_date'].isoformat() if order.get('received_date') else None,
                'notes': order.get('notes'),
                'items': items_data,
                'createdAt': order['created_at'].isoformat() if order.get('created_at') else "",
                'updatedAt': order['updated_at'].isoformat() if order.get('updated_at') else ""
            })
            
        return result
    except Exception as e:
        raise Exception(f"Error fetching purchase orders: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@query.field("purchaseOrder")
def resolve_purchase_order(_, info, id: str):
    """Get purchase order by ID"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT * FROM purchase_orders WHERE id = %s", (id,))
        order = cursor.fetchone()
        
        if not order:
            return None
            
        # Fetch items
        cursor.execute("SELECT * FROM purchase_order_items WHERE purchase_order_id = %s", (id,))
        items = cursor.fetchall()
        
        items_data = []
        for item in items:
            items_data.append({
                'id': str(item['id']),
                'ingredient_id': item['ingredient_id'],
                'quantity': float(item['quantity']),
                'unitPrice': float(item['price_per_unit']),
                'totalPrice': float(item['quantity'] * item['price_per_unit']),
                'receivedQuantity': float(item.get('received_quantity', 0))
            })
            
        return {
            'id': str(order['id']),
            'supplier_id': order['supplier_id'],
            'orderNumber': order['order_number'],
            'status': order['status'],
            'totalAmount': float(order['total_amount']),
            'orderDate': order['order_date'].isoformat() if order.get('order_date') else None,
            'expectedDeliveryDate': order['expected_delivery_date'].isoformat() if order.get('expected_delivery_date') else None,
            'receivedDate': order['received_date'].isoformat() if order.get('received_date') else None,
            'notes': order.get('notes'),
            'items': items_data,
            'createdAt': order['created_at'].isoformat() if order.get('created_at') else "",
            'updatedAt': order['updated_at'].isoformat() if order.get('updated_at') else ""
        }
    except Exception as e:
        raise Exception(f"Error fetching purchase order: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@query.field("tokoSembakoOrderStatus")
async def resolve_toko_sembako_order_status(_, info, orderId: str):
    """Get Toko Sembako order status"""
    try:
        return await get_order_status_from_toko_sembako(orderId)
    except Exception as e:
        raise Exception(f"Error fetching Toko Sembako order status: {str(e)}")

@purchase_order.field("supplier")
def resolve_purchase_order_supplier(order, info):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        if not order.get('supplier_id'): return None
        cursor.execute("SELECT * FROM suppliers WHERE id = %s", (order['supplier_id'],))
        s = cursor.fetchone()
        if not s: return None
        return {
            'id': str(s['id']),
            'name': s['name'],
            'contactPerson': s.get('contact_person'),
            'email': s.get('email'),
            'phone': s.get('phone'),
            'address': s.get('address'),
            'status': s['status'],
            'createdAt': s['created_at'].isoformat() if s.get('created_at') else "",
            'updatedAt': s['updated_at'].isoformat() if s.get('updated_at') else ""
        }
    finally:
        cursor.close()
        conn.close()

@purchase_order_item.field("ingredient")
def resolve_purchase_order_item_ingredient(item, info):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        if not item.get('ingredient_id'): return None
        cursor.execute("SELECT * FROM ingredients WHERE id = %s", (item['ingredient_id'],))
        ing = cursor.fetchone()
        if not ing: return None
        
        return {
            'id': str(ing['id']),
            'name': ing['name'],
            'unit': ing['unit'],
            'category': ing.get('category'),
            'minStockLevel': float(ing.get('min_stock_level', 0)),
            'currentStock': float(ing.get('current_stock', 0)),
            'supplier_id': ing.get('supplier_id'),
            'costPerUnit': float(ing.get('cost_per_unit', 0)),
            'status': ing['status']
        }
    finally:
        cursor.close()
        conn.close()

# Mutation resolvers
@mutation.field("createIngredient")
def resolve_create_ingredient(_, info, input: Dict[str, Any]):
    """Create a new ingredient"""
    require_auth(info.context)
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            INSERT INTO ingredients (name, unit, category, min_stock_level, current_stock, supplier_id, cost_per_unit, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'active')
        """, (
            input['name'],
            input['unit'],
            input.get('category'),
            input.get('minStockLevel', 0),
            input.get('currentStock', 0),
            input.get('supplierId'),
            input.get('costPerUnit', 0)
        ))
        
        ingredient_id = cursor.lastrowid
        conn.commit()
        
        cursor.execute("SELECT * FROM ingredients WHERE id = %s", (ingredient_id,))
        ing = cursor.fetchone()
        
        supplier_data = None
        if ing.get('supplier_id'):
            cursor.execute("SELECT * FROM suppliers WHERE id = %s", (ing['supplier_id'],))
            sup = cursor.fetchone()
            if sup:
                supplier_data = {
                    'id': str(sup['id']),
                    'name': sup['name'],
                    'contactPerson': sup.get('contact_person'),
                    'email': sup.get('email'),
                    'phone': sup.get('phone'),
                    'address': sup.get('address'),
                    'status': sup['status']
                }
        
        return {
            'id': str(ing['id']),
            'name': ing['name'],
            'unit': ing['unit'],
            'category': ing.get('category'),
            'minStockLevel': float(ing.get('min_stock_level', 0)),
            'currentStock': float(ing.get('current_stock', 0)),
            'supplier': supplier_data,
            'costPerUnit': float(ing.get('cost_per_unit', 0)),
            'status': ing['status'],
            'createdAt': ing['created_at'].isoformat() if ing.get('created_at') else "",
            'updatedAt': ing['updated_at'].isoformat() if ing.get('updated_at') else ""
        }
    except Exception as e:
        conn.rollback()
        raise Exception(f"Error creating ingredient: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@mutation.field("updateIngredient")
def resolve_update_ingredient(_, info, id: str, input: Dict[str, Any]):
    """Update an existing ingredient"""
    require_auth(info.context)
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Build dynamic update query
        updates = []
        params = []
        
        if input.get('name') is not None:
            updates.append("name = %s")
            params.append(input['name'])
        if input.get('unit') is not None:
            updates.append("unit = %s")
            params.append(input['unit'])
        if input.get('category') is not None:
            updates.append("category = %s")
            params.append(input['category'])
        if input.get('minStockLevel') is not None:
            updates.append("min_stock_level = %s")
            params.append(input['minStockLevel'])
        if input.get('supplierId') is not None:
            updates.append("supplier_id = %s")
            params.append(input['supplierId'])
        if input.get('costPerUnit') is not None:
            updates.append("cost_per_unit = %s")
            params.append(input['costPerUnit'])
        if input.get('status') is not None:
            updates.append("status = %s")
            params.append(input['status'])
        
        if updates:
            query = f"UPDATE ingredients SET {', '.join(updates)} WHERE id = %s"
            params.append(id)
            cursor.execute(query, params)
            conn.commit()
        
        # Fetch updated ingredient
        cursor.execute("SELECT * FROM ingredients WHERE id = %s", (id,))
        ing = cursor.fetchone()
        
        if not ing:
            raise Exception("Ingredient not found")
        
        supplier_data = None
        if ing.get('supplier_id'):
            cursor.execute("SELECT * FROM suppliers WHERE id = %s", (ing['supplier_id'],))
            sup = cursor.fetchone()
            if sup:
                supplier_data = {
                    'id': str(sup['id']),
                    'name': sup['name'],
                    'contactPerson': sup.get('contact_person'),
                    'email': sup.get('email'),
                    'phone': sup.get('phone'),
                    'address': sup.get('address'),
                    'status': sup['status']
                }
        
        return {
            'id': str(ing['id']),
            'name': ing['name'],
            'unit': ing['unit'],
            'category': ing.get('category'),
            'minStockLevel': float(ing.get('min_stock_level', 0)),
            'currentStock': float(ing.get('current_stock', 0)),
            'supplier': supplier_data,
            'costPerUnit': float(ing.get('cost_per_unit', 0)),
            'status': ing['status'],
            'createdAt': ing['created_at'].isoformat() if ing.get('created_at') else "",
            'updatedAt': ing['updated_at'].isoformat() if ing.get('updated_at') else ""
        }
    except Exception as e:
        conn.rollback()
        raise Exception(f"Error updating ingredient: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@mutation.field("addStock")
def resolve_add_stock(_, info, ingredientId: str, quantity: float, reason: Optional[str] = None):
    """Add stock to an ingredient"""
    require_auth(info.context)
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Check if ingredient exists
        cursor.execute("SELECT * FROM ingredients WHERE id = %s", (ingredientId,))
        ingredient = cursor.fetchone()
        
        if not ingredient:
            raise Exception("Ingredient not found")
        
        # Update stock
        cursor.execute(
            "UPDATE ingredients SET current_stock = current_stock + %s WHERE id = %s",
            (quantity, ingredientId)
        )
        
        # Update status if was out_of_stock
        cursor.execute("""
            UPDATE ingredients 
            SET status = CASE 
                WHEN current_stock > 0 THEN 'active' 
                ELSE status 
            END 
            WHERE id = %s
        """, (ingredientId,))
        
        # Create stock movement
        cursor.execute("""
            INSERT INTO stock_movements (ingredient_id, movement_type, quantity, reason)
            VALUES (%s, 'in', %s, %s)
        """, (ingredientId, quantity, reason or 'Manual stock addition'))
        
        movement_id = cursor.lastrowid
        conn.commit()
        
        # Fetch movement
        cursor.execute("SELECT * FROM stock_movements WHERE id = %s", (movement_id,))
        movement = cursor.fetchone()
        
        # Get ingredient for response
        cursor.execute("SELECT * FROM ingredients WHERE id = %s", (ingredientId,))
        ing = cursor.fetchone()
        
        return {
            'id': str(movement['id']),
            'ingredient': {
                'id': str(ing['id']),
                'name': ing['name'],
                'unit': ing['unit'],
                'category': ing.get('category'),
                'minStockLevel': float(ing.get('min_stock_level', 0)),
                'currentStock': float(ing.get('current_stock', 0)),
                'supplier': None,
                'costPerUnit': float(ing.get('cost_per_unit', 0)),
                'status': ing['status'],
                'createdAt': ing['created_at'].isoformat() if ing.get('created_at') else "",
                'updatedAt': ing['updated_at'].isoformat() if ing.get('updated_at') else ""
            },
            'movementType': movement['movement_type'],
            'quantity': float(movement['quantity']),
            'reason': movement.get('reason'),
            'referenceId': movement.get('reference_id'),
            'referenceType': movement.get('reference_type'),
            'createdAt': movement['created_at'].isoformat() if movement.get('created_at') else ""
        }
    except Exception as e:
        conn.rollback()
        raise Exception(f"Error adding stock: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@mutation.field("reduceStock")
def resolve_reduce_stock(_, info, ingredientId: str, quantity: float, reason: Optional[str] = None, referenceId: Optional[str] = None, referenceType: Optional[str] = None):
    """Reduce stock - requires authentication"""
    require_auth(info.context)
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Check stock availability
        cursor.execute("SELECT * FROM ingredients WHERE id = %s", (ingredientId,))
        ingredient = cursor.fetchone()
        
        if not ingredient:
            raise Exception("Ingredient not found")
        
        current_stock = float(ingredient['current_stock'])
        if current_stock < quantity:
            raise Exception(f"Insufficient stock. Available: {current_stock}, Requested: {quantity}")
        
        # Update stock
        cursor.execute(
            "UPDATE ingredients SET current_stock = current_stock - %s WHERE id = %s",
            (quantity, ingredientId)
        )
        
        # Update status if out of stock
        cursor.execute("""
            UPDATE ingredients 
            SET status = CASE 
                WHEN current_stock <= 0 THEN 'out_of_stock' 
                ELSE status 
            END 
            WHERE id = %s
        """, (ingredientId,))
        
        # Create stock movement
        cursor.execute("""
            INSERT INTO stock_movements (ingredient_id, movement_type, quantity, reason, reference_id, reference_type)
            VALUES (%s, 'out', %s, %s, %s, %s)
        """, (ingredientId, quantity, reason, referenceId, referenceType))
        
        movement_id = cursor.lastrowid
        conn.commit()
        
        # Fetch created movement
        cursor.execute("SELECT * FROM stock_movements WHERE id = %s", (movement_id,))
        movement = cursor.fetchone()
        
        # Fetch ingredient for response
        cursor.execute("SELECT * FROM ingredients WHERE id = %s", (ingredientId,))
        ing = cursor.fetchone()
        
        return {
            'id': str(movement['id']),
            'ingredient': {
                'id': str(ing['id']),
                'name': ing['name'],
                'unit': ing['unit'],
                'category': ing.get('category'),
                'minStockLevel': float(ing.get('min_stock_level', 0)),
                'currentStock': float(ing.get('current_stock', 0)),
                'supplier': None,
                'costPerUnit': float(ing.get('cost_per_unit', 0)),
                'status': ing['status']
            },
            'movementType': movement['movement_type'],
            'quantity': float(movement['quantity']),
            'reason': movement.get('reason'),
            'referenceId': movement.get('reference_id'),
            'referenceType': movement.get('reference_type'),
            'createdAt': movement['created_at'].isoformat() if movement.get('created_at') else ""
        }
    except Exception as e:
        conn.rollback()
        raise Exception(f"Error reducing stock: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@mutation.field("purchaseFromTokoSembako")
async def resolve_purchase_from_toko_sembako(_, info, input: Dict[str, Any]):
    """Purchase from Toko Sembako - requires manager role"""
    require_min_role(info.context, 'manager')
    
    order_number = input['orderNumber']
    items = input['items']
    notes = input.get('notes')
    
    try:
        # 1. Check stock availability for all items
        for item in items:
            stock_check = await check_stock_from_toko_sembako(item['productId'], item['quantity'])
            if not stock_check.get('available'):
                raise Exception(f"Stock tidak tersedia untuk product {item['productId']}: {stock_check.get('message')}")
        
        # 2. Get product details
        product_details = []
        for item in items:
            product = await get_product_by_id_from_toko_sembako(item['productId'])
            if not product:
                raise Exception(f"Product {item['productId']} tidak ditemukan")
            product_details.append({
                'productId': item['productId'],
                'quantity': item['quantity'],
                'name': product.get('name', f"Product {item['productId']}"),
                'price': product.get('price', 0),
                'unit': product.get('unit', 'pcs')
            })
        
        # 3. Create order at Toko Sembako
        order_result = await create_order_at_toko_sembako(order_number, items, notes)
        
        if not order_result.get('success'):
            raise Exception(f"Gagal membuat order: {order_result.get('message')}")
        
        # 4. Add stock to local inventory
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # Find or create Toko Sembako supplier
            cursor.execute("SELECT id FROM suppliers WHERE name = %s", ('Toko Sembako',))
            supplier = cursor.fetchone()
            
            if not supplier:
                cursor.execute(
                    "INSERT INTO suppliers (name, status) VALUES (%s, %s)",
                    ('Toko Sembako', 'active')
                )
                supplier_id = cursor.lastrowid
            else:
                supplier_id = supplier['id']
            
            # Calculate total
            total_amount = sum(p['price'] * p['quantity'] for p in product_details)
            
            # Create purchase order
            cursor.execute(
                """INSERT INTO purchase_orders (supplier_id, order_number, total_amount, status, notes)
                   VALUES (%s, %s, %s, %s, %s)""",
                (supplier_id, order_number, total_amount, 'ordered', notes or f"Order from Toko Sembako")
            )
            purchase_order_id = cursor.lastrowid
            
            stock_added = False
            
            # Process each item
            for item in product_details:
                # Find or create ingredient
                cursor.execute("SELECT id FROM ingredients WHERE name = %s", (item['name'],))
                ingredient = cursor.fetchone()
                
                if not ingredient:
                    cursor.execute(
                        """INSERT INTO ingredients (name, unit, category, min_stock_level, current_stock, 
                           supplier_id, cost_per_unit, status)
                           VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                        (item['name'], item['unit'], 'Sembako', 10, 0, supplier_id, item['price'], 'active')
                    )
                    ingredient_id = cursor.lastrowid
                else:
                    ingredient_id = ingredient['id']
                
                # Create purchase order item
                cursor.execute(
                    """INSERT INTO purchase_order_items (purchase_order_id, ingredient_id, quantity, price_per_unit)
                       VALUES (%s, %s, %s, %s)""",
                    (purchase_order_id, ingredient_id, item['quantity'], item['price'])
                )
                
                # Add stock immediately
                cursor.execute(
                    "UPDATE ingredients SET current_stock = current_stock + %s WHERE id = %s",
                    (item['quantity'], ingredient_id)
                )
                
                # Update status
                cursor.execute(
                    """UPDATE ingredients SET status = CASE 
                       WHEN current_stock > 0 THEN 'active' ELSE status END 
                       WHERE id = %s""",
                    (ingredient_id,)
                )
                
                # Create stock movement
                cursor.execute(
                    """INSERT INTO stock_movements (ingredient_id, movement_type, quantity, reason, 
                       reference_id, reference_type)
                       VALUES (%s, %s, %s, %s, %s, %s)""",
                    (ingredient_id, 'in', item['quantity'], 
                     f"Purchase from Toko Sembako: {order_number}",
                     str(order_result.get('order', {}).get('orderId', '')), 'toko_sembako_order')
                )
                
                stock_added = True
            
            conn.commit()
            
        except Exception as e:
            conn.rollback()
            raise Exception(f"Error adding stock: {str(e)}")
        finally:
            cursor.close()
            conn.close()
        
        return {
            'success': True,
            'message': 'Order berhasil dibuat di Toko Sembako dan stock telah ditambahkan',
            'tokoSembakoOrder': order_result.get('order'),
            'stockAdded': stock_added
        }
    except Exception as e:
        raise Exception(f"Error purchasing from Toko Sembako: {str(e)}")

@mutation.field("createSupplier")
def resolve_create_supplier(_, info, input: Dict[str, Any]):
    """Create a new supplier"""
    require_auth(info.context)
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            INSERT INTO suppliers (name, contact_person, email, phone, address, status)
            VALUES (%s, %s, %s, %s, %s, 'active')
        """, (
            input['name'],
            input.get('contactPerson'),
            input.get('email'),
            input.get('phone'),
            input.get('address')
        ))
        
        supplier_id = cursor.lastrowid
        conn.commit()
        
        cursor.execute("SELECT * FROM suppliers WHERE id = %s", (supplier_id,))
        s = cursor.fetchone()
        
        return {
            'id': str(s['id']),
            'name': s['name'],
            'contactPerson': s.get('contact_person'),
            'email': s.get('email'),
            'phone': s.get('phone'),
            'address': s.get('address'),
            'status': s['status'],
            'createdAt': s['created_at'].isoformat() if s.get('created_at') else "",
            'updatedAt': s['updated_at'].isoformat() if s.get('updated_at') else ""
        }
    except Exception as e:
        conn.rollback()
        raise Exception(f"Error creating supplier: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@mutation.field("updateSupplier")
def resolve_update_supplier(_, info, id: str, input: Dict[str, Any]):
    """Update existing supplier"""
    require_auth(info.context)
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        updates = []
        params = []
        
        if input.get('name') is not None:
            updates.append("name = %s")
            params.append(input['name'])
        if input.get('contactPerson') is not None:
            updates.append("contact_person = %s")
            params.append(input['contactPerson'])
        if input.get('email') is not None:
            updates.append("email = %s")
            params.append(input['email'])
        if input.get('phone') is not None:
            updates.append("phone = %s")
            params.append(input['phone'])
        if input.get('address') is not None:
            updates.append("address = %s")
            params.append(input['address'])
        if input.get('status') is not None:
            updates.append("status = %s")
            params.append(input['status'])
            
        if updates:
            query = f"UPDATE suppliers SET {', '.join(updates)} WHERE id = %s"
            params.append(id)
            cursor.execute(query, params)
            conn.commit()
            
        cursor.execute("SELECT * FROM suppliers WHERE id = %s", (id,))
        s = cursor.fetchone()
        
        if not s:
            raise Exception("Supplier not found")
            
        return {
            'id': str(s['id']),
            'name': s['name'],
            'contactPerson': s.get('contact_person'),
            'email': s.get('email'),
            'phone': s.get('phone'),
            'address': s.get('address'),
            'status': s['status'],
            'createdAt': s['created_at'].isoformat() if s.get('created_at') else "",
            'updatedAt': s['updated_at'].isoformat() if s.get('updated_at') else ""
        }
    except Exception as e:
        conn.rollback()
        raise Exception(f"Error updating supplier: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@mutation.field("createPurchaseOrder")
def resolve_create_purchase_order(_, info, input: Dict[str, Any]):
    """Create a new purchase order"""
    require_auth(info.context)
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        supplier_id = input['supplierId']
        order_number = input['orderNumber']
        order_date = input['orderDate']
        expected_delivery_date = input.get('expectedDeliveryDate')
        notes = input.get('notes')
        items = input['items']
        
        # Calculate total
        total_amount = 0
        for item in items:
            total_amount += item['quantity'] * item['unitPrice']
            
        cursor.execute("""
            INSERT INTO purchase_orders (supplier_id, order_number, order_date, expected_delivery_date, notes, total_amount, status)
            VALUES (%s, %s, %s, %s, %s, %s, 'ordered')
        """, (supplier_id, order_number, order_date, expected_delivery_date, notes, total_amount))
        
        order_id = cursor.lastrowid
        
        for item in items:
            cursor.execute("""
                INSERT INTO purchase_order_items (purchase_order_id, ingredient_id, quantity, price_per_unit, total_price)
                VALUES (%s, %s, %s, %s, %s)
            """, (order_id, item['ingredientId'], item['quantity'], item['unitPrice'], item['quantity'] * item['unitPrice']))
            
        conn.commit()
        
        # Return the created order
        cursor.execute("SELECT * FROM purchase_orders WHERE id = %s", (order_id,))
        order = cursor.fetchone()
        
        # Helper to fetch items
        cursor.execute("SELECT * FROM purchase_order_items WHERE purchase_order_id = %s", (order_id,))
        order_items = cursor.fetchall()
        items_data = []
        for it in order_items:
            items_data.append({
                'id': str(it['id']),
                'ingredient_id': it['ingredient_id'],
                'quantity': float(it['quantity']),
                'unitPrice': float(it['price_per_unit']),
                'totalPrice': float(it['total_price']),
                'receivedQuantity': float(it.get('received_quantity', 0))
            })

        return {
            'id': str(order['id']),
            'supplier_id': order['supplier_id'],
            'orderNumber': order['order_number'],
            'status': order['status'],
            'totalAmount': float(order['total_amount']),
            'orderDate': order['order_date'].isoformat() if order.get('order_date') else None,
            'expectedDeliveryDate': order['expected_delivery_date'].isoformat() if order.get('expected_delivery_date') else None,
            'receivedDate': order['received_date'].isoformat() if order.get('received_date') else None,
            'notes': order.get('notes'),
            'items': items_data,
            'createdAt': order['created_at'].isoformat() if order.get('created_at') else "",
            'updatedAt': order['updated_at'].isoformat() if order.get('updated_at') else ""
        }
    except Exception as e:
        conn.rollback()
        raise Exception(f"Error creating purchase order: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@mutation.field("updatePurchaseOrderStatus")
def resolve_update_purchase_order_status(_, info, id: str, status: str):
    """Update purchase order status"""
    require_auth(info.context)
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("UPDATE purchase_orders SET status = %s WHERE id = %s", (status, id))
        conn.commit()
        
        cursor.execute("SELECT * FROM purchase_orders WHERE id = %s", (id,))
        order = cursor.fetchone()
        
        if not order:
            raise Exception("Purchase order not found")
            
        # Helper to fetch items (Code duplicated for simplicity, could be refactored)
        cursor.execute("SELECT * FROM purchase_order_items WHERE purchase_order_id = %s", (id,))
        order_items = cursor.fetchall()
        items_data = []
        for it in order_items:
            items_data.append({
                'id': str(it['id']),
                'ingredient_id': it['ingredient_id'],
                'quantity': float(it['quantity']),
                'unitPrice': float(it['price_per_unit']),
                'totalPrice': float(it['total_price']),
                'receivedQuantity': float(it.get('received_quantity', 0))
            })
            
        return {
            'id': str(order['id']),
            'supplier_id': order['supplier_id'],
            'orderNumber': order['order_number'],
            'status': order['status'],
            'totalAmount': float(order['total_amount']),
            'orderDate': order['order_date'].isoformat() if order.get('order_date') else None,
            'expectedDeliveryDate': order['expected_delivery_date'].isoformat() if order.get('expected_delivery_date') else None,
            'receivedDate': order['received_date'].isoformat() if order.get('received_date') else None,
            'notes': order.get('notes'),
            'items': items_data,
            'createdAt': order['created_at'].isoformat() if order.get('created_at') else "",
            'updatedAt': order['updated_at'].isoformat() if order.get('updated_at') else ""
        }
    except Exception as e:
        conn.rollback()
        raise Exception(f"Error updating purchase order status: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@mutation.field("receivePurchaseOrder")
def resolve_receive_purchase_order(_, info, id: str):
    """Receive purchase order and update stock"""
    require_auth(info.context)
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Get items
        cursor.execute("SELECT * FROM purchase_order_items WHERE purchase_order_id = %s", (id,))
        items = cursor.fetchall()
        
        if not items:
            raise Exception("Purchase order items not found or empty order")

        # Update items received quantity and stock
        for item in items:
            # Mark fully received
            cursor.execute("UPDATE purchase_order_items SET received_quantity = quantity WHERE id = %s", (item['id'],))
            
            # Add stock
            cursor.execute("UPDATE ingredients SET current_stock = current_stock + %s WHERE id = %s", (item['quantity'], item['ingredient_id']))
            
            # Update ingredient status if needed
            cursor.execute("""
                UPDATE ingredients SET status = CASE 
                WHEN current_stock > 0 THEN 'active' ELSE status END 
                WHERE id = %s
            """, (item['ingredient_id'],))
            
            # Create movement
            cursor.execute("""
                INSERT INTO stock_movements (ingredient_id, movement_type, quantity, reason, reference_id, reference_type)
                VALUES (%s, 'in', %s, %s, %s, 'purchase_order')
            """, (item['ingredient_id'], item['quantity'], f"Purchase Order Received: {id}", id))
            
        # Update order status
        from datetime import date
        today = date.today()
        cursor.execute("UPDATE purchase_orders SET status = 'received', received_date = %s WHERE id = %s", (today, id))
        conn.commit()
        
        # Return updated order
        cursor.execute("SELECT * FROM purchase_orders WHERE id = %s", (id,))
        order = cursor.fetchone()
        
        # Fetch items again
        cursor.execute("SELECT * FROM purchase_order_items WHERE purchase_order_id = %s", (id,))
        order_items = cursor.fetchall()
        items_data = []
        for it in order_items:
            items_data.append({
                'id': str(it['id']),
                'ingredient_id': it['ingredient_id'],
                'quantity': float(it['quantity']),
                'unitPrice': float(it['price_per_unit']),
                'totalPrice': float(it['total_price']),
                'receivedQuantity': float(it.get('received_quantity', 0))
            })
            
        return {
            'id': str(order['id']),
            'supplier_id': order['supplier_id'],
            'orderNumber': order['order_number'],
            'status': order['status'],
            'totalAmount': float(order['total_amount']),
            'orderDate': order['order_date'].isoformat() if order.get('order_date') else None,
            'expectedDeliveryDate': order['expected_delivery_date'].isoformat() if order.get('expected_delivery_date') else None,
            'receivedDate': order['received_date'].isoformat() if order.get('received_date') else None,
            'notes': order.get('notes'),
            'items': items_data,
            'createdAt': order['created_at'].isoformat() if order.get('created_at') else "",
            'updatedAt': order['updated_at'].isoformat() if order.get('updated_at') else ""
        }
    except Exception as e:
        conn.rollback()
        raise Exception(f"Error receiving purchase order: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@mutation.field("syncStockFromTokoSembako")
async def resolve_sync_stock_from_toko_sembako(_, info, productId: str, quantity: float):
    """Sync stock from Toko Sembako"""
    require_auth(info.context)
    # Import here or rely on global. Using global imports if available.
    from src.services.toko_sembako_client import get_product_by_id_from_toko_sembako, check_stock_from_toko_sembako
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Check external stock
        product = await get_product_by_id_from_toko_sembako(productId)
        if not product:
            raise Exception("Product not found in Toko Sembako")
            
        stock_check = await check_stock_from_toko_sembako(productId, quantity)
        if not stock_check.get('available'):
             raise Exception(f"Stock tidak tersedia: {stock_check.get('message')}")

        # Find or create ingredient
        cursor.execute("SELECT * FROM ingredients WHERE name = %s", (product['name'],))
        ing = cursor.fetchone()
        
        ingredient_id = None
        if not ing:
             # Find Sembako supplier
             cursor.execute("SELECT * FROM suppliers WHERE name = 'Toko Sembako'")
             sup = cursor.fetchone()
             if not sup:
                 cursor.execute("INSERT INTO suppliers (name, status) VALUES ('Toko Sembako', 'active')")
                 supplier_id = cursor.lastrowid
             else:
                 supplier_id = sup['id']
                 
             cursor.execute("""
                 INSERT INTO ingredients (name, unit, category, min_stock_level, current_stock, supplier_id, cost_per_unit, status)
                 VALUES (%s, %s, 'Vegetable', 10, 0, %s, %s, 'active')
             """, (product['name'], product['unit'], supplier_id, product['price']))
             ingredient_id = cursor.lastrowid
        else:
             ingredient_id = ing['id']
             
        # Add Stock
        cursor.execute("UPDATE ingredients SET current_stock = current_stock + %s WHERE id = %s", (quantity, ingredient_id))
        
        # Movement
        cursor.execute("""
            INSERT INTO stock_movements (ingredient_id, movement_type, quantity, reason, reference_type)
            VALUES (%s, 'in', %s, 'Sync from Toko Sembako', 'toko_sembako_sync')
        """, (ingredient_id, quantity))
        
        conn.commit()
        
        cursor.execute("SELECT * FROM ingredients WHERE id = %s", (ingredient_id,))
        updated_ing = cursor.fetchone()
        
        return {
            'id': str(updated_ing['id']),
            'name': updated_ing['name'],
            'currentStock': float(updated_ing['current_stock']),
            'unit': updated_ing['unit']
        }

    except Exception as e:
        conn.rollback()
        raise Exception(f"Error syncing stock: {str(e)}")
    finally:
        cursor.close()
        conn.close()

# Export resolvers
resolvers = [query, mutation, ingredient, supplier, stock_movement, purchase_order, purchase_order_item, stock_check_result, toko_sembako_product, toko_sembako_stock_check]






