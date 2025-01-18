import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { IoArrowBackCircleOutline } from 'react-icons/io5'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDiamond } from '@fortawesome/free-solid-svg-icons'

// Components
import BlogDetailMainArea from '@/components/blog/bloghomepage/articlehomepage-mainarea'
import BlogComment from '@/components/blog/blogdetail/blog-comment'
import BloghomepageCardgroup from '@/components/blog/bloghomepage/bloghomepage-cardgroup'
import Header from '@/components/layout/default-layout/header'
import MyFooter from '@/components/layout/default-layout/my-footer'

// 定義常量
const BACKEND_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3005'
    : 'https://gurulaptop-ckeditor.onrender.com'

export default function BlogDetail() {
  const router = useRouter()
  const { blog_id } = router.query
  const [blogData, setBlogData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!blog_id) return

    const fetchBlogDetail = async () => {
      try {
        const res = await fetch(
          `${BACKEND_URL}/api/blog/blog-detail/${blog_id}`,
          {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          }
        )

        if (!res.ok) {
          const errorText = await res.text()
          console.error('Error response:', {
            status: res.status,
            statusText: res.statusText,
            errorText,
          })
          throw new Error(`HTTP error! status: ${res.status}`)
        }

        const data = await res.json()
        if (data.data) {
          setBlogData(data.data)
        } else {
          console.warn('No blog data in response')
          setError('文章不存在')
        }
      } catch (err) {
        console.error('Blog detail fetch error:', err)
        setError('載入文章時發生錯誤')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBlogDetail()
  }, [blog_id])

  if (isLoading) return <div className="container mt-5">載入中...</div>
  if (error) return <div className="container mt-5 text-danger">{error}</div>
  if (!blogData) return <div className="container mt-5">找不到文章</div>

  return (
    <>
      <Header />
      <BlogDetailMainArea />

      <div className="container">
        <div className="mt-5 mb-5">
          <Link href="/blog" className="text-decoration-none">
            <p className="fs-5 fw-bold">
              <IoArrowBackCircleOutline /> 返回部落格首頁搜尋！
            </p>
          </Link>
        </div>
      </div>

      <section className="container BlogDetailSectionContentArea mt-5">
        <div className="d-flex flex-column">
          <div>
            <p className="fs-5 fw-bold text-break BlogDetailSectionContentAreaTitle">
              {blogData.blog_title}
            </p>
          </div>

          {blogData.blog_image && (
            <div className="d-flex align-items-center justify-content-center">
              <img
                className="w-25 h-25 ratio mb-5"
                src={`${BACKEND_URL}${blogData.blog_image}`}
                alt={blogData.blog_title}
              />
            </div>
          )}

          <div className="d-flex flex-column gap-5">
            <div
              className="fs-5 BlogDetailText text-break"
              dangerouslySetInnerHTML={{ __html: blogData.blog_content }}
            />
          </div>
        </div>
      </section>

      <BlogComment blog_id={blog_id} />

      <div className="container ArticleSmallTitle text-nowrap">
        <p>
          <FontAwesomeIcon icon={faDiamond} className="me-4" />
          <span>更多熱門文章</span>
        </p>
      </div>

      <BloghomepageCardgroup />

      <div className="mb-5"></div>
      <MyFooter />
    </>
  )
}

BlogDetail.getLayout = (page) => page
