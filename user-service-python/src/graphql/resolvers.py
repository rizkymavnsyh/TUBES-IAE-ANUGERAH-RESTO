from typing import Optional, Dict, Any
import bcrypt
import jwt
import hashlib
import secrets
from datetime import datetime, timedelta
from ariadne import QueryType, MutationType, ObjectType
from src.database.connection import get_db_connection
from src.auth import require_auth, require_min_role

JWT_SECRET = "your-secret-key-change-in-production"
REFRESH_TOKEN_SECRET = "refresh-secret-key-change-in-production"
ACCESS_TOKEN_EXPIRY_HOURS = 7  # 7 hours like Apollo JS
REFRESH_TOKEN_EXPIRY_DAYS = 7  # 7 days like Apollo JS

query = QueryType()
mutation = MutationType()
staff = ObjectType("Staff")
customer = ObjectType("Customer")
customer_loyalty = ObjectType("CustomerLoyalty")
loyalty_transaction = ObjectType("LoyaltyTransaction")
auth_response = ObjectType("AuthResponse")
refresh_token_response = ObjectType("RefreshTokenResponse")
logout_response = ObjectType("LogoutResponse")

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
    """Create staff - requires admin role"""
    require_min_role(info.context, 'admin')
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
    """Delete staff by id - requires admin role"""
    require_min_role(info.context, 'admin')
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
    """Login staff using username or employeeId - with refresh token support"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Search by employee_id OR username
        cursor.execute(
            "SELECT * FROM staff WHERE (employee_id = %s OR username = %s)",
            (username, username)
        )
        staff_member = cursor.fetchone()
        
        if not staff_member:
            return {
                'token': None,
                'refreshToken': None,
                'expiresAt': None,
                'staff': None,
                'message': 'Invalid username or password'
            }
        
        if staff_member['status'] != 'active':
            return {
                'token': None,
                'refreshToken': None,
                'expiresAt': None,
                'staff': None,
                'message': 'Staff account is not active'
            }
        
        if not staff_member.get('password_hash'):
            return {
                'token': None,
                'refreshToken': None,
                'expiresAt': None,
                'staff': None,
                'message': 'Password not set for this account'
            }
        
        if not bcrypt.checkpw(password.encode('utf-8'), staff_member['password_hash'].encode('utf-8')):
            return {
                'token': None,
                'refreshToken': None,
                'expiresAt': None,
                'staff': None,
                'message': 'Invalid username or password'
            }
        
        # Generate access token (7h expiry)
        expires_at = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRY_HOURS)
        access_token = jwt.encode(
            {
                'employeeId': staff_member['employee_id'],
                'role': staff_member['role'],
                'id': staff_member['id'],
                'exp': expires_at.timestamp()
            },
            JWT_SECRET,
            algorithm='HS256'
        )
        
        # Generate refresh token (random 64 bytes hex)
        refresh_token = secrets.token_hex(64)
        
        # Hash refresh token for storage
        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        
        # Calculate refresh token expiry (7 days)
        refresh_expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRY_DAYS)
        
        # Store refresh token in database
        cursor.execute("""
            INSERT INTO refresh_tokens (staff_id, token_hash, expires_at, revoked)
            VALUES (%s, %s, %s, FALSE)
        """, (staff_member['id'], token_hash, refresh_expires_at))
        conn.commit()
        
        return {
            'token': access_token,
            'refreshToken': refresh_token,
            'expiresAt': expires_at.isoformat() + 'Z',
            'staff': {
                'id': str(staff_member['id']),
                'employeeId': staff_member['employee_id'],
                'username': staff_member.get('username', ''),
                'name': staff_member['name'],
                'email': staff_member.get('email'),
                'phone': staff_member.get('phone'),
                'role': staff_member['role'],
                'department': staff_member.get('department'),
                'status': staff_member['status'],
                'hireDate': staff_member['hire_date'].isoformat() if staff_member.get('hire_date') else None,
                'salary': float(staff_member['salary']) if staff_member.get('salary') else None
            },
            'message': 'Login successful'
        }
    except Exception as e:
        conn.rollback()
        raise Exception(f"Error during login: {str(e)}")
    finally:
        cursor.close()
        conn.close()


@mutation.field("refreshToken")
def resolve_refresh_token(_, info, refreshToken: str):
    """Refresh access token using refresh token"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Hash the provided refresh token
        token_hash = hashlib.sha256(refreshToken.encode()).hexdigest()
        
        # Find the refresh token in database
        cursor.execute("""
            SELECT rt.*, s.* FROM refresh_tokens rt
            JOIN staff s ON rt.staff_id = s.id
            WHERE rt.token_hash = %s AND rt.revoked = FALSE AND rt.expires_at > NOW()
        """, (token_hash,))
        result = cursor.fetchone()
        
        if not result:
            return {
                'token': None,
                'expiresAt': None,
                'message': 'Invalid or expired refresh token'
            }
        
        # Check if staff is still active
        if result['status'] != 'active':
            return {
                'token': None,
                'expiresAt': None,
                'message': 'Staff account is not active'
            }
        
        # Generate new access token (7h expiry)
        expires_at = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRY_HOURS)
        new_access_token = jwt.encode(
            {
                'employeeId': result['employee_id'],
                'role': result['role'],
                'id': result['staff_id'],
                'exp': expires_at.timestamp()
            },
            JWT_SECRET,
            algorithm='HS256'
        )
        
        return {
            'token': new_access_token,
            'expiresAt': expires_at.isoformat() + 'Z',
            'message': 'Token refreshed successfully'
        }
    except Exception as e:
        raise Exception(f"Error refreshing token: {str(e)}")
    finally:
        cursor.close()
        conn.close()


@mutation.field("logout")
def resolve_logout(_, info, refreshToken: str):
    """Logout by revoking refresh token"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Hash the provided refresh token
        token_hash = hashlib.sha256(refreshToken.encode()).hexdigest()
        
        # Revoke the refresh token
        cursor.execute("""
            UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = %s
        """, (token_hash,))
        conn.commit()
        
        if cursor.rowcount > 0:
            return {
                'success': True,
                'message': 'Logged out successfully'
            }
        else:
            return {
                'success': False,
                'message': 'Refresh token not found'
            }
    except Exception as e:
        conn.rollback()
        raise Exception(f"Error during logout: {str(e)}")
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
resolvers = [query, mutation, staff, customer, customer_loyalty, loyalty_transaction, auth_response, refresh_token_response, logout_response]





