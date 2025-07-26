import express from 'express'
import { checkAuth } from '../middlewares/authenticate.js'
import { pool } from '../configs/db.js'
const router = express.Router()

// 創建群組申請
router.post('/group-requests', checkAuth, async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { groupId, gameId, description } = req.body
    const senderId = req.user.user_id

    // 檢查群組是否存在
    const group = await client.query(
      'SELECT creator_id, group_name FROM "group" WHERE group_id = $1',
      [groupId]
    )

    if (group.rows.length === 0) {
      throw new Error('找不到該群組')
    }

    // 檢查是否已經是成員
    const existingMember = await client.query(
      'SELECT 1 FROM group_members WHERE group_id = $1 AND member_id = $2',
      [groupId, senderId]
    )

    if (existingMember.rows.length > 0) {
      throw new Error('您已經是群組成員')
    }

    // 檢查是否已有待處理申請
    const existingRequest = await client.query(
      'SELECT 1 FROM group_requests WHERE group_id = $1 AND sender_id = $2 AND status = $3',
      [groupId, senderId, 'pending']
    )

    if (existingRequest.rows.length > 0) {
      throw new Error('您已有待處理的申請')
    }

    // 新增申請記錄
    const requestResult = await client.query(
      `INSERT INTO group_requests 
       (group_id, sender_id, creator_id, game_id, description) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [groupId, senderId, group.rows[0].creator_id, gameId, description]
    )

    // 將申請通知儲存為私人訊息
    await client.query(
      `INSERT INTO messages 
       (sender_id, receiver_id, type, content, metadata) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        senderId,
        group.rows[0].creator_id,
        'group_request',
        '申請加入群組',
        JSON.stringify({
          requestId: requestResult.rows[0].id,
          groupId,
          gameId,
          description,
        }),
      ]
    )

    await client.query('COMMIT')

    res.json({
      status: 'success',
      data: { requestId: requestResult.rows[0].id },
    })
  } catch (error) {
    await client.query('ROLLBACK')
    res.status(400).json({
      status: 'error',
      message: error.message,
    })
  } finally {
    client.release()
  }
})

// 獲取群組的申請列表
router.get('/group-requests/:groupId', checkAuth, async (req, res) => {
  try {
    const { groupId } = req.params
    const userId = req.user.user_id

    const requests = await pool.query(
      `SELECT gr.*, u.name as sender_name 
       FROM group_requests gr
       JOIN users u ON gr.sender_id = u.user_id
       WHERE gr.group_id = $1 AND gr.status = $2
       ORDER BY gr.created_at DESC`,
      [groupId, 'pending']
    )

    res.json({
      status: 'success',
      data: requests.rows,
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '獲取申請列表失敗',
    })
  }
})

// 處理申請
router.patch('/group-requests/:requestId', checkAuth, async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { requestId } = req.params
    const { status } = req.body
    const userId = req.user.user_id

    // 獲取申請詳情
    const request = await client.query(
      `SELECT gr.*, g.chat_room_id
       FROM group_requests gr
       JOIN "group" g ON gr.group_id = g.group_id
       WHERE gr.id = $1 AND gr.status = $2`,
      [requestId, 'pending']
    )

    if (request.rows.length === 0) {
      throw new Error('找不到該申請或已處理')
    }

    if (request.rows[0].creator_id !== userId) {
      throw new Error('只有群組創建者可以處理申請')
    }

    // 更新申請狀態
    await client.query(
      'UPDATE group_requests SET status = $1 WHERE id = $2',
      [status, requestId]
    )

    if (status === 'accepted') {
      // 加入群組成員
      await client.query(
        'INSERT INTO group_members (group_id, member_id, status) VALUES ($1, $2, $3)',
        [request.rows[0].group_id, request.rows[0].sender_id, 'accepted']
      )

      // 加入聊天室成員
      if (request.rows[0].chat_room_id) {
        await client.query(
          'INSERT INTO chat_room_members (room_id, user_id) VALUES ($1, $2)',
          [request.rows[0].chat_room_id, request.rows[0].sender_id]
        )
      }
    }

    // 儲存申請結果訊息
    await client.query(
      `INSERT INTO messages 
       (sender_id, receiver_id, type, content, metadata) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        userId,
        request.rows[0].sender_id,
        'group_request_response',
        status === 'accepted' ? '您的入團申請已被接受' : '您的入團申請已被拒絕',
        JSON.stringify({
          requestId,
          groupId: request.rows[0].group_id,
          status,
        }),
      ]
    )

    await client.query('COMMIT')

    res.json({
      status: 'success',
      message: status === 'accepted' ? '已接受申請' : '已拒絕申請',
    })
  } catch (error) {
    await client.query('ROLLBACK')
    res.status(400).json({
      status: 'error',
      message: error.message,
    })
  } finally {
    client.release()
  }
})

export default router
