import React, { useState, useEffect } from 'react'
import styles from '@/styles/product-card-white.module.scss'
import Image from 'next/image'
import { useAuth } from '@/hooks/use-auth'
import Swal from 'sweetalert2'
import { useRouter } from 'next/router'

export default function ProductCardWhite({ onSendMessage, product_id }) {
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
          `http://localhost:3005/api/favorites/${userData.user_id}/${product_id}`
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
            `http://localhost:3005/api/products/card/${product_id}`
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
          onSendMessage?.('載入產品資訊失敗', 'error')
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
      onSendMessage?.('取消比較！', 'success')
      setIsCompared(false)
    } else {
      if (compareProduct.length >= 2) {
        onSendMessage?.('比較清單已滿！', 'error')
        return
      }
      compareProduct.push(productID)
      localStorage.setItem('compareProduct', compareProduct.join(','))
      onSendMessage?.('加入比較！', 'success')
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
      onSendMessage?.('發生錯誤，請重新登入', 'error')
      return
    }

    try {
      if (isChecked) {
        // 取消收藏
        const response = await fetch(
          `http://localhost:3005/api/favorites/${userData.user_id}/${product_id}`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )

        if (response.ok) {
          onSendMessage?.('取消收藏！', 'success')
          setIsChecked(false)
        } else {
          throw new Error('取消收藏失敗')
        }
      } else {
        // 添加收藏
        const response = await fetch(
          `http://localhost:3005/api/favorites/${userData.user_id}/${product_id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )

        if (response.ok) {
          onSendMessage?.('收藏成功！', 'success')
          setIsChecked(true)
        } else {
          throw new Error('收藏失敗')
        }
      }
    } catch (error) {
      console.error('收藏操作失敗:', error)
      onSendMessage?.(error.message || '收藏操作失敗', 'error')
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
      onSendMessage?.('發生錯誤，請重新登入', 'error')
      return
    }

    try {
      const response = await fetch(`http://localhost:3005/api/cart/add`, {
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
        onSendMessage?.('加入購物車成功！', 'success')
      } else {
        throw new Error(result.message || '加入購物車失敗')
      }
    } catch (error) {
      console.error('加入購物車失敗:', error)
      onSendMessage?.(error.message || '加入購物車失敗，請稍後再試', 'error')
    }
  }

  // 前往產品頁面
  const goToProductPage = () => {
    if (product_id) {
      router.push(`/product/${product_id}`)
    }
  }

  return (
    <div className={styles.product_card}>
      <div className={styles.product_card_img}>
        <input
          type="checkbox"
          id={`productCompareCheck_${key}`}
          onChange={toggleCompare}
          checked={isCompared}
          className={styles.product_compare_checkbox}
        />
        <label
          htmlFor={`productCompareCheck_${key}`}
          className={styles.product_compare_label}
        >
          {''}
        </label>
        <span className={styles.product_compare_text}>比較</span>
        <Image
          src={
            data?.product_img_path
              ? `/product/${data.product_img_path}`
              : '/images/product/placeholder.avif'
          }
          alt={data?.product_name || "Product"}
          width={200}
          height={200}
        />
      </div>
      <div className={styles.product_card_content}>
        <div className={`${styles.product_text} `}>
          <div className={styles.product_ellipsis}>
            {data ? data.product_name : 'Loading...'}
          </div>
          <div className={styles.product_ellipsis}>
            {data?.model || ''}
          </div>
        </div>
        <div className={styles.product_icons}>
          <input
            type="checkbox"
            id={`heartCheckbox_${key}`}  // 修正 ID 避免衝突
            checked={isChecked}
            onChange={toggleHeart}
            className={styles.product_collection_checkbox}
          />
          <svg
            className={styles.product_collection_icon}
            onClick={toggleHeart}
            width={20}
            height={20}
            viewBox="0 0 32 30"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M16.0102 4.82806C19.0093 1.32194 24.0104 0.378798 27.768 3.58936C31.5255 6.79991 32.0545 12.1679 29.1037 15.965C26.6503 19.122 19.2253 25.7805 16.7918 27.9356C16.5196 28.1768 16.3834 28.2972 16.2247 28.3446C16.0861 28.386 15.9344 28.386 15.7958 28.3446C15.6371 28.2972 15.5009 28.1768 15.2287 27.9356C12.7952 25.7805 5.37022 19.122 2.91682 15.965C-0.0339811 12.1679 0.430418 6.76615 4.25257 3.58936C8.07473 0.412578 13.0112 1.32194 16.0102 4.82806Z"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <Image
            onClick={addToCart}
            src="/images/product/cart.svg"
            alt="cart"
            width={20}
            height={20}
            style={{ cursor: 'pointer' }}
          />
        </div>
      </div>
      <div className={styles.price_button}>
        <span className={styles.price}>
          {data
            ? `NT ${new Intl.NumberFormat('zh-TW').format(data.list_price)}元`
            : 'NT$ -'}
        </span>
        <span
          onClick={goToProductPage}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              goToProductPage()
            }
          }}
          role="button"
          tabIndex={0}
          className={styles.arrow}
          style={{ cursor: 'pointer' }}
        >
          →
        </span>
      </div>
    </div>
  )
}
