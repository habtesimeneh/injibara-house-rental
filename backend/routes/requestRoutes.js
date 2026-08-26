import express from 'express';
import { getPool } from '../../database/db.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { clearHouseCache } from '../controllers/houseController.js';

const router = express.Router();

// Tenant: Create rental request
router.post('/', protect, authorize('Tenant', 'Admin'), async (req, res) => {
  try {
    const { house_id } = req.body;
    const pool = getPool();

    // Check if the user is a Tenant and has paid the required service fee
    if (req.user.role === 'Tenant') {
      const [payments] = await pool.query(
        `SELECT status FROM ad_payments 
         WHERE user_id = ? AND ad_type = 'Tenant Contact Access' AND status = 'Approved' 
         ORDER BY id DESC LIMIT 1`,
        [req.user.id]
      );
      if (payments.length === 0) {
        return res.status(403).json({ 
          error: 'መጀመሪያ ባለቤቱን ለማውራት እና ኪራይ ለመጠየቅ የ 200 ብር የአገልግሎት ክፍያ መክፈል ግዴታ ነው። / Access Restricted: You must first pay the 200 Birr service fee to chat with landlords and send requests.',
          paymentRequired: true 
        });
      }
    }
    
    // Check if house exists and is available
    const [houses] = await pool.query('SELECT title, status, owner_id FROM houses WHERE house_id = ?', [house_id]);
    if (houses.length === 0) {
      return res.status(404).json({ error: 'House not found' });
    }
    if (houses[0].status === 'Rented') {
      return res.status(400).json({ error: 'ይህ ቤት አስቀድሞ ተከራይቷል! ለአንድ ቤት ከአንድ በላይ ተከራይ ማከራየት አይቻልም። / This house is already rented! A property cannot be rented to multiple customers at the same time.' });
    }
    if (houses[0].status !== 'Available') {
      return res.status(400).json({ error: 'ይህ ቤት ለኪራይ ዝግጁ አይደለም። / House is currently not available for rent.' });
    }
    
    // Check if already requested
    const [existing] = await pool.query("SELECT * FROM rental_requests WHERE tenant_id = ? AND house_id = ? AND status = 'Pending'", [req.user.id, house_id]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'You have already sent a pending request for this house' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO rental_requests (tenant_id, house_id) VALUES (?, ?)',
      [req.user.id, house_id]
    );

    // Send notification to house owner / landlord
    try {
      await pool.query(
        'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
        [
          houses[0].owner_id,
          '📩 አዲስ የቤት ኪራይ ጥያቄ! / New Rental Request',
          `ተከራይ ${req.user.name || 'አንድ ደንበኛ'} ለ "${houses[0].title}" አዲስ የኪራይ ጥያቄ ልኳል።`
        ]
      );
    } catch (nErr) {
      console.error('Landlord notification error:', nErr);
    }
    
    res.status(201).json({ message: 'Rental request sent successfully', request_id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send rental request' });
  }
});

// Tenant: Get my requests
router.get('/my-requests', protect, authorize('Tenant', 'Admin'), async (req, res) => {
  try {
    const pool = getPool();
    const [requests] = await pool.query(`
      SELECT r.*, h.title, h.region, h.city, h.price 
      FROM rental_requests r 
      JOIN houses h ON r.house_id = h.house_id 
      WHERE r.tenant_id = ?
      ORDER BY r.created_at DESC
    `, [req.user.id]);
    
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch your requests' });
  }
});

// Landlord: Get requests for my properties
router.get('/received', protect, authorize('Landlord', 'Admin'), async (req, res) => {
  try {
    const pool = getPool();
    const [requests] = await pool.query(`
      SELECT r.*, h.title as house_title, u.name as tenant_name, u.email as tenant_email 
      FROM rental_requests r 
      JOIN houses h ON r.house_id = h.house_id 
      JOIN users u ON r.tenant_id = u.user_id
      WHERE h.owner_id = ?
      ORDER BY r.created_at DESC
    `, [req.user.id]);
    
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch received requests' });
  }
});

// Landlord: Update request status
router.put('/:id/status', protect, authorize('Landlord', 'Admin'), async (req, res) => {
  try {
    const { status } = req.body; // Approved or Rejected
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [requests] = await connection.query(`
        SELECT r.request_id, r.tenant_id, r.house_id, h.owner_id, h.title as house_title, h.status as house_status 
        FROM rental_requests r 
        JOIN houses h ON r.house_id = h.house_id 
        WHERE r.request_id = ?
        FOR UPDATE
      `, [req.params.id]);
      
      if (requests.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Request not found' });
      }
      
      const requestItem = requests[0];

      if (requestItem.owner_id !== req.user.id && req.user.role !== 'Admin') {
        await connection.rollback();
        return res.status(403).json({ error: 'Not authorized to manage this request' });
      }

      if (status === 'Approved' && requestItem.house_status === 'Rented') {
        await connection.rollback();
        return res.status(400).json({ error: 'ይህ ቤት አስቀድሞ ለሌላ ተከራይ ተከራይቷል! ለአንድ ቤት ከአንድ በላይ ተከራይ ማከራየት አይቻልም። / This house is already rented to another customer! A property cannot be rented to multiple customers.' });
      }
      
      if (status === 'Approved') {
        const [updateResult] = await connection.query("UPDATE houses SET status = 'Rented' WHERE house_id = ? AND status = 'Available'", [requestItem.house_id]);
        
        if (!updateResult || updateResult.affectedRows === 0) {
          await connection.rollback();
          return res.status(400).json({ error: 'House was just rented by another user. The approval could not be completed.' });
        }
      }
      
      await connection.query('UPDATE rental_requests SET status = ? WHERE request_id = ?', [status, req.params.id]);
      
      if (status === 'Approved') {
        await connection.query("UPDATE rental_requests SET status = 'Rejected' WHERE house_id = ? AND request_id != ? AND status = 'Pending'", [requestItem.house_id, req.params.id]);
      }
      
      await connection.commit();

      clearHouseCache();

      if (status === 'Approved') {
        // 1. Send success notification to the tenant who requested the house
        try {
          const notifTitle = '🎉 የቤት ኪራይ ጥያቄዎ ተቀባይነት አግኝቷል!';
          const notifMsg = `እንኳን ደስ አለዎት! ለ "${requestItem.house_title}" ያቀረቡት የቤት ኪራይ ጥያቄ በአከራዩ ተቀባይነት አግኝቷል።`;

          await pool.query(
            'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
            [requestItem.tenant_id, notifTitle, notifMsg]
          );

          // 2. Also insert direct in-app chat message from landlord to tenant so it shows in their chat thread
          await pool.query(
            'INSERT INTO messages (sender_id, receiver_id, house_id, content, is_read) VALUES (?, ?, ?, ?, 0)',
            [
              req.user.id,
              requestItem.tenant_id,
              requestItem.house_id,
              `🎉 እንኳን ደስ አለዎት! ለ "${requestItem.house_title}" ያቀረቡትን የቤት ኪራይ ጥያቄ ተቀብያለሁ። እባክዎን በስልክ ወይም እዚሁ ቻት ላይ በመወያየት ቀጣይ ሂደቱን እንጨርስ።`
            ]
          );
        } catch (nErr) {
          console.error('Notification insertion error:', nErr);
        }

        // 3. Find other pending requests for this house and update them to Rejected & send notification
        try {
          const [otherRequests] = await pool.query(
            "SELECT tenant_id FROM rental_requests WHERE house_id = ? AND request_id != ? AND status = 'Pending'",
            [requestItem.house_id, req.params.id]
          );

          await pool.query("UPDATE rental_requests SET status = 'Rejected' WHERE house_id = ? AND request_id != ?", [requestItem.house_id, req.params.id]);

          for (const oReq of otherRequests) {
            await pool.query(
              'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
              [
                oReq.tenant_id,
                '❌ የቤት ኪራይ ጥያቄ ማሳወቂያ',
                `ለ "${requestItem.house_title}" ያቀረቡት የቤት ኪራይ ጥያቄ ቤቱ ለሌላ ተከራይ በመከራየቱ ምክንያት አልተቀበለም።`
              ]
            );
          }
        } catch (oErr) {
          console.error('Other requests notification error:', oErr);
        }
      } else if (status === 'Rejected') {
        try {
          await pool.query(
            'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
            [
              requestItem.tenant_id,
              '❌ የቤት ኪራይ ጥያቄ ማሳወቂያ',
              `ለ "${requestItem.house_title}" ያቀረቡት የቤት ኪራይ ጥያቄ በአከራዩ አልተቀበለም።`
            ]
          );
        } catch (rErr) {
          console.error('Rejection notification error:', rErr);
        }
      }
      
      res.json({ message: `Request ${status.toLowerCase()} successfully` });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Transaction error:', error);
    res.status(500).json({ error: 'Failed to update request status' });
  }
});

export default router;
