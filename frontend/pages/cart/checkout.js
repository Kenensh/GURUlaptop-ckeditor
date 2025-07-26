import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { useRouter } from 'next/router'
import Head from 'next/head'

// 定義常量
const BACKEND_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3005'
    : 'https://gurulaptop-ckeditor.onrender.com'

const isClient = typeof window !== 'undefined'
const MySwal = withReactContent(Swal)

export default function Checkout(props) {
  const router = useRouter()

  useEffect(() => {
    if (!isClient || !router.isReady) return

    const { ID } = router.query

    if (ID) {
      handleUpdate(ID)
      MySwal.fire({
        icon: 'success',
        title: `訂單編號: ${ID}已付款成功`,
        showConfirmButton: false,
        timer: 3000,
      })

      // 使用 router.push 替代 window.location
      const timer = setTimeout(() => {
        router.push('/dashboard')
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [router.isReady, router.query])

  const handleUpdate = async (order_id) => {
    try {
      const result = await fetch(`${BACKEND_URL}/api/order`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: order_id,
        }),
      })

      const data = await result.json()
      if (data.status === 'success') {
        console.log('update success')
      }
    } catch (error) {
      console.error('更新訂單狀態失敗:', error)
    }
  }

  return (
    <>
      <Head>
        <title>結帳確認</title>
      </Head>

      <div className="vh-100">
        <Link href="/dashboard">
          <div className={`btn btn-primary`}>回到會員中心</div>
        </Link>
      </div>

      <style jsx>{`
        .vh-100 {
          height: 90vh;
        }
      `}</style>
    </>
  )
}
