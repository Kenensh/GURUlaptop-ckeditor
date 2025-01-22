import jsonwebtoken from 'jsonwebtoken'
import 'dotenv/config.js'

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET
const isProduction = process.env.NODE_ENV === 'production'

function authenticate(req, res, next) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`[${requestId}] 開始認證檢查`)
  console.log(`[${requestId}] Cookie:`, req.cookies)
  console.log(`[${requestId}] Authorization header:`, req.headers.authorization)

  try {
    // 檢查 token 來源
    const token =
      req.cookies.accessToken || req.headers.authorization?.split(' ')[1]

    if (!token) {
      console.log(`[${requestId}] No token provided`)
      return res.status(401).json({
        status: 'error',
        message: '請先登入',
      })
    }

    try {
      const decoded = jsonwebtoken.verify(token, accessTokenSecret)

      if (!decoded.user_id) {
        console.error(`[${requestId}] Token missing user_id`)
        return res.status(401).json({
          status: 'error',
          message: '無效的認證資訊',
        })
      }

      req.user = {
        user_id: decoded.user_id,
        email: decoded.email,
        level: decoded.level,
      }

      // 添加 token 刷新邏輯
      const tokenAge = decoded.exp - decoded.iat
      const timeLeft = decoded.exp - Math.floor(Date.now() / 1000)

      // 如果 token 剩餘時間少於總時間的 25%，則刷新
      if (timeLeft < tokenAge * 0.25) {
        const newToken = jsonwebtoken.sign(
          {
            user_id: decoded.user_id,
            email: decoded.email,
            level: decoded.level,
          },
          accessTokenSecret,
          { expiresIn: '3d' }
        )

        res.cookie('accessToken', newToken, {
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? 'none' : 'lax',
          path: '/',
          domain: isProduction ? '.onrender.com' : 'localhost',
          maxAge: 3 * 24 * 60 * 60 * 1000,
        })
      }

      console.log(`[${requestId}] User authenticated:`, req.user.user_id)
      next()
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'error',
          message: '登入已過期，請重新登入',
        })
      }

      console.error(`[${requestId}] JWT verification failed:`, jwtError)
      return res.status(401).json({
        status: 'error',
        message: '認證失敗，請重新登入',
      })
    }
  } catch (error) {
    console.error(`[${requestId}] Authentication error:`, error)
    return res.status(500).json({
      status: 'error',
      message: '系統錯誤',
      details: isProduction ? null : error.message,
    })
  }
}

// 匯出兩個版本
export { authenticate as default, authenticate as checkAuth }
