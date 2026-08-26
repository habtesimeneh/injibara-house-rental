import express from 'express';
import { getPool } from '../../database/db.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { contractCreateLimiter } from '../middleware/rateLimiter.js';
import { securityAuditLog } from '../middleware/securityMiddleware.js';

const router = express.Router();

const toPositiveId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const isAdmin = (req) => String(req.user?.role || '').trim().toLowerCase() === 'admin';

const isValidDate = (value) => {
  const date = new Date(value);
  return !isNaN(date.getTime());
};

const sanitizeContract = (contract, role) => {
  if (!contract) return contract;
  const sanitized = { ...contract };
  if (role === 'tenant') {
    delete sanitized.landlord_id;
    delete sanitized.landlord_id_no;
    delete sanitized.landlord_phone;
  } else if (role === 'landlord') {
    delete sanitized.tenant_id;
    delete sanitized.tenant_id_no;
    delete sanitized.tenant_phone;
  }
  return sanitized;
};

const contractSelect = `
  SELECT
    c.contract_id, c.house_id, c.landlord_id, c.tenant_id,
    c.landlord_name, c.tenant_name, c.monthly_rent, c.deposit_amount,
    c.start_date, c.end_date, c.terms_conditions, c.status, c.created_at,
    h.owner_id AS house_owner_id, h.title AS house_title, h.city AS house_city,
    h.sub_city AS house_sub_city, h.address AS house_address, h.type AS house_type
  FROM rental_contracts c
  JOIN houses h ON c.house_id = h.house_id
`;

const getApprovedTenantForHouse = async (pool, houseId, requestedTenantId = null) => {
  let query = `
    SELECT r.tenant_id
    FROM rental_requests r
    JOIN users u ON r.tenant_id = u.user_id
    WHERE r.house_id = ?
      AND r.status = 'Approved'
      AND LOWER(TRIM(u.role)) = 'tenant'
  `;
  const params = [houseId];

  if (requestedTenantId !== null) {
    query += ' AND r.tenant_id = ?';
    params.push(requestedTenantId);
  }

  const [tenants] = await pool.query(query, params);
  return tenants || [];
};

router.get('/', protect, authorize('Tenant', 'Landlord', 'Admin'), async (req, res) => {
  try {
    const pool = getPool();
    let whereClause = '';
    let params = [];

    if (!isAdmin(req)) {
      if (String(req.user.role).trim().toLowerCase() === 'landlord') {
        whereClause = ' WHERE h.owner_id = ?';
      } else {
        whereClause = ' WHERE c.tenant_id = ?';
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
    let query = `${contractSelect}${whereClause} ORDER BY c.created_at DESC`;
    const queryParams = [...params];
    if (limit) {
      query += ' LIMIT ? OFFSET ?';
      queryParams.push(limit, offset);
    }
    const [contracts] = await pool.query(query, queryParams);
    const userRole = String(req.user?.role || '').trim().toLowerCase();
    const sanitized = (contracts || []).map((contract) => sanitizeContract(contract, userRole));
    res.json(sanitized);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ error: 'Failed to fetch rental contracts' });
  }
});

router.get('/:id', protect, authorize('Tenant', 'Landlord', 'Admin'), async (req, res) => {
  try {
    const contractId = toPositiveId(req.params.id);
    if (!contractId) return res.status(400).json({ error: 'Invalid rental contract ID' });

    const pool = getPool();
    const [contracts] = await pool.query(`${contractSelect} WHERE c.contract_id = ? LIMIT 1`, [contractId]);
    const contract = contracts?.[0];

    if (!contract || (!isAdmin(req) && Number(contract.house_owner_id) !== Number(req.user.id) && Number(contract.tenant_id) !== Number(req.user.id))) {
      return res.status(404).json({ error: 'Rental contract not found' });
    }

    const userRole = String(req.user?.role || '').trim().toLowerCase();
    res.json(sanitizeContract(contract, userRole));
  } catch (error) {
    console.error('Error fetching contract detail:', error);
    res.status(500).json({ error: 'Failed to fetch contract details' });
  }
});

router.post('/', protect, authorize('Landlord', 'Admin'), contractCreateLimiter, async (req, res) => {
  let createdContractId = null;

  try {
    const {
      house_id, tenant_id, landlord_id, landlord_name, landlord_id_no, landlord_phone,
      tenant_name, tenant_id_no, tenant_phone, monthly_rent, deposit_amount,
      start_date, end_date, terms_conditions
    } = req.body;

    const houseId = toPositiveId(house_id);
    const hasTenantId = tenant_id !== undefined && tenant_id !== null && tenant_id !== '';
    const requestedTenantId = hasTenantId ? toPositiveId(tenant_id) : null;
    const monthlyRent = Number(monthly_rent);
    const depositAmount = deposit_amount === undefined || deposit_amount === '' ? 0 : Number(deposit_amount);

    if (!houseId || (hasTenantId && !requestedTenantId)) {
      return res.status(400).json({ error: 'Invalid house or tenant ID' });
    }
    if (!landlord_name || !tenant_name || !Number.isFinite(monthlyRent) || monthlyRent <= 0 || !Number.isFinite(depositAmount) || depositAmount < 0 || !start_date || !end_date) {
      return res.status(400).json({ error: 'Please provide valid required contract fields' });
    }

    if (String(landlord_name).trim().length > 100 || String(tenant_name).trim().length > 100) {
      return res.status(400).json({ error: 'Name fields must be 100 characters or fewer' });
    }
    if (String(landlord_id_no || '').trim().length > 50 || String(tenant_id_no || '').trim().length > 50) {
      return res.status(400).json({ error: 'ID number fields must be 50 characters or fewer' });
    }
    if (String(landlord_phone || '').trim().length > 20 || String(tenant_phone || '').trim().length > 20) {
      return res.status(400).json({ error: 'Phone number fields must be 20 characters or fewer' });
    }
    if (String(terms_conditions || '').trim().length > 10000) {
      return res.status(400).json({ error: 'Terms and conditions must be 10000 characters or fewer' });
    }
    if (monthlyRent > 100000000 || depositAmount > 100000000) {
      return res.status(400).json({ error: 'Monetary values exceed the allowed limit' });
    }

    if (!isValidDate(start_date) || !isValidDate(end_date)) {
      return res.status(400).json({ error: 'Invalid start or end date' });
    }

    const start = new Date(start_date);
    const end = new Date(end_date);
    if (end <= start) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [houses] = await connection.query('SELECT house_id, owner_id FROM houses WHERE house_id = ? LIMIT 1', [houseId]);
      const house = houses?.[0];
      if (!house) {
        await connection.rollback();
        return res.status(404).json({ error: 'Selected property not found' });
      }

      const authoritativeLandlordId = toPositiveId(house.owner_id);
      if (!isAdmin(req) && authoritativeLandlordId !== Number(req.user.id)) {
        await connection.rollback();
        return res.status(404).json({ error: 'Selected property not found' });
      }
      if (landlord_id !== undefined && landlord_id !== null && landlord_id !== '' && toPositiveId(landlord_id) !== authoritativeLandlordId) {
        await connection.rollback();
        return res.status(400).json({ error: 'Landlord does not match the property owner' });
      }

      const approvedTenants = await getApprovedTenantForHouse(connection, houseId, requestedTenantId);
      if (approvedTenants.length !== 1) {
        await connection.rollback();
        return res.status(409).json({
          error: requestedTenantId ? 'Tenant is not an approved tenant for this property' : 'An unambiguous approved tenant is required for this property'
        });
      }
      const tenantId = Number(approvedTenants[0].tenant_id);

      const [result] = await connection.query(
        `INSERT INTO rental_contracts
         (house_id, landlord_id, tenant_id, landlord_name, landlord_id_no, landlord_phone, tenant_name, tenant_id_no, tenant_phone, monthly_rent, deposit_amount, start_date, end_date, terms_conditions, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
        [houseId, authoritativeLandlordId, tenantId, String(landlord_name).trim(), String(landlord_id_no || '').trim(), String(landlord_phone || '').trim(), String(tenant_name).trim(), String(tenant_id_no || '').trim(), String(tenant_phone || '').trim(), monthlyRent, depositAmount, start_date, end_date, String(terms_conditions || '').trim()]
      );
      createdContractId = result.insertId;

      const dueDay = Math.min(Math.max(new Date(start_date).getDate() || 1, 1), 28);
      await connection.query(
        `INSERT INTO rent_reminders (house_id, tenant_id, landlord_id, monthly_rent, due_day_of_month, status)
         VALUES (?, ?, ?, ?, ?, 'Pending')`,
        [houseId, tenantId, authoritativeLandlordId, monthlyRent, dueDay]
      );

      await connection.commit();

      try {
        await securityAuditLog(req, 'CONTRACT_CREATED', {
          contractId: result.insertId,
          houseId,
          tenantId
        });
      } catch (auditError) {
        console.error('Security audit log failed:', auditError);
      }

      res.status(201).json({ message: 'Rental contract created successfully', contract_id: result.insertId });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create contract error:', error);
    res.status(500).json({ error: 'Failed to generate digital rental contract' });
  }
});

export default router;
