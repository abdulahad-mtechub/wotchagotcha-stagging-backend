import db from '../db.config/index.js';

const createTableSql = `
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  message_type VARCHAR(50) DEFAULT 'text',
  image_url TEXT,
  voice_url TEXT,
  file_name VARCHAR(255),
  file_size BIGINT,
  mime_type VARCHAR(100),
  room_id VARCHAR(100) NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver_id ON chat_messages(receiver_id);
`;

const runMigration = async () => {
  try {
    console.log('Running chat_messages table migration...');
    if (db) {
        await db.query(createTableSql);
        console.log('Successfully created chat_messages table and indexes.');
    } else {
        console.error('Database connection not available for migration.');
    }
  } catch (error) {
    console.error('Error creating table:', error);
  } finally {
    process.exit();
  }
};

runMigration();
