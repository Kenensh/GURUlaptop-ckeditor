import express from 'express'
import multer from 'multer'
const router = express.Router()
const upload = multer()

// 路由測試
// 路由測試
// 路由測試
// 很重要所以重複很多遍  (檔名) http://localhost:3005/api/article/apple
// 完整的路由：http://localhost:3005/api/article (檔名)(檔名)(檔名)(檔名)(檔名)(檔名)(檔名) /apple
// 完整的路由：http://localhost:3005/api/article (檔名)(檔名)(檔名)(檔名)(檔名)(檔名)(檔名) /apple
// 完整的路由：http://localhost:3005/api/article (檔名)(檔名)(檔名)(檔名)(檔名)(檔名)(檔名) /apple
// 完整的路由：http://localhost:3005/api/article (檔名)(檔名)(檔名)(檔名)(檔名)(檔名)(檔名) /apple
// 完整的路由：http://localhost:3005/api/article (檔名)(檔名)(檔名)(檔名)(檔名)(檔名)(檔名) /apple
// 完整的路由：http://localhost:3005/api/article (檔名)(檔名)(檔名)(檔名)(檔名)(檔名)(檔名) /apple
// 完整的路由：http://localhost:3005/api/article (檔名)(檔名)(檔名)(檔名)(檔名)(檔名)(檔名) /apple
// 完整的路由：http://localhost:3005/api/article (檔名)(檔名)(檔名)(檔名)(檔名)(檔名)(檔名) /apple

// 所以現在改檔名完整路由就是
//http://localhost:3005/api/articleappletest/apple
// 不信用 postman 測試看看
// 不信用 postman 測試看看
// 不信用 postman 測試看看
// 不信用 postman 測試看看
// 不信用 postman 測試看看
// 不信用 postman 測試看看
router.get('/apple', upload.none(), (req, res) => {
  console.log('I am Ken')
  res.status(200).send('OK')
})

export default router
