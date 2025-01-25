import jsonwebtoken from 'jsonwebtoken'
import 'dotenv/config.js'

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET
const isProduction = process.env.NODE_ENV === 'production'

const cookieConfig = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  path: '/',
  domain: isProduction ? '.onrender.com' : undefined,
  maxAge: 30 * 24 * 60 * 60 * 1000,
}

function authenticate(req, res, next) {
  res.setHeader('Access-Control-Expose-Headers', 'Set-Cookie')
  res.setHeader('Cache-Control', 'no-store')
  const requestId = Math.random().toString(36).substring(7)
  console.log(`[${requestId}] 認證檢查:`, {
    cookies: req.cookies,
    headers: {
      cookie: req.headers.cookie,
      authorization: req.headers.authorization,
    },
  })

  try {
    const token =
      req.cookies.accessToken || req.headers.authorization?.split(' ')[1]
    if (!token)
      return res.status(401).json({ status: 'error', message: '請先登入' })

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

      // Token 刷新
      const tokenAge = decoded.exp - decoded.iat
      const timeLeft = decoded.exp - Math.floor(Date.now() / 1000)

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
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ status: 'error', message: '登入已過期' })
      }
      return res.status(401).json({ status: 'error', message: '認證失敗' })
    }
  } catch (error) {
    return res.status(500).json({ status: 'error', message: '系統錯誤' })
  }
}

// 匯出兩個版本
export { authenticate as default, authenticate as checkAuth }
