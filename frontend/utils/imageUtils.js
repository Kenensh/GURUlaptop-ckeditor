// 定義動態後端 URL
const BACKEND_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3005'
    : 'https://gurulaptop-ckeditor.onrender.com'

export const getGroupImage = (imagePath) => {
  if (!imagePath || imagePath.trim() === '') {
    return `${BACKEND_URL}/uploads/groups/group-default.png`
  }

  // 如果已經是完整的 URL，直接返回
  if (imagePath.startsWith('http')) {
    return imagePath
  }

  // 確保路徑正確
  return `${BACKEND_URL}${imagePath}`
}
