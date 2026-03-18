import db from '../db.config/index.js';

// Helper to remove any sensitive info from a message object if necessary
const scrubMessage = (msg) => {
  return { ...msg };
};

const generateRoomId = (userId1, userId2) => {
  if (!userId1 || !userId2) return null;
  const sortedIds = [Number(userId1), Number(userId2)].sort((a, b) => a - b);
  return `wotchagotcha_chat_${sortedIds[0]}_${sortedIds[1]}`;
};

export const getConversationWithUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const otherUserId = req.params.otherUserId;
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;

    if (!otherUserId) return res.status(400).json({ success: false, message: 'otherUserId parameter is required' });

    const roomId = generateRoomId(userId, otherUserId);

    const q = 'SELECT * FROM chat_messages WHERE room_id = $1 ORDER BY created_at ASC LIMIT $2 OFFSET $3';
    const result = await db.query(q, [roomId, limit, offset]);

    const messages = (result.rows || []).map(m => scrubMessage(m));
    return res.status(200).json({ success: true, message: 'Conversation fetched', data: { roomId, messages } });
  } catch (error) {
    console.error('getConversationWithUser error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;

    const q = 'SELECT COUNT(*)::int as count FROM chat_messages WHERE receiver_id = $1 AND is_read = false';
    const result = await db.query(q, [userId]);

    const count = (result.rows && result.rows[0] && result.rows[0].count) || 0;
    return res.status(200).json({ success: true, message: 'Unread count fetched', data: { totalUnread: count } });
  } catch (error) {
    console.error('getUnreadCount error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const markMessagesRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { otherUserId, messageId } = req.body || {};

    if (!otherUserId && !messageId) {
      return res.status(400).json({ success: false, message: 'otherUserId or messageId is required' });
    }

    let q, params;
    if (messageId) {
      q = 'UPDATE chat_messages SET is_read = true WHERE id = $1 AND receiver_id = $2 AND is_read = false RETURNING id';
      params = [messageId, userId];
    } else {
      q = 'UPDATE chat_messages SET is_read = true WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false RETURNING id';
      params = [otherUserId, userId];
    }

    const result = await db.query(q, params);
    const markedCount = (result.rows && result.rows.length) || 0;
    
    return res.status(200).json({ success: true, message: 'Messages marked as read', data: { markedCount } });
  } catch (error) {
    console.error('markMessagesRead error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


export const getChatList = async (req, res) => {
  try {
    const userId = req.user.userId;

    // This query finds unique users that the current user has sent or received messages from.
    // It also gets the last message and unread count for each.
    const q = `
      WITH last_messages AS (
        SELECT DISTINCT ON (room_id) *
        FROM chat_messages
        WHERE sender_id = $1 OR receiver_id = $1
        ORDER BY room_id, created_at DESC
      ),
      unread_counts AS (
          SELECT sender_id, COUNT(*)::int as unread
          FROM chat_messages
          WHERE receiver_id = $1 AND is_read = false
          GROUP BY sender_id
      )
      SELECT 
        lm.*,
        CASE WHEN lm.sender_id = $1 THEN lm.receiver_id ELSE lm.sender_id END as other_user_id,
        u.username,
        u.image as profile_image,
        COALESCE(uc.unread, 0) as unread_count
      FROM last_messages lm
      JOIN users u ON u.id = (CASE WHEN lm.sender_id = $1 THEN lm.receiver_id ELSE lm.sender_id END)
      LEFT JOIN unread_counts uc ON uc.sender_id = u.id
      ORDER BY lm.created_at DESC
    `;
    
    const result = await db.query(q, [userId]);
    return res.status(200).json({ success: true, message: 'Chat list fetched', data: result.rows });
  } catch (error) {
    console.error('getChatList error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
