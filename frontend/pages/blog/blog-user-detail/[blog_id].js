import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import BlogDetailMainArea from '@/components/blog/bloghomepage/articlehomepage-mainarea'
import Link from 'next/link'
import { IoArrowBackCircleOutline } from 'react-icons/io5'
import { useAuth } from '@/hooks/use-auth'
import Header from '@/components/layout/default-layout/header'
import MyFooter from '@/components/layout/default-layout/my-footer'
import Head from 'next/head'
import Swal from 'sweetalert2'

export default function BlogUserDetail() {
  const router = useRouter()
  const { blog_id } = router.query
  const [blogData, setBlogData] = useState(null)
  const { auth } = useAuth()
  const isAuth = auth?.isAuth || false
  const userData = auth?.userData || {}
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 等待路由參數加載完成
    if (!blog_id) {
      return
    }

    // 認證檢查 - 加強檢查邏輯以防止錯誤
    if (!isAuth || !userData?.user_id) {
      Swal.fire({
        icon: 'warning',
        title: '請先登入',
        text: '需要登入才能查看此頁面',
      }).then(() => {
        router.push('/blog')
      })
      return
    }

    setIsLoading(true)
    fetch(`http://localhost:3005/api/blog/blog-user-detail/${blog_id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        if (!data.data) {
          throw new Error('找不到部落格資料')
        }

        const blogUserId = String(data.data.user_id || '')
        const currentUserId = String(userData.user_id || '')

        if (blogUserId !== currentUserId) {
          throw new Error('無權限訪問此部落格')
        }

        setBlogData(data.data)
        setIsLoading(false)
      })
      .catch((error) => {
        console.error('Error:', error)
        Swal.fire({
          icon: 'error',
          title: '發生錯誤',
          text: error.message || '無法載入部落格資料',
        }).then(() => {
          router.push('/blog')
        })
      })
  }, [blog_id, isAuth, userData?.user_id, router])

  // 顯示載入狀態
  if (isLoading || !blogData) {
    return (
      <>
        <Header />
        <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>編輯{blogData.blog_title || '部落格'}</title>
      </Head>
      <Header />
      <BlogDetailMainArea />
      <div className="container">
        <div className="mt-5 mb-5">
          <Link href="/dashboard" className="text-decoration-none fs-5">
            <p className="fs-5 fw-bold">
              <IoArrowBackCircleOutline /> 返回使用者總覽
            </p>
          </Link>
        </div>
      </div>
      <div className="d-flex align-items-center justify-content-center mb-5">
        <img
          className="w-50 h-100 ratio"
          src={`http://localhost:3005${blogData.blog_image}`}
          alt={blogData.blog_title || '部落格圖片'}
          onError={(e) => {
            e.target.onerror = null
            e.target.src = '/default-blog-image.jpg'
          }}
        />
      </div>
      <section className="container BlogDetailSectionContentArea mt-5">
        <div className="d-flex flex-column">
          <div>
            <p className="mb-5 mt-5 fs-5 fw-bold BlogDetailSectionContentAreaTitle text-break">
              {blogData.blog_title || '無標題'}
            </p>
          </div>
        </div>
        <div className="">
          <div className="mb-5 mt-5 d-flex flex-column gap-5 ">
            <p className="fs-5 BlogDetailText text-break">
              <div
                dangerouslySetInnerHTML={{
                  __html: blogData.blog_content || '無內容',
                }}
              />
            </p>
          </div>
        </div>

        <div className="">
          <div className="d-flex  mb-5 gap-xxl-5  gap-xl-5 gap-lg-4 gap-md-3 gap-sm-2 gap-xs-2 gap-1">
            <Link href={`/blog/blog-detail/${blog_id}`}>
              <button className="BlogEditButtonSubmit shadow" type="button">
                前往部落格頁面
              </button>
            </Link>
            <Link href={`/blog/blog-user-edit/${blog_id}`}>
              <button className="BlogEditButtonDelete shadow" type="button">
                前往編輯！
              </button>
            </Link>
          </div>
        </div>
      </section>
      <MyFooter />
    </>
  )
}
BlogUserDetail.getLayout = (page) => page
