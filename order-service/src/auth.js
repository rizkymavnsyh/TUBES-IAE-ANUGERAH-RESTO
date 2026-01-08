/**
 * Authentication utilities for Apollo JS Order Service
 * JWT token verification and role-based access control
 */
const jwt = require('jsonwebtoken');

// JWT Secret - should match User Service
<<<<<<< HEAD
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
=======
const JWT_SECRET = process.env.JWT_SECRET || 'rahasia-negara-api-key-2024';
>>>>>>> b32b6ea4f781ff57d97a961f7dbbc184adf40d73

// Role hierarchy for access control
const ROLE_HIERARCHY = {
    admin: 5,
    manager: 4,
    chef: 3,
    cashier: 2,
    waiter: 1,
};

/**
 * Extract user info from JWT token
 */
function getUserFromToken(token) {
    try {
        if (!token) return null;

        // Remove "Bearer " prefix if present
        if (token.startsWith('Bearer ')) {
            token = token.substring(7);
        }

        const payload = jwt.verify(token, JWT_SECRET);
        return {
            id: payload.id,
            employeeId: payload.employeeId,
            role: (payload.role || '').toLowerCase(),
        };
    } catch (error) {
        return null;
    }
}

/**
 * Get authentication context from request
 */
function getAuthContext(req) {
    const authHeader = req?.headers?.authorization || req?.headers?.Authorization;
    const user = getUserFromToken(authHeader);

    return {
        user,
        isAuthenticated: !!user,
        token: authHeader || null, // Include raw token for inter-service calls
    };
}

/**
 * Require authentication - throws error if not authenticated
 */
function requireAuth(context) {
    if (!context.isAuthenticated || !context.user) {
        throw new Error('Authentication required. Please provide a valid token in Authorization header.');
    }
    return context.user;
}

/**
 * Require specific roles - throws error if user doesn't have required role
 */
function requireRole(context, allowedRoles) {
    const user = requireAuth(context);
    const userRole = user.role.toLowerCase();

    if (!allowedRoles.map(r => r.toLowerCase()).includes(userRole)) {
        throw new Error(`Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${userRole}`);
    }

    return user;
}

/**
 * Require minimum role level - throws error if user's role is below minimum
 */
function requireMinRole(context, minRole) {
    const user = requireAuth(context);
    const userRole = user.role.toLowerCase();
    const minRoleLower = minRole.toLowerCase();

    const userLevel = ROLE_HIERARCHY[userRole] || 0;
    const requiredLevel = ROLE_HIERARCHY[minRoleLower] || 0;

    if (userLevel < requiredLevel) {
        throw new Error(`Access denied. Minimum required role: ${minRole}. Your role: ${userRole}`);
    }

    return user;
}

module.exports = {
    getUserFromToken,
    getAuthContext,
    requireAuth,
    requireRole,
    requireMinRole,
    ROLE_HIERARCHY,
};
