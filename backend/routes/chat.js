import express from 'express'
import { chatController } from '../controllers/chatController.js'
import { chatService } from '../services/chatService.js'
import { checkAuth } from '../middlewares/authenticate.js'
import { pool } from '../configs/db.js'

const router = express.Router()
router.use(checkAuth)

router.post('/rooms/:roomId/leave', async (req, res) => {
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const { roomId } = req.params
    const userId = req.user.user_id

    const groupInfo = await client.query(
      'SELECT group_id FROM "group" WHERE chat_room_id = $1',
      [roomId]
    )

    if (groupInfo.rows.length === 0) {
      throw new Error('找不到該群組')
    }

    await client.query(
      'DELETE FROM chat_room_members WHERE room_id = $1 AND user_id = $2',
      [roomId, userId]
    )

    await client.query(
      'DELETE FROM group_members WHERE group_id = $1 AND member_id = $2',
      [groupInfo.rows[0].group_id, userId]
    )

    const userData = await client.query(
      'SELECT name FROM users WHERE user_id = $1',
      [userId]
    )

    const systemMessage = JSON.stringify({
      type: 'system',
      content: `使用者 ${userData.rows[0].name || '未知用戶'} 已離開群組`,
    })

    await client.query(
      'INSERT INTO chat_messages (room_id, sender_id, message, is_system) VALUES ($1, $2, $3, true)',
      [roomId, 0, systemMessage]
    )

    const memberCount = await client.query(
      'SELECT COUNT(*) as count FROM group_members WHERE group_id = $1 AND status = $2',
      [groupInfo.rows[0].group_id, 'accepted']
    )

    await client.query('COMMIT')

    chatService.broadcastToRoom(roomId, {
      type: 'memberLeft',
      userId: userId,
      userName: userData.rows[0].name || '未知用戶',
      groupId: groupInfo.rows[0].group_id,
      memberCount: memberCount.rows[0].count,
      timestamp: new Date().toISOString(),
    })

    res.json({
      status: 'success',
      message: '已成功離開聊天室',
      data: { memberCount: memberCount.rows[0].count },
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('離開聊天室失敗:', error)
    res.status(500).json({
      status: 'error',
      message: error.message || '離開聊天室失敗',
    })
  } finally {
    client.release()
  }
})

router.get('/rooms/:roomId/messages', async (req, res) => {
  try {
    const { roomId } = req.params
    const userId = req.user.user_id
    const result = await chatController.getMessages(roomId, userId)
    res.json(result)
  } catch (error) {
    console.error('獲取聊天室訊息失敗:', error)
    res.status(500).json({
      status: 'error',
      message: error.message || '獲取聊天室訊息失敗',
    })
  }
})

router.post('/rooms/:roomId/messages', async (req, res) => {
  try {
    const { roomId } = req.params
    const { message } = req.body
    const userId = req.user.user_id
    const result = await chatController.sendMessage(userId, roomId, message)
    res.json(result)
  } catch (error) {
    console.error('發送訊息失敗:', error)
    res.status(500).json({
      status: 'error',
      message: error.message || '發送訊息失敗',
    })
  }
})

router.get('/requests/pending', async (req, res) => {
  try {
    const userId = req.user.user_id
    const result = await chatController.getPendingRequests(userId)
    res.json(result)
  } catch (error) {
    console.error('獲取待處理申請失敗:', error)
    res.status(500).json({
      status: 'error',
      message: error.message || '獲取待處理申請失敗',
    })
  }
})

router.get('/requests/history', async (req, res) => {
  try {
    const userId = req.user.user_id
    const requests = await chatController.getRequestHistory(userId)
    res.json(requests)
  } catch (error) {
    console.error('獲取申請歷史失敗:', error)
    res.status(500).json({
      status: 'error',
      message: error.message || '獲取申請歷史失敗',
    })
  }
})

router.patch('/requests/:requestId', async (req, res) => {
  try {
    const userId = req.user.user_id
    const { requestId } = req.params
    const { status } = req.body

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: '未授權的請求',
      })
    }

    if (!status || !['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: '無效的狀態值',
      })
    }

    const result = await chatController.handleGroupRequest(userId, {
      requestId: parseInt(requestId),
      status,
    })

    res.json(result)
  } catch (error) {
    console.error('處理群組申請失敗:', error)
    res.status(500).json({
      status: 'error',
      message: error.message || '處理群組申請失敗',
    })
  }
})

router.get('/users', async (req, res) => {
  const client = await db.connect()
  try {
    const users = await client.query(
      `SELECT 
       user_id,
       name,
       email,
       image_path,
       created_at
     FROM users 
     WHERE valid = 1`
    )

    res.json({
      status: 'success',
      data: users.rows.map((user) => ({
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        image: user.image_path,
        createdAt: user.created_at,
      })),
    })
  } catch (error) {
    console.error('獲取使用者列表錯誤:', error)
    res.status(500).json({
      status: 'error',
      message: '獲取使用者列表失敗',
    })
  } finally {
    client.release()
  }
})

router.get('/user/groups', async (req, res) => {
  try {
    const userId = req.user.user_id
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: '未授權的請求',
      })
    }

    const result = await chatController.getUserGroups(userId)
    res.json(result)
  } catch (error) {
    console.error('獲取使用者群組失敗:', error)
    res.status(500).json({
      status: 'error',
      message: error.message || '獲取使用者群組失敗',
    })
  }
})

router.use((error, req, res, next) => {
  console.error('Chat API Error:', error)
  res.status(500).json({
    status: 'error',
    message: error.message || '伺服器內部錯誤',
  })
})

export default router
