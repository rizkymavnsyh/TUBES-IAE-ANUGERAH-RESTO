"""
Authentication utilities for Order Service
JWT token verification and role-based access control
"""
import os
import jwt
from functools import wraps
from typing import Optional, List, Callable, Any

# JWT Secret - should match User Service
JWT_SECRET = os.getenv("JWT_SECRET", "supersecretkey123")

# Role hierarchy for access control
ROLE_HIERARCHY = {
    "admin": 5,
    "manager": 4,
    "chef": 3,
    "cashier": 2,
    "waiter": 1,
}

def get_user_from_token(token: str) -> Optional[dict]:
    """Extract user info from JWT token"""
    try:
        if not token:
            return None
        
        # Remove "Bearer " prefix if present
        if token.startswith("Bearer "):
            token = token[7:]
        
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return {
            "id": payload.get("id"),
            "employeeId": payload.get("employeeId"),
            "role": payload.get("role", "").lower(),
        }
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
    except Exception:
        return None

def get_auth_context(request) -> dict:
    """Extract authentication context from request headers"""
    auth_header = None
    
    # Try to get from different header formats
    if hasattr(request, 'headers'):
        auth_header = request.headers.get("Authorization") or request.headers.get("authorization")
    
    user = None
    if auth_header:
        user = get_user_from_token(auth_header)
    
    return {
        "user": user,
        "is_authenticated": user is not None,
    }

def require_auth(resolver_func: Callable) -> Callable:
    """Decorator to require authentication for a resolver"""
    @wraps(resolver_func)
    async def wrapper(obj, info, *args, **kwargs):
        context = info.context
        
        if not context.get("is_authenticated") or not context.get("user"):
            raise Exception("Authentication required. Please provide a valid token in Authorization header.")
        
        return await resolver_func(obj, info, *args, **kwargs)
    
    return wrapper

def require_role(allowed_roles: List[str]) -> Callable:
    """Decorator to require specific roles for a resolver"""
    def decorator(resolver_func: Callable) -> Callable:
        @wraps(resolver_func)
        async def wrapper(obj, info, *args, **kwargs):
            context = info.context
            
            if not context.get("is_authenticated") or not context.get("user"):
                raise Exception("Authentication required. Please provide a valid token in Authorization header.")
            
            user_role = context["user"].get("role", "").lower()
            
            # Check if user's role is in allowed roles
            if user_role not in [r.lower() for r in allowed_roles]:
                raise Exception(f"Access denied. Required roles: {', '.join(allowed_roles)}. Your role: {user_role}")
            
            return await resolver_func(obj, info, *args, **kwargs)
        
        return wrapper
    return decorator

def require_min_role(min_role: str) -> Callable:
    """Decorator to require minimum role level for a resolver"""
    def decorator(resolver_func: Callable) -> Callable:
        @wraps(resolver_func)
        async def wrapper(obj, info, *args, **kwargs):
            context = info.context
            
            if not context.get("is_authenticated") or not context.get("user"):
                raise Exception("Authentication required. Please provide a valid token in Authorization header.")
            
            user_role = context["user"].get("role", "").lower()
            min_role_lower = min_role.lower()
            
            user_level = ROLE_HIERARCHY.get(user_role, 0)
            required_level = ROLE_HIERARCHY.get(min_role_lower, 0)
            
            if user_level < required_level:
                raise Exception(f"Access denied. Minimum required role: {min_role}. Your role: {user_role}")
            
            return await resolver_func(obj, info, *args, **kwargs)
        
        return wrapper
    return decorator
