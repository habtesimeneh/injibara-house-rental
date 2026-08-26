import { getPool } from '../../database/db.js';

const isUserOnline = (lastSeen) => {
  if (!lastSeen) return false;
  const time = new Date(lastSeen).getTime();
  if (isNaN(time)) return false;
  return (Date.now() - time) < 3 * 60 * 1000;
};

const escapeHtml = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const sanitizeMessage = (content) => {
  if (!content) return '';
  return escapeHtml(content.trim());
};

/**
 * @desc    Get all chat conversations for logged-in user
 * @route   GET /api/messages/conversations
 * @access  Private (Tenant, Landlord, Admin)
 */
export const getConversations = async (req, res) => {
  try {
    const pool = getPool();
    const userId = req.user.id;

    // Find all messages involving the current user
    const [rows] = await pool.query(`
      SELECT 
        m.id as last_message_id,
        m.content as last_message,
        m.created_at as last_message_time,
        m.sender_id,
        m.receiver_id,
        m.house_id,
        h.title as house_title,
        h.image_url as house_image,
        h.region as house_region,
        CASE 
          WHEN m.sender_id = ? THEN m.receiver_id 
          ELSE m.sender_id 
        END as other_user_id
      FROM messages m
      LEFT JOIN houses h ON m.house_id = h.house_id
      WHERE m.sender_id = ? OR m.receiver_id = ?
      ORDER BY m.created_at DESC
    `, [userId, userId, userId]);

    // Group by other_user_id to get distinct active conversations
    const conversationMap = new Map();
    for (const row of rows) {
      const partnerId = row.other_user_id;
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, row);
      }
    }

    const partnerIds = Array.from(conversationMap.keys());
    if (partnerIds.length === 0) {
      return res.json([]);
    }

    // Get partner details
    const placeholders = partnerIds.map(() => '?').join(',');
    let partners = [];
    try {
      const [partnerRows] = await pool.query(
        `SELECT user_id, name, email, phone, role, last_seen FROM users WHERE user_id IN (${placeholders})`,
        partnerIds
      );
      partners = partnerRows;
    } catch (e) {
      const [partnerRowsFallback] = await pool.query(
        `SELECT user_id, name, email, phone, role FROM users WHERE user_id IN (${placeholders})`,
        partnerIds
      );
      partners = partnerRowsFallback;
    }

    const partnerMap = new Map(partners.map(u => [u.user_id, u]));

    // Calculate unread count per sender
    const [unreadRows] = await pool.query(`
      SELECT sender_id, COUNT(*) as unread_count 
      FROM messages 
      WHERE receiver_id = ? AND is_read = 0 
      GROUP BY sender_id
    `, [userId]);

    const unreadMap = new Map(unreadRows.map(u => [u.sender_id, u.unread_count]));

    const conversationList = partnerIds.map(partnerId => {
      const conv = conversationMap.get(partnerId);
      const partnerInfo = partnerMap.get(partnerId) || { name: 'User', role: 'User' };
      const isAdmin = String(req.user?.role || '').trim().toLowerCase() === 'admin';
      return {
        other_user_id: partnerId,
        other_user_name: partnerInfo.name,
        other_user_role: partnerInfo.role,
        last_seen: isAdmin ? partnerInfo.last_seen : undefined,
        is_online: isUserOnline(partnerInfo.last_seen),
        last_message: sanitizeMessage(conv.last_message),
        last_message_time: conv.last_message_time,
        house_id: conv.house_id,
        house_title: conv.house_title,
        house_image: conv.house_image,
        house_region: conv.house_region || 'Amhara',
        unread_count: unreadMap.get(partnerId) || 0
      };
    });

    res.json(conversationList);
  } catch (error) {
    console.error('Error in getConversations:', error);
    res.status(500).json({ error: 'Failed to fetch chat conversations' });
  }
};

/**
 * @desc    Get message thread with a specific partner
 * @route   GET /api/messages/chat/:otherUserId
 * @access  Private (Tenant, Landlord, Admin)
 */
export const getChatThread = async (req, res) => {
  try {
    const pool = getPool();
    const userId = req.user.id;
    const otherUserId = Number(req.params.otherUserId);

    // Validate recipient user
    let partnerUserRows = [];
    try {
      const [rows] = await pool.query('SELECT user_id, name, email, phone, role, last_seen FROM users WHERE user_id = ?', [otherUserId]);
      partnerUserRows = rows;
    } catch (e) {
      const [rowsFallback] = await pool.query('SELECT user_id, name, email, phone, role FROM users WHERE user_id = ?', [otherUserId]);
      partnerUserRows = rowsFallback;
    }
    if (partnerUserRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const partnerRaw = partnerUserRows[0];
    const isAdmin = String(req.user?.role || '').trim().toLowerCase() === 'admin';
    const partner = {
      user_id: partnerRaw.user_id,
      name: partnerRaw.name,
      role: partnerRaw.role,
      ...(isAdmin ? { email: partnerRaw.email, phone: partnerRaw.phone, last_seen: partnerRaw.last_seen } : {}),
      is_online: isUserOnline(partnerRaw.last_seen)
    };

    // Fetch messages between sender and recipient
    const [messages] = await pool.query(`
      SELECT m.*, s.name as sender_name, h.title as house_title, h.region as house_region 
      FROM messages m
      JOIN users s ON m.sender_id = s.user_id
      LEFT JOIN houses h ON m.house_id = h.house_id
      WHERE (m.sender_id = ? AND m.receiver_id = ?) 
         OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at ASC
    `, [userId, otherUserId, otherUserId, userId]);

    // Mark incoming unread messages as read
    await pool.query(
      'UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0',
      [otherUserId, userId]
    );

    const sanitizedMessages = (messages || []).map(msg => ({
      ...msg,
      content: sanitizeMessage(msg.content)
    }));

    res.json({
      partner,
      messages: sanitizedMessages
    });
  } catch (error) {
    console.error('Error in getChatThread:', error);
    res.status(500).json({ error: 'Failed to fetch chat thread' });
  }
};

/**
 * @desc    Send a new message between tenant & landlord
 * @route   POST /api/messages/send
 * @access  Private (Tenant, Landlord, Admin)
 */
export const sendMessage = async (req, res) => {
  try {
    const { content } = req.body;
    let { receiver_id, house_id } = req.body;
    
    if (house_id === 'null' || house_id === 'undefined' || house_id === '') {
      house_id = null;
    }
    if (receiver_id === 'null' || receiver_id === 'undefined' || receiver_id === '') {
      receiver_id = null;
    }

    const sender = req.user;
    const senderId = parseInt(sender.id, 10);
    const receiverIdParsed = receiver_id ? parseInt(receiver_id, 10) : null;
    const houseIdParsed = house_id ? parseInt(house_id, 10) : null;

    if (!receiverIdParsed || isNaN(senderId) || isNaN(receiverIdParsed)) {
      return res.status(400).json({ error: 'Receiver ID and non-empty content are required' });
    }
    if (house_id && isNaN(houseIdParsed)) {
      return res.status(400).json({ error: 'Invalid associated house property ID' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Non-empty message content is required' });
    }

    const pool = getPool();

    // Check if the sender is a Tenant and has paid the required service fee to chat/contact
    if (sender.role === 'Tenant') {
      const [payments] = await pool.query(
        `SELECT status FROM ad_payments 
         WHERE user_id = ? AND ad_type = 'Tenant Contact Access' AND status = 'Approved' 
         ORDER BY id DESC LIMIT 1`,
        [senderId]
      );
      if (payments.length === 0) {
        // Fetch current fee from settings for accurate error message
        let currentFee = '150';
        try {
          const [settingsRows] = await pool.query("SELECT value FROM website_settings WHERE key_name = 'ad_fee_tenant_contact'");
          if (settingsRows.length > 0) currentFee = settingsRows[0].value;
        } catch (e) {}

        return res.status(403).json({ 
          error: `መጀመሪያ ባለቤቱን ለማውራት የ ${currentFee} ብር የአገልግሎት ክፍያ መክፈል ግዴታ ነው። / Access Restricted: You must first pay the ${currentFee} Birr service fee to chat with landlords.`,
          paymentRequired: true 
        });
      }
    }

    // Check receiver existence & role
    const [receivers] = await pool.query('SELECT user_id, name, role FROM users WHERE user_id = ?', [receiverIdParsed]);
    if (receivers.length === 0) {
      return res.status(404).json({ error: 'Recipient user not found' });
    }
    const receiver = receivers[0];

    // Ensure messaging is between Tenants and House Owners (Landlords) or Admins
    const validRoles = ['Tenant', 'Landlord', 'Admin'];
    if (!validRoles.includes(sender.role) || !validRoles.includes(receiver.role)) {
      return res.status(403).json({ error: 'Messaging is restricted to tenants and house owners.' });
    }

    // If house_id is explicitly provided, verify that the house exists
    if (houseIdParsed) {
      const [houses] = await pool.query('SELECT house_id, title, region, owner_id FROM houses WHERE house_id = ?', [houseIdParsed]);
      if (houses.length === 0) {
        return res.status(404).json({ error: 'Associated house property not found' });
      }
    }

    // Insert message
    const [result] = await pool.query(
      'INSERT INTO messages (sender_id, receiver_id, house_id, content, is_read) VALUES (?, ?, ?, ?, 0)',
      [senderId, receiverIdParsed, houseIdParsed, sanitizeMessage(content)]
    );

    // Create notification for receiver
    try {
      await pool.query(
        'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
        [receiver_id, 'New Chat Message', `${sender.name}: "${sanitizeMessage(content).substring(0, 40)}..."`]
      );
    } catch (nErr) {
      console.log('Notification error ignored:', nErr);
    }

    res.status(201).json({
      message: 'Message sent successfully',
      message_id: result.insertId,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in sendMessage:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

/**
 * @desc    Get count of unread messages for badge
 * @route   GET /api/messages/unread-count
 * @access  Private
 */
export const getUnreadCount = async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT COUNT(*) as unread FROM messages WHERE receiver_id = ? AND is_read = 0', [req.user.id]);
    res.json({ unread: rows?.[0]?.unread || 0 });
  } catch (error) {
    console.error('Failed to get unread message count:', error);
    res.status(200).json({ unread: 0 });
  }
};

/**
 * @desc    Get all tenant-broker conversations across the system for Admin audit
 * @route   GET /api/messages/admin/all-conversations
 * @access  Private (Admin)
 */
export const getAdminAllConversations = async (req, res) => {
  try {
    const pool = getPool();

    // Fetch all message thread pairs
    const [rows] = await pool.query(`
      SELECT 
        m.id as message_id,
        m.sender_id,
        m.receiver_id,
        m.content,
        m.created_at,
        m.house_id,
        h.title as house_title,
        h.image_url as house_image,
        u1.name as sender_name,
        u1.email as sender_email,
        u1.role as sender_role,
        u1.phone as sender_phone,
        u2.name as receiver_name,
        u2.email as receiver_email,
        u2.role as receiver_role,
        u2.phone as receiver_phone
      FROM messages m
      JOIN users u1 ON m.sender_id = u1.user_id
      JOIN users u2 ON m.receiver_id = u2.user_id
      LEFT JOIN houses h ON m.house_id = h.house_id
      ORDER BY m.created_at DESC
    `);

    // Group into conversation pairs
    const pairsMap = new Map();

    for (const row of rows) {
      const u1 = Math.min(row.sender_id, row.receiver_id);
      const u2 = Math.max(row.sender_id, row.receiver_id);
      const key = `${u1}_${u2}`;

      if (!pairsMap.has(key)) {
        const isSenderU1 = row.sender_id === u1;
        pairsMap.set(key, {
          pair_key: key,
          user1: {
            user_id: u1,
            name: isSenderU1 ? row.sender_name : row.receiver_name,
            email: isSenderU1 ? row.sender_email : row.receiver_email,
            role: isSenderU1 ? row.sender_role : row.receiver_role,
            phone: isSenderU1 ? row.sender_phone : row.receiver_phone,
          },
          user2: {
            user_id: u2,
            name: isSenderU1 ? row.receiver_name : row.sender_name,
            email: isSenderU1 ? row.receiver_email : row.sender_email,
            role: isSenderU1 ? row.receiver_role : row.sender_role,
            phone: isSenderU1 ? row.receiver_phone : row.sender_phone,
          },
          last_message: row.content,
          last_message_time: row.created_at,
          house_id: row.house_id,
          house_title: row.house_title,
          house_image: row.house_image,
          total_messages: 1
        });
      } else {
        const existing = pairsMap.get(key);
        existing.total_messages += 1;
      }
    }

    res.json(Array.from(pairsMap.values()));
  } catch (error) {
    console.error('Error in getAdminAllConversations:', error);
    res.status(500).json({ error: 'Failed to fetch admin conversation overview' });
  }
};

/**
 * @desc    Get detailed message thread between two specific users for Admin
 * @route   GET /api/messages/admin/thread/:u1/:u2
 * @access  Private (Admin)
 */
export const getAdminThread = async (req, res) => {
  try {
    const pool = getPool();
    const u1 = Number(req.params.u1);
    const u2 = Number(req.params.u2);

    if (!u1 || !u2) {
      return res.status(400).json({ error: 'Invalid user parameters' });
    }

    const [messages] = await pool.query(`
      SELECT 
        m.*, 
        s.name as sender_name, 
        s.role as sender_role,
        r.name as receiver_name,
        r.role as receiver_role,
        h.title as house_title,
        h.image_url as house_image
      FROM messages m
      JOIN users s ON m.sender_id = s.user_id
      JOIN users r ON m.receiver_id = r.user_id
      LEFT JOIN houses h ON m.house_id = h.house_id
      WHERE (m.sender_id = ? AND m.receiver_id = ?) 
         OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at ASC
    `, [u1, u2, u1, u2]);

    res.json(messages);
  } catch (error) {
    console.error('Error in getAdminThread:', error);
    res.status(500).json({ error: 'Failed to fetch admin thread messages' });
  }
};

