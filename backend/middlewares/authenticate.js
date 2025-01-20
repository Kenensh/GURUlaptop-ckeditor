// middlewares/authenticate.js
import jsonwebtoken from 'jsonwebtoken'
import 'dotenv/config.js'

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET

function authenticate(req, res, next) {
  console.log('Cookie:', req.cookies)
  console.log('Authorization header:', req.headers.authorization)
  try {
    // 檢查 token 來源
    const token =
      req.cookies.accessToken || req.headers.authorization?.split(' ')[1]

    if (!token) {
      console.log('No token provided')
      return res.status(401).json({
        status: 'error',
        message: '請先登入',
      })
    }

    try {
      const decoded = jsonwebtoken.verify(token, accessTokenSecret)

      if (!decoded.user_id) {
        console.error('Token missing user_id')
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

      console.log('User authenticated:', req.user.user_id)
      next()
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'error',
          message: '登入已過期，請重新登入',
        })
      }

      console.error('JWT verification failed:', jwtError)
      return res.status(401).json({
        status: 'error',
        message: '認證失敗，請重新登入',
      })
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return res.status(500).json({
      status: 'error',
      message: '系統錯誤',
    })
  }
}

// 匯出兩個版本
export { authenticate as default, authenticate as checkAuth }
