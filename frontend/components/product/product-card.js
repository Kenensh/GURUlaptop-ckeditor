import React, { useState, useEffect } from 'react'
import styles from '@/styles/product-card.module.scss'
import Image from 'next/image'
import { useAuth } from '@/hooks/use-auth'
import Swal from 'sweetalert2'
import { useRouter } from 'next/router'

// 定義常量
const BACKEND_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3005'
    : 'https://gurulaptop-ckeditor.onrender.com'

export default function ProductCard({ onSendMessage, product_id }) {
  // 產品卡片的 key 值，用於比較功能的 checkbox
  const key = Math.random()
  // 從後端撈取資料
  const [data, setData] = useState(null)
  const router = useRouter()

  const { auth } = useAuth() // 獲取 auth 對象
  const isAuth = auth?.isAuth || false // 安全地獲取 isAuth
  const userData = auth?.userData || {} // 安全地獲取 userData

  const [isChecked, setIsChecked] = useState(false) // 用來控制 checkbox 狀態
  const [isCompared, setIsCompared] = useState(false) // 比較按鈕的狀態

  // 初始化收藏狀態
  const checkFavoriteStatus = async () => {
    if (isAuth && userData?.user_id && product_id) {
      try {
        const response = await fetch(
          `${BACKEND_URL}/api/favorites/${userData.user_id}/${product_id}`
        )
        const result = await response.json()
        if (result.status === 'success') {
          setIsChecked(true)
        }
      } catch (error) {
        console.error('檢查收藏狀態失敗:', error)
      }
    }
  }

  // 初始化比較狀態
  const checkCompareStatus = () => {
    const compareProduct = localStorage.getItem('compareProduct')
    if (compareProduct && product_id) {
      const compareIds = compareProduct.split(',')
      if (compareIds.includes(String(product_id))) {
        setIsCompared(true)
      }
    }
  }

  // 初始化
  useEffect(() => {
    checkFavoriteStatus()
    checkCompareStatus()
  }, [isAuth, userData?.user_id, product_id]) // 修改依賴項，確保在登入狀態改變時重新檢查

  // 加載產品資料
  useEffect(() => {
    async function fetchProduct() {
      if (product_id) {
        try {
          const response = await fetch(
            `${BACKEND_URL}/api/products/card/${product_id}`
          )
          if (!response.ok) {
            throw new Error('獲取產品資料失敗')
          }
          const result = await response.json()
          if (result?.data?.product) {
            setData(result.data.product)
          }
        } catch (error) {
          console.error('Error fetching data', error)
          onSendMessage('載入產品資訊失敗', 'error')
        }
      }
    }
    fetchProduct()
  }, [product_id, onSendMessage])

  // 比較功能
  const toggleCompare = () => {
    if (!product_id) return

    const productID = String(product_id)
    let compareProduct = localStorage.getItem('compareProduct')
      ? localStorage.getItem('compareProduct').split(',')
      : []

    if (isCompared) {
      compareProduct = compareProduct.filter((id) => id !== productID)
      localStorage.setItem('compareProduct', compareProduct.join(','))
      onSendMessage('取消比較！', 'success')
      setIsCompared(false)
    } else {
      if (compareProduct.length >= 2) {
        onSendMessage('比較清單已滿！', 'error')
        return
      }
      compareProduct.push(productID)
      localStorage.setItem('compareProduct', compareProduct.join(','))
      onSendMessage('加入比較！', 'success')
      setIsCompared(true)
    }
  }

  // 收藏功能
  const toggleHeart = async () => {
    if (!isAuth) {
      // 使用 SweetAlert 提示用戶登入
      Swal.fire({
        title: '需要登入',
        text: '請先登入以使用收藏功能',
        icon: 'info',
        confirmButtonText: '前往登入',
        showCancelButton: true,
        cancelButtonText: '取消',
      }).then((result) => {
        if (result.isConfirmed) {
          router.push('/member/login')
        }
      })
      return
    }

    if (!userData?.user_id || !product_id) {
      onSendMessage('發生錯誤，請重新登入', 'error')
      return
    }

    try {
      if (isChecked) {
        // 取消收藏
        const response = await fetch(
          `${BACKEND_URL}/api/favorites/${userData.user_id}/${product_id}`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )

        if (response.ok) {
          onSendMessage('取消收藏！', 'success')
          setIsChecked(false)
        } else {
          throw new Error('取消收藏失敗')
        }
      } else {
        // 添加收藏
        const response = await fetch(
          `${BACKEND_URL}/api/favorites/${userData.user_id}/${product_id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )

        if (response.ok) {
          onSendMessage('收藏成功！', 'success')
          setIsChecked(true)
        } else {
          throw new Error('收藏失敗')
        }
      }
    } catch (error) {
      console.error('收藏操作失敗:', error)
      onSendMessage(error.message || '收藏操作失敗', 'error')
    }
  }

  // 加入購物車
  const addToCart = async () => {
    if (!isAuth) {
      Swal.fire({
        title: '需要登入',
        text: '請先登入以使用購物車功能',
        icon: 'info',
        confirmButtonText: '前往登入',
        showCancelButton: true,
        cancelButtonText: '取消',
      }).then((result) => {
        if (result.isConfirmed) {
          router.push('/member/login')
        }
      })
      return
    }

    if (!userData?.user_id || !product_id) {
      onSendMessage('發生錯誤，請重新登入', 'error')
      return
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/cart/add`, {
        method: 'PUT',
        body: JSON.stringify({
          user_id: userData.user_id,
          product_id: product_id,
          quantity: 1,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        throw new Error('加入購物車請求失敗')
      }
      const result = await response.json()
      if (result.status === 'success') {
        onSendMessage('加入購物車成功！', 'success')
      } else {
        throw new Error(result.message || '加入購物車失敗')
      }
    } catch (error) {
      console.error('加入購物車失敗:', error)
      onSendMessage(error.message || '加入購物車失敗，請稍後再試', 'error')
    }
  }

  // 前往產品頁面
  const goToProductPage = () => {
    if
