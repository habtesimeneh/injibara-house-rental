import express from 'express';
import { getPool } from '../../database/db.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { reminderCreateLimiter, reminderNotifyLimiter, reminderMarkPaidLimiter } from '../middleware/rateLimiter.js';
import { securityAuditLog } from '../middleware/securityMiddleware.js';

const router = express.Router();

const toPositiveId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const isAdmin = (req) => String(req.user?.role || '').trim().toLowerCase() === 'admin';
const isLandlord = (req) => String(req.user?.role || '').trim().toLowerCase() === 'landlord';

const reminderRelationshipSelect = `
  SELECT r.reminder_id, r.house_id, r.tenant_id, r.landlord_id, r.due_day_of_month,
         h.owner_id AS house_owner_id, h.title AS house_title
  FROM rent_reminders r
  JOIN houses h ON r.house_id = h.house_id
  JOIN users t ON r.tenant_id = t.user_id
  JOIN users l ON r.landlord_id = l.user_id
  WHERE r.reminder_id = ?
    AND h.owner_id = r.landlord_id
    AND EXISTS (
      SELECT 1 FROM rental_contracts c
      WHERE c.house_id = r.house_id
        AND c.tenant_id = r.tenant_id
        AND c.landlord_id = r.landlord_id
        AND c.status = 'Active'
    )
`;

const getReminderRelationship = async (pool, reminderId) => {
  const [reminders] = await pool.query(reminderRelationshipSelect, [reminderId]);
  return reminders?.[0] || null;
};

const canAccessReminder = (req, reminder) => {
  if (isAdmin(req)) return true;
  if (isLandlord(req)) return Number(reminder.house_owner_id) === Number(req.user.id);
  return Number(reminder.tenant_id) === Number(req.user.id);
};

router.get('/', protect, authorize('Tenant', 'Landlord', 'Admin'), async (req, res) => {
  try {
    const pool = getPool();
    let accessClause = '';
    let params = [];

    if (!isAdmin(req)) {
      if (isLandlord(req)) {
        accessClause = ' AND h.owner_id = ?';
      } else {
        accessClause = ' AND r.tenant_id = ?';
      }
      params = [req.user.id];
    }

    let limit = null;
    if (req.query.limit !== undefined) {
      const parsed = Number(req.query.limit);
      limit = Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, 200) : null;
    }
    let offset = 0;
    if (req.query.offset !== undefined) {
      const parsed = Number(req.query.offset);
      offset = Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
    }
    let query = `SELECT r.reminder_id, r.house_id, r.tenant_id, r.landlord_id, r.monthly_rent, r.due_day_of_month, r.status, r.last_paid_month, r.created_at,
              h.title AS house_title, h.city AS house_city, h.address AS house_address,
              t.name AS tenant_name, l.name AS landlord_name
       FROM rent_reminders r
       JOIN houses h ON r.house_id = h.house_id
       JOIN users t ON r.tenant_id = t.user_id
       JOIN users l ON r.landlord_id = l.user_id
       WHERE h.owner_id = r.landlord_id
         AND EXISTS (
           SELECT 1 FROM rental_contracts c
           WHERE c.house_id = r.house_id
             AND c.tenant_id = r.tenant_id
             AND c.landlord_id = r.landlord_id
             AND c.status = 'Active'
         )${accessClause}
       ORDER BY r.due_day_of_month ASC`;
    const queryParams = [...params];
    if (limit) {
      query += ' LIMIT ? OFFSET ?';
      queryParams.push(limit, offset);
    }
    const [reminders] = await pool.query(query, queryParams);

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();
    const formattedReminders = (reminders || []).map((rem) => {
      const dueDay = Math.min(Math.max(Number(rem.due_day_of_month || 1), 1), 28);
      let dueDateObj = new Date(currentYear, currentMonth, dueDay);
      if (currentDay > dueDay && rem.last_paid_month === `${currentYear}-${currentMonth + 1}`) {
        dueDateObj = new Date(currentYear, currentMonth + 1, dueDay);
      }

      const daysRemaining = Math.ceil((dueDateObj.getTime() - today.getTime()) / (1000 * 3600 * 24));
      const calculatedStatus = rem.last_paid_month === `${currentYear}-${currentMonth + 1}`
        ? 'Paid'
        : daysRemaining < 0
          ? 'Overdue'
          : daysRemaining <= 5
            ? 'Due Soon'
            : 'Upcoming';

      return { ...rem, days_remaining: daysRemaining, next_due_date: dueDateObj.toISOString().split('T')[0], calculated_status: calculatedStatus };
    });

    res.json(formattedReminders);
  } catch (error) {
    console.error('Error fetching rent reminders:', error);
    res.status(500).json({ error: 'Failed to fetch rent due date reminders' });
  }
});

router.post('/', protect, authorize('Landlord', 'Admin'), reminderCreateLimiter, async (req, res) => {
  try {
    const houseId = toPositiveId(req.body.house_id);
    const tenantId = toPositiveId(req.body.tenant_id);
    const dueDay = Number(req.body.due_day_of_month);

    if (!houseId || !tenantId || !Number.isInteger(dueDay) || dueDay < 1 || dueDay > 28) {
      return res.status(400).json({ error: 'A valid house, tenant, and due day are required' });
    }

    const pool = getPool();
    const [houses] = await pool.query('SELECT house_id, owner_id FROM houses WHERE house_id = ? LIMIT 1', [houseId]);
    const house = houses?.[0];
    if (!house) return res.status(404).json({ error: 'Selected property not found' });

    const landlordId = Number(house.owner_id);
    if (!isAdmin(req) && landlordId !== Number(req.user.id)) {
      return res.status(404).json({ error: 'Selected property not found' });
    }

    const [contracts] = await pool.query(
      `SELECT contract_id, monthly_rent
       FROM rental_contracts
       WHERE house_id = ? AND tenant_id = ? AND landlord_id = ? AND status = 'Active'
       ORDER BY created_at DESC LIMIT 1`,
      [houseId, tenantId, landlordId]
    );
    const contract = contracts?.[0];
    if (!contract) {
      return res.status(409).json({ error: 'An active contract for this property and tenant is required' });
    }

    const [result] = await pool.query(
      `INSERT INTO rent_reminders (house_id, tenant_id, landlord_id, monthly_rent, due_day_of_month, status)
       VALUES (?, ?, ?, ?, ?, 'Pending')`,
      [houseId, tenantId, landlordId, Number(contract.monthly_rent), dueDay]
    );

    try {
      await securityAuditLog(req, 'REMINDER_CREATED', {
        reminderId: result.insertId,
        houseId,
        tenantId
      });
    } catch (auditError) {
      console.error('Security audit log failed:', auditError);
    }

    res.status(201).json({ message: 'Rent reminder created successfully', id: result.insertId });
  } catch (error) {
    console.error('Create rent reminder error:', error);
    res.status(500).json({ error: 'Failed to create rent reminder' });
  }
});

router.post('/:id/notify', protect, authorize('Landlord', 'Admin'), reminderNotifyLimiter, async (req, res) => {
  try {
    const reminderId = toPositiveId(req.params.id);
    if (!reminderId) return res.status(400).json({ error: 'Invalid rent reminder ID' });

    const pool = getPool();
    const reminder = await getReminderRelationship(pool, reminderId);
    if (!reminder || (!isAdmin(req) && Number(reminder.house_owner_id) !== Number(req.user.id))) {
      return res.status(404).json({ error: 'Rent reminder record not found' });
    }

    await pool.query(
      'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
      [reminder.tenant_id, 'Rent Due Date Reminder', `Your monthly rent for ${reminder.house_title} is due on day ${reminder.due_day_of_month} of this month.`]
    );

    try {
      await securityAuditLog(req, 'REMINDER_NOTIFICATION_SENT', {
        reminderId: reminder.reminder_id,
        houseId: reminder.house_id,
        tenantId: reminder.tenant_id
      });
    } catch (auditError) {
      console.error('Security audit log failed:', auditError);
    }

    res.json({ message: 'Rent reminder notification sent successfully' });
  } catch (error) {
    console.error('Notify rent error:', error);
    res.status(500).json({ error: 'Failed to send rent reminder notification' });
  }
});

router.put('/:id/mark-paid', protect, authorize('Landlord', 'Admin'), reminderMarkPaidLimiter, async (req, res) => {
  try {
    const reminderId = toPositiveId(req.params.id);
    if (!reminderId) return res.status(400).json({ error: 'Invalid rent reminder ID' });

    const userRole = String(req.user?.role || '').trim().toLowerCase();
    if (userRole === 'tenant') {
      return res.status(403).json({ error: 'Tenants are not authorized to mark rent as paid.' });
    }

    const pool = getPool();
    const reminder = await getReminderRelationship(pool, reminderId);
    if (!reminder || !canAccessReminder(req, reminder)) {
      return res.status(404).json({ error: 'Rent reminder record not found' });
    }

    const today = new Date();
    const paidMonthStr = `${today.getFullYear()}-${today.getMonth() + 1}`;
    await pool.query(
      'UPDATE rent_reminders SET last_paid_month = ?, status = \'Paid\' WHERE reminder_id = ?',
      [paidMonthStr, reminderId]
    );

    try {
      await securityAuditLog(req, 'REMINDER_MARKED_PAID', {
        reminderId,
        houseId: reminder.house_id,
        tenantId: reminder.tenant_id
      });
    } catch (auditError) {
      console.error('Security audit log failed:', auditError);
    }

    res.json({ message: 'Rent payment marked as paid successfully' });
  } catch (error) {
    console.error('Mark paid error:', error);
    res.status(500).json({ error: 'Failed to update rent payment status' });
  }
});

export default router;
