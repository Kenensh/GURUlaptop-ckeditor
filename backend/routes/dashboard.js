import express from 'express'
import bodyParser from 'body-parser'
import { generateHash, compareHash } from '../db-helpers/password-hash.js'
import multer from 'multer'
const router = express.Router()
const upload = multer()
import { pool } from '../configs/db.js' // 改為引入 pool

router.get('/all', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT user_id, name, email, gender, phone, birthdate, level FROM users'
    )
    return res.json({
      status: 'success',
      data: { users: result.rows },
    })
  } catch (error) {
    console.error('無法取得資料:', error)
    return res.status(500).json({
      status: 'error',
      message: '系統錯誤',
    })
  }
})

router.get('/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params
    const result = await pool.query(
      `SELECT user_id, name, email, gender, phone, birthdate,
              country, city, district, road_name, detailed_address,
              image_path, remarks, level, valid
       FROM users 
       WHERE user_id = $1`,
      [user_id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: '找不到該用戶',
      })
    }

    const userData = result.rows[0]

    return res.json({
      status: 'success',
      data: userData,
    })
  } catch (error) {
    console.error('無法取得資料:', error)
    return res.status(500).json({
      status: 'error',
      message: '系統錯誤',
    })
  }
})

router.put('/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params
    const {
      name,
      gender,
      birthdate,
      phone,
      email,
      country,
      city,
      district,
      road_name,
      detailed_address,
      image_path,
      remarks,
      valid,
    } = req.body

    const result = await db.query(
      `UPDATE users 
      SET name=$1, birthdate=$2, phone=$3, gender=$4, country=$5, city=$6, 
          district=$7, road_name=$8, detailed_address=$9, image_path=$10, 
          remarks=$11, valid=$12 
      WHERE user_id=$13
      RETURNING *`,
      [
        name,
        birthdate,
        phone,
        gender,
        country,
        city,
        district,
        road_name,
        detailed_address,
        image_path,
        remarks,
        valid,
        user_id,
      ]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: '找不到該用戶' })
    }

    return res.json({ status: 'success', message: '更新成功' })
  } catch (error) {
    console.error('更新失敗:', error)
    return res.status(500).json({ status: 'error', message: '更新失敗' })
  }
})

router.put('/pwdCheck/:user_id', async (req, res) => {
  const { user_id } = req.params
  const { currentPassword } = req.body

  try {
    const users = await db.query(
      'SELECT password FROM users WHERE user_id = $1',
      [user_id]
    )
    if (users.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: '找不到該用戶' })
    }

    const hashedPassword = String(users.rows[0].password)
    const inputPassword = String(currentPassword)

    const isMatch = await compareHash(inputPassword, hashedPassword)
    if (!isMatch) {
      return res
        .status(400)
        .json({ status: 'error', message: '當前密碼不正確' })
    }

    return res.status(200).json({
      status: 'pwdmatch',
      message: '用戶在輸入框中輸入之密碼與原始密碼吻合',
    })
  } catch (error) {
    console.error('檢查密碼失敗:', error)
    return res.status(500).json({ status: 'error', message: '伺服器錯誤' })
  }
})

router.put('/:user_id/pwdReset', async (req, res) => {
  try {
    const { user_id } = req.params
    const { newPassword1, newPassword2 } = req.body

    if (!newPassword1 || !newPassword2) {
      return res.status(400).json({
        status: 'error',
        message: '缺少必要參數',
      })
    }

    const hashedPassword = await generateHash(newPassword2)

    const result = await db.query(
      'UPDATE users SET password = $1 WHERE user_id = $2 RETURNING *',
      [hashedPassword, user_id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: '找不到該用戶',
      })
    }

    return res.status(200).json({
      status: 'resetPwd success',
      message: '新密碼更新成功，記得記住新密碼',
    })
  } catch (error) {
    console.error('密碼更新失敗:', error)
    return res.status(500).json({
      status: 'error',
      message: '密碼更新失敗',
    })
  }
})

export default router
