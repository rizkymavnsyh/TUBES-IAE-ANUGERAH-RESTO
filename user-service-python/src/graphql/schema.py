import strawberry
from typing import List, Optional
from enum import Enum
import bcrypt
import jwt
from datetime import datetime
from src.database.connection import get_db_connection

JWT_SECRET = "your-secret-key-change-in-production"

# Enums
@strawberry.enum
class StaffRole(Enum):
    MANAGER = "manager"
    CHEF = "chef"
    WAITER = "waiter"
    CASHIER = "cashier"
    ADMIN = "admin"

# Types
@strawberry.type
class Staff:
    id: str
    employee_id: str
    name: str
    email: Optional[str]
    phone: Optional[str]
    role: str
    department: Optional[str]
    status: str
    hire_date: Optional[str]
    salary: Optional[float]

@strawberry.type
class Customer:
    id: str
    customer_id: str
    name: str
    email: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    date_of_birth: Optional[str]
    registration_date: str
    status: str

@strawberry.type
class CustomerLoyalty:
    id: str
    total_points: float
    redeemed_points: float
    available_points: float
    tier: str
    join_date: str
    last_activity_date: Optional[str]
    status: str

@strawberry.type
class LoyaltyTransaction:
    id: str
    transaction_type: str
    points: float
    order_id: Optional[str]
    description: Optional[str]
    created_at: str

@strawberry.type
class AuthResponse:
    token: Optional[str]
    staff: Optional[Staff]
    message: str

# Inputs
@strawberry.input
class CreateStaffInput:
    employee_id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str
    department: Optional[str] = None
    password: Optional[str] = None
    hire_date: Optional[str] = None
    salary: Optional[float] = None

@strawberry.input
class CreateCustomerInput:
    customer_id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    date_of_birth: Optional[str] = None

# Query
@strawberry.type
class Query:
    @strawberry.field
    def customers(self, status: Optional[str] = None) -> List[Customer]:
        """Get all customers"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            query = "SELECT * FROM customers"
            params = []
            if status:
                query += " WHERE status = %s"
                params.append(status)
            query += " ORDER BY name"
            
            cursor.execute(query, params)
            customers_data = cursor.fetchall()
            
            return [
                Customer(
                    id=str(c['id']),
                    customer_id=c['customer_id'],
                    name=c['name'],
                    email=c.get('email'),
                    phone=c.get('phone'),
                    address=c.get('address'),
                    date_of_birth=c['date_of_birth'].isoformat() if c.get('date_of_birth') else None,
                    registration_date=c['registration_date'].isoformat() if c.get('registration_date') else "",
                    status=c['status']
                )
                for c in customers_data
            ]
        finally:
            cursor.close()
            conn.close()

    @strawberry.field
    def customer(self, id: str) -> Optional[Customer]:
        """Get customer by ID"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            cursor.execute("SELECT * FROM customers WHERE id = %s", (id,))
            c = cursor.fetchone()
            
            if not c:
                return None
            
            return Customer(
                id=str(c['id']),
                customer_id=c['customer_id'],
                name=c['name'],
                email=c.get('email'),
                phone=c.get('phone'),
                address=c.get('address'),
                date_of_birth=c['date_of_birth'].isoformat() if c.get('date_of_birth') else None,
                registration_date=c['registration_date'].isoformat() if c.get('registration_date') else "",
                status=c['status']
            )
        finally:
            cursor.close()
            conn.close()

    @strawberry.field
    def customer_loyalty(self, customer_id: str) -> Optional[CustomerLoyalty]:
        """Get customer loyalty"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            cursor.execute(
                "SELECT * FROM customer_loyalty WHERE customer_id = %s AND status = 'active' LIMIT 1",
                (customer_id,)
            )
            loyalty = cursor.fetchone()
            
            if not loyalty:
                return None
            
            total_points = float(loyalty['total_points'])
            redeemed_points = float(loyalty['redeemed_points'])
            
            return CustomerLoyalty(
                id=str(loyalty['id']),
                total_points=total_points,
                redeemed_points=redeemed_points,
                available_points=total_points - redeemed_points,
                tier=loyalty['tier'],
                join_date=loyalty['join_date'].isoformat() if loyalty.get('join_date') else "",
                last_activity_date=loyalty['last_activity_date'].isoformat() if loyalty.get('last_activity_date') else None,
                status=loyalty['status']
            )
        finally:
            cursor.close()
            conn.close()

# Mutation
@strawberry.type
class Mutation:
    @strawberry.mutation
    def create_customer(self, input: CreateCustomerInput) -> Customer:
        """Create customer"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            cursor.execute("""
                INSERT INTO customers (customer_id, name, email, phone, address, date_of_birth)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                input.customer_id, input.name, input.email, 
                input.phone, input.address, input.date_of_birth
            ))
            
            customer_id = cursor.lastrowid
            conn.commit()
            
            cursor.execute("SELECT * FROM customers WHERE id = %s", (customer_id,))
            c = cursor.fetchone()
            
            return Customer(
                id=str(c['id']),
                customer_id=c['customer_id'],
                name=c['name'],
                email=c.get('email'),
                phone=c.get('phone'),
                address=c.get('address'),
                date_of_birth=c['date_of_birth'].isoformat() if c.get('date_of_birth') else None,
                registration_date=c['registration_date'].isoformat() if c.get('registration_date') else "",
                status=c['status']
            )
        except Exception as e:
            conn.rollback()
            raise Exception(f"Error creating customer: {str(e)}")
        finally:
            cursor.close()
            conn.close()

    @strawberry.mutation
    async def earn_points(
        self, 
        customer_id: str, 
        points: float, 
        order_id: Optional[str] = None,
        description: Optional[str] = None
    ) -> LoyaltyTransaction:
        """Earn loyalty points"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # Get customer loyalty
            cursor.execute(
                "SELECT * FROM customer_loyalty WHERE customer_id = %s AND status = 'active' LIMIT 1",
                (customer_id,)
            )
            loyalty = cursor.fetchone()
            
            if not loyalty:
                raise Exception("Customer not enrolled in loyalty program")
            
            # Start transaction
            cursor.execute("START TRANSACTION")
            
            # Update total points
            cursor.execute("""
                UPDATE customer_loyalty 
                SET total_points = total_points + %s, last_activity_date = CURRENT_DATE 
                WHERE id = %s
            """, (points, loyalty['id']))
            
            # Update tier based on points
            new_total_points = float(loyalty['total_points']) + points
            new_tier = 'bronze'
            if new_total_points >= 1000:
                new_tier = 'platinum'
            elif new_total_points >= 500:
                new_tier = 'gold'
            elif new_total_points >= 250:
                new_tier = 'silver'
            
            cursor.execute(
                "UPDATE customer_loyalty SET tier = %s WHERE id = %s",
                (new_tier, loyalty['id'])
            )
            
            # Create transaction record
            cursor.execute("""
                INSERT INTO loyalty_transactions (customer_loyalty_id, transaction_type, points, order_id, description)
                VALUES (%s, 'earn', %s, %s, %s)
            """, (loyalty['id'], points, order_id, description))
            
            transaction_id = cursor.lastrowid
            conn.commit()
            
            cursor.execute("SELECT * FROM loyalty_transactions WHERE id = %s", (transaction_id,))
            t = cursor.fetchone()
            
            return LoyaltyTransaction(
                id=str(t['id']),
                transaction_type=t['transaction_type'],
                points=float(t['points']),
                order_id=t.get('order_id'),
                description=t.get('description'),
                created_at=t['created_at'].isoformat() if t.get('created_at') else ""
            )
        except Exception as e:
            conn.rollback()
            raise Exception(f"Error earning points: {str(e)}")
        finally:
            cursor.close()
            conn.close()

    @strawberry.mutation
    def login_staff(self, employee_id: str, password: str) -> AuthResponse:
        """Staff login"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            cursor.execute("SELECT * FROM staff WHERE employee_id = %s", (employee_id,))
            staff = cursor.fetchone()
            
            if not staff:
                return AuthResponse(
                    token=None,
                    staff=None,
                    message="Invalid employee ID or password"
                )
            
            if staff['status'] != 'active':
                return AuthResponse(
                    token=None,
                    staff=None,
                    message="Staff account is not active"
                )
            
            if not staff.get('password_hash'):
                return AuthResponse(
                    token=None,
                    staff=None,
                    message="Password not set for this account"
                )
            
            if not bcrypt.checkpw(password.encode('utf-8'), staff['password_hash'].encode('utf-8')):
                return AuthResponse(
                    token=None,
                    staff=None,
                    message="Invalid employee ID or password"
                )
            
            token = jwt.encode(
                {
                    "employeeId": staff['employee_id'],
                    "role": staff['role'],
                    "id": staff['id']
                },
                JWT_SECRET,
                algorithm="HS256"
            )
            
            return AuthResponse(
                token=token,
                staff=Staff(
                    id=str(staff['id']),
                    employee_id=staff['employee_id'],
                    name=staff['name'],
                    email=staff.get('email'),
                    phone=staff.get('phone'),
                    role=staff['role'],
                    department=staff.get('department'),
                    status=staff['status'],
                    hire_date=staff['hire_date'].isoformat() if staff.get('hire_date') else None,
                    salary=float(staff['salary']) if staff.get('salary') else None
                ),
                message="Login successful"
            )
        finally:
            cursor.close()
            conn.close()



