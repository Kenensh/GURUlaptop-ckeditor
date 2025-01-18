import express from 'express'
import { pool } from '#configs/db.js' // 使用 #configs 別名
import multer from 'multer'
import cors from 'cors'

const router = express.Router()

const upload = multer({
  storage: multer.diskStorage({
    destination: 'public/blog-images',
    filename: (req, file, cb) => {
      cb(null, `${file.originalname}`)
    },
  }),
})

// CORS 配置
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://localhost:9000',
    'https://gurulaptop-ckeditor-frontend.onrender.com',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}

// 在現有的 multer 配置之後，添加新的上傳路由
router.post(
  '/upload-image', // 移除多餘的 /api 前綴
  upload.single('upload'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          status: 'error',
          message: '沒有接收到檔案',
        })
      }

      const fileUrl = `/blog-images/${req.file.originalname}`
      console.log('File uploaded successfully:', fileUrl)

      res.json({
        uploaded: 1,
        fileName: req.file.originalname,
        url: fileUrl,
      })
    } catch (error) {
      console.error('Upload error:', error)
      res.status(500).json({
        status: 'error',
        message: '檔案上傳失敗',
      })
    }
  }
)
router.get('/search', async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 6
  const { search = '', types = '', brands = '' } = req.query
  const offset = (page - 1) * limit

  try {
    let whereConditions = ['blog_valid_value = 1']
    let params = []
    let paramIndex = 1

    if (search.trim()) {
      whereConditions.push(
        `(blog_content ILIKE $${paramIndex} OR blog_title ILIKE $${paramIndex})`
      )
      params.push(`%${search.trim()}%`)
      paramIndex++
    }

    if (types.trim()) {
      const typeArray = types.split(',').filter(Boolean)
      if (typeArray.length) {
        whereConditions.push(`blog_type = ANY($${paramIndex}::text[])`)
        params.push(typeArray)
        paramIndex++
      }
    }

    if (brands.trim()) {
      const brandArray = brands.split(',').filter(Boolean)
      if (brandArray.length) {
        whereConditions.push(`blog_brand = ANY($${paramIndex}::text[])`)
        params.push(brandArray)
        paramIndex++
      }
    }

    const whereClause = whereConditions.length
      ? `WHERE ${whereConditions.join(' AND ')}`
      : ''

    const queryParams = [...params, limit, offset]
    const query = {
      text: `
        WITH filtered_blogs AS (
          SELECT * FROM blogoverview 
          ${whereClause}
        )
        SELECT 
          fb.*,
          COUNT(*) OVER() as total_count
        FROM filtered_blogs fb
        ORDER BY blog_created_date DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `,
      values: queryParams,
    }

    const result = await pool.query(query)
    const blogs = result.rows.map(({ total_count, ...blog }) => blog)
    const total = result.rows[0]?.total_count || 0

    res.json({
      blogs,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: '搜尋失敗，請稍後再試',
    })
  }
})

router.get('/blog/ckeitor', async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 2
  const offset = (page - 1) * limit

  try {
    // 組合 WHERE 子句
    const whereClause = 'WHERE blog_valid_value = 1'

    // 查詢語句
    const dataQuery = {
      text: `
        SELECT * FROM blogoverview 
        ${whereClause}
        ORDER BY blog_created_date DESC 
        LIMIT $1 OFFSET $2
      `,
      values: [limit, offset],
    }

    const countQuery = {
      text: `SELECT COUNT(*) FROM blogoverview ${whereClause}`,
      values: [],
    }

    // 執行查詢
    const [countResult, blogsResult] = await Promise.all([
      pool.query(countQuery),
      pool.query(dataQuery),
    ])

    // 回傳結果
    res.json({
      blogs: blogsResult.rows,
      total: parseInt(countResult.rows[0].count),
    })
  } catch (error) {
    console.error('Latest blogs error:', error)
    console.error('Query details:', {
      message: error.message,
      code: error.code,
      query: error.query,
      parameters: error.parameters,
    })
    res.status(500).json({ message: '伺服器錯誤' })
  }
})

router.get('/blogcardgroup', async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 6
  const offset = (page - 1) * limit

  try {
    // 組合 WHERE 子句
    const whereClause = 'WHERE blog_valid_value = 1'

    // 查詢語句
    const dataQuery = {
      text: `
        SELECT * FROM blogoverview 
        ${whereClause}
        ORDER BY blog_created_date DESC 
        LIMIT $1 OFFSET $2
      `,
      values: [limit, offset],
    }

    const countQuery = {
      text: `SELECT COUNT(*) FROM blogoverview ${whereClause}`,
      values: [],
    }

    // 執行查詢
    const [countResult, blogsResult] = await Promise.all([
      pool.query(countQuery),
      pool.query(dataQuery),
    ])

    // 回傳結果
    res.json({
      blogs: blogsResult.rows,
      total: parseInt(countResult.rows[0].count),
    })
  } catch (error) {
    console.error('Blog list error:', error)
    console.error('Query details:', {
      message: error.message,
      code: error.code,
      query: error.query,
      parameters: error.parameters,
    })
    res.status(500).json({ message: '伺服器錯誤' })
  }
})
router.get('/blog-detail/:blog_id', async (req, res) => {
  try {
    // 添加 debug 日誌
    console.log(
      'Received blog_id:',
      req.params.blog_id,
      typeof req.params.blog_id
    )

    const query = {
      text: `
        SELECT b.* 
        FROM blogoverview b
        WHERE b.blog_valid_value = 1 
        AND b.blog_id = $1
      `,
      values: [Number(req.params.blog_id)], // 使用 Number() 而不是 parseInt
    }

    // 印出完整 query 資訊
    console.log('Executing query:', {
      text: query.text,
      values: query.values,
    })

    const result = await pool.query(query)

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: '找不到該文章',
      })
    }

    res.json({
      status: 'success',
      data: result.rows[0],
    })
  } catch (error) {
    // 更詳細的錯誤日誌
    console.error('Blog detail error:', {
      error: error.message,
      stack: error.stack,
      query: error.query,
      parameters: error.parameters,
    })

    res.status(500).json({
      status: 'error',
      message: '伺服器錯誤',
      detail: error.message, // 在開發環境中回傳詳細錯誤訊息
    })
  }
})

// 移除重複的路由，只保留這一個
router.post('/upload-blog-image', upload.single('upload'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        uploaded: 0,
        error: { message: '沒有接收到檔案' },
      })
    }

    const fileUrl = `/blog-images/${req.file.originalname}`

    res.json({
      uploaded: 1,
      fileName: req.file.originalname,
      url: fileUrl,
    })
  } catch (error) {
    console.error('Image upload error:', error)
    res.status(500).json({
      uploaded: 0,
      error: { message: '檔案上傳失敗' },
    })
  }
})

// 修改 blog-created 路由的 INSERT 語句
router.post('/blog-created', upload.single('blog_image'), async (req, res) => {
  try {
    if (!req.body.blog_title || !req.body.blog_content) {
      return res.status(400).json({
        status: 'error',
        message: '標題和內容為必填',
      })
    }

    const blog_image = req.file ? `/blog-images/${req.file.originalname}` : null

    const query = {
      text: `
        INSERT INTO blogoverview 
        (user_id, blog_type, blog_title, blog_content, 
         blog_brand, blog_brand_model, blog_keyword, 
         blog_valid_value, blog_created_date, blog_image)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING blog_id
      `,
      values: [
        req.body.user_id, // 移除 parseInt，因為 user_id 是 varchar
        req.body.blog_type,
        req.body.blog_title,
        req.body.blog_content,
        req.body.blog_brand || null,
        req.body.blog_brand_model || null,
        req.body.blog_keyword || null,
        req.body.blog_valid_value || 1,
        req.body.blog_created_date || new Date(),
        blog_image,
      ],
    }

    const result = await pool.query(query)

    res.json({
      status: 'success',
      message: '新增成功',
      blog_id: result.rows[0].blog_id,
      blog_image: blog_image,
    })
  } catch (error) {
    console.error('Blog creation error:', error)
    console.error('Full error details:', {
      params: req.body,
      imageFile: req.file,
    })
    res.status(500).json({
      status: 'error',
      message: error.message || '操作失敗',
    })
  }
})
// 修改後的編輯路由（只保留一個）
router.put(
  '/blog-edit/:blog_id',
  upload.single('blog_image'),
  async (req, res) => {
    try {
      const {
        user_id,
        blog_type,
        blog_title,
        blog_content,
        blog_brand,
        blog_brand_model,
        blog_keyword,
        originalImage,
      } = req.body

      // 圖片處理邏輯
      const blog_image = req.file
        ? `/blog-images/${req.file.originalname}`
        : originalImage

      const query = {
        text: `
        UPDATE blogoverview 
        SET user_id = $1, 
            blog_type = $2, 
            blog_title = $3, 
            blog_content = $4,
            blog_brand = $5,
            blog_brand_model = $6, 
            blog_keyword = $7,
            blog_image = $8,
            blog_created_date = NOW()
        WHERE blog_id = $9
        RETURNING *
      `,
        values: [
          user_id,
          blog_type,
          blog_title,
          blog_content,
          blog_brand || null,
          blog_brand_model || null,
          blog_keyword || null,
          blog_image,
          parseInt(req.params.blog_id),
        ],
      }

      const result = await pool.query(query)

      if (!result.rows[0]) {
        return res.status(404).json({
          status: 'error',
          message: '找不到要更新的部落格',
        })
      }

      res.json({
        status: 'success',
        message: '更新成功',
        blog_image: blog_image,
      })
    } catch (error) {
      console.error('Blog update error:', error)
      console.error('Query details:', {
        message: error.message,
        params: req.body,
        imageFile: req.file,
      })
      res.status(500).json({
        status: 'error',
        message: '更新失敗',
      })
    }
  }
)

// 軟刪除部落格
router.put('/blog-delete/:blog_id', async (req, res) => {
  try {
    const query = {
      text: `
        UPDATE blogoverview 
        SET blog_valid_value = 0 
        WHERE blog_id = $1::integer
        RETURNING *
      `,
      values: [parseInt(req.params.blog_id)],
    }

    const result = await pool.query(query)

    if (!result.rows[0]) {
      return res.status(404).json({
        status: 'error',
        message: '找不到要刪除的部落格',
      })
    }

    res.json({ status: 'success', message: '刪除成功' })
  } catch (error) {
    console.error('Blog deletion error:', error)
    console.error('Query details:', {
      message: error.message,
      code: error.code,
      parameters: error.parameters,
    })
    res.status(500).json({
      status: 'error',
      message: '刪除失敗',
    })
  }
})

// 使用者部落格概覽
router.get('/blog_user_overview/:user_id', async (req, res) => {
  try {
    console.log('接收到的用戶ID:', req.params.user_id)

    // 先確認用戶 ID 的格式
    if (!req.params.user_id) {
      return res.status(400).json({
        status: 'error',
        message: '需要用戶ID',
      })
    }

    const query = {
      text: `
        SELECT b.*, u.name as user_name 
        FROM blogoverview b
        JOIN users u ON b.user_id = $1 
        WHERE b.user_id = $1
        AND b.blog_valid_value = 1 
        ORDER BY b.blog_created_date DESC
      `,
      values: [req.params.user_id],
    }

    console.log('執行查詢:', query)
    const result = await pool.query(query)

    if (!result.rows?.length) {
      console.log('未找到部落格數據')
      return res.status(404).json({
        status: 'error',
        message: '找不到該用戶的部落格',
      })
    }

    console.log('查詢成功，返回行數:', result.rows.length)
    res.json({
      status: 'success',
      data: result.rows,
    })
  } catch (error) {
    console.error('Blog overview error:', error)
    res.status(500).json({
      status: 'error',
      message: '查詢失敗',
      detail: error.message,
    })
  }
})

router.get('/blog-comment/:blog_id', async (req, res) => {
  try {
    // 先打印接收到的參數，檢查類型
    console.log(
      'Received blog_id:',
      req.params.blog_id,
      typeof req.params.blog_id
    )

    const query = {
      text: `
        SELECT bc.*, users.name, users.image_path
        FROM blogcomment bc
        LEFT JOIN users ON bc.user_id = users.user_id::varchar
        WHERE bc.blog_id = $1::integer
        ORDER BY bc.blog_created_date ASC
      `,
      values: [req.params.blog_id],
    }

    console.log('Executing query:', query) // 打印查詢內容

    const result = await pool.query(query)

    console.log('Query result:', result.rows) // 打印查詢結果

    const processedComments = result.rows.map((comment) => {
      if (!comment.image_path) return comment

      if (
        comment.image_path.startsWith('data:image') ||
        comment.image_path.startsWith('http') ||
        comment.image_path.startsWith('/')
      ) {
        return comment
      }

      const imageType = comment.image_path.startsWith('/9j/') ? 'jpeg' : 'png'
      return {
        ...comment,
        image_path: `data:image/${imageType};base64,${comment.image_path}`,
      }
    })

    res.json({
      status: 'success',
      data: processedComments,
    })
  } catch (error) {
    // 更詳細的錯誤日誌
    console.error('完整錯誤訊息:', error)
    console.error('錯誤堆疊:', error.stack)
    console.error('查詢相關資訊:', {
      blogId: req.params.blog_id,
      message: error.message,
      code: error.code,
      position: error.position,
      detail: error.detail,
      hint: error.hint,
      parameters: error.parameters,
    })

    res.status(500).json({
      status: 'error',
      message: '查詢失敗',
      detail: error.message,
    })
  }
})

router.post('/blog-comment/:blog_id', async (req, res) => {
  try {
    console.log('Received blog_id:', req.params.blog_id)
    console.log('Received body:', req.body)

    const { user_id, blog_content, blog_created_date } = req.body
    const blog_id = parseInt(req.params.blog_id)

    // 新增評論
    const insertQuery = {
      text: `
        INSERT INTO blogcomment 
        (blog_id, user_id, blog_content, blog_created_date) 
        VALUES ($1, CAST($2 AS VARCHAR), $3, $4)
        RETURNING blog_comment_id
      `,
      values: [blog_id, user_id.toString(), blog_content, blog_created_date],
    }

    console.log('Executing insert query:', insertQuery)
    const result = await pool.query(insertQuery)

    // 獲取完整評論資訊
    const commentQuery = {
      text: `
        SELECT bc.*, users.name, users.image_path
        FROM blogcomment bc
        LEFT JOIN users ON CAST(bc.user_id AS VARCHAR) = CAST(users.user_id AS VARCHAR)
        WHERE bc.blog_comment_id = $1
      `,
      values: [result.rows[0].blog_comment_id],
    }

    const comment = await pool.query(commentQuery)

    if (!comment.rows[0]) {
      return res.status(404).json({
        status: 'error',
        message: '評論新增失敗',
      })
    }

    res.json({
      status: 'success',
      message: '評論新增成功',
      data: comment.rows[0],
    })
  } catch (error) {
    console.error('完整錯誤訊息:', error)
    console.error('查詢相關資訊:', {
      blogId: req.params.blog_id,
      body: req.body,
      message: error.message,
      code: error.code,
      position: error.position,
      detail: error.detail,
      hint: error.hint,
    })

    res.status(500).json({
      status: 'error',
      message: '新增評論失敗',
      detail: error.message,
    })
  }
})

// 添加錯誤處理中間件
router.use((error, req, res, next) => {
  console.error('Blog route error:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  })

  res.status(500).json({
    status: 'error',
    message: '伺服器錯誤',
    detail: process.env.NODE_ENV === 'development' ? error.message : undefined,
  })
})

export default router
