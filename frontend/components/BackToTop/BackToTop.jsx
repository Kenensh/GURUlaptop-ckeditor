import { useEffect, useState } from 'react'
import styles from '@/styles/BackToTop.module.css'

const isClient = typeof window !== 'undefined'

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false)

  // 處理滾動監聽
  useEffect(() => {
    if (!isClient) return

    const handleScroll = () => {
      // 獲取滾動容器
      const mainBody = document.querySelector('.main-body')
      if (!mainBody) return

      // 使用容器的 scrollTop 而不是 window.scrollY
      const scrollTop = mainBody.scrollTop || 0
      setIsVisible(scrollTop > 300)
    }

    // 找到正確的滾動容器並添加監聽器
    const mainBody = document.querySelector('.main-body')
    if (mainBody) {
      mainBody.addEventListener('scroll', handleScroll)

      // 清理函數
      return () => {
        mainBody.removeEventListener('scroll', handleScroll)
      }
    }
  }, [])

  // 處理滾動到頂部
  const scrollToTop = () => {
    if (!isClient) return

    const mainBody = document.querySelector('.main-body')
    if (mainBody) {
      mainBody.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    }
  }

  // 只在客戶端渲染按鈕
  if (!isClient) {
    return null
  }

  return (
    <button
      onClick={scrollToTop}
      className={`${styles.backToTop} ${isVisible ? styles.show : ''}`}
      aria-label="回到頂部"
    >
      ↑
    </button>
  )
}

export default BackToTop
