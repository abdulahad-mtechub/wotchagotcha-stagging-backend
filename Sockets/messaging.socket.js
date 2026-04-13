import db from '../db.config/index.js';
import { Server } from 'socket.io';

const generateRoomId = (userId1, userId2) => {
  if (!userId1 || !userId2) return null;
  const sortedIds = [Number(userId1), Number(userId2)].sort((a, b) => a - b);
  return `wotchagotcha_chat_${sortedIds[0]}_${sortedIds[1]}`;
};

const connectedUsers = new Map();
/** @type {Map<string, Array<{id: string, senderId: number|string, username: string, senderImage: string|null, content: string, createdAt: string}>>} */
const liveStreamChatByChannel = new Map();

const liveStreamRoomId = (channelName) =>
  `livestream_${String(channelName || '').replace(/[^a-zA-Z0-9_-]/g, '')}`;

export default function setupMessagingSocket(server, fallbackDb) {
  const pool = db || fallbackDb;

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      // Avoid browser CORS issues in production (origin "*" + credentials true is commonly rejected)
      credentials: false,
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"]
    },
  });

  io.on('connection', (socket) => {
    console.log(`Messaging socket connected: ${socket.id}`);

    socket.on('authenticate', async ({ userId }) => {
      try {
        if (!userId) {
          socket.emit('auth_error', { message: 'User ID required' });
          return;
        }
        
        socket.userId = userId;
        socket.user = { id: userId, name: `User-${userId}` };
        
        connectedUsers.set(String(userId), socket.id);
        socket.emit('authenticated', { success: true, user: socket.user });
        console.log(`User ${userId} authenticated for messaging`);
      } catch (err) {
        console.error(`authenticate error: ${err.message}`);
        socket.emit('auth_error', { message: err.message });
      }
    });

    socket.on('join_room', async ({ otherUserId }) => {
      try {
        const currentUserId = socket.userId;
        if (!currentUserId) {
          return socket.emit('join_room_error', { message: 'User not authenticated' });
        }
        if (!otherUserId) {
          return socket.emit('join_room_error', { message: 'Other user ID required' });
        }

        const roomId = generateRoomId(currentUserId, otherUserId);
        socket.join(roomId);
        
        let recentMessages = [];
        try {
          if (pool) {
            const historyQuery = `
              SELECT *
              FROM chat_messages
              WHERE room_id = $1
              ORDER BY created_at DESC
              LIMIT 10
            `;
            const historyResult = await pool.query(historyQuery, [roomId]);
            recentMessages = historyResult.rows.map(r => {
                return {
                    id: r.id,
                    sender_id: r.sender_id,
                    receiver_id: r.receiver_id,
                    content: r.content,
                    message_type: r.message_type,
                    file_url: r.image_url || r.voice_url || r.file_name,
                    file_type: r.mime_type,
                    room_id: r.room_id,
                    created_at: r.created_at,
                    is_read: r.is_read
                };
            }).reverse(); // oldest to newest
          }
        } catch (historyError) {
          console.error(`Error fetching message history on join: ${historyError.message}`);
        }

        socket.emit('room_joined', {
          roomId,
          otherUserId,
          recentMessages,
          message: `Joined room ${roomId} with ${recentMessages.length} recent messages`
        });
      } catch (error) {
        console.error(`join_room error: ${error.message}`);
        socket.emit('join_room_error', { message: error.message });
      }
    });

    socket.on('send_message', async (data) => {
      try {
        await handleSendMessage(socket, data, io, pool);
      } catch (err) {
        console.error(`send_message error: ${err.message}`);
        socket.emit('message_error', { error: true, message: err.message });
      }
    });

    socket.on('join_live_stream', ({ channelName }) => {
      try {
        if (!socket.userId) {
          return socket.emit('live_stream_error', { message: 'User not authenticated' });
        }
        const normalizedChannelName = String(channelName || '').trim();
        if (!normalizedChannelName) {
          return socket.emit('live_stream_error', { message: 'channelName required' });
        }
        const room = liveStreamRoomId(normalizedChannelName);
        socket.join(room);
        const history = liveStreamChatByChannel.get(normalizedChannelName) || [];
        socket.emit('live_stream_chat_history', {
          channelName: normalizedChannelName,
          messages: history.slice(-50),
        });
      } catch (err) {
        console.error(`join_live_stream error: ${err.message}`);
        socket.emit('live_stream_error', { message: err.message });
      }
    });

    socket.on('leave_live_stream', ({ channelName }) => {
      try {
        if (!channelName) return;
        socket.leave(liveStreamRoomId(channelName));
      } catch (err) {
        console.error(`leave_live_stream error: ${err.message}`);
      }
    });

    socket.on('live_stream_chat', ({ channelName, content, username, senderImage }) => {
      try {
        if (!socket.userId) {
          return socket.emit('live_stream_error', { message: 'User not authenticated' });
        }
        const normalizedChannelName = String(channelName || '').trim();
        if (!normalizedChannelName) {
          return socket.emit('live_stream_error', { message: 'channelName required' });
        }
        const text = String(content || '').trim();
        if (!text) return;
        if (text.length > 2000) {
          return socket.emit('live_stream_error', { message: 'Message too long' });
        }
        const msg = {
          id: `ls_${Date.now()}_${socket.id}`,
          channelName: normalizedChannelName,
          senderId: socket.userId,
          username: username || `User ${socket.userId}`,
          senderImage: senderImage || null,
          content: text,
          createdAt: new Date().toISOString(),
        };
        if (!liveStreamChatByChannel.has(normalizedChannelName)) {
          liveStreamChatByChannel.set(normalizedChannelName, []);
        }
        const arr = liveStreamChatByChannel.get(normalizedChannelName);
        arr.push(msg);
        if (arr.length > 200) {
          arr.splice(0, arr.length - 200);
        }
        io.to(liveStreamRoomId(normalizedChannelName)).emit('live_stream_chat_message', msg);
      } catch (err) {
        console.error(`live_stream_chat error: ${err.message}`);
        socket.emit('live_stream_error', { message: err.message });
      }
    });

    socket.on('mark_read', async ({ roomId, readerId }) => {
      if (!roomId || !readerId) return;
      try {
        if (pool) {
          const q = 'UPDATE chat_messages SET is_read = true WHERE room_id = $1 AND receiver_id = $2 AND is_read = false';
          await pool.query(q, [roomId, readerId]);
        }
        io.to(roomId).emit('messages_read', { roomId, readerId });
        // Also notify the specific user to refresh their global unread count
        socket.emit('unread_count_refreshed');
      } catch (err) {
        console.error(`mark_read error: ${err.message}`);
      }
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        connectedUsers.delete(String(socket.userId));
        console.log(`User ${socket.userId} disconnected from messaging`);
      }
    });
  });

  io.connectedUsers = connectedUsers;
  global.__IO = io;
  return io;
}

async function handleSendMessage(socket, { receiverId, content, messageType = 'text', fileUrl, fileType, roomId, tempId, senderId }, io, pool) {
  const currentUserId = socket.userId || senderId;
  if (!currentUserId) throw new Error('Sender ID required');
  if (!receiverId) throw new Error('Receiver ID required');
  
  let finalRoomId = roomId;
  if (!finalRoomId || finalRoomId.trim() === '') {
    finalRoomId = generateRoomId(currentUserId, receiverId);
  }
  
  const createdAt = new Date();

  let savedMessage = null;
  let imageUrl = null;
  let voiceUrl = null;

  if (messageType === 'image') imageUrl = fileUrl || content;
  if (messageType === 'voice' || messageType === 'video') voiceUrl = fileUrl || content;

  try {
    if (pool) {
      const insertQ = `INSERT INTO chat_messages (sender_id, receiver_id, content, message_type, image_url, voice_url, mime_type, room_id, created_at, is_read) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`;
      const vals = [
        currentUserId, 
        receiverId, 
        content || null, 
        messageType || 'text', 
        imageUrl, 
        voiceUrl, 
        fileType || null, 
        finalRoomId, 
        createdAt, 
        false
      ];
      const res = await pool.query(insertQ, vals);
      if (res && res.rows && res.rows[0]) savedMessage = res.rows[0];
    }
  } catch (e) {
    console.error(`Error saving chat message to DB: ${e.message}`);
  }

  const message = savedMessage || {
    id: tempId || `m_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    sender_id: currentUserId,
    receiver_id: receiverId,
    content,
    message_type: messageType,
    image_url: imageUrl,
    voice_url: voiceUrl,
    room_id: finalRoomId,
    created_at: createdAt.toISOString(),
    is_read: false
  };

  const messagePayload = {
    messageId: message.id,
    senderId: currentUserId,
    receiverId,
    roomId: finalRoomId,
    content: content || '',
    messageType,
    fileUrl: imageUrl || voiceUrl || '',
    timestamp: message.created_at
  };

  const receiverSocketId = connectedUsers.get(String(receiverId));
  const senderSocketId = connectedUsers.get(String(currentUserId));

  // The sender is already joined to the room via 'join_room', but let's make sure both are if connected
  if (receiverSocketId) {
    const receiverSocket = io.sockets.sockets.get(receiverSocketId);
    if (receiverSocket) receiverSocket.join(finalRoomId);
  }
  if (senderSocketId) {
    const sSocket = io.sockets.sockets.get(senderSocketId);
    if (sSocket) sSocket.join(finalRoomId);
  }

  io.to(finalRoomId).emit('receive_message', messagePayload);
}
