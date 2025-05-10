import jsonwebtoken from 'jsonwebtoken'
import 'dotenv/config.js'
import { pool } from '../configs/db.js'

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET
const isProduction = process.env.NODE_ENV === 'production'

const cookieConfig = {
  httpOnly: true,
  secure: isProduction, // 生產環境為 true，開發環境可為 false
  sameSite: isProduction ? 'none' : 'lax', // 在開發環境使用較寬鬆的設定
  domain: isProduction ? '.onrender.com' : undefined,
  path: '/',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30天
}

/**
 * 用戶身份驗證中間件
 * 驗證請求包含有效的訪問令牌，並設置 req.user 以供後續路由使用
 */
async function authenticate(req, res, next) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`[${requestId}] 開始進行身份驗證檢查`);

  try {
    // 嘗試從 cookie 或授權標頭獲取令牌
    const token = req.cookies?.accessToken || req.headers?.authorization?.split(' ')[1]
    
    if (!token) {
      console.log(`[${requestId}] 未找到訪問令牌`);
      res.setHeader('WWW-Authenticate', 'Bearer')
      return res.status(401).json({ status: 'error', message: '請先登入' })
    }

    try {
      // 驗證令牌
      const decoded = jsonwebtoken.verify(token, accessTokenSecret)
      
      if (!decoded || !decoded.user_id) {
        console.log(`[${requestId}] 無效的認證資訊: 缺少必要的用戶資訊`);
        return res.status(401).json({ status: 'error', message: '無效的認證資訊' })
      }

      // 檢查用戶是否在資料庫中存在且有效
      const userResult = await pool.query(
        'SELECT user_id, email, level, valid FROM users WHERE user_id = $1',
        [decoded.user_id]
      )
      
      // 用戶不存在或已被停用
      if (userResult.rows.length === 0 || !userResult.rows[0].valid) {
        console.log(`[${requestId}] 用戶不存在或已被停用: ${decoded.user_id}`);
        return res.status(401).json({ status: 'error', message: '無效的用戶' })
      }

      // 設置用戶資訊以供後續路由使用
      req.user = {
        user_id: decoded.user_id,
        email: decoded.email || userResult.rows[0].email,
        level: decoded.level || userResult.rows[0].level,
      }

      // 計算令牌剩餘時間並決定是否需要刷新
      const timeLeft = decoded.exp - Math.floor(Date.now() / 1000)
      const tokenAge = decoded.exp - decoded.iat

      // 如果令牌剩餘時間不足，生成新令牌
      if (timeLeft < tokenAge * 0.25) {
        console.log(`[${requestId}] 重新生成訪問令牌: ${decoded.user_id}`);
        const newToken = jsonwebtoken.sign(
          {
            user_id: decoded.user_id,
            email: decoded.email || userResult.rows[0].email,
            level: decoded.level || userResult.rows[0].level,
          },
          accessTokenSecret,
          { expiresIn: '30d' }
        )
        res.cookie('accessToken', newToken, cookieConfig)
      }

      console.log(`[${requestId}] 身份驗證成功: ${decoded.user_id}`);
      next()
    } catch (jwtError) {
      // 處理 JWT 特定錯誤
      const errorMessage = 
        jwtError.name === 'TokenExpiredError' ? '登入已過期' : 
        jwtError.name === 'JsonWebTokenError' ? '無效的認證令牌' : 
        '認證失敗'
      
      console.log(`[${requestId}] JWT 錯誤: ${jwtError.name} - ${errorMessage}`);
      return res.status(401).json({ 
        status: 'error', 
        message: errorMessage,
        code: jwtError.name
      })
    }
  } catch (error) {
    console.error(`[${requestId}] 認證過程中發生錯誤:`, error)
    return res.status(500).json({ 
      status: 'error', 
      message: '系統錯誤',
      details: isProduction ? undefined : error.message
    })
  }
}

export { authenticate as default, authenticate as checkAuth }
