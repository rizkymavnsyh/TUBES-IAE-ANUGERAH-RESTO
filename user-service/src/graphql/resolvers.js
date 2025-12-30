const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { requireAuth, requireMinRole } = require('../auth');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh-secret-key-change-in-production';

// Token expiry times
const ACCESS_TOKEN_EXPIRY = '7h';  // Access token expires in 7 hours
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // Refresh token expires in 7 days (milliseconds)

const resolvers = {
  Query: {
    staff: async (parent, { employeeId, role, status }, { db }) => {
      try {
        let query = 'SELECT * FROM staff';
        const conditions = [];
        const params = [];

        if (employeeId) {
          conditions.push('employee_id = ?');
          params.push(employeeId);
        }

        if (role) {
          conditions.push('role = ?');
          params.push(role);
        }

        if (status) {
          conditions.push('status = ?');
          params.push(status);
        }

        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY name';

        const [staff] = await db.execute(query, params);
        return staff.map(s => ({
          ...s,
          id: s.id.toString(),
          employeeId: s.employee_id || `EMP${s.id.toString().padStart(3, '0')}`,
          salary: s.salary ? parseFloat(s.salary) : null
        }));
      } catch (error) {
        throw new Error(`Error fetching staff: ${error.message}`);
      }
    },

    staffById: async (parent, { id }, { db }) => {
      try {
        const [staff] = await db.execute('SELECT * FROM staff WHERE id = ?', [id]);
        if (staff.length === 0) {
          throw new Error('Staff not found');
        }
        return {
          ...staff[0],
          id: staff[0].id.toString(),
          salary: staff[0].salary ? parseFloat(staff[0].salary) : null
        };
      } catch (error) {
        throw new Error(`Error fetching staff: ${error.message}`);
      }
    },

    customers: async (parent, { status }, { db }) => {
      try {
        let query = 'SELECT * FROM customers';
        const params = [];

        if (status) {
          query += ' WHERE status = ?';
          params.push(status);
        }

        query += ' ORDER BY name';

        const [customers] = await db.execute(query, params);
        return customers.map(c => ({
          id: c.id.toString(),
          customerId: c.customer_id || `CUST${c.id.toString().padStart(3, '0')}`,
          name: c.name,
          email: c.email,
          phone: c.phone,
          address: c.address,
          registrationDate: c.registration_date ? c.registration_date.toISOString() : new Date().toISOString(),
          status: c.status || 'active'
        }));
      } catch (error) {
        throw new Error(`Error fetching customers: ${error.message}`);
      }
    },

    customer: async (parent, { id }, { db }) => {
      try {
        const [customers] = await db.execute('SELECT * FROM customers WHERE id = ?', [id]);
        if (customers.length === 0) {
          throw new Error('Customer not found');
        }
        return {
          ...customers[0],
          id: customers[0].id.toString()
        };
      } catch (error) {
        throw new Error(`Error fetching customer: ${error.message}`);
      }
    },

    customerByCustomerId: async (parent, { customerId }, { db }) => {
      try {
        const [customers] = await db.execute('SELECT * FROM customers WHERE customer_id = ?', [customerId]);
        if (customers.length === 0) {
          return null;
        }
        return {
          ...customers[0],
          id: customers[0].id.toString()
        };
      } catch (error) {
        throw new Error(`Error fetching customer: ${error.message}`);
      }
    },

    loyaltyPrograms: async (parent, { status }, { db }) => {
      try {
        let query = 'SELECT * FROM loyalty_programs';
        const params = [];

        if (status) {
          query += ' WHERE status = ?';
          params.push(status);
        }

        query += ' ORDER BY name';

        const [programs] = await db.execute(query, params);
        return programs.map(p => ({
          ...p,
          id: p.id.toString(),
          pointsPerRupiah: parseFloat(p.points_per_rupiah),
          minPointsToRedeem: p.min_points_to_redeem
        }));
      } catch (error) {
        throw new Error(`Error fetching loyalty programs: ${error.message}`);
      }
    },

    customerLoyalty: async (parent, { customerId }, { db }) => {
      try {
        const [loyalties] = await db.execute(
          'SELECT * FROM customer_loyalty WHERE customer_id = ? AND status = "active" LIMIT 1',
          [customerId]
        );
        if (loyalties.length === 0) {
          return null;
        }
        const loyalty = loyalties[0];
        return {
          ...loyalty,
          id: loyalty.id.toString(),
          totalPoints: parseFloat(loyalty.total_points),
          redeemedPoints: parseFloat(loyalty.redeemed_points),
          availablePoints: parseFloat(loyalty.total_points) - parseFloat(loyalty.redeemed_points)
        };
      } catch (error) {
        throw new Error(`Error fetching customer loyalty: ${error.message}`);
      }
    },

    topCustomersByPoints: async (parent, { limit = 10 }, { db }) => {
      try {
        const [loyalties] = await db.execute(
          `SELECT * FROM customer_loyalty 
           WHERE status = 'active' 
           ORDER BY total_points DESC 
           LIMIT ?`,
          [limit]
        );
        return loyalties.map(l => ({
          ...l,
          id: l.id.toString(),
          totalPoints: parseFloat(l.total_points),
          redeemedPoints: parseFloat(l.redeemed_points),
          availablePoints: parseFloat(l.total_points) - parseFloat(l.redeemed_points)
        }));
      } catch (error) {
        throw new Error(`Error fetching top customers: ${error.message}`);
      }
    }
  },

  Mutation: {
    createStaff: async (parent, { input }, { db }) => {
      try {
        const { employeeId, name, email, phone, role, department, password, hireDate, salary } = input;

        // Generate unique employee_id if not provided
        let finalEmployeeId = employeeId;
        if (!finalEmployeeId) {
          const timestamp = Date.now().toString().slice(-6);
          finalEmployeeId = `EMP${timestamp}`;
        }

        // Generate username from employeeId or name
        const username = email ? email.split('@')[0] : finalEmployeeId.toLowerCase();

        let passwordHash = null;
        if (password) {
          passwordHash = await bcrypt.hash(password, 10);
        }

        const [result] = await db.execute(
          `INSERT INTO staff (employee_id, username, name, email, phone, role, department, password_hash, hire_date, salary)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            finalEmployeeId,
            username,
            name || 'Unnamed Staff',
            email || null,
            phone || null,
            role || 'waiter',
            department || null,
            passwordHash,
            hireDate || null,
            salary || null
          ]
        );

        const [staff] = await db.execute('SELECT * FROM staff WHERE id = ?', [result.insertId]);
        const s = staff[0];
        return {
          id: s.id.toString(),
          employeeId: s.employee_id,
          username: s.username,
          name: s.name,
          email: s.email,
          phone: s.phone,
          role: s.role,
          department: s.department,
          status: s.status,
          hireDate: s.hire_date ? s.hire_date.toISOString().split('T')[0] : null,
          salary: s.salary,
          createdAt: s.created_at ? s.created_at.toISOString() : new Date().toISOString(),
          updatedAt: s.updated_at ? s.updated_at.toISOString() : new Date().toISOString()
        };
      } catch (error) {
        throw new Error(`Error creating staff: ${error.message}`);
      }
    },

    updateStaff: async (parent, { id, input }, { db }) => {
      try {
        const { name, email, phone, role, department, status, salary } = input;

        const updates = [];
        const params = [];

        if (name !== undefined) { updates.push('name = ?'); params.push(name); }
        if (email !== undefined) { updates.push('email = ?'); params.push(email); }
        if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
        if (role !== undefined) { updates.push('role = ?'); params.push(role); }
        if (department !== undefined) { updates.push('department = ?'); params.push(department); }
        if (status !== undefined) { updates.push('status = ?'); params.push(status); }
        if (salary !== undefined) { updates.push('salary = ?'); params.push(salary); }

        if (updates.length > 0) {
          params.push(id);
          await db.execute(
            `UPDATE staff SET ${updates.join(', ')} WHERE id = ?`,
            params
          );
        }

        const [rows] = await db.execute('SELECT * FROM staff WHERE id = ?', [id]);
        if (rows.length === 0) {
          throw new Error('Staff not found');
        }
        const s = rows[0];
        return {
          id: s.id.toString(),
          employeeId: s.employee_id,
          username: s.username,
          name: s.name,
          email: s.email,
          phone: s.phone,
          role: s.role,
          department: s.department,
          status: s.status,
          hireDate: s.hire_date ? s.hire_date.toISOString().split('T')[0] : null,
          salary: s.salary,
          createdAt: s.created_at ? s.created_at.toISOString() : new Date().toISOString(),
          updatedAt: s.updated_at ? s.updated_at.toISOString() : new Date().toISOString()
        };
      } catch (error) {
        throw new Error(`Error updating staff: ${error.message}`);
      }
    },

    deleteStaff: async (parent, { id }, { db }) => {
      try {
        const [result] = await db.execute('DELETE FROM staff WHERE id = ?', [id]);
        return result.affectedRows > 0;
      } catch (error) {
        throw new Error(`Error deleting staff: ${error.message}`);
      }
    },

    createCustomer: async (parent, { input }, { db }) => {
      try {
        const { customerId, name, email, phone, address, dateOfBirth } = input;

        const [result] = await db.execute(
          `INSERT INTO customers (customer_id, name, email, phone, address, date_of_birth)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [customerId, name, email, phone, address, dateOfBirth]
        );

        const [customers] = await db.execute('SELECT * FROM customers WHERE id = ?', [result.insertId]);
        const c = customers[0];
        return {
          id: c.id.toString(),
          customerId: c.customer_id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          address: c.address,
          registrationDate: c.registration_date ? c.registration_date.toISOString() : new Date().toISOString(),
          status: c.status || 'active'
        };
      } catch (error) {
        throw new Error(`Error creating customer: ${error.message}`);
      }
    },

    updateCustomer: async (parent, { id, input }, { db }) => {
      try {
        const { name, email, phone, address, status } = input;

        const updates = [];
        const params = [];

        if (name !== undefined) { updates.push('name = ?'); params.push(name); }
        if (email !== undefined) { updates.push('email = ?'); params.push(email); }
        if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
        if (address !== undefined) { updates.push('address = ?'); params.push(address); }
        if (status !== undefined) { updates.push('status = ?'); params.push(status); }

        if (updates.length > 0) {
          params.push(id);
          await db.execute(
            `UPDATE customers SET ${updates.join(', ')} WHERE id = ?`,
            params
          );
        }

        const [rows] = await db.execute('SELECT * FROM customers WHERE id = ?', [id]);
        if (rows.length === 0) {
          throw new Error('Customer not found');
        }
        const c = rows[0];
        return {
          id: c.id.toString(),
          customerId: c.customer_id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          address: c.address,
          registrationDate: c.registration_date ? c.registration_date.toISOString() : new Date().toISOString(),
          status: c.status || 'active'
        };
      } catch (error) {
        throw new Error(`Error updating customer: ${error.message}`);
      }
    },

    deleteCustomer: async (parent, { id }, { db }) => {
      try {
        const [result] = await db.execute('DELETE FROM customers WHERE id = ?', [id]);
        return result.affectedRows > 0;
      } catch (error) {
        throw new Error(`Error deleting customer: ${error.message}`);
      }
    },

    enrollCustomerInLoyalty: async (parent, { customerId, loyaltyProgramId }, { db }) => {
      try {
        // Check if already enrolled
        const [existing] = await db.execute(
          'SELECT id FROM customer_loyalty WHERE customer_id = ? AND loyalty_program_id = ?',
          [customerId, loyaltyProgramId]
        );

        if (existing.length > 0) {
          throw new Error('Customer already enrolled in this loyalty program');
        }

        const [result] = await db.execute(
          `INSERT INTO customer_loyalty (customer_id, loyalty_program_id, total_points, tier)
           VALUES (?, ?, 0, 'bronze')`,
          [customerId, loyaltyProgramId]
        );

        const [loyalties] = await db.execute('SELECT * FROM customer_loyalty WHERE id = ?', [result.insertId]);
        const loyalty = loyalties[0];
        return {
          ...loyalty,
          id: loyalty.id.toString(),
          totalPoints: parseFloat(loyalty.total_points),
          redeemedPoints: parseFloat(loyalty.redeemed_points),
          availablePoints: parseFloat(loyalty.total_points) - parseFloat(loyalty.redeemed_points)
        };
      } catch (error) {
        throw new Error(`Error enrolling customer: ${error.message}`);
      }
    },

    earnPoints: async (parent, { customerId, points, orderId, description }, { db }) => {
      try {
        // Get customer loyalty
        const [loyalties] = await db.execute(
          'SELECT * FROM customer_loyalty WHERE customer_id = ? AND status = "active" LIMIT 1',
          [customerId]
        );

        if (loyalties.length === 0) {
          throw new Error('Customer not enrolled in loyalty program');
        }

        const loyalty = loyalties[0];

        // Start transaction
        await db.execute('START TRANSACTION');

        // Update total points
        await db.execute(
          'UPDATE customer_loyalty SET total_points = total_points + ?, last_activity_date = CURRENT_DATE WHERE id = ?',
          [points, loyalty.id]
        );

        // Create transaction record
        const [result] = await db.execute(
          `INSERT INTO loyalty_transactions (customer_loyalty_id, transaction_type, points, order_id, description)
           VALUES (?, 'earn', ?, ?, ?)`,
          [loyalty.id, points, orderId, description]
        );

        // Update tier based on points
        const newTotalPoints = parseFloat(loyalty.total_points) + points;
        let newTier = 'bronze';
        if (newTotalPoints >= 1000) {
          newTier = 'platinum';
        } else if (newTotalPoints >= 500) {
          newTier = 'gold';
        } else if (newTotalPoints >= 250) {
          newTier = 'silver';
        }

        await db.execute(
          'UPDATE customer_loyalty SET tier = ? WHERE id = ?',
          [newTier, loyalty.id]
        );

        await db.execute('COMMIT');

        const [transactions] = await db.execute('SELECT * FROM loyalty_transactions WHERE id = ?', [result.insertId]);
        return {
          ...transactions[0],
          id: transactions[0].id.toString(),
          points: parseFloat(transactions[0].points)
        };
      } catch (error) {
        await db.execute('ROLLBACK');
        throw new Error(`Error earning points: ${error.message}`);
      }
    },

    redeemPoints: async (parent, { customerId, points, description }, { db }) => {
      try {
        // Get customer loyalty
        const [loyalties] = await db.execute(
          'SELECT * FROM customer_loyalty WHERE customer_id = ? AND status = "active" LIMIT 1',
          [customerId]
        );

        if (loyalties.length === 0) {
          throw new Error('Customer not enrolled in loyalty program');
        }

        const loyalty = loyalties[0];
        const availablePoints = parseFloat(loyalty.total_points) - parseFloat(loyalty.redeemed_points);

        if (availablePoints < points) {
          throw new Error(`Insufficient points. Available: ${availablePoints}, Requested: ${points}`);
        }

        // Start transaction
        await db.execute('START TRANSACTION');

        // Update redeemed points
        await db.execute(
          'UPDATE customer_loyalty SET redeemed_points = redeemed_points + ?, last_activity_date = CURRENT_DATE WHERE id = ?',
          [points, loyalty.id]
        );

        // Create transaction record
        const [result] = await db.execute(
          `INSERT INTO loyalty_transactions (customer_loyalty_id, transaction_type, points, description)
           VALUES (?, 'redeem', ?, ?)`,
          [loyalty.id, points, description]
        );

        await db.execute('COMMIT');

        const [transactions] = await db.execute('SELECT * FROM loyalty_transactions WHERE id = ?', [result.insertId]);
        return {
          ...transactions[0],
          id: transactions[0].id.toString(),
          points: parseFloat(transactions[0].points)
        };
      } catch (error) {
        await db.execute('ROLLBACK');
        throw new Error(`Error redeeming points: ${error.message}`);
      }
    },

    loginStaff: async (parent, { username, password }, { db }) => {
      try {
        // Try to find by employee_id OR username
        const [staff] = await db.execute(
          'SELECT * FROM staff WHERE employee_id = ? OR username = ?',
          [username, username]
        );
        if (staff.length === 0) {
          return {
            token: null,
            refreshToken: null,
            expiresAt: null,
            staff: null,
            message: 'Invalid username or password'
          };
        }

        const staffMember = staff[0];

        if (staffMember.status !== 'active') {
          return {
            token: null,
            refreshToken: null,
            expiresAt: null,
            staff: null,
            message: 'Staff account is not active'
          };
        }

        if (!staffMember.password_hash) {
          return {
            token: null,
            refreshToken: null,
            expiresAt: null,
            staff: null,
            message: 'Password not set for this account'
          };
        }

        const isValid = await bcrypt.compare(password, staffMember.password_hash);
        if (!isValid) {
          return {
            token: null,
            refreshToken: null,
            expiresAt: null,
            staff: null,
            message: 'Invalid employee ID or password'
          };
        }

        // Generate access token (7 hours)
        const accessTokenPayload = {
          employeeId: staffMember.employee_id,
          role: staffMember.role,
          id: staffMember.id
        };
        const token = jwt.sign(accessTokenPayload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });

        // Calculate expiry time for access token
        const expiresAt = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(); // 7 hours from now

        // Generate refresh token (7 days)
        const refreshTokenValue = crypto.randomBytes(64).toString('hex');
        const refreshTokenHash = crypto.createHash('sha256').update(refreshTokenValue).digest('hex');
        const refreshTokenExpiry = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

        // Store refresh token in database
        await db.execute(
          'INSERT INTO refresh_tokens (staff_id, token_hash, expires_at) VALUES (?, ?, ?)',
          [staffMember.id, refreshTokenHash, refreshTokenExpiry]
        );

        return {
          token,
          refreshToken: refreshTokenValue,
          expiresAt,
          staff: {
            id: staffMember.id.toString(),
            employeeId: staffMember.employee_id,
            username: staffMember.username,
            name: staffMember.name,
            email: staffMember.email,
            phone: staffMember.phone,
            role: staffMember.role,
            department: staffMember.department,
            status: staffMember.status,
            hireDate: staffMember.hire_date,
            salary: staffMember.salary ? parseFloat(staffMember.salary) : null,
            createdAt: staffMember.created_at,
            updatedAt: staffMember.updated_at
          },
          message: 'Login successful'
        };
      } catch (error) {
        throw new Error(`Error during login: ${error.message}`);
      }
    },

    refreshToken: async (parent, { refreshToken: refreshTokenValue }, { db }) => {
      try {
        // Hash the provided refresh token
        const refreshTokenHash = crypto.createHash('sha256').update(refreshTokenValue).digest('hex');

        // Find the refresh token in database
        const [tokens] = await db.execute(
          `SELECT rt.*, s.employee_id, s.role, s.status as staff_status 
           FROM refresh_tokens rt 
           JOIN staff s ON rt.staff_id = s.id 
           WHERE rt.token_hash = ? AND rt.revoked = FALSE AND rt.expires_at > NOW()`,
          [refreshTokenHash]
        );

        if (tokens.length === 0) {
          return {
            token: null,
            expiresAt: null,
            message: 'Invalid or expired refresh token'
          };
        }

        const tokenRecord = tokens[0];

        // Check if staff is still active
        if (tokenRecord.staff_status !== 'active') {
          // Revoke the token
          await db.execute('UPDATE refresh_tokens SET revoked = TRUE WHERE id = ?', [tokenRecord.id]);
          return {
            token: null,
            expiresAt: null,
            message: 'Staff account is no longer active'
          };
        }

        // Generate new access token
        const accessTokenPayload = {
          employeeId: tokenRecord.employee_id,
          role: tokenRecord.role,
          id: tokenRecord.staff_id
        };
        const newToken = jwt.sign(accessTokenPayload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
        const expiresAt = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(); // 7 hours from now

        return {
          token: newToken,
          expiresAt,
          message: 'Token refreshed successfully'
        };
      } catch (error) {
        throw new Error(`Error refreshing token: ${error.message}`);
      }
    },

    logout: async (parent, { refreshToken: refreshTokenValue }, { db }) => {
      try {
        // Hash the provided refresh token
        const refreshTokenHash = crypto.createHash('sha256').update(refreshTokenValue).digest('hex');

        // Revoke the refresh token
        const [result] = await db.execute(
          'UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = ?',
          [refreshTokenHash]
        );

        if (result.affectedRows === 0) {
          return {
            success: false,
            message: 'Refresh token not found'
          };
        }

        return {
          success: true,
          message: 'Logged out successfully'
        };
      } catch (error) {
        throw new Error(`Error during logout: ${error.message}`);
      }
    }
  },

  Customer: {
    loyalty: async (parent, args, { db }) => {
      try {
        const [loyalties] = await db.execute(
          'SELECT * FROM customer_loyalty WHERE customer_id = ? AND status = "active" LIMIT 1',
          [parent.id]
        );
        if (loyalties.length === 0) {
          return null;
        }
        const loyalty = loyalties[0];
        return {
          ...loyalty,
          id: loyalty.id.toString(),
          totalPoints: parseFloat(loyalty.total_points),
          redeemedPoints: parseFloat(loyalty.redeemed_points),
          availablePoints: parseFloat(loyalty.total_points) - parseFloat(loyalty.redeemed_points)
        };
      } catch (error) {
        return null;
      }
    }
  },

  CustomerLoyalty: {
    customer: async (parent, args, { db }) => {
      try {
        const [customers] = await db.execute('SELECT * FROM customers WHERE id = ?', [parent.customer_id]);
        if (customers.length === 0) return null;
        return {
          ...customers[0],
          id: customers[0].id.toString()
        };
      } catch (error) {
        return null;
      }
    },
    loyaltyProgram: async (parent, args, { db }) => {
      try {
        const [programs] = await db.execute('SELECT * FROM loyalty_programs WHERE id = ?', [parent.loyalty_program_id]);
        if (programs.length === 0) return null;
        return {
          ...programs[0],
          id: programs[0].id.toString(),
          pointsPerRupiah: parseFloat(programs[0].points_per_rupiah),
          minPointsToRedeem: programs[0].min_points_to_redeem
        };
      } catch (error) {
        return null;
      }
    },
    transactions: async (parent, args, { db }) => {
      try {
        const [transactions] = await db.execute(
          'SELECT * FROM loyalty_transactions WHERE customer_loyalty_id = ? ORDER BY created_at DESC LIMIT 50',
          [parent.id]
        );
        return transactions.map(t => ({
          ...t,
          id: t.id.toString(),
          points: parseFloat(t.points)
        }));
      } catch (error) {
        return [];
      }
    }
  },

  LoyaltyTransaction: {
    customerLoyalty: async (parent, args, { db }) => {
      try {
        const [loyalties] = await db.execute('SELECT * FROM customer_loyalty WHERE id = ?', [parent.customer_loyalty_id]);
        if (loyalties.length === 0) return null;
        const loyalty = loyalties[0];
        return {
          ...loyalty,
          id: loyalty.id.toString(),
          totalPoints: parseFloat(loyalty.total_points),
          redeemedPoints: parseFloat(loyalty.redeemed_points),
          availablePoints: parseFloat(loyalty.total_points) - parseFloat(loyalty.redeemed_points)
        };
      } catch (error) {
        return null;
      }
    }
  }
};

module.exports = resolvers;








