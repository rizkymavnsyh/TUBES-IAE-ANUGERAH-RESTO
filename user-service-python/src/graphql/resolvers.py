from typing import Optional, Dict, Any
import bcrypt
import jwt
from datetime import datetime
from ariadne import QueryType, MutationType, ObjectType
from src.database.connection import get_db_connection

JWT_SECRET = "your-secret-key-change-in-production"

query = QueryType()
mutation = MutationType()
staff = ObjectType("Staff")
customer = ObjectType("Customer")
customer_loyalty = ObjectType("CustomerLoyalty")
loyalty_transaction = ObjectType("LoyaltyTransaction")
auth_response = ObjectType("AuthResponse")

# Query resolvers
@query.field("customers")
def resolve_customers(_, info, status: Optional[str] = None):
    """Get all customers"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        query_sql = "SELECT * FROM customers"
        params = []
        if status:
            query_sql += " WHERE status = %s"
            params.append(status)
        query_sql += " ORDER BY name"
        
        cursor.execute(query_sql, params)
        customers_data = cursor.fetchall()
        
        return [
            {
                'id': str(c['id']),
                'customerId': c['customer_id'],
                'name': c['name'],
                'email': c.get('email'),
                'phone': c.get('phone'),
                'address': c.get('address'),
                'dateOfBirth': c['date_of_birth'].isoformat() if c.get('date_of_birth') else None,
                'registrationDate': c['registration_date'].isoformat() if c.get('registration_date') else "",
                'status': c['status']
            }
            for c in customers_data
        ]
    except Exception as e:
        raise Exception(f"Error fetching customers: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@query.field("customer")
def resolve_customer(_, info, id: str):
    """Get customer by ID"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT * FROM customers WHERE id = %s", (id,))
        c = cursor.fetchone()
        
        if not c:
            return None
        
        return {
            'id': str(c['id']),
            'customerId': c['customer_id'],
            'name': c['name'],
            'email': c.get('email'),
            'phone': c.get('phone'),
            'address': c.get('address'),
            'dateOfBirth': c['date_of_birth'].isoformat() if c.get('date_of_birth') else None,
            'registrationDate': c['registration_date'].isoformat() if c.get('registration_date') else "",
            'status': c['status']
        }
    except Exception as e:
        raise Exception(f"Error fetching customer: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@query.field("staff")
def resolve_staff(_, info, status: Optional[str] = None, role: Optional[str] = None):
    """Get all staff"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        query_sql = "SELECT * FROM staff"
        params = []
        conditions = []
        
        if status:
            conditions.append("status = %s")
            params.append(status)
        if role:
            conditions.append("role = %s")
            params.append(role)
        
        if conditions:
            query_sql += " WHERE " + " AND ".join(conditions)
        
        query_sql += " ORDER BY name"
        cursor.execute(query_sql, params)
        staff_data = cursor.fetchall()
        
        return [
            {
                'id': str(s['id']),
                'employeeId': s['employee_id'],
                'username': s.get('username', ''),
                'name': s['name'],
                'email': s.get('email'),
                'phone': s.get('phone'),
                'role': s['role'],
                'department': s.get('department'),
                'status': s['status'],
                'hireDate': s['hire_date'].isoformat() if s.get('hire_date') else None,
                'salary': float(s['salary']) if s.get('salary') else None
            }
            for s in staff_data
        ]
    except Exception as e:
        raise Exception(f"Error fetching staff: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@query.field("staffById")
def resolve_staff_by_id(_, info, id: str):
    """Get staff by ID"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT * FROM staff WHERE id = %s", (id,))
        s = cursor.fetchone()
        
        if not s:
            return None
        
        return {
            'id': str(s['id']),
            'employeeId': s['employee_id'],
            'name': s['name'],
            'email': s.get('email'),
            'phone': s.get('phone'),
            'role': s['role'],
            'department': s.get('department'),
            'status': s['status'],
            'hireDate': s['hire_date'].isoformat() if s.get('hire_date') else None,
            'salary': float(s['salary']) if s.get('salary') else None
        }
    except Exception as e:
        raise Exception(f"Error fetching staff: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@query.field("customerLoyalty")
def resolve_customer_loyalty(_, info, customerId: str):
    """Get customer loyalty"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute(
            "SELECT * FROM customer_loyalty WHERE customer_id = %s AND status = 'active' LIMIT 1",
            (customerId,)
        )
        loyalty = cursor.fetchone()
        
        if not loyalty:
            return None
        
        total_points = float(loyalty['total_points'])
        redeemed_points = float(loyalty['redeemed_points'])
        
        return {
            'id': str(loyalty['id']),
            'totalPoints': total_points,
            'redeemedPoints': redeemed_points,
            'availablePoints': total_points - redeemed_points,
            'tier': loyalty['tier'],
            'joinDate': loyalty['join_date'].isoformat() if loyalty.get('join_date') else "",
            'lastActivityDate': loyalty['last_activity_date'].isoformat() if loyalty.get('last_activity_date') else None,
            'status': loyalty['status']
        }
    except Exception as e:
        raise Exception(f"Error fetching customer loyalty: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@query.field("loyaltyTransactions")
def resolve_loyalty_transactions(_, info, customerId: str):
    """Get loyalty transactions"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute(
            "SELECT * FROM loyalty_transactions WHERE customer_id = %s ORDER BY created_at DESC",
            (customerId,)
        )
        transactions = cursor.fetchall()
        
        return [
            {
                'id': str(t['id']),
                'transactionType': t['transaction_type'],
                'points': float(t['points']),
                'orderId': t.get('order_id'),
                'description': t.get('description'),
                'createdAt': t['created_at'].isoformat() if t.get('created_at') else ""
            }
            for t in transactions
        ]
    except Exception as e:
        raise Exception(f"Error fetching loyalty transactions: {str(e)}")
    finally:
        cursor.close()
        conn.close()

# Mutation resolvers
@mutation.field("createCustomer")
def resolve_create_customer(_, info, input: Dict[str, Any]):
    """Create customer"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            INSERT INTO customers (customer_id, name, email, phone, address, date_of_birth)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            input['customerId'], input['name'], input.get('email'), 
            input.get('phone'), input.get('address'), input.get('dateOfBirth')
        ))
        
        customer_id = cursor.lastrowid
        conn.commit()
        
        cursor.execute("SELECT * FROM customers WHERE id = %s", (customer_id,))
        c = cursor.fetchone()
        
        return {
            'id': str(c['id']),
            'customerId': c['customer_id'],
            'name': c['name'],
            'email': c.get('email'),
            'phone': c.get('phone'),
            'address': c.get('address'),
            'dateOfBirth': c['date_of_birth'].isoformat() if c.get('date_of_birth') else None,
            'registrationDate': c['registration_date'].isoformat() if c.get('registration_date') else "",
            'status': c['status']
        }
    except Exception as e:
        conn.rollback()
        raise Exception(f"Error creating customer: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@mutation.field("updateCustomer")
def resolve_update_customer(_, info, id: str, input: Dict[str, Any]):
    """Update customer"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        updates = []
        params = []
        
        if 'name' in input:
            updates.append("name = %s")
            params.append(input['name'])
        if 'email' in input:
            updates.append("email = %s")
            params.append(input.get('email'))
        if 'phone' in input:
            updates.append("phone = %s")
            params.append(input.get('phone'))
        if 'address' in input:
            updates.append("address = %s")
            params.append(input.get('address'))
        if 'dateOfBirth' in input:
            updates.append("date_of_birth = %s")
            params.append(input.get('dateOfBirth'))
        
        if not updates:
            raise Exception("No fields to update")
        
        params.append(id)
        cursor.execute(
            f"UPDATE customers SET {', '.join(updates)} WHERE id = %s",
            params
        )
        conn.commit()
        
        cursor.execute("SELECT * FROM customers WHERE id = %s", (id,))
        c = cursor.fetchone()
        
        if not c:
            raise Exception("Customer not found")
        
        return {
            'id': str(c['id']),
            'customerId': c['customer_id'],
            'name': c['name'],
            'email': c.get('email'),
            'phone': c.get('phone'),
            'address': c.get('address'),
            'dateOfBirth': c['date_of_birth'].isoformat() if c.get('date_of_birth') else None,
            'registrationDate': c['registration_date'].isoformat() if c.get('registration_date') else "",
            'status': c['status']
        }
    except Exception as e:
        conn.rollback()
        raise Exception(f"Error updating customer: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@mutation.field("createStaff")
def resolve_create_staff(_, info, input: Dict[str, Any]):
    """Create staff"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        password_hash = None
        if input.get('password'):
            password_hash = bcrypt.hashpw(input['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Map role from uppercase (GraphQL) to lowercase (database ENUM)
        role_mapping = {
            'MANAGER': 'manager',
            'CHEF': 'chef',
            'WAITER': 'waiter',
            'CASHIER': 'cashier',
            'ADMIN': 'admin'
        }
        role = role_mapping.get(input['role'], input['role'].lower())
        
        cursor.execute("""
            INSERT INTO staff (employee_id, username, name, email, phone, role, department, password_hash, hire_date, salary)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            input['employeeId'], input['username'], input['name'], input.get('email'), 
            input.get('phone'), role, input.get('department'),
            password_hash, input.get('hireDate'), input.get('salary')
        ))
        
        staff_id = cursor.lastrowid
        conn.commit()
        
        cursor.execute("SELECT * FROM staff WHERE id = %s", (staff_id,))
        s = cursor.fetchone()
        
        return {
            'id': str(s['id']),
            'employeeId': s['employee_id'],
            'username': s['username'],
            'name': s['name'],
            'email': s.get('email'),
            'phone': s.get('phone'),
            'role': s['role'],
            'department': s.get('department'),
            'status': s['status'],
            'hireDate': s['hire_date'].isoformat() if s.get('hire_date') else None,
            'salary': float(s['salary']) if s.get('salary') else None
        }
    except Exception as e:
        conn.rollback()
        raise Exception(f"Error creating staff: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@mutation.field("updateStaff")
def resolve_update_staff(_, info, id: str, input: Dict[str, Any]):
    """Update staff"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        updates = []
        params = []
        
        if 'username' in input and input['username']:
            updates.append("username = %s")
            params.append(input['username'])
        if 'name' in input and input['name']:
            updates.append("name = %s")
            params.append(input['name'])
        if 'email' in input:
            updates.append("email = %s")
            params.append(input.get('email'))
        if 'phone' in input:
            updates.append("phone = %s")
            params.append(input.get('phone'))
        if 'role' in input and input['role']:
            # Map role to lowercase
            role = input['role'].lower() if input['role'] else 'waiter'
            updates.append("role = %s")
            params.append(role)
        if 'department' in input:
            updates.append("department = %s")
            params.append(input.get('department'))
        if 'password' in input and input['password']:
            password_hash = bcrypt.hashpw(input['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            updates.append("password_hash = %s")
            params.append(password_hash)
        if 'hireDate' in input:
            updates.append("hire_date = %s")
            params.append(input.get('hireDate'))
        if 'salary' in input:
            updates.append("salary = %s")
            params.append(input.get('salary'))
        
        if not updates:
            raise Exception("No fields to update")
        
        params.append(id)
        cursor.execute(
            f"UPDATE staff SET {', '.join(updates)} WHERE id = %s",
            params
        )
        conn.commit()
        
        cursor.execute("SELECT * FROM staff WHERE id = %s", (id,))
        s = cursor.fetchone()
        
        if not s:
            raise Exception("Staff not found")
        
        return {
            'id': str(s['id']),
            'employeeId': s['employee_id'],
            'username': s.get('username', ''),
            'name': s['name'],
            'email': s.get('email'),
            'phone': s.get('phone'),
            'role': s['role'],
            'department': s.get('department'),
            'status': s['status'],
            'hireDate': s['hire_date'].isoformat() if s.get('hire_date') else None,
            'salary': float(s['salary']) if s.get('salary') else None
        }
    except Exception as e:
        conn.rollback()
        raise Exception(f"Error updating staff: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@mutation.field("deleteStaff")
def resolve_delete_staff(_, info, id: str):
    """Delete staff by id"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Check if staff exists
        cursor.execute("SELECT id FROM staff WHERE id = %s", (id,))
        staff = cursor.fetchone()
        
        if not staff:
            raise Exception(f"Staff with id {id} not found")
        
        # Delete the staff
        cursor.execute("DELETE FROM staff WHERE id = %s", (id,))
        conn.commit()
        
        return True
    except Exception as e:
        conn.rollback()
        raise Exception(f"Error deleting staff: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@mutation.field("deleteCustomer")
def resolve_delete_customer(_, info, id: str):
    """Delete customer by id"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Check if customer exists
        cursor.execute("SELECT id FROM customers WHERE id = %s", (id,))
        customer = cursor.fetchone()
        
        if not customer:
            raise Exception(f"Customer with id {id} not found")
        
        # Delete the customer
        cursor.execute("DELETE FROM customers WHERE id = %s", (id,))
        conn.commit()
        
        return True
    except Exception as e:
        conn.rollback()
        raise Exception(f"Error deleting customer: {str(e)}")
    finally:
        cursor.close()
        conn.close()


@mutation.field("loginStaff")
def resolve_login(_, info, username: str, password: str):
    """Login staff using username"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT * FROM staff WHERE username = %s AND status = 'active'", (username,))
        staff = cursor.fetchone()
        
        if not staff:
            return {
                'token': None,
                'staff': None,
                'message': 'Username atau password salah'
            }
        
        if not staff.get('password_hash'):
            return {
                'token': None,
                'staff': None,
                'message': 'Password belum diatur'
            }
        
        if not bcrypt.checkpw(password.encode('utf-8'), staff['password_hash'].encode('utf-8')):
            return {
                'token': None,
                'staff': None,
                'message': 'Username atau password salah'
            }
        
        token = jwt.encode(
            {'username': staff['username'], 'role': staff['role'], 'exp': datetime.utcnow().timestamp() + 3600},
            JWT_SECRET,
            algorithm='HS256'
        )
        
        return {
            'token': token,
            'staff': {
                'id': str(staff['id']),
                'employeeId': staff['employee_id'],
                'username': staff['username'],
                'name': staff['name'],
                'email': staff.get('email'),
                'phone': staff.get('phone'),
                'role': staff['role'],
                'department': staff.get('department'),
                'status': staff['status'],
                'hireDate': staff['hire_date'].isoformat() if staff.get('hire_date') else None,
                'salary': float(staff['salary']) if staff.get('salary') else None
            },
            'message': 'Login berhasil'
        }
    except Exception as e:
        raise Exception(f"Error during login: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@mutation.field("addLoyaltyPoints")
def resolve_add_loyalty_points(_, info, customerId: str, points: float, orderId: Optional[str] = None, description: Optional[str] = None):
    """Add loyalty points"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Get or create loyalty record
        cursor.execute(
            "SELECT * FROM customer_loyalty WHERE customer_id = %s AND status = 'active' LIMIT 1",
            (customerId,)
        )
        loyalty = cursor.fetchone()
        
        if not loyalty:
            cursor.execute("""
                INSERT INTO customer_loyalty (customer_id, total_points, redeemed_points, tier, status)
                VALUES (%s, %s, 0, 'bronze', 'active')
            """, (customerId, points))
            loyalty_id = cursor.lastrowid
        else:
            loyalty_id = loyalty['id']
            cursor.execute("""
                UPDATE customer_loyalty 
                SET total_points = total_points + %s 
                WHERE id = %s
            """, (points, loyalty_id))
        
        # Create transaction
        cursor.execute("""
            INSERT INTO loyalty_transactions (customer_id, transaction_type, points, order_id, description)
            VALUES (%s, 'earned', %s, %s, %s)
        """, (customerId, points, orderId, description))
        
        conn.commit()
        
        cursor.execute("SELECT * FROM loyalty_transactions WHERE id = %s", (cursor.lastrowid,))
        transaction = cursor.fetchone()
        
        return {
            'id': str(transaction['id']),
            'transactionType': transaction['transaction_type'],
            'points': float(transaction['points']),
            'orderId': transaction.get('order_id'),
            'description': transaction.get('description'),
            'createdAt': transaction['created_at'].isoformat() if transaction.get('created_at') else ""
        }
    except Exception as e:
        conn.rollback()
        raise Exception(f"Error adding loyalty points: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@mutation.field("redeemLoyaltyPoints")
def resolve_redeem_loyalty_points(_, info, customerId: str, points: float, orderId: Optional[str] = None, description: Optional[str] = None):
    """Redeem loyalty points"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute(
            "SELECT * FROM customer_loyalty WHERE customer_id = %s AND status = 'active' LIMIT 1",
            (customerId,)
        )
        loyalty = cursor.fetchone()
        
        if not loyalty:
            raise Exception("Customer loyalty not found")
        
        available_points = float(loyalty['total_points']) - float(loyalty['redeemed_points'])
        if available_points < points:
            raise Exception(f"Insufficient points. Available: {available_points}, Requested: {points}")
        
        cursor.execute("""
            UPDATE customer_loyalty 
            SET redeemed_points = redeemed_points + %s 
            WHERE id = %s
        """, (points, loyalty['id']))
        
        cursor.execute("""
            INSERT INTO loyalty_transactions (customer_id, transaction_type, points, order_id, description)
            VALUES (%s, 'redeemed', %s, %s, %s)
        """, (customerId, points, orderId, description))
        
        conn.commit()
        
        cursor.execute("SELECT * FROM loyalty_transactions WHERE id = %s", (cursor.lastrowid,))
        transaction = cursor.fetchone()
        
        return {
            'id': str(transaction['id']),
            'transactionType': transaction['transaction_type'],
            'points': float(transaction['points']),
            'orderId': transaction.get('order_id'),
            'description': transaction.get('description'),
            'createdAt': transaction['created_at'].isoformat() if transaction.get('created_at') else ""
        }
    except Exception as e:
        conn.rollback()
        raise Exception(f"Error redeeming loyalty points: {str(e)}")
    finally:
        cursor.close()
        conn.close()

# Export resolvers
resolvers = [query, mutation, staff, customer, customer_loyalty, loyalty_transaction, auth_response]





