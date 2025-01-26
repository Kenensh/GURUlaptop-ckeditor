import jsonwebtoken from 'jsonwebtoken'
import 'dotenv/config.js'

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET
const isProduction = process.env.NODE_ENV === 'production'

const cookieConfig = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  domain: isProduction ? '.onrender.com' : undefined,
  path: '/',
  maxAge: 30 * 24 * 60 * 60 * 1000,
}

function authenticate(req, res, next) {
  const requestId = Math.random().toString(36).substring(7)

  try {
    const token =
      req.cookies.accessToken || req.headers.authorization?.split(' ')[1]
    // middlewares/authenticate.js
    if (!token) {
      res.setHeader('WWW-Authenticate', 'Bearer')
      return res.status(401).json({ status: 'error', message: '請先登入' })
    }

    try {
      const decoded = jsonwebtoken.verify(token, accessTokenSecret)
      if (!decoded.user_id) {
        return res
          .status(401)
          .json({ status: 'error', message: '無效的認證資訊' })
      }

      req.user = {
        user_id: decoded.user_id,
        email: decoded.email,
        level: decoded.level,
      }

      const timeLeft = decoded.exp - Math.floor(Date.now() / 1000)
      const tokenAge = decoded.exp - decoded.iat

      if (timeLeft < tokenAge * 0.25) {
        const newToken = jsonwebtoken.sign(
          {
            user_id: decoded.user_id,
            email: decoded.email,
            level: decoded.level,
          },
          accessTokenSecret,
          { expiresIn: '30d' }
        )
        res.cookie('accessToken', newToken, cookieConfig)
      }

      next()
    } catch (jwtError) {
      const errorMessage =
        jwtError.name === 'TokenExpiredError' ? '登入已過期' : '認證失敗'
      return res.status(401).json({ status: 'error', message: errorMessage })
    }
  } catch (error) {
    console.error(`[${requestId}] 認證錯誤:`, error)
    return res.status(500).json({ status: 'error', message: '系統錯誤' })
  }
}

export { authenticate as default, authenticate as checkAuth }
