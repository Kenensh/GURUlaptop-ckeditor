import { pool } from '../configs/db.js'

export const messageService = {
  // 儲存私人訊息
  savePrivateMessage: async (senderId, receiverId, content, type = 'text') => {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const result = await client.query(
        `INSERT INTO messages 
        (sender_id, receiver_id, type, content, status, created_at) 
        VALUES ($1, $2, $3, $4, 'sent', NOW())
        RETURNING id`,
        [senderId, receiverId, type, content]
      )

      await client.query('COMMIT')
      return result.rows[0].id
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  },

  // 儲存群組訊息
  saveGroupMessage: async (roomId, senderId, content, type = 'text') => {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const result = await client.query(
        `INSERT INTO chat_messages 
        (room_id, sender_id, message, message_type, status, created_at) 
        VALUES ($1, $2, $3, $4, 'sent', NOW())
        RETURNING id`,
        [roomId, senderId, content, type]
      )

      await client.query('COMMIT')
      return result.rows[0].id
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  },

  // 更新訊息狀態
  updateMessageStatus: async (messageId, status, isPrivate = false) => {
    const table = isPrivate ? 'messages' : 'chat_messages'
    const client = await pool.connect()
    try {
      await client.query(`UPDATE ${table} SET status = $1 WHERE id = $2`, [
        status,
        messageId,
      ])
    } finally {
      client.release()
    }
  },

  // 標記訊息為已讀
  markAsRead: async (messageIds, isPrivate = false) => {
    const table = isPrivate ? 'messages' : 'chat_messages'
    const client = await pool.connect()
    try {
      // PostgreSQL 的 IN 子句需要不同的參數處理方式
      const placeholders = messageIds
        .map((_, index) => `$${index + 1}`)
        .join(',')
      await client.query(
        `UPDATE ${table} 
         SET status = 'read', read_at = NOW() 
         WHERE id IN (${placeholders}) AND status != 'read'`,
        messageIds
      )
    } finally {
      client.release()
    }
  },

  // 獲取私人訊息記錄
  getPrivateMessages: async (userId1, userId2, limit = 50) => {
    const client = await pool.connect()
    try {
      const result = await client.query(
        `SELECT m.*, 
         sender.name as sender_name, 
         sender.image_path as sender_image
         FROM messages m
         JOIN users sender ON m.sender_id = sender.user_id
         WHERE ((m.sender_id = $1 AND m.receiver_id = $2) 
         OR (m.sender_id = $3 AND m.receiver_id = $4))
         AND m.is_deleted = false
         ORDER BY m.created_at DESC
         LIMIT $5`,
        [userId1, userId2, userId2, userId1, limit]
      )
      return result.rows
    } finally {
      client.release()
    }
  },

  // 獲取群組訊息記錄
  getGroupMessages: async (roomId, limit = 50) => {
    const client = await pool.connect()
    try {
      const result = await client.query(
        `SELECT cm.*, 
         u.name as sender_name, 
         u.image_path as sender_image
         FROM chat_messages cm
         JOIN users u ON cm.sender_id = u.user_id
         WHERE cm.room_id = $1 
         AND cm.is_deleted = false
         ORDER BY cm.created_at ASC
         LIMIT $2`,
        [roomId, limit]
      )
      return result.rows
    } finally {
      client.release()
    }
  },

  // 刪除訊息（軟刪除）
  deleteMessage: async (messageId, isPrivate = false) => {
    const table = isPrivate ? 'messages' : 'chat_messages'
    const client = await pool.connect()
    try {
      await client.query(
        `UPDATE ${table} SET is_deleted = true WHERE id = $1`,
        [messageId]
      )
    } finally {
      client.release()
    }
  },
}

export default messageService
