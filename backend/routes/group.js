import express from 'express'
const router = express.Router()
import multer from 'multer'
import path from 'path'
import { pool } from '../configs/db.js'
import { fileURLToPath } from 'url'
import fs from 'fs'
import cors from 'cors'
import { checkAuth } from '../middlewares/authenticate.js'
import 'dotenv/config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 設定上傳目錄
const uploadDir = path.join(__dirname, '../public/uploads/groups')
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }
} catch (error) {
  console.error('建立上傳目錄失敗:', error)
}

// 設定 CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}
router.use(cors(corsOptions))

// 設定 multer (保持不變)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, 'group-' + uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/
    const mimetype = allowedTypes.test(file.mimetype)
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    )

    if (mimetype && extname) {
      return cb(null, true)
    }
    cb(new Error('只允許上傳 .jpg, .jpeg, .png, .gif 格式的圖片'))
  },
})

// GET - 取得所有群組
router.get('/all', async function (req, res) {
  const client = await pool.connect()
  try {
    const groupsResult = await client.query(`
      SELECT g.*, u.name as creator_name, 
             COUNT(DISTINCT gm.member_id) as member_count,
             e.event_name 
      FROM "group" g
      LEFT JOIN users u ON g.creator_id = u.user_id
      LEFT JOIN group_members gm ON g.group_id = gm.group_id
      LEFT JOIN event_type e ON g.event_id = e.event_id
      GROUP BY g.group_id, u.name, e.event_name
      ORDER BY g.creat_time DESC
    `)

    return res.json({
      status: 'success',
      data: { groups: groupsResult.rows },
    })
  } catch (error) {
    console.error('獲取群組失敗:', error)
    return res.json({
      status: 'error',
      message: '獲取群組失敗',
    })
  } finally {
    client.release()
  }
})

// GET - 獲取所有活動的揪團
router.get('/events', async function (req, res) {
  const client = await pool.connect()
  try {
    const eventsResult = await client.query(`
      SELECT DISTINCT e.event_id, e.event_name 
      FROM "group" g 
      JOIN event_type e ON g.event_id = e.event_id
      WHERE g.event_id IS NOT NULL
      GROUP BY e.event_id, e.event_name
      HAVING COUNT(g.group_id) > 0
      ORDER BY e.event_start_time DESC
    `)

    return res.json({
      status: 'success',
      data: { events: eventsResult.rows },
    })
  } catch (error) {
    console.error('獲取活動揪團失敗:', error)
    return res.status(500).json({
      status: 'error',
      message: '獲取活動揪團失敗',
    })
  } finally {
    client.release()
  }
})

// GET - 獲取使用者參與的群組
router.get('/user', checkAuth, async function (req, res) {
  const client = await pool.connect()
  try {
    const groupsResult = await client.query(
      `
      SELECT g.*, 
             u.name as creator_name, 
             (SELECT COUNT(*) FROM group_members WHERE group_id = g.group_id AND status = 'accepted') as member_count
      FROM group_members gm
      JOIN "group" g ON gm.group_id = g.group_id
      JOIN users u ON g.creator_id = u.user_id
      WHERE gm.member_id = $1 AND gm.status = 'accepted'
      GROUP BY g.group_id, u.name
      ORDER BY g.creat_time DESC
    `,
      [req.user.user_id]
    )

    return res.json({
      status: 'success',
      data: { groups: groupsResult.rows },
    })
  } catch (error) {
    console.error('獲取使用者群組失敗:', error)
    return res.status(500).json({
      status: 'error',
      message: '獲取使用者群組失敗',
    })
  } finally {
    client.release()
  }
})

// GET - 獲取使用者創建的群組
router.get('/creator', checkAuth, async function (req, res) {
  const client = await pool.connect()
  try {
    const groupsResult = await client.query(
      `
      SELECT g.*, 
             u.name as creator_name, 
             (SELECT COUNT(*) FROM group_members WHERE group_id = g.group_id AND status = 'accepted') as member_count
      FROM "group" g
      LEFT JOIN users u ON g.creator_id = u.user_id
      WHERE g.creator_id = $1
      GROUP BY g.group_id, u.name
      ORDER BY g.creat_time DESC
    `,
      [req.user.user_id]
    )

    return res.json({
      status: 'success',
      data: { groups: groupsResult.rows },
    })
  } catch (error) {
    console.error('獲取創建群組失敗:', error)
    return res.status(500).json({
      status: 'error',
      message: '獲取創建群組失敗',
    })
  } finally {
    client.release()
  }
})

// GET - 取得單一群組
router.get('/:id', async function (req, res) {
  const client = await pool.connect()
  try {
    const groupsResult = await client.query(
      `SELECT g.*, 
             (SELECT COUNT(*) FROM group_members WHERE group_id = g.group_id AND status = 'accepted') as member_count,
             u.name as creator_name
      FROM "group" g
      LEFT JOIN users u ON g.creator_id = u.user_id
      WHERE g.group_id = $1`,
      [req.params.id]
    )

    if (groupsResult.rows.length === 0) {
      return res.json({
        status: 'error',
        message: '找不到群組',
      })
    }

    // 獲取群組成員及其申請資訊
    const membersResult = await client.query(
      `SELECT u.user_id, u.name, u.image_path, gm.status, gm.join_time,
              gr.game_id, gr.description
       FROM group_members gm
       JOIN users u ON gm.member_id = u.user_id
       LEFT JOIN (
         SELECT * FROM group_requests 
         WHERE status = 'accepted'
       ) gr ON gr.group_id = gm.group_id AND gr.sender_id = gm.member_id
       WHERE gm.group_id = $1 AND gm.status = 'accepted'`,
      [req.params.id]
    )

    const group = groupsResult.rows[0]
    group.members = membersResult.rows

    return res.json({
      status: 'success',
      data: { group },
    })
  } catch (error) {
    console.error('獲取群組失敗:', error)
    return res.json({
      status: 'error',
      message: '獲取群組失敗',
    })
  } finally {
    client.release()
  }
})

// POST - 建立新群組
router.post('/', checkAuth, upload.single('group_img'), async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const creator_id = req.user.user_id
    const { group_name, description, max_members, group_time, event_id } =
      req.body
    const group_img = req.file ? `/uploads/groups/${req.file.filename}` : ''

    // 驗證必要欄位
    if (!group_name?.trim()) {
      throw new Error('群組名稱為必填欄位')
    }
    if (!description?.trim()) {
      throw new Error('群組描述為必填欄位')
    }
    if (!max_members) {
      throw new Error('人數上限為必填欄位')
    }
    if (!group_time) {
      throw new Error('活動時間為必填欄位')
    }

    // 驗證活動時間不能早於現在
    const selectedTime = new Date(group_time)
    const now = new Date()
    if (selectedTime < now) {
      throw new Error('活動時間不能早於現在')
    }

    const maxMembersNum = parseInt(max_members, 10)
    if (isNaN(maxMembersNum) || maxMembersNum < 2) {
      throw new Error('人數上限必須大於等於 2')
    }

    // 驗證長度
    if (group_name.trim().length > 20) {
      throw new Error('群組名稱不能超過20字')
    }
    if (description.trim().length > 500) {
      throw new Error('群組描述不能超過500字')
    }

    // 建立聊天室
    const chatRoomResult = await client.query(
      'INSERT INTO chat_rooms (name, creator_id) VALUES ($1, $2) RETURNING id',
      [group_name.trim(), creator_id]
    )

    // 新增群組
    const groupResult = await client.query(
      'INSERT INTO "group" (group_name, description, creator_id, max_members, group_img, chat_room_id, creat_time, group_time, event_id) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8) RETURNING group_id',
      [
        group_name.trim(),
        description.trim(),
        creator_id,
        maxMembersNum,
        group_img,
        chatRoomResult.rows[0].id,
        group_time,
        event_id || null,
      ]
    )

    if (!groupResult.rows[0]) {
      throw new Error('群組建立失敗')
    }

    // 加入創建者為成員
    await client.query(
      'INSERT INTO group_members (group_id, member_id, join_time, status) VALUES ($1, $2, NOW(), $3)',
      [groupResult.rows[0].group_id, creator_id, 'accepted']
    )

    // 將創建者加入聊天室
    await client.query(
      'INSERT INTO chat_room_members (room_id, user_id) VALUES ($1, $2)',
      [chatRoomResult.rows[0].id, creator_id]
    )

    await client.query('COMMIT')

    res.json({
      status: 'success',
      message: '群組建立成功',
      data: {
        group_id: groupResult.rows[0].group_id,
        chat_room_id: chatRoomResult.rows[0].id,
        group_name: group_name.trim(),
        description: description.trim(),
        creator_id,
        max_members: maxMembersNum,
        group_img: group_img || null,
        group_time,
      },
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error in group creation:', error)

    if (req.file) {
      try {
        fs.unlinkSync(path.join(uploadDir, req.file.filename))
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError)
      }
    }

    res.status(400).json({
      status: 'error',
      message: error.message || '建立群組失敗',
    })
  } finally {
    client.release()
  }
})

// PUT - 更新群組
router.put('/:id', checkAuth, upload.single('group_img'), async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const groupId = req.params.id

    // 檢查群組是否存在及使用者權限
    const groupResult = await client.query(
      'SELECT * FROM "group" WHERE group_id = $1',
      [groupId]
    )

    if (groupResult.rows.length === 0) {
      throw new Error('找不到群組')
    }

    if (groupResult.rows[0].creator_id !== req.user.user_id) {
      throw new Error('只有群組創建者可以修改群組資料')
    }

    const { group_name, description, max_members } = req.body
    const updates = []
    const values = []
    let paramCount = 1

    if (group_name) {
      updates.push(`group_name = $${paramCount}`)
      values.push(group_name.trim())
      paramCount++
    }
    if (description) {
      updates.push(`description = $${paramCount}`)
      values.push(description.trim())
      paramCount++
    }
    if (max_members) {
      updates.push(`max_members = $${paramCount}`)
      values.push(parseInt(max_members))
      paramCount++
    }
    if (req.file) {
      updates.push(`group_img = $${paramCount}`)
      values.push(`/uploads/groups/${req.file.filename}`)
      paramCount++

      // 刪除舊圖片
      if (groupResult.rows[0].group_img) {
        const oldImagePath = path.join(
          __dirname,
          '../public',
          groupResult.rows[0].group_img
        )
        fs.promises.unlink(oldImagePath).catch((err) => {
          console.error('Error deleting old image:', err)
        })
      }
    }

    if (updates.length > 0) {
      values.push(groupId)
      const updateResult = await client.query(
        `UPDATE "group" SET ${updates.join(', ')} WHERE group_id = $${paramCount} RETURNING *`,
        values
      )

      await client.query('COMMIT')

      return res.json({
        status: 'success',
        data: { group: updateResult.rows[0] },
      })
    }

    await client.query('COMMIT')
    return res.json({
      status: 'success',
      data: { group: groupResult.rows[0] },
    })
  } catch (error) {
    await client.query('ROLLBACK')

    if (req.file) {
      try {
        fs.unlinkSync(path.join(uploadDir, req.file.filename))
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError)
      }
    }

    return res.status(400).json({
      status: 'error',
      message: error.message || '更新群組失敗',
    })
  } finally {
    client.release()
  }
})

// DELETE - 刪除群組
router.delete('/:id', checkAuth, async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const groupResult = await client.query(
      'SELECT * FROM "group" WHERE group_id = $1',
      [req.params.id]
    )

    if (groupResult.rows.length === 0) {
      throw new Error('找不到群組')
    }

    if (groupResult.rows[0].creator_id !== req.user.user_id) {
      throw new Error('只有群組創建者可以刪除群組')
    }

    // 刪除群組圖片
    if (groupResult.rows[0].group_img) {
      const imagePath = path.join(
        __dirname,
        '../public',
        groupResult.rows[0].group_img
      )
      try {
        await fs.promises.unlink(imagePath)
      } catch (err) {
        console.error('Error deleting group image:', err)
      }
    }

    // 刪除群組成員記錄
    await client.query('DELETE FROM group_members WHERE group_id = $1', [
      req.params.id,
    ])

    // 刪除群組
    await client.query('DELETE FROM "group" WHERE group_id = $1', [
      req.params.id,
    ])

    await client.query('COMMIT')

    return res.json({
      status: 'success',
      message: '群組已刪除',
    })
  } catch (error) {
    await client.query('ROLLBACK')

    return res.status(400).json({
      status: 'error',
      message: error.message || '刪除群組失敗',
    })
  } finally {
    client.release()
  }
})

router.post('/requests', checkAuth, async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { groupId, gameId, description } = req.body
    const senderId = req.user.user_id

    // 檢查群組是否存在
    const groupResult = await client.query(
      'SELECT creator_id, group_name FROM "group" WHERE group_id = $1',
      [groupId]
    )

    if (groupResult.rows.length === 0) {
      throw new Error('找不到該群組')
    }

    // 檢查是否已經是成員
    const memberResult = await client.query(
      'SELECT 1 FROM group_members WHERE group_id = $1 AND member_id = $2',
      [groupId, senderId]
    )

    if (memberResult.rows.length > 0) {
      throw new Error('您已經是群組成員')
    }

    // 檢查是否已有待處理的申請
    const requestResult = await client.query(
      'SELECT 1 FROM group_requests WHERE group_id = $1 AND sender_id = $2 AND status = $3',
      [groupId, senderId, 'pending']
    )

    if (requestResult.rows.length > 0) {
      throw new Error('您已有待處理的申請')
    }

    // 新增申請記錄
    const newRequest = await client.query(
      `INSERT INTO group_requests 
       (group_id, sender_id, creator_id, game_id, description) 
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [groupId, senderId, groupResult.rows[0].creator_id, gameId, description]
    )

    await client.query('COMMIT')

    res.json({
      status: 'success',
      message: '申請已送出',
      data: { requestId: newRequest.rows[0].id },
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('發送群組申請錯誤:', error)
    res.status(400).json({
      status: 'error',
      message: error.message || '發送申請失敗',
    })
  } finally {
    client.release()
  }
})

// 處理群組申請
router.patch('/requests/:requestId', checkAuth, async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { requestId } = req.params
    const { status } = req.body // 'accepted' or 'rejected'
    const userId = req.user.user_id

    // 獲取申請詳情
    const requestResult = await client.query(
      `SELECT gr.*, g.chat_room_id
       FROM group_requests gr
       JOIN "group" g ON gr.group_id = g.group_id
       WHERE gr.id = $1 AND gr.status = 'pending'`,
      [requestId]
    )

    if (requestResult.rows.length === 0) {
      throw new Error('找不到該申請或已處理')
    }

    const request = requestResult.rows[0]
    if (request.creator_id !== userId) {
      throw new Error('只有群組創建者可以處理申請')
    }

    // 更新申請狀態
    await client.query('UPDATE group_requests SET status = $1 WHERE id = $2', [
      status,
      requestId,
    ])

    if (status === 'accepted') {
      // 加入群組成員
      await client.query(
        'INSERT INTO group_members (group_id, member_id, status) VALUES ($1, $2, $3)',
        [request.group_id, request.sender_id, 'accepted']
      )

      // 如果有聊天室，也加入聊天室成員
      if (request.chat_room_id) {
        await client.query(
          'INSERT INTO chat_room_members (room_id, user_id) VALUES ($1, $2)',
          [request.chat_room_id, request.sender_id]
        )
      }
    }

    await client.query('COMMIT')

    res.json({
      status: 'success',
      message: status === 'accepted' ? '已接受申請' : '已拒絕申請',
      data: { status },
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('處理群組申請錯誤:', error)
    res.status(400).json({
      status: 'error',
      message: error.message || '處理申請失敗',
    })
  } finally {
    client.release()
  }
})

// 獲取群組申請列表
router.get('/requests/:groupId', checkAuth, async (req, res) => {
  const client = await pool.connect()
  try {
    const { groupId } = req.params
    const userId = req.user.user_id

    // 驗證訪問權限
    const groupResult = await client.query(
      'SELECT 1 FROM "group" WHERE group_id = $1 AND creator_id = $2',
      [groupId, userId]
    )

    if (groupResult.rows.length === 0) {
      return res.status(403).json({
        status: 'error',
        message: '無權訪問該群組的申請列表',
      })
    }

    // 獲取申請列表
    const requestsResult = await client.query(
      `SELECT gr.*, u.name as sender_name, u.image_path as sender_image
       FROM group_requests gr
       JOIN users u ON gr.sender_id = u.user_id
       WHERE gr.group_id = $1
       ORDER BY gr.created_at DESC`,
      [groupId]
    )

    res.json({
      status: 'success',
      data: requestsResult.rows,
    })
  } catch (error) {
    console.error('獲取群組申請列表錯誤:', error)
    res.status(500).json({
      status: 'error',
      message: '獲取申請列表失敗',
    })
  } finally {
    client.release()
  }
})

export default router
