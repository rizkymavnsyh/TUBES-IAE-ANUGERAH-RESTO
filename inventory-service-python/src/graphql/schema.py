import strawberry
from typing import List, Optional
from enum import Enum
from decimal import Decimal
from src.database.connection import get_db_connection
from src.services.toko_sembako_client import (
    get_products_from_toko_sembako,
    get_product_by_id_from_toko_sembako,
    check_stock_from_toko_sembako,
    create_order_at_toko_sembako,
    get_order_status_from_toko_sembako
)

# Enums
@strawberry.enum
class SupplierStatus(Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

@strawberry.enum
class IngredientStatus(Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    OUT_OF_STOCK = "out_of_stock"

@strawberry.enum
class MovementType(Enum):
    IN = "in"
    OUT = "out"
    ADJUSTMENT = "adjustment"

# Types
@strawberry.type
class Supplier:
    id: str
    name: str
    contact_person: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    status: str

@strawberry.type
class Ingredient:
    id: str
    name: str
    unit: str
    category: Optional[str]
    min_stock_level: float
    current_stock: float
    supplier: Optional[Supplier]
    cost_per_unit: float
    status: str

@strawberry.type
class StockMovement:
    id: str
    ingredient: Ingredient
    movement_type: str
    quantity: float
    reason: Optional[str]
    reference_id: Optional[str]
    reference_type: Optional[str]
    created_at: str

@strawberry.type
class StockCheckResult:
    available: bool
    current_stock: float
    requested_quantity: float
    message: str

# Toko Sembako Types
@strawberry.type
class TokoSembakoProduct:
    id: str
    name: str
    category: Optional[str]
    price: float
    unit: str
    available: bool
    description: Optional[str]

@strawberry.type
class TokoSembakoStockCheck:
    available: bool
    current_stock: float
    requested_quantity: float
    message: str

@strawberry.type
class TokoSembakoOrderItem:
    product_id: str
    name: str
    quantity: float
    price: float

@strawberry.type
class TokoSembakoOrder:
    id: str
    order_id: str
    status: str
    total: float
    items: List[TokoSembakoOrderItem]
    created_at: Optional[str]

@strawberry.type
class PurchaseFromTokoSembakoResult:
    success: bool
    message: str
    toko_sembako_order: Optional[TokoSembakoOrder]
    stock_added: bool

# Inputs
@strawberry.input
class TokoSembakoOrderItemInput:
    product_id: str
    quantity: float

@strawberry.input
class PurchaseFromTokoSembakoInput:
    order_number: str
    items: List[TokoSembakoOrderItemInput]
    notes: Optional[str] = None

# Query
@strawberry.type
class Query:
    @strawberry.field
    def ingredients(self, category: Optional[str] = None, status: Optional[str] = None) -> List[Ingredient]:
        """Get all ingredients"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            query = "SELECT * FROM ingredients"
            params = []
            
            conditions = []
            if category:
                conditions.append("category = %s")
                params.append(category)
            if status:
                conditions.append("status = %s")
                params.append(status)
            
            if conditions:
                query += " WHERE " + " AND ".join(conditions)
            
            query += " ORDER BY name"
            cursor.execute(query, params)
            ingredients_data = cursor.fetchall()
            
            result = []
            for ing in ingredients_data:
                supplier = None
                if ing.get('supplier_id'):
                    cursor.execute("SELECT * FROM suppliers WHERE id = %s", (ing['supplier_id'],))
                    sup = cursor.fetchone()
                    if sup:
                        supplier = Supplier(
                            id=str(sup['id']),
                            name=sup['name'],
                            contact_person=sup.get('contact_person'),
                            email=sup.get('email'),
                            phone=sup.get('phone'),
                            address=sup.get('address'),
                            status=sup['status']
                        )
                
                result.append(Ingredient(
                    id=str(ing['id']),
                    name=ing['name'],
                    unit=ing['unit'],
                    category=ing.get('category'),
                    min_stock_level=float(ing['min_stock_level']),
                    current_stock=float(ing['current_stock']),
                    supplier=supplier,
                    cost_per_unit=float(ing['cost_per_unit']),
                    status=ing['status']
                ))
            
            return result
        finally:
            cursor.close()
            conn.close()

    @strawberry.field
    def check_stock(self, ingredient_id: str, quantity: float) -> StockCheckResult:
        """Check stock availability"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            cursor.execute("SELECT * FROM ingredients WHERE id = %s", (ingredient_id,))
            ingredient = cursor.fetchone()
            
            if not ingredient:
                raise Exception("Ingredient not found")
            
            current_stock = float(ingredient['current_stock'])
            available = current_stock >= quantity
            
            return StockCheckResult(
                available=available,
                current_stock=current_stock,
                requested_quantity=quantity,
                message=f"Stock {'tersedia' if available else 'tidak cukup'}: {current_stock} {ingredient['unit']}"
            )
        finally:
            cursor.close()
            conn.close()

    @strawberry.field
    async def toko_sembako_products(self, category: Optional[str] = None) -> List[TokoSembakoProduct]:
        """Get products from Toko Sembako"""
        products = await get_products_from_toko_sembako(category)
        return [
            TokoSembakoProduct(
                id=str(p.get('id', '')),
                name=p.get('name', ''),
                category=p.get('category'),
                price=float(p.get('price', 0)),
                unit=p.get('unit', ''),
                available=p.get('available', False),
                description=p.get('description')
            )
            for p in products
        ]

    @strawberry.field
    async def check_toko_sembako_stock(self, product_id: str, quantity: float) -> TokoSembakoStockCheck:
        """Check stock from Toko Sembako"""
        stock_check = await check_stock_from_toko_sembako(product_id, quantity)
        return TokoSembakoStockCheck(
            available=stock_check.get('available', False),
            current_stock=float(stock_check.get('currentStock', 0)),
            requested_quantity=quantity,
            message=stock_check.get('message', '')
        )

# Mutation
@strawberry.type
class Mutation:
    @strawberry.mutation
    def reduce_stock(
        self, 
        ingredient_id: str, 
        quantity: float, 
        reason: Optional[str] = None,
        reference_id: Optional[str] = None,
        reference_type: Optional[str] = None
    ) -> StockMovement:
        """Reduce stock"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # Check stock availability
            cursor.execute("SELECT * FROM ingredients WHERE id = %s", (ingredient_id,))
            ingredient = cursor.fetchone()
            
            if not ingredient:
                raise Exception("Ingredient not found")
            
            current_stock = float(ingredient['current_stock'])
            if current_stock < quantity:
                raise Exception(f"Insufficient stock. Available: {current_stock}, Requested: {quantity}")
            
            # Start transaction
            cursor.execute("START TRANSACTION")
            
            # Update stock
            cursor.execute(
                "UPDATE ingredients SET current_stock = current_stock - %s WHERE id = %s",
                (quantity, ingredient_id)
            )
            
            # Update status if out of stock
            cursor.execute("""
                UPDATE ingredients 
                SET status = CASE 
                    WHEN current_stock <= 0 THEN 'out_of_stock' 
                    ELSE status 
                END 
                WHERE id = %s
            """, (ingredient_id,))
            
            # Create stock movement
            cursor.execute("""
                INSERT INTO stock_movements (ingredient_id, movement_type, quantity, reason, reference_id, reference_type)
                VALUES (%s, 'out', %s, %s, %s, %s)
            """, (ingredient_id, quantity, reason, reference_id, reference_type))
            
            movement_id = cursor.lastrowid
            conn.commit()
            
            # Fetch movement
            cursor.execute("SELECT * FROM stock_movements WHERE id = %s", (movement_id,))
            movement = cursor.fetchone()
            
            # Get ingredient for response
            cursor.execute("SELECT * FROM ingredients WHERE id = %s", (ingredient_id,))
            ing = cursor.fetchone()
            
            ingredient_obj = Ingredient(
                id=str(ing['id']),
                name=ing['name'],
                unit=ing['unit'],
                category=ing.get('category'),
                min_stock_level=float(ing['min_stock_level']),
                current_stock=float(ing['current_stock']),
                supplier=None,
                cost_per_unit=float(ing['cost_per_unit']),
                status=ing['status']
            )
            
            return StockMovement(
                id=str(movement['id']),
                ingredient=ingredient_obj,
                movement_type=movement['movement_type'],
                quantity=float(movement['quantity']),
                reason=movement.get('reason'),
                reference_id=movement.get('reference_id'),
                reference_type=movement.get('reference_type'),
                created_at=movement['created_at'].isoformat() if movement.get('created_at') else ""
            )
        except Exception as e:
            conn.rollback()
            raise Exception(f"Error reducing stock: {str(e)}")
        finally:
            cursor.close()
            conn.close()

    @strawberry.mutation
    async def purchase_from_toko_sembako(self, input: PurchaseFromTokoSembakoInput) -> PurchaseFromTokoSembakoResult:
        """Purchase from Toko Sembako"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # 1. Check stock for all items
            for item in input.items:
                stock_check = await check_stock_from_toko_sembako(item.product_id, item.quantity)
                if not stock_check.get('available', False):
                    raise Exception(f"Stock tidak tersedia untuk product {item.product_id}: {stock_check.get('message', '')}")
            
            # 2. Get product details
            product_details = []
            for item in input.items:
                product = await get_product_by_id_from_toko_sembako(item.product_id)
                if not product:
                    raise Exception(f"Product {item.product_id} tidak ditemukan")
                product_details.append({
                    'product_id': item.product_id,
                    'name': product.get('name', ''),
                    'price': float(product.get('price', 0)),
                    'unit': product.get('unit', ''),
                    'quantity': item.quantity
                })
            
            # 3. Create order at Toko Sembako
            try:
                toko_sembako_order = await create_order_at_toko_sembako({
                    'orderId': input.order_number,
                    'items': [
                        {
                            'productId': item['product_id'],
                            'name': item['name'],
                            'quantity': item['quantity'],
                            'price': item['price']
                        }
                        for item in product_details
                    ],
                    'notes': input.notes or f"Purchase order from Anugerah Resto: {input.order_number}"
                })
            except Exception as e:
                raise Exception(f"Gagal membuat order di Toko Sembako: {str(e)}")
            
            # 4. Create purchase order in local database
            # Find or create Toko Sembako supplier
            cursor.execute("SELECT * FROM suppliers WHERE name = %s", ('Toko Sembako',))
            supplier = cursor.fetchone()
            
            if not supplier:
                cursor.execute("INSERT INTO suppliers (name, status) VALUES (%s, 'active')", ('Toko Sembako',))
                supplier_id = cursor.lastrowid
            else:
                supplier_id = supplier['id']
            
            # Calculate total
            total_amount = sum(item['price'] * item['quantity'] for item in product_details)
            
            # Start transaction
            cursor.execute("START TRANSACTION")
            
            # Create purchase order
            cursor.execute("""
                INSERT INTO purchase_orders (supplier_id, order_number, total_amount, status, notes)
                VALUES (%s, %s, %s, 'ordered', %s)
            """, (supplier_id, input.order_number, total_amount, input.notes or f"Order from Toko Sembako: {toko_sembako_order.get('orderId', '')}"))
            
            purchase_order_id = cursor.lastrowid
            stock_added = False
            
            # Create purchase order items and sync to ingredients
            for item in product_details:
                # Find or create ingredient
                cursor.execute("SELECT * FROM ingredients WHERE name = %s", (item['name'],))
                ingredient = cursor.fetchone()
                
                if not ingredient:
                    # Create new ingredient
                    cursor.execute("""
                        INSERT INTO ingredients (name, unit, category, min_stock_level, current_stock, supplier_id, cost_per_unit, status)
                        VALUES (%s, %s, 'Vegetable', 10, 0, %s, %s, 'active')
                    """, (item['name'], item['unit'], supplier_id, item['price']))
                    ingredient_id = cursor.lastrowid
                else:
                    ingredient_id = ingredient['id']
                
                # Create purchase order item
                cursor.execute("""
                    INSERT INTO purchase_order_items (purchase_order_id, ingredient_id, quantity, unit_price, total_price, received_quantity)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (purchase_order_id, ingredient_id, item['quantity'], item['price'], item['price'] * item['quantity'], item['quantity']))
                
                # Add stock
                cursor.execute(
                    "UPDATE ingredients SET current_stock = current_stock + %s WHERE id = %s",
                    (item['quantity'], ingredient_id)
                )
                
                # Update status
                cursor.execute("""
                    UPDATE ingredients 
                    SET status = CASE 
                        WHEN current_stock > 0 THEN 'active' 
                        ELSE status 
                    END 
                    WHERE id = %s
                """, (ingredient_id,))
                
                # Create stock movement
                cursor.execute("""
                    INSERT INTO stock_movements (ingredient_id, movement_type, quantity, reason, reference_id, reference_type)
                    VALUES (%s, 'in', %s, %s, %s, %s)
                """, (ingredient_id, item['quantity'], f"Purchase from Toko Sembako: {input.order_number}", toko_sembako_order.get('orderId', ''), 'toko_sembako_order'))
                
                stock_added = True
            
            conn.commit()
            
            # Build response
            return PurchaseFromTokoSembakoResult(
                success=True,
                message="Order berhasil dibuat di Toko Sembako dan stock telah ditambahkan",
                toko_sembako_order=TokoSembakoOrder(
                    id=str(toko_sembako_order.get('id', '')),
                    order_id=toko_sembako_order.get('orderId', ''),
                    status=toko_sembako_order.get('status', ''),
                    total=float(toko_sembako_order.get('total', 0)),
                    items=[
                        TokoSembakoOrderItem(
                            product_id=str(item.get('productId', '')),
                            name=item.get('name', ''),
                            quantity=float(item.get('quantity', 0)),
                            price=float(item.get('price', 0))
                        )
                        for item in toko_sembako_order.get('items', [])
                    ],
                    created_at=toko_sembako_order.get('createdAt')
                ),
                stock_added=stock_added
            )
        except Exception as e:
            conn.rollback()
            raise Exception(f"Error purchasing from Toko Sembako: {str(e)}")
        finally:
            cursor.close()
            conn.close()



