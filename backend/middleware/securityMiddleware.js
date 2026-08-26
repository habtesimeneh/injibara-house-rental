import jwt from 'jsonwebtoken';
import { getPool } from '../../database/db.js';

export const securityAuditLog = async (req, action, details = {}) => {
  try {
    const pool = getPool();
    const userId = req.user?.id || null;
    const userRole = req.user?.role || null;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';
    const requestId = req.id || null;

    await pool.query(
      `INSERT INTO security_audit_logs (user_id, user_role, action, ip_address, user_agent, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        userId,
        userRole,
        action,
        ip,
        userAgent,
        JSON.stringify({ ...details, requestId })
      ]
    );
  } catch (error) {
    console.error('Security audit log failed:', error);
  }
};

export const loginAttemptTracker = async (email, ip, success = false) => {
  try {
    const pool = getPool();
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (success) {
      await pool.query(
        'DELETE FROM login_attempts WHERE email = ? OR ip_address = ?',
        [normalizedEmail, ip]
      );
      return;
    }

    const [existing] = await pool.query(
      'SELECT * FROM login_attempts WHERE email = ? OR ip_address = ? ORDER BY created_at DESC LIMIT 1',
      [normalizedEmail, ip]
    );

    const now = new Date();
    let attemptCount = 1;
    let lockedUntil = null;

    if (existing.length > 0) {
      const lastAttempt = existing[0];
      const lastTime = new Date(lastAttempt.created_at);
      const minutesSinceLastAttempt = (now - lastTime) / (1000 * 60);

      if (lastAttempt.locked_until && new Date(lastAttempt.locked_until) > now) {
        return { locked: true, lockedUntil: lastAttempt.locked_until };
      }

      if (minutesSinceLastAttempt < 15) {
        attemptCount = (lastAttempt.attempt_count || 0) + 1;
      }

      if (attemptCount >= 5) {
        const lockoutMinutes = Math.min(30, (attemptCount - 4) * 5);
        lockedUntil = new Date(now.getTime() + lockoutMinutes * 60 * 1000);
      }
    }

    await pool.query(
      `INSERT INTO login_attempts (email, ip_address, attempt_count, locked_until, created_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE attempt_count = ?, locked_until = ?`,
      [normalizedEmail, ip, attemptCount, lockedUntil, attemptCount, lockedUntil]
    );

    if (lockedUntil) {
      return { locked: true, lockedUntil };
    }

    return { locked: false, attemptCount };
  } catch (error) {
    console.error('Login attempt tracker failed:', error);
    return { locked: false, attemptCount: 0 };
  }
};

export const checkLoginLockout = async (email, ip) => {
  try {
    const pool = getPool();
    const normalizedEmail = String(email || '').trim().toLowerCase();

    const [attempts] = await pool.query(
      `SELECT * FROM login_attempts 
       WHERE (email = ? OR ip_address = ?) AND locked_until > CURRENT_TIMESTAMP
       ORDER BY locked_until DESC LIMIT 1`,
      [normalizedEmail, ip]
    );

    if (attempts && attempts.length > 0) {
      return {
        locked: true,
        lockedUntil: attempts[0].locked_until,
        attemptCount: attempts[0].attempt_count
      };
    }

    return { locked: false };
  } catch (error) {
    console.error('Login lockout check failed:', error);
    return { locked: false };
  }
};

export const getAdminUserIds = async () => {
  try {
    const pool = getPool();
    const [admins] = await pool.query(
      `SELECT user_id FROM users WHERE LOWER(TRIM(role)) = 'admin' LIMIT 10`
    );
    return admins.map(a => Number(a.user_id));
  } catch (error) {
    console.error('Failed to fetch admin user IDs:', error);
    return [];
  }
};
