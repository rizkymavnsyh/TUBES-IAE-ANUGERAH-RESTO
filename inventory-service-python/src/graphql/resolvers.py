from typing import Optional, Dict, Any
from ariadne import QueryType, MutationType, ObjectType
from src.database.connection import get_db_connection
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

# Mutation resolvers
@mutation.field("reduceStock")
def resolve_reduce_stock(_, info, ingredientId: str, quantity: float, reason: Optional[str] = None, referenceId: Optional[str] = None, referenceType: Optional[str] = None):
    """Reduce stock"""
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
    """Purchase from Toko Sembako"""
    try:
        # Create order at Toko Sembako
        order_result = await create_order_at_toko_sembako(
            input['orderNumber'],
            input['items'],
            input.get('notes')
        )
        
        if not order_result.get('success'):
            return {
                'success': False,
                'message': order_result.get('message', 'Failed to create order'),
                'tokoSembakoOrder': None,
                'stockAdded': False
            }
        
        # Add stock to inventory (simplified - you may need to map products to ingredients)
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            stock_added = False
            # TODO: Implement stock addition logic based on order items
            # This is a placeholder
            
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise Exception(f"Error adding stock: {str(e)}")
        finally:
            cursor.close()
            conn.close()
        
        return {
            'success': True,
            'message': 'Order created successfully',
            'tokoSembakoOrder': order_result.get('order'),
            'stockAdded': stock_added
        }
    except Exception as e:
        raise Exception(f"Error purchasing from Toko Sembako: {str(e)}")

# Export resolvers
resolvers = [query, mutation, ingredient, supplier, stock_movement, stock_check_result, toko_sembako_product, toko_sembako_stock_check]






