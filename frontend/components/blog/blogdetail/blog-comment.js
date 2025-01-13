import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/hooks/use-auth'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
const isClient = typeof window !== 'undefined'
const MySwal = withReactContent(Swal)

export default function BlogComment({ blog_id }) {
  const [blogComment, setBlogComment] = useState([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const { auth } = useAuth()
  const { userData, isAuth } = auth || {}
  const user_id = userData?.user_id

  function getTimestamp() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }

  // 獲取評論
  useEffect(() => {
    if (blog_id) {
      setIsLoading(true)
      fetch(`http://localhost:3005/api/blog/blog-comment/${blog_id}`)
        .then((response) => response.json())
        .then((data) => {
          console.log('評論資料:', data)
          if (data.status === 'success' && Array.isArray(data.data)) {
            setBlogComment(data.data)
          } else {
            setBlogComment([])
          }
        })
        .catch((error) => {
          console.error('獲取評論失敗:', error)
          setBlogComment([])
        })
        .finally(() => setIsLoading(false))
    }
  }, [blog_id])

  // 提交評論
  const handleSubmit = async () => {
    if (!newComment.trim()) {
      MySwal.fire({
        icon: 'warning',
        title: '請輸入留言內容',
        showConfirmButton: false,
        timer: 1500,
      })
      return
    }

    if (!isAuth) {
      MySwal.fire({
        icon: 'warning',
        title: '請先登入',
        showConfirmButton: false,
        timer: 1500,
      })
      return
    }

    const commentData = {
      user_id,
      blog_content: newComment,
      blog_created_date: getTimestamp(),
    }

    try {
      const response = await fetch(
        `http://localhost:3005/api/blog/blog-comment/${blog_id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(commentData),
        }
      )

      const result = await response.json()

      if (response.ok && result.status === 'success') {
        setBlogComment((prevComments) => [...prevComments, result.data])
        setNewComment('')
        if (isClient) {
          MySwal.fire({
            icon: 'success',
            title: '留言新增成功',
            showConfirmButton: false,
            timer: 1500,
          })
        }
      } else {
        throw new Error(result.message || '留言新增失敗')
      }
    } catch (error) {
      console.error('留言新增錯誤:', error)
      MySwal.fire({
        icon: 'error',
        title: error.message || '留言新增失敗',
        showConfirmButton: false,
        timer: 1500,
      })
    }
  }

  if (isLoading) return <div>載入評論中...</div>

  return (
    <>
      {blogComment.length > 0 ? (
        blogComment.map((comment, index) => (
          <div
            key={comment.blog_comment_id}
            className="mb-5 BlogDetailComment container"
          >
            <div className="m-4">
              <p>#{index + 1}</p>
              <hr />
              <div className="w-100 h-50 d-flex flex-row align-items-start justify-content-between">
                <div className="overflow-hidden BlogDetailCommentImg">
                  <img
                    className="w-100 h-100 object-fit-cover"
                    src={
                      comment.image_path ||
                      'https://th.bing.com/th/id/R.88c444f63f40cfa9b49801f826befa80?rik=QAme0H3xbxieEQ&pid=ImgRaw&r=0'
                    }
                    alt={comment.name || '匿名用戶'}
                  />
                </div>
                <p>於 {comment.blog_created_date} 留言</p>
              </div>
              <div className="w-100 h-100 mt-5 mb-5">
                {comment.blog_content}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center">暫無評論</div>
      )}

      {isAuth && (
        <div className="mb-5 BlogDetailComment container">
          <div className="m-5">
            <p className="fs-5">新增你的留言，留下你的寶貴意見！</p>
            <hr />
            <textarea
              className="w-100 h-200"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
          </div>
          <button
            className="BlogEditButtonDelete Comment ms-5 mb-5"
            type="button"
            onClick={handleSubmit}
          >
            送出
          </button>
        </div>
      )}
    </>
  )
}
