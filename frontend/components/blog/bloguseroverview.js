import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'

export default function BlogUserOverview({ specificUserId = null }) {
  const { auth } = useAuth()
  const { isAuth, userData } = auth
  const [blogData, setBlogData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchBlogData = async () => {
      console.log('開始獲取部落格數據，狀態:', {
        isAuth,
        userData,
        specificUserId,
      })

      if (!isAuth) {
        console.log('用戶未登入')
        setIsLoading(false)
        return
      }

      const targetUserId = specificUserId || userData?.user_id
      console.log('目標用戶ID:', targetUserId)

      if (!targetUserId) {
        console.log('無有效用戶ID')
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(
          `http://localhost:3005/api/blog/blog_user_overview/${targetUserId}`
        )
        console.log('API回應狀態:', response.status)

        const data = await response.json()
        console.log('API回應數據:', data)

        if (!response.ok) {
          throw new Error(data.message || '資料載入失敗')
        }

        if (data.status === 'success' && Array.isArray(data.data)) {
          setBlogData(data.data)
        } else {
          setBlogData([])
        }
      } catch (err) {
        console.error('獲取數據錯誤:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBlogData()
  }, [isAuth, userData, specificUserId])

  // 處理內容和圖片的函數
  const processContent = (content) => {
    if (!content) {
      console.log('內容為空')
      return ''
    }
    const processedContent = content
      .replace(/<[^>]+>/g, '')
      .trim()
      .substring(0, 100)
    console.log('處理後的內容長度:', processedContent.length)
    return processedContent + (content.length > 100 ? '...' : '')
  }

  // 處理圖片 URL 的函數
  const getImageUrl = (imagePath) => {
    console.log('處理圖片路徑:', imagePath)
    const defaultImage =
      'https://th.bing.com/th/id/OIP.V5ThX7OGGxexxzFbYvHtBwHaFJ?rs=1&pid=ImgDetMain'

    if (!imagePath) {
      console.log('使用預設圖片')
      return defaultImage
    }

    const finalUrl = imagePath.startsWith('http')
      ? imagePath
      : `http://localhost:3005${imagePath}`
    console.log('最終圖片URL:', finalUrl)
    return finalUrl
  }

  // 格式化日期
  const formatDate = (dateString) => {
    console.log('格式化日期:', dateString)
    if (!dateString) return ''

    try {
      const date = new Date(dateString)
      const formattedDate = new Intl.DateTimeFormat('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date)
      console.log('格式化後的日期:', formattedDate)
      return formattedDate
    } catch (err) {
      console.error('日期格式化錯誤:', err)
      return dateString
    }
  }

  // 檢查是否有部落格資料
  const hasData = blogData && blogData.length > 0
  console.log('數據狀態:', {
    hasData,
    blogDataLength: blogData.length,
    isLoading,
    error,
  })

  if (!isAuth) return null
  if (isLoading) return <div className="text-center">載入中...</div>
  if (error) return <div className="text-center text-danger">{error}</div>

  return !hasData ? (
    <div className="container text-center mt-5">
      <p className="fs-4">沒有部落格，新增一下！</p>
      <Link href="/blog/blog-created">
        <button className="BlogEditButtonSubmit mt-3">立即新增部落格</button>
      </Link>
    </div>
  ) : (
    // 如果有資料，顯示部落格列表
    <div className="container d-flex flex-column gap-5">
      {blogData.map((blog) => (
        <Link
          key={blog.blog_id}
          href={`/blog/blog-user-detail/${blog.blog_id}`}
          style={{ textDecoration: 'none', cursor: 'pointer' }}
        >
          <div className="card d-flex flex-row BlogUserOverviewCard">
            <img
              src={
                `http://localhost:3005${blog.blog_image}` ||
                'https://th.bing.com/th/id/OIP.V5ThX7OGGxexxzFbYvHtBwHaFJ?rs=1&pid=ImgDetMain'
              }
              className="card-img-top w-25 h-100 object-fit-cover BlogUserOverviewCardImg"
              alt="blog"
            />
            <div className="card-body w-75 h-100">
              <div className="BlogUserOverviewCardBodyContent m-3">
                <div className="d-flex row">
                  <p className="BlogUserOverviewCardTitle">{blog.blog_title}</p>
                  <h7 className="card-text mb-4 BlogUserOverviewCardContent">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: processContent(blog.blog_content),
                      }}
                    />
                  </h7>
                </div>
                <div
                  style={{ width: '60%' }}
                  className="d-flex justify-content-between pe-5"
                >
                  <p className="card-text BlogUserOverviewCardType">
                    版主：{blog.user_name}&nbsp;
                  </p>
                </div>
                <div className="d-flex justify-content-between pe-5 mt-3">
                  <p>{blog.blog_type}</p>
                  <p>{blog.blog_created_date}</p>
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
