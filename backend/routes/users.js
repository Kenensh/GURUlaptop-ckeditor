import express from 'express'
const router = express.Router()

// 中介軟體，存取隱私會員資料用
import authenticate from '#middlewares/authenticate.js'

// 檢查空物件, 轉換req.params為數字
import { getIdParam } from '#db-helpers/db-tool.js'

// 資料庫使用
import { Op } from 'sequelize'
import sequelize from '#configs/db.js'
const { User } = sequelize.models

// 驗証加密密碼字串用
import { compareHash } from '#db-helpers/password-hash.js'

// 上傳檔案用使用multer
import path from 'path'
import multer from 'multer'

import db from '../configs/db.js' // 改為 PostgreSQL 連線

// multer 設定
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'public/avatar/')
  },
  filename: (req, file, callback) => {
    const newFilename = req.user.id
    callback(null, newFilename + path.extname(file.originalname))
  },
})
const upload = multer({ storage: storage })

// GET - 得到所有會員資料
router.get('/', async function (req, res) {
  const users = await User.findAll({ logging: console.log })
  return res.json({ status: 'success', data: { users } })
})

// GET - 得到單筆資料
router.get('/:id', authenticate, async function (req, res) {
  const id = getIdParam(req)

  if (req.user.id !== id) {
    return res.json({ status: 'error', message: '存取會員資料失敗' })
  }

  const user = await User.findByPk(id, {
    raw: true,
  })

  delete user.password

  return res.json({ status: 'success', data: { user } })
})

// POST - 新增會員資料
router.post('/', async function (req, res) {
  const newUser = req.body

  if (
    !newUser.username ||
    !newUser.email ||
    !newUser.name ||
    !newUser.password
  ) {
    return res.json({ status: 'error', message: '缺少必要資料' })
  }

  const [user, created] = await User.findOrCreate({
    where: {
      [Op.or]: [{ username: newUser.username }, { email: newUser.email }],
    },
    defaults: {
      name: newUser.name,
      password: newUser.password,
      username: newUser.username,
      email: newUser.email,
    },
  })

  if (!created) {
    return res.json({ status: 'error', message: '建立會員失敗' })
  }

  return res.status(201).json({
    status: 'success',
    data: null,
  })
})

// POST - 上傳大頭貼
router.post(
  '/upload-avatar',
  authenticate,
  upload.single('avatar'),
  async function (req, res) {
    if (req.file) {
      const id = req.user.id
      const data = { avatar: req.file.filename }

      const [affectedRows] = await User.update(data, {
        where: { id },
      })

      if (!affectedRows) {
        return res.json({
          status: 'error',
          message: '更新失敗或沒有資料被更新',
        })
      }

      return res.json({
        status: 'success',
        data: { avatar: req.file.filename },
      })
    } else {
      return res.json({ status: 'fail', data: null })
    }
  }
)

// PUT - 更新會員密碼
router.put('/:id/password', authenticate, async function (req, res) {
  const id = getIdParam(req)

  if (req.user.id !== id) {
    return res.json({ status: 'error', message: '存取會員資料失敗' })
  }

  const userPassword = req.body

  if (!id || !userPassword.origin || !userPassword.new) {
    return res.json({ status: 'error', message: '缺少必要資料' })
  }

  const dbUser = await User.findByPk(id, {
    raw: true,
  })

  if (!dbUser) {
    return res.json({ status: 'error', message: '使用者不存在' })
  }

  const isValid = await compareHash(userPassword.origin, dbUser.password)

  if (!isValid) {
    return res.json({ status: 'error', message: '密碼錯誤' })
  }

  const [affectedRows] = await User.update(
    { password: userPassword.new },
    {
      where: { id },
      individualHooks: true,
    }
  )

  if (!affectedRows) {
    return res.json({ status: 'error', message: '更新失敗' })
  }

  return res.json({ status: 'success', data: null })
})

// PUT - 更新會員資料
router.put('/:id/profile', authenticate, async function (req, res) {
  const id = getIdParam(req)

  if (req.user.id !== id) {
    return res.json({ status: 'error', message: '存取會員資料失敗' })
  }

  const user = req.body

  if (!id || !user.name) {
    return res.json({ status: 'error', message: '缺少必要資料' })
  }

  const dbUser = await User.findByPk(id, {
    raw: true,
  })

  if (!dbUser) {
    return res.json({ status: 'error', message: '使用者不存在' })
  }

  if (!user.birth_date) {
    delete user.birth_date
  }

  const [affectedRows] = await User.update(user, {
    where: { id },
  })

  if (!affectedRows) {
    return res.json({ status: 'error', message: '更新失敗或沒有資料被更新' })
  }

  const updatedUser = await User.findByPk(id, {
    raw: true,
  })

  delete updatedUser.password

  return res.json({ status: 'success', data: { user: updatedUser } })
})

// DELETE - 刪除會員
router.delete('/:id', async function (req, res) {
  const id = getIdParam(req)

  const affectedRows = await User.destroy({
    where: { id },
  })

  if (!affectedRows) {
    return res.json({
      status: 'fail',
      message: 'Unable to delete.',
    })
  }

  return res.json({ status: 'success', data: null })
})

// === 聊天室相關路由 ===
// 獲取所有使用者
router.get('/chat/users', async (req, res) => {
  try {
    const result = await db.query(`
     SELECT 
       user_id, 
       name, 
       email, 
       image_path,
       created_at
     FROM users 
     WHERE valid = 1
   `)

    res.json({
      status: 'success',
      data: result.rows.map((user) => ({
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        image: user.image_path,
        createdAt: user.created_at,
        online: false,
      })),
    })
  } catch (error) {
    console.error('獲取使用者列表錯誤:', error)
    res.status(500).json({
      status: 'error',
      message: '獲取使用者列表失敗',
    })
  }
})

// 獲取單一使用者
router.get('/chat/users/:userId', authenticate, async function (req, res) {
  try {
    const { userId } = req.params
    const result = await db.query(
      'SELECT user_id, name, email, image_path, created_at FROM users WHERE user_id = $1 AND valid = 1',
      [userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: '找不到該使用者',
      })
    }

    const user = result.rows[0]
    res.json({
      status: 'success',
      data: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        image: user.image_path,
        created_at: user.created_at,
      },
    })
  } catch (error) {
    console.error('獲取使用者資料錯誤:', error)
    res.status(500).json({
      status: 'error',
      message: '獲取使用者資料失敗',
    })
  }
})

// 獲取使用者在線狀態
router.get('/chat/users/status', authenticate, async function (req, res) {
  try {
    res.json({
      status: 'success',
      data: {},
    })
  } catch (error) {
    console.error('獲取使用者在線狀態錯誤:', error)
    res.status(500).json({
      status: 'error',
      message: '獲取使用者在線狀態失敗',
    })
  }
})

export default router
